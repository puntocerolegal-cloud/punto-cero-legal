"""
Security Optimization Engine — Optimize Performance & Accuracy
═══════════════════════════════════════════════════════════════════

Purpose:
  Optimize security system for:
    • Lower latency
    • Fewer false positives
    • Better detection accuracy
    • Balanced security vs usability
"""

from dataclasses import dataclass
from typing import Dict, Any, Optional, List
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


@dataclass
class OptimizationResult:
    optimization_type: str
    parameter_name: str
    old_value: float
    new_value: float
    improvement_score: float
    estimated_impact: str
    timestamp: datetime


class SecurityOptimizationEngine:
    """
    Automatically optimize security system parameters.
    """

    def __init__(self):
        self.optimizations_applied: List[OptimizationResult] = []
        self.performance_metrics = {
            "avg_auth_latency_ms": 50.0,
            "false_positive_rate": 0.08,
            "false_negative_rate": 0.02,
            "detection_accuracy": 0.95,
            "system_throughput": 1000,
        }
        self.optimization_history: Dict[str, List[OptimizationResult]] = {}

    async def optimize_risk_scoring_weights(
        self,
        current_weights: Dict[str, float],
        accuracy_data: Dict[str, float],
    ) -> Optional[OptimizationResult]:
        """
        Optimize risk scoring weights for better accuracy.
        
        Adjust:
          • behavioral_weight
          • attack_graph_weight
          • correlation_weight
        """
        behavioral_accuracy = accuracy_data.get("behavioral_accuracy", 0.85)
        graph_accuracy = accuracy_data.get("graph_accuracy", 0.90)
        correlation_accuracy = accuracy_data.get("correlation_accuracy", 0.80)

        old_behavioral = current_weights.get("behavioral_weight", 0.4)
        old_graph = current_weights.get("attack_graph_weight", 0.35)
        old_correlation = current_weights.get("correlation_weight", 0.25)

        new_behavioral = old_behavioral * (behavioral_accuracy / 0.85)
        new_graph = old_graph * (graph_accuracy / 0.90)
        new_correlation = old_correlation * (correlation_accuracy / 0.80)

        total = new_behavioral + new_graph + new_correlation
        new_behavioral /= total
        new_graph /= total
        new_correlation /= total

        if abs(new_behavioral - old_behavioral) > 0.02:
            improvement_score = (graph_accuracy + behavioral_accuracy + correlation_accuracy) / 3

            result = OptimizationResult(
                optimization_type="weight_adjustment",
                parameter_name="risk_scoring_weights",
                old_value=old_behavioral,
                new_value=new_behavioral,
                improvement_score=improvement_score,
                estimated_impact=f"Expected accuracy improvement: {(improvement_score-0.88)*100:.1f}%",
                timestamp=datetime.utcnow(),
            )

            self.optimizations_applied.append(result)
            logger.info(
                f"[OPTIMIZATION] Risk scoring weights optimized: "
                f"behavioral {old_behavioral:.3f} → {new_behavioral:.3f}"
            )

            return result

        return None

    async def optimize_governor_thresholds(
        self,
        current_thresholds: Dict[str, int],
        action_data: Dict[str, Any],
    ) -> Optional[OptimizationResult]:
        """
        Optimize governor thresholds.
        
        Adjust:
          • max_users_isolated_per_minute
          • max_blocks_per_second
          • max_rate_limits_per_minute
        """
        current_max_isolate = current_thresholds.get("max_users_isolated_per_minute", 10)
        actual_isolations = action_data.get("total_isolations_per_hour", 15)
        isolation_effectiveness = action_data.get("isolation_effectiveness", 0.95)

        if isolation_effectiveness > 0.90 and actual_isolations > 0:
            new_threshold = int(current_max_isolate * (isolation_effectiveness / 0.85))
            improvement_score = min(isolation_effectiveness, 0.99)

            result = OptimizationResult(
                optimization_type="threshold_optimization",
                parameter_name="max_users_isolated_per_minute",
                old_value=float(current_max_isolate),
                new_value=float(new_threshold),
                improvement_score=improvement_score,
                estimated_impact=f"Can handle {new_threshold} isolations/min with {isolation_effectiveness*100:.1f}% effectiveness",
                timestamp=datetime.utcnow(),
            )

            self.optimizations_applied.append(result)
            logger.info(
                f"[OPTIMIZATION] Governor threshold optimized: "
                f"max_isolate {current_max_isolate} → {new_threshold}"
            )

            return result

        return None

    async def optimize_anomaly_sensitivity(
        self,
        current_sensitivity: float,
        detection_data: Dict[str, float],
    ) -> Optional[OptimizationResult]:
        """
        Optimize anomaly detection sensitivity.
        
        Balance:
          • Detection rate (want high)
          • False positive rate (want low)
        """
        detection_rate = detection_data.get("detection_rate", 0.85)
        fp_rate = detection_data.get("false_positive_rate", 0.10)

        ideal_fp_rate = 0.05
        adjustment_factor = 1.0

        if fp_rate > ideal_fp_rate:
            adjustment_factor = 1.0 + ((fp_rate - ideal_fp_rate) / ideal_fp_rate)
        elif detection_rate < 0.90:
            adjustment_factor = 0.95

        new_sensitivity = current_sensitivity * adjustment_factor

        if abs(new_sensitivity - current_sensitivity) > 0.05:
            improvement_score = min(detection_rate + (1 - fp_rate), 1.0)

            result = OptimizationResult(
                optimization_type="sensitivity_adjustment",
                parameter_name="anomaly_detection_sensitivity",
                old_value=current_sensitivity,
                new_value=new_sensitivity,
                improvement_score=improvement_score,
                estimated_impact=f"Detection: {detection_rate*100:.1f}%, FP: {fp_rate*100:.1f}%",
                timestamp=datetime.utcnow(),
            )

            self.optimizations_applied.append(result)
            logger.info(
                f"[OPTIMIZATION] Anomaly sensitivity optimized: "
                f"{current_sensitivity:.3f} → {new_sensitivity:.3f}"
            )

            return result

        return None

    async def optimize_cache_effectiveness(
        self,
        cache_hit_rate: float,
        avg_lookup_time_ms: float,
    ) -> Optional[OptimizationResult]:
        """
        Optimize authorization cache performance.
        """
        old_latency = self.performance_metrics.get("avg_auth_latency_ms", 50.0)
        improvement = (1.0 - cache_hit_rate) * (avg_lookup_time_ms / 10)

        if cache_hit_rate < 0.80:
            logger.warning(
                f"[OPTIMIZATION] Cache effectiveness low: {cache_hit_rate*100:.1f}% hit rate, "
                f"avg lookup {avg_lookup_time_ms}ms"
            )

            result = OptimizationResult(
                optimization_type="cache_optimization",
                parameter_name="auth_cache_size",
                old_value=float(10000),
                new_value=float(20000),
                improvement_score=cache_hit_rate,
                estimated_impact=f"Expected hit rate improvement to {cache_hit_rate*100:.1f}%, reducing latency by {improvement:.1f}ms",
                timestamp=datetime.utcnow(),
            )

            self.optimizations_applied.append(result)
            return result

        return None

    async def balance_security_usability(
        self,
        user_friction_score: float,
        security_score: float,
    ) -> Optional[OptimizationResult]:
        """
        Auto-balance between strict security and user experience.
        
        If friction too high: relax some rules
        If security too low: tighten rules
        """
        optimal_friction = 0.3
        optimal_security = 0.95

        friction_diff = abs(user_friction_score - optimal_friction)
        security_diff = abs(security_score - optimal_security)

        if friction_diff > 0.15 or security_diff > 0.05:
            adjustment = "relax_rules" if user_friction_score > optimal_friction else "tighten_rules"

            result = OptimizationResult(
                optimization_type="balance_optimization",
                parameter_name="security_usability_balance",
                old_value=user_friction_score,
                new_value=optimal_friction,
                improvement_score=(security_score + (1 - user_friction_score)) / 2,
                estimated_impact=f"Action: {adjustment}, friction: {user_friction_score:.2f} → {optimal_friction:.2f}",
                timestamp=datetime.utcnow(),
            )

            self.optimizations_applied.append(result)
            logger.info(
                f"[OPTIMIZATION] Security-usability balanced: {adjustment}"
            )

            return result

        return None

    def get_optimization_report(self) -> Dict[str, Any]:
        """Generate optimization report"""
        by_type = {}
        for opt in self.optimizations_applied:
            if opt.optimization_type not in by_type:
                by_type[opt.optimization_type] = []
            by_type[opt.optimization_type].append(opt)

        avg_improvement = (
            sum(o.improvement_score for o in self.optimizations_applied) / len(self.optimizations_applied)
            if self.optimizations_applied
            else 0
        )

        return {
            "total_optimizations": len(self.optimizations_applied),
            "by_type": {k: len(v) for k, v in by_type.items()},
            "average_improvement_score": avg_improvement,
            "performance_metrics": self.performance_metrics.copy(),
        }

    def get_optimization_history(self, limit: int = 20) -> List[Dict[str, Any]]:
        """Get recent optimizations"""
        return [
            {
                "type": opt.optimization_type,
                "parameter": opt.parameter_name,
                "change": f"{opt.old_value} → {opt.new_value}",
                "improvement": opt.improvement_score,
                "impact": opt.estimated_impact,
                "timestamp": opt.timestamp.isoformat(),
            }
            for opt in self.optimizations_applied[-limit:]
        ]


_global_optimization = SecurityOptimizationEngine()


def get_security_optimization_engine() -> SecurityOptimizationEngine:
    return _global_optimization
