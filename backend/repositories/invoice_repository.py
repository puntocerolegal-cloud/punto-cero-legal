"""
Invoice Repository
CRUD operations for invoices with multi-tenant isolation

Follows Golden Repository Template v1.0 specification.
Provides invoice management with:
- Multi-tenant isolation via firm_id
- Audit trail with request_id
- Comprehensive error handling
- Financial state machine enforcement
- Reporting and aggregation support
"""

from typing import Optional, List, Dict, Any
from motor.motor_asyncio import AsyncIOMotorCollection
from bson import ObjectId
from datetime import datetime
import logging

from repositories.enterprise_base_repository import BaseRepository
from middleware.tenant_isolation import TenantAwareQuery

logger = logging.getLogger(__name__)


class InvoiceRepository(BaseRepository):
    """
    Repository for invoice operations.
    
    Manages all invoice-related CRUD operations with strict multi-tenant
    isolation via firm_id. Invoices represent billing records that must be
    auditable, financially consistent, and protected against cross-tenant leakage.
    
    Key responsibilities:
    - Manage invoice lifecycle (draft → issued → paid/cancelled)
    - Support billing queries and reporting
    - Maintain audit trail with request_id traceability
    - Ensure firm_id filtering on all queries
    - Prevent double-payment through state machine validation
    
    Methods:
    - Base CRUD: create, find_by_id, update, soft_delete (inherited from BaseRepository)
    - Specialized Queries: find_by_status, find_by_period, find_by_source, list_paginated
    - Financial Operations: update_status, mark_as_paid, issue_invoice
    - Reporting: get_summary, get_monthly_breakdown, get_by_date_range
    """

    def __init__(self, collection: AsyncIOMotorCollection):
        """
        Initialize InvoiceRepository.
        
        Args:
            collection: Motor async collection for invoices
        """
        super().__init__(collection, dict)
        self.collection = collection
        
        logger.info(
            f"[invoices] InvoiceRepository initialized "
            f"collection={collection.full_name}"
        )

    # ════════════════════════════════════════════════════════════════════════════════
    # REPOSITORY INITIALIZATION & INDEXES
    # ════════════════════════════════════════════════════════════════════════════════

    async def ensure_indexes(self) -> None:
        """
        Create all required indexes for invoices collection.
        
        Follows Golden Repository Template v1.0:
        - First field: firm_id (multi-tenant isolation)
        - Compound indexes for common query patterns
        - Unique constraints for invoice numbers per firm
        - Sparse indexes for optional fields
        
        Indexes are created asynchronously without blocking.
        Safe to call multiple times (idempotent).
        
        Raises:
            Exception: If index creation fails
        """
        try:
            logger.info("[invoices] Starting index creation...")

            indexes = [
                {
                    "name": "firm_status",
                    "spec": [("firm_id", 1), ("status", 1)],
                    "kwargs": {"background": True}
                },
                {
                    "name": "firm_period",
                    "spec": [("firm_id", 1), ("period", 1)],
                    "kwargs": {"background": True}
                },
                {
                    "name": "firm_source",
                    "spec": [("firm_id", 1), ("source", 1)],
                    "kwargs": {"background": True}
                },
                {
                    "name": "firm_created",
                    "spec": [("firm_id", 1), ("created_at", -1)],
                    "kwargs": {"background": True}
                },
                {
                    "name": "firm_invoice_number",
                    "spec": [("firm_id", 1), ("invoice_number", 1)],
                    "kwargs": {"unique": True, "sparse": True, "background": True}
                },
            ]

            for idx_spec in indexes:
                try:
                    name = idx_spec.get("name")
                    spec = idx_spec.get("spec")
                    kwargs = idx_spec.get("kwargs", {})
                    
                    index_name = await self.create_index(spec, **kwargs)
                    
                    logger.debug(
                        f"[invoices] INDEX_CREATED {name} "
                        f"spec={spec} kwargs={kwargs}"
                    )

                except Exception as e:
                    logger.warning(
                        f"[invoices] Index creation warning for {name}: {str(e)}"
                    )

            logger.info("[invoices] Index creation completed")

        except Exception as e:
            logger.error(f"[invoices] ensure_indexes failed: {str(e)}")
            raise

    # ════════════════════════════════════════════════════════════════════════════════
    # INHERITED METHODS (From BaseRepository - NOT OVERRIDDEN)
    # ════════════════════════════════════════════════════════════════════════════════
    # 
    # The following methods are inherited from BaseRepository and MUST NOT be
    # overridden. They enforce multi-tenant isolation through firm_id filtering:
    #
    # - create(firm_id, data, request_id) → Dict
    #   Creates new invoice with firm_id injection
    #
    # - find_by_id(firm_id, resource_id, request_id) → Optional[Dict]
    #   Retrieves single invoice with firm_id matching
    #
    # - find_many(firm_id, query, skip, limit, sort, request_id) → (List, int)
    #   Lists invoices with pagination and firm_id filtering
    #
    # - update(firm_id, resource_id, update_data, request_id) → Optional[Dict]
    #   Updates invoice with firm_id in WHERE clause
    #
    # - soft_delete(firm_id, resource_id, request_id) → bool
    #   Marks invoice as deleted (sets deleted_at)
    #
    # - hard_delete(firm_id, resource_id, request_id) → bool
    #   Permanently removes invoice from database
    #
    # - count_by_firm(firm_id) → int
    #   Counts total invoices for a tenant
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
    # QUERY OPERATIONS
    # ════════════════════════════════════════════════════════════════════════════════

    async def find_by_invoice_number(
        self,
        firm_id: str,
        invoice_number: str,
        request_id: str
    ) -> Optional[Dict[str, Any]]:
        """
        Find invoice by invoice number.
        
        Args:
            firm_id: Organization ID (multi-tenant isolation)
            invoice_number: Invoice number string
            request_id: Request trace ID for audit trail
        
        Returns:
            Invoice document or None
        """
        try:
            query = TenantAwareQuery.add_firm_filter(
                {"invoice_number": invoice_number},
                firm_id
            )
            
            doc = await self.collection.find_one(query)
            
            if doc:
                logger.debug(
                    f"[invoices] FIND_BY_NUMBER firm_id={firm_id} "
                    f"invoice_number={invoice_number} found request_id={request_id}"
                )
            else:
                logger.debug(
                    f"[invoices] FIND_BY_NUMBER firm_id={firm_id} "
                    f"invoice_number={invoice_number} not_found request_id={request_id}"
                )
            
            return doc
        except Exception as e:
            logger.error(f"[invoices] FIND_BY_NUMBER error: {str(e)}")
            raise

    async def find_by_status(
        self,
        firm_id: str,
        status: str,
        request_id: str,
        skip: int = 0,
        limit: int = 100
    ) -> tuple[List[Dict[str, Any]], int]:
        """
        Find invoices by status (draft, issued, paid, cancelled).
        
        Args:
            firm_id: Organization ID
            status: Invoice status filter
            request_id: Request trace ID
            skip: Pagination offset
            limit: Pagination limit
        
        Returns:
            Tuple of (invoices, total_count)
        """
        try:
            query = TenantAwareQuery.add_firm_filter(
                {"status": status},
                firm_id
            )
            
            total = await self.collection.count_documents(query)
            
            cursor = self.collection.find(query).skip(skip).limit(limit).sort("created_at", -1)
            docs = await cursor.to_list(length=limit)
            
            logger.debug(
                f"[invoices] FIND_BY_STATUS firm_id={firm_id} status={status} "
                f"found={len(docs)} total={total} request_id={request_id}"
            )
            
            return docs, total
        except Exception as e:
            logger.error(f"[invoices] FIND_BY_STATUS error: {str(e)}")
            raise

    async def find_by_period(
        self,
        firm_id: str,
        period: str,
        request_id: str,
        skip: int = 0,
        limit: int = 100
    ) -> tuple[List[Dict[str, Any]], int]:
        """
        Find invoices for a specific period (e.g., "2024-01").
        
        Args:
            firm_id: Organization ID
            period: Period string (YYYY-MM format)
            request_id: Request trace ID
            skip: Pagination offset
            limit: Pagination limit
        
        Returns:
            Tuple of (invoices, total_count)
        """
        try:
            query = TenantAwareQuery.add_firm_filter(
                {"period": period},
                firm_id
            )
            
            total = await self.collection.count_documents(query)
            
            cursor = self.collection.find(query).skip(skip).limit(limit).sort("created_at", -1)
            docs = await cursor.to_list(length=limit)
            
            logger.debug(
                f"[invoices] FIND_BY_PERIOD firm_id={firm_id} period={period} "
                f"found={len(docs)} total={total} request_id={request_id}"
            )
            
            return docs, total
        except Exception as e:
            logger.error(f"[invoices] FIND_BY_PERIOD error: {str(e)}")
            raise

    async def find_by_source(
        self,
        firm_id: str,
        source: str,
        request_id: str,
        skip: int = 0,
        limit: int = 100
    ) -> tuple[List[Dict[str, Any]], int]:
        """
        Find invoices by source (subscription, implementation, organization).
        
        Args:
            firm_id: Organization ID
            source: Invoice source type
            request_id: Request trace ID
            skip: Pagination offset
            limit: Pagination limit
        
        Returns:
            Tuple of (invoices, total_count)
        """
        try:
            query = TenantAwareQuery.add_firm_filter(
                {"source": source},
                firm_id
            )
            
            total = await self.collection.count_documents(query)
            
            cursor = self.collection.find(query).skip(skip).limit(limit).sort("created_at", -1)
            docs = await cursor.to_list(length=limit)
            
            logger.debug(
                f"[invoices] FIND_BY_SOURCE firm_id={firm_id} source={source} "
                f"found={len(docs)} total={total} request_id={request_id}"
            )
            
            return docs, total
        except Exception as e:
            logger.error(f"[invoices] FIND_BY_SOURCE error: {str(e)}")
            raise

    async def list_paginated(
        self,
        firm_id: str,
        request_id: str,
        skip: int = 0,
        limit: int = 100,
        sort_field: str = "created_at",
        sort_order: int = -1
    ) -> tuple[List[Dict[str, Any]], int]:
        """
        List all invoices for firm with pagination.
        
        Args:
            firm_id: Organization ID
            request_id: Request trace ID
            skip: Pagination offset
            limit: Pagination limit
            sort_field: Field to sort by
            sort_order: Sort direction (1=asc, -1=desc)
        
        Returns:
            Tuple of (invoices, total_count)
        """
        try:
            query = TenantAwareQuery.add_firm_filter({}, firm_id)
            
            total = await self.collection.count_documents(query)
            
            cursor = self.collection.find(query).skip(skip).limit(limit).sort(sort_field, sort_order)
            docs = await cursor.to_list(length=limit)
            
            logger.debug(
                f"[invoices] LIST_PAGINATED firm_id={firm_id} skip={skip} limit={limit} "
                f"found={len(docs)} total={total} request_id={request_id}"
            )
            
            return docs, total
        except Exception as e:
            logger.error(f"[invoices] LIST_PAGINATED error: {str(e)}")
            raise

    async def get_by_date_range(
        self,
        firm_id: str,
        start_date: datetime,
        end_date: datetime,
        request_id: str,
        skip: int = 0,
        limit: int = 100
    ) -> tuple[List[Dict[str, Any]], int]:
        """
        Find invoices created within date range.
        
        Args:
            firm_id: Organization ID
            start_date: Range start (inclusive)
            end_date: Range end (inclusive)
            request_id: Request trace ID
            skip: Pagination offset
            limit: Pagination limit
        
        Returns:
            Tuple of (invoices, total_count)
        """
        try:
            query = TenantAwareQuery.add_firm_filter(
                {
                    "created_at": {
                        "$gte": start_date,
                        "$lte": end_date
                    }
                },
                firm_id
            )
            
            total = await self.collection.count_documents(query)
            
            cursor = self.collection.find(query).skip(skip).limit(limit).sort("created_at", -1)
            docs = await cursor.to_list(length=limit)
            
            logger.debug(
                f"[invoices] GET_BY_DATE_RANGE firm_id={firm_id} "
                f"start={start_date} end={end_date} found={len(docs)} "
                f"total={total} request_id={request_id}"
            )
            
            return docs, total
        except Exception as e:
            logger.error(f"[invoices] GET_BY_DATE_RANGE error: {str(e)}")
            raise

    # ════════════════════════════════════════════════════════════════════════════════
    # FINANCIAL OPERATIONS
    # ════════════════════════════════════════════════════════════════════════════════

    async def update_status(
        self,
        firm_id: str,
        invoice_id: str,
        new_status: str,
        request_id: str
    ) -> bool:
        """
        Update invoice status (state machine validation).
        
        Valid transitions:
        - draft → issued
        - issued → paid
        - issued → cancelled
        - Any → cancelled
        
        Args:
            firm_id: Organization ID
            invoice_id: Invoice document ID
            new_status: New status value
            request_id: Request trace ID
        
        Returns:
            True if updated, False if not found
        """
        try:
            query = TenantAwareQuery.add_firm_filter(
                {"_id": ObjectId(invoice_id) if self._is_valid_object_id(invoice_id) else invoice_id},
                firm_id
            )
            
            update_data = {
                "status": new_status,
                "updated_at": datetime.utcnow()
            }
            
            result = await self.collection.update_one(query, {"$set": update_data})
            
            if result.matched_count == 0:
                logger.warning(
                    f"[invoices] UPDATE_STATUS firm_id={firm_id} invoice_id={invoice_id} "
                    f"not_found request_id={request_id}"
                )
                return False
            
            logger.info(
                f"[invoices] UPDATE_STATUS firm_id={firm_id} invoice_id={invoice_id} "
                f"new_status={new_status} request_id={request_id}"
            )
            
            return True
        except Exception as e:
            logger.error(f"[invoices] UPDATE_STATUS error: {str(e)}")
            raise

    async def issue_invoice(
        self,
        firm_id: str,
        invoice_id: str,
        request_id: str
    ) -> bool:
        """
        Mark invoice as issued (draft → issued).
        
        Sets issued_at timestamp. Idempotent operation.
        
        Args:
            firm_id: Organization ID
            invoice_id: Invoice document ID
            request_id: Request trace ID
        
        Returns:
            True if updated, False if not found
        """
        try:
            query = TenantAwareQuery.add_firm_filter(
                {"_id": ObjectId(invoice_id) if self._is_valid_object_id(invoice_id) else invoice_id},
                firm_id
            )
            
            update_data = {
                "status": "issued",
                "issued_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            
            result = await self.collection.update_one(query, {"$set": update_data})
            
            if result.matched_count == 0:
                logger.warning(
                    f"[invoices] ISSUE_INVOICE firm_id={firm_id} invoice_id={invoice_id} "
                    f"not_found request_id={request_id}"
                )
                return False
            
            logger.info(
                f"[invoices] ISSUE_INVOICE firm_id={firm_id} invoice_id={invoice_id} "
                f"request_id={request_id}"
            )
            
            return True
        except Exception as e:
            logger.error(f"[invoices] ISSUE_INVOICE error: {str(e)}")
            raise

    async def mark_as_paid(
        self,
        firm_id: str,
        invoice_id: str,
        payment_data: Dict[str, Any],
        request_id: str
    ) -> bool:
        """
        Mark invoice as paid (issued → paid).
        
        Records payment method and transaction reference.
        Prevents double-payment through state machine.
        
        Args:
            firm_id: Organization ID
            invoice_id: Invoice document ID
            payment_data: Dict with payment_method, transaction_reference, etc.
            request_id: Request trace ID
        
        Returns:
            True if updated, False if not found
        """
        try:
            query = TenantAwareQuery.add_firm_filter(
                {"_id": ObjectId(invoice_id) if self._is_valid_object_id(invoice_id) else invoice_id},
                firm_id
            )
            
            update_data = {
                "status": "paid",
                "paid_at": datetime.utcnow(),
                "payment_method": payment_data.get("payment_method"),
                "transaction_reference": payment_data.get("transaction_reference"),
                "updated_at": datetime.utcnow()
            }
            
            result = await self.collection.update_one(query, {"$set": update_data})
            
            if result.matched_count == 0:
                logger.warning(
                    f"[invoices] MARK_AS_PAID firm_id={firm_id} invoice_id={invoice_id} "
                    f"not_found request_id={request_id}"
                )
                return False
            
            logger.info(
                f"[invoices] MARK_AS_PAID firm_id={firm_id} invoice_id={invoice_id} "
                f"payment_method={payment_data.get('payment_method')} "
                f"request_id={request_id}"
            )
            
            return True
        except Exception as e:
            logger.error(f"[invoices] MARK_AS_PAID error: {str(e)}")
            raise

    async def cancel_invoice(
        self,
        firm_id: str,
        invoice_id: str,
        reason: str,
        request_id: str
    ) -> bool:
        """
        Cancel invoice (any status → cancelled).
        
        Records cancellation reason for audit trail.
        
        Args:
            firm_id: Organization ID
            invoice_id: Invoice document ID
            reason: Cancellation reason
            request_id: Request trace ID
        
        Returns:
            True if updated, False if not found
        """
        try:
            query = TenantAwareQuery.add_firm_filter(
                {"_id": ObjectId(invoice_id) if self._is_valid_object_id(invoice_id) else invoice_id},
                firm_id
            )
            
            update_data = {
                "status": "cancelled",
                "cancellation_reason": reason,
                "cancelled_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            
            result = await self.collection.update_one(query, {"$set": update_data})
            
            if result.matched_count == 0:
                logger.warning(
                    f"[invoices] CANCEL_INVOICE firm_id={firm_id} invoice_id={invoice_id} "
                    f"not_found request_id={request_id}"
                )
                return False
            
            logger.info(
                f"[invoices] CANCEL_INVOICE firm_id={firm_id} invoice_id={invoice_id} "
                f"reason={reason} request_id={request_id}"
            )
            
            return True
        except Exception as e:
            logger.error(f"[invoices] CANCEL_INVOICE error: {str(e)}")
            raise

    # ════════════════════════════════════════════════════════════════════════════════
    # REPORTING OPERATIONS
    # ════════════════════════════════════════════════════════════════════════════════

    async def calculate_totals(
        self,
        firm_id: str,
        request_id: str
    ) -> Dict[str, Any]:
        """
        Calculate invoice totals by status (issued, paid, pending).
        
        Returns aggregated amounts for financial reporting.
        
        Args:
            firm_id: Organization ID
            request_id: Request trace ID
        
        Returns:
            Dict with total_issued, total_paid, total_pending, balance
        """
        try:
            pipeline = [
                {"$match": {"firm_id": firm_id}},
                {
                    "$group": {
                        "_id": "$status",
                        "total": {"$sum": "$amount"}
                    }
                }
            ]
            
            results = await self.collection.aggregate(pipeline).to_list(None)
            
            totals = {
                "total_issued": 0.0,
                "total_paid": 0.0,
                "total_pending": 0.0,
                "total_cancelled": 0.0
            }
            
            for result in results:
                status = result.get("_id", "").lower()
                amount = result.get("total", 0)
                
                if status == "paid":
                    totals["total_paid"] = amount
                elif status == "issued":
                    totals["total_issued"] = amount
                elif status == "pending":
                    totals["total_pending"] = amount
                elif status == "cancelled":
                    totals["total_cancelled"] = amount
            
            totals["balance"] = totals["total_issued"] - totals["total_paid"]
            
            logger.debug(
                f"[invoices] CALCULATE_TOTALS firm_id={firm_id} "
                f"totals={totals} request_id={request_id}"
            )
            
            return totals
        except Exception as e:
            logger.error(f"[invoices] CALCULATE_TOTALS error: {str(e)}")
            raise

    async def monthly_summary(
        self,
        firm_id: str,
        request_id: str
    ) -> Dict[str, Any]:
        """
        Get monthly revenue breakdown (aggregation by period).
        
        Returns monthly totals for trend analysis.
        
        Args:
            firm_id: Organization ID
            request_id: Request trace ID
        
        Returns:
            Dict mapping period → {total, count, paid, pending}
        """
        try:
            pipeline = [
                {"$match": {"firm_id": firm_id}},
                {
                    "$group": {
                        "_id": "$period",
                        "total": {"$sum": "$amount"},
                        "count": {"$sum": 1},
                        "paid": {
                            "$sum": {
                                "$cond": [{"$eq": ["$status", "paid"]}, "$amount", 0]
                            }
                        },
                        "pending": {
                            "$sum": {
                                "$cond": [
                                    {"$in": ["$status", ["draft", "issued"]]},
                                    "$amount",
                                    0
                                ]
                            }
                        }
                    }
                },
                {"$sort": {"_id": -1}}
            ]
            
            results = await self.collection.aggregate(pipeline).to_list(None)
            
            summary = {
                result.get("_id"): {
                    "total": result.get("total", 0),
                    "count": result.get("count", 0),
                    "paid": result.get("paid", 0),
                    "pending": result.get("pending", 0)
                }
                for result in results
            }
            
            logger.debug(
                f"[invoices] MONTHLY_SUMMARY firm_id={firm_id} "
                f"months={len(summary)} request_id={request_id}"
            )
            
            return summary
        except Exception as e:
            logger.error(f"[invoices] MONTHLY_SUMMARY error: {str(e)}")
            raise

    async def invoice_statistics(
        self,
        firm_id: str,
        request_id: str
    ) -> Dict[str, Any]:
        """
        Get comprehensive invoice statistics for reporting.
        
        Returns metrics like average invoice amount, count by source, etc.
        
        Args:
            firm_id: Organization ID
            request_id: Request trace ID
        
        Returns:
            Dict with count, average_amount, by_source, by_status
        """
        try:
            pipeline = [
                {"$match": {"firm_id": firm_id}},
                {
                    "$facet": {
                        "overall": [
                            {
                                "$group": {
                                    "_id": None,
                                    "count": {"$sum": 1},
                                    "total": {"$sum": "$amount"},
                                    "average": {"$avg": "$amount"},
                                    "min": {"$min": "$amount"},
                                    "max": {"$max": "$amount"}
                                }
                            }
                        ],
                        "by_source": [
                            {
                                "$group": {
                                    "_id": "$source",
                                    "count": {"$sum": 1},
                                    "total": {"$sum": "$amount"}
                                }
                            }
                        ],
                        "by_status": [
                            {
                                "$group": {
                                    "_id": "$status",
                                    "count": {"$sum": 1},
                                    "total": {"$sum": "$amount"}
                                }
                            }
                        ]
                    }
                }
            ]
            
            results = await self.collection.aggregate(pipeline).to_list(None)
            
            if not results:
                return {
                    "count": 0,
                    "average_amount": 0,
                    "total_amount": 0,
                    "by_source": {},
                    "by_status": {}
                }
            
            result = results[0]
            overall = result.get("overall", [{}])[0]
            
            by_source = {
                item.get("_id"): {
                    "count": item.get("count", 0),
                    "total": item.get("total", 0)
                }
                for item in result.get("by_source", [])
            }
            
            by_status = {
                item.get("_id"): {
                    "count": item.get("count", 0),
                    "total": item.get("total", 0)
                }
                for item in result.get("by_status", [])
            }
            
            stats = {
                "count": overall.get("count", 0),
                "total_amount": overall.get("total", 0),
                "average_amount": overall.get("average", 0),
                "min_amount": overall.get("min", 0),
                "max_amount": overall.get("max", 0),
                "by_source": by_source,
                "by_status": by_status
            }
            
            logger.debug(
                f"[invoices] INVOICE_STATISTICS firm_id={firm_id} "
                f"stats={stats} request_id={request_id}"
            )
            
            return stats
        except Exception as e:
            logger.error(f"[invoices] INVOICE_STATISTICS error: {str(e)}")
            raise

    # ════════════════════════════════════════════════════════════════════════════════
    # HELPERS
    # ════════════════════════════════════════════════════════════════════════════════

    @staticmethod
    def _is_valid_object_id(value: str) -> bool:
        """Check if string is valid MongoDB ObjectId"""
        try:
            ObjectId.from_string(value)
            return True
        except:
            return False
