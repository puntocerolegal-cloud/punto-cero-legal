"""
Policy Arbitration Engine — Multi-Layer Conflict Resolution
═══════════════════════════════════════════════════════════════════

Purpose:
  Resolve conflicts between security layers and determine final decision.
  
  Priority hierarchy:
    1. Security Governor (S2.9) — HIGHEST
    2. GSCL (S2.5)
    3. S2.8 Autonomous Response
    4. S2.6 Intelligence
"""

from enum import Enum
from dataclasses import dataclass
from typing import Dict, Any, Optional, List
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class DecisionSource(Enum):
    GSCL = "gscl"
    S2_6_INTELLIGENCE = "s2_6_intelligence"
    S2_8_AUTONOMOUS = "s2_8_autonomous"
    S2_9_GOVERNOR = "s2_9_governor"


class FinalDecision(Enum):
    ALLOW = "allow"
    MONITOR = "monitor"
    THROTTLE = "throttle"
    BLOCK = "block"
    ISOLATE_USER = "isolate_user"
    ISOLATE_TENANT = "isolate_tenant"


@dataclass
class LayerDecision:
    source: DecisionSource
    decision: str
    confidence: float
    reasoning: str
    timestamp: datetime


@dataclass
class ArbitrationResult:
    final_decision: FinalDecision
    winning_layer: DecisionSource
    all_decisions: List[LayerDecision]
    reasoning_trace: List[str]
    applied_priority: bool
    timestamp: datetime


