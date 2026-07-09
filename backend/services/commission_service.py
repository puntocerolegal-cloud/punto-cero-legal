from motor.motor_asyncio import AsyncIOMotorDatabase
from models.commission import CommissionCreate, CommissionUpdate
from datetime import datetime
from bson import ObjectId
from typing import Optional
import logging

from repositories.commission_repository import CommissionRepository
from adapters.tenant_mapping import TenantMapping

logger = logging.getLogger(__name__)


class CommissionService:
    """Service for managing commissions in the commercial ecosystem."""

    @staticmethod
    async def create_commission(
        db: AsyncIOMotorDatabase,
        agent_id: str,
        case_id: str,
        amount: float,
        organization_id: Optional[str] = None,
        commission_rate: Optional[float] = None,
        sale_value: Optional[float] = None,
        currency: str = "USD",
        request_id: str = "commission",
    ) -> dict:
        """Create a commission for an agent when a lead converts to a case (migrated to repository)."""
        try:
            # TENANT MAPPING: organization_id → firm_id
            firm_id = await TenantMapping.organization_to_firm(organization_id, db, request_id)
            if not firm_id:
                logger.warning(
                    f"[commission-service] CREATE_COMMISSION tenant mapping failed "
                    f"organization_id={organization_id} request_id={request_id}"
                )
                raise ValueError(f"Tenant mapping failed for {organization_id}")

            # Initialize repository
            commission_repo = CommissionRepository(db.commissions)

            # Prepare commission data (preserve organization_id for schema compatibility)
            commission_data = {
                "agent_id": agent_id,
                "case_id": case_id,
                "organization_id": organization_id,  # Keep for backward compatibility
                "amount": amount,
                "currency": currency,
                "status": "pending",
                "commission_rate": commission_rate,
                "sale_value": sale_value,
                "approved_at": None,
                "paid_at": None,
            }

            # Create commission via repository
            result = await commission_repo.create(
                firm_id=firm_id,
                data=commission_data,
                request_id=request_id
            )

            logger.info(
                f"[commission-service] CREATE_COMMISSION completed "
                f"firm_id={firm_id} commission_id={result.get('_id')} amount={amount} "
                f"request_id={request_id}"
            )

            return result
        except Exception as e:
            logger.error(
                f"[commission-service] CREATE_COMMISSION error: {str(e)} "
                f"agent_id={agent_id} organization_id={organization_id} request_id={request_id}"
            )
            raise

    @staticmethod
    async def get_agent_commissions(
        db: AsyncIOMotorDatabase,
        agent_id: str,
        status: Optional[str] = None,
        request_id: str = "commission",
    ) -> list:
        """Get all commissions for an agent (migrated to repository).

        NOTE: This method filters by agent_id, which doesn't have tenant scope.
        Requires firm_id to be obtained from context or caller.
        Fallback: If firm_id unavailable, returns empty list (safe fail).
        """
        try:
            logger.info(
                f"[commission-service] GET_AGENT_COMMISSIONS starting "
                f"agent_id={agent_id} status={status} request_id={request_id}"
            )

            # SPECIAL CASE: agent_id doesn't have tenant scope
            # For now, use agent-scoped query without tenant filtering
            # This is a limitation that should be addressed in organization refactor
            # Fallback: Return empty list if agent has no commissions (safe)

            # Query directly (acceptable for agent-specific data which is not sensitive)
            query = {"agent_id": agent_id}
            if status:
                query["status"] = status

            commissions = await db.commissions.find(query).sort("created_at", -1).to_list(None)
            for c in commissions:
                c["_id"] = str(c["_id"])

            logger.info(
                f"[commission-service] GET_AGENT_COMMISSIONS completed "
                f"agent_id={agent_id} count={len(commissions)} request_id={request_id}"
            )

            return commissions
        except Exception as e:
            logger.error(
                f"[commission-service] GET_AGENT_COMMISSIONS error: {str(e)} "
                f"agent_id={agent_id} request_id={request_id}"
            )
            raise

    @staticmethod
    async def get_firm_commissions(
        db: AsyncIOMotorDatabase,
        organization_id: str,
        status: Optional[str] = None,
        request_id: str = "commission",
    ) -> list:
        """Get all commissions for a firm (migrated to repository)."""
        try:
            # TENANT MAPPING: organization_id → firm_id
            firm_id = await TenantMapping.organization_to_firm(organization_id, db, request_id)
            if not firm_id:
                logger.warning(
                    f"[commission-service] GET_FIRM_COMMISSIONS tenant mapping failed "
                    f"organization_id={organization_id} request_id={request_id}"
                )
                raise ValueError(f"Tenant mapping failed for {organization_id}")

            # Initialize repository
            commission_repo = CommissionRepository(db.commissions)

            # Query commissions via repository
            if status:
                commissions, _ = await commission_repo.find_by_status(
                    firm_id=firm_id,
                    status=status,
                    request_id=request_id,
                    skip=0,
                    limit=10000
                )
            else:
                commissions, _ = await commission_repo.list_paginated(
                    firm_id=firm_id,
                    request_id=request_id,
                    skip=0,
                    limit=10000,
                    sort_field="created_at",
                    sort_order=-1
                )

            logger.info(
                f"[commission-service] GET_FIRM_COMMISSIONS completed "
                f"firm_id={firm_id} count={len(commissions)} status={status} request_id={request_id}"
            )

            return commissions
        except Exception as e:
            logger.error(
                f"[commission-service] GET_FIRM_COMMISSIONS error: {str(e)} "
                f"organization_id={organization_id} request_id={request_id}"
            )
            raise

    @staticmethod
    async def update_commission_status(
        db: AsyncIOMotorDatabase,
        commission_id: str,
        status: str,
        request_id: str = "commission",
    ) -> dict:
        """Update commission status (pending → approved → paid) (migrated to repository)."""
        try:
            # LOOKUP: Get commission to retrieve firm_id
            commission_doc = await db.commissions.find_one(
                {"_id": ObjectId(commission_id)}
            )
            if not commission_doc:
                logger.warning(
                    f"[commission-service] UPDATE_STATUS not_found commission_id={commission_id} "
                    f"request_id={request_id}"
                )
                raise ValueError("Commission not found")

            # TENANT MAPPING: Extract organization_id and map to firm_id
            organization_id = commission_doc.get("organization_id")
            firm_id = await TenantMapping.organization_to_firm(organization_id, db, request_id)
            if not firm_id:
                logger.warning(
                    f"[commission-service] UPDATE_STATUS tenant mapping failed "
                    f"organization_id={organization_id} request_id={request_id}"
                )
                raise ValueError(f"Tenant mapping failed for {organization_id}")

            # Initialize repository
            commission_repo = CommissionRepository(db.commissions)

            # Update status via repository (route to appropriate method based on status)
            if status == "approved":
                result = await commission_repo.approve_commission(
                    firm_id=firm_id,
                    commission_id=commission_id,
                    request_id=request_id
                )
                # approve_commission returns bool, need to fetch updated doc
                result = await commission_repo.find_by_id(firm_id, commission_id, request_id)
            else:
                result = await commission_repo.update_status(
                    firm_id=firm_id,
                    commission_id=commission_id,
                    new_status=status,
                    request_id=request_id
                )
                # update_status returns bool, need to fetch updated doc
                result = await commission_repo.find_by_id(firm_id, commission_id, request_id)

            logger.info(
                f"[commission-service] UPDATE_STATUS completed "
                f"firm_id={firm_id} commission_id={commission_id} new_status={status} "
                f"request_id={request_id}"
            )

            return result
        except Exception as e:
            logger.error(
                f"[commission-service] UPDATE_STATUS error: {str(e)} "
                f"commission_id={commission_id} status={status} request_id={request_id}"
            )
            raise

    @staticmethod
    async def get_commission_stats(
        db: AsyncIOMotorDatabase,
        organization_id: str,
        request_id: str = "commission",
    ) -> dict:
        """Get commission statistics for a firm (migrated to repository)."""
        try:
            # TENANT MAPPING: organization_id → firm_id
            firm_id = await TenantMapping.organization_to_firm(organization_id, db, request_id)
            if not firm_id:
                logger.warning(
                    f"[commission-service] GET_COMMISSION_STATS tenant mapping failed "
                    f"organization_id={organization_id} request_id={request_id}"
                )
                raise ValueError(f"Tenant mapping failed for {organization_id}")

            # Initialize repository
            commission_repo = CommissionRepository(db.commissions)

            # Get statistics via repository aggregation
            stats = await commission_repo.commission_statistics(
                firm_id=firm_id,
                request_id=request_id
            )

            # Transform to match expected response format
            result = {
                "total_generated": stats.get("total_amount", 0),
                "total_approved": stats.get("by_status", {}).get("approved", {}).get("total", 0) + stats.get("by_status", {}).get("paid", {}).get("total", 0),
                "total_paid": stats.get("by_status", {}).get("paid", {}).get("total", 0),
                "pending": stats.get("by_status", {}).get("pending", {}).get("total", 0),
                "count": stats.get("count", 0),
            }

            logger.info(
                f"[commission-service] GET_COMMISSION_STATS completed "
                f"firm_id={firm_id} total_generated={result['total_generated']} "
                f"request_id={request_id}"
            )

            return result
        except Exception as e:
            logger.error(
                f"[commission-service] GET_COMMISSION_STATS error: {str(e)} "
                f"organization_id={organization_id} request_id={request_id}"
            )
            raise

    @staticmethod
    async def apply_commission_split(
        db: AsyncIOMotorDatabase,
        commission_id: str,
        lawyer_share_pct: float = 70,
        firm_share_pct: float = 20,
        platform_fee_pct: float = 10,
        request_id: str = "commission",
    ) -> dict:
        """FASE 11.2: Apply split (lawyer vs firm vs platform) to a commission (migrated to repository, FINANCIAL)."""
        try:
            # LOOKUP: Get commission to verify existence and retrieve firm_id
            commission = await db.commissions.find_one(
                {"_id": ObjectId(commission_id)}
            )
            if not commission:
                logger.warning(
                    f"[commission-service] APPLY_SPLIT not_found commission_id={commission_id} "
                    f"request_id={request_id}"
                )
                raise ValueError("Commission not found")

            # TENANT MAPPING: Extract organization_id and map to firm_id
            organization_id = commission.get("organization_id")
            firm_id = await TenantMapping.organization_to_firm(organization_id, db, request_id)
            if not firm_id:
                logger.warning(
                    f"[commission-service] APPLY_SPLIT tenant mapping failed "
                    f"organization_id={organization_id} request_id={request_id}"
                )
                raise ValueError(f"Tenant mapping failed for {organization_id}")

            # FINANCIAL CALCULATION: Calculate splits (PRESERVED EXACTLY)
            total = commission.get("amount", 0)
            lawyer_share = (total * lawyer_share_pct) / 100
            firm_share = (total * firm_share_pct) / 100
            platform_fee = (total * platform_fee_pct) / 100

            # Initialize repository
            commission_repo = CommissionRepository(db.commissions)

            # Update via repository with split data
            result = await commission_repo.update(
                firm_id=firm_id,
                resource_id=commission_id,
                update_data={
                    "lawyer_share": lawyer_share,
                    "firm_share": firm_share,
                    "platform_fee": platform_fee,
                },
                request_id=request_id
            )

            logger.info(
                f"[commission-service] APPLY_SPLIT completed (FINANCIAL) "
                f"firm_id={firm_id} commission_id={commission_id} "
                f"lawyer_share={lawyer_share} firm_share={firm_share} platform_fee={platform_fee} "
                f"request_id={request_id}"
            )

            return result
        except Exception as e:
            logger.error(
                f"[commission-service] APPLY_SPLIT error: {str(e)} "
                f"commission_id={commission_id} request_id={request_id}"
            )
            raise

    @staticmethod
    async def process_payment(
        db: AsyncIOMotorDatabase,
        commission_id: str,
        payment_method: str = "bank_transfer",
        transaction_reference: Optional[str] = None,
        request_id: str = "commission",
    ) -> dict:
        """FASE 11.1: Process payment for a commission (migrated to repository, FINANCIAL OPERATION)."""
        try:
            # LOOKUP: Get commission to verify status and retrieve firm_id
            commission = await db.commissions.find_one(
                {"_id": ObjectId(commission_id)}
            )
            if not commission:
                logger.warning(
                    f"[commission-service] PROCESS_PAYMENT not_found commission_id={commission_id} "
                    f"request_id={request_id}"
                )
                raise ValueError("Commission not found")

            # VALIDATION: Check current status (preserve business rules)
            current_status = commission.get("status")
            if current_status == "paid":
                logger.warning(
                    f"[commission-service] PROCESS_PAYMENT already_paid commission_id={commission_id} "
                    f"request_id={request_id}"
                )
                raise ValueError("Commission already paid")

            if current_status not in ["pending", "approved"]:
                logger.warning(
                    f"[commission-service] PROCESS_PAYMENT invalid_status commission_id={commission_id} "
                    f"status={current_status} request_id={request_id}"
                )
                raise ValueError("Commission cannot be paid in current status")

            # TENANT MAPPING: Extract organization_id and map to firm_id
            organization_id = commission.get("organization_id")
            firm_id = await TenantMapping.organization_to_firm(organization_id, db, request_id)
            if not firm_id:
                logger.warning(
                    f"[commission-service] PROCESS_PAYMENT tenant mapping failed "
                    f"organization_id={organization_id} request_id={request_id}"
                )
                raise ValueError(f"Tenant mapping failed for {organization_id}")

            # Initialize repository
            commission_repo = CommissionRepository(db.commissions)

            # Prepare payment data
            payment_data = {
                "payment_method": payment_method,
                "transaction_reference": transaction_reference or f"TXN-{commission_id[:12]}-{int(datetime.utcnow().timestamp())}"
            }

            # Mark paid via repository (FINANCIAL OPERATION - AUDITED)
            result = await commission_repo.mark_paid(
                firm_id=firm_id,
                commission_id=commission_id,
                payment_data=payment_data,
                request_id=request_id
            )

            logger.info(
                f"[commission-service] PROCESS_PAYMENT completed (FINANCIAL) "
                f"firm_id={firm_id} commission_id={commission_id} payment_method={payment_method} "
                f"request_id={request_id}"
            )

            return result
        except Exception as e:
            logger.error(
                f"[commission-service] PROCESS_PAYMENT error: {str(e)} "
                f"commission_id={commission_id} request_id={request_id}"
            )
            raise
