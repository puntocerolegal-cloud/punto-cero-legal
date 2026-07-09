"""
Case Repository
CRUD operations for cases with multi-tenant isolation and audit support

Follows Golden Repository Template v1.0 specification.
Provides case management with:
- Multi-tenant isolation via firm_id
- Audit trail with request_id
- Comprehensive error handling
- Case lifecycle management
- Reporting and aggregation support
"""

from typing import Dict, List, Any, Optional
from motor.motor_asyncio import AsyncIOMotorCollection
from bson import ObjectId
from datetime import datetime, date, timedelta
import logging

from repositories.enterprise_base_repository import BaseRepository
from middleware.tenant_isolation import TenantAwareQuery

logger = logging.getLogger(__name__)


class CaseRepository(BaseRepository):
    """
    Repository for case operations.
    
    Manages all case-related CRUD operations with strict multi-tenant
    isolation via firm_id. Cases represent legal matters with strict
    audit, traceability, and multi-user assignment support.
    
    Key responsibilities:
    - Manage case lifecycle (open → in_progress → closed/archived)
    - Support case queries and filtering by status, priority, legal area
    - Maintain audit trail with request_id traceability
    - Ensure firm_id filtering on all queries
    - Enforce case_number uniqueness per firm
    - Provide case metrics and reporting
    - Support case status transitions and assignment operations
    
    Methods:
    - Base CRUD: create, find_by_id, update, soft_delete, hard_delete (inherited from BaseRepository)
    - Specialized Queries: find_by_case_number, find_by_client, find_by_lawyer, find_by_status, 
                          find_by_priority, find_by_stage, find_by_legal_area, find_assigned_to_user,
                          find_by_date_range, search, list_paginated
    - Domain Operations: change_status, close_case, reopen_case, archive_case, restore_case,
                        assign_lawyer, unassign_user
    - Reporting: statistics, metrics, dashboard_summary
    - Validation: validate_case_number, validate_case_unique
    """

    def __init__(self, collection: AsyncIOMotorCollection):
        """
        Initialize CaseRepository.
        
        Args:
            collection: Motor async collection for cases
        """
        super().__init__(collection, dict)
        self.collection = collection
        
        logger.info(
            f"[cases] CaseRepository initialized "
            f"collection={collection.full_name}"
        )

    # ════════════════════════════════════════════════════════════════════════════════
    # REPOSITORY INITIALIZATION & INDEXES
    # ════════════════════════════════════════════════════════════════════════════════

    async def ensure_indexes(self) -> None:
        """
        Create all required indexes for cases collection.
        
        Follows Golden Repository Template v1.0:
        - First field: firm_id (multi-tenant isolation)
        - Compound indexes for common query patterns
        - Unique constraint for case_number per firm
        - Sparse indexes for optional fields
        
        Indexes are created asynchronously without blocking.
        Safe to call multiple times (idempotent).
        
        Raises:
            Exception: If index creation fails
        """
        try:
            logger.info("[cases] Starting index creation...")

            indexes = [
                {
                    "name": "firm_case_number",
                    "spec": [("firm_id", 1), ("case_number", 1)],
                    "kwargs": {"background": True, "unique": True, "sparse": True}
                },
                {
                    "name": "firm_status",
                    "spec": [("firm_id", 1), ("status", 1)],
                    "kwargs": {"background": True}
                },
                {
                    "name": "firm_priority",
                    "spec": [("firm_id", 1), ("priority", 1)],
                    "kwargs": {"background": True}
                },
                {
                    "name": "firm_legal_area",
                    "spec": [("firm_id", 1), ("legal_area", 1)],
                    "kwargs": {"background": True}
                },
                {
                    "name": "firm_stage",
                    "spec": [("firm_id", 1), ("stage", 1)],
                    "kwargs": {"background": True, "sparse": True}
                },
                {
                    "name": "firm_client",
                    "spec": [("firm_id", 1), ("client_id", 1)],
                    "kwargs": {"background": True}
                },
                {
                    "name": "firm_lawyer",
                    "spec": [("firm_id", 1), ("lawyer_id", 1)],
                    "kwargs": {"background": True}
                },
                {
                    "name": "firm_created",
                    "spec": [("firm_id", 1), ("created_at", -1)],
                    "kwargs": {"background": True}
                },
                {
                    "name": "firm_closed",
                    "spec": [("firm_id", 1), ("closed_at", -1)],
                    "kwargs": {"background": True, "sparse": True}
                },
                {
                    "name": "firm_deleted",
                    "spec": [("firm_id", 1), ("deleted_at", 1)],
                    "kwargs": {"background": True, "sparse": True}
                },
                {
                    "name": "firm_assigned_users",
                    "spec": [("firm_id", 1), ("assigned_users", 1)],
                    "kwargs": {"background": True}
                },
            ]

            for index in indexes:
                try:
                    index_name = await self.collection.create_index(
                        index["spec"],
                        name=index["name"],
                        **index["kwargs"]
                    )
                    logger.info(f"[cases] Index created: {index_name}")
                except Exception as e:
                    logger.warning(f"[cases] Index creation warning for {index['name']}: {str(e)}")

            logger.info("[cases] Index creation completed")
        except Exception as e:
            logger.error(f"[cases] ensure_indexes failed: {str(e)}")
            raise

    @staticmethod
    def init() -> None:
        """Initialize repository (no-op for compatibility)"""
        pass

    # ════════════════════════════════════════════════════════════════════════════════
    # SPECIALIZED QUERIES
    # ════════════════════════════════════════════════════════════════════════════════

    async def find_by_case_number(
        self,
        firm_id: str,
        case_number: str,
        request_id: str
    ) -> Optional[Dict[str, Any]]:
        """
        Find case by case_number within firm.
        
        Args:
            firm_id: Multi-tenant isolation
            case_number: Case number
            request_id: For audit trail
            
        Returns:
            Case document or None
        """
        try:
            query = TenantAwareQuery.add_firm_filter({"case_number": case_number}, firm_id)
            
            start_time = datetime.utcnow()
            doc = await self.collection.find_one(query)
            elapsed = (datetime.utcnow() - start_time).total_seconds()
            
            logger.info(
                f"[cases] FIND_BY_CASE_NUMBER firm_id={firm_id} case_number={case_number} "
                f"found={'yes' if doc else 'no'} elapsed={elapsed:.3f}s request_id={request_id}"
            )
            
            return doc
        except Exception as e:
            logger.error(f"[cases] FIND_BY_CASE_NUMBER error: {str(e)}")
            raise

    async def find_by_client(
        self,
        firm_id: str,
        client_id: str,
        request_id: str,
        skip: int = 0,
        limit: int = 50
    ) -> tuple[List[Dict[str, Any]], int]:
        """
        Find all cases for a client within firm.
        
        Args:
            firm_id: Multi-tenant isolation
            client_id: Client ID
            request_id: For audit trail
            skip: Pagination skip
            limit: Pagination limit
            
        Returns:
            Tuple of (cases, total_count)
        """
        try:
            query = TenantAwareQuery.add_firm_filter(
                {"client_id": client_id, "deleted_at": None},
                firm_id
            )
            
            start_time = datetime.utcnow()
            
            total = await self.collection.count_documents(query)
            cursor = self.collection.find(query).skip(skip).limit(limit).sort("created_at", -1)
            docs = await cursor.to_list(length=limit)
            
            elapsed = (datetime.utcnow() - start_time).total_seconds()
            
            logger.info(
                f"[cases] FIND_BY_CLIENT firm_id={firm_id} client_id={client_id} "
                f"returned={len(docs)} total={total} elapsed={elapsed:.3f}s request_id={request_id}"
            )
            
            return docs, total
        except Exception as e:
            logger.error(f"[cases] FIND_BY_CLIENT error: {str(e)}")
            raise

    async def find_by_lawyer(
        self,
        firm_id: str,
        lawyer_id: str,
        request_id: str,
        skip: int = 0,
        limit: int = 50
    ) -> tuple[List[Dict[str, Any]], int]:
        """
        Find all cases assigned to a lawyer within firm.
        
        Args:
            firm_id: Multi-tenant isolation
            lawyer_id: Lawyer ID
            request_id: For audit trail
            skip: Pagination skip
            limit: Pagination limit
            
        Returns:
            Tuple of (cases, total_count)
        """
        try:
            query = TenantAwareQuery.add_firm_filter(
                {"lawyer_id": lawyer_id, "deleted_at": None},
                firm_id
            )
            
            start_time = datetime.utcnow()
            
            total = await self.collection.count_documents(query)
            cursor = self.collection.find(query).skip(skip).limit(limit).sort("created_at", -1)
            docs = await cursor.to_list(length=limit)
            
            elapsed = (datetime.utcnow() - start_time).total_seconds()
            
            logger.info(
                f"[cases] FIND_BY_LAWYER firm_id={firm_id} lawyer_id={lawyer_id} "
                f"returned={len(docs)} total={total} elapsed={elapsed:.3f}s request_id={request_id}"
            )
            
            return docs, total
        except Exception as e:
            logger.error(f"[cases] FIND_BY_LAWYER error: {str(e)}")
            raise

    async def find_by_status(
        self,
        firm_id: str,
        status: str,
        request_id: str,
        skip: int = 0,
        limit: int = 50
    ) -> tuple[List[Dict[str, Any]], int]:
        """
        Find all cases with a specific status within firm.
        
        Args:
            firm_id: Multi-tenant isolation
            status: Case status
            request_id: For audit trail
            skip: Pagination skip
            limit: Pagination limit
            
        Returns:
            Tuple of (cases, total_count)
        """
        try:
            query = TenantAwareQuery.add_firm_filter(
                {"status": status, "deleted_at": None},
                firm_id
            )
            
            start_time = datetime.utcnow()
            
            total = await self.collection.count_documents(query)
            cursor = self.collection.find(query).skip(skip).limit(limit).sort("created_at", -1)
            docs = await cursor.to_list(length=limit)
            
            elapsed = (datetime.utcnow() - start_time).total_seconds()
            
            logger.info(
                f"[cases] FIND_BY_STATUS firm_id={firm_id} status={status} "
                f"returned={len(docs)} total={total} elapsed={elapsed:.3f}s request_id={request_id}"
            )
            
            return docs, total
        except Exception as e:
            logger.error(f"[cases] FIND_BY_STATUS error: {str(e)}")
            raise

    async def find_by_priority(
        self,
        firm_id: str,
        priority: str,
        request_id: str,
        skip: int = 0,
        limit: int = 50
    ) -> tuple[List[Dict[str, Any]], int]:
        """
        Find all cases with a specific priority within firm.
        
        Args:
            firm_id: Multi-tenant isolation
            priority: Case priority (low, medium, high, urgent)
            request_id: For audit trail
            skip: Pagination skip
            limit: Pagination limit
            
        Returns:
            Tuple of (cases, total_count)
        """
        try:
            query = TenantAwareQuery.add_firm_filter(
                {"priority": priority, "deleted_at": None},
                firm_id
            )
            
            start_time = datetime.utcnow()
            
            total = await self.collection.count_documents(query)
            cursor = self.collection.find(query).skip(skip).limit(limit).sort("created_at", -1)
            docs = await cursor.to_list(length=limit)
            
            elapsed = (datetime.utcnow() - start_time).total_seconds()
            
            logger.info(
                f"[cases] FIND_BY_PRIORITY firm_id={firm_id} priority={priority} "
                f"returned={len(docs)} total={total} elapsed={elapsed:.3f}s request_id={request_id}"
            )
            
            return docs, total
        except Exception as e:
            logger.error(f"[cases] FIND_BY_PRIORITY error: {str(e)}")
            raise

    async def find_by_stage(
        self,
        firm_id: str,
        stage: str,
        request_id: str,
        skip: int = 0,
        limit: int = 50
    ) -> tuple[List[Dict[str, Any]], int]:
        """
        Find all cases in a specific stage within firm.
        
        Args:
            firm_id: Multi-tenant isolation
            stage: Case stage
            request_id: For audit trail
            skip: Pagination skip
            limit: Pagination limit
            
        Returns:
            Tuple of (cases, total_count)
        """
        try:
            query = TenantAwareQuery.add_firm_filter(
                {"stage": stage, "deleted_at": None},
                firm_id
            )
            
            start_time = datetime.utcnow()
            
            total = await self.collection.count_documents(query)
            cursor = self.collection.find(query).skip(skip).limit(limit).sort("created_at", -1)
            docs = await cursor.to_list(length=limit)
            
            elapsed = (datetime.utcnow() - start_time).total_seconds()
            
            logger.info(
                f"[cases] FIND_BY_STAGE firm_id={firm_id} stage={stage} "
                f"returned={len(docs)} total={total} elapsed={elapsed:.3f}s request_id={request_id}"
            )
            
            return docs, total
        except Exception as e:
            logger.error(f"[cases] FIND_BY_STAGE error: {str(e)}")
            raise

    async def find_by_legal_area(
        self,
        firm_id: str,
        legal_area: str,
        request_id: str,
        skip: int = 0,
        limit: int = 50
    ) -> tuple[List[Dict[str, Any]], int]:
        """
        Find all cases in a legal area within firm.
        
        Args:
            firm_id: Multi-tenant isolation
            legal_area: Legal area
            request_id: For audit trail
            skip: Pagination skip
            limit: Pagination limit
            
        Returns:
            Tuple of (cases, total_count)
        """
        try:
            query = TenantAwareQuery.add_firm_filter(
                {"legal_area": legal_area, "deleted_at": None},
                firm_id
            )
            
            start_time = datetime.utcnow()
            
            total = await self.collection.count_documents(query)
            cursor = self.collection.find(query).skip(skip).limit(limit).sort("created_at", -1)
            docs = await cursor.to_list(length=limit)
            
            elapsed = (datetime.utcnow() - start_time).total_seconds()
            
            logger.info(
                f"[cases] FIND_BY_LEGAL_AREA firm_id={firm_id} legal_area={legal_area} "
                f"returned={len(docs)} total={total} elapsed={elapsed:.3f}s request_id={request_id}"
            )
            
            return docs, total
        except Exception as e:
            logger.error(f"[cases] FIND_BY_LEGAL_AREA error: {str(e)}")
            raise

    async def find_assigned_to_user(
        self,
        firm_id: str,
        user_id: str,
        request_id: str,
        skip: int = 0,
        limit: int = 50
    ) -> tuple[List[Dict[str, Any]], int]:
        """
        Find all cases assigned to a user within firm.
        
        Args:
            firm_id: Multi-tenant isolation
            user_id: User ID
            request_id: For audit trail
            skip: Pagination skip
            limit: Pagination limit
            
        Returns:
            Tuple of (cases, total_count)
        """
        try:
            query = TenantAwareQuery.add_firm_filter(
                {"assigned_users": user_id, "deleted_at": None},
                firm_id
            )
            
            start_time = datetime.utcnow()
            
            total = await self.collection.count_documents(query)
            cursor = self.collection.find(query).skip(skip).limit(limit).sort("updated_at", -1)
            docs = await cursor.to_list(length=limit)
            
            elapsed = (datetime.utcnow() - start_time).total_seconds()
            
            logger.info(
                f"[cases] FIND_ASSIGNED_TO_USER firm_id={firm_id} user_id={user_id} "
                f"returned={len(docs)} total={total} elapsed={elapsed:.3f}s request_id={request_id}"
            )
            
            return docs, total
        except Exception as e:
            logger.error(f"[cases] FIND_ASSIGNED_TO_USER error: {str(e)}")
            raise

    async def find_by_date_range(
        self,
        firm_id: str,
        start_date: datetime,
        end_date: datetime,
        request_id: str,
        skip: int = 0,
        limit: int = 50
    ) -> tuple[List[Dict[str, Any]], int]:
        """
        Find cases created within a date range within firm.
        
        Args:
            firm_id: Multi-tenant isolation
            start_date: Range start
            end_date: Range end
            request_id: For audit trail
            skip: Pagination skip
            limit: Pagination limit
            
        Returns:
            Tuple of (cases, total_count)
        """
        try:
            query = TenantAwareQuery.add_firm_filter(
                {
                    "created_at": {"$gte": start_date, "$lte": end_date},
                    "deleted_at": None
                },
                firm_id
            )
            
            start_time = datetime.utcnow()
            
            total = await self.collection.count_documents(query)
            cursor = self.collection.find(query).skip(skip).limit(limit).sort("created_at", -1)
            docs = await cursor.to_list(length=limit)
            
            elapsed = (datetime.utcnow() - start_time).total_seconds()
            
            logger.info(
                f"[cases] FIND_BY_DATE_RANGE firm_id={firm_id} start={start_date.date()} "
                f"end={end_date.date()} returned={len(docs)} total={total} "
                f"elapsed={elapsed:.3f}s request_id={request_id}"
            )
            
            return docs, total
        except Exception as e:
            logger.error(f"[cases] FIND_BY_DATE_RANGE error: {str(e)}")
            raise

    async def list_paginated(
        self,
        firm_id: str,
        skip: int = 0,
        limit: int = 50,
        status: Optional[str] = None,
        priority: Optional[str] = None,
        legal_area: Optional[str] = None,
        request_id: str = None
    ) -> tuple[List[Dict[str, Any]], int]:
        """
        List cases with pagination and optional filters.
        
        Args:
            firm_id: Multi-tenant isolation
            skip: Pagination skip
            limit: Pagination limit (max 100)
            status: Filter by status
            priority: Filter by priority
            legal_area: Filter by legal area
            request_id: For audit trail
            
        Returns:
            Tuple of (cases, total_count)
        """
        try:
            limit = min(limit, 100)
            
            query = TenantAwareQuery.add_firm_filter({"deleted_at": None}, firm_id)
            if status:
                query["status"] = status
            if priority:
                query["priority"] = priority
            if legal_area:
                query["legal_area"] = legal_area
            
            start_time = datetime.utcnow()
            
            total = await self.collection.count_documents(query)
            docs = await self.collection.find(query).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
            
            elapsed = (datetime.utcnow() - start_time).total_seconds()
            
            logger.info(
                f"[cases] LIST_PAGINATED firm_id={firm_id} skip={skip} limit={limit} "
                f"returned={len(docs)} total={total} elapsed={elapsed:.3f}s request_id={request_id}"
            )
            
            return docs, total
        except Exception as e:
            logger.error(f"[cases] LIST_PAGINATED error: {str(e)}")
            raise

    async def search(
        self,
        firm_id: str,
        search_term: str,
        request_id: str,
        skip: int = 0,
        limit: int = 50
    ) -> tuple[List[Dict[str, Any]], int]:
        """
        Search cases by title, description, case number, or tags.
        
        Args:
            firm_id: Multi-tenant isolation
            search_term: Search text
            request_id: For audit trail
            skip: Pagination skip
            limit: Pagination limit
            
        Returns:
            Tuple of (cases, total_count)
        """
        try:
            query = TenantAwareQuery.add_firm_filter(
                {
                    "$or": [
                        {"title": {"$regex": search_term, "$options": "i"}},
                        {"description": {"$regex": search_term, "$options": "i"}},
                        {"case_number": {"$regex": search_term, "$options": "i"}},
                        {"tags": {"$in": [search_term]}}
                    ],
                    "deleted_at": None
                },
                firm_id
            )
            
            start_time = datetime.utcnow()
            
            total = await self.collection.count_documents(query)
            cursor = self.collection.find(query).skip(skip).limit(limit).sort("updated_at", -1)
            docs = await cursor.to_list(length=limit)
            
            elapsed = (datetime.utcnow() - start_time).total_seconds()
            
            logger.info(
                f"[cases] SEARCH firm_id={firm_id} query='{search_term}' "
                f"returned={len(docs)} total={total} elapsed={elapsed:.3f}s request_id={request_id}"
            )
            
            return docs, total
        except Exception as e:
            logger.error(f"[cases] SEARCH error: {str(e)}")
            raise

    # ════════════════════════════════════════════════════════════════════════════════
    # DOMAIN OPERATIONS
    # ════════════════════════════════════════════════════════════════════════════════

    async def change_status(
        self,
        firm_id: str,
        case_id: str,
        new_status: str,
        request_id: str
    ) -> Dict[str, Any]:
        """
        Change case status.
        
        Args:
            firm_id: Multi-tenant isolation
            case_id: Case ID
            new_status: New status value
            request_id: For audit trail
            
        Returns:
            Updated case document
        """
        try:
            valid_statuses = {"open", "in_progress", "closed", "archived"}
            if new_status not in valid_statuses:
                logger.error(
                    f"[cases] CHANGE_STATUS invalid status: {new_status} "
                    f"request_id={request_id}"
                )
                raise ValueError(f"Invalid status: {new_status}")
            
            start_time = datetime.utcnow()
            
            result = await self.update(
                firm_id=firm_id,
                resource_id=case_id,
                update_data={"status": new_status, "updated_at": datetime.utcnow()},
                request_id=request_id
            )
            
            elapsed = (datetime.utcnow() - start_time).total_seconds()
            
            logger.info(
                f"[cases] CHANGE_STATUS firm_id={firm_id} case_id={case_id} "
                f"status={new_status} elapsed={elapsed:.3f}s request_id={request_id}"
            )
            
            return result
        except Exception as e:
            logger.error(f"[cases] CHANGE_STATUS error: {str(e)}")
            raise

    async def close_case(
        self,
        firm_id: str,
        case_id: str,
        request_id: str
    ) -> Dict[str, Any]:
        """
        Close a case (set status to closed and closed_at timestamp).
        
        Args:
            firm_id: Multi-tenant isolation
            case_id: Case ID
            request_id: For audit trail
            
        Returns:
            Updated case document
        """
        try:
            start_time = datetime.utcnow()
            
            result = await self.update(
                firm_id=firm_id,
                resource_id=case_id,
                update_data={
                    "status": "closed",
                    "closed_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                },
                request_id=request_id
            )
            
            elapsed = (datetime.utcnow() - start_time).total_seconds()
            
            logger.info(
                f"[cases] CLOSE_CASE firm_id={firm_id} case_id={case_id} "
                f"elapsed={elapsed:.3f}s request_id={request_id}"
            )
            
            return result
        except Exception as e:
            logger.error(f"[cases] CLOSE_CASE error: {str(e)}")
            raise

    async def reopen_case(
        self,
        firm_id: str,
        case_id: str,
        request_id: str
    ) -> Dict[str, Any]:
        """
        Reopen a closed case (set status back to open).
        
        Args:
            firm_id: Multi-tenant isolation
            case_id: Case ID
            request_id: For audit trail
            
        Returns:
            Updated case document
        """
        try:
            start_time = datetime.utcnow()
            
            result = await self.update(
                firm_id=firm_id,
                resource_id=case_id,
                update_data={
                    "status": "open",
                    "closed_at": None,
                    "updated_at": datetime.utcnow()
                },
                request_id=request_id
            )
            
            elapsed = (datetime.utcnow() - start_time).total_seconds()
            
            logger.info(
                f"[cases] REOPEN_CASE firm_id={firm_id} case_id={case_id} "
                f"elapsed={elapsed:.3f}s request_id={request_id}"
            )
            
            return result
        except Exception as e:
            logger.error(f"[cases] REOPEN_CASE error: {str(e)}")
            raise

    async def archive_case(
        self,
        firm_id: str,
        case_id: str,
        request_id: str
    ) -> Dict[str, Any]:
        """
        Archive a case (set status to archived).
        
        Args:
            firm_id: Multi-tenant isolation
            case_id: Case ID
            request_id: For audit trail
            
        Returns:
            Updated case document
        """
        try:
            start_time = datetime.utcnow()
            
            result = await self.update(
                firm_id=firm_id,
                resource_id=case_id,
                update_data={
                    "status": "archived",
                    "archived_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                },
                request_id=request_id
            )
            
            elapsed = (datetime.utcnow() - start_time).total_seconds()
            
            logger.info(
                f"[cases] ARCHIVE_CASE firm_id={firm_id} case_id={case_id} "
                f"elapsed={elapsed:.3f}s request_id={request_id}"
            )
            
            return result
        except Exception as e:
            logger.error(f"[cases] ARCHIVE_CASE error: {str(e)}")
            raise

    async def restore_case(
        self,
        firm_id: str,
        case_id: str,
        request_id: str
    ) -> Dict[str, Any]:
        """
        Restore an archived case (set status to open).
        
        Args:
            firm_id: Multi-tenant isolation
            case_id: Case ID
            request_id: For audit trail
            
        Returns:
            Updated case document
        """
        try:
            start_time = datetime.utcnow()
            
            result = await self.update(
                firm_id=firm_id,
                resource_id=case_id,
                update_data={
                    "status": "open",
                    "archived_at": None,
                    "updated_at": datetime.utcnow()
                },
                request_id=request_id
            )
            
            elapsed = (datetime.utcnow() - start_time).total_seconds()
            
            logger.info(
                f"[cases] RESTORE_CASE firm_id={firm_id} case_id={case_id} "
                f"elapsed={elapsed:.3f}s request_id={request_id}"
            )
            
            return result
        except Exception as e:
            logger.error(f"[cases] RESTORE_CASE error: {str(e)}")
            raise

    async def assign_lawyer(
        self,
        firm_id: str,
        case_id: str,
        lawyer_id: str,
        request_id: str
    ) -> Dict[str, Any]:
        """
        Assign a lawyer to a case.
        
        Args:
            firm_id: Multi-tenant isolation
            case_id: Case ID
            lawyer_id: Lawyer ID
            request_id: For audit trail
            
        Returns:
            Updated case document
        """
        try:
            start_time = datetime.utcnow()
            
            result = await self.update(
                firm_id=firm_id,
                resource_id=case_id,
                update_data={
                    "lawyer_id": lawyer_id,
                    "updated_at": datetime.utcnow()
                },
                request_id=request_id
            )
            
            elapsed = (datetime.utcnow() - start_time).total_seconds()
            
            logger.info(
                f"[cases] ASSIGN_LAWYER firm_id={firm_id} case_id={case_id} "
                f"lawyer_id={lawyer_id} elapsed={elapsed:.3f}s request_id={request_id}"
            )
            
            return result
        except Exception as e:
            logger.error(f"[cases] ASSIGN_LAWYER error: {str(e)}")
            raise

    async def assign_user(
        self,
        firm_id: str,
        case_id: str,
        user_id: str,
        request_id: str
    ) -> bool:
        """
        Assign a user to a case (add to assigned_users).
        
        Args:
            firm_id: Multi-tenant isolation
            case_id: Case ID
            user_id: User ID
            request_id: For audit trail
            
        Returns:
            Success boolean
        """
        try:
            query = TenantAwareQuery.add_firm_filter({"_id": case_id}, firm_id)
            
            start_time = datetime.utcnow()
            
            result = await self.collection.update_one(
                query,
                {
                    "$addToSet": {"assigned_users": user_id},
                    "$set": {"updated_at": datetime.utcnow()}
                }
            )
            
            elapsed = (datetime.utcnow() - start_time).total_seconds()
            
            logger.info(
                f"[cases] ASSIGN_USER firm_id={firm_id} case_id={case_id} "
                f"user_id={user_id} elapsed={elapsed:.3f}s request_id={request_id}"
            )
            
            return result.modified_count > 0
        except Exception as e:
            logger.error(f"[cases] ASSIGN_USER error: {str(e)}")
            raise

    async def unassign_user(
        self,
        firm_id: str,
        case_id: str,
        user_id: str,
        request_id: str
    ) -> bool:
        """
        Unassign a user from a case (remove from assigned_users).
        
        Args:
            firm_id: Multi-tenant isolation
            case_id: Case ID
            user_id: User ID
            request_id: For audit trail
            
        Returns:
            Success boolean
        """
        try:
            query = TenantAwareQuery.add_firm_filter({"_id": case_id}, firm_id)
            
            start_time = datetime.utcnow()
            
            result = await self.collection.update_one(
                query,
                {
                    "$pull": {"assigned_users": user_id},
                    "$set": {"updated_at": datetime.utcnow()}
                }
            )
            
            elapsed = (datetime.utcnow() - start_time).total_seconds()
            
            logger.info(
                f"[cases] UNASSIGN_USER firm_id={firm_id} case_id={case_id} "
                f"user_id={user_id} elapsed={elapsed:.3f}s request_id={request_id}"
            )
            
            return result.modified_count > 0
        except Exception as e:
            logger.error(f"[cases] UNASSIGN_USER error: {str(e)}")
            raise

    # ════════════════════════════════════════════════════════════════════════════════
    # REPORTING OPERATIONS
    # ════════════════════════════════════════════════════════════════════════════════

    async def statistics(
        self,
        firm_id: str,
        request_id: str
    ) -> Dict[str, Any]:
        """
        Calculate case statistics for firm.
        
        Args:
            firm_id: Multi-tenant isolation
            request_id: For audit trail
            
        Returns:
            Statistics dictionary with case counts by status, priority, and legal area
        """
        try:
            start_time = datetime.utcnow()
            
            base_query = TenantAwareQuery.add_firm_filter({}, firm_id)
            
            total = await self.collection.count_documents(base_query)
            
            status_counts = {}
            for status in ["open", "in_progress", "closed", "archived"]:
                count = await self.collection.count_documents(
                    TenantAwareQuery.add_firm_filter({"status": status}, firm_id)
                )
                if count > 0:
                    status_counts[status] = count
            
            priority_counts = {}
            for priority in ["low", "medium", "high", "urgent"]:
                count = await self.collection.count_documents(
                    TenantAwareQuery.add_firm_filter({"priority": priority}, firm_id)
                )
                if count > 0:
                    priority_counts[priority] = count
            
            legal_areas = []
            cursor = self.collection.distinct(
                "legal_area",
                TenantAwareQuery.add_firm_filter({}, firm_id)
            )
            
            elapsed = (datetime.utcnow() - start_time).total_seconds()
            
            stats = {
                "total": total,
                "by_status": status_counts,
                "by_priority": priority_counts,
                "active_legal_areas": len(legal_areas) if legal_areas else 0,
            }
            
            logger.info(
                f"[cases] STATISTICS firm_id={firm_id} total={total} "
                f"elapsed={elapsed:.3f}s request_id={request_id}"
            )
            
            return stats
        except Exception as e:
            logger.error(f"[cases] STATISTICS error: {str(e)}")
            raise

    async def metrics(
        self,
        firm_id: str,
        request_id: str
    ) -> Dict[str, Any]:
        """
        Calculate detailed case metrics for firm.
        
        Args:
            firm_id: Multi-tenant isolation
            request_id: For audit trail
            
        Returns:
            Metrics dictionary with aggregated case data
        """
        try:
            start_time = datetime.utcnow()
            
            query = TenantAwareQuery.add_firm_filter({}, firm_id)
            
            total = await self.collection.count_documents(query)
            active = await self.collection.count_documents(
                TenantAwareQuery.add_firm_filter({"status": {"$in": ["open", "in_progress"]}}, firm_id)
            )
            closed = await self.collection.count_documents(
                TenantAwareQuery.add_firm_filter({"status": "closed"}, firm_id)
            )
            archived = await self.collection.count_documents(
                TenantAwareQuery.add_firm_filter({"status": "archived"}, firm_id)
            )
            
            urgent_count = await self.collection.count_documents(
                TenantAwareQuery.add_firm_filter({"priority": "urgent"}, firm_id)
            )
            
            elapsed = (datetime.utcnow() - start_time).total_seconds()
            
            metrics = {
                "total_cases": total,
                "active_cases": active,
                "closed_cases": closed,
                "archived_cases": archived,
                "urgent_cases": urgent_count,
                "active_percentage": round((active / total * 100) if total > 0 else 0, 2),
            }
            
            logger.info(
                f"[cases] METRICS firm_id={firm_id} total={total} active={active} "
                f"elapsed={elapsed:.3f}s request_id={request_id}"
            )
            
            return metrics
        except Exception as e:
            logger.error(f"[cases] METRICS error: {str(e)}")
            raise

    async def dashboard_summary(
        self,
        firm_id: str,
        request_id: str
    ) -> Dict[str, Any]:
        """
        Get dashboard summary data for firm.
        
        Args:
            firm_id: Multi-tenant isolation
            request_id: For audit trail
            
        Returns:
            Dashboard summary dictionary
        """
        try:
            start_time = datetime.utcnow()
            
            stats = await self.statistics(firm_id, request_id)
            metrics = await self.metrics(firm_id, request_id)
            
            recently_created = await self.collection.find(
                TenantAwareQuery.add_firm_filter({}, firm_id)
            ).sort("created_at", -1).limit(5).to_list(5)
            
            recently_updated = await self.collection.find(
                TenantAwareQuery.add_firm_filter({}, firm_id)
            ).sort("updated_at", -1).limit(5).to_list(5)
            
            elapsed = (datetime.utcnow() - start_time).total_seconds()
            
            summary = {
                "statistics": stats,
                "metrics": metrics,
                "recently_created_count": len(recently_created),
                "recently_updated_count": len(recently_updated),
            }
            
            logger.info(
                f"[cases] DASHBOARD_SUMMARY firm_id={firm_id} "
                f"elapsed={elapsed:.3f}s request_id={request_id}"
            )
            
            return summary
        except Exception as e:
            logger.error(f"[cases] DASHBOARD_SUMMARY error: {str(e)}")
            raise

    async def count_active(self, firm_id: str) -> int:
        """
        Count total active (non-deleted) cases for firm.
        
        Args:
            firm_id: Multi-tenant isolation
            
        Returns:
            Count of active cases
        """
        try:
            query = TenantAwareQuery.add_firm_filter({"deleted_at": None}, firm_id)
            return await self.collection.count_documents(query)
        except Exception as e:
            logger.error(f"[cases] COUNT_ACTIVE error: {str(e)}")
            raise

    # ════════════════════════════════════════════════════════════════════════════════
    # VALIDATION HELPERS
    # ════════════════════════════════════════════════════════════════════════════════

    async def validate_case_number(
        self,
        firm_id: str,
        case_number: str,
        exclude_id: Optional[str] = None,
        request_id: str = None
    ) -> bool:
        """
        Check if case_number is unique within firm.
        
        Args:
            firm_id: Multi-tenant isolation
            case_number: Case number to check
            exclude_id: Optional document ID to exclude from check (for updates)
            request_id: For audit trail
            
        Returns:
            True if unique, False otherwise
        """
        try:
            query = TenantAwareQuery.add_firm_filter({"case_number": case_number}, firm_id)
            if exclude_id:
                if self._is_valid_object_id(exclude_id):
                    query["_id"] = {"$ne": ObjectId(exclude_id)}
                else:
                    query["_id"] = {"$ne": exclude_id}
            
            existing = await self.collection.find_one(query)
            is_unique = existing is None
            
            logger.debug(
                f"[cases] VALIDATE_CASE_NUMBER firm_id={firm_id} "
                f"case_number={case_number} unique={is_unique} request_id={request_id}"
            )
            
            return is_unique
        except Exception as e:
            logger.error(f"[cases] VALIDATE_CASE_NUMBER error: {str(e)}")
            raise

    async def validate_case_unique(
        self,
        firm_id: str,
        case_id: str,
        request_id: str = None
    ) -> bool:
        """
        Check if case exists and belongs to firm.
        
        Args:
            firm_id: Multi-tenant isolation
            case_id: Case ID to check
            request_id: For audit trail
            
        Returns:
            True if case exists, False otherwise
        """
        try:
            doc = await self.find_by_id(firm_id, case_id, request_id or "")
            exists = doc is not None
            
            logger.debug(
                f"[cases] VALIDATE_CASE_UNIQUE firm_id={firm_id} "
                f"case_id={case_id} exists={exists} request_id={request_id}"
            )
            
            return exists
        except Exception as e:
            logger.error(f"[cases] VALIDATE_CASE_UNIQUE error: {str(e)}")
            raise

    @staticmethod
    def _is_valid_object_id(value: str) -> bool:
        """Check if string is valid MongoDB ObjectId"""
        try:
            ObjectId.from_string(value)
            return True
        except:
            return False
