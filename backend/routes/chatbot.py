"""
Chatbot legal inteligente + integración WhatsApp — Punto Cero Legal.

Flujo:
  1. El formulario público crea la consulta (CON-YYYY-NNN) y notifica al admin.
  2. Se activa el chatbot: envía bienvenida (según país) por WhatsApp + correo.
  3. El chatbot recaba información con preguntas inteligentes (Claude si hay
     ANTHROPIC_API_KEY; si no, flujo guionado determinista que igual funciona).
  4. Clasifica al cliente (Curioso/Urgente/Alto Valor/Indeciso), puntúa la
     probabilidad de conversión (1–100) y recomienda una acción.
  5. Envía el reporte final + alerta al panel del administrador.

Integraciones (degradación elegante si faltan credenciales):
  • WhatsApp: Twilio (utils.notifier.send_whatsapp) — si no, queda en cola/log.
  • IA: Claude (Anthropic SDK, claude-opus-4-8) — si no, flujo guionado.
"""
from fastapi import APIRouter, Request, Depends
from typing import Optional, List
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
import os
import logging

from utils import notifier

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Chatbot Legal · WhatsApp"])


async def get_db():
    from server import db
    # Bypass GuardedDB for direct-access routes; tenant isolation is enforced
    # via get_current_user + explicit firm filtering (same pattern as routes/auth.py).
    if hasattr(db, "_real_db"):
        return db._real_db
    return db


# ───────────── Clasificación por país ─────────────
# prefix: indicativo telefónico. group: tono del mensaje de bienvenida.
COUNTRY_INTAKE = {
    "Colombia":             {"prefix": "+57",  "term": "abogado",    "group": "latam", "law": "derecho colombiano"},
    "Venezuela":            {"prefix": "+58",  "term": "abogado",    "group": "latam", "law": "derecho venezolano"},
    "Perú":                 {"prefix": "+51",  "term": "doctor",     "group": "latam", "law": "derecho peruano"},
    "Ecuador":              {"prefix": "+593", "term": "abogado",    "group": "latam", "law": "derecho ecuatoriano"},
    "Bolivia":              {"prefix": "+591", "term": "abogado",    "group": "latam", "law": "derecho boliviano"},
    "Argentina":            {"prefix": "+54",  "term": "doctor",     "group": "latam", "law": "Código Civil y Comercial argentino"},
    "Chile":                {"prefix": "+56",  "term": "abogado",    "group": "latam", "law": "derecho chileno"},
    "Paraguay":             {"prefix": "+595", "term": "abogado",    "group": "latam", "law": "derecho paraguayo"},
    "Uruguay":              {"prefix": "+598", "term": "abogado",    "group": "latam", "law": "derecho uruguayo"},
    "México":               {"prefix": "+52",  "term": "licenciado", "group": "mexico_ca", "law": "derecho mexicano"},
    "Guatemala":            {"prefix": "+502", "term": "licenciado", "group": "mexico_ca", "law": "derecho guatemalteco"},
    "Honduras":             {"prefix": "+504", "term": "licenciado", "group": "mexico_ca", "law": "derecho hondureño"},
    "El Salvador":          {"prefix": "+503", "term": "licenciado", "group": "mexico_ca", "law": "derecho salvadoreño"},
    "Nicaragua":            {"prefix": "+505", "term": "licenciado", "group": "mexico_ca", "law": "derecho nicaragüense"},
    "Costa Rica":           {"prefix": "+506", "term": "licenciado", "group": "mexico_ca", "law": "derecho costarricense"},
    "Panamá":               {"prefix": "+507", "term": "licenciado", "group": "mexico_ca", "law": "derecho panameño"},
    "Cuba":                 {"prefix": "+53",  "term": "abogado",    "group": "latam", "law": "derecho cubano"},
    "República Dominicana": {"prefix": "+1",   "term": "abogado",    "group": "latam", "law": "derecho dominicano"},
    "Puerto Rico":          {"prefix": "+1",   "term": "abogado",    "group": "latam", "law": "derecho de Puerto Rico"},
    "España":               {"prefix": "+34",  "term": "abogado",    "group": "espana", "law": "derecho español (TS y TC)"},
}
DEFAULT_INTAKE = {"prefix": "", "term": "abogado", "group": "latam", "law": "el código civil y penal local"}


