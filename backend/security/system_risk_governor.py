"""
System Risk Governor — Global System Health Monitoring
═══════════════════════════════════════════════════════════════════

Purpose:
  Monitor overall system health and autonomy safety.
  
  Calculates:
    • Global system risk score
    • Tenant risk distribution
    • False positive/negative rates
    • Autonomy safety score
"""

from dataclasses import dataclass
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)


@dataclass
class SystemHealthMetrics:
    global_system_risk: float
    false_positive_rate: float
    false_negative_rate: float
    autonomy_safety_score: float
    tenant_risk_distribution: Dict[str, float]
    enforcement_effectiveness: float
    response_accuracy: float
    timestamp: datetime


class SystemRiskGovernor:
    """
    Monitor global system health and adjust autonomy level.
    """

    def __init__(self):
        self.global_risk_score = 0.0
        self.autonomy_level = 1.0
        self.false_positives = 0
        self.false_negatives = 0
        self.total_decisions = 0
        self.tenant_risk_scores: Dict[str, float] = {}
        self.health_history: List[SystemHealthMetrics] = []
        self.autonomy_adjustment_history: List[tuple] = []

    async def compute_global_risk(
        self,
        active_threats: int,
        blocked_users: int,
        isolated_tenants: int,
        s2_6_anomalies: int,
        attack_graph_chains: int,
        correlation_signals: int,
    ) -> float:
        """
        Compute global system risk score (0-100).
        
        Factors:
          • Active threats
          • Blocked users
          • Isolated tenants
          • Anomalies detected
          • Attack chains
          • Correlation signals
        """
        threat_factor = min(active_threats * 5, 25)
        user_block_factor = min(blocked_users / 100, 20)
        tenant_isolation_factor = isolated_tenants * 15
        anomaly_factor = min(s2_6_anomalies / 10, 15)
        graph_factor = min(attack_graph_chains * 2, 15)
        correlation_factor = min(correlation_signals / 5, 10)

        self.global_risk_score = (
            threat_factor
            + user_block_factor
            + tenant_isolation_factor
            + anomaly_factor
            + graph_factor
            + correlation_factor
        )

        return min(self.global_risk_score, 100.0)

    def compute_false_positive_rate(
        self,
        false_positives: int,
        total_decisions: int,
    ) -> float:
        """Compute false positive rate"""
        if total_decisions == 0:
            return 0.0

        self.false_positives = false_positives
        self.total_decisions = total_decisions

        rate = false_positives / total_decisions
        return min(rate, 1.0)

    def compute_false_negative_rate(
        self,
        false_negatives: int,
        total_threats: int,
    ) -> float:
        """Compute false negative rate"""
        if total_threats == 0:
            return 0.0

        self.false_negatives = false_negatives
        rate = false_negatives / total_threats
        return min(rate, 1.0)

    async def compute_autonomy_safety_score(
        self,
        false_positive_rate: float,
        false_negative_rate: float,
        confidence_scores: List[float],
        governor_overrides: int,
    ) -> float:
        """
        Compute autonomy safety score (0-100).
        
        Higher = safer to run autonomous mode.
        Lower = need more human-in-the-loop.
        """
        base_score = 100.0

        fp_penalty = false_positive_rate * 40
        fn_penalty = false_negative_rate * 30
        base_score -= fp_penalty + fn_penalty

        avg_confidence = sum(confidence_scores) / len(confidence_scores) if confidence_scores else 0.5
        confidence_bonus = avg_confidence * 20
        base_score += confidence_bonus

        override_penalty = governor_overrides * 5
        base_score -= override_penalty

        return max(min(base_score, 100.0), 0.0)

    async def adjust_autonomy_level(self, safety_score: float):
        """
        Adjust system autonomy level based on safety score.
        
        Rules:
          safety > 85  → autonomy level = 1.0 (full autonomous)
          safety 70-85 → autonomy level = 0.8 (high autonomous)
          safety 50-70 → autonomy level = 0.5 (mixed, SOC review required)
          safety < 50  → autonomy level = 0.2 (low, mostly manual)
        """
        old_level = self.autonomy_level

        if safety_score >= 85:
            self.autonomy_level = 1.0
            mode = "FULL_AUTONOMOUS"
        elif safety_score >= 70:
            self.autonomy_level = 0.8
            mode = "HIGH_AUTONOMOUS"
        elif safety_score >= 50:
            self.autonomy_level = 0.5
            mode = "MIXED_MODE"
        else:
            self.autonomy_level = 0.2
            mode = "LOW_AUTONOMOUS (HUMAN-HEAVY)"

        if self.autonomy_level != old_level:
            logger.warning(
                f"[RISK_GOVERNOR] Autonomy level adjusted: "
                f"{old_level} → {self.autonomy_level} ({mode})"
            )
            self.autonomy_adjustment_history.append(
                (datetime.utcnow(), old_level, self.autonomy_level, mode)
            )

            from security.soc_event_stream import get_soc_stream
            stream = get_soc_stream()
            stream.ingest_event(
                event_type="autonomy_level_adjusted",
                user_id="system",
                severity="medium",
                data={
                    "old_level": old_level,
                    "new_level": self.autonomy_level,
                    "mode": mode,
                    "safety_score": safety_score,
                },
            )

    async def update_tenant_risk(self, tenant_id: str, risk_score: float):
        """Update risk score for specific tenant"""
        self.tenant_risk_scores[tenant_id] = risk_score

    async def get_tenant_risk_distribution(self) -> Dict[str, float]:
        """Get risk distribution across tenants"""
        return self.tenant_risk_scores.copy()

    async def compute_enforcement_effectiveness(
        self,
        total_attacks_detected: int,
        total_attacks_blocked: int,
    ) -> float:
        """Compute how effective enforcement layer (S2.5) is"""
        if total_attacks_detected == 0:
            return 1.0

        return min(total_attacks_blocked / total_attacks_detected, 1.0)

    async def compute_response_accuracy(
        self,
        appropriate_responses: int,
        total_responses: int,
    ) -> float:
        """Compute how accurate S2.8 response decisions are"""
        if total_responses == 0:
            return 1.0

        return min(appropriate_responses / total_responses, 1.0)

    async def compute_system_health(
        self,
        metrics: Dict[str, Any],
    ) -> SystemHealthMetrics:
        """
        Compute comprehensive system health metrics.
        
        Args:
            metrics: Dict containing all system metrics
        
        Returns:
            SystemHealthMetrics with all health indicators
        """
        global_risk = await self.compute_global_risk(
            metrics.get("active_threats", 0),
            metrics.get("blocked_users", 0),
            metrics.get("isolated_tenants", 0),
            metrics.get("s2_6_anomalies", 0),
            metrics.get("attack_graph_chains", 0),
            metrics.get("correlation_signals", 0),
        )

        false_positive_rate = self.compute_false_positive_rate(
            metrics.get("false_positives", 0),
            metrics.get("total_decisions", 1),
        )

        false_negative_rate = self.compute_false_negative_rate(
            metrics.get("false_negatives", 0),
            metrics.get("total_threats", 1),
        )

        autonomy_safety = await self.compute_autonomy_safety_score(
            false_positive_rate,
            false_negative_rate,
            metrics.get("confidence_scores", []),
            metrics.get("governor_overrides", 0),
        )

        await self.adjust_autonomy_level(autonomy_safety)

        enforcement_effectiveness = await self.compute_enforcement_effectiveness(
            metrics.get("attacks_detected", 0),
            metrics.get("attacks_blocked", 0),
        )

        response_accuracy = await self.compute_response_accuracy(
            metrics.get("appropriate_responses", 0),
            metrics.get("total_responses", 1),
        )

        health = SystemHealthMetrics(
            global_system_risk=global_risk,
            false_positive_rate=false_positive_rate,
            false_negative_rate=false_negative_rate,
            autonomy_safety_score=autonomy_safety,
            tenant_risk_distribution=self.tenant_risk_scores.copy(),
            enforcement_effectiveness=enforcement_effectiveness,
            response_accuracy=response_accuracy,
            timestamp=datetime.utcnow(),
        )

        self.health_history.append(health)
        return health

    def get_current_health(self) -> Dict[str, Any]:
        """Get current system health snapshot"""
        if self.health_history:
            latest = self.health_history[-1]
            return {
                "global_system_risk": latest.global_system_risk,
                "autonomy_level": self.autonomy_level,
                "autonomy_safety_score": latest.autonomy_safety_score,
                "false_positive_rate": latest.false_positive_rate,
                "false_negative_rate": latest.false_negative_rate,
                "enforcement_effectiveness": latest.enforcement_effectiveness,
                "response_accuracy": latest.response_accuracy,
                "timestamp": latest.timestamp.isoformat(),
            }
        return {}

    def get_health_history(self, limit: int = 20) -> List[Dict[str, Any]]:
        """Get health history"""
        return [
            {
                "global_risk": h.global_system_risk,
                "autonomy_safety": h.autonomy_safety_score,
                "false_positive_rate": h.false_positive_rate,
                "false_negative_rate": h.false_negative_rate,
                "timestamp": h.timestamp.isoformat(),
            }
            for h in self.health_history[-limit:]
        ]

    def get_autonomy_history(self) -> List[Dict[str, Any]]:
        """Get autonomy level adjustment history"""
        return [
            {
                "timestamp": ts.isoformat(),
                "old_level": old,
                "new_level": new,
                "mode": mode,
            }
            for ts, old, new, mode in self.autonomy_adjustment_history
        ]


_global_risk_governor = SystemRiskGovernor()


def get_system_risk_governor() -> SystemRiskGovernor:
    return _global_risk_governor
