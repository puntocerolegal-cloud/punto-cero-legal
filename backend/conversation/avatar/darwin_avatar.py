"""
DARWIN AVATAR

Reusable avatar component for all channels and verticals.
Shows Darwin's visual presence across the ecosystem.

States:
- idle: Waiting for interaction
- thinking: Processing user input
- typing: Generating response
- listening: Waiting for user
- happy: Positive interaction
- serious: Important matter
- warning: Alert/escalation
- success: Task completed
- speaking: Future - will animate when audio is ready
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Dict, Any, Optional
from datetime import datetime


class AvatarState(str, Enum):
    """Avatar visual and behavioral states"""
    IDLE = "idle"
    THINKING = "thinking"
    TYPING = "typing"
    LISTENING = "listening"
    HAPPY = "happy"
    SERIOUS = "serious"
    WARNING = "warning"
    SUCCESS = "success"
    SPEAKING = "speaking"  # Future: audio response


class AvatarExpression(str, Enum):
    """Avatar facial expressions"""
    NEUTRAL = "neutral"
    SMILING = "smiling"
    CONCERNED = "concerned"
    FOCUSED = "focused"
    APPROVING = "approving"
    ALERT = "alert"


@dataclass
class AvatarConfig:
    """Configuration for avatar appearance and behavior"""
    # Visual
    image_url: Optional[str] = None
    animation_enabled: bool = True
    expression_changes: bool = True
    
    # Behavior
    show_typing_indicator: bool = True
    typing_animation_speed: float = 1.0  # 0.5 = slow, 1.0 = normal, 2.0 = fast
    
    # Metadata
    vertical: str = "generic"  # Punto Cero Legal, Health, Education, etc.
    brand_colors: Dict[str, str] = field(default_factory=dict)
    custom_metadata: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert config to JSON-serializable dict"""
        return {
            "image_url": self.image_url,
            "animation_enabled": self.animation_enabled,
            "expression_changes": self.expression_changes,
            "show_typing_indicator": self.show_typing_indicator,
            "typing_animation_speed": self.typing_animation_speed,
            "vertical": self.vertical,
            "brand_colors": self.brand_colors,
            "custom_metadata": self.custom_metadata,
        }


