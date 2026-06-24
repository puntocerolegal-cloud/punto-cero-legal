from fastapi import APIRouter, HTTPException, Depends, status
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorDatabase
from routes.auth import get_current_user
from services.autonomous_decision_engine import (
    AutonomousDecisionEngine,
    AutonomousRoutingSystem,
    AutonomousRevenueEngine
)
from services.autonomous_system_orchestrator import (
    AutonomousFirmsBalancer,
    GlobalSystemOrchestrator,
    AutonomousSelfHealingSystem
)
from services.autonomous_orchestrator import AutonomousOrchestrator, DecisionType
from bson import ObjectId

router = APIRouter(prefix="/autonomous", tags=["Autonomous · Self-Operating System"])

async def get_db():
    from server import db
    return db

# FASE 13.1: Autonomous Decision Engine
@router.post("/decision-engine/run", status_code=status.HTTP_200_OK)
async def run_autonomous_decisions(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """FASE 13.1: Run autonomous decision cycle"""
    if current_user.get("role") not in ["admin"]:
        raise HTTPException(status_code=403, detail="No autorizado")
    
    try:
        result = await AutonomousDecisionEngine.run_decision_cycle(db)
        
        # Log each action to timeline
        for action in result.get("actions", []):
            await db.timeline_events.insert_one({
                "event_type": action["type"],
                "lead_id": action.get("lead_id"),
                "case_id": action.get("case_id"),
                "lawyer_id": action.get("lawyer_id"),
                "organization_id": action.get("organization_id"),
                "description": f"Autonomous: {action.get('reason', '')}",
                "metadata": action,
                "created_at": datetime.utcnow(),
                "autonomous": True,
            })
        
        return {
            "success": True,
            "data": result,
            "message": "Autonomous decision cycle executed"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# FASE 13.2: Autonomous Routing
@router.post("/route", status_code=status.HTTP_200_OK)
async def autonomous_route(
    lead_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """FASE 13.2: Autonomously route a lead via centralized orchestrator"""
    try:
        lead = await db.leads.find_one({"_id": ObjectId(lead_id)})
        if not lead:
            raise HTTPException(status_code=404, detail="Lead no encontrado")

        result = await AutonomousOrchestrator.execute(
            db,
            DecisionType.ROUTE_LEAD,
            lead,
            context={"organization_id": lead.get("organization_id")}
        )

        if not result.get("success"):
            raise HTTPException(status_code=400, detail=result.get("error", "Routing failed"))

        return {
            "success": True,
            "data": result.get("changes", {}),
            "message": "Lead routed autonomously"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# FASE 13.3: Autonomous Revenue Optimization
@router.get("/revenue-engine/{org_id}", status_code=status.HTTP_200_OK)
async def optimize_revenue_autonomous(
    org_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """FASE 13.3: Autonomously optimize revenue"""
    try:
        result = await AutonomousRevenueEngine.optimize_revenue_autonomous(db, org_id)
        
        # Log actions
        for action in result.get("optimized_flow", []):
            await db.timeline_events.insert_one({
                "event_type": "AUTONOMOUS_OPTIMIZATION_APPLIED",
                "organization_id": org_id,
                "lead_id": action.get("lead_id"),
                "case_id": action.get("case_id"),
                "description": f"Revenue optimization: {action.get('action')}",
                "metadata": action,
                "created_at": datetime.utcnow(),
                "autonomous": True,
            })
        
        return {
            "success": True,
            "data": result,
            "message": "Revenue optimization executed"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# FASE 13.4: Autonomous Firms Balancer via Orchestrator
@router.post("/balance-firms", status_code=status.HTTP_200_OK)
async def balance_firms_autonomous(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """FASE 13.4: Balance load across all firms via centralized orchestrator"""
    if current_user.get("role") not in ["admin"]:
        raise HTTPException(status_code=403, detail="No autorizado")

    try:
        result = await AutonomousOrchestrator.execute(
            db,
            DecisionType.BALANCE_FIRMS,
            {},
            context={"global": True}
        )

        if not result.get("success"):
            raise HTTPException(status_code=400, detail=result.get("error", "Balancing failed"))

        return {
            "success": True,
            "data": result,
            "message": "Firms balanced via orchestrator"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# FASE 13.5: Global System Orchestrator
@router.get("/global-orchestrator", status_code=status.HTTP_200_OK)
async def global_orchestrator(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """FASE 13.5: Get global system orchestration status"""
    try:
        result = await GlobalSystemOrchestrator.orchestrate_global_system(db)
        
        return {
            "success": True,
            "data": result,
            "message": "Global orchestration status"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# FASE 13.6: Self-Healing System
@router.post("/self-heal", status_code=status.HTTP_200_OK)
async def trigger_self_healing(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """FASE 13.6: Trigger autonomous self-healing"""
    if current_user.get("role") not in ["admin"]:
        raise HTTPException(status_code=403, detail="No autorizado")
    
    try:
        result = await AutonomousSelfHealingSystem.self_heal(db)
        
        # Log actions
        for action in result.get("healing_actions", []):
            await db.timeline_events.insert_one({
                "event_type": "AUTONOMOUS_SELF_HEAL_TRIGGERED",
                "lead_id": action.get("lead_id"),
                "case_id": action.get("case_id"),
                "lawyer_id": action.get("lawyer_id"),
                "organization_id": action.get("organization_id"),
                "description": f"Self-healing: {action.get('type')}",
                "metadata": action,
                "created_at": datetime.utcnow(),
                "autonomous": True,
            })
        
        return {
            "success": True,
            "data": result,
            "message": "Self-healing cycle executed"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# FASE 13.7: Full Autonomous Loop Status
@router.get("/loop-status", status_code=status.HTTP_200_OK)
async def autonomous_loop_status(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """FASE 13.7: Get status of real-time autonomous loop"""
    try:
        # Get recent autonomous events
        recent_events = await db.timeline_events.find({
            "autonomous": True,
            "created_at": {"$gte": datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)}
        }).sort("created_at", -1).limit(50).to_list(None)
        
        # Count by type
        event_counts = {}
        for event in recent_events:
            event_type = event.get("event_type")
            event_counts[event_type] = event_counts.get(event_type, 0) + 1
        
        return {
            "success": True,
            "data": {
                "loop_status": "ACTIVE",
                "cycle_timestamp": datetime.utcnow(),
                "recent_events_count": len(recent_events),
                "events_by_type": event_counts,
                "recent_actions": [
                    {
                        "type": e.get("event_type"),
                        "timestamp": e.get("created_at"),
                        "description": e.get("description"),
                    }
                    for e in recent_events[:10]
                ],
            },
            "message": "Autonomous loop operational"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
