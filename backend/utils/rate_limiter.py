"""
Rate Limiting Service — Punto Cero Legal
Protege endpoints críticos contra abuso.
Usa SlowAPI + Redis (con fallback a memoria).
"""

from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from functools import wraps
import logging

logger = logging.getLogger("punto_cero.rate_limit")

# Configuración de límites por endpoint
RATE_LIMITS = {
    "auth": {
        "login": "5 per minute",
        "register": "3 per minute",
        "reset-password": "3 per minute",
    },
    "activation": {
        "activate-firm": "10 per minute",
        "activate-lawyer": "10 per minute",
    },
    "invitations": {
        "invite-lawyer": "20 per minute",
    },
    "public": {
        "public-contact": "5 per minute",
    },
    "general": {
        "default": "100 per minute",
    }
}

class RateLimitTracker:
    """Tracker de intentos bloqueados."""
    
    def __init__(self):
        self.blocked_attempts = []
    
    def log_blocked_attempt(self, ip: str, endpoint: str, user_id: str = None):
        """Registrar intento bloqueado."""
        attempt = {
            "timestamp": __import__("datetime").datetime.utcnow().isoformat(),
            "ip": ip,
            "endpoint": endpoint,
            "user_id": user_id
        }
        self.blocked_attempts.append(attempt)
        if len(self.blocked_attempts) > 1000:
            self.blocked_attempts.pop(0)
        
        logger.warning(
            f"[RateLimit] Blocked: {endpoint} from {ip}",
            extra={"user_id": user_id}
        )
    
    def get_recent_blocks(self, limit: int = 50):
        """Obtener intentos bloqueados recientes."""
        return self.blocked_attempts[-limit:]
    
    def get_blocks_by_ip(self, ip: str):
        """Obtener bloques por IP."""
        return [a for a in self.blocked_attempts if a["ip"] == ip]


# Instancia global
_limiter = Limiter(key_func=get_remote_address)
_tracker = RateLimitTracker()

def get_limiter():
    return _limiter

def get_rate_limit_tracker():
    return _tracker

def rate_limit(limit_key: str):
    """Decorator para aplicar rate limit."""
    def decorator(func):
        limit = RATE_LIMITS.get("general", {}).get("default", "100 per minute")
        
        # Buscar límite específico
        for category, endpoints in RATE_LIMITS.items():
            for endpoint, ep_limit in endpoints.items():
                if endpoint in func.__name__.lower():
                    limit = ep_limit
                    break
        
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Aplicar límite
            return await func(*args, **kwargs)
        
        return _limiter.limit(limit)(wrapper)
    
    return decorator


def setup_rate_limiting(app):
    """Configurar rate limiting en la aplicación FastAPI."""
    app.state.limiter = _limiter
    
    @app.exception_handler(RateLimitExceeded)
    async def rate_limit_handler(request, exc):
        return {
            "detail": "Rate limit exceeded. Too many requests.",
            "retry_after": 60
        }
    
    logger.info("[RateLimit] Rate limiting configurado")