def get_country_intake(country: Optional[str]) -> dict:
    return COUNTRY_INTAKE.get(country or "", DEFAULT_INTAKE)


def normalize_phone(phone: Optional[str], country: Optional[str]) -> Optional[str]:
    """Valida/normaliza el teléfono con el prefijo del país seleccionado."""
    if not phone:
        return None
    digits = "".join(ch for ch in phone if ch.isdigit())
    if not digits:
        return None
    cfg = get_country_intake(country)
    prefix = cfg["prefix"].replace("+", "")
    if phone.strip().startswith("+"):
        return "+" + digits
    if prefix and not digits.startswith(prefix):
        return f"+{prefix}{digits}"
    return f"+{digits}"


def welcome_message(name: str, con: str, area: str, country: Optional[str]) -> str:
    cfg = get_country_intake(country)
    first = (name or "").split(" ")[0] or name or ""
    if cfg["group"] == "espana":
        return (f"Hola {first}, soy el asistente legal de PuntoCero Legal. "
                f"Hemos recibido su consulta #{con} sobre {area}. Un abogado especialista, "
                f"conforme al {cfg['law']}, la revisará en breve.")
    if cfg["group"] == "mexico_ca":
        return (f"Estimado/a {first}, soy el asistente legal de PuntoCero Legal. "
                f"Hemos recibido su caso #{con} sobre {area}. Un licenciado especialista "
                f"en {cfg['law']} lo revisará en breve.")
    return (f"Hola {first}, soy el asistente legal de PuntoCero Legal. "
            f"Hemos recibido tu caso #{con} sobre {area}. Un abogado especialista lo revisará en breve.")


# ───────────── Línea de tiempo del caso (5 estados) ─────────────
TIMELINE_STAGES = [
    {"key": "recibido",   "label": "Caso recibido",            "icon": "✅"},
    {"key": "revision",   "label": "En revisión por especialista", "icon": "⏳"},
    {"key": "asignacion", "label": "Asignación de abogado",     "icon": "📋"},
    {"key": "consulta",   "label": "Consulta programada",       "icon": "⚖️"},
    {"key": "proceso",    "label": "Caso en proceso",           "icon": "✔️"},
]


def init_timeline() -> list:
    now = datetime.utcnow()
    states = []
    for i, st in enumerate(TIMELINE_STAGES):
        states.append({
            **st,
            "status": "done" if i == 0 else ("current" if i == 1 else "pending"),
            "at": now.isoformat() + "Z" if i == 0 else None,
        })
    return states


def render_timeline(states: list) -> str:
    lines = []
    for s in states:
        when = ""
        if s.get("at"):
            try:
                when = " - " + datetime.fromisoformat(s["at"].replace("Z", "")).strftime("%d/%m/%Y %H:%M")
            except Exception:
                when = ""
        mark = s["icon"] if s["status"] in ("done", "current") else "▫️"
        lines.append(f"{mark} {s['label']}{when}")
    return "Estado de tu caso:\n" + "\n".join(lines)


