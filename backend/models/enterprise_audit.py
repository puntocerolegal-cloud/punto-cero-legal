"""
Enterprise Audit & Activity Tracking Models
Complete audit trail for compliance
"""

from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field
from enum import Enum


class ActivityType(str, Enum):
    """Activity types for tracking"""
    PAGE_VIEW = "PAGE_VIEW"
    ACTION = "ACTION"
    EVENT = "EVENT"
    WORKFLOW_STEP = "WORKFLOW_STEP"
    DOCUMENT_ACCESS = "DOCUMENT_ACCESS"
    REPORT_GENERATED = "REPORT_GENERATED"


class DocumentAccessType(str, Enum):
    """Document access types"""
    VIEWED = "VIEWED"
    DOWNLOADED = "DOWNLOADED"
    PRINTED = "PRINTED"
    EXPORTED = "EXPORTED"


# ============================================================================
# ACTIVITY LOG (Lightweight tracking)
# ============================================================================

class ActivityBase(BaseModel):
    """Base Activity model"""
    activity_type: ActivityType
    resource_type: Optional[str] = None
    resource_id: Optional[str] = None
    duration_ms: Optional[int] = None


class Activity(ActivityBase):
    """Complete Activity model (persisted)"""
    id: Optional[str] = Field(None, alias="_id")
    firm_id: str
    user_id: str
    metadata: Optional[Dict[str, Any]] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        use_enum_values = True


# ============================================================================
# DOCUMENT ACCESS AUDIT
# ============================================================================

class DocumentAccessBase(BaseModel):
    """Base DocumentAccess model"""
    document_id: str
    user_id: str
    access_type: DocumentAccessType
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None


class DocumentAccess(DocumentAccessBase):
    """Complete DocumentAccess model (persisted)"""
    id: Optional[str] = Field(None, alias="_id")
    firm_id: str = Field(..., description="Multi-tenant")
    accessed_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        use_enum_values = True


# ============================================================================
# CASE ACTIVITY (Per-case timeline)
# ============================================================================

class CaseActivityType(str, Enum):
    """Case activity types"""
    CREATED = "CREATED"
    UPDATED = "UPDATED"
    ASSIGNED = "ASSIGNED"
    HEARING_SCHEDULED = "HEARING_SCHEDULED"
    DOCUMENT_ADDED = "DOCUMENT_ADDED"
    EXPENSE_LOGGED = "EXPENSE_LOGGED"
    STATUS_CHANGED = "STATUS_CHANGED"
    PRIORITY_CHANGED = "PRIORITY_CHANGED"
    CLOSED = "CLOSED"


class CaseActivityBase(BaseModel):
    """Base CaseActivity model"""
    case_id: str
    activity_type: CaseActivityType
    description: str
    performed_by_user_id: str
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    related_object_id: Optional[str] = None


class CaseActivity(CaseActivityBase):
    """Complete CaseActivity model (persisted)"""
    id: Optional[str] = Field(None, alias="_id")
    firm_id: str = Field(..., description="Multi-tenant")
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        use_enum_values = True


# ============================================================================
# USER PREFERENCES
# ============================================================================

class PreferencesBase(BaseModel):
    """Base Preferences model"""
    theme: str = Field(default="SYSTEM", description="LIGHT, DARK, SYSTEM")
    language: str = Field(default="es", description="Language code")
    timezone: str = Field(default="America/Mexico_City")
    date_format: str = Field(default="DD/MM/YYYY")
    time_format: str = Field(default="24H")
    currency: str = Field(default="MXN")


class Preferences(PreferencesBase):
    """Complete Preferences model (persisted)"""
    id: Optional[str] = Field(None, alias="_id")
    user_id: str = Field(..., unique=True)
    firm_id: str = Field(..., description="Multi-tenant")
    dashboard_widgets: Optional[Dict[str, Any]] = None  # Custom dashboard layout
    sidebar_collapsed: bool = Field(default=False)
    email_digest_frequency: str = Field(default="DAILY")
    case_sort_order: Optional[str] = None
    default_view: str = Field(default="TABLE", description="TABLE, KANBAN, GRID")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True


# ============================================================================
# NOTIFICATION PREFERENCE
# ============================================================================

class NotificationChannelType(str, Enum):
    """Notification delivery channels"""
    EMAIL = "EMAIL"
    SMS = "SMS"
    PUSH = "PUSH"
    IN_APP = "IN_APP"


class DigestFrequency(str, Enum):
    """Digest frequency options"""
    IMMEDIATE = "IMMEDIATE"
    HOURLY = "HOURLY"
    DAILY = "DAILY"
    WEEKLY = "WEEKLY"


class NotificationPreferenceBase(BaseModel):
    """Base NotificationPreference model"""
    notification_type: str
    enabled: bool = Field(default=True)
    delivery_channels: List[NotificationChannelType] = Field(default_factory=list)
    digest_frequency: DigestFrequency = Field(default=DigestFrequency.IMMEDIATE)
    do_not_disturb_start: Optional[str] = None  # Format: HH:MM
    do_not_disturb_end: Optional[str] = None    # Format: HH:MM


class NotificationPreference(NotificationPreferenceBase):
    """Complete NotificationPreference model (persisted)"""
    id: Optional[str] = Field(None, alias="_id")
    user_id: str
    firm_id: str = Field(..., description="Multi-tenant")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        use_enum_values = True


# ============================================================================
# SESSION & SECURITY
# ============================================================================

class SessionBase(BaseModel):
    """Base Session model"""
    user_id: str
    token: str
    ip_address: str
    user_agent: str
    is_active: bool = Field(default=True)


class Session(SessionBase):
    """Complete Session model (persisted)"""
    id: Optional[str] = Field(None, alias="_id")
    firm_id: str = Field(..., description="Multi-tenant")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: datetime
    last_activity_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True


# ============================================================================
# DTOs FOR AUDIT RESPONSES
# ============================================================================

class ActivityDTO(BaseModel):
    """Activity DTO"""
    id: Optional[str] = Field(None, alias="_id")
    activity_type: str
    user_id: str
    resource_type: Optional[str] = None
    resource_id: Optional[str] = None
    duration_ms: Optional[int] = None
    created_at: datetime

    class Config:
        populate_by_name = True


class DocumentAccessDTO(BaseModel):
    """DocumentAccess DTO"""
    id: Optional[str] = Field(None, alias="_id")
    document_id: str
    user_id: str
    access_type: str
    ip_address: Optional[str] = None
    accessed_at: datetime

    class Config:
        populate_by_name = True


class CaseActivityDTO(BaseModel):
    """CaseActivity DTO"""
    id: Optional[str] = Field(None, alias="_id")
    case_id: str
    activity_type: str
    description: str
    performed_by_user_id: str
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    created_at: datetime

    class Config:
        populate_by_name = True
