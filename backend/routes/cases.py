"""
Gestión de Casos — el cerebro de la oficina jurídica.

Crear un caso dispara automáticamente (interconexión central):
  • Identificador único secuencial  → CAS-YYYY-NNN
  • Directorio de clientes          → crea/actualiza el cliente
  • Prioridad automática            → alta / media / baja
  • Conflicto de intereses          → verifica contraparte vs clientes previos
  • Línea de tiempo                 → primer hito en case_activities
  • Agenda                          → cita por cada fecha clave / deadline
  • Notificaciones                  → aviso in-app al abogado
El CRM y el dashboard agregan estos datos en tiempo real.
"""
from fastapi import APIRouter, HTTPException, Depends, status
from typing import List, Optional
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
import uuid

from routes.auth import get_current_user
from utils.case_number_generator import next_case_number
from utils import notifier
from security.tenant_scope import validate_org_ownership

router = APIRouter(prefix="/cases", tags=["Case Management"])


async def get_db():
    from server import db
    return db


# Materias (categorías) y estados admitidos
MATERIAS = ["Civil", "Penal", "Laboral", "Familia", "Mercantil", "Administrativo", "Constitucional", "Otro"]
ESTADOS = ["Pendiente", "En trámite", "En audiencia", "Archivada", "Finalizada", "En estudio", "Activo", "En seguimiento"]

# Mapeo estado (es) → status interno (para KPIs/dashboard existentes)
ESTADO_TO_STATUS = {
    "Pendiente": "open", "En estudio": "open", "Activo": "open",
    "En trámite": "in_progress", "En audiencia": "in_progress", "En seguimiento": "in_progress",
    "Archivada": "archived", "Finalizada": "closed",
}


def _auto_priority(payload: dict) -> tuple:
    """Prioridad automática: Alta (urgente/nueva demanda), Media (consulta activa),
    Baja (prospecto/consulta inicial). Devuelve (engine, label)."""
    explicit = (payload.get("priority_label") or "").lower()
    if explicit in ("alta", "media", "baja"):
        label = explicit
    else:
        kind = (payload.get("intake_type") or payload.get("source") or "").lower()
        estado = (payload.get("estado") or "").lower()
        text = f"{kind} {estado} {payload.get('description','')}".lower()
        if any(w in text for w in ("urgente", "demanda", "audiencia", "captura", "medida")):
            label = "alta"
        elif any(w in text for w in ("prospecto", "consulta inicial", "cotiz")):
            label = "baja"
        else:
            label = "media"
    engine = {"alta": "high", "media": "medium", "baja": "low"}[label]
    return engine, label


async def _upsert_client(db, lawyer_id: str, payload: dict) -> Optional[str]:
    """Crea o actualiza el cliente en el directorio a partir de los datos del caso."""
    name = (payload.get("client_name") or "").strip()
    document = (payload.get("client_document") or payload.get("client_id_document") or "").strip()
    email = (payload.get("client_email") or "").strip()
    phone = (payload.get("client_phone") or "").strip()
    if not name and not document and not email:
        return payload.get("client_id")  # nada que crear

    # Buscar cliente existente del mismo abogado
    or_terms = []
    if document:
        or_terms.append({"document": document})
    if email:
        or_terms.append({"email": email})
    if name:
        or_terms.append({"name": name})
    existing = None
    if or_terms:
        existing = await db.clients.find_one({"lawyer_id": lawyer_id, "$or": or_terms})

    now = datetime.utcnow()
    if existing:
        upd = {"updated_at": now}
        for k, v in (("email", email), ("phone", phone), ("document", document)):
            if v and not existing.get(k):
                upd[k] = v
        await db.clients.update_one({"_id": existing["_id"]}, {"$set": upd})
        return str(existing["_id"])

    doc = {
        "lawyer_id": lawyer_id, "name": name or "Cliente sin nombre",
        "document": document or None, "email": email or None, "phone": phone or None,
        "city": payload.get("client_city"), "country": payload.get("client_country", "Colombia"),
        "status": "active", "observations": "", "created_at": now, "updated_at": now,
        "source": payload.get("source", "case_intake"),
    }
    res = await db.clients.insert_one(doc)
    return str(res.inserted_id)


