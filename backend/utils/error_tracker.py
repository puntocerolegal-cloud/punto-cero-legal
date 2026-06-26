"""
Error Tracking Service — Punto Cero Legal
Captura, registra y reporta excepciones de forma centralizada.
Preparado para integración con Sentry (sin dependencia dura).
"""

import logging
import traceback
import json
from datetime import datetime
from typing import Optional, Dict, Any
from functools import wraps

logger = logging.getLogger("punto_cero.errors")

class ErrorTracker:
    """Servicio centralizado de tracking de errores."""
    
    def __init__(self, sentry_dsn: Optional[str] = None):
        self.sentry_dsn = sentry_dsn
        self.errors = []
        self._init_sentry()
    
    def _init_sentry(self):
        """Inicializar Sentry si está disponible."""
        if self.sentry_dsn:
            try:
                import sentry_sdk
                sentry_sdk.init(
                    dsn=self.sentry_dsn,
                    traces_sample_rate=0.1,
                    environment="production"
                )
                logger.info("[ErrorTracker] Sentry inicializado")
            except ImportError:
                logger.warning("[ErrorTracker] Sentry no instalado. Usando logger local.")
    
    def capture_exception(
        self,
        exception: Exception,
        context: Optional[Dict[str, Any]] = None,
        level: str = "error"
    ):
        """
        Capturar excepción con contexto.
        
        Args:
            exception: La excepción
            context: Contexto adicional (usuario, tenant, endpoint, etc.)
            level: Nivel de severidad (error, warning, critical)
        """
        context = context or {}
        
        error_record = {
            "timestamp": datetime.utcnow().isoformat(),
            "exception_type": type(exception).__name__,
            "message": str(exception),
            "stack_trace": traceback.format_exc(),
            "level": level,
            "context": context
        }
        
        # Registrar en logger local
        logger.error(
            f"[{level.upper()}] {error_record['exception_type']}: {error_record['message']}",
            extra={"context": context}
        )
        
        # Guardar en memoria (últimos 100 errores)
        self.errors.append(error_record)
        if len(self.errors) > 100:
            self.errors.pop(0)
        
        # Enviar a Sentry si está disponible
        if self.sentry_dsn:
            try:
                import sentry_sdk
                sentry_sdk.capture_exception(
                    exception,
                    extra=context
                )
            except Exception as e:
                logger.warning(f"[ErrorTracker] Sentry fallido: {e}")
        
        return error_record
    
    def capture_message(self, message: str, level: str = "info", context: Optional[Dict] = None):
        """Registrar mensaje."""
        context = context or {}
        logger.log(
            getattr(logging, level.upper(), logging.INFO),
            message,
            extra={"context": context}
        )
    
    def get_recent_errors(self, limit: int = 10):
        """Obtener últimos errores."""
        return self.errors[-limit:]
    
    def get_errors_by_user(self, user_id: str):
        """Obtener errores de un usuario."""
        return [e for e in self.errors if e.get("context", {}).get("user_id") == user_id]
    
    def get_errors_by_tenant(self, tenant_id: str):
        """Obtener errores de un tenant."""
        return [e for e in self.errors if e.get("context", {}).get("tenant_id") == tenant_id]


# Instancia global
_tracker = None

def init_error_tracker(sentry_dsn: Optional[str] = None) -> ErrorTracker:
    """Inicializar tracker global."""
    global _tracker
    _tracker = ErrorTracker(sentry_dsn=sentry_dsn)
    return _tracker

def get_error_tracker() -> ErrorTracker:
    """Obtener instancia del tracker."""
    global _tracker
    if _tracker is None:
        _tracker = ErrorTracker()
    return _tracker

def track_error_endpoint(func):
    """Decorator para capturar errores en endpoints."""
    @wraps(func)
    async def wrapper(*args, **kwargs):
        try:
            return await func(*args, **kwargs)
        except Exception as e:
            tracker = get_error_tracker()
            
            # Extraer contexto del request si está disponible
            context = {}
            for arg in args:
                if hasattr(arg, 'user') and arg.user:
                    context['user_id'] = arg.user.get('sub')
                    context['firm_id'] = arg.user.get('firm_id')
                if hasattr(arg, 'url'):
                    context['endpoint'] = str(arg.url.path)
            
            context['function'] = func.__name__
            
            tracker.capture_exception(e, context=context, level="error")
            raise
    
    return wrapper


# Logger configurado
def setup_logging():
    """Configurar logging centralizado."""
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler("logs/punto_cero.log"),
            logging.StreamHandler()
        ]
    )
