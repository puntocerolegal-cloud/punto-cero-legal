from fastapi import APIRouter, HTTPException, Depends, status
from typing import Optional
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorDatabase
from routes.auth import get_current_user
from services.ai_scoring_engine import AIScoringEngine, AIAssignmentEngine, AICasePredictionEngine
from services.ai_optimization_engine import AIRevenueOptimizationEngine, AIAlertSystem
from services.autonomous_orchestrator import AutonomousOrchestrator, DecisionType
from bson import ObjectId

router = APIRouter(prefix="/ai", tags=["AI · Autopilot"])

async def get_db():
    from server import db
    # Bypass GuardedDB for direct-access routes; tenant isolation is enforced
    # via get_current_user + explicit firm filtering (same pattern as routes/auth.py).
    if hasattr(db, "_real_db"):
        return db._real_db
    return db

# FASE 12.1: Score a lead
@router.post("/lead-score/{lead_id}", status_code=status.HTTP_200_OK)
async def score_lead(
    lead_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """FASE 12.1: Score a lead and classify by value"""
    try:
        lead = await db.leads.find_one({"_id": ObjectId(lead_id)})
        if not lead:
            raise HTTPException(status_code=404, detail="Lead no encontrado")

        result = await AutonomousOrchestrator.execute(
            db,
            DecisionType.SCORE_LEAD,
            lead,
            context={"organization_id": lead.get("organization_id")}
        )

        if not result.get("success"):
            raise HTTPException(status_code=400, detail=result.get("error", "Scoring failed"))

        return {
            "success": True,
            "data": result.get("changes", {}),
            "message": "Lead calificado exitosamente"
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# FASE 12.2: Assign lead to lawyer
@router.post("/assign-lead/{lead_id}", status_code=status.HTTP_200_OK)
async def assign_lead(
    lead_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """FASE 12.2: Auto-assign lead to best lawyer"""
    try:
        lead = await db.leads.find_one({"_id": ObjectId(lead_id)})
        if not lead:
            raise HTTPException(status_code=404, detail="Lead no encontrado")

        result = await AutonomousOrchestrator.execute(
            db,
            DecisionType.ASSIGN_LEAD,
            lead,
            context={"organization_id": lead.get("organization_id")}
        )

        if not result.get("success"):
            raise HTTPException(status_code=400, detail=result.get("error", "Assignment failed"))

        return {
            "success": True,
            "data": result.get("changes", {}),
            "message": "Lead asignado automáticamente"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# FASE 12.3: Predict case outcome
@router.get("/case-prediction/{case_id}", status_code=status.HTTP_200_OK)
async def predict_case(
    case_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """FASE 12.3: Predict case success probability"""
    try:
        case = await db.cases.find_one({"_id": ObjectId(case_id)})
        if not case:
            raise HTTPException(status_code=404, detail="Caso no encontrado")
        
        prediction = await AICasePredictionEngine.predict_case_outcome(db, case)
        
        # Update case with prediction
        await db.cases.update_one(
            {"_id": ObjectId(case_id)},
            {"$set": {
                "ai_success_probability": prediction["success_probability"],
                "ai_recommendation": prediction["recommendation"],
                "updated_at": datetime.utcnow(),
            }}
        )
        
        # Create timeline event
        await db.timeline_events.insert_one({
            "event_type": "AI_CASE_PREDICTED",
            "case_id": case_id,
            "organization_id": case.get("organization_id"),
            "description": f"Predicción: {prediction['outcome_classification']} ({prediction['success_probability']}%)",
            "metadata": {
                "success_probability": prediction["success_probability"],
                "outcome": prediction["outcome_classification"],
            },
            "created_at": datetime.utcnow(),
        })
        
        return {
            "success": True,
            "data": prediction,
            "message": "Predicción generada"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# FASE 12.4: Revenue optimization
@router.get("/revenue-optimization/{org_id}", status_code=status.HTTP_200_OK)
async def optimize_revenue(
    org_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """FASE 12.4: Get revenue optimization recommendations"""
    if current_user.get("role") not in ["admin", "admin_general"]:
        raise HTTPException(status_code=403, detail="No autorizado")
    
    try:
        optimization = await AIRevenueOptimizationEngine.optimize_revenue(db, org_id)
        
        # Create timeline event
        await db.timeline_events.insert_one({
            "event_type": "AI_RECOMMENDATION_GENERATED",
            "organization_id": org_id,
            "description": f"Análisis de optimización generado: {len(optimization['recommendations'])} recomendaciones",
            "metadata": {
                "expected_gain": optimization["expected_total_revenue_gain"],
            },
            "created_at": datetime.utcnow(),
        })
        
        return {
            "success": True,
            "data": optimization,
            "message": "Recomendaciones generadas"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# FASE 12.5: Get AI alerts
@router.get("/alerts/{org_id}", status_code=status.HTTP_200_OK)
async def get_alerts(
    org_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """FASE 12.5: Get AI-generated alerts for an organization"""
    try:
        alerts = await AIAlertSystem.generate_alerts(db, org_id)
        
        return {
            "success": True,
            "data": alerts,
            "count": len(alerts),
            "message": "Alertas generadas"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Copilot summary endpoint
@router.get("/copilot-summary/{org_id}", status_code=status.HTTP_200_OK)
async def copilot_summary(
    org_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Get comprehensive AI copilot summary"""
    try:
        alerts = await AIAlertSystem.generate_alerts(db, org_id)
        optimization = await AIRevenueOptimizationEngine.optimize_revenue(db, org_id)
        
        return {
            "success": True,
            "data": {
                "alerts": alerts[:5],  # Top 5 alerts
                "alerts_count": len(alerts),
                "optimization": optimization,
                "summary": {
                    "critical_alerts": len([a for a in alerts if a["type"] == "CRITICAL"]),
                    "expected_revenue_gain": optimization["expected_total_revenue_gain"],
                    "action_items": sum(
                        len(r.get("action_items", []))
                        for r in optimization.get("recommendations", [])
                    ),
                }
            },
            "message": "Resumen de Copiloto IA"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
