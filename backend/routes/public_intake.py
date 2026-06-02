"""
Endpoints públicos de captación — Punto Cero Legal
- Formulario cliente (Consulta Prioritaria) → cases (sin_asignar / PENDING_ASSIGNMENT)
- Formulario abogado (Únase a nuestra red) → users (role=lawyer / PENDING_VERIFICATION)
Ambos disparan notificación al panel admin.
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field
from motor.motor_asyncio import AsyncIOMotorDatabase
from utils.case_number_generator import generate_case_number

router = APIRouter(prefix="/public", tags=["Public Intake"])


async def get_db():
    from server import db
    return db


# ───────────── CLIENTE (Consulta Prioritaria) ─────────────
class ClientIntake(BaseModel):
    name: str = Field(..., min_length=2, max_length=120)
    description: str = Field(..., min_length=8, max_length=2000)
    legal_area: str = Field(..., min_length=2, max_length=80)
    priority: str = Field("media")  # alta | media | baja
    phone: Optional[str] = None
    email: Optional[EmailStr] = None


PRIORITY_LABELS = {"alta": "alta", "media": "media", "baja": "baja", "high": "alta", "medium": "media", "low": "baja"}


@router.post("/case-intake")
async def case_intake(payload: ClientIntake, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Captura una solicitud de consulta jurídica desde la landing.
    Crea el caso en estado sin_asignar/PENDING_ASSIGNMENT listo para Routing Inteligente.
    """
    priority_label = PRIORITY_LABELS.get((payload.priority or "media").lower(), "media")
    priority_engine = {"alta": "high", "media": "medium", "baja": "low"}[priority_label]
    now = datetime.utcnow()

    case_doc = {
        "case_number": generate_case_number(),
        "title": f"Consulta {payload.legal_area} · {payload.name}",
        "description": payload.description,
        "legal_area": payload.legal_area,
        "priority": priority_engine,
        "priority_label": priority_label,
        "status": "PENDING_ASSIGNMENT",
        "assignment_status": "sin_asignar",
        "lawyer_id": None,
        "client_id": None,
        "client_name": payload.name,
        "client_phone": payload.phone,
        "client_email": payload.email,
        "source": "landing_intake",
        "is_demo": False,
        "created_at": now,
        "updated_at": now,
    }
    res = await db.cases.insert_one(case_doc)
    case_id = str(res.inserted_id)

    await db.notifications.insert_one({
        "target": "admin",
        "type": "new_client_case",
        "title": "Nuevo caso entrante",
        "message": f"{payload.name} solicita asistencia en {payload.legal_area} (prioridad {priority_label}).",
        "case_id": case_id,
        "read": False,
        "created_at": now,
    })

    return {
        "ok": True,
        "case_id": case_id,
        "case_number": case_doc["case_number"],
        "message": "Solicitud recibida. Un especialista legal revisará su caso y le contactaremos pronto.",
    }


# ───────────── ABOGADO (Registro Profesional) ─────────────
class LawyerApplication(BaseModel):
    full_name: str = Field(..., min_length=3, max_length=120)
    email: EmailStr
    phone: Optional[str] = None
    specialty: str = Field(..., min_length=2, max_length=80)
    country: Optional[str] = None
    experience: str = Field(..., min_length=4, max_length=2000)  # texto libre
    bar_number: Optional[str] = None
    firm_name: Optional[str] = None
    id_document: Optional[str] = None


@router.post("/lawyer-application")
async def lawyer_application(payload: LawyerApplication, db: AsyncIOMotorDatabase = Depends(get_db)):
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
        "full_name": payload.full_name,
        "role": "lawyer",
        "status": "PENDING_VERIFICATION",
        "is_verified": False,
        "is_online": False,
        "phone": payload.phone,
        "country": payload.country,
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

    await db.notifications.insert_one({
        "target": "admin",
        "type": "new_lawyer_application",
        "title": "Nueva aplicación de abogado",
        "message": f"{payload.full_name} aplicó como socio ({payload.specialty}).",
        "candidate_id": candidate_id,
        "read": False,
        "created_at": now,
    })

    return {
        "ok": True,
        "candidate_id": candidate_id,
        "message": "Perfil profesional enviado correctamente. Nuestro equipo evaluará su incorporación y le notificaremos a través de su correo registrado.",
    }
