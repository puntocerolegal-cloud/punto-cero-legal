"""Service layer de Suscripciones — Punto Cero OS (multi-tenant).

Mismo patrón que organization/partner/implementation: _tenant_filter en toda
consulta, companyName único por tenant, auditoría (incl. status_changed y
renewed) y dashboard con métricas SaaS (MRR/ARR/churn/ARPA).
"""
from datetime import datetime
from typing import Optional

from bson import ObjectId
from pymongo import ASCENDING
from pymongo.errors import DuplicateKeyError

from utils.responses import OrgError

# Factor para normalizar el importe del ciclo a base mensual (MRR).
CYCLE_TO_MONTHLY = {"monthly": 1.0, "quarterly": 1 / 3.0, "annual": 1 / 12.0}
ACTIVE_STATES = ("active", "trial")
CHURNED_STATES = ("cancelled", "expired", "suspended")


def _oid(sid: str) -> ObjectId:
    if not ObjectId.is_valid(sid):
        raise OrgError(404, "Suscripción no encontrada")
    return ObjectId(sid)


def _serialize(doc: dict) -> dict:
    if not doc:
        return doc
    return {**doc, "_id": str(doc["_id"])}


async def ensure_indexes(db):
    """Fase 4 — índices: tenantId, organizationId, status, plan, renewalDate,
    expirationDate y compuesto único tenantId + companyName."""
    await db.os_subscriptions.create_index([("tenantId", ASCENDING)])
    await db.os_subscriptions.create_index([("organizationId", ASCENDING)])
    await db.os_subscriptions.create_index([("status", ASCENDING)])
    await db.os_subscriptions.create_index([("plan", ASCENDING)])
    await db.os_subscriptions.create_index([("renewalDate", ASCENDING)])
    await db.os_subscriptions.create_index([("expirationDate", ASCENDING)])
    await db.os_subscriptions.create_index(
        [("tenantId", ASCENDING), ("companyName", ASCENDING)], unique=True, name="uniq_tenant_company_sub"
    )


def _tenant_filter(ctx: dict, extra: Optional[dict] = None) -> dict:
    q = dict(extra or {})
    if ctx.get("tenant_id"):
        q["tenantId"] = str(ctx["tenant_id"])
    elif not ctx.get("is_super_admin"):
        raise OrgError(400, "Operación sin tenant no permitida")
    return q


async def _audit(db, action: str, ctx: dict, detail: str = ""):
    try:
        await db.audit_logs.insert_one({
            "action": action,
            "module": "subscriptions",
            "user": ctx.get("user", {}).get("email", "—"),
            "user_id": ctx.get("user_id"),
            "tenant_id": ctx.get("tenant_id"),
            "detail": detail,
            "created_at": datetime.utcnow(),
        })
    except Exception:
        pass


def _monthly_value(sub: dict) -> float:
    """Importe mensual normalizado para MRR."""
    monthly = float(sub.get("monthlyAmount", 0) or 0)
    if monthly:
        return monthly
    annual = float(sub.get("annualAmount", 0) or 0)
    if annual:
        return annual / 12.0
    return 0.0


async def create_subscription(db, ctx: dict, payload) -> dict:
    tenant_id = ctx.get("tenant_id")
    if not tenant_id:
        raise OrgError(400, "Se requiere tenant para crear una suscripción")

    existing = await db.os_subscriptions.find_one({"tenantId": str(tenant_id), "companyName": payload.companyName})
    if existing:
        raise OrgError(409, f"Ya existe una suscripción para '{payload.companyName}' en este tenant")

    now = datetime.utcnow()
    doc = {
        "tenantId": str(tenant_id),
        "organizationId": payload.organizationId,
        "companyName": payload.companyName,
        "vertical": payload.vertical,
        "plan": payload.plan,
        "status": payload.status,
        "billingCycle": payload.billingCycle,
        "usersIncluded": payload.usersIncluded,
        "usersUsed": payload.usersUsed,
        "monthlyAmount": payload.monthlyAmount,
        "annualAmount": payload.annualAmount,
        "startDate": payload.startDate,
        "renewalDate": payload.renewalDate,
        "expirationDate": payload.expirationDate,
        "autoRenew": payload.autoRenew,
        "implementationId": payload.implementationId,
        "createdAt": now,
        "updatedAt": now,
        "createdBy": ctx.get("user_id"),
    }
    try:
        res = await db.os_subscriptions.insert_one(doc)
    except DuplicateKeyError:
        raise OrgError(409, f"Ya existe una suscripción para '{payload.companyName}' en este tenant")
    doc["_id"] = res.inserted_id
    await _audit(db, "subscription_created", ctx, payload.companyName)
    return _serialize(doc)


