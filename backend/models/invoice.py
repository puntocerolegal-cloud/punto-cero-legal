from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime, date
from bson import ObjectId

class InvoiceBase(BaseModel):
    case_id: str
    lawyer_id: str
    client_id: str
    description: str
    amount: float
    hours: float
    hourly_rate: float
    status: Literal["draft", "sent", "paid", "overdue"] = "draft"
    issue_date: date = Field(default_factory=date.today)
    due_date: date

class InvoiceCreate(InvoiceBase):
    pass

class Invoice(InvoiceBase):
    id: str = Field(default_factory=lambda: str(ObjectId()), alias="_id")
    invoice_number: str
    paid_date: Optional[date] = None
    payment_method: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str, date: lambda v: v.isoformat()}