from fastapi import APIRouter, HTTPException, Depends, status
from typing import List
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorDatabase
from models.case import CaseCreate, Case, CaseUpdate
from utils.case_number_generator import generate_case_number
from bson import ObjectId

router = APIRouter(prefix="/cases", tags=["Case Management"])

async def get_db():
    from server import db
    return db

@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_case(case_data: CaseCreate, db: AsyncIOMotorDatabase = Depends(get_db)):
    case_dict = case_data.model_dump()
    case_dict["case_number"] = generate_case_number()
    case_dict["documents"] = []
    case_dict["billable_hours"] = 0.0
    case_dict["total_billed"] = 0.0
    case_dict["created_at"] = datetime.utcnow()
    case_dict["updated_at"] = datetime.utcnow()
    
    result = await db.cases.insert_one(case_dict)
    case_dict["_id"] = str(result.inserted_id)
    
    return case_dict

@router.get("/", response_model=List[dict])
async def get_cases(
    lawyer_id: str = None, 
    client_id: str = None, 
    status: str = None,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    query = {}
    if lawyer_id:
        query["lawyer_id"] = lawyer_id
    if client_id:
        query["client_id"] = client_id
    if status:
        query["status"] = status
    
    cases = await db.cases.find(query).sort("created_at", -1).to_list(1000)
    
    # Enrich with client and lawyer info
    for case in cases:
        case["_id"] = str(case["_id"])
        
        lawyer = await db.users.find_one({"_id": ObjectId(case["lawyer_id"])})
        if lawyer:
            case["lawyer_name"] = lawyer["full_name"]
        
        client = await db.users.find_one({"_id": ObjectId(case["client_id"])})
        if client:
            case["client_name"] = client["full_name"]
    
    return cases

@router.get("/{case_id}", response_model=dict)
async def get_case(case_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    case = await db.cases.find_one({"_id": ObjectId(case_id)})
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    case["_id"] = str(case["_id"])
    
    # Get activities
    activities = await db.case_activities.find({"case_id": case_id}).sort("created_at", -1).to_list(100)
    for activity in activities:
        activity["_id"] = str(activity["_id"])
    case["activities"] = activities
    
    # Get meetings
    meetings = await db.meetings.find({"case_id": case_id}).to_list(100)
    for meeting in meetings:
        meeting["_id"] = str(meeting["_id"])
    case["meetings"] = meetings
    
    return case

@router.patch("/{case_id}", response_model=dict)
async def update_case(case_id: str, case_update: CaseUpdate, db: AsyncIOMotorDatabase = Depends(get_db)):
    update_data = {k: v for k, v in case_update.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    
    result = await db.cases.update_one(
        {"_id": ObjectId(case_id)},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Case not found")
    
    case = await db.cases.find_one({"_id": ObjectId(case_id)})
    case["_id"] = str(case["_id"])
    return case

@router.post("/{case_id}/start-meeting", response_model=dict)
async def start_meeting_from_case(case_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    """
    INTEGRACIÓN CRÍTICA: Gestión de Casos → Sala de Conferencias
    Botón "Iniciar Sala" que crea reunión automáticamente
    """
    import uuid
    
    # Get case
    case = await db.cases.find_one({"_id": ObjectId(case_id)})
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    # Create meeting
    meeting_data = {
        "case_id": case_id,
        "host_id": case["lawyer_id"],
        "title": f"Reunión: {case['title']}",
        "participants": [case["lawyer_id"], case["client_id"]],
        "scheduled_time": datetime.utcnow(),
        "start_time": datetime.utcnow(),
        "status": "in_progress",
        "room_id": str(uuid.uuid4()),
        "meeting_link": f"https://meet.puntocero.legal/room/{uuid.uuid4()}",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    meeting_result = await db.meetings.insert_one(meeting_data)
    meeting_id = str(meeting_result.inserted_id)
    
    # Create case activity
    activity_data = {
        "case_id": case_id,
        "user_id": case["lawyer_id"],
        "activity_type": "meeting",
        "description": f"Reunión iniciada: {case['title']}",
        "duration_minutes": 0,
        "billable": True,
        "meeting_id": meeting_id,
        "created_at": datetime.utcnow()
    }
    
    await db.case_activities.insert_one(activity_data)
    
    return {
        "meeting_id": meeting_id,
        "meeting_link": meeting_data["meeting_link"],
        "room_id": meeting_data["room_id"],
        "status": "in_progress"
    }

@router.delete("/{case_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_case(case_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    # Check for pending invoices
    pending_invoices = await db.invoices.find_one({
        "case_id": case_id,
        "status": {"$ne": "paid"}
    })
    
    if pending_invoices:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete case with pending invoices"
        )
    
    result = await db.cases.delete_one({"_id": ObjectId(case_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Case not found")
    
    # Delete related data
    await db.case_activities.delete_many({"case_id": case_id})
    await db.meetings.delete_many({"case_id": case_id})
    
    return None