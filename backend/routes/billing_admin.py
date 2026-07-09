"""
Administración de Suscripciones y Renovaciones — Punto Cero Legal Admin

Endpoints para que los administradores monitoreen y gestionen suscripciones:
- Listado de suscripciones activas
- Transacciones de pago
- Renovaciones automáticas
- Reintentos fallidos
- Dashboard de métricas
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorDatabase
from routes.auth import get_current_admin
from services.renewal_service import check_and_renew_subscriptions, retry_failed_renewals

router = APIRouter(prefix="/billing-admin", tags=["Billing Administration"])


async def get_db():
    from server import db
    # Bypass GuardedDB for direct-access routes; tenant isolation is enforced
    # via get_current_user + explicit firm filtering (same pattern as routes/auth.py).
    if hasattr(db, "_real_db"):
        return db._real_db
    return db


@router.get("/subscriptions")
async def list_all_subscriptions(
    status: Optional[str] = Query(None),
    plan_id: Optional[str] = Query(None),
    country: Optional[str] = Query(None),
    limit: int = Query(100, le=1000),
    admin=Depends(get_current_admin),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Listar todas las suscripciones (solo admin).
    
    Filtros opcionales: status, plan_id, country.
    Retorna: usuarios con sus suscripciones actuales.
    """
    query = {"plan_id": {"$exists": True, "$ne": None}}
    
    if status:
        query["subscription_status"] = status
    if plan_id:
        query["plan_id"] = plan_id
    if country:
        query["country"] = country
    
    users = await db.users.find(query).limit(limit).to_list(limit)
    
    return {
        "total": len(users),
        "users": [
            {
                "_id": str(u["_id"]),
                "email": u.get("email"),
                "full_name": u.get("full_name"),
                "plan_id": u.get("plan_id"),
                "subscription_status": u.get("subscription_status"),
                "country": u.get("country"),
                "created_at": u.get("created_at"),
                "subscription_expires_at": u.get("subscription_expires_at"),
            }
            for u in users
        ]
    }


