"""
LawyerAgent

Handles lawyer recruitment, onboarding, platform benefits, and case assignments.

Behaviors:
- Platform benefits explanation
- Recruitment and onboarding guidance
- Commission and payment information
- Case assignment and management
- Lawyer support and resources
"""

from typing import Optional, Dict, Any, List
from datetime import datetime
from .base_agent import BaseAgent, AgentResponse
from backend.conversation.services.response_generator import ResponseGenerator


class LawyerAgent(BaseAgent):
    """
    Agent for lawyer recruitment and network management:
    - Platform benefits and features
    - Onboarding process
    - Commission structure
    - Case assignment and workflow
    - Lawyer support resources
    """

    def __init__(self):
        super().__init__("lawyer")
        self.handled_intents = {
            "lawyer_recruitment",
            "platform_benefits",
            "onboarding_inquiry",
            "commission_inquiry",
            "case_assignment_inquiry",
            "technical_support",
            "training_request"
        }
        self.response_generator = ResponseGenerator()

    def process_message(
        self,
        message: str,
        context: Optional[Dict[str, Any]] = None,
        conversation_history: Optional[List[Dict[str, Any]]] = None
    ) -> AgentResponse:
        """
        Process lawyer/recruiter message using AI-powered response generation.
        """
        if context is None:
            context = {}
        
        # Generate AI-powered response
        response_data = self.response_generator.generate_response(
            message=message,
            agent_type="lawyer",
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
                "intents": list(self.handled_intents)
            },
            confidence=response_data.get("confidence", 0.7),
            requires_escalation=should_escalate,
            escalation_reason="Requires human lawyer team review" if should_escalate else None
        )
    
    def _detect_intent(self, message: str) -> str:
        """Detect lawyer inquiry intent"""
        msg_lower = message.lower()
        
        if any(word in msg_lower for word in ["unirse", "join", "abogado", "lawyer", "profesional"]):
            return "lawyer_recruitment"
        
        if any(word in msg_lower for word in ["beneficio", "benefit", "ventaja", "advantage", "features"]):
            return "platform_benefits"
        
        if any(word in msg_lower for word in ["comisión", "commission", "pago", "payment", "ganancia"]):
            return "commission_inquiry"
        
        if any(word in msg_lower for word in ["caso", "case", "cliente", "client", "asignación"]):
            return "case_assignment_inquiry"
        
        if any(word in msg_lower for word in ["ayuda", "help", "soporte", "support", "problema"]):
            return "technical_support"
        
        if any(word in msg_lower for word in ["capacitación", "training", "curso", "course"]):
            return "training_request"
        
        return "platform_inquiry"
    
    def _check_escalation(self, message: str) -> bool:
        """Check if needs escalation to legal team"""
        escalation_triggers = {
            "contract", "contrato", "acuerdo", "agreement",
            "lawyer", "abogado", "legal", "jurídico"
        }
        msg_lower = message.lower()
        return any(trigger in msg_lower for trigger in escalation_triggers)

    def validate_intent(self, intent: str) -> bool:
        """Check if agent handles this intent"""
        return intent in self.handled_intents

    def get_agent_type(self) -> str:
        """Return agent type"""
        return self.agent_type
