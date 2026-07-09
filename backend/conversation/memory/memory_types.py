"""
Memory type definitions and interfaces.

Defines structure for different memory contexts:
- Conversation Memory: Current conversation state
- Client Memory: Client-specific information
- Business Memory: Business-related context
- Preferences Memory: User and system preferences
"""

from typing import Dict, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime


@dataclass
class ConversationMemory:
    """
    Current conversation context and history.
    Stores messages, intents, and interaction state.
    """
    conversation_id: str
    messages: list = field(default_factory=list)
    current_intent: Optional[str] = None
    context_tags: list = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)

    def add_message(self, message: Dict[str, Any]) -> None:
        """Add message to conversation history"""
        self.messages.append(message)
        self.updated_at = datetime.now()

    def set_intent(self, intent: str) -> None:
        """Set current conversation intent"""
        self.current_intent = intent
        self.updated_at = datetime.now()

    def get_messages(self, limit: Optional[int] = None) -> list:
        """Get conversation messages"""
        if limit:
            return self.messages[-limit:]
        return self.messages


@dataclass
class ClientMemory:
    """
    Client-specific information and profile data.
    Stores client identity, history, and characteristics.
    """
    client_id: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    client_profile: Dict[str, Any] = field(default_factory=dict)
    previous_interactions: list = field(default_factory=list)
    cases: list = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)

    def get_full_name(self) -> Optional[str]:
        """Get client full name"""
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        return self.first_name

    def add_interaction(self, interaction: Dict[str, Any]) -> None:
        """Log client interaction"""
        self.previous_interactions.append(interaction)
        self.updated_at = datetime.now()

    def add_case(self, case_id: str) -> None:
        """Associate case with client"""
        if case_id not in self.cases:
            self.cases.append(case_id)
            self.updated_at = datetime.now()


@dataclass
class BusinessMemory:
    """
    Business-related context and operations.
    Stores firm data, business logic, and operational context.
    """
    firm_id: str
    business_context: Dict[str, Any] = field(default_factory=dict)
    operational_state: Dict[str, Any] = field(default_factory=dict)
    active_cases: list = field(default_factory=list)
    business_rules: Dict[str, Any] = field(default_factory=dict)
    metadata: Dict[str, Any] = field(default_factory=dict)
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)

    def get_operational_state(self) -> Dict[str, Any]:
        """Get current operational state"""
        return self.operational_state.copy()

    def add_case(self, case_id: str) -> None:
        """Add case to active cases"""
        if case_id not in self.active_cases:
            self.active_cases.append(case_id)
            self.updated_at = datetime.now()

    def set_rule(self, rule_name: str, rule_value: Any) -> None:
        """Set business rule"""
        self.business_rules[rule_name] = rule_value
        self.updated_at = datetime.now()


@dataclass
class PreferencesMemory:
    """
    User and system preferences.
    Stores configuration, language, communication preferences, etc.
    """
    entity_id: str
    entity_type: str  # user, firm, client
    language: str = "es"
    timezone: Optional[str] = None
    communication_preferences: Dict[str, Any] = field(default_factory=dict)
    system_preferences: Dict[str, Any] = field(default_factory=dict)
    notification_settings: Dict[str, Any] = field(default_factory=dict)
    metadata: Dict[str, Any] = field(default_factory=dict)
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)

    def set_language(self, language: str) -> None:
        """Set preferred language"""
        self.language = language
        self.updated_at = datetime.now()

    def set_preference(self, key: str, value: Any) -> None:
        """Set system preference"""
        self.system_preferences[key] = value
        self.updated_at = datetime.now()

    def get_preference(self, key: str, default: Any = None) -> Any:
        """Get system preference"""
        return self.system_preferences.get(key, default)
