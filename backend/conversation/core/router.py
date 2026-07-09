"""
ConversationRouter

Responsible for:
- Identifying input channel
- Identifying context
- Identifying user intention
- Selecting appropriate agent

Does NOT respond - only decides.
"""

from typing import Optional, Dict, Any
from dataclasses import dataclass


@dataclass
class RoutingDecision:
    """Result of routing analysis"""
    channel: str
    context: Dict[str, Any]
    intention: str
    selected_agent: str
    confidence: float
    metadata: Dict[str, Any]


class ConversationRouter:
    """
    Core router that analyzes incoming conversations and determines
    which agent should handle the request.
    """

    def __init__(self):
        self.supported_channels = {
            "whatsapp",
            "landing",
            "dashboard",
            "api",
            "mobile"
        }
        self.supported_agents = {
            "commercial",
            "lawyer",
            "firm",
            "support",
            "client"
        }

    def route(
        self,
        message: str,
        channel: str,
        user_context: Optional[Dict[str, Any]] = None,
        conversation_history: Optional[list] = None
    ) -> RoutingDecision:
        """
        Analyze incoming message and determine routing.

        Args:
            message: User message content
            channel: Input channel (whatsapp, landing, dashboard, api, mobile)
            user_context: Optional user context data
            conversation_history: Optional previous messages in conversation

        Returns:
            RoutingDecision with channel, context, intention, agent, confidence
        """
        if channel not in self.supported_channels:
            raise ValueError(f"Unsupported channel: {channel}")

        # Initialize context
        context = user_context or {}
        message_lower = message.lower()

        # Detect intention from message content
        intention = self._detect_intention(message_lower, context)

        # Select agent based on intention and context
        selected_agent = self._select_agent(intention, context)

        # Calculate confidence based on signals
        confidence = self._calculate_confidence(message_lower, intention, context)

        # Build metadata
        metadata = {
            "router_version": "2.0.0",
            "routing_stage": "operational",
            "intent_signals": self._get_intent_signals(message_lower, intention),
            "profile_considered": context.get("profile", "unknown"),
            "priority": context.get("priority", "normal")
        }

        return RoutingDecision(
            channel=channel,
            context=context,
            intention=intention,
            selected_agent=selected_agent,
            confidence=confidence,
            metadata=metadata
        )

    def _detect_intention(self, message_lower: str, context: Dict[str, Any]) -> str:
        """Detect user intention from message content"""
        # Urgent matters take priority
        urgent_patterns = [
            "urgente", "ahora", "inmediato", "emergencia", "critico",
            "emergency", "asap", "hoy mismo"
        ]
        if any(pattern in message_lower for pattern in urgent_patterns):
            return "urgent"

        # Lawyer recruitment (check before sales to avoid false positives)
        lawyer_patterns = [
            "registrarme como abogado",
            "ser abogado",
            "unirme como abogado",
            "trabajar como abogado",
            "abogado en la plataforma",
            "profesional del derecho",
            "unirme", "registrar como abogado"
        ]
        if any(pattern in message_lower for pattern in lawyer_patterns):
            return "lawyer_recruitment"

        # Sales/commercial interest
        sales_patterns = [
            "precio", "costo", "tarifa", "plan", "servicio",
            "contratar", "quiero", "necesito", "empezar", "comenzar"
        ]
        if any(pattern in message_lower for pattern in sales_patterns):
            return "sales"

        # Support needs
        support_patterns = [
            "no funciona", "error", "problema técnico", "ayuda",
            "no puedo", "se cayó", "lento", "contraseña", "acceso"
        ]
        if any(pattern in message_lower for pattern in support_patterns):
            return "support"

        # Partnership/firm inquiry
        partnership_patterns = [
            "firma", "empresa", "partnership", "alianza", "equipo",
            "múltiples", "volumen", "integración"
        ]
        if any(pattern in message_lower for pattern in partnership_patterns):
            return "partnership"

        # Complaint
        complaint_patterns = [
            "queja", "molesto", "furioso", "enojado", "inaceptable",
            "complaint", "upset", "angry", "terrible"
        ]
        if any(pattern in message_lower for pattern in complaint_patterns):
            return "complaint"

        # Case status inquiry (for existing clients) - check BEFORE legal inquiry
        case_status_patterns = [
            "estado de mi caso", "status de mi caso", 
            "estado del expediente", "progreso de mi caso"
        ]
        if any(pattern in message_lower for pattern in case_status_patterns):
            return "case_status_inquiry"
        
        # Legal case inquiry
        legal_patterns = [
            "caso", "demanda", "divorcio", "herencia", "testamento",
            "contrato", "litigio", "asesoría legal", "consulta"
        ]
        if any(pattern in message_lower for pattern in legal_patterns):
            return "legal_inquiry"

        # Default to general inquiry
        return "inquiry"

    def _select_agent(self, intention: str, context: Dict[str, Any]) -> str:
        """Select appropriate agent based on intention and context"""
        # Consider user profile if available
        profile = context.get("profile", "")

        # Urgent matters go to escalation/support
        if intention == "urgent":
            return "escalation"

        # Complaints need human attention
        if intention == "complaint":
            return "escalation"

        # Partnership inquiries go to firm agent
        if intention == "partnership":
            return "firm"

        # Lawyer recruitment
        if intention == "lawyer_recruitment":
            return "lawyer"

        # Legal inquiries
        if intention == "legal_inquiry":
            return "legal_ai"
        
        # Case status inquiries go to client agent
        if intention == "case_status_inquiry":
            return "client"

        # Sales/commercial
        if intention == "sales":
            return "commercial"

        # Support
        if intention == "support":
            return "support"

        # Billing inquiries
        if intention == "billing":
            return "billing"

        # Default based on profile
        if profile == "client":
            return "client"
        elif profile == "lawyer":
            return "lawyer"
        elif profile == "firm":
            return "firm"

        # Default to commercial for new leads
        return "commercial"

    def _calculate_confidence(
        self,
        message_lower: str,
        intention: str,
        context: Dict[str, Any]
    ) -> float:
        """Calculate routing confidence score"""
        base_confidence = 0.7

        # Boost for clear intent signals
        if intention != "inquiry":
            base_confidence += 0.15

        # Boost if profile is known
        if context.get("profile") and context.get("profile") != "unknown":
            base_confidence += 0.1

        # Boost for returning customer
        if context.get("is_returning_customer"):
            base_confidence += 0.05

        # Cap at 0.95
        return min(0.95, base_confidence)

    def _get_intent_signals(self, message_lower: str, intention: str) -> list:
        """Get signals that triggered intention detection"""
        signals = []

        signal_map = {
            "urgent": ["urgente", "emergencia", "ahora", "inmediato"],
            "sales": ["precio", "costo", "contratar", "quiero"],
            "support": ["error", "ayuda", "problema", "no funciona"],
            "partnership": ["firma", "empresa", "partnership", "equipo"],
            "lawyer_recruitment": ["abogado", "unirme", "plataforma", "comisión"],
            "complaint": ["queja", "molesto", "terrible", "enojado"],
            "legal_inquiry": ["caso", "demanda", "divorcio", "contrato"]
        }

        patterns = signal_map.get(intention, [])
        for pattern in patterns:
            if pattern in message_lower:
                signals.append(pattern)

        return signals[:5]  # Limit to top 5 signals

    def validate_channel(self, channel: str) -> bool:
        """Validate if channel is supported"""
        return channel in self.supported_channels

    def validate_agent(self, agent: str) -> bool:
        """Validate if agent is supported"""
        return agent in self.supported_agents

    def get_supported_channels(self) -> set:
        """Get all supported channels"""
        return self.supported_channels.copy()

    def get_supported_agents(self) -> set:
        """Get all supported agents"""
        return self.supported_agents.copy()
