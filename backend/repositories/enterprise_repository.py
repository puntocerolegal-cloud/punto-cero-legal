from typing import Any, Dict, Optional


class EnterprisePersistenceRepository:
    """Repositorio base para persistencia enterprise."""

    def __init__(self, db=None):
        self.db = db

    async def create(self, collection: str, document: Dict[str, Any]) -> Dict[str, Any]:
        if self.db is None:
            raise RuntimeError("No hay base de datos configurada para el repositorio")
        result = await self.db[collection].insert_one(document)
        document["_id"] = result.inserted_id
        return document

    async def get(self, collection: str, query: Optional[Dict[str, Any]] = None):
        if self.db is None:
            raise RuntimeError("No hay base de datos configurada para el repositorio")
        return await self.db[collection].find_one(query or {})

    async def list(self, collection: str, query: Optional[Dict[str, Any]] = None):
        if self.db is None:
            raise RuntimeError("No hay base de datos configurada para el repositorio")
        cursor = self.db[collection].find(query or {})
        return [item async for item in cursor]

    async def update(self, collection: str, query: Dict[str, Any], updates: Dict[str, Any]):
        if self.db is None:
            raise RuntimeError("No hay base de datos configurada para el repositorio")
        return await self.db[collection].update_one(query, {"$set": updates})

    async def delete(self, collection: str, query: Dict[str, Any]):
        if self.db is None:
            raise RuntimeError("No hay base de datos configurada para el repositorio")
        return await self.db[collection].delete_one(query)
