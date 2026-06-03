from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
import os
from emergentintegrations.llm.chat import LlmChat, UserMessage
import uuid

router = APIRouter(prefix="/ai", tags=["AI Legal Assistant"])


async def get_db():
    from server import db
    return db


# Límite de consultas IA por mes según el plan del abogado.
# -1 = ilimitado. Sin plan activo (trial) usa el límite "trial".
AI_QUERY_LIMITS = {
    "trial": 15,
    "esencial": 50,
    "profesional": 200,
    "elite": 600,
    "ilimitado": -1,
}


def _current_period() -> str:
    now = datetime.utcnow()
    return f"{now.year}-{now.month:02d}"


async def _resolve_limit(lawyer_id: Optional[str], db: AsyncIOMotorDatabase) -> tuple:
    """Devuelve (plan, limit) para el abogado. Trial si no hay plan."""
    plan = "trial"
    if lawyer_id and ObjectId.is_valid(lawyer_id):
        user = await db.users.find_one({"_id": ObjectId(lawyer_id)})
        if user and user.get("plan_id") in AI_QUERY_LIMITS:
            plan = user["plan_id"]
    return plan, AI_QUERY_LIMITS[plan]


async def _get_usage(lawyer_id: str, db: AsyncIOMotorDatabase) -> int:
    doc = await db.ai_usage.find_one({"lawyer_id": lawyer_id, "period": _current_period()})
    return doc.get("count", 0) if doc else 0


class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    template: Optional[str] = "general"
    lawyer_id: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    session_id: str
    usage: Optional[dict] = None

SYSTEM_PROMPTS = {
    "general": """Eres un asistente legal experto de Punto Cero Legal, una plataforma LegalTech premium en LATAM.
Brindas asesoría jurídica profesional, redactas documentos legales y orientas a abogados en sus casos.
Responde siempre en español de manera profesional, citando jurisprudencia cuando sea relevante.""",
    
    "demanda": """Eres un experto en redacción de demandas judiciales. Genera el documento siguiendo la estructura procesal estándar:
1. Encabezado del juzgado
2. Identificación de las partes
3. Hechos
4. Fundamentos de derecho
5. Pretensiones
6. Pruebas
7. Notificaciones
Usa lenguaje jurídico técnico y formal.""",
    
    "tutela": """Eres un experto en acciones de tutela (amparo constitucional). Redacta una tutela completa que incluya:
1. Juez competente
2. Datos del accionante
3. Datos del accionado
4. Hechos
5. Derechos fundamentales vulnerados
6. Pretensiones
7. Juramento
Cita la Constitución y jurisprudencia relevante.""",
    
    "contrato": """Eres un experto en redacción de contratos. Genera contratos profesionales con:
1. Identificación de las partes
2. Objeto del contrato
3. Obligaciones de cada parte
4. Precio y forma de pago
5. Duración
6. Cláusulas de incumplimiento
7. Resolución de conflictos
8. Firmas""",
    
    "peticion": """Eres un experto en derechos de petición. Redacta peticiones que cumplan con la Ley 1755 de 2015:
1. Designación de la autoridad
2. Identificación del peticionario
3. Objeto de la petición
4. Razones en que se apoya
5. Documentos que acompañan
6. Notificaciones""",
    
    "analisis": """Eres un experto en análisis jurisprudencial. Analiza documentos legales y proporciona:
1. Resumen ejecutivo
2. Identificación de cuestiones jurídicas relevantes
3. Jurisprudencia aplicable
4. Doctrina pertinente
5. Estrategia jurídica recomendada
6. Riesgos y oportunidades"""
}

@router.get("/usage/{lawyer_id}", response_model=dict)
async def get_ai_usage(lawyer_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Consumo de consultas IA del mes actual y límite del plan."""
    plan, limit = await _resolve_limit(lawyer_id, db)
    used = await _get_usage(lawyer_id, db)
    return {
        "plan": plan,
        "limit": limit,
        "used": used,
        "remaining": (-1 if limit == -1 else max(0, limit - used)),
        "unlimited": limit == -1,
        "period": _current_period(),
    }


@router.post("/chat", response_model=ChatResponse)
async def chat_with_ai(request: ChatRequest, db: AsyncIOMotorDatabase = Depends(get_db)):
    api_key = os.environ.get("EMERGENT_LLM_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="AI service not configured")

    # Control de límite por plan
    plan, limit = await _resolve_limit(request.lawyer_id, db)
    used = await _get_usage(request.lawyer_id, db) if request.lawyer_id else 0
    if request.lawyer_id and limit != -1 and used >= limit:
        raise HTTPException(
            status_code=429,
            detail=f"Has alcanzado el límite de {limit} consultas de tu plan '{plan}' este mes. Actualiza tu plan para continuar.",
        )

    session_id = request.session_id or str(uuid.uuid4())
    system_message = SYSTEM_PROMPTS.get(request.template, SYSTEM_PROMPTS["general"])

    try:
        chat = LlmChat(
            api_key=api_key,
            session_id=session_id,
            system_message=system_message
        ).with_model("openai", "gpt-4o-mini")

        user_message = UserMessage(text=request.message)
        response = await chat.send_message(user_message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI error: {str(e)}")

    # Contabiliza la consulta consumida (solo si hay abogado identificado)
    usage_info = None
    if request.lawyer_id:
        await db.ai_usage.update_one(
            {"lawyer_id": request.lawyer_id, "period": _current_period()},
            {"$inc": {"count": 1}, "$set": {"updated_at": datetime.utcnow()}},
            upsert=True,
        )
        new_used = used + 1
        usage_info = {
            "plan": plan,
            "limit": limit,
            "used": new_used,
            "remaining": (-1 if limit == -1 else max(0, limit - new_used)),
            "unlimited": limit == -1,
        }

    return ChatResponse(response=response, session_id=session_id, usage=usage_info)

@router.get("/templates")
async def get_templates():
    return {
        "templates": [
            {"id": "general", "name": "Consulta General", "description": "Asistente jurídico general", "icon": "Brain"},
            {"id": "demanda", "name": "Redactar Demanda", "description": "Genera demandas completas", "icon": "Gavel"},
            {"id": "tutela", "name": "Acción de Tutela", "description": "Amparo constitucional", "icon": "Shield"},
            {"id": "contrato", "name": "Redactar Contrato", "description": "Contratos profesionales", "icon": "FileText"},
            {"id": "peticion", "name": "Derecho de Petición", "description": "Solicitudes formales", "icon": "Mail"},
            {"id": "analisis", "name": "Análisis Jurídico", "description": "Análisis de casos", "icon": "Search"},
        ]
    }
