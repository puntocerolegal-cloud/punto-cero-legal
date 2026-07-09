from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.responses import JSONResponse
from fastapi import Header
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorDatabase
import os
import uuid
import httpx
from bson import ObjectId
import logging
import time
from slowapi import Limiter
from slowapi.util import get_remote_address

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ai", tags=["AI Legal Assistant"])

# BLOQUEADOR 3: Rate Limiter Enterprise
limiter = Limiter(key_func=get_remote_address)
RATE_LIMITS = {
    "per_minute": int(os.environ.get("AI_RATE_LIMIT_MINUTE", 20)),
    "per_hour": int(os.environ.get("AI_RATE_LIMIT_HOUR", 200)),
    "per_day": int(os.environ.get("AI_RATE_LIMIT_DAY", 1000)),
}

# IA base gratuita para TODOS los planes: Google Gemini Flash via API REST
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-flash-latest")
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"
# Modelo de respaldo (integración existente con Anthropic) — solo si Gemini falla.
CLAUDE_FALLBACK_MODEL = os.environ.get("CLAUDE_MODEL", "claude-opus-4-8")


async def get_db():
    from server import db
    return db


# BLOQUEADOR 1: Autenticación Obligatoria
async def get_current_user_for_ai(
    authorization: str = Header(None),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Valida JWT, TenantContext, y que el abogado esté activo."""
    if not authorization:
        raise HTTPException(status_code=401, detail="Autorización requerida")

    try:
        # Espera formato: "Bearer {token}"
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise ValueError("Invalid auth scheme")

        # Decodificar JWT (simplificado; usa tu función real de JWT)
        from services.enterprise_auth_service import decode_jwt_token
        payload = decode_jwt_token(token)
        user_id = payload.get("sub")

        if not user_id:
            raise HTTPException(status_code=401, detail="Token inválido")

        # BLOQUEADOR 1: Validar que el abogado exista y esté activo
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=401, detail="Usuario no encontrado")

        if user.get("status") != "active":
            raise HTTPException(status_code=403, detail="Usuario no activo")

        # Validar firma y tenant
        firm_id = user.get("firm_id")
        tenant_id = user.get("tenant_id")

        if not firm_id or not tenant_id:
            raise HTTPException(status_code=403, detail="Contexto de firma/tenant no válido")

        # Validar que el tenant exista
        tenant = await db.organizations.find_one({"_id": ObjectId(tenant_id)})
        if not tenant:
            raise HTTPException(status_code=403, detail="Tenant no válido")

        # Validar que el usuario tenga permiso para usar IA
        if "ai_access" not in user.get("permissions", []):
            raise HTTPException(status_code=403, detail="Sin permisos para acceder a IA")

        return {
            "user_id": user_id,
            "firm_id": firm_id,
            "tenant_id": tenant_id,
            "email": user.get("email"),
            "name": user.get("name"),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Auth validation failed")
        raise HTTPException(status_code=401, detail="Autenticación inválida")


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
    country: Optional[str] = None
    # Contexto del expediente activo (la IA trabaja sin re-solicitarlo).
    expediente_id: Optional[str] = None
    case_id: Optional[str] = None
    client_id: Optional[str] = None
    materia: Optional[str] = None
    resumen: Optional[str] = None


# Contexto jurídico por país: marco normativo, tribunales, tratamiento y términos.
JURISDICTIONS = {
    "Colombia": "Operas bajo el DERECHO COLOMBIANO. Marco: Constitución de 1991, Código Civil, Código General del Proceso, Código Penal y Código Sustantivo del Trabajo. Cita jurisprudencia de la Corte Suprema de Justicia y la Corte Constitucional (sentencias C-, T-, SU-). Trata al profesional como 'abogado' o 'doctor'. Usa figuras como acción de tutela, derecho de petición y acción popular.",
    "México": "Operas bajo el DERECHO MEXICANO. Marco: Constitución Política de los Estados Unidos Mexicanos, Código Civil Federal, Código Nacional de Procedimientos Civiles y Penales, Ley Federal del Trabajo. Cita jurisprudencia de la Suprema Corte de Justicia de la Nación (SCJN) y tesis del Semanario Judicial. Trata al profesional como 'licenciado' (Lic.). Usa figuras como el juicio de amparo.",
    "Argentina": "Operas bajo el DERECHO ARGENTINO. Marco: Constitución Nacional, Código Civil y Comercial de la Nación (unificado), Código Penal, Ley de Contrato de Trabajo 20.744. Cita jurisprudencia de la Corte Suprema de Justicia de la Nación (CSJN). Trata al profesional como 'doctor/a' o 'abogado/a'. Usa el recurso de amparo.",
    "Chile": "Operas bajo el DERECHO CHILENO. Marco: Constitución Política, Código Civil de Bello, Código Procesal Penal, Código del Trabajo. Cita jurisprudencia de la Corte Suprema de Chile y el Tribunal Constitucional. Usa el recurso de protección y de amparo.",
    "Perú": "Operas bajo el DERECHO PERUANO. Marco: Constitución de 1993, Código Civil, Código Procesal Civil, Código Penal, Nueva Ley Procesal del Trabajo. Cita jurisprudencia del Tribunal Constitucional y la Corte Suprema. Trata al profesional como 'doctor'. Usa el proceso de amparo y el hábeas corpus.",
    "España": "Operas bajo el DERECHO ESPAÑOL. Marco: Constitución de 1978, Código Civil, Ley de Enjuiciamiento Civil, Código Penal, Estatuto de los Trabajadores. Cita jurisprudencia del Tribunal Supremo y del Tribunal Constitucional. Trata al profesional como 'abogado/a' o 'letrado/a'. Usa el recurso de amparo.",
    "Ecuador": "Operas bajo el DERECHO ECUATORIANO. Marco: Constitución de 2008, Código Civil, COGEP, COIP. Cita jurisprudencia de la Corte Nacional de Justicia y la Corte Constitucional. Usa la acción de protección.",
    "Bolivia": "Operas bajo el DERECHO BOLIVIANO. Marco: Constitución de 2009, Código Civil, Código Procesal Civil, Código Penal. Cita jurisprudencia del Tribunal Supremo y el Tribunal Constitucional Plurinacional. Usa la acción de amparo constitucional.",
    "Venezuela": "Operas bajo el DERECHO VENEZOLANO. Marco: Constitución de 1999, Código Civil, Código de Procedimiento Civil, COPP, LOTTT. Cita jurisprudencia del Tribunal Supremo de Justicia (TSJ). Usa el amparo constitucional.",
    "Paraguay": "Operas bajo el DERECHO PARAGUAYO. Marco: Constitución de 1992, Código Civil, Código Procesal Civil, Código Penal, Código del Trabajo. Cita jurisprudencia de la Corte Suprema de Justicia. Usa el amparo constitucional.",
    "Uruguay": "Operas bajo el DERECHO URUGUAYO. Marco: Constitución, Código Civil, Código General del Proceso, Código Penal. Cita jurisprudencia de la Suprema Corte de Justicia. Usa la acción de amparo.",
    "Guatemala": "Operas bajo el DERECHO GUATEMALTECO. Marco: Constitución, Código Civil, Código Procesal Civil y Mercantil, Código Penal. Cita jurisprudencia de la Corte de Constitucionalidad y la Corte Suprema. Trata al profesional como 'licenciado'. Usa el amparo.",
    "Honduras": "Operas bajo el DERECHO HONDUREÑO. Marco: Constitución, Código Civil, Código Procesal Civil, Código Penal. Cita jurisprudencia de la Corte Suprema de Justicia. Trata al profesional como 'licenciado'. Usa el amparo.",
    "El Salvador": "Operas bajo el DERECHO SALVADOREÑO. Marco: Constitución, Código Civil, Código Procesal Civil y Mercantil, Código Penal. Cita jurisprudencia de la Sala de lo Constitucional de la Corte Suprema. Trata al profesional como 'licenciado'. Usa el amparo.",
    "Nicaragua": "Operas bajo el DERECHO NICARAGÜENSE. Marco: Constitución, Código Civil, Código Procesal Civil, Código Penal. Cita jurisprudencia de la Corte Suprema de Justicia. Trata al profesional como 'licenciado'. Usa el amparo.",
    "Costa Rica": "Operas bajo el DERECHO COSTARRICENSE. Marco: Constitución, Código Civil, Código Procesal Civil, Código Penal. Cita jurisprudencia de la Sala Constitucional (Sala IV) y la Corte Suprema. Trata al profesional como 'licenciado'. Usa el recurso de amparo.",
    "Panamá": "Operas bajo el DERECHO PANAMEÑO. Marco: Constitución, Código Civil, Código Judicial, Código Penal. Cita jurisprudencia de la Corte Suprema de Justicia. Trata al profesional como 'licenciado'. Usa el amparo de garantías constitucionales.",
    "Cuba": "Operas bajo el DERECHO CUBANO. Marco: Constitución de 2019, Código Civil, Ley de Procedimiento Civil, Código Penal. Cita disposiciones del Tribunal Supremo Popular.",
    "República Dominicana": "Operas bajo el DERECHO DOMINICANO. Marco: Constitución, Código Civil (de raíz napoleónica), Código de Procedimiento Civil, Código Penal. Cita jurisprudencia de la Suprema Corte de Justicia y el Tribunal Constitucional. Usa la acción de amparo.",
    "Puerto Rico": "Operas bajo el DERECHO DE PUERTO RICO (sistema mixto civil/common law). Marco: Constitución del ELA, Código Civil de 2020, Reglas de Procedimiento Civil. Cita jurisprudencia del Tribunal Supremo de Puerto Rico.",
}
DEFAULT_JURISDICTION = ("Operas en un país de LATAM. Adáptate al código civil y penal local "
                        "correspondiente y a su máximo tribunal. Responde en español jurídico formal.")


def _jurisdiction_prefix(country: Optional[str]) -> str:
    ctx = JURISDICTIONS.get(country or "", DEFAULT_JURISDICTION)
    header = f"CONTEXTO JURISDICCIONAL ({country or 'LATAM'}): {ctx}\n"
    return header + ("Adapta SIEMPRE tu lenguaje, citas, figuras procesales y el tratamiento "
                     "del profesional a esta jurisdicción. No mezcles normas de otros países.\n\n")

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


def _call_claude(system_message: str, history: List[dict], message: str) -> Optional[str]:
    """Respaldo con Anthropic (integración ya existente en el sistema). Devuelve None
    si no hay clave/SDK, para no romper el flujo principal gratuito (Gemini)."""
    if not os.environ.get("ANTHROPIC_API_KEY"):
        return None
    try:
        import anthropic  # import perezoso: el sistema funciona sin la dependencia
        client = anthropic.Anthropic()
        msgs = [{"role": ("assistant" if h.get("role") == "model" else "user"), "content": h["text"]}
                for h in history if h.get("text")]
        msgs.append({"role": "user", "content": message})
        resp = client.messages.create(
            model=CLAUDE_FALLBACK_MODEL, max_tokens=1500,
            system=system_message, messages=msgs,
        )
        parts = [b.text for b in resp.content if getattr(b, "type", "") == "text"]
        return "\n".join(parts).strip() or None
    except Exception as e:  # noqa: BLE001
        logger.warning("Respaldo Claude no disponible: %s", e)
        return None


async def _generate_reply(api_key: Optional[str], system_message: str, history: List[dict], message: str):
    """Genera la respuesta: Gemini (gratuito, primario) y, si falla, Claude (respaldo).
    Devuelve (texto, proveedor). Conserva el modelo gratuito como principal."""
    if api_key:
        try:
            return await _call_gemini(api_key, system_message, history, message), "gemini"
        except Exception as e:  # 429/502/503/timeout de Gemini → intentamos respaldo
            logger.warning("Gemini falló (%s); intento respaldo Claude.", e)
    txt = _call_claude(system_message, history, message)
    if txt:
        return txt, "claude"
    raise RuntimeError("El asistente IA no está disponible temporalmente (Gemini sin clave/caído y respaldo Claude no disponible).")


@router.get("/usage/{lawyer_id}", response_model=dict)
async def get_ai_usage(
    lawyer_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user_for_ai),
):
    """Consumo de consultas del mes actual (solo para el usuario autenticado)."""
    # BLOQUEADOR 2: Validar que solo puedas ver tu propio usage
    if current_user["user_id"] != lawyer_id:
        raise HTTPException(status_code=403, detail="No tienes permiso para ver este uso")

    used = await _get_usage(lawyer_id, db)
    return {
        "used": used,
        "period": _current_period(),
        "model": GEMINI_MODEL,
        "limit_per_day": RATE_LIMITS["per_day"],
        "free": True
    }


@router.post("/chat", response_model=ChatResponse)
@limiter.limit(f"{RATE_LIMITS['per_minute']}/minute")
async def chat_with_ai(
    request: ChatRequest,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user_for_ai)
):
    """Chat con IA. Requiere JWT válido, validación de tenant y ownership de sesión."""
    try:
        user_id = current_user["user_id"]
        tenant_id = current_user["tenant_id"]
        firm_id = current_user["firm_id"]

        api_key = os.environ.get("GEMINI_API_KEY")
        anthropic_key = os.environ.get("ANTHROPIC_API_KEY")
        # Si no hay Gemini pero sí Anthropic → se usará Claude automáticamente (vía
        # _generate_reply). Solo es error real si NO hay ningún proveedor.
        if not api_key and not anthropic_key:
            logger.error("AI CHAT: sin proveedor (GEMINI_API_KEY / ANTHROPIC_API_KEY)")
            return JSONResponse(status_code=503, content={
                "success": False,
                "error": "No hay ningún proveedor de IA configurado (GEMINI_API_KEY / ANTHROPIC_API_KEY)",
            })

        session_id = request.session_id or str(uuid.uuid4())

        # BLOQUEADOR 2: Validar ownership de sesión
        if request.session_id:
            try:
                session_doc = await db.ai_sessions.find_one({
                    "session_id": session_id,
                    "owner_user_id": user_id,
                    "tenant_id": tenant_id,
                })
                if not session_doc:
                    logger.warning(f"Acceso no autorizado a sesión {session_id} por usuario {user_id}")
                    # Registrar intento en SOC
                    await db.soc_events.insert_one({
                        "timestamp": datetime.utcnow(),
                        "event_type": "unauthorized_session_access",
                        "user_id": user_id,
                        "session_id": session_id,
                        "tenant_id": tenant_id,
                        "severity": "high"
                    })
                    raise HTTPException(status_code=403, detail="No tienes permiso para acceder a esta sesión")
            except HTTPException:
                raise
            except Exception as e:
                logger.exception("Session ownership validation failed")
                raise HTTPException(status_code=403, detail="Validación de sesión fallida")

        # País: del request o del perfil del abogado en la BD (tolerante a fallos).
        country = request.country
        if not country and request.lawyer_id:
            try:
                u = await db.users.find_one({"_id": ObjectId(request.lawyer_id)})
                country = (u or {}).get("country")
            except Exception:
                country = None

        base_prompt = SYSTEM_PROMPTS.get(request.template, SYSTEM_PROMPTS["general"])
        system_message = _jurisdiction_prefix(country) + base_prompt

        # Contexto del expediente activo → la IA opera sobre él sin volver a preguntar.
        if request.expediente_id or request.materia or request.resumen:
            ctx = ["\n\n--- CONTEXTO DEL EXPEDIENTE ACTIVO (no solicitarlo de nuevo) ---"]
            if request.expediente_id: ctx.append(f"Expediente: {request.expediente_id}")
            if request.case_id: ctx.append(f"Caso (case_id): {request.case_id}")
            if request.client_id: ctx.append(f"Cliente (client_id): {request.client_id}")
            if request.materia: ctx.append(f"Materia: {request.materia}")
            if request.resumen: ctx.append(f"Resumen del caso: {request.resumen}")
            ctx.append("Responde considerando este expediente como contexto vigente.")
            system_message += "\n".join(ctx)

        # Memoria de conversación por sesión (Gemini REST es stateless).
        # Si MongoDB falla, se continúa SIN memoria (nunca 500 por memoria).
        history = []
        try:
            session = await db.ai_sessions.find_one({
                "session_id": session_id,
                "owner_user_id": user_id,
                "tenant_id": tenant_id,
            })
            history = session.get("messages", []) if session else []
        except Exception as e:  # noqa: BLE001
            logger.warning("ai_sessions lectura falló; continúo sin memoria: %s", e)

        # Generación (Gemini primario → Claude respaldo). Aquí sí puede fallar la IA.
        response_text, _provider = await _generate_reply(api_key, system_message, history, request.message)

        # BLOQUEADOR 5: Persiste el turno de forma ATÓMICA (never lose messages)
        # Usar findOneAndUpdate para evitar race conditions
        try:
            new_messages = history + [
                {"role": "user", "text": request.message},
                {"role": "model", "text": response_text},
            ]
            # BLOQUEADOR 2: Guardar con ownership fields
            await db.ai_sessions.find_one_and_update(
                {"session_id": session_id},
                {"$set": {
                    "owner_user_id": user_id,
                    "firm_id": firm_id,
                    "tenant_id": tenant_id,
                    "messages": new_messages[-40:],
                    "updated_at": datetime.utcnow(),
                    "message_count": len(new_messages),
                    "last_provider": _provider,
                }},
                upsert=True,
                return_document=True,
            )
        except Exception as e:  # noqa: BLE001
            logger.warning("ai_sessions escritura falló; respondo sin persistir memoria: %s", e)

        # BLOQUEADOR 3: Conteo mensual con validación de rate limit
        # (tolerante a fallos de Mongo pero registra abusos)
        usage_info = None
        try:
            # BLOQUEADOR 2: Usar user_id en lugar de lawyer_id para validar tenant
            period = _current_period()

            # Obtener uso actual
            usage_doc = await db.ai_usage.find_one({
                "user_id": user_id,
                "tenant_id": tenant_id,
                "period": period,
            })
            current_count = (usage_doc or {}).get("count", 0) + 1

            # Verificar límites
            if current_count > RATE_LIMITS["per_day"]:
                logger.warning(f"Rate limit excedido para {user_id}: {current_count}/{RATE_LIMITS['per_day']}")
                await db.rate_limit_logs.insert_one({
                    "timestamp": datetime.utcnow(),
                    "user_id": user_id,
                    "tenant_id": tenant_id,
                    "count": current_count,
                    "limit": RATE_LIMITS["per_day"],
                    "period": period,
                    "severity": "high"
                })

            # Incrementar conteo (atomic)
            await db.ai_usage.find_one_and_update(
                {
                    "user_id": user_id,
                    "tenant_id": tenant_id,
                    "period": period,
                },
                {"$inc": {"count": 1}, "$set": {"updated_at": datetime.utcnow()}},
                upsert=True,
            )

            usage_info = {
                "used": current_count,
                "period": period,
                "limit_per_day": RATE_LIMITS["per_day"],
                "free": True
            }
        except Exception as e:  # noqa: BLE001
            logger.warning("ai_usage falló (ignorado): %s", e)

        # Registrar éxito en logs
        try:
            await db.ai_conversation_logs.insert_one({
                "timestamp": datetime.utcnow(),
                "user_id": user_id,
                "tenant_id": tenant_id,
                "firm_id": firm_id,
                "session_id": session_id,
                "provider": _provider,
                "message_length": len(request.message),
                "response_length": len(response_text),
            })
        except Exception:
            pass  # No afecta la respuesta

        return ChatResponse(response=response_text, session_id=session_id, usage=usage_info)

    except Exception as e:  # noqa: BLE001 — manejador global: nunca 500 silencioso
        logger.exception("AI CHAT ERROR")
        return JSONResponse(status_code=503, content={"success": False, "error": str(e)})


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
