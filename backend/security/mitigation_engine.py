from enum import Enum
from dataclasses import dataclass
from typing import Optional, Dict, Any, Set
from datetime import datetime, timedelta
import asyncio


class MitigationStatus(Enum):
    PENDING = "pending"
    EXECUTING = "executing"
    SUCCESS = "success"
    FAILED = "failed"


@dataclass
class MitigationAction:
    action_type: str
    target: str
    params: Dict[str, Any]
    status: MitigationStatus
    executed_at: Optional[datetime] = None
    result: Optional[Dict[str, Any]] = None


class MitigationEngine:
    def __init__(self):
        self.blocked_users: Set[str] = set()
        self.blocked_ips: Set[str] = set()
        self.rate_limited_users: Dict[str, Dict[str, Any]] = {}
        self.quarantined_tenants: Set[str] = set()
        self.revoked_tokens: Set[str] = set()
        self.reduced_permissions: Dict[str, list] = {}
        self.action_history: Dict[str, list] = {}
        self.execution_queue: asyncio.Queue = asyncio.Queue()

    async def execute_action(self, action: Dict[str, Any]) -> MitigationAction:
        """Execute a single mitigation action"""
        action_type = action.get("type")
        target = action.get("target", "system")
        params = {k: v for k, v in action.items() if k not in ["type", "target"]}

        mitigation = MitigationAction(
            action_type=action_type,
            target=target,
            params=params,
            status=MitigationStatus.PENDING,
        )

        try:
            mitigation.status = MitigationStatus.EXECUTING

            if action_type == "rate_limit":
                await self._rate_limit_user(target, params)
            elif action_type == "block_user":
                await self._block_user(target, params)
            elif action_type == "block_ip":
                await self._block_ip(target, params)
            elif action_type == "quarantine_tenant":
                await self._quarantine_tenant(target, params)
            elif action_type == "revoke_tokens":
                await self._revoke_tokens(target, params)
            elif action_type == "reduce_permissions":
                await self._reduce_permissions(target, params)
            elif action_type == "isolate_user":
                await self._isolate_user(target, params)
            elif action_type == "increase_audit_logging":
                await self._increase_audit_logging(target, params)
            elif action_type == "increase_monitoring":
                await self._increase_monitoring(target, params)
            elif action_type == "trigger_fail_safe":
                await self._trigger_fail_safe(target, params)
            elif action_type == "notify_soc":
                await self._notify_soc(params)
            else:
                raise ValueError(f"Unknown action type: {action_type}")

            mitigation.status = MitigationStatus.SUCCESS
            mitigation.executed_at = datetime.utcnow()
            mitigation.result = {"message": f"Action {action_type} executed successfully"}

            risk_score = params.get("risk_score", 0)
            decision_type = params.get("decision_type", "unknown")
            try:
                from security.soc_event_stream import get_soc_stream
                stream = get_soc_stream()
                stream.log_autonomous_action(
                    action_type=action_type,
                    target=target,
                    decision_type=decision_type,
                    risk_score=risk_score,
                    status="success"
                )
            except ImportError:
                pass

        except Exception as e:
            mitigation.status = MitigationStatus.FAILED
            mitigation.executed_at = datetime.utcnow()
            mitigation.result = {"error": str(e)}

        self._record_action(target, mitigation)
        return mitigation

    async def execute_actions(self, actions: list) -> list:
        """Execute multiple mitigation actions"""
        results = []
        for action in actions:
            result = await self.execute_action(action)
            results.append(result)
        return results

    async def _rate_limit_user(self, user_id: str, params: Dict[str, Any]):
        """Rate limit a user"""
        requests_per_minute = params.get("requests_per_minute", 10)
        duration_seconds = params.get("duration_seconds", 3600)

        self.rate_limited_users[user_id] = {
            "requests_per_minute": requests_per_minute,
            "duration_seconds": duration_seconds,
            "started_at": datetime.utcnow(),
            "expires_at": datetime.utcnow() + timedelta(seconds=duration_seconds),
        }

    async def _block_user(self, user_id: str, params: Dict[str, Any]):
        """Block user from system access"""
        duration_seconds = params.get("duration_seconds", 3600)
        self.blocked_users.add(user_id)
        
        expiry_time = datetime.utcnow() + timedelta(seconds=duration_seconds)
        self.rate_limited_users[user_id] = {
            "blocked": True,
            "expires_at": expiry_time,
        }

    async def _block_ip(self, ip: str, params: Dict[str, Any]):
        """Block IP address"""
        duration_seconds = params.get("duration_seconds", 7200)
        self.blocked_ips.add(ip)

    async def _quarantine_tenant(self, tenant_id: str, params: Dict[str, Any]):
        """Quarantine a tenant to read-only mode"""
        mode = params.get("mode", "read_only")
        self.quarantined_tenants.add(tenant_id)

    async def _revoke_tokens(self, user_id: str, params: Dict[str, Any]):
        """Revoke all tokens for a user"""
        revoke_all = params.get("revoke_all", True)
        self.revoked_tokens.add(user_id)

    async def _reduce_permissions(self, user_id: str, params: Dict[str, Any]):
        """Reduce user permissions"""
        restrictions = params.get("restrictions", [])
        self.reduced_permissions[user_id] = restrictions

    async def _isolate_user(self, user_id: str, params: Dict[str, Any]):
        """Isolate user in sandbox mode"""
        mode = params.get("mode", "sandbox")
        self.rate_limited_users[user_id] = {
            "isolated": True,
            "mode": mode,
            "started_at": datetime.utcnow(),
        }

    async def _increase_audit_logging(self, target: str, params: Dict[str, Any]):
        """Increase audit logging intensity"""
        pass

    async def _increase_monitoring(self, target: str, params: Dict[str, Any]):
        """Increase monitoring scope"""
        pass

    async def _trigger_fail_safe(self, target: str, params: Dict[str, Any]):
        """Trigger fail-safe mode"""
        from security.fail_safe_mode import get_fail_safe_manager
        manager = get_fail_safe_manager()
        scope = params.get("scope", "tenant")
        await manager.enter_fail_safe(reason=f"Autonomous trigger: {target}")

    async def _notify_soc(self, params: Dict[str, Any]):
        """Notify SOC of critical action"""
        severity = params.get("severity", "medium")
        from security.soc_event_stream import get_soc_stream
        stream = get_soc_stream()
        stream.ingest_event(
            event_type="autonomous_action",
            user_id="system",
            severity=severity,
            data=params
        )

    def _record_action(self, target: str, action: MitigationAction):
        """Record action for audit trail"""
        if target not in self.action_history:
            self.action_history[target] = []
        self.action_history[target].append(action)

    def is_user_blocked(self, user_id: str) -> bool:
        """Check if user is blocked"""
        if user_id not in self.blocked_users:
            return False
        
        limit_info = self.rate_limited_users.get(user_id, {})
        if "expires_at" in limit_info:
            if limit_info["expires_at"] < datetime.utcnow():
                self.blocked_users.discard(user_id)
                return False
        return True

    def is_ip_blocked(self, ip: str) -> bool:
        """Check if IP is blocked"""
        return ip in self.blocked_ips

    def get_rate_limit(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get rate limit for user"""
        limit_info = self.rate_limited_users.get(user_id)
        if limit_info and "expires_at" in limit_info:
            if limit_info["expires_at"] < datetime.utcnow():
                del self.rate_limited_users[user_id]
                return None
        return limit_info

    def is_tenant_quarantined(self, tenant_id: str) -> bool:
        """Check if tenant is quarantined"""
        return tenant_id in self.quarantined_tenants

    def get_actions_for_target(self, target: str, limit: int = 10) -> list:
        """Get recent actions for a target"""
        return self.action_history.get(target, [])[-limit:]

    def unblock_user(self, user_id: str):
        """Manually unblock a user"""
        self.blocked_users.discard(user_id)
        if user_id in self.rate_limited_users:
            del self.rate_limited_users[user_id]

    def unquarantine_tenant(self, tenant_id: str):
        """Manually unquarantine a tenant"""
        self.quarantined_tenants.discard(tenant_id)


_global_mitigation_engine = MitigationEngine()


def get_mitigation_engine() -> MitigationEngine:
    return _global_mitigation_engine