async def update_subscription(db, ctx: dict, sid: str, payload) -> dict:
    oid = _oid(sid)
    current = await db.os_subscriptions.find_one(_tenant_filter(ctx, {"_id": oid}))
    if not current:
        raise OrgError(404, "Suscripción no encontrada")

    updates = {k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None}
    if "companyName" in updates:
        clash = await db.os_subscriptions.find_one({
            "tenantId": str(ctx["tenant_id"]), "companyName": updates["companyName"], "_id": {"$ne": oid},
        })
        if clash:
            raise OrgError(409, f"El nombre '{updates['companyName']}' ya está en uso en este tenant")
    updates["updatedAt"] = datetime.utcnow()

    await db.os_subscriptions.update_one({"_id": oid}, {"$set": updates})

    if "status" in updates and updates["status"] != current.get("status"):
        await _audit(db, "subscription_status_changed", ctx, f"{current.get('companyName')}: {current.get('status')} → {updates['status']}")
    await _audit(db, "subscription_updated", ctx, sid)

    doc = await db.os_subscriptions.find_one({"_id": oid})
    return _serialize(doc)


async def delete_subscription(db, ctx: dict, sid: str) -> None:
    oid = _oid(sid)
    res = await db.os_subscriptions.delete_one(_tenant_filter(ctx, {"_id": oid}))
    if res.deleted_count == 0:
        raise OrgError(404, "Suscripción no encontrada")
    await _audit(db, "subscription_deleted", ctx, sid)


async def renew_subscription(db, ctx: dict, sid: str, renewal_date: Optional[str] = None) -> dict:
    oid = _oid(sid)
    current = await db.os_subscriptions.find_one(_tenant_filter(ctx, {"_id": oid}))
    if not current:
        raise OrgError(404, "Suscripción no encontrada")
    updates = {"status": "active", "updatedAt": datetime.utcnow()}
    if renewal_date:
        updates["renewalDate"] = renewal_date
    await db.os_subscriptions.update_one({"_id": oid}, {"$set": updates})
    await _audit(db, "subscription_renewed", ctx, current.get("companyName", sid))
    doc = await db.os_subscriptions.find_one({"_id": oid})
    return _serialize(doc)


async def get_subscription(db, ctx: dict, sid: str) -> dict:
    oid = _oid(sid)
    doc = await db.os_subscriptions.find_one(_tenant_filter(ctx, {"_id": oid}))
    if not doc:
        raise OrgError(404, "Suscripción no encontrada")
    await _audit(db, "subscription_viewed", ctx, sid)
    return _serialize(doc)


async def list_subscriptions(db, ctx: dict, status: Optional[str] = None, plan: Optional[str] = None) -> list:
    extra = {}
    if status:
        extra["status"] = status
    if plan:
        extra["plan"] = plan
    q = _tenant_filter(ctx, extra or None)
    docs = await db.os_subscriptions.find(q).sort("createdAt", -1).to_list(1000)
    return [_serialize(d) for d in docs]


async def get_dashboard(db, ctx: dict) -> dict:
    """Lista + métricas SaaS (Fase 3) + KPIS shape UI."""
    subs = await list_subscriptions(db, ctx)
    total = len(subs)
    active = [s for s in subs if s.get("status") == "active"]
    trial = [s for s in subs if s.get("status") == "trial"]
    churned = [s for s in subs if s.get("status") in CHURNED_STATES]

    # MRR = suma del valor mensual normalizado de las suscripciones activas/trial.
    mrr = sum(_monthly_value(s) for s in subs if s.get("status") in ACTIVE_STATES)
    arr = mrr * 12
    paying = [s for s in subs if s.get("status") in ACTIVE_STATES]
    arpa = (mrr / len(paying)) if paying else 0
    churn_rate = round((len(churned) / total) * 100, 2) if total else 0
    renewals_this_month = len([s for s in subs if s.get("renewalDate")])  # proxy (sin parseo de fecha)

    metrics = {
        "totalSubscriptions": total,
        "activeSubscriptions": len(active),
        "trialSubscriptions": len(trial),
        "renewalsThisMonth": renewals_this_month,
        "MRR": round(mrr),
        "ARR": round(arr),
        "churnRate": churn_rate,
        "averageRevenuePerAccount": round(arpa),
    }

    return {
        "SUBSCRIPTIONS": subs,
        "metrics": metrics,
        # KPIS en el shape que consume la UI (SubscriptionsDashboard / MRRMetrics).
        "KPIS": {
            "activeClients": len(active),
            "mrr": round(mrr),
            "arr": round(arr),
            "churn": churn_rate,
            "renewals": renewals_this_month,
            "monthlyBilling": round(mrr),
        },
    }
