from datetime import datetime, timezone
from typing import Any, Dict, Optional

from models.enterprise_persistence import EnterprisePersistenceCreate, EnterprisePersistenceRecord, EnterprisePersistenceUpdate
from repositories.enterprise_repository import EnterprisePersistenceRepository
from utils.enterprise_validators import validate_persistence_payload


class EnterprisePersistenceService:
    """Servicio compartido para persistencia enterprise cruzada por firma."""

    def __init__(self, repository: Optional[EnterprisePersistenceRepository] = None, db=None):
        self.repository = repository or EnterprisePersistenceRepository(db=db)

    @staticmethod
    def _collection_name(resource_type: str) -> str:
        return f"enterprise_{resource_type}"

    async def create_resource(self, *, resource_type: str, firm_id: str, user_id: Optional[str] = None, payload: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        validate_persistence_payload(resource_type, payload or {})
        dto = EnterprisePersistenceCreate(
            resource_type=resource_type,
            firm_id=firm_id,
            user_id=user_id,
            data=payload or {},
            metadata={},
        )
        document = EnterprisePersistenceRecord(**dto.model_dump(), id=None).model_dump()
        document["created_at"] = datetime.now(timezone.utc)
        document["updated_at"] = datetime.now(timezone.utc)
        document["version"] = 1

        created = await self.repository.create(self._collection_name(resource_type), document)
        saved = dict(created)
        saved["id"] = str(saved.get("_id") or saved.get("id") or "")
        return saved

    async def get_resource(self, *, resource_type: str, resource_id: str) -> Optional[Dict[str, Any]]:
        item = await self.repository.get(self._collection_name(resource_type), {"_id": resource_id})
        if not item:
            return None
        item = dict(item)
        item["id"] = str(item.get("_id") or item.get("id") or "")
        return item

    async def list_resources(self, *, resource_type: str, firm_id: Optional[str] = None) -> list[Dict[str, Any]]:
        query = {"firm_id": firm_id} if firm_id else {}
        items = await self.repository.list(self._collection_name(resource_type), query)
        result = []
        for item in items:
            item = dict(item)
            item["id"] = str(item.get("_id") or item.get("id") or "")
            result.append(item)
        return result

    async def update_resource(self, *, resource_type: str, resource_id: str, updates: Optional[Dict[str, Any]] = None) -> Optional[Dict[str, Any]]:
        payload = EnterprisePersistenceUpdate(**(updates or {})).model_dump(exclude_none=True)
        if not payload:
            return None

        if "data" in payload:
            payload["data"] = payload["data"] or {}
        payload["updated_at"] = datetime.now(timezone.utc)
        payload["version"] = 1

        await self.repository.update(self._collection_name(resource_type), {"_id": resource_id}, payload)
        return await self.get_resource(resource_type=resource_type, resource_id=resource_id)

    async def delete_resource(self, *, resource_type: str, resource_id: str) -> bool:
        result = await self.repository.delete(self._collection_name(resource_type), {"_id": resource_id})
        return bool(getattr(result, "deleted_count", 0))
