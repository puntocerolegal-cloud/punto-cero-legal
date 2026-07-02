from typing import Dict, List, Any, Optional
from motor.motor_asyncio import AsyncIOMotorCollection
from datetime import datetime
from backend.middleware.tenant_isolation import TenantAwareQuery
from backend.repositories.enterprise_base_repository import BaseRepository


class CaseRepository(BaseRepository):
    def __init__(self, collection: AsyncIOMotorCollection):
        super().__init__(collection)

    async def find_by_case_number(self, firm_id: str, case_number: str, request_id: str) -> Optional[Dict[str, Any]]:
        query = TenantAwareQuery.add_firm_filter({"case_number": case_number}, firm_id)
        return await self.collection.find_one(query)

    async def find_by_owner(self, firm_id: str, owner_id: str, request_id: str, skip: int = 0, limit: int = 50) -> List[Dict[str, Any]]:
        query = TenantAwareQuery.add_firm_filter({"case_owner_id": owner_id, "deleted_at": None}, firm_id)
        cursor = self.collection.find(query).skip(skip).limit(limit).sort("created_at", -1)
        return await cursor.to_list(None)

    async def find_by_status(self, firm_id: str, status: str, request_id: str, skip: int = 0, limit: int = 50) -> List[Dict[str, Any]]:
        query = TenantAwareQuery.add_firm_filter({"status": status, "deleted_at": None}, firm_id)
        cursor = self.collection.find(query).skip(skip).limit(limit).sort("created_at", -1)
        return await cursor.to_list(None)

    async def find_by_legal_area(self, firm_id: str, legal_area: str, request_id: str, skip: int = 0, limit: int = 50) -> List[Dict[str, Any]]:
        query = TenantAwareQuery.add_firm_filter({"legal_area": legal_area, "deleted_at": None}, firm_id)
        cursor = self.collection.find(query).skip(skip).limit(limit).sort("created_at", -1)
        return await cursor.to_list(None)

    async def find_assigned_to_user(self, firm_id: str, user_id: str, request_id: str, skip: int = 0, limit: int = 50) -> List[Dict[str, Any]]:
        query = TenantAwareQuery.add_firm_filter({"assigned_users": user_id, "deleted_at": None}, firm_id)
        cursor = self.collection.find(query).skip(skip).limit(limit).sort("updated_at", -1)
        return await cursor.to_list(None)

    async def search(self, firm_id: str, search_term: str, request_id: str, skip: int = 0, limit: int = 50) -> List[Dict[str, Any]]:
        query = TenantAwareQuery.add_firm_filter({
            "$or": [
                {"title": {"$regex": search_term, "$options": "i"}},
                {"description": {"$regex": search_term, "$options": "i"}},
                {"case_number": {"$regex": search_term, "$options": "i"}},
                {"tags": {"$in": [search_term]}}
            ],
            "deleted_at": None
        }, firm_id)
        cursor = self.collection.find(query).skip(skip).limit(limit).sort("updated_at", -1)
        return await cursor.to_list(None)

    async def count_active(self, firm_id: str) -> int:
        query = TenantAwareQuery.add_firm_filter({"deleted_at": None}, firm_id)
        return await self.collection.count_documents(query)

    async def assign_user(self, firm_id: str, case_id: str, user_id: str, request_id: str) -> bool:
        query = TenantAwareQuery.add_firm_filter({"_id": case_id}, firm_id)
        result = await self.collection.update_one(
            query,
            {
                "$addToSet": {"assigned_users": user_id},
                "$set": {"updated_at": datetime.utcnow(), "updated_by": user_id}
            }
        )
        return result.modified_count > 0

    async def unassign_user(self, firm_id: str, case_id: str, user_id: str, request_id: str) -> bool:
        query = TenantAwareQuery.add_firm_filter({"_id": case_id}, firm_id)
        result = await self.collection.update_one(
            query,
            {
                "$pull": {"assigned_users": user_id},
                "$set": {"updated_at": datetime.utcnow()}
            }
        )
        return result.modified_count > 0

    async def ensure_indexes(self) -> None:
        await self.create_index({"firm_id": 1})
        await self.create_index({"firm_id": 1, "status": 1})
        await self.create_index({"firm_id": 1, "case_owner_id": 1})
        await self.create_index({"firm_id": 1, "assigned_users": 1})
        await self.create_index({"firm_id": 1, "legal_area": 1})
        await self.create_index({"firm_id": 1, "created_at": -1})
        await self.create_index({"firm_id": 1, "deleted_at": 1})
        await self.create_index({"case_number": 1, "firm_id": 1}, unique=True, sparse=True)
