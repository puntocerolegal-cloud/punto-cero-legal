from pydantic import BaseModel, Field
from typing import Optional, Literal, List, Dict
from datetime import datetime, date
from bson import ObjectId

class CaseBase(BaseModel):
    lawyer_id: str
    client_id: str
    title: str
    legal_area: str
    description: str
    status: Literal["open", "in_progress", "closed", "archived"] = "open"
    priority: Literal["low", "medium", "high", "urgent"] = "medium"
    deadline: Optional[date] = None
    court: Optional[str] = None
    case_type: Optional[str] = None
    tags: List[str] = []

class CaseCreate(CaseBase):
    lead_source_id: Optional[str] = None

class Case(CaseBase):
    id: str = Field(default_factory=lambda: str(ObjectId()), alias="_id")
    case_number: str
    start_date: date = Field(default_factory=date.today)
    documents: List[Dict] = []
    billable_hours: float = 0.0
    total_billed: float = 0.0
    lead_source_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str, date: lambda v: v.isoformat()}

class CaseUpdate(BaseModel):
    status: Optional[Literal["open", "in_progress", "closed", "archived"]] = None
    priority: Optional[Literal["low", "medium", "high", "urgent"]] = None
    description: Optional[str] = None
    deadline: Optional[date] = None
    billable_hours: Optional[float] = None
    total_billed: Optional[float] = None