"""
WHATSAPP DARWIN HANDLER

Bridges the existing WhatsApp/Twilio integration with DARWIN architecture.
Does NOT replace existing chatbot - enhances it.

Intercepts messages and applies DARWIN classification/routing before response.
"""

from typing import Optional, Dict, Any
from datetime import datetime
from dataclasses import dataclass

try:
    from backend.conversation.customer_activation.activation_engine import (
        CustomerActivationEngine,
        ActivationInput,
        CustomerProfile,
    )
    from backend.conversation.core.router import ConversationRouter, RoutingDecision
    from backend.conversation.avatar.darwin_avatar import DarwinAvatar, create_legal_avatar
    from backend.conversation.schemas.conversation_schemas import ConversationContext, ChannelType
except ImportError:
    from conversation.customer_activation.activation_engine import (
        CustomerActivationEngine,
        ActivationInput,
        CustomerProfile,
    )
    from conversation.core.router import ConversationRouter, RoutingDecision
    from conversation.avatar.darwin_avatar import DarwinAvatar, create_legal_avatar
    from conversation.schemas.conversation_schemas import ConversationContext, ChannelType


@dataclass
class WhatsAppMessage:
    """Parsed WhatsApp message from Twilio webhook"""
    phone_number: str
    message_content: str
    timestamp: datetime
    message_id: str
    profile_name: Optional[str] = None
    is_returning_customer: bool = False
    existing_customer_id: Optional[str] = None
    firm_id: Optional[str] = None
    country: Optional[str] = None


@dataclass
class DarwinWhatsAppResponse:
    """Response from DARWIN to send via WhatsApp"""
    content: str
    confidence: float
    should_escalate: bool
    escalation_reason: Optional[str] = None
    next_action: Optional[str] = None
    avatar_state: Optional[str] = None
    metadata: Dict[str, Any] = None


