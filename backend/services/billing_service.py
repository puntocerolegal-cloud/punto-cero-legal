from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime, date
from bson import ObjectId
from typing import Optional

class BillingService:
    """Service for managing billing and invoices."""

    @staticmethod
    async def get_firm_billing_summary(
        db: AsyncIOMotorDatabase,
        organization_id: str,
    ) -> dict:
        """FASE 11.3: Get billing summary for a firm."""
        # Get commissions for this firm
        commissions = await db.commissions.find({
            "organization_id": organization_id
        }).to_list(None)
        
        total_revenue = sum(c.get("amount", 0) for c in commissions)
        commissions_paid = sum(c.get("amount", 0) for c in commissions if c.get("status") == "paid")
        commissions_pending = sum(c.get("amount", 0) for c in commissions if c.get("status") == "pending")
        
        # Get invoices for this firm
        invoices = await db.invoices.find({
            "organization_id": organization_id
        }).to_list(None)
        
        invoices_paid = sum(i.get("amount", 0) for i in invoices if i.get("status") == "paid")
        invoices_pending = sum(i.get("amount", 0) for i in invoices if i.get("status") in ["draft", "issued"])
        
        # Calculate net balance
        net_balance = total_revenue - (commissions_paid + invoices_paid)
        
        # Monthly breakdown
        monthly_revenue = {}
        for commission in commissions:
            created_at = commission.get("created_at")
            if created_at:
                month = created_at.strftime("%Y-%m")
                if month not in monthly_revenue:
                    monthly_revenue[month] = 0
                monthly_revenue[month] += commission.get("amount", 0)
        
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

    @staticmethod
    async def create_invoice(
        db: AsyncIOMotorDatabase,
        organization_id: str,
        amount: float,
        period: str,
        currency: str = "USD",
        description: Optional[str] = None,
    ) -> dict:
        """FASE 11.4: Create an invoice for a firm."""
        invoice = {
            "organization_id": organization_id,
            "amount": amount,
            "currency": currency,
            "status": "draft",
            "period": period,
            "description": description or f"Invoice for {period}",
            "created_at": datetime.utcnow(),
            "issued_at": None,
            "paid_at": None,
            "updated_at": datetime.utcnow(),
            "payment_method": None,
            "transaction_reference": None,
        }
        
        result = await db.invoices.insert_one(invoice)
        invoice["_id"] = str(result.inserted_id)
        return invoice

    @staticmethod
    async def issue_invoice(
        db: AsyncIOMotorDatabase,
        invoice_id: str,
    ) -> dict:
        """Change invoice status from draft to issued."""
        result = await db.invoices.find_one_and_update(
            {"_id": ObjectId(invoice_id)},
            {"$set": {
                "status": "issued",
                "issued_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
            }},
            return_document=True
        )
        
        if result:
            result["_id"] = str(result["_id"])
        return result

    @staticmethod
    async def pay_invoice(
        db: AsyncIOMotorDatabase,
        invoice_id: str,
        payment_method: str = "bank_transfer",
        transaction_reference: Optional[str] = None,
    ) -> dict:
        """Mark invoice as paid."""
        invoice = await db.invoices.find_one({"_id": ObjectId(invoice_id)})
        if not invoice:
            raise ValueError("Invoice not found")
        
        if invoice.get("status") == "paid":
            raise ValueError("Invoice already paid")
        
        result = await db.invoices.find_one_and_update(
            {"_id": ObjectId(invoice_id)},
            {"$set": {
                "status": "paid",
                "paid_at": datetime.utcnow(),
                "payment_method": payment_method,
                "transaction_reference": transaction_reference or f"INV-{invoice_id[:12]}-{int(datetime.utcnow().timestamp())}",
                "updated_at": datetime.utcnow(),
            }},
            return_document=True
        )
        
        if result:
            result["_id"] = str(result["_id"])
        return result

    @staticmethod
    async def get_firm_invoices(
        db: AsyncIOMotorDatabase,
        organization_id: str,
        status: Optional[str] = None,
    ) -> list:
        """Get invoices for a firm."""
        query = {"organization_id": organization_id}
        if status:
            query["status"] = status
        
        invoices = await db.invoices.find(query).sort("created_at", -1).to_list(None)
        for i in invoices:
            i["_id"] = str(i["_id"])
        return invoices

    @staticmethod
    async def auto_generate_invoices(
        db: AsyncIOMotorDatabase,
        organization_id: str,
        period: str,
    ) -> dict:
        """FASE 11.4: Auto-generate invoice from commissions in a period."""
        # Get commissions for this period
        year, month = period.split("-")
        commissions = await db.commissions.find({
            "organization_id": organization_id,
            "created_at": {
                "$gte": datetime(int(year), int(month), 1),
                "$lt": datetime(int(year), int(month) + 1 if int(month) < 12 else 1, 1 if int(month) < 12 else 1)
            }
        }).to_list(None)
        
        total_amount = sum(c.get("amount", 0) for c in commissions)
        
        # Create invoice
        invoice = await BillingService.create_invoice(
            db,
            organization_id,
            total_amount,
            period,
            description=f"Invoice for commissions in {period}"
        )
        
        return invoice

    @staticmethod
    async def get_global_billing_summary(
        db: AsyncIOMotorDatabase,
    ) -> dict:
        """FASE 11.6: Get global billing summary for Admin OS."""
        # Get all commissions
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
        
        return {
            "global_revenue": global_revenue,
            "global_paid": global_paid,
            "global_pending": global_pending,
            "revenue_by_firm": revenue_by_firm,
            "revenue_by_agent": revenue_by_agent,
        }
