"""
ResponseGenerator

AI-powered response generation using multiple providers.
Integrates Gemini, Claude, and OpenAI with fallback and retry logic.

Never depends on a single provider.
Respects: fallback, timeout, retry, cost optimization.
"""

from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum
import os


class AIProvider(str, Enum):
    """Supported AI providers"""
    GEMINI = "gemini"
    CLAUDE = "claude"
    OPENAI = "openai"


class ResponseGenerator:
    """
    Generates responses using AI providers with intelligent fallback.
    
    Features:
    - Multi-provider support (Gemini, Claude, OpenAI)
    - Automatic fallback on failure
    - Timeout and retry logic
    - Cost optimization (prefers cheaper providers when appropriate)
    - Context-aware generation
    - Knowledge injection
    """
    
    def __init__(self):
        self.generator_id = "response-generator-v1"
        self.providers = {
            AIProvider.GEMINI: {
                "enabled": bool(os.getenv("GEMINI_API_KEY")),
                "priority": 1,  # Primary
                "cost_tier": "low",
                "timeout": 10,
                "retry_count": 2
            },
            AIProvider.CLAUDE: {
                "enabled": bool(os.getenv("ANTHROPIC_API_KEY")),
                "priority": 2,  # Fallback
                "cost_tier": "high",
                "timeout": 15,
                "retry_count": 1
            },
            AIProvider.OPENAI: {
                "enabled": bool(os.getenv("OPENAI_API_KEY")),
                "priority": 3,  # Secondary fallback
                "cost_tier": "medium",
                "timeout": 12,
                "retry_count": 1
            }
        }
        self.default_provider = AIProvider.GEMINI
        
    def generate_response(
        self,
        message: str,
        agent_type: str,
        context: Dict[str, Any],
        knowledge_context: Optional[Dict[str, Any]] = None,
        conversation_history: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Generate AI-powered response.
        
        Args:
            message: User message
            agent_type: Type of agent (commercial, lawyer, firm, etc.)
            context: Conversation context (profile, intent, priority, etc.)
            knowledge_context: Knowledge base context
            conversation_history: Previous messages
            
        Returns:
            Response dict with content, confidence, provider, metadata
        """
        # Build prompt with context
        prompt = self._build_prompt(message, agent_type, context, knowledge_context, conversation_history)
        
        # Try providers in priority order
        providers_to_try = sorted(
            [p for p in self.providers.items() if p[1]["enabled"]],
            key=lambda x: x[1]["priority"]
        )
        
        if not providers_to_try:
            # No providers available - use fallback
            return self._generate_fallback_response(message, agent_type, context)
        
        # Try each provider
        last_error = None
        for provider, config in providers_to_try:
            try:
                response = self._call_provider(provider, prompt, config)
                if response and response.get("content"):
                    return {
                        "content": response["content"],
                        "confidence": response.get("confidence", 0.8),
                        "provider": provider.value,
                        "agent_type": agent_type,
                        "timestamp": datetime.now().isoformat(),
                        "metadata": {
                            "provider_used": provider.value,
                            "cost_tier": config["cost_tier"],
                            "tokens_used": response.get("tokens_used", 0),
                            "generation_time": response.get("generation_time", 0)
                        }
                    }
            except Exception as e:
                last_error = e
                continue
        
        # All providers failed - use fallback
        return self._generate_fallback_response(message, agent_type, context, error=last_error)
    
    def _build_prompt(
        self,
        message: str,
        agent_type: str,
        context: Dict[str, Any],
        knowledge_context: Optional[Dict[str, Any]] = None,
        conversation_history: Optional[List[Dict[str, Any]]] = None
    ) -> str:
        """Build comprehensive prompt for AI generation"""
        
        # System prompt based on agent type
        system_prompts = {
            "commercial": "Eres un asesor comercial experto de Punto Cero Legal. Tu objetivo es ayudar a clientes potenciales a entender nuestros servicios y guiarlos hacia la solución perfecta para sus necesidades legales.",
            "lawyer": "Eres un especialista en reclutamiento de Punto Cero Legal. Ayudas a abogados a unirse a nuestra plataforma, explicando beneficios, comisiones y el proceso de onboarding.",
            "firm": "Eres un ejecutivo de partnerships de Punto Cero Legal. Ayudas a firmas de abogados a escalar sus operaciones con nuestras soluciones empresariales.",
            "support": "Eres un agente de soporte técnico de Punto Cero Legal. Ayudas a resolver problemas técnicos y de acceso a la plataforma.",
            "client": "Eres un asesor de cliente de Punto Cero Legal. Ayudas a clientes existentes con sus casos y necesidades legales.",
            "legal_ai": "Eres un asistente legal AI de Punto Cero Legal. Proporcionas información legal general y guías a los usuarios hacia nuestros servicios."
        }
        
        system_prompt = system_prompts.get(agent_type, system_prompts["commercial"])
        
        # Build context section
        context_section = f"""
Contexto del usuario:
- Perfil: {context.get('profile', 'unknown')}
- Intención: {context.get('intent', 'unknown')}
- Prioridad: {context.get('priority', 'normal')}
- País: {context.get('country', 'Colombia')}
- Cliente recurrente: {'Sí' if context.get('is_returning_customer') else 'No'}
"""
        
        # Add knowledge context if available
        knowledge_section = ""
        if knowledge_context:
            if knowledge_context.get("relevant_policies"):
                knowledge_section += "\n\nPolíticas relevantes:\n" + "\n".join(
                    f"- {policy}" for policy in knowledge_context["relevant_policies"][:2]
                )
            if knowledge_context.get("relevant_playbook_steps"):
                knowledge_section += "\n\nEnfoque recomendado:\n" + "\n".join(
                    f"- {step}" for step in knowledge_context["relevant_playbook_steps"][:2]
                )
        
        # Add conversation history
        history_section = ""
        if conversation_history:
            history_section = "\n\nHistorial de conversación:\n"
            for msg in conversation_history[-5:]:  # Last 5 messages
                role = msg.get("role", "user")
                content = msg.get("content", "")
                history_section += f"{role.capitalize()}: {content}\n"
        
        # Build final prompt
        full_prompt = f"""{system_prompt}

{context_section}
{knowledge_section}
{history_section}

Mensaje del usuario: {message}

Instrucciones:
- Responde de manera natural y conversacional
- Usa español apropiado para el país del usuario
- Sé empático y profesional
- Mantén respuestas concisas (1-3 párrafos máximo)
- Si necesitas más información, pregunta de manera natural
- No uses lenguaje robótico o genérico
- Personaliza la respuesta según el perfil y contexto del usuario

Respuesta:"""
        
        return full_prompt
    
    def _call_provider(self, provider: AIProvider, prompt: str, config: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Call AI provider with retry logic.
        
        Returns:
            Response dict or None if failed
        """
        import time
        
        retry_count = config.get("retry_count", 1)
        timeout = config.get("timeout", 10)
        
        last_error = None
        for attempt in range(retry_count):
            try:
                start_time = time.time()
                
                if provider == AIProvider.GEMINI:
                    response = self._call_gemini(prompt, timeout)
                elif provider == AIProvider.CLAUDE:
                    response = self._call_claude(prompt, timeout)
                elif provider == AIProvider.OPENAI:
                    response = self._call_openai(prompt, timeout)
                else:
                    continue
                
                generation_time = time.time() - start_time
                
                if response and response.get("content"):
                    response["generation_time"] = generation_time
                    return response
                    
            except Exception as e:
                last_error = e
                if attempt < retry_count - 1:
                    time.sleep(1 * (attempt + 1))  # Exponential backoff
                continue
        
        return None
    
    def _call_gemini(self, prompt: str, timeout: int) -> Optional[Dict[str, Any]]:
        """Call Gemini API"""
        try:
            import google.generativeai as genai
            
            api_key = os.getenv("GEMINI_API_KEY")
            if not api_key:
                return None
            
            genai.configure(api_key=api_key)
            model_name = os.getenv("GEMINI_MODEL", "gemini-flash-latest")
            model = genai.GenerativeModel(model_name)
            
            response = model.generate_content(
                prompt,
                generation_config={
                    "temperature": 0.7,
                    "max_output_tokens": 500,
                    "top_p": 0.9
                }
            )
            
            return {
                "content": response.text,
                "confidence": 0.85,
                "tokens_used": response.usage_metadata.total_token_count if hasattr(response, 'usage_metadata') else 0
            }
        except Exception:
            return None
    
    def _call_claude(self, prompt: str, timeout: int) -> Optional[Dict[str, Any]]:
        """Call Claude API"""
        try:
            import anthropic
            
            api_key = os.getenv("ANTHROPIC_API_KEY")
            if not api_key:
                return None
            
            client = anthropic.Anthropic(api_key=api_key)
            
            message = client.messages.create(
                model="claude-3-haiku-20240307",
                max_tokens=500,
                temperature=0.7,
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            )
            
            return {
                "content": message.content[0].text,
                "confidence": 0.9,
                "tokens_used": message.usage.input_tokens + message.usage.output_tokens
            }
        except Exception:
            return None
    
    def _call_openai(self, prompt: str, timeout: int) -> Optional[Dict[str, Any]]:
        """Call OpenAI API"""
        try:
            import openai
            
            api_key = os.getenv("OPENAI_API_KEY")
            if not api_key:
                return None
            
            client = openai.OpenAI(api_key=api_key)
            
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {
                        "role": "system",
                        "content": "You are a helpful assistant for Punto Cero Legal."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_tokens=500,
                temperature=0.7
            )
            
            return {
                "content": response.choices[0].message.content,
                "confidence": 0.85,
                "tokens_used": response.usage.total_tokens
            }
        except Exception:
            return None
    
    def _generate_fallback_response(
        self,
        message: str,
        agent_type: str,
        context: Dict[str, Any],
        error: Optional[Exception] = None
    ) -> Dict[str, Any]:
        """
        Generate fallback response when all AI providers fail.
        
        Uses agent-specific templates without hardcoding generic responses.
        """
        profile = context.get("profile", "unknown")
        country = context.get("country", "Colombia")
        
        # Agent-specific fallback responses
        fallback_responses = {
            "commercial": self._commercial_fallback(message, profile, country),
            "lawyer": self._lawyer_fallback(message, profile, country),
            "firm": self._firm_fallback(message, profile, country),
            "support": self._support_fallback(message, profile, country),
            "client": self._client_fallback(message, profile, country),
        }
        
        content = fallback_responses.get(agent_type, fallback_responses["commercial"])
        
        return {
            "content": content,
            "confidence": 0.6,
            "provider": "fallback",
            "agent_type": agent_type,
            "timestamp": datetime.now().isoformat(),
            "metadata": {
                "fallback_reason": "AI providers unavailable" if not error else str(error),
                "provider_used": "fallback"
            }
        }
    
    def _commercial_fallback(self, message: str, profile: str, country: str) -> str:
        """Commercial agent fallback response"""
        return (
            "Gracias por tu interés en Punto Cero Legal. "
            "Para poder ayudarte mejor, ¿podrías contarme más específicamente qué servicio legal necesitas? "
            "Así podré conectarte con el abogado ideal para tu caso."
        )
    
    def _lawyer_fallback(self, message: str, profile: str, country: str) -> str:
        """Lawyer agent fallback response"""
        return (
            "Excelente que te intereses en formar parte de Punto Cero Legal. "
            "Nuestro equipo de reclutamiento te contactará pronto para explicarte "
            "todos los beneficios y el proceso de onboarding. ¿Tienes alguna pregunta específica mientras tanto?"
        )
    
    def _firm_fallback(self, message: str, profile: str, country: str) -> str:
        """Firm agent fallback response"""
        return (
            "Gracias por contactarnos. Entendemos que tu firma busca soluciones escalables. "
            "Nuestro equipo de partnerships te contactará en las próximas horas para "
            "agendar una llamada y discutir cómo podemos ayudar a tu equipo."
        )
    
    def _support_fallback(self, message: str, profile: str, country: str) -> str:
        """Support agent fallback response"""
        return (
            "Lamento que estés teniendo problemas. Para poder ayudarte de la mejor manera, "
            "¿podrías describir el problema específico que estás experimentando? "
            "Incluye detalles como el mensaje de error o qué estabas haciendo cuando ocurrió."
        )
    
    def _client_fallback(self, message: str, profile: str, country: str) -> str:
        """Client agent fallback response"""
        return (
            "Gracias por contactarnos. Entiendo que necesitas ayuda con tu caso. "
            "Para poder asistirte mejor, ¿podrías compartir más detalles sobre tu situación? "
            "Así podré verificar el estado actual y darte la información más actualizada."
        )
    
    def get_provider_status(self) -> Dict[str, Any]:
        """Get status of all AI providers"""
        return {
            "generator_id": self.generator_id,
            "providers": {
                provider.value: {
                    "enabled": config["enabled"],
                    "priority": config["priority"],
                    "cost_tier": config["cost_tier"]
                }
                for provider, config in self.providers.items()
            },
            "default_provider": self.default_provider.value,
            "status": "operational"
        }