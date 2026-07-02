from typing import Dict, List, Any, Optional
from motor.motor_asyncio import AsyncIOMotorCollection
from datetime import datetime
from backend.middleware.tenant_isolation import TenantAwareQuery
from backend.repositories.enterprise_base_repository import BaseRepository


class DocumentRepository(BaseRepository):
    def __init__(self, collection: AsyncIOMotorCollection):
        super().__init__(collection)

    async def find_by_case(self, firm_id: str, case_id: str, request_id: str, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
        query = TenantAwareQuery.add_firm_filter({"case_id": case_id, "deleted_at": None}, firm_id)
        cursor = self.collection.find(query).skip(skip).limit(limit).sort("created_at", -1)
        return await cursor.to_list(None)

    async def find_by_owner(self, firm_id: str, owner_id: str, request_id: str, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
        query = TenantAwareQuery.add_firm_filter({"owner_id": owner_id, "deleted_at": None}, firm_id)
        cursor = self.collection.find(query).skip(skip).limit(limit).sort("updated_at", -1)
        return await cursor.to_list(None)

    async def find_by_document_type(self, firm_id: str, doc_type: str, request_id: str, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
        query = TenantAwareQuery.add_firm_filter({"document_type": doc_type, "deleted_at": None}, firm_id)
        cursor = self.collection.find(query).skip(skip).limit(limit).sort("updated_at", -1)
        return await cursor.to_list(None)

    async def find_by_status(self, firm_id: str, status: str, request_id: str, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
        query = TenantAwareQuery.add_firm_filter({"status": status, "deleted_at": None}, firm_id)
        cursor = self.collection.find(query).skip(skip).limit(limit).sort("updated_at", -1)
        return await cursor.to_list(None)

    async def search(self, firm_id: str, search_term: str, request_id: str, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
        query = TenantAwareQuery.add_firm_filter({
            "$or": [
                {"title": {"$regex": search_term, "$options": "i"}},
                {"content_text": {"$regex": search_term, "$options": "i"}},
                {"tags": {"$in": [search_term]}}
            ],
            "deleted_at": None
        }, firm_id)
        cursor = self.collection.find(query).skip(skip).limit(limit).sort("updated_at", -1)
        return await cursor.to_list(None)

    async def add_version(self, firm_id: str, document_id: str, version_data: Dict[str, Any], request_id: str) -> bool:
        query = TenantAwareQuery.add_firm_filter({"_id": document_id}, firm_id)
        result = await self.collection.update_one(
            query,
            {
                "$push": {"versions": version_data},
                "$inc": {"version_number": 1},
                "$set": {"updated_at": datetime.utcnow()}
            }
        )
        return result.modified_count > 0

    async def grant_access(self, firm_id: str, document_id: str, user_id: str, access_level: str, request_id: str) -> bool:
        query = TenantAwareQuery.add_firm_filter({"_id": document_id}, firm_id)
        result = await self.collection.update_one(
            query,
            {
                "$set": {f"access_list.{user_id}": access_level, "updated_at": datetime.utcnow()},
                "$inc": {"review_count": 1}
            }
        )
        return result.modified_count > 0

    async def revoke_access(self, firm_id: str, document_id: str, user_id: str, request_id: str) -> bool:
        query = TenantAwareQuery.add_firm_filter({"_id": document_id}, firm_id)
        result = await self.collection.update_one(
            query,
            {"$unset": {f"access_list.{user_id}": 1}, "$set": {"updated_at": datetime.utcnow()}}
        )
        return result.modified_count > 0

    async def mark_signed(self, firm_id: str, document_id: str, user_id: str, request_id: str) -> bool:
        query = TenantAwareQuery.add_firm_filter({"_id": document_id}, firm_id)
        result = await self.collection.update_one(
            query,
            {
                "$addToSet": {"signed_by": user_id},
                "$push": {"signed_at": datetime.utcnow()},
                "$set": {"status": "signed", "updated_at": datetime.utcnow()}
            }
        )
        return result.modified_count > 0

    async def count_by_case(self, firm_id: str, case_id: str) -> int:
        query = TenantAwareQuery.add_firm_filter({"case_id": case_id, "deleted_at": None}, firm_id)
        return await self.collection.count_documents(query)

    async def find_user_accessible(self, firm_id: str, user_id: str, request_id: str, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
        query = TenantAwareQuery.add_firm_filter({
            "$or": [
                {"owner_id": user_id},
                {f"access_list.{user_id}": {"$exists": True}}
            ],
            "deleted_at": None
        }, firm_id)
        cursor = self.collection.find(query).skip(skip).limit(limit).sort("updated_at", -1)
        return await cursor.to_list(None)

    async def ensure_indexes(self) -> None:
        await self.create_index({"firm_id": 1})
        await self.create_index({"firm_id": 1, "case_id": 1})
        await self.create_index({"firm_id": 1, "owner_id": 1})
        await self.create_index({"firm_id": 1, "document_type": 1})
        await self.create_index({"firm_id": 1, "status": 1})
        await self.create_index({"firm_id": 1, "created_at": -1})
        await self.create_index({"firm_id": 1, "deleted_at": 1})
        await self.create_index({"firm_id": 1, "is_confidential": 1})
        await self.create_index({"expiration_date": 1}, expireAfterSeconds=0, sparse=True)
