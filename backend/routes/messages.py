from fastapi import APIRouter, HTTPException, Depends
from typing import List
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorDatabase
from ..models.message import MessageCreate, Message
from bson import ObjectId

router = APIRouter(prefix="/messages", tags=["Message Center"])

async def get_db():
    from ..server import db
    return db

@router.post("/", response_model=dict)
async def create_message(message_data: MessageCreate, db: AsyncIOMotorDatabase = Depends(get_db)):
    import uuid
    
    message_dict = message_data.model_dump()
    message_dict["read"] = False
    message_dict["created_at"] = datetime.utcnow()
    message_dict["updated_at"] = datetime.utcnow()
    
    # Generate thread_id if not provided
    if not message_dict.get("thread_id"):
        message_dict["thread_id"] = str(uuid.uuid4())
    
    result = await db.messages.insert_one(message_dict)
    message_dict["_id"] = str(result.inserted_id)
    
    return message_dict

@router.get("/", response_model=List[dict])
async def get_messages(
    user_id: str = None,
    case_id: str = None,
    thread_id: str = None,
    unread_only: bool = False,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    query = {}
    
    if user_id:
        query["$or"] = [
            {"sender_id": user_id},
            {"recipient_id": user_id}
        ]
    
    if case_id:
        query["case_id"] = case_id
    
    if thread_id:
        query["thread_id"] = thread_id
    
    if unread_only:
        query["read"] = False
    
    messages = await db.messages.find(query).sort("created_at", -1).to_list(1000)
    for message in messages:
        message["_id"] = str(message["_id"])
    return messages

@router.patch("/{message_id}/mark-read", response_model=dict)
async def mark_message_as_read(message_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    result = await db.messages.update_one(
        {"_id": ObjectId(message_id)},
        {"$set": {"read": True, "updated_at": datetime.utcnow()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Message not found")
    
    message = await db.messages.find_one({"_id": ObjectId(message_id)})
    message["_id"] = str(message["_id"])
    return message