# ───────────── Preguntas del chatbot ─────────────
BASE_QUESTIONS = [
    "¿Cuándo ocurrieron los hechos?",
    "¿Tienes documentos o pruebas que puedas compartir?",
    "¿Tienes alguna fecha límite o audiencia próxima?",
    "¿Has tenido algún abogado antes en este caso?",
]
AREA_QUESTIONS = {
    "Laboral": "¿Sigues trabajando en la empresa o ya terminó la relación laboral?",
    "Derecho Laboral": "¿Sigues trabajando en la empresa o ya terminó la relación laboral?",
    "Familia": "¿El caso involucra menores de edad o pensión alimentaria?",
    "Derecho de Familia": "¿El caso involucra menores de edad o pensión alimentaria?",
    "Penal": "¿Hay alguna persona detenida o con medida de aseguramiento?",
    "Derecho Penal": "¿Hay alguna persona detenida o con medida de aseguramiento?",
    "Civil": "¿Existe un contrato o documento que respalde tu reclamación?",
    "Derecho Civil": "¿Existe un contrato o documento que respalde tu reclamación?",
    "Mercantil": "¿El caso involucra a una empresa o sociedad comercial?",
    "Derecho Comercial": "¿El caso involucra a una empresa o sociedad comercial?",
    "Administrativo": "¿El conflicto es contra una entidad pública o del Estado?",
}


def questions_for(area: str) -> list:
    qs = list(BASE_QUESTIONS)
    extra = AREA_QUESTIONS.get(area)
    if extra:
        qs.append(extra)
    return qs


# ───────────── Clasificación psicológica + scoring ─────────────
def classify_client(answers_text: str, area: str) -> dict:
    t = (answers_text or "").lower()

    def has(*words):
        return any(w in t for w in words)

    if has("empresa", "patrimonio", "sociedad", "contrato millonario", "millones", "inmueble",
           "varios contratos", "corporativo", "accionista", "franquicia"):
        cls, score, rec = "ALTO_VALOR", 90, "Escalar al abogado senior y dar trato VIP"
    elif has("urgente", "audiencia", "embargo", "detenid", "captura", "mañana", "plazo",
             "vence", "desalojo", "divorcio en curso", "medida cautelar", "hoy"):
        cls, score, rec = "URGENTE", 85, "Llamar AHORA — hay un plazo o medida en curso"
    elif has("no sé", "no se", "cuánto cuesta", "cuanto cuesta", "precio", "costo", "tal vez",
             "quizá", "quiza", "depende", "lo pensaré", "no estoy seguro"):
        cls, score, rec = "INDECISO", 45, "Enviar propuesta con plan de pago y eliminar objeciones"
    else:
        cls, score, rec = "CURIOSO", 35, "Dar seguimiento y ofrecer consulta gratuita de 15 min"

    # Ajustes
    if len(t) > 400:
        score = min(100, score + 8)
    if "documento" in t or "prueba" in t or "contrato" in t:
        score = min(100, score + 5)
    return {"classification": cls, "conversion_score": score, "recommended_action": rec}


CLASS_LABEL = {
    "ALTO_VALOR": "Prospecto de Alto Valor", "URGENTE": "Urgente",
    "INDECISO": "Indeciso", "CURIOSO": "Curioso",
}


# ───────────── IA Claude (opcional, con fallback) ─────────────
def _claude_available() -> bool:
    return bool(os.environ.get("ANTHROPIC_API_KEY"))


def build_bot_system_prompt(case: dict) -> str:
    cfg = get_country_intake(case.get("client_country"))
    term = cfg["term"]
    return (
        f"Eres el asistente legal de PuntoCero Legal que atiende por WhatsApp a {case.get('client_name','el cliente')} "
        f"en {case.get('client_country','LATAM')}, bajo {cfg['law']}. Trátalo como '{term}' cuando corresponda.\n"
        f"Caso #{case.get('case_number')} · Área: {case.get('legal_area')}.\n\n"
        "OBJETIVO: recabar información del caso con preguntas inteligentes, una a la vez, "
        "y persuadir al cliente para que contrate. Reglas de comportamiento:\n"
        "- Usa el nombre del cliente en cada mensaje.\n"
        "- Prueba social: 'Hemos ayudado a más de 168 clientes con casos similares en "
        f"{case.get('client_country','tu país')}'.\n"
        "- Genera confianza: abogados certificados y especializados en su área.\n"
        "- Si el caso es urgente, menciona plazos legales reales del país y transmite empatía y seguridad.\n"
        "- Cierre persuasivo: 'Tu caso tiene solución. ¿Quieres que un abogado especialista te llame hoy mismo?'.\n"
        "- Mensajes breves (apropiados para WhatsApp). Responde SIEMPRE en español."
    )


