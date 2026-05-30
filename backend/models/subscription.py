from pydantic import BaseModel, Field
from typing import Literal
from datetime import datetime, date
from bson import ObjectId

class SubscriptionBase(BaseModel):
    lawyer_id: str
    plan_type: Literal["basic", "pro", "enterprise"]
    price: float
    status: Literal["active", "expired", "cancelled"] = "active"
    payment_method: str
    cases_limit: int
    storage_limit: int

class SubscriptionCreate(SubscriptionBase):
    start_date: date = Field(default_factory=date.today)
    end_date: date

class Subscription(SubscriptionBase):
    id: str = Field(default_factory=lambda: str(ObjectId()), alias="_id")
    start_date: date
    end_date: date
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str, date: lambda v: v.isoformat()}