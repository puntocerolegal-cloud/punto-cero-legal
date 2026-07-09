"""
MemoryManager

Central manager for all memory operations.
Coordinates conversation, client, business, and preferences memory.

Phase 1: In-memory storage with optional persistence hooks.
Phase 2: Full MongoDB integration.

Features:
- Conversation memory (messages, intent, context)
- Client memory (profile, history, cases)
- Business memory (firm context, operational state)
- Preferences memory (language, timezone, settings)
- MongoDB persistence for all memory types
"""

from typing import Optional, Dict, Any, List
from datetime import datetime
from .memory_types import (
    ConversationMemory,
    ClientMemory,
    BusinessMemory,
    PreferencesMemory
)


class MemoryManager:
    """
    Manages all memory types for conversations.
    Acts as interface between conversation engine and memory storage.

    Phase 2 Implementation:
    - In-memory storage with MongoDB persistence
    - Full MongoDB integration for production

    Usage:
    ```python
    manager = MemoryManager()
    manager.enable_persistence(mongodb_adapter)

    # Create conversation memory
    conv = manager.get_or_create("conv-123", "customer")
    conv.add_message({"sender": "user", "text": "Hola"})

    # Retrieve and use
    conv = manager.get_conversation("conv-123")
    messages = conv.get_messages()

    # Client memory
    client = manager.get_or_create_client("client-456")
    client.add_interaction({"action": "viewed_pricing"})

    # Preferences
    prefs = manager.get_or_create_preferences("user-789", "user")
    prefs.set_language("es")
    ```
    """

    def __init__(self):
        self.conversation_memories: Dict[str, ConversationMemory] = {}
        self.client_memories: Dict[str, ClientMemory] = {}
        self.business_memories: Dict[str, BusinessMemory] = {}
        self.preferences_memories: Dict[str, PreferencesMemory] = {}
        self._persistence_enabled = False
        self._persistence_adapter = None

    # Conversation Memory Methods
    def create_conversation(self, conversation_id: str) -> ConversationMemory:
        """Create new conversation memory"""
        memory = ConversationMemory(conversation_id=conversation_id)
        self.conversation_memories[conversation_id] = memory
        return memory

    def get_conversation(self, conversation_id: str) -> Optional[ConversationMemory]:
        """Retrieve conversation memory"""
        return self.conversation_memories.get(conversation_id)

    def save_conversation(self, memory: ConversationMemory) -> bool:
        """Save conversation memory"""
        self.conversation_memories[memory.conversation_id] = memory
        if self._persistence_enabled and self._persistence_adapter:
            self._persistence_adapter.save_conversation(memory)
        return True

    # Client Memory Methods
    def create_client(self, client_id: str) -> ClientMemory:
        """Create new client memory"""
        memory = ClientMemory(client_id=client_id)
        self.client_memories[client_id] = memory
        return memory

    def get_client(self, client_id: str) -> Optional[ClientMemory]:
        """Retrieve client memory"""
        return self.client_memories.get(client_id)

    def save_client(self, memory: ClientMemory) -> bool:
        """Save client memory"""
        self.client_memories[memory.client_id] = memory
        if self._persistence_enabled and self._persistence_adapter:
            self._persistence_adapter.save_client(memory)
        return True

    # Business Memory Methods
    def create_business(self, firm_id: str) -> BusinessMemory:
        """Create new business memory"""
        memory = BusinessMemory(firm_id=firm_id)
        self.business_memories[firm_id] = memory
        return memory

    def get_business(self, firm_id: str) -> Optional[BusinessMemory]:
        """Retrieve business memory"""
        return self.business_memories.get(firm_id)

    def save_business(self, memory: BusinessMemory) -> bool:
        """Save business memory"""
        self.business_memories[memory.firm_id] = memory
        if self._persistence_enabled and self._persistence_adapter:
            self._persistence_adapter.save_business(memory)
        return True

    # Preferences Memory Methods
    def create_preferences(
        self,
        entity_id: str,
        entity_type: str
    ) -> PreferencesMemory:
        """Create new preferences memory"""
        memory = PreferencesMemory(entity_id=entity_id, entity_type=entity_type)
        self.preferences_memories[entity_id] = memory
        return memory

    def get_preferences(self, entity_id: str) -> Optional[PreferencesMemory]:
        """Retrieve preferences memory"""
        return self.preferences_memories.get(entity_id)

    def save_preferences(self, memory: PreferencesMemory) -> bool:
        """Save preferences memory"""
        self.preferences_memories[memory.entity_id] = memory
        if self._persistence_enabled and self._persistence_adapter:
            self._persistence_adapter.save_preferences(memory)
        return True

    # Utility Methods
    def get_all_memory_summary(self, entity_id: str) -> Dict[str, Any]:
        """Get summary of all memory types for an entity"""
        return {
            "conversations": len([m for m in self.conversation_memories.values()]),
            "clients": len(self.client_memories),
            "businesses": len(self.business_memories),
            "preferences": len(self.preferences_memories),
            "storage_engine": "mongodb_phase2" if self._persistence_enabled else "in_memory_phase1"
        }

    def clear_all(self) -> None:
        """Clear all memories (development/testing only)"""
        self.conversation_memories.clear()
        self.client_memories.clear()
        self.business_memories.clear()
        self.preferences_memories.clear()

    # Get or Create Methods (convenience)

    def get_or_create(self, conversation_id: str, memory_type: str = "conversation", **kwargs) -> Any:
        """
        Get existing or create new memory of specified type.
        
        Args:
            conversation_id: Memory identifier
            memory_type: Type of memory ("conversation", "client", "business", "preferences")
            **kwargs: Additional arguments for memory creation
            
        Returns:
            Memory object of requested type
        """
        if memory_type == "conversation":
            return self.get_or_create_conversation(conversation_id)
        elif memory_type == "client":
            client_id = kwargs.get("client_id", conversation_id)
            return self.get_or_create_client(client_id)
        elif memory_type == "business":
            firm_id = kwargs.get("firm_id", conversation_id)
            return self.get_or_create_business(firm_id)
        elif memory_type == "preferences":
            entity_id = kwargs.get("entity_id", conversation_id)
            entity_type = kwargs.get("entity_type", "user")
            return self.get_or_create_preferences(entity_id, entity_type)
        else:
            raise ValueError(f"Unknown memory type: {memory_type}")

    def get_or_create_conversation(self, conversation_id: str) -> ConversationMemory:
        """Get existing or create new conversation"""
        existing = self.get_conversation(conversation_id)
        if existing:
            return existing
        return self.create_conversation(conversation_id)

    def get_or_create_client(self, client_id: str) -> ClientMemory:
        """Get existing or create new client memory"""
        existing = self.get_client(client_id)
        if existing:
            return existing
        return self.create_client(client_id)

    def get_or_create_business(self, firm_id: str) -> BusinessMemory:
        """Get existing or create new business memory"""
        existing = self.get_business(firm_id)
        if existing:
            return existing
        return self.create_business(firm_id)

    def get_or_create_preferences(
        self,
        entity_id: str,
        entity_type: str
    ) -> PreferencesMemory:
        """Get existing or create new preferences"""
        existing = self.get_preferences(entity_id)
        if existing:
            return existing
        return self.create_preferences(entity_id, entity_type)

    # Memory Query Methods

    def search_conversations(
        self,
        client_id: Optional[str] = None,
        limit: int = 10
    ) -> List[ConversationMemory]:
        """Search conversations by client"""
        results = list(self.conversation_memories.values())
        if client_id:
            results = [
                c for c in results
                if c.metadata.get("client_id") == client_id
            ]
        return results[:limit]

    def get_client_conversation_history(
        self,
        client_id: str,
        limit: int = 5
    ) -> List[ConversationMemory]:
        """Get all conversations for a client"""
        return self.search_conversations(client_id, limit)

    def get_all_unresolved_cases(self) -> List[str]:
        """Get all unresolved cases across business memories"""
        unresolved = []
        for business in self.business_memories.values():
            unresolved.extend(business.active_cases)
        return unresolved

    # Statistics and Reporting

    def get_memory_statistics(self) -> Dict[str, Any]:
        """Get comprehensive memory statistics"""
        total_conversations = len(self.conversation_memories)
        total_messages = sum(
            len(c.messages) for c in self.conversation_memories.values()
        )

        return {
            "timestamp": datetime.now().isoformat(),
            "conversations": {
                "total": total_conversations,
                "total_messages": total_messages,
                "avg_messages_per_conversation": (
                    total_messages / total_conversations
                    if total_conversations > 0
                    else 0
                ),
            },
            "clients": {
                "total": len(self.client_memories),
                "with_interactions": sum(
                    1 for c in self.client_memories.values()
                    if c.previous_interactions
                ),
            },
            "businesses": {
                "total": len(self.business_memories),
                "total_active_cases": sum(
                    len(b.active_cases)
                    for b in self.business_memories.values()
                ),
            },
            "preferences": {
                "total": len(self.preferences_memories),
            },
            "persistence": {
                "enabled": self._persistence_enabled,
                "adapter": type(self._persistence_adapter).__name__ if self._persistence_adapter else None
            }
        }

    # Persistence Interface (Phase 2 - MongoDB)

    def enable_persistence(self, adapter):
        """
        Enable persistence adapter for Phase 2 MongoDB integration.
        
        Args:
            adapter: MongoDB persistence adapter instance
        """
        self._persistence_enabled = True
        self._persistence_adapter = adapter

    def disable_persistence(self):
        """Disable persistence (testing)"""
        self._persistence_enabled = False
        self._persistence_adapter = None

    def load_from_mongodb(self, conversation_id: str) -> Optional[ConversationMemory]:
        """Load conversation from MongoDB if persistence enabled"""
        if not self._persistence_enabled or not self._persistence_adapter:
            return None
        return self._persistence_adapter.load_conversation(conversation_id)

    def persist_all(self) -> bool:
        """Persist all in-memory data to MongoDB"""
        if not self._persistence_enabled or not self._persistence_adapter:
            return False
        
        for memory in self.conversation_memories.values():
            self._persistence_adapter.save_conversation(memory)
        for memory in self.client_memories.values():
            self._persistence_adapter.save_client(memory)
        for memory in self.business_memories.values():
            self._persistence_adapter.save_business(memory)
        for memory in self.preferences_memories.values():
            self._persistence_adapter.save_preferences(memory)
        
        return True