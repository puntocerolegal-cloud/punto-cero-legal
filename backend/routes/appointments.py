from fastapi import APIRouter, HTTPException, Depends, Header
from typing import List, Optional
from datetime import datetime, date, timedelta
from motor.motor_asyncio import AsyncIOMotorDatabase
from models.appointment import AppointmentCreate, Appointment
from bson import ObjectId

from utils import notifier

router = APIRouter(prefix="/appointments", tags=["Legal Agenda"])

async def get_db():
    from server import db
    # Bypass GuardedDB for direct-access routes; tenant isolation is enforced
    # via get_current_user + explicit firm filtering (same pattern as routes/auth.py).
    if hasattr(db, "_real_db"):
        return db._real_db
    return db

async def get_current_user_from_auth(
    authorization: str = Header(None),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Valida JWT y retorna usuario autenticado"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Autorización requerida")

    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise ValueError("Invalid auth scheme")

        from utils.auth import decode_token
        payload = decode_token(token)
        if not payload:
            raise HTTPException(status_code=401, detail="Token inválido o expirado")

        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Token inválido")

        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=401, detail="Usuario no encontrado")

        user["_id"] = str(user["_id"])
        return user
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=401, detail="Token inválido")

@router.post("/", response_model=dict)
async def create_appointment(
    appointment_data: AppointmentCreate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user = Depends(get_current_user_from_auth)
):
    appointment_dict = appointment_data.model_dump()
    appointment_dict["reminder_sent"] = False        # recordatorio 24h
    appointment_dict["reminder_day_sent"] = False     # recordatorio el día del evento
    appointment_dict["created_at"] = datetime.utcnow()
    appointment_dict["updated_at"] = datetime.utcnow()

    result = await db.appointments.insert_one(appointment_dict)
    appointment_dict["_id"] = str(result.inserted_id)

    # Notificación in-app inmediata de evento agendado
    try:
        await notifier.create_app_notification(
            db, target=appointment_dict["lawyer_id"], type="agenda_event",
            title="Evento agendado",
            message=f"{appointment_dict.get('title','Evento')} programado.",
            appointment_id=appointment_dict["_id"],
        )
    except Exception:
        pass
    return appointment_dict


@router.post("/run-reminders", response_model=dict)
async def run_reminders(db: AsyncIOMotorDatabase = Depends(get_db)):
    """Escanea la agenda y envía recordatorios por 3 canales (app, email, WhatsApp):
      • 24 horas antes del evento (reminder_sent)
      • el mismo día del evento (reminder_day_sent)
    Pensado para ejecutarse por cron. Idempotente vía banderas en cada cita."""
    now = datetime.utcnow()
    sent_24h = sent_day = 0

    # Cache de usuarios para no consultar repetido
    user_cache = {}

    async def _user(lawyer_id):
        if lawyer_id not in user_cache:
            try:
                user_cache[lawyer_id] = await db.users.find_one({"_id": ObjectId(lawyer_id)})
            except Exception:
                user_cache[lawyer_id] = None
        return user_cache[lawyer_id]

    # 1) Recordatorio 24h antes (eventos en las próximas 24h, aún no avisados)
    window_24h = now + timedelta(hours=24)
    pend = await db.appointments.find({
        "status": "scheduled", "reminder_sent": {"$ne": True},
        "start_time": {"$gte": now, "$lte": window_24h},
    }).to_list(500)
    for appt in pend:
        u = await _user(appt.get("lawyer_id"))
        if u:
            when = appt["start_time"].strftime("%d/%m %H:%M") if isinstance(appt.get("start_time"), datetime) else ""
            await notifier.notify_all(
                db, user=u, type="agenda_reminder",
                title=f"Recordatorio (24h): {appt.get('title','Evento')}",
                message=f"Tienes «{appt.get('title','')}» el {when}.",
                whatsapp_text=f"⏰ Recordatorio: «{appt.get('title','')}» el {when}.",
                appointment_id=str(appt["_id"]),
            )
        await db.appointments.update_one({"_id": appt["_id"]}, {"$set": {"reminder_sent": True}})
        sent_24h += 1

    # 2) Recordatorio el día del evento (hoy, aún no avisado el día)
    day_start = datetime.combine(date.today(), datetime.min.time())
    day_end = datetime.combine(date.today(), datetime.max.time())
    today_evts = await db.appointments.find({
        "status": "scheduled", "reminder_day_sent": {"$ne": True},
        "start_time": {"$gte": day_start, "$lte": day_end},
    }).to_list(500)
    for appt in today_evts:
        u = await _user(appt.get("lawyer_id"))
        if u:
            when = appt["start_time"].strftime("%H:%M") if isinstance(appt.get("start_time"), datetime) else ""
            await notifier.notify_all(
                db, user=u, type="agenda_reminder",
                title=f"Hoy: {appt.get('title','Evento')}",
                message=f"Hoy a las {when}: {appt.get('title','')}.",
                whatsapp_text=f"📅 Hoy {when}: {appt.get('title','')}.",
                appointment_id=str(appt["_id"]),
            )
        await db.appointments.update_one({"_id": appt["_id"]}, {"$set": {"reminder_day_sent": True}})
        sent_day += 1

    return {"ok": True, "reminders_24h": sent_24h, "reminders_day_of": sent_day}

@router.get("/", response_model=List[dict])
async def get_appointments(
    lawyer_id: str = None,
    case_id: str = None,
    start_date: str = None,
    end_date: str = None,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    query = {}
    if lawyer_id:
        query["lawyer_id"] = lawyer_id
    if case_id:
        query["case_id"] = case_id
    
    if start_date and end_date:
        query["start_time"] = {
            "$gte": datetime.fromisoformat(start_date),
            "$lte": datetime.fromisoformat(end_date)
        }
    
    appointments = await db.appointments.find(query).sort("start_time", 1).to_list(1000)
    for appointment in appointments:
        appointment["_id"] = str(appointment["_id"])
    return appointments

@router.get("/{appointment_id}", response_model=dict)
async def get_appointment(appointment_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    appointment = await db.appointments.find_one({"_id": ObjectId(appointment_id)})
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    appointment["_id"] = str(appointment["_id"])
    return appointment

@router.patch("/{appointment_id}", response_model=dict)
async def update_appointment(appointment_id: str, updates: dict, db: AsyncIOMotorDatabase = Depends(get_db)):
    # Solo campos permitidos; convierte fechas ISO a datetime
    allowed = {"title", "description", "event_type", "start_time", "end_time", "location", "status"}
    update_data = {k: v for k, v in updates.items() if k in allowed and v is not None}
    for f in ("start_time", "end_time"):
        if isinstance(update_data.get(f), str):
            try:
                update_data[f] = datetime.fromisoformat(update_data[f].replace("Z", "+00:00"))
            except Exception:
                update_data.pop(f, None)
    update_data["updated_at"] = datetime.utcnow()
    result = await db.appointments.update_one({"_id": ObjectId(appointment_id)}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Appointment not found")
    appt = await db.appointments.find_one({"_id": ObjectId(appointment_id)})
    appt["_id"] = str(appt["_id"])
    return appt

@router.delete("/{appointment_id}")
async def delete_appointment(appointment_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    result = await db.appointments.delete_one({"_id": ObjectId(appointment_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return {"message": "Appointment deleted successfully"}
