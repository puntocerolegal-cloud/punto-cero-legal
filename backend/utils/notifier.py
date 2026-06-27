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


def send_email(to_email: str, subject: str, body_html: str) -> dict:
    """Envía un email vía SMTP. Si no hay credenciales, registra y retorna pendiente."""
    # Generar identificador único de trazabilidad
    email_trace_id = secrets.token_hex(6)

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
            server.login(user, password)
            logger.info("[EMAIL_TRACE:%s] QA_PHASE2 | Autenticación SMTP exitosa", email_trace_id)

            # FASE 3: Logging antes de envío
            logger.info("[EMAIL_TRACE:%s] QA_PHASE3 | Iniciando sendmail() desde %s a %s", email_trace_id, sender, to_email)
            server.sendmail(sender, [to_email], msg.as_string())
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
        elif "sendmail" in error_message.lower() or "553" in str(smtp_code) or "550" in str(smtp_code):
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

        return {"channel": "email", "sent": False, "reason": error_message, "email_trace_id": email_trace_id}


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