def _claude_reply(system_prompt: str, history: List[dict], next_question_hint: str) -> Optional[str]:
    """Genera el siguiente mensaje persuasivo con Claude. None si no está disponible."""
    if not _claude_available():
        return None
    try:
        import anthropic  # import perezoso: el servidor funciona sin la dependencia
        client = anthropic.Anthropic()
        msgs = [{"role": ("assistant" if h["role"] == "bot" else "user"),
                 "content": h["text"]} for h in history if h.get("text")]
        msgs.append({"role": "user", "content":
                     f"[Instrucción interna] Continúa la conversación. Tu siguiente objetivo es preguntar: "
                     f"«{next_question_hint}». Personaliza y persuade según las reglas."})
        resp = client.messages.create(
            model="claude-opus-4-8",
            max_tokens=400,
            thinking={"type": "adaptive"},
            system=system_prompt,
            messages=msgs,
        )
        parts = [b.text for b in resp.content if getattr(b, "type", "") == "text"]
        return "\n".join(parts).strip() or None
    except Exception as e:  # noqa: BLE001
        logger.warning("Claude no disponible, uso flujo guionado: %s", e)
        return None


def _claude_classify(case: dict, transcript: str) -> Optional[dict]:
    """Clasifica con Claude usando salida estructurada. None si no disponible."""
    if not _claude_available():
        return None
    try:
        import anthropic
        client = anthropic.Anthropic()
        schema = {
            "type": "object", "additionalProperties": False,
            "properties": {
                "classification": {"type": "string", "enum": ["CURIOSO", "URGENTE", "ALTO_VALOR", "INDECISO"]},
                "conversion_score": {"type": "integer"},
                "recommended_action": {"type": "string"},
                "summary": {"type": "string"},
            },
            "required": ["classification", "conversion_score", "recommended_action", "summary"],
        }
        resp = client.messages.create(
            model="claude-opus-4-8",
            max_tokens=600,
            thinking={"type": "adaptive"},
            system=("Clasifica al cliente legal en CURIOSO, URGENTE, ALTO_VALOR o INDECISO, "
                    "asigna probabilidad de conversión 1–100 y recomienda una acción "
                    "(llamar ahora, enviar propuesta, agendar consulta, dar seguimiento)."),
            messages=[{"role": "user", "content": f"Caso {case.get('legal_area')} en {case.get('client_country')}.\n\n{transcript}"}],
            output_config={"format": {"type": "json_schema", "schema": schema}},
        )
        import json
        for b in resp.content:
            if getattr(b, "type", "") == "text":
                return json.loads(b.text)
    except Exception as e:  # noqa: BLE001
        logger.warning("Clasificación Claude no disponible, uso heurística: %s", e)
    return None


