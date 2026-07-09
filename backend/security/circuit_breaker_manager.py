"""
Circuit Breaker Manager — Prevent System Self-Destruction
═══════════════════════════════════════════════════════════════════

Purpose:
  Detect when system is in danger of self-locking and activate
  circuit breakers to prevent cascading failures.
  
  States:
    NORMAL → WARNING → ACTIVE_BREAK → EMERGENCY_LOCKDOWN
"""

from enum import Enum
from dataclasses import dataclass
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)


class CircuitBreakerState(Enum):
    NORMAL = "normal"
    WARNING = "warning"
    ACTIVE_BREAK = "active_break"
    EMERGENCY_LOCKDOWN = "emergency_lockdown"


class BreakReason(Enum):
    EXCESSIVE_BLOCKS = "excessive_blocks"
    TENANT_MASS_ISOLATION = "tenant_mass_isolation"
    FALSE_POSITIVE_SPIKE = "false_positive_spike"
    ANOMALY_ENGINE_INSTABILITY = "anomaly_engine_instability"
    SOC_OVERLOAD = "soc_overload"
    EXCESSIVE_RATE_LIMITING = "excessive_rate_limiting"
    CASCADING_FAILURES = "cascading_failures"


@dataclass
class CircuitBreakerTrigger:
    reason: BreakReason
    severity: str
    data: Dict[str, Any]
    timestamp: datetime
    auto_reset_time: Optional[datetime] = None


