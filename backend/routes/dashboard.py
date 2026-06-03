from fastapi import APIRouter, HTTPException, Depends
from typing import List
from datetime import datetime, date, timedelta
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

router = APIRouter(prefix="/dashboard", tags=["Dashboard & KPIs"])

async def get_db():
    from server import db
    return db

@router.get("/kpis/{lawyer_id}", response_model=dict)
async def get_lawyer_kpis(lawyer_id: str, days: int = 30, db: AsyncIOMotorDatabase = Depends(get_db)):
    """
    DASHBOARD PRINCIPAL: Métricas en Tiempo Real
    Agrega datos de todos los módulos para generar KPIs
    """
    start_date = date.today() - timedelta(days=days)
    
    # Total cases
    total_cases = await db.cases.count_documents({"lawyer_id": lawyer_id})
    active_cases = await db.cases.count_documents({"lawyer_id": lawyer_id, "status": {"$in": ["open", "in_progress"]}})
    closed_cases = await db.cases.count_documents({"lawyer_id": lawyer_id, "status": "closed"})
    
    # Revenue
    pipeline = [
        {"$match": {"lawyer_id": lawyer_id, "status": "paid"}},
        {"$group": {"_id": None, "total_revenue": {"$sum": "$amount"}}}
    ]
    revenue_result = await db.invoices.aggregate(pipeline).to_list(1)
    total_revenue = revenue_result[0]["total_revenue"] if revenue_result else 0.0
    
    # Billable hours
    cases = await db.cases.find({"lawyer_id": lawyer_id}).to_list(1000)
    total_billable_hours = sum(case.get("billable_hours", 0) for case in cases)
    
    # Leads
    total_leads = await db.leads.count_documents({"lawyer_id": lawyer_id})
    converted_leads = await db.leads.count_documents({"lawyer_id": lawyer_id, "status": "converted"})
    conversion_rate = (converted_leads / total_leads * 100) if total_leads > 0 else 0
    
    # Meetings
    meetings_held = await db.meetings.count_documents({
        "host_id": lawyer_id,
        "status": "completed",
        "start_time": {"$gte": datetime.combine(start_date, datetime.min.time())}
    })
    
    # Pending invoices
    pending_invoices = await db.invoices.count_documents({
        "lawyer_id": lawyer_id,
        "status": {"$in": ["draft", "sent", "overdue"]}
    })
    
    # Upcoming appointments
    upcoming_appointments = await db.appointments.count_documents({
        "lawyer_id": lawyer_id,
        "start_time": {"$gte": datetime.utcnow()},
        "status": "scheduled"
    })
    
    # Unread messages
    unread_messages = await db.messages.count_documents({
        "recipient_id": lawyer_id,
        "read": False
    })
    
    return {
        "total_cases": total_cases,
        "active_cases": active_cases,
        "closed_cases": closed_cases,
        "total_revenue": total_revenue,
        "billable_hours": total_billable_hours,
        "total_leads": total_leads,
        "converted_leads": converted_leads,
        "conversion_rate": round(conversion_rate, 2),
        "meetings_held": meetings_held,
        "pending_invoices": pending_invoices,
        "upcoming_appointments": upcoming_appointments,
        "unread_messages": unread_messages
    }

@router.get("/alerts/{lawyer_id}", response_model=List[dict])
async def get_dashboard_alerts(lawyer_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    """
    Alertas del Dashboard: Vencimientos, llamadas pendientes, nuevos leads
    """
    alerts = []
    
    # Cases approaching deadline
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    upcoming_deadline = today + timedelta(days=7)
    urgent_cases = await db.cases.find({
        "lawyer_id": lawyer_id,
        "status": {"$in": ["open", "in_progress"]},
        "deadline": {"$lte": upcoming_deadline, "$gte": today}
    }).to_list(10)
    
    for case in urgent_cases:
        deadline_val = case.get("deadline")
        if deadline_val:
            if isinstance(deadline_val, datetime):
                days_left = (deadline_val - datetime.utcnow()).days
            else:
                days_left = (datetime.combine(deadline_val, datetime.min.time()) - datetime.utcnow()).days
        else:
            days_left = 0
        alerts.append({
            "type": "deadline",
            "priority": "high",
            "message": f"Caso {case.get('case_number', 'sin número')} vence en {max(0, days_left)} días",
            "case_id": str(case["_id"])
        })
    
    # New leads
    new_leads = await db.leads.count_documents({
        "lawyer_id": lawyer_id,
        "status": "new"
    })
    
    if new_leads > 0:
        alerts.append({
            "type": "new_leads",
            "priority": "medium",
            "message": f"Tienes {new_leads} nuevos leads sin contactar"
        })
    
    # Upcoming appointments today
    today_start = datetime.combine(date.today(), datetime.min.time())
    today_end = datetime.combine(date.today(), datetime.max.time())
    
    today_appointments = await db.appointments.find({
        "lawyer_id": lawyer_id,
        "start_time": {"$gte": today_start, "$lte": today_end},
        "status": "scheduled"
    }).sort("start_time", 1).to_list(10)
    
    for appointment in today_appointments:
        alerts.append({
            "type": "appointment",
            "priority": "medium",
            "message": f"{appointment['title']} - {appointment['start_time'].strftime('%H:%M')}",
            "appointment_id": str(appointment["_id"])
        })
    
    # Overdue invoices
    overdue_count = await db.invoices.count_documents({
        "lawyer_id": lawyer_id,
        "status": "overdue"
    })
    
    if overdue_count > 0:
        alerts.append({
            "type": "overdue_invoice",
            "priority": "high",
            "message": f"Tienes {overdue_count} facturas vencidas"
        })
    
    return alerts
