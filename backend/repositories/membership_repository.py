"""
Membership Repository
CRUD operations for memberships with multi-tenant isolation

Follows Golden Repository Template v1.0 specification.
Provides membership management with:
- Multi-tenant isolation via firm_id
- Audit trail with request_id
- Comprehensive error handling
- User-organization membership lifecycle
- Role assignment and role management
"""

from typing import Optional, List, Dict, Any
from motor.motor_asyncio import AsyncIOMotorCollection
from bson import ObjectId
from datetime import datetime
import logging

from repositories.enterprise_base_repository import BaseRepository
from middleware.tenant_isolation import TenantAwareQuery

logger = logging.getLogger(__name__)


class MembershipRepository(BaseRepository):
    """
    Repository for membership operations.
    
    Manages all membership-related CRUD operations with strict multi-tenant
    isolation via firm_id. Memberships represent user-organization relationships
    that must be auditable and protected against cross-tenant leakage.
    
    Key responsibilities:
    - Manage membership lifecycle (active → inactive → deleted)
    - Support user-organization relationship queries
    - Track role assignments per membership
    - Maintain audit trail with request_id traceability
    - Ensure firm_id filtering on all queries
    - Provide membership metrics and reporting
    """

    def __init__(self, collection: AsyncIOMotorCollection):
        """
        Initialize MembershipRepository.
        
        Args:
            collection: Motor async collection for memberships
        """
        super().__init__(collection, dict)
        self.collection = collection
        
        logger.info(
            f"[memberships] MembershipRepository initialized "
            f"collection={collection.full_name}"
        )

    # ════════════════════════════════════════════════════════════════════════════════
    # REPOSITORY INITIALIZATION & INDEXES
    # ════════════════════════════════════════════════════════════════════════════════

    async def ensure_indexes(self) -> None:
        """
        Create all required indexes for memberships collection.
        
        Follows Golden Repository Template v1.0:
        - First field: firm_id (multi-tenant isolation)
        - Compound indexes for common query patterns
        """
        try:
            logger.info("[memberships] Starting index creation...")

            indexes = [
                {
                    "name": "firm_user",
                    "spec": [("firm_id", 1), ("user_id", 1)],
                    "kwargs": {"background": True}
                },
                {
                    "name": "firm_organization",
                    "spec": [("firm_id", 1), ("organization_id", 1)],
                    "kwargs": {"background": True}
                },
                {
                    "name": "firm_status",
                    "spec": [("firm_id", 1), ("status", 1)],
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
                    logger.info(f"[memberships] Index created: {index_name}")
                except Exception as e:
                    logger.warning(f"[memberships] Index creation warning for {index['name']}: {str(e)}")

            logger.info("[memberships] Index creation completed")
        except Exception as e:
            logger.error(f"[memberships] ensure_indexes failed: {str(e)}")
            raise

    @staticmethod
    def init() -> None:
        """Initialize repository (no-op for compatibility)"""
        pass

    # ════════════════════════════════════════════════════════════════════════════════
    # SPECIALIZED QUERIES
    # ════════════════════════════════════════════════════════════════════════════════

    async def find_by_user(
        self,
        firm_id: str,
        user_id: str,
        request_id: str
    ) -> List[Dict[str, Any]]:
        """
        Find all memberships for a specific user.
        
        Args:
            firm_id: Multi-tenant isolation
            user_id: User ID to filter by
            request_id: For audit trail
            
        Returns:
            List of membership documents
        """
        try:
            query = TenantAwareQuery.add_firm_filter(
                {"user_id": user_id},
                firm_id
            )
            
            start_time = datetime.utcnow()
            docs = await self.collection.find(query).sort("created_at", -1).to_list(None)
            elapsed = (datetime.utcnow() - start_time).total_seconds()
            
            logger.info(
                f"[memberships] FIND_BY_USER firm_id={firm_id} "
                f"user_id={user_id} count={len(docs)} "
                f"elapsed={elapsed:.3f}s request_id={request_id}"
            )
            
            return docs
        except Exception as e:
            logger.error(f"[memberships] FIND_BY_USER error: {str(e)}")
            raise

    async def find_by_organization(
        self,
        firm_id: str,
        organization_id: str,
        request_id: str
    ) -> List[Dict[str, Any]]:
        """
        Find all memberships for a specific organization.
        
        Args:
            firm_id: Multi-tenant isolation
            organization_id: Organization ID to filter by
            request_id: For audit trail
            
        Returns:
            List of membership documents
        """
        try:
            query = TenantAwareQuery.add_firm_filter(
                {"organization_id": organization_id},
                firm_id
            )
            
            start_time = datetime.utcnow()
            docs = await self.collection.find(query).sort("created_at", -1).to_list(None)
            elapsed = (datetime.utcnow() - start_time).total_seconds()
            
            logger.info(
                f"[memberships] FIND_BY_ORGANIZATION firm_id={firm_id} "
                f"organization_id={organization_id} count={len(docs)} "
                f"elapsed={elapsed:.3f}s request_id={request_id}"
            )
            
            return docs
        except Exception as e:
            logger.error(f"[memberships] FIND_BY_ORGANIZATION error: {str(e)}")
            raise

    async def find_active(
        self,
        firm_id: str,
        request_id: str
    ) -> List[Dict[str, Any]]:
        """
        Find all active memberships for firm.
        
        Args:
            firm_id: Multi-tenant isolation
            request_id: For audit trail
            
        Returns:
            List of active membership documents
        """
        try:
            query = TenantAwareQuery.add_firm_filter({"status": "active"}, firm_id)
            
            start_time = datetime.utcnow()
            docs = await self.collection.find(query).sort("created_at", -1).to_list(None)
            elapsed = (datetime.utcnow() - start_time).total_seconds()
            
            logger.info(
                f"[memberships] FIND_ACTIVE firm_id={firm_id} count={len(docs)} "
                f"elapsed={elapsed:.3f}s request_id={request_id}"
            )
            
            return docs
        except Exception as e:
            logger.error(f"[memberships] FIND_ACTIVE error: {str(e)}")
            raise

    async def list_paginated(
        self,
        firm_id: str,
        skip: int = 0,
        limit: int = 50,
        user_id: Optional[str] = None,
        organization_id: Optional[str] = None,
        status: Optional[str] = None,
        request_id: str = None
    ) -> tuple[List[Dict[str, Any]], int]:
        """
        List memberships with pagination and optional filters.
        
        Args:
            firm_id: Multi-tenant isolation
            skip: Pagination skip
            limit: Pagination limit (max 100)
            user_id: Filter by user
            organization_id: Filter by organization
            status: Filter by status
            request_id: For audit trail
            
        Returns:
            Tuple of (memberships, total_count)
        """
        try:
            limit = min(limit, 100)
            
            query = TenantAwareQuery.add_firm_filter({}, firm_id)
            if user_id:
                query["user_id"] = user_id
            if organization_id:
                query["organization_id"] = organization_id
            if status:
                query["status"] = status
            
            start_time = datetime.utcnow()
            
            total = await self.collection.count_documents(query)
            docs = await self.collection.find(query).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
            
            elapsed = (datetime.utcnow() - start_time).total_seconds()
            
            logger.info(
                f"[memberships] LIST_PAGINATED firm_id={firm_id} skip={skip} "
                f"limit={limit} returned={len(docs)} total={total} elapsed={elapsed:.3f}s "
                f"request_id={request_id}"
            )
            
            return docs, total
        except Exception as e:
            logger.error(f"[memberships] LIST_PAGINATED error: {str(e)}")
            raise

    # ════════════════════════════════════════════════════════════════════════════════
    # ROLE MANAGEMENT OPERATIONS
    # ════════════════════════════════════════════════════════════════════════════════

    async def assign_role(
        self,
        firm_id: str,
        membership_id: str,
        role_id: str,
        request_id: str
    ) -> Dict[str, Any]:
        """
        Assign role to membership.
        
        Args:
            firm_id: Multi-tenant isolation
            membership_id: Membership ID
            role_id: Role ID to assign
            request_id: For audit trail
            
        Returns:
            Updated membership document
        """
        try:
            start_time = datetime.utcnow()
            
            result = await self.update(
                firm_id=firm_id,
                resource_id=membership_id,
                update_data={"role_id": role_id, "updated_at": datetime.utcnow()},
                request_id=request_id
            )
            
            elapsed = (datetime.utcnow() - start_time).total_seconds()
            
            logger.info(
                f"[memberships] ASSIGN_ROLE firm_id={firm_id} membership_id={membership_id} "
                f"role_id={role_id} elapsed={elapsed:.3f}s request_id={request_id}"
            )
            
            return result
        except Exception as e:
            logger.error(f"[memberships] ASSIGN_ROLE error: {str(e)}")
            raise

    async def remove_role(
        self,
        firm_id: str,
        membership_id: str,
        request_id: str
    ) -> Dict[str, Any]:
        """
        Remove role from membership (set to None).
        
        Args:
            firm_id: Multi-tenant isolation
            membership_id: Membership ID
            request_id: For audit trail
            
        Returns:
            Updated membership document
        """
        try:
            start_time = datetime.utcnow()
            
            result = await self.update(
                firm_id=firm_id,
                resource_id=membership_id,
                update_data={"role_id": None, "updated_at": datetime.utcnow()},
                request_id=request_id
            )
            
            elapsed = (datetime.utcnow() - start_time).total_seconds()
            
            logger.info(
                f"[memberships] REMOVE_ROLE firm_id={firm_id} membership_id={membership_id} "
                f"elapsed={elapsed:.3f}s request_id={request_id}"
            )
            
            return result
        except Exception as e:
            logger.error(f"[memberships] REMOVE_ROLE error: {str(e)}")
            raise

    async def change_role(
        self,
        firm_id: str,
        membership_id: str,
        new_role_id: str,
        request_id: str
    ) -> Dict[str, Any]:
        """
        Change role for membership (atomic replace).
        
        Args:
            firm_id: Multi-tenant isolation
            membership_id: Membership ID
            new_role_id: New role ID to assign
            request_id: For audit trail
            
        Returns:
            Updated membership document
        """
        try:
            start_time = datetime.utcnow()
            
            result = await self.update(
                firm_id=firm_id,
                resource_id=membership_id,
                update_data={"role_id": new_role_id, "updated_at": datetime.utcnow()},
                request_id=request_id
            )
            
            elapsed = (datetime.utcnow() - start_time).total_seconds()
            
            logger.info(
                f"[memberships] CHANGE_ROLE firm_id={firm_id} membership_id={membership_id} "
                f"role_id={new_role_id} elapsed={elapsed:.3f}s request_id={request_id}"
            )
            
            return result
        except Exception as e:
            logger.error(f"[memberships] CHANGE_ROLE error: {str(e)}")
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
        Calculate membership statistics for firm.
        
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
                f"[memberships] STATISTICS firm_id={firm_id} total={total} "
                f"active={active} elapsed={elapsed:.3f}s request_id={request_id}"
            )
            
            return stats
        except Exception as e:
            logger.error(f"[memberships] STATISTICS error: {str(e)}")
            raise

    @staticmethod
    def _is_valid_object_id(value: str) -> bool:
        """Check if string is valid MongoDB ObjectId"""
        try:
            ObjectId.from_string(value)
            return True
        except:
            return False
