"""Modelo Billing (Facturación Global) — Punto Cero OS (multi-tenant)."""
from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime

SOURCES = ("subscription", "implementation", "organization")
STATUSES = ("paid", "pending", "overdue", "review")
PAYMENT_METHODS = ("transfer", "pse", "card", "cash")

Source = Literal["subscription", "implementation", "organization"]
Status = Literal["paid", "pending", "overdue", "review"]
PaymentMethod = Literal["transfer", "pse", "card", "cash"]


class InvoiceCreate(BaseModel):
    invoiceNumber: Optional[str] = Field(None, max_length=80)  # se autogenera si falta
    clientName: str = Field(..., min_length=2, max_length=160)
    source: Source = "subscription"
    status: Status = "pending"
    amount: float = Field(..., ge=0)
    issueDate: Optional[str] = None
    dueDate: Optional[str] = None
    paidDate: Optional[str] = None
    paymentMethod: Optional[PaymentMethod] = None
    vertical: Optional[str] = None
    notes: Optional[str] = Field(None, max_length=2000)
    organizationId: Optional[str] = None


class InvoiceUpdate(BaseModel):
    invoiceNumber: Optional[str] = Field(None, max_length=80)
    clientName: Optional[str] = Field(None, min_length=2, max_length=160)
    source: Optional[Source] = None
    status: Optional[Status] = None
    amount: Optional[float] = Field(None, ge=0)
    issueDate: Optional[str] = None
    dueDate: Optional[str] = None
    paidDate: Optional[str] = None
    paymentMethod: Optional[PaymentMethod] = None
    vertical: Optional[str] = None
    notes: Optional[str] = Field(None, max_length=2000)
    organizationId: Optional[str] = None


class Invoice(BaseModel):
    id: str = Field(alias="_id")
    tenantId: str
    organizationId: Optional[str] = None
    invoiceNumber: str
    clientName: str
    source: Source
    status: Status
    amount: float
    issueDate: Optional[str] = None
    dueDate: Optional[str] = None
    paidDate: Optional[str] = None
    paymentMethod: Optional[PaymentMethod] = None
    vertical: Optional[str] = None
    notes: Optional[str] = None
    createdAt: datetime
    updatedAt: datetime
    createdBy: Optional[str] = None

    class Config:
        populate_by_name = True
