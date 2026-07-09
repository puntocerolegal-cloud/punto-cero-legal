"""
ClientAgent

Handles existing client interactions, case status, billing, and account issues.

Behaviors:
- Greeting returning clients by name
- Case status inquiries
- Document requests
- Payment/billing questions
- Account management
- Escalation to assigned lawyer
"""

from typing import Optional, Dict, Any, List
from datetime import datetime
from .base_agent import BaseAgent, AgentResponse
from backend.conversation.services.response_generator import ResponseGenerator


class ClientAgent(BaseAgent):
    """
    Agent for existing clients managing:
    - Case status and updates
    - Document access and delivery
    - Billing and payment inquiries
    - Account and subscription management
    - Communication with assigned lawyer
    """

    def __init__(self):
        super().__init__("client")
        self.handled_intents = {
            "case_status_inquiry",
            "case_update_request",
            "document_request",
            "billing_inquiry",
            "payment_request",
            "account_management",
            "communication_request",
            "schedule_meeting"
        }
        self.response_generator = ResponseGenerator()

        self.escalation_triggers = {
            "urgent",
            "immediately",
            "critical",
            "emergency",
            "lawyer",
            "attorney",
            "hablar con mi abogado"
        }

    def process_message(
        self,
        message: str,
        context: Optional[Dict[str, Any]] = None,
        conversation_history: Optional[List[Dict[str, Any]]] = None
    ) -> AgentResponse:
        """
        Process client message using AI-powered response generation.
        """
        if context is None:
            context = {}

        # Generate AI-powered response
        response_data = self.response_generator.generate_response(
            message=message,
            agent_type="client",
            context=context,
            conversation_history=conversation_history
        )

        # Check for escalation needs
        should_escalate = self._check_escalation(message)

        return AgentResponse(
            content=response_data["content"],
            agent_type=self.agent_type,
            channel=context.get("channel", "unknown"),
            timestamp=datetime.now(),
            metadata={
                "provider": response_data.get("provider", "fallback"),
                "generation_time": response_data.get("metadata", {}).get("generation_time", 0),
                "intent": self._detect_intent(message),
                "client_id": context.get("client_id"),
                "client_name": context.get("client_name"),
                "escalation_needed": should_escalate,
            },
            confidence=response_data.get("confidence", 0.7),
            requires_escalation=should_escalate,
            escalation_reason="Client requires direct lawyer communication" if should_escalate else None
        )

    def _detect_intent(self, message: str) -> str:
        """Detect client intent from message"""
        msg_lower = message.lower()

        if any(word in msg_lower for word in ["estado", "status", "case", "expediente", "progreso"]):
            return "case_status_inquiry"

        if any(word in msg_lower for word in ["documento", "document", "archivo", "file", "certificado"]):
            return "document_request"

        if any(word in msg_lower for word in ["pago", "payment", "factura", "invoice", "costo", "precio"]):
            return "billing_inquiry"

        if any(word in msg_lower for word in ["reunión", "meeting", "llamada", "call", "entrevista"]):
            return "schedule_meeting"

        if any(word in msg_lower for word in ["cambio", "actualizar", "update", "cambios", "novedad"]):
            return "case_update_request"

        return "client_inquiry"

    def _check_escalation(self, message: str) -> bool:
        """Check if message requires escalation"""
        msg_lower = message.lower()
        return any(trigger in msg_lower for trigger in self.escalation_triggers)

    def _detect_intent(self, message: str) -> str:
        """Detect client intent from message"""
        msg_lower = message.lower()

        if any(word in msg_lower for word in ["estado", "status", "case", "expediente", "progreso"]):
            return "case_status_inquiry"

        if any(word in msg_lower for word in ["documento", "document", "archivo", "file", "certificado"]):
            return "document_request"

        if any(word in msg_lower for word in ["pago", "payment", "factura", "invoice", "costo", "precio"]):
            return "billing_inquiry"

        if any(word in msg_lower for word in ["reunión", "meeting", "llamada", "call", "entrevista"]):
            return "schedule_meeting"

        if any(word in msg_lower for word in ["cambio", "actualizar", "update", "cambios", "novedad"]):
            return "case_update_request"

        return "client_inquiry"

    def _check_escalation(self, message: str) -> bool:
        """Check if message requires escalation"""
        msg_lower = message.lower()
        return any(trigger in msg_lower for trigger in self.escalation_triggers)

    def validate_intent(self, intent: str) -> bool:
        """Check if agent handles this intent"""
        return intent in self.handled_intents

    def get_agent_type(self) -> str:
        """Return agent type"""
        return self.agent_type
