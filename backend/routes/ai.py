from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import os
from emergentintegrations.llm.chat import LlmChat, UserMessage
import uuid

router = APIRouter(prefix="/ai", tags=["AI Legal Assistant"])

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    template: Optional[str] = "general"

class ChatResponse(BaseModel):
    response: str
    session_id: str

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

@router.post("/chat", response_model=ChatResponse)
async def chat_with_ai(request: ChatRequest):
    api_key = os.environ.get("EMERGENT_LLM_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="AI service not configured")
    
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
        
        return ChatResponse(response=response, session_id=session_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI error: {str(e)}")

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
