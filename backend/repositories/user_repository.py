"""
User Repository
Multi-tenant user management
"""

from typing import Optional, Dict, Any, List
from motor.motor_asyncio import AsyncIOMotorCollection
from bson import ObjectId
from .enterprise_base_repository import BaseRepository
from middleware.tenant_isolation import TenantAwareQuery


class UserRepository(BaseRepository):
    """
    Repository for user operations with multi-tenant isolation.
    
    All operations automatically scoped to firm_id.
    No cross-tenant user data access possible.
    """
    
    def __init__(self, collection: AsyncIOMotorCollection):
        """Initialize with users collection."""
        super().__init__(collection)
    
    async def find_by_email(
        self,
        firm_id: str,
        email: str,
        request_id: str
    ) -> Optional[Dict[str, Any]]:
        """
        Find user by email within firm.
        
        Args:
            firm_id: Organization ID
            email: User email
            request_id: Request trace ID
        
        Returns:
            User document or None
        """
        query = TenantAwareQuery.add_firm_filter(
            {"email": email},
            firm_id
        )
        return await self.collection.find_one(query)
    
    async def update_by_email(
        self,
        firm_id: str,
        email: str,
        updates: Dict[str, Any],
        request_id: str
    ) -> bool:
        """
        Update user by email.
        
        Args:
            firm_id: Organization ID
            email: User email
            updates: Field updates
            request_id: Request trace ID
        
        Returns:
            True if updated, False otherwise
        """
        query = TenantAwareQuery.add_firm_filter(
            {"email": email},
            firm_id
        )
        
        result = await self.collection.update_one(
            query,
            {"$set": updates}
        )
        
        if result.modified_count > 0:
            self.logger.info(
                f"[USER] Updated by email. "
                f"request_id={request_id} | firm_id={firm_id} | "
                f"email={email}"
            )
        
        return result.modified_count > 0
    
    async def find_by_referral_code(
        self,
        firm_id: str,
        referral_code: str,
        request_id: str
    ) -> Optional[Dict[str, Any]]:
        """
        Find user by referral code within firm.
        
        Args:
            firm_id: Organization ID
            referral_code: Referral code
            request_id: Request trace ID
        
        Returns:
            User document or None
        """
        query = TenantAwareQuery.add_firm_filter(
            {"referral_code": referral_code},
            firm_id
        )
        return await self.collection.find_one(query)
    
    async def find_many_by_firm(
        self,
        firm_id: str,
        query: Dict[str, Any] = None,
        skip: int = 0,
        limit: int = 100,
        request_id: str = None
    ) -> tuple[List[Dict[str, Any]], int]:
        """
        Find multiple users within firm.
        
        Args:
            firm_id: Organization ID
            query: Additional filters
            skip: Skip count
            limit: Result limit
            request_id: Request trace ID
        
        Returns:
            Tuple of (users list, total count)
        """
        return await self.find_many(
            firm_id=firm_id,
            query=query or {},
            skip=skip,
            limit=limit,
            request_id=request_id
        )
    
    async def increment_referral_count(
        self,
        firm_id: str,
        user_id: str,
        request_id: str
    ) -> bool:
        """
        Increment referral count for user.
        
        Args:
            firm_id: Organization ID
            user_id: User ID
            request_id: Request trace ID
        
        Returns:
            True if updated, False otherwise
        """
        try:
            user_oid = ObjectId(user_id)
        except Exception:
            user_oid = user_id
        
        query = TenantAwareQuery.add_firm_filter(
            {"_id": user_oid},
            firm_id
        )
        
        result = await self.collection.update_one(
            query,
            {"$inc": {"referral_count": 1}}
        )
        
        return result.modified_count > 0
    
    async def update_subscription_status(
        self,
        firm_id: str,
        user_id: str,
        status: str,
        request_id: str
    ) -> bool:
        """
        Update user subscription status.
        
        Args:
            firm_id: Organization ID
            user_id: User ID
            status: New status
            request_id: Request trace ID
        
        Returns:
            True if updated, False otherwise
        """
        try:
            user_oid = ObjectId(user_id)
        except Exception:
            user_oid = user_id
        
        query = TenantAwareQuery.add_firm_filter(
            {"_id": user_oid},
            firm_id
        )
        
        result = await self.collection.update_one(
            query,
            {
                "$set": {
                    "subscription_status": status,
                    "updated_at": __import__("datetime").datetime.utcnow(),
                }
            }
        )
        
        if result.modified_count > 0:
            self.logger.info(
                f"[USER] Subscription status updated. "
                f"request_id={request_id} | firm_id={firm_id} | "
                f"user_id={user_id} | status={status}"
            )

        return result.modified_count > 0

    async def update_by_id(
        self,
        firm_id: str,
        user_id: str,
        update_data: Dict[str, Any],
        request_id: str
    ) -> bool:
        """
        Update user by _id.

        Used by webhooks to update user when ID is already known.

        Args:
            firm_id: Organization ID
            user_id: User _id (ObjectId as string)
            update_data: Fields to update
            request_id: Request trace ID

        Returns:
            True if updated, False otherwise
        """
        try:
            user_oid = ObjectId(user_id)
        except Exception:
            user_oid = user_id

        query = TenantAwareQuery.add_firm_filter(
            {"_id": user_oid},
            firm_id
        )

        result = await self.collection.update_one(
            query,
            {"$set": update_data}
        )

        if result.modified_count > 0:
            self.logger.info(
                f"[USER] UPDATE_BY_ID success "
                f"firm_id={firm_id} user_id={user_id} request_id={request_id}"
            )
        else:
            self.logger.warning(
                f"[USER] UPDATE_BY_ID no_match "
                f"firm_id={firm_id} user_id={user_id} request_id={request_id}"
            )

        return result.modified_count > 0
