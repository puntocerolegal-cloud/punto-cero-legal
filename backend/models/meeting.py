from pydantic import BaseModel, Field
from typing import Optional, Literal, List
from datetime import datetime
from bson import ObjectId

class MeetingBase(BaseModel):
    case_id: str
    host_id: str
    title: str
    participants: List[str] = []
    scheduled_time: datetime
    status: Literal["scheduled", "in_progress", "completed", "cancelled"] = "scheduled"
    notes: Optional[str] = None

class MeetingCreate(MeetingBase):
    pass

class Meeting(MeetingBase):
    id: str = Field(default_factory=lambda: str(ObjectId()), alias="_id")
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    duration_minutes: int = 0
    meeting_link: Optional[str] = None
    room_id: Optional[str] = None
    recording_url: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class MeetingUpdate(BaseModel):
    status: Optional[Literal["scheduled", "in_progress", "completed", "cancelled"]] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    notes: Optional[str] = None