from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime
from bson import ObjectId

class InvoiceBase(BaseModel):
    organization_id: str
    amount: float
    currency: str = "USD"
    status: Literal["draft", "issued", "paid", "cancelled"] = "draft"
    period: str  # "2024-01" format
    description: Optional[str] = None
    payment_method: Optional[str] = None
    transaction_reference: Optional[str] = None

class InvoiceCreate(InvoiceBase):
    pass

class Invoice(InvoiceBase):
    id: str = Field(default_factory=lambda: str(ObjectId()), alias="_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    issued_at: Optional[datetime] = None
    paid_at: Optional[datetime] = None
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class InvoiceUpdate(BaseModel):
    status: Optional[Literal["draft", "issued", "paid", "cancelled"]] = None
    amount: Optional[float] = None
    payment_method: Optional[str] = None
    transaction_reference: Optional[str] = None
    paid_at: Optional[datetime] = None
