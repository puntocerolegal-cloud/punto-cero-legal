"""
Centro de Gestión · Operaciones Administrativas
Punto Cero Legal — Doble flujo: Gestión de Socios (Sala de Ventas) + Casos de Clientes (Monitor de Operaciones)
"""
from fastapi import APIRouter, HTTPException, Depends, Header
from typing import Optional, List
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorDatabase
from utils.auth import decode_token
from bson import ObjectId
import random

router = APIRouter(prefix="/admin-ops", tags=["Admin · Centro de Gestión"])


# ───────────── Helper Dr. prefix ─────────────
def with_dr_prefix(name: Optional[str]) -> Optional[str]:
    """Aplica el prefijo 'Dr.' a un nombre si no lo tiene ya."""
    if not name:
        return name
    n = name.strip()
    lower = n.lower()
    if lower.startswith("dr.") or lower.startswith("dra.") or lower.startswith("dr ") or lower.startswith("dra "):
        return n
    return f"Dr. {n}"


async def get_db():
    from server import db
    return db


async def get_admin(
    authorization: Optional[str] = Header(None),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="No autenticado")
    payload = decode_token(authorization.replace("Bearer ", ""))
    if not payload:
        raise HTTPException(status_code=401, detail="Token inválido")
    user = await db.users.find_one({"email": payload["sub"]})
    if not user or user.get("role") not in ["admin", "admin_general", "socio_comercial"]:
        raise HTTPException(status_code=403, detail="Acceso denegado")
    user["_id"] = str(user["_id"])
    return user


def require_admin_general(admin):
    if admin["role"] not in ["admin", "admin_general"]:
        raise HTTPException(status_code=403, detail="Solo ADMIN_GENERAL puede realizar esta acción")


# ═══════════════════════════════════════════════════════════════════
# HEADER GLOBAL — Contadores en tiempo real
# ═══════════════════════════════════════════════════════════════════
@router.get("/header/stats")
async def header_stats(admin=Depends(get_admin), db: AsyncIOMotorDatabase = Depends(get_db)):
    pending_cases = await db.cases.count_documents({"assignment_status": "sin_asignar"})
    if pending_cases == 0:
        pending_cases = await db.cases.count_documents({"$or": [{"lawyer_id": None}, {"lawyer_id": ""}]})
    pending_partners = await db.users.count_documents({
        "role": "lawyer",
        "$or": [{"is_verified": False}, {"status": "PENDING_VERIFICATION"}, {"status": "PENDING_PAYMENT"}],
    })
    notifications_unread = await db.notifications.count_documents({
        "target": {"$in": ["admin", admin["_id"]]},
        "read": False,
    })

    return {
        "server_time": datetime.utcnow().isoformat(),
        "pending_cases": pending_cases,
        "pending_partners": pending_partners,
        "notifications_unread": notifications_unread,
    }


@router.get("/notifications")
async def list_notifications(admin=Depends(get_admin), db: AsyncIOMotorDatabase = Depends(get_db)):
    notes = await db.notifications.find({
        "target": {"$in": ["admin", admin["_id"]]},
    }).sort("created_at", -1).limit(40).to_list(40)
    return [
        {
            "id": str(n["_id"]),
            "type": n.get("type"),
            "title": n.get("title"),
            "message": n.get("message"),
            "read": n.get("read", False),
            "created_at": n.get("created_at").isoformat() if isinstance(n.get("created_at"), datetime) else None,
        }
        for n in notes
    ]


