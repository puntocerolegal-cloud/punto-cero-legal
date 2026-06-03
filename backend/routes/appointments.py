from fastapi import APIRouter, HTTPException, Depends
from typing import List
from datetime import datetime, date
from motor.motor_asyncio import AsyncIOMotorDatabase
from models.appointment import AppointmentCreate, Appointment
from bson import ObjectId

router = APIRouter(prefix="/appointments", tags=["Legal Agenda"])

async def get_db():
    from server import db
    return db

@router.post("/", response_model=dict)
async def create_appointment(appointment_data: AppointmentCreate, db: AsyncIOMotorDatabase = Depends(get_db)):
    appointment_dict = appointment_data.model_dump()
    appointment_dict["reminder_sent"] = False
    appointment_dict["created_at"] = datetime.utcnow()
    appointment_dict["updated_at"] = datetime.utcnow()
    
    result = await db.appointments.insert_one(appointment_dict)
    appointment_dict["_id"] = str(result.inserted_id)
    
    return appointment_dict

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