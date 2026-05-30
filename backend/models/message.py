from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime
from bson import ObjectId

class MessageBase(BaseModel):
    sender_id: str
    recipient_id: str
    subject: str
    message: str
    thread_id: Optional[str] = None
    attachments: List[Dict] = []

class MessageCreate(MessageBase):
    case_id: Optional[str] = None

class Message(MessageBase):
    id: str = Field(default_factory=lambda: str(ObjectId()), alias="_id")
    case_id: Optional[str] = None
    read: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}