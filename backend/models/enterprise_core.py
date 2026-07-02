"""
Enterprise Core Models for Firm OS
Multi-tenancy, RBAC, Audit Trail Foundation
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, EmailStr, validator
from enum import Enum
import uuid


# ============================================================================
# ENUMS
# ============================================================================

class FirmStatus(str, Enum):
    """Firm lifecycle status"""
    PENDING_VERIFICATION = "PENDING_VERIFICATION"
    ACTIVE = "ACTIVE"
    SUSPENDED = "SUSPENDED"
    INACTIVE = "INACTIVE"


class SubscriptionPlan(str, Enum):
    """Subscription plans"""
    STARTER = "STARTER"
    PROFESSIONAL = "PROFESSIONAL"
    ENTERPRISE = "ENTERPRISE"


class UserRole(str, Enum):
    """System roles (hierarchical by rank)"""
    OWNER = "owner"                    # rank=0, full access
    MANAGING_PARTNER = "managing_partner"  # rank=10
    PARTNER = "partner"                # rank=20
    ADMINISTRATOR = "administrator"    # rank=30
    MANAGER = "manager"                # rank=40
    LAWYER = "lawyer"                  # rank=50
    ASSISTANT = "assistant"            # rank=60
    READONLY = "readonly"              # rank=100
    CLIENT = "client"                  # rank=110


class PermissionAction(str, Enum):
    """Permission actions"""
    CREATE = "CREATE"
    READ = "READ"
    UPDATE = "UPDATE"
    DELETE = "DELETE"
    APPROVE = "APPROVE"
    EXECUTE = "EXECUTE"
    EXPORT = "EXPORT"


class PermissionModule(str, Enum):
    """Permission modules"""
    CASES = "CASES"
    CLIENTS = "CLIENTS"
    LAWYERS = "LAWYERS"
    DOCUMENTS = "DOCUMENTS"
    WORKFLOWS = "WORKFLOWS"
    AUTOMATION = "AUTOMATION"
    SCHEDULER = "SCHEDULER"
    NOTIFICATIONS = "NOTIFICATIONS"
    AI_INSIGHTS = "AI_INSIGHTS"
    GOVERNANCE = "GOVERNANCE"
    MISSION_CONTROL = "MISSION_CONTROL"
    AUTONOMOUS_OPS = "AUTONOMOUS_OPS"
    AUDIT_LOGS = "AUDIT_LOGS"
    SETTINGS = "SETTINGS"
    ADMIN = "ADMIN"


class AuditAction(str, Enum):
    """Audit log actions"""
    CREATE = "CREATE"
    READ = "READ"
    UPDATE = "UPDATE"
    DELETE = "DELETE"
    LOGIN = "LOGIN"
    LOGOUT = "LOGOUT"
    EXPORT = "EXPORT"
    APPROVE = "APPROVE"
    REJECT = "REJECT"
    EXECUTE = "EXECUTE"


class AuditCategory(str, Enum):
    """Audit log categories"""
    AUTHENTICATION = "AUTHENTICATION"
    CASE_MANAGEMENT = "CASE_MANAGEMENT"
    DOCUMENT = "DOCUMENT"
    WORKFLOW = "WORKFLOW"
    AUTOMATION = "AUTOMATION"
    SETTINGS = "SETTINGS"
    GOVERNANCE = "GOVERNANCE"
    AI = "AI"
    ACCESS = "ACCESS"


# ============================================================================
# FIRM MODEL
# ============================================================================

class FirmBase(BaseModel):
    """Base Firm model"""
    name: str = Field(..., min_length=1, max_length=255, description="Firm legal name")
    slug: str = Field(..., min_length=1, max_length=100, description="URL-safe identifier")
    country_code: str = Field(default="MX", min_length=2, max_length=2)
    industry: Optional[str] = None
    max_users: int = Field(default=10, ge=1)
    max_cases: int = Field(default=100, ge=-1)  # -1 = unlimited
    subscription_plan: SubscriptionPlan = Field(default=SubscriptionPlan.STARTER)

    @validator('slug')
    def slug_format(cls, v):
        """Validate slug format (alphanumeric + hyphens only)"""
        if not all(c.isalnum() or c == '-' for c in v):
            raise ValueError("Slug must contain only alphanumeric characters and hyphens")
        return v.lower()


class Firm(FirmBase):
    """Complete Firm model (persisted)"""
    id: Optional[str] = Field(None, alias="_id")
    status: FirmStatus = Field(default=FirmStatus.ACTIVE)
    active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    deleted_at: Optional[datetime] = None

    class Config:
        populate_by_name = True
        use_enum_values = True


# ============================================================================
# ROLE & PERMISSION MODELS
# ============================================================================

class PermissionBase(BaseModel):
    """Base Permission model"""
    module: PermissionModule
    action: PermissionAction
    resource_type: Optional[str] = None
    conditions: Optional[Dict[str, Any]] = None  # e.g., {"own_cases_only": true}


class Permission(PermissionBase):
    """Complete Permission model (persisted)"""
    id: Optional[str] = Field(None, alias="_id")
    role_id: str = Field(..., description="Reference to Role")
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        use_enum_values = True


class RoleBase(BaseModel):
    """Base Role model"""
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    rank: int = Field(..., description="Hierarchical rank for inheritance")
    is_system: bool = Field(default=False, description="Cannot be deleted if true")


class Role(RoleBase):
    """Complete Role model (persisted)"""
    id: Optional[str] = Field(None, alias="_id")
    firm_id: str = Field(..., description="Multi-tenant isolation")
    permissions: List[Permission] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        use_enum_values = True


# ============================================================================
# USER MODEL
# ============================================================================

class UserBase(BaseModel):
    """Base User model"""
    email: EmailStr
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    phone: Optional[str] = None
    is_active: bool = Field(default=True)
    mfa_enabled: bool = Field(default=False)


class User(UserBase):
    """Complete User model (persisted)"""
    id: Optional[str] = Field(None, alias="_id")
    firm_id: str = Field(..., description="Multi-tenant isolation")
    role_id: str = Field(..., description="Reference to Role (RBAC)")
    password_hash: str = Field(..., description="Bcrypt hash")
    email_verified: bool = Field(default=False)
    last_login_at: Optional[datetime] = None
    session_token: Optional[str] = None
    session_expires_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    deleted_at: Optional[datetime] = None

    class Config:
        populate_by_name = True
        exclude = {"password_hash"}  # Never return password hash in responses


# ============================================================================
# AUDIT LOG MODEL
# ============================================================================

class AuditLogBase(BaseModel):
    """Base AuditLog model"""
    action: AuditAction
    category: AuditCategory
    resource_type: str = Field(..., description="CASE, DOCUMENT, USER, WORKFLOW, etc.")
    resource_id: str = Field(..., description="ID of resource affected")
    severity: str = Field(default="INFO", description="CRITICAL, HIGH, MEDIUM, INFO")
    status: str = Field(default="SUCCESS", description="SUCCESS, FAILURE, PARTIAL")


class AuditLog(AuditLogBase):
    """Complete AuditLog model (persisted)"""
    id: Optional[str] = Field(None, alias="_id")
    firm_id: str = Field(..., description="Multi-tenant isolation")
    user_id: str = Field(..., description="Who performed action")
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    error_message: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    request_id: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        use_enum_values = True


# ============================================================================
# TENANT CONTEXT (Runtime)
# ============================================================================

class TenantContext(BaseModel):
    """Runtime tenant context (not persisted)"""
    firm_id: str
    user_id: str
    role: UserRole
    permissions: List[Permission]
    is_authenticated: bool = True
    request_id: str = Field(default_factory=lambda: str(uuid.uuid4()))


# ============================================================================
# DTOs (Data Transfer Objects)
# ============================================================================

class UserDTO(BaseModel):
    """User DTO for responses (no sensitive data)"""
    id: Optional[str] = Field(None, alias="_id")
    email: str
    first_name: str
    last_name: str
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        populate_by_name = True


class FirmDTO(BaseModel):
    """Firm DTO for responses"""
    id: Optional[str] = Field(None, alias="_id")
    name: str
    slug: str
    subscription_plan: str
    status: str
    max_users: int
    active_users: int
    max_cases: int
    created_at: datetime

    class Config:
        populate_by_name = True


class PermissionDTO(BaseModel):
    """Permission DTO"""
    id: Optional[str] = Field(None, alias="_id")
    module: str
    action: str
    resource_type: Optional[str] = None
    conditions: Optional[Dict[str, Any]] = None

    class Config:
        populate_by_name = True


class RoleDTO(BaseModel):
    """Role DTO with permissions"""
    id: Optional[str] = Field(None, alias="_id")
    name: str
    rank: int
    description: Optional[str] = None
    permissions: List[PermissionDTO] = Field(default_factory=list)

    class Config:
        populate_by_name = True


class AuditLogDTO(BaseModel):
    """AuditLog DTO"""
    id: Optional[str] = Field(None, alias="_id")
    action: str
    category: str
    resource_type: str
    resource_id: str
    user_id: str
    status: str
    severity: str
    created_at: datetime
    ip_address: Optional[str] = None

    class Config:
        populate_by_name = True
