"""
Policy Learning Engine — Learn from All Security Events
═══════════════════════════════════════════════════════════════════

Purpose:
  Analyze all security events (attacks, FP, FN, patterns) and
  generate improved policies automatically.
  
  Never stops learning. Continuous improvement.
"""

from dataclasses import dataclass
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)


@dataclass
class PolicyUpdate:
    rule_id: str
    rule_name: str
    change_type: str
    old_value: Any
    new_value: Any
    confidence: float
    reasoning: str
    timestamp: datetime


class PolicyLearningEngine:
    """
    Learn from security events and improve policies.
    """

    def __init__(self):
        self.learned_patterns: Dict[str, Any] = {}
        self.policy_updates: List[PolicyUpdate] = []
        self.false_positive_analysis = {}
        self.false_negative_analysis = {}
        self.attack_pattern_library = {}
        self.tenant_behavior_trends = {}

    async def analyze_blocked_attack(
        self,
        attack_type: str,
        attack_data: Dict[str, Any],
        detection_layer: str,
        response_time_ms: int,
    ) -> Dict[str, Any]:
        """
        Analyze a successfully blocked attack.
        
        Learn:
          • Detection effectiveness
          • Response speed
          • Which layer caught it
        """
        pattern_key = f"{attack_type}_{detection_layer}"

        if pattern_key not in self.attack_pattern_library:
            self.attack_pattern_library[pattern_key] = {
                "count": 0,
                "total_response_time": 0,
                "detection_confidence": 0.8,
            }

        lib_entry = self.attack_pattern_library[pattern_key]
        lib_entry["count"] += 1
        lib_entry["total_response_time"] += response_time_ms
        lib_entry["avg_response_time"] = lib_entry["total_response_time"] / lib_entry["count"]

        logger.info(
            f"[POLICY_LEARNING] Learned blocked attack: {attack_type} "
            f"(detected by {detection_layer}, response: {response_time_ms}ms)"
        )

        return lib_entry

    async def analyze_false_positive(
        self,
        false_positive_type: str,
        user_id: str,
        resource: str,
        risk_score: float,
        actual_risk: float,
    ) -> Optional[PolicyUpdate]:
        """
        Analyze a false positive.
        
        Learn:
          • Which rules are too strict
          • Which users are safe
          • Which contexts should be less sensitive
        """
        fp_key = f"{false_positive_type}_{resource}"

        if fp_key not in self.false_positive_analysis:
            self.false_positive_analysis[fp_key] = {
                "count": 0,
                "threshold_too_high": True,
                "suggested_adjustment": 1.0,
            }

        fp_entry = self.false_positive_analysis[fp_key]
        fp_entry["count"] += 1
        fp_entry["risk_overestimation"] = risk_score - actual_risk

        threshold_adjustment = min(1.0 + (fp_entry["count"] * 0.05), 1.3)

        logger.warning(
            f"[POLICY_LEARNING] False positive detected: {false_positive_type} "
            f"on {resource}, risk overestimation: {fp_entry['risk_overestimation']:.1f}"
        )

        if fp_entry["count"] > 5 and threshold_adjustment > 1.1:
            update = PolicyUpdate(
                rule_id=fp_key,
                rule_name=f"reduce_sensitivity_{fp_key}",
                change_type="threshold_adjustment",
                old_value=1.0,
                new_value=threshold_adjustment,
                confidence=min(fp_entry["count"] / 10, 0.95),
                reasoning=f"FP rate high ({fp_entry['count']} FPs), reducing threshold by {(threshold_adjustment-1)*100:.1f}%",
                timestamp=datetime.utcnow(),
            )
            self.policy_updates.append(update)
            return update

        return None

    async def analyze_false_negative(
        self,
        false_negative_type: str,
        attack_type: str,
        damage_potential: float,
    ) -> Optional[PolicyUpdate]:
        """
        Analyze a false negative (missed attack).
        
        Learn:
          • Which rules are too loose
          • Which attack vectors we miss
          • How to improve detection
        """
        fn_key = f"{false_negative_type}_{attack_type}"

        if fn_key not in self.false_negative_analysis:
            self.false_negative_analysis[fn_key] = {
                "count": 0,
                "max_damage_potential": 0,
            }

        fn_entry = self.false_negative_analysis[fn_key]
        fn_entry["count"] += 1
        fn_entry["max_damage_potential"] = max(fn_entry["max_damage_potential"], damage_potential)

        logger.critical(
            f"[POLICY_LEARNING] False negative detected: {false_negative_type} "
            f"({attack_type}), damage potential: {damage_potential:.1f}"
        )

        if fn_entry["count"] > 2 and damage_potential > 0.7:
            threshold_reduction = max(0.7, 1.0 - (fn_entry["count"] * 0.15))

            update = PolicyUpdate(
                rule_id=fn_key,
                rule_name=f"increase_sensitivity_{fn_key}",
                change_type="threshold_tightening",
                old_value=1.0,
                new_value=threshold_reduction,
                confidence=min(fn_entry["count"] / 5, 0.9),
                reasoning=f"Missed {fn_entry['count']} attacks, tightening detection by {(1-threshold_reduction)*100:.1f}%",
                timestamp=datetime.utcnow(),
            )
            self.policy_updates.append(update)
            return update

        return None

    async def analyze_repeated_attack_pattern(
        self,
        attack_pattern: str,
        occurrence_count: int,
        time_window_hours: int,
    ) -> Optional[PolicyUpdate]:
        """
        Analyze repeated attack patterns.
        
        Learn:
          • This attack happens repeatedly
          • Strengthen rule for this vector
        """
        if occurrence_count < 3:
            return None

        pattern_key = f"repeated_{attack_pattern}"

        if pattern_key not in self.learned_patterns:
            self.learned_patterns[pattern_key] = {
                "pattern": attack_pattern,
                "occurrences": 0,
                "learned_at": datetime.utcnow(),
            }

        entry = self.learned_patterns[pattern_key]
        entry["occurrences"] = occurrence_count

        logger.warning(
            f"[POLICY_LEARNING] Repeated attack pattern: {attack_pattern} "
            f"({occurrence_count} times in {time_window_hours}h)"
        )

        confidence = min(occurrence_count / 10, 0.95)

        update = PolicyUpdate(
            rule_id=pattern_key,
            rule_name=f"strengthen_defense_{attack_pattern}",
            change_type="new_rule_generation",
            old_value=None,
            new_value=f"block_{attack_pattern}_automatically",
            confidence=confidence,
            reasoning=f"Pattern repeated {occurrence_count} times, strengthening defense",
            timestamp=datetime.utcnow(),
        )

        self.policy_updates.append(update)
        return update

    async def analyze_tenant_behavior_trend(
        self,
        tenant_id: str,
        behavior_type: str,
        severity: str,
        trend_data: Dict[str, Any],
    ) -> Optional[PolicyUpdate]:
        """
        Analyze per-tenant behavior trends.
        
        Learn:
          • This tenant has specific patterns
          • Adjust policy for this tenant
        """
        tenant_key = f"{tenant_id}_trend"

        if tenant_key not in self.tenant_behavior_trends:
            self.tenant_behavior_trends[tenant_key] = {
                "behaviors": [],
                "last_updated": datetime.utcnow(),
            }

        entry = self.tenant_behavior_trends[tenant_key]
        entry["behaviors"].append({
            "type": behavior_type,
            "severity": severity,
            "data": trend_data,
            "timestamp": datetime.utcnow(),
        })

        logger.info(
            f"[POLICY_LEARNING] Tenant behavior trend: {tenant_id} "
            f"({behavior_type}, severity: {severity})"
        )

        if severity == "high" and len(entry["behaviors"]) > 3:
            update = PolicyUpdate(
                rule_id=f"tenant_policy_{tenant_id}",
                rule_name=f"adjust_tenant_policy_{tenant_id}",
                change_type="tenant_specific_rule",
                old_value="standard_policy",
                new_value=f"tenant_specific_strict_{behavior_type}",
                confidence=0.85,
                reasoning=f"Tenant {tenant_id} showing {behavior_type} pattern, tightening policy",
                timestamp=datetime.utcnow(),
            )
            self.policy_updates.append(update)
            return update

        return None

    async def generate_improved_policy_matrix(self) -> Dict[str, Any]:
        """
        Generate improved policy matrix from learned data.
        """
        improvements = {
            "relaxed_rules": [],
            "tightened_rules": [],
            "new_rules": [],
            "confidence_avg": 0.0,
        }

        relaxed = [u for u in self.policy_updates if u.change_type == "threshold_adjustment"]
        tightened = [u for u in self.policy_updates if u.change_type == "threshold_tightening"]
        new_rules = [u for u in self.policy_updates if u.change_type == "new_rule_generation"]

        improvements["relaxed_rules"] = [
            {"rule": u.rule_name, "adjustment": u.new_value, "confidence": u.confidence}
            for u in relaxed
        ]
        improvements["tightened_rules"] = [
            {"rule": u.rule_name, "adjustment": u.new_value, "confidence": u.confidence}
            for u in tightened
        ]
        improvements["new_rules"] = [
            {"rule": u.rule_name, "action": u.new_value, "confidence": u.confidence}
            for u in new_rules
        ]

        if self.policy_updates:
            improvements["confidence_avg"] = sum(u.confidence for u in self.policy_updates) / len(self.policy_updates)

        return improvements

    def get_learning_summary(self) -> Dict[str, Any]:
        """Get summary of learned patterns"""
        return {
            "total_attacks_learned": sum(e["count"] for e in self.attack_pattern_library.values()),
            "false_positives_learned": sum(e["count"] for e in self.false_positive_analysis.values()),
            "false_negatives_learned": sum(e["count"] for e in self.false_negative_analysis.values()),
            "patterns_identified": len(self.learned_patterns),
            "tenants_profiled": len(self.tenant_behavior_trends),
            "policy_updates_generated": len(self.policy_updates),
            "updates_confidence_avg": (
                sum(u.confidence for u in self.policy_updates) / len(self.policy_updates)
                if self.policy_updates
                else 0
            ),
        }


_global_policy_learning = PolicyLearningEngine()


def get_policy_learning_engine() -> PolicyLearningEngine:
    return _global_policy_learning
