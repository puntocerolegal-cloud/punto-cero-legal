from enum import Enum
from dataclasses import dataclass
from typing import Optional, Dict, Any
import time
from datetime import datetime, timedelta


class DecisionType(Enum):
    ALLOW = "allow"
    MONITOR = "monitor"
    THROTTLE = "throttle"
    BLOCK = "block"
    ISOLATE_USER = "isolate_user"
    ISOLATE_TENANT = "isolate_tenant"
    FAIL_SAFE_TRIGGER = "fail_safe_trigger"


@dataclass
class AutonomousDecision:
    decision_type: DecisionType
    risk_score: float
    confidence: float
    reason: str
    actions: list
    timestamp: datetime
    ttl_seconds: int
    metadata: Dict[str, Any]


class AutonomousDecisionEngine:
    def __init__(self):
        self.decision_history = {}
        self.active_decisions = {}

    def decide(
        self,
        user_id: str,
        tenant_id: str,
        risk_score: float,
        attack_graph_state: Dict[str, Any],
        behavioral_deviation: float,
        tenant_risk: float,
        correlation_signals: list,
    ) -> AutonomousDecision:
        """
        Convert risk signals into autonomous decisions.
        Risk score ranges: 0-100
        """
        decision_type = self._map_risk_to_decision(risk_score)
        confidence = self._calculate_confidence(
            risk_score,
            attack_graph_state,
            behavioral_deviation,
            correlation_signals,
        )
        actions = self._determine_actions(
            decision_type,
            user_id,
            tenant_id,
            risk_score,
            attack_graph_state,
        )
        reason = self._generate_reason(
            risk_score,
            attack_graph_state,
            behavioral_deviation,
            correlation_signals,
        )
        ttl_seconds = self._calculate_ttl(decision_type, risk_score)

        decision = AutonomousDecision(
            decision_type=decision_type,
            risk_score=risk_score,
            confidence=confidence,
            reason=reason,
            actions=actions,
            timestamp=datetime.utcnow(),
            ttl_seconds=ttl_seconds,
            metadata={
                "user_id": user_id,
                "tenant_id": tenant_id,
                "attack_graph_state": attack_graph_state,
                "behavioral_deviation": behavioral_deviation,
                "tenant_risk": tenant_risk,
                "correlation_signals": correlation_signals,
            },
        )

        self._record_decision(user_id, decision)
        return decision

    def _map_risk_to_decision(self, risk_score: float) -> DecisionType:
        if risk_score < 40:
            return DecisionType.ALLOW
        elif risk_score < 60:
            return DecisionType.MONITOR
        elif risk_score < 75:
            return DecisionType.THROTTLE
        elif risk_score < 85:
            return DecisionType.BLOCK
        elif risk_score < 95:
            return DecisionType.ISOLATE_USER
        else:
            return DecisionType.ISOLATE_TENANT

    def _calculate_confidence(
        self,
        risk_score: float,
        attack_graph_state: Dict[str, Any],
        behavioral_deviation: float,
        correlation_signals: list,
    ) -> float:
        """Confidence in the decision (0-1)"""
        base_confidence = min(abs(risk_score - 50) / 50, 1.0)
        graph_weight = 0.2 if attack_graph_state.get("chains", []) else 0.0
        deviation_weight = min(behavioral_deviation / 100, 1.0) * 0.15
        correlation_weight = min(len(correlation_signals) / 5, 1.0) * 0.15
        return min(base_confidence + graph_weight + deviation_weight + correlation_weight, 1.0)

    def _determine_actions(
        self,
        decision_type: DecisionType,
        user_id: str,
        tenant_id: str,
        risk_score: float,
        attack_graph_state: Dict[str, Any],
    ) -> list:
        """Determine specific mitigation actions"""
        actions = []

        if decision_type == DecisionType.MONITOR:
            actions.append({
                "type": "increase_audit_logging",
                "target": user_id,
                "intensity": "high"
            })
        elif decision_type == DecisionType.THROTTLE:
            actions.append({
                "type": "rate_limit",
                "target": user_id,
                "requests_per_minute": 10
            })
            actions.append({
                "type": "increase_audit_logging",
                "target": user_id,
                "intensity": "critical"
            })
        elif decision_type == DecisionType.BLOCK:
            actions.append({
                "type": "block_user",
                "target": user_id,
                "duration_seconds": 3600
            })
            actions.append({
                "type": "notify_soc",
                "severity": "high"
            })
        elif decision_type == DecisionType.ISOLATE_USER:
            actions.append({
                "type": "isolate_user",
                "target": user_id,
                "mode": "sandbox"
            })
            actions.append({
                "type": "revoke_tokens",
                "target": user_id
            })
            actions.append({
                "type": "notify_soc",
                "severity": "critical"
            })
        elif decision_type == DecisionType.ISOLATE_TENANT:
            actions.append({
                "type": "quarantine_tenant",
                "target": tenant_id,
                "mode": "read_only"
            })
            actions.append({
                "type": "trigger_fail_safe",
                "scope": "tenant",
                "target": tenant_id
            })
            actions.append({
                "type": "notify_soc",
                "severity": "critical"
            })

        if attack_graph_state.get("severity") == "critical":
            actions.append({
                "type": "increase_monitoring",
                "scope": "tenant",
                "target": tenant_id
            })

        return actions

    def _generate_reason(
        self,
        risk_score: float,
        attack_graph_state: Dict[str, Any],
        behavioral_deviation: float,
        correlation_signals: list,
    ) -> str:
        reasons = []
        
        if risk_score >= 75:
            reasons.append(f"high risk score ({risk_score:.1f})")
        
        if attack_graph_state.get("chains"):
            reasons.append(f"attack chain detected: {len(attack_graph_state['chains'])} chains")
        
        if behavioral_deviation > 80:
            reasons.append(f"severe behavior deviation ({behavioral_deviation:.1f}%)")
        
        if correlation_signals:
            reasons.append(f"multi-user correlation ({len(correlation_signals)} signals)")
        
        return "; ".join(reasons) if reasons else "routine decision"

    def _calculate_ttl(self, decision_type: DecisionType, risk_score: float) -> int:
        """Time to live for decision in seconds"""
        base_ttl = {
            DecisionType.ALLOW: 3600,
            DecisionType.MONITOR: 1800,
            DecisionType.THROTTLE: 900,
            DecisionType.BLOCK: 3600,
            DecisionType.ISOLATE_USER: 7200,
            DecisionType.ISOLATE_TENANT: 14400,
            DecisionType.FAIL_SAFE_TRIGGER: 28800,
        }
        ttl = base_ttl.get(decision_type, 3600)
        if risk_score > 90:
            ttl = min(ttl * 2, 28800)
        return ttl

    def _record_decision(self, user_id: str, decision: AutonomousDecision):
        """Store decision for audit and feedback"""
        expiry = datetime.utcnow() + timedelta(seconds=decision.ttl_seconds)
        
        if user_id not in self.decision_history:
            self.decision_history[user_id] = []
        self.decision_history[user_id].append(decision)
        
        key = f"{user_id}_{decision.decision_type.value}"
        self.active_decisions[key] = {
            "decision": decision,
            "expiry": expiry
        }

    def get_active_decision(self, user_id: str) -> Optional[AutonomousDecision]:
        """Check if user has an active decision"""
        now = datetime.utcnow()
        for key, record in list(self.active_decisions.items()):
            if record["expiry"] < now:
                del self.active_decisions[key]
            elif key.startswith(user_id):
                return record["decision"]
        return None

    def get_decision_history(self, user_id: str, limit: int = 10) -> list:
        """Get recent decisions for a user"""
        return self.decision_history.get(user_id, [])[-limit:]


_global_decision_engine = AutonomousDecisionEngine()


def get_autonomous_decision_engine() -> AutonomousDecisionEngine:
    return _global_decision_engine
