from typing import Any, Dict


def serialize_enterprise_resource(resource: Dict[str, Any]) -> Dict[str, Any]:
    if not resource:
        return {}
    serialized = dict(resource)
    serialized["id"] = str(serialized.get("_id") or serialized.get("id") or "")
    return serialized
