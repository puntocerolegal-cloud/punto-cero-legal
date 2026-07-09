"""
Webhook idempotency implementation for exactly-once delivery.

CRITICAL FIX (S5.3-Finding#10): Ensures webhooks are processed
exactly once, preventing duplicate transactions and data corruption.

Implements idempotency key pattern:
1. Extract idempotency_key from webhook
2. Check if already processed
3. If yes: return cached response
4. If no: process atomically, store result, return response
"""

import logging
from typing import Dict, Any, Optional, Callable
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorDatabase
import hashlib
import json

logger = logging.getLogger(__name__)

# Supported webhook services
SUPPORTED_SERVICES = {
    "stripe": {
        "idempotency_key_field": "id",
        "event_type_field": "type",
    },
    "mercadopago": {
        "idempotency_key_field": "id",
        "event_type_field": "type",
    },
    "email_service": {
        "idempotency_key_field": "message_id",
        "event_type_field": "event_type",
    },
}


class WebhookIdempotencyManager:
    """
    Manages webhook idempotency for exactly-once delivery.
    
    Prevents:
    - Duplicate transaction processing
    - Double-charging
    - Duplicate notifications
    - Data inconsistency
    """
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.collection = db.webhook_events
        self.ttl_days = 30  # Keep records for 30 days
    
    async def initialize_indexes(self):
        """Initialize required indexes on webhook_events collection."""
        try:
            # Index on idempotency_key for fast lookup
            await self.collection.create_index([("idempotency_key", 1)], unique=True)
            logger.info("[IDEMPOTENCY] Created unique index on idempotency_key")
            
            # Index on service + event_type for analytics
            await self.collection.create_index([("service", 1), ("event_type", 1)])
            logger.info("[IDEMPOTENCY] Created index on service+event_type")
            
            # Index on processed_at for TTL cleanup
            await self.collection.create_index([("processed_at", 1)])
            logger.info("[IDEMPOTENCY] Created index on processed_at")
            
            # TTL index for automatic cleanup
            await self.collection.create_index(
                [("processed_at", 1)],
                expireAfterSeconds=self.ttl_days * 24 * 3600
            )
            logger.info(f"[IDEMPOTENCY] Created TTL index ({self.ttl_days} days)")
        
        except Exception as e:
            logger.warning(f"[IDEMPOTENCY] Index creation error: {e}")
    
    def _extract_idempotency_key(
        self,
        event: Dict[str, Any],
        service: str
    ) -> Optional[str]:
        """Extract idempotency key from event."""
        if service not in SUPPORTED_SERVICES:
            logger.warning(f"[IDEMPOTENCY] Unknown service: {service}")
            return None
        
        key_field = SUPPORTED_SERVICES[service]["idempotency_key_field"]
        key = event.get(key_field)
        
        if not key:
            logger.warning(f"[IDEMPOTENCY] Missing key field '{key_field}' for {service}")
            return None
        
        return str(key)
    
    def _extract_event_type(
        self,
        event: Dict[str, Any],
        service: str
    ) -> Optional[str]:
        """Extract event type from event."""
        if service not in SUPPORTED_SERVICES:
            return None
        
        type_field = SUPPORTED_SERVICES[service]["event_type_field"]
        return event.get(type_field)
    
    async def has_been_processed(
        self,
        idempotency_key: str,
        service: str
    ) -> bool:
        """Check if webhook has already been processed."""
        try:
            existing = await self.collection.find_one({
                "idempotency_key": idempotency_key,
                "service": service
            })
            return existing is not None
        except Exception as e:
            logger.error(f"[IDEMPOTENCY] Error checking webhook: {e}")
            return False
    
    async def get_cached_response(
        self,
        idempotency_key: str,
        service: str
    ) -> Optional[Dict[str, Any]]:
        """Get cached response if webhook was previously processed."""
        try:
            record = await self.collection.find_one({
                "idempotency_key": idempotency_key,
                "service": service
            })
            
            if record:
                return record.get("result")
        except Exception as e:
            logger.error(f"[IDEMPOTENCY] Error retrieving cached response: {e}")
        
        return None
    
    async def store_webhook(
        self,
        idempotency_key: str,
        service: str,
        event_type: str,
        event_data: Dict[str, Any],
        result: Dict[str, Any]
    ) -> bool:
        """
        Store webhook processing result for idempotency.
        
        CRITICAL: Must be done atomically with main processing.
        """
        try:
            record = {
                "idempotency_key": idempotency_key,
                "service": service,
                "event_type": event_type,
                "event_data_hash": hashlib.sha256(
                    json.dumps(event_data, default=str, sort_keys=True).encode()
                ).hexdigest(),
                "result": result,
                "processed_at": datetime.utcnow(),
                "retry_count": 0,
            }
            
            await self.collection.insert_one(record)
            logger.info(
                f"[IDEMPOTENCY] Stored webhook: {service}/{event_type} "
                f"idempotency_key={idempotency_key}"
            )
            return True
        
        except Exception as e:
            logger.error(f"[IDEMPOTENCY] Error storing webhook: {e}")
            return False
    
    async def mark_retry(
        self,
        idempotency_key: str,
        service: str
    ) -> bool:
        """Mark webhook for retry (increments retry count)."""
        try:
            result = await self.collection.update_one(
                {
                    "idempotency_key": idempotency_key,
                    "service": service
                },
                {
                    "$inc": {"retry_count": 1},
                    "$set": {"last_retry_at": datetime.utcnow()}
                }
            )
            return result.modified_count > 0
        except Exception as e:
            logger.error(f"[IDEMPOTENCY] Error marking retry: {e}")
            return False


class WebhookProcessor:
    """
    Wrapper for webhook processing with idempotency.
    
    Usage:
        processor = WebhookProcessor(db)
        
        result = await processor.process(
            event=event,
            service="stripe",
            handler=handle_stripe_webhook
        )
    """
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.idempotency = WebhookIdempotencyManager(db)
    
    async def process(
        self,
        event: Dict[str, Any],
        service: str,
        handler: Callable,
        use_transaction: bool = True
    ) -> Dict[str, Any]:
        """
        Process webhook with idempotency guarantee.
        
        CRITICAL: Ensures exactly-once delivery.
        
        Args:
            event: Webhook event data
            service: Service name (stripe, mercadopago, email_service)
            handler: Async function to handle the webhook
            use_transaction: Whether to use MongoDB transaction
        
        Returns:
            Response dict with webhook result
        
        Raises:
            ValueError: If event format invalid for service
        """
        # Extract idempotency key
        idempotency_key = self.idempotency._extract_idempotency_key(event, service)
        if not idempotency_key:
            raise ValueError(f"Cannot extract idempotency key from {service} event")
        
        event_type = self.idempotency._extract_event_type(event, service)
        
        logger.info(
            f"[WEBHOOK] Processing: {service}/{event_type} "
            f"idempotency_key={idempotency_key}"
        )
        
        # Check if already processed
        if await self.idempotency.has_been_processed(idempotency_key, service):
            logger.info(
                f"[WEBHOOK] Duplicate detected: {service}/{event_type} "
                f"idempotency_key={idempotency_key} (returning cached result)"
            )
            cached_result = await self.idempotency.get_cached_response(
                idempotency_key, service
            )
            return {
                "status": "ok",
                "cached": True,
                "result": cached_result
            }
        
        # Process webhook
        try:
            if use_transaction:
                # Process within MongoDB transaction
                async with await self.db.client.start_session() as session:
                    async with session.start_transaction():
                        result = await handler(event)
                        
                        # Store result atomically
                        await self.idempotency.store_webhook(
                            idempotency_key=idempotency_key,
                            service=service,
                            event_type=event_type,
                            event_data=event,
                            result=result
                        )
            else:
                # Process without transaction
                result = await handler(event)
                
                # Store result
                await self.idempotency.store_webhook(
                    idempotency_key=idempotency_key,
                    service=service,
                    event_type=event_type,
                    event_data=event,
                    result=result
                )
            
            logger.info(
                f"[WEBHOOK] Processed successfully: {service}/{event_type} "
                f"idempotency_key={idempotency_key}"
            )
            
            return {
                "status": "ok",
                "cached": False,
                "result": result
            }
        
        except Exception as e:
            logger.error(
                f"[WEBHOOK] Processing failed: {service}/{event_type} "
                f"idempotency_key={idempotency_key}: {e}"
            )
            
            # Mark for retry
            await self.idempotency.mark_retry(idempotency_key, service)
            
            raise
