"""
Conversational Learning System

Enables DARWIN to learn from conversations without modifying AI models.
Implements contextual memory and learning capabilities.

Learns:
- Last conversation
- Open cases
- Plans
- Firm information
- History
- Preferences
"""

from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from collections import defaultdict


@dataclass
class LearningContext:
    """Context learned from conversations"""
    user_id: str
    conversation_id: str
    last_interaction: datetime
    total_interactions: int
    topics_discussed: List[str]
    preferences: Dict[str, Any]
    open_cases: List[str]
    active_plans: List[str]
    firm_info: Optional[Dict[str, Any]]
    sentiment_history: List[str]
    key_insights: List[str]
    learned_at: datetime = field(default_factory=datetime.now)


class ConversationalLearning:
    """
    Learns from conversations to improve future interactions.
    
    Features:
    - Remembers last conversation context
    - Tracks open cases and their status
    - Learns user preferences
    - Maintains firm/company information
    - Builds conversation history
    - Identifies patterns and insights
    """
    
    def __init__(self):
        self.learning_contexts: Dict[str, LearningContext] = {}
        self.conversation_patterns: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
        self.preference_weights: Dict[str, float] = {}
    
    def learn_from_conversation(
        self,
        user_id: str,
        conversation_id: str,
        message: str,
        response: str,
        context: Dict[str, Any],
        decisions: List[Dict[str, Any]]
    ) -> LearningContext:
        """
        Learn from a conversation interaction.
        
        Args:
            user_id: User identifier
            conversation_id: Conversation identifier
            message: User message
            response: Agent response
            context: Conversation context
            decisions: Decisions made during conversation
            
        Returns:
            Updated learning context
        """
        # Get or create learning context
        learning_ctx = self._get_or_create_context(user_id, conversation_id)
        
        # Update interaction count
        learning_ctx.total_interactions += 1
        learning_ctx.last_interaction = datetime.now()
        
        # Extract and learn topics
        topics = self._extract_topics(message, response)
        learning_ctx.topics_discussed.extend(topics)
        learning_ctx.topics_discussed = list(set(learning_ctx.topics_discussed))  # Deduplicate
        
        # Learn preferences
        self._learn_preferences(learning_ctx, message, response, context)
        
        # Track open cases
        self._track_cases(learning_ctx, decisions)
        
        # Learn firm info if applicable
        if context.get("profile") in ["firm", "company"]:
            self._learn_firm_info(learning_ctx, message, context)
        
        # Analyze sentiment
        sentiment = self._analyze_sentiment(message)
        learning_ctx.sentiment_history.append(sentiment)
        
        # Extract insights
        insights = self._extract_insights(message, response, context)
        learning_ctx.key_insights.extend(insights)
        
        # Store conversation pattern
        self.conversation_patterns[user_id].append({
            "timestamp": datetime.now().isoformat(),
            "message": message,
            "response": response,
            "intent": context.get("intent"),
            "profile": context.get("profile")
        })
        
        # Keep only last 50 conversations per user
        if len(self.conversation_patterns[user_id]) > 50:
            self.conversation_patterns[user_id] = self.conversation_patterns[user_id][-50:]
        
        return learning_ctx
    
    def get_learning_context(self, user_id: str) -> Optional[LearningContext]:
        """Get learning context for user"""
        return self.learning_contexts.get(user_id)
    
    def get_conversation_history(self, user_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Get recent conversation history for user"""
        patterns = self.conversation_patterns.get(user_id, [])
        return patterns[-limit:]
    
    def get_user_preferences(self, user_id: str) -> Dict[str, Any]:
        """Get learned preferences for user"""
        context = self.learning_contexts.get(user_id)
        if context:
            return context.preferences
        return {}
    
    def get_open_cases(self, user_id: str) -> List[str]:
        """Get open cases for user"""
        context = self.learning_contexts.get(user_id)
        if context:
            return context.open_cases
        return []
    
    def should_mention_previous_conversation(self, user_id: str) -> bool:
        """Check if should reference previous conversation"""
        context = self.learning_contexts.get(user_id)
        if not context:
            return False
        
        # Mention previous conversation if:
        # 1. More than 1 interaction
        # 2. Last interaction was within 30 days
        # 3. User is returning customer
        return (
            context.total_interactions > 1 and
            datetime.now() - context.last_interaction < timedelta(days=30)
        )
    
    def get_personalization_context(self, user_id: str) -> Dict[str, Any]:
        """Get personalization context for responses"""
        context = self.learning_contexts.get(user_id)
        if not context:
            return {}
        
        return {
            "previous_topics": context.topics_discussed[-5:],
            "preferences": context.preferences,
            "open_cases": context.open_cases,
            "total_interactions": context.total_interactions,
            "is_returning_user": context.total_interactions > 1,
            "recent_sentiment": context.sentiment_history[-1] if context.sentiment_history else "neutral",
            "key_insights": context.key_insights[-3:]
        }
    
    def _get_or_create_context(self, user_id: str, conversation_id: str) -> LearningContext:
        """Get or create learning context"""
        if user_id not in self.learning_contexts:
            self.learning_contexts[user_id] = LearningContext(
                user_id=user_id,
                conversation_id=conversation_id,
                last_interaction=datetime.now(),
                total_interactions=0,
                topics_discussed=[],
                preferences={},
                open_cases=[],
                active_plans=[],
                firm_info=None,
                sentiment_history=[],
                key_insights=[]
            )
        return self.learning_contexts[user_id]
    
    def _extract_topics(self, message: str, response: str) -> List[str]:
        """Extract topics from conversation"""
        topics = []
        
        # Topic keywords
        topic_keywords = {
            "pricing": ["precio", "costo", "tarifa", "plan", "pago"],
            "legal_services": ["caso", "demanda", "divorcio", "herencia", "contrato"],
            "partnership": ["partnership", "firma", "empresa", "alianza"],
            "lawyer_recruitment": ["abogado", "unirme", "plataforma", "comisión"],
            "support": ["error", "problema", "ayuda", "soporte"],
            "documents": ["documento", "archivo", "certificado"]
        }
        
        message_lower = message.lower()
        for topic, keywords in topic_keywords.items():
            if any(kw in message_lower for kw in keywords):
                topics.append(topic)
        
        return topics
    
    def _learn_preferences(
        self,
        learning_ctx: LearningContext,
        message: str,
        response: str,
        context: Dict[str, Any]
    ):
        """Learn user preferences from conversation"""
        message_lower = message.lower()
        
        # Language preference
        if "inglés" in message_lower or "english" in message_lower:
            learning_ctx.preferences["language"] = "en"
        elif "español" in message_lower or "español" in message_lower:
            learning_ctx.preferences["language"] = "es"
        
        # Communication preference
        if "llamada" in message_lower or "call" in message_lower:
            learning_ctx.preferences["preferred_channel"] = "call"
        elif "whatsapp" in message_lower:
            learning_ctx.preferences["preferred_channel"] = "whatsapp"
        elif "email" in message_lower or "correo" in message_lower:
            learning_ctx.preferences["preferred_channel"] = "email"
        
        # Time preference
        if "mañana" in message_lower or "morning" in message_lower:
            learning_ctx.preferences["preferred_time"] = "morning"
        elif "tarde" in message_lower or "afternoon" in message_lower:
            learning_ctx.preferences["preferred_time"] = "afternoon"
        
        # Store preferences with confidence
        for key, value in learning_ctx.preferences.items():
            self.preference_weights[key] = self.preference_weights.get(key, 0.5) + 0.1
    
    def _track_cases(self, learning_ctx: LearningContext, decisions: List[Dict[str, Any]]):
        """Track open cases from decisions"""
        for decision in decisions:
            if decision.get("type") == "create_case":
                case_id = decision.get("parameters", {}).get("case_id")
                if case_id and case_id not in learning_ctx.open_cases:
                    learning_ctx.open_cases.append(case_id)
    
    def _learn_firm_info(self, learning_ctx: LearningContext, message: str, context: Dict[str, Any]):
        """Learn firm/company information"""
        if learning_ctx.firm_info is None:
            learning_ctx.firm_info = {}
        
        message_lower = message.lower()
        
        # Extract firm size
        if any(kw in message_lower for kw in ["pequeño", "small", "1-5"]):
            learning_ctx.firm_info["size"] = "small"
        elif any(kw in message_lower for kw in ["mediano", "medium", "6-20"]):
            learning_ctx.firm_info["size"] = "medium"
        elif any(kw in message_lower for kw in ["grande", "large", "20+"]):
            learning_ctx.firm_info["size"] = "large"
        
        # Extract specialty
        if any(kw in message_lower for kw in ["familia", "family"]):
            learning_ctx.firm_info["specialty"] = "family_law"
        elif any(kw in message_lower for kw in ["empresa", "corporate", "comercial"]):
            learning_ctx.firm_info["specialty"] = "corporate"
        elif any(kw in message_lower for kw in ["penal", "criminal"]):
            learning_ctx.firm_info["specialty"] = "criminal"
    
    def _analyze_sentiment(self, message: str) -> str:
        """Analyze sentiment of message"""
        message_lower = message.lower()
        
        positive_words = ["gracias", "excelente", "perfecto", "genial", "thanks", "great", "perfect"]
        negative_words = ["problema", "error", "molesto", "urgente", "problem", "issue", "urgent"]
        
        positive_count = sum(1 for word in positive_words if word in message_lower)
        negative_count = sum(1 for word in negative_words if word in message_lower)
        
        if positive_count > negative_count:
            return "positive"
        elif negative_count > positive_count:
            return "negative"
        else:
            return "neutral"
    
    def _extract_insights(self, message: str, response: str, context: Dict[str, Any]) -> List[str]:
        """Extract key insights from conversation"""
        insights = []
        
        # High-value lead
        if context.get("estimated_value", 0) > 10000:
            insights.append("high_value_lead")
        
        # VIP client
        if context.get("is_vip", False):
            insights.append("vip_client")
        
        # Urgent matter
        if context.get("priority") in ["high", "critical"]:
            insights.append("urgent_matter")
        
        # Returning customer
        if context.get("is_returning_customer", False):
            insights.append("returning_customer")
        
        return insights
    
    def get_learning_statistics(self) -> Dict[str, Any]:
        """Get learning system statistics"""
        total_users = len(self.learning_contexts)
        total_interactions = sum(ctx.total_interactions for ctx in self.learning_contexts.values())
        
        return {
            "total_users_learned": total_users,
            "total_interactions_learned": total_interactions,
            "avg_interactions_per_user": total_interactions / total_users if total_users > 0 else 0,
            "total_conversation_patterns": sum(len(patterns) for patterns in self.conversation_patterns.values()),
            "preference_weights": self.preference_weights
        }