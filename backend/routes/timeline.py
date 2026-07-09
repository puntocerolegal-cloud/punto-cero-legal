from fastapi import APIRouter, Depends, Query
from typing import Optional
from motor.motor_asyncio import AsyncIOMotorDatabase
from routes.auth import get_current_user
from bson import ObjectId

router = APIRouter(prefix="/timeline", tags=["Timeline · Commercial Ecosystem"])

async def get_db():
    from server import db
    # Bypass GuardedDB for direct-access routes; tenant isolation is enforced
    # via get_current_user + explicit firm filtering (same pattern as routes/auth.py).
    if hasattr(db, "_real_db"):
        return db._real_db
    return db

@router.get("/lead/{lead_id}")
async def get_lead_timeline(
    lead_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Get timeline events for a lead"""
    events = await db.timeline_events.find({
        "lead_id": lead_id
    }).sort("created_at", -1).to_list(None)
    
    for event in events:
        event["_id"] = str(event["_id"])
    
    return {
        "success": True,
        "data": events,
        "message": f"Eventos del lead obtenidos ({len(events)} total)"
    }

@router.get("/case/{case_id}")
async def get_case_timeline(
    case_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Get timeline events for a case"""
    events = await db.timeline_events.find({
        "case_id": case_id
    }).sort("created_at", -1).to_list(None)
    
    for event in events:
        event["_id"] = str(event["_id"])
    
    return {
        "success": True,
        "data": events,
        "message": f"Eventos del caso obtenidos ({len(events)} total)"
    }

@router.get("/commission/{commission_id}")
async def get_commission_timeline(
    commission_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Get timeline events for a commission"""
    events = await db.timeline_events.find({
        "commission_id": commission_id
    }).sort("created_at", -1).to_list(None)
    
    for event in events:
        event["_id"] = str(event["_id"])
    
    return {
        "success": True,
        "data": events,
        "message": f"Eventos de la comisión obtenidos ({len(events)} total)"
    }

@router.get("/agent/{agent_id}")
async def get_agent_timeline(
    agent_id: str,
    limit: int = Query(100, ge=1, le=1000),
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Get timeline events for an agent's activities"""
    # Check access
    if str(current_user["_id"]) != agent_id and current_user.get("role") not in ["admin", "admin_general"]:
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="No autorizado")
    
    events = await db.timeline_events.find({
        "agent_id": agent_id
    }).sort("created_at", -1).limit(limit).to_list(limit)
    
    for event in events:
        event["_id"] = str(event["_id"])
    
    return {
        "success": True,
        "data": events,
        "message": f"Eventos del agente obtenidos ({len(events)} total)"
    }

@router.get("/firm/{organization_id}")
async def get_firm_timeline(
    organization_id: str,
    limit: int = Query(100, ge=1, le=1000),
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Get timeline events for a firm"""
    # Check access
    org = await db.organizations.find_one({"_id": ObjectId(organization_id)})
    if not org:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Organización no encontrada")
    
    user_id = str(current_user["_id"])
    if str(org.get("ownerId")) != user_id and current_user.get("role") not in ["admin", "admin_general"]:
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="No autorizado")
    
    events = await db.timeline_events.find({
        "organization_id": organization_id
    }).sort("created_at", -1).limit(limit).to_list(limit)
    
    for event in events:
        event["_id"] = str(event["_id"])
    
    return {
        "success": True,
        "data": events,
        "message": f"Eventos de la firma obtenidos ({len(events)} total)"
    }

@router.get("")
async def get_global_timeline(
    event_type: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Get recent timeline events (admin only)"""
    if current_user.get("role") not in ["admin", "admin_general"]:
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Solo admins pueden ver el timeline global")
    
    query = {}
    if event_type:
        query["event_type"] = event_type
    
    events = await db.timeline_events.find(query).sort("created_at", -1).limit(limit).to_list(limit)
    
    for event in events:
        event["_id"] = str(event["_id"])
    
    return {
        "success": True,
        "data": events,
        "message": f"Eventos globales obtenidos ({len(events)} total)"
    }
