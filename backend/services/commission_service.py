from motor.motor_asyncio import AsyncIOMotorDatabase
from models.commission import CommissionCreate, CommissionUpdate
from datetime import datetime
from bson import ObjectId
from typing import Optional

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
    ) -> dict:
        """Create a commission for an agent when a lead converts to a case."""
        commission = {
            "agent_id": agent_id,
            "case_id": case_id,
            "organization_id": organization_id,
            "amount": amount,
            "currency": currency,
            "status": "pending",
            "commission_rate": commission_rate,
            "sale_value": sale_value,
            "created_at": datetime.utcnow(),
            "approved_at": None,
            "paid_at": None,
            "updated_at": datetime.utcnow(),
        }
        
        result = await db.commissions.insert_one(commission)
        commission["_id"] = str(result.inserted_id)
        return commission

    @staticmethod
    async def get_agent_commissions(
        db: AsyncIOMotorDatabase,
        agent_id: str,
        status: Optional[str] = None,
    ) -> list:
        """Get all commissions for an agent."""
        query = {"agent_id": agent_id}
        if status:
            query["status"] = status
        
        commissions = await db.commissions.find(query).sort("created_at", -1).to_list(None)
        for c in commissions:
            c["_id"] = str(c["_id"])
        return commissions

    @staticmethod
    async def get_firm_commissions(
        db: AsyncIOMotorDatabase,
        organization_id: str,
        status: Optional[str] = None,
    ) -> list:
        """Get all commissions for a firm."""
        query = {"organization_id": organization_id}
        if status:
            query["status"] = status
        
        commissions = await db.commissions.find(query).sort("created_at", -1).to_list(None)
        for c in commissions:
            c["_id"] = str(c["_id"])
        return commissions

    @staticmethod
    async def update_commission_status(
        db: AsyncIOMotorDatabase,
        commission_id: str,
        status: str,
    ) -> dict:
        """Update commission status (pending → approved → paid)."""
        update_data = {
            "status": status,
            "updated_at": datetime.utcnow(),
        }
        
        if status == "approved":
            update_data["approved_at"] = datetime.utcnow()
        elif status == "paid":
            update_data["paid_at"] = datetime.utcnow()
        
        result = await db.commissions.find_one_and_update(
            {"_id": ObjectId(commission_id)},
            {"$set": update_data},
            return_document=True
        )
        
        if result:
            result["_id"] = str(result["_id"])
        return result

    @staticmethod
    async def get_commission_stats(
        db: AsyncIOMotorDatabase,
        organization_id: str,
    ) -> dict:
        """Get commission statistics for a firm."""
        commissions = await db.commissions.find({
            "organization_id": organization_id
        }).to_list(None)

        total_generated = sum(c.get("amount", 0) for c in commissions)
        total_approved = sum(c.get("amount", 0) for c in commissions if c.get("status") in ["approved", "paid"])
        total_paid = sum(c.get("amount", 0) for c in commissions if c.get("status") == "paid")
        pending = sum(c.get("amount", 0) for c in commissions if c.get("status") == "pending")

        return {
            "total_generated": total_generated,
            "total_approved": total_approved,
            "total_paid": total_paid,
            "pending": pending,
            "count": len(commissions),
        }

    @staticmethod
    async def apply_commission_split(
        db: AsyncIOMotorDatabase,
        commission_id: str,
        lawyer_share_pct: float = 70,
        firm_share_pct: float = 20,
        platform_fee_pct: float = 10,
    ) -> dict:
        """FASE 11.2: Apply split (lawyer vs firm vs platform) to a commission."""
        commission = await db.commissions.find_one({"_id": ObjectId(commission_id)})
        if not commission:
            raise ValueError("Commission not found")

        total = commission.get("amount", 0)

        lawyer_share = (total * lawyer_share_pct) / 100
        firm_share = (total * firm_share_pct) / 100
        platform_fee = (total * platform_fee_pct) / 100

        update_data = {
            "lawyer_share": lawyer_share,
            "firm_share": firm_share,
            "platform_fee": platform_fee,
            "updated_at": datetime.utcnow(),
        }

        result = await db.commissions.find_one_and_update(
            {"_id": ObjectId(commission_id)},
            {"$set": update_data},
            return_document=True
        )

        if result:
            result["_id"] = str(result["_id"])
        return result

    @staticmethod
    async def process_payment(
        db: AsyncIOMotorDatabase,
        commission_id: str,
        payment_method: str = "bank_transfer",
        transaction_reference: Optional[str] = None,
    ) -> dict:
        """FASE 11.1: Process payment for a commission."""
        commission = await db.commissions.find_one({"_id": ObjectId(commission_id)})
        if not commission:
            raise ValueError("Commission not found")

        if commission.get("status") == "paid":
            raise ValueError("Commission already paid")

        if commission.get("status") not in ["pending", "approved"]:
            raise ValueError("Commission cannot be paid in current status")

        update_data = {
            "status": "paid",
            "paid_at": datetime.utcnow(),
            "payment_method": payment_method,
            "transaction_reference": transaction_reference or f"TXN-{commission_id[:12]}-{int(datetime.utcnow().timestamp())}",
            "updated_at": datetime.utcnow(),
        }

        result = await db.commissions.find_one_and_update(
            {"_id": ObjectId(commission_id)},
            {"$set": update_data},
            return_document=True
        )

        if result:
            result["_id"] = str(result["_id"])
        return result
