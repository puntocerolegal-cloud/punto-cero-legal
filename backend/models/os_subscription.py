"""Modelo Subscription (Punto Cero OS, multi-tenant).

Se nombra os_subscription.py para NO colisionar con el models/subscription.py
legacy del dominio jurídico (suscripción del abogado), que queda intacto.
"""
from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime

PLANS = ("essential", "professional", "enterprise")
BILLING_CYCLES = ("monthly", "quarterly", "annual")
STATUSES = ("trial", "active", "pending", "suspended", "cancelled", "expired")

Plan = Literal["essential", "professional", "enterprise"]
BillingCycle = Literal["monthly", "quarterly", "annual"]
Status = Literal["trial", "active", "pending", "suspended", "cancelled", "expired"]


class SubscriptionCreate(BaseModel):
    companyName: str = Field(..., min_length=2, max_length=160)
    vertical: str = Field(..., min_length=2, max_length=80)
    plan: Plan = "essential"
    status: Status = "trial"
    billingCycle: BillingCycle = "monthly"
    usersIncluded: int = Field(0, ge=0)
    usersUsed: int = Field(0, ge=0)
    monthlyAmount: float = Field(0, ge=0)
    annualAmount: float = Field(0, ge=0)
    startDate: Optional[str] = None
    renewalDate: Optional[str] = None
    expirationDate: Optional[str] = None
    autoRenew: bool = True
    implementationId: Optional[str] = None
    organizationId: Optional[str] = None


class SubscriptionUpdate(BaseModel):
    companyName: Optional[str] = Field(None, min_length=2, max_length=160)
    vertical: Optional[str] = None
    plan: Optional[Plan] = None
    status: Optional[Status] = None
    billingCycle: Optional[BillingCycle] = None
    usersIncluded: Optional[int] = Field(None, ge=0)
    usersUsed: Optional[int] = Field(None, ge=0)
    monthlyAmount: Optional[float] = Field(None, ge=0)
    annualAmount: Optional[float] = Field(None, ge=0)
    startDate: Optional[str] = None
    renewalDate: Optional[str] = None
    expirationDate: Optional[str] = None
    autoRenew: Optional[bool] = None
    implementationId: Optional[str] = None
    organizationId: Optional[str] = None


class Subscription(BaseModel):
    id: str = Field(alias="_id")
    tenantId: str
    organizationId: Optional[str] = None
    companyName: str
    vertical: str
    plan: Plan
    status: Status
    billingCycle: BillingCycle
    usersIncluded: int = 0
    usersUsed: int = 0
    monthlyAmount: float = 0
    annualAmount: float = 0
    startDate: Optional[str] = None
    renewalDate: Optional[str] = None
    expirationDate: Optional[str] = None
    autoRenew: bool = True
    implementationId: Optional[str] = None
    createdAt: datetime
    updatedAt: datetime
    createdBy: Optional[str] = None

    class Config:
        populate_by_name = True
