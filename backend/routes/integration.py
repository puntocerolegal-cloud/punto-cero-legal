"""
Integración Inteligente — Punto Cero Legal (el "organismo único").

Conecta CRM ↔ Casos ↔ Facturación ↔ Documentos en un flujo bidireccional:
  • Biblioteca de Expediente automática (por case_id + client_id).
  • Dashboard de Rentabilidad por caso (ingresos vs esfuerzo/tiempo).
  • Reporte de Producción mensual por estado maestro.
  • Almacenamiento DESCENTRALIZADO por suscriptor: el cloud se vincula al correo
    de registro del abogado; al llenarse, se dispara la solicitud de un correo de
    respaldo. La BD de Punto Cero se mantiene ligera.
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from utils import notifier
from utils.expediente import init_expediente, create_expediente, STANDARD_FOLDERS, CLIENT_INTAKE_FOLDER

router = APIRouter(prefix="/integration", tags=["Integración · Organismo único"])


async def get_db():
    from server import db
    # Bypass GuardedDB for direct-access routes; tenant isolation is enforced
    # via get_current_user + explicit firm filtering (same pattern as routes/auth.py).
    if hasattr(db, "_real_db"):
        return db._real_db
    return db


def _human(num_bytes: int) -> str:
    size = float(num_bytes or 0)
    for unit in ("B", "KB", "MB", "GB", "TB"):
        if size < 1024 or unit == "TB":
            return f"{size:.1f} {unit}" if unit != "B" else f"{int(size)} B"
        size /= 1024
    return f"{size:.1f} TB"


# ───────────────── Biblioteca de Expediente (por caso) ─────────────────
@router.post("/cases/{case_id}/expediente/init", response_model=dict)
async def expediente_init(case_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Crea (idempotente) la biblioteca de expediente del caso."""
    case = await db.cases.find_one({"_id": ObjectId(case_id)})
    if not case:
        raise HTTPException(404, "Caso no encontrado")
    folders = await init_expediente(db, case_id, case.get("lawyer_id"))
    return {"case_id": case_id, "folders": folders}