@router.post("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, admin=Depends(get_admin), db: AsyncIOMotorDatabase = Depends(get_db)):
    await db.notifications.update_one({"_id": ObjectId(notification_id)}, {"$set": {"read": True}})
    return {"ok": True}


# ═══════════════════════════════════════════════════════════════════
# VISTA A — SALA DE VENTAS · Gestión de Socios/Abogados
# ═══════════════════════════════════════════════════════════════════
@router.get("/sales/stats")
async def sales_stats(admin=Depends(get_admin), db: AsyncIOMotorDatabase = Depends(get_db)):
    total = await db.users.count_documents({"role": "lawyer"})
    in_process = await db.users.count_documents({
        "role": "lawyer",
        "$or": [{"status": "PENDING_VERIFICATION"}, {"status": "PENDING_PAYMENT"}, {"is_verified": False}],
    })
    active = await db.users.count_documents({
        "role": "lawyer",
        "is_verified": True,
        "status": {"$in": ["ACTIVE", "active"]},
    })
    rejected = await db.users.count_documents({"role": "lawyer", "status": "REJECTED"})

    return {
        "total_candidates": total,
        "in_process": in_process,
        "active_partners": active,
        "rejected": rejected,
    }


@router.get("/sales/candidates")
async def list_candidates(
    status_filter: Optional[str] = None,
    admin=Depends(get_admin),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    query = {"role": "lawyer"}
    if status_filter == "in_process":
        query["$or"] = [{"is_verified": False}, {"status": "PENDING_VERIFICATION"}, {"status": "PENDING_PAYMENT"}]
    elif status_filter == "active":
        query["is_verified"] = True
        query["status"] = {"$in": ["ACTIVE", "active"]}
    elif status_filter == "rejected":
        query["status"] = "REJECTED"

    users = await db.users.find(query).sort("created_at", -1).limit(200).to_list(200)
    return [_serialize_candidate(u) for u in users]


def _serialize_candidate(u: dict) -> dict:
    return {
        "id": str(u["_id"]),
        "email": u.get("email"),
        "full_name": with_dr_prefix(u.get("full_name")),
        "phone": u.get("phone"),
        "country": u.get("country"),
        "specialty": u.get("specialty"),
        "bar_number": u.get("bar_number"),
        "firm_name": u.get("firm_name"),
        "id_document": u.get("id_document"),
        "experience_years": u.get("experience_years"),
        "description": u.get("description"),
        "status": u.get("status", "PENDING_VERIFICATION"),
        "is_verified": bool(u.get("is_verified", False)),
        "is_online": bool(u.get("is_online", False)),
        "private_notes": u.get("private_notes", ""),
        "created_at": u.get("created_at").isoformat() if isinstance(u.get("created_at"), datetime) else None,
    }


@router.get("/sales/candidates/{candidate_id}")
async def get_candidate(candidate_id: str, admin=Depends(get_admin), db: AsyncIOMotorDatabase = Depends(get_db)):
    u = await db.users.find_one({"_id": ObjectId(candidate_id)})
    if not u:
        raise HTTPException(404, "Candidato no encontrado")
    return _serialize_candidate(u)


@router.post("/sales/candidates/{candidate_id}/approve")
async def approve_candidate(candidate_id: str, admin=Depends(get_admin), db: AsyncIOMotorDatabase = Depends(get_db)):
    require_admin_general(admin)
    res = await db.users.update_one(
        {"_id": ObjectId(candidate_id)},
        {"$set": {"is_verified": True, "status": "ACTIVE", "verified_at": datetime.utcnow(), "verified_by": admin["_id"], "updated_at": datetime.utcnow()}},
    )
    if res.matched_count == 0:
        raise HTTPException(404, "No encontrado")
    await db.notifications.insert_one({
        "target": candidate_id,
        "type": "account_approved",
        "title": "Cuenta aprobada",
        "message": "Tu acceso a Punto Cero Legal fue aprobado. ¡Bienvenido al equipo!",
        "read": False,
        "created_at": datetime.utcnow(),
    })
    return {"ok": True, "message": "Socio aprobado y activado"}


@router.post("/sales/candidates/{candidate_id}/reject")
async def reject_candidate(candidate_id: str, admin=Depends(get_admin), db: AsyncIOMotorDatabase = Depends(get_db)):
    require_admin_general(admin)
    await db.users.update_one(
        {"_id": ObjectId(candidate_id)},
        {"$set": {"status": "REJECTED", "is_verified": False, "updated_at": datetime.utcnow()}},
    )
    return {"ok": True, "message": "Candidato rechazado"}


@router.post("/sales/candidates/{candidate_id}/pending-payment")
async def mark_pending_payment(candidate_id: str, admin=Depends(get_admin), db: AsyncIOMotorDatabase = Depends(get_db)):
    require_admin_general(admin)
    await db.users.update_one(
        {"_id": ObjectId(candidate_id)},
        {"$set": {"status": "PENDING_PAYMENT", "is_verified": False, "updated_at": datetime.utcnow()}},
    )
    return {"ok": True, "message": "Marcado como pendiente de pago"}


@router.put("/sales/candidates/{candidate_id}/notes")
async def update_candidate_notes(candidate_id: str, payload: dict, admin=Depends(get_admin), db: AsyncIOMotorDatabase = Depends(get_db)):
    notes = (payload or {}).get("private_notes", "")
    await db.users.update_one(
        {"_id": ObjectId(candidate_id)},
        {"$set": {"private_notes": notes, "updated_at": datetime.utcnow()}},
    )
    return {"ok": True}


# Chat de seguimiento comercial
@router.get("/sales/candidates/{candidate_id}/chat")
async def get_candidate_chat(candidate_id: str, admin=Depends(get_admin), db: AsyncIOMotorDatabase = Depends(get_db)):
    messages = await db.sales_chat.find({"candidate_id": candidate_id}).sort("created_at", 1).limit(200).to_list(200)
    return [
        {
            "id": str(m["_id"]),
            "candidate_id": m["candidate_id"],
            "from_admin": m.get("from_admin", True),
            "admin_name": m.get("admin_name"),
            "content": m.get("content"),
            "created_at": m["created_at"].isoformat() if isinstance(m.get("created_at"), datetime) else None,
        }
        for m in messages
    ]


@router.post("/sales/candidates/{candidate_id}/chat")
async def send_candidate_chat(candidate_id: str, payload: dict, admin=Depends(get_admin), db: AsyncIOMotorDatabase = Depends(get_db)):
    content = (payload or {}).get("content", "").strip()
    if not content:
        raise HTTPException(400, "Mensaje vacío")
    msg = {
        "candidate_id": candidate_id,
        "from_admin": True,
        "admin_id": admin["_id"],
        "admin_name": admin.get("full_name"),
        "content": content,
        "created_at": datetime.utcnow(),
    }
    res = await db.sales_chat.insert_one(msg)
    msg["_id"] = str(res.inserted_id)
    msg["id"] = msg["_id"]
    msg["created_at"] = msg["created_at"].isoformat()
    del msg["_id"]
    return msg


# ═══════════════════════════════════════════════════════════════════
# VISTA B — MONITOR DE OPERACIONES · Routing Inteligente de Casos
# ═══════════════════════════════════════════════════════════════════
PRIORITY_MAP_IN = {"high": "alta", "urgent": "alta", "medium": "media", "low": "baja", "alta": "alta", "media": "media", "baja": "baja"}


@router.get("/operations/stats")
async def operations_stats(admin=Depends(get_admin), db: AsyncIOMotorDatabase = Depends(get_db)):
    sin_asignar = await db.cases.count_documents({"assignment_status": "sin_asignar"})
    asignados = await db.cases.count_documents({"assignment_status": "asignado"})
    atendidos = await db.cases.count_documents({"assignment_status": "atendido"})
    total = await db.cases.count_documents({})
    by_prio = {
        "alta": await db.cases.count_documents({"priority_label": "alta"}),
        "media": await db.cases.count_documents({"priority_label": "media"}),
        "baja": await db.cases.count_documents({"priority_label": "baja"}),
    }
    return {
        "total": total,
        "sin_asignar": sin_asignar,
        "asignados": asignados,
        "atendidos": atendidos,
        "by_priority": by_prio,
    }


@router.get("/operations/cases")
async def list_operations_cases(
    priority: Optional[str] = None,
    assignment_status: Optional[str] = None,
    admin=Depends(get_admin),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    query = {}
    if priority and priority != "all":
        query["priority_label"] = priority
    if assignment_status and assignment_status != "all":
        query["assignment_status"] = assignment_status

    cases = await db.cases.find(query).sort("created_at", -1).limit(300).to_list(300)
    return [await _serialize_case(c, db) for c in cases]


async def _serialize_case(c: dict, db) -> dict:
    lawyer_name = None
    lawyer_phone = None
    if c.get("lawyer_id"):
        lawyer = await db.users.find_one({"_id": ObjectId(c["lawyer_id"])}) if ObjectId.is_valid(str(c["lawyer_id"])) else None
        if lawyer:
            lawyer_name = with_dr_prefix(lawyer.get("full_name"))
            lawyer_phone = lawyer.get("phone")

    client_name = None
    client_phone = None
    if c.get("client_id"):
        client = await db.users.find_one({"_id": ObjectId(c["client_id"])}) if ObjectId.is_valid(str(c["client_id"])) else None
        if client:
            client_name = client.get("full_name")
            client_phone = client.get("phone")

    return {
        "id": str(c["_id"]),
        "case_number": c.get("case_number", "—"),
        "title": c.get("title", "Sin título"),
        "description": c.get("description", ""),
        "legal_area": c.get("legal_area", "—"),
        "priority": c.get("priority", "medium"),
        "priority_label": c.get("priority_label", PRIORITY_MAP_IN.get(c.get("priority", "medium"), "media")),
        "assignment_status": c.get("assignment_status", "sin_asignar" if not c.get("lawyer_id") else "asignado"),
        "status": c.get("status", "open"),
        "lawyer_id": c.get("lawyer_id"),
        "lawyer_name": lawyer_name,
        "lawyer_phone": lawyer_phone,
        "client_id": c.get("client_id"),
        "client_name": client_name or c.get("client_name", "Cliente"),
        "client_phone": client_phone or c.get("client_phone"),
        "private_notes": c.get("private_notes", ""),
        "created_at": c["created_at"].isoformat() if isinstance(c.get("created_at"), datetime) else None,
    }


@router.post("/operations/cases/{case_id}/auto-assign")
async def auto_assign_case(case_id: str, admin=Depends(get_admin), db: AsyncIOMotorDatabase = Depends(get_db)):
    """Routing Inteligente: asigna automáticamente a abogado online con la especialidad correcta."""
    case = await db.cases.find_one({"_id": ObjectId(case_id)})
    if not case:
        raise HTTPException(404, "Caso no encontrado")

    legal_area = case.get("legal_area", "")

    # Buscar abogados online + especialidad coincidente + activos
    candidates = await db.users.find({
        "role": "lawyer",
        "is_verified": True,
        "is_online": True,
        "specialty": legal_area,
    }).to_list(50)

    # Fallback: cualquier abogado activo con la especialidad
    if not candidates:
        candidates = await db.users.find({
            "role": "lawyer",
            "is_verified": True,
            "specialty": legal_area,
        }).to_list(50)

    if not candidates:
        # No match → marcar sin asignar (rojo)
        await db.cases.update_one(
            {"_id": ObjectId(case_id)},
            {"$set": {"assignment_status": "sin_asignar", "lawyer_id": None, "updated_at": datetime.utcnow()}},
        )
        return {"ok": False, "matched": False, "message": "No hay abogado disponible. Caso marcado SIN ASIGNAR para intervención manual."}

    chosen = random.choice(candidates)
    chosen_id = str(chosen["_id"])

    await db.cases.update_one(
        {"_id": ObjectId(case_id)},
        {"$set": {
            "lawyer_id": chosen_id,
            "assignment_status": "asignado",
            "assigned_at": datetime.utcnow(),
            "assigned_by": admin["_id"],
            "updated_at": datetime.utcnow(),
        }},
    )
    # Notificación inmediata al abogado
    await db.notifications.insert_one({
        "target": chosen_id,
        "type": "case_assigned",
        "title": "Nuevo caso asignado",
        "message": f"Se te asignó el caso «{case.get('title', 'Caso')}» ({legal_area}).",
        "case_id": case_id,
        "read": False,
        "created_at": datetime.utcnow(),
    })
    return {
        "ok": True,
        "matched": True,
        "lawyer_id": chosen_id,
        "lawyer_name": with_dr_prefix(chosen.get("full_name")),
        "message": f"Caso asignado a {with_dr_prefix(chosen.get('full_name'))}",
    }


@router.post("/operations/cases/{case_id}/assign")
async def manual_assign_case(case_id: str, payload: dict, admin=Depends(get_admin), db: AsyncIOMotorDatabase = Depends(get_db)):
    lawyer_id = (payload or {}).get("lawyer_id")
    if not lawyer_id:
        raise HTTPException(400, "lawyer_id requerido")
    lawyer = await db.users.find_one({"_id": ObjectId(lawyer_id)})
    if not lawyer:
        raise HTTPException(404, "Abogado no encontrado")

    await db.cases.update_one(
        {"_id": ObjectId(case_id)},
        {"$set": {
            "lawyer_id": lawyer_id,
            "assignment_status": "asignado",
            "assigned_at": datetime.utcnow(),
            "assigned_by": admin["_id"],
            "updated_at": datetime.utcnow(),
        }},
    )
    await db.notifications.insert_one({
        "target": lawyer_id,
        "type": "case_assigned_manual",
        "title": "Caso asignado",
        "message": f"Te asignaron un caso manualmente. Revisa tu panel.",
        "case_id": case_id,
        "read": False,
        "created_at": datetime.utcnow(),
    })
    return {"ok": True, "message": f"Caso asignado a {with_dr_prefix(lawyer.get('full_name'))}"}


@router.post("/operations/cases/{case_id}/attended")
async def mark_case_attended(case_id: str, admin=Depends(get_admin), db: AsyncIOMotorDatabase = Depends(get_db)):
    await db.cases.update_one(
        {"_id": ObjectId(case_id)},
        {"$set": {"assignment_status": "atendido", "attended_at": datetime.utcnow(), "updated_at": datetime.utcnow()}},
    )
    return {"ok": True}


@router.put("/operations/cases/{case_id}/notes")
async def case_private_notes(case_id: str, payload: dict, admin=Depends(get_admin), db: AsyncIOMotorDatabase = Depends(get_db)):
    notes = (payload or {}).get("private_notes", "")
    await db.cases.update_one(
        {"_id": ObjectId(case_id)},
        {"$set": {"private_notes": notes, "updated_at": datetime.utcnow()}},
    )
    return {"ok": True}


@router.put("/operations/cases/{case_id}/priority")
async def update_case_priority(case_id: str, payload: dict, admin=Depends(get_admin), db: AsyncIOMotorDatabase = Depends(get_db)):
    priority_label = (payload or {}).get("priority_label", "media")
    if priority_label not in {"alta", "media", "baja"}:
        raise HTTPException(400, "priority_label inválido")
    await db.cases.update_one(
        {"_id": ObjectId(case_id)},
        {"$set": {"priority_label": priority_label, "updated_at": datetime.utcnow()}},
    )
    return {"ok": True}


# ═══════════════════════════════════════════════════════════════════
# GESTIÓN DE TALENTO — CRUD abogados (solo ADMIN_GENERAL)
# ═══════════════════════════════════════════════════════════════════
@router.get("/talent")
async def list_talent(admin=Depends(get_admin), db: AsyncIOMotorDatabase = Depends(get_db)):
    require_admin_general(admin)
    lawyers = await db.users.find({"role": "lawyer"}).sort("created_at", -1).limit(500).to_list(500)
    return [_serialize_candidate(u) for u in lawyers]


@router.put("/talent/{lawyer_id}")
async def update_talent(lawyer_id: str, payload: dict, admin=Depends(get_admin), db: AsyncIOMotorDatabase = Depends(get_db)):
    require_admin_general(admin)
    allowed = {"full_name", "phone", "country", "specialty", "bar_number", "firm_name", "id_document", "experience_years", "description", "status", "is_verified", "is_online"}
    update = {k: v for k, v in (payload or {}).items() if k in allowed}
    update["updated_at"] = datetime.utcnow()
    await db.users.update_one({"_id": ObjectId(lawyer_id)}, {"$set": update})
    return {"ok": True}


@router.delete("/talent/{lawyer_id}")
async def delete_talent(lawyer_id: str, admin=Depends(get_admin), db: AsyncIOMotorDatabase = Depends(get_db)):
    require_admin_general(admin)
    res = await db.users.delete_one({"_id": ObjectId(lawyer_id), "role": "lawyer"})
    if res.deleted_count == 0:
        raise HTTPException(404, "Abogado no encontrado")
    return {"ok": True}


# ═══════════════════════════════════════════════════════════════════
# FACTURACIÓN — Estados: pendiente, finalizada, no_terminada
# ═══════════════════════════════════════════════════════════════════
BILLING_STATUS_MAP = {
    "draft": "pendiente",
    "sent": "pendiente",
    "pending": "pendiente",
    "overdue": "no_terminada",
    "paid": "finalizada",
}


@router.get("/billing")
async def list_billing(
    status_filter: Optional[str] = None,
    admin=Depends(get_admin),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    invoices = await db.invoices.find({}).sort("created_at", -1).limit(300).to_list(300)
    result = []
    for inv in invoices:
        mapped = BILLING_STATUS_MAP.get(inv.get("status", "draft"), "pendiente")
        if status_filter and status_filter != "all" and mapped != status_filter:
            continue
        result.append({
            "id": str(inv["_id"]),
            "invoice_number": inv.get("invoice_number", "—"),
            "case_id": inv.get("case_id"),
            "client_id": inv.get("client_id"),
            "lawyer_id": inv.get("lawyer_id"),
            "description": inv.get("description", ""),
            "amount": inv.get("amount", 0),
            "status": mapped,
            "raw_status": inv.get("status"),
            "due_date": inv["due_date"].isoformat() if isinstance(inv.get("due_date"), datetime) else str(inv.get("due_date", "")),
            "created_at": inv["created_at"].isoformat() if isinstance(inv.get("created_at"), datetime) else None,
        })
    return result


@router.post("/billing/{invoice_id}/reminder")
async def send_reminder(invoice_id: str, admin=Depends(get_admin), db: AsyncIOMotorDatabase = Depends(get_db)):
    inv = await db.invoices.find_one({"_id": ObjectId(invoice_id)})
    if not inv:
        raise HTTPException(404, "Factura no encontrada")
    await db.audit_logs.insert_one({
        "action": "billing_reminder_sent",
        "admin_id": admin["_id"],
        "invoice_id": invoice_id,
        "timestamp": datetime.utcnow(),
    })
    return {"ok": True, "message": "Recordatorio enviado (mock — sin SMTP activo)"}


@router.post("/billing/{invoice_id}/send")
async def send_invoice(invoice_id: str, admin=Depends(get_admin), db: AsyncIOMotorDatabase = Depends(get_db)):
    inv = await db.invoices.find_one({"_id": ObjectId(invoice_id)})
    if not inv:
        raise HTTPException(404, "Factura no encontrada")
    await db.invoices.update_one(
        {"_id": ObjectId(invoice_id)},
        {"$set": {"status": "sent", "updated_at": datetime.utcnow()}},
    )
    return {"ok": True, "message": "Factura enviada (mock — sin SMTP activo)"}


# ═══════════════════════════════════════════════════════════════════
# SEEDING — Casos demo para visualizar Monitor de Operaciones
# ═══════════════════════════════════════════════════════════════════
@router.post("/seed/demo-cases")
async def seed_demo_cases(admin=Depends(get_admin), db: AsyncIOMotorDatabase = Depends(get_db)):
    """Crea casos demo si no existen (solo ADMIN_GENERAL)."""
    require_admin_general(admin)
    existing = await db.cases.count_documents({"is_demo": True})
    if existing > 0:
        return {"ok": True, "message": f"Ya existen {existing} casos demo", "created": 0}

    samples = [
        {"title": "Divorcio contencioso con custodia", "legal_area": "Derecho de Familia", "priority_label": "alta", "client_name": "Carolina Méndez", "client_phone": "+57 3104567890", "description": "Cliente solicita asesoría urgente para divorcio con menor de edad."},
        {"title": "Despido injustificado", "legal_area": "Derecho Laboral", "priority_label": "alta", "client_name": "Juan Restrepo", "client_phone": "+57 3208123456", "description": "Reclamo por terminación sin justa causa, 8 años de antigüedad."},
        {"title": "Contrato de arrendamiento comercial", "legal_area": "Derecho Comercial", "priority_label": "media", "client_name": "Sofía Pardo", "client_phone": "+58 4128765432", "description": "Revisión y redacción de contrato de local en Caracas."},
        {"title": "Sucesión testada", "legal_area": "Derecho Civil", "priority_label": "media", "client_name": "Luis Aranda", "client_phone": "+52 5523456789", "description": "Apertura de sucesión con dos herederos."},
        {"title": "Defensa penal por estafa", "legal_area": "Derecho Penal", "priority_label": "alta", "client_name": "Ricardo Núñez", "client_phone": "+56 9 9876 5432", "description": "Imputado en proceso por estafa, requiere defensa inmediata."},
        {"title": "Tutela por servicio de salud", "legal_area": "Derecho Civil", "priority_label": "alta", "client_name": "María Téllez", "client_phone": "+57 3157894561", "description": "EPS niega tratamiento oncológico, urgente."},
        {"title": "Consulta migratoria USA", "legal_area": "Derecho Migratorio", "priority_label": "baja", "client_name": "Andrés Cano", "client_phone": "+1 305 234 5678", "description": "Cliente busca visa de trabajo H1B."},
        {"title": "Acuerdo de no competencia", "legal_area": "Derecho Corporativo", "priority_label": "baja", "client_name": "Pamela Cruz", "client_phone": "+54 11 5678 9012", "description": "Redacción de cláusula NDA para empresa tech."},
        {"title": "Reclamación tributaria", "legal_area": "Derecho Tributario", "priority_label": "media", "client_name": "Empresa BizCol SAS", "client_phone": "+57 3009876543", "description": "DIAN notificó liquidación de revisión, $230M COP."},
        {"title": "Demanda por incumplimiento contractual", "legal_area": "Derecho Civil", "priority_label": "media", "client_name": "Construcciones Vega", "client_phone": "+51 998 765 432", "description": "Proveedor incumplió entrega, demanda por $40M."},
    ]
    docs = []
    now = datetime.utcnow()
    from utils.case_number_generator import generate_case_number
    for i, s in enumerate(samples):
        docs.append({
            "case_number": generate_case_number(),
            "title": s["title"],
            "description": s["description"],
            "legal_area": s["legal_area"],
            "priority": "high" if s["priority_label"] == "alta" else "medium" if s["priority_label"] == "media" else "low",
            "priority_label": s["priority_label"],
            "status": "open",
            "assignment_status": "sin_asignar",
            "lawyer_id": None,
            "client_id": None,
            "client_name": s["client_name"],
            "client_phone": s["client_phone"],
            "is_demo": True,
            "created_at": now - timedelta(hours=i * 2),
            "updated_at": now,
        })
    await db.cases.insert_many(docs)
    return {"ok": True, "created": len(docs)}


@router.post("/seed/demo-invoices")
async def seed_demo_invoices(admin=Depends(get_admin), db: AsyncIOMotorDatabase = Depends(get_db)):
    require_admin_general(admin)
    existing = await db.invoices.count_documents({"is_demo": True})
    if existing > 0:
        return {"ok": True, "message": f"Ya existen {existing} facturas demo", "created": 0}
    now = datetime.utcnow()
    samples = [
        {"invoice_number": "INV-2026-0001", "amount": 1_250_000, "status": "sent", "description": "Honorarios divorcio Méndez", "due_date": now + timedelta(days=15)},
        {"invoice_number": "INV-2026-0002", "amount": 3_500_000, "status": "paid", "description": "Defensa laboral Restrepo", "due_date": now - timedelta(days=5)},
        {"invoice_number": "INV-2026-0003", "amount": 850_000, "status": "overdue", "description": "Sucesión Aranda", "due_date": now - timedelta(days=20)},
        {"invoice_number": "INV-2026-0004", "amount": 4_200_000, "status": "sent", "description": "Reclamación tributaria BizCol", "due_date": now + timedelta(days=30)},
        {"invoice_number": "INV-2026-0005", "amount": 1_900_000, "status": "draft", "description": "Tutela Téllez", "due_date": now + timedelta(days=10)},
        {"invoice_number": "INV-2026-0006", "amount": 2_800_000, "status": "paid", "description": "NDA Pamela Cruz", "due_date": now - timedelta(days=12)},
    ]
    for s in samples:
        await db.invoices.insert_one({
            **s,
            "is_demo": True,
            "created_at": now,
            "updated_at": now,
        })
    return {"ok": True, "created": len(samples)}


# ═══════════════════════════════════════════════════════════════════
# MÉTRICAS GEOGRÁFICAS — Ventas por país + Estrategias Activas
# ═══════════════════════════════════════════════════════════════════
LATAM_STRATEGIES = {
    "Colombia": "Expansión bufetes regionales · Red B2B",
    "México": "Alianzas notariales · Migración USA",
    "Argentina": "Foco corporativo · Buenos Aires + Córdoba",
    "Chile": "Premium suscripciones · Santiago Metro",
    "Perú": "Crecimiento orgánico · Lima + Arequipa",
    "Venezuela": "Asesoría migratoria · Caracas + Valencia",
    "Ecuador": "Tributario PYMES · Quito",
    "Bolivia": "Inicio mercado · Santa Cruz",
    "Uruguay": "Boutique · Montevideo",
    "Paraguay": "Onboarding piloto · Asunción",
    "República Dominicana": "Turismo legal · Punta Cana",
    "Panamá": "Offshore corporativo · Panama City",
    "Costa Rica": "Tech compliance · San José",
    "Guatemala": "Penal urbano · Guatemala City",
    "Honduras": "Migración + laboral",
    "El Salvador": "Cripto-legal · San Salvador",
    "Nicaragua": "Onboarding piloto",
    "Cuba": "Asesoría diaspora",
    "Puerto Rico": "Bilingüe USA-LATAM",
    "Brasil": "Expansión idioma · São Paulo (próximamente)",
    "United States": "Hispano-US · Miami + Houston",
}


@router.get("/geography/stats")
async def geography_stats(admin=Depends(get_admin), db: AsyncIOMotorDatabase = Depends(get_db)):
    """Ventas por país (abogados activos + suscripciones cobradas) + estrategias activas por región."""
    # Abogados por país
    pipeline = [
        {"$match": {"role": "lawyer"}},
        {"$group": {"_id": "$country", "lawyers": {"$sum": 1}, "active": {"$sum": {"$cond": [{"$eq": ["$is_verified", True]}, 1, 0]}}}},
        {"$sort": {"lawyers": -1}},
    ]
    countries_cur = db.users.aggregate(pipeline)
    countries_raw = await countries_cur.to_list(50)

    # Casos por país de cliente — derivado del país del abogado asignado o del país en client_phone
    case_pipeline = [
        {"$lookup": {"from": "users", "let": {"lid": "$lawyer_id"}, "pipeline": [{"$match": {"$expr": {"$eq": [{"$toString": "$_id"}, "$$lid"]}}}], "as": "lawyer"}},
        {"$unwind": {"path": "$lawyer", "preserveNullAndEmptyArrays": True}},
        {"$group": {"_id": "$lawyer.country", "cases": {"$sum": 1}}},
    ]
    case_cur = db.cases.aggregate(case_pipeline)
    case_rows = await case_cur.to_list(50)
    cases_by_country = {r["_id"]: r["cases"] for r in case_rows if r.get("_id")}

    # Ingresos por país (a partir de invoices.country si existe)
    revenue_pipeline = [
        {"$match": {"status": "paid"}},
        {"$group": {"_id": "$country", "revenue": {"$sum": "$amount"}}},
    ]
    rev_cur = db.invoices.aggregate(revenue_pipeline)
    rev_rows = await rev_cur.to_list(50)
    revenue_by_country = {r["_id"]: float(r["revenue"]) for r in rev_rows if r.get("_id")}

    countries = []
    for c in countries_raw:
        name = c["_id"] or "—"
        countries.append({
            "country": name,
            "lawyers": c["lawyers"],
            "active_lawyers": c["active"],
            "cases": cases_by_country.get(name, 0),
            "revenue": revenue_by_country.get(name, 0),
            "strategy": LATAM_STRATEGIES.get(name, "Mercado en evaluación"),
        })

    return {"countries": countries, "total_countries": len(countries)}

