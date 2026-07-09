"""
Conversation data models and validation schemas.

Defines standardized data structures for all conversation operations.
"""

from typing import Optional, Dict, Any, List
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum


class ChannelType(str, Enum):
    """Supported conversation channels"""
    WHATSAPP = "whatsapp"
    LANDING = "landing"
    DASHBOARD = "dashboard"
    API = "api"
    MOBILE = "mobile"


class AgentType(str, Enum):
    """Available agent types"""
    COMMERCIAL = "commercial"
    LAWYER = "lawyer"
    FIRM = "firm"
    SUPPORT = "support"
    CLIENT = "client"


@dataclass
class ConversationContext:
    """
    User and interaction context information.
    Contains all contextual data needed for routing and response.
    """
    user_id: str
    firm_id: str
    conversation_id: str
    session_id: str
    channel: ChannelType
    user_role: str
    timestamp: datetime = field(default_factory=datetime.now)
    timezone: Optional[str] = None
    language: str = "es"
    device_info: Dict[str, Any] = field(default_factory=dict)
    geo_location: Optional[Dict[str, Any]] = None
    additional_context: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "user_id": self.user_id,
            "firm_id": self.firm_id,
            "conversation_id": self.conversation_id,
            "session_id": self.session_id,
            "channel": self.channel.value,
            "user_role": self.user_role,
            "timestamp": self.timestamp.isoformat(),
            "timezone": self.timezone,
            "language": self.language,
            "device_info": self.device_info,
            "geo_location": self.geo_location
        }


@dataclass
class ConversationIntent:
    """
    Detected user intention and related metadata.
    Result of intent detection analysis.
    """
    intent_id: str
    intent_type: str
    intent_category: str
    confidence_score: float
    detected_keywords: List[str] = field(default_factory=list)
    primary_agent: AgentType = AgentType.SUPPORT
    secondary_agents: List[AgentType] = field(default_factory=list)
    requires_escalation: bool = False
    escalation_priority: str = "normal"
    metadata: Dict[str, Any] = field(default_factory=dict)

    def is_high_confidence(self, threshold: float = 0.8) -> bool:
        """Check if confidence meets threshold"""
        return self.confidence_score >= threshold


@dataclass
class ConversationChannel:
    """
    Channel-specific information and configuration.
    Details about the input/output channel.
    """
    channel_type: ChannelType
    channel_id: str
    is_active: bool = True
    supports_rich_content: bool = False
    supports_file_upload: bool = False
    message_size_limit: int = 4096
    rate_limit_per_minute: int = 60
    authentication_required: bool = False
    metadata: Dict[str, Any] = field(default_factory=dict)

    def get_capabilities(self) -> Dict[str, bool]:
        """Get channel capability summary"""
        return {
            "rich_content": self.supports_rich_content,
            "file_upload": self.supports_file_upload,
            "authenticated": self.authentication_required
        }


@dataclass
class ConversationResponse:
    """
    Standardized conversation response structure.
    Contains response content and metadata.
    """
    response_id: str
    content: str
    response_type: str  # text, html, structured_json, etc.
    agent_type: AgentType
    channel_type: ChannelType
    timestamp: datetime = field(default_factory=datetime.now)
    confidence_level: float = 1.0
    includes_disclaimer: bool = True
    next_steps: List[str] = field(default_factory=list)
    suggested_follow_up: Optional[str] = None
    escalation_recommended: bool = False
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_channel_format(self, channel: ChannelType) -> Dict[str, Any]:
        """
        Convert response to channel-specific format.
        Implementation varies by channel type.
        """
        base_format = {
            "id": self.response_id,
            "content": self.content,
            "timestamp": self.timestamp.isoformat(),
            "type": self.response_type
        }

        if self.includes_disclaimer:
            base_format["disclaimer"] = "Response provided for informational purposes"

        return base_format


@dataclass
class ConversationProfile:
    """
    User conversation profile and preferences.
    Stores user preferences, history, and behavioral patterns.
    """
    profile_id: str
    user_id: str
    firm_id: str
    user_role: str
    preferred_language: str = "es"
    preferred_channel: Optional[ChannelType] = None
    communication_preferences: Dict[str, Any] = field(default_factory=dict)
    interaction_history_count: int = 0
    last_interaction: Optional[datetime] = None
    preferred_agent_type: Optional[AgentType] = None
    behavioral_patterns: Dict[str, Any] = field(default_factory=dict)
    privacy_settings: Dict[str, Any] = field(default_factory=dict)
    metadata: Dict[str, Any] = field(default_factory=dict)
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)

    def update_last_interaction(self) -> None:
        """Update last interaction timestamp"""
        self.last_interaction = datetime.now()
        self.interaction_history_count += 1
        self.updated_at = datetime.now()

    def get_privacy_settings(self) -> Dict[str, Any]:
        """Get privacy settings"""
        return {
            "data_retention_days": self.privacy_settings.get("data_retention_days", 90),
            "allow_profiling": self.privacy_settings.get("allow_profiling", True),
            "allow_analytics": self.privacy_settings.get("allow_analytics", True)
        }
