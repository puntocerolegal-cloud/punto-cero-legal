from fastapi import APIRouter, Depends, Query
from typing import Optional
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorDatabase
from routes.auth import get_current_user
from bson import ObjectId

router = APIRouter(prefix="/sales-analytics", tags=["Sales Analytics · Command Center"])

async def get_db():
    from server import db
    return db

@router.get("/global-metrics")
async def get_global_metrics(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Global sales metrics (admin only)"""
    from fastapi import HTTPException, status
    if current_user.get("role") not in ["admin", "admin_general"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No autorizado")
    
    # Count agents
    agents = await db.users.count_documents({"role": "socio_comercial"})
    
    # Count leads
    leads = await db.leads.find({}).to_list(None)
    total_leads = len(leads)
    
    # Count this month leads
    month_ago = datetime.utcnow() - timedelta(days=30)
    leads_this_month = await db.leads.count_documents({"created_at": {"$gte": month_ago}})
    
    # Count cases
    cases = await db.cases.find({}).to_list(None)
    total_cases = len(cases)
    
    # Count converted leads
    converted = len([l for l in leads if l.get("status") == "converted"])
    
    # Conversion rate
    conversion_rate = (converted / total_leads * 100) if total_leads > 0 else 0
    
    # Count commissions
    commissions = await db.commissions.find({}).to_list(None)
    pending_commissions = sum(c.get("amount", 0) for c in commissions if c.get("status") == "pending")
    paid_commissions = sum(c.get("amount", 0) for c in commissions if c.get("status") == "paid")
    total_revenue = sum(c.get("amount", 0) for c in commissions)
    
    # Count organizations
    organizations = await db.organizations.count_documents({})
    
    # Count countries
    countries = set()
    for lead in leads:
        if lead.get("country"):
            countries.add(lead.get("country"))
    
    return {
        "success": True,
        "data": {
            "active_agents": agents,
            "total_leads": total_leads,
            "leads_this_month": leads_this_month,
            "cases_generated": total_cases,
            "closed_sales": converted,
            "global_conversion": round(conversion_rate, 2),
            "pending_commissions": round(pending_commissions, 2),
            "paid_commissions": round(paid_commissions, 2),
            "total_revenue": round(total_revenue, 2),
            "active_organizations": organizations,
            "operative_countries": len(countries),
        },
        "message": "Métricas globales obtenidas"
    }

@router.get("/top-agents")
async def get_top_agents(
    limit: int = Query(10, ge=1, le=50),
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Top agents by commissions"""
    from fastapi import HTTPException, status
    if current_user.get("role") not in ["admin", "admin_general"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No autorizado")
    
    agents = await db.users.find({"role": "socio_comercial"}).to_list(None)
    
    agent_stats = []
    for agent in agents:
        agent_id = str(agent["_id"])
        
        # Get agent's leads
        leads = await db.leads.find({"agent_id": agent_id}).to_list(None)
        lead_count = len(leads)
        
        # Get agent's commissions
        commissions = await db.commissions.find({"agent_id": agent_id}).to_list(None)
        commission_generated = sum(c.get("amount", 0) for c in commissions)
        commission_paid = sum(c.get("amount", 0) for c in commissions if c.get("status") == "paid")
        
        # Get conversion rate
        converted = len([l for l in leads if l.get("status") == "converted"])
        conversion = (converted / lead_count * 100) if lead_count > 0 else 0
        
        if lead_count > 0 or commission_generated > 0:
            agent_stats.append({
                "agent_id": agent_id,
                "agent_name": agent.get("full_name"),
                "country": agent.get("country", "Unknown"),
                "leads": lead_count,
                "conversions": converted,
                "conversion_rate": round(conversion, 2),
                "commission_generated": round(commission_generated, 2),
                "commission_paid": round(commission_paid, 2),
            })
    
    # Sort by commission generated
    agent_stats.sort(key=lambda x: x["commission_generated"], reverse=True)
    
    return {
        "success": True,
        "data": agent_stats[:limit],
        "message": f"Top {limit} agentes obtenidos"
    }

@router.get("/top-countries")
async def get_top_countries(
    limit: int = Query(10, ge=1, le=50),
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Top countries by leads and sales"""
    from fastapi import HTTPException, status
    if current_user.get("role") not in ["admin", "admin_general"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No autorizado")
    
    leads = await db.leads.find({}).to_list(None)
    
    country_stats = {}
    for lead in leads:
        country = lead.get("country", "Unknown")
        if country not in country_stats:
            country_stats[country] = {
                "country": country,
                "leads": 0,
                "sales": 0,
                "revenue": 0,
            }
        
        country_stats[country]["leads"] += 1
        if lead.get("status") == "converted":
            country_stats[country]["sales"] += 1
    
    # Add commission data
    commissions = await db.commissions.find({}).to_list(None)
    for commission in commissions:
        # Try to find country from case/lead
        case_id = commission.get("case_id")
        if case_id:
            case = await db.cases.find_one({"_id": ObjectId(case_id)})
            if case and case.get("client_country"):
                country = case.get("client_country")
                if country in country_stats:
                    country_stats[country]["revenue"] += commission.get("amount", 0)
    
    # Convert to list and sort
    country_list = list(country_stats.values())
    for c in country_list:
        c["conversion_rate"] = (c["sales"] / c["leads"] * 100) if c["leads"] > 0 else 0
    
    country_list.sort(key=lambda x: x["leads"], reverse=True)
    
    return {
        "success": True,
        "data": country_list[:limit],
        "message": f"Top {limit} países obtenidos"
    }

@router.get("/sales-funnel")
async def get_sales_funnel(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Sales funnel analytics"""
    from fastapi import HTTPException, status
    if current_user.get("role") not in ["admin", "admin_general"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No autorizado")
    
    leads = await db.leads.find({}).to_list(None)
    
    # Count by status
    new_leads = len([l for l in leads if l.get("status") == "new"])
    contacted = len([l for l in leads if l.get("status") == "contacted"])
    qualified = len([l for l in leads if l.get("status") == "qualified"])
    converted = len([l for l in leads if l.get("status") == "converted"])
    
    total = len(leads)
    
    funnel = [
        {"stage": "Lead", "count": total, "percentage": 100},
        {"stage": "Contactado", "count": contacted, "percentage": (contacted / total * 100) if total > 0 else 0},
        {"stage": "Calificado", "count": qualified, "percentage": (qualified / total * 100) if total > 0 else 0},
        {"stage": "Propuesta", "count": qualified, "percentage": (qualified / total * 100) if total > 0 else 0},
        {"stage": "Venta", "count": converted, "percentage": (converted / total * 100) if total > 0 else 0},
        {"stage": "Caso Creado", "count": len(await db.cases.find({}).to_list(None)), "percentage": (len(await db.cases.find({}).to_list(None)) / total * 100) if total > 0 else 0},
    ]
    
    return {
        "success": True,
        "data": funnel,
        "message": "Embudo comercial obtenido"
    }

@router.get("/country-performance")
async def get_country_performance(
    country: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Country-level performance metrics"""
    from fastapi import HTTPException, status
    if current_user.get("role") not in ["admin", "admin_general"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No autorizado")
    
    query = {}
    if country:
        query["country"] = country
    
    leads = await db.leads.find(query).to_list(None)
    cases = await db.cases.find(query).to_list(None)
    
    total_leads = len(leads)
    total_cases = len(cases)
    conversions = len([l for l in leads if l.get("status") == "converted"])
    
    # Get commissions for this country
    commissions = await db.commissions.find({"organization_id": {"$exists": True}}).to_list(None)
    country_revenue = sum(c.get("amount", 0) for c in commissions)
    
    return {
        "success": True,
        "data": {
            "country": country or "Global",
            "total_leads": total_leads,
            "total_cases": total_cases,
            "conversions": conversions,
            "conversion_rate": (conversions / total_leads * 100) if total_leads > 0 else 0,
            "revenue": round(country_revenue, 2),
            "leads_per_month": round(total_leads / 12, 2),
        },
        "message": "Desempeño del país obtenido"
    }

@router.get("/commission-summary")
async def get_commission_summary(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Commission summary by status"""
    from fastapi import HTTPException, status
    if current_user.get("role") not in ["admin", "admin_general"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No autorizado")
    
    commissions = await db.commissions.find({}).to_list(None)
    
    pending = [c for c in commissions if c.get("status") == "pending"]
    approved = [c for c in commissions if c.get("status") == "approved"]
    paid = [c for c in commissions if c.get("status") == "paid"]
    
    return {
        "success": True,
        "data": {
            "pending": {
                "count": len(pending),
                "amount": round(sum(c.get("amount", 0) for c in pending), 2),
            },
            "approved": {
                "count": len(approved),
                "amount": round(sum(c.get("amount", 0) for c in approved), 2),
            },
            "paid": {
                "count": len(paid),
                "amount": round(sum(c.get("amount", 0) for c in paid), 2),
            },
            "total": {
                "count": len(commissions),
                "amount": round(sum(c.get("amount", 0) for c in commissions), 2),
            },
        },
        "message": "Resumen de comisiones obtenido"
    }

@router.get("/alerts")
async def get_sales_alerts(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Intelligent sales alerts"""
    from fastapi import HTTPException, status
    if current_user.get("role") not in ["admin", "admin_general"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No autorizado")
    
    alerts = []
    
    # Alert: Agents with no activity in 7+ days
    week_ago = datetime.utcnow() - timedelta(days=7)
    agents = await db.users.find({"role": "socio_comercial"}).to_list(None)
    
    for agent in agents:
        recent_leads = await db.leads.find({
            "agent_id": str(agent["_id"]),
            "created_at": {"$gte": week_ago}
        }).to_list(None)
        
        if len(recent_leads) == 0:
            alerts.append({
                "type": "agent_inactive",
                "severity": "warning",
                "message": f"Agente {agent.get('full_name')} sin actividad > 7 días",
                "agent_id": str(agent["_id"]),
            })
    
    # Alert: Low conversion rate < 5%
    all_leads = await db.leads.find({}).to_list(None)
    converted = len([l for l in all_leads if l.get("status") == "converted"])
    if len(all_leads) > 0:
        conversion_rate = (converted / len(all_leads)) * 100
        if conversion_rate < 5:
            alerts.append({
                "type": "low_conversion",
                "severity": "alert",
                "message": f"Conversión global baja: {conversion_rate:.2f}%",
            })
    
    # Alert: Pending commissions > 30 days
    month_ago = datetime.utcnow() - timedelta(days=30)
    old_commissions = await db.commissions.find({
        "status": "pending",
        "created_at": {"$lt": month_ago}
    }).to_list(None)
    
    if len(old_commissions) > 0:
        alerts.append({
            "type": "old_commissions",
            "severity": "alert",
            "message": f"{len(old_commissions)} comisiones pendientes > 30 días",
        })
    
    return {
        "success": True,
        "data": alerts,
        "message": f"{len(alerts)} alertas generadas"
    }
