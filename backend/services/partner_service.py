"""Service layer de Partners (Socios Comerciales) — Punto Cero OS (multi-tenant).

Mismo patrón que organization_service: toda consulta pasa por _tenant_filter,
companyName único por tenant, auditoría en audit_logs.
"""
from datetime import datetime
from typing import Optional

from bson import ObjectId
from pymongo import ASCENDING
from pymongo.errors import DuplicateKeyError

from utils.responses import OrgError


def _oid(pid: str) -> ObjectId:
    if not ObjectId.is_valid(pid):
        raise OrgError(404, "Partner no encontrado")
    return ObjectId(pid)


def _serialize(doc: dict) -> dict:
    if not doc:
        return doc
    return {**doc, "_id": str(doc["_id"])}


async def ensure_indexes(db):
    """Fase 3 — índices: tenantId, organizationId, vertical, status, stage y
    compuesto único tenantId + companyName."""
    await db.partners.create_index([("tenantId", ASCENDING)])
    await db.partners.create_index([("organizationId", ASCENDING)])
    await db.partners.create_index([("vertical", ASCENDING)])
    await db.partners.create_index([("status", ASCENDING)])
    await db.partners.create_index([("stage", ASCENDING)])
    await db.partners.create_index(
        [("tenantId", ASCENDING), ("companyName", ASCENDING)], unique=True, name="uniq_tenant_company"
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
            "module": "partners",
            "user": ctx.get("user", {}).get("email", "—"),
            "user_id": ctx.get("user_id"),
            "tenant_id": ctx.get("tenant_id"),
            "detail": detail,
            "created_at": datetime.utcnow(),
        })
    except Exception:
        pass


async def create_partner(db, ctx: dict, payload) -> dict:
    tenant_id = ctx.get("tenant_id")
    if not tenant_id:
        raise OrgError(400, "Se requiere tenant para crear un partner")

    existing = await db.partners.find_one({"tenantId": str(tenant_id), "companyName": payload.companyName})
    if existing:
        raise OrgError(409, f"Ya existe un partner '{payload.companyName}' en este tenant")

    now = datetime.utcnow()
    doc = {
        "tenantId": str(tenant_id),
        "organizationId": payload.organizationId,
        "companyName": payload.companyName,
        "contactName": payload.contactName,
        "email": payload.email,
        "phone": payload.phone,
        "vertical": payload.vertical,
        "status": payload.status,
        "stage": payload.stage,
        "commissionRate": payload.commissionRate,
        "projectedRevenue": payload.projectedRevenue,
        "country": payload.country,
        "currencyCode": payload.currencyCode,
        "createdAt": now,
        "updatedAt": now,
        "createdBy": ctx.get("user_id"),
    }
    try:
        res = await db.partners.insert_one(doc)
    except DuplicateKeyError:
        raise OrgError(409, f"Ya existe un partner '{payload.companyName}' en este tenant")
    doc["_id"] = res.inserted_id
    await _audit(db, "partner_created", ctx, f"{payload.companyName}")
    return _serialize(doc)


async def update_partner(db, ctx: dict, pid: str, payload) -> dict:
    oid = _oid(pid)
    updates = {k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None}
    if "companyName" in updates:
        clash = await db.partners.find_one({
            "tenantId": str(ctx["tenant_id"]), "companyName": updates["companyName"], "_id": {"$ne": oid},
        })
        if clash:
            raise OrgError(409, f"El nombre '{updates['companyName']}' ya está en uso en este tenant")
    updates["updatedAt"] = datetime.utcnow()

    res = await db.partners.update_one(_tenant_filter(ctx, {"_id": oid}), {"$set": updates})
    if res.matched_count == 0:
        raise OrgError(404, "Partner no encontrado")
    doc = await db.partners.find_one({"_id": oid})
    await _audit(db, "partner_updated", ctx, pid)
    return _serialize(doc)


async def delete_partner(db, ctx: dict, pid: str) -> None:
    oid = _oid(pid)
    res = await db.partners.delete_one(_tenant_filter(ctx, {"_id": oid}))
    if res.deleted_count == 0:
        raise OrgError(404, "Partner no encontrado")
    await _audit(db, "partner_deleted", ctx, pid)


async def get_partner(db, ctx: dict, pid: str) -> dict:
    oid = _oid(pid)
    doc = await db.partners.find_one(_tenant_filter(ctx, {"_id": oid}))
    if not doc:
        raise OrgError(404, "Partner no encontrado")
    await _audit(db, "partner_viewed", ctx, pid)
    return _serialize(doc)


async def list_partners(db, ctx: dict, status: Optional[str] = None, stage: Optional[str] = None) -> list:
    extra = {}
    if status:
        extra["status"] = status
    if stage:
        extra["stage"] = stage
    q = _tenant_filter(ctx, extra or None)
    docs = await db.partners.find(q).sort("createdAt", -1).to_list(1000)
    return [_serialize(d) for d in docs]


async def get_dashboard(db, ctx: dict) -> dict:
    """Consolidado para el frontend: lista + KPIs + pipeline (shape compatible)."""
    partners = await list_partners(db, ctx)
    active = [p for p in partners if p.get("status") == "active"]
    converted = [p for p in partners if p.get("stage") == "convertido"]
    commissions_generated = sum(float(p.get("commissionRate", 0) or 0) for p in active)
    return {
        "PARTNERS": partners,
        "KPIS": {
            "leads": len([p for p in partners if p.get("stage") == "lead"]),
            "companies": len(partners),
            "activeVerticals": len({p.get("vertical") for p in partners if p.get("vertical")}),
            "activePartners": len(active),
            "conversions": len(converted),
            "commissionsGenerated": commissions_generated,
        },
        "OPPORTUNITIES": [
            {
                "id": p["_id"],
                "company": p.get("companyName"),
                "vertical": p.get("vertical"),
                "contact": p.get("contactName"),
                "stage": p.get("stage"),
                "value": p.get("projectedRevenue", 0),
                "priority": "media",
            }
            for p in partners
        ],
    }
