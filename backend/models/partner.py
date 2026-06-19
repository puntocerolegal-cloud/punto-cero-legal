"""Modelo Partner (Socios Comerciales) — Punto Cero OS (multi-tenant)."""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Literal
from datetime import datetime

VERTICALS = ("Medicina", "Odontología", "Firmas Jurídicas", "Jurídico")
STATUSES = ("active", "pending", "inactive")
STAGES = ("lead", "contactado", "calificado", "propuesta", "negociacion", "convertido")

Status = Literal["active", "pending", "inactive"]
Stage = Literal["lead", "contactado", "calificado", "propuesta", "negociacion", "convertido"]


class PartnerCreate(BaseModel):
    companyName: str = Field(..., min_length=2, max_length=160)
    contactName: Optional[str] = Field(None, max_length=160)
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    vertical: str = Field(..., min_length=2, max_length=80)
    status: Status = "pending"
    stage: Stage = "lead"
    commissionRate: float = Field(0, ge=0, le=100)
    projectedRevenue: float = Field(0, ge=0)
    organizationId: Optional[str] = None
    country: Optional[str] = Field(None, max_length=80)         # aditivo (Red de Agentes)
    currencyCode: Optional[str] = Field(None, max_length=8)     # aditivo (moneda local)


class PartnerUpdate(BaseModel):
    companyName: Optional[str] = Field(None, min_length=2, max_length=160)
    contactName: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    vertical: Optional[str] = None
    status: Optional[Status] = None
    stage: Optional[Stage] = None
    commissionRate: Optional[float] = Field(None, ge=0, le=100)
    projectedRevenue: Optional[float] = Field(None, ge=0)
    organizationId: Optional[str] = None
    country: Optional[str] = Field(None, max_length=80)
    currencyCode: Optional[str] = Field(None, max_length=8)


class Partner(BaseModel):
    id: str = Field(alias="_id")
    tenantId: str
    organizationId: Optional[str] = None
    companyName: str
    contactName: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    vertical: str
    status: Status
    stage: Stage
    commissionRate: float = 0
    projectedRevenue: float = 0
    createdAt: datetime
    updatedAt: datetime
    createdBy: Optional[str] = None

    class Config:
        populate_by_name = True
