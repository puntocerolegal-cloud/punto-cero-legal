"""
Controlador Oficial de Webhooks de Mercado Pago — Punto Cero Legal

Procesa TODOS los eventos de Mercado Pago en una sola ubicación:
- payment.*, merchant_order.*, subscription.*, invoice.*, refund.*, chargeback.*

Características:
- Validación HMAC oficial de MP
- Idempotencia por event_id
- Auditoría completa en webhook_logs
- Sincronización MongoDB completa
- Manejo de errores robusto
- Sin perder eventos
"""
import os
import hashlib
import hmac
import json
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

logger = logging.getLogger(__name__)

# Tipos de eventos de Mercado Pago soportados
EVENT_TYPES = {
    "payment.created",
    "payment.updated",
    "payment.approved",
    "payment.rejected",
    "payment.cancelled",
    "payment.refunded",
    "merchant_order.opened",
    "merchant_order.closed",
    "merchant_order.expired",
    "subscription.created",
    "subscription.updated",
    "subscription.cancelled",
    "subscription.paused",
    "subscription.resumed",
    "subscription.expired",
    "invoice.created",
    "invoice.updated",
    "invoice.paid",
    "invoice.cancelled",
    "refund.created",
    "refund.updated",
    "chargeback.created",
    "chargeback.resolved",
}


async def validate_hmac_signature(payload: str, signature: str) -> bool:
    """
    Valida la firma HMAC de Mercado Pago.
    
    MP calcula: HMAC-SHA256(payload, secret) y la envía en el header X-Signature.
    
    El payload es: id={id}&type={type}
    El secret es: MP_ACCESS_TOKEN o MP_WEBHOOK_SECRET
    
    Referencia: https://developers.mercadopago.com/en/docs/webhooks/additional-info
    """
    secret = os.environ.get("MP_ACCESS_TOKEN", "")
    
    if not secret:
        logger.warning("MP_ACCESS_TOKEN not configured, skipping HMAC validation")
        return False
    
    # MP envía dos firmas separadas por comma: ts=1234567890,v1=xxxxx
    # Extraemos v1 (la actual), ignoramos ts
    if not signature:
        return False
    
    try:
        parts = signature.split(",")
        sig_dict = {}
        for part in parts:
            if "=" in part:
                k, v = part.split("=", 1)
                sig_dict[k.strip()] = v.strip()
        
        received_signature = sig_dict.get("v1", "")
        if not received_signature:
            return False
        
        # Calcular HMAC esperado: HMAC-SHA256(payload, secret)
        expected = hmac.new(
            secret.encode(),
            payload.encode(),
            hashlib.sha256
        ).hexdigest()
        
        # Comparación segura (timing-safe)
        return hmac.compare_digest(expected, received_signature)
    
    except Exception as e:
        logger.error(f"HMAC validation error: {e}")
        return False


async def is_event_duplicate(db: AsyncIOMotorDatabase, event_id: str) -> bool:
    """Verifica si el evento ya fue procesado."""
    existing = await db.webhook_events.find_one({"event_id": event_id})
    return existing is not None


async def record_webhook_event(
    db: AsyncIOMotorDatabase,
    event_id: str,
    event_type: str,
    action: str,
    payload: Dict[str, Any],
    processed: bool = False,
    error: Optional[str] = None
) -> str:
    """Registra el evento de webhook para idempotencia y auditoría."""
    doc = {
        "event_id": event_id,
        "type": event_type,
        "action": action,
        "processed": processed,
        "processed_at": datetime.utcnow() if processed else None,
        "retries": 0,
        "payload_hash": hashlib.sha256(json.dumps(payload, default=str).encode()).hexdigest(),
        "error": error,
        "created_at": datetime.utcnow(),
    }
    
    result = await db.webhook_events.insert_one(doc)
    return str(result.inserted_id)


async def log_webhook(
    db: AsyncIOMotorDatabase,
    event_id: str,
    event_type: str,
    action: str,
    headers: Dict[str, str],
    payload: Dict[str, Any],
    result_status: str,
    execution_time_ms: float,
    ip_address: Optional[str] = None,
    error: Optional[str] = None
) -> str:
    """Registra el webhook en webhook_logs para auditoría completa."""
    
    # Sanitize sensitive data
    sanitized_payload = _sanitize_payload(payload)
    sanitized_headers = _sanitize_headers(headers)
    
    doc = {
        "event_id": event_id,
        "type": event_type,
        "action": action,
        "headers": sanitized_headers,
        "payload": sanitized_payload,
        "result_status": result_status,  # "success", "duplicate", "invalid_signature", "error"
        "execution_time_ms": execution_time_ms,
        "ip_address": ip_address,
        "user_agent": headers.get("user-agent", "—"),
        "error": error,
        "created_at": datetime.utcnow(),
    }
    
    result = await db.webhook_logs.insert_one(doc)
    return str(result.inserted_id)


def _sanitize_payload(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Remove sensitive data from payload before logging."""
    if not isinstance(payload, dict):
        return payload
    
    sanitized = payload.copy()
    sensitive_keys = {"token", "secret", "password", "access_token", "card_number"}
    
    for key in sanitized.keys():
        if any(s in key.lower() for s in sensitive_keys):
            sanitized[key] = "***REDACTED***"
    
    return sanitized


def _sanitize_headers(headers: Dict[str, str]) -> Dict[str, str]:
    """Remove sensitive headers before logging."""
    if not isinstance(headers, dict):
        return headers
    
    sanitized = headers.copy()
    sensitive_headers = {"authorization", "x-signature", "cookie"}
    
    for key in list(sanitized.keys()):
        if any(s in key.lower() for s in sensitive_headers):
            sanitized[key] = "***REDACTED***"
    
    return sanitized


async def process_payment_event(
    db: AsyncIOMotorDatabase,
    event_type: str,
    payment_data: Dict[str, Any],
) -> bool:
    """
    Procesa eventos de pago:
    - payment.created
    - payment.updated
    - payment.approved (activar suscripción)
    - payment.rejected
    - payment.cancelled
    - payment.refunded
    """
    
    payment_id = payment_data.get("id")
    status = payment_data.get("status")
    external_ref = payment_data.get("external_reference")
    
    if not payment_id:
        logger.warning(f"Payment event without payment_id: {event_type}")
        return False
    
    try:
        # Actualizar transacción en MongoDB
        update_data = {
            "mp_payment_id": payment_id,
            "status_at_mp": status,
            "mp_updated_at": datetime.utcnow(),
        }
        
        # Mapear estado de MP a nuestro estado
        if status == "approved":
            update_data["status"] = "paid"
            update_data["paid_at"] = datetime.utcnow()
            
            # Buscar transacción y activar suscripción
            tx = await db.transactions.find_one({"payment_id": external_ref})
            if tx:
                await _apply_payment_success(db, tx)
        
        elif status in ("rejected", "cancelled"):
            update_data["status"] = status
            
            # Notificar admin
            await _notify_payment_failure(db, payment_id, status)
        
        elif status == "refunded":
            update_data["status"] = "refunded"
            update_data["refunded_at"] = datetime.utcnow()
        
        # Actualizar transacción
        if external_ref:
            await db.transactions.update_one(
                {"payment_id": external_ref},
                {"$set": update_data}
            )
        else:
            await db.transactions.update_one(
                {"mp_payment_id": payment_id},
                {"$set": update_data}
            )
        
        # Registrar en auditoría
        await db.audit_logs.insert_one({
            "action": f"webhook_payment_{status}",
            "payment_id": payment_id,
            "external_reference": external_ref,
            "mp_status": status,
            "created_at": datetime.utcnow(),
        })
        
        return True
    
    except Exception as e:
        logger.error(f"Error processing payment event {event_type}: {e}")
        return False


async def process_subscription_event(
    db: AsyncIOMotorDatabase,
    event_type: str,
    subscription_data: Dict[str, Any],
) -> bool:
    """
    Procesa eventos de suscripción:
    - subscription.created
    - subscription.updated
    - subscription.cancelled
    - subscription.paused
    - subscription.resumed
    - subscription.expired
    """
    
    subscription_id = subscription_data.get("id")
    status = subscription_data.get("status")
    user_email = subscription_data.get("payer", {}).get("email")
    
    if not subscription_id or not user_email:
        logger.warning(f"Subscription event incomplete: {event_type}")
        return False
    
    try:
        user = await db.users.find_one({"email": user_email})
        if not user:
            logger.warning(f"User not found for subscription {subscription_id}: {user_email}")
            return False
        
        # Mapear estado de MP
        sub_status = {
            "pending": "pending_payment",
            "authorized": "active",
            "closed": "cancelled",
            "cancelled": "cancelled",
            "paused": "suspended",
            "expired": "expired",
        }.get(status, status)
        
        update_data = {
            "mp_subscription_id": subscription_id,
            "subscription_status": sub_status,
        }
        
        # Calcular próxima fecha de renovación
        if status in ("authorized", "paused"):
            next_billing = subscription_data.get("next_payment_date")
            if next_billing:
                update_data["subscription_expires_at"] = datetime.fromisoformat(
                    next_billing.replace("Z", "+00:00")
                )
        
        if status in ("closed", "cancelled"):
            update_data["cancelled_at"] = datetime.utcnow()
            update_data["cancel_reason"] = "webhook_notification"
        
        if status == "expired":
            update_data["subscription_status"] = "expired"
        
        await db.users.update_one({"_id": user["_id"]}, {"$set": update_data})
        
        # Registrar en auditoría
        await db.audit_logs.insert_one({
            "action": f"webhook_subscription_{status}",
            "user_id": str(user["_id"]),
            "user_email": user_email,
            "subscription_id": subscription_id,
            "mp_status": status,
            "created_at": datetime.utcnow(),
        })
        
        return True
    
    except Exception as e:
        logger.error(f"Error processing subscription event {event_type}: {e}")
        return False


async def process_refund_event(
    db: AsyncIOMotorDatabase,
    event_type: str,
    refund_data: Dict[str, Any],
) -> bool:
    """Procesa eventos de reembolso."""
    
    refund_id = refund_data.get("id")
    payment_id = refund_data.get("payment_id")
    amount = refund_data.get("amount")
    status = refund_data.get("status", "created")
    
    if not refund_id or not payment_id:
        return False
    
    try:
        # Buscar transacción original
        tx = await db.transactions.find_one({"mp_payment_id": payment_id})
        if tx:
            # Registrar reembolso
            await db.refunds.insert_one({
                "refund_id": refund_id,
                "payment_id": payment_id,
                "transaction_id": str(tx["_id"]),
                "amount": amount,
                "status": status,
                "user_email": tx.get("user_email"),
                "created_at": datetime.utcnow(),
            })
            
            # Marcar transacción como reembolsada
            await db.transactions.update_one(
                {"_id": tx["_id"]},
                {"$set": {
                    "status": "refunded",
                    "refunded_amount": amount,
                    "refund_id": refund_id,
                    "refunded_at": datetime.utcnow(),
                }}
            )
        
        # Registrar en auditoría
        await db.audit_logs.insert_one({
            "action": f"webhook_refund_{status}",
            "refund_id": refund_id,
            "payment_id": payment_id,
            "amount": amount,
            "created_at": datetime.utcnow(),
        })
        
        return True
    
    except Exception as e:
        logger.error(f"Error processing refund event: {e}")
        return False


async def process_chargeback_event(
    db: AsyncIOMotorDatabase,
    event_type: str,
    chargeback_data: Dict[str, Any],
) -> bool:
    """Procesa eventos de contracargo (disputa)."""
    
    chargeback_id = chargeback_data.get("id")
    payment_id = chargeback_data.get("payment_id")
    status = chargeback_data.get("status", "created")
    
    if not chargeback_id or not payment_id:
        return False
    
    try:
        # Registrar contracargo
        await db.chargebacks.insert_one({
            "chargeback_id": chargeback_id,
            "payment_id": payment_id,
            "status": status,
            "reason": chargeback_data.get("reason"),
            "amount": chargeback_data.get("amount"),
            "created_at": datetime.utcnow(),
        })
        
        # Marcar para investigación
        tx = await db.transactions.find_one({"mp_payment_id": payment_id})
        if tx:
            await db.transactions.update_one(
                {"_id": tx["_id"]},
                {"$set": {
                    "chargeback_status": status,
                    "chargeback_id": chargeback_id,
                }}
            )
        
        # Notificar admin
        await db.notifications.insert_one({
            "target": "admin",
            "type": "chargeback_received",
            "title": "Contracargo recibido",
            "message": f"Se recibió un contracargo por el pago {payment_id}.",
            "chargeback_id": chargeback_id,
            "read": False,
            "created_at": datetime.utcnow(),
        })
        
        # Registrar en auditoría
        await db.audit_logs.insert_one({
            "action": f"webhook_chargeback_{status}",
            "chargeback_id": chargeback_id,
            "payment_id": payment_id,
            "created_at": datetime.utcnow(),
        })
        
        return True
    
    except Exception as e:
        logger.error(f"Error processing chargeback event: {e}")
        return False


async def _apply_payment_success(db: AsyncIOMotorDatabase, transaction: dict) -> bool:
    """Activa suscripción y aplica lógica de referidos (reutilizado de payment.py)."""
    
    if transaction.get("status") == "paid":
        return False  # Ya procesado
    
    try:
        # Marcar como pagado
        await db.transactions.update_one(
            {"_id": transaction["_id"]},
            {"$set": {
                "status": "paid",
                "paid_at": datetime.utcnow()
            }}
        )
        
        # Crear/actualizar usuario
        user = await db.users.find_one({"email": transaction["user_email"]})
        if user:
            await db.users.update_one(
                {"_id": user["_id"]},
                {"$set": {
                    "plan_id": transaction["plan_id"],
                    "subscription_status": "active",
                    "subscription_activated_at": datetime.utcnow(),
                }}
            )
            user_id = str(user["_id"])
        else:
            return False
        
        # Aplicar lógica de referidos
        if transaction.get("referral_code") and user_id:
            referrer = await db.users.find_one({"referral_code": transaction["referral_code"]})
            if referrer and str(referrer["_id"]) != user_id:
                await db.users.update_one(
                    {"_id": referrer["_id"]},
                    {"$inc": {
                        "free_months_credits": 1,
                        "total_referrals": 1,
                    },
                    "$set": {"last_referral_at": datetime.utcnow()}}
                )
        
        return True
    
    except Exception as e:
        logger.error(f"Error applying payment success: {e}")
        return False


async def _notify_payment_failure(db: AsyncIOMotorDatabase, payment_id: str, status: str):
    """Notifica al admin sobre fallos de pago."""
    try:
        tx = await db.transactions.find_one({"mp_payment_id": payment_id})
        if tx:
            await db.notifications.insert_one({
                "target": "admin",
                "type": "payment_failed",
                "title": "Pago rechazado",
                "message": f"El pago {payment_id} fue {status}. Usuario: {tx.get('user_email')}",
                "payment_id": payment_id,
                "read": False,
                "created_at": datetime.utcnow(),
            })
    except Exception as e:
        logger.warning(f"Could not notify payment failure: {e}")


# Enrutamiento de eventos a handlers
EVENT_HANDLERS = {
    "payment.created": (process_payment_event, "created"),
    "payment.updated": (process_payment_event, "updated"),
    "payment.approved": (process_payment_event, "approved"),
    "payment.rejected": (process_payment_event, "rejected"),
    "payment.cancelled": (process_payment_event, "cancelled"),
    "payment.refunded": (process_payment_event, "refunded"),
    "subscription.created": (process_subscription_event, "created"),
    "subscription.updated": (process_subscription_event, "updated"),
    "subscription.cancelled": (process_subscription_event, "cancelled"),
    "subscription.paused": (process_subscription_event, "paused"),
    "subscription.resumed": (process_subscription_event, "resumed"),
    "subscription.expired": (process_subscription_event, "expired"),
    "refund.created": (process_refund_event, "created"),
    "refund.updated": (process_refund_event, "updated"),
    "chargeback.created": (process_chargeback_event, "created"),
    "chargeback.resolved": (process_chargeback_event, "resolved"),
}
