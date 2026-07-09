"""
Endpoints públicos de captación — Punto Cero Legal
- Formulario cliente (Consulta Prioritaria) → cases (sin_asignar / PENDING_ASSIGNMENT)
- Formulario abogado (Únase a nuestra red) → users (role=lawyer / PENDING_VERIFICATION)
Ambos disparan notificación al panel admin.
"""
from fastapi import APIRouter, HTTPException, Depends, Request
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field
from motor.motor_asyncio import AsyncIOMotorDatabase
from utils.case_number_generator import generate_case_number, next_consultation_number
from utils import notifier
from utils.rate_limiter_decorator import rate_limit  # CRITICAL FIX (S5.3-Finding#9)
from utils.xss_protection import sanitize_case_description  # CRITICAL FIX S5.3-Finding#6

router = APIRouter(prefix="/public", tags=["Public Intake"])


async def get_db():
    from server import db
    return db


# ───────────── CLIENTE (Consulta Prioritaria) ─────────────
class ClientIntake(BaseModel):
    name: str = Field(..., min_length=2, max_length=120)
    description: str = Field(..., min_length=8, max_length=2000)
    legal_area: str = Field(..., min_length=2, max_length=80)
    priority: str = Field("media")  # urgente | media | baja
    country: str = Field(..., min_length=2, max_length=80)
    city: Optional[str] = Field(None, max_length=120)
    phone: Optional[str] = None
    email: Optional[EmailStr] = None


PRIORITY_LABELS = {"urgente": "alta", "alta": "alta", "media": "media", "baja": "baja", "high": "alta", "medium": "media", "low": "baja"}


@router.post("/case-intake")
@rate_limit(max_requests=5, window_seconds=60)  # 5 intakes per minute per IP
async def case_intake(request: Request, payload: ClientIntake, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Captura una solicitud de consulta jurídica desde la landing.
    Crea el caso en estado sin_asignar/PENDING_ASSIGNMENT listo para Routing Inteligente.
    """
    from routes import chatbot  # import perezoso para evitar ciclos

    priority_label = PRIORITY_LABELS.get((payload.priority or "media").lower(), "media")
    priority_engine = {"alta": "high", "media": "medium", "baja": "low"}[priority_label]
    now = datetime.utcnow()

    # 2) Identificador único de consulta + teléfono validado por país
    consultation_number = await next_consultation_number(db)
    norm_phone = chatbot.normalize_phone(payload.phone, payload.country)

    case_doc = {
        "case_number": sanitize_case_description(consultation_number),  # CRITICAL FIX S5.3-Finding#6
        "consultation_number": consultation_number,
        "title": sanitize_case_description(f"Consulta {payload.legal_area} · {payload.name}"),  # CRITICAL FIX S5.3-Finding#6
        "description": sanitize_case_description(payload.description),  # CRITICAL FIX S5.3-Finding#6
        "legal_area": payload.legal_area,
        "priority": priority_engine,
        "priority_label": priority_label,
        "status": "PENDING_ASSIGNMENT",
        "estado": "En estudio",
        "assignment_status": "sin_asignar",
        "lawyer_id": None,
        "client_id": None,
        "client_name": payload.name,
        "client_phone": norm_phone or payload.phone,
        "client_email": payload.email,
        "client_country": payload.country,
        "client_city": payload.city,
        "source": "landing_intake",
        "is_demo": False,
        "status_timeline": chatbot.init_timeline(),  # 5 estados (recibido → en proceso)
        "created_at": now,
        "updated_at": now,
    }
    res = await db.cases.insert_one(case_doc)
    case_id = str(res.inserted_id)
    case_doc["_id"] = case_id

    # 2.b) PRIMERO al administrador: alerta en el dashboard
    await notifier.create_app_notification(
        db, target="admin", type="new_client_case",
        title=f"Nueva consulta entrante {consultation_number}",
        message=f"{payload.name} solicita asistencia en {payload.legal_area} (prioridad {priority_label}, {payload.country}).",
        case_id=case_id,
    )

    # 3) Activa el chatbot de WhatsApp (bienvenida según país + 1ª pregunta + timeline + correo)
    try:
        await chatbot.start_intake_conversation(db, case_doc)
    except Exception:
        pass  # nunca romper el intake por un fallo del chatbot/notificación

    return {
        "ok": True,
        "case_id": case_id,
        "case_number": consultation_number,
        "message": "Solicitud recibida. Te contactaremos por WhatsApp en breve y un especialista legal revisará tu caso.",
    }


# ───────────── ABOGADO (Registro Profesional) ─────────────
class LawyerApplication(BaseModel):
    full_name: str = Field(..., min_length=3, max_length=120)
    email: EmailStr
    phone: Optional[str] = None
    specialty: str = Field(..., min_length=2, max_length=80)
    country: str = Field(..., min_length=2, max_length=80)
    city: Optional[str] = Field(None, max_length=120)
    experience: str = Field(..., min_length=4, max_length=2000)  # texto libre
    bar_number: Optional[str] = None
    firm_name: Optional[str] = None
    id_document: Optional[str] = None


def _with_dr(name: str) -> str:
    if not name:
        return name
    n = name.strip()
    if n.lower().startswith(("dr.", "dra.", "dr ", "dra ")):
        return n
    return f"Dr. {n}"


@router.post("/lawyer-application")
@rate_limit(max_requests=10, window_seconds=60)  # 10 applications per minute per IP
async def lawyer_application(request: Request, payload: LawyerApplication, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Captura una solicitud de incorporación de abogado.
    Crea registro en users con role=lawyer, status=PENDING_VERIFICATION, is_verified=False.
    Aparece en Sala de Ventas del Centro de Gestión.
    """
    # Duplicado por email
    existing = await db.users.find_one({"email": payload.email})
    if existing:
        if existing.get("role") == "lawyer" and not existing.get("is_verified"):
            raise HTTPException(409, "Ya existe una solicitud con este correo. Revise su bandeja para el seguimiento.")
        raise HTTPException(409, "Este correo ya está registrado en la plataforma.")

    now = datetime.utcnow()
    user_doc = {
        "email": payload.email,
        "password_hash": None,  # se asigna tras aprobación (admin envía invitación / setea temporal)
        "full_name": _with_dr(payload.full_name),
        "role": "lawyer",
        "status": "PENDING_VERIFICATION",
        "is_verified": False,
        "is_online": False,
        "phone": payload.phone,
        "country": payload.country,
        "city": payload.city,
        "specialty": payload.specialty,
        "experience_years": None,  # texto libre — se parseará luego
        "description": payload.experience,
        "bar_number": payload.bar_number,
        "firm_name": payload.firm_name,
        "id_document": payload.id_document,
        "source": "landing_application",
        "private_notes": "",
        "created_at": now,
        "updated_at": now,
    }
    res = await db.users.insert_one(user_doc)
    candidate_id = str(res.inserted_id)

    await notifier.create_app_notification(
        db, target="admin", type="new_lawyer_application",
        title="Nueva aplicación de abogado",
        message=f"{_with_dr(payload.full_name)} aplicó como socio ({payload.specialty}).",
        candidate_id=candidate_id,
    )

    return {
        "ok": True,
        "candidate_id": candidate_id,
        "message": "Perfil profesional enviado correctamente. Nuestro equipo evaluará su incorporación y le notificaremos a través de su correo registrado.",
    }
