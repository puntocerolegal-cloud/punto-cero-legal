"""
CommercialAgent

Handles commercial inquiries, contracts, pricing, and business deals.
"""

from typing import Optional, Dict, Any, List
from datetime import datetime
from .base_agent import BaseAgent, AgentResponse
from backend.conversation.services.response_generator import ResponseGenerator


class CommercialAgent(BaseAgent):
    """
    Commercial agent for handling business inquiries,
    pricing discussions, and contract-related conversations.
    """

    def __init__(self):
        super().__init__("commercial")
        self.handled_intents = {
            "sales",
            "pricing_inquiry",
            "contract_review",
            "deal_negotiation",
            "business_proposal",
            "commercial_terms",
            "partnership"
        }
        self.response_generator = ResponseGenerator()

    def process_message(
        self,
        message: str,
        context: Optional[Dict[str, Any]] = None,
        conversation_history: Optional[List[Dict[str, Any]]] = None
    ) -> AgentResponse:
        """
        Process commercial inquiries using AI-powered response generation.
        """
        if context is None:
            context = {}
        
        # Generate AI-powered response
        response_data = self.response_generator.generate_response(
            message=message,
            agent_type="commercial",
            context=context,
            conversation_history=conversation_history
        )
        
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
            confidence=response_data.get("confidence", 0.7)
        )

    def validate_intent(self, intent: str) -> bool:
        """Check if agent handles this intent"""
        return intent in self.handled_intents

    def get_agent_type(self) -> str:
        """Return agent type"""
        return self.agent_type
