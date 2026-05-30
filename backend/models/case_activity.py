from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime
from bson import ObjectId

class CaseActivityBase(BaseModel):
    case_id: str
    user_id: str
    activity_type: Literal["note", "call", "email", "document", "meeting", "hearing"]
    description: str
    duration_minutes: int = 0
    billable: bool = False

class CaseActivityCreate(CaseActivityBase):
    meeting_id: Optional[str] = None

class CaseActivity(CaseActivityBase):
    id: str = Field(default_factory=lambda: str(ObjectId()), alias="_id")
    meeting_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}