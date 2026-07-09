"""
DARWIN AVATAR UI COMPONENT LIBRARY

Serializable components for rendering avatar in:
- Chat widgets
- Floating button
- Dashboard
- Client/Lawyer/Firm portals
- Mobile apps

All vertical-agnostic, no duplicates, single source of truth for avatar rendering.
"""

from dataclasses import dataclass, asdict
from typing import Dict, Any, Optional, List
from enum import Enum
from datetime import datetime
from backend.conversation.avatar.darwin_avatar import AvatarState, AvatarExpression


class AnimationType(str, Enum):
    """Avatar animation types"""
    NONE = "none"
    FADE = "fade"
    SLIDE = "slide"
    BOUNCE = "bounce"
    PULSE = "pulse"
    BLINK = "blink"
    NOD = "nod"
    SHAKE = "shake"


@dataclass
class AnimationSpec:
    """Animation specification"""
    type: AnimationType
    duration_ms: int = 300
    delay_ms: int = 0
    repeat: int = 1
    easing: str = "ease-in-out"


@dataclass
class AvatarDisplayConfig:
    """Configuration for avatar display in UI"""
    show_avatar: bool = True
    avatar_size: str = "medium"  # small, medium, large
    position: str = "left"  # left, right, center
    show_name: bool = True
    show_status: bool = True
    show_typing_indicator: bool = True
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class TypingIndicator:
    """Visual typing indicator component"""
    visible: bool = True
    style: str = "dots"  # dots, line, wave
    speed: float = 1.0
    dot_count: int = 3
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class AvatarMessage:
    """Single avatar message with visual metadata"""
    text: str
    timestamp: datetime
    avatar_state: str  # idle, thinking, typing, listening, happy, serious, warning, success
    avatar_expression: str  # neutral, smiling, listening, thinking, concerned, approving, alert
    animation: Optional[AnimationSpec] = None
    typing_speed: float = 1.0
    show_typing_indicator: bool = True
    metadata: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.metadata is None:
            self.metadata = {}
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "text": self.text,
            "timestamp": self.timestamp.isoformat(),
            "avatar_state": self.avatar_state,
            "avatar_expression": self.avatar_expression,
            "animation": asdict(self.animation) if self.animation else None,
            "typing_speed": self.typing_speed,
            "show_typing_indicator": self.show_typing_indicator,
            "metadata": self.metadata,
        }


@dataclass
class ConversationBubble:
    """Single message bubble in conversation"""
    text: str
    sender: str  # "user" or "darwin"
    timestamp: datetime
    avatar_state: Optional[str] = None
    avatar_expression: Optional[str] = None
    typing: bool = False
    animation: Optional[AnimationSpec] = None
    metadata: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.metadata is None:
            self.metadata = {}
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "text": self.text,
            "sender": self.sender,
            "timestamp": self.timestamp.isoformat(),
            "avatar_state": self.avatar_state,
            "avatar_expression": self.avatar_expression,
            "typing": self.typing,
            "animation": asdict(self.animation) if self.animation else None,
            "metadata": self.metadata,
        }


