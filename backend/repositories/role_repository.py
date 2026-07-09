"""
Role Repository
CRUD operations for roles with multi-tenant isolation

Follows Golden Repository Template v1.0 specification.
Provides role management with:
- Multi-tenant isolation via firm_id
- Audit trail with request_id
- Comprehensive error handling
- System and custom role management
- Role lifecycle support
"""

from typing import Optional, List, Dict, Any
from motor.motor_asyncio import AsyncIOMotorCollection
from bson import ObjectId
from datetime import datetime
import logging

from repositories.enterprise_base_repository import BaseRepository
from middleware.tenant_isolation import TenantAwareQuery

logger = logging.getLogger(__name__)


class RoleRepository(BaseRepository):
    """
    Repository for role operations.
    
    Manages all role-related CRUD operations with strict multi-tenant
    isolation via firm_id. Roles represent access control definitions that must
    be auditable and protected against cross-tenant leakage.
    
    Key responsibilities:
    - Manage role lifecycle (system roles, custom roles)
    - Support role queries and filtering
    - Maintain audit trail with request_id traceability
    - Ensure firm_id filtering on all queries
    - Distinguish between system and custom roles
    """

    def __init__(self, collection: AsyncIOMotorCollection):
        """
        Initialize RoleRepository.
        
        Args:
            collection: Motor async collection for roles
        """
        super().__init__(collection, dict)
        self.collection = collection
        
        logger.info(
            f"[roles] RoleRepository initialized "
            f"collection={collection.full_name}"
        )

    # ════════════════════════════════════════════════════════════════════════════════
    # REPOSITORY INITIALIZATION & INDEXES
    # ════════════════════════════════════════════════════════════════════════════════

    async def ensure_indexes(self) -> None:
        """
        Create all required indexes for roles collection.
        
        Follows Golden Repository Template v1.0:
        - First field: firm_id (multi-tenant isolation)
        - Compound indexes for common query patterns
        """
        try:
            logger.info("[roles] Starting index creation...")

            indexes = [
                {
                    "name": "firm_name",
                    "spec": [("firm_id", 1), ("name", 1)],
                    "kwargs": {"background": True}
                },
                {
                    "name": "firm_system",
                    "spec": [("firm_id", 1), ("is_system", 1)],
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
                    logger.info(f"[roles] Index created: {index_name}")
                except Exception as e:
                    logger.warning(f"[roles] Index creation warning for {index['name']}: {str(e)}")

            logger.info("[roles] Index creation completed")
        except Exception as e:
            logger.error(f"[roles] ensure_indexes failed: {str(e)}")
            raise

    @staticmethod
    def init() -> None:
        """Initialize repository (no-op for compatibility)"""
        pass

    # ════════════════════════════════════════════════════════════════════════════════
    # SPECIALIZED QUERIES
    # ════════════════════════════════════════════════════════════════════════════════

    async def find_by_name(
        self,
        firm_id: str,
        name: str,
        request_id: str
    ) -> Optional[Dict[str, Any]]:
        """
        Find role by name within firm.
        
        Args:
            firm_id: Multi-tenant isolation
            name: Role name
            request_id: For audit trail
            
        Returns:
            Role document or None
        """
        try:
            query = TenantAwareQuery.add_firm_filter({"name": name}, firm_id)
            
            start_time = datetime.utcnow()
            doc = await self.collection.find_one(query)
            elapsed = (datetime.utcnow() - start_time).total_seconds()
            
            logger.info(
                f"[roles] FIND_BY_NAME firm_id={firm_id} name={name} "
                f"found={'yes' if doc else 'no'} elapsed={elapsed:.3f}s request_id={request_id}"
            )
            
            return doc
        except Exception as e:
            logger.error(f"[roles] FIND_BY_NAME error: {str(e)}")
            raise

    async def find_system_roles(
        self,
        firm_id: str,
        request_id: str
    ) -> List[Dict[str, Any]]:
        """
        Find all system roles for firm.
        System roles are predefined and cannot be modified.
        
        Args:
            firm_id: Multi-tenant isolation
            request_id: For audit trail
            
        Returns:
            List of system role documents
        """
        try:
            query = TenantAwareQuery.add_firm_filter({"is_system": True}, firm_id)
            
            start_time = datetime.utcnow()
            docs = await self.collection.find(query).sort("created_at", 1).to_list(None)
            elapsed = (datetime.utcnow() - start_time).total_seconds()
            
            logger.info(
                f"[roles] FIND_SYSTEM_ROLES firm_id={firm_id} count={len(docs)} "
                f"elapsed={elapsed:.3f}s request_id={request_id}"
            )
            
            return docs
        except Exception as e:
            logger.error(f"[roles] FIND_SYSTEM_ROLES error: {str(e)}")
            raise

    async def find_custom_roles(
        self,
        firm_id: str,
        request_id: str
    ) -> List[Dict[str, Any]]:
        """
        Find all custom roles for firm.
        Custom roles are user-defined and can be modified.
        
        Args:
            firm_id: Multi-tenant isolation
            request_id: For audit trail
            
        Returns:
            List of custom role documents
        """
        try:
            query = TenantAwareQuery.add_firm_filter({"is_system": False}, firm_id)
            
            start_time = datetime.utcnow()
            docs = await self.collection.find(query).sort("created_at", 1).to_list(None)
            elapsed = (datetime.utcnow() - start_time).total_seconds()
            
            logger.info(
                f"[roles] FIND_CUSTOM_ROLES firm_id={firm_id} count={len(docs)} "
                f"elapsed={elapsed:.3f}s request_id={request_id}"
            )
            
            return docs
        except Exception as e:
            logger.error(f"[roles] FIND_CUSTOM_ROLES error: {str(e)}")
            raise

    async def list_paginated(
        self,
        firm_id: str,
        skip: int = 0,
        limit: int = 50,
        is_system: Optional[bool] = None,
        request_id: str = None
    ) -> tuple[List[Dict[str, Any]], int]:
        """
        List roles with pagination and optional filters.
        
        Args:
            firm_id: Multi-tenant isolation
            skip: Pagination skip
            limit: Pagination limit (max 100)
            is_system: Filter by system/custom status
            request_id: For audit trail
            
        Returns:
            Tuple of (roles, total_count)
        """
        try:
            limit = min(limit, 100)
            
            query = TenantAwareQuery.add_firm_filter({}, firm_id)
            if is_system is not None:
                query["is_system"] = is_system
            
            start_time = datetime.utcnow()
            
            total = await self.collection.count_documents(query)
            docs = await self.collection.find(query).sort("created_at", 1).skip(skip).limit(limit).to_list(limit)
            
            elapsed = (datetime.utcnow() - start_time).total_seconds()
            
            logger.info(
                f"[roles] LIST_PAGINATED firm_id={firm_id} skip={skip} "
                f"limit={limit} returned={len(docs)} total={total} elapsed={elapsed:.3f}s "
                f"request_id={request_id}"
            )
            
            return docs, total
        except Exception as e:
            logger.error(f"[roles] LIST_PAGINATED error: {str(e)}")
            raise

    # ════════════════════════════════════════════════════════════════════════════════
    # VALIDATION HELPERS
    # ════════════════════════════════════════════════════════════════════════════════

    async def validate_role_unique(
        self,
        firm_id: str,
        name: str,
        exclude_id: Optional[str] = None,
        request_id: str = None
    ) -> bool:
        """
        Check if role name is unique within firm.
        
        Args:
            firm_id: Multi-tenant isolation
            name: Role name to check
            exclude_id: Optional document ID to exclude from check
            request_id: For audit trail
            
        Returns:
            True if unique, False otherwise
        """
        try:
            query = TenantAwareQuery.add_firm_filter({"name": name}, firm_id)
            if exclude_id:
                if self._is_valid_object_id(exclude_id):
                    query["_id"] = {"$ne": ObjectId(exclude_id)}
                else:
                    query["_id"] = {"$ne": exclude_id}
            
            existing = await self.collection.find_one(query)
            is_unique = existing is None
            
            logger.debug(
                f"[roles] VALIDATE_ROLE_UNIQUE firm_id={firm_id} "
                f"name={name} unique={is_unique} request_id={request_id}"
            )
            
            return is_unique
        except Exception as e:
            logger.error(f"[roles] VALIDATE_ROLE_UNIQUE error: {str(e)}")
            raise

    async def validate_system_role_readonly(
        self,
        firm_id: str,
        role_id: str,
        request_id: str
    ) -> bool:
        """
        Check if role is a system role (read-only).
        System roles cannot be modified.
        
        Args:
            firm_id: Multi-tenant isolation
            role_id: Role ID
            request_id: For audit trail
            
        Returns:
            True if system role, False if custom
        """
        try:
            role = await self.find_by_id(firm_id, role_id, request_id)
            if not role:
                logger.warning(
                    f"[roles] VALIDATE_SYSTEM_ROLE_READONLY role not found "
                    f"request_id={request_id}"
                )
                return False
            
            is_system = role.get("is_system", False)
            logger.debug(
                f"[roles] VALIDATE_SYSTEM_ROLE_READONLY firm_id={firm_id} "
                f"role_id={role_id} is_system={is_system} request_id={request_id}"
            )
            
            return is_system
        except Exception as e:
            logger.error(f"[roles] VALIDATE_SYSTEM_ROLE_READONLY error: {str(e)}")
            raise

    @staticmethod
    def _is_valid_object_id(value: str) -> bool:
        """Check if string is valid MongoDB ObjectId"""
        try:
            ObjectId.from_string(value)
            return True
        except:
            return False
