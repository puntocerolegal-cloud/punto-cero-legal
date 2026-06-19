"""
Auditoría del Administrador Maestro — Punto Cero Legal.

Registra cada acción administrativa en la colección `audit_logs` con:
usuario administrador, acción, fecha/hora, módulo afectado, entidad,
valor anterior y valor nuevo. Historial visible desde administración.
"""
from datetime import datetime


async def log_audit(db, admin: dict, *, action: str, module: str,
                    entity_id: str = None, entity_label: str = None,
                    before=None, after=None, detail: str = None) -> str:
    """Inserta una entrada de auditoría y devuelve su id."""
    now = datetime.utcnow()
    doc = {
        "admin_id": str(admin.get("_id")) if admin else None,
        "admin_name": (admin or {}).get("full_name") or (admin or {}).get("email"),
        "action": action,
        "module": module,
        "entity_id": entity_id,
        "entity_label": entity_label,
        "before": before,
        "after": after,
        "detail": detail,
        "timestamp": now,
        "created_at": now,
        "from_admin": True,
    }
    res = await db.audit_logs.insert_one(doc)
    return str(res.inserted_id)


def serialize_audit(a: dict) -> dict:
    ts = a.get("timestamp") or a.get("created_at")
    return {
        "id": str(a.get("_id")),
        "admin_id": a.get("admin_id"),
        "admin_name": a.get("admin_name") or "—",
        "action": a.get("action"),
        "module": a.get("module"),
        "entity_id": a.get("entity_id"),
        "entity_label": a.get("entity_label"),
        "before": a.get("before"),
        "after": a.get("after"),
        "detail": a.get("detail"),
        "timestamp": ts.isoformat() if isinstance(ts, datetime) else ts,
    }
