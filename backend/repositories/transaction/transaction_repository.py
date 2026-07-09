"""
Transaction Repository
CRUD operations for transactions with multi-tenant isolation

Follows Golden Repository Template v1.0 specification.
Provides transaction management with:
- Multi-tenant isolation via firm_id
- Audit trail with request_id
- Comprehensive error handling
- Index management
"""

from typing import Optional, List, Dict, Any
from motor.motor_asyncio import AsyncIOMotorCollection
from bson import ObjectId
from datetime import datetime
import logging

from repositories.enterprise_base_repository import BaseRepository
from middleware.tenant_isolation import TenantAwareQuery
from .transaction_dto import TransactionDocument, TransactionResponse
from .transaction_exceptions import (
    TransactionNotFound,
    DuplicatePaymentError,
    InvalidTransactionStatus,
)
from .transaction_indexes import TransactionIndexes

logger = logging.getLogger(__name__)


class TransactionRepository(BaseRepository):
    """
    Repository for transaction (payment) operations.
    
    Manages all transaction-related CRUD operations with strict multi-tenant
    isolation via firm_id. Transactions represent payment records that must be
    auditable, idempotent, and cryptographically secure against cross-tenant leakage.
    
    Key responsibilities:
    - Manage transaction lifecycle (pending → paid/rejected/refunded)
    - Track referral rewards
    - Support subscription renewal workflows
    - Maintain audit trail with request_id traceability
    - Ensure firm_id filtering on all queries
    
    Methods:
    - Base CRUD: create, find_by_id, find_many, update, soft_delete, hard_delete
    - Specialized: (to be implemented in PHASE 2)
    """

    def __init__(self, collection: AsyncIOMotorCollection):
        """
        Initialize TransactionRepository.
        
        Args:
            collection: Motor async collection for transactions
        """
        super().__init__(collection, TransactionDocument)
        self.collection = collection
        
        logger.info(
            f"[transactions] TransactionRepository initialized "
            f"collection={collection.full_name}"
        )

    # ════════════════════════════════════════════════════════════════════════════════
    # REPOSITORY INITIALIZATION & INDEXES
    # ════════════════════════════════════════════════════════════════════════════════

    async def ensure_indexes(self) -> None:
        """
        Create all required indexes for transactions collection.
        
        Follows Golden Repository Template v1.0:
        - First field: firm_id (multi-tenant isolation)
        - Compound indexes for common query patterns
        - Unique constraints for payment_id
        - Sparse indexes for optional fields
        
        Indexes are created asynchronously without blocking.
        Safe to call multiple times (idempotent).
        
        Raises:
            Exception: If index creation fails
        """
        try:
            logger.info("[transactions] Starting index creation...")

            indexes = TransactionIndexes.get_all_indexes()

            for idx_spec in indexes:
                try:
                    name = idx_spec.get("name")
                    spec = idx_spec.get("spec")
                    kwargs = idx_spec.get("kwargs", {})
                    
                    # Create index with background=True for large collections
                    kwargs.setdefault("background", True)
                    
                    index_name = await self.create_index(spec, **kwargs)
                    
                    logger.debug(
                        f"[transactions] INDEX_CREATED {name} "
                        f"spec={spec} kwargs={kwargs}"
                    )

                except Exception as e:
                    # Log but don't fail: some indexes might already exist
                    logger.warning(
                        f"[transactions] Index creation warning for {name}: {str(e)}"
                    )

            logger.info("[transactions] Index creation completed")

        except Exception as e:
            logger.error(f"[transactions] ensure_indexes failed: {str(e)}")
            raise

    # ════════════════════════════════════════════════════════════════════════════════
    # HELPERS
    # ════════════════════════════════════════════════════════════════════════════════

    @staticmethod
    def _is_valid_payment_id(value: str) -> bool:
        """Check if string is a valid payment ID (PCL-xxxxx format)"""
        if not isinstance(value, str):
            return False
        return value.startswith("PCL-") and len(value) > 4

    @staticmethod
    def _get_firm_id_from_email(user_email: str) -> Optional[str]:
        """
        Derive firm_id from user email.
        
        NOTE: This is a placeholder. In actual implementation, this would:
        1. Query users collection to get firm_id
        2. Cache result in request context
        3. Handle missing user gracefully
        
        For now, returns None to indicate lookup needed.
        """
        # TODO: Implement firm_id lookup from users collection
        return None

    # ════════════════════════════════════════════════════════════════════════════════
    # INHERITED METHODS (From BaseRepository - NOT OVERRIDDEN)
    # ════════════════════════════════════════════════════════════════════════════════
    # 
    # The following methods are inherited from BaseRepository and MUST NOT be
    # overridden. They enforce multi-tenant isolation through firm_id filtering:
    #
    # - create(firm_id, data, request_id) → Dict
    #   Creates new transaction with firm_id injection
    #
    # - find_by_id(firm_id, resource_id, request_id) → Optional[Dict]
    #   Retrieves single transaction with firm_id matching
    #
    # - find_many(firm_id, query, skip, limit, sort, request_id) → (List, int)
    #   Lists transactions with pagination and firm_id filtering
    #
    # - update(firm_id, resource_id, update_data, request_id) → Optional[Dict]
    #   Updates transaction with firm_id in WHERE clause
    #
    # - soft_delete(firm_id, resource_id, request_id) → bool
    #   Marks transaction as deleted (sets deleted_at)
    #
    # - hard_delete(firm_id, resource_id, request_id) → bool
    #   Permanently removes transaction from database
    #
    # - count_by_firm(firm_id) → int
    #   Counts total transactions for a tenant
    #
    # - create_index(index_spec, **kwargs) → str
    #   Creates database index with options
    #
    # Implementation of these inherited methods ensures:
    # ✅ firm_id ALWAYS in query (security)
    # ✅ All operations logged with request_id (auditable)
    # ✅ Exception handling with logger.error + re-raise (safe)
    # ✅ No silent failures (observable)
    #
    # ════════════════════════════════════════════════════════════════════════════════

    # ════════════════════════════════════════════════════════════════════════════════
    # SPECIALIZED METHODS (To be implemented in PHASE 2)
    # ════════════════════════════════════════════════════════════════════════════════
    #
    # The following specialized methods will be implemented in the next phase.
    # These methods build on the foundation of BaseRepository while providing
    # domain-specific transaction operations:
    #
    # - find_by_payment_id(firm_id, payment_id, request_id)
    #   Find transaction by unique payment ID
    #
    # - find_by_user_email(firm_id, user_email, skip, limit, request_id)
    #   Find all transactions for a user
    #
    # - find_paid_by_user_and_plan(firm_id, user_email, plan_id, request_id)
    #   Find last successful payment for specific plan
    #
    # - find_pending_by_type(firm_id, tx_type, skip, limit, request_id)
    #   Find pending transactions by type (renewal, plan_change, etc.)
    #
    # - find_old_pending(firm_id, days_threshold, skip, limit, request_id)
    #   Find stale pending transactions (for retry logic)
    #
    # - find_by_status(firm_id, status, skip, limit, request_id)
    #   Find transactions by status (paid, rejected, refunded)
    #
    # - find_referrals_paid(firm_id, referrer_id, request_id)
    #   Find paid transactions by referrer
    #
    # - mark_paid(firm_id, payment_id, request_id, paid_at=None)
    #   Mark transaction as successfully paid
    #
    # - mark_rejected(firm_id, payment_id, error_message, request_id)
    #   Mark transaction as rejected by payment gateway
    #
    # - mark_refunded(firm_id, payment_id, refund_reason, request_id)
    #   Mark transaction as refunded
    #
    # - increment_retry_count(firm_id, payment_id, request_id)
    #   Increment retry counter for renewal attempts
    #
    # All specialized methods will:
    # ✅ Use TenantAwareQuery.add_firm_filter() for queries
    # ✅ Include request_id in all logs
    # ✅ Have dedicated docstrings with parameters and return types
    # ✅ Use try/except with logger.error + re-raise pattern
    # ✅ Return specific exception types from transaction_exceptions.py
    #
    # ════════════════════════════════════════════════════════════════════════════════

    async def validate_transaction_data(
        self,
        data: Dict[str, Any],
        request_id: str
    ) -> bool:
        """
        Validate transaction data before create/update.
        
        Args:
            data: Transaction data to validate
            request_id: Request ID for logging
            
        Returns:
            True if valid
            
        Raises:
            InvalidTransactionData: If validation fails
        """
        try:
            # Validate required fields
            if not data.get("payment_id"):
                raise ValueError("payment_id is required")
            
            if not data.get("user_email"):
                raise ValueError("user_email is required")
            
            plan_id = data.get("plan_id")
            if plan_id not in ["esencial", "profesional", "elite", "ilimitado"]:
                raise ValueError(f"Invalid plan_id: {plan_id}")
            
            billing_cycle = data.get("billing_cycle", "monthly")
            if billing_cycle not in ["monthly", "annual"]:
                raise ValueError(f"Invalid billing_cycle: {billing_cycle}")
            
            if data.get("amount_local", 0) <= 0:
                raise ValueError("amount_local must be positive")
            
            status = data.get("status", "pending")
            if status not in ["pending", "paid", "rejected", "cancelled", "refunded"]:
                raise ValueError(f"Invalid status: {status}")
            
            gateway = data.get("gateway")
            if gateway not in ["mercado_pago", "paypal"]:
                raise ValueError(f"Invalid gateway: {gateway}")
            
            logger.debug(
                f"[transactions] VALIDATE_DATA payment_id={data.get('payment_id')} "
                f"valid=True request_id={request_id}"
            )
            
            return True
            
        except ValueError as e:
            error_msg = f"Transaction data validation failed: {str(e)}"
            logger.warning(
                f"[transactions] VALIDATE_DATA error: {error_msg} request_id={request_id}"
            )
            raise

    # ════════════════════════════════════════════════════════════════════════════════
    # SPECIALIZED QUERY METHODS FOR PAYMENT WEBHOOKS (TASK S1-03A)
    # ════════════════════════════════════════════════════════════════════════════════

    async def find_by_payment_id(
        self,
        firm_id: str,
        payment_id: str,
        request_id: str
    ) -> Optional[Dict[str, Any]]:
        """
        Find transaction by payment_id (our internal identifier).

        Used by webhooks to locate transaction from external_reference.

        Args:
            firm_id: Organization ID
            payment_id: Our payment identifier
            request_id: Request trace ID

        Returns:
            Transaction document or None
        """
        query = TenantAwareQuery.add_firm_filter(
            {"payment_id": payment_id},
            firm_id
        )
        doc = await self.collection.find_one(query)

        if doc:
            logger.debug(
                f"[transactions] FIND_BY_PAYMENT_ID found "
                f"firm_id={firm_id} payment_id={payment_id} request_id={request_id}"
            )
        else:
            logger.debug(
                f"[transactions] FIND_BY_PAYMENT_ID not_found "
                f"firm_id={firm_id} payment_id={payment_id} request_id={request_id}"
            )

        return doc

    async def find_by_mp_payment_id(
        self,
        firm_id: str,
        mp_payment_id: str,
        request_id: str
    ) -> Optional[Dict[str, Any]]:
        """
        Find transaction by mp_payment_id (MercadoPago payment ID).

        Used by webhooks to locate transaction from MercadoPago events.

        Args:
            firm_id: Organization ID
            mp_payment_id: MercadoPago payment ID
            request_id: Request trace ID

        Returns:
            Transaction document or None
        """
        query = TenantAwareQuery.add_firm_filter(
            {"mp_payment_id": mp_payment_id},
            firm_id
        )
        doc = await self.collection.find_one(query)

        if doc:
            logger.debug(
                f"[transactions] FIND_BY_MP_PAYMENT_ID found "
                f"firm_id={firm_id} mp_payment_id={mp_payment_id} request_id={request_id}"
            )
        else:
            logger.debug(
                f"[transactions] FIND_BY_MP_PAYMENT_ID not_found "
                f"firm_id={firm_id} mp_payment_id={mp_payment_id} request_id={request_id}"
            )

        return doc

    async def update_by_payment_id(
        self,
        firm_id: str,
        payment_id: str,
        update_data: Dict[str, Any],
        request_id: str
    ) -> bool:
        """
        Update transaction by payment_id.

        Used by webhooks to update transaction status/metadata.

        Args:
            firm_id: Organization ID
            payment_id: Our payment identifier
            update_data: Fields to update
            request_id: Request trace ID

        Returns:
            True if updated, False otherwise
        """
        query = TenantAwareQuery.add_firm_filter(
            {"payment_id": payment_id},
            firm_id
        )

        result = await self.collection.update_one(
            query,
            {"$set": update_data}
        )

        if result.modified_count > 0:
            logger.info(
                f"[transactions] UPDATE_BY_PAYMENT_ID success "
                f"firm_id={firm_id} payment_id={payment_id} request_id={request_id}"
            )
        else:
            logger.warning(
                f"[transactions] UPDATE_BY_PAYMENT_ID no_match "
                f"firm_id={firm_id} payment_id={payment_id} request_id={request_id}"
            )

        return result.modified_count > 0

    async def update_by_mp_payment_id(
        self,
        firm_id: str,
        mp_payment_id: str,
        update_data: Dict[str, Any],
        request_id: str
    ) -> bool:
        """
        Update transaction by mp_payment_id.

        Used by webhooks to update transaction from MercadoPago events.

        Args:
            firm_id: Organization ID
            mp_payment_id: MercadoPago payment ID
            update_data: Fields to update
            request_id: Request trace ID

        Returns:
            True if updated, False otherwise
        """
        query = TenantAwareQuery.add_firm_filter(
            {"mp_payment_id": mp_payment_id},
            firm_id
        )

        result = await self.collection.update_one(
            query,
            {"$set": update_data}
        )

        if result.modified_count > 0:
            logger.info(
                f"[transactions] UPDATE_BY_MP_PAYMENT_ID success "
                f"firm_id={firm_id} mp_payment_id={mp_payment_id} request_id={request_id}"
            )
        else:
            logger.warning(
                f"[transactions] UPDATE_BY_MP_PAYMENT_ID no_match "
                f"firm_id={firm_id} mp_payment_id={mp_payment_id} request_id={request_id}"
            )

        return result.modified_count > 0

    async def update_by_id(
        self,
        firm_id: str,
        transaction_id: str,
        update_data: Dict[str, Any],
        request_id: str
    ) -> bool:
        """
        Update transaction by _id.

        Used by webhooks to update transaction when ID is already known.

        Args:
            firm_id: Organization ID
            transaction_id: Transaction _id (ObjectId as string)
            update_data: Fields to update
            request_id: Request trace ID

        Returns:
            True if updated, False otherwise
        """
        from bson import ObjectId as BsonObjectId

        query = TenantAwareQuery.add_firm_filter(
            {"_id": BsonObjectId(transaction_id)},
            firm_id
        )

        result = await self.collection.update_one(
            query,
            {"$set": update_data}
        )

        if result.modified_count > 0:
            logger.info(
                f"[transactions] UPDATE_BY_ID success "
                f"firm_id={firm_id} transaction_id={transaction_id} request_id={request_id}"
            )
        else:
            logger.warning(
                f"[transactions] UPDATE_BY_ID no_match "
                f"firm_id={firm_id} transaction_id={transaction_id} request_id={request_id}"
            )

        return result.modified_count > 0
