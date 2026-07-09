"""
Transaction Repository DTOs
Pydantic models for transaction validation and serialization
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Literal
from datetime import datetime
from bson import ObjectId


class TransactionBase(BaseModel):
    """Base transaction fields"""
    
    payment_id: str = Field(..., description="Unique payment identifier (PCL-xxxxx)")
    user_email: EmailStr = Field(..., description="User email address")
    user_name: str = Field(..., description="User full name")
    plan_id: Literal["esencial", "profesional", "elite", "ilimitado"] = Field(
        ..., description="Subscription plan ID"
    )
    billing_cycle: Literal["monthly", "annual"] = Field(
        "monthly", description="Billing cycle"
    )
    amount_cop: float = Field(..., description="Amount in COP")
    amount_local: float = Field(..., description="Amount in local currency")
    currency: str = Field(..., description="Currency code (ISO 4217)")
    country: str = Field(..., description="Country name")
    gateway: Literal["mercado_pago", "paypal"] = Field(
        ..., description="Payment gateway used"
    )
    status: Literal["pending", "paid", "rejected", "cancelled", "refunded"] = Field(
        "pending", description="Transaction status"
    )
    checkout_url: Optional[str] = Field(None, description="Checkout URL")
    preference_id: Optional[str] = Field(None, description="Mercado Pago preference ID")
    mp_payment_id: Optional[str] = Field(None, description="Mercado Pago payment ID")
    referral_code: Optional[str] = Field(None, description="Referral code if applicable")
    referrer_id: Optional[str] = Field(None, description="Referrer user ID (ObjectId as string)")
    reward_applied: Optional[bool] = Field(False, description="Whether referral reward was applied")
    type: Optional[Literal["payment", "renewal", "plan_change", "reactivation"]] = Field(
        "payment", description="Transaction type"
    )
    proration_days: Optional[int] = Field(None, description="Days for proration (plan changes)")
    old_plan_id: Optional[str] = Field(None, description="Previous plan ID (plan changes)")
    retry_count: Optional[int] = Field(0, description="Number of retry attempts")
    error_message: Optional[str] = Field(None, description="Error message if failed")
    refund_reason: Optional[str] = Field(None, description="Refund reason if refunded")
    chargeback_reason: Optional[str] = Field(None, description="Chargeback reason if disputed")
    created_at: Optional[datetime] = Field(None, description="Creation timestamp")
    expires_at: Optional[datetime] = Field(None, description="Expiration timestamp")
    paid_at: Optional[datetime] = Field(None, description="Payment completion timestamp")
    refunded_at: Optional[datetime] = Field(None, description="Refund timestamp")
    deleted_at: Optional[datetime] = Field(None, description="Soft delete timestamp")
    firm_id: Optional[str] = Field(None, description="Multi-tenant firm ID (auto-populated)")


class TransactionDocument(TransactionBase):
    """Complete transaction document (with MongoDB fields)"""
    
    id: Optional[ObjectId] = Field(None, alias="_id")
    updated_at: Optional[datetime] = Field(None, description="Last update timestamp")

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True


class TransactionResponse(BaseModel):
    """API response model for transaction"""
    
    id: str = Field(..., alias="_id")
    payment_id: str
    user_email: str
    user_name: str
    plan_id: str
    amount_local: float
    currency: str
    country: str
    status: str
    gateway: str
    checkout_url: Optional[str] = None
    created_at: datetime
    expires_at: Optional[datetime] = None
    paid_at: Optional[datetime] = None

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
