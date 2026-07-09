"""
ESCALATION RULES
Determines when conversations should be escalated to humans.

Escalation Triggers:
- Urgent legal matter
- High risk situation
- Angry customer
- VIP customer
- Large deal
- International firm
- Request beyond automation capability
"""

from dataclasses import dataclass
from typing import Dict, Any, Optional, Tuple, List


@dataclass
class EscalationRule:
    """A rule for determining escalation."""
    name: str
    condition_func: callable
    escalation_reason: str
    priority: str


class EscalationRules:
    """
    Manages escalation rules.
    
    Determines when conversations need human attention.
    Can be customized and extended.
    """
    
    def __init__(self):
        """Initialize default escalation rules."""
        self.rules: List[EscalationRule] = []
        self._init_default_rules()
    
    def _init_default_rules(self):
        """Initialize default escalation rules."""
        
        # Rule 1: Emergency/urgent situations
        def urgent_situation(profile, intent, priority, conversation_data):
            urgency_keywords = [
                "emergency", "urgent", "immediately", "now", "critical",
                "death", "arrest", "lawsuit", "danger"
            ]
            message = conversation_data.get("message_content", "").lower()
            return any(kw in message for kw in urgency_keywords)
        
        self.rules.append(EscalationRule(
            name="urgent_situation",
            condition_func=urgent_situation,
            escalation_reason="Emergency or urgent legal matter",
            priority="critical"
        ))
        
        # Rule 2: VIP customers
        def vip_customer(profile, intent, priority, conversation_data):
            return conversation_data.get("is_vip", False) or profile == "firm"
        
        self.rules.append(EscalationRule(
            name="vip_customer",
            condition_func=vip_customer,
            escalation_reason="VIP customer requires personal attention",
            priority="high"
        ))
        
        # Rule 3: Angry/upset customer
        def angry_customer(profile, intent, priority, conversation_data):
            negative_keywords = [
                "angry", "furious", "disappointed", "unacceptable",
                "terrible", "worst", "never again", "complaint"
            ]
            message = conversation_data.get("message_content", "").lower()
            sentiment = conversation_data.get("sentiment_score", 0)
            return (any(kw in message for kw in negative_keywords) or 
                   sentiment < -0.5)
        
        self.rules.append(EscalationRule(
            name="angry_customer",
            condition_func=angry_customer,
            escalation_reason="Customer expressing frustration or anger",
            priority="high"
        ))
        
        # Rule 4: Large transaction
        def large_opportunity(profile, intent, priority, conversation_data):
            estimated_value = conversation_data.get("estimated_deal_size", 0)
            return estimated_value > 50000
        
        self.rules.append(EscalationRule(
            name="large_opportunity",
            condition_func=large_opportunity,
            escalation_reason="Large value opportunity requires management approval",
            priority="high"
        ))
        
        # Rule 5: International/complex
        def complex_situation(profile, intent, priority, conversation_data):
            is_international = conversation_data.get("is_international", False)
            is_cross_border = conversation_data.get("cross_border_elements", False)
            complexity_score = conversation_data.get("complexity_score", 0)
            return is_international or is_cross_border or complexity_score > 7
        
        self.rules.append(EscalationRule(
            name="complex_situation",
            condition_func=complex_situation,
            escalation_reason="Complex or international matter requires specialist",
            priority="high"
        ))
        
        # Rule 6: Multiple escalations
        def repeated_escalations(profile, intent, priority, conversation_data):
            escalation_count = conversation_data.get("escalation_count", 0)
            return escalation_count >= 2
        
        self.rules.append(EscalationRule(
            name="repeated_escalations",
            condition_func=repeated_escalations,
            escalation_reason="Multiple escalation attempts - requires human judgment",
            priority="high"
        ))
        
        # Rule 7: Critical priority automatic escalation
        def critical_priority(profile, intent, priority, conversation_data):
            return priority == "critical"
        
        self.rules.append(EscalationRule(
            name="critical_priority",
            condition_func=critical_priority,
            escalation_reason="Critical priority conversation",
            priority="critical"
        ))
    
    def register_rule(self, rule: EscalationRule):
        """Register a custom escalation rule."""
        self.rules.append(rule)
    
    def should_escalate(
        self,
        profile: str,
        intent: str,
        priority: str,
        conversation_data: Dict[str, Any]
    ) -> Tuple[bool, Optional[str]]:
        """
        Check if conversation should be escalated.
        
        Returns: (should_escalate, reason)
        """
        for rule in self.rules:
            try:
                if rule.condition_func(profile, intent, priority, conversation_data):
                    return True, rule.escalation_reason
            except Exception:
                # Rule evaluation error - skip and continue
                continue
        
        return False, None
    
    def get_matching_rules(
        self,
        profile: str,
        intent: str,
        priority: str,
        conversation_data: Dict[str, Any]
    ) -> List[EscalationRule]:
        """Get all rules that match current conversation."""
        matching = []
        for rule in self.rules:
            try:
                if rule.condition_func(profile, intent, priority, conversation_data):
                    matching.append(rule)
            except Exception:
                continue
        return matching


# Backward compatibility: No impact on existing systems
