from datetime import datetime
import secrets
import string
from pymongo import ReturnDocument


def generate_case_number() -> str:
    """
    [Legado] Número de caso aleatorio: CASO-YYYY-XXXXX
    Se mantiene como respaldo. Para IDs secuenciales usar next_case_number().
    """
    year = datetime.now().year
    random_id = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(5))
    return f"CASO-{year}-{random_id}"


async def _next_seq(db, key: str) -> int:
    counter = await db.counters.find_one_and_update(
        {"_id": key},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=ReturnDocument.AFTER,
    )
    return counter["seq"]


async def next_case_number(db) -> str:
    """
    Identificador secuencial de caso (manejo interno del abogado):
    CAS-YYYY-NNN  (ej. CAS-2026-001)
    """
    year = datetime.utcnow().year
    seq = await _next_seq(db, f"case-{year}")
    return f"CAS-{year}-{seq:03d}"


async def next_consultation_number(db) -> str:
    """
    Identificador secuencial de consulta pública entrante (formulario landing):
    CON-YYYY-NNN  (ej. CON-2026-001)
    """
    year = datetime.utcnow().year
    seq = await _next_seq(db, f"consultation-{year}")
    return f"CON-{year}-{seq:03d}"

def generate_invoice_number() -> str:
    """
    Genera un número de factura único en el formato:
    INV-YYYY-XXXXX
    Ejemplo: INV-2025-12345
    """
    year = datetime.now().year
    random_id = ''.join(secrets.choice(string.digits) for _ in range(5))
    return f"INV-{year}-{random_id}"
