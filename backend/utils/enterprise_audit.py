from datetime import datetime, timezone
from typing import Any, Dict, Optional


async def record_enterprise_event(db, *, actor: Optional[str], action: str, resource_type: str, firm_id: Optional[str], details: Optional[Dict[str, Any]] = None) -> str:
    event = {
        "actor": actor,
        "action": action,
        "resource_type": resource_type,
        "firm_id": firm_id,
        "details": details or {},
        "created_at": datetime.now(timezone.utc),
    }
    if db is None:
        return "local-audit"
    collection = getattr(db, "enterprise_audit_logs", None)
    if collection is None:
        return "local-audit"
    result = await collection.insert_one(event)
    return str(getattr(result, "inserted_id", "local-audit"))