class CircuitBreakerManager:
    """
    Monitor system health and activate circuit breakers.
    
    Prevents:
      • Too many users being blocked at once
      • Tenant mass isolation cascades
      • False positive spikes
      • System overload
    """

    def __init__(self):
        self.state = CircuitBreakerState.NORMAL
        self.active_breaks: Dict[str, CircuitBreakerTrigger] = {}
        self.break_history: List[CircuitBreakerTrigger] = []
        self.thresholds = {
            "max_blocked_users_percentage": 5,
            "max_blocked_ips": 100,
            "max_isolated_tenants": 3,
            "false_positive_rate_threshold": 0.15,
            "soc_event_backlog_threshold": 10000,
            "anomaly_instability_threshold": 0.8,
        }
        self.health_metrics = {
            "blocked_users": 0,
            "blocked_ips": 0,
            "isolated_tenants": 0,
            "false_positive_rate": 0.0,
            "soc_event_backlog": 0,
            "anomaly_engine_stability": 1.0,
        }
        self.auto_reset_enabled = True

    async def check_system_health(
        self,
        metrics: Optional[Dict[str, Any]] = None,
    ) -> CircuitBreakerState:
        """
        Check system health and update circuit breaker state.
        
        Args:
            metrics: Current system metrics
        
        Returns:
            Current circuit breaker state
        """
        if metrics:
            self.health_metrics.update(metrics)

        new_state = await self._evaluate_state()

        if new_state != self.state:
            logger.warning(
                f"[CIRCUIT_BREAKER] State transition: {self.state.value} → {new_state.value}"
            )
            self.state = new_state

        await self._apply_state_effects()
        return self.state

    async def _evaluate_state(self) -> CircuitBreakerState:
        """Evaluate what state system should be in"""
        critical_breaks = 0
        warning_breaks = 0

        if self.health_metrics["blocked_users"] > (total_users := 10000) * (
            self.thresholds["max_blocked_users_percentage"] / 100
        ):
            await self._trigger_break(
                BreakReason.EXCESSIVE_BLOCKS,
                "critical",
                {"blocked_users": self.health_metrics["blocked_users"]},
            )
            critical_breaks += 1

        if self.health_metrics["isolated_tenants"] >= self.thresholds["max_isolated_tenants"]:
            await self._trigger_break(
                BreakReason.TENANT_MASS_ISOLATION,
                "critical",
                {"isolated_tenants": self.health_metrics["isolated_tenants"]},
            )
            critical_breaks += 1

        if self.health_metrics["false_positive_rate"] > self.thresholds["false_positive_rate_threshold"]:
            await self._trigger_break(
                BreakReason.FALSE_POSITIVE_SPIKE,
                "warning",
                {"false_positive_rate": self.health_metrics["false_positive_rate"]},
            )
            warning_breaks += 1

        if (
            self.health_metrics["soc_event_backlog"]
            > self.thresholds["soc_event_backlog_threshold"]
        ):
            await self._trigger_break(
                BreakReason.SOC_OVERLOAD,
                "warning",
                {"soc_backlog": self.health_metrics["soc_event_backlog"]},
            )
            warning_breaks += 1

        if (
            self.health_metrics["anomaly_engine_stability"]
            < self.thresholds["anomaly_instability_threshold"]
        ):
            await self._trigger_break(
                BreakReason.ANOMALY_ENGINE_INSTABILITY,
                "critical",
                {"stability": self.health_metrics["anomaly_engine_stability"]},
            )
            critical_breaks += 1

        if critical_breaks >= 2:
            return CircuitBreakerState.EMERGENCY_LOCKDOWN
        elif critical_breaks >= 1 or warning_breaks >= 2:
            return CircuitBreakerState.ACTIVE_BREAK
        elif warning_breaks >= 1:
            return CircuitBreakerState.WARNING
        else:
            return CircuitBreakerState.NORMAL

    async def _trigger_break(
        self,
        reason: BreakReason,
        severity: str,
        data: Dict[str, Any],
    ):
        """Trigger a circuit break"""
        now = datetime.utcnow()

        auto_reset_time = None
        if self.auto_reset_enabled:
            if severity == "critical":
                auto_reset_time = now + timedelta(minutes=30)
            else:
                auto_reset_time = now + timedelta(minutes=10)

        trigger = CircuitBreakerTrigger(
            reason=reason,
            severity=severity,
            data=data,
            timestamp=now,
            auto_reset_time=auto_reset_time,
        )

        self.active_breaks[reason.value] = trigger
        self.break_history.append(trigger)

        logger.critical(
            f"[CIRCUIT_BREAKER] BREAK TRIGGERED: {reason.value} "
            f"(severity: {severity})"
        )

        from security.soc_event_stream import get_soc_stream
        stream = get_soc_stream()
        stream.ingest_event(
            event_type="circuit_breaker_triggered",
            user_id="system",
            severity="critical" if severity == "critical" else "high",
            data={"reason": reason.value, "metrics": data},
        )

    async def _apply_state_effects(self):
        """Apply effects based on current state"""
        if self.state == CircuitBreakerState.ACTIVE_BREAK:
            logger.warning("[CIRCUIT_BREAKER] ACTIVE_BREAK: Disabling S2.8 autonomous blocking")
            from security.autonomous_decision_engine import get_autonomous_decision_engine
            decision_engine = get_autonomous_decision_engine()
            decision_engine.EXECUTION_MODE = "monitor_only"

        elif self.state == CircuitBreakerState.EMERGENCY_LOCKDOWN:
            logger.critical(
                "[CIRCUIT_BREAKER] EMERGENCY_LOCKDOWN: System in fail-safe mode"
            )
            from security.fail_safe_mode import get_fail_safe_manager
            manager = get_fail_safe_manager()
            await manager.enter_fail_safe(
                reason="Circuit breaker: emergency lockdown triggered"
            )

        elif self.state == CircuitBreakerState.NORMAL:
            logger.info("[CIRCUIT_BREAKER] Returning to NORMAL operations")
            from security.autonomous_decision_engine import get_autonomous_decision_engine
            decision_engine = get_autonomous_decision_engine()
            decision_engine.EXECUTION_MODE = "full"

    async def reset_break(self, reason: BreakReason) -> bool:
        """Manually reset a circuit break"""
        if reason.value in self.active_breaks:
            del self.active_breaks[reason.value]
            logger.info(f"[CIRCUIT_BREAKER] Break reset: {reason.value}")

            new_state = await self._evaluate_state()
            await self.check_system_health()
            return True

        return False

    async def auto_reset_expired_breaks(self):
        """Auto-reset breaks that have expired"""
        now = datetime.utcnow()
        expired_breaks = []

        for reason_str, trigger in self.active_breaks.items():
            if (
                trigger.auto_reset_time
                and trigger.auto_reset_time < now
            ):
                expired_breaks.append(BreakReason(reason_str))

        for reason in expired_breaks:
            logger.info(f"[CIRCUIT_BREAKER] Auto-reset expired: {reason.value}")
            await self.reset_break(reason)

    def update_thresholds(self, new_thresholds: Dict[str, Any]):
        """Update circuit breaker thresholds"""
        for key, value in new_thresholds.items():
            if key in self.thresholds:
                self.thresholds[key] = value
                logger.info(f"[CIRCUIT_BREAKER] Updated threshold {key} = {value}")

    def get_status(self) -> Dict[str, Any]:
        """Get circuit breaker status"""
        return {
            "state": self.state.value,
            "active_breaks": [
                {
                    "reason": reason,
                    "severity": trigger.severity,
                    "triggered_at": trigger.timestamp.isoformat(),
                    "auto_reset_at": trigger.auto_reset_time.isoformat()
                    if trigger.auto_reset_time
                    else None,
                }
                for reason, trigger in self.active_breaks.items()
            ],
            "health_metrics": self.health_metrics.copy(),
            "thresholds": self.thresholds.copy(),
        }

    def get_break_history(self, limit: int = 20) -> List[Dict[str, Any]]:
        """Get recent circuit breaks"""
        breaks = self.break_history[-limit:]
        return [
            {
                "reason": b.reason.value,
                "severity": b.severity,
                "data": b.data,
                "timestamp": b.timestamp.isoformat(),
            }
            for b in breaks
        ]


_global_circuit_breaker = CircuitBreakerManager()


def get_circuit_breaker_manager() -> CircuitBreakerManager:
    return _global_circuit_breaker
