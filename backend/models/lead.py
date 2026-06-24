from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Literal
from datetime import datetime
from bson import ObjectId

class LeadBase(BaseModel):
    lawyer_id: str
    client_name: str
    client_email: EmailStr
    client_phone: str
    legal_area: str
    description: str
    status: Literal["new", "contacted", "qualified", "converted"] = "new"
    source: Optional[str] = "website"
    agent_id: Optional[str] = None  # FASE 6: soporte para agentes comerciales

class LeadCreate(LeadBase):
    pass

class Lead(LeadBase):
    id: str = Field(default_factory=lambda: str(ObjectId()), alias="_id")
    assigned_date: datetime = Field(default_factory=datetime.utcnow)
    converted_to: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class LeadUpdate(BaseModel):
    status: Optional[Literal["new", "contacted", "qualified", "converted"]] = None
    description: Optional[str] = None
    converted_to: Optional[str] = None
