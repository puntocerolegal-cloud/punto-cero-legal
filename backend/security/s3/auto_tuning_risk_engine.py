"""
Auto-Tuning Risk Engine — Dynamically Adjust Risk Scoring
═══════════════════════════════════════════════════════════════════

Purpose:
  Automatically adjust risk scoring parameters based on
  real-world attack patterns and detection effectiveness.
"""

from dataclasses import dataclass
from typing import Dict, Any, Optional, List
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


@dataclass
class RiskTuning:
    parameter_name: str
    old_value: float
    new_value: float
    reason: str
    effectiveness_improvement: float
    timestamp: datetime


class AutoTuningRiskEngine:
    """
    Automatically tune risk scoring system.
    """

    def __init__(self):
        self.behavioral_baseline_weights = {
            "request_rate": 0.25,
            "resource_distribution": 0.20,
            "action_entropy": 0.20,
            "tenant_consistency": 0.20,
            "trust_score": 0.15,
        }
        self.anomaly_thresholds = {
            "behavioral_deviation": 70.0,
            "attack_graph_severity": 0.7,
            "correlation_threshold": 0.6,
        }
        self.adaptive_multipliers = {
            "time_of_day": 1.0,
            "user_history": 1.0,
            "tenant_risk_level": 1.0,
            "global_threat_level": 1.0,
        }
        self.tuning_history: List[RiskTuning] = []

    async def adjust_behavioral_weights(
        self,
        detection_effectiveness: Dict[str, float],
    ) -> Optional[RiskTuning]:
        """
        Adjust behavioral analysis weights based on effectiveness.
        
        If request_rate detection is very effective: increase its weight
        If resource_distribution is weak: decrease its weight
        """
        for component, effectiveness in detection_effectiveness.items():
            if component not in self.behavioral_baseline_weights:
                continue

            current_weight = self.behavioral_baseline_weights[component]

            if effectiveness < 0.70:
                new_weight = current_weight * 0.85
            elif effectiveness > 0.95:
                new_weight = current_weight * 1.10
            else:
                new_weight = current_weight * (effectiveness / 0.85)

            if abs(new_weight - current_weight) > 0.02:
                tuning = RiskTuning(
                    parameter_name=f"behavioral_weight_{component}",
                    old_value=current_weight,
                    new_value=new_weight,
                    reason=f"Detection effectiveness: {effectiveness*100:.1f}%",
                    effectiveness_improvement=effectiveness,
                    timestamp=datetime.utcnow(),
                )

                self.behavioral_baseline_weights[component] = new_weight
                self.tuning_history.append(tuning)

                logger.info(
                    f"[AUTO_TUNE] Behavioral weight adjusted: {component} "
                    f"{current_weight:.3f} → {new_weight:.3f}"
                )

                return tuning

        return None

    async def adjust_anomaly_thresholds(
        self,
        anomaly_accuracy: Dict[str, float],
        attack_false_negatives: int,
    ) -> Optional[RiskTuning]:
        """
        Adjust anomaly detection thresholds.
        
        If we're missing attacks: lower thresholds
        If false positives high: raise thresholds
        """
        if attack_false_negatives > 2:
            behavioral_threshold = self.anomaly_thresholds.get("behavioral_deviation", 70.0)
            new_threshold = behavioral_threshold * 0.85

            tuning = RiskTuning(
                parameter_name="behavioral_deviation_threshold",
                old_value=behavioral_threshold,
                new_value=new_threshold,
                reason=f"Missed {attack_false_negatives} attacks, tightening detection",
                effectiveness_improvement=0.90,
                timestamp=datetime.utcnow(),
            )

            self.anomaly_thresholds["behavioral_deviation"] = new_threshold
            self.tuning_history.append(tuning)

            logger.warning(
                f"[AUTO_TUNE] Anomaly threshold tightened: "
                f"{behavioral_threshold:.1f} → {new_threshold:.1f}"
            )

            return tuning

        return None

    async def adjust_correlation_threshold(
        self,
        correlation_accuracy: float,
        distributed_attack_detection: float,
    ) -> Optional[RiskTuning]:
        """
        Adjust correlation threshold for distributed attacks.
        """
        current_threshold = self.anomaly_thresholds.get("correlation_threshold", 0.6)

        if distributed_attack_detection < 0.85:
            new_threshold = current_threshold * 0.90
        elif correlation_accuracy > 0.95:
            new_threshold = current_threshold * 0.95
        else:
            return None

        if abs(new_threshold - current_threshold) > 0.05:
            tuning = RiskTuning(
                parameter_name="correlation_threshold",
                old_value=current_threshold,
                new_value=new_threshold,
                reason=f"Distributed attack detection: {distributed_attack_detection*100:.1f}%",
                effectiveness_improvement=distributed_attack_detection,
                timestamp=datetime.utcnow(),
            )

            self.anomaly_thresholds["correlation_threshold"] = new_threshold
            self.tuning_history.append(tuning)

            logger.info(
                f"[AUTO_TUNE] Correlation threshold adjusted: "
                f"{current_threshold:.3f} → {new_threshold:.3f}"
            )

            return tuning

        return None

    async def adjust_adaptive_multipliers(
        self,
        user_history_quality: float,
        tenant_risk_accuracy: float,
        global_threat_level: float,
    ) -> List[RiskTuning]:
        """
        Adjust adaptive multipliers based on context effectiveness.
        """
        adjustments = []

        user_history_mult = self.adaptive_multipliers["user_history"]
        if user_history_quality > 0.85:
            new_mult = user_history_mult * 1.05
        elif user_history_quality < 0.70:
            new_mult = user_history_mult * 0.95
        else:
            new_mult = user_history_mult

        if abs(new_mult - user_history_mult) > 0.01:
            tuning = RiskTuning(
                parameter_name="user_history_multiplier",
                old_value=user_history_mult,
                new_value=new_mult,
                reason=f"User history quality: {user_history_quality*100:.1f}%",
                effectiveness_improvement=user_history_quality,
                timestamp=datetime.utcnow(),
            )
            self.adaptive_multipliers["user_history"] = new_mult
            self.tuning_history.append(tuning)
            adjustments.append(tuning)

        tenant_mult = self.adaptive_multipliers["tenant_risk_level"]
        if tenant_risk_accuracy > 0.90:
            new_mult = tenant_mult * 1.08
        elif tenant_risk_accuracy < 0.75:
            new_mult = tenant_mult * 0.92
        else:
            new_mult = tenant_mult

        if abs(new_mult - tenant_mult) > 0.01:
            tuning = RiskTuning(
                parameter_name="tenant_risk_level_multiplier",
                old_value=tenant_mult,
                new_value=new_mult,
                reason=f"Tenant risk accuracy: {tenant_risk_accuracy*100:.1f}%",
                effectiveness_improvement=tenant_risk_accuracy,
                timestamp=datetime.utcnow(),
            )
            self.adaptive_multipliers["tenant_risk_level"] = new_mult
            self.tuning_history.append(tuning)
            adjustments.append(tuning)

        global_mult = self.adaptive_multipliers["global_threat_level"]
        new_mult = global_mult * (global_threat_level / 0.5)
        new_mult = min(new_mult, 2.0)

        if abs(new_mult - global_mult) > 0.01:
            tuning = RiskTuning(
                parameter_name="global_threat_level_multiplier",
                old_value=global_mult,
                new_value=new_mult,
                reason=f"Global threat level: {global_threat_level*100:.1f}%",
                effectiveness_improvement=new_mult / global_mult,
                timestamp=datetime.utcnow(),
            )
            self.adaptive_multipliers["global_threat_level"] = new_mult
            self.tuning_history.append(tuning)
            adjustments.append(tuning)

        return adjustments

    async def auto_calibrate_all(
        self,
        metrics: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Auto-calibrate entire risk scoring system.
        """
        calibrations = {
            "behavioral_weight_adjustments": [],
            "anomaly_threshold_adjustments": [],
            "correlation_threshold_adjustments": [],
            "adaptive_multiplier_adjustments": [],
        }

        behavioral_adjust = await self.adjust_behavioral_weights(
            metrics.get("detection_effectiveness", {})
        )
        if behavioral_adjust:
            calibrations["behavioral_weight_adjustments"].append(behavioral_adjust)

        anomaly_adjust = await self.adjust_anomaly_thresholds(
            metrics.get("anomaly_accuracy", {}),
            metrics.get("attack_false_negatives", 0),
        )
        if anomaly_adjust:
            calibrations["anomaly_threshold_adjustments"].append(anomaly_adjust)

        correlation_adjust = await self.adjust_correlation_threshold(
            metrics.get("correlation_accuracy", 0.8),
            metrics.get("distributed_attack_detection", 0.85),
        )
        if correlation_adjust:
            calibrations["correlation_threshold_adjustments"].append(correlation_adjust)

        multiplier_adjusts = await self.adjust_adaptive_multipliers(
            metrics.get("user_history_quality", 0.80),
            metrics.get("tenant_risk_accuracy", 0.85),
            metrics.get("global_threat_level", 0.5),
        )
        if multiplier_adjusts:
            calibrations["adaptive_multiplier_adjustments"].extend(multiplier_adjusts)

        if any(
            calibrations[k]
            for k in [
                "behavioral_weight_adjustments",
                "anomaly_threshold_adjustments",
                "correlation_threshold_adjustments",
                "adaptive_multiplier_adjustments",
            ]
        ):
            logger.info("[AUTO_TUNE] Risk scoring system calibrated")

        return calibrations

    def get_current_configuration(self) -> Dict[str, Any]:
        """Get current risk scoring configuration"""
        return {
            "behavioral_baseline_weights": self.behavioral_baseline_weights.copy(),
            "anomaly_thresholds": self.anomaly_thresholds.copy(),
            "adaptive_multipliers": self.adaptive_multipliers.copy(),
        }

    def get_tuning_history(self, limit: int = 20) -> List[Dict[str, Any]]:
        """Get recent tuning adjustments"""
        return [
            {
                "parameter": t.parameter_name,
                "old_value": t.old_value,
                "new_value": t.new_value,
                "reason": t.reason,
                "improvement": t.effectiveness_improvement,
                "timestamp": t.timestamp.isoformat(),
            }
            for t in self.tuning_history[-limit:]
        ]


_global_auto_tuning = AutoTuningRiskEngine()


def get_auto_tuning_risk_engine() -> AutoTuningRiskEngine:
    return _global_auto_tuning