class AvatarUIRenderer:
    """
    Renders avatar component for different channels.
    
    Usage:
    ```python
    renderer = AvatarUIRenderer()
    
    # For chat widget
    html = renderer.render_chat_widget(avatar_state, config)
    
    # For floating button
    html = renderer.render_floating_button(avatar_state, config)
    
    # For dashboard
    html = renderer.render_dashboard_widget(avatar_state, config)
    
    # Generic JSON for frontend
    json = renderer.render_json(avatar_state, config)
    ```
    """
    
    def __init__(self):
        self.state_styles = {
            "idle": "opacity-80 grayscale-0",
            "thinking": "opacity-100 ring-2 ring-blue-500",
            "typing": "opacity-100 animate-pulse",
            "listening": "opacity-100 ring-2 ring-green-500",
            "happy": "opacity-100 filter brightness-110",
            "serious": "opacity-100 grayscale-20",
            "warning": "opacity-100 ring-2 ring-red-500",
            "success": "opacity-100 ring-2 ring-green-500",
            "speaking": "opacity-100 animate-bounce",
        }
        
        self.expression_classes = {
            "neutral": "face-neutral",
            "smiling": "face-smiling",
            "listening": "face-listening",
            "thinking": "face-thinking",
            "concerned": "face-concerned",
            "approving": "face-approving",
            "alert": "face-alert",
        }
    
    def render_json(
        self,
        avatar_state: str,
        avatar_expression: str,
        config: AvatarDisplayConfig,
        metadata: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """Render avatar as JSON for frontend consumption"""
        if metadata is None:
            metadata = {}
        
        return {
            "component": "darwin-avatar",
            "state": avatar_state,
            "expression": avatar_expression,
            "config": config.to_dict(),
            "styles": {
                "state": self.state_styles.get(avatar_state, ""),
                "expression": self.expression_classes.get(avatar_expression, ""),
            },
            "timestamp": datetime.now().isoformat(),
            "metadata": metadata,
        }
    
    def render_chat_widget(
        self,
        avatar_state: str,
        avatar_expression: str,
        message: Optional[str] = None,
        typing: bool = False
    ) -> Dict[str, Any]:
        """Render for chat widget context"""
        config = AvatarDisplayConfig(
            show_avatar=True,
            avatar_size="medium",
            position="left",
            show_name=True,
            show_status=True,
            show_typing_indicator=typing,
        )
        
        return self.render_json(avatar_state, avatar_expression, config, {
            "context": "chat_widget",
            "message": message,
            "typing": typing,
        })
    
    def render_floating_button(
        self,
        avatar_state: str,
        avatar_expression: str
    ) -> Dict[str, Any]:
        """Render for floating button context"""
        config = AvatarDisplayConfig(
            show_avatar=True,
            avatar_size="small",
            position="right",
            show_name=False,
            show_status=False,
            show_typing_indicator=False,
        )
        
        return self.render_json(avatar_state, avatar_expression, config, {
            "context": "floating_button",
        })
    
    def render_dashboard_widget(
        self,
        avatar_state: str,
        avatar_expression: str,
        widget_type: str = "assistant"
    ) -> Dict[str, Any]:
        """Render for dashboard context"""
        config = AvatarDisplayConfig(
            show_avatar=True,
            avatar_size="medium",
            position="center",
            show_name=True,
            show_status=True,
            show_typing_indicator=False,
        )
        
        return self.render_json(avatar_state, avatar_expression, config, {
            "context": "dashboard",
            "widget_type": widget_type,
        })
    
    def render_mobile_app(
        self,
        avatar_state: str,
        avatar_expression: str
    ) -> Dict[str, Any]:
        """Render for mobile app context"""
        config = AvatarDisplayConfig(
            show_avatar=True,
            avatar_size="large",
            position="center",
            show_name=True,
            show_status=True,
            show_typing_indicator=True,
        )
        
        return self.render_json(avatar_state, avatar_expression, config, {
            "context": "mobile_app",
        })
    
    def get_state_animation(self, from_state: str, to_state: str) -> AnimationSpec:
        """Get recommended animation for state transition"""
        transitions = {
            ("idle", "thinking"): AnimationSpec(AnimationType.PULSE, 400),
            ("idle", "typing"): AnimationSpec(AnimationType.FADE, 200),
            ("typing", "listening"): AnimationSpec(AnimationType.SLIDE, 300),
            ("listening", "happy"): AnimationSpec(AnimationType.BOUNCE, 500),
            ("listening", "serious"): AnimationSpec(AnimationType.NOD, 400),
            ("any", "warning"): AnimationSpec(AnimationType.SHAKE, 300),
            ("any", "success"): AnimationSpec(AnimationType.BOUNCE, 500),
        }
        
        # Try exact transition
        key = (from_state, to_state)
        if key in transitions:
            return transitions[key]
        
        # Try any → to_state
        key = ("any", to_state)
        if key in transitions:
            return transitions[key]
        
        # Default
        return AnimationSpec(AnimationType.FADE, 200)


class ConversationRenderer:
    """Renders full conversation with avatar context"""
    
    def __init__(self):
        self.avatar_renderer = AvatarUIRenderer()
    
    def render_conversation(
        self,
        messages: List[ConversationBubble],
        current_avatar_state: str,
        current_expression: str,
        config: AvatarDisplayConfig = None
    ) -> Dict[str, Any]:
        """Render full conversation thread"""
        if config is None:
            config = AvatarDisplayConfig()
        
        return {
            "component": "conversation-thread",
            "messages": [msg.to_dict() for msg in messages],
            "avatar": self.avatar_renderer.render_json(
                current_avatar_state,
                current_expression,
                config
            ),
            "total_messages": len(messages),
            "timestamp": datetime.now().isoformat(),
        }
    
    def render_message_with_avatar(
        self,
        bubble: ConversationBubble,
        avatar_state: str,
        avatar_expression: str
    ) -> Dict[str, Any]:
        """Render single message with avatar context"""
        return {
            "component": "message-with-avatar",
            "message": bubble.to_dict(),
            "avatar": {
                "state": avatar_state,
                "expression": avatar_expression,
            },
            "timestamp": datetime.now().isoformat(),
        }


# HELPERS FOR FRONTEND SERIALIZATION

def serialize_avatar_state(state: AvatarState, expression: AvatarExpression) -> Dict[str, str]:
    """Convert avatar state enums to frontend-friendly strings"""
    return {
        "state": state.value,
        "expression": expression.value,
    }


def serialize_conversation_bubble(bubble: ConversationBubble) -> Dict[str, Any]:
    """Serialize bubble for JSON response"""
    return bubble.to_dict()


def serialize_typing_indicator(indicator: TypingIndicator) -> Dict[str, Any]:
    """Serialize typing indicator for frontend"""
    return indicator.to_dict()
