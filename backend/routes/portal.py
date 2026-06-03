"""
Portal del Cliente — Punto Cero Legal
Vista de solo lectura para el cliente final: sus casos y la línea de tiempo
de cada caso (actividades, citas, reuniones y facturas) en orden cronológico.
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

router = APIRouter(prefix="/portal", tags=["Client Portal"])


async def get_db():
    from server import db
    return db


def _iso(v):
    if isinstance(v, datetime):
        return v.isoformat()
    return v


@router.get("/cases", response_model=List[dict])
async def portal_cases(client_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Casos del cliente autenticado (solo lectura)."""
    cases = await db.cases.find({"client_id": client_id}).sort("created_at", -1).to_list(200)
    out = []
    for c in cases:
        lawyer_name = None
        if c.get("lawyer_id") and ObjectId.is_valid(c["lawyer_id"]):
            lawyer = await db.users.find_one({"_id": ObjectId(c["lawyer_id"])})
            if lawyer:
                lawyer_name = lawyer.get("full_name")
        out.append({
            "_id": str(c["_id"]),
            "case_number": c.get("case_number"),
            "title": c.get("title"),
            "legal_area": c.get("legal_area"),
            "status": c.get("status"),
            "priority": c.get("priority"),
            "lawyer_name": lawyer_name,
            "created_at": _iso(c.get("created_at")),
            "deadline": _iso(c.get("deadline")),
        })
    return out


@router.get("/timeline/{case_id}", response_model=dict)
async def portal_timeline(case_id: str, client_id: Optional[str] = None, db: AsyncIOMotorDatabase = Depends(get_db)):
    """
    Línea de tiempo del caso. Combina actividades, citas, reuniones y facturas
    en una sola lista ordenada cronológicamente (más reciente primero).
    """
    case = await db.cases.find_one({"_id": ObjectId(case_id)})
    if not case:
        raise HTTPException(404, "Caso no encontrado")
    # Verificación de pertenencia: el cliente solo ve sus propios casos
    if client_id and case.get("client_id") != client_id:
        raise HTTPException(403, "No autorizado para ver este caso")

    events = []

    # Apertura del caso
    if case.get("created_at"):
        events.append({
            "type": "case",
            "category": "Caso",
            "title": f"Caso abierto: {case.get('title', '')}",
            "description": case.get("description") or f"Número {case.get('case_number', '')}",
            "date": _iso(case.get("created_at")),
        })

    # Actividades del caso
    activities = await db.case_activities.find({"case_id": case_id}).to_list(500)
    for a in activities:
        events.append({
            "type": "activity",
            "category": "Actividad",
            "title": a.get("description") or a.get("activity_type", "Actividad"),
            "description": a.get("activity_type"),
            "date": _iso(a.get("created_at")),
        })

    # Citas / audiencias
    appointments = await db.appointments.find({"case_id": case_id}).to_list(500)
    for ap in appointments:
        events.append({
            "type": "appointment",
            "category": "Cita",
            "title": ap.get("title"),
            "description": ap.get("location") or ap.get("event_type"),
            "date": _iso(ap.get("start_time")),
        })

    # Reuniones
    meetings = await db.meetings.find({"case_id": case_id}).to_list(500)
    for m in meetings:
        events.append({
            "type": "meeting",
            "category": "Reunión",
            "title": m.get("title", "Reunión"),
            "description": f"Estado: {m.get('status', '')}",
            "date": _iso(m.get("start_time") or m.get("scheduled_time")),
        })

    # Facturas del caso
    invoices = await db.invoices.find({"case_id": case_id}).to_list(500)
    for inv in invoices:
        events.append({
            "type": "invoice",
            "category": "Factura",
            "title": f"Factura {inv.get('invoice_number', '')}",
            "description": f"Monto {inv.get('amount', 0)} · {inv.get('status', '')}",
            "date": _iso(inv.get("issue_date") or inv.get("created_at")),
        })

    # Orden cronológico descendente (eventos sin fecha al final)
    events.sort(key=lambda e: e.get("date") or "", reverse=True)

    return {
        "case": {
            "_id": str(case["_id"]),
            "case_number": case.get("case_number"),
            "title": case.get("title"),
            "legal_area": case.get("legal_area"),
            "status": case.get("status"),
        },
        "events": events,
    }
