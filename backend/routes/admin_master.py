"""
Administrador Maestro — Control total del sistema (Punto Cero Legal).

Capacidades de intervención manual sobre suscripciones, abogados, casos/leads y
solicitudes, SIN eliminar las automatizaciones existentes. Cada acción queda
auditada (admin, acción, fecha/hora, módulo, valor anterior y nuevo).
"""
from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from routes.admin_ops import get_admin, get_db
from utils.audit import log_audit, serialize_audit
from utils import notifier

router = APIRouter(prefix="/admin-master", tags=["Administrador Maestro"])


def _oid(v):
    if not ObjectId.is_valid(str(v)):
        raise HTTPException(404, "Identificador inválido")
    return ObjectId(v)


# ───────────────── Historial de auditoría ─────────────────
@router.get("/audit")
async def audit_history(module: Optional[str] = None, limit: int = 100,
                        admin=Depends(get_admin), db: AsyncIOMotorDatabase = Depends(get_db)):
    q = {}
    if module and module != "all":
        q["module"] = module
    rows = await db.audit_logs.find(q).sort("timestamp", -1).limit(min(limit, 500)).to_list(500)
    return [serialize_audit(a) for a in rows]


# ───────────────── SUSCRIPCIONES ─────────────────
SUB_FIELDS = ("plan_id", "subscription_status", "free_months_credits", "trial_ends_at", "benefits", "pending_plan_id")


def _sub_snapshot(u: dict) -> dict:
    return {k: (u.get(k).isoformat() if isinstance(u.get(k), datetime) else u.get(k)) for k in SUB_FIELDS}


@router.post("/subscription/{user_id}")
async def subscription_action(user_id: str, payload: dict, admin=Depends(get_admin), db: AsyncIOMotorDatabase = Depends(get_db)):
    """Acciones maestras de suscripción sobre el usuario (abogado)."""
    user = await db.users.find_one({"_id": _oid(user_id)})
    if not user:
        raise HTTPException(404, "Usuario no encontrado")
    action = (payload or {}).get("action")
    before = _sub_snapshot(user)
    now = datetime.utcnow()
    upd = {}
    detail = None

    if action == "activate":
        upd = {"subscription_status": "active"}
    elif action == "deactivate":
        upd = {"subscription_status": "inactive"}
    elif action == "freeze":
        upd = {"subscription_status": "frozen"}
    elif action == "reactivate":
        upd = {"subscription_status": "active"}
    elif action == "grant-free":
        upd = {"subscription_status": "active", "plan_id": payload.get("plan") or user.get("plan_id"), "is_complimentary": True}
        detail = "Suscripción gratuita otorgada"
    elif action in ("assign-plan", "change-plan"):
        plan = payload.get("plan")
        if not plan:
            raise HTTPException(400, "plan requerido")
        upd = {"plan_id": plan, "subscription_status": "active"}
    elif action == "extend-trial":
        days = int(payload.get("days", 7) or 7)
        base = user.get("trial_ends_at") if isinstance(user.get("trial_ends_at"), datetime) and user["trial_ends_at"] > now else now
        upd = {"trial_ends_at": base + timedelta(days=days), "subscription_status": user.get("subscription_status") or "trial"}
        detail = f"Trial extendido {days} días"
    elif action == "mark-paid":
        upd = {"subscription_status": "active", "last_payment_validated_at": now}
    elif action == "mark-pending":
        upd = {"subscription_status": "pending_payment"}
    elif action == "grant-months":
        months = int(payload.get("months", 1) or 1)
        upd = {"free_months_credits": int(user.get("free_months_credits", 0)) + months}
        detail = f"{months} mes(es) gratis otorgados"
    elif action == "benefit":
        benefits = list(user.get("benefits") or [])
        benefits.append({"label": payload.get("label", "Beneficio especial"), "at": now.isoformat(), "by": admin.get("full_name")})
        upd = {"benefits": benefits}
        detail = payload.get("label", "Beneficio especial")
    else:
        raise HTTPException(400, f"Acción de suscripción no soportada: {action}")

    upd["updated_at"] = now
    await db.users.update_one({"_id": user["_id"]}, {"$set": upd})
    after = _sub_snapshot({**user, **upd})
    await log_audit(db, admin, action=f"subscription.{action}", module="suscripciones",
                    entity_id=user_id, entity_label=user.get("email"), before=before, after=after, detail=detail)
    return {"ok": True, "action": action, "user_id": user_id, "subscription": after}


