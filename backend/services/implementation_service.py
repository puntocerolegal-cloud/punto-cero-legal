"""Service layer de Implementaciones — Punto Cero OS (multi-tenant).

Mismo patrón que organization/partner: _tenant_filter en toda consulta,
companyName único por tenant, auditoría (incl. stage_changed) y dashboard
con métricas ejecutivas.
"""
from datetime import datetime
from typing import Optional

from bson import ObjectId
from pymongo import ASCENDING
from pymongo.errors import DuplicateKeyError

from utils.responses import OrgError

IN_PROGRESS_STAGES = ("kickoff", "configuration", "migration", "training", "go_live")


def _oid(iid: str) -> ObjectId:
    if not ObjectId.is_valid(iid):
        raise OrgError(404, "Implementación no encontrada")
    return ObjectId(iid)


def _serialize(doc: dict) -> dict:
    if not doc:
        return doc
    return {**doc, "_id": str(doc["_id"])}


async def ensure_indexes(db):
    """Fase 4 — índices: tenantId, organizationId, stage, status, riskLevel,
    goLiveDate y compuesto único tenantId + companyName."""
    await db.implementations.create_index([("tenantId", ASCENDING)])
    await db.implementations.create_index([("organizationId", ASCENDING)])
    await db.implementations.create_index([("stage", ASCENDING)])
    await db.implementations.create_index([("status", ASCENDING)])
    await db.implementations.create_index([("riskLevel", ASCENDING)])
    await db.implementations.create_index([("goLiveDate", ASCENDING)])
    await db.implementations.create_index(
        [("tenantId", ASCENDING), ("companyName", ASCENDING)], unique=True, name="uniq_tenant_company_impl"
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
            "module": "implementations",
            "user": ctx.get("user", {}).get("email", "—"),
            "user_id": ctx.get("user_id"),
            "tenant_id": ctx.get("tenant_id"),
            "detail": detail,
            "created_at": datetime.utcnow(),
        })
    except Exception:
        pass


async def create_implementation(db, ctx: dict, payload) -> dict:
    tenant_id = ctx.get("tenant_id")
    if not tenant_id:
        raise OrgError(400, "Se requiere tenant para crear una implementación")

    existing = await db.implementations.find_one({"tenantId": str(tenant_id), "companyName": payload.companyName})
    if existing:
        raise OrgError(409, f"Ya existe una implementación para '{payload.companyName}' en este tenant")

    now = datetime.utcnow()
    doc = {
        "tenantId": str(tenant_id),
        "organizationId": payload.organizationId,
        "companyName": payload.companyName,
        "vertical": payload.vertical,
        "projectManager": payload.projectManager,
        "assignedTeam": payload.assignedTeam or [],
        "stage": payload.stage,
        "progress": payload.progress,
        "goLiveDate": payload.goLiveDate,
        "status": payload.status,
        "riskLevel": payload.riskLevel,
        "notes": payload.notes,
        "createdAt": now,
        "updatedAt": now,
        "createdBy": ctx.get("user_id"),
    }
    try:
        res = await db.implementations.insert_one(doc)
    except DuplicateKeyError:
        raise OrgError(409, f"Ya existe una implementación para '{payload.companyName}' en este tenant")
    doc["_id"] = res.inserted_id
    await _audit(db, "implementation_created", ctx, payload.companyName)
    return _serialize(doc)


async def update_implementation(db, ctx: dict, iid: str, payload) -> dict:
    oid = _oid(iid)
    current = await db.implementations.find_one(_tenant_filter(ctx, {"_id": oid}))
    if not current:
        raise OrgError(404, "Implementación no encontrada")

    updates = {k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None}
    if "companyName" in updates:
        clash = await db.implementations.find_one({
            "tenantId": str(ctx["tenant_id"]), "companyName": updates["companyName"], "_id": {"$ne": oid},
        })
        if clash:
            raise OrgError(409, f"El nombre '{updates['companyName']}' ya está en uso en este tenant")
    updates["updatedAt"] = datetime.utcnow()

    await db.implementations.update_one({"_id": oid}, {"$set": updates})

    # Auditoría de cambio de etapa.
    if "stage" in updates and updates["stage"] != current.get("stage"):
        await _audit(db, "implementation_stage_changed", ctx, f"{current.get('companyName')}: {current.get('stage')} → {updates['stage']}")
    await _audit(db, "implementation_updated", ctx, iid)

    doc = await db.implementations.find_one({"_id": oid})
    return _serialize(doc)


async def delete_implementation(db, ctx: dict, iid: str) -> None:
    oid = _oid(iid)
    res = await db.implementations.delete_one(_tenant_filter(ctx, {"_id": oid}))
    if res.deleted_count == 0:
        raise OrgError(404, "Implementación no encontrada")
    await _audit(db, "implementation_deleted", ctx, iid)


async def get_implementation(db, ctx: dict, iid: str) -> dict:
    oid = _oid(iid)
    doc = await db.implementations.find_one(_tenant_filter(ctx, {"_id": oid}))
    if not doc:
        raise OrgError(404, "Implementación no encontrada")
    await _audit(db, "implementation_viewed", ctx, iid)
    return _serialize(doc)


async def list_implementations(db, ctx: dict, stage: Optional[str] = None, status: Optional[str] = None) -> list:
    extra = {}
    if stage:
        extra["stage"] = stage
    if status:
        extra["status"] = status
    q = _tenant_filter(ctx, extra or None)
    docs = await db.implementations.find(q).sort("createdAt", -1).to_list(1000)
    return [_serialize(d) for d in docs]


async def get_dashboard(db, ctx: dict) -> dict:
    """Lista + métricas ejecutivas (Fase 3) + KPIS shape UI + Go-Lives."""
    items = await list_implementations(db, ctx)
    total = len(items)
    in_progress = [i for i in items if i.get("stage") in IN_PROGRESS_STAGES]
    go_lives = [i for i in items if i.get("stage") == "go_live"]
    blocked = [i for i in items if i.get("status") == "blocked"]
    completed = [i for i in items if i.get("stage") == "operation" or i.get("status") == "completed"]
    open_risks = [i for i in items if i.get("riskLevel") in ("high", "critical")]
    avg_progress = round(sum(int(i.get("progress", 0) or 0) for i in items) / total) if total else 0

    metrics = {
        "implementationsTotal": total,
        "inProgress": len(in_progress),
        "goLivesThisMonth": len(go_lives),
        "blockedProjects": len(blocked),
        "completedProjects": len(completed),
        "averageProgress": avg_progress,
    }

    return {
        "PROJECTS": items,
        "metrics": metrics,
        # KPIS en el shape que consume la UI (ImplementationsDashboard).
        "KPIS": {
            "activeProjects": len(in_progress),
            "avgImplementationDays": 0,
            "productiveClients": len(completed),
            "goLivesDone": len(go_lives),
            "openRisks": len(open_risks),
            "satisfaction": avg_progress,
        },
        "GO_LIVES": [
            {
                "id": i["_id"],
                "company": i.get("companyName"),
                "owner": i.get("projectManager") or "—",
                "date": i.get("goLiveDate") or "—",
                "status": "riesgo" if i.get("riskLevel") in ("high", "critical") else "normal",
            }
            for i in go_lives
        ],
    }
