"""
Security Engine — Global Authorization Core
═══════════════════════════════════════════════════════════════════

Purpose:
  SINGLE POINT OF TRUTH for all authorization decisions.
  
  This is the only place in the system where access decisions are made.
  All endpoints must call authorize() before accessing resources.

Fail-Closed Security Model:
  - Default: DENY
  - If policy undefined: DENY
  - If tenant mismatch: DENY
  - If ownership mismatch: DENY
  
  Only explicitly ALLOW in policy.
"""

from typing import Dict, Any, Optional
from fastapi import HTTPException, status
import logging

from security.policy_matrix import get_policy, policy_allows
from security.rbac_engine import get_user_permissions, is_admin, is_same_organization
from security.audit_logger import log_authorization, log_access_denied

logger = logging.getLogger(__name__)


async def _apply_governor_validation(
    action_type: str,
    target: str,
    risk_score: float,
) -> Optional[str]:
    """S2.9: Validate action through Security Governor"""
    try:
        from security.security_governor_engine import get_security_governor

        governor = get_security_governor()
        decision = governor.validate_action(action_type, target, risk_score)

        if decision.approval_status.value != "approved":
            logger.warning(
                f"[S2.9] Governor downgraded action: {decision.original_action_type} "
                f"→ {decision.final_action_type}"
            )
            return decision.final_action_type

        return None

    except ImportError:
        return None


async def _apply_autonomous_response(
    user: Dict[str, Any],
    resource_type: str,
    action: str,
    resource: Optional[Dict[str, Any]] = None,
    risk_context: Optional[Dict[str, Any]] = None,
):
    """S2.8: Apply autonomous response from decision engine"""
    try:
        from security.autonomous_decision_engine import get_autonomous_decision_engine
        from security.mitigation_engine import get_mitigation_engine

        user_id = user.get("_id")
        tenant_id = user.get("organization_id")

        decision_engine = get_autonomous_decision_engine()
        mitigation_engine = get_mitigation_engine()

        if not risk_context:
            risk_context = {}

        risk_score = risk_context.get("risk_score", 0)
        attack_graph_state = risk_context.get("attack_graph_state", {})
        behavioral_deviation = risk_context.get("behavioral_deviation", 0)
        tenant_risk = risk_context.get("tenant_risk", 0)
        correlation_signals = risk_context.get("correlation_signals", [])

        decision = decision_engine.decide(
            user_id=user_id,
            tenant_id=tenant_id,
            risk_score=risk_score,
            attack_graph_state=attack_graph_state,
            behavioral_deviation=behavioral_deviation,
            tenant_risk=tenant_risk,
            correlation_signals=correlation_signals,
        )

        logger.info(
            f"[S2.8] Autonomous decision: user={user_id} "
            f"decision={decision.decision_type.value} confidence={decision.confidence:.2f}"
        )

        await mitigation_engine.execute_actions(decision.actions)

    except ImportError:
        pass


async def authorize(
    user: Dict[str, Any],
    resource_type: str,
    action: str,
    resource: Optional[Dict[str, Any]] = None,
    context: Optional[Dict[str, Any]] = None,
    db: Optional[Any] = None,
) -> bool:
    """
    UNIVERSAL AUTHORIZATION ENGINE
    
    Check if user can perform action on resource_type.
    
    This is the ONLY place where authorization happens.
    Every resource access must go through this function.
    
    Args:
        user: User dict from get_current_user() (has _id, role, organization_id)
        resource_type: "case", "document", "invoice", etc.
        action: "read", "write", "delete", "assign", etc.
        resource: The actual resource object (if applicable)
        context: Additional context (optional)
        db: Database connection (for audit logging)
    
    Returns:
        True if access allowed
    
    Raises:
        HTTPException(403) if access denied
        HTTPException(400) if policy undefined (fail-closed)
    
    Fail-Closed Logic:
        1. Get policy for resource_type + action
        2. If policy doesn't exist → DENY (fail-closed)
        3. Check tenant isolation (if resource provided)
        4. Check RBAC roles
        5. Check ownership (if applicable)
        6. Log decision
        7. Return True or raise 403
    """
    
    user_id = user.get("_id")
    user_role = user.get("role", "lawyer")
    user_org = user.get("organization_id")
    
    # Step 1: Get policy (fail-closed if not found)
    try:
        required_roles = get_policy(resource_type, action)
    except KeyError as e:
        logger.critical(
            f"[SECURITY] Undefined policy: resource={resource_type} "
            f"action={action} user={user_id}"
        )
        await log_access_denied(
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            reason="Policy undefined (fail-closed)",
            db=db,
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: policy undefined"
        )
    
    # Step 2: Check public access (no resource needed)
    if "public" in required_roles:
        logger.info(
            f"[SECURITY] Public access allowed: user={user_id} "
            f"resource_type={resource_type} action={action}"
        )
        return True
    
    # Step 3: Check "any" authenticated user
    if "any" in required_roles:
        logger.info(
            f"[SECURITY] Authenticated access allowed: user={user_id} "
            f"resource_type={resource_type} action={action}"
        )
        if context and context.get("risk_context"):
            await _apply_autonomous_response(user, resource_type, action, resource, context["risk_context"])
        return True
    
    # Step 4: Check tenant isolation (MANDATORY if resource provided)
    if resource:
        if not is_same_organization(user, resource):
            reason = f"Organization mismatch: user_org={user_org} resource_org={resource.get('organization_id')}"
            logger.warning(
                f"[SECURITY] Cross-org access denied: user={user_id} {reason}"
            )
            await log_access_denied(
                user_id=user_id,
                action=action,
                resource_type=resource_type,
                resource_id=str(resource.get("_id")),
                reason=reason,
                db=db,
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: organization boundary violation"
            )
    
    # Step 5: Check ownership and team membership
    is_owner = False
    is_team_member = False
    
    if resource:
        # Check ownership (comparing _id fields)
        resource_owner = resource.get("lawyer_id") or resource.get("owner_id")
        if resource_owner == user_id:
            is_owner = True
        
        # Check team membership
        assigned_team = resource.get("assigned_team", [])
        if user_id in assigned_team:
            is_team_member = True
    
    # Step 6: Check RBAC (role-based rules)
    user_perms = get_user_permissions(user)
    
    # Step 7: Evaluate policy
    allowed = policy_allows(
        required_roles=required_roles,
        user_role=user_role,
        is_owner=is_owner,
        is_team_member=is_team_member,
    )
    
    if not allowed:
        reason = (
            f"Role mismatch: required={required_roles} "
            f"user_role={user_role} is_owner={is_owner} is_team_member={is_team_member}"
        )
        logger.warning(
            f"[SECURITY] Access denied: user={user_id} {reason}"
        )

        if context and context.get("risk_context"):
            await _apply_autonomous_response(user, resource_type, action, resource, context["risk_context"])

        await log_access_denied(
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=str(resource.get("_id")) if resource else None,
            reason=reason,
            db=db,
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: insufficient permissions"
        )
    
    # Step 8: Log allowed access
    logger.info(
        f"[SECURITY] Access allowed: user={user_id} "
        f"resource_type={resource_type} action={action} "
        f"is_owner={is_owner} is_team_member={is_team_member}"
    )
    await log_authorization(
        decision="ALLOW",
        user_id=user_id,
        action=action,
        resource_type=resource_type,
        resource_id=str(resource.get("_id")) if resource else None,
        db=db,
    )
    
    return True


async def check_authorization(
    user: Dict[str, Any],
    resource_type: str,
    action: str,
    resource: Optional[Dict[str, Any]] = None,
    db: Optional[Any] = None,
) -> None:
    """
    Convenience wrapper that raises HTTPException on denial.
    
    Usage:
        await check_authorization(current_user, "case", "read", case_object)
    
    Raises:
        HTTPException(403) if not authorized
    """
    await authorize(user, resource_type, action, resource, db=db)


async def authorize_action(
    user: Dict[str, Any],
    resource_type: str,
    action: str,
    resource: Optional[Dict[str, Any]] = None,
    db: Optional[Any] = None,
) -> bool:
    """
    Convenience method that returns bool instead of raising.
    
    Usage:
        if await authorize_action(current_user, "case", "delete", case):
            # proceed with deletion
    
    Returns:
        True if authorized, False otherwise (doesn't raise)
    """
    try:
        await authorize(user, resource_type, action, resource, db=db)
        return True
    except HTTPException:
        return False
