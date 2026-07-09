from typing import Dict, List, Any, Optional
from motor.motor_asyncio import AsyncIOMotorCollection
from datetime import datetime, timedelta
from middleware.tenant_isolation import TenantAwareQuery
from models.enterprise_cases import DocumentAccessLog
from repositories.enterprise_base_repository import BaseRepository


class DocumentAccessLogRepository(BaseRepository):
    def __init__(self, collection: AsyncIOMotorCollection):
        super().__init__(collection, DocumentAccessLog)

    async def log_access(self, firm_id: str, log_data: Dict[str, Any], request_id: str) -> Dict[str, Any]:
        log_data["firm_id"] = firm_id
        log_data["created_at"] = datetime.utcnow()
        result = await self.collection.insert_one(log_data)
        log_data["_id"] = str(result.inserted_id)
        return log_data

    async def find_by_document(self, firm_id: str, document_id: str, request_id: str, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
        query = TenantAwareQuery.add_firm_filter({"document_id": document_id}, firm_id)
        cursor = self.collection.find(query).skip(skip).limit(limit).sort("created_at", -1)
        return await cursor.to_list(None)

    async def find_by_user(self, firm_id: str, user_id: str, request_id: str, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
        query = TenantAwareQuery.add_firm_filter({"user_id": user_id}, firm_id)
        cursor = self.collection.find(query).skip(skip).limit(limit).sort("created_at", -1)
        return await cursor.to_list(None)

    async def find_by_case(self, firm_id: str, case_id: str, request_id: str, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
        query = TenantAwareQuery.add_firm_filter({"case_id": case_id}, firm_id)
        cursor = self.collection.find(query).skip(skip).limit(limit).sort("created_at", -1)
        return await cursor.to_list(None)

    async def find_by_action(self, firm_id: str, action: str, request_id: str, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
        query = TenantAwareQuery.add_firm_filter({"action": action}, firm_id)
        cursor = self.collection.find(query).skip(skip).limit(limit).sort("created_at", -1)
        return await cursor.to_list(None)

    async def find_by_date_range(self, firm_id: str, start_date: datetime, end_date: datetime, request_id: str, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
        query = TenantAwareQuery.add_firm_filter({
            "created_at": {"$gte": start_date, "$lte": end_date}
        }, firm_id)
        cursor = self.collection.find(query).skip(skip).limit(limit).sort("created_at", -1)
        return await cursor.to_list(None)

    async def find_document_access_summary(self, firm_id: str, document_id: str, request_id: str) -> Dict[str, Any]:
        query = TenantAwareQuery.add_firm_filter({"document_id": document_id}, firm_id)
        logs = await self.collection.find(query).to_list(None)
        
        summary = {
            "total_accesses": len(logs),
            "unique_users": len(set(log.get("user_id") for log in logs)),
            "actions": {},
            "last_access": logs[0]["created_at"] if logs else None
        }
        
        for log in logs:
            action = log.get("action", "unknown")
            summary["actions"][action] = summary["actions"].get(action, 0) + 1
        
        return summary

    async def find_user_activity_timeline(self, firm_id: str, user_id: str, request_id: str, days: int = 30) -> List[Dict[str, Any]]:
        start_date = datetime.utcnow() - timedelta(days=days)
        query = TenantAwareQuery.add_firm_filter({
            "user_id": user_id,
            "created_at": {"$gte": start_date}
        }, firm_id)
        cursor = self.collection.find(query).sort("created_at", -1)
        return await cursor.to_list(None)

    async def ensure_indexes(self) -> None:
        await self.create_index({"firm_id": 1})
        await self.create_index({"firm_id": 1, "document_id": 1})
        await self.create_index({"firm_id": 1, "user_id": 1})
        await self.create_index({"firm_id": 1, "case_id": 1})
        await self.create_index({"firm_id": 1, "action": 1})
        await self.create_index({"firm_id": 1, "created_at": -1})
        await self.create_index({"created_at": 1}, expireAfterSeconds=7776000)
