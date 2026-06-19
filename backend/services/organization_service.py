"""Service layer de Organizaciones — Punto Cero OS (multi-tenant).

Reglas clave:
- TODA consulta incluye tenantId (Fase 5). Solo SUPER_ADMIN puede operar
  cross-tenant (tenant_id None ⇒ sin filtro de tenant).
- slug único por tenant (índice compuesto + verificación previa).
- Cada operación queda auditada en la colección audit_logs.
"""
import re
import unicodedata
from datetime import datetime
from typing import Optional

from bson import ObjectId
from pymongo import ASCENDING
from pymongo.errors import DuplicateKeyError

from utils.responses import OrgError


# ───────────────────── Utilidades ─────────────────────
def slugify(value: str) -> str:
    value = unicodedata.normalize("NFKD", value or "").encode("ascii", "ignore").decode("ascii")
    value = re.sub(r"[^a-zA-Z0-9]+", "-", value).strip("-").lower()
    return value or "org"


def _oid(org_id: str) -> ObjectId:
    if not ObjectId.is_valid(org_id):
        raise OrgError(404, "Organización no encontrada")
    return ObjectId(org_id)


def _serialize(doc: dict) -> dict:
    if not doc:
        return doc
    doc = {**doc, "_id": str(doc["_id"])}
    return doc


async def ensure_indexes(db):
    """Fase 2 — índices: tenantId, slug, status y compuesto único tenantId+slug."""
    await db.organizations.create_index([("tenantId", ASCENDING)])
    await db.organizations.create_index([("slug", ASCENDING)])
    await db.organizations.create_index([("status", ASCENDING)])
    await db.organizations.create_index(
        [("tenantId", ASCENDING), ("slug", ASCENDING)], unique=True, name="uniq_tenant_slug"
    )


def _tenant_filter(ctx: dict, extra: Optional[dict] = None) -> dict:
    """Filtro base con tenant. Nunca se consulta sin tenant salvo SUPER_ADMIN
    sin tenant explícito (visión cross-tenant)."""
    q = dict(extra or {})
    if ctx.get("tenant_id"):
        q["tenantId"] = str(ctx["tenant_id"])
    elif not ctx.get("is_super_admin"):
        # Defensa en profundidad: jamás devolver datos sin tenant a no-superadmin.
        raise OrgError(400, "Operación sin tenant no permitida")
    return q


async def _audit(db, action: str, ctx: dict, detail: str = ""):
    try:
        await db.audit_logs.insert_one({
            "action": action,
            "module": "organizations",
            "user": ctx.get("user", {}).get("email", "—"),
            "user_id": ctx.get("user_id"),
            "tenant_id": ctx.get("tenant_id"),
            "detail": detail,
            "created_at": datetime.utcnow(),
        })
    except Exception:
        pass  # la auditoría nunca debe romper la operación


# ───────────────────── CRUD ─────────────────────
async def create_organization(db, ctx: dict, payload) -> dict:
    tenant_id = ctx.get("tenant_id")
    if not tenant_id:
        raise OrgError(400, "Se requiere tenant para crear una organización")

    slug = slugify(payload.slug or payload.name)
    # Verificación previa de unicidad por tenant (además del índice único).
    existing = await db.organizations.find_one({"tenantId": str(tenant_id), "slug": slug})
    if existing:
        raise OrgError(409, f"Ya existe una organización con el slug '{slug}' en este tenant")

    now = datetime.utcnow()
    doc = {
        "tenantId": str(tenant_id),
        "name": payload.name,
        "slug": slug,
        "vertical": payload.vertical,
        "plan": payload.plan,
        "status": payload.status,
        "ownerId": payload.ownerId,
        "settings": payload.settings or {},
        "limits": payload.limits or {},
        "createdAt": now,
        "updatedAt": now,
    }
    try:
        res = await db.organizations.insert_one(doc)
    except DuplicateKeyError:
        raise OrgError(409, f"Ya existe una organización con el slug '{slug}' en este tenant")
    doc["_id"] = res.inserted_id
    await _audit(db, "createOrganization", ctx, f"{payload.name} ({slug})")
    return _serialize(doc)


async def update_organization(db, ctx: dict, org_id: str, payload) -> dict:
    oid = _oid(org_id)
    updates = {k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None}
    if "name" in updates and "slug" not in updates:
        pass  # no recomputamos slug al renombrar (estable como identificador)
    if "slug" in updates:
        updates["slug"] = slugify(updates["slug"])
        clash = await db.organizations.find_one({
            "tenantId": str(ctx["tenant_id"]), "slug": updates["slug"], "_id": {"$ne": oid},
        })
        if clash:
            raise OrgError(409, f"El slug '{updates['slug']}' ya está en uso en este tenant")
    updates["updatedAt"] = datetime.utcnow()

    res = await db.organizations.update_one(_tenant_filter(ctx, {"_id": oid}), {"$set": updates})
    if res.matched_count == 0:
        raise OrgError(404, "Organización no encontrada")
    doc = await db.organizations.find_one({"_id": oid})
    await _audit(db, "updateOrganization", ctx, org_id)
    return _serialize(doc)


async def delete_organization(db, ctx: dict, org_id: str) -> None:
    oid = _oid(org_id)
    res = await db.organizations.delete_one(_tenant_filter(ctx, {"_id": oid}))
    if res.deleted_count == 0:
        raise OrgError(404, "Organización no encontrada")
    await _audit(db, "deleteOrganization", ctx, org_id)


async def get_organization(db, ctx: dict, org_id: str) -> dict:
    oid = _oid(org_id)
    doc = await db.organizations.find_one(_tenant_filter(ctx, {"_id": oid}))
    if not doc:
        raise OrgError(404, "Organización no encontrada")
    await _audit(db, "viewOrganization", ctx, org_id)
    return _serialize(doc)


async def get_organizations(db, ctx: dict, status: Optional[str] = None) -> list:
    q = _tenant_filter(ctx, {"status": status} if status else None)
    docs = await db.organizations.find(q).sort("createdAt", -1).to_list(1000)
    return [_serialize(d) for d in docs]


async def get_dashboard(db, ctx: dict) -> dict:
    """Consolidado para el frontend: lista + KPIs (shape compatible con la UI)."""
    orgs = await get_organizations(db, ctx)
    active = [o for o in orgs if o.get("status") == "active"]
    at_risk = [o for o in orgs if o.get("status") in ("at_risk", "suspended")]
    total_users = sum(int(o.get("users", 0) or 0) for o in orgs)
    return {
        "organizations": orgs,
        "KPIS": {
            "activeOrgs": len(active),
            "totalUsers": total_users,
            "activeVerticals": len({o.get("vertical") for o in orgs if o.get("vertical")}),
            "activeSubscriptions": len(active),
            "totalMrr": sum(int(o.get("mrr", 0) or 0) for o in orgs),
            "orgsAtRisk": len(at_risk),
        },
    }
