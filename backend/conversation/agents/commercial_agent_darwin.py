"""
COMMERCIAL AGENT

Specializes in handling new prospects and sales inquiries.
Uses Darwin personality to guide customers through the platform.

Handles:
- New visitors exploring Punto Cero
- Sales inquiries
- Platform questions
- Lead qualification
- Commercial opportunities

Never sounds like a salesman.
Always sounds like an advisor.
"""

from typing import Optional, Dict, Any
from datetime import datetime
from dataclasses import dataclass

from backend.conversation.agents.base_agent import BaseAgent, AgentResponse
from backend.conversation.avatar.darwin_avatar_config import (
    get_random_greeting,
    get_random_acknowledgment,
    DarwinTone,
)


class CommercialAgent(BaseAgent):
    """
    Commercial advisor agent using Darwin personality.
    Guides prospects through Punto Cero platform.
    """
    
    def __init__(self):
        """Initialize commercial agent"""
        super().__init__("commercial")
        self.handled_intents = {
            "sales_inquiry",
            "platform_question",
            "pricing_inquiry",
            "general_interest",
            "feature_question",
            "account_question",
        }
    
    def process_message(
        self,
        message: str,
        context: Optional[Dict[str, Any]] = None,
        conversation_history: Optional[list] = None,
        activation_insights: Optional[Dict[str, Any]] = None
    ) -> AgentResponse:
        """
        Process message as commercial advisor.
        
        Response format:
        - Greeting (if new contact)
        - Acknowledge what they said
        - Provide relevant information
        - Ask clarifying question
        - Keep it conversational
        """
        
        # Extract context
        context = context or {}
        customer_name = context.get("profile_name") or "amigo"
        country = context.get("country") or "generic"
        is_returning = context.get("is_returning_customer", False)
        
        # Determine message type
        message_lower = message.lower()
        
        # Generate response based on message intent
        response_text = self._generate_response(
            message,
            customer_name,
            country,
            is_returning,
            activation_insights or {}
        )
        
        # Build agent response
        return AgentResponse(
            content=response_text,
            agent_type="commercial",
            channel=context.get("channel", "unknown"),
            timestamp=datetime.now(),
            confidence=0.85,  # Commercial agents are confident
            metadata={
                "tone": "consultative",
                "country": country,
                "is_returning": is_returning,
                "agent_version": "darwin_v1",
            },
            requires_escalation=self._check_escalation(message),
            escalation_reason=self._get_escalation_reason(message) if self._check_escalation(message) else None
        )
    
    def validate_intent(self, intent: str) -> bool:
        """Check if agent handles this intent"""
        return intent.lower() in self.handled_intents
    
    def get_agent_type(self) -> str:
        """Get agent identifier"""
        return self.agent_type
    
    def _generate_response(
        self,
        message: str,
        name: str,
        country: str,
        is_returning: bool,
        activation_insights: Dict[str, Any]
    ) -> str:
        """
        Generate natural response matching Darwin personality.
        
        Key principles:
        - Short, conversational messages
        - Ask questions to understand
        - Provide relevant information
        - No robotic language
        - Acknowledge their situation
        """
        
        message_lower = message.lower()
        
        # First contact greeting
        if not is_returning and len((activation_insights.get("conversation_history") or [])) == 0:
            greeting = self._get_greeting(name, country)
            if "precio" in message_lower or "costo" in message_lower or "cuesta" in message_lower:
                return greeting + f" Vi que te interesa saber sobre los precios. ¿Qué tipo de servicios necesitas?"
            elif "como funciona" in message_lower or "funciona" in message_lower:
                return greeting + " ¿Quieres entender mejor cómo funciona Punto Cero? Cuéntame un poco sobre tu situación."
            else:
                return greeting + " ¿Cómo puedo ayudarte hoy?"
        
        # Price inquiry
        if any(word in message_lower for word in ["precio", "costo", "cuanto", "cuesta", "tarifa", "plan"]):
            return self._handle_pricing_inquiry(name)
        
        # Feature/product inquiry
        if any(word in message_lower for word in ["que hace", "caracteristicas", "funciones", "como", "plataforma", "herramientas"]):
            return self._handle_feature_inquiry(name)
        
        # Process inquiry
        if any(word in message_lower for word in ["proceso", "flujo", "como funciona", "pasos", "requisitos"]):
            return self._handle_process_inquiry(name)
        
        # Legal concern (not ready for commercial)
        if any(word in message_lower for word in ["urgente", "emergencia", "abogado", "caso", "delito", "demanda"]):
            return f"Entiendo que es un asunto delicado. ¿Te gustaría conectar directamente con un abogado para hablar de tu situación?"
        
        # Default: ask clarifying question
        return f"Perfecto, {name.split()[0]}. ¿Podrías contarme un poco más sobre qué necesitas?"
    
    def _get_greeting(self, name: str, country: str) -> str:
        """Get context-appropriate greeting"""
        first_name = name.split()[0] if " " in name else name
        
        greetings = [
            f"Hola {first_name}, soy Darwin, tu asesor en Punto Cero.",
            f"¡Hola {first_name}! Soy Darwin.",
            f"Bienvenido a Punto Cero, {first_name}. Soy Darwin.",
            f"Hola {first_name}, mucho gusto. Soy Darwin.",
        ]
        
        import random
        return random.choice(greetings)
    
    def _handle_pricing_inquiry(self, name: str) -> str:
        """Handle pricing questions"""
        first_name = name.split()[0] if " " in name else name
        responses = [
            f"Excelente pregunta, {first_name}. Tenemos planes flexibles según lo que necesites. ¿Eres cliente individual, abogado o firma jurídica?",
            f"Los precios en Punto Cero varían según el plan. ¿Qué tipo de servicios necesitas?",
            f"Me alegra que tengas interés, {first_name}. ¿Eres abogado, cliente o firma? Así te muestro el plan adecuado.",
        ]
        
        import random
        return random.choice(responses)
    
    def _handle_feature_inquiry(self, name: str) -> str:
        """Handle feature/product questions"""
        first_name = name.split()[0] if " " in name else name
        responses = [
            f"Punto Cero te ayuda a gestionar tus casos, conectarte con clientes y optimizar tu firma. ¿Qué aspecto te interesa más?",
            f"Somos una plataforma completa para firmas jurídicas y abogados independientes. ¿En qué área te gustaría especializarte?",
            f"Lo que más valoran es cómo facilita la gestión de clientes y casos. ¿Tienes una firma o trabajas como independiente?",
        ]
        
        import random
        return random.choice(responses)
    
    def _handle_process_inquiry(self, name: str) -> str:
        """Handle process/workflow questions"""
        first_name = name.split()[0] if " " in name else name
        responses = [
            f"El proceso es simple: te registras, completas tu perfil, y empiezas a recibir clientes o casos. ¿Quieres saber más?",
            f"Funciona en tres pasos: registro, verificación, y activación. ¿Tienes alguna pregunta específica?",
            f"Comenzamos juntos desde tu registro. Te guío en cada paso y estoy aquí para responder lo que necesites.",
        ]
        
        import random
        return random.choice(responses)
    
    def _check_escalation(self, message: str) -> bool:
        """Check if message requires escalation to human or legal"""
        escalation_keywords = [
            "urgente",
            "emergencia",
            "delito",
            "penal",
            "criminal",
            "violencia",
            "riesgo",
            "peligro",
            "caso abierto",
            "demanda",
            "juzgado",
        ]
        
        return any(keyword in message.lower() for keyword in escalation_keywords)
    
    def _get_escalation_reason(self, message: str) -> Optional[str]:
        """Get reason for escalation"""
        if any(word in message.lower() for word in ["urgente", "emergencia"]):
            return "Urgent legal matter"
        if any(word in message.lower() for word in ["delito", "penal", "criminal", "violencia"]):
            return "Criminal/penal matter - requires lawyer"
        if any(word in message.lower() for word in ["riesgo", "peligro"]):
            return "Risk situation - requires immediate attention"
        return "Requires lawyer consultation"