async def _conflict_check(db, lawyer_id: str, counterparty: str) -> dict:
    """Verifica que la contraparte no sea un cliente previo (conflicto de intereses)."""
    counterparty = (counterparty or "").strip()
    if not counterparty:
        return {"conflict": False}
    hit = await db.clients.find_one({
        "lawyer_id": lawyer_id,
        "name": {"$regex": f"^{counterparty}$", "$options": "i"},
    })
    if hit:
        return {"conflict": True, "client_id": str(hit["_id"]), "client_name": hit.get("name"),
                "message": f"⚠️ Posible conflicto de intereses: la contraparte «{counterparty}» ya figura como cliente."}
    return {"conflict": False}


def _serialize_case(case: dict) -> dict:
    case = dict(case)
    case["_id"] = str(case["_id"])
    for f in ("created_at", "updated_at", "deadline", "registered_at"):
        v = case.get(f)
        if isinstance(v, datetime):
            case[f] = v.isoformat()
    return case


@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_case(
    payload: dict,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Crea un caso (manual por el abogado o derivado del admin) e interconecta
    todos los módulos. Acepta campos flexibles del formulario de intake."""
    lawyer_id = payload.get("lawyer_id")
    if not lawyer_id:
        raise HTTPException(400, "lawyer_id es obligatorio")

    now = datetime.utcnow()
    case_number = await next_case_number(db)

    # 1) Directorio de clientes (crear/actualizar)
    client_id = await _upsert_client(db, lawyer_id, payload)

    # 2) Prioridad automática
    priority_engine, priority_label = _auto_priority(payload)

    # 3) Conflicto de intereses
    conflict = await _conflict_check(db, lawyer_id, payload.get("counterparty_name"))

    # 4) Estado inicial
    estado = payload.get("estado") or ("Activo" if not conflict["conflict"] else "En estudio")
    internal_status = ESTADO_TO_STATUS.get(estado, "open")

    # 5) Deadline / fechas clave
    deadline = None
    raw_deadline = payload.get("deadline")
    if isinstance(raw_deadline, str) and raw_deadline:
        try:
            deadline = datetime.fromisoformat(raw_deadline.replace("Z", "+00:00"))
        except Exception:
            deadline = None

    case_doc = {
        "case_number": case_number,
        "organization_id": current_user.get("organization_id"),
        "lawyer_id": lawyer_id,
        "client_id": client_id,
        "client_name": payload.get("client_name"),
        "client_document": payload.get("client_document") or payload.get("client_id_document"),
        "client_phone": payload.get("client_phone"),
        "client_email": payload.get("client_email"),
        "title": payload.get("title") or f"{payload.get('legal_area','Consulta')} · {payload.get('client_name','Cliente')}",
        "legal_area": payload.get("legal_area") or payload.get("materia") or "Otro",
        "materia": payload.get("materia") or payload.get("legal_area") or "Otro",
        "description": payload.get("description") or payload.get("summary") or "",
        "summary": payload.get("summary") or payload.get("description") or "",
        "key_dates": payload.get("key_dates") or [],
        "assigned_to": payload.get("assigned_to"),
        "counterparty_name": payload.get("counterparty_name"),
        "conflict_flag": conflict["conflict"],
        "estado": estado,
        "status": internal_status,
        "priority": priority_engine,
        "priority_label": priority_label,
        "deadline": deadline,
        "court": payload.get("court"),
        "source": payload.get("source", "manual"),
        "documents": [],
        "billable_hours": 0.0,
        "total_billed": 0.0,
        "registered_at": now,
        "created_at": now,
        "updated_at": now,
    }
    result = await db.cases.insert_one(case_doc)
    case_id = str(result.inserted_id)

    # 5.b) Biblioteca de Expediente automática (Documentos ↔ Caso)
    from utils.expediente import init_expediente
    await init_expediente(db, case_id, lawyer_id)

    # 6) Línea de tiempo: primer hito
    await db.case_activities.insert_one({
        "case_id": case_id, "user_id": lawyer_id, "activity_type": "note",
        "stage": "Registro del caso", "billable": False, "duration_minutes": 0,
        "description": f"Caso {case_number} creado ({estado}). Cliente: {payload.get('client_name','—')}.",
        "created_at": now,
    })
    if conflict["conflict"]:
        await db.case_activities.insert_one({
            "case_id": case_id, "user_id": lawyer_id, "activity_type": "note",
            "stage": "Validación", "billable": False, "duration_minutes": 0,
            "description": conflict["message"], "created_at": now + timedelta(seconds=1),
        })

    # 7) Agenda: cita por deadline y por cada fecha clave
    agenda_ids = []
    if deadline:
        r = await db.appointments.insert_one({
            "lawyer_id": lawyer_id, "case_id": case_id, "client_id": client_id,
            "title": f"Vencimiento · {case_number}", "event_type": "deadline",
            "start_time": deadline, "end_time": deadline, "status": "scheduled",
            "reminder_sent": False, "created_at": now, "updated_at": now,
        })
        agenda_ids.append(str(r.inserted_id))

    # 8) Notificación in-app al abogado
    await notifier.create_app_notification(
        db, target=lawyer_id, type="case_created",
        title="Nuevo caso registrado",
        message=f"{case_number} · {case_doc['title']} (prioridad {priority_label}).",
        case_id=case_id,
    )

    out = _serialize_case(case_doc)
    out["_id"] = case_id
    out["conflict"] = conflict
    out["agenda_ids"] = agenda_ids
    return out


@router.get("/", response_model=List[dict])
async def get_cases(
    lawyer_id: str = None,
    client_id: str = None,
    status: str = None,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    # Devolución automática (3h sin aceptar) — verificación perezosa al listar.
    await auto_return_expired(db)
    
    # Usar organization_id del token como fuente de verdad
    organization_id = current_user.get("organization_id")
    if not organization_id:
        raise HTTPException(403, "Usuario sin organización asignada")
    
    query = {"organization_id": organization_id}
    if lawyer_id:
        query["lawyer_id"] = lawyer_id
    if client_id:
        query["client_id"] = client_id
    if status:
        query["status"] = status

    cases = await db.cases.find(query).sort("created_at", -1).to_list(1000)
    out = []
    for case in cases:
        c = _serialize_case(case)
        if not c.get("client_name") and case.get("client_id"):
            cl = await _lookup_name(db, case["client_id"])
            if cl:
                c["client_name"] = cl
        out.append(c)
    return out


async def _lookup_name(db, ref_id: str) -> Optional[str]:
    """Busca un nombre en clients o users de forma tolerante."""
    try:
        oid = ObjectId(ref_id)
    except Exception:
        return None
    cl = await db.clients.find_one({"_id": oid})
    if cl:
        return cl.get("name")
    u = await db.users.find_one({"_id": oid})
    return u.get("full_name") if u else None


@router.get("/{case_id}", response_model=dict)
async def get_case(
    case_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    # Incluir filtro de tenant en la query inicial
    case = await db.cases.find_one({
        "_id": ObjectId(case_id),
        "organization_id": current_user.get("organization_id")
    })
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    out = _serialize_case(case)

    activities = await db.case_activities.find({"case_id": case_id}).sort("created_at", -1).to_list(200)
    for a in activities:
        a["_id"] = str(a["_id"])
        if isinstance(a.get("created_at"), datetime):
            a["created_at"] = a["created_at"].isoformat()
    out["activities"] = activities

    meetings = await db.meetings.find({"case_id": case_id}).to_list(100)
    for m in meetings:
        m["_id"] = str(m["_id"])
    out["meetings"] = meetings
    return out


@router.get("/{case_id}/timeline", response_model=dict)
async def case_timeline(
    case_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Línea de tiempo visual del caso: cada etapa/hito en orden cronológico."""
    # Validar que el caso pertenece al tenant
    case = await db.cases.find_one({
        "_id": ObjectId(case_id),
        "organization_id": current_user.get("organization_id")
    })
    if not case:
        raise HTTPException(404, "Case not found")
    acts = await db.case_activities.find({"case_id": case_id}).sort("created_at", 1).to_list(500)
    timeline = []
    for a in acts:
        ts = a.get("created_at")
        timeline.append({
            "stage": a.get("stage") or a.get("activity_type", "Actividad").capitalize(),
            "type": a.get("activity_type", "note"),
            "description": a.get("description", ""),
            "date": ts.isoformat() if isinstance(ts, datetime) else ts,
        })
    return {
        "case_id": case_id,
        "case_number": case.get("case_number"),
        "title": case.get("title"),
        "current_stage": case.get("estado", case.get("status")),
        "client_name": case.get("client_name"),
        "timeline": timeline,
    }


@router.post("/{case_id}/timeline-entry", response_model=dict)
async def add_timeline_entry(case_id: str, payload: dict, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Agrega manualmente una etapa a la línea de tiempo del caso."""
    case = await db.cases.find_one({"_id": ObjectId(case_id)})
    if not case:
        raise HTTPException(404, "Case not found")
    now = datetime.utcnow()
    await db.case_activities.insert_one({
        "case_id": case_id, "user_id": case.get("lawyer_id"),
        "activity_type": payload.get("type", "note"),
        "stage": payload.get("stage", "Actualización"),
        "description": payload.get("description", ""),
        "billable": bool(payload.get("billable", False)),
        "duration_minutes": int(payload.get("duration_minutes", 0) or 0),
        "created_at": now,
    })
    return {"ok": True}


@router.post("/{case_id}/send-timeline", response_model=dict)
async def send_timeline(case_id: str, payload: dict, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Envía la línea de tiempo del caso al cliente por WhatsApp o correo."""
    case = await db.cases.find_one({"_id": ObjectId(case_id)})
    if not case:
        raise HTTPException(404, "Case not found")
    acts = await db.case_activities.find({"case_id": case_id}).sort("created_at", 1).to_list(500)
    lines = []
    for a in acts:
        ts = a.get("created_at")
        d = ts.strftime("%d/%m/%Y") if isinstance(ts, datetime) else ""
        lines.append(f"• {d} — {a.get('stage','')}: {a.get('description','')}")
    body_text = (f"Estado de su caso {case.get('case_number')} — {case.get('title')}\n\n"
                 + "\n".join(lines) + f"\n\nEtapa actual: {case.get('estado','')}")
    body_html = "<h3>Estado de su caso</h3><p><b>" + str(case.get("case_number")) + "</b> — " + str(case.get("title")) + "</p><ul>" + \
                "".join(f"<li>{ln[2:]}</li>" for ln in lines) + f"</ul><p>Etapa actual: <b>{case.get('estado','')}</b></p>"

    channel = payload.get("channel", "email")
    email = case.get("client_email")
    phone = case.get("client_phone")
    result = {"channel": channel}
    if channel == "whatsapp":
        result["link"] = notifier.wa_link(phone, body_text)
        result["api"] = notifier.send_whatsapp(phone, body_text) if phone else {"sent": False, "reason": "no_phone"}
    else:
        from urllib.parse import quote
        result["link"] = (f"mailto:{email}?subject={quote('Estado de su caso ' + str(case.get('case_number')))}"
                          f"&body={quote(body_text)}") if email else None
        result["api"] = notifier.send_email(email, f"Estado de su caso {case.get('case_number')}", body_html) if email else {"sent": False, "reason": "no_email"}
    return result


# ───────────── Formulario formal cliente-abogado ─────────────
@router.post("/{case_id}/request-client-form", response_model=dict)
async def request_client_form(case_id: str, payload: dict, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Genera un formulario para que el cliente complete datos, pruebas y documentos.
    Devuelve el enlace + lo envía por correo/WhatsApp."""
    case = await db.cases.find_one({"_id": ObjectId(case_id)})
    if not case:
        raise HTTPException(404, "Case not found")
    token = uuid.uuid4().hex
    await db.cases.update_one({"_id": case["_id"]},
                              {"$set": {"client_form_token": token, "updated_at": datetime.utcnow()}})
    base = payload.get("base_url") or os.environ.get("APP_PUBLIC_URL", "https://app.puntocerolegal.com")
    url = f"{base}/portal/form/{token}"
    msg = (f"Su abogado solicita que complete el formulario de su caso "
           f"{case.get('case_number')}: {url}")
    channel = payload.get("channel", "email")
    sent = {}
    if channel == "whatsapp":
        sent = {"link": notifier.wa_link(case.get("client_phone"), msg),
                "api": notifier.send_whatsapp(case.get("client_phone"), msg)}
    else:
        from urllib.parse import quote
        em = case.get("client_email")
        sent = {"link": (f"mailto:{em}?subject={quote('Formulario de su caso')}&body={quote(msg)}") if em else None,
                "api": notifier.send_email(em, "Formulario de su caso", f"<p>{msg}</p>") if em else {"sent": False}}
    return {"ok": True, "token": token, "form_url": url, **sent}


@router.get("/form/{token}", response_model=dict)
async def get_client_form(token: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Datos básicos del caso para precargar el formulario público (sin auth)."""
    case = await db.cases.find_one({"client_form_token": token})
    if not case:
        raise HTTPException(404, "Formulario no encontrado o expirado")
    return {
        "case_number": case.get("case_number"),
        "title": case.get("title"),
        "client_name": case.get("client_name"),
        "materia": case.get("materia"),
    }


@router.post("/form/{token}", response_model=dict)
async def submit_client_form(token: str, payload: dict, db: AsyncIOMotorDatabase = Depends(get_db)):
    """El cliente envía sus datos, pruebas y documentos; queda vinculado al caso."""
    case = await db.cases.find_one({"client_form_token": token})
    if not case:
        raise HTTPException(404, "Formulario no encontrado o expirado")
    case_id = str(case["_id"])
    now = datetime.utcnow()

    # Actualiza datos del cliente aportados
    client_update = {k: payload.get(k) for k in ("client_phone", "client_email", "client_document") if payload.get(k)}
    if client_update:
        client_update["updated_at"] = now
        await db.cases.update_one({"_id": case["_id"]}, {"$set": client_update})
        if case.get("client_id"):
            try:
                cmap = {"client_phone": "phone", "client_email": "email", "client_document": "document"}
                await db.clients.update_one({"_id": ObjectId(case["client_id"])},
                                            {"$set": {cmap[k]: v for k, v in client_update.items() if k in cmap}})
            except Exception:
                pass

    # Guarda los documentos/pruebas aportados (metadatos)
    for doc in payload.get("documents", []) or []:
        await db.documents.insert_one({
            "lawyer_id": case.get("lawyer_id"), "case_id": case_id,
            "client_id": case.get("client_id"), "client_name": case.get("client_name"),
            "name": doc.get("name", "documento_cliente"), "size_bytes": doc.get("size_bytes", 0),
            "mime": doc.get("mime"), "content_b64": doc.get("content_b64"),
            "encrypted": False, "storage": "mongo" if doc.get("content_b64") else "metadata",
            "folder": "Aportado por cliente", "source": "client_form", "created_at": now,
        })

    # Línea de tiempo + notifica al abogado
    await db.case_activities.insert_one({
        "case_id": case_id, "user_id": case.get("lawyer_id"), "activity_type": "document",
        "stage": "Aporte del cliente", "billable": False, "duration_minutes": 0,
        "description": payload.get("facts") or "El cliente completó el formulario y aportó información/documentos.",
        "created_at": now,
    })
    await notifier.create_app_notification(
        db, target=case.get("lawyer_id"), type="client_form_submitted",
        title="El cliente completó su formulario",
        message=f"{case.get('client_name','El cliente')} envió datos del caso {case.get('case_number')}.",
        case_id=case_id,
    )
    return {"ok": True, "message": "Información recibida y vinculada a su caso. Gracias."}


@router.patch("/{case_id}", response_model=dict)
async def update_case(
    case_id: str,
    updates: dict,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    # Validar que el caso pertenece al tenant antes de actualizar
    case = await db.cases.find_one({
        "_id": ObjectId(case_id),
        "organization_id": current_user.get("organization_id")
    })
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    allowed = {"title", "legal_area", "materia", "description", "summary", "estado", "status",
               "priority", "priority_label", "deadline", "court", "assigned_to", "counterparty_name",
               "key_dates"}
    update_data = {k: v for k, v in updates.items() if k in allowed and v is not None}
    # Si cambia 'estado', sincroniza status interno + hito en timeline
    if "estado" in update_data:
        update_data["status"] = ESTADO_TO_STATUS.get(update_data["estado"], "open")
    if isinstance(update_data.get("deadline"), str):
        try:
            update_data["deadline"] = datetime.fromisoformat(update_data["deadline"].replace("Z", "+00:00"))
        except Exception:
            update_data.pop("deadline", None)
    update_data["updated_at"] = datetime.utcnow()
    result = await db.cases.update_one({"_id": ObjectId(case_id)}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Case not found")
    if "estado" in update_data:
        await db.case_activities.insert_one({
            "case_id": case_id, "user_id": (updates.get("user_id")), "activity_type": "note",
            "stage": f"Cambio de estado → {update_data['estado']}", "billable": False,
            "duration_minutes": 0, "description": f"El caso pasó a estado «{update_data['estado']}».",
            "created_at": datetime.utcnow(),
        })
    case = await db.cases.find_one({"_id": ObjectId(case_id)})
    return _serialize_case(case)


# ───────────── Aceptación / Rechazo / Devolución automática ─────────────
ACCEPTANCE_TIMEOUT_HOURS = 3


async def auto_return_expired(db) -> int:
    """Devolución automática: libera los casos ASIGNADOS y aún PENDIENTES de
    aceptación cuya asignación supera ACCEPTANCE_TIMEOUT_HOURS (3h). Vuelven al
    Dashboard Administrativo como 'sin_asignar' para reasignación. Idempotente."""
    threshold = datetime.utcnow() - timedelta(hours=ACCEPTANCE_TIMEOUT_HOURS)
    expired = await db.cases.find({
        "assignment_status": "asignado",
        "acceptance_status": "pending",
        "assigned_at": {"$lte": threshold},
    }).to_list(500)
    now = datetime.utcnow()
    for c in expired:
        prev_lawyer = c.get("lawyer_id")
        await db.cases.update_one(
            {"_id": c["_id"]},
            {"$set": {
                "lawyer_id": None,
                "assignment_status": "sin_asignar",
                "acceptance_status": "auto_returned",
                "returned_at": now,
                "decline_reason": f"Devolución automática ({ACCEPTANCE_TIMEOUT_HOURS}h sin respuesta)",
                "updated_at": now,
            }},
        )
        await db.case_activities.insert_one({
            "case_id": str(c["_id"]), "user_id": prev_lawyer, "activity_type": "note",
            "stage": "Devolución automática", "billable": False, "duration_minutes": 0,
            "description": f"El caso volvió al administrador tras {ACCEPTANCE_TIMEOUT_HOURS}h sin aceptación.",
            "created_at": now,
        })
        await notifier.create_app_notification(
            db, target="admin", type="case_auto_returned",
            title="Caso devuelto automáticamente",
            message=f"{c.get('case_number','Caso')} regresó sin asignar ({ACCEPTANCE_TIMEOUT_HOURS}h sin respuesta del abogado).",
            case_id=str(c["_id"]),
        )
    return len(expired)


@router.post("/{case_id}/accept", response_model=dict)
async def accept_case(case_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    """El abogado ACEPTA el caso asignado: queda definitivo en sus casos activos."""
    case = await db.cases.find_one({"_id": ObjectId(case_id)})
    if not case:
        raise HTTPException(404, "Case not found")
    if not case.get("lawyer_id"):
        raise HTTPException(400, "El caso no está asignado a ningún abogado")
    now = datetime.utcnow()
    await db.cases.update_one(
        {"_id": ObjectId(case_id)},
        {"$set": {
            "acceptance_status": "accepted",
            "accepted_at": now,
            "assignment_status": "asignado",
            "estado": case.get("estado") if case.get("estado") not in (None, "En estudio") else "Activo",
            "updated_at": now,
        }},
    )
    await db.case_activities.insert_one({
        "case_id": case_id, "user_id": case.get("lawyer_id"), "activity_type": "note",
        "stage": "Caso aceptado", "billable": False, "duration_minutes": 0,
        "description": "El abogado aceptó el caso; pasa a sus casos activos.", "created_at": now,
    })
    await notifier.create_app_notification(
        db, target="admin", type="case_accepted",
        title="Caso aceptado", message=f"{case.get('case_number','Caso')} fue aceptado por el abogado.",
        case_id=case_id,
    )
    return {"ok": True, "acceptance_status": "accepted", "accepted_at": now.isoformat()}


@router.post("/{case_id}/decline", response_model=dict)
async def decline_case(case_id: str, payload: dict = None, db: AsyncIOMotorDatabase = Depends(get_db)):
    """El abogado DECLINA el caso: se libera y vuelve al admin para reasignación."""
    case = await db.cases.find_one({"_id": ObjectId(case_id)})
    if not case:
        raise HTTPException(404, "Case not found")
    reason = ((payload or {}).get("reason") or "").strip() or "Sin motivo especificado"
    prev_lawyer = case.get("lawyer_id")
    now = datetime.utcnow()
    await db.cases.update_one(
        {"_id": ObjectId(case_id)},
        {"$set": {
            "lawyer_id": None,
            "assignment_status": "sin_asignar",
            "acceptance_status": "declined",
            "declined_at": now,
            "declined_by": prev_lawyer,
            "decline_reason": reason,
            "updated_at": now,
        }},
    )
    await db.case_activities.insert_one({
        "case_id": case_id, "user_id": prev_lawyer, "activity_type": "note",
        "stage": "Caso declinado", "billable": False, "duration_minutes": 0,
        "description": f"El abogado declinó el caso. Motivo: {reason}", "created_at": now,
    })
    await notifier.create_app_notification(
        db, target="admin", type="case_declined",
        title="Caso declinado", message=f"{case.get('case_number','Caso')} fue declinado y está disponible para reasignación. Motivo: {reason}",
        case_id=case_id,
    )
    return {"ok": True, "assignment_status": "sin_asignar", "reason": reason}


@router.post("/{case_id}/start-meeting", response_model=dict)
async def start_meeting_from_case(case_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Gestión de Casos → Sala de Conferencias: crea reunión Jitsi al instante."""
    case = await db.cases.find_one({"_id": ObjectId(case_id)})
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    room_id = f"PCL-{case.get('case_number','room')}-{uuid.uuid4().hex[:6]}"
    now = datetime.utcnow()
    meeting_data = {
        "case_id": case_id, "host_id": case["lawyer_id"], "title": f"Reunión: {case.get('title')}",
        "participants": [case["lawyer_id"], case.get("client_id")],
        "scheduled_time": now, "start_time": now, "status": "in_progress",
        "room_id": room_id, "meeting_link": f"https://meet.jit.si/{room_id}",
        "created_at": now, "updated_at": now,
    }
    meeting_result = await db.meetings.insert_one(meeting_data)
    meeting_id = str(meeting_result.inserted_id)
    await db.case_activities.insert_one({
        "case_id": case_id, "user_id": case["lawyer_id"], "activity_type": "meeting",
        "stage": "Reunión", "description": f"Reunión iniciada: {case.get('title')}",
        "duration_minutes": 0, "billable": True, "meeting_id": meeting_id, "created_at": now,
    })
    return {"meeting_id": meeting_id, "meeting_link": meeting_data["meeting_link"],
            "room_id": room_id, "status": "in_progress"}


@router.delete("/{case_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_case(case_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    pending_invoices = await db.invoices.find_one({"case_id": case_id, "status": {"$ne": "paid"}})
    if pending_invoices:
        raise HTTPException(status_code=400, detail="No se puede eliminar un caso con facturas pendientes")
    result = await db.cases.delete_one({"_id": ObjectId(case_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Case not found")
    await db.case_activities.delete_many({"case_id": case_id})
    await db.meetings.delete_many({"case_id": case_id})
    await db.appointments.delete_many({"case_id": case_id})
    return None
