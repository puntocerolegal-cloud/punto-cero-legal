"""
Expediente — la FUENTE ÚNICA DE VERDAD de Punto Cero Legal.

Al crear un caso (evento CASE_CREATED) se genera automáticamente su expediente:
  • expediente_id único (EXP-AAAA-NNN)
  • Estructura documental estándar (8 carpetas)
  • Centro financiero inicial (ingresos/gastos/rentabilidad/saldo = 0)
  • Vínculo cliente ↓ caso ↓ expediente
Todos los módulos (Documentos, Agenda, Facturación, Conferencias, IA) operan
sobre expediente_id + case_id + client_id y se retroalimentan automáticamente.
"""
from datetime import datetime
from bson import ObjectId

# Estructura documental automática del expediente (EXP-XXXX/).
STANDARD_FOLDERS = [
    "Contratos",
    "Poderes",
    "Demandas",
    "Pruebas",
    "Audiencias",
    "Facturación",
    "Comunicaciones",
    "Otros",
]

# Carpeta destino de archivos que llegan del cliente (WhatsApp / formulario).
CLIENT_INTAKE_FOLDER = "Comunicaciones"


async def next_expediente_id(db) -> str:
    """Genera el identificador secuencial del expediente: EXP-AAAA-NNN."""
    year = datetime.utcnow().year
    count = await db.expedientes.count_documents({"expediente_id": {"$regex": f"^EXP-{year}-"}})
    return f"EXP-{year}-{str(count + 1).zfill(3)}"


async def create_expediente(db, case_id: str, lawyer_id: str = None) -> dict:
    """Crea (idempotente) el expediente del caso: id único, carpetas, centro
    financiero y relación cliente↓caso↓expediente. Devuelve el documento."""
    try:
        oid = ObjectId(case_id)
    except Exception:
        return {}
    case = await db.cases.find_one({"_id": oid})
    if not case:
        return {}

    # Idempotencia: si el caso ya tiene expediente, lo devolvemos.
    if case.get("expediente_id"):
        exp = await db.expedientes.find_one({"expediente_id": case["expediente_id"]})
        if exp:
            exp["_id"] = str(exp["_id"])
            return exp

    exp_id = await next_expediente_id(db)
    now = datetime.utcnow()
    owner = lawyer_id or case.get("lawyer_id")
    doc = {
        "expediente_id": exp_id,
        "case_id": case_id,
        "case_number": case.get("case_number"),
        "client_id": case.get("client_id"),
        "client_name": case.get("client_name"),
        "lawyer_id": owner,
        "responsable_id": owner,
        "title": case.get("title"),
        "estado": case.get("estado", "Activo"),
        "folders": STANDARD_FOLDERS,
        # Centro financiero inicial (se recalcula en vivo al leer indicadores).
        "financial": {"ingresos": 0, "gastos": 0, "rentabilidad": 0, "saldo_pendiente": 0},
        "created_at": now,
        "updated_at": now,
    }
    await db.expedientes.insert_one(doc)

    # Estampa expediente_id en el caso (la relación se vuelve bidireccional).
    await db.cases.update_one(
        {"_id": oid},
        {"$set": {"expediente_id": exp_id, "expediente_folders": STANDARD_FOLDERS, "updated_at": now}},
    )

    # Cronología inicial: "Expediente creado".
    await db.case_activities.insert_one({
        "case_id": case_id, "expediente_id": exp_id, "user_id": owner,
        "activity_type": "system", "stage": "Expediente creado",
        "billable": False, "duration_minutes": 0,
        "description": f"Expediente {exp_id} creado automáticamente (8 carpetas + centro financiero).",
        "created_at": now,
    })

    doc["_id"] = exp_id
    return doc


async def init_expediente(db, case_id: str, lawyer_id: str = None) -> list:
    """Compatibilidad: crea el expediente y devuelve sus carpetas."""
    exp = await create_expediente(db, case_id, lawyer_id)
    return (exp or {}).get("folders", STANDARD_FOLDERS)
