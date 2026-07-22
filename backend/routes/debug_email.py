"""
Debug endpoint para probar envío de correos en producción (Render)
SOLO PARA TESTING - Remover después de validar
"""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime
import logging
import os

from utils.notifier import send_email_account_created
from server import get_db

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/debug", tags=["Debug"])


@router.get("/email-test")
async def test_email_endpoint():
    """Endpoint temporal para probar envío de correo en Render.
    
    Acceder desde Render: https://puntocero-legal-api.onrender.com/debug/email-test
    
    Retorna el resultado completo del envío incluyendo errores de Resend API.
    """
    # Verificar que RESEND_API_KEY esté configurada
    resend_key = os.environ.get("RESEND_API_KEY")
    resend_from = os.environ.get("RESEND_FROM")
    
    config_status = {
        "resend_api_key_configured": bool(resend_key),
        "resend_from": resend_from,
        "smtp_host": os.environ.get("SMTP_HOST"),
        "environment": "production" if not os.environ.get("DEBUG") else "development"
    }
    
    if not resend_key:
        return {
            "status": "error",
            "message": "RESEND_API_KEY no configurada en Render",
            "config": config_status
        }
    
    # Datos de prueba
    test_data = {
        "to_email": "darwin@puntocerolegal.com",
        "full_name": "Dr. Darwin Gomez (TEST)",
        "temp_password": "TestPass2025!",
        "expires_at": datetime.utcnow(),
        "firm_name": "Punto Cero Legal"
    }
    
    logger.info("[DEBUG_EMAIL_TEST] Iniciando prueba de envío de correo")
    logger.info(f"[DEBUG_EMAIL_TEST] Configuración: {config_status}")
    
    try:
        # Enviar correo usando la función real
        result = send_email_account_created(
            to_email=test_data["to_email"],
            full_name=test_data["full_name"],
            temp_password=test_data["temp_password"],
            expires_at=test_data["expires_at"],
            firm_name=test_data["firm_name"]
        )
        
        logger.info(f"[DEBUG_EMAIL_TEST] Resultado: sent={result.get('sent')}, provider={result.get('provider')}")
        
        return {
            "status": "success" if result.get("sent") else "failed",
            "message": "Correo enviado exitosamente" if result.get("sent") else "Error en el envío",
            "test_data": test_data,
            "result": result,
            "config": config_status
        }
        
    except Exception as e:
        logger.error(f"[DEBUG_EMAIL_TEST] Excepción: {e}")
        return {
            "status": "exception",
            "message": f"Excepción durante el envío: {str(e)}",
            "error_type": type(e).__name__,
            "test_data": test_data,
            "config": config_status
        }


@router.get("/email-config")
async def get_email_config():
    """Muestra la configuración de email sin enviar nada (seguro)."""
    return {
        "resend_api_key_configured": bool(os.environ.get("RESEND_API_KEY")),
        "resend_from": os.environ.get("RESEND_FROM"),
        "smtp_configured": all([
            os.environ.get("SMTP_HOST"),
            os.environ.get("SMTP_USER"),
            os.environ.get("SMTP_PASS")
        ]),
        "smtp_host": os.environ.get("SMTP_HOST"),
        "smtp_user": os.environ.get("SMTP_USER", "***")[:10] + "..." if os.environ.get("SMTP_USER") else None,
        "smtp_from": os.environ.get("SMTP_FROM"),
        "render_url": "https://puntocero-legal-api.onrender.com"
    }