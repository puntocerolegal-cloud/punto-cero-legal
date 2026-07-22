"""
Centro de notificaciones multicanal — Punto Cero Legal.

Envía notificaciones por tres canales de forma simultánea y tolerante a fallos:
   1. In-app  → colección `notifications` (siempre funciona).
   2. Email   → SMTP si está configurado (SMTP_HOST/USER/PASS), si no, se registra.
   3. WhatsApp→ Twilio si está configurado (TWILIO_*), si no, se registra.

El diseño es "graceful degradation": si faltan credenciales externas, la
notificación in-app SIEMPRE se crea y los canales externos quedan en cola/log,
de modo que el resto del sistema nunca se rompe por falta de configuración.
"""
from __future__ import annotations
from datetime import datetime
import os
import ssl
import asyncio
import smtplib
import logging
import secrets
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

logger = logging.getLogger(__name__)

# Destinos del administrador para alertas externas inmediatas (reutiliza los
# canales ya existentes; configurables por entorno con fallback a los oficiales).
ADMIN_WHATSAPP = (os.environ.get("ADMIN_WHATSAPP_NUMBER")
                  or os.environ.get("META_WHATSAPP_NUMBER") or "+573028322083")
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL") or "puntocerolegal@gmail.com"


# ═══════════════════════════════════════════════════════════════════════════════════
# PLANTILLAS HTML TRANSACCIONALES
# ═══════════════════════════════════════════════════════════════════════════════════

def _get_base_template(content: str, title: str = "") -> str:
    """Layout base común para todos los correos transaccionales.
    
    Args:
        content: HTML del contenido específico del email
        title: Título de la página (opcional)
    
    Returns:
        HTML completo con layout común
    """
    return f"""<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <style>
        body {{ 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; 
            background: #f5f5f5; 
            margin: 0; 
            padding: 20px; 
        }}
        .container {{ 
            max-width: 600px; 
            margin: 0 auto; 
            background: white; 
            padding: 40px; 
            border-radius: 10px; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
        }}
        .header {{ 
            text-align: center; 
            margin-bottom: 30px; 
        }}
        .logo {{ 
            color: #f97316; 
            font-size: 28px; 
            font-weight: bold; 
        }}
        .title {{ 
            color: #1f2937; 
            font-size: 24px; 
            font-weight: bold; 
            margin: 20px 0; 
        }}
        .section {{ 
            margin: 20px 0; 
            padding: 15px; 
            background: #ecfdf5; 
            border-left: 4px solid #10b981; 
        }}
        .credentials {{ 
            background: #f3f4f6; 
            padding: 15px; 
            border-radius: 6px; 
            font-family: monospace; 
        }}
        .warning {{ 
            background: #fef3c7; 
            padding: 15px; 
            border-left: 4px solid #f59e0b; 
            margin: 20px 0; 
        }}
        .error {{ 
            background: #fef2f2; 
            padding: 15px; 
            border-left: 4px solid #ef4444; 
            margin: 20px 0; 
        }}
        .reason {{ 
            background: #f3f4f6; 
            padding: 12px; 
            border-radius: 6px; 
            margin: 10px 0; 
            font-size: 14px; 
            color: #374151; 
        }}
        .footer {{ 
            color: #9ca3af; 
            font-size: 12px; 
            text-align: center; 
            margin-top: 40px; 
            padding-top: 20px; 
            border-top: 1px solid #e5e7eb; 
        }}
        .button {{ 
            display: inline-block; 
            background: #3b82f6; 
            color: white; 
            padding: 12px 30px; 
            border-radius: 6px; 
            text-decoration: none; 
            font-weight: 600; 
            margin: 20px 0; 
        }}
    </style>
</head>
<body>
    <div class="container">
        {content}
        <div class="footer">
            <p>Punto Cero Legal © 2025 — Todos los derechos reservados</p>
            <p>¿Preguntas? Escribe a <strong>soporte@puntocerolegal.com</strong></p>
        </div>
    </div>
</body>
</html>"""


def _get_header(title: str) -> str:
    """Header común con logo PUNTO CERO"""
    return f"""
        <div class="header">
            <div class="logo">PUNTO CERO</div>
        </div>

        <div class="title">{title}</div>"""