# ───────────────── ABOGADOS ─────────────────
LAWYER_FIELDS = ("status", "is_verified", "is_online", "role", "category", "plan_id")


def _lawyer_snapshot(u: dict) -> dict:
    return {k: u.get(k) for k in LAWYER_FIELDS}


@router.post("/lawyer/{user_id}")
async def lawyer_action(user_id: str, payload: dict, admin=Depends(get_admin), db: AsyncIOMotorDatabase = Depends(get_db)):
    """Acciones maestras sobre abogados (estado, categoría, plan)."""
    user = await db.users.find_one({"_id": _oid(user_id)})
    if not user:
        raise HTTPException(404, "Usuario no encontrado")
    action = (payload or {}).get("action")
    before = _lawyer_snapshot(user)
    now = datetime.utcnow()
    upd = {}
    notify = None

    if action == "approve":
        upd = {"status": "ACTIVE", "is_verified": True}
        notify = ("Cuenta aprobada", "Tu acceso a Punto Cero Legal fue aprobado. ¡Bienvenido!")
    elif action == "reject":
        upd = {"status": "REJECTED", "is_verified": False}
        notify = ("Solicitud rechazada", "Tu solicitud de acceso no fue aprobada en esta ocasión.")
    elif action == "activate":
        upd = {"status": "ACTIVE", "is_verified": True}
    elif action == "suspend":
        upd = {"status": "SUSPENDED", "is_online": False}
    elif action == "block":
        upd = {"status": "BLOCKED", "is_online": False}
    elif action == "reactivate":
        upd = {"status": "ACTIVE"}
    elif action == "change-category":
        cat = payload.get("value")
        if not cat:
            raise HTTPException(400, "value (categoría) requerido")
        upd = {"category": cat}
    elif action == "change-plan":
        plan = payload.get("value")
        if not plan:
            raise HTTPException(400, "value (plan) requerido")
        upd = {"plan_id": plan, "subscription_status": "active"}
    else:
        raise HTTPException(400, f"Acción de abogado no soportada: {action}")

    upd["updated_at"] = now
    await db.users.update_one({"_id": user["_id"]}, {"$set": upd})
    after = _lawyer_snapshot({**user, **upd})
    if notify:
        await notifier.create_app_notification(db, target=user_id, type="account_status",
                                               title=notify[0], message=notify[1])
    await log_audit(db, admin, action=f"lawyer.{action}", module="abogados",
                    entity_id=user_id, entity_label=user.get("email"), before=before, after=after)
    return {"ok": True, "action": action, "user_id": user_id, "lawyer": after}


@router.get("/lawyer/{user_id}/activity")
async def lawyer_activity(user_id: str, admin=Depends(get_admin), db: AsyncIOMotorDatabase = Depends(get_db)):
    """Actividad completa del abogado: casos, leads asignados y expedientes."""
    cases = await db.cases.find({"lawyer_id": user_id}).sort("created_at", -1).to_list(500)
    leads = await db.leads.find({"lawyer_id": user_id}).sort("created_at", -1).to_list(500)
    expedientes = await db.expedientes.find({"lawyer_id": user_id}).to_list(500)
    def case_row(c):
        return {"id": str(c["_id"]), "case_number": c.get("case_number"), "title": c.get("title"),
                "estado": c.get("estado"), "assignment_status": c.get("assignment_status"),
                "acceptance_status": c.get("acceptance_status")}
    return {
        "user_id": user_id,
        "cases": [case_row(c) for c in cases],
        "leads": [{"id": str(l["_id"]), "client_name": l.get("client_name"), "status": l.get("status")} for l in leads],
        "expedientes": [{"expediente_id": e.get("expediente_id"), "case_number": e.get("case_number")} for e in expedientes],
        "totals": {"cases": len(cases), "leads": len(leads), "expedientes": len(expedientes)},
    }


