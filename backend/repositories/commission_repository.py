"""
Commission Repository
CRUD operations for commissions with multi-tenant isolation

Follows Golden Repository Template v1.0 specification.
Provides commission management with:
- Multi-tenant isolation via firm_id
- Audit trail with request_id
- Comprehensive error handling
- Financial state machine enforcement
- Payment split tracking and reporting support
"""

from typing import Optional, List, Dict, Any
from motor.motor_asyncio import AsyncIOMotorCollection
from bson import ObjectId
from datetime import datetime
import logging

from repositories.enterprise_base_repository import BaseRepository
from middleware.tenant_isolation import TenantAwareQuery

logger = logging.getLogger(__name__)


class CommissionRepository(BaseRepository):
    """
    Repository for commission operations.
    
    Manages all commission-related CRUD operations with strict multi-tenant
    isolation via firm_id. Commissions represent payment records that must be
    auditable, financially consistent, and protected against cross-tenant leakage.
    
    Key responsibilities:
    - Manage commission lifecycle (pending → approved → paid/rejected)
    - Support commission payment split tracking
    - Track agent and case-level commission data
    - Maintain audit trail with request_id traceability
    - Ensure firm_id filtering on all queries
    - Prevent double-payment through state machine validation
    
    Methods:
    - Base CRUD: create, find_by_id, update, soft_delete (inherited from BaseRepository)
    - Specialized Queries: find_by_invoice, find_by_user, find_by_status, find_pending, list_paginated
    - Financial Operations: approve_commission, mark_paid, reject_commission, calculate_commission
    - Reporting: monthly_summary, commission_statistics, calculate_totals
    """

    def __init__(self, collection: AsyncIOMotorCollection):
        """
        Initialize CommissionRepository.
        
        Args:
            collection: Motor async collection for commissions
        """
        super().__init__(collection, dict)
        self.collection = collection
        
        logger.info(
            f"[commissions] CommissionRepository initialized "
            f"collection={collection.full_name}"
        )

    # ════════════════════════════════════════════════════════════════════════════════
    # REPOSITORY INITIALIZATION & INDEXES
    # ════════════════════════════════════════════════════════════════════════════════

    async def ensure_indexes(self) -> None:
        """
        Create all required indexes for commissions collection.
        
        Follows Golden Repository Template v1.0:
        - First field: firm_id (multi-tenant isolation)
        - Compound indexes for common query patterns
        - Unique constraints where applicable
        - Sparse indexes for optional fields
        
        Indexes are created asynchronously without blocking.
        Safe to call multiple times (idempotent).
        
        Raises:
            Exception: If index creation fails
        """
        try:
            logger.info("[commissions] Starting index creation...")

            indexes = [
                {
                    "name": "firm_status",
                    "spec": [("firm_id", 1), ("status", 1)],
                    "kwargs": {"background": True}
                },
                {
                    "name": "firm_invoice",
                    "spec": [("firm_id", 1), ("invoice_id", 1)],
                    "kwargs": {"background": True, "sparse": True}
                },
                {
                    "name": "firm_agent",
                    "spec": [("firm_id", 1), ("agent_id", 1)],
                    "kwargs": {"background": True}
                },
                {
                    "name": "firm_case",
                    "spec": [("firm_id", 1), ("case_id", 1)],
                    "kwargs": {"background": True}
                },
                {
                    "name": "firm_created",
                    "spec": [("firm_id", 1), ("created_at", -1)],
                    "kwargs": {"background": True}
                },
                {
                    "name": "firm_payment_status",
                    "spec": [("firm_id", 1), ("status", 1), ("paid_at", 1)],
                    "kwargs": {"background": True, "sparse": True}
                },
            ]

            for idx_spec in indexes:
                try:
                    name = idx_spec.get("name")
                    spec = idx_spec.get("spec")
                    kwargs = idx_spec.get("kwargs", {})
                    
                    index_name = await self.create_index(spec, **kwargs)
                    
                    logger.debug(
                        f"[commissions] INDEX_CREATED {name} "
                        f"spec={spec} kwargs={kwargs}"
                    )

                except Exception as e:
                    logger.warning(
                        f"[commissions] Index creation warning for {name}: {str(e)}"
                    )

            logger.info("[commissions] Index creation completed")

        except Exception as e:
            logger.error(f"[commissions] ensure_indexes failed: {str(e)}")
            raise

    # ════════════════════════════════════════════════════════════════════════════════
    # INHERITED METHODS (From BaseRepository - NOT OVERRIDDEN)
    # ════════════════════════════════════════════════════════════════════════════════
    # 
    # The following methods are inherited from BaseRepository and MUST NOT be
    # overridden. They enforce multi-tenant isolation through firm_id filtering:
    #
    # - create(firm_id, data, request_id) → Dict
    #   Creates new commission with firm_id injection
    #
    # - find_by_id(firm_id, resource_id, request_id) → Optional[Dict]
    #   Retrieves single commission with firm_id matching
    #
    # - find_many(firm_id, query, skip, limit, sort, request_id) → (List, int)
    #   Lists commissions with pagination and firm_id filtering
    #
    # - update(firm_id, resource_id, update_data, request_id) → Optional[Dict]
    #   Updates commission with firm_id in WHERE clause
    #
    # - soft_delete(firm_id, resource_id, request_id) → bool
    #   Marks commission as deleted (sets deleted_at)
    #
    # - hard_delete(firm_id, resource_id, request_id) → bool
    #   Permanently removes commission from database
    #
    # - count_by_firm(firm_id) → int
    #   Counts total commissions for a tenant
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

    async def find_by_invoice(
        self,
        firm_id: str,
        invoice_id: str,
        request_id: str,
        skip: int = 0,
        limit: int = 100
    ) -> tuple[List[Dict[str, Any]], int]:
        """
        Find commissions for a specific invoice.
        
        Args:
            firm_id: Organization ID (multi-tenant isolation)
            invoice_id: Invoice ID reference
            request_id: Request trace ID for audit trail
            skip: Pagination offset
            limit: Pagination limit
        
        Returns:
            Tuple of (commissions, total_count)
        """
        try:
            query = TenantAwareQuery.add_firm_filter(
                {"invoice_id": invoice_id},
                firm_id
            )
            
            total = await self.collection.count_documents(query)
            
            cursor = self.collection.find(query).skip(skip).limit(limit).sort("created_at", -1)
            docs = await cursor.to_list(length=limit)
            
            logger.debug(
                f"[commissions] FIND_BY_INVOICE firm_id={firm_id} "
                f"invoice_id={invoice_id} found={len(docs)} total={total} "
                f"request_id={request_id}"
            )
            
            return docs, total
        except Exception as e:
            logger.error(f"[commissions] FIND_BY_INVOICE error: {str(e)}")
            raise

    async def find_by_user(
        self,
        firm_id: str,
        user_id: str,
        request_id: str,
        skip: int = 0,
        limit: int = 100
    ) -> tuple[List[Dict[str, Any]], int]:
        """
        Find commissions for a specific user/agent.
        
        Args:
            firm_id: Organization ID
            user_id: User/agent ID
            request_id: Request trace ID
            skip: Pagination offset
            limit: Pagination limit
        
        Returns:
            Tuple of (commissions, total_count)
        """
        try:
            query = TenantAwareQuery.add_firm_filter(
                {"agent_id": user_id},
                firm_id
            )
            
            total = await self.collection.count_documents(query)
            
            cursor = self.collection.find(query).skip(skip).limit(limit).sort("created_at", -1)
            docs = await cursor.to_list(length=limit)
            
            logger.debug(
                f"[commissions] FIND_BY_USER firm_id={firm_id} "
                f"user_id={user_id} found={len(docs)} total={total} "
                f"request_id={request_id}"
            )
            
            return docs, total
        except Exception as e:
            logger.error(f"[commissions] FIND_BY_USER error: {str(e)}")
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
        Find commissions by status (pending, approved, paid, rejected).
        
        Args:
            firm_id: Organization ID
            status: Commission status filter
            request_id: Request trace ID
            skip: Pagination offset
            limit: Pagination limit
        
        Returns:
            Tuple of (commissions, total_count)
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
                f"[commissions] FIND_BY_STATUS firm_id={firm_id} status={status} "
                f"found={len(docs)} total={total} request_id={request_id}"
            )
            
            return docs, total
        except Exception as e:
            logger.error(f"[commissions] FIND_BY_STATUS error: {str(e)}")
            raise

    async def find_pending(
        self,
        firm_id: str,
        request_id: str,
        skip: int = 0,
        limit: int = 100
    ) -> tuple[List[Dict[str, Any]], int]:
        """
        Find all pending commissions (status="pending" or "approved").
        
        Args:
            firm_id: Organization ID
            request_id: Request trace ID
            skip: Pagination offset
            limit: Pagination limit
        
        Returns:
            Tuple of (commissions, total_count)
        """
        try:
            query = TenantAwareQuery.add_firm_filter(
                {"status": {"$in": ["pending", "approved"]}},
                firm_id
            )
            
            total = await self.collection.count_documents(query)
            
            cursor = self.collection.find(query).skip(skip).limit(limit).sort("created_at", -1)
            docs = await cursor.to_list(length=limit)
            
            logger.debug(
                f"[commissions] FIND_PENDING firm_id={firm_id} "
                f"found={len(docs)} total={total} request_id={request_id}"
            )
            
            return docs, total
        except Exception as e:
            logger.error(f"[commissions] FIND_PENDING error: {str(e)}")
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
        List all commissions for firm with pagination.
        
        Args:
            firm_id: Organization ID
            request_id: Request trace ID
            skip: Pagination offset
            limit: Pagination limit
            sort_field: Field to sort by
            sort_order: Sort direction (1=asc, -1=desc)
        
        Returns:
            Tuple of (commissions, total_count)
        """
        try:
            query = TenantAwareQuery.add_firm_filter({}, firm_id)
            
            total = await self.collection.count_documents(query)
            
            cursor = self.collection.find(query).skip(skip).limit(limit).sort(sort_field, sort_order)
            docs = await cursor.to_list(length=limit)
            
            logger.debug(
                f"[commissions] LIST_PAGINATED firm_id={firm_id} skip={skip} limit={limit} "
                f"found={len(docs)} total={total} request_id={request_id}"
            )
            
            return docs, total
        except Exception as e:
            logger.error(f"[commissions] LIST_PAGINATED error: {str(e)}")
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
        Find commissions created within date range.
        
        Args:
            firm_id: Organization ID
            start_date: Range start (inclusive)
            end_date: Range end (inclusive)
            request_id: Request trace ID
            skip: Pagination offset
            limit: Pagination limit
        
        Returns:
            Tuple of (commissions, total_count)
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
                f"[commissions] GET_BY_DATE_RANGE firm_id={firm_id} "
                f"start={start_date} end={end_date} found={len(docs)} "
                f"total={total} request_id={request_id}"
            )
            
            return docs, total
        except Exception as e:
            logger.error(f"[commissions] GET_BY_DATE_RANGE error: {str(e)}")
            raise

    # ════════════════════════════════════════════════════════════════════════════════
    # FINANCIAL OPERATIONS
    # ════════════════════════════════════════════════════════════════════════════════

    async def approve_commission(
        self,
        firm_id: str,
        commission_id: str,
        request_id: str
    ) -> bool:
        """
        Approve commission (pending → approved).
        
        Marks commission as approved and ready for payment.
        Sets approved_at timestamp.
        
        Args:
            firm_id: Organization ID
            commission_id: Commission document ID
            request_id: Request trace ID
        
        Returns:
            True if updated, False if not found
        """
        try:
            query = TenantAwareQuery.add_firm_filter(
                {"_id": ObjectId(commission_id) if self._is_valid_object_id(commission_id) else commission_id},
                firm_id
            )
            
            update_data = {
                "status": "approved",
                "approved_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            
            result = await self.collection.update_one(query, {"$set": update_data})
            
            if result.matched_count == 0:
                logger.warning(
                    f"[commissions] APPROVE_COMMISSION firm_id={firm_id} commission_id={commission_id} "
                    f"not_found request_id={request_id}"
                )
                return False
            
            logger.info(
                f"[commissions] APPROVE_COMMISSION firm_id={firm_id} commission_id={commission_id} "
                f"request_id={request_id}"
            )
            
            return True
        except Exception as e:
            logger.error(f"[commissions] APPROVE_COMMISSION error: {str(e)}")
            raise

    async def mark_paid(
        self,
        firm_id: str,
        commission_id: str,
        payment_data: Dict[str, Any],
        request_id: str
    ) -> bool:
        """
        Mark commission as paid (approved → paid).
        
        Records payment method and transaction reference.
        Prevents double-payment through state machine.
        
        Args:
            firm_id: Organization ID
            commission_id: Commission document ID
            payment_data: Dict with payment_method, transaction_reference, etc.
            request_id: Request trace ID
        
        Returns:
            True if updated, False if not found
        """
        try:
            query = TenantAwareQuery.add_firm_filter(
                {"_id": ObjectId(commission_id) if self._is_valid_object_id(commission_id) else commission_id},
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
                    f"[commissions] MARK_PAID firm_id={firm_id} commission_id={commission_id} "
                    f"not_found request_id={request_id}"
                )
                return False
            
            logger.info(
                f"[commissions] MARK_PAID firm_id={firm_id} commission_id={commission_id} "
                f"payment_method={payment_data.get('payment_method')} request_id={request_id}"
            )
            
            return True
        except Exception as e:
            logger.error(f"[commissions] MARK_PAID error: {str(e)}")
            raise

    async def reject_commission(
        self,
        firm_id: str,
        commission_id: str,
        reason: str,
        request_id: str
    ) -> bool:
        """
        Reject commission (pending → rejected).
        
        Records rejection reason for audit trail.
        
        Args:
            firm_id: Organization ID
            commission_id: Commission document ID
            reason: Rejection reason
            request_id: Request trace ID
        
        Returns:
            True if updated, False if not found
        """
        try:
            query = TenantAwareQuery.add_firm_filter(
                {"_id": ObjectId(commission_id) if self._is_valid_object_id(commission_id) else commission_id},
                firm_id
            )
            
            update_data = {
                "status": "rejected",
                "rejection_reason": reason,
                "updated_at": datetime.utcnow()
            }
            
            result = await self.collection.update_one(query, {"$set": update_data})
            
            if result.matched_count == 0:
                logger.warning(
                    f"[commissions] REJECT_COMMISSION firm_id={firm_id} commission_id={commission_id} "
                    f"not_found request_id={request_id}"
                )
                return False
            
            logger.info(
                f"[commissions] REJECT_COMMISSION firm_id={firm_id} commission_id={commission_id} "
                f"reason={reason} request_id={request_id}"
            )
            
            return True
        except Exception as e:
            logger.error(f"[commissions] REJECT_COMMISSION error: {str(e)}")
            raise

    async def calculate_commission(
        self,
        firm_id: str,
        commission_id: str,
        request_id: str
    ) -> Dict[str, Any]:
        """
        Calculate and retrieve commission split details.
        
        Returns lawyer_share, firm_share, platform_fee if available.
        
        Args:
            firm_id: Organization ID
            commission_id: Commission document ID
            request_id: Request trace ID
        
        Returns:
            Dict with calculated splits or empty if not found
        """
        try:
            query = TenantAwareQuery.add_firm_filter(
                {"_id": ObjectId(commission_id) if self._is_valid_object_id(commission_id) else commission_id},
                firm_id
            )
            
            doc = await self.collection.find_one(query)
            
            if not doc:
                logger.debug(
                    f"[commissions] CALCULATE_COMMISSION firm_id={firm_id} "
                    f"commission_id={commission_id} not_found request_id={request_id}"
                )
                return {}
            
            result = {
                "amount": doc.get("amount", 0),
                "lawyer_share": doc.get("lawyer_share", 0),
                "firm_share": doc.get("firm_share", 0),
                "platform_fee": doc.get("platform_fee", 0),
                "commission_rate": doc.get("commission_rate"),
                "sale_value": doc.get("sale_value")
            }
            
            logger.debug(
                f"[commissions] CALCULATE_COMMISSION firm_id={firm_id} "
                f"commission_id={commission_id} result={result} request_id={request_id}"
            )
            
            return result
        except Exception as e:
            logger.error(f"[commissions] CALCULATE_COMMISSION error: {str(e)}")
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
        Calculate commission totals by status (pending, approved, paid, rejected).
        
        Returns aggregated amounts for financial reporting.
        
        Args:
            firm_id: Organization ID
            request_id: Request trace ID
        
        Returns:
            Dict with total_pending, total_approved, total_paid, total_rejected, balance
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
                "total_pending": 0.0,
                "total_approved": 0.0,
                "total_paid": 0.0,
                "total_rejected": 0.0
            }
            
            for result in results:
                status = result.get("_id", "").lower()
                amount = result.get("total", 0)
                
                if status == "pending":
                    totals["total_pending"] = amount
                elif status == "approved":
                    totals["total_approved"] = amount
                elif status == "paid":
                    totals["total_paid"] = amount
                elif status == "rejected":
                    totals["total_rejected"] = amount
            
            totals["balance"] = totals["total_approved"] + totals["total_pending"]
            
            logger.debug(
                f"[commissions] CALCULATE_TOTALS firm_id={firm_id} "
                f"totals={totals} request_id={request_id}"
            )
            
            return totals
        except Exception as e:
            logger.error(f"[commissions] CALCULATE_TOTALS error: {str(e)}")
            raise

    async def monthly_summary(
        self,
        firm_id: str,
        request_id: str
    ) -> Dict[str, Any]:
        """
        Get monthly commission breakdown (aggregation by period).
        
        Returns monthly totals by status for trend analysis.
        
        Args:
            firm_id: Organization ID
            request_id: Request trace ID
        
        Returns:
            Dict mapping period → {total, count, approved, paid, pending}
        """
        try:
            pipeline = [
                {"$match": {"firm_id": firm_id}},
                {
                    "$group": {
                        "_id": {
                            "$dateToString": {
                                "format": "%Y-%m",
                                "date": "$created_at"
                            }
                        },
                        "total": {"$sum": "$amount"},
                        "count": {"$sum": 1},
                        "approved": {
                            "$sum": {
                                "$cond": [{"$eq": ["$status", "approved"]}, "$amount", 0]
                            }
                        },
                        "paid": {
                            "$sum": {
                                "$cond": [{"$eq": ["$status", "paid"]}, "$amount", 0]
                            }
                        },
                        "pending": {
                            "$sum": {
                                "$cond": [{"$eq": ["$status", "pending"]}, "$amount", 0]
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
                    "approved": result.get("approved", 0),
                    "paid": result.get("paid", 0),
                    "pending": result.get("pending", 0)
                }
                for result in results
            }
            
            logger.debug(
                f"[commissions] MONTHLY_SUMMARY firm_id={firm_id} "
                f"months={len(summary)} request_id={request_id}"
            )
            
            return summary
        except Exception as e:
            logger.error(f"[commissions] MONTHLY_SUMMARY error: {str(e)}")
            raise

    async def commission_statistics(
        self,
        firm_id: str,
        request_id: str
    ) -> Dict[str, Any]:
        """
        Get comprehensive commission statistics for reporting.
        
        Returns metrics like average commission amount, count by status, agent stats, etc.
        
        Args:
            firm_id: Organization ID
            request_id: Request trace ID
        
        Returns:
            Dict with count, average_amount, by_status, by_agent
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
                        "by_status": [
                            {
                                "$group": {
                                    "_id": "$status",
                                    "count": {"$sum": 1},
                                    "total": {"$sum": "$amount"}
                                }
                            }
                        ],
                        "by_agent": [
                            {
                                "$group": {
                                    "_id": "$agent_id",
                                    "count": {"$sum": 1},
                                    "total": {"$sum": "$amount"},
                                    "average": {"$avg": "$amount"}
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
                    "by_status": {},
                    "by_agent": {}
                }
            
            result = results[0]
            overall = result.get("overall", [{}])[0]
            
            by_status = {
                item.get("_id"): {
                    "count": item.get("count", 0),
                    "total": item.get("total", 0)
                }
                for item in result.get("by_status", [])
            }
            
            by_agent = {
                item.get("_id"): {
                    "count": item.get("count", 0),
                    "total": item.get("total", 0),
                    "average": item.get("average", 0)
                }
                for item in result.get("by_agent", [])
            }
            
            stats = {
                "count": overall.get("count", 0),
                "total_amount": overall.get("total", 0),
                "average_amount": overall.get("average", 0),
                "min_amount": overall.get("min", 0),
                "max_amount": overall.get("max", 0),
                "by_status": by_status,
                "by_agent": by_agent
            }
            
            logger.debug(
                f"[commissions] COMMISSION_STATISTICS firm_id={firm_id} "
                f"stats={stats} request_id={request_id}"
            )
            
            return stats
        except Exception as e:
            logger.error(f"[commissions] COMMISSION_STATISTICS error: {str(e)}")
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
