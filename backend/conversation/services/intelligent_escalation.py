"""
Intelligent Escalation System

DARWIN automatically detects when to escalate to human lawyers.
Not by keywords, but by:
- Risk
- Urgency
- Commercial value
- Case type
- Premium client
- Company

FASE 10: Escalamiento Inteligente
"""

from typing import Optional, Dict, Any, List
from datetime import datetime
from dataclasses import dataclass, field
from enum import Enum


class EscalationReason(str, Enum):
    """Reasons for escalation"""
    URGENT_LEGAL_MATTER = "urgent_legal_matter"
    HIGH_RISK_CASE = "high_risk_case"
    PREMIUM_CLIENT = "premium_client"
    COMPLEX_CASE = "complex_case"
    CLIENT_REQUEST = "client_request"
    LEGAL_ADVICE_NEEDED = "legal_advice_needed"
    CONTRACT_REVIEW = "contract_review"
    COMPLAINT = "complaint"
    HIGH_VALUE = "high_value"


@dataclass
class EscalationDecision:
    """Escalation decision with context"""
    should_escalate: bool
    reason: EscalationReason
    confidence: float
    urgency: str  # low, normal, high, critical
    target_team: str  # legal, support, commercial, partnerships
    context: Dict[str, Any] = field(default_factory=dict)
    timestamp: datetime = field(default_factory=datetime.now)


