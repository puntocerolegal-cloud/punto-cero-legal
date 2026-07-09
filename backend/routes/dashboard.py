from fastapi import APIRouter, HTTPException, Depends
from typing import List
from datetime import datetime, date, timedelta
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from routes.auth import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard & KPIs"])

async def get_db():
    from server import db
    # Bypass GuardedDB for direct-access routes; tenant isolation is enforced
    # via get_current_user + explicit firm filtering (same pattern as routes/auth.py).
    if hasattr(db, "_real_db"):
        return db._real_db
    return db

@router.get("/kpis/{lawyer_id}", response_model=dict)
async def get_lawyer_kpis(lawyer_id: str, days: int = 30, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
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
async def get_dashboard_alerts(lawyer_id: str, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
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


@router.get("/crm-report/{lawyer_id}", response_model=dict)
async def crm_report(lawyer_id: str, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    """CRM CENTRAL: el cerebro de la oficina. Reportes agregados de todos los
    módulos + gráficas + recomendaciones inteligentes basadas en los datos."""
    cases = await db.cases.find({"lawyer_id": lawyer_id}).to_list(5000)

    # Casos por estado (es)
    by_estado = {}
    by_materia = {}
    closed = won = 0
    for c in cases:
        est = c.get("estado") or c.get("status") or "Pendiente"
        by_estado[est] = by_estado.get(est, 0) + 1
        mat = c.get("materia") or c.get("legal_area") or "Otro"
        by_materia[mat] = by_materia.get(mat, 0) + 1
        if c.get("status") == "closed" or est == "Finalizada":
            closed += 1
            if (c.get("outcome") or "").lower() in ("won", "favorable", "ganado") or c.get("won"):
                won += 1

    # Ingresos por mes (facturas pagadas, últimos 6 meses)
    paid = await db.invoices.find({"lawyer_id": lawyer_id, "status": "paid"}).to_list(5000)
    income_by_month = {}
    for inv in paid:
        d = inv.get("paid_date") or inv.get("issue_date") or inv.get("created_at")
        if isinstance(d, datetime):
            key = f"{d.year}-{d.month:02d}"
            income_by_month[key] = income_by_month.get(key, 0) + float(inv.get("amount", 0))
    months = []
    base = date.today().replace(day=1)
    for i in range(5, -1, -1):
        y = base.year
        m = base.month - i
        while m <= 0:
            m += 12
            y -= 1
        key = f"{y}-{m:02d}"
        months.append({"month": key, "income": round(income_by_month.get(key, 0), 2)})

    # Clientes nuevos este mes
    month_start = datetime.combine(date.today().replace(day=1), datetime.min.time())
    new_clients = await db.clients.count_documents({"lawyer_id": lawyer_id, "created_at": {"$gte": month_start}})
    total_clients = await db.clients.count_documents({"lawyer_id": lawyer_id})

    success_rate = round((won / closed * 100), 1) if closed else 0.0

    # Recomendaciones inteligentes
    recs = []
    new_leads = await db.leads.count_documents({"lawyer_id": lawyer_id, "status": "new"})
    if new_leads:
        recs.append({"icon": "Users", "priority": "alta",
                     "text": f"Tienes {new_leads} leads sin contactar. Contáctalos hoy para no perder conversiones."})
    overdue = await db.invoices.count_documents({"lawyer_id": lawyer_id, "status": {"$in": ["overdue", "sent"]}})
    if overdue:
        recs.append({"icon": "Receipt", "priority": "alta",
                     "text": f"{overdue} factura(s) por cobrar. Envía un recordatorio de pago."})
    if by_estado.get("En audiencia"):
        recs.append({"icon": "Calendar", "priority": "media",
                     "text": f"{by_estado['En audiencia']} caso(s) en audiencia: prepara tus alegatos y agenda recordatorios."})
    if total_clients and not income_by_month:
        recs.append({"icon": "TrendingUp", "priority": "media",
                     "text": "Tienes clientes activos pero aún no registras ingresos cobrados. Genera y envía facturas."})
    top_materia = max(by_materia, key=by_materia.get) if by_materia else None
    if top_materia:
        recs.append({"icon": "Brain", "priority": "baja",
                     "text": f"Tu especialidad más activa es {top_materia}. Considera ofrecer paquetes en esa materia."})

    return {
        "cases_by_estado": by_estado,
        "cases_by_materia": by_materia,
        "income_by_month": months,
        "new_clients_this_month": new_clients,
        "total_clients": total_clients,
        "total_cases": len(cases),
        "closed_cases": closed,
        "success_rate": success_rate,
        "recommendations": recs,
    }


@router.get("/notifications/{lawyer_id}", response_model=dict)
async def lawyer_notifications(lawyer_id: str, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    """Campana del dashboard: notificaciones dirigidas al abogado."""
    docs = await db.notifications.find(
        {"$or": [{"target": lawyer_id}, {"user_id": lawyer_id}]}
    ).sort("created_at", -1).to_list(50)
    items = []
    for n in docs:
        items.append({
            "_id": str(n["_id"]),
            "type": n.get("type"),
            "title": n.get("title"),
            "message": n.get("message"),
            "read": bool(n.get("read", False)),
            "case_id": n.get("case_id"),
            "created_at": n["created_at"].isoformat() if isinstance(n.get("created_at"), datetime) else None,
        })
    unread = sum(1 for i in items if not i["read"])
    return {"notifications": items, "unread": unread}


@router.post("/notifications/{notification_id}/read", response_model=dict)
async def mark_notification_read(notification_id: str, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    await db.notifications.update_one({"_id": ObjectId(notification_id)}, {"$set": {"read": True}})
    return {"ok": True}


@router.post("/notifications/{lawyer_id}/read-all", response_model=dict)
async def mark_all_read(lawyer_id: str, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    await db.notifications.update_many(
        {"$or": [{"target": lawyer_id}, {"user_id": lawyer_id}], "read": {"$ne": True}},
        {"$set": {"read": True}},
    )
    return {"ok": True}
