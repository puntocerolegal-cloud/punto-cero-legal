from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Literal
from datetime import datetime
from enum import Enum


class CaseStatus(str, Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    CLOSED = "closed"
    ARCHIVED = "archived"
    SUSPENDED = "suspended"


class CasePriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class LegalArea(str, Enum):
    CORPORATE = "corporate"
    LITIGATION = "litigation"
    LABOR = "labor"
    REAL_ESTATE = "real_estate"
    FAMILY = "family"
    CRIMINAL = "criminal"
    INTELLECTUAL_PROPERTY = "intellectual_property"
    ADMINISTRATIVE = "administrative"
    CONTRACTS = "contracts"
    OTHER = "other"


class DocumentType(str, Enum):
    BRIEF = "brief"
    MOTION = "motion"
    COMPLAINT = "complaint"
    RESOLUTION = "resolution"
    AGREEMENT = "agreement"
    CONTRACT = "contract"
    EVIDENCE = "evidence"
    DEPOSITION = "deposition"
    COURT_ORDER = "court_order"
    MEMO = "memo"
    LETTER = "letter"
    OTHER = "other"


class DocumentStatus(str, Enum):
    DRAFT = "draft"
    REVIEW = "review"
    APPROVED = "approved"
    SIGNED = "signed"
    FILED = "filed"
    ARCHIVED = "archived"
    OBSOLETE = "obsolete"


class DocumentAccessLevel(str, Enum):
    OWNER = "owner"
    EDITOR = "editor"
    VIEWER = "viewer"
    RESTRICTED = "restricted"


class CaseBase(BaseModel):
    firm_id: str = Field(..., description="Multi-tenant firm")
    title: str = Field(..., min_length=1, max_length=200)
    legal_area: LegalArea
    description: str = Field(default="")
    case_number: Optional[str] = None
    court: Optional[str] = None
    status: CaseStatus = CaseStatus.OPEN
    priority: CasePriority = CasePriority.MEDIUM
    deadline: Optional[datetime] = None
    tags: List[str] = Field(default_factory=list)
    billing_rate: float = Field(default=0.0, ge=0)
    estimated_hours: float = Field(default=0.0, ge=0)


class Case(CaseBase):
    id: Optional[str] = Field(None, alias="_id")
    case_owner_id: str = Field(..., description="User who owns the case")
    assigned_users: List[str] = Field(default_factory=list, description="User IDs with access")
    document_count: int = 0
    total_billable_hours: float = 0.0
    total_billed: float = 0.0
    start_date: datetime = Field(default_factory=datetime.utcnow)
    closed_date: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    deleted_at: Optional[datetime] = None
    created_by: str = Field(...)
    updated_by: str = Field(...)


class DocumentVersion(BaseModel):
    version: int
    file_url: str
    file_size: int
    created_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: str
    change_summary: Optional[str] = None
    file_hash: str = Field(description="SHA256 hash for integrity")


class DocumentBase(BaseModel):
    firm_id: str = Field(..., description="Multi-tenant firm")
    case_id: str = Field(...)
    title: str = Field(..., min_length=1, max_length=300)
    document_type: DocumentType
    status: DocumentStatus = DocumentStatus.DRAFT
    content_text: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    is_confidential: bool = False
    requires_signature: bool = False
    expiration_date: Optional[datetime] = None


class Document(DocumentBase):
    id: Optional[str] = Field(None, alias="_id")
    owner_id: str = Field(...)
    file_url: Optional[str] = None
    file_size: int = 0
    file_hash: Optional[str] = None
    mime_type: Optional[str] = None
    version_number: int = 1
    versions: List[DocumentVersion] = Field(default_factory=list)
    access_list: Dict[str, DocumentAccessLevel] = Field(default_factory=dict, description="user_id -> access_level")
    review_count: int = 0
    last_reviewed_by: Optional[str] = None
    last_reviewed_at: Optional[datetime] = None
    signed_by: Optional[List[str]] = Field(default_factory=list)
    signed_at: Optional[List[datetime]] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    deleted_at: Optional[datetime] = None
    created_by: str = Field(...)
    updated_by: str = Field(...)


class DocumentAccessLog(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    firm_id: str = Field(..., description="Multi-tenant firm")
    document_id: str
    case_id: str
    user_id: str
    action: Literal["view", "download", "edit", "sign", "share", "delete"]
    access_level: DocumentAccessLevel
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    duration_seconds: Optional[int] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    request_id: str = Field(...)


class CaseDTO(BaseModel):
    id: str = Field(alias="_id")
    firm_id: str
    title: str
    legal_area: str
    case_number: Optional[str]
    status: str
    priority: str
    case_owner_id: str
    assigned_users: List[str]
    document_count: int
    deadline: Optional[datetime]
    start_date: datetime
    created_at: datetime
    updated_at: datetime


class DocumentDTO(BaseModel):
    id: str = Field(alias="_id")
    firm_id: str
    case_id: str
    title: str
    document_type: str
    status: str
    owner_id: str
    file_url: Optional[str]
    version_number: int
    is_confidential: bool
    requires_signature: bool
    created_at: datetime
    updated_at: datetime


class DocumentAccessLogDTO(BaseModel):
    id: str = Field(alias="_id")
    document_id: str
    case_id: str
    user_id: str
    action: str
    access_level: str
    created_at: datetime
