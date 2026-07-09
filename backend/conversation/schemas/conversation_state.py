"""
Conversation State Management

Defines the state machine for conversation progression through different phases.
"""

from enum import Enum
from typing import Dict, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime


class ConversationPhase(str, Enum):
    """Conversation phases in the commercial brain journey"""
    
    WELCOME = "welcome"
    """Initial greeting and rapport building"""
    
    DISCOVERY = "discovery"
    """Active listening and understanding user needs"""
    
    CLASSIFICATION = "classification"
    """Identifying user profile (Client, Lawyer, Firm, Support)"""
    
    GUIDANCE = "guidance"
    """Providing relevant information and advice"""
    
    RECOMMENDATION = "recommendation"
    """Suggesting specific solutions or next steps"""
    
    TRANSFER = "transfer"
    """Transferring to specialist or appropriate resource"""
    
    FINISHED = "finished"
    """Conversation completed successfully"""


class UserProfile(str, Enum):
    """User profile classification"""
    
    CLIENT = "client"
    """Person seeking legal advice"""
    
    LAWYER = "lawyer"
    """Independent legal professional"""
    
    FIRM = "firm"
    """Law firm or legal department"""
    
    SUPPORT = "support"
    """User needing technical/platform support"""
    
    UNKNOWN = "unknown"
    """Not yet classified"""


@dataclass
class ConversationState:
    """
    Tracks conversation state through its lifecycle.
    
    Manages:
    - Current phase in conversation
    - User profile identification
    - Intent tracking
    - Conversation history
    - Metadata
    """
    
    conversation_id: str
    user_id: str
    current_phase: ConversationPhase = ConversationPhase.WELCOME
    user_profile: UserProfile = UserProfile.UNKNOWN
    
    # Conversation tracking
    message_count: int = 0
    last_message_timestamp: Optional[datetime] = None
    conversation_started: datetime = field(default_factory=datetime.now)
    
    # Classification signals
    classification_signals: Dict[str, Any] = field(default_factory=dict)
    profile_confidence: float = 0.0
    
    # Intent tracking
    detected_intents: list = field(default_factory=list)
    primary_intent: Optional[str] = None
    
    # Context
    context_tags: list = field(default_factory=list)
    conversation_metadata: Dict[str, Any] = field(default_factory=dict)
    
    # Tracking
    playbook_selected: Optional[str] = None
    specialist_recommended: Optional[str] = None
    requires_escalation: bool = False
    escalation_reason: Optional[str] = None
    
    # Markers
    user_satisfied: Optional[bool] = None
    next_action: Optional[str] = None
    
    # Timestamps
    phase_entered: datetime = field(default_factory=datetime.now)
    last_updated: datetime = field(default_factory=datetime.now)
    
    def advance_phase(self, new_phase: ConversationPhase) -> None:
        """Move conversation to next phase"""
        self.current_phase = new_phase
        self.phase_entered = datetime.now()
        self.last_updated = datetime.now()
    
    def update_profile(self, profile: UserProfile, confidence: float = 1.0) -> None:
        """Update user profile classification"""
        if confidence > self.profile_confidence:
            self.user_profile = profile
            self.profile_confidence = confidence
            self.last_updated = datetime.now()
    
    def add_signal(self, signal_type: str, signal_value: Any) -> None:
        """Add classification signal"""
        self.classification_signals[signal_type] = signal_value
        self.last_updated = datetime.now()
    
    def add_intent(self, intent: str, confidence: float = 1.0) -> None:
        """Track detected intent"""
        intent_entry = {
            "intent": intent,
            "confidence": confidence,
            "detected_at": datetime.now().isoformat()
        }
        self.detected_intents.append(intent_entry)
        
        if not self.primary_intent:
            self.primary_intent = intent
        
        self.last_updated = datetime.now()
    
    def increment_message_count(self) -> None:
        """Increment message count"""
        self.message_count += 1
        self.last_updated = datetime.now()
    
    def mark_for_escalation(self, reason: str) -> None:
        """Mark conversation requiring escalation"""
        self.requires_escalation = True
        self.escalation_reason = reason
        self.last_updated = datetime.now()
    
    def finish_conversation(self, satisfied: bool = True, next_action: Optional[str] = None) -> None:
        """Mark conversation as finished"""
        self.current_phase = ConversationPhase.FINISHED
        self.user_satisfied = satisfied
        self.next_action = next_action
        self.last_updated = datetime.now()
    
    def get_state_summary(self) -> Dict[str, Any]:
        """Get current state summary"""
        return {
            "conversation_id": self.conversation_id,
            "user_id": self.user_id,
            "current_phase": self.current_phase.value,
            "user_profile": self.user_profile.value,
            "profile_confidence": self.profile_confidence,
            "message_count": self.message_count,
            "primary_intent": self.primary_intent,
            "requires_escalation": self.requires_escalation,
            "user_satisfied": self.user_satisfied,
            "last_updated": self.last_updated.isoformat()
        }
    
    def is_profile_determined(self) -> bool:
        """Check if profile has been determined"""
        return self.user_profile != UserProfile.UNKNOWN
    
    def should_escalate(self) -> bool:
        """Check if escalation is needed"""
        return self.requires_escalation
    
    def get_phase_duration_seconds(self) -> int:
        """Get how long in current phase"""
        return int((datetime.now() - self.phase_entered).total_seconds())
    
    def get_total_duration_seconds(self) -> int:
        """Get total conversation duration"""
        return int((datetime.now() - self.conversation_started).total_seconds())


@dataclass
class PhaseTransition:
    """Defines allowed transitions between phases"""
    
    from_phase: ConversationPhase
    to_phase: ConversationPhase
    required_conditions: list = field(default_factory=list)
    max_duration_seconds: Optional[int] = None
    
    def can_transition(self, state: ConversationState) -> bool:
        """Check if transition is allowed given current state"""
        if state.current_phase != self.from_phase:
            return False
        
        # Check required conditions
        for condition in self.required_conditions:
            if condition == "profile_determined" and not state.is_profile_determined():
                return False
            if condition == "intent_detected" and not state.primary_intent:
                return False
            if condition == "user_response" and state.message_count < 2:
                return False
        
        return True


# Define allowed phase transitions
PHASE_TRANSITIONS = [
    PhaseTransition(ConversationPhase.WELCOME, ConversationPhase.DISCOVERY),
    PhaseTransition(
        ConversationPhase.DISCOVERY, 
        ConversationPhase.CLASSIFICATION,
        required_conditions=["user_response"]
    ),
    PhaseTransition(
        ConversationPhase.CLASSIFICATION,
        ConversationPhase.GUIDANCE,
        required_conditions=["profile_determined"]
    ),
    PhaseTransition(
        ConversationPhase.GUIDANCE,
        ConversationPhase.RECOMMENDATION,
        required_conditions=["intent_detected"]
    ),
    PhaseTransition(ConversationPhase.RECOMMENDATION, ConversationPhase.TRANSFER),
    PhaseTransition(ConversationPhase.TRANSFER, ConversationPhase.FINISHED),
    PhaseTransition(ConversationPhase.GUIDANCE, ConversationPhase.FINISHED),
]


def get_allowed_transitions(phase: ConversationPhase) -> list:
    """Get all allowed transitions from given phase"""
    return [t for t in PHASE_TRANSITIONS if t.from_phase == phase]