@dataclass
class AvatarState_Data:
    """Avatar current state and display data"""
    state: AvatarState
    expression: AvatarExpression = AvatarExpression.NEUTRAL
    timestamp: datetime = field(default_factory=datetime.now)
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to JSON-serializable dict"""
        return {
            "state": self.state.value,
            "expression": self.expression.value,
            "timestamp": self.timestamp.isoformat(),
            "metadata": self.metadata,
        }


class DarwinAvatar:
    """
    Reusable avatar component representing Darwin across all channels.
    
    Can be used in:
    - Chat Widget (browser)
    - Floating Button (web)
    - Dashboard (authenticated)
    - Client Portal
    - Lawyer Portal
    - Firm Portal
    - CRM
    - Mobile App
    - WhatsApp Web Experience
    
    Not vertical-specific: Works for Punto Cero Legal, Health, Education, etc.
    """
    
    def __init__(self, config: Optional[AvatarConfig] = None):
        """Initialize avatar with configuration"""
        self.config = config or AvatarConfig()
        self.current_state = AvatarState_Data(state=AvatarState.IDLE)
        self.state_history = []
        self.created_at = datetime.now()
    
    # STATE TRANSITIONS
    
    def set_idle(self) -> AvatarState_Data:
        """Avatar is idle, waiting for interaction"""
        self.current_state = AvatarState_Data(
            state=AvatarState.IDLE,
            expression=AvatarExpression.NEUTRAL,
            metadata={"reason": "waiting_for_user"}
        )
        self._record_state()
        return self.current_state
    
    def set_thinking(self, reason: str = "analyzing") -> AvatarState_Data:
        """Avatar is thinking/processing"""
        self.current_state = AvatarState_Data(
            state=AvatarState.THINKING,
            expression=AvatarExpression.FOCUSED,
            metadata={"reason": reason}
        )
        self._record_state()
        return self.current_state
    
    def set_typing(self, message_preview: Optional[str] = None) -> AvatarState_Data:
        """Avatar is generating/typing response"""
        self.current_state = AvatarState_Data(
            state=AvatarState.TYPING,
            expression=AvatarExpression.FOCUSED,
            metadata={
                "message_preview": message_preview,
                "typing_speed": self.config.typing_animation_speed
            }
        )
        self._record_state()
        return self.current_state
    
    def set_listening(self) -> AvatarState_Data:
        """Avatar is waiting for user input"""
        self.current_state = AvatarState_Data(
            state=AvatarState.LISTENING,
            expression=AvatarExpression.NEUTRAL,
            metadata={"reason": "waiting_for_response"}
        )
        self._record_state()
        return self.current_state
    
    def set_happy(self, reason: str = "success") -> AvatarState_Data:
        """Avatar shows positive/happy state"""
        self.current_state = AvatarState_Data(
            state=AvatarState.HAPPY,
            expression=AvatarExpression.SMILING,
            metadata={"reason": reason}
        )
        self._record_state()
        return self.current_state
    
    def set_serious(self, reason: str = "important") -> AvatarState_Data:
        """Avatar shows serious/focused state"""
        self.current_state = AvatarState_Data(
            state=AvatarState.SERIOUS,
            expression=AvatarExpression.CONCERNED,
            metadata={"reason": reason}
        )
        self._record_state()
        return self.current_state
    
    def set_warning(self, warning_message: str) -> AvatarState_Data:
        """Avatar shows warning state"""
        self.current_state = AvatarState_Data(
            state=AvatarState.WARNING,
            expression=AvatarExpression.ALERT,
            metadata={"warning": warning_message}
        )
        self._record_state()
        return self.current_state
    
    def set_success(self, success_message: str) -> AvatarState_Data:
        """Avatar shows success state"""
        self.current_state = AvatarState_Data(
            state=AvatarState.SUCCESS,
            expression=AvatarExpression.APPROVING,
            metadata={"success": success_message}
        )
        self._record_state()
        return self.current_state
    
    def set_speaking(self) -> AvatarState_Data:
        """Avatar is speaking (future: audio response)"""
        self.current_state = AvatarState_Data(
            state=AvatarState.SPEAKING,
            expression=AvatarExpression.NEUTRAL,
            metadata={"ready_for_audio": True}
        )
        self._record_state()
        return self.current_state
    
    # UTILITIES
    
    def _record_state(self):
        """Record state transition in history"""
        self.state_history.append(self.current_state)
    
    def get_state(self) -> AvatarState_Data:
        """Get current avatar state"""
        return self.current_state
    
    def get_state_history(self) -> list:
        """Get state transition history"""
        return self.state_history
    
    def to_frontend_dict(self) -> Dict[str, Any]:
        """
        Serialize avatar to frontend-friendly format.
        Used for sending to UI components.
        """
        return {
            "state": self.current_state.to_dict(),
            "config": self.config.to_dict(),
            "created_at": self.created_at.isoformat(),
        }
    
    def set_custom_metadata(self, key: str, value: Any):
        """Add custom metadata for vertical-specific behavior"""
        self.current_state.metadata[key] = value
    
    def reset(self):
        """Reset avatar to initial state"""
        self.current_state = AvatarState_Data(state=AvatarState.IDLE)
        self.state_history = []


# FACTORY FUNCTIONS FOR DIFFERENT VERTICALS

def create_legal_avatar() -> DarwinAvatar:
    """Create avatar for Punto Cero Legal"""
    config = AvatarConfig(
        vertical="legal",
        brand_colors={
            "primary": "#1a3a52",  # Punto Cero Legal blue
            "success": "#10b981",
            "warning": "#f59e0b"
        }
    )
    return DarwinAvatar(config)


def create_health_avatar() -> DarwinAvatar:
    """Create avatar for Punto Cero Health (future)"""
    config = AvatarConfig(
        vertical="health",
        brand_colors={
            "primary": "#059669",  # Health green
            "success": "#10b981",
            "warning": "#f59e0b"
        }
    )
    return DarwinAvatar(config)


def create_education_avatar() -> DarwinAvatar:
    """Create avatar for Punto Cero Education (future)"""
    config = AvatarConfig(
        vertical="education",
        brand_colors={
            "primary": "#3b82f6",  # Education blue
            "success": "#10b981",
            "warning": "#f59e0b"
        }
    )
    return DarwinAvatar(config)


def create_generic_avatar() -> DarwinAvatar:
    """Create generic avatar for any vertical"""
    return DarwinAvatar()
