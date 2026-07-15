from fastapi import APIRouter, HTTPException, Depends, status
from typing import List
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorDatabase
from models.meeting import MeetingCreate, Meeting, MeetingUpdate
from bson import ObjectId
from routes.auth import get_current_user

router = APIRouter(prefix="/meetings", tags=["Conference Room"])

async def get_db():
    from server import db
    return db

@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_meeting(
    meeting_data: MeetingCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    import uuid
    
    # Validar que el caso pertenece al usuario
    case = await db.cases.find_one({
        "_id": ObjectId(meeting_data.case_id),
        "organization_id": current_user.get("organization_id")
    })
    if not case:
        raise HTTPException(403, "No autorizado: caso no pertenece a su organización")
    
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
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    # Siempre filtrar por organización del usuario
    query = {"organization_id": current_user.get("organization_id")}
    
    if case_id:
        # Validar que el caso pertenece a la organización
        case = await db.cases.find_one({
            "_id": ObjectId(case_id),
            "organization_id": current_user.get("organization_id")
        })
        if not case:
            raise HTTPException(403, "No autorizado: caso no pertenece a su organización")
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
async def get_meeting(
    meeting_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    # Validar que la reunión pertenece a la organización del usuario
    meeting = await db.meetings.find_one({
        "_id": ObjectId(meeting_id),
        "organization_id": current_user.get("organization_id")
    })
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    meeting["_id"] = str(meeting["_id"])
    return meeting


def _calculate_duration_minutes(meeting: dict) -> tuple[int, datetime]:
    end_time = datetime.utcnow()
    start_time = meeting.get("start_time") or meeting.get("scheduled_time")
    return int((end_time - start_time).total_seconds() / 60), end_time


async def _update_meeting_record(db, meeting_id: str, duration_minutes: int, end_time: datetime):
    await db.meetings.update_one(
        {"_id": ObjectId(meeting_id)},
        {"$set": {
            "status": "completed",
            "end_time": end_time,
            "duration_minutes": duration_minutes,
            "updated_at": datetime.utcnow()
        }}
    )


async def _update_case_financials(db, meeting: dict, duration_minutes: int) -> float:
    case = await db.cases.find_one({"_id": ObjectId(meeting["case_id"])})
    if not case:
        return 0.0

    billable_hours = case.get("billable_hours", 0.0) + (duration_minutes / 60.0)
    hourly_rate = 150.0

    await db.cases.update_one(
        {"_id": ObjectId(meeting["case_id"])},
        {"$set": {
            "billable_hours": billable_hours,
            "total_billed": billable_hours * hourly_rate,
            "updated_at": datetime.utcnow()
        }}
    )

    await db.case_activities.update_one(
        {"meeting_id": meeting["_id"]},
        {"$set": {"duration_minutes": duration_minutes}}
    )

    await db.kpi_metrics.update_one(
        {"lawyer_id": case["lawyer_id"], "date": datetime.utcnow().date()},
        {
            "$inc": {
                "meetings_held": 1,
                "billable_hours": duration_minutes / 60.0
            },
            "$set": {"created_at": datetime.utcnow()}
        },
        upsert=True
    )

    return billable_hours


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
    
    duration_minutes, end_time = _calculate_duration_minutes(meeting)
    
    await _update_meeting_record(db, meeting_id, duration_minutes, end_time)
    billable_hours = await _update_case_financials(db, meeting, duration_minutes)
    
    return {
        "message": "Meeting completed successfully",
        "duration_minutes": duration_minutes,
        "billable_hours_added": duration_minutes / 60.0
    }