def send_email_admission_received(
    to_email: str,
    full_name: str,
    firm_name: str = None,
    contact_email: str = None,
    contact_phone: str = None,
    contact_country: str = None,
    firm_size: str = None
) -> dict:
    """Envía correo de confirmación de solicitud de admisión recibida.
    
    PRIMER correo del flujo de admisión. El usuario NO tiene acceso al sistema.
    Objetivo: confirmar recepción, presentar Punto Cero Legal, generar confianza,
    explicar el proceso de evaluación y preparar al usuario para la decisión.
    
    NO incluye: credenciales, contraseña, enlace de acceso, confirmación de cuenta activa.
    
    Args:
        to_email: Email del destinatario
        full_name: Nombre del contacto
        firm_name: Nombre de la firma (opcional)
        contact_email: Email de contacto (opcional)
        contact_phone: Teléfono de contacto (opcional)
        contact_country: País (opcional)
        firm_size: Tamaño de la firma (opcional)
    
    Returns:
        Dict con resultado del envío
    """
    # Sección de datos registrados (si aplica)
    data_section = ""
    if firm_name:
        data_items = []
        if firm_name:
            data_items.append(f"• Firma: {firm_name}")
        if contact_email:
            data_items.append(f"• Email: {contact_email}")
        if contact_phone:
            data_items.append(f"• Teléfono: {contact_phone}")
        if contact_country:
            data_items.append(f"• País: {contact_country}")
        if firm_size:
            data_items.append(f"• Tamaño: {firm_size}")
        
        if data_items:
            data_section = f"""
            <div class="credentials">
                <p><strong>Datos registrados:</strong></p>
                {chr(10).join([f'<p>{item}</p>' for item in data_items])}
            </div>
            """
    
    content = f"""{_get_header("Solicitud de Incorporación Recibida")}

        <p>Hola <strong>{full_name}</strong>,</p>

        <p>Gracias por tu interés en <strong>Punto Cero Legal</strong>. Hemos recibido tu solicitud de incorporación y queremos contarte qué sigue.</p>

        <div class="section">
            <p><strong>¿Qué ocurre ahora?</strong></p>
            <p>1. Recibimos tu solicitud de incorporación.</p>
            <p>2. Nuestro equipo revisará tu información.</p>
            <p>3. Evaluaremos tu perfil profesional.</p>
            <p>4. Recibirás una notificación con la decisión de acceso.</p>
        </div>

        {data_section}

        <div class="section">
            <p><strong>📋 Sobre Punto Cero Legal</strong></p>
            <p>Somos una plataforma integral de gestión legal diseñada para potenciar la productividad de abogados y firmas jurídicas. Nuestro ecosistema combina tecnología avanzada con procesos optimizados para que puedas enfocarte en lo que realmente importa: tus clientes.</p>
        </div>

        <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
            <strong>¿Preguntas?</strong> Nuestro equipo está disponible en <strong>soporte@puntocerolegal.com</strong> para ayudarte en lo que necesites.
        </p>

        <p style="margin-top: 20px; color: #6b7280; font-size: 14px;">
            Un especialista de nuestro equipo se pondrá en contacto contigo pronto por WhatsApp para acompañarte en el proceso.
        </p>"""

    body_html = _get_base_template(content, "Solicitud de Incorporación Recibida - Punto Cero Legal")
    
    return send_email(
        to_email=to_email,
        subject=f"Solicitud de Incorporación Recibida - Punto Cero Legal",
        body_html=body_html
    )