# ───────────────── CASOS Y LEADS ─────────────────
@router.post("/case/{case_id}")
async def case_action(case_id: str, payload: dict, admin=Depends(get_admin), db: AsyncIOMotorDatabase = Depends(get_db)):
    """Acciones maestras sobre casos (asignar/reasignar/recuperar/cerrar/reabrir…)."""
    case = await db.cases.find_one({"_id": _oid(case_id)})
    if not case:
        raise HTTPException(404, "Caso no encontrado")
    action = (payload or {}).get("action")
    before = {"assignment_status": case.get("assignment_status"), "acceptance_status": case.get("acceptance_status"),
              "lawyer_id": case.get("lawyer_id"), "estado": case.get("estado")}
    now = datetime.utcnow()
    upd = {}

    if action in ("assign", "reassign", "approve-assignment"):
        lawyer_id = payload.get("lawyer_id")
        if not lawyer_id:
            raise HTTPException(400, "lawyer_id requerido")
        upd = {"lawyer_id": lawyer_id, "assignment_status": "asignado", "acceptance_status": "pending",
               "assigned_at": now, "assigned_by": admin["_id"]}
        await notifier.create_app_notification(db, target=lawyer_id, type="case_assigned",
                                               title="Caso asignado por administración",
                                               message=f"Se te asignó el caso {case.get('case_number')}.", case_id=case_id)
    elif action in ("recover", "force-return", "cancel-assignment"):
        upd = {"lawyer_id": None, "assignment_status": "sin_asignar", "acceptance_status": "admin_returned", "returned_at": now}
    elif action == "close":
        upd = {"estado": "Finalizada", "status": "closed"}
    elif action == "reopen":
        upd = {"estado": "Activo", "status": "open"}
    else:
        raise HTTPException(400, f"Acción de caso no soportada: {action}")

    upd["updated_at"] = now
    await db.cases.update_one({"_id": case["_id"]}, {"$set": upd})
    after = {**before, **{k: (v.isoformat() if isinstance(v, datetime) else v) for k, v in upd.items() if k != "updated_at"}}
    await log_audit(db, admin, action=f"case.{action}", module="casos",
                    entity_id=case_id, entity_label=case.get("case_number"), before=before, after=after)
    return {"ok": True, "action": action, "case_id": case_id}


# ───────────────── SOLICITUDES (genérico) ─────────────────
REQUEST_COLLECTIONS = {
    "registros": "users", "suscripciones": "os_subscriptions", "pagos": "transactions",
    "referidos": "referrals", "abogados": "users", "contacto": "leads",
}


@router.post("/request/{kind}/{entity_id}")
async def request_action(kind: str, entity_id: str, payload: dict, admin=Depends(get_admin), db: AsyncIOMotorDatabase = Depends(get_db)):
    """Aprobar / rechazar / dejar pendiente / solicitar corrección sobre cualquier solicitud."""
    coll = REQUEST_COLLECTIONS.get(kind)
    if not coll:
        raise HTTPException(400, f"Tipo de solicitud no soportado: {kind}")
    doc = await db[coll].find_one({"_id": _oid(entity_id)})
    if not doc:
        raise HTTPException(404, "Solicitud no encontrada")
    action = (payload or {}).get("action")
    mapping = {"approve": "approved", "reject": "rejected", "pending": "pending", "request-correction": "correction_requested"}
    if action not in mapping:
        raise HTTPException(400, f"Acción no soportada: {action}")
    before = {"request_status": doc.get("request_status"), "status": doc.get("status")}
    now = datetime.utcnow()
    upd = {"request_status": mapping[action], "request_reviewed_by": admin.get("full_name"),
           "request_reviewed_at": now, "updated_at": now}
    if payload.get("note"):
        upd["request_note"] = payload["note"]
    await db[coll].update_one({"_id": doc["_id"]}, {"$set": upd})
    await log_audit(db, admin, action=f"request.{action}", module=f"solicitudes/{kind}",
                    entity_id=entity_id, entity_label=doc.get("email") or doc.get("client_name"),
                    before=before, after={"request_status": mapping[action]}, detail=payload.get("note"))
    return {"ok": True, "action": action, "kind": kind, "entity_id": entity_id, "request_status": mapping[action]}
