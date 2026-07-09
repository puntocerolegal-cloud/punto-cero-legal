"""
FLOATING BUTTON HANDLER

Replaces direct WhatsApp link with Darwin chat experience.
Opens modal with Darwin, detects profile, transfers to WhatsApp when needed.

No longer direct wa.me link.
First touch point: Darwin conversation.
"""

from dataclasses import dataclass
from typing import Optional, Dict, Any
from datetime import datetime
from enum import Enum


class FloatingButtonState(str, Enum):
    """State of floating button interaction"""
    CLOSED = "closed"
    OPENING = "opening"
    OPEN = "open"
    CHAT_ACTIVE = "chat_active"
    CONNECTING_WHATSAPP = "connecting_whatsapp"
    ERROR = "error"


@dataclass
class FloatingButtonContext:
    """Context for floating button interaction"""
    user_id: Optional[str] = None
    phone_number: Optional[str] = None
    country: Optional[str] = None
    is_returning_customer: bool = False
    customer_profile: Optional[str] = None  # CLIENT/LAWYER/FIRM/etc
    session_id: str = None
    timestamp: datetime = datetime.now()


class FloatingButtonHandler:
    """
    Manages floating button behavior.
    
    1. Button click → Open chat modal with Darwin
    2. Darwin detects profile type
    3. Darwin understands need
    4. Transfer to WhatsApp only if needed
    5. Maintain conversation history
    """
    
    def __init__(self):
        """Initialize handler"""
        self.state = FloatingButtonState.CLOSED
        self.context = None
        self.conversation_started = False
    
    def on_button_click(self, context: FloatingButtonContext) -> Dict[str, Any]:
        """
        Handle floating button click.
        
        Returns configuration for frontend to open chat modal.
        """
        self.context = context
        self.state = FloatingButtonState.OPENING
        
        return {
            "action": "open_chat_modal",
            "state": self.state.value,
            "modal_config": {
                "title": "Punto Cero",
                "show_avatar": True,
                "avatar_state": "idle",
                "first_message": self._get_opening_message(),
                "input_placeholder": "Escribe tu mensaje aquí...",
                "show_typing_indicator": True,
            },
            "session_id": context.session_id,
        }
    
    def on_chat_opened(self) -> Dict[str, Any]:
        """Chat modal fully opened - show Darwin avatar"""
        self.state = FloatingButtonState.OPEN
        
        return {
            "action": "show_message",
            "avatar_state": "thinking",
            "message": self._get_opening_message(),
            "delay": 800,  # milliseconds before showing
        }
    
    def on_message_received(self, message: str) -> Dict[str, Any]:
        """Process message from floating button chat"""
        self.state = FloatingButtonState.CHAT_ACTIVE
        self.conversation_started = True
        
        # Message will be processed by WhatsAppDarwinHandler
        # and routed to appropriate agent
        
        return {
            "action": "process_message",
            "avatar_state": "typing",
            "message": message,
            "route_to_whatsapp_handler": True,
        }
    
    def on_transfer_to_whatsapp(self) -> Dict[str, Any]:
        """When customer needs WhatsApp transfer"""
        self.state = FloatingButtonState.CONNECTING_WHATSAPP
        
        phone = self.context.phone_number if self.context else None
        
        return {
            "action": "transfer_to_whatsapp",
            "message": "Conectándote con nuestro equipo por WhatsApp...",
            "whatsapp_url": f"https://wa.me/message/{phone}" if phone else "https://wa.me/punto_cero",
            "delay": 1000,
            "auto_open": True,
        }
    
    def on_close(self) -> Dict[str, Any]:
        """Handle button close"""
        self.state = FloatingButtonState.CLOSED
        
        return {
            "action": "close_chat_modal",
            "save_conversation": self.conversation_started,
            "session_id": self.context.session_id if self.context else None,
        }
    
    def _get_opening_message(self) -> str:
        """Get context-aware opening message"""
        if self.context and self.context.is_returning_customer:
            return "¡Bienvenido de vuelta! ¿En qué puedo ayudarte?"
        else:
            return "Hola, soy Darwin, tu asesor en Punto Cero. ¿En qué te puedo ayudar?"
    
    def get_state(self) -> str:
        """Get current state"""
        return self.state.value


# FRONTEND INTEGRATION POINTS

class FloatingButtonConfig:
    """Configuration sent to frontend"""
    
    @staticmethod
    def get_button_config() -> Dict[str, Any]:
        """Get floating button configuration for frontend"""
        return {
            "position": "bottom-right",  # CSS position
            "offset_x": 20,              # pixels from edge
            "offset_y": 20,              # pixels from edge
            "size": "large",             # large, medium, small
            "animation": "pulse",        # pulse, bounce, fade
            "animation_speed": 2,        # seconds
            
            # Colors (from Darwin brand)
            "background_color": "#1a3a52",  # Punto Cero blue
            "hover_color": "#0f2a3d",       # Darker blue
            "text_color": "#ffffff",        # White
            "badge_color": "#10b981",       # Green for unread
            
            # Icon (Darwin avatar icon)
            "icon_type": "avatar",          # avatar, message, contact
            "show_unread_badge": True,
            
            # Accessibility
            "aria_label": "Abrir chat con Darwin",
            "z_index": 9999,                # Above other elements
            
            # Mobile specific
            "mobile_position": "full_width",
            "mobile_size": "medium",
        }
    
    @staticmethod
    def get_modal_config() -> Dict[str, Any]:
        """Get chat modal configuration"""
        return {
            "width": "400px",
            "height": "600px",
            "border_radius": "12px",
            "box_shadow": "0 10px 40px rgba(0,0,0,0.16)",
            
            "header": {
                "background": "#1a3a52",
                "text_color": "#ffffff",
                "title": "Darwin - Punto Cero",
                "subtitle": "Tu asesor",
                "show_close_button": True,
                "show_minimize_button": True,
            },
            
            "messages": {
                "user_message_color": "#1a3a52",
                "bot_message_color": "#f0f0f0",
                "message_border_radius": "12px",
                "message_padding": "12px 16px",
            },
            
            "input": {
                "background": "#ffffff",
                "border": "1px solid #e0e0e0",
                "border_radius": "8px",
                "placeholder_color": "#999999",
                "focus_border_color": "#1a3a52",
            },
            
            "mobile": {
                "width": "100%",
                "height": "100vh",
                "border_radius": "0px",  # Full screen on mobile
                "position": "fixed",
                "bottom": 0,
                "right": 0,
            }
        }
    
    @staticmethod
    def get_animation_config() -> Dict[str, Any]:
        """Get animation configuration"""
        return {
            "button_pulse": {
                "duration": 2,
                "scale_start": 1.0,
                "scale_end": 1.05,
                "repeat": "infinite",
            },
            
            "modal_open": {
                "duration": 300,
                "easing": "ease-out",
                "animation": "slideUp",
            },
            
            "avatar_thinking": {
                "duration": 1000,
                "animation": "rotate",
                "repeat": "infinite",
            },
            
            "avatar_typing": {
                "duration": 1400,
                "animation": "dots",
                "repeat": "infinite",
            },
            
            "message_appear": {
                "duration": 200,
                "easing": "ease-in",
                "animation": "fadeIn",
            },
        }
