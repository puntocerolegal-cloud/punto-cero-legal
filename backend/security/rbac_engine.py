"""
RBAC Engine — Role-Based Access Control
════════════════════════════════════════════════════════════════════

Purpose:
  Centralized role-based permission system.
  
  Extracts user role information and maps to permissions.
"""

from typing import Dict, List, Set, Any
from fastapi import HTTPException, status

# ═══════════════════════════════════════════════════════════════════
# ROLE DEFINITIONS
# ═══════════════════════════════════════════════════════════════════

# Permissions available to each role
ROLE_PERMISSIONS = {
    "admin": {
        "can_read_all": True,
        "can_write_all": True,
        "can_delete_all": True,
        "can_assign": True,
        "can_manage_users": True,
        "can_audit": True,
        "cross_org": False,  # Admins are org-scoped
    },
    "partner": {
        "can_read_all": True,
        "can_write_all": True,
        "can_delete_all": True,
        "can_assign": True,
        "can_manage_users": False,
        "can_audit": False,
        "cross_org": False,
    },
    "lawyer": {
        "can_read_all": False,
        "can_write_all": False,
        "can_delete_all": False,
        "can_assign": False,
        "can_manage_users": False,
        "can_audit": False,
        "cross_org": False,
    },
    "paralegal": {
        "can_read_all": False,
        "can_write_all": False,
        "can_delete_all": False,
        "can_assign": False,
        "can_manage_users": False,
        "can_audit": False,
        "cross_org": False,
    },
    "client": {
        "can_read_all": False,
        "can_write_all": False,
        "can_delete_all": False,
        "can_assign": False,
        "can_manage_users": False,
        "can_audit": False,
        "cross_org": False,
    },
}


def get_user_permissions(user: Dict[str, Any]) -> Dict[str, Any]:
    """
    Extract permissions from user object.
    
    Args:
        user: User dict from database (has _id, role, organization_id, etc.)
    
    Returns:
        Permissions dict with all role information
    
    Raises:
        HTTPException(403) if user has unknown role
    """
    
    user_role = user.get("role", "lawyer")
    user_id = user.get("_id")
    user_org = user.get("organization_id")
    
    if user_role not in ROLE_PERMISSIONS:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Unknown role: {user_role}"
        )
    
    return {
        "user_id": user_id,
        "role": user_role,
        "organization_id": user_org,
        "permissions": ROLE_PERMISSIONS[user_role],
        "is_admin": user_role == "admin",
        "is_owner": None,  # Set dynamically per resource
        "is_team_member": None,  # Set dynamically per resource
    }


def has_permission(
    user_permissions: Dict[str, Any],
    permission_name: str,
) -> bool:
    """
    Check if user has a specific permission.
    
    Args:
        user_permissions: Result from get_user_permissions()
        permission_name: e.g., "can_read_all", "can_delete_all"
    
    Returns:
        True if user has permission
    """
    
    perms = user_permissions.get("permissions", {})
    return perms.get(permission_name, False)


def is_admin(user: Dict[str, Any]) -> bool:
    """Quick check if user is admin."""
    return user.get("role") == "admin"


def is_same_organization(user: Dict[str, Any], resource: Dict[str, Any]) -> bool:
    """Check if user and resource are in same organization."""
    return user.get("organization_id") == resource.get("organization_id")


def extract_user_context(user: Dict[str, Any]) -> Dict[str, Any]:
    """
    Extract all relevant user context for authorization.
    
    Returns dict with:
    - user_id
    - role
    - organization_id
    - permissions
    - is_admin
    """
    return get_user_permissions(user)