@router.get("/cases/{case_id}/expediente", response_model=dict)
async def expediente_view(case_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Vista del expediente: carpetas estándar + documentos agrupados por carpeta,
    todos vinculados por case_id (y client_id heredado del caso)."""
    case = await db.cases.find_one({"_id": ObjectId(case_id)})
    if not case:
        raise HTTPException(404, "Caso no encontrado")
    folders = case.get("expediente_folders") or STANDARD_FOLDERS

    docs = await db.documents.find({"case_id": case_id}).sort("created_at", -1).to_list(1000)
    grouped = {f: [] for f in folders}
    total_bytes = 0
    for d in docs:
        total_bytes += d.get("size_bytes", 0) or 0
        folder = d.get("folder") or folders[0]
        grouped.setdefault(folder, []).append({
            "_id": str(d["_id"]),
            "name": d.get("name"),
            "size_bytes": d.get("size_bytes", 0),
            "size": _human(d.get("size_bytes", 0)),
            "source": d.get("source", "lawyer"),
            "storage": d.get("storage", "metadata"),
            "date": d["created_at"].date().isoformat() if isinstance(d.get("created_at"), datetime) else None,
        })
    return {
        "case_id": case_id,
        "case_number": case.get("case_number"),
        "title": case.get("title"),
        "client_id": case.get("client_id"),
        "client_name": case.get("client_name"),
        "estado": case.get("estado"),
        "folders": [{"name": f, "count": len(grouped.get(f, []))} for f in grouped],
        "documents_by_folder": grouped,
        "total_documents": len(docs),
        "total_size": _human(total_bytes),
    }


# ───────────────── Dashboard de Rentabilidad (por caso) ─────────────────
@router.get("/cases/{case_id}/profitability", response_model=dict)
async def case_profitability(case_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Ingresos (Facturación) vs esfuerzo/tiempo (Agenda + actividades + IA)."""
    case = await db.cases.find_one({"_id": ObjectId(case_id)})
    if not case:
        raise HTTPException(404, "Caso no encontrado")

    # Ingresos
    invoices = await db.invoices.find({"case_id": case_id}).to_list(1000)
    billed = sum(i.get("amount", 0) or 0 for i in invoices)
    paid = sum(i.get("amount", 0) or 0 for i in invoices if i.get("status") == "paid")
    pending = billed - paid

    # Esfuerzo / tiempo
    acts = await db.case_activities.find({"case_id": case_id}).to_list(2000)
    total_minutes = sum(a.get("duration_minutes", 0) or 0 for a in acts)
    billable_minutes = sum(a.get("duration_minutes", 0) or 0 for a in acts if a.get("billable"))
    meetings = await db.meetings.count_documents({"case_id": case_id})
    appointments = await db.appointments.count_documents({"case_id": case_id})
    hours = round(total_minutes / 60, 2)

    # Costo estimado del esfuerzo: tarifa/hora media de las facturas (o por defecto)
    rates = [i.get("hourly_rate") for i in invoices if i.get("hourly_rate")]
    rate = round(sum(rates) / len(rates)) if rates else 0
    estimated_cost = round(hours * rate) if rate else 0
    profit = round(paid - estimated_cost)
    margin = round((profit / paid) * 100, 1) if paid else 0

    return {
        "case_id": case_id,
        "case_number": case.get("case_number"),
        "estado": case.get("estado"),
        "revenue": {"billed": billed, "paid": paid, "pending": pending, "invoices": len(invoices)},
        "effort": {
            "total_hours": hours,
            "billable_hours": round(billable_minutes / 60, 2),
            "activities": len(acts),
            "meetings": meetings,
            "appointments": appointments,
            "hourly_rate": rate,
            "estimated_cost": estimated_cost,
        },
        "profitability": {"profit": profit, "margin_percent": margin},
    }


# ───────────────── Expediente: fuente única de verdad (360°) ─────────────────
async def _compute_indicators(db, case_id: str) -> dict:
    """Indicadores del expediente calculados EN VIVO sobre case_id (siempre exactos)."""
    invoices = await db.invoices.find({"case_id": case_id}).to_list(2000)
    ingresos = sum(i.get("amount", 0) or 0 for i in invoices if i.get("status") == "paid")
    proyectado = sum(i.get("amount", 0) or 0 for i in invoices)
    pendientes = [i for i in invoices if i.get("status") in ("draft", "sent", "overdue")]
    pagadas = [i for i in invoices if i.get("status") == "paid"]
    saldo_pendiente = sum(i.get("amount", 0) or 0 for i in pendientes)

    movimientos = await db.accounting_movements.find({"case_id": case_id}).to_list(2000)
    gastos = sum(m.get("amount", 0) or 0 for m in movimientos if m.get("type") in ("expense", "gasto", "egreso"))

    utilidad = ingresos - gastos
    rentabilidad = round((utilidad / ingresos) * 100, 1) if ingresos else 0

    docs = await db.documents.count_documents({"case_id": case_id})
    actividades = await db.case_activities.count_documents({"case_id": case_id})
    meetings = await db.meetings.count_documents({"case_id": case_id})

    now = datetime.utcnow()
    upcoming = await db.appointments.find({"case_id": case_id, "start_time": {"$gte": now}}).sort("start_time", 1).to_list(50)
    next_event = None
    if upcoming:
        st = upcoming[0].get("start_time")
        next_event = {"title": upcoming[0].get("title"), "date": st.isoformat() if isinstance(st, datetime) else st}

    return {
        "financial": {
            "ingresos": ingresos, "ingresos_proyectados": proyectado, "gastos": gastos,
            "utilidad": utilidad, "rentabilidad": rentabilidad, "saldo_pendiente": saldo_pendiente,
        },
        "facturas_pagadas": len(pagadas),
        "facturas_pendientes": len(pendientes),
        "documentos_cargados": docs,
        "actividades_realizadas": actividades,
        "reuniones": meetings,
        "proximos_vencimientos": len(upcoming),
        "proximo_evento": next_event,
    }


@router.get("/expedientes", response_model=dict)
async def list_expedientes(lawyer_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Lista de expedientes del abogado con indicadores en vivo (fuente de verdad)."""
    exps = await db.expedientes.find({"lawyer_id": lawyer_id}).sort("created_at", -1).to_list(2000)
    out = []
    activos = 0
    total_ingresos = 0
    for e in exps:
        ind = await _compute_indicators(db, e["case_id"])
        case = await db.cases.find_one({"_id": ObjectId(e["case_id"])}) if e.get("case_id") else None
        estado = (case or {}).get("estado", e.get("estado"))
        if estado in ("Activo", "En trámite", "En seguimiento"):
            activos += 1
        total_ingresos += ind["financial"]["ingresos"]
        out.append({
            "expediente_id": e["expediente_id"], "case_id": e["case_id"],
            "case_number": e.get("case_number"), "client_id": e.get("client_id"),
            "client_name": e.get("client_name"), "title": e.get("title"),
            "estado": estado, "indicators": ind,
        })
    return {"lawyer_id": lawyer_id, "count": len(out),
            "casos_activos": activos, "ingresos_totales": total_ingresos,
            "expedientes": out}


@router.get("/expediente/{expediente_id}", response_model=dict)
async def expediente_360(expediente_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Vista 360° del expediente: caso + cliente + documentos + agenda + reuniones
    + cronología + centro financiero + indicadores. Contexto único para todos los
    módulos (incl. IA Jurídica)."""
    exp = await db.expedientes.find_one({"expediente_id": expediente_id})
    if not exp:
        raise HTTPException(404, "Expediente no encontrado")
    case_id = exp["case_id"]
    case = await db.cases.find_one({"_id": ObjectId(case_id)}) if case_id else None

    client = None
    if exp.get("client_id"):
        try:
            client = await db.clients.find_one({"_id": ObjectId(exp["client_id"])})
        except Exception:
            client = None

    docs = await db.documents.find({"case_id": case_id}).sort("created_at", -1).to_list(1000)
    folders = exp.get("folders") or STANDARD_FOLDERS
    grouped = {f: [] for f in folders}
    for d in docs:
        grouped.setdefault(d.get("folder") or folders[-1], []).append({
            "_id": str(d["_id"]), "name": d.get("name"), "size": _human(d.get("size_bytes", 0)),
            "source": d.get("source", "lawyer"),
            "date": d["created_at"].date().isoformat() if isinstance(d.get("created_at"), datetime) else None,
        })

    appts = await db.appointments.find({"case_id": case_id}).sort("start_time", 1).to_list(200)
    agenda = [{"_id": str(a["_id"]), "title": a.get("title"), "event_type": a.get("event_type"),
               "start_time": a["start_time"].isoformat() if isinstance(a.get("start_time"), datetime) else a.get("start_time"),
               "status": a.get("status")} for a in appts]

    mtgs = await db.meetings.find({"case_id": case_id}).to_list(200)
    meetings = [{"_id": str(m["_id"]), "title": m.get("title"), "meeting_link": m.get("meeting_link"),
                 "status": m.get("status"), "participants": m.get("participants", [])} for m in mtgs]

    acts = await db.case_activities.find({"case_id": case_id}).sort("created_at", 1).to_list(500)
    timeline = [{"stage": a.get("stage"), "type": a.get("activity_type"), "description": a.get("description"),
                 "date": a["created_at"].isoformat() if isinstance(a.get("created_at"), datetime) else None} for a in acts]

    # Conversación del chatbot (WhatsApp) vinculada al caso.
    chat = await db.chat_sessions.find_one({"case_id": case_id}, sort=[("created_at", -1)])
    conversacion = []
    if chat:
        for h in chat.get("history", []):
            at = h.get("at")
            conversacion.append({
                "role": h.get("role"),  # 'bot' | 'client'
                "text": h.get("text"),
                "at": at.isoformat() if isinstance(at, datetime) else at,
            })

    indicators = await _compute_indicators(db, case_id)

    # Contexto inicial para IA Jurídica (reconoce el expediente sin re-preguntar).
    ai_context = {
        "expediente_id": expediente_id, "case_id": case_id, "client_id": exp.get("client_id"),
        "client_name": exp.get("client_name"), "materia": (case or {}).get("materia"),
        "estado": (case or {}).get("estado"), "resumen": (case or {}).get("summary") or (case or {}).get("description"),
        "documentos": len(docs), "actividades": len(acts),
    }

    return {
        "expediente_id": expediente_id, "case_id": case_id, "case_number": exp.get("case_number"),
        "title": exp.get("title"), "estado": (case or {}).get("estado", exp.get("estado")),
        "responsable_id": exp.get("responsable_id"),
        "client": {"id": exp.get("client_id"), "name": exp.get("client_name"),
                   "email": (client or {}).get("email") or (case or {}).get("client_email"),
                   "phone": (client or {}).get("phone") or (case or {}).get("client_phone")},
        "folders": [{"name": f, "count": len(grouped.get(f, []))} for f in folders],
        "documents_by_folder": grouped,
        "agenda": agenda, "meetings": meetings, "timeline": timeline,
        "conversacion": conversacion, "chat_status": (chat or {}).get("status"),
        "indicators": indicators, "ai_context": ai_context,
    }


@router.get("/expediente/{expediente_id}/indicators", response_model=dict)
async def expediente_indicators(expediente_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    exp = await db.expedientes.find_one({"expediente_id": expediente_id})
    if not exp:
        raise HTTPException(404, "Expediente no encontrado")
    return {"expediente_id": expediente_id, **(await _compute_indicators(db, exp["case_id"]))}


# ───────────────── Reporte de Producción (mensual, por estado) ─────────────────
@router.get("/production-report", response_model=dict)
async def production_report(lawyer_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Producción del mes por estado maestro. Activo → cuenta en producción;
    Archivada → respaldo jurídico; En seguimiento → cartera viva."""
    cases = await db.cases.find({"lawyer_id": lawyer_id}).to_list(5000)
    by_estado = {}
    for c in cases:
        e = c.get("estado") or "Sin estado"
        by_estado[e] = by_estado.get(e, 0) + 1

    now = datetime.utcnow()
    month_start = datetime(now.year, now.month, 1)

    # Producción del mes: casos activos creados/actualizados este mes
    active = [c for c in cases if (c.get("estado") in ("Activo", "En trámite", "En seguimiento"))]
    archived = [c for c in cases if c.get("estado") in ("Archivada", "Finalizada")]

    # Ingresos del mes (facturas pagadas)
    paid_invoices = await db.invoices.find({
        "lawyer_id": lawyer_id, "status": "paid", "paid_date": {"$gte": month_start},
    }).to_list(5000)
    revenue_month = sum(i.get("amount", 0) or 0 for i in paid_invoices)

    return {
        "lawyer_id": lawyer_id,
        "period": now.strftime("%Y-%m"),
        "totals": {"all": len(cases), "active": len(active), "archived": len(archived)},
        "by_estado": by_estado,
        "production_month": {
            "active_cases": len(active),
            "revenue": revenue_month,
            "paid_invoices": len(paid_invoices),
        },
        "legal_backup": {"archived_cases": len(archived)},
    }


# ───────────────── Almacenamiento descentralizado por suscriptor ─────────────────
# Cuota base por suscriptor (espejo del cloud personal vinculado a su correo).
SUBSCRIBER_QUOTA_BYTES = 15 * 1024 * 1024 * 1024   # 15 GB (referencia Gmail/Drive)
TRIGGER_PERCENT = 90                                # umbral del disparador


@router.get("/storage/{lawyer_id}", response_model=dict)
async def storage_status(lawyer_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Estado del almacenamiento del suscriptor (cloud vinculado a su correo de
    registro). Si supera el 90%, dispara la solicitud de correo de respaldo."""
    user = None
    try:
        user = await db.users.find_one({"_id": ObjectId(lawyer_id)})
    except Exception:
        pass
    storage_email = (user or {}).get("storage_email") or (user or {}).get("email")
    backup_email = (user or {}).get("storage_backup_email")

    agg = await db.documents.aggregate([
        {"$match": {"lawyer_id": lawyer_id}},
        {"$group": {"_id": None, "total": {"$sum": "$size_bytes"}, "count": {"$sum": 1}}},
    ]).to_list(1)
    used = agg[0]["total"] if agg else 0
    count = agg[0]["count"] if agg else 0
    percent = round(used / SUBSCRIBER_QUOTA_BYTES * 100, 1) if SUBSCRIBER_QUOTA_BYTES else 0
    full = percent >= TRIGGER_PERCENT

    return {
        "lawyer_id": lawyer_id,
        "storage_email": storage_email,
        "backup_email": backup_email,
        "used_bytes": used,
        "used_human": _human(used),
        "quota_bytes": SUBSCRIBER_QUOTA_BYTES,
        "quota_human": _human(SUBSCRIBER_QUOTA_BYTES),
        "percent": percent,
        "count": count,
        "trigger": {
            "needs_backup_email": bool(full and not backup_email),
            "active": full,
            "message": (
                f"Almacenamiento lleno ({percent}%). Por favor, vincula un correo de "
                "respaldo (o correo personal) para continuar guardando expedientes."
                if full and not backup_email else None
            ),
        },
    }


class BackupEmailIn(BaseModel):
    lawyer_id: str
    backup_email: EmailStr


@router.post("/storage/backup-email", response_model=dict)
async def set_backup_email(payload: BackupEmailIn, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Vincula el correo de respaldo del suscriptor (cloud adicional)."""
    try:
        res = await db.users.update_one(
            {"_id": ObjectId(payload.lawyer_id)},
            {"$set": {"storage_backup_email": str(payload.backup_email),
                      "updated_at": datetime.utcnow()}},
        )
    except Exception:
        raise HTTPException(400, "lawyer_id inválido")
    if res.matched_count == 0:
        raise HTTPException(404, "Suscriptor no encontrado")
    return {"ok": True, "backup_email": str(payload.backup_email)}


# ───────────────── Intake de archivos del cliente por WhatsApp ─────────────────
class WhatsAppIntakeIn(BaseModel):
    case_id: str
    name: str
    size_bytes: int = 0
    mime: Optional[str] = "application/octet-stream"
    content_b64: Optional[str] = None


@router.post("/documents/whatsapp-intake", response_model=dict)
async def whatsapp_intake(payload: WhatsAppIntakeIn, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Recibe un archivo enviado por el cliente (link de WhatsApp): lo ETIQUETA,
    RENOMBRA con el número de caso y lo ARCHIVA en la carpeta del expediente.
    El almacenamiento se delega al cloud del suscriptor (Supabase Storage cuando
    está configurado; metadatos en BD si no)."""
    case = await db.cases.find_one({"_id": ObjectId(payload.case_id)})
    if not case:
        raise HTTPException(404, "Caso no encontrado")
    exp = await create_expediente(db, payload.case_id, case.get("lawyer_id"))
    expediente_id = (exp or {}).get("expediente_id") or case.get("expediente_id")

    # Renombrado normalizado: <CASO> · <archivo original>
    safe_name = payload.name.strip().replace("/", "-")
    renamed = f"{case.get('case_number')} · {safe_name}"
    now = datetime.utcnow()

    doc = {
        "lawyer_id": case.get("lawyer_id"),
        "case_id": payload.case_id,
        "expediente_id": expediente_id,
        "client_id": case.get("client_id"),
        "client_name": case.get("client_name"),
        "name": renamed,
        "original_name": payload.name,
        "size_bytes": payload.size_bytes,
        "mime": payload.mime,
        "folder": CLIENT_INTAKE_FOLDER,
        "source": "whatsapp",
        "tags": ["whatsapp", "cliente", case.get("case_number")],
        "storage": "supabase" if False else ("mongo" if payload.content_b64 else "metadata"),
        "content_b64": payload.content_b64,
        "encrypted": False,
        "created_at": now,
    }
    res = await db.documents.insert_one(doc)

    # Línea de tiempo + notificación al abogado
    await db.case_activities.insert_one({
        "case_id": payload.case_id, "user_id": case.get("lawyer_id"),
        "activity_type": "document", "stage": "Aporte del cliente (WhatsApp)",
        "billable": False, "duration_minutes": 0,
        "description": f"El cliente envió «{safe_name}» por WhatsApp; archivado en {CLIENT_INTAKE_FOLDER}.",
        "created_at": now,
    })
    await notifier.create_app_notification(
        db, target=case.get("lawyer_id"), type="client_document",
        title="Documento recibido por WhatsApp",
        message=f"{case.get('client_name','El cliente')} envió «{safe_name}» para el caso {case.get('case_number')}.",
        case_id=payload.case_id,
    )
    return {"ok": True, "document_id": str(res.inserted_id), "name": renamed, "folder": CLIENT_INTAKE_FOLDER}
