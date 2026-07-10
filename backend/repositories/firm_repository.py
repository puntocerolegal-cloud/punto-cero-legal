"""
Firm Repository
CRUD operations for Firm (customer tenant) with multi-tenant isolation
"""

from motor.motor_asyncio import AsyncIOMotorCollection
from typing import Optional, Dict, Any, List
from .enterprise_base_repository import BaseRepository
from models.enterprise_core import Firm
import logging

logger = logging.getLogger(__name__)


class FirmRepository(BaseRepository[Firm]):
    """
    Firm repository for managing law firm tenants.
    Each firm is isolated via firm_id in all operations.
    """

    def __init__(self, collection: AsyncIOMotorCollection):
        super().__init__(collection, Firm)

    # ========================================================================
    # FIRM-SPECIFIC QUERIES
    # ========================================================================

    async def find_by_slug(
        self,
        slug: str,
        request_id: str
    ) -> Optional[Dict[str, Any]]:
        """
        Find firm by slug (unique identifier).
        
        Args:
            slug: URL-safe firm identifier
            request_id: For audit trail
            
        Returns:
            Firm document or None
        """
        try:
            query = {
                "slug": slug,
                "deleted_at": None  # Exclude soft-deleted
            }
            
            firm = await self.collection.find_one(query)
            
            if firm:
                logger.debug(
                    f"[FIRM] FIND_BY_SLUG slug={slug} found request_id={request_id}"
                )
            else:
                logger.debug(
                    f"[FIRM] FIND_BY_SLUG slug={slug} not_found request_id={request_id}"
                )
            
            return firm
        except Exception as e:
            logger.error(f"[FIRM] FIND_BY_SLUG error: {str(e)}")
            raise

    async def find_by_email(
        self,
        email: str,
        request_id: str
    ) -> Optional[Dict[str, Any]]:
        """
        Find firm by email address.
        
        Args:
            email: Firm contact email
            request_id: For audit trail
            
        Returns:
            Firm document or None
        """
        try:
            query = {
                "email": email.lower(),
                "deleted_at": None
            }
            
            firm = await self.collection.find_one(query)
            
            logger.debug(
                f"[FIRM] FIND_BY_EMAIL email={email} "
                f"found={firm is not None} request_id={request_id}"
            )
            
            return firm
        except Exception as e:
            logger.error(f"[FIRM] FIND_BY_EMAIL error: {str(e)}")
            raise

    async def find_active(
        self,
        skip: int = 0,
        limit: int = 100,
        request_id: str = None
    ) -> tuple[List[Dict[str, Any]], int]:
        """
        Find active firms (for system admin queries).
        
        Args:
            skip: Pagination skip
            limit: Pagination limit
            request_id: For audit trail
            
        Returns:
            Tuple of (firms, total_count)
        """
        try:
            query = {
                "status": "ACTIVE",
                "active": True,
                "deleted_at": None
            }
            
            total = await self.collection.count_documents(query)
            
            cursor = self.collection.find(query).skip(skip).limit(limit)
            cursor = cursor.sort([("created_at", -1)])
            
            firms = await cursor.to_list(length=limit)
            
            logger.debug(
                f"[FIRM] FIND_ACTIVE found={len(firms)} total={total} "
                f"request_id={request_id}"
            )
            
            return firms, total
        except Exception as e:
            logger.error(f"[FIRM] FIND_ACTIVE error: {str(e)}")
            raise

    async def find_by_status(
        self,
        status: str,
        skip: int = 0,
        limit: int = 100,
        request_id: str = None
    ) -> tuple[List[Dict[str, Any]], int]:
        """
        Find firms by status (for admin operations).
        
        Args:
            status: Firm status (ACTIVE, SUSPENDED, PENDING_VERIFICATION)
            skip: Pagination skip
            limit: Pagination limit
            request_id: For audit trail
            
        Returns:
            Tuple of (firms, total_count)
        """
        try:
            query = {
                "status": status,
                "deleted_at": None
            }
            
            total = await self.collection.count_documents(query)
            
            cursor = self.collection.find(query).skip(skip).limit(limit)
            cursor = cursor.sort([("created_at", -1)])
            
            firms = await cursor.to_list(length=limit)
            
            logger.debug(
                f"[FIRM] FIND_BY_STATUS status={status} found={len(firms)} "
                f"total={total} request_id={request_id}"
            )
            
            return firms, total
        except Exception as e:
            logger.error(f"[FIRM] FIND_BY_STATUS error: {str(e)}")
            raise

    async def find_by_owner(
        self,
        owner_id: str,
        request_id: str
    ) -> List[Dict[str, Any]]:
        """
        Find all firms owned by a user.
        
        Args:
            owner_id: Owner user ID
            request_id: For audit trail
            
        Returns:
            List of firm documents
        """
        try:
            query = {
                "owner_id": owner_id,
                "deleted_at": None
            }
            
            cursor = self.collection.find(query).sort([("created_at", -1)])
            firms = await cursor.to_list(length=1000)
            
            logger.debug(
                f"[FIRM] FIND_BY_OWNER owner_id={owner_id} "
                f"found={len(firms)} request_id={request_id}"
            )
            
            return firms
        except Exception as e:
            logger.error(f"[FIRM] FIND_BY_OWNER error: {str(e)}")
            raise

    async def find_by_owner_email(
        self,
        owner_email: str,
        request_id: str
    ) -> Optional[Dict[str, Any]]:
        """
        Find firm by owner email.
        
        Args:
            owner_email: Owner user email
            request_id: For audit trail
            
        Returns:
            Firm document or None
        """
        try:
            query = {
                "owner_email": owner_email,
                "status": "ACTIVE",
                "deleted_at": None
            }
            
            firm = await self.collection.find_one(query)
            
            logger.debug(
                f"[FIRM] FIND_BY_OWNER_EMAIL owner_email={owner_email} "
                f"found={firm is not None} request_id={request_id}"
            )
            
            return firm
        except Exception as e:
            logger.error(f"[FIRM] FIND_BY_OWNER_EMAIL error: {str(e)}")
            raise

    # ========================================================================
    # STATUS TRANSITIONS
    # ========================================================================

    async def activate(
        self,
        firm_id: str,
        approved_by_user_id: str,
        request_id: str
    ) -> Dict[str, Any]:
        """
        Activate a firm (PENDING → ACTIVE).
        
        Args:
            firm_id: Firm ID
            approved_by_user_id: Admin user who approved
            request_id: For audit trail
            
        Returns:
            Updated firm document
        """
        from datetime import datetime
        
        try:
            update_data = {
                "status": "ACTIVE",
                "is_verified": True,
                "approval_status": "approved",
                "approval_date": datetime.utcnow(),
                "approved_by": approved_by_user_id,
                "updated_at": datetime.utcnow()
            }
            
            return await self.update(
                firm_id=firm_id,
                resource_id=firm_id,  # For base repo
                update_data=update_data,
                request_id=request_id
            )
        except Exception as e:
            logger.error(f"[FIRM] ACTIVATE error: {str(e)}")
            raise

    async def suspend(
        self,
        firm_id: str,
        reason: str,
        suspended_by_user_id: str,
        request_id: str
    ) -> Dict[str, Any]:
        """
        Suspend a firm.
        
        Args:
            firm_id: Firm ID
            reason: Suspension reason
            suspended_by_user_id: Admin user who suspended
            request_id: For audit trail
            
        Returns:
            Updated firm document
        """
        from datetime import datetime
        
        try:
            update_data = {
                "status": "SUSPENDED",
                "active": False,
                "suspension_reason": reason,
                "suspended_by": suspended_by_user_id,
                "updated_at": datetime.utcnow()
            }
            
            return await self.update(
                firm_id=firm_id,
                resource_id=firm_id,
                update_data=update_data,
                request_id=request_id
            )
        except Exception as e:
            logger.error(f"[FIRM] SUSPEND error: {str(e)}")
            raise

    # ========================================================================
    # QUOTA MANAGEMENT
    # ========================================================================

    async def check_user_quota(
        self,
        firm_id: str,
        request_id: str
    ) -> Dict[str, Any]:
        """
        Check firm's user quota (current vs max).
        
        Args:
            firm_id: Firm ID
            request_id: For audit trail
            
        Returns:
            {"max_users": int, "current_users": int, "available": int}
        """
        try:
            firm = await self.find_by_id(firm_id, firm_id, request_id)
            
            if not firm:
                raise ValueError(f"Firm not found: {firm_id}")
            
            # Count active users
            from motor.motor_asyncio import AsyncIOMotorDatabase
            
            # This is simplified; in real implementation would query users collection
            current_users = firm.get("active_users_count", 0)
            max_users = firm.get("max_users", 10)
            available = max_users - current_users
            
            result = {
                "firm_id": firm_id,
                "max_users": max_users,
                "current_users": current_users,
                "available": available,
                "quota_exceeded": available < 0
            }
            
            logger.debug(
                f"[FIRM] CHECK_USER_QUOTA firm_id={firm_id} "
                f"current={current_users} max={max_users} request_id={request_id}"
            )
            
            return result
        except Exception as e:
            logger.error(f"[FIRM] CHECK_USER_QUOTA error: {str(e)}")
            raise

    # ========================================================================
    # INDEXING
    # ========================================================================

    async def ensure_indexes(self):
        """Create recommended indexes for Firm collection"""
        try:
            # Unique indexes
            await self.create_index([("slug", 1)], unique=True)
            await self.create_index([("email", 1)], unique=True)
            
            # Query indexes
            await self.create_index([("status", 1)])
            await self.create_index([("active", 1)])
            await self.create_index([("owner_id", 1)])
            await self.create_index([("created_at", -1)])
            
            # Soft delete index
            await self.create_index([("deleted_at", 1)])
            
            logger.info("[FIRM] Indexes created successfully")
        except Exception as e:
            logger.warning(f"[FIRM] Index creation warning: {str(e)}")
