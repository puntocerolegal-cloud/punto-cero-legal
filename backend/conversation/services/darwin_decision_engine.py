"""
DARWIN Decision Engine

Intelligent decision-making system for DARWIN.
Transforms DARWIN from a responder to an autonomous agent that makes decisions.

Decisions:
- Create lead
- Create client
- Create case
- Escalate to lawyer
- Schedule appointment
- Request documents
- Transfer agent
- Activate workflow
- Send email
- Send WhatsApp
- Notify admin
"""

from typing import Optional, Dict, Any, List
from datetime import datetime
from dataclasses import dataclass, field
from enum import Enum


class DecisionType(str, Enum):
    """Types of decisions DARWIN can make"""
    CREATE_LEAD = "create_lead"
    CREATE_CLIENT = "create_client"
    CREATE_CASE = "create_case"
    ESCALATE_LAWYER = "escalate_lawyer"
    SCHEDULE_APPOINTMENT = "schedule_appointment"
    REQUEST_DOCUMENTS = "request_documents"
    TRANSFER_AGENT = "transfer_agent"
    ACTIVATE_WORKFLOW = "activate_workflow"
    SEND_EMAIL = "send_email"
    SEND_WHATSAPP = "send_whatsapp"
    NOTIFY_ADMIN = "notify_admin"
    ROUTE_TO_AGENT = "route_to_agent"


@dataclass
class Decision:
    """Represents a decision made by DARWIN"""
    decision_type: DecisionType
    confidence: float
    reasoning: str
    parameters: Dict[str, Any] = field(default_factory=dict)
    priority: str = "normal"  # low, normal, high, critical
    requires_approval: bool = False
    auto_execute: bool = True
    timestamp: datetime = field(default_factory=datetime.now)