def send_email_request_received(
    to_email: str,
    full_name: str,
    firm_name: str,
    contact_email: str,
    contact_phone: str,
    contact_country: str,
    firm_size: str
) -> dict:
    """Envía correo de confirmación de solicitud recibida.
    
    Args:
        to_email: Email del destinatario
        full_name: Nombre del contacto
        firm_name: Nombre de la firma
        contact_email: Email de contacto
        contact_phone: Teléfono de contacto
        contact_country: País
        firm_size: Tamaño de la firma
    
    Returns:
        Dict con resultado del envío
    """
    content = f"""{_get_header("Solicitud Recibida")}

        <p>Hola <strong>{full_name}</strong>,</p>

        <p>Hemos recibido tu solicitud de registro para la firma <strong>{firm_name}</strong>.</p>

        <div class="section">
            <p><strong>✅ Próximos pasos:</strong></p>
            <p>1. Nuestro equipo revisará tu información en un plazo de 24-48 horas.</p>
            <p>2. Recibirás un correo con el resultado de la revisión.</p>
            <p>3. Si es aprobada, recibirás tus credenciales de acceso.</p>
        </div>

        <div class="credentials">
            <p><strong>Datos registrados:</strong></p>
            <p>• Firma: {firm_name}</p>
            <p>• Email: {contact_email}</p>
            <p>• Teléfono: {contact_phone}</p>
            <p>• País: {contact_country}</p>
            <p>• Tamaño: {firm_size}</p>
        </div>

        <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
            Un especialista de nuestro equipo se pondrá en contacto contigo pronto por WhatsApp para ayudarte en el proceso.
        </p>"""

    body_html = _get_base_template(content, "Solicitud Recibida - Punto Cero Legal")
    
    return send_email(
        to_email=to_email,
        subject=f"Solicitud Recibida - {firm_name}",
        body_html=body_html
    )


def send_email_request_approved(
    to_email: str,
    full_name: str,
    temp_password: str,
    expires_at: datetime,
    firm_name: str,
    plan_interest: str = None
) -> dict:
    """Envía correo de aprobación de solicitud con credenciales.
    
    Args:
        to_email: Email del destinatario
        full_name: Nombre del destinatario
        temp_password: Contraseña temporal
        expires_at: Fecha de expiración
        firm_name: Nombre de la firma
        plan_interest: Plan de interés (opcional)
    
    Returns:
        Dict con resultado del envío
    """
    hours_remaining = int((expires_at - datetime.utcnow()).total_seconds() / 3600)
    
    # Construir mensaje de plan de interés
    plan_message = ""
    if plan_interest:
        plan_display = {
            "firm_growth": "Firm Growth",
            "firm_enterprise": "Firm Enterprise",
            "lawyer_growth": "Lawyer Growth",
            "lawyer_enterprise": "Lawyer Enterprise"
        }.get(plan_interest, plan_interest)
        
        plan_message = f"""
        <div class="section">
            <p><strong>📋 Plan de Interés</strong></p>
            <p>Durante tu registro manifestaste interés en el Plan <strong>{plan_display}</strong>.</p>
            <p>Puedes confirmarlo o elegir otro durante el proceso de activación.</p>
        </div>
        """
    
    content = f"""{_get_header("¡Solicitud Aprobada!")}

        <p>Hola <strong>{full_name}</strong>,</p>

        <p>¡Buenas noticias! Tu solicitud de registro para <strong>{firm_name}</strong> ha sido aprobada.</p>
        <p>A continuación encontrarás tus credenciales de acceso:</p>

        <div class="credentials">
            <p><strong>Correo:</strong> {to_email}</p>
            <p><strong>Contraseña temporal:</strong> {temp_password}</p>
            <p><strong>Vigencia:</strong> {hours_remaining} horas ({expires_at.strftime('%Y-%m-%d %H:%M')})</p>
        </div>

        {plan_message}

        <div class="warning">
            <p><strong>⚠️ Importante:</strong></p>
            <p>1. Esta contraseña es temporal y expirará en {hours_remaining} horas.</p>
            <p>2. Debes cambiarla en tu primer inicio de sesión.</p>
            <p>3. Si no activas tu cuenta en 72 horas, deberás solicitar un reenvío.</p>
        </div>

        <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
            Para acceder, visita el enlace de inicio de sesión e ingresa con tu correo y la contraseña temporal.
        </p>"""

    body_html = _get_base_template(content, "Solicitud Aprobada - Punto Cero Legal")
    
    return send_email(
        to_email=to_email,
        subject=f"¡Solicitud Aprobada! - {firm_name}",
        body_html=body_html
    )


