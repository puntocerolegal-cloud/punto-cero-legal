from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorDatabase
import os
import uuid
import httpx

router = APIRouter(prefix="/ai", tags=["AI Legal Assistant"])

# IA base gratuita para TODOS los planes: Google Gemini Flash via API REST
GEMINI_MODEL = "gemini-1.5-flash"
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"


async def get_db():
    from server import db
    return db


def _current_period() -> str:
    now = datetime.utcnow()
    return f"{now.year}-{now.month:02d}"


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


async def _call_gemini(api_key: str, system_message: str, history: List[dict], message: str) -> str:
    """Llama a Gemini Flash via REST. history = [{role:'user'|'model', text:str}]."""
    contents = [{"role": h["role"], "parts": [{"text": h["text"]}]} for h in history]
    contents.append({"role": "user", "parts": [{"text": message}]})
    payload = {
        "system_instruction": {"parts": [{"text": system_message}]},
        "contents": contents,
        "generationConfig": {"temperature": 0.7, "maxOutputTokens": 2048},
    }
    async with httpx.AsyncClient(timeout=60) as client:
        r = await client.post(GEMINI_URL, params={"key": api_key}, json=payload)
    if r.status_code == 429:
        # Límite de tasa de Gemini → señal para mostrar banner de upgrade
        raise HTTPException(status_code=429, detail="gemini_rate_limit")
    if r.status_code != 200:
        raise HTTPException(status_code=502, detail=f"Gemini error: {r.text[:200]}")
    data = r.json()
    try:
        return data["candidates"][0]["content"]["parts"][0]["text"]
    except (KeyError, IndexError):
        raise HTTPException(status_code=502, detail="Respuesta vacía de Gemini")


@router.get("/usage/{lawyer_id}", response_model=dict)
async def get_ai_usage(lawyer_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Consumo de consultas del mes actual (sin límites: solo informativo / banner)."""
    used = await _get_usage(lawyer_id, db)
    return {"used": used, "period": _current_period(), "model": GEMINI_MODEL, "free": True}


@router.post("/chat", response_model=ChatResponse)
async def chat_with_ai(request: ChatRequest, db: AsyncIOMotorDatabase = Depends(get_db)):
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY no configurada")

    session_id = request.session_id or str(uuid.uuid4())
    system_message = SYSTEM_PROMPTS.get(request.template, SYSTEM_PROMPTS["general"])

    # Memoria de conversación por sesión (Gemini REST es stateless)
    session = await db.ai_sessions.find_one({"session_id": session_id})
    history = session.get("messages", []) if session else []

    response_text = await _call_gemini(api_key, system_message, history, request.message)

    # Persiste el turno en la sesión
    new_messages = history + [
        {"role": "user", "text": request.message},
        {"role": "model", "text": response_text},
    ]
    await db.ai_sessions.update_one(
        {"session_id": session_id},
        {"$set": {"messages": new_messages[-40:], "updated_at": datetime.utcnow()}},
        upsert=True,
    )

    # Conteo mensual (sin límite) para alimentar el banner de upgrade
    usage_info = None
    if request.lawyer_id:
        await db.ai_usage.update_one(
            {"lawyer_id": request.lawyer_id, "period": _current_period()},
            {"$inc": {"count": 1}, "$set": {"updated_at": datetime.utcnow()}},
            upsert=True,
        )
        used = await _get_usage(request.lawyer_id, db)
        usage_info = {"used": used, "period": _current_period(), "free": True}

    return ChatResponse(response=response_text, session_id=session_id, usage=usage_info)


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
