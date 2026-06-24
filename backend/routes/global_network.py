from fastapi import APIRouter, HTTPException, Depends, status
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorDatabase
from routes.auth import get_current_user
from services.global_network_service import (
    GlobalCountryEngine,
    CrossBorderRoutingEngine,
    GlobalFirmNetworkEngine,
    MultiCurrencyEngine,
    GlobalRevenueOrchestrator,
    InternationalComplianceEngine,
    GlobalLoadBalancer,
)

router = APIRouter(prefix="/global", tags=["Global · Network"])

async def get_db():
    from server import db
    return db

# FASE 14.1: Get all countries
@router.get("/countries", status_code=status.HTTP_200_OK)
async def get_countries(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """FASE 14.1: Get list of all supported countries"""
    try:
        countries = await GlobalCountryEngine.list_all_countries()
        
        return {
            "success": True,
            "data": countries,
            "count": len(countries),
            "message": "Países soportados"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/countries/{country_code}", status_code=status.HTTP_200_OK)
async def get_country_config(
    country_code: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """FASE 14.1: Get configuration for specific country"""
    try:
        config = await GlobalCountryEngine.get_country_config(country_code.upper())
        
        if not config:
            raise HTTPException(status_code=404, detail="País no soportado")
        
        return {
            "success": True,
            "data": config,
            "message": "Configuración de país"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# FASE 14.2: Cross-border routing
@router.post("/route-cross-border", status_code=status.HTTP_200_OK)
async def route_cross_border(
    lead_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """FASE 14.2: Route lead to international lawyer/firm"""
    try:
        from bson import ObjectId
        lead = await db.leads.find_one({"_id": ObjectId(lead_id)})
        if not lead:
            raise HTTPException(status_code=404, detail="Lead no encontrado")
        
        routing = await CrossBorderRoutingEngine.route_cross_border(db, lead)
        
        # Update lead with international assignment
        if routing.get("assigned_id"):
            await db.leads.update_one(
                {"_id": lead["_id"]},
                {"$set": {
                    "lawyer_id": routing["assigned_id"],
                    "international_assignment": True,
                    "assignment_country": routing.get("assigned_country"),
                }}
            )
            
            # Timeline event
            await db.timeline_events.insert_one({
                "event_type": "CROSS_BORDER_ASSIGNMENT",
                "lead_id": lead_id,
                "lawyer_id": routing["assigned_id"],
                "organization_id": lead.get("organization_id"),
                "description": f"Asignación internacional: {routing.get('assigned_type')}",
                "metadata": routing,
                "created_at": datetime.utcnow(),
            })
        
        return {
            "success": True,
            "data": routing,
            "message": "Asignación internacional ejecutada"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# FASE 14.3: Get firm partnerships
@router.get("/firm-network/{firm_id}", status_code=status.HTTP_200_OK)
async def get_firm_network(
    firm_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """FASE 14.3: Get firm network connections"""
    try:
        partnerships = await GlobalFirmNetworkEngine.get_firm_partnerships(db, firm_id)
        metrics = await GlobalFirmNetworkEngine.calculate_network_metrics(db, firm_id)
        
        return {
            "success": True,
            "data": {
                "partnerships": partnerships,
                "metrics": metrics,
            },
            "message": "Red de firmas"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# FASE 14.4: Currency conversion
@router.post("/convert-currency", status_code=status.HTTP_200_OK)
async def convert_currency(
    amount: float,
    from_currency: str,
    to_currency: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """FASE 14.4: Convert amount between currencies"""
    try:
        result = await MultiCurrencyEngine.convert_amount(amount, from_currency, to_currency)
        
        return {
            "success": True,
            "data": result,
            "message": "Conversión de moneda"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/exchange-rates", status_code=status.HTTP_200_OK)
async def get_exchange_rates(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """FASE 14.4: Get current exchange rates"""
    try:
        rates = MultiCurrencyEngine.EXCHANGE_RATES
        
        return {
            "success": True,
            "data": rates,
            "timestamp": datetime.utcnow(),
            "message": "Tasas de cambio"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# FASE 14.5: Global revenue summary
@router.get("/revenue-summary", status_code=status.HTTP_200_OK)
async def get_global_revenue(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """FASE 14.5: Get global revenue overview"""
    if current_user.get("role") not in ["admin"]:
        raise HTTPException(status_code=403, detail="No autorizado")
    
    try:
        summary = await GlobalRevenueOrchestrator.get_global_revenue_summary(db)
        
        return {
            "success": True,
            "data": summary,
            "message": "Resumen global de ingresos"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# FASE 14.6: Check compliance
@router.post("/check-compliance", status_code=status.HTTP_200_OK)
async def check_compliance(
    country_code: str,
    data_location: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """FASE 14.6: Check data residency compliance"""
    if current_user.get("role") not in ["admin"]:
        raise HTTPException(status_code=403, detail="No autorizado")
    
    try:
        compliant = await InternationalComplianceEngine.check_data_residency(
            country_code, data_location
        )
        
        return {
            "success": True,
            "data": {
                "compliant": compliant,
                "country": country_code,
                "data_location": data_location,
            },
            "message": "Verificación de cumplimiento"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# FASE 14.7: Global load balancing
@router.post("/balance-global-load", status_code=status.HTTP_200_OK)
async def balance_global_load(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """FASE 14.7: Execute global load balancing"""
    if current_user.get("role") not in ["admin"]:
        raise HTTPException(status_code=403, detail="No autorizado")
    
    try:
        result = await GlobalLoadBalancer.balance_global_load(db)
        
        # Log compliance event
        for action in result.get("actions", []):
            await InternationalComplianceEngine.log_compliance_event(
                db,
                action.get("type"),
                action.get("country"),
                "global",
                action
            )
        
        return {
            "success": True,
            "data": result,
            "message": "Balance global ejecutado"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