class DarwinDecisionEngine:
    """
    Makes intelligent decisions based on conversation context.
    
    This is what transforms DARWIN from a chatbot into an autonomous agent.
    DARWIN doesn't just respond - it decides what actions to take.
    """
    
    def __init__(self):
        self.decision_history: List[Decision] = []
        self.decision_rules = self._initialize_rules()
    
    def _initialize_rules(self) -> Dict[str, Dict[str, Any]]:
        """Initialize decision rules based on context"""
        return {
            "create_lead": {
                "conditions": ["sales", "partnership", "lawyer_recruitment"],
                "min_confidence": 0.7,
                "auto_execute": True
            },
            "create_case": {
                "conditions": ["legal_case", "urgent"],
                "min_confidence": 0.8,
                "auto_execute": True
            },
            "escalate_lawyer": {
                "conditions": ["urgent", "complaint", "legal_case"],
                "min_confidence": 0.75,
                "auto_execute": True
            },
            "schedule_appointment": {
                "conditions": ["sales", "partnership", "legal_case"],
                "min_confidence": 0.6,
                "auto_execute": False
            },
            "request_documents": {
                "conditions": ["legal_case", "client_onboarding"],
                "min_confidence": 0.7,
                "auto_execute": True
            },
            "notify_admin": {
                "conditions": ["complaint", "urgent", "vip_client"],
                "min_confidence": 0.8,
                "auto_execute": True
            },
            "send_whatsapp": {
                "conditions": ["follow_up", "appointment_reminder"],
                "min_confidence": 0.9,
                "auto_execute": True
            }
        }
    
    def make_decision(
        self,
        profile: str,
        intent: str,
        priority: str,
        context: Dict[str, Any],
        message: str
    ) -> List[Decision]:
        """
        Make decisions based on conversation analysis.
        
        Args:
            profile: Customer profile (client, lawyer, firm, etc.)
            intent: Detected intent
            priority: Conversation priority
            context: Full conversation context
            message: User message
            
        Returns:
            List of decisions to execute
        """
        decisions = []
        message_lower = message.lower()
        
        # Decision 1: Create lead for sales opportunities
        if self._should_create_lead(intent, profile, context):
            decisions.append(Decision(
                decision_type=DecisionType.CREATE_LEAD,
                confidence=0.85,
                reasoning=f"Sales intent detected with profile {profile}",
                parameters={
                    "profile": profile,
                    "intent": intent,
                    "source": "whatsapp",
                    "priority": priority
                },
                priority=priority,
                auto_execute=True
            ))
        
        # Decision 2: Create case for legal matters
        if self._should_create_case(intent, message_lower):
            decisions.append(Decision(
                decision_type=DecisionType.CREATE_CASE,
                confidence=0.9,
                reasoning="Legal case inquiry detected",
                parameters={
                    "case_type": self._detect_case_type(message_lower),
                    "urgency": priority,
                    "profile": profile
                },
                priority=priority,
                auto_execute=True
            ))
        
        # Decision 3: Escalate to lawyer for urgent/complex matters
        if self._should_escalate_lawyer(intent, priority, message_lower):
            decisions.append(Decision(
                decision_type=DecisionType.ESCALATE_LAWYER,
                confidence=0.95,
                reasoning="Urgent or complex legal matter requiring lawyer",
                parameters={
                    "reason": self._get_escalation_reason(message_lower),
                    "urgency": priority
                },
                priority="critical",
                auto_execute=True
            ))
        
        # Decision 4: Schedule appointment for high-value leads
        if self._should_schedule_appointment(intent, profile, context):
            decisions.append(Decision(
                decision_type=DecisionType.SCHEDULE_APPOINTMENT,
                confidence=0.75,
                reasoning="High-value lead requiring personal consultation",
                parameters={
                    "profile": profile,
                    "preferred_time": context.get("preferred_time", "morning")
                },
                priority="high",
                auto_execute=False  # Requires confirmation
            ))
        
        # Decision 5: Request documents for case creation
        if self._should_request_documents(intent, profile):
            decisions.append(Decision(
                decision_type=DecisionType.REQUEST_DOCUMENTS,
                confidence=0.8,
                reasoning="Case creation requires documentation",
                parameters={
                    "required_docs": self._get_required_documents(message_lower),
                    "profile": profile
                },
                priority="normal",
                auto_execute=True
            ))
        
        # Decision 6: Notify admin for VIP or critical situations
        if self._should_notify_admin(profile, priority, context):
            decisions.append(Decision(
                decision_type=DecisionType.NOTIFY_ADMIN,
                confidence=0.9,
                reasoning="VIP client or critical situation requires admin attention",
                parameters={
                    "profile": profile,
                    "priority": priority,
                    "reason": context.get("escalation_reason", "VIP interaction")
                },
                priority="high",
                auto_execute=True
            ))
        
        # Decision 7: Send WhatsApp follow-up
        if self._should_send_whatsapp_followup(intent, profile):
            decisions.append(Decision(
                decision_type=DecisionType.SEND_WHATSAPP,
                confidence=0.85,
                reasoning="Follow-up message needed",
                parameters={
                    "template": "follow_up",
                    "profile": profile
                },
                priority="normal",
                auto_execute=True
            ))
        
        # Record decisions
        for decision in decisions:
            self.decision_history.append(decision)
        
        return decisions
    
    def _should_create_lead(self, intent: str, profile: str, context: Dict[str, Any]) -> bool:
        """Determine if should create lead"""
        sales_intents = ["sales", "partnership", "lawyer_recruitment", "inquiry"]
        return (
            intent in sales_intents and
            profile in ["potential_client", "lawyer", "firm", "company", "new_user"] and
            context.get("confidence", 0) >= 0.6
        )
    
    def _should_create_case(self, intent: str, message_lower: str) -> bool:
        """Determine if should create case"""
        legal_keywords = ["caso", "demanda", "divorcio", "herencia", "testamento", 
                         "contrato", "litigio", "asesoría", "consulta legal"]
        return intent == "legal_case" or any(kw in message_lower for kw in legal_keywords)
    
    def _should_escalate_lawyer(self, intent: str, priority: str, message_lower: str) -> bool:
        """Determine if should escalate to lawyer"""
        urgent_keywords = ["urgente", "emergencia", "ahora", "inmediato", "crítico"]
        return (
            intent == "urgent" or
            priority in ["high", "critical"] or
            any(kw in message_lower for kw in urgent_keywords)
        )
    
    def _should_schedule_appointment(self, intent: str, profile: str, context: Dict[str, Any]) -> bool:
        """Determine if should schedule appointment"""
        return (
            intent in ["sales", "partnership"] and
            profile in ["potential_client", "firm", "company"] and
            context.get("estimated_value", 0) > 5000
        )
    
    def _should_request_documents(self, intent: str, profile: str) -> bool:
        """Determine if should request documents"""
        return intent == "legal_case" and profile in ["potential_client", "active_client"]
    
    def _should_notify_admin(self, profile: str, priority: str, context: Dict[str, Any]) -> bool:
        """Determine if should notify admin"""
        return (
            profile in ["vip", "premium", "company"] or
            priority == "critical" or
            context.get("is_vip", False)
        )
    
    def _should_send_whatsapp_followup(self, intent: str, profile: str) -> bool:
        """Determine if should send WhatsApp follow-up"""
        return intent in ["sales", "partnership"] and profile in ["hot_lead", "potential_client"]
    
    def _detect_case_type(self, message_lower: str) -> str:
        """Detect type of legal case from message"""
        case_types = {
            "familia": ["divorcio", "pensión", "custodia", "herencia", "testamento"],
            "civil": ["contrato", "demanda", "reclamo", "indemnización"],
            "penal": ["delito", "crimen", "acusación", "defensa penal"],
            "laboral": ["trabajo", "despido", "salario", "horario"],
            "comercial": ["empresa", "sociedad", "comercial", "negocio"]
        }
        
        for case_type, keywords in case_types.items():
            if any(kw in message_lower for kw in keywords):
                return case_type
        
        return "general"
    
    def _get_required_documents(self, message_lower: str) -> List[str]:
        """Determine required documents based on case type"""
        base_docs = ["identificación", "contacto"]
        
        if any(kw in message_lower for kw in ["divorcio", "herencia"]):
            return base_docs + ["certificado_matrimonio", "documentos_propiedad"]
        elif any(kw in message_lower for kw in ["contrato", "empresa"]):
            return base_docs + ["contrato_actual", "documentos_empresa"]
        elif any(kw in message_lower for kw in ["demanda", "litigio"]):
            return base_docs + ["pruebas", "comunicaciones_relacionadas"]
        
        return base_docs
    
    def _get_escalation_reason(self, message_lower: str) -> str:
        """Get reason for escalation"""
        if any(kw in message_lower for kw in ["urgente", "emergencia"]):
            return "Urgent legal matter requiring immediate attention"
        elif any(kw in message_lower for kw in ["queja", "molesto", "enojado"]):
            return "Customer complaint requiring human intervention"
        elif any(kw in message_lower for kw in ["caso", "demanda", "divorcio"]):
            return "Complex legal case requiring lawyer expertise"
        else:
            return "Customer request requires specialist attention"
    
    def get_decision_summary(self) -> Dict[str, Any]:
        """Get summary of all decisions made"""
        return {
            "total_decisions": len(self.decision_history),
            "decisions_by_type": self._count_decisions_by_type(),
            "recent_decisions": [
                {
                    "type": d.decision_type.value,
                    "confidence": d.confidence,
                    "timestamp": d.timestamp.isoformat()
                }
                for d in self.decision_history[-10:]
            ]
        }
    
    def _count_decisions_by_type(self) -> Dict[str, int]:
        """Count decisions by type"""
        counts = {}
        for decision in self.decision_history:
            type_name = decision.decision_type.value
            counts[type_name] = counts.get(type_name, 0) + 1
        return counts