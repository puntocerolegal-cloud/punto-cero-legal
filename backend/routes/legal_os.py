from fastapi import APIRouter, HTTPException, Depends, status
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorDatabase
from routes.auth import get_current_user
from services.legal_os_core import LegalOSCore, EventDrivenEngine, SelfOptimizingLoop
from services.legal_os_engines import (
    AutonomousEconomicEngine,
    GlobalLegalBrain,
    ZeroAdminMode,
    GlobalPerformanceOptimizer,
    AutonomousFinancialCycle,
    SystemSelfHealingCore,
    GlobalDigitalTwin,
)

router = APIRouter(prefix="/legal-os", tags=["Legal OS · Final Form"])

async def get_db():
    from server import db
    return db

# FASE 15.1–15.3: Core OS Cycle
@router.post("/cycle/run", status_code=status.HTTP_200_OK)
async def run_os_cycle(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """FASE 15.1–15.3: Run complete OS cycle (capture → analyze → decide → execute → measure → adjust)"""
    if current_user.get("role") not in ["admin"]:
        raise HTTPException(status_code=403, detail="No autorizado")
    
    try:
        result = await LegalOSCore.initialize_os_cycle(db)
        
        # Log to timeline
        await db.timeline_events.insert_one({
            "event_type": "LEGAL_OS_CYCLE_EXECUTED",
            "description": f"OS Cycle {result['cycle_id']}: {result['phases']['measure']['success_rate']:.1f}% success",
            "metadata": {"cycle_id": result["cycle_id"], "duration": result["duration_seconds"]},
            "created_at": datetime.utcnow(),
        })
        
        return {
            "success": True,
            "data": result,
            "message": "Ciclo del OS ejecutado exitosamente"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# FASE 15.2: Event-Driven System
@router.post("/event/trigger", status_code=status.HTTP_200_OK)
async def trigger_event_cascade(
    event_type: str,
    entity_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """FASE 15.2: Trigger event cascade — every event automatically triggers actions"""
    try:
        result = await EventDrivenEngine.trigger_event_cascade(db, event_type, {"id": entity_id})
        
        # Log event
        await db.timeline_events.insert_one({
            "event_type": "EVENT_CASCADE_TRIGGERED",
            "metadata": {"original_event": event_type, "entity_id": entity_id},
            "created_at": datetime.utcnow(),
        })
        
        return {
            "success": True,
            "data": result,
            "message": "Cascada de eventos ejecutada"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# FASE 15.4: Economic Engine
@router.get("/economic/predict/{org_id}", status_code=status.HTTP_200_OK)
async def predict_revenue(
    org_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """FASE 15.4: Predict revenue cycle for next 90 days"""
    try:
        prediction = await AutonomousEconomicEngine.predict_revenue_cycle(db, org_id)
        
        return {
            "success": True,
            "data": prediction,
            "message": "Predicción de ingresos"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# FASE 15.5: Global Legal Brain
@router.get("/brain/intelligence", status_code=status.HTTP_200_OK)
async def get_system_intelligence(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """FASE 15.5: Get accumulated system intelligence"""
    try:
        intelligence = await GlobalLegalBrain.get_system_intelligence(db)
        
        return {
            "success": True,
            "data": intelligence,
            "message": "Inteligencia global del sistema"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# FASE 15.6: Zero-Admin Mode
@router.post("/mode/zero-admin", status_code=status.HTTP_200_OK)
async def enable_zero_admin(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """FASE 15.6: Enable zero-admin mode — fully autonomous operation"""
    if current_user.get("role") not in ["admin"]:
        raise HTTPException(status_code=403, detail="No autorizado")
    
    try:
        result = await ZeroAdminMode.enable_zero_admin_mode(db)
        
        await db.timeline_events.insert_one({
            "event_type": "ZERO_ADMIN_MODE_ENABLED",
            "description": "Sistema operando en modo completamente autónomo",
            "created_at": datetime.utcnow(),
        })
        
        return {
            "success": True,
            "data": result,
            "message": "Modo Zero-Admin activado"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# FASE 15.7: Performance Optimizer
@router.post("/optimize/global-performance", status_code=status.HTTP_200_OK)
async def optimize_performance(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """FASE 15.7: Execute global performance optimization"""
    if current_user.get("role") not in ["admin"]:
        raise HTTPException(status_code=403, detail="No autorizado")
    
    try:
        result = await GlobalPerformanceOptimizer.optimize_global_performance(db)
        
        return {
            "success": True,
            "data": result,
            "message": "Optimización global ejecutada"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# FASE 15.8: Financial Cycle
@router.post("/financial/complete-cycle/{lead_id}", status_code=status.HTTP_200_OK)
async def complete_financial_cycle(
    lead_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """FASE 15.8: Execute complete autonomous financial cycle"""
    try:
        from bson import ObjectId
        result = await AutonomousFinancialCycle.complete_financial_cycle(db, ObjectId(lead_id))
        
        return {
            "success": True,
            "data": result,
            "message": "Ciclo financiero completado"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# FASE 15.9: Self-Healing
@router.post("/heal/execute", status_code=status.HTTP_200_OK)
async def execute_healing(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """FASE 15.9: Execute system self-healing cycle"""
    if current_user.get("role") not in ["admin"]:
        raise HTTPException(status_code=403, detail="No autorizado")
    
    try:
        result = await SystemSelfHealingCore.execute_system_healing(db)
        
        await db.timeline_events.insert_one({
            "event_type": "SYSTEM_SELF_HEALING_EXECUTED",
            "metadata": {"issues_detected": result["issues_detected"]},
            "created_at": datetime.utcnow(),
        })
        
        return {
            "success": True,
            "data": result,
            "message": "Auto-corrección del sistema ejecutada"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# FASE 15.10: Digital Twin
@router.get("/digital-twin/snapshot", status_code=status.HTTP_200_OK)
async def create_snapshot(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """FASE 15.10: Create digital twin snapshot of entire system"""
    try:
        snapshot = await GlobalDigitalTwin.create_system_snapshot(db)
        
        return {
            "success": True,
            "data": snapshot,
            "message": "Snapshot del gemelo digital"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/digital-twin/simulate", status_code=status.HTTP_200_OK)
async def simulate_strategy(
    strategy: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """FASE 15.10: Simulate strategy before implementation"""
    try:
        simulation = await GlobalDigitalTwin.simulate_strategy(db, strategy)
        
        return {
            "success": True,
            "data": simulation,
            "message": "Simulación de estrategia"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# OS STATUS
@router.get("/status", status_code=status.HTTP_200_OK)
async def get_os_status(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Get complete Legal OS status"""
    try:
        # Check all system components
        leads = await db.leads.count_documents({})
        cases = await db.cases.count_documents({})
        users = await db.users.count_documents({})
        orgs = await db.organizations.count_documents({})
        
        return {
            "success": True,
            "data": {
                "os_status": "OPERATING_SYSTEM_ACTIVE",
                "mode": "FULLY_AUTONOMOUS",
                "system_components": {
                    "core_kernel": "ACTIVE",
                    "event_driven_engine": "ACTIVE",
                    "autonomous_optimizer": "ACTIVE",
                    "economic_engine": "ACTIVE",
                    "legal_brain": "ACTIVE",
                    "self_healing": "ACTIVE",
                    "digital_twin": "ACTIVE",
                },
                "system_health": {
                    "leads": leads,
                    "cases": cases,
                    "users": users,
                    "organizations": orgs,
                },
                "timestamp": datetime.utcnow(),
            },
            "message": "Legal Operating System en operación"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
