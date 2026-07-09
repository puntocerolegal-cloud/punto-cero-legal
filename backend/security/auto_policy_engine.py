from enum import Enum
from dataclasses import dataclass
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta


class PolicyMode(Enum):
    NORMAL = "normal"
    ELEVATED = "elevated"
    STRICT = "strict"
    LOCKDOWN = "lockdown"


@dataclass
class DynamicPolicy:
    tenant_id: str
    resource_type: str
    action: str
    mode: PolicyMode
    restrictions: Dict[str, Any]
    created_at: datetime
    expires_at: datetime
    reason: str


class AutoPolicyEngine:
    def __init__(self):
        self.dynamic_policies: Dict[str, List[DynamicPolicy]] = {}
        self.tenant_policy_mode: Dict[str, PolicyMode] = {}
        self.global_policy_mode: PolicyMode = PolicyMode.NORMAL
        self.policy_history: List[DynamicPolicy] = []

    def adjust_tenant_policy(
        self,
        tenant_id: str,
        new_mode: PolicyMode,
        reason: str,
        duration_seconds: int = 3600,
    ) -> DynamicPolicy:
        """Adjust policy mode for a tenant"""
        policy = DynamicPolicy(
            tenant_id=tenant_id,
            resource_type="tenant_global",
            action="mode_change",
            mode=new_mode,
            restrictions=self._get_restrictions_for_mode(new_mode),
            created_at=datetime.utcnow(),
            expires_at=datetime.utcnow() + timedelta(seconds=duration_seconds),
            reason=reason,
        )

        self.tenant_policy_mode[tenant_id] = new_mode
        self._record_policy(tenant_id, policy)
        return policy

    def adjust_global_policy(
        self,
        new_mode: PolicyMode,
        reason: str,
        duration_seconds: int = 3600,
    ) -> DynamicPolicy:
        """Adjust global policy mode"""
        policy = DynamicPolicy(
            tenant_id="global",
            resource_type="global",
            action="mode_change",
            mode=new_mode,
            restrictions=self._get_restrictions_for_mode(new_mode),
            created_at=datetime.utcnow(),
            expires_at=datetime.utcnow() + timedelta(seconds=duration_seconds),
            reason=reason,
        )

        self.global_policy_mode = new_mode
        self.policy_history.append(policy)
        return policy

    def restrict_resource_for_tenant(
        self,
        tenant_id: str,
        resource_type: str,
        action: str,
        restrictions: Dict[str, Any],
        reason: str,
        duration_seconds: int = 3600,
    ) -> DynamicPolicy:
        """Add temporary restrictions to a resource for a tenant"""
        policy = DynamicPolicy(
            tenant_id=tenant_id,
            resource_type=resource_type,
            action=action,
            mode=PolicyMode.ELEVATED,
            restrictions=restrictions,
            created_at=datetime.utcnow(),
            expires_at=datetime.utcnow() + timedelta(seconds=duration_seconds),
            reason=reason,
        )

        key = f"{tenant_id}_{resource_type}"
        if key not in self.dynamic_policies:
            self.dynamic_policies[key] = []
        self.dynamic_policies[key].append(policy)
        self._record_policy(tenant_id, policy)
        return policy

    def enforce_strict_mode(
        self,
        tenant_id: str,
        reason: str,
        duration_seconds: int = 7200,
    ) -> DynamicPolicy:
        """Enforce strict mode for tenant after repeated attacks"""
        return self.adjust_tenant_policy(
            tenant_id=tenant_id,
            new_mode=PolicyMode.STRICT,
            reason=reason,
            duration_seconds=duration_seconds,
        )

    def trigger_lockdown_mode(
        self,
        reason: str,
        scope: str = "global",
        duration_seconds: int = 14400,
    ) -> DynamicPolicy:
        """Trigger emergency lockdown mode"""
        if scope == "global":
            return self.adjust_global_policy(
                new_mode=PolicyMode.LOCKDOWN,
                reason=reason,
                duration_seconds=duration_seconds,
            )
        else:
            return self.adjust_tenant_policy(
                tenant_id=scope,
                new_mode=PolicyMode.LOCKDOWN,
                reason=reason,
                duration_seconds=duration_seconds,
            )

    def get_effective_policy(self, tenant_id: str, resource_type: str = "default") -> Dict[str, Any]:
        """Get effective policy for a tenant/resource"""
        self._cleanup_expired_policies()

        tenant_mode = self.tenant_policy_mode.get(tenant_id, PolicyMode.NORMAL)
        
        effective_policy = {
            "global_mode": self.global_policy_mode.value,
            "tenant_mode": tenant_mode.value,
            "restrictions": {},
        }

        key = f"{tenant_id}_{resource_type}"
        if key in self.dynamic_policies:
            for policy in self.dynamic_policies[key]:
                if policy.expires_at > datetime.utcnow():
                    effective_policy["restrictions"].update(policy.restrictions)

        effective_policy["restrictions"].update(
            self._get_restrictions_for_mode(max(
                self.global_policy_mode,
                tenant_mode,
                key=lambda m: self._mode_severity(m)
            ))
        )

        return effective_policy

    def _get_restrictions_for_mode(self, mode: PolicyMode) -> Dict[str, Any]:
        """Get default restrictions for a policy mode"""
        restrictions_map = {
            PolicyMode.NORMAL: {
                "read_operations": True,
                "write_operations": True,
                "delete_operations": True,
                "rate_limit_rpm": 1000,
                "max_concurrent_connections": 100,
            },
            PolicyMode.ELEVATED: {
                "read_operations": True,
                "write_operations": True,
                "delete_operations": False,
                "rate_limit_rpm": 500,
                "max_concurrent_connections": 50,
                "require_mfa": True,
            },
            PolicyMode.STRICT: {
                "read_operations": True,
                "write_operations": False,
                "delete_operations": False,
                "rate_limit_rpm": 100,
                "max_concurrent_connections": 10,
                "require_mfa": True,
                "allow_only_listed_ips": True,
            },
            PolicyMode.LOCKDOWN: {
                "read_operations": True,
                "write_operations": False,
                "delete_operations": False,
                "rate_limit_rpm": 10,
                "max_concurrent_connections": 1,
                "require_mfa": True,
                "allow_only_listed_ips": True,
                "audit_all_operations": True,
            },
        }
        return restrictions_map.get(mode, restrictions_map[PolicyMode.NORMAL])

    def _mode_severity(self, mode: PolicyMode) -> int:
        """Get severity level of a mode"""
        severity_map = {
            PolicyMode.NORMAL: 0,
            PolicyMode.ELEVATED: 1,
            PolicyMode.STRICT: 2,
            PolicyMode.LOCKDOWN: 3,
        }
        return severity_map.get(mode, 0)

    def _cleanup_expired_policies(self):
        """Remove expired policies"""
        now = datetime.utcnow()
        keys_to_check = list(self.dynamic_policies.keys())
        
        for key in keys_to_check:
            self.dynamic_policies[key] = [
                p for p in self.dynamic_policies[key]
                if p.expires_at > now
            ]
            if not self.dynamic_policies[key]:
                del self.dynamic_policies[key]

    def _record_policy(self, tenant_id: str, policy: DynamicPolicy):
        """Record policy change for audit"""
        self.policy_history.append(policy)

    def get_policy_history(self, tenant_id: str, limit: int = 20) -> List[DynamicPolicy]:
        """Get recent policy changes for a tenant"""
        return [p for p in self.policy_history if p.tenant_id == tenant_id][-limit:]

    def reset_tenant_policy(self, tenant_id: str):
        """Reset tenant policy to normal"""
        self.tenant_policy_mode.pop(tenant_id, None)
        keys_to_remove = [k for k in self.dynamic_policies.keys() if k.startswith(tenant_id)]
        for key in keys_to_remove:
            del self.dynamic_policies[key]

    def is_operation_allowed(
        self,
        tenant_id: str,
        operation_type: str,
        resource_type: str = "default",
    ) -> bool:
        """Check if operation is allowed under current policy"""
        policy = self.get_effective_policy(tenant_id, resource_type)
        restrictions = policy.get("restrictions", {})

        if operation_type == "read":
            return restrictions.get("read_operations", True)
        elif operation_type == "write":
            return restrictions.get("write_operations", True)
        elif operation_type == "delete":
            return restrictions.get("delete_operations", True)
        
        return True


_global_auto_policy_engine = AutoPolicyEngine()


def get_auto_policy_engine() -> AutoPolicyEngine:
    return _global_auto_policy_engine
