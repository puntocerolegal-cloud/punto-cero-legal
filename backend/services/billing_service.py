from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime, date
from bson import ObjectId
from typing import Optional
import logging

from repositories.invoice_repository import InvoiceRepository
from repositories.commission_repository import CommissionRepository
from adapters.tenant_mapping import TenantMapping

logger = logging.getLogger(__name__)


class BillingService:
    """Service for managing billing and invoices."""

    @staticmethod
    async def get_firm_billing_summary(
        db: AsyncIOMotorDatabase,
        organization_id: str,
        request_id: str = "billing",
    ) -> dict:
        """FASE 11.3: Get billing summary for a firm (migrated to repositories)."""
        try:
            # TENANT MAPPING: organization_id → firm_id
            firm_id = await TenantMapping.organization_to_firm(organization_id, db, request_id)
            if not firm_id:
                logger.warning(
                    f"[billing-service] GET_FIRM_SUMMARY tenant mapping failed "
                    f"organization_id={organization_id} request_id={request_id}"
                )
                raise ValueError(f"Tenant mapping failed for {organization_id}")

            # Initialize repositories
            commission_repo = CommissionRepository(db.commissions)
            invoice_repo = InvoiceRepository(db.invoices)

            # Get commissions for this firm (via repository)
            commissions, _ = await commission_repo.list_paginated(
                firm_id=firm_id,
                request_id=request_id,
                skip=0,
                limit=10000
            )

            total_revenue = sum(c.get("amount", 0) for c in commissions)
            commissions_paid = sum(c.get("amount", 0) for c in commissions if c.get("status") == "paid")
            commissions_pending = sum(c.get("amount", 0) for c in commissions if c.get("status") == "pending")

            # Get invoices for this firm (via repository)
            invoices, _ = await invoice_repo.list_paginated(
                firm_id=firm_id,
                request_id=request_id,
                skip=0,
                limit=10000
            )

            invoices_paid = sum(i.get("amount", 0) for i in invoices if i.get("status") == "paid")
            invoices_pending = sum(i.get("amount", 0) for i in invoices if i.get("status") in ["draft", "issued"])

            # Calculate net balance (same logic as before)
            net_balance = total_revenue - (commissions_paid + invoices_paid)

            # Monthly breakdown (same logic as before)
            monthly_revenue = {}
            for commission in commissions:
                created_at = commission.get("created_at")
                if created_at:
                    month = created_at.strftime("%Y-%m")
                    if month not in monthly_revenue:
                        monthly_revenue[month] = 0
                    monthly_revenue[month] += commission.get("amount", 0)

            logger.info(
                f"[billing-service] GET_FIRM_SUMMARY completed "
                f"firm_id={firm_id} commissions={len(commissions)} invoices={len(invoices)} "
                f"request_id={request_id}"
            )

            return {
                "total_revenue": total_revenue,
                "commissions_paid": commissions_paid,
                "commissions_pending": commissions_pending,
                "invoices_paid": invoices_paid,
                "invoices_pending": invoices_pending,
                "net_balance": net_balance,
                "monthly_revenue": monthly_revenue,
                "commission_count": len(commissions),
                "invoice_count": len(invoices),
            }
        except Exception as e:
            logger.error(
                f"[billing-service] GET_FIRM_SUMMARY error: {str(e)} "
                f"organization_id={organization_id} request_id={request_id}"
            )
            raise

    @staticmethod
    async def create_invoice(
        db: AsyncIOMotorDatabase,
        organization_id: str,
        amount: float,
        period: str,
        currency: str = "USD",
        description: Optional[str] = None,
        request_id: str = "billing",
    ) -> dict:
        """FASE 11.4: Create an invoice for a firm (migrated to repository)."""
        try:
            # TENANT MAPPING: organization_id → firm_id
            firm_id = await TenantMapping.organization_to_firm(organization_id, db, request_id)
            if not firm_id:
                logger.warning(
                    f"[billing-service] CREATE_INVOICE tenant mapping failed "
                    f"organization_id={organization_id} request_id={request_id}"
                )
                raise ValueError(f"Tenant mapping failed for {organization_id}")

            # Initialize repository
            invoice_repo = InvoiceRepository(db.invoices)

            # Prepare invoice data (preserve organization_id for schema compatibility)
            invoice_data = {
                "organization_id": organization_id,  # Keep for backward compatibility
                "amount": amount,
                "currency": currency,
                "status": "draft",
                "period": period,
                "description": description or f"Invoice for {period}",
                "issued_at": None,
                "paid_at": None,
                "payment_method": None,
                "transaction_reference": None,
            }

            # Create invoice via repository (handles firm_id injection + timestamps)
            result = await invoice_repo.create(
                firm_id=firm_id,
                data=invoice_data,
                request_id=request_id
            )

            logger.info(
                f"[billing-service] CREATE_INVOICE completed "
                f"firm_id={firm_id} invoice_id={result.get('_id')} amount={amount} "
                f"request_id={request_id}"
            )

            return result
        except Exception as e:
            logger.error(
                f"[billing-service] CREATE_INVOICE error: {str(e)} "
                f"organization_id={organization_id} request_id={request_id}"
            )
            raise

    @staticmethod
    async def issue_invoice(
        db: AsyncIOMotorDatabase,
        invoice_id: str,
        request_id: str = "billing",
    ) -> dict:
        """Change invoice status from draft to issued (migrated to repository)."""
        try:
            # LOOKUP: Get invoice to retrieve firm_id (accept one small direct query)
            invoice_doc = await db.invoices.find_one(
                {"_id": ObjectId(invoice_id)}
            )
            if not invoice_doc:
                logger.warning(
                    f"[billing-service] ISSUE_INVOICE not_found invoice_id={invoice_id} "
                    f"request_id={request_id}"
                )
                raise ValueError("Invoice not found")

            # TENANT MAPPING: Extract organization_id and map to firm_id
            organization_id = invoice_doc.get("organization_id")
            firm_id = await TenantMapping.organization_to_firm(organization_id, db, request_id)
            if not firm_id:
                logger.warning(
                    f"[billing-service] ISSUE_INVOICE tenant mapping failed "
                    f"organization_id={organization_id} request_id={request_id}"
                )
                raise ValueError(f"Tenant mapping failed for {organization_id}")

            # Initialize repository
            invoice_repo = InvoiceRepository(db.invoices)

            # Issue invoice via repository
            result = await invoice_repo.issue_invoice(
                firm_id=firm_id,
                invoice_id=invoice_id,
                request_id=request_id
            )

            logger.info(
                f"[billing-service] ISSUE_INVOICE completed "
                f"firm_id={firm_id} invoice_id={invoice_id} request_id={request_id}"
            )

            return result
        except Exception as e:
            logger.error(
                f"[billing-service] ISSUE_INVOICE error: {str(e)} "
                f"invoice_id={invoice_id} request_id={request_id}"
            )
            raise

    @staticmethod
    async def pay_invoice(
        db: AsyncIOMotorDatabase,
        invoice_id: str,
        payment_method: str = "bank_transfer",
        transaction_reference: Optional[str] = None,
        request_id: str = "billing",
    ) -> dict:
        """Mark invoice as paid (migrated to repository, financial operation)."""
        try:
            # LOOKUP: Get invoice to check status and retrieve firm_id
            invoice = await db.invoices.find_one(
                {"_id": ObjectId(invoice_id)}
            )
            if not invoice:
                logger.warning(
                    f"[billing-service] PAY_INVOICE not_found invoice_id={invoice_id} "
                    f"request_id={request_id}"
                )
                raise ValueError("Invoice not found")

            # VALIDATION: Check if already paid (preserve business logic)
            if invoice.get("status") == "paid":
                logger.warning(
                    f"[billing-service] PAY_INVOICE already_paid invoice_id={invoice_id} "
                    f"request_id={request_id}"
                )
                raise ValueError("Invoice already paid")

            # TENANT MAPPING: Extract organization_id and map to firm_id
            organization_id = invoice.get("organization_id")
            firm_id = await TenantMapping.organization_to_firm(organization_id, db, request_id)
            if not firm_id:
                logger.warning(
                    f"[billing-service] PAY_INVOICE tenant mapping failed "
                    f"organization_id={organization_id} request_id={request_id}"
                )
                raise ValueError(f"Tenant mapping failed for {organization_id}")

            # Initialize repository
            invoice_repo = InvoiceRepository(db.invoices)

            # Prepare payment data
            payment_data = {
                "payment_method": payment_method,
                "transaction_reference": transaction_reference or f"INV-{invoice_id[:12]}-{int(datetime.utcnow().timestamp())}"
            }

            # Mark paid via repository (FINANCIAL OPERATION - AUDITED)
            result = await invoice_repo.mark_as_paid(
                firm_id=firm_id,
                invoice_id=invoice_id,
                payment_data=payment_data,
                request_id=request_id
            )

            logger.info(
                f"[billing-service] PAY_INVOICE completed (FINANCIAL) "
                f"firm_id={firm_id} invoice_id={invoice_id} payment_method={payment_method} "
                f"request_id={request_id}"
            )

            return result
        except Exception as e:
            logger.error(
                f"[billing-service] PAY_INVOICE error: {str(e)} "
                f"invoice_id={invoice_id} request_id={request_id}"
            )
            raise

    @staticmethod
    async def get_firm_invoices(
        db: AsyncIOMotorDatabase,
        organization_id: str,
        status: Optional[str] = None,
        request_id: str = "billing",
    ) -> list:
        """Get invoices for a firm (migrated to repository)."""
        try:
            # TENANT MAPPING: organization_id → firm_id
            firm_id = await TenantMapping.organization_to_firm(organization_id, db, request_id)
            if not firm_id:
                logger.warning(
                    f"[billing-service] GET_FIRM_INVOICES tenant mapping failed "
                    f"organization_id={organization_id} request_id={request_id}"
                )
                raise ValueError(f"Tenant mapping failed for {organization_id}")

            # Initialize repository
            invoice_repo = InvoiceRepository(db.invoices)

            # Query invoices via repository
            if status:
                invoices, _ = await invoice_repo.find_by_status(
                    firm_id=firm_id,
                    status=status,
                    request_id=request_id,
                    skip=0,
                    limit=10000
                )
            else:
                invoices, _ = await invoice_repo.list_paginated(
                    firm_id=firm_id,
                    request_id=request_id,
                    skip=0,
                    limit=10000,
                    sort_field="created_at",
                    sort_order=-1
                )

            logger.info(
                f"[billing-service] GET_FIRM_INVOICES completed "
                f"firm_id={firm_id} count={len(invoices)} status={status} request_id={request_id}"
            )

            return invoices
        except Exception as e:
            logger.error(
                f"[billing-service] GET_FIRM_INVOICES error: {str(e)} "
                f"organization_id={organization_id} request_id={request_id}"
            )
            raise

    @staticmethod
    async def auto_generate_invoices(
        db: AsyncIOMotorDatabase,
        organization_id: str,
        period: str,
        request_id: str = "billing",
    ) -> dict:
        """FASE 11.4: Auto-generate invoice from commissions in a period (migrated to repository)."""
        try:
            # TENANT MAPPING: organization_id → firm_id
            firm_id = await TenantMapping.organization_to_firm(organization_id, db, request_id)
            if not firm_id:
                logger.warning(
                    f"[billing-service] AUTO_GENERATE_INVOICES tenant mapping failed "
                    f"organization_id={organization_id} request_id={request_id}"
                )
                raise ValueError(f"Tenant mapping failed for {organization_id}")

            # PARSE: Parse period into datetime range
            year, month = period.split("-")
            start_date = datetime(int(year), int(month), 1)
            # Calculate end of month
            if int(month) < 12:
                end_date = datetime(int(year), int(month) + 1, 1)
            else:
                end_date = datetime(int(year) + 1, 1, 1)

            # Initialize repository
            commission_repo = CommissionRepository(db.commissions)

            # Query commissions for period via repository
            commissions, _ = await commission_repo.get_by_date_range(
                firm_id=firm_id,
                start_date=start_date,
                end_date=end_date,
                request_id=request_id,
                skip=0,
                limit=10000
            )

            # Calculate total amount (same logic as before)
            total_amount = sum(c.get("amount", 0) for c in commissions)

            # Create invoice via repository
            invoice = await BillingService.create_invoice(
                db,
                organization_id,
                total_amount,
                period,
                description=f"Invoice for commissions in {period}",
                request_id=request_id
            )

            logger.info(
                f"[billing-service] AUTO_GENERATE_INVOICES completed "
                f"firm_id={firm_id} period={period} commissions={len(commissions)} "
                f"total_amount={total_amount} request_id={request_id}"
            )

            return invoice
        except Exception as e:
            logger.error(
                f"[billing-service] AUTO_GENERATE_INVOICES error: {str(e)} "
                f"organization_id={organization_id} period={period} request_id={request_id}"
            )
            raise

    @staticmethod
    async def get_global_billing_summary(
        db: AsyncIOMotorDatabase,
        request_id: str = "billing-admin",
    ) -> dict:
        """FASE 11.6: Get global billing summary for Admin OS (fallback to direct DB).

        NOTE: This is an ADMIN-ONLY operation that aggregates across all organizations.
        Global aggregation without firm_id scoping cannot be efficiently handled by
        per-organization repositories. This operation has fallback to direct MongoDB
        as an acceptable trade-off for admin operations.

        Acceptable because:
        - Admin-only endpoint (billing_admin.py)
        - Global scope (crosses firm boundaries)
        - Not a tenant-scoped operation
        - Fallback documented and logged

        Future: Can be refactored to use CommissionRepository global aggregation
        if a dedicated admin aggregation method is added in B8+.
        """
        try:
            logger.info(
                f"[billing-service] GET_GLOBAL_BILLING_SUMMARY starting (admin operation) "
                f"request_id={request_id}"
            )

            # FALLBACK: Direct MongoDB for admin global aggregation
            # This is the only operation that remains direct (documented exception)
            all_commissions = await db.commissions.find({}).to_list(None)

            global_revenue = sum(c.get("amount", 0) for c in all_commissions)
            global_paid = sum(c.get("amount", 0) for c in all_commissions if c.get("status") == "paid")
            global_pending = sum(c.get("amount", 0) for c in all_commissions if c.get("status") == "pending")

            # Revenue by firm
            revenue_by_firm = {}
            for commission in all_commissions:
                org_id = commission.get("organization_id")
                if org_id:
                    if org_id not in revenue_by_firm:
                        revenue_by_firm[org_id] = 0
                    revenue_by_firm[org_id] += commission.get("amount", 0)

            # Revenue by agent
            revenue_by_agent = {}
            for commission in all_commissions:
                agent_id = commission.get("agent_id")
                if agent_id:
                    if agent_id not in revenue_by_agent:
                        revenue_by_agent[agent_id] = 0
                    revenue_by_agent[agent_id] += commission.get("amount", 0)

            logger.info(
                f"[billing-service] GET_GLOBAL_BILLING_SUMMARY completed "
                f"commissions={len(all_commissions)} global_revenue={global_revenue} "
                f"firms={len(revenue_by_firm)} request_id={request_id}"
            )

            return {
                "global_revenue": global_revenue,
                "global_paid": global_paid,
                "global_pending": global_pending,
                "revenue_by_firm": revenue_by_firm,
                "revenue_by_agent": revenue_by_agent,
            }
        except Exception as e:
            logger.error(
                f"[billing-service] GET_GLOBAL_BILLING_SUMMARY error: {str(e)} "
                f"request_id={request_id}"
            )
            raise
