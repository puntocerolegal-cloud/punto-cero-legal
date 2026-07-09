"""
Webhook Event Repository
Multi-tenant webhook event audit trail
"""

from typing import Optional, Dict, Any
from motor.motor_asyncio import AsyncIOMotorCollection
from .enterprise_base_repository import BaseRepository
from middleware.tenant_isolation import TenantAwareQuery


class WebhookEventRepository(BaseRepository):
    """
    Repository for webhook events with multi-tenant isolation.
    
    All operations are automatically scoped to firm_id.
    No cross-tenant data access possible.
    """
    
    def __init__(self, collection: AsyncIOMotorCollection):
        """Initialize with webhook_events collection."""
        super().__init__(collection)
    
    async def find_by_event_id(
        self,
        firm_id: str,
        event_id: str,
        request_id: str
    ) -> Optional[Dict[str, Any]]:
        """
        Find webhook event by event_id (idempotency check).
        
        Args:
            firm_id: Organization ID
            event_id: Webhook event ID (external)
            request_id: Request trace ID
        
        Returns:
            Event document or None
        """
        query = TenantAwareQuery.add_firm_filter(
            {"event_id": event_id},
            firm_id
        )
        doc = await self.collection.find_one(query)
        
        if doc:
            self.logger.debug(
                f"[WEBHOOK_EVENT] Found by event_id. "
                f"request_id={request_id} | firm_id={firm_id} | "
                f"event_id={event_id}"
            )
        
        return doc
    
    async def create_event(
        self,
        firm_id: str,
        event_id: str,
        event_type: str,
        external_id: str,
        payload: Dict[str, Any],
        request_id: str
    ) -> Dict[str, Any]:
        """
        Create webhook event record.
        
        Args:
            firm_id: Organization ID
            event_id: Webhook event ID (for idempotency)
            event_type: Type of event (payment, subscription, etc.)
            external_id: External reference (payment_id, etc.)
            payload: Full webhook payload
            request_id: Request trace ID
        
        Returns:
            Created event document
        """
        doc = {
            "event_id": event_id,
            "event_type": event_type,
            "external_id": external_id,
            "payload": payload,
            "processed": False,
            "created_at": __import__("datetime").datetime.utcnow(),
        }
        
        result = await self.create(firm_id, doc, request_id)
        
        self.logger.info(
            f"[WEBHOOK_EVENT] Created. "
            f"request_id={request_id} | firm_id={firm_id} | "
            f"event_id={event_id} | event_type={event_type}"
        )
        
        return result
    
    async def mark_processed(
        self,
        firm_id: str,
        event_id: str,
        processed_data: Dict[str, Any],
        request_id: str
    ) -> bool:
        """
        Mark webhook event as processed.
        
        Args:
            firm_id: Organization ID
            event_id: Webhook event ID
            processed_data: Processing result details
            request_id: Request trace ID
        
        Returns:
            True if updated, False otherwise
        """
        query = TenantAwareQuery.add_firm_filter(
            {"event_id": event_id},
            firm_id
        )
        
        result = await self.collection.update_one(
            query,
            {
                "$set": {
                    "processed": True,
                    "processed_data": processed_data,
                    "processed_at": __import__("datetime").datetime.utcnow(),
                }
            }
        )
        
        if result.modified_count > 0:
            self.logger.info(
                f"[WEBHOOK_EVENT] Marked processed. "
                f"request_id={request_id} | firm_id={firm_id} | "
                f"event_id={event_id}"
            )
        
        return result.modified_count > 0
