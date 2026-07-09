"""
PROFILE CLASSIFIER

Automatically detects customer profile from conversation.

Profiles:
- CLIENT: Needs legal services
- LAWYER: Wants to join platform
- FIRM: Wants partnership
- SUPPORT: Technical issues
- VISITOR: Casual inquiry
- ADMIN: Internal staff
"""

from enum import Enum
from typing import Optional, Tuple
from dataclasses import dataclass


class CustomerProfile(str, Enum):
    """Customer profile types"""
    CLIENT = "client"
    LAWYER = "lawyer"
    FIRM = "firm"
    SUPPORT = "support"
    VISITOR = "visitor"
    ADMIN = "admin"


@dataclass
class ClassificationResult:
    """Profile classification result"""
    profile: CustomerProfile
    confidence: float  # 0.0 to 1.0
    reasoning: str
    signals: list  # What triggered this classification


class ProfileClassifier:
    """
    Detects customer profile from text and metadata.
    
    Uses keyword matching and heuristics to classify.
    Production-ready, minimal dependencies.
    """
    
    def __init__(self):
        """Initialize classifier with keyword patterns"""
        
        # Keyword patterns for each profile
        self.client_keywords = [
            "necesito", "ayuda", "abogado", "legal", "problema",
            "contrato", "demanda", "divorcio", "herencia", "caso",
            "asesoría", "consulta", "defensa", "reclamo", "deuda",
            "testamento", "poder", "documento", "litigio"
        ]
        
        self.lawyer_keywords = [
            "abogado", "profesional", "unirme", "registrar", "casos",
            "clientes", "plataforma", "trabajo", "oportunidad",
            "comisión", "ganar dinero", "colaboración", "red",
            "panel", "acceso", "cuenta", "suscripción"
        ]
        
        self.firm_keywords = [
            "firma", "empresa", "bufete", "equipo", "abogados",
            "escalabilidad", "partnership", "integración", "solución",
            "empresa", "servicios", "volumen", "múltiples casos",
            "gestión", "eficiencia"
        ]
        
        self.support_keywords = [
            "error", "no funciona", "problema técnico", "ayuda",
            "no puedo", "no me aparece", "se cayó", "lentitud",
            "contraseña", "acceso", "cuenta", "app", "sitio"
        ]
    
    def classify(
        self,
        message: str,
        phone_number: Optional[str] = None,
        existing_customer: bool = False,
        metadata: Optional[dict] = None
    ) -> ClassificationResult:
        """
        Classify customer profile from message.
        
        Args:
            message: User's message text
            phone_number: WhatsApp phone (for regional patterns)
            existing_customer: If known customer
            metadata: Additional context
        
        Returns:
            ClassificationResult with profile and confidence
        """
        
        if metadata is None:
            metadata = {}
        
        message_lower = message.lower()
        
        # Metadata-based classification (highest priority)
        if metadata.get("is_admin"):
            return ClassificationResult(
                profile=CustomerProfile.ADMIN,
                confidence=1.0,
                reasoning="Admin metadata provided",
                signals=["admin_flag"]
            )
        
        # Return patterns
        if existing_customer and not self._is_asking_about_new_service(message_lower):
            return ClassificationResult(
                profile=CustomerProfile.CLIENT,
                confidence=0.95,
                reasoning="Returning customer",
                signals=["returning_customer", "customer_id_known"]
            )
        
        # Keyword-based classification
        scores = {
            CustomerProfile.CLIENT: self._score_keywords(message_lower, self.client_keywords),
            CustomerProfile.LAWYER: self._score_keywords(message_lower, self.lawyer_keywords),
            CustomerProfile.FIRM: self._score_keywords(message_lower, self.firm_keywords),
            CustomerProfile.SUPPORT: self._score_keywords(message_lower, self.support_keywords),
        }
        
        # Find highest scoring profile
        best_profile = max(scores.items(), key=lambda x: x[1][0])
        profile = best_profile[0]
        confidence, signals = best_profile[1]
        
        # If all scores are low, classify as visitor
        if confidence < 0.3:
            return ClassificationResult(
                profile=CustomerProfile.VISITOR,
                confidence=0.5,
                reasoning="Generic inquiry with low signal strength",
                signals=["low_confidence", "generic_inquiry"]
            )
        
        # Build reasoning
        reasoning = f"{profile.value.capitalize()} profile detected"
        if confidence > 0.8:
            reasoning += " (high confidence)"
        elif confidence > 0.6:
            reasoning += " (medium confidence)"
        else:
            reasoning += " (low confidence)"
        
        return ClassificationResult(
            profile=profile,
            confidence=confidence,
            reasoning=reasoning,
            signals=signals
        )
    
    def _score_keywords(self, message: str, keywords: list) -> Tuple[float, list]:
        """
        Score message against keyword list.
        
        Returns: (score, matched_keywords)
        """
        matched = []
        for keyword in keywords:
            if keyword in message:
                matched.append(keyword)
        
        # Score: matched_count / total_keywords
        # Plus bonus for multiple matches
        if not matched:
            return 0.0, []
        
        base_score = len(matched) / len(keywords)
        
        # Bonus for multiple matches (indicates strong signal)
        if len(matched) > 2:
            base_score = min(1.0, base_score * 1.3)
        
        return base_score, matched
    
    def _is_asking_about_new_service(self, message_lower: str) -> bool:
        """Check if returning customer is asking about new service"""
        new_service_keywords = [
            "nuevo", "otro", "más", "adicional", "diferente",
            "también", "y además", "tengo otra"
        ]
        return any(keyword in message_lower for keyword in new_service_keywords)
    
    def get_profile_description(self, profile: CustomerProfile) -> str:
        """Get human-readable description of profile"""
        descriptions = {
            CustomerProfile.CLIENT: "Person seeking legal services",
            CustomerProfile.LAWYER: "Professional lawyer seeking platform access",
            CustomerProfile.FIRM: "Law firm seeking partnership",
            CustomerProfile.SUPPORT: "User with technical issue",
            CustomerProfile.VISITOR: "Casual inquiry",
            CustomerProfile.ADMIN: "Internal staff member"
        }
        return descriptions.get(profile, "Unknown profile")


# Singleton instance
_classifier_instance = None

def get_classifier() -> ProfileClassifier:
    """Get global classifier instance"""
    global _classifier_instance
    if _classifier_instance is None:
        _classifier_instance = ProfileClassifier()
    return _classifier_instance
