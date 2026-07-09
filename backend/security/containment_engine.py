from enum import Enum
from dataclasses import dataclass
from typing import Optional, Dict, Any, Set
from datetime import datetime, timedelta
import json


class ContainmentMode(Enum):
    NORMAL = "normal"
    MONITORED = "monitored"
    SANDBOX = "sandbox"
    READONLY = "readonly"
    DISABLED = "disabled"


class ContainmentScope(Enum):
    USER = "user"
    TENANT = "tenant"
    ENDPOINT = "endpoint"
    SESSION = "session"


@dataclass
class ContainmentRecord:
    target_id: str
    scope: ContainmentScope
    mode: ContainmentMode
    reason: str
    created_at: datetime
    expires_at: datetime
    metadata: Dict[str, Any]


class ContainmentEngine:
    def __init__(self):
        self.containment_records: Dict[str, ContainmentRecord] = {}
        self.sandbox_state: Dict[str, Dict[str, Any]] = {}
        self.containment_history: list = []

    async def isolate_user_scope(
        self,
        user_id: str,
        reason: str,
        duration_seconds: int = 3600,
    ) -> ContainmentRecord:
        """Isolate user to sandbox mode"""
        record = ContainmentRecord(
            target_id=user_id,
            scope=ContainmentScope.USER,
            mode=ContainmentMode.SANDBOX,
            reason=reason,
            created_at=datetime.utcnow(),
            expires_at=datetime.utcnow() + timedelta(seconds=duration_seconds),
            metadata={
                "original_permissions": None,
                "redirected_endpoints": [],
                "fake_responses_enabled": True,
            },
        )

        self.containment_records[f"user_{user_id}"] = record
        self.sandbox_state[user_id] = {
            "mode": "sandbox",
            "created_at": record.created_at,
            "read_only_collections": [],
            "blocked_operations": ["write", "delete"],
            "fake_db_responses": {},
        }
        self.containment_history.append(record)
        return record

    async def isolate_tenant_scope(
        self,
        tenant_id: str,
        reason: str,
        duration_seconds: int = 7200,
    ) -> ContainmentRecord:
        """Isolate tenant to read-only mode"""
        record = ContainmentRecord(
            target_id=tenant_id,
            scope=ContainmentScope.TENANT,
            mode=ContainmentMode.READONLY,
            reason=reason,
            created_at=datetime.utcnow(),
            expires_at=datetime.utcnow() + timedelta(seconds=duration_seconds),
            metadata={
                "write_operations_blocked": True,
                "delete_operations_blocked": True,
                "allowed_operations": ["read"],
            },
        )

        self.containment_records[f"tenant_{tenant_id}"] = record
        self.sandbox_state[tenant_id] = {
            "mode": "readonly",
            "created_at": record.created_at,
            "blocked_operations": ["write", "delete"],
        }
        self.containment_history.append(record)
        return record

    async def isolate_endpoint(
        self,
        endpoint: str,
        reason: str,
        duration_seconds: int = 1800,
    ) -> ContainmentRecord:
        """Disable or sandbox specific endpoint"""
        record = ContainmentRecord(
            target_id=endpoint,
            scope=ContainmentScope.ENDPOINT,
            mode=ContainmentMode.DISABLED,
            reason=reason,
            created_at=datetime.utcnow(),
            expires_at=datetime.utcnow() + timedelta(seconds=duration_seconds),
            metadata={
                "returns": "503 Service Unavailable",
                "error_message": "Endpoint temporarily unavailable for maintenance",
            },
        )

        self.containment_records[f"endpoint_{endpoint}"] = record
        self.containment_history.append(record)
        return record

    async def sandbox_suspicious_session(
        self,
        user_id: str,
        session_id: str,
        reason: str,
        duration_seconds: int = 900,
    ) -> ContainmentRecord:
        """Sandbox specific session to monitor/block suspicious activity"""
        record = ContainmentRecord(
            target_id=session_id,
            scope=ContainmentScope.SESSION,
            mode=ContainmentMode.SANDBOX,
            reason=reason,
            created_at=datetime.utcnow(),
            expires_at=datetime.utcnow() + timedelta(seconds=duration_seconds),
            metadata={
                "user_id": user_id,
                "log_all_requests": True,
                "block_sensitive_operations": True,
                "sensitive_operations": ["delete", "export", "admin"],
            },
        )

        self.containment_records[f"session_{session_id}"] = record
        self.sandbox_state[session_id] = {
            "mode": "monitored_sandbox",
            "user_id": user_id,
            "created_at": record.created_at,
            "requests_logged": [],
        }
        self.containment_history.append(record)
        return record

    async def apply_read_only_mode(
        self,
        target_id: str,
        scope: ContainmentScope,
        reason: str,
        duration_seconds: int = 3600,
    ) -> ContainmentRecord:
        """Apply strict read-only mode to containment target"""
        record = ContainmentRecord(
            target_id=target_id,
            scope=scope,
            mode=ContainmentMode.READONLY,
            reason=reason,
            created_at=datetime.utcnow(),
            expires_at=datetime.utcnow() + timedelta(seconds=duration_seconds),
            metadata={
                "allow_read": True,
                "block_write": True,
                "block_delete": True,
                "audit_all_reads": True,
            },
        )

        key = f"{scope.value}_{target_id}"
        self.containment_records[key] = record
        self.containment_history.append(record)
        return record

    def get_containment_status(self, target_id: str, scope: ContainmentScope) -> Optional[ContainmentRecord]:
        """Get containment status for a target"""
        self._cleanup_expired_containments()
        key = f"{scope.value}_{target_id}"
        return self.containment_records.get(key)

    def is_user_contained(self, user_id: str) -> bool:
        """Check if user is in containment"""
        record = self.get_containment_status(user_id, ContainmentScope.USER)
        return record is not None

    def is_tenant_contained(self, tenant_id: str) -> bool:
        """Check if tenant is in containment"""
        record = self.get_containment_status(tenant_id, ContainmentScope.TENANT)
        return record is not None

    def is_endpoint_disabled(self, endpoint: str) -> bool:
        """Check if endpoint is disabled"""
        record = self.get_containment_status(endpoint, ContainmentScope.ENDPOINT)
        return record is not None and record.mode == ContainmentMode.DISABLED

    def is_session_sandboxed(self, session_id: str) -> bool:
        """Check if session is in sandbox"""
        record = self.get_containment_status(session_id, ContainmentScope.SESSION)
        return record is not None

    def log_session_request(self, session_id: str, request_data: Dict[str, Any]):
        """Log a request from a sandboxed session"""
        if session_id in self.sandbox_state:
            if "requests_logged" not in self.sandbox_state[session_id]:
                self.sandbox_state[session_id]["requests_logged"] = []
            self.sandbox_state[session_id]["requests_logged"].append({
                "timestamp": datetime.utcnow().isoformat(),
                "data": request_data,
            })

    def get_sandbox_activity(self, session_id: str) -> list:
        """Get logged activity from sandboxed session"""
        return self.sandbox_state.get(session_id, {}).get("requests_logged", [])

    def release_containment(
        self,
        target_id: str,
        scope: ContainmentScope,
        reason: str = "Administrator override",
    ):
        """Release target from containment"""
        key = f"{scope.value}_{target_id}"
        if key in self.containment_records:
            record = self.containment_records[key]
            record.expires_at = datetime.utcnow()
            del self.containment_records[key]

    def _cleanup_expired_containments(self):
        """Remove expired containment records"""
        now = datetime.utcnow()
        keys_to_remove = [
            key for key, record in self.containment_records.items()
            if record.expires_at < now
        ]
        for key in keys_to_remove:
            del self.containment_records[key]

    def get_active_containments(self) -> Dict[str, ContainmentRecord]:
        """Get all active containments"""
        self._cleanup_expired_containments()
        return self.containment_records.copy()

    def get_containment_history(self, limit: int = 20) -> list:
        """Get recent containment events"""
        return self.containment_history[-limit:]


_global_containment_engine = ContainmentEngine()


def get_containment_engine() -> ContainmentEngine:
    return _global_containment_engine
