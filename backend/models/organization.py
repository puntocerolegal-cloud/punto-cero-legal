"""Modelo Organization — base del sistema multi-tenant de Punto Cero OS."""
from pydantic import BaseModel, Field
from typing import Optional, Literal, Dict, Any
from datetime import datetime

VERTICALS = ("Medicina", "Odontología", "Jurídico")
PLANS = ("Essential", "Professional", "Enterprise")
STATUSES = ("active", "trial", "at_risk", "suspended")

Vertical = Literal["Medicina", "Odontología", "Jurídico"]
Plan = Literal["Essential", "Professional", "Enterprise"]
Status = Literal["active", "trial", "at_risk", "suspended"]


class OrganizationCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=160)
    slug: Optional[str] = Field(None, max_length=160)  # se autogenera si falta
    vertical: Vertical
    plan: Plan = "Essential"
    status: Status = "active"
    ownerId: Optional[str] = None
    settings: Dict[str, Any] = Field(default_factory=dict)
    limits: Dict[str, Any] = Field(default_factory=dict)


class OrganizationUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=160)
    slug: Optional[str] = Field(None, max_length=160)
    vertical: Optional[Vertical] = None
    plan: Optional[Plan] = None
    status: Optional[Status] = None
    ownerId: Optional[str] = None
    settings: Optional[Dict[str, Any]] = None
    limits: Optional[Dict[str, Any]] = None


class Organization(BaseModel):
    id: str = Field(alias="_id")
    tenantId: str
    name: str
    slug: str
    vertical: Vertical
    plan: Plan
    status: Status
    ownerId: Optional[str] = None
    settings: Dict[str, Any] = Field(default_factory=dict)
    limits: Dict[str, Any] = Field(default_factory=dict)
    createdAt: datetime
    updatedAt: datetime

    class Config:
        populate_by_name = True