class IntelligentEscalation:
    """
    Intelligent escalation system that determines when human intervention is needed.
    
    Not based on keywords, but on:
    - Risk assessment
    - Urgency level
    - Commercial value
    - Case complexity
    - Client tier
    - Company status
    """
    
    def __init__(self):
        self.escalation_history: List[EscalationDecision] = []
        self.risk_thresholds = self._initialize_risk_thresholds()
    
    def _initialize_risk_thresholds(self) -> Dict[str, Any]:
        """Initialize risk assessment thresholds"""
        return {
            "high_value_threshold": 50000.0,  # $50,000+
            "urgent_response_time": 5,  # minutes
            "premium_client_indicators": ["vip", "premium", "enterprise", "gold"],
            "complex_case_keywords": [
                "divorcio", "herencia", "demanda", "litigio",
                "penal", "criminal", "patente", "propiedad intelectual"
            ],
            "risk_indicators": [
                "urgente", "emergencia", "crítico", "inmediato",
                "pérdida", "riesgo", "daño", "perjuicio"
            ]
        }
    
    def should_escalate(
        self,
        profile: str,
        intent: str,
        priority: str,
        message: str,
        context: Dict[str, Any]
    ) -> EscalationDecision:
        """
        Determine if conversation should be escalated to human.
        
        Args:
            profile: Customer profile
            intent: Detected intent
            priority: Conversation priority
            message: User message
            context: Full conversation context
            
        Returns:
            EscalationDecision with escalation details
        """
        message_lower = message.lower()
        escalation_score = 0.0
        reasons = []
        urgency = "normal"
        target_team = "support"
        
        # Factor 1: Urgency (weight: 30%)
        urgency_score, urgency_level = self._assess_urgency(message_lower, priority)
        escalation_score += urgency_score * 0.3
        if urgency_score > 0.7:
            reasons.append(EscalationReason.URGENT_LEGAL_MATTER)
            urgency = urgency_level
            target_team = "legal"
        
        # Factor 2: Commercial value (weight: 25%)
        value_score = self._assess_commercial_value(context)
        escalation_score += value_score * 0.35  # Increased weight for high-value deals
        if value_score >= 0.9:  # $100k+
            reasons.append(EscalationReason.HIGH_VALUE)
            if target_team == "support":
                target_team = "commercial"
        
        # Factor 3: Client tier (weight: 20%)
        tier_score = self._assess_client_tier(profile, context)
        escalation_score += tier_score * 0.2
        if tier_score > 0.7:
            reasons.append(EscalationReason.PREMIUM_CLIENT)
            if urgency == "normal":
                urgency = "high"
        
        # Factor 4: Case complexity (weight: 15%)
        complexity_score = self._assess_case_complexity(message_lower, intent)
        escalation_score += complexity_score * 0.15
        if complexity_score > 0.7:
            reasons.append(EscalationReason.COMPLEX_CASE)
            target_team = "legal"
        
        # Factor 5: Risk assessment (weight: 10%)
        risk_score = self._assess_risk(message_lower, context)
        escalation_score += risk_score * 0.1
        if risk_score > 0.8:
            reasons.append(EscalationReason.HIGH_RISK_CASE)
            urgency = "critical"
        
        # Determine if should escalate
        should_escalate = escalation_score >= 0.5  # 50% threshold for high-value clients
        
        # Get primary reason
        primary_reason = reasons[0] if reasons else EscalationReason.CLIENT_REQUEST
        
        # Create decision
        decision = EscalationDecision(
            should_escalate=should_escalate,
            reason=primary_reason,
            confidence=escalation_score,
            urgency=urgency,
            target_team=target_team,
            context={
                "escalation_score": escalation_score,
                "all_reasons": [r.value for r in reasons],
                "profile": profile,
                "intent": intent,
                "priority": priority
            }
        )
        
        # Record decision
        self.escalation_history.append(decision)
        
        return decision
    
    def _assess_urgency(self, message_lower: str, priority: str) -> tuple[float, str]:
        """Assess urgency level from message and priority"""
        urgency_score = 0.0
        urgency_level = "normal"
        
        # Check priority first
        if priority == "critical":
            urgency_score = 1.0
            urgency_level = "critical"
        elif priority == "high":
            urgency_score = 0.7
            urgency_level = "high"
        elif priority == "medium":
            urgency_score = 0.4
            urgency_level = "normal"
        
        # Boost from message content
        urgent_keywords = {
            "urgente": 0.3,
            "emergencia": 0.4,
            "inmediato": 0.3,
            "ahora": 0.2,
            "crítico": 0.35,
            "emergency": 0.4,
            "asap": 0.3,
            "hoy mismo": 0.25
        }
        
        for keyword, score_boost in urgent_keywords.items():
            if keyword in message_lower:
                urgency_score = min(1.0, urgency_score + score_boost)
                if urgency_score > 0.8:
                    urgency_level = "critical"
                elif urgency_score > 0.6:
                    urgency_level = "high"
                break
        
        return urgency_score, urgency_level
    
    def _assess_commercial_value(self, context: Dict[str, Any]) -> float:
        """Assess commercial value of the conversation"""
        estimated_value = context.get("estimated_value", 0)
        
        if estimated_value >= 100000:
            return 1.0
        elif estimated_value >= 50000:
            return 0.9
        elif estimated_value >= 20000:
            return 0.7
        elif estimated_value >= 10000:
            return 0.5
        elif estimated_value >= 5000:
            return 0.3
        
        return 0.0
    
    def _assess_client_tier(self, profile: str, context: Dict[str, Any]) -> float:
        """Assess client tier/importance"""
        # Premium indicators
        premium_indicators = self.risk_thresholds["premium_client_indicators"]
        
        if profile in ["vip", "premium"] or context.get("is_vip", False):
            return 1.0
        elif profile in ["company", "enterprise"] or context.get("is_enterprise", False):
            return 0.9
        elif profile == "firm":
            return 0.7
        elif profile == "active_client":
            return 0.5
        elif profile == "potential_client":
            return 0.3
        
        return 0.1
    
    def _assess_case_complexity(self, message_lower: str, intent: str) -> float:
        """Assess case complexity"""
        complexity_score = 0.0
        
        # Complex case keywords
        complex_keywords = self.risk_thresholds["complex_case_keywords"]
        matches = sum(1 for kw in complex_keywords if kw in message_lower)
        
        if matches > 0:
            complexity_score = min(0.9, 0.4 + (matches * 0.15))
        
        # Complex intents
        if intent in ["legal_case", "urgent", "complaint"]:
            complexity_score = min(1.0, complexity_score + 0.3)
        
        return complexity_score
    
    def _assess_risk(self, message_lower: str, context: Dict[str, Any]) -> float:
        """Assess risk level"""
        risk_score = 0.0
        
        # Risk indicators
        risk_indicators = self.risk_thresholds["risk_indicators"]
        matches = sum(1 for kw in risk_indicators if kw in message_lower)
        
        if matches > 0:
            risk_score = min(0.9, 0.3 + (matches * 0.2))
        
        # Context-based risk
        if context.get("is_returning_customer") and context.get("has_open_cases"):
            risk_score = min(1.0, risk_score + 0.2)
        
        return risk_score
    
    def get_escalation_statistics(self) -> Dict[str, Any]:
        """Get escalation statistics"""
        total_escalations = len(self.escalation_history)
        if total_escalations == 0:
            return {"total_escalations": 0}
        
        # Count by reason
        reason_counts = {}
        for decision in self.escalation_history:
            reason = decision.reason.value
            reason_counts[reason] = reason_counts.get(reason, 0) + 1
        
        # Count by urgency
        urgency_counts = {}
        for decision in self.escalation_history:
            urgency = decision.urgency
            urgency_counts[urgency] = urgency_counts.get(urgency, 0) + 1
        
        # Count by target team
        team_counts = {}
        for decision in self.escalation_history:
            team = decision.target_team
            team_counts[team] = team_counts.get(team, 0) + 1
        
        return {
            "total_escalations": total_escalations,
            "escalation_rate": sum(1 for d in self.escalation_history if d.should_escalate) / total_escalations * 100,
            "by_reason": reason_counts,
            "by_urgency": urgency_counts,
            "by_target_team": team_counts,
            "avg_confidence": sum(d.confidence for d in self.escalation_history) / total_escalations
        }
    
    def get_recent_escalations(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get recent escalations"""
        recent = self.escalation_history[-limit:]
        return [
            {
                "should_escalate": d.should_escalate,
                "reason": d.reason.value,
                "confidence": d.confidence,
                "urgency": d.urgency,
                "target_team": d.target_team,
                "timestamp": d.timestamp.isoformat()
            }
            for d in recent
        ]