from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime
from bson import ObjectId

class AppointmentBase(BaseModel):
    lawyer_id: str
    title: str
    description: Optional[str] = None
    event_type: Literal["meeting", "hearing", "deadline", "reminder"]
    start_time: datetime
    end_time: datetime
    location: Optional[str] = None
    status: Literal["scheduled", "completed", "cancelled"] = "scheduled"

class AppointmentCreate(AppointmentBase):
    client_id: Optional[str] = None
    case_id: Optional[str] = None
    reminder_time: Optional[datetime] = None

class Appointment(AppointmentBase):
    id: str = Field(default_factory=lambda: str(ObjectId()), alias="_id")
    client_id: Optional[str] = None
    case_id: Optional[str] = None
    reminder_sent: bool = False
    reminder_time: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}