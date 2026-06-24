from pydantic import BaseModel, Field
from typing import Optional, Literal, Dict, Any
from datetime import datetime
from bson import ObjectId

class TimelineEventBase(BaseModel):
    event_type: Literal[
        "LEAD_CREATED",
        "LEAD_QUALIFIED",
        "LEAD_CONVERTED",
        "CASE_CREATED",
        "COMMISSION_CREATED",
        "COMMISSION_APPROVED",
        "COMMISSION_PAID",
        "CASE_CLOSED",
        # FASE 11: Financial Events
        "PAYMENT_INITIATED",
        "PAYMENT_COMPLETED",
        "INVOICE_GENERATED",
        "INVOICE_ISSUED",
        "COMMISSION_SPLIT_APPLIED",
        # FASE 12: AI Events
        "AI_LEAD_SCORED",
        "AI_LEAD_ASSIGNED",
        "AI_CASE_PREDICTED",
        "AI_RECOMMENDATION_GENERATED",
        # FASE 13: Autonomous Events
        "AUTONOMOUS_LEAD_ASSIGNED",
        "AUTONOMOUS_LEAD_ROUTED",
        "AUTONOMOUS_CASE_REASSIGNED",
        "AUTONOMOUS_CASE_ROUTED",
        "AUTONOMOUS_REBALANCE_EXECUTED",
        "AUTONOMOUS_OPTIMIZATION_APPLIED",
        "AUTONOMOUS_SELF_HEAL_TRIGGERED",
        # FASE 14: Global Network Events
        "GLOBAL_CASE_ROUTED",
        "CROSS_BORDER_ASSIGNMENT",
        "INTERNATIONAL_PAYMENT",
        "GLOBAL_FIRM_CONNECTED",
        "COUNTRY_LIMIT_TRIGGERED",
        # FASE 15: Legal OS Events
        "LEGAL_OS_CYCLE_EXECUTED",
        "EVENT_CASCADE_TRIGGERED",
        "ZERO_ADMIN_MODE_ENABLED",
        "SYSTEM_SELF_HEALING_EXECUTED",
        "OPERATING_SYSTEM_ACTIVE",
    ]
    lead_id: Optional[str] = None
    case_id: Optional[str] = None
    commission_id: Optional[str] = None
    agent_id: Optional[str] = None
    lawyer_id: Optional[str] = None
    organization_id: Optional[str] = None
    description: str
    metadata: Optional[Dict[str, Any]] = None

class TimelineEventCreate(TimelineEventBase):
    pass

class TimelineEvent(TimelineEventBase):
    id: str = Field(default_factory=lambda: str(ObjectId()), alias="_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
