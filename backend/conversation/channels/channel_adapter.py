"""
ChannelAdapter

Abstract base class for all channel implementations.
Ensures uniform message processing across all channels.
"""

from abc import ABC, abstractmethod
from typing import Optional, Dict, Any
from dataclasses import dataclass
from datetime import datetime


@dataclass
class ChannelMessage:
    """Standardized message from any channel"""
    content: str
    channel_type: str
    channel_user_id: str
    timestamp: datetime
    metadata: Dict[str, Any]
    context: Dict[str, Any]


@dataclass
class ChannelResponse:
    """Standardized response to channel"""
    content: str
    channel_type: str
    timestamp: datetime
    metadata: Dict[str, Any]


class ChannelAdapter(ABC):
    """
    Abstract base for all channel implementations.
    
    Responsibilities:
    - Parse incoming messages to standard format
    - Send responses back through channel
    - Manage channel-specific context
    """

    def __init__(self, channel_type: str):
        self.channel_type = channel_type
        self.is_active = False

    @abstractmethod
    def parse_message(self, raw_input: Any) -> ChannelMessage:
        """Convert channel-specific input to standard message format"""
        pass

    @abstractmethod
    def send_response(self, response: ChannelResponse) -> bool:
        """Send response back through this channel"""
        pass

    @abstractmethod
    def validate_connection(self) -> bool:
        """Validate channel connection is active"""
        pass

    @abstractmethod
    def get_channel_metadata(self) -> Dict[str, Any]:
        """Get channel-specific metadata"""
        pass

    def activate(self) -> bool:
        """Activate channel connection"""
        self.is_active = True
        return self.is_active

    def deactivate(self) -> bool:
        """Deactivate channel connection"""
        self.is_active = False
        return not self.is_active

    def get_status(self) -> Dict[str, Any]:
        """Get channel status"""
        return {
            "channel_type": self.channel_type,
            "is_active": self.is_active,
            "status": "active" if self.is_active else "inactive"
        }