@router.get("/transactions")
async def list_transactions(
    status: Optional[str] = Query(None),
    type_filter: Optional[str] = Query(None),
    limit: int = Query(100, le=1000),
    admin=Depends(get_current_admin),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Listar transacciones de pago (solo admin).
    
    Tipos: payment, renewal, plan_change, reactivation.
    Estados: pending, paid, rejected, cancelled.
    """
    query = {}
    if status:
        query["status"] = status
    if type_filter:
        query["type"] = type_filter
    
    txs = await db.transactions.find(query).sort("created_at", -1).limit(limit).to_list(limit)
    
    return {
        "total": len(txs),
        "transactions": [
            {
                "_id": str(tx["_id"]),
                "payment_id": tx.get("payment_id"),
                "user_email": tx.get("user_email"),
                "user_name": tx.get("user_name"),
                "plan_id": tx.get("plan_id"),
                "amount_local": tx.get("amount_local"),
                "currency": tx.get("currency"),
                "status": tx.get("status"),
                "type": tx.get("type"),
                "gateway": tx.get("gateway"),
                "created_at": tx.get("created_at"),
                "paid_at": tx.get("paid_at"),
            }
            for tx in txs
        ]
    }


@router.get("/dashboard")
async def billing_dashboard(
    admin=Depends(get_current_admin),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Dashboard de facturación: KPIs de suscripciones.
    
    Retorna:
    - Total de usuarios con suscripción
    - Por cada plan (activos, pendientes, cancelados)
    - Ingresos MRR (Monthly Recurring Revenue)
    - ARR (Annual Recurring Revenue)
    - Churn rate (% de cancelados)
    - Transacciones pendientes
    """
    now = datetime.utcnow()
    
    # Usuarios por estado
    total_active = await db.users.count_documents({"subscription_status": "active"})
    total_trial = await db.users.count_documents({"subscription_status": "trial"})
    total_pending = await db.users.count_documents({"subscription_status": "pending_verification"})
    total_cancelled = await db.users.count_documents({"subscription_status": "cancelled"})
    total_suspended = await db.users.count_documents({"subscription_status": "suspended"})
    
    # Por plan (usuarios activos)
    plan_dist = await db.users.aggregate([
        {"$match": {"plan_id": {"$exists": True}, "subscription_status": "active"}},
        {"$group": {"_id": "$plan_id", "count": {"$sum": 1}}}
    ]).to_list(None)
    
    plans_dict = {p["_id"]: p["count"] for p in plan_dist}
    
    # Transacciones recientes (últimos 30 días)
    month_ago = now - timedelta(days=30)
    recent_payments = await db.transactions.find({
        "status": "paid",
        "created_at": {"$gte": month_ago}
    }).to_list(None)
    
    total_revenue_cop = sum(tx.get("amount_cop", 0) for tx in recent_payments)
    total_revenue_usd = sum(tx.get("amount_local", 0) for tx in recent_payments if tx.get("currency") == "USD")
    
    # MRR / ARR (estimado: usuarios activos * promedio de precio del plan)
    active_users = await db.users.find({"subscription_status": "active"}).to_list(None)
    mrr_estimate = 0
    for u in active_users:
        plan_id = u.get("plan_id")
        if plan_id == "esencial":
            mrr_estimate += 112500
        elif plan_id == "profesional":
            mrr_estimate += 210000
        elif plan_id == "elite":
            mrr_estimate += 562500
        elif plan_id == "ilimitado":
            mrr_estimate += 2100000
    
    arr_estimate = mrr_estimate * 12
    
    # Pendientes de pago
    pending_payments = await db.transactions.count_documents({
        "status": "pending",
        "created_at": {"$gte": month_ago}
    })
    
    # Churn rate (cancelados / total activos el mes pasado)
    month_ago_active = await db.users.count_documents({
        "subscription_status": "active",
        "created_at": {"$gte": month_ago}
    })
    churn_rate = (total_cancelled / (month_ago_active or 1)) * 100
    
    return {
        "timestamp": now,
        "subscriptions": {
            "active": total_active,
            "trial": total_trial,
            "pending_verification": total_pending,
            "cancelled": total_cancelled,
            "suspended": total_suspended,
            "by_plan": plans_dict,
        },
        "revenue": {
            "monthly_recent_cop": total_revenue_cop,
            "monthly_recent_usd": total_revenue_usd,
            "mrr_estimate": mrr_estimate,
            "arr_estimate": arr_estimate,
            "churn_rate_percent": round(churn_rate, 2),
        },
        "pending": {
            "payment_intents": pending_payments,
            "verification_receipts": await db.receipts.count_documents({"status": "pending_verification"}),
        }
    }


@router.post("/trigger-renewal-check")
async def trigger_renewal_check(
    admin=Depends(get_current_admin),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Ejecuta manualmente la verificación de renovaciones automáticas.
    
    Normalmente se ejecutaría en un cronjob diariamente.
    Este endpoint permite hacerlo manualmente para testing/debugging.
    """
    stats = await check_and_renew_subscriptions(db)
    return {
        "message": "Renewal check executed",
        "stats": stats,
        "timestamp": datetime.utcnow()
    }


@router.post("/trigger-retry-failed")
async def trigger_retry_failed(
    admin=Depends(get_current_admin),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Ejecuta manualmente el reintento de renovaciones fallidas.
    
    Reintenta payment intents que llevan > 3 días pendientes.
    """
    stats = await retry_failed_renewals(db)
    return {
        "message": "Retry check executed",
        "stats": stats,
        "timestamp": datetime.utcnow()
    }


@router.get("/pending-renewals")
async def get_pending_renewals(
    admin=Depends(get_current_admin),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Listar suscripciones pendientes de renovación automática."""
    pending = await db.transactions.find({
        "type": "auto_renewal",
        "status": "pending"
    }).sort("created_at", 1).to_list(100)
    
    return {
        "total": len(pending),
        "renewals": [
            {
                "payment_id": tx.get("payment_id"),
                "user_email": tx.get("user_email"),
                "plan_id": tx.get("plan_id"),
                "amount": tx.get("amount_local"),
                "currency": tx.get("currency"),
                "created_at": tx.get("created_at"),
                "retry_count": tx.get("retry_count", 0),
                "checkout_url": tx.get("checkout_url"),
            }
            for tx in pending
        ]
    }


@router.get("/webhook-metrics")
async def get_webhook_metrics(
    hours: int = Query(24, ge=1, le=168),
    admin=Depends(get_current_admin),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Obtener métricas de webhooks procesados (últimas N horas)."""
    from datetime import datetime, timedelta

    cutoff = datetime.utcnow() - timedelta(hours=hours)

    # Contar por status
    total = await db.webhook_logs.count_documents({"created_at": {"$gte": cutoff}})
    success = await db.webhook_logs.count_documents({
        "created_at": {"$gte": cutoff},
        "result_status": "success"
    })
    duplicate = await db.webhook_logs.count_documents({
        "created_at": {"$gte": cutoff},
        "result_status": "duplicate"
    })
    invalid_sig = await db.webhook_logs.count_documents({
        "created_at": {"$gte": cutoff},
        "result_status": "invalid_signature"
    })
    errors = await db.webhook_logs.count_documents({
        "created_at": {"$gte": cutoff},
        "result_status": "error"
    })

    # Latencia promedio
    pipeline = [
        {"$match": {"created_at": {"$gte": cutoff}}},
        {"$group": {
            "_id": None,
            "avg_latency": {"$avg": "$execution_time_ms"},
            "max_latency": {"$max": "$execution_time_ms"},
            "min_latency": {"$min": "$execution_time_ms"},
        }}
    ]
    latency_stats = await db.webhook_logs.aggregate(pipeline).to_list(1)

    # Por tipo de evento
    pipeline = [
        {"$match": {"created_at": {"$gte": cutoff}}},
        {"$group": {
            "_id": "$type",
            "count": {"$sum": 1},
            "success": {
                "$sum": {"$cond": [{"$eq": ["$result_status", "success"]}, 1, 0]}
            },
            "errors": {
                "$sum": {"$cond": [{"$eq": ["$result_status", "error"]}, 1, 0]}
            }
        }}
    ]
    by_type = await db.webhook_logs.aggregate(pipeline).to_list(None)

    return {
        "period_hours": hours,
        "summary": {
            "total": total,
            "success": success,
            "duplicate": duplicate,
            "invalid_signature": invalid_sig,
            "errors": errors,
            "success_rate": f"{(success/total*100):.1f}%" if total > 0 else "—",
        },
        "latency": {
            "avg_ms": round(latency_stats[0]["avg_latency"], 2) if latency_stats else None,
            "max_ms": latency_stats[0]["max_latency"] if latency_stats else None,
            "min_ms": latency_stats[0]["min_latency"] if latency_stats else None,
        },
        "by_type": [
            {
                "type": item["_id"],
                "total": item["count"],
                "success": item["success"],
                "errors": item["errors"],
                "success_rate": f"{(item['success']/item['count']*100):.1f}%"
            }
            for item in by_type
        ]
    }


@router.get("/webhook-logs")
async def get_webhook_logs(
    event_type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    limit: int = Query(50, le=500),
    admin=Depends(get_current_admin),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Obtener logs de webhooks para debugging."""
    query = {}
    if event_type:
        query["type"] = event_type
    if status:
        query["result_status"] = status

    logs = await db.webhook_logs.find(query).sort("created_at", -1).limit(limit).to_list(limit)

    return {
        "total": len(logs),
        "logs": [
            {
                "event_id": log["event_id"],
                "type": log["type"],
                "result_status": log["result_status"],
                "execution_time_ms": log["execution_time_ms"],
                "ip_address": log.get("ip_address"),
                "error": log.get("error"),
                "created_at": log["created_at"],
            }
            for log in logs
        ]
    }


@router.get("/webhook-events")
async def get_webhook_events(
    processed: Optional[bool] = Query(None),
    limit: int = Query(50, le=500),
    admin=Depends(get_current_admin),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Obtener historial de eventos de webhook para auditoría."""
    query = {}
    if processed is not None:
        query["processed"] = processed

    events = await db.webhook_events.find(query).sort("created_at", -1).limit(limit).to_list(limit)

    return {
        "total": len(events),
        "events": [
            {
                "event_id": ev["event_id"],
                "type": ev["type"],
                "action": ev["action"],
                "processed": ev["processed"],
                "processed_at": ev.get("processed_at"),
                "retries": ev["retries"],
                "error": ev.get("error"),
                "created_at": ev["created_at"],
            }
            for ev in events
        ]
    }


@router.post("/verify-receipt/{receipt_id}")
async def verify_receipt(
    receipt_id: str,
    action: str = Query(..., regex="^(approve|reject)$"),
    reason: Optional[str] = None,
    admin=Depends(get_current_admin),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Admin verifica un comprobante de pago manual.
    
    action: approve | reject
    reason: motivo de rechazo (si aplica)
    """
    from bson import ObjectId
    
    try:
        receipt_oid = ObjectId(receipt_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid receipt ID")
    
    receipt = await db.receipts.find_one({"_id": receipt_oid})
    if not receipt:
        raise HTTPException(status_code=404, detail="Receipt not found")
    
    if action == "approve":
        # Marcar receipt como aprobado
        await db.receipts.update_one(
            {"_id": receipt_oid},
            {"$set": {
                "status": "approved",
                "verified_at": datetime.utcnow(),
                "verified_by": admin.get("email"),
            }}
        )
        
        # Activar suscripción del usuario
        user = await db.users.find_one({"email": receipt["user_email"]})
        if user:
            await db.users.update_one(
                {"_id": user["_id"]},
                {"$set": {
                    "plan_id": receipt["plan_id"],
                    "subscription_status": "active",
                    "pending_plan_id": None,
                    "subscription_activated_at": datetime.utcnow(),
                }}
            )
            
            # Notificar usuario
            try:
                await db.notifications.insert_one({
                    "user_id": str(user["_id"]),
                    "type": "payment_verified",
                    "title": "Pago verificado",
                    "message": f"Tu comprobante fue verificado. Tu plan {receipt['plan_name']} está activo.",
                    "read": False,
                    "created_at": datetime.utcnow(),
                })
            except:
                pass
        
        return {"message": "Receipt approved", "status": "approved"}
    
    else:  # reject
        await db.receipts.update_one(
            {"_id": receipt_oid},
            {"$set": {
                "status": "rejected",
                "rejection_reason": reason,
                "verified_at": datetime.utcnow(),
                "verified_by": admin.get("email"),
            }}
        )
        
        # Notificar usuario
        user = await db.users.find_one({"email": receipt["user_email"]})
        if user:
            await db.notifications.insert_one({
                "user_id": str(user["_id"]),
                "type": "payment_rejected",
                "title": "Comprobante rechazado",
                "message": f"Tu comprobante fue rechazado: {reason or 'Sin detalles'}. Por favor intenta de nuevo.",
                "read": False,
                "created_at": datetime.utcnow(),
            })
        
        return {"message": "Receipt rejected", "status": "rejected"}
