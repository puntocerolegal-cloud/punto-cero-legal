"""
utils.email_service — capa de compatibilidad.

Varios routers (firm_os.py: invitaciones/activación) importan
`from utils.email_service import send_email`, pero la implementación real de
envío de correo vive en `utils.notifier.send_email(to_email, subject, body_html)`.
Este módulo reexporta esa función para que las invitaciones funcionen sin
duplicar lógica. Fuente única de verdad: utils/notifier.py.
"""
from utils.notifier import send_email

__all__ = ["send_email"]