class WhatsAppDarwinHandler:
    """
    Handles WhatsApp messages through DARWIN architecture.
    
    Flow:
    1. Receive message from Twilio webhook
    2. Parse to WhatsAppMessage
    3. Activate (classify profile, priority, journey)
    4. Route (select agent)
    5. Process (agent generates response)
    6. Send via Twilio
    
    Does NOT break existing system - adds enhancement layer.
    """
    
    def __init__(self, firm_id: str = "punto_cero_legal"):
        """Initialize handler"""
        self.firm_id = firm_id
        self.activation_engine = CustomerActivationEngine()
        self.router = ConversationRouter()
        self.avatar = create_legal_avatar()
    
    def handle_message(
        self,
        phone_number: str,
        message_content: str,
        profile_name: Optional[str] = None,
        country: Optional[str] = None,
        is_returning_customer: bool = False,
        customer_id: Optional[str] = None
    ) -> DarwinWhatsAppResponse:
        """
        Main entry point for WhatsApp messages.
        
        Returns immediately with acknowledgment.
        Processes classification/routing asynchronously.
        """
        
        # Step 1: Parse message
        whatsapp_msg = WhatsAppMessage(
            phone_number=phone_number,
            message_content=message_content,
            timestamp=datetime.now(),
            message_id=f"wa_{phone_number}_{datetime.now().timestamp()}",
            profile_name=profile_name,
            is_returning_customer=is_returning_customer,
            existing_customer_id=customer_id,
            firm_id=self.firm_id,
            country=country
        )
        
        # Step 2: Show avatar thinking
        self.avatar.set_thinking(reason="analyzing_message")
        
        # Step 3: Classify through activation engine
        activation_decision = self._classify_message(whatsapp_msg)
        
        # Step 4: Route to correct agent
        routing_decision = self._route_message(whatsapp_msg, activation_decision)
        
        # Step 5: Generate response
        response = self._generate_response(
            whatsapp_msg,
            activation_decision,
            routing_decision
        )
        
        # Step 6: Log interaction
        self._log_interaction(whatsapp_msg, activation_decision, routing_decision, response)
        
        return response
    
    def _classify_message(self, msg: WhatsAppMessage) -> Dict[str, Any]:
        """Classify message using DARWIN activation engine"""
        
        # Determine customer type from phone number and history
        customer_type = "unknown"
        if msg.is_returning_customer:
            # Could be client, lawyer, firm - need more context
            customer_type = "existing_customer"
        
        # Create activation input
        activation_input = ActivationInput(
            conversation_id=msg.message_id,
            channel="whatsapp",
            user_id=None,  # Will use phone number
            customer_id=msg.existing_customer_id,
            message_content=msg.message_content,
            message_timestamp=msg.timestamp,
            user_metadata={
                "phone": msg.phone_number,
                "name": msg.profile_name,
                "country": msg.country,
                "is_returning": msg.is_returning_customer,
            }
        )
        
        # Activate through DARWIN
        activation_decision = self.activation_engine.activate(activation_input)
        
        # Show avatar response
        if activation_decision.priority.value == "critical":
            self.avatar.set_warning("Urgent matter detected")
        elif activation_decision.should_escalate:
            self.avatar.set_serious("Escalation needed")
        else:
            self.avatar.set_typing("Preparing response")
        
        return {
            "profile": activation_decision.detected_profile,
            "confidence": activation_decision.confidence_profile,
            "intent": activation_decision.detected_intent,
            "priority": activation_decision.priority,
            "journey_stage": activation_decision.customer_journey_stage,
            "should_escalate": activation_decision.should_escalate,
            "escalation_reason": activation_decision.escalation_reason,
            "suggestions": activation_decision.suggestions,
        }
    
    def _route_message(
        self,
        msg: WhatsAppMessage,
        activation: Dict[str, Any]
    ) -> RoutingDecision:
        """Route to correct agent based on classification"""
        
        # Create routing context from activation
        context = {
            "profile": activation["profile"].value if hasattr(activation["profile"], "value") else str(activation["profile"]),
            "confidence": activation["confidence"],
            "intent": activation["intent"],
            "priority": activation["priority"].value if hasattr(activation["priority"], "value") else str(activation["priority"]),
            "phone": msg.phone_number,
            "country": msg.country,
            "is_returning_customer": msg.is_returning_customer,
            "customer_id": msg.existing_customer_id,
        }
        
        # Load conversation history from memory
        conversation_history = []
        if msg.existing_customer_id:
            # TODO: Implement memory loading in next phase
            pass
        
        # Route through DARWIN router
        routing_decision = self.router.route(
            message=msg.message_content,
            channel="whatsapp",
            user_context=context,
            conversation_history=conversation_history
        )
        
        return routing_decision
    
    def _generate_response(
        self,
        msg: WhatsAppMessage,
        activation: Dict[str, Any],
        routing: RoutingDecision
    ) -> DarwinWhatsAppResponse:
        """Generate response based on agent and context"""
        
        # Call appropriate agent based on routing.selected_agent
        response_text = self._generate_agent_response(msg, activation, routing)
        
        if activation["should_escalate"]:
            self.avatar.set_warning(activation["escalation_reason"])
        else:
            self.avatar.set_happy(reason="response_ready")
        
        return DarwinWhatsAppResponse(
            content=response_text,
            confidence=routing.confidence,
            should_escalate=activation["should_escalate"],
            escalation_reason=activation.get("escalation_reason"),
            next_action=activation.get("next_action"),
            avatar_state=self.avatar.get_state().state.value,
            metadata={
                "routing": routing.selected_agent,
                "profile": activation["profile"],
                "intent": activation["intent"],
                "journey": activation["journey_stage"],
            }
        )
    
    def _generate_agent_response(
        self,
        msg: WhatsAppMessage,
        activation: Dict[str, Any],
        routing: RoutingDecision
    ) -> str:
        """
        Generate response using appropriate agent based on routing decision.
        
        Integrates with DARWIN agent system for dynamic response generation.
        """
        try:
            from backend.conversation.agents.commercial_agent import CommercialAgent
            from backend.conversation.agents.lawyer_agent import LawyerAgent
            from backend.conversation.agents.firm_agent import FirmAgent
            from backend.conversation.agents.support_agent import SupportAgent
            from backend.conversation.agents.client_agent import ClientAgent
        except ImportError:
            from conversation.agents.commercial_agent import CommercialAgent
            from conversation.agents.lawyer_agent import LawyerAgent
            from conversation.agents.firm_agent import FirmAgent
            from conversation.agents.support_agent import SupportAgent
            from conversation.agents.client_agent import ClientAgent
        
        # Map routing agent to actual agent class
        agent_map = {
            "commercial": CommercialAgent,
            "lawyer": LawyerAgent,
            "firm": FirmAgent,
            "support": SupportAgent,
            "client": ClientAgent,
            "escalation": None,  # Will trigger human escalation
            "legal_ai": None,  # Will use legal AI service
            "billing": None,  # Will use billing service
        }
        
        # Handle escalation
        if routing.selected_agent == "escalation":
            return self._generate_escalation_response(activation)
        
        # Get agent class
        agent_class = agent_map.get(routing.selected_agent)
        
        if agent_class is None:
            # Fallback to commercial agent for unimplemented agents
            agent_class = CommercialAgent
        
        # Instantiate agent and process message
        try:
            agent = agent_class()
            
            context = {
                "channel": "whatsapp",
                "profile": activation["profile"],
                "intent": activation["intent"],
                "priority": activation["priority"],
                "phone": msg.phone_number,
                "country": msg.country,
                "is_returning_customer": msg.is_returning_customer,
            }
            
            response = agent.process_message(
                message=msg.message_content,
                context=context,
                conversation_history=[]
            )
            
            return response.content
            
        except Exception as e:
            # Fallback response if agent fails
            return self._generate_fallback_response(msg, activation)
    
    def _generate_escalation_response(self, activation: Dict[str, Any]) -> str:
        """Generate response for escalated conversations"""
        profile = activation["profile"]
        reason = activation.get("escalation_reason", "This matter requires specialist attention")
        
        return (
            f"Entiendo que tu situación es importante. {reason}. "
            f"Un especialista te contactará en los próximos minutos para brindarte "
            f"la atención personalizada que necesitas. "
            f"Por favor, ten a mano tu información de contacto."
        )
    
    def _generate_fallback_response(self, msg: WhatsAppMessage, activation: Dict[str, Any]) -> str:
        """Generate fallback response when agent fails"""
        name = msg.profile_name or "amigo" if msg.country in ["Colombia", "Venezuela", "Peru"] else "estimado"
        
        return (
            f"Gracias por contactarnos, {name}. "
            f"Estoy procesando tu solicitud y en un momento te daré una respuesta completa. "
            f"¿Podrías contarme un poco más sobre lo que necesitas?"
        )
    
    def _log_interaction(
        self,
        msg: WhatsAppMessage,
        activation: Dict[str, Any],
        routing: RoutingDecision,
        response: DarwinWhatsAppResponse
    ):
        """Log interaction for analytics and debugging"""
        try:
            try:
                from backend.conversation.services.conversation_logger import ConversationLogger
            except ImportError:
                from conversation.services.conversation_logger import ConversationLogger
            logger = ConversationLogger()
            logger.log_interaction(
                message=msg,
                activation=activation,
                routing=routing,
                response=response
            )
        except Exception:
            # Silently fail logging to not interrupt conversation flow
            pass
    
    def get_avatar(self) -> DarwinAvatar:
        """Get avatar instance for this handler"""
        return self.avatar
    
    def reset(self):
        """Reset to initial state"""
        self.avatar.reset()
