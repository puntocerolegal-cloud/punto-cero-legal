from fastapi import APIRouter, HTTPException, Depends, status
from typing import List
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorDatabase
from ..models.meeting import MeetingCreate, Meeting, MeetingUpdate
from bson import ObjectId

router = APIRouter(prefix="/meetings", tags=["Conference Room"])

async def get_db():
    from ..server import db
    return db

@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_meeting(meeting_data: MeetingCreate, db: AsyncIOMotorDatabase = Depends(get_db)):
    import uuid
    
    meeting_dict = meeting_data.model_dump()
    meeting_dict["room_id"] = str(uuid.uuid4())
    meeting_dict["meeting_link"] = f"https://meet.puntocero.legal/room/{meeting_dict['room_id']}"
    meeting_dict["created_at"] = datetime.utcnow()
    meeting_dict["updated_at"] = datetime.utcnow()
    
    result = await db.meetings.insert_one(meeting_dict)
    meeting_dict["_id"] = str(result.inserted_id)
    
    return meeting_dict

@router.get("/", response_model=List[dict])
async def get_meetings(
    case_id: str = None,
    host_id: str = None,
    status: str = None,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    query = {}
    if case_id:
        query["case_id"] = case_id
    if host_id:
        query["host_id"] = host_id
    if status:
        query["status"] = status
    
    meetings = await db.meetings.find(query).sort("scheduled_time", -1).to_list(1000)
    for meeting in meetings:
        meeting["_id"] = str(meeting["_id"])
    return meetings

@router.get("/{meeting_id}", response_model=dict)
async def get_meeting(meeting_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    meeting = await db.meetings.find_one({"_id": ObjectId(meeting_id)})
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    meeting["_id"] = str(meeting["_id"])
    return meeting

@router.patch("/{meeting_id}", response_model=dict)
async def update_meeting(meeting_id: str, meeting_update: MeetingUpdate, db: AsyncIOMotorDatabase = Depends(get_db)):
    update_data = {k: v for k, v in meeting_update.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    
    result = await db.meetings.update_one(
        {"_id": ObjectId(meeting_id)},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    meeting = await db.meetings.find_one({"_id": ObjectId(meeting_id)})
    meeting["_id"] = str(meeting["_id"])
    return meeting

@router.post("/{meeting_id}/complete", response_model=dict)
async def complete_meeting(meeting_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    """
    INTEGRACIÓN CRÍTICA: Sala de Conferencias → Finanzas
    Al completar reunión, actualiza horas facturables automáticamente
    """
    meeting = await db.meetings.find_one({"_id": ObjectId(meeting_id)})
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    if meeting["status"] == "completed":
        raise HTTPException(status_code=400, detail="Meeting already completed")
    
    # Calculate duration
    end_time = datetime.utcnow()
    start_time = meeting.get("start_time") or meeting.get("scheduled_time")
    duration_minutes = int((end_time - start_time).total_seconds() / 60)
    
    # Update meeting
    await db.meetings.update_one(
        {"_id": ObjectId(meeting_id)},
        {"$set": {
            "status": "completed",
            "end_time": end_time,
            "duration_minutes": duration_minutes,
            "updated_at": datetime.utcnow()
        }}
    )
    
    # Update case billable hours
    case = await db.cases.find_one({"_id": ObjectId(meeting["case_id"])})
    if case:
        billable_hours = case.get("billable_hours", 0.0) + (duration_minutes / 60.0)
        
        # Assume hourly rate (esto se puede obtener del abogado)
        hourly_rate = 150.0  # Default, debería venir del perfil del abogado
        total_billed = billable_hours * hourly_rate
        
        await db.cases.update_one(
            {"_id": ObjectId(meeting["case_id"])},
            {"$set": {
                "billable_hours": billable_hours,
                "total_billed": total_billed,
                "updated_at": datetime.utcnow()
            }}
        )
        
        # Update case activity
        await db.case_activities.update_one(
            {"meeting_id": meeting_id},
            {"$set": {
                "duration_minutes": duration_minutes
            }}
        )
        
        # Update KPI metrics
        lawyer_id = case["lawyer_id"]
        today = datetime.utcnow().date()
        
        await db.kpi_metrics.update_one(
            {"lawyer_id": lawyer_id, "date": today},
            {
                "$inc": {
                    "meetings_held": 1,
                    "billable_hours": duration_minutes / 60.0
                },
                "$set": {"created_at": datetime.utcnow()}
            },
            upsert=True
        )
    
    return {
        "message": "Meeting completed successfully",
        "duration_minutes": duration_minutes,
        "billable_hours_added": duration_minutes / 60.0
    }