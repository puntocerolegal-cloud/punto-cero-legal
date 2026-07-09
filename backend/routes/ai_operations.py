from fastapi import APIRouter, Depends, Query
from typing import Optional
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorDatabase
from routes.auth import get_current_user
from services.ai_engines import (
    LeadScoringEngine,
    AutoAssignmentEngine,
    LawyerRecommendationEngine,
    RevenueForecastEngine,
    AIAlertsEngine,
)
from bson import ObjectId

router = APIRouter(prefix="/ai-operations", tags=["AI Operations · Copilot"])

async def get_db():
    from server import db
    return db

@router.get("/score-lead/{lead_id}")
async def score_lead(
    lead_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Score a lead for conversion probability"""
    from fastapi import HTTPException, status

    if not ObjectId.is_valid(lead_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Lead no válido")

    lead = await db.leads.find_one({"_id": ObjectId(lead_id)})
    if not lead:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead no encontrado")
    
    score = await LeadScoringEngine.score_lead(db, lead)
    
    # Store score in lead
    await db.leads.update_one(
        {"_id": ObjectId(lead_id)},
        {"$set": {
            "ai_score": score["score"],
            "ai_classification": score["classification"],
            "ai_estimated_value": score["estimated_value"],
            "ai_urgency": score["urgency"],
            "ai_scored_at": datetime.utcnow(),
        }}
    )
    
    # Timeline event
    await db.timeline_events.insert_one({
        "event_type": "LEAD_SCORED",
        "lead_id": lead_id,
        "description": f"Lead puntuado: {score['classification']} ({score['score']} pts)",
        "metadata": score,
        "created_at": datetime.utcnow(),
    })
    
    return {
        "success": True,
        "data": score,
        "message": "Lead puntuado exitosamente"
    }

@router.post("/assign-lead/{lead_id}")
async def assign_lead_automatically(
    lead_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Automatically assign a lead to best agent"""
    if not ObjectId.is_valid(lead_id):
        return {"success": False, "message": "Lead no válido"}
    
    lead = await db.leads.find_one({"_id": ObjectId(lead_id)})
    if not lead:
        return {"success": False, "message": "Lead no encontrado"}
    
    # Find best agent
    best_agent_id = await AutoAssignmentEngine.find_best_agent(db, lead)
    
    if not best_agent_id:
        return {"success": False, "message": "No hay agentes disponibles"}
    
    agent = await db.users.find_one({"_id": ObjectId(best_agent_id)})
    
    # Assign lead
    await db.leads.update_one(
        {"_id": ObjectId(lead_id)},
        {"$set": {
            "agent_id": best_agent_id,
            "ai_assigned": True,
            "ai_assigned_at": datetime.utcnow(),
        }}
    )
    
    # Timeline event
    await db.timeline_events.insert_one({
        "event_type": "LEAD_ASSIGNED",
        "lead_id": lead_id,
        "agent_id": best_agent_id,
        "description": f"Lead asignado automáticamente a {agent.get('full_name')}",
        "metadata": {"reason": "AI auto-assignment"},
        "created_at": datetime.utcnow(),
    })
    
    return {
        "success": True,
        "data": {
            "lead_id": lead_id,
            "agent_id": best_agent_id,
            "agent_name": agent.get("full_name"),
        },
        "message": "Lead asignado exitosamente"
    }

@router.get("/recommend-lawyers/{lead_id}")
async def recommend_lawyers(
    lead_id: str,
    org_id: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Get recommended lawyers for a lead"""
    if not ObjectId.is_valid(lead_id):
        return {"success": False, "message": "Lead no válido"}
    
    lead = await db.leads.find_one({"_id": ObjectId(lead_id)})
    if not lead:
        return {"success": False, "message": "Lead no encontrado"}
    
    recommendations = await LawyerRecommendationEngine.recommend_lawyers(
        db, lead, org_id, limit=5
    )
    
    # Timeline event
    if recommendations:
        await db.timeline_events.insert_one({
            "event_type": "LAWYER_RECOMMENDED",
            "lead_id": lead_id,
            "description": f"Abogados recomendados para lead",
            "metadata": {"count": len(recommendations)},
            "created_at": datetime.utcnow(),
        })
    
    return {
        "success": True,
        "data": recommendations,
        "message": f"{len(recommendations)} abogados recomendados"
    }

@router.get("/forecast-revenue")
async def forecast_revenue(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Get revenue forecast"""
    if current_user.get("role") not in ["admin", "admin_general"]:
        return {"success": False, "message": "No autorizado"}
    
    forecast = await RevenueForecastEngine.forecast_revenue(db)
    
    # Timeline event
    await db.timeline_events.insert_one({
        "event_type": "FORECAST_GENERATED",
        "description": "Pronóstico de ingresos generado",
        "metadata": forecast,
        "created_at": datetime.utcnow(),
    })
    
    return {
        "success": True,
        "data": forecast,
        "message": "Pronóstico de ingresos generado"
    }

@router.get("/ai-alerts")
async def get_ai_alerts(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Get AI-generated alerts"""
    if current_user.get("role") not in ["admin", "admin_general"]:
        return {"success": False, "message": "No autorizado"}
    
    alerts = await AIAlertsEngine.generate_alerts(db)
    
    # Create timeline events for each alert
    for alert in alerts:
        await db.timeline_events.insert_one({
            "event_type": "AI_ALERT_CREATED",
            "description": alert["message"],
            "metadata": {"alert_type": alert["type"]},
            "created_at": datetime.utcnow(),
        })
    
    return {
        "success": True,
        "data": alerts,
        "message": f"{len(alerts)} alertas generadas"
    }

@router.get("/copilot-summary")
async def get_copilot_summary(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Get AI copilot summary"""
    if current_user.get("role") not in ["admin", "admin_general"]:
        return {"success": False, "message": "No autorizado"}
    
    # Get all AI data
    alerts = await AIAlertsEngine.generate_alerts(db)
    forecast = await RevenueForecastEngine.forecast_revenue(db)
    
    # Get recommendations
    leads = await db.leads.find({}).to_list(None)
    high_priority_leads = [l for l in leads if l.get("ai_classification") == "Muy Alto"]
    
    # Get stalled leads
    week_ago = datetime.utcnow() - timedelta(days=7)
    stalled = await db.leads.count_documents({
        "status": {"$in": ["new", "contacted"]},
        "updated_at": {"$lt": week_ago}
    })
    
    return {
        "success": True,
        "data": {
            "alerts": alerts,
            "forecast": forecast,
            "high_priority_leads": len(high_priority_leads),
            "stalled_leads": stalled,
            "recommendations": [
                "Asignar leads de muy alta prioridad inmediatamente",
                f"Revisar {stalled} leads estancados",
                "Verificar agentes con carga > 15 leads",
                "Considerar contratación de nuevos agentes",
            ],
            "opportunities": [
                f"Potencial de ingresos: ${forecast['forecast_30_days']:.0f} en 30 días",
                f"Proyección anual: ${forecast['forecast_365_days']:.0f}",
            ],
        },
        "message": "Resumen del copiloto AI generado"
    }

from datetime import timedelta
