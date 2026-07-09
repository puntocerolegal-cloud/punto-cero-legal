"""
FirmAgent

Handles law firm partnerships, enterprise solutions, and firm scaling.

Behaviors:
- Firm partnership benefits
- Enterprise pricing and contracts
- Team scaling and management
- Firm integration with platform
- Firm-level analytics and reporting
"""

from typing import Optional, Dict, Any, List
from datetime import datetime
from .base_agent import BaseAgent, AgentResponse
from backend.conversation.services.response_generator import ResponseGenerator


class FirmAgent(BaseAgent):
    """
    Agent for law firm partnerships and enterprise:
    - Firm benefits and partnership opportunities
    - Team management and scaling
    - Enterprise billing and contracts
    - Integration guidance
    - Performance analytics
    """

    def __init__(self):
        super().__init__("firm")
        self.handled_intents = {
            "firm_partnership",
            "enterprise_inquiry",
            "scaling_inquiry",
            "team_management",
            "billing_inquiry",
            "integration_support",
            "analytics_inquiry"
        }
        self.response_generator = ResponseGenerator()

    def process_message(
        self,
        message: str,
        context: Optional[Dict[str, Any]] = None,
        conversation_history: Optional[List[Dict[str, Any]]] = None
    ) -> AgentResponse:
        """
        Process firm partnership inquiry using AI-powered response generation.
        """
        if context is None:
            context = {}
        
        # Generate AI-powered response
        response_data = self.response_generator.generate_response(
            message=message,
            agent_type="firm",
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
            escalation_reason="Requires firm partnership team review" if should_escalate else None
        )
    
    def _check_escalation(self, message: str) -> bool:
        """Check if needs escalation to partnerships team"""
        escalation_triggers = {
            "contract", "contrato", "legal", "agreement", "acuerdo",
            "firm", "firma", "enterprise", "empresa"
        }
        msg_lower = message.lower()
        return any(trigger in msg_lower for trigger in escalation_triggers)

    def validate_intent(self, intent: str) -> bool:
        """Check if agent handles this intent"""
        return intent in self.handled_intents

    def get_agent_type(self) -> str:
        """Return agent type"""
        return self.agent_type
