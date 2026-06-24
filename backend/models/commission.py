from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime
from bson import ObjectId

class CommissionBase(BaseModel):
    agent_id: str
    case_id: str
    organization_id: Optional[str] = None
    amount: float
    currency: str = "USD"
    status: Literal["pending", "approved", "paid", "rejected"] = "pending"
    commission_rate: Optional[float] = None
    sale_value: Optional[float] = None
    # FASE 11.2: Split Financiero
    lawyer_share: Optional[float] = None
    firm_share: Optional[float] = None
    platform_fee: Optional[float] = None
    # FASE 11.1: Payment Details
    payment_method: Optional[str] = None
    transaction_reference: Optional[str] = None

class CommissionCreate(CommissionBase):
    pass

class Commission(CommissionBase):
    id: str = Field(default_factory=lambda: str(ObjectId()), alias="_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    approved_at: Optional[datetime] = None
    paid_at: Optional[datetime] = None
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class CommissionUpdate(BaseModel):
    status: Optional[Literal["pending", "approved", "paid", "rejected"]] = None
    amount: Optional[float] = None
    approved_at: Optional[datetime] = None
    paid_at: Optional[datetime] = None
    lawyer_share: Optional[float] = None
    firm_share: Optional[float] = None
    platform_fee: Optional[float] = None
    payment_method: Optional[str] = None
    transaction_reference: Optional[str] = None
