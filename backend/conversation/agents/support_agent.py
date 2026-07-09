"""
SupportAgent

Handles technical support, account issues, troubleshooting, and general assistance.

Behaviors:
- Technical troubleshooting
- Account and billing support
- General platform questions
- Escalation to human support
- Issue documentation and tracking
"""

from typing import Optional, Dict, Any, List
from datetime import datetime
from .base_agent import BaseAgent, AgentResponse
from backend.conversation.services.response_generator import ResponseGenerator


class SupportAgent(BaseAgent):
    """
    Support agent for technical and account assistance:
    - Platform troubleshooting
    - Account issues
    - Billing and subscription help
    - Technical setup and integration
    - Issue escalation and tracking
    """

    def __init__(self):
        super().__init__("support")
        self.handled_intents = {
            "technical_support",
            "account_help",
            "billing_support",
            "general_inquiry",
            "bug_report",
            "feature_request",
            "troubleshooting"
        }
        self.response_generator = ResponseGenerator()
        
        self.escalation_triggers = {
            "error",
            "crash",
            "bug",
            "broken",
            "no funciona",
            "no work",
            "problem",
            "problema",
            "urgent",
            "urgente"
        }

    def process_message(
        self,
        message: str,
        context: Optional[Dict[str, Any]] = None,
        conversation_history: Optional[List[Dict[str, Any]]] = None
    ) -> AgentResponse:
        """
        Process support inquiry using AI-powered response generation.
        """
        if context is None:
            context = {}
        
        # Generate AI-powered response
        response_data = self.response_generator.generate_response(
            message=message,
            agent_type="support",
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
                "escalation_needed": should_escalate,
            },
            confidence=response_data.get("confidence", 0.7),
            requires_escalation=should_escalate,
            escalation_reason="Requires human support team" if should_escalate else None
        )
    
    def _detect_intent(self, message: str) -> str:
        """Detect support inquiry intent"""
        msg_lower = message.lower()
        
        if any(word in msg_lower for word in ["acceso", "login", "contraseña", "password"]):
            return "account_help"
        
        if any(word in msg_lower for word in ["error", "no funciona", "broken", "crash"]):
            return "technical_support"
        
        if any(word in msg_lower for word in ["pago", "payment", "factura", "invoice", "suscripción"]):
            return "billing_support"
        
        if any(word in msg_lower for word in ["reporte", "report", "bug", "problema", "issue"]):
            return "bug_report"
        
        if any(word in msg_lower for word in ["features", "funcionalidad", "nuevas características"]):
            return "feature_request"
        
        if any(word in msg_lower for word in ["cómo", "how", "configurar", "setup", "ayuda"]):
            return "troubleshooting"
        
        return "general_inquiry"
    
    def _check_escalation(self, message: str) -> bool:
        """Check if issue needs human escalation"""
        msg_lower = message.lower()
        
        # High-severity issues
        if any(trigger in msg_lower for trigger in self.escalation_triggers):
            return True
        
        # Account security issues
        if any(word in msg_lower for word in ["seguridad", "security", "pirateo", "hack"]):
            return True
        
        # Data loss
        if any(word in msg_lower for word in ["pérdida", "loss", "datos", "data", "borrado"]):
            return True
        
        return False

    def validate_intent(self, intent: str) -> bool:
        """Check if agent handles this intent"""
        return intent in self.handled_intents

    def get_agent_type(self) -> str:
        """Return agent type"""
        return self.agent_type
