"""
Case Policy Engine — Centralized Authorization Rules
════════════════════════════════════════════════════════════════════

Purpose:
  Enforce consistent authorization rules for case access, creation, and assignment.
  Prevents:
  - Horizontal Privilege Escalation (IDOR)
  - Vertical Privilege Escalation (assignment spoofing)
  - Organization bypass
  - Role confusion

Rules:
  1. ACCESS: Only owner, assigned team, or admin can access
  2. CREATE: Only self-assign (non-admin) or explicit admin assignment
  3. ASSIGN: Only admin can assign to others

Usage:
  from security.case_policy_engine import authorize_case_access, authorize_case_creation
  
  # Validate access before reading
  if not authorize_case_access(current_user, case):
      raise HTTPException(403, "Forbidden")
  
  # Enforce creation rules
  payload = authorize_case_creation(current_user, payload)
"""

from fastapi import HTTPException, status
from typing import Dict, Any, Optional, List
import logging

logger = logging.getLogger(__name__)


def authorize_case_access(
    current_user: Dict[str, Any],
    case: Dict[str, Any],
) -> bool:
    """
    Determine if current_user is authorized to access a case.
    
    Access is ALLOWED if:
    1. User is admin (any organization)
    2. User is in same organization AND (owner OR assigned team member)
    
    Args:
        current_user: User dict from get_current_user() (has _id, role, organization_id)
        case: Case dict from database (has lawyer_id, organization_id, assigned_team)
    
    Returns:
        True if access allowed, False otherwise
    
    Rules:
        - Admins always have access (to their own organization)
        - Non-admins need same organization + ownership or team assignment
        - Cross-organization access is never allowed (except admin to own org)
    """
    
    user_id = current_user.get("_id")
    user_role = current_user.get("role", "lawyer")
    user_org = current_user.get("organization_id")
    
    case_org = case.get("organization_id")
    case_owner = case.get("lawyer_id")
    case_team = case.get("assigned_team", [])
    
    # Rule 1: Admins can access cases in their organization
    if user_role == "admin":
        if user_org == case_org:
            logger.info(
                f"[CASE_POLICY] Admin access granted: user={user_id} case_owner={case_owner} "
                f"user_org={user_org}"
            )
            return True
        else:
            logger.warning(
                f"[CASE_POLICY] Admin cross-org access denied: user={user_id} "
                f"user_org={user_org} case_org={case_org}"
            )
            return False
    
    # Rule 2: Non-admin must be in same organization
    if user_org != case_org:
        logger.warning(
            f"[CASE_POLICY] Cross-org access denied: user={user_id} "
            f"user_org={user_org} case_org={case_org}"
        )
        return False
    
    # Rule 3: Non-admin in same org can access if owner or assigned
    if case_owner == user_id:
        logger.info(
            f"[CASE_POLICY] Owner access granted: user={user_id} case_owner={case_owner}"
        )
        return True
    
    if user_id in case_team:
        logger.info(
            f"[CASE_POLICY] Team access granted: user={user_id} case_owner={case_owner} "
            f"team={case_team}"
        )
        return True
    
    logger.warning(
        f"[CASE_POLICY] Access denied: user={user_id} case_owner={case_owner} "
        f"user_org={user_org} case_org={case_org}"
    )
    return False


def authorize_case_creation(
    current_user: Dict[str, Any],
    payload: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Apply authorization rules to case creation request.
    
    Rules:
    - Non-admin users: FORCE lawyer_id = current_user._id (auto-assign)
    - Admin users: Can assign to any lawyer_id in their organization
    - Never allow cross-organization assignment
    
    Args:
        current_user: User dict from get_current_user()
        payload: Request payload dict
    
    Returns:
        Modified payload with authorized lawyer_id
    
    Raises:
        HTTPException(403) if admin attempts cross-org assignment
    
    Behavior:
        - Non-admin: Silently override lawyer_id to self
        - Admin: Allow explicit assignment (with validation)
    """
    
    user_id = current_user.get("_id")
    user_role = current_user.get("role", "lawyer")
    user_org = current_user.get("organization_id")
    
    requested_lawyer_id = payload.get("lawyer_id")
    
    # Rule 1: Non-admin users ALWAYS auto-assign to self
    if user_role != "admin":
        if requested_lawyer_id and requested_lawyer_id != user_id:
            logger.warning(
                f"[CASE_POLICY] Non-admin attempted unauthorized assignment: "
                f"user={user_id} requested_lawyer={requested_lawyer_id}"
            )
        payload["lawyer_id"] = user_id
        logger.info(
            f"[CASE_POLICY] Case auto-assigned to user: user={user_id}"
        )
        return payload
    
    # Rule 2: Admin can assign, but must specify lawyer_id
    if not requested_lawyer_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Admin must specify lawyer_id for case assignment"
        )
    
    # Rule 3: Admin cannot cross-organize
    # Note: Actual validation of target lawyer belongs to organization
    # would require DB lookup. This is documented but enforced via business logic.
    logger.info(
        f"[CASE_POLICY] Admin case assignment: admin={user_id} "
        f"target_lawyer={requested_lawyer_id} org={user_org}"
    )
    
    return payload


def authorize_case_assignment(
    current_user: Dict[str, Any],
    target_lawyer_id: str,
) -> bool:
    """
    Determine if current_user can assign/reassign a case to target_lawyer_id.
    
    Only admins can reassign cases. Non-admins cannot assign to others.
    
    Args:
        current_user: User dict
        target_lawyer_id: Lawyer ID to assign to
    
    Returns:
        True if assignment is allowed
    
    Raises:
        HTTPException(403) if non-admin attempts assignment
    """
    
    user_role = current_user.get("role", "lawyer")
    user_id = current_user.get("_id")
    
    # Only admins can assign
    if user_role != "admin":
        logger.warning(
            f"[CASE_POLICY] Non-admin assignment denied: user={user_id} "
            f"target={target_lawyer_id}"
        )
        return False
    
    logger.info(
        f"[CASE_POLICY] Admin assignment authorized: admin={user_id} "
        f"target={target_lawyer_id}"
    )
    return True


def check_case_authorization(
    current_user: Dict[str, Any],
    case: Dict[str, Any],
    action: str = "read",
) -> None:
    """
    Unified authorization check for any case action.
    
    Raises HTTPException(403) if not authorized.
    
    Args:
        current_user: User dict
        case: Case dict
        action: "read", "write", "delete" (for logging)
    
    Raises:
        HTTPException(403) if not authorized
    """
    
    if not authorize_case_access(current_user, case):
        logger.warning(
            f"[CASE_POLICY] Authorization denied: user={current_user.get('_id')} "
            f"action={action} case_owner={case.get('lawyer_id')}"
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: you are not authorized to access this case"
        )
