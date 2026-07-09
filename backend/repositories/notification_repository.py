"""
Notification Repository
Multi-tenant user notifications
"""

from typing import Optional, Dict, Any, List
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorCollection
from bson import ObjectId
from .enterprise_base_repository import BaseRepository
from middleware.tenant_isolation import TenantAwareQuery


class NotificationRepository(BaseRepository):
    """
    Repository for notifications with multi-tenant isolation.
    
    Tracks user notifications within organization boundaries.
    """
    
    def __init__(self, collection: AsyncIOMotorCollection):
        """Initialize with notifications collection."""
        super().__init__(collection)
    
    async def create_notification(
        self,
        firm_id: str,
        target: str,
        user_id: str,
        title: str,
        message: str,
        notification_type: str,
        metadata: Dict[str, Any],
        request_id: str
    ) -> Dict[str, Any]:
        """
        Create notification.
        
        Args:
            firm_id: Organization ID
            target: "user", "admin", "system"
            user_id: Target user ID
            title: Notification title
            message: Notification message
            notification_type: Type for categorization
            metadata: Additional context
            request_id: Request trace ID
        
        Returns:
            Created notification document
        """
        doc = {
            "target": target,
            "user_id": user_id,
            "title": title,
            "message": message,
            "type": notification_type,
            "metadata": metadata,
            "read": False,
            "created_at": datetime.utcnow(),
        }
        
        result = await self.create(firm_id, doc, request_id)
        
        self.logger.debug(
            f"[NOTIFICATION] Created. "
            f"request_id={request_id} | firm_id={firm_id} | "
            f"target={target} | type={notification_type}"
        )
        
        return result
    
    async def find_for_user(
        self,
        firm_id: str,
        user_id: str,
        unread_only: bool = False,
        limit: int = 100,
        request_id: str = None
    ) -> List[Dict[str, Any]]:
        """
        Find notifications for user.
        
        Args:
            firm_id: Organization ID
            user_id: User ID
            unread_only: Filter unread only
            limit: Result limit
            request_id: Request trace ID
        
        Returns:
            List of notification documents
        """
        query = TenantAwareQuery.add_firm_filter(
            {"user_id": user_id},
            firm_id
        )
        
        if unread_only:
            query["read"] = False
        
        docs = await self.collection.find(query) \
            .sort("created_at", -1) \
            .limit(limit) \
            .to_list(None)
        
        return docs
    
    async def mark_as_read(
        self,
        firm_id: str,
        notification_id: str,
        request_id: str
    ) -> bool:
        """
        Mark notification as read.
        
        Args:
            firm_id: Organization ID
            notification_id: Notification ID
            request_id: Request trace ID
        
        Returns:
            True if updated, False otherwise
        """
        try:
            notif_oid = ObjectId(notification_id)
        except Exception:
            notif_oid = notification_id
        
        query = TenantAwareQuery.add_firm_filter(
            {"_id": notif_oid},
            firm_id
        )
        
        result = await self.collection.update_one(
            query,
            {"$set": {"read": True, "read_at": datetime.utcnow()}}
        )

        return result.modified_count > 0

    async def create_notification_from_webhook(
        self,
        firm_id: str,
        notification_data: Dict[str, Any],
        request_id: str
    ) -> Dict[str, Any]:
        """
        Create notification from webhook event data.

        Used by webhooks to create notifications directly from event payloads.

        Args:
            firm_id: Organization ID
            notification_data: Notification data (target, type, title, message, etc.)
            request_id: Request trace ID

        Returns:
            Created notification document
        """
        doc = {
            **notification_data,
            "created_at": datetime.utcnow(),
        }

        result = await self.create(firm_id, doc, request_id)

        self.logger.debug(
            f"[NOTIFICATION] CREATE_FROM_WEBHOOK "
            f"firm_id={firm_id} type={notification_data.get('type')} request_id={request_id}"
        )

        return result
