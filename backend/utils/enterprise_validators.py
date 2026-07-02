from typing import Any, Dict, Optional

SUPPORTED_RESOURCE_TYPES = {
    "preferences",
    "workflows",
    "scheduler",
    "automation",
    "governance",
    "notifications",
    "autonomy",
}


def validate_persistence_payload(resource_type: str, payload: Optional[Dict[str, Any]]) -> None:
    if resource_type not in SUPPORTED_RESOURCE_TYPES:
        raise ValueError(f"resource_type no soportado: {resource_type}")

    if payload is None:
        raise ValueError("payload no puede ser None")
    if not isinstance(payload, dict):
        raise ValueError("payload debe ser un objeto")

    if resource_type == "preferences":
        if "theme" in payload and not isinstance(payload["theme"], str):
            raise ValueError("preferences.theme debe ser string")
        if "notifications_enabled" in payload and not isinstance(payload["notifications_enabled"], bool):
            raise ValueError("preferences.notifications_enabled debe ser booleano")

    if resource_type == "workflows":
        if "name" in payload and not isinstance(payload["name"], str):
            raise ValueError("workflows.name debe ser string")
