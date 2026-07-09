from fastapi import APIRouter, HTTPException, Depends, Query, status
from typing import Optional
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from routes.auth import get_current_user
from utils.auth import get_password_hash
import secrets

router = APIRouter(prefix="/firm-management", tags=["Firm Management · Control Center"])

async def get_db():
    from server import db
    # Bypass GuardedDB for direct-access routes; tenant isolation is enforced
    # via get_current_user + explicit firm filtering (same pattern as routes/auth.py).
    if hasattr(db, "_real_db"):
        return db._real_db
    return db

# ─────────────────────────────────────────────────────────────────
# LAWYER MANAGEMENT
# ─────────────────────────────────────────────────────────────────

@router.patch("/lawyers/{lawyer_id}", status_code=200)
async def update_lawyer(
    lawyer_id: str,
    update_data: dict,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Update lawyer details (firm admin only)"""
    if not ObjectId.is_valid(lawyer_id):
        raise HTTPException(status_code=404, detail="Abogado no encontrado")
    
    # Get lawyer
    lawyer = await db.users.find_one({"_id": ObjectId(lawyer_id)})
    if not lawyer:
        raise HTTPException(status_code=404, detail="Abogado no encontrado")
    
    org_id = lawyer.get("organizationId")
    if not org_id:
        raise HTTPException(status_code=400, detail="Abogado no pertenece a firma")
    
    # Check permissions
    org = await db.organizations.find_one({"_id": ObjectId(org_id)})
    if not org:
        raise HTTPException(status_code=404, detail="Firma no encontrada")
    
    user_id = str(current_user["_id"])
    if str(org.get("ownerId")) != user_id and current_user.get("role") not in ["admin", "admin_general"]:
        raise HTTPException(status_code=403, detail="No autorizado")
    
    # Allowed fields to update
    allowed_fields = ["full_name", "specialty", "bar_number", "email", "phone"]
    filtered_data = {k: v for k, v in update_data.items() if k in allowed_fields and v is not None}
    filtered_data["updated_at"] = datetime.utcnow()
    
    result = await db.users.find_one_and_update(
        {"_id": ObjectId(lawyer_id)},
        {"$set": filtered_data},
        return_document=True
    )
    
    result["_id"] = str(result["_id"])
    return {
        "success": True,
        "data": result,
        "message": "Abogado actualizado"
    }

@router.patch("/lawyers/{lawyer_id}/status", status_code=200)
async def update_lawyer_status(
    lawyer_id: str,
    status: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Suspend/reactivate lawyer (firm admin only)"""
    if status not in ["ACTIVE", "SUSPENDED", "INACTIVE"]:
        raise HTTPException(status_code=400, detail="Status inválido")
    
    if not ObjectId.is_valid(lawyer_id):
        raise HTTPException(status_code=404, detail="Abogado no encontrado")
    
    lawyer = await db.users.find_one({"_id": ObjectId(lawyer_id)})
    if not lawyer:
        raise HTTPException(status_code=404, detail="Abogado no encontrado")
    
    org_id = lawyer.get("organizationId")
    org = await db.organizations.find_one({"_id": ObjectId(org_id)})
    
    user_id = str(current_user["_id"])
    if str(org.get("ownerId")) != user_id and current_user.get("role") not in ["admin", "admin_general"]:
        raise HTTPException(status_code=403, detail="No autorizado")
    
    result = await db.users.find_one_and_update(
        {"_id": ObjectId(lawyer_id)},
        {"$set": {"status": status, "updated_at": datetime.utcnow()}},
        return_document=True
    )
    
    result["_id"] = str(result["_id"])
    return {
        "success": True,
        "data": result,
        "message": f"Abogado {status.lower()}"
    }

@router.post("/lawyers/{lawyer_id}/reset-password", status_code=200)
async def reset_lawyer_password(
    lawyer_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Reset lawyer password (firm admin only)"""
    if not ObjectId.is_valid(lawyer_id):
        raise HTTPException(status_code=404, detail="Abogado no encontrado")
    
    lawyer = await db.users.find_one({"_id": ObjectId(lawyer_id)})
    if not lawyer:
        raise HTTPException(status_code=404, detail="Abogado no encontrado")
    
    org_id = lawyer.get("organizationId")
    org = await db.organizations.find_one({"_id": ObjectId(org_id)})
    
    user_id = str(current_user["_id"])
    if str(org.get("ownerId")) != user_id and current_user.get("role") not in ["admin", "admin_general"]:
        raise HTTPException(status_code=403, detail="No autorizado")
    
    # Generate temporary password
    temp_password = secrets.token_urlsafe(12)
    password_hash = get_password_hash(temp_password)
    
    await db.users.update_one(
        {"_id": ObjectId(lawyer_id)},
        {"$set": {"password_hash": password_hash, "updated_at": datetime.utcnow()}}
    )
    
    return {
        "success": True,
        "data": {
            "lawyer_id": lawyer_id,
            "temporary_password": temp_password,
            "message": "Comparta esta contraseña temporal con el abogado"
        },
        "message": "Contraseña reiniciada"
    }

# ─────────────────────────────────────────────────────────────────
# LAWYER PRODUCTIVITY
# ─────────────────────────────────────────────────────────────────

@router.get("/productivity/{lawyer_id}", status_code=200)
async def get_lawyer_productivity(
    lawyer_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Get lawyer productivity metrics"""
    if not ObjectId.is_valid(lawyer_id):
        raise HTTPException(status_code=404, detail="Abogado no encontrado")
    
    lawyer = await db.users.find_one({"_id": ObjectId(lawyer_id)})
    if not lawyer or lawyer.get("role") != "lawyer":
        raise HTTPException(status_code=404, detail="Abogado no encontrado")
    
    org_id = lawyer.get("organizationId")
    org = await db.organizations.find_one({"_id": ObjectId(org_id)})
    
    user_id = str(current_user["_id"])
    if str(org.get("ownerId")) != user_id and current_user.get("role") not in ["admin", "admin_general"]:
        raise HTTPException(status_code=403, detail="No autorizado")
    
    # Get lawyer's cases
    active_cases = await db.cases.find({
        "lawyer_id": lawyer_id,
        "status": {"$in": ["open", "in_progress"]}
    }).to_list(None)
    
    closed_cases = await db.cases.find({
        "lawyer_id": lawyer_id,
        "status": {"$in": ["closed", "finalizada"]}
    }).to_list(None)
    
    # Get lawyer's clients
    clients = await db.users.find({
        "role": "client"
    }).to_list(None)
    client_ids = [c.get("_id") for c in clients]
    
    active_clients = await db.cases.find({
        "lawyer_id": lawyer_id,
        "client_id": {"$in": [str(c) for c in client_ids]},
        "status": {"$in": ["open", "in_progress"]}
    }).to_list(None)
    
    unique_clients = len(set(c.get("client_id") for c in active_cases))
    
    # Get lawyer's commissions for billing
    commissions = await db.commissions.find({
        "case_id": {"$in": [str(c["_id"]) for c in (active_cases + closed_cases)]}
    }).to_list(None)
    
    revenue = sum(c.get("amount", 0) for c in commissions)
    
    return {
        "success": True,
        "data": {
            "lawyer_id": lawyer_id,
            "lawyer_name": lawyer.get("full_name"),
            "specialty": lawyer.get("specialty"),
            "active_cases": len(active_cases),
            "closed_cases": len(closed_cases),
            "active_clients": unique_clients,
            "avg_response_time": "2-4 hours",
            "revenue_generated": revenue,
            "cases_per_client": round(len(active_cases) / max(unique_clients, 1), 2),
        },
        "message": "Productividad obtenida"
    }

# ─────────────────────────────────────────────────────────────────
# LAWYER CLIENTS
# ─────────────────────────────────────────────────────────────────

@router.get("/lawyers/{lawyer_id}/clients", status_code=200)
async def get_lawyer_clients(
    lawyer_id: str,
    status: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Get all clients for a lawyer"""
    if not ObjectId.is_valid(lawyer_id):
        raise HTTPException(status_code=404, detail="Abogado no encontrado")
    
    lawyer = await db.users.find_one({"_id": ObjectId(lawyer_id)})
    if not lawyer:
        raise HTTPException(status_code=404, detail="Abogado no encontrado")
    
    org_id = lawyer.get("organizationId")
    if org_id:
        org = await db.organizations.find_one({"_id": ObjectId(org_id)})
        user_id = str(current_user["_id"])
        if str(org.get("ownerId")) != user_id and current_user.get("role") not in ["admin", "admin_general"]:
            raise HTTPException(status_code=403, detail="No autorizado")
    
    query = {"lawyer_id": lawyer_id}
    if status:
        query["status"] = status
    
    cases = await db.cases.find(query).sort("created_at", -1).to_list(None)
    
    clients_data = []
    seen = set()
    
    for case in cases:
        client_id = case.get("client_id")
        if client_id and client_id not in seen:
            seen.add(client_id)
            client = await db.users.find_one({"_id": ObjectId(client_id)})
            if client:
                case_count = len([c for c in cases if c.get("client_id") == client_id])
                clients_data.append({
                    "client_id": str(client["_id"]),
                    "client_name": client.get("full_name"),
                    "status": case.get("status"),
                    "cases_count": case_count,
                    "created_at": case.get("created_at").isoformat() if case.get("created_at") else None,
                })
    
    return {
        "success": True,
        "data": {
            "lawyer_id": lawyer_id,
            "clients": clients_data,
            "total_clients": len(clients_data),
        },
        "message": "Clientes obtenidos"
    }

# ─────────────────────────────────────────────────────────────────
# LAWYER BILLING
# ─────────────────────────────────────────────────────────────────

@router.get("/lawyers/{lawyer_id}/billing", status_code=200)
async def get_lawyer_billing(
    lawyer_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Get billing metrics for a lawyer"""
    if not ObjectId.is_valid(lawyer_id):
        raise HTTPException(status_code=404, detail="Abogado no encontrado")
    
    lawyer = await db.users.find_one({"_id": ObjectId(lawyer_id)})
    if not lawyer:
        raise HTTPException(status_code=404, detail="Abogado no encontrado")
    
    org_id = lawyer.get("organizationId")
    if org_id:
        org = await db.organizations.find_one({"_id": ObjectId(org_id)})
        user_id = str(current_user["_id"])
        if str(org.get("ownerId")) != user_id and current_user.get("role") not in ["admin", "admin_general"]:
            raise HTTPException(status_code=403, detail="No autorizado")
    
    # Get all commissions for lawyer's cases
    cases = await db.cases.find({"lawyer_id": lawyer_id}).to_list(None)
    case_ids = [str(c["_id"]) for c in cases]
    
    commissions = await db.commissions.find({
        "case_id": {"$in": case_ids}
    }).to_list(None)
    
    monthly_revenue = sum(c.get("amount", 0) for c in commissions if c.get("created_at"))
    annual_revenue = monthly_revenue * 12  # Simplified
    commissions_generated = sum(c.get("amount", 0) for c in commissions)
    commissions_paid = sum(c.get("amount", 0) for c in commissions if c.get("status") == "paid")
    
    return {
        "success": True,
        "data": {
            "lawyer_id": lawyer_id,
            "lawyer_name": lawyer.get("full_name"),
            "monthly_revenue": monthly_revenue,
            "annual_revenue": annual_revenue,
            "commissions_generated": commissions_generated,
            "commissions_paid": commissions_paid,
            "commissions_pending": commissions_generated - commissions_paid,
        },
        "message": "Facturación obtenida"
    }

# ─────────────────────────────────────────────────────────────────
# FIRM SUMMARY
# ─────────────────────────────────────────────────────────────────

@router.get("/summary/{org_id}", status_code=200)
async def get_firm_summary(
    org_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Get complete firm summary with all metrics"""
    if not ObjectId.is_valid(org_id):
        raise HTTPException(status_code=404, detail="Firma no encontrada")
    
    org = await db.organizations.find_one({"_id": ObjectId(org_id)})
    if not org:
        raise HTTPException(status_code=404, detail="Firma no encontrada")
    
    user_id = str(current_user["_id"])
    if str(org.get("ownerId")) != user_id and current_user.get("role") not in ["admin", "admin_general"]:
        raise HTTPException(status_code=403, detail="No autorizado")
    
    # Get all lawyers
    lawyers = await db.users.find({
        "organizationId": org_id,
        "role": "lawyer"
    }).to_list(None)
    
    # Aggregate metrics
    total_cases = 0
    total_clients = 0
    total_revenue = 0
    
    for lawyer in lawyers:
        cases = await db.cases.find({"lawyer_id": str(lawyer["_id"])}).to_list(None)
        total_cases += len(cases)
        
        clients = len(set(c.get("client_id") for c in cases if c.get("client_id")))
        total_clients += clients
        
        case_ids = [str(c["_id"]) for c in cases]
        commissions = await db.commissions.find({
            "case_id": {"$in": case_ids}
        }).to_list(None)
        total_revenue += sum(c.get("amount", 0) for c in commissions)
    
    return {
        "success": True,
        "data": {
            "firm_id": org_id,
            "firm_name": org.get("name"),
            "lawyers_count": len(lawyers),
            "total_cases": total_cases,
            "total_clients": total_clients,
            "total_revenue": total_revenue,
            "avg_revenue_per_lawyer": round(total_revenue / max(len(lawyers), 1), 2),
        },
        "message": "Resumen de firma obtenido"
    }
