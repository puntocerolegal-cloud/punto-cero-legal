"""
Security Governor Engine — Global Safety Limits & Autonomy Control
═══════════════════════════════════════════════════════════════════

Purpose:
  Validate and control S2.8 autonomous actions in real-time.
  
  This engine prevents overreaction and enforces global safety limits.
  It is the "safety brain" of the autonomous system.
  
  NO action from S2.8 executes without Governor approval.
"""

from enum import Enum
from dataclasses import dataclass
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)


class ActionApproval(Enum):
    APPROVED = "approved"
    DOWNGRADED = "downgraded"
    REJECTED = "rejected"
    DEFERRED = "deferred"


@dataclass
class GovernorDecision:
    original_action_type: str
    approval_status: ActionApproval
    final_action_type: str
    reason: str
    global_limits_exceeded: List[str]
    timestamp: datetime
    metadata: Dict[str, Any]


class SecurityGovernorEngine:
    """
    Global safety limits and autonomy control for S2.8.
    
    Rules:
      - Max users isolated per minute
      - Max tenants in lockdown
      - Max blocks per second
      - Max global throttle rate
      - Max risk threshold override
    """

    def __init__(self):
        self.action_counts = {
            "isolate_user": 0,
            "block_user": 0,
            "quarantine_tenant": 0,
            "rate_limit": 0,
            "block_ip": 0,
            "total_actions": 0,
        }
        self.time_windows = {}
        self.global_limits = {
            "max_users_isolated_per_minute": 10,
            "max_tenants_in_lockdown": 3,
            "max_blocks_per_second": 20,
            "max_rate_limits_per_minute": 100,
            "max_ips_blocked_per_minute": 5,
            "max_autonomous_actions_per_minute": 50,
        }
        self.decision_history: List[GovernorDecision] = []
        self.last_action_time = datetime.utcnow()

    def validate_action(
        self,
        action_type: str,
        target: str,
        risk_score: float,
        context: Optional[Dict[str, Any]] = None,
    ) -> GovernorDecision:
        """
        Validate and potentially downgrade/reject S2.8 action.
        
        Args:
            action_type: Type of action (block_user, isolate_user, etc.)
            target: Target of action (user_id, tenant_id, ip, etc.)
            risk_score: Current risk score driving the action
            context: Additional context
        
        Returns:
            GovernorDecision with final action approval
        """
        now = datetime.utcnow()
        exceeded_limits = self._check_global_limits(action_type)
        
        decision = GovernorDecision(
            original_action_type=action_type,
            approval_status=ActionApproval.APPROVED,
            final_action_type=action_type,
            reason="Action approved",
            global_limits_exceeded=exceeded_limits,
            timestamp=now,
            metadata={
                "target": target,
                "risk_score": risk_score,
                "action_count_before": self.action_counts.get(action_type, 0),
            },
        )

        if exceeded_limits:
            decision = self._handle_limit_exceeded(
                action_type, target, risk_score, exceeded_limits
            )
        
        self._record_action(action_type)
        self.decision_history.append(decision)
        
        logger.info(
            f"[GOVERNOR] Action validation: {action_type} → {decision.final_action_type} "
            f"(approval: {decision.approval_status.value})"
        )
        
        return decision

    def _check_global_limits(self, action_type: str) -> List[str]:
        """Check which global limits would be exceeded"""
        exceeded = []
        now = datetime.utcnow()

        if action_type == "isolate_user":
            count = self._count_actions_in_window("isolate_user", minutes=1)
            if count >= self.global_limits["max_users_isolated_per_minute"]:
                exceeded.append("max_users_isolated_per_minute")

        elif action_type == "quarantine_tenant":
            count = self._count_actions_in_window("quarantine_tenant", minutes=5)
            if count >= self.global_limits["max_tenants_in_lockdown"]:
                exceeded.append("max_tenants_in_lockdown")

        elif action_type == "block_user":
            count = self._count_actions_in_window("block_user", seconds=60)
            if count >= self.global_limits["max_blocks_per_second"] * 60:
                exceeded.append("max_blocks_per_second")

        elif action_type == "rate_limit":
            count = self._count_actions_in_window("rate_limit", minutes=1)
            if count >= self.global_limits["max_rate_limits_per_minute"]:
                exceeded.append("max_rate_limits_per_minute")

        elif action_type == "block_ip":
            count = self._count_actions_in_window("block_ip", minutes=1)
            if count >= self.global_limits["max_ips_blocked_per_minute"]:
                exceeded.append("max_ips_blocked_per_minute")

        total_count = self._count_total_actions_in_window(minutes=1)
        if total_count >= self.global_limits["max_autonomous_actions_per_minute"]:
            exceeded.append("max_autonomous_actions_per_minute")

        return exceeded

    def _handle_limit_exceeded(
        self,
        action_type: str,
        target: str,
        risk_score: float,
        exceeded_limits: List[str],
    ) -> GovernorDecision:
        """Handle case where limits are exceeded"""
        now = datetime.utcnow()

        if risk_score >= 95:
            return GovernorDecision(
                original_action_type=action_type,
                approval_status=ActionApproval.APPROVED,
                final_action_type=action_type,
                reason=f"CRITICAL risk ({risk_score}) overrides limits: {exceeded_limits}",
                global_limits_exceeded=exceeded_limits,
                timestamp=now,
                metadata={"override_reason": "critical_risk"},
            )

        downgrade_map = {
            "isolate_user": "block_user",
            "quarantine_tenant": "rate_limit",
            "block_user": "rate_limit",
            "block_ip": "monitor",
        }

        downgraded_action = downgrade_map.get(action_type, "monitor")

        return GovernorDecision(
            original_action_type=action_type,
            approval_status=ActionApproval.DOWNGRADED,
            final_action_type=downgraded_action,
            reason=f"Limits exceeded ({', '.join(exceeded_limits)}): downgraded from {action_type} to {downgraded_action}",
            global_limits_exceeded=exceeded_limits,
            timestamp=now,
            metadata={
                "original_risk_score": risk_score,
                "downgrade_reason": "global_limits_exceeded",
            },
        )

    def approve_or_reject_decision(
        self,
        decision_type: str,
        risk_score: float,
        confidence: float,
        target_type: str,
    ) -> bool:
        """
        Higher-level decision approval.
        
        Some decisions need governor approval beyond limit checking.
        """
        if confidence < 0.6:
            logger.warning(
                f"[GOVERNOR] Low confidence decision rejected: {decision_type} "
                f"confidence={confidence}"
            )
            return False

        if decision_type == "ISOLATE_TENANT" and risk_score < 90:
            logger.warning(
                f"[GOVERNOR] ISOLATE_TENANT rejected: insufficient risk ({risk_score})"
            )
            return False

        return True

    def _count_actions_in_window(
        self,
        action_type: str,
        minutes: int = 1,
        seconds: int = 0,
    ) -> int:
        """Count actions of type within time window"""
        duration = timedelta(minutes=minutes, seconds=seconds)
        now = datetime.utcnow()
        cutoff = now - duration

        if action_type not in self.time_windows:
            self.time_windows[action_type] = []

        self.time_windows[action_type] = [
            ts for ts in self.time_windows[action_type]
            if ts > cutoff
        ]

        return len(self.time_windows[action_type])

    def _count_total_actions_in_window(self, minutes: int = 1) -> int:
        """Count all actions within time window"""
        total = 0
        for action_type in self.action_counts:
            total += self._count_actions_in_window(action_type, minutes=minutes)
        return total

    def _record_action(self, action_type: str):
        """Record action for limit tracking"""
        self.action_counts[action_type] = self.action_counts.get(action_type, 0) + 1
        self.action_counts["total_actions"] += 1

        if action_type not in self.time_windows:
            self.time_windows[action_type] = []

        self.time_windows[action_type].append(datetime.utcnow())
        self.last_action_time = datetime.utcnow()

    def update_global_limits(self, new_limits: Dict[str, int]):
        """Update global safety limits"""
        for key, value in new_limits.items():
            if key in self.global_limits:
                self.global_limits[key] = value
                logger.info(f"[GOVERNOR] Updated limit {key} = {value}")

    def get_current_status(self) -> Dict[str, Any]:
        """Get current governor status"""
        return {
            "action_counts": self.action_counts.copy(),
            "global_limits": self.global_limits.copy(),
            "last_action_time": self.last_action_time.isoformat(),
            "pending_limits_check": {
                key: self._count_actions_in_window(key, minutes=1)
                for key in self.action_counts if key != "total_actions"
            },
        }

    def get_decision_history(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Get recent governor decisions"""
        decisions = self.decision_history[-limit:]
        return [
            {
                "original": d.original_action_type,
                "final": d.final_action_type,
                "status": d.approval_status.value,
                "reason": d.reason,
                "timestamp": d.timestamp.isoformat(),
            }
            for d in decisions
        ]

    def reset_counters(self):
        """Reset action counters (for testing)"""
        for key in self.action_counts:
            self.action_counts[key] = 0
        self.time_windows.clear()


_global_governor_engine = SecurityGovernorEngine()


def get_security_governor() -> SecurityGovernorEngine:
    return _global_governor_engine