class PolicyArbitrationEngine:
    """
    Resolve conflicts between security layers.
    
    When layers disagree, priority determines winner:
      1. Governor (S2.9) can override all
      2. GSCL (S2.5) enforces policy
      3. S2.8 makes autonomous response
      4. S2.6 provides intelligence
    """

    def __init__(self):
        self.arbitration_history: List[ArbitrationResult] = []
        self.layer_priority = {
            DecisionSource.S2_9_GOVERNOR: 4,
            DecisionSource.GSCL: 3,
            DecisionSource.S2_8_AUTONOMOUS: 2,
            DecisionSource.S2_6_INTELLIGENCE: 1,
        }

    def arbitrate(
        self,
        gscl_decision: Optional[str] = None,
        s2_6_decision: Optional[str] = None,
        s2_8_decision: Optional[str] = None,
        s2_9_decision: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None,
    ) -> ArbitrationResult:
        """
        Arbitrate between layer decisions.
        
        Args:
            gscl_decision: Decision from S2.5 (ALLOW/DENY)
            s2_6_decision: Signal from S2.6 intelligence
            s2_8_decision: Recommendation from S2.8 autonomous
            s2_9_decision: Governor override
            context: Additional context
        
        Returns:
            ArbitrationResult with final decision and reasoning
        """
        now = datetime.utcnow()
        decisions: List[LayerDecision] = []
        reasoning_trace: List[str] = []

        if context is None:
            context = {}

        if gscl_decision:
            decisions.append(
                LayerDecision(
                    source=DecisionSource.GSCL,
                    decision=gscl_decision,
                    confidence=1.0,
                    reasoning="GSCL static policy enforcement",
                    timestamp=now,
                )
            )
            reasoning_trace.append(f"GSCL: {gscl_decision}")

        if s2_6_decision:
            confidence = context.get("s2_6_confidence", 0.7)
            decisions.append(
                LayerDecision(
                    source=DecisionSource.S2_6_INTELLIGENCE,
                    decision=s2_6_decision,
                    confidence=confidence,
                    reasoning="S2.6 behavioral intelligence",
                    timestamp=now,
                )
            )
            reasoning_trace.append(f"S2.6: {s2_6_decision} (confidence: {confidence})")

        if s2_8_decision:
            confidence = context.get("s2_8_confidence", 0.8)
            decisions.append(
                LayerDecision(
                    source=DecisionSource.S2_8_AUTONOMOUS,
                    decision=s2_8_decision,
                    confidence=confidence,
                    reasoning="S2.8 autonomous response",
                    timestamp=now,
                )
            )
            reasoning_trace.append(f"S2.8: {s2_8_decision} (confidence: {confidence})")

        if s2_9_decision:
            decisions.append(
                LayerDecision(
                    source=DecisionSource.S2_9_GOVERNOR,
                    decision=s2_9_decision,
                    confidence=0.95,
                    reasoning="S2.9 governor override",
                    timestamp=now,
                )
            )
            reasoning_trace.append(f"S2.9: {s2_9_decision} (GOVERNOR OVERRIDE)")

        final_decision, winning_layer, applied_priority = self._determine_final_decision(
            decisions, reasoning_trace
        )

        result = ArbitrationResult(
            final_decision=final_decision,
            winning_layer=winning_layer,
            all_decisions=decisions,
            reasoning_trace=reasoning_trace,
            applied_priority=applied_priority,
            timestamp=now,
        )

        self.arbitration_history.append(result)

        logger.info(
            f"[ARBITRATION] Final decision: {final_decision.value} "
            f"(winning layer: {winning_layer.value})"
        )

        return result

    def _determine_final_decision(
        self,
        decisions: List[LayerDecision],
        reasoning_trace: List[str],
    ) -> tuple:
        """Determine final decision using priority"""
        if not decisions:
            return FinalDecision.ALLOW, DecisionSource.S2_6_INTELLIGENCE, False

        highest_priority_decision = None
        highest_priority_layer = None
        highest_priority_value = -1

        for decision in decisions:
            priority = self.layer_priority.get(decision.source, 0)
            if priority > highest_priority_value:
                highest_priority_value = priority
                highest_priority_decision = decision
                highest_priority_layer = decision.source

        if not highest_priority_decision:
            return FinalDecision.ALLOW, DecisionSource.S2_6_INTELLIGENCE, False

        final_decision = self._parse_decision_string(highest_priority_decision.decision)

        applied_priority = len(decisions) > 1

        return final_decision, highest_priority_layer, applied_priority

    def _parse_decision_string(self, decision_str: str) -> FinalDecision:
        """Parse decision string to FinalDecision enum"""
        decision_str_lower = decision_str.lower().strip()

        decision_map = {
            "allow": FinalDecision.ALLOW,
            "monitor": FinalDecision.MONITOR,
            "throttle": FinalDecision.THROTTLE,
            "block": FinalDecision.BLOCK,
            "isolate_user": FinalDecision.ISOLATE_USER,
            "isolate_tenant": FinalDecision.ISOLATE_TENANT,
        }

        return decision_map.get(decision_str_lower, FinalDecision.ALLOW)

    def explain_arbitration(self, result: ArbitrationResult) -> str:
        """Generate human-readable explanation of arbitration"""
        explanation = "Policy Arbitration Result:\n"
        explanation += f"Final Decision: {result.final_decision.value}\n"
        explanation += f"Winning Layer: {result.winning_layer.value}\n"
        explanation += "Reasoning Trace:\n"

        for i, trace in enumerate(result.reasoning_trace, 1):
            explanation += f"  {i}. {trace}\n"

        if result.applied_priority:
            explanation += "\nPriority was applied to resolve conflict.\n"

        return explanation

    def get_arbitration_history(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Get recent arbitration results"""
        results = self.arbitration_history[-limit:]
        return [
            {
                "final_decision": r.final_decision.value,
                "winning_layer": r.winning_layer.value,
                "all_decisions": [
                    {
                        "source": d.source.value,
                        "decision": d.decision,
                        "confidence": d.confidence,
                    }
                    for d in r.all_decisions
                ],
                "timestamp": r.timestamp.isoformat(),
            }
            for r in results
        ]

    def get_layer_conflict_stats(self) -> Dict[str, int]:
        """Get statistics on layer conflicts"""
        conflicts = {}
        total_arbitrations = len(self.arbitration_history)

        for result in self.arbitration_history:
            if len(result.all_decisions) > 1:
                conflict_key = f"{len(result.all_decisions)}_layers"
                conflicts[conflict_key] = conflicts.get(conflict_key, 0) + 1

        return {
            "total_arbitrations": total_arbitrations,
            "conflicts": conflicts,
        }


_global_arbitration_engine = PolicyArbitrationEngine()


def get_policy_arbitration_engine() -> PolicyArbitrationEngine:
    return _global_arbitration_engine
