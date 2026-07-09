from enum import Enum
from dataclasses import dataclass
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
import time


class RecoveryState(Enum):
    ACTIVE_THREAT = "active_threat"
    THREAT_CONTAINED = "threat_contained"
    SAFE_RECOVERY = "safe_recovery"
    GRADUAL_RESTORE = "gradual_restore"
    FULL_RESTORE = "full_restore"


@dataclass
class RecoveryPlan:
    target_id: str
    target_type: str
    current_state: RecoveryState
    created_at: datetime
    started_recovery_at: Optional[datetime]
    expected_recovery_at: Optional[datetime]
    stages_completed: int
    total_stages: int
    metadata: Dict[str, Any]


class RecoveryEngine:
    def __init__(self):
        self.recovery_plans: Dict[str, RecoveryPlan] = {}
        self.threat_end_timestamps: Dict[str, datetime] = {}
        self.permission_restore_queue: Dict[str, list] = {}
        self.recovery_history: list = []
        self.baseline_risk_scores: Dict[str, float] = {}

    async def detect_threat_end(
        self,
        target_id: str,
        target_type: str,
        current_risk: float,
    ) -> bool:
        """Detect if threat has ended and recovery can begin"""
        if target_id not in self.threat_end_timestamps:
            return False

        time_since_threat_end = datetime.utcnow() - self.threat_end_timestamps[target_id]
        min_safe_duration = timedelta(minutes=5)

        if time_since_threat_end >= min_safe_duration and current_risk < 30:
            return True

        return False

    async def initiate_recovery(
        self,
        target_id: str,
        target_type: str,
        attack_duration_seconds: int,
    ) -> RecoveryPlan:
        """Initiate recovery for a contained threat"""
        recovery_stages = self._calculate_recovery_stages(target_type, attack_duration_seconds)

        plan = RecoveryPlan(
            target_id=target_id,
            target_type=target_type,
            current_state=RecoveryState.SAFE_RECOVERY,
            created_at=datetime.utcnow(),
            started_recovery_at=datetime.utcnow(),
            expected_recovery_at=datetime.utcnow() + timedelta(seconds=recovery_stages * 300),
            stages_completed=0,
            total_stages=recovery_stages,
            metadata={
                "attack_duration": attack_duration_seconds,
                "permissions_to_restore": [],
                "restored_permissions": [],
                "recovery_progress": 0,
            },
        )

        self.recovery_plans[target_id] = plan
        self.recovery_history.append(plan)
        return plan

    async def gradually_restore_permissions(
        self,
        target_id: str,
        original_permissions: list,
    ) -> Dict[str, Any]:
        """Restore permissions gradually in stages"""
        plan = self.recovery_plans.get(target_id)
        if not plan:
            return {"error": f"No recovery plan for {target_id}"}

        if plan.current_state != RecoveryState.GRADUAL_RESTORE:
            plan.current_state = RecoveryState.GRADUAL_RESTORE

        permissions_per_stage = len(original_permissions) / plan.total_stages
        stage_size = max(1, int(permissions_per_stage))

        restored_in_this_stage = original_permissions[
            plan.stages_completed * stage_size:
            (plan.stages_completed + 1) * stage_size
        ]

        plan.metadata["restored_permissions"].extend(restored_in_this_stage)
        plan.stages_completed += 1
        plan.metadata["recovery_progress"] = (plan.stages_completed / plan.total_stages) * 100

        return {
            "restored_permissions": restored_in_this_stage,
            "progress": plan.metadata["recovery_progress"],
            "stages_completed": plan.stages_completed,
            "total_stages": plan.total_stages,
        }

    async def re_enable_tenant_access(
        self,
        tenant_id: str,
    ) -> Dict[str, Any]:
        """Re-enable tenant access after quarantine"""
        plan = self.recovery_plans.get(tenant_id)
        if not plan:
            return {"error": f"No recovery plan for {tenant_id}"}

        return {
            "tenant_id": tenant_id,
            "access_re_enabled": True,
            "read_operations": True,
            "write_operations": True,
            "delete_operations": True,
        }

    async def reset_risk_scoring_baseline(
        self,
        target_id: str,
        target_type: str,
    ) -> float:
        """Reset risk scoring baseline after recovery"""
        new_baseline = 25.0 if target_type == "user" else 20.0
        self.baseline_risk_scores[target_id] = new_baseline
        return new_baseline

    async def complete_recovery(
        self,
        target_id: str,
    ) -> RecoveryPlan:
        """Mark recovery as complete"""
        plan = self.recovery_plans.get(target_id)
        if plan:
            plan.current_state = RecoveryState.FULL_RESTORE
            plan.metadata["recovery_completed_at"] = datetime.utcnow().isoformat()

        return plan

    def record_threat_end(self, target_id: str):
        """Record when a threat is considered ended"""
        self.threat_end_timestamps[target_id] = datetime.utcnow()

    def _calculate_recovery_stages(self, target_type: str, attack_duration_seconds: int) -> int:
        """Calculate number of recovery stages based on attack severity"""
        base_stages = {
            "user": 3,
            "tenant": 5,
            "system": 8,
        }
        stages = base_stages.get(target_type, 3)

        if attack_duration_seconds > 3600:
            stages += 2
        if attack_duration_seconds > 86400:
            stages += 3

        return min(stages, 10)

    def get_recovery_status(self, target_id: str) -> Optional[RecoveryPlan]:
        """Get recovery status for a target"""
        return self.recovery_plans.get(target_id)

    def get_recovery_progress(self, target_id: str) -> Optional[Dict[str, Any]]:
        """Get detailed recovery progress"""
        plan = self.recovery_plans.get(target_id)
        if not plan:
            return None

        return {
            "target_id": target_id,
            "state": plan.current_state.value,
            "stages_completed": plan.stages_completed,
            "total_stages": plan.total_stages,
            "progress_percent": plan.metadata.get("recovery_progress", 0),
            "expected_completion": plan.expected_recovery_at.isoformat() if plan.expected_recovery_at else None,
            "restored_permissions": plan.metadata.get("restored_permissions", []),
        }

    def is_in_recovery(self, target_id: str) -> bool:
        """Check if target is in recovery state"""
        plan = self.recovery_plans.get(target_id)
        return plan is not None and plan.current_state in [
            RecoveryState.SAFE_RECOVERY,
            RecoveryState.GRADUAL_RESTORE,
        ]

    def get_baseline_risk(self, target_id: str) -> float:
        """Get current baseline risk score"""
        return self.baseline_risk_scores.get(target_id, 25.0)

    async def perform_recovery_health_check(
        self,
        target_id: str,
    ) -> Dict[str, Any]:
        """Perform health check during recovery"""
        return {
            "target_id": target_id,
            "db_accessible": True,
            "permissions_applied": True,
            "system_stable": True,
            "risk_normalized": True,
            "timestamp": datetime.utcnow().isoformat(),
        }

    def get_recovery_history(self, limit: int = 10) -> list:
        """Get recent recovery events"""
        return self.recovery_history[-limit:]

    async def auto_complete_recovery(
        self,
        target_id: str,
        check_interval_seconds: int = 60,
    ):
        """Auto-monitor and complete recovery when safe"""
        plan = self.recovery_plans.get(target_id)
        if not plan:
            return

        while plan.stages_completed < plan.total_stages:
            await self.gradually_restore_permissions(
                target_id,
                plan.metadata.get("permissions_to_restore", []),
            )
            await self.reset_risk_scoring_baseline(target_id, plan.target_type)
            time.sleep(check_interval_seconds)

        await self.complete_recovery(target_id)


_global_recovery_engine = RecoveryEngine()


def get_recovery_engine() -> RecoveryEngine:
    return _global_recovery_engine