def send_email_request_rejected(
    to_email: str,
    full_name: str,
    firm_name: str,
    rejection_reason: str
) -> dict:
    """Envía correo de notificación de rechazo de solicitud.
    
    Args:
        to_email: Email del destinatario
        full_name: Nombre del destinatario
        firm_name: Nombre de la firma
        rejection_reason: Motivo del rechazo
    
    Returns:
        Dict con resultado del envío
    """
    content = f"""{_get_header("Revisión de Solicitud Completada")}

        <p>Hola <strong>{full_name}</strong>,</p>

        <p>Hemos revisado tu solicitud de registro para la firma <strong>{firm_name}</strong>.</p>

        <div class="error">
            <p><strong>⚠️ Estatus: No Aprobado</strong></p>
            <div class="reason">
                <strong>Motivo:</strong><br>
                {rejection_reason}
            </div>
        </div>

        <p style="margin-top: 30px; color: #6b7280;">
            Si tienes dudas o deseas apelar esta decisión, por favor contacta a nuestro equipo de soporte en <strong>soporte@puntocerolegal.com</strong>
        </p>"""

    body_html = _get_base_template(content, "Resultado de Revisión - Punto Cero Legal")
    
    return send_email(
        to_email=to_email,
        subject=f"Resultado de Revisión - {firm_name}",
        body_html=body_html
    )


def send_email_account_created(
    to_email: str,
    full_name: str,
    temp_password: str,
    expires_at: datetime,
    firm_name: str = None
) -> dict:
    """Envía correo de cuenta creada con credenciales temporales.
    
    Args:
        to_email: Email del destinatario
        full_name: Nombre del destinatario
        temp_password: Contraseña temporal
        expires_at: Fecha de expiración
        firm_name: Nombre de la firma (opcional)
    
    Returns:
        Dict con resultado del envío
    """
    hours_remaining = int((expires_at - datetime.utcnow()).total_seconds() / 3600)
    
    firm_message = ""
    if firm_name:
        firm_message = f"""
        <div class="section">
            <p><strong>📋 Firma:</strong> {firm_name}</p>
        </div>
        """
    
    content = f"""{_get_header("¡Bienvenido a Punto Cero Legal!")}

        <p>Hola <strong>{full_name}</strong>,</p>

        <p>Tu cuenta ha sido creada exitosamente. A continuación encontrarás tus credenciales de acceso:</p>

        {firm_message}

        <div class="credentials">
            <p><strong>Correo:</strong> {to_email}</p>
            <p><strong>Contraseña temporal:</strong> {temp_password}</p>
            <p><strong>Vigencia:</strong> {hours_remaining} horas ({expires_at.strftime('%Y-%m-%d %H:%M')})</p>
        </div>

        <div class="warning">
            <p><strong>⚠️ Importante:</strong></p>
            <p>1. Esta contraseña es temporal y expirará en {hours_remaining} horas.</p>
            <p>2. Debes cambiarla en tu primer inicio de sesión.</p>
            <p>3. Si no activas tu cuenta en 72 horas, deberás solicitar un reenvío.</p>
        </div>

        <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
            Para acceder, visita el enlace de inicio de sesión e ingresa con tu correo y la contraseña temporal.
        </p>"""

    body_html = _get_base_template(content, "Bienvenido a Punto Cero Legal - Tus credenciales")
    
    return send_email(
        to_email=to_email,
        subject=f"Bienvenido a Punto Cero Legal - Tus credenciales de acceso",
        body_html=body_html
    )


def send_email_credentials_expired(
    to_email: str,
    full_name: str
) -> dict:
    """Envía correo notificando expiración de contraseña temporal.
    
    Args:
        to_email: Email del destinatario
        full_name: Nombre del destinatario
    
    Returns:
        Dict con resultado del envío
    """
    content = f"""{_get_header("Tu contraseña temporal ha expirado")}

        <p>Hola <strong>{full_name}</strong>,</p>

        <p>Tu contraseña temporal ha expirado después de 72 horas.</p>

        <div class="warning">
            <p><strong>¿Qué debes hacer?</strong></p>
            <p>Contacta a nuestro equipo de soporte para solicitar un reenvío de tu correo de activación.</p>
            <p>Email: <strong>soporte@puntocerolegal.com</strong></p>
        </div>"""

    body_html = _get_base_template(content, "Tu contraseña temporal ha expirado - Punto Cero Legal")
    
    return send_email(
        to_email=to_email,
        subject="Tu contraseña temporal ha expirado - Punto Cero Legal",
        body_html=body_html
    )


