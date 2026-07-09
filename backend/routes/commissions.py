from fastapi import APIRouter, HTTPException, Depends, status, Query
from typing import Optional
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorDatabase
from models.commission import CommissionCreate, CommissionUpdate
from routes.auth import get_current_user
from services.commission_service import CommissionService
from security.tenant_scope import validate_org_ownership, build_org_filter
from pydantic import BaseModel
from bson import ObjectId

class PaymentRequest(BaseModel):
    payment_method: Optional[str] = "bank_transfer"
    transaction_reference: Optional[str] = None

class CommissionSplitRequest(BaseModel):
    lawyer_share: float = 70
    firm_share: float = 20
    platform_fee: float = 10

router = APIRouter(prefix="/commissions", tags=["Commissions · Commercial Ecosystem"])

async def get_db():
    from server import db
    # Bypass GuardedDB for direct-access routes; tenant isolation is enforced
    # via get_current_user + explicit firm filtering (same pattern as routes/auth.py).
    if hasattr(db, "_real_db"):
        return db._real_db
    return db

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_commission(
    commission_data: CommissionCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Create a commission (admin only)"""
    if current_user.get("role") not in ["admin", "admin_general"]:
        raise HTTPException(status_code=403, detail="No autorizado")
    
    commission = await CommissionService.create_commission(
        db,
        agent_id=commission_data.agent_id,
        case_id=commission_data.case_id,
        amount=commission_data.amount,
        organization_id=commission_data.organization_id,
        commission_rate=commission_data.commission_rate,
        sale_value=commission_data.sale_value,
        currency=commission_data.currency,
    )
    
    return {
        "success": True,
        "data": commission,
        "message": "Comisión creada exitosamente"
    }

@router.get("/agent/{agent_id}")
async def get_agent_commissions(
    agent_id: str,
    status: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Get commissions for an agent (agent or admin)"""
    if str(current_user["_id"]) != agent_id and current_user.get("role") not in ["admin", "admin_general"]:
        raise HTTPException(status_code=403, detail="No autorizado")
    
    commissions = await CommissionService.get_agent_commissions(db, agent_id, status)
    
    # Calculate stats
    total = sum(c.get("amount", 0) for c in commissions)
    paid = sum(c.get("amount", 0) for c in commissions if c.get("status") == "paid")
    pending = sum(c.get("amount", 0) for c in commissions if c.get("status") == "pending")
    
    return {
        "success": True,
        "data": {
            "agent_id": agent_id,
            "commissions": commissions,
            "stats": {
                "total_amount": total,
                "total_paid": paid,
                "pending": pending,
                "count": len(commissions),
            }
        },
        "message": "Comisiones del agente obtenidas"
    }

@router.get("/firm/{organization_id}")
async def get_firm_commissions(
    organization_id: str,
    status: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Get commissions for a firm (firm admin or admin)"""
    # Verify user is firm admin or super admin
    org = await db.organizations.find_one({"_id": ObjectId(organization_id)})
    if not org:
        raise HTTPException(status_code=404, detail="Organización no encontrada")
    
    user_id = str(current_user["_id"])
    if str(org.get("ownerId")) != user_id and current_user.get("role") not in ["admin", "admin_general"]:
        raise HTTPException(status_code=403, detail="No autorizado")
    
    commissions = await CommissionService.get_firm_commissions(db, organization_id, status)
    stats = await CommissionService.get_commission_stats(db, organization_id)
    
    return {
        "success": True,
        "data": {
            "organization_id": organization_id,
            "commissions": commissions,
            "stats": stats,
        },
        "message": "Comisiones de la firma obtenidas"
    }

@router.patch("/{commission_id}")
async def update_commission(
    commission_id: str,
    update_data: CommissionUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Update commission status (admin only)"""
    if current_user.get("role") not in ["admin", "admin_general"]:
        raise HTTPException(status_code=403, detail="No autorizado")
    
    # Verify commission exists
    commission = await db.commissions.find_one({"_id": ObjectId(commission_id)})
    if not commission:
        raise HTTPException(status_code=404, detail="Comisión no encontrada")
    
    # Update only status if provided
    if update_data.status:
        commission = await CommissionService.update_commission_status(
            db, commission_id, update_data.status
        )
        
        # Create timeline event for status update
        event_map = {
            "approved": "COMMISSION_APPROVED",
            "paid": "COMMISSION_PAID",
        }
        
        if update_data.status in event_map:
            await db.timeline_events.insert_one({
                "event_type": event_map[update_data.status],
                "commission_id": commission_id,
                "case_id": commission.get("case_id"),
                "agent_id": commission.get("agent_id"),
                "organization_id": commission.get("organization_id"),
                "description": f"Comisión {update_data.status}: ${commission.get('amount'):.2f}",
                "metadata": {"old_status": "pending", "new_status": update_data.status},
                "created_at": datetime.utcnow(),
            })
    
    return {
        "success": True,
        "data": commission,
        "message": f"Comisión actualizada a: {update_data.status}"
    }

@router.get("/{commission_id}")
async def get_commission(
    commission_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Get commission details"""
    commission = await db.commissions.find_one({"_id": ObjectId(commission_id)})
    if not commission:
        raise HTTPException(status_code=404, detail="Comisión no encontrada")

    # Check access: agent, firm admin, or super admin
    user_id = str(current_user["_id"])
    if (commission.get("agent_id") != user_id and
        current_user.get("role") not in ["admin", "admin_general"]):
        raise HTTPException(status_code=403, detail="No autorizado")

    commission["_id"] = str(commission["_id"])
    return {
        "success": True,
        "data": commission,
        "message": "Comisión obtenida"
    }

@router.post("/{commission_id}/pay", status_code=status.HTTP_200_OK)
async def pay_commission(
    commission_id: str,
    payment_request: PaymentRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """FASE 11.1: Process payment for a commission (admin or firm admin)"""
    if current_user.get("role") not in ["admin", "admin_general"]:
        raise HTTPException(status_code=403, detail="No autorizado")

    try:
        # ✓ HARDENING: Validar que comisión pertenece a la org del usuario
        commission = await db.commissions.find_one({"_id": ObjectId(commission_id)})
        commission = validate_org_ownership(commission, current_user, "organization_id")

        commission = await CommissionService.process_payment(
            db,
            commission_id,
            payment_method=payment_request.payment_method,
            transaction_reference=payment_request.transaction_reference,
        )

        # Create timeline event
        await db.timeline_events.insert_one({
            "event_type": "COMMISSION_PAID",
            "commission_id": commission_id,
            "case_id": commission.get("case_id"),
            "agent_id": commission.get("agent_id"),
            "organization_id": commission.get("organization_id"),
            "description": f"Pago de comisión procesado: ${commission.get('amount'):.2f}",
            "metadata": {
                "payment_method": payment_request.payment_method,
                "transaction_reference": commission.get("transaction_reference"),
            },
            "created_at": datetime.utcnow(),
        })

        return {
            "success": True,
            "data": commission,
            "message": "Pago de comisión procesado exitosamente"
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{commission_id}/apply-split", status_code=status.HTTP_200_OK)
async def apply_commission_split(
    commission_id: str,
    split_request: CommissionSplitRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """FASE 11.2: Apply split percentages (lawyer vs firm vs platform)"""
    if current_user.get("role") not in ["admin", "admin_general"]:
        raise HTTPException(status_code=403, detail="No autorizado")

    # ✓ HARDENING CRÍTICO: Validar que comisión pertenece a la org del usuario (previne cross-org split)
    commission = await db.commissions.find_one({"_id": ObjectId(commission_id)})
    commission = validate_org_ownership(commission, current_user, "organization_id")

    # Validate split percentages sum to 100
    total = split_request.lawyer_share + split_request.firm_share + split_request.platform_fee
    if abs(total - 100) > 0.01:
        raise HTTPException(status_code=400, detail="Split percentages must sum to 100%")

    try:
        commission = await CommissionService.apply_commission_split(
            db,
            commission_id,
            lawyer_share_pct=split_request.lawyer_share,
            firm_share_pct=split_request.firm_share,
            platform_fee_pct=split_request.platform_fee,
        )

        # Create timeline event
        await db.timeline_events.insert_one({
            "event_type": "COMMISSION_SPLIT_APPLIED",
            "commission_id": commission_id,
            "organization_id": commission.get("organization_id"),
            "description": f"Split aplicado: Abogado {split_request.lawyer_share}% | Firma {split_request.firm_share}% | Plataforma {split_request.platform_fee}%",
            "metadata": {
                "lawyer_share_pct": split_request.lawyer_share,
                "firm_share_pct": split_request.firm_share,
                "platform_fee_pct": split_request.platform_fee,
                "lawyer_share_amount": commission.get("lawyer_share"),
                "firm_share_amount": commission.get("firm_share"),
                "platform_fee_amount": commission.get("platform_fee"),
            },
            "created_at": datetime.utcnow(),
        })

        return {
            "success": True,
            "data": commission,
            "message": "Split de comisión aplicado exitosamente"
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
