"""
BaseAgent

Common interface for all conversation agents.
Defines standard methods and behaviors.
"""

from abc import ABC, abstractmethod
from typing import Optional, Dict, Any
from dataclasses import dataclass
from datetime import datetime


@dataclass
class AgentResponse:
    """Standard agent response structure"""
    content: str
    agent_type: str
    channel: str
    timestamp: datetime
    metadata: Dict[str, Any]
    confidence: float
    requires_escalation: bool = False
    escalation_reason: Optional[str] = None


class BaseAgent(ABC):
    """
    Abstract base class for all conversation agents.
    
    All agents must implement:
    - process_message(): Main message processing logic
    - validate_intent(): Verify if agent can handle intent
    - get_agent_type(): Return agent identifier
    """

    def __init__(self, agent_type: str):
        self.agent_type = agent_type
        self.created_at = datetime.now()

    @abstractmethod
    def process_message(
        self,
        message: str,
        context: Optional[Dict[str, Any]] = None,
        conversation_history: Optional[list] = None
    ) -> AgentResponse:
        """
        Process incoming message and generate response.

        Args:
            message: User message content
            context: User and conversation context
            conversation_history: Previous messages in conversation

        Returns:
            AgentResponse with content, metadata, confidence
        """
        pass

    @abstractmethod
    def validate_intent(self, intent: str) -> bool:
        """
        Verify if this agent can handle the detected intent.

        Args:
            intent: Detected user intention

        Returns:
            Boolean indicating if agent can handle intent
        """
        pass

    @abstractmethod
    def get_agent_type(self) -> str:
        """Get agent type identifier"""
        pass

    def get_metadata(self) -> Dict[str, Any]:
        """Get agent metadata"""
        return {
            "agent_type": self.agent_type,
            "created_at": self.created_at.isoformat(),
            "status": "initialized",
            "version": "1.0.0"
        }
