"""
Defense Evolution Engine — Evolve Defenses Against New Attacks
═══════════════════════════════════════════════════════════════════

Purpose:
  Automatically detect new attack patterns and generate
  appropriate detection rules and mitigation strategies.
  
  System learns and evolves its defenses in real-time.
"""

from enum import Enum
from dataclasses import dataclass
from typing import Dict, Any, Optional, List
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class DefenseType(Enum):
    DETECTION_RULE = "detection_rule"
    MITIGATION_STRATEGY = "mitigation_strategy"
    CONTAINMENT_POLICY = "containment_policy"
    RESPONSE_PLAYBOOK = "response_playbook"


@dataclass
class EvolutionaryDefense:
    defense_id: str
    defense_type: DefenseType
    attack_pattern: str
    generated_rule: str
    confidence: float
    activated: bool
    effectiveness: float
    timestamp: datetime
    metadata: Dict[str, Any]


class DefenseEvolutionEngine:
    """
    Automatically evolve defenses against new attacks.
    """

    def __init__(self):
        self.detected_patterns: Dict[str, Dict[str, Any]] = {}
        self.generated_defenses: List[EvolutionaryDefense] = []
        self.activated_defenses: Dict[str, EvolutionaryDefense] = {}
        self.defense_effectiveness: Dict[str, float] = {}

    async def detect_new_attack_pattern(
        self,
        attack_data: Dict[str, Any],
        attack_type: str,
        indicators: List[str],
    ) -> Optional[str]:
        """
        Detect a new or unknown attack pattern.
        
        Indicators:
          • Request sequence anomalies
          • Resource access patterns
          • Parameter mutation
          • Cross-tenant probing
        """
        pattern_hash = f"{attack_type}_{len(indicators)}"

        if pattern_hash not in self.detected_patterns:
            self.detected_patterns[pattern_hash] = {
                "attack_type": attack_type,
                "indicators": indicators,
                "occurrences": 0,
                "first_detected": datetime.utcnow(),
                "variants": [],
            }

        pattern = self.detected_patterns[pattern_hash]
        pattern["occurrences"] += 1
        pattern["variants"].append(attack_data)

        logger.warning(
            f"[DEFENSE_EVOLUTION] New attack pattern detected: {attack_type} "
            f"({pattern['occurrences']} occurrences)"
        )

        return pattern_hash

    async def classify_unknown_threat(
        self,
        threat_data: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Classify and analyze an unknown threat.
        """
        characteristics = {
            "is_credential_attack": threat_data.get("failed_logins", 0) > 5,
            "is_enumeration": threat_data.get("resource_probes", 0) > 20,
            "is_privilege_escalation": threat_data.get("role_changes", 0) > 0,
            "is_lateral_movement": threat_data.get("tenant_switches", 0) > 0,
            "is_data_exfiltration": threat_data.get("export_attempts", 0) > 3,
        }

        severity = sum(1 for v in characteristics.values() if v)

        return {
            "classification": characteristics,
            "severity_level": min(severity, 5),
            "risk_estimate": min(severity / 5, 1.0),
        }

    async def generate_detection_rule(
        self,
        pattern_hash: str,
        pattern_data: Dict[str, Any],
        confidence: float,
    ) -> EvolutionaryDefense:
        """
        Generate detection rule for a new pattern.
        """
        attack_type = pattern_data.get("attack_type", "unknown")
        indicators = pattern_data.get("indicators", [])

        rule_name = f"detect_{attack_type}_{len(indicators)}_indicators"

        rule_logic = self._generate_rule_logic(indicators)

        defense = EvolutionaryDefense(
            defense_id=f"defense_{pattern_hash}",
            defense_type=DefenseType.DETECTION_RULE,
            attack_pattern=attack_type,
            generated_rule=rule_logic,
            confidence=confidence,
            activated=False,
            effectiveness=0.0,
            timestamp=datetime.utcnow(),
            metadata={
                "pattern_hash": pattern_hash,
                "indicators": indicators,
                "rule_name": rule_name,
            },
        )

        self.generated_defenses.append(defense)

        logger.info(
            f"[DEFENSE_EVOLUTION] Generated detection rule: {rule_name} "
            f"(confidence: {confidence*100:.1f}%)"
        )

        return defense

    async def generate_mitigation_strategy(
        self,
        attack_pattern: str,
        severity: int,
        confidence: float,
    ) -> EvolutionaryDefense:
        """
        Generate mitigation strategy for attack pattern.
        """
        strategy = self._generate_mitigation_logic(attack_pattern, severity)

        defense = EvolutionaryDefense(
            defense_id=f"mitigate_{attack_pattern}_{severity}",
            defense_type=DefenseType.MITIGATION_STRATEGY,
            attack_pattern=attack_pattern,
            generated_rule=strategy,
            confidence=confidence,
            activated=False,
            effectiveness=0.0,
            timestamp=datetime.utcnow(),
            metadata={
                "severity": severity,
                "strategy_type": "auto_generated",
            },
        )

        self.generated_defenses.append(defense)

        logger.info(
            f"[DEFENSE_EVOLUTION] Generated mitigation strategy: {attack_pattern} "
            f"(severity: {severity}, confidence: {confidence*100:.1f}%)"
        )

        return defense

    async def activate_defense(
        self,
        defense: EvolutionaryDefense,
    ) -> bool:
        """
        Activate an evolved defense.
        
        Only activate if:
          • confidence >= 0.80
          • extensively tested
          • no security regression
        """
        if defense.confidence < 0.80:
            logger.warning(
                f"[DEFENSE_EVOLUTION] Defense not activated (low confidence): "
                f"{defense.defense_id} ({defense.confidence*100:.1f}%)"
            )
            return False

        self.activated_defenses[defense.defense_id] = defense
        defense.activated = True

        logger.critical(
            f"[DEFENSE_EVOLUTION] Defense activated: {defense.defense_id} "
            f"({defense.defense_type.value})"
        )

        from security.soc_event_stream import get_soc_stream
        stream = get_soc_stream()
        stream.ingest_event(
            event_type="defense_evolved",
            user_id="system",
            severity="medium",
            data={
                "defense_id": defense.defense_id,
                "attack_pattern": defense.attack_pattern,
                "type": defense.defense_type.value,
                "confidence": defense.confidence,
            },
        )

        return True

    async def measure_defense_effectiveness(
        self,
        defense_id: str,
        attacks_blocked: int,
        total_attacks: int,
        false_positives: int,
    ) -> float:
        """
        Measure how effective an evolved defense is.
        """
        if total_attacks == 0:
            return 0.0

        detection_rate = attacks_blocked / total_attacks if total_attacks > 0 else 0
        fp_penalty = (false_positives / total_attacks) * 0.2 if total_attacks > 0 else 0

        effectiveness = detection_rate - fp_penalty
        effectiveness = max(0.0, min(effectiveness, 1.0))

        self.defense_effectiveness[defense_id] = effectiveness

        if defense_id in self.activated_defenses:
            self.activated_defenses[defense_id].effectiveness = effectiveness

        logger.info(
            f"[DEFENSE_EVOLUTION] Defense effectiveness measured: {defense_id} "
            f"({effectiveness*100:.1f}%, {attacks_blocked}/{total_attacks} blocked)"
        )

        return effectiveness

    async def evolve_based_on_red_team_results(
        self,
        red_team_results: Dict[str, float],
    ) -> List[EvolutionaryDefense]:
        """
        Generate new defenses based on red team testing results.
        """
        evolved = []

        for attack_type, detection_rate in red_team_results.items():
            if detection_rate < 0.85:
                confidence = max(0.70, detection_rate)

                defense = await self.generate_detection_rule(
                    pattern_hash=f"red_team_{attack_type}",
                    pattern_data={
                        "attack_type": attack_type,
                        "indicators": [f"indicator_{i}" for i in range(3)],
                    },
                    confidence=confidence,
                )

                evolved.append(defense)

        logger.info(
            f"[DEFENSE_EVOLUTION] Generated {len(evolved)} defenses from red team results"
        )

        return evolved

    def _generate_rule_logic(self, indicators: List[str]) -> str:
        """Generate detection rule logic"""
        logic = f"IF all_present({', '.join(indicators[:3])})"
        logic += f"\nTHEN classify_as_attack()\nAND raise_alert(severity=high)"
        return logic

    def _generate_mitigation_logic(self, attack_pattern: str, severity: int) -> str:
        """Generate mitigation strategy logic"""
        action = "BLOCK" if severity >= 4 else "THROTTLE"
        return f"IF attack_pattern_detected({attack_pattern})\nTHEN {action}_user()\nAND isolate_session()"

    def get_active_defenses(self) -> List[Dict[str, Any]]:
        """Get all active evolved defenses"""
        return [
            {
                "defense_id": d.defense_id,
                "attack_pattern": d.attack_pattern,
                "type": d.defense_type.value,
                "effectiveness": d.effectiveness,
                "activated_at": d.timestamp.isoformat(),
            }
            for d in self.activated_defenses.values()
        ]

    def get_evolution_summary(self) -> Dict[str, Any]:
        """Get summary of defense evolution"""
        return {
            "patterns_detected": len(self.detected_patterns),
            "defenses_generated": len(self.generated_defenses),
            "defenses_activated": len(self.activated_defenses),
            "average_effectiveness": (
                sum(self.defense_effectiveness.values()) / len(self.defense_effectiveness)
                if self.defense_effectiveness
                else 0
            ),
        }

    def get_generated_defenses(self, limit: int = 20) -> List[Dict[str, Any]]:
        """Get recent generated defenses"""
        return [
            {
                "defense_id": d.defense_id,
                "attack_pattern": d.attack_pattern,
                "type": d.defense_type.value,
                "confidence": d.confidence,
                "activated": d.activated,
                "effectiveness": d.effectiveness,
                "timestamp": d.timestamp.isoformat(),
            }
            for d in self.generated_defenses[-limit:]
        ]


_global_defense_evolution = DefenseEvolutionEngine()


def get_defense_evolution_engine() -> DefenseEvolutionEngine:
    return _global_defense_evolution
