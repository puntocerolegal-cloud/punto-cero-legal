"""
Global Policy Matrix — Centralized Authorization Rules
═══════════════════════════════════════════════════════════════════

Purpose:
  Single source of truth for all authorization policies across the system.
  
  Prevents:
  - Duplicated permission logic
  - Inconsistent authorization between modules
  - Role confusion
  - Action bypass

Structure:
  POLICIES[resource_type][action] = [required_roles]
  
  Where required_roles can be:
  - "owner" → must be resource owner
  - "team" → must be in assigned team
  - "admin" → admin role required
  - "any" → any authenticated user
  - "public" → no authentication required
"""

from typing import Dict, List, Set

# Role definitions for reference
ROLE_HIERARCHY = {
    "admin": 10,           # Full access to organization
    "partner": 7,         # Senior lawyer/partner
    "lawyer": 5,          # Regular lawyer
    "paralegal": 3,       # Support staff
    "client": 1,          # External client
    "public": 0,          # Unauthenticated
}

# ═══════════════════════════════════════════════════════════════════
# GLOBAL POLICY MATRIX
# ═══════════════════════════════════════════════════════════════════

POLICIES: Dict[str, Dict[str, List[str]]] = {
    
    # ─────────────────────────────────────────────────────────────
    # CASES
    # ─────────────────────────────────────────────────────────────
    "case": {
        "read": ["owner", "team", "admin"],
        "read_list": ["admin"],              # Only admins see all; lawyers see own
        "create": ["any"],                   # Any authenticated user can create
        "update": ["owner", "admin"],        # Owner or admin can modify
        "delete": ["admin"],                 # Only admin can delete
        "assign": ["admin"],                 # Only admin can assign
        "accept": ["owner"],                 # Owner/assigned lawyer accepts
        "decline": ["owner"],                # Owner/assigned lawyer declines
        "timeline_read": ["owner", "team", "admin"],
        "timeline_write": ["owner", "admin"],
        "form_submit": ["public"],           # Client form submission (token-based)
    },
    
    # ─────────────────────────────────────────────────────────────
    # DOCUMENTS
    # ─────────────────────────────────────────────────────────────
    "document": {
        "read": ["owner", "team", "admin"],
        "read_list": ["admin"],              # Admins see all; lawyers see own
        "create": ["any"],                   # Any authenticated user
        "update": ["owner"],                 # Only owner can update
        "delete": ["owner", "admin"],        # Owner or admin
        "download": ["owner", "team", "admin"],
        "share": ["owner"],                  # Owner can share with team
        "encrypt": ["owner"],                # Owner controls encryption
    },
    
    # ─────────────────────────────────────────────────────────────
    # INVOICES
    # ─────────────────────────────────────────────────────────────
    "invoice": {
        "read": ["owner", "admin"],
        "read_list": ["admin"],
        "create": ["admin"],                 # Only admin creates invoices
        "update": ["admin"],                 # Only admin can modify
        "delete": ["admin"],                 # Only admin
        "pay": ["owner"],                    # Only invoice owner can pay
        "cancel": ["admin"],
    },
    
    # ─────────────────────────────────────────────────────────────
    # DASHBOARD
    # ─────────────────────────────────────────────────────────────
    "dashboard": {
        "read_own": ["any"],                 # User can read own dashboard
        "read_other": ["admin"],             # Only admin can read other's dashboard
        "kpis": ["owner", "admin"],
        "alerts": ["owner", "admin"],
        "notifications": ["owner", "admin"],
    },
    
    # ─────────────────────────────────────────────────────────────
    # USERS
    # ─────────────────────────────────────────────────────────────
    "user": {
        "read_own": ["any"],                 # User can read own profile
        "read_other": ["admin"],             # Admin can read others
        "update_own": ["any"],               # User can update own profile
        "update_other": ["admin"],           # Admin can update others
        "delete": ["admin"],
        "list": ["admin"],
    },
    
    # ─────────────────────────────────────────────────────────────
    # CLIENTS
    # ─────────────────────────────────────────────────────────────
    "client": {
        "read": ["owner", "admin"],
        "read_list": ["owner", "admin"],     # Lawyer sees own clients; admin sees all
        "create": ["any"],
        "update": ["owner", "admin"],
        "delete": ["admin"],
    },
    
    # ─────────────────────────────────────────────────────────────
    # ORGANIZATIONS
    # ─────────────────────────────────────────────────────────────
    "organization": {
        "read": ["admin"],                   # Only org admin
        "update": ["admin"],
        "settings": ["admin"],
        "members": ["admin"],
    },
}


def get_policy(resource_type: str, action: str) -> List[str]:
    """
    Get authorization policy for a resource and action.
    
    Args:
        resource_type: e.g., "case", "document", "invoice"
        action: e.g., "read", "write", "delete"
    
    Returns:
        List of required roles (e.g., ["owner", "admin"])
    
    Raises:
        KeyError if resource_type or action not defined (fail-closed)
    """
    if resource_type not in POLICIES:
        raise KeyError(f"Unknown resource type: {resource_type}")
    
    if action not in POLICIES[resource_type]:
        raise KeyError(f"Unknown action '{action}' for resource '{resource_type}'")
    
    return POLICIES[resource_type][action]


def policy_allows(
    required_roles: List[str],
    user_role: str,
    is_owner: bool = False,
    is_team_member: bool = False,
) -> bool:
    """
    Check if user's role satisfies policy requirements.
    
    Args:
        required_roles: List of allowed roles/conditions (e.g., ["owner", "admin"])
        user_role: User's actual role (e.g., "lawyer", "admin")
        is_owner: Whether user is resource owner
        is_team_member: Whether user is in resource's team
    
    Returns:
        True if access allowed, False otherwise
    
    Rules:
        - "admin" → always true if user_role == "admin"
        - "owner" → true if is_owner
        - "team" → true if is_team_member
        - "any" → always true if authenticated
        - "public" → always true
    """
    
    for role in required_roles:
        if role == "admin" and user_role == "admin":
            return True
        if role == "owner" and is_owner:
            return True
        if role == "team" and is_team_member:
            return True
        if role == "any":
            return True
        if role == "public":
            return True
    
    return False