# ───────────── Motor de conversación ─────────────
async def start_intake_conversation(db, case: dict):
    """Arranca el chatbot tras crear la consulta: bienvenida + 1ª pregunta + timeline."""
    case_id = str(case["_id"]) if not isinstance(case.get("_id"), str) else case["_id"]
    name = case.get("client_name", "")
    con = case.get("case_number")
    area = case.get("legal_area", "tu caso")
    country = case.get("client_country")
    phone = case.get("client_phone")
    email = case.get("client_email")

    welcome = welcome_message(name, con, area, country)
    qs = questions_for(area)
    first_q = qs[0]
    cfg = get_country_intake(country)
    social = f"Hemos ayudado a más de 168 clientes con casos similares en {country or 'tu región'}. "
    first_msg = f"{welcome}\n\n{social}Para asignarte el especialista correcto, {name.split(' ')[0] if name else ''}: {first_q}"

    session = {
        "case_id": case_id,
        "consultation_number": con,
        "client_name": name,
        "phone": normalize_phone(phone, country),
        "email": email,
        "country": country,
        "legal_area": area,
        "questions": qs,
        "q_index": 0,
        "history": [{"role": "bot", "text": first_msg, "at": datetime.utcnow()}],
        "answers": [],
        "status": "active",            # active | completed
        "followup_stage": 0,           # 0 → ninguno; 1 → 2h; 2 → 24h
        "last_inbound_at": None,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    await db.chat_sessions.insert_one(session)

    # Envío multicanal de bienvenida + timeline
    if email:
        notifier.send_email(email, f"Consulta recibida #{con}",
                            f"<p>{welcome}</p><pre>{render_timeline(case.get('status_timeline', init_timeline()))}</pre>")
    if session["phone"]:
        notifier.send_whatsapp(session["phone"], first_msg)
        notifier.send_whatsapp(session["phone"], render_timeline(case.get("status_timeline", init_timeline())))
    return session


async def _finalize(db, session: dict, case: dict):
    """Genera clasificación + reporte y alerta al administrador."""
    transcript_lines = []
    for h in session["history"]:
        who = "Bot" if h["role"] == "bot" else "Cliente"
        transcript_lines.append(f"{who}: {h['text']}")
    transcript = "\n".join(transcript_lines)
    answers_text = " ".join(session.get("answers", []))

    result = _claude_classify(case, transcript) or classify_client(answers_text, session.get("legal_area", ""))
    cls = result["classification"]

    # Documentos pendientes: si dijo que tiene pruebas pero no las adjuntó por WhatsApp
    pending_docs = any(w in answers_text.lower() for w in ("sí", "si", "tengo", "documento", "prueba", "contrato"))

    report = {
        "case_id": session["case_id"],
        "consultation_number": session["consultation_number"],
        "classification": cls,
        "classification_label": CLASS_LABEL.get(cls, cls),
        "conversion_score": result["conversion_score"],
        "recommended_action": result["recommended_action"],
        "country": session.get("country"),
        "legal_area": session.get("legal_area"),
        "pending_documents": pending_docs,
        "transcript": transcript,
        "created_at": datetime.utcnow(),
    }
    await db.chatbot_reports.insert_one(report)

    # Persistir clasificación en el caso
    await db.cases.update_one(
        {"_id": ObjectId(session["case_id"])},
        {"$set": {
            "lead_classification": cls,
            "lead_classification_label": CLASS_LABEL.get(cls, cls),
            "conversion_score": result["conversion_score"],
            "recommended_action": result["recommended_action"],
            "chat_completed": True,
            "updated_at": datetime.utcnow(),
        }},
    )

    # Alerta al panel del administrador con todos los detalles
    await notifier.create_app_notification(
        db, target="admin", type="chatbot_report",
        title=f"Chatbot: {session['consultation_number']} · {CLASS_LABEL.get(cls, cls)} ({result['conversion_score']}%)",
        message=(f"{session.get('client_name')} ({session.get('legal_area')}, {session.get('country')}). "
                 f"Acción: {result['recommended_action']}. "
                 f"Documentos pendientes: {'sí' if pending_docs else 'no'}."),
        case_id=session["case_id"],
    )

    await db.chat_sessions.update_one({"_id": session["_id"]},
                                      {"$set": {"status": "completed", "updated_at": datetime.utcnow()}})

    # Cierre persuasivo al cliente + avanza timeline a "en revisión/asignación"
    closing = (f"{session.get('client_name','').split(' ')[0]}, tu caso tiene solución. "
               "¿Quieres que un abogado especialista te llame hoy mismo? Responde SÍ y lo coordinamos.")
    if session.get("phone"):
        notifier.send_whatsapp(session["phone"], closing)
    return report


async def process_inbound(db, phone_or_caseid: str, body: str, by_case_id: bool = False):
    """Procesa una respuesta entrante del cliente y devuelve el mensaje del bot."""
    query = {"case_id": phone_or_caseid} if by_case_id else {"phone": phone_or_caseid}
    session = await db.chat_sessions.find_one({**query, "status": "active"}, sort=[("created_at", -1)])
    if not session:
        # Item 7: WhatsApp entrante sin sesión activa → buscar el caso por teléfono,
        # crear la sesión automáticamente (reutiliza start_intake_conversation) y continuar.
        if by_case_id:
            return None
        digits = "".join(ch for ch in str(phone_or_caseid) if ch.isdigit())[-10:]
        case = await db.cases.find_one({"client_phone": phone_or_caseid}, sort=[("created_at", -1)])
        if not case and digits:
            case = await db.cases.find_one({"client_phone": {"$regex": f"{digits}$"}}, sort=[("created_at", -1)])
        if not case:
            return None
        now0 = datetime.utcnow()
        await db.case_activities.insert_one({
            "case_id": str(case["_id"]), "user_id": None, "activity_type": "note",
            "stage": "Chatbot", "description": f"Cliente inició conversación por WhatsApp: {body[:300]}",
            "billable": False, "duration_minutes": 0, "created_at": now0,
        })
        await notifier.create_app_notification(
            db, target="admin", type="client_message",
            title=f"Nuevo contacto WhatsApp · {case.get('case_number')}",
            message=f"{case.get('client_name','Cliente')}: {body[:120]}",
            case_id=str(case["_id"]),
        )
        new_session = await start_intake_conversation(db, case)
        return (new_session.get("history") or [{}])[0].get("text")
    case = await db.cases.find_one({"_id": ObjectId(session["case_id"])})

    now = datetime.utcnow()
    # Registra la respuesta del cliente a la pregunta anterior
    session["history"].append({"role": "client", "text": body, "at": now})
    session.setdefault("answers", []).append(body)
    session["last_inbound_at"] = now
    session["followup_stage"] = 0  # respondió → reinicia seguimiento

    # También lo deja en la línea de tiempo del caso
    await db.case_activities.insert_one({
        "case_id": session["case_id"], "user_id": None, "activity_type": "note",
        "stage": "Chatbot", "description": f"Cliente respondió: {body[:300]}",
        "billable": False, "duration_minutes": 0, "created_at": now,
    })

    # Item 9: alerta visible al administrador por cada respuesta del cliente.
    await notifier.create_app_notification(
        db, target="admin", type="client_message",
        title=f"Respuesta del cliente · {session.get('consultation_number') or (case or {}).get('case_number','')}",
        message=f"{session.get('client_name','Cliente')}: {body[:120]}",
        case_id=session["case_id"],
    )

    q_index = session["q_index"] + 1
    questions = session["questions"]

    if q_index < len(questions):
        next_q = questions[q_index]
        system_prompt = build_bot_system_prompt(case or {})
        reply = _claude_reply(system_prompt, session["history"], next_q)
        if not reply:
            first = (session.get("client_name") or "").split(" ")[0]
            reply = f"Gracias{(', ' + first) if first else ''}. {next_q}"
        session["history"].append({"role": "bot", "text": reply, "at": now})
        session["q_index"] = q_index
        await db.chat_sessions.update_one(
            {"_id": session["_id"]},
            {"$set": {"history": session["history"], "answers": session["answers"],
                      "q_index": q_index, "last_inbound_at": now,
                      "followup_stage": 0, "updated_at": now}},
        )
        if session.get("phone"):
            notifier.send_whatsapp(session["phone"], reply)
        return reply

    # No quedan preguntas → finalizar
    await db.chat_sessions.update_one(
        {"_id": session["_id"]},
        {"$set": {"history": session["history"], "answers": session["answers"],
                  "last_inbound_at": now, "updated_at": now}},
    )
    session["history"] = session["history"]
    report = await _finalize(db, session, case or {})
    closing = (f"{(session.get('client_name') or '').split(' ')[0]}, tu caso tiene solución. "
               "¿Quieres que un abogado especialista te llame hoy mismo?")
    return closing


# ───────────── Endpoints ─────────────
@router.get("/webhook/whatsapp")
async def whatsapp_verify(request: Request):
    """Verificación del webhook de Meta WhatsApp (handshake GET).
    Meta envía hub.mode, hub.verify_token y hub.challenge."""
    params = dict(request.query_params)
    mode = params.get("hub.mode")
    token = params.get("hub.verify_token")
    challenge = params.get("hub.challenge", "")
    expected = os.environ.get("META_VERIFY_TOKEN", "puntocerolegal")
    from fastapi.responses import PlainTextResponse, Response
    if mode == "subscribe" and token == expected:
        return PlainTextResponse(content=challenge)
    return Response(status_code=403)


@router.post("/webhook/whatsapp")
async def whatsapp_webhook(request: Request, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Webhook entrante de WhatsApp. Soporta Meta Cloud API (JSON) y Twilio (form)."""
    from fastapi.responses import Response, JSONResponse
    import hashlib
    import hmac

    content_type = request.headers.get("content-type", "")

    # ── Meta WhatsApp Cloud API (application/json) ──
    if "application/json" in content_type:
        # VALIDAR FIRMA DE META (Security: Verify webhook signature)
        x_hub_signature = request.headers.get("x-hub-signature-256", "")
        meta_app_secret = os.environ.get("META_APP_SECRET", "")

        if meta_app_secret and x_hub_signature:
            try:
                body_bytes = await request.body()
                expected_signature = "sha256=" + hmac.new(
                    meta_app_secret.encode(),
                    body_bytes,
                    hashlib.sha256
                ).hexdigest()

                if not hmac.compare_digest(x_hub_signature, expected_signature):
                    logger.warning("Invalid Meta webhook signature")
                    return JSONResponse({"error": "Invalid signature"}, status_code=403)
            except Exception as e:
                logger.warning("Signature validation error: %s", e)
                return JSONResponse({"error": "Signature validation failed"}, status_code=403)

        try:
            data = await request.json()
        except Exception:
            data = {}
        try:
            for entry in data.get("entry", []):
                for change in entry.get("changes", []):
                    value = change.get("value", {})
                    for msg in value.get("messages", []):
                        from_raw = msg.get("from", "")
                        body = (msg.get("text") or {}).get("body", "")
                        if from_raw and body:
                            phone = "+" + "".join(ch for ch in str(from_raw) if ch.isdigit())
                            await process_inbound(db, phone, str(body))
        except Exception as e:  # noqa: BLE001
            logger.warning("Webhook Meta parse error: %s", e)
        # Meta solo requiere un 200 para confirmar recepción
        return JSONResponse({"received": True})

    # ── Twilio (application/x-www-form-urlencoded) ──
    try:
        form = await request.form()
        from_raw = form.get("From", "") or form.get("from", "")
        body = form.get("Body", "") or form.get("body", "")
    except Exception:
        from_raw, body = "", ""
    phone = "+" + "".join(ch for ch in str(from_raw) if ch.isdigit())
    reply = await process_inbound(db, phone, str(body)) if from_raw else None
    twiml = f"<?xml version='1.0' encoding='UTF-8'?><Response><Message>{reply or ''}</Message></Response>"
    return Response(content=twiml, media_type="application/xml")


@router.post("/chatbot/simulate")
async def chatbot_simulate(payload: dict, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Pruebas sin Twilio: envía una respuesta del cliente por case_id y devuelve la del bot."""
    case_id = payload.get("case_id")
    body = payload.get("message", "")
    reply = await process_inbound(db, case_id, body, by_case_id=True)
    return {"reply": reply}


@router.get("/chatbot/session/{case_id}")
async def chatbot_session(case_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Estado de la conversación (debug / panel)."""
    s = await db.chat_sessions.find_one({"case_id": case_id}, sort=[("created_at", -1)])
    if not s:
        return {"found": False}
    s["_id"] = str(s["_id"])
    for h in s.get("history", []):
        if isinstance(h.get("at"), datetime):
            h["at"] = h["at"].isoformat()
    return {"found": True, "session": s}


@router.post("/chatbot/run-followups")
async def run_followups(db: AsyncIOMotorDatabase = Depends(get_db)):
    """Seguimiento automático: 2h sin responder → recordatorio; 24h → reactivación."""
    now = datetime.utcnow()
    sent_2h = sent_24h = 0
    active = await db.chat_sessions.find({"status": "active"}).to_list(1000)
    for s in active:
        last = s.get("last_inbound_at") or s.get("created_at")
        if not isinstance(last, datetime):
            continue
        hours = (now - last).total_seconds() / 3600
        stage = s.get("followup_stage", 0)
        first = (s.get("client_name") or "").split(" ")[0]
        if hours >= 24 and stage < 2:
            msg = (f"{first}, este es nuestro último mensaje. Tu situación legal puede tener solución, "
                   "pero el tiempo corre. Responde y un especialista te atenderá sin compromiso.")
            if s.get("phone"):
                notifier.send_whatsapp(s["phone"], msg)
            await db.chat_sessions.update_one({"_id": s["_id"]}, {"$set": {"followup_stage": 2, "updated_at": now}})
            sent_24h += 1
        elif hours >= 2 and stage < 1:
            msg = (f"{first}, ¿seguimos con tu consulta? Estoy aquí para ayudarte a resolver tu caso. "
                   "Cuéntame y te conecto con el abogado indicado.")
            if s.get("phone"):
                notifier.send_whatsapp(s["phone"], msg)
            await db.chat_sessions.update_one({"_id": s["_id"]}, {"$set": {"followup_stage": 1, "updated_at": now}})
            sent_2h += 1
    return {"ok": True, "followups_2h": sent_2h, "followups_24h": sent_24h}


@router.post("/public/case/{case_id}/timeline-advance")
async def advance_case_timeline(case_id: str, payload: dict, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Avanza la línea de tiempo del caso y la reenvía al cliente por WhatsApp/correo."""
    case = await db.cases.find_one({"_id": ObjectId(case_id)})
    if not case:
        from fastapi import HTTPException
        raise HTTPException(404, "Caso no encontrado")
    states = case.get("status_timeline") or init_timeline()
    target_key = payload.get("stage")  # opcional: clave a marcar como current
    now = datetime.utcnow()

    keys = [s["key"] for s in TIMELINE_STAGES]
    if target_key in keys:
        idx = keys.index(target_key)
    else:
        # avanzar al siguiente 'current'
        idx = next((i for i, s in enumerate(states) if s["status"] == "current"), 0)
        idx = min(idx + 1, len(states) - 1)

    for i, s in enumerate(states):
        if i < idx:
            s["status"] = "done"
            s["at"] = s.get("at") or (now.isoformat() + "Z")
        elif i == idx:
            s["status"] = "current"
            s["at"] = now.isoformat() + "Z"
        else:
            s["status"] = "pending"

    await db.cases.update_one({"_id": case["_id"]},
                              {"$set": {"status_timeline": states, "updated_at": now}})
    text = render_timeline(states)
    phone = normalize_phone(case.get("client_phone"), case.get("client_country"))
    if phone:
        notifier.send_whatsapp(phone, text)
    if case.get("client_email"):
        notifier.send_email(case["client_email"], f"Actualización de tu caso {case.get('case_number')}",
                            f"<pre>{text}</pre>")
    return {"ok": True, "timeline": states}
