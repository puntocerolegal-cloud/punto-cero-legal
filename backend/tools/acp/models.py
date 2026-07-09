"""ACP v1.0 Data Models"""

from dataclasses import dataclass, field
from typing import List, Dict, Optional, Any
from enum import Enum


class Severity(Enum):
    """Severity levels for findings"""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class DecisionStatus(Enum):
    """Certification decision"""
    APPROVED = "APPROVED"
    CONDITIONAL = "CONDITIONAL"
    REJECTED = "REJECTED"


@dataclass
class Evidence:
    """Supporting evidence for a finding"""
    type: str  # "code", "file", "method", "pattern"
    location: str  # File path or method name
    line_number: Optional[int] = None
    description: str = ""
    code_snippet: str = ""


@dataclass
class Finding:
    """A single finding from inspection"""
    severity: Severity
    title: str
    description: str
    evidence: List[Evidence] = field(default_factory=list)
    recommendation: str = ""


@dataclass
class Recommendation:
    """A recommendation for improvement"""
    priority: str  # "critical", "high", "medium", "low"
    title: str
    description: str
    effort: str = "medium"  # "low", "medium", "high"


@dataclass
class Risk:
    """A risk assessment"""
    title: str
    probability: str  # "very low", "low", "medium", "high"
    severity: str  # "low", "medium", "high", "critical"
    mitigation: str
    status: str = "mitigated"  # "mitigated", "monitored", "open"


@dataclass
class RepositorySpec:
    """Specification of a repository"""
    name: str
    file_path: str
    extends_base: bool = False
    uses_tenant_aware: bool = False
    firm_id_coverage: float = 0.0  # percentage
    request_id_coverage: float = 0.0
    logging_coverage: float = 0.0
    has_indexes: bool = False
    firm_id_first_in_indexes: bool = False
    method_count: int = 0


@dataclass
class ServiceSpec:
    """Specification of a service"""
    name: str
    file_path: str
    uses_repositories: bool = False
    uses_tenant_mapping: bool = False
    direct_mongodb_access: bool = False
    method_count: int = 0


@dataclass
class RouteSpec:
    """Specification of a route"""
    path: str
    method: str
    handler: str
    uses_tenant_context: bool = False
    propagates_firm_id: bool = False


@dataclass
class ModuleSpecification:
    """Complete module specification"""
    name: str
    path: str
    repositories: List[RepositorySpec] = field(default_factory=list)
    services: List[ServiceSpec] = field(default_factory=list)
    routes: List[RouteSpec] = field(default_factory=list)
    has_base_repository: bool = False
    has_tenant_kernel: bool = False
    has_audit_log: bool = False
    direct_mongodb_count: int = 0
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class InspectorResult:
    """Result from a single inspector"""
    phase: int
    name: str
    passed: bool
    score: float
    findings: List[Finding] = field(default_factory=list)
    recommendations: List[Recommendation] = field(default_factory=list)
    risks: List[Risk] = field(default_factory=list)
    details: Dict[str, Any] = field(default_factory=dict)
    
    def __post_init__(self):
        if not (0 <= self.score <= 100):
            raise ValueError(f"Score must be 0-100, got {self.score}")


@dataclass
class DimensionScores:
    """Scores by dimension"""
    repository_layer: float
    tenant_isolation: float
    backward_compatibility: float
    security: float
    observability: float
    architecture: float
    risk_management: float
    
    def to_dict(self) -> Dict[str, float]:
        return {
            "Repository Layer": self.repository_layer,
            "Tenant Isolation": self.tenant_isolation,
            "Backward Compatibility": self.backward_compatibility,
            "Security": self.security,
            "Observability": self.observability,
            "Architecture": self.architecture,
            "Risk Management": self.risk_management,
        }


@dataclass
class CertificationResult:
    """Final certification result"""
    module_name: str
    overall_score: float
    dimension_scores: DimensionScores
    decision: DecisionStatus
    inspector_results: List[InspectorResult] = field(default_factory=list)
    findings: List[Finding] = field(default_factory=list)
    recommendations: List[Recommendation] = field(default_factory=list)
    risks: List[Risk] = field(default_factory=list)
    conditions: List[str] = field(default_factory=list)  # If CONDITIONAL
    blockers: List[str] = field(default_factory=list)  # If REJECTED
    timestamp: str = ""
    
    def __post_init__(self):
        if not (0 <= self.overall_score <= 100):
            raise ValueError(f"Score must be 0-100, got {self.overall_score}")
        
        # Determine decision based on score
        if self.overall_score >= 90:
            self.decision = DecisionStatus.APPROVED
        elif self.overall_score >= 85:
            self.decision = DecisionStatus.CONDITIONAL
        else:
            self.decision = DecisionStatus.REJECTED
    
    @property
    def passed(self) -> bool:
        return self.decision == DecisionStatus.APPROVED
