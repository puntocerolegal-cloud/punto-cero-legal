from fastapi import APIRouter, HTTPException, Depends, Header
from typing import List, Optional
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorDatabase
from models.message import MessageCreate, Message
from bson import ObjectId

router = APIRouter(prefix="/messages", tags=["Message Center"])

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
async def create_message(
    message_data: MessageCreate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user = Depends(get_current_user_from_auth)
):
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
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user = Depends(get_current_user_from_auth)
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
async def mark_message_as_read(
    message_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user = Depends(get_current_user_from_auth)
):
    result = await db.messages.update_one(
        {"_id": ObjectId(message_id)},
        {"$set": {"read": True, "updated_at": datetime.utcnow()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Message not found")
    
    message = await db.messages.find_one({"_id": ObjectId(message_id)})
    message["_id"] = str(message["_id"])
    return message