def send_email_credentials_resent(
    to_email: str,
    full_name: str,
    temp_password: str,
    expires_at: datetime
) -> dict:
    """Envía correo de reenvío de activación con nuevas credenciales.
    
    Args:
        to_email: Email del destinatario
        full_name: Nombre del destinatario
        temp_password: Nueva contraseña temporal
        expires_at: Nueva fecha de expiración
    
    Returns:
        Dict con resultado del envío
    """
    hours_remaining = int((expires_at - datetime.utcnow()).total_seconds() / 3600)
    
    content = f"""{_get_header("Nuevas credenciales de acceso")}

        <p>Hola <strong>{full_name}</strong>,</p>

        <p>Se han generado nuevas credenciales de acceso para tu cuenta:</p>

        <div class="credentials">
            <p><strong>Correo:</strong> {to_email}</p>
            <p><strong>Nueva contraseña temporal:</strong> {temp_password}</p>
            <p><strong>Vigencia:</strong> {hours_remaining} horas ({expires_at.strftime('%Y-%m-%d %H:%M')})</p>
        </div>

        <div class="warning">
            <p><strong>⚠️ Importante:</strong></p>
            <p>1. Esta contraseña es temporal y expirará en {hours_remaining} horas.</p>
            <p>2. Debes cambiarla en tu primer inicio de sesión.</p>
        </div>"""

    body_html = _get_base_template(content, "Reenvío de activación - Nuevas credenciales")
    
    return send_email(
        to_email=to_email,
        subject="Reenvío de activación - Nuevas credenciales Punto Cero Legal",
        body_html=body_html
    )


# ═══════════════════════════════════════════════════════════════════════════════════
# FUNCIONES DE ALERTA Y NOTIFICACIÓN
# ═══════════════════════════════════════════════════════════════════════════════════

async def _alert_admin_external(title: str, message: str) -> None:
    """Envía la alerta al administrador por WhatsApp + correo SIN bloquear el
    flujo (fire-and-forget en hilos). Tolerante a fallos: nunca rompe el evento."""
    try:
        await asyncio.to_thread(send_whatsapp, ADMIN_WHATSAPP, f"*{title}*\n{message}")
    except Exception:  # noqa: BLE001
        logger.exception("alerta admin WhatsApp")
    try:
        await asyncio.to_thread(send_email, ADMIN_EMAIL, title, f"<p>{message}</p>")
    except Exception:  # noqa: BLE001
        logger.exception("alerta admin email")


async def create_app_notification(db, *, target: str, type: str, title: str,
                                  message: str, external_admin: bool = True, **extra) -> str:
    """Crea una notificación in-app. `target` = user_id (str) o 'admin'.

    Si target == 'admin' y external_admin, además dispara la alerta inmediata al
    administrador por WhatsApp + correo (reutiliza send_whatsapp/send_email)."""
    doc = {
        "target": target,
        "user_id": target,
        "type": type,
        "title": title,
        "message": message,
        "read": False,
        "created_at": datetime.utcnow(),
        **extra,
    }
    res = await db.notifications.insert_one(doc)
    if target == "admin" and external_admin:
        try:
            asyncio.create_task(_alert_admin_external(title, message))
        except RuntimeError:
            # Sin loop activo (contexto sincrónico): se omite el envío externo.
            pass
    return str(res.inserted_id)


def _send_email_resend(to_email: str, subject: str, body_html: str, email_trace_id: str, api_key: str) -> dict:
    """Envío vía API HTTP de Resend (https://api.resend.com/emails). Sale por 443."""
    import httpx
    # Limpiar y normalizar el remitente
    raw_sender = os.environ.get("RESEND_FROM") or os.environ.get("SMTP_FROM") or "onboarding@resend.dev"
    # Si el valor incluye el nombre de la variable (RESEND_FROM=...), extraer solo el valor
    if '=' in raw_sender:
        raw_sender = raw_sender.split('=', 1)[1].strip()
    # Eliminar saltos de línea y contenido adicional
    sender = raw_sender.split('\n')[0].strip()
    # Si tiene formato "Name <email@example.com>", extraer solo el email para Resend
    if '<' in sender and '>' in sender:
        import re
        match = re.search(r'<([^>]+)>', sender)
        if match:
            sender = match.group(1)
    logger.info("[EMAIL_TRACE:%s] RESEND | Enviando vía API HTTP | from=%s | to=%s | subject=%s",
                email_trace_id, sender, to_email, subject)
    try:
        r = httpx.post(
            "https://api.resend.com/emails",
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json={"from": sender, "to": [to_email], "subject": subject, "html": body_html},
            timeout=20,
        )
        if r.status_code in (200, 201):
            provider_id = (r.json() or {}).get("id")
            logger.info("[EMAIL_TRACE:%s] RESEND | OK | status=%s | id=%s", email_trace_id, r.status_code, provider_id)
            return {"channel": "email", "sent": True, "provider": "resend",
                    "provider_id": provider_id, "email_trace_id": email_trace_id}
        logger.error("[EMAIL_TRACE:%s] RESEND | Error | status=%s | body=%s",
                     email_trace_id, r.status_code, r.text[:300])
        return {"channel": "email", "sent": False, "provider": "resend",
                "reason": f"resend_http_{r.status_code}: {r.text[:200]}",
                "smtp_code": r.status_code, "failure_phase": "resend_api",
                "email_trace_id": email_trace_id}
    except Exception as e:  # noqa: BLE001
        logger.error("[EMAIL_TRACE:%s] RESEND | Excepción: %s", email_trace_id, repr(e))
        return {"channel": "email", "sent": False, "provider": "resend",
                "reason": repr(e), "failure_phase": "resend_exception", "email_trace_id": email_trace_id}


def send_email(to_email: str, subject: str, body_html: str) -> dict:
    """Envía un email. Preferencia: API HTTP (Resend) si RESEND_API_KEY está definida
    (Render bloquea SMTP saliente); en caso contrario, fallback a SMTP directo.
    La firma y el dict de retorno no cambian: el flujo de activación no se altera."""
    # Generar identificador único de trazabilidad
    email_trace_id = secrets.token_hex(6)

    # Vía preferida: Resend por HTTPS (443), único egress permitido en Render.
    resend_key = os.environ.get("RESEND_API_KEY")
    if resend_key:
        return _send_email_resend(to_email, subject, body_html, email_trace_id, resend_key)

    host = os.environ.get("SMTP_HOST")
    user = os.environ.get("SMTP_USER")
    password = os.environ.get("SMTP_PASS")
    sender = os.environ.get("SMTP_FROM", user or "no-reply@puntocerolegal.com")
    port = int(os.environ.get("SMTP_PORT", "587"))

    # FASE 1: Logging de configuración
    user_masked = f"{user[:5]}...{user[-10:]}" if user and len(user) > 15 else "***"
    logger.info("[EMAIL_TRACE:%s] QA_PHASE1 | SMTP_HOST=%s | SMTP_PORT=%s | SMTP_USER=%s | SMTP_FROM=%s | to_email=%s | subject=%s",
                email_trace_id, host, port, user_masked, sender, to_email, subject)

    if not (host and user and password and to_email):
        logger.info("[EMAIL_TRACE:%s] Email pendiente - SMTP no configurado para: %s", email_trace_id, to_email)
        return {"channel": "email", "sent": False, "reason": "smtp_not_configured"}
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = sender
        msg["To"] = to_email
        msg.attach(MIMEText(body_html, "html"))
        context = ssl.create_default_context()

        # FASE 2: Logging antes de conexión
        logger.info("[EMAIL_TRACE:%s] QA_PHASE2 | Intentando conectar a SMTP %s:%s", email_trace_id, host, port)

        with smtplib.SMTP(host, port, timeout=15) as server:
            logger.info("[EMAIL_TRACE:%s] QA_PHASE2 | Conectado al servidor SMTP exitosamente", email_trace_id)
            server.starttls(context=context)
            logger.info("[EMAIL_TRACE:%s] QA_PHASE2 | TLS inicializado", email_trace_id)

            logger.info("[EMAIL_TRACE:%s] QA_PHASE2 | Intentando login con usuario: %s", email_trace_id, user_masked)
            # LOG TEMPORAL (diagnóstico SMTP) — eliminar tras validar
            _local, _, _domain = (user or "").partition("@")
            _user_dbg = (_local[:2] + "****@" + _domain) if _domain else "***"
            logger.info(
                "[EMAIL_TRACE:%s] QA_TEMP_DEBUG | SMTP_USER=%s | len(SMTP_PASS)=%s | SMTP_FROM=%s | desde_os_environ: SMTP_USER=%s SMTP_PASS=%s SMTP_FROM=%s",
                email_trace_id, _user_dbg, (len(password) if password else 0), sender,
                ("SMTP_USER" in os.environ), ("SMTP_PASS" in os.environ), ("SMTP_FROM" in os.environ),
            )
            server.login(user, password)
            logger.info("[EMAIL_TRACE:%s] QA_PHASE2 | Autenticación SMTP exitosa", email_trace_id)

            # FASE 3: Logging antes de envío
            logger.info("[EMAIL_TRACE:%s] QA_PHASE3 | Iniciando sendmail() desde %s a %s", email_trace_id, sender, to_email)
            refused_recipients = server.sendmail(sender, [to_email], msg.as_string())
            if refused_recipients:
                raise smtplib.SMTPRecipientsRefused(refused_recipients)
            logger.info("[EMAIL_TRACE:%s] QA_PHASE3 | Correo enviado correctamente a %s", email_trace_id, to_email)

        # Resumen de éxito
        logger.info("[EMAIL_TRACE:%s] QA_SUCCESS | Estado: SUCCESS | Servidor SMTP: OK | Autenticación: OK | Sendmail: OK | Destinatario: %s",
                    email_trace_id, to_email)
        return {"channel": "email", "sent": True, "email_trace_id": email_trace_id}
    except Exception as e:  # noqa: BLE001
        # Extraer información detallada de la excepción
        error_type = type(e).__name__
        error_message = str(e)
        error_repr = repr(e)

        # Intentar extraer códigos SMTP si existen
        smtp_code = getattr(e, 'smtp_code', None)
        smtp_error = getattr(e, 'smtp_error', None)

        # Determinar en qué fase falló
        if "connection" in error_message.lower() or "refused" in error_message.lower():
            failure_phase = "Conexión"
        elif "starttls" in error_message.lower() or "ssl" in error_message.lower() or "tls" in error_message.lower():
            failure_phase = "TLS"
        elif "login" in error_message.lower() or "authentication" in error_message.lower() or "535" in str(smtp_code):
            failure_phase = "Login"
        elif "sendmail" in error_message.lower() or "recipient" in error_message.lower() or "553" in str(smtp_code) or "550" in str(smtp_code):
            failure_phase = "Sendmail"
        else:
            failure_phase = "Desconocida"

        # Logging detallado de fallo
        logger.error("[EMAIL_TRACE:%s] QA_FAILURE | Tipo de excepción: %s", email_trace_id, error_type)
        logger.error("[EMAIL_TRACE:%s] QA_FAILURE | Fase donde falló: %s", email_trace_id, failure_phase)
        logger.error("[EMAIL_TRACE:%s] QA_FAILURE | Mensaje completo: %s", email_trace_id, error_message)
        logger.error("[EMAIL_TRACE:%s] QA_FAILURE | Repr: %s", email_trace_id, error_repr)

        if smtp_code is not None:
            logger.error("[EMAIL_TRACE:%s] QA_FAILURE | SMTP Code: %s", email_trace_id, smtp_code)
        if smtp_error is not None:
            logger.error("[EMAIL_TRACE:%s] QA_FAILURE | SMTP Error: %s", email_trace_id, smtp_error)

        # Resumen de fallo
        logger.error("[EMAIL_TRACE:%s] FAILURE_SUMMARY | Estado: FAILURE | Fase: %s | Tipo: %s | Destinatario: %s",
                     email_trace_id, failure_phase, error_type, to_email)

        return {"channel": "email", "sent": False, "reason": error_message,
                "failure_phase": failure_phase, "smtp_code": smtp_code, "email_trace_id": email_trace_id}


def send_whatsapp(to_phone: str, body: str) -> dict:
    """Envía un WhatsApp. Preferencia: Meta WhatsApp Cloud API → Twilio → cola/log.
    Degradación elegante si faltan credenciales."""
    if not to_phone:
        return {"channel": "whatsapp", "sent": False, "reason": "no_phone"}
    import httpx
    to_digits = "".join(ch for ch in to_phone if ch.isdigit())

    # 1) Meta WhatsApp Cloud API (Graph)
    meta_token = os.environ.get("META_ACCESS_TOKEN")
    meta_phone_id = os.environ.get("META_PHONE_NUMBER_ID")
    if meta_token and meta_phone_id:
        try:
            version = os.environ.get("META_GRAPH_VERSION", "v21.0")
            r = httpx.post(
                f"https://graph.facebook.com/{version}/{meta_phone_id}/messages",
                headers={"Authorization": f"Bearer {meta_token}", "Content-Type": "application/json"},
                json={"messaging_product": "whatsapp", "to": to_digits,
                      "type": "text", "text": {"preview_url": False, "body": body}},
                timeout=15,
            )
            ok = r.status_code in (200, 201)
            if not ok:
                logger.warning("Meta WhatsApp error %s: %s", r.status_code, r.text[:200])
            return {"channel": "whatsapp", "provider": "meta", "sent": ok, "status": r.status_code}
        except Exception as e:  # noqa: BLE001
            logger.warning("Fallo enviando WhatsApp (Meta) a %s: %s", to_phone, e)
            return {"channel": "whatsapp", "provider": "meta", "sent": False, "reason": str(e)[:120]}

    # 2) Twilio
    sid = os.environ.get("TWILIO_ACCOUNT_SID")
    token = os.environ.get("TWILIO_AUTH_TOKEN")
    from_wa = os.environ.get("TWILIO_WHATSAPP_FROM")  # ej: 'whatsapp:+14155238886'
    if sid and token and from_wa:
        try:
            to_wa = f"whatsapp:+{to_digits}"
            r = httpx.post(
                f"https://api.twilio.com/2010-04-01/Accounts/{sid}/Messages.json",
                data={"From": from_wa, "To": to_wa, "Body": body},
                auth=(sid, token), timeout=15,
            )
            ok = r.status_code in (200, 201)
            return {"channel": "whatsapp", "provider": "twilio", "sent": ok, "status": r.status_code}
        except Exception as e:  # noqa: BLE001
            logger.warning("Fallo enviando WhatsApp (Twilio) a %s: %s", to_phone, e)
            return {"channel": "whatsapp", "provider": "twilio", "sent": False, "reason": str(e)[:120]}

    logger.info("[whatsapp pendiente] para=%s (Meta/Twilio no configurado)", to_phone)
    return {"channel": "whatsapp", "sent": False, "reason": "whatsapp_not_configured"}


def wa_link(phone: str | None, text: str = "") -> str | None:
    """Construye un enlace wa.me (fallback manual si no hay API)."""
    if not phone:
        return None
    digits = "".join(ch for ch in phone if ch.isdigit())
    if not digits:
        return None
    from urllib.parse import quote
    return f"https://wa.me/{digits}?text={quote(text)}" if text else f"https://wa.me/{digits}"


async def notify_all(db, *, user: dict, type: str, title: str, message: str,
                     email_html: str | None = None, whatsapp_text: str | None = None,
                     **extra) -> dict:
    """Dispara los tres canales para un usuario (dict con _id/email/phone)."""
    uid = str(user.get("_id"))
    notif_id = await create_app_notification(db, target=uid, type=type, title=title, message=message, **extra)
    email_res = send_email(user.get("email"), title, email_html or f"<p>{message}</p>") if user.get("email") else {"channel": "email", "sent": False, "reason": "no_email"}
    wa_res = send_whatsapp(user.get("phone"), whatsapp_text or f"*{title}*\n{message}") if user.get("phone") else {"channel": "whatsapp", "sent": False, "reason": "no_phone"}
    return {"notification_id": notif_id, "channels": [email_res, wa_res]}