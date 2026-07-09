"""
Refund and Chargeback Repositories
Multi-tenant payment dispute tracking
"""

from typing import Optional, Dict, Any
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorCollection
from bson import ObjectId
from .enterprise_base_repository import BaseRepository
from middleware.tenant_isolation import TenantAwareQuery


class RefundRepository(BaseRepository):
    """
    Repository for refund records with multi-tenant isolation.
    """
    
    def __init__(self, collection: AsyncIOMotorCollection):
        """Initialize with refunds collection."""
        super().__init__(collection)
    
    async def create_refund(
        self,
        firm_id: str,
        transaction_id: str,
        refund_id: str,
        amount: float,
        reason: str,
        metadata: Dict[str, Any],
        request_id: str
    ) -> Dict[str, Any]:
        """
        Create refund record.
        
        Args:
            firm_id: Organization ID
            transaction_id: Original transaction ID
            refund_id: Refund ID (from payment processor)
            amount: Refund amount
            reason: Refund reason
            metadata: Additional details
            request_id: Request trace ID
        
        Returns:
            Created refund document
        """
        doc = {
            "transaction_id": transaction_id,
            "refund_id": refund_id,
            "amount": amount,
            "reason": reason,
            "status": "completed",
            "metadata": metadata,
            "created_at": datetime.utcnow(),
        }
        
        result = await self.create(firm_id, doc, request_id)
        
        self.logger.info(
            f"[REFUND] Created. "
            f"request_id={request_id} | firm_id={firm_id} | "
            f"refund_id={refund_id} | amount={amount}"
        )
        
        return result
    
    async def find_by_refund_id(
        self,
        firm_id: str,
        refund_id: str,
        request_id: str
    ) -> Optional[Dict[str, Any]]:
        """
        Find refund by refund ID.
        
        Args:
            firm_id: Organization ID
            refund_id: Refund ID
            request_id: Request trace ID
        
        Returns:
            Refund document or None
        """
        query = TenantAwareQuery.add_firm_filter(
            {"refund_id": refund_id},
            firm_id
        )
        return await self.collection.find_one(query)

    async def create_refund_from_webhook(
        self,
        firm_id: str,
        refund_data: Dict[str, Any],
        request_id: str
    ) -> Dict[str, Any]:
        """
        Create refund from webhook event data.

        Used by webhooks to create refund directly from event payloads.

        Args:
            firm_id: Organization ID
            refund_data: Refund data from webhook (refund_id, payment_id, amount, etc.)
            request_id: Request trace ID

        Returns:
            Created refund document
        """
        doc = {
            **refund_data,
            "created_at": datetime.utcnow(),
        }

        result = await self.create(firm_id, doc, request_id)

        self.logger.info(
            f"[REFUND] CREATE_FROM_WEBHOOK "
            f"firm_id={firm_id} refund_id={refund_data.get('refund_id')} request_id={request_id}"
        )

        return result


class ChargebackRepository(BaseRepository):
    """
    Repository for chargeback records with multi-tenant isolation.
    """
    
    def __init__(self, collection: AsyncIOMotorCollection):
        """Initialize with chargebacks collection."""
        super().__init__(collection)
    
    async def create_chargeback(
        self,
        firm_id: str,
        transaction_id: str,
        chargeback_id: str,
        amount: float,
        reason: str,
        metadata: Dict[str, Any],
        request_id: str
    ) -> Dict[str, Any]:
        """
        Create chargeback record.
        
        Args:
            firm_id: Organization ID
            transaction_id: Original transaction ID
            chargeback_id: Chargeback ID (from processor)
            amount: Chargeback amount
            reason: Reason code
            metadata: Additional details
            request_id: Request trace ID
        
        Returns:
            Created chargeback document
        """
        doc = {
            "transaction_id": transaction_id,
            "chargeback_id": chargeback_id,
            "amount": amount,
            "reason": reason,
            "status": "investigation",
            "metadata": metadata,
            "created_at": datetime.utcnow(),
        }
        
        result = await self.create(firm_id, doc, request_id)
        
        self.logger.critical(
            f"[CHARGEBACK] Created (INVESTIGATION). "
            f"request_id={request_id} | firm_id={firm_id} | "
            f"chargeback_id={chargeback_id} | amount={amount}"
        )
        
        return result
    
    async def find_by_chargeback_id(
        self,
        firm_id: str,
        chargeback_id: str,
        request_id: str
    ) -> Optional[Dict[str, Any]]:
        """
        Find chargeback by chargeback ID.
        
        Args:
            firm_id: Organization ID
            chargeback_id: Chargeback ID
            request_id: Request trace ID
        
        Returns:
            Chargeback document or None
        """
        query = TenantAwareQuery.add_firm_filter(
            {"chargeback_id": chargeback_id},
            firm_id
        )
        return await self.collection.find_one(query)
    
    async def update_status(
        self,
        firm_id: str,
        chargeback_id: str,
        status: str,
        evidence: Dict[str, Any],
        request_id: str
    ) -> bool:
        """
        Update chargeback status and evidence.
        
        Args:
            firm_id: Organization ID
            chargeback_id: Chargeback ID
            status: New status
            evidence: Evidence/response data
            request_id: Request trace ID
        
        Returns:
            True if updated, False otherwise
        """
        query = TenantAwareQuery.add_firm_filter(
            {"chargeback_id": chargeback_id},
            firm_id
        )
        
        result = await self.collection.update_one(
            query,
            {
                "$set": {
                    "status": status,
                    "evidence": evidence,
                    "updated_at": datetime.utcnow(),
                }
            }
        )
        
        if result.modified_count > 0:
            self.logger.info(
                f"[CHARGEBACK] Status updated. "
                f"request_id={request_id} | firm_id={firm_id} | "
                f"chargeback_id={chargeback_id} | status={status}"
            )

        return result.modified_count > 0

    async def create_chargeback_from_webhook(
        self,
        firm_id: str,
        chargeback_data: Dict[str, Any],
        request_id: str
    ) -> Dict[str, Any]:
        """
        Create chargeback from webhook event data.

        Used by webhooks to create chargeback directly from event payloads.

        Args:
            firm_id: Organization ID
            chargeback_data: Chargeback data from webhook (chargeback_id, payment_id, amount, etc.)
            request_id: Request trace ID

        Returns:
            Created chargeback document
        """
        doc = {
            **chargeback_data,
            "created_at": datetime.utcnow(),
        }

        result = await self.create(firm_id, doc, request_id)

        self.logger.critical(
            f"[CHARGEBACK] CREATE_FROM_WEBHOOK (ALERT) "
            f"firm_id={firm_id} chargeback_id={chargeback_data.get('chargeback_id')} request_id={request_id}"
        )

        return result
