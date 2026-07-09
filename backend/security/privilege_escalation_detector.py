"""
Privilege Escalation Detector — Advanced Pattern Detection
═══════════════════════════════════════════════════════════════════

Purpose:
  Detect privilege escalation attempts and anomalous privilege changes.
  
  Detects:
  - Role changes without authorization
  - Impersonation attempts
  - Scope boundary violations
  - JWT claim inconsistencies
  - Cross-tenant privilege escalation
  - Permission override attempts
"""

from typing import Dict, Any, Optional, List
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


# ═══════════════════════════════════════════════════════════════════
# ESCALATION DETECTION ENGINE
# ═══════════════════════════════════════════════════════════════════

class PrivilegeEscalationDetector:
    """
    Detect privilege escalation attempts and anomalies.
    """
    
    # Escalation patterns
    DANGEROUS_TRANSITIONS = {
        ("lawyer", "admin"),      # Regular lawyer -> admin
        ("paralegal", "admin"),   # Paralegal -> admin
        ("client", "lawyer"),     # Client -> lawyer
        ("client", "admin"),      # Client -> admin
    }
    
    DANGEROUS_ACTIONS = {
        "delete",      # Lawyer trying to delete (admin-only)
        "assign",      # Lawyer trying to assign (admin-only)
        "manage_users", # Non-admin trying to manage users
        "change_role",  # Changing own role
        "elevate_scope", # Accessing higher scope
    }
    
    def __init__(self, alert_callback=None):
        self.alert_callback = alert_callback
        self.user_role_history: Dict[str, List[Dict[str, Any]]] = {}
        logger.info("[PRIVILEGE_ESCALATION] Detector initialized")
    
    async def check_role_consistency(
        self,
        user_id: str,
        claimed_role: str,
        db_role: str,
    ) -> Dict[str, Any]:
        """
        Check if claimed role matches database role.
        
        Detects JWT tampering attempts.
        
        Args:
            user_id: User ID
            claimed_role: Role from JWT token
            db_role: Role from database
        
        Returns:
            Detection result
        """
        
        if claimed_role != db_role:
            logger.critical(
                f"[PRIVILEGE_ESCALATION] ROLE MISMATCH: user={user_id} "
                f"claimed={claimed_role} actual={db_role}"
            )
            
            await self._alert_escalation(
                event_type="role_mismatch",
                user_id=user_id,
                description=f"JWT role ({claimed_role}) != database role ({db_role})",
                severity="critical",
            )
            
            return {
                "detected": True,
                "event_type": "role_mismatch",
                "claimed_role": claimed_role,
                "db_role": db_role,
                "severity": "critical",
            }
        
        return {"detected": False}
    
    async def check_org_boundary_violation(
        self,
        user_id: str,
        user_org: str,
        resource_org: str,
        resource_type: str,
    ) -> Dict[str, Any]:
        """
        Check for cross-organization access attempts.
        
        Args:
            user_id: User ID
            user_org: User's organization ID
            resource_org: Resource's organization ID
            resource_type: Type of resource
        
        Returns:
            Detection result
        """
        
        if user_org != resource_org:
            logger.critical(
                f"[PRIVILEGE_ESCALATION] ORG BOUNDARY VIOLATION: user={user_id} "
                f"user_org={user_org} resource_org={resource_org} "
                f"resource_type={resource_type}"
            )
            
            await self._alert_escalation(
                event_type="org_boundary_violation",
                user_id=user_id,
                description=f"Cross-org access attempt: {user_org} -> {resource_org}",
                severity="critical",
            )
            
            return {
                "detected": True,
                "event_type": "org_boundary_violation",
                "severity": "critical",
            }
        
        return {"detected": False}
    
    async def check_scope_escalation(
        self,
        user_id: str,
        user_role: str,
        requested_action: str,
        resource_type: str,
    ) -> Dict[str, Any]:
        """
        Check if user is attempting actions outside their role scope.
        
        Args:
            user_id: User ID
            user_role: User's role ("lawyer", "admin", etc.)
            requested_action: Action being attempted ("delete", "assign", etc.)
            resource_type: Resource type
        
        Returns:
            Detection result
        """
        
        # Check if this is a dangerous action
        if requested_action not in self.DANGEROUS_ACTIONS:
            return {"detected": False}
        
        # Dangerous actions require specific roles
        dangerous_role_map = {
            "delete": {"admin"},
            "assign": {"admin"},
            "manage_users": {"admin"},
            "change_role": set(),  # Never allowed
            "elevate_scope": set(),  # Never allowed
        }
        
        allowed_roles = dangerous_role_map.get(requested_action, set())
        
        if user_role not in allowed_roles:
            logger.warning(
                f"[PRIVILEGE_ESCALATION] SCOPE ESCALATION ATTEMPT: user={user_id} "
                f"role={user_role} action={requested_action} resource={resource_type}"
            )
            
            severity = "critical" if requested_action in ("delete", "assign") else "high"
            
            await self._alert_escalation(
                event_type="scope_escalation",
                user_id=user_id,
                description=f"Role {user_role} attempted {requested_action} (requires {allowed_roles})",
                severity=severity,
            )
            
            return {
                "detected": True,
                "event_type": "scope_escalation",
                "attempted_action": requested_action,
                "user_role": user_role,
                "severity": severity,
            }
        
        return {"detected": False}
    
    async def check_impersonation_attempt(
        self,
        actor_user_id: str,
        target_user_id: str,
        actor_role: str,
    ) -> Dict[str, Any]:
        """
        Check if user is attempting to act as another user.
        
        Args:
            actor_user_id: User making the action
            target_user_id: User being impersonated
            actor_role: Role of actor
        
        Returns:
            Detection result
        """
        
        if actor_user_id == target_user_id:
            return {"detected": False}
        
        # Only admins can perform actions on behalf of others (sometimes)
        if actor_role != "admin":
            logger.critical(
                f"[PRIVILEGE_ESCALATION] IMPERSONATION ATTEMPT: "
                f"actor={actor_user_id} target={target_user_id} role={actor_role}"
            )
            
            await self._alert_escalation(
                event_type="impersonation_attempt",
                user_id=actor_user_id,
                description=f"Non-admin {actor_user_id} attempted action as {target_user_id}",
                severity="critical",
            )
            
            return {
                "detected": True,
                "event_type": "impersonation_attempt",
                "severity": "critical",
            }
        
        return {"detected": False}
    
    async def check_permission_override_attempt(
        self,
        user_id: str,
        requested_permissions: List[str],
        actual_permissions: List[str],
    ) -> Dict[str, Any]:
        """
        Check if user is requesting permissions they don't have.
        
        Detects JWT tampering or header injection attempts.
        
        Args:
            user_id: User ID
            requested_permissions: Permissions user claimed to have
            actual_permissions: Permissions user actually has
        
        Returns:
            Detection result
        """
        
        # Find permissions in request but not in actual
        extra_perms = set(requested_permissions) - set(actual_permissions)
        
        if extra_perms:
            logger.critical(
                f"[PRIVILEGE_ESCALATION] PERMISSION OVERRIDE: user={user_id} "
                f"extra_perms={extra_perms}"
            )
            
            await self._alert_escalation(
                event_type="permission_override",
                user_id=user_id,
                description=f"User claimed permissions not granted: {extra_perms}",
                severity="critical",
            )
            
            return {
                "detected": True,
                "event_type": "permission_override",
                "extra_permissions": list(extra_perms),
                "severity": "critical",
            }
        
        return {"detected": False}
    
    async def check_dangerous_role_transition(
        self,
        user_id: str,
        from_role: str,
        to_role: str,
    ) -> Dict[str, Any]:
        """
        Check if user role changed in a dangerous way.
        
        Args:
            user_id: User ID
            from_role: Previous role
            to_role: New role
        
        Returns:
            Detection result
        """
        
        transition = (from_role, to_role)
        
        if transition in self.DANGEROUS_TRANSITIONS:
            logger.critical(
                f"[PRIVILEGE_ESCALATION] DANGEROUS ROLE TRANSITION: "
                f"user={user_id} {from_role} -> {to_role}"
            )
            
            await self._alert_escalation(
                event_type="dangerous_role_transition",
                user_id=user_id,
                description=f"Unauthorized role change: {from_role} -> {to_role}",
                severity="critical",
            )
            
            return {
                "detected": True,
                "event_type": "dangerous_role_transition",
                "from_role": from_role,
                "to_role": to_role,
                "severity": "critical",
            }
        
        return {"detected": False}
    
    async def _alert_escalation(
        self,
        event_type: str,
        user_id: str,
        description: str,
        severity: str,
    ) -> None:
        """Send escalation alert."""
        alert = {
            "level": "critical" if severity == "critical" else "warning",
            "type": "privilege_escalation",
            "event_type": event_type,
            "user_id": user_id,
            "description": description,
            "timestamp": datetime.utcnow().isoformat(),
        }
        
        if self.alert_callback:
            try:
                self.alert_callback(alert)
            except Exception as e:
                logger.error(f"[PRIVILEGE_ESCALATION] Alert callback failed: {e}")


# ═══════════════════════════════════════════════════════════════════
# GLOBAL DETECTOR
# ═══════════════════════════════════════════════════════════════════

_global_detector: Optional[PrivilegeEscalationDetector] = None


def initialize_escalation_detector(alert_callback=None) -> PrivilegeEscalationDetector:
    """Initialize global escalation detector."""
    global _global_detector
    _global_detector = PrivilegeEscalationDetector(alert_callback=alert_callback)
    return _global_detector


def get_escalation_detector() -> PrivilegeEscalationDetector:
    """Get global detector."""
    global _global_detector
    if _global_detector is None:
        _global_detector = PrivilegeEscalationDetector()
    return _global_detector
