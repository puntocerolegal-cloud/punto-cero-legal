"""Modelo Implementation — Punto Cero OS (multi-tenant)."""
from pydantic import BaseModel, Field
from typing import Optional, Literal, List
from datetime import datetime

STAGES = ("sold", "kickoff", "configuration", "migration", "training", "go_live", "operation")
RISK_LEVELS = ("low", "medium", "high", "critical")
STATUSES = ("active", "blocked", "completed", "cancelled")

Stage = Literal["sold", "kickoff", "configuration", "migration", "training", "go_live", "operation"]
RiskLevel = Literal["low", "medium", "high", "critical"]
Status = Literal["active", "blocked", "completed", "cancelled"]


class ImplementationCreate(BaseModel):
    companyName: str = Field(..., min_length=2, max_length=160)
    vertical: str = Field(..., min_length=2, max_length=80)
    projectManager: Optional[str] = Field(None, max_length=160)
    assignedTeam: List[str] = Field(default_factory=list)
    stage: Stage = "sold"
    progress: int = Field(0, ge=0, le=100)
    goLiveDate: Optional[str] = None
    status: Status = "active"
    riskLevel: RiskLevel = "low"
    notes: Optional[str] = Field(None, max_length=2000)
    organizationId: Optional[str] = None


class ImplementationUpdate(BaseModel):
    companyName: Optional[str] = Field(None, min_length=2, max_length=160)
    vertical: Optional[str] = None
    projectManager: Optional[str] = None
    assignedTeam: Optional[List[str]] = None
    stage: Optional[Stage] = None
    progress: Optional[int] = Field(None, ge=0, le=100)
    goLiveDate: Optional[str] = None
    status: Optional[Status] = None
    riskLevel: Optional[RiskLevel] = None
    notes: Optional[str] = Field(None, max_length=2000)
    organizationId: Optional[str] = None


class Implementation(BaseModel):
    id: str = Field(alias="_id")
    tenantId: str
    organizationId: Optional[str] = None
    companyName: str
    vertical: str
    projectManager: Optional[str] = None
    assignedTeam: List[str] = Field(default_factory=list)
    stage: Stage
    progress: int
    goLiveDate: Optional[str] = None
    status: Status
    riskLevel: RiskLevel
    notes: Optional[str] = None
    createdAt: datetime
    updatedAt: datetime
    createdBy: Optional[str] = None

    class Config:
        populate_by_name = True
