"""
INTENT DETECTOR

Detects conversation intent to route appropriately and trigger CRM actions.

Intents:
- SALES: Customer interested in services
- SUPPORT: Technical or account help needed
- INFORMATION: General information request
- PARTNERSHIP: Partnership inquiry
- RECRUITMENT: Lawyer recruitment interest
- URGENT: Time-sensitive matter
- COMPLAINT: Customer complaint
"""

from enum import Enum
from typing import Optional, Tuple
from dataclasses import dataclass


class ConversationIntent(str, Enum):
    """Conversation intent types"""
    SALES = "sales"
    SUPPORT = "support"
    INFORMATION = "information"
    PARTNERSHIP = "partnership"
    RECRUITMENT = "recruitment"
    URGENT = "urgent"
    COMPLAINT = "complaint"
    INQUIRY = "inquiry"


@dataclass
class IntentResult:
    """Intent detection result"""
    intent: ConversationIntent
    confidence: float  # 0.0 to 1.0
    reasoning: str
    should_create_lead: bool
    should_create_case: bool
    requires_escalation: bool
    estimated_value: Optional[float] = None  # Estimated commercial value


class IntentDetector:
    """
    Detects conversation intent from message content.
    
    Used for:
    - Routing to correct agent
    - CRM automation decisions
    - Escalation logic
    - Commercial opportunity assessment
    """
    
    def __init__(self):
        """Initialize with intent patterns"""
        
        # Patterns for each intent
        self.urgent_patterns = [
            "urgente", "ahora", "inmediato", "rápido",
            "emergencia", "critico", "crisis", "problema",
            "help", "sos", "asap", "emergency",
            "today", "hoy mismo", "sin demora"
        ]
        
        self.sales_patterns = [
            "precio", "costo", "cuanto", "tarifa", "plan",
            "servicio", "contratar", "quiero", "necesito",
            "how much", "available", "empezar", "comenzar",
            "información", "detalles", "oferta"
        ]
        
        self.support_patterns = [
            "no funciona", "error", "problema técnico", "ayuda",
            "no puedo", "se cayó", "lento", "contraseña",
            "cuenta", "acceso", "bug", "issue",
            "doesn't work", "help needed"
        ]
        
        self.partnership_patterns = [
            "partnership", "alianza", "colaboración", "asociación",
            "firma", "empresa", "volumen", "múltiple",
            "integración", "solución", "distribuidor",
            "reseller", "joint venture"
        ]
        
        self.recruitment_patterns = [
            "abogado", "profesional", "unirme", "registrar",
            "trabajar", "oportunidad", "comisión", "ganancias",
            "join", "platform", "sign up", "como funciona"
        ]
        
        self.complaint_patterns = [
            "queja", "molesto", "furioso", "enojado",
            "inaceptable", "nunca", "terrible", "peor",
            "complaint", "upset", "angry", "bad experience"
        ]
    
    def detect(
        self,
        message: str,
        customer_profile: Optional[str] = None,
        is_returning_customer: bool = False,
        metadata: Optional[dict] = None
    ) -> IntentResult:
        """
        Detect conversation intent.
        
        Args:
            message: User's message text
            customer_profile: Profile type (client, lawyer, etc)
            is_returning_customer: If known customer
            metadata: Additional context
        
        Returns:
            IntentResult with intent and actions
        """
        
        if metadata is None:
            metadata = {}
        
        message_lower = message.lower()
        
        # Check patterns in priority order
        # Urgent takes priority over everything
        if self._matches_patterns(message_lower, self.urgent_patterns):
            return IntentResult(
                intent=ConversationIntent.URGENT,
                confidence=0.95,
                reasoning="Urgent language detected",
                should_create_lead=True,
                should_create_case=True,
                requires_escalation=True,
                estimated_value=5000.0
            )
        
        # Complaints
        if self._matches_patterns(message_lower, self.complaint_patterns):
            return IntentResult(
                intent=ConversationIntent.COMPLAINT,
                confidence=0.90,
                reasoning="Complaint detected",
                should_create_lead=is_returning_customer,
                should_create_case=is_returning_customer,
                requires_escalation=True
            )
        
        # Recruitment (if profile suggests lawyer)
        if customer_profile == "lawyer" and self._matches_patterns(message_lower, self.recruitment_patterns):
            return IntentResult(
                intent=ConversationIntent.RECRUITMENT,
                confidence=0.85,
                reasoning="Lawyer recruitment inquiry",
                should_create_lead=True,
                should_create_case=False,
                requires_escalation=False
            )
        
        # Partnership (if profile suggests firm)
        if customer_profile == "firm" and self._matches_patterns(message_lower, self.partnership_patterns):
            return IntentResult(
                intent=ConversationIntent.PARTNERSHIP,
                confidence=0.85,
                reasoning="Partnership inquiry detected",
                should_create_lead=True,
                should_create_case=False,
                requires_escalation=False,
                estimated_value=10000.0
            )
        
        # Support
        if self._matches_patterns(message_lower, self.support_patterns):
            return IntentResult(
                intent=ConversationIntent.SUPPORT,
                confidence=0.80,
                reasoning="Support issue detected",
                should_create_lead=False,
                should_create_case=is_returning_customer,
                requires_escalation=True
            )
        
        # Sales (commercial opportunity)
        if self._matches_patterns(message_lower, self.sales_patterns):
            estimated_value = self._estimate_commercial_value(message_lower)
            return IntentResult(
                intent=ConversationIntent.SALES,
                confidence=0.75,
                reasoning="Commercial inquiry detected",
                should_create_lead=True,
                should_create_case=False,
                requires_escalation=False,
                estimated_value=estimated_value
            )
        
        # Default to inquiry
        return IntentResult(
            intent=ConversationIntent.INQUIRY,
            confidence=0.5,
            reasoning="General inquiry",
            should_create_lead=not is_returning_customer,
            should_create_case=False,
            requires_escalation=False
        )
    
    def _matches_patterns(self, message: str, patterns: list) -> bool:
        """Check if message matches any pattern"""
        return any(pattern in message for pattern in patterns)
    
    def _estimate_commercial_value(self, message: str) -> float:
        """
        Estimate commercial value from message.
        
        Heuristic-based estimation.
        Returns estimated deal value in USD.
        """
        
        # Keywords associated with higher value
        high_value_keywords = [
            "empresa", "empresa grande", "múltiples",
            "escalabilidad", "millones", "importante",
            "urgent", "crítico", "legal"
        ]
        
        # Medium value baseline
        estimated_value = 2000.0
        
        # Increase for high-value signals
        for keyword in high_value_keywords:
            if keyword in message.lower():
                estimated_value *= 1.5
        
        # Cap at reasonable range
        return min(estimated_value, 50000.0)
    
    def get_intent_description(self, intent: ConversationIntent) -> str:
        """Get human-readable intent description"""
        descriptions = {
            ConversationIntent.SALES: "Commercial inquiry - sales opportunity",
            ConversationIntent.SUPPORT: "Technical or account support needed",
            ConversationIntent.INFORMATION: "General information request",
            ConversationIntent.PARTNERSHIP: "Business partnership inquiry",
            ConversationIntent.RECRUITMENT: "Lawyer recruitment interest",
            ConversationIntent.URGENT: "Time-sensitive urgent matter",
            ConversationIntent.COMPLAINT: "Customer complaint",
            ConversationIntent.INQUIRY: "General inquiry"
        }
        return descriptions.get(intent, "Unknown intent")


# Singleton instance
_detector_instance = None

def get_intent_detector() -> IntentDetector:
    """Get global intent detector instance"""
    global _detector_instance
    if _detector_instance is None:
        _detector_instance = IntentDetector()
    return _detector_instance
