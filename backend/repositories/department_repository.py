"""
Department Repository
CRUD operations for departments with multi-tenant isolation

Follows Golden Repository Template v1.0 specification.
Provides department management with:
- Multi-tenant isolation via firm_id
- Audit trail with request_id
- Comprehensive error handling
- Department lifecycle management
- Reporting and aggregation support
"""

from typing import Optional, List, Dict, Any
from motor.motor_asyncio import AsyncIOMotorCollection
from bson import ObjectId
from datetime import datetime
import logging

from repositories.enterprise_base_repository import BaseRepository
from middleware.tenant_isolation import TenantAwareQuery

logger = logging.getLogger(__name__)


class DepartmentRepository(BaseRepository):
    """
    Repository for department operations.
    
    Manages all department-related CRUD operations with strict multi-tenant
    isolation via firm_id. Departments represent organizational divisions within
    offices that must be auditable and protected against cross-tenant leakage.
    
    Key responsibilities:
    - Manage department lifecycle (active → inactive → deleted)
    - Support department queries and filtering
    - Maintain audit trail with request_id traceability
    - Ensure firm_id filtering on all queries
    - Provide department metrics and reporting
    """

    def __init__(self, collection: AsyncIOMotorCollection):
        """
        Initialize DepartmentRepository.
        
        Args:
            collection: Motor async collection for departments
        """
        super().__init__(collection, dict)
        self.collection = collection
        
        logger.info(
            f"[departments] DepartmentRepository initialized "
            f"collection={collection.full_name}"
        )

    # ════════════════════════════════════════════════════════════════════════════════
    # REPOSITORY INITIALIZATION & INDEXES
    # ════════════════════════════════════════════════════════════════════════════════

    async def ensure_indexes(self) -> None:
        """
        Create all required indexes for departments collection.
        
        Follows Golden Repository Template v1.0:
        - First field: firm_id (multi-tenant isolation)
        - Compound indexes for common query patterns
        - Sparse indexes for optional fields
        """
        try:
            logger.info("[departments] Starting index creation...")

            indexes = [
                {
                    "name": "firm_status",
                    "spec": [("firm_id", 1), ("status", 1)],
                    "kwargs": {"background": True}
                },
                {
                    "name": "firm_office",
                    "spec": [("firm_id", 1), ("office_id", 1)],
                    "kwargs": {"background": True}
                },
                {
                    "name": "firm_created",
                    "spec": [("firm_id", 1), ("created_at", -1)],
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
                    logger.info(f"[departments] Index created: {index_name}")
                except Exception as e:
                    logger.warning(f"[departments] Index creation warning for {index['name']}: {str(e)}")

            logger.info("[departments] Index creation completed")
        except Exception as e:
            logger.error(f"[departments] ensure_indexes failed: {str(e)}")
            raise

    @staticmethod
    def init() -> None:
        """Initialize repository (no-op for compatibility)"""
        pass

    # ════════════════════════════════════════════════════════════════════════════════
    # SPECIALIZED QUERIES
    # ════════════════════════════════════════════════════════════════════════════════

    async def find_by_office(
        self,
        firm_id: str,
        office_id: str,
        request_id: str
    ) -> List[Dict[str, Any]]:
        """
        Find all departments for a specific office.
        
        Args:
            firm_id: Multi-tenant isolation
            office_id: Office ID to filter by
            request_id: For audit trail
            
        Returns:
            List of department documents
        """
        try:
            query = TenantAwareQuery.add_firm_filter(
                {"office_id": office_id},
                firm_id
            )
            
            start_time = datetime.utcnow()
            docs = await self.collection.find(query).sort("created_at", -1).to_list(None)
            elapsed = (datetime.utcnow() - start_time).total_seconds()
            
            logger.info(
                f"[departments] FIND_BY_OFFICE firm_id={firm_id} "
                f"office_id={office_id} count={len(docs)} "
                f"elapsed={elapsed:.3f}s request_id={request_id}"
            )
            
            return docs
        except Exception as e:
            logger.error(f"[departments] FIND_BY_OFFICE error: {str(e)}")
            raise

    async def find_active(
        self,
        firm_id: str,
        request_id: str
    ) -> List[Dict[str, Any]]:
        """
        Find all active departments for firm.
        
        Args:
            firm_id: Multi-tenant isolation
            request_id: For audit trail
            
        Returns:
            List of active department documents
        """
        try:
            query = TenantAwareQuery.add_firm_filter({"status": "active"}, firm_id)
            
            start_time = datetime.utcnow()
            docs = await self.collection.find(query).sort("created_at", -1).to_list(None)
            elapsed = (datetime.utcnow() - start_time).total_seconds()
            
            logger.info(
                f"[departments] FIND_ACTIVE firm_id={firm_id} count={len(docs)} "
                f"elapsed={elapsed:.3f}s request_id={request_id}"
            )
            
            return docs
        except Exception as e:
            logger.error(f"[departments] FIND_ACTIVE error: {str(e)}")
            raise

    async def list_paginated(
        self,
        firm_id: str,
        skip: int = 0,
        limit: int = 50,
        office_id: Optional[str] = None,
        status: Optional[str] = None,
        request_id: str = None
    ) -> tuple[List[Dict[str, Any]], int]:
        """
        List departments with pagination and optional filters.
        
        Args:
            firm_id: Multi-tenant isolation
            skip: Pagination skip
            limit: Pagination limit (max 100)
            office_id: Filter by office
            status: Filter by status
            request_id: For audit trail
            
        Returns:
            Tuple of (departments, total_count)
        """
        try:
            limit = min(limit, 100)
            
            query = TenantAwareQuery.add_firm_filter({}, firm_id)
            if office_id:
                query["office_id"] = office_id
            if status:
                query["status"] = status
            
            start_time = datetime.utcnow()
            
            total = await self.collection.count_documents(query)
            docs = await self.collection.find(query).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
            
            elapsed = (datetime.utcnow() - start_time).total_seconds()
            
            logger.info(
                f"[departments] LIST_PAGINATED firm_id={firm_id} skip={skip} "
                f"limit={limit} returned={len(docs)} total={total} elapsed={elapsed:.3f}s "
                f"request_id={request_id}"
            )
            
            return docs, total
        except Exception as e:
            logger.error(f"[departments] LIST_PAGINATED error: {str(e)}")
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
        Calculate department statistics for firm.
        
        Args:
            firm_id: Multi-tenant isolation
            request_id: For audit trail
            
        Returns:
            Statistics dictionary
        """
        try:
            start_time = datetime.utcnow()
            
            query = TenantAwareQuery.add_firm_filter({}, firm_id)
            
            total = await self.collection.count_documents(query)
            active = await self.collection.count_documents(
                TenantAwareQuery.add_firm_filter({"status": "active"}, firm_id)
            )
            inactive = await self.collection.count_documents(
                TenantAwareQuery.add_firm_filter({"status": "inactive"}, firm_id)
            )
            
            elapsed = (datetime.utcnow() - start_time).total_seconds()
            
            stats = {
                "total": total,
                "active": active,
                "inactive": inactive,
            }
            
            logger.info(
                f"[departments] STATISTICS firm_id={firm_id} total={total} "
                f"active={active} elapsed={elapsed:.3f}s request_id={request_id}"
            )
            
            return stats
        except Exception as e:
            logger.error(f"[departments] STATISTICS error: {str(e)}")
            raise

    # ════════════════════════════════════════════════════════════════════════════════
    # VALIDATION HELPERS
    # ════════════════════════════════════════════════════════════════════════════════

    async def validate_department_unique(
        self,
        firm_id: str,
        office_id: str,
        name: str,
        exclude_id: Optional[str] = None,
        request_id: str = None
    ) -> bool:
        """
        Check if department name is unique within office and firm.
        
        Args:
            firm_id: Multi-tenant isolation
            office_id: Office ID
            name: Department name to check
            exclude_id: Optional document ID to exclude from check
            request_id: For audit trail
            
        Returns:
            True if unique, False otherwise
        """
        try:
            query = TenantAwareQuery.add_firm_filter(
                {"office_id": office_id, "name": name},
                firm_id
            )
            if exclude_id:
                if self._is_valid_object_id(exclude_id):
                    query["_id"] = {"$ne": ObjectId(exclude_id)}
                else:
                    query["_id"] = {"$ne": exclude_id}
            
            existing = await self.collection.find_one(query)
            is_unique = existing is None
            
            logger.debug(
                f"[departments] VALIDATE_DEPARTMENT_UNIQUE firm_id={firm_id} "
                f"name={name} unique={is_unique} request_id={request_id}"
            )
            
            return is_unique
        except Exception as e:
            logger.error(f"[departments] VALIDATE_DEPARTMENT_UNIQUE error: {str(e)}")
            raise

    @staticmethod
    def _is_valid_object_id(value: str) -> bool:
        """Check if string is valid MongoDB ObjectId"""
        try:
            ObjectId.from_string(value)
            return True
        except:
            return False
