from fastapi import APIRouter, HTTPException, Depends, status
from typing import List
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorDatabase
from ..models.lead import LeadCreate, Lead, LeadUpdate
from bson import ObjectId

router = APIRouter(prefix="/leads", tags=["CRM - Leads"])

async def get_db():
    from ..server import db
    return db

@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_lead(lead_data: LeadCreate, db: AsyncIOMotorDatabase = Depends(get_db)):
    lead_dict = lead_data.model_dump()
    lead_dict["assigned_date"] = datetime.utcnow()
    lead_dict["created_at"] = datetime.utcnow()
    lead_dict["updated_at"] = datetime.utcnow()
    lead_dict["converted_to"] = None
    
    result = await db.leads.insert_one(lead_dict)
    lead_dict["_id"] = str(result.inserted_id)
    
    return lead_dict

@router.get("/", response_model=List[dict])
async def get_leads(lawyer_id: str = None, status: str = None, db: AsyncIOMotorDatabase = Depends(get_db)):
    query = {}
    if lawyer_id:
        query["lawyer_id"] = lawyer_id
    if status:
        query["status"] = status
    
    leads = await db.leads.find(query).sort("created_at", -1).to_list(1000)
    for lead in leads:
        lead["_id"] = str(lead["_id"])
    return leads

@router.get("/{lead_id}", response_model=dict)
async def get_lead(lead_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    lead = await db.leads.find_one({"_id": ObjectId(lead_id)})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    lead["_id"] = str(lead["_id"])
    return lead

@router.patch("/{lead_id}", response_model=dict)
async def update_lead(lead_id: str, lead_update: LeadUpdate, db: AsyncIOMotorDatabase = Depends(get_db)):
    update_data = {k: v for k, v in lead_update.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    
    result = await db.leads.update_one(
        {"_id": ObjectId(lead_id)},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    lead = await db.leads.find_one({"_id": ObjectId(lead_id)})
    lead["_id"] = str(lead["_id"])
    return lead

@router.post("/{lead_id}/convert", response_model=dict)
async def convert_lead_to_case(lead_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    """
    INTEGRACIÓN CRÍTICA: CRM → Gestión de Casos
    Convierte un lead en un caso automáticamente
    """
    from ..utils.case_number_generator import generate_case_number
    from datetime import date
    
    # Get lead
    lead = await db.leads.find_one({"_id": ObjectId(lead_id)})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    if lead.get("status") == "converted":
        raise HTTPException(status_code=400, detail="Lead already converted")
    
    # Create client user
    client_data = {
        "email": lead["client_email"],
        "full_name": lead["client_name"],
        "phone": lead["client_phone"],
        "role": "client",
        "status": "active",
        "password_hash": "pending",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    existing_client = await db.users.find_one({"email": lead["client_email"]})
    if existing_client:
        client_id = str(existing_client["_id"])
    else:
        client_result = await db.users.insert_one(client_data)
        client_id = str(client_result.inserted_id)
    
    # Create case
    case_data = {
        "case_number": generate_case_number(),
        "lawyer_id": lead["lawyer_id"],
        "client_id": client_id,
        "title": f"Caso: {lead['description'][:50]}",
        "legal_area": lead["legal_area"],
        "description": lead["description"],
        "status": "open",
        "priority": "medium",
        "start_date": date.today(),
        "documents": [],
        "billable_hours": 0.0,
        "total_billed": 0.0,
        "tags": [],
        "lead_source_id": lead_id,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    case_result = await db.cases.insert_one(case_data)
    case_id = str(case_result.inserted_id)
    
    # Update lead status
    await db.leads.update_one(
        {"_id": ObjectId(lead_id)},
        {"$set": {
            "status": "converted",
            "converted_to": case_id,
            "updated_at": datetime.utcnow()
        }}
    )
    
    return {
        "message": "Lead converted successfully",
        "case_id": case_id,
        "case_number": case_data["case_number"],
        "client_id": client_id
    }

@router.delete("/{lead_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_lead(lead_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    result = await db.leads.delete_one({"_id": ObjectId(lead_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Lead not found")
    return None