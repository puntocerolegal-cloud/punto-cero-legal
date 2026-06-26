"""
Servicio de Renovación Automática de Suscripciones — Punto Cero Legal

Ejecuta diariamente para detectar suscripciones que deben renovarse:
1. Suscripciones vencidas (expiration_date <= hoy)
2. Suscripciones próximas a vencer (próximas 7 días)

Automáticamente genera payment intents en Mercado Pago y notifica usuarios.
Reintenta automáticamente en caso de fallos.
"""
from datetime import datetime, timedelta
from bson import ObjectId
import uuid
import logging
import httpx
import os

logger = logging.getLogger(__name__)

MERCADO_PAGO_COUNTRIES = {
    "Colombia": "CO", "México": "MX", "Argentina": "AR", "Brasil": "BR",
    "Chile": "CL", "Perú": "PE", "Uruguay": "UY"
}

PLAN_PRICES_COP = {
    "esencial": {"monthly": 112500, "annual": 112500 * 11},
    "profesional": {"monthly": 210000, "annual": 210000 * 11},
    "elite": {"monthly": 562500, "annual": 562500 * 11},
    "ilimitado": {"monthly": 2100000, "annual": 2100000 * 11},
}

EXCHANGE_RATES = {
    "COP": 1, "USD": 0.00026, "MXN": 0.0044, "ARS": 0.26, "BRL": 0.0013,
    "CLP": 0.24, "PEN": 0.00096, "EUR": 0.00024
}

COUNTRY_CURRENCY = {
    "Colombia": "COP", "México": "MXN", "Argentina": "ARS", "Brasil": "BRL",
    "Chile": "CLP", "Perú": "PEN", "Uruguay": "USD",
    "Estados Unidos": "USD", "España": "EUR", "Venezuela": "USD",
    "Ecuador": "USD", "Bolivia": "USD", "Paraguay": "USD",
    "Costa Rica": "USD", "Panamá": "USD", "República Dominicana": "USD",
    "Guatemala": "USD", "El Salvador": "USD"
}

PLAN_CATALOG = {
    "esencial": {"id": "esencial", "name": "El Despegue"},
    "profesional": {"id": "profesional", "name": "El Salto Estratégico"},
    "elite": {"id": "elite", "name": "Firma en Crecimiento"},
    "ilimitado": {"id": "ilimitado", "name": "Consolidación Empresarial"},
}


async def _create_mp_preference(tx: dict, plan_name: str) -> dict:
    """Crea una preferencia REAL en Mercado Pago."""
    token = os.environ.get("MP_ACCESS_TOKEN", "")
    base = (os.environ.get("APP_PUBLIC_URL", "") or "").rstrip("/")
    if not token:
        return None
    
    pref = {
        "items": [{
            "title": f"Punto Cero Legal · {plan_name}",
            "quantity": 1,
            "currency_id": tx["currency"],
            "unit_price": float(tx["amount_local"]),
        }],
        "external_reference": tx["payment_id"],
        "payer": {"email": tx["user_email"], "name": tx["user_name"]},
        "metadata": {
            "payment_id": tx["payment_id"],
            "plan_id": tx["plan_id"],
            "billing_cycle": tx["billing_cycle"],
            "type": "auto_renewal",
        },
    }
    
    _public = (
        base.startswith("https://") and "localhost" not in base and "127.0.0.1" not in base
    )
    if _public:
        pref["back_urls"] = {
            "success": f"{base}/dashboard?payment=success",
            "failure": f"{base}/checkout?payment=failure",
            "pending": f"{base}/dashboard?payment=pending",
        }
        pref["auto_return"] = "approved"
        pref["notification_url"] = f"{base}/api/payment/webhook"
    
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            r = await client.post(
                "https://api.mercadopago.com/checkout/preferences",
                headers={"Authorization": f"Bearer {token}"},
                json=pref,
            )
        if r.status_code not in (200, 201):
            logger.error("MP preference error %s: %s", r.status_code, r.text[:300])
            return None
        data = r.json()
        sandbox = token.startswith("TEST-")
        url = (data.get("sandbox_init_point") if sandbox else data.get("init_point")) or data.get("init_point")
        return {"url": url, "preference_id": data.get("id")}
    except Exception as e:
        logger.error("Error creating MP preference: %s", e)
        return None


async def check_and_renew_subscriptions(db):
    """Ejecuta chequeo y renovación automática de suscripciones.
    
    Flujo:
    1. Busca usuarios con plan activo y fecha de vencimiento próxima
    2. Para cada uno, crea payment intent en MP
    3. Envía notificación al usuario
    4. Guarda intent en BD (reintentará si falla)
    
    Retorna stats: {checked, needs_renewal, auto_renewed, failed}
    """
    now = datetime.utcnow()
    stats = {"checked": 0, "needs_renewal": 0, "auto_renewed": 0, "failed": 0}
    
    try:
        # Buscar usuarios cuya suscripción vence pronto (próximos 7 días)
        # O ya venció (status = "expired")
        vencimiento_limite = now + timedelta(days=7)
        
        users_to_renew = await db.users.find({
            "plan_id": {"$exists": True, "$ne": None},
            "subscription_status": {"$in": ["active", "expired"]},
            "$or": [
                {"subscription_expires_at": {"$lte": vencimiento_limite}},
                {"subscription_status": "expired"},
            ]
        }).to_list(None)
        
        stats["checked"] = len(users_to_renew)
        
        for user in users_to_renew:
            try:
                await _process_auto_renewal(db, user, stats)
            except Exception as e:
                logger.error(f"Error renewing subscription for {user.get('email')}: {e}")
                stats["failed"] += 1
        
        # Log de ejecución
        logger.info(f"Renewal check completed: {stats}")
        await db.system_logs.insert_one({
            "action": "subscription_renewal_check",
            "timestamp": now,
            "stats": stats,
        })
        
        return stats
    
    except Exception as e:
        logger.exception("Subscription renewal check failed")
        return stats


async def _process_auto_renewal(db, user: dict, stats: dict):
    """Procesa renovación automática para un usuario."""
    user_id = str(user["_id"])
    email = user.get("email")
    plan_id = user.get("plan_id")
    country = user.get("country", "Colombia")
    
    if not plan_id or not email:
        return
    
    # Obtener último ciclo (predeterminado: monthly)
    last_tx = await db.transactions.find_one(
        {"user_email": email, "status": "paid"},
        sort=[("paid_at", -1)]
    )
    billing_cycle = (last_tx.get("billing_cycle") if last_tx else None) or "monthly"
    
    # Calcular monto
    cop_amount = PLAN_PRICES_COP.get(plan_id, {}).get(billing_cycle, 0)
    if not cop_amount:
        return
    
    currency = COUNTRY_CURRENCY.get(country, "USD")
    rate = EXCHANGE_RATES.get(currency, EXCHANGE_RATES["USD"])
    local_amount = round(cop_amount * rate, 2) if currency != "COP" else cop_amount
    
    gateway = "mercado_pago" if country in MERCADO_PAGO_COUNTRIES else "paypal"
    payment_id = f"AUTO-RENEW-{uuid.uuid4().hex[:12].upper()}"
    plan = PLAN_CATALOG.get(plan_id, {})
    plan_name = plan.get("name", plan_id)
    
    # Crear preference en MP
    if gateway == "mercado_pago":
        tx_base = {
            "payment_id": payment_id,
            "user_email": email,
            "user_name": user.get("full_name", ""),
            "plan_id": plan_id,
            "billing_cycle": billing_cycle,
            "amount_local": local_amount,
            "currency": currency,
        }
        pref = await _create_mp_preference(tx_base, plan_name)
        if not pref or not pref.get("url"):
            stats["failed"] += 1
            return
        checkout_url = pref["url"]
        preference_id = pref["preference_id"]
    else:
        checkout_url = f"https://www.paypal.com/checkoutnow?token={payment_id}"
        preference_id = None
    
    # Registrar transacción de renovación automática
    transaction = {
        "payment_id": payment_id,
        "user_id": user_id,
        "user_email": email,
        "user_name": user.get("full_name", ""),
        "plan_id": plan_id,
        "billing_cycle": billing_cycle,
        "amount_cop": cop_amount,
        "amount_local": local_amount,
        "currency": currency,
        "country": country,
        "gateway": gateway,
        "status": "pending",
        "checkout_url": checkout_url,
        "preference_id": preference_id,
        "type": "auto_renewal",
        "auto_generated": True,
        "retry_count": 0,
        "created_at": datetime.utcnow(),
        "expires_at": datetime.utcnow() + timedelta(hours=24),
    }
    
    await db.transactions.insert_one(transaction)
    
    # Notificar al usuario
    try:
        await db.notifications.insert_one({
            "user_id": user_id,
            "type": "subscription_renewal_reminder",
            "title": "Tu suscripción está próxima a vencer",
            "message": f"Tu plan {plan_name} vence pronto. Haz clic para renovar.",
            "action_url": checkout_url,
            "read": False,
            "created_at": datetime.utcnow(),
        })
    except Exception as e:
        logger.warning(f"Could not notify user {email}: {e}")
    
    # Marcar usuario como "renewal_pending"
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {
            "renewal_payment_id": payment_id,
            "renewal_initiated_at": datetime.utcnow(),
        }}
    )
    
    stats["auto_renewed"] += 1
    logger.info(f"Auto-renewal initiated for {email}: {payment_id}")


async def retry_failed_renewals(db):
    """Reintenta renovaciones que fallaron (status = pending, type = auto_renewal).
    
    Ejecuta diariamente. Si un intent lleva > 3 días pendiente, lo marca como fallido
    e intenta uno nuevo.
    """
    now = datetime.utcnow()
    three_days_ago = now - timedelta(days=3)
    stats = {"checked": 0, "retried": 0, "abandoned": 0}
    
    try:
        # Buscar intents de renovación automática pendientes hace > 3 días
        old_pending = await db.transactions.find({
            "type": "auto_renewal",
            "status": "pending",
            "created_at": {"$lt": three_days_ago},
            "retry_count": {"$lt": 3}  # máximo 3 reintentos
        }).to_list(None)
        
        stats["checked"] = len(old_pending)
        
        for tx in old_pending:
            try:
                user = await db.users.find_one({"email": tx["user_email"]})
                if user:
                    await _process_auto_renewal(db, user, stats)
                    stats["retried"] += 1
                    await db.transactions.update_one(
                        {"_id": tx["_id"]},
                        {"$inc": {"retry_count": 1}}
                    )
            except Exception as e:
                logger.error(f"Retry failed for {tx['payment_id']}: {e}")
                stats["abandoned"] += 1
        
        logger.info(f"Renewal retry completed: {stats}")
        return stats
    
    except Exception as e:
        logger.exception("Renewal retry check failed")
        return stats
