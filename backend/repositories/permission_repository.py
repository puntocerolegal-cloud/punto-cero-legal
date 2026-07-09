"""
Permission Repository
CRUD operations for permissions with multi-tenant isolation

Follows Golden Repository Template v1.0 specification.
Provides permission management with:
- Multi-tenant isolation via firm_id
- Audit trail with request_id
- Comprehensive error handling
- System and role-based permission management
- Permission validation support
"""

from typing import Optional, List, Dict, Any
from motor.motor_asyncio import AsyncIOMotorCollection
from bson import ObjectId
from datetime import datetime
import logging

from repositories.enterprise_base_repository import BaseRepository
from middleware.tenant_isolation import TenantAwareQuery

logger = logging.getLogger(__name__)


class PermissionRepository(BaseRepository):
    """
    Repository for permission operations.
    
    Manages all permission-related CRUD operations with strict multi-tenant
    isolation via firm_id. Permissions represent access control rules that must
    be auditable and protected against cross-tenant leakage.
    
    Key responsibilities:
    - Manage permission lifecycle (system permissions, role permissions)
    - Support permission queries and filtering
    - Maintain audit trail with request_id traceability
    - Ensure firm_id filtering on all queries
    - Provide permission enumeration and validation
    """

    def __init__(self, collection: AsyncIOMotorCollection):
        """
        Initialize PermissionRepository.
        
        Args:
            collection: Motor async collection for permissions
        """
        super().__init__(collection, dict)
        self.collection = collection
        
        logger.info(
            f"[permissions] PermissionRepository initialized "
            f"collection={collection.full_name}"
        )

    # ════════════════════════════════════════════════════════════════════════════════
    # REPOSITORY INITIALIZATION & INDEXES
    # ════════════════════════════════════════════════════════════════════════════════

    async def ensure_indexes(self) -> None:
        """
        Create all required indexes for permissions collection.
        
        Follows Golden Repository Template v1.0:
        - First field: firm_id (multi-tenant isolation)
        - Compound indexes for common query patterns
        """
        try:
            logger.info("[permissions] Starting index creation...")

            indexes = [
                {
                    "name": "firm_code",
                    "spec": [("firm_id", 1), ("code", 1)],
                    "kwargs": {"background": True}
                },
                {
                    "name": "firm_role",
                    "spec": [("firm_id", 1), ("role_id", 1)],
                    "kwargs": {"background": True}
                },
                {
                    "name": "firm_resource",
                    "spec": [("firm_id", 1), ("resource", 1)],
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
                    logger.info(f"[permissions] Index created: {index_name}")
                except Exception as e:
                    logger.warning(f"[permissions] Index creation warning for {index['name']}: {str(e)}")

            logger.info("[permissions] Index creation completed")
        except Exception as e:
            logger.error(f"[permissions] ensure_indexes failed: {str(e)}")
            raise

    @staticmethod
    def init() -> None:
        """Initialize repository (no-op for compatibility)"""
        pass

    # ════════════════════════════════════════════════════════════════════════════════
    # SPECIALIZED QUERIES
    # ════════════════════════════════════════════════════════════════════════════════

    async def find_by_role(
        self,
        firm_id: str,
        role_id: str,
        request_id: str
    ) -> List[Dict[str, Any]]:
        """
        Find all permissions for a specific role.
        
        Args:
            firm_id: Multi-tenant isolation
            role_id: Role ID to filter by
            request_id: For audit trail
            
        Returns:
            List of permission documents
        """
        try:
            query = TenantAwareQuery.add_firm_filter(
                {"role_id": role_id},
                firm_id
            )
            
            start_time = datetime.utcnow()
            docs = await self.collection.find(query).sort("resource", 1).to_list(None)
            elapsed = (datetime.utcnow() - start_time).total_seconds()
            
            logger.info(
                f"[permissions] FIND_BY_ROLE firm_id={firm_id} "
                f"role_id={role_id} count={len(docs)} "
                f"elapsed={elapsed:.3f}s request_id={request_id}"
            )
            
            return docs
        except Exception as e:
            logger.error(f"[permissions] FIND_BY_ROLE error: {str(e)}")
            raise

    async def find_system_permissions(
        self,
        firm_id: str,
        request_id: str
    ) -> List[Dict[str, Any]]:
        """
        Find all system permissions for firm.
        System permissions are predefined and cannot be modified.
        
        Args:
            firm_id: Multi-tenant isolation
            request_id: For audit trail
            
        Returns:
            List of system permission documents
        """
        try:
            query = TenantAwareQuery.add_firm_filter(
                {"is_system": True},
                firm_id
            )
            
            start_time = datetime.utcnow()
            docs = await self.collection.find(query).sort("code", 1).to_list(None)
            elapsed = (datetime.utcnow() - start_time).total_seconds()
            
            logger.info(
                f"[permissions] FIND_SYSTEM_PERMISSIONS firm_id={firm_id} "
                f"count={len(docs)} elapsed={elapsed:.3f}s request_id={request_id}"
            )
            
            return docs
        except Exception as e:
            logger.error(f"[permissions] FIND_SYSTEM_PERMISSIONS error: {str(e)}")
            raise

    async def list_paginated(
        self,
        firm_id: str,
        skip: int = 0,
        limit: int = 50,
        role_id: Optional[str] = None,
        resource: Optional[str] = None,
        request_id: str = None
    ) -> tuple[List[Dict[str, Any]], int]:
        """
        List permissions with pagination and optional filters.
        
        Args:
            firm_id: Multi-tenant isolation
            skip: Pagination skip
            limit: Pagination limit (max 100)
            role_id: Filter by role
            resource: Filter by resource
            request_id: For audit trail
            
        Returns:
            Tuple of (permissions, total_count)
        """
        try:
            limit = min(limit, 100)
            
            query = TenantAwareQuery.add_firm_filter({}, firm_id)
            if role_id:
                query["role_id"] = role_id
            if resource:
                query["resource"] = resource
            
            start_time = datetime.utcnow()
            
            total = await self.collection.count_documents(query)
            docs = await self.collection.find(query).sort("resource", 1).skip(skip).limit(limit).to_list(limit)
            
            elapsed = (datetime.utcnow() - start_time).total_seconds()
            
            logger.info(
                f"[permissions] LIST_PAGINATED firm_id={firm_id} skip={skip} "
                f"limit={limit} returned={len(docs)} total={total} elapsed={elapsed:.3f}s "
                f"request_id={request_id}"
            )
            
            return docs, total
        except Exception as e:
            logger.error(f"[permissions] LIST_PAGINATED error: {str(e)}")
            raise

    # ════════════════════════════════════════════════════════════════════════════════
    # VALIDATION HELPERS
    # ════════════════════════════════════════════════════════════════════════════════

    async def validate_permission_unique(
        self,
        firm_id: str,
        code: str,
        exclude_id: Optional[str] = None,
        request_id: str = None
    ) -> bool:
        """
        Check if permission code is unique within firm.
        
        Args:
            firm_id: Multi-tenant isolation
            code: Permission code to check
            exclude_id: Optional document ID to exclude from check
            request_id: For audit trail
            
        Returns:
            True if unique, False otherwise
        """
        try:
            query = TenantAwareQuery.add_firm_filter({"code": code}, firm_id)
            if exclude_id:
                if self._is_valid_object_id(exclude_id):
                    query["_id"] = {"$ne": ObjectId(exclude_id)}
                else:
                    query["_id"] = {"$ne": exclude_id}
            
            existing = await self.collection.find_one(query)
            is_unique = existing is None
            
            logger.debug(
                f"[permissions] VALIDATE_PERMISSION_UNIQUE firm_id={firm_id} "
                f"code={code} unique={is_unique} request_id={request_id}"
            )
            
            return is_unique
        except Exception as e:
            logger.error(f"[permissions] VALIDATE_PERMISSION_UNIQUE error: {str(e)}")
            raise

    async def validate_system_permission_readonly(
        self,
        firm_id: str,
        permission_id: str,
        request_id: str
    ) -> bool:
        """
        Check if permission is a system permission (read-only).
        System permissions cannot be modified.
        
        Args:
            firm_id: Multi-tenant isolation
            permission_id: Permission ID
            request_id: For audit trail
            
        Returns:
            True if system permission, False if custom
        """
        try:
            permission = await self.find_by_id(firm_id, permission_id, request_id)
            if not permission:
                logger.warning(
                    f"[permissions] VALIDATE_SYSTEM_PERMISSION_READONLY "
                    f"permission not found request_id={request_id}"
                )
                return False
            
            is_system = permission.get("is_system", False)
            logger.debug(
                f"[permissions] VALIDATE_SYSTEM_PERMISSION_READONLY firm_id={firm_id} "
                f"permission_id={permission_id} is_system={is_system} request_id={request_id}"
            )
            
            return is_system
        except Exception as e:
            logger.error(f"[permissions] VALIDATE_SYSTEM_PERMISSION_READONLY error: {str(e)}")
            raise

    @staticmethod
    def _is_valid_object_id(value: str) -> bool:
        """Check if string is valid MongoDB ObjectId"""
        try:
            ObjectId.from_string(value)
            return True
        except:
            return False
