"""
ConversationLogger

Logs all conversation interactions for analytics, debugging, and audit.
Persists to MongoDB when available.
"""

from typing import Optional, Dict, Any, List
from datetime import datetime
from dataclasses import dataclass, field


@dataclass
class InteractionLog:
    """Single interaction log entry"""
    conversation_id: str
    timestamp: datetime
    message_content: str
    message_role: str  # customer, agent, system
    channel: str
    profile: Optional[str] = None
    intent: Optional[str] = None
    agent_type: Optional[str] = None
    confidence: Optional[float] = None
    should_escalate: bool = False
    escalation_reason: Optional[str] = None
    decisions: List[Dict[str, Any]] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)


class ConversationLogger:
    """
    Logs conversation interactions for analytics and debugging.
    
    Features:
    - In-memory logging with optional MongoDB persistence
    - Conversation tracking
    - Performance metrics
    - Decision tracking
    - Escalation tracking
    """
    
    def __init__(self):
        self.logs: List[InteractionLog] = []
        self._persistence_enabled = False
        self._persistence_adapter = None
    
    def log_interaction(
        self,
        message: Any,  # WhatsAppMessage or similar
        activation: Dict[str, Any],
        routing: Any,  # RoutingDecision
        response: Any  # DarwinWhatsAppResponse
    ):
        """Log complete interaction"""
        log_entry = InteractionLog(
            conversation_id=getattr(message, 'message_id', 'unknown'),
            timestamp=datetime.now(),
            message_content=message.message_content,
            message_role="customer",
            channel="whatsapp",
            profile=activation.get("profile"),
            intent=activation.get("intent"),
            agent_type=getattr(routing, 'selected_agent', 'unknown'),
            confidence=getattr(routing, 'confidence', 0.0),
            should_escalate=activation.get("should_escalate", False),
            escalation_reason=activation.get("escalation_reason"),
            decisions=activation.get("suggestions", []),
            metadata={
                "routing_metadata": getattr(routing, 'metadata', {}),
                "response_metadata": getattr(response, 'metadata', {})
            }
        )
        
        self.logs.append(log_entry)
        
        # Persist if enabled
        if self._persistence_enabled and self._persistence_adapter:
            try:
                self._persistence_adapter.save_log(log_entry)
            except Exception:
                pass  # Silently fail logging
    
    def log_agent_response(
        self,
        conversation_id: str,
        agent_type: str,
        response_content: str,
        confidence: float,
        metadata: Optional[Dict[str, Any]] = None
    ):
        """Log agent response"""
        log_entry = InteractionLog(
            conversation_id=conversation_id,
            timestamp=datetime.now(),
            message_content=response_content,
            message_role="agent",
            channel="unknown",
            agent_type=agent_type,
            confidence=confidence,
            metadata=metadata or {}
        )
        
        self.logs.append(log_entry)
    
    def get_conversation_logs(self, conversation_id: str) -> List[InteractionLog]:
        """Get all logs for a conversation"""
        return [log for log in self.logs if log.conversation_id == conversation_id]
    
    def get_recent_logs(self, limit: int = 100) -> List[InteractionLog]:
        """Get recent logs"""
        return self.logs[-limit:]
    
    def get_escalation_logs(self) -> List[InteractionLog]:
        """Get all logs that required escalation"""
        return [log for log in self.logs if log.should_escalate]
    
    def get_statistics(self) -> Dict[str, Any]:
        """Get logging statistics"""
        total_interactions = len(self.logs)
        escalations = sum(1 for log in self.logs if log.should_escalate)
        
        # Count by agent type
        agent_counts = {}
        for log in self.logs:
            if log.agent_type:
                agent_counts[log.agent_type] = agent_counts.get(log.agent_type, 0) + 1
        
        # Count by intent
        intent_counts = {}
        for log in self.logs:
            if log.intent:
                intent_counts[log.intent] = intent_counts.get(log.intent, 0) + 1
        
        return {
            "total_interactions": total_interactions,
            "total_escalations": escalations,
            "escalation_rate": (escalations / total_interactions * 100) if total_interactions > 0 else 0,
            "by_agent_type": agent_counts,
            "by_intent": intent_counts,
            "storage": "mongodb" if self._persistence_enabled else "in_memory"
        }
    
    def enable_persistence(self, adapter):
        """Enable MongoDB persistence"""
        self._persistence_enabled = True
        self._persistence_adapter = adapter
    
    def disable_persistence(self):
        """Disable persistence"""
        self._persistence_enabled = False
        self._persistence_adapter = None
    
    def clear_logs(self):
        """Clear all logs (testing only)"""
        self.logs.clear()


# Singleton instance
_logger_instance = None

def get_conversation_logger() -> ConversationLogger:
    """Get global conversation logger instance"""
    global _logger_instance
    if _logger_instance is None:
        _logger_instance = ConversationLogger()
    return _logger_instance