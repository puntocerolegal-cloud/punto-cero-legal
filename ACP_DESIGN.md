# ACP v1.0 DETAILED DESIGN SPECIFICATION
## Component-Level Architecture
**Architecture Certification Platform — Implementation Guide**

---

## OVERVIEW

This document specifies the exact implementation of each ACP component. It includes:
- Detailed class structures
- Method signatures
- Algorithm specifications
- Data models
- Configuration formats

---

## PART 1: CORE DATA MODELS

### 1.1 ModuleAnalysisRequest

```python
from dataclasses import dataclass
from typing import List, Optional
from enum import Enum

class AuditDepth(Enum):
    SHALLOW = "shallow"    # Basic compliance checks
    DEEP = "deep"         # Deep analysis with tracing

@dataclass
class ModuleAnalysisRequest:
    """Request to certify a module"""
    module_name: str                    # e.g., "billing", "organizations"
    module_path: str                    # Absolute path to module directory
    reference_modules: List[str]        # [payment, billing] for comparison
    audit_depth: AuditDepth = AuditDepth.DEEP
    include_monitoring: bool = True
    output_format: str = "markdown"     # "markdown", "json", "both"
    timestamp: str = None               # Auto-filled if None
    
    def __post_init__(self):
        import datetime
        if self.timestamp is None:
            self.timestamp = datetime.datetime.now().isoformat()
```

### 1.2 ModuleSpecification

```python
@dataclass
class RepositorySpec:
    """Specification of a repository class"""
    name: str                           # e.g., "InvoiceRepository"
    file_path: str                      # e.g., "backend/repositories/invoice_repository.py"
    extends: str                        # "BaseRepository" if true
    methods: List['MethodSpec'] = None
    indexes: List['IndexSpec'] = None
    uses_tenant_aware_query: bool = False
    firm_id_filtering_percentage: float = 0.0
    request_id_coverage: float = 0.0
    logging_coverage: float = 0.0
    error_handling_score: float = 0.0

@dataclass
class ServiceSpec:
    """Specification of a service class"""
    name: str                           # e.g., "BillingService"
    file_path: str
    methods: List['MethodSpec'] = None
    uses_repositories: bool = False
    repository_adoption_rate: float = 0.0
    tenant_mapping_usage: bool = False
    uses_audit_log: bool = False

@dataclass
class RouteSpec:
    """Specification of a FastAPI route"""
    path: str                           # e.g., "/api/billing"
    method: str                         # "GET", "POST", etc.
    handler_name: str
    uses_tenant_context: bool = False
    propagates_firm_id: bool = False
    requires_write: bool = False

@dataclass
class MethodSpec:
    """Specification of a single method"""
    name: str
    signature: str
    has_firm_id_param: bool = False
    has_request_id_param: bool = False
    has_logging: bool = False
    has_error_handling: bool = False
    uses_tenant_aware_query: bool = False
    mongodb_direct_access: bool = False
    audit_log_usage: bool = False
    line_number_start: int = 0
    line_number_end: int = 0

@dataclass
class IndexSpec:
    """MongoDB index specification"""
    name: str
    fields: List[tuple]                 # [("firm_id", 1), ("status", 1)]
    is_unique: bool = False
    is_sparse: bool = False
    first_field: str = None             # Should be "firm_id"
    is_firm_id_first: bool = False

@dataclass
class ModuleSpecification:
    """Complete module specification"""
    name: str
    path: str
    repositories: List[RepositorySpec]
    services: List[ServiceSpec]
    routes: List[RouteSpec]
    models: List['ModelSpec']
    mongodb_direct_accesses: List['DirectAccess']
    dependencies: Dict[str, str]
    analysis_timestamp: str
    python_version: str = "3.9+"
```

### 1.3 Inspector Results

```python
@dataclass
class Evidence:
    """Supporting evidence for a finding"""
    type: str                           # "code", "file", "line", "method"
    location: str                       # File path or method name
    line_number: Optional[int] = None
    code_snippet: str = ""
    description: str = ""

@dataclass
class Finding:
    """A single finding from inspection"""
    severity: str                       # "critical", "high", "medium", "low"
    title: str
    description: str
    evidence: List[Evidence]
    recommendation: str = ""

@dataclass
class InspectorResult:
    """Result from a single inspector phase"""
    phase_number: int
    phase_name: str                     # "Repository Layer Compliance"
    module_name: str
    passed: bool
    score: float                        # 0-100
    max_score: float = 100.0
    findings: List[Finding] = None
    observations: List[str] = None
    recommendations: List[str] = None
    detailed_breakdown: Dict[str, float] = None  # Subscores
    comparison_with_payment: Dict[str, float] = None
    comparison_with_billing: Dict[str, float] = None
```

### 1.4 Certification Result

```python
@dataclass
class CertificationResult:
    """Final certification outcome"""
    module_name: str
    status: str                         # "APPROVED", "CONDITIONAL", "REJECTED"
    overall_score: float                # 0-100
    dimension_scores: Dict[str, float]
    inspector_results: List[InspectorResult]
    governance_validations: Dict[str, bool]
    conditions: List[str] = None        # If CONDITIONAL
    blockers: List[str] = None          # If REJECTED
    residual_risks: List[str] = None
    monitoring_recommendations: List[str] = None
    timestamp: str = None
    certification_id: str = None        # e.g., "B9-ORG-CERTIFIED-2024-10-15"
    
    def __post_init__(self):
        import datetime
        if self.timestamp is None:
            self.timestamp = datetime.datetime.now().isoformat()
        if self.certification_id is None:
            date_str = datetime.datetime.now().strftime("%Y-%m-%d")
            self.certification_id = f"{self.module_name.upper()}-CERTIFIED-{date_str}"
```

---

## PART 2: COMPONENT SPECIFICATIONS

### Component 1: ModuleAnalyzer

**File**: `acp/analyzers/module_analyzer.py`

```python
import ast
import os
from pathlib import Path
from typing import List, Dict, Set

class ModuleAnalyzer:
    """Parses module code and extracts structure"""
    
    def __init__(self, module_path: str, module_name: str):
        self.module_path = Path(module_path)
        self.module_name = module_name
        self.python_files: List[Path] = []
        self.ast_trees: Dict[str, ast.Module] = {}
        self._discover_files()
    
    def _discover_files(self) -> None:
        """Recursively find all Python files in module"""
        self.python_files = list(self.module_path.rglob("*.py"))
        if not self.python_files:
            raise ValueError(f"No Python files found in {self.module_path}")
    
    def analyze(self) -> ModuleSpecification:
        """Main analysis entry point"""
        # 1. Parse all Python files
        self._parse_all_files()
        
        # 2. Extract repositories
        repositories = self._extract_repositories()
        
        # 3. Extract services
        services = self._extract_services()
        
        # 4. Extract routes
        routes = self._extract_routes()
        
        # 5. Extract models
        models = self._extract_models()
        
        # 6. Detect MongoDB access patterns
        mongodb_accesses = self._detect_mongodb_access()
        
        # 7. Extract dependencies
        dependencies = self._extract_dependencies()
        
        return ModuleSpecification(
            name=self.module_name,
            path=str(self.module_path),
            repositories=repositories,
            services=services,
            routes=routes,
            models=models,
            mongodb_direct_accesses=mongodb_accesses,
            dependencies=dependencies,
            analysis_timestamp=datetime.now().isoformat(),
        )
    
    def _parse_all_files(self) -> None:
        """Parse all Python files into AST"""
        for file_path in self.python_files:
            try:
                with open(file_path, 'r') as f:
                    content = f.read()
                    tree = ast.parse(content)
                    self.ast_trees[str(file_path)] = tree
            except SyntaxError as e:
                # Log warning, continue
                pass
    
    def _extract_repositories(self) -> List[RepositorySpec]:
        """Find all classes extending BaseRepository"""
        repositories = []
        
        for file_path, tree in self.ast_trees.items():
            for node in ast.walk(tree):
                if isinstance(node, ast.ClassDef):
                    # Check if extends BaseRepository
                    extends_base = any(
                        base.id == "BaseRepository" 
                        for base in node.bases 
                        if isinstance(base, ast.Name)
                    )
                    
                    if extends_base:
                        repo_spec = RepositorySpec(
                            name=node.name,
                            file_path=file_path,
                            extends="BaseRepository",
                            methods=self._extract_methods(node),
                            indexes=self._extract_indexes(node),
                        )
                        
                        # Analyze method coverage
                        repo_spec.uses_tenant_aware_query = self._check_tenant_aware_usage(node)
                        repo_spec.firm_id_filtering_percentage = self._calculate_firm_id_coverage(node)
                        repo_spec.request_id_coverage = self._calculate_request_id_coverage(node)
                        repo_spec.logging_coverage = self._calculate_logging_coverage(node)
                        
                        repositories.append(repo_spec)
        
        return repositories
    
    def _extract_methods(self, class_node: ast.ClassDef) -> List[MethodSpec]:
        """Extract all methods from a class"""
        methods = []
        
        for node in class_node.body:
            if isinstance(node, ast.AsyncFunctionDef) or isinstance(node, ast.FunctionDef):
                # Skip private/special methods (optional)
                if node.name.startswith("_"):
                    continue
                
                method_spec = MethodSpec(
                    name=node.name,
                    signature=self._extract_signature(node),
                    has_firm_id_param="firm_id" in [arg.arg for arg in node.args.args],
                    has_request_id_param="request_id" in [arg.arg for arg in node.args.args],
                    has_logging=self._method_has_logging(node),
                    has_error_handling=self._method_has_error_handling(node),
                    uses_tenant_aware_query=self._method_uses_tenant_aware(node),
                    mongodb_direct_access=self._method_has_mongodb_access(node),
                    audit_log_usage=self._method_uses_audit_log(node),
                    line_number_start=node.lineno,
                    line_number_end=node.end_lineno,
                )
                methods.append(method_spec)
        
        return methods
    
    def _extract_indexes(self, class_node: ast.ClassDef) -> List[IndexSpec]:
        """Extract MongoDB indexes from ensure_indexes method"""
        indexes = []
        
        # Find ensure_indexes method
        ensure_indexes_method = next(
            (n for n in ast.walk(class_node) 
             if isinstance(n, ast.AsyncFunctionDef) and n.name == "ensure_indexes"),
            None
        )
        
        if not ensure_indexes_method:
            return indexes
        
        # Parse index definitions (expected to be in a list)
        # This is a simplified parser; production would be more robust
        for node in ast.walk(ensure_indexes_method):
            if isinstance(node, ast.Dict):
                # Extract index spec
                spec = IndexSpec(
                    name="",
                    fields=[],
                    is_firm_id_first=False,
                )
                
                # Parse dict keys/values to extract index details
                # (Simplified; production version more comprehensive)
                
                indexes.append(spec)
        
        return indexes
    
    def _extract_services(self) -> List[ServiceSpec]:
        """Find service classes (not extending BaseRepository)"""
        services = []
        
        for file_path, tree in self.ast_trees.items():
            if "service" in file_path.lower():
                for node in ast.walk(tree):
                    if isinstance(node, ast.ClassDef) and node.name.endswith("Service"):
                        service_spec = ServiceSpec(
                            name=node.name,
                            file_path=file_path,
                            methods=self._extract_methods(node),
                            uses_repositories=self._service_uses_repositories(node),
                            tenant_mapping_usage=self._service_uses_tenant_mapping(node),
                            uses_audit_log=self._service_uses_audit_log(node),
                        )
                        services.append(service_spec)
        
        return services
    
    def _extract_routes(self) -> List[RouteSpec]:
        """Find FastAPI route definitions"""
        routes = []
        
        for file_path, tree in self.ast_trees.items():
            if "route" in file_path.lower():
                for node in ast.walk(tree):
                    if isinstance(node, ast.FunctionDef) or isinstance(node, ast.AsyncFunctionDef):
                        # Check for @router.get, @router.post, etc.
                        # (Simplified; production more comprehensive)
                        route_spec = RouteSpec(
                            path="",
                            method="GET",
                            handler_name=node.name,
                            uses_tenant_context=self._route_uses_tenant_context(node),
                            propagates_firm_id=self._route_propagates_firm_id(node),
                        )
                        routes.append(route_spec)
        
        return routes
    
    def _check_tenant_aware_usage(self, node: ast.ClassDef) -> bool:
        """Check if class uses TenantAwareQuery"""
        source = ast.unparse(node)
        return "TenantAwareQuery" in source
    
    def _calculate_firm_id_coverage(self, node: ast.ClassDef) -> float:
        """Calculate % of methods with firm_id parameter"""
        methods = self._extract_methods(node)
        if not methods:
            return 0.0
        
        with_firm_id = sum(1 for m in methods if m.has_firm_id_param)
        return (with_firm_id / len(methods)) * 100
    
    def _calculate_request_id_coverage(self, node: ast.ClassDef) -> float:
        """Calculate % of methods with request_id parameter"""
        methods = self._extract_methods(node)
        if not methods:
            return 0.0
        
        with_request_id = sum(1 for m in methods if m.has_request_id_param)
        return (with_request_id / len(methods)) * 100
    
    def _calculate_logging_coverage(self, node: ast.ClassDef) -> float:
        """Calculate % of methods with logging"""
        methods = self._extract_methods(node)
        if not methods:
            return 0.0
        
        with_logging = sum(1 for m in methods if m.has_logging)
        return (with_logging / len(methods)) * 100
    
    # Additional helper methods (signatures)
    def _method_has_logging(self, node: ast.FunctionDef) -> bool: ...
    def _method_has_error_handling(self, node: ast.FunctionDef) -> bool: ...
    def _method_uses_tenant_aware(self, node: ast.FunctionDef) -> bool: ...
    def _method_has_mongodb_access(self, node: ast.FunctionDef) -> bool: ...
    def _method_uses_audit_log(self, node: ast.FunctionDef) -> bool: ...
    def _extract_signature(self, node: ast.FunctionDef) -> str: ...
    def _extract_models(self) -> List[ModelSpec]: ...
    def _detect_mongodb_access(self) -> List[DirectAccess]: ...
    def _extract_dependencies(self) -> Dict[str, str]: ...
    def _service_uses_repositories(self, node: ast.ClassDef) -> bool: ...
    def _service_uses_tenant_mapping(self, node: ast.ClassDef) -> bool: ...
    def _service_uses_audit_log(self, node: ast.ClassDef) -> bool: ...
    def _route_uses_tenant_context(self, node: ast.FunctionDef) -> bool: ...
    def _route_propagates_firm_id(self, node: ast.FunctionDef) -> bool: ...
```

### Component 2: BaseInspector (Abstract)

**File**: `acp/inspectors/base_inspector.py`

```python
from abc import ABC, abstractmethod

class BaseInspector(ABC):
    """Base class for all inspectors"""
    
    def __init__(self, spec: ModuleSpecification, phase: int, phase_name: str):
        self.spec = spec
        self.phase = phase
        self.phase_name = phase_name
        self.findings: List[Finding] = []
        self.observations: List[str] = []
        self.recommendations: List[str] = []
        self.score = 0.0
    
    @abstractmethod
    def inspect(self) -> None:
        """Run inspection. Populate findings and calculate score."""
        pass
    
    def get_result(self) -> InspectorResult:
        """Return standardized result"""
        return InspectorResult(
            phase_number=self.phase,
            phase_name=self.phase_name,
            module_name=self.spec.name,
            passed=self.score >= 85,  # Threshold
            score=self.score,
            findings=self.findings,
            observations=self.observations,
            recommendations=self.recommendations,
        )
    
    def add_finding(self, finding: Finding) -> None:
        """Add a finding to the report"""
        self.findings.append(finding)
    
    def add_observation(self, observation: str) -> None:
        """Add an observation"""
        self.observations.append(observation)
    
    def add_recommendation(self, recommendation: str) -> None:
        """Add a recommendation"""
        self.recommendations.append(recommendation)
```

### Component 3: RepositoryInspector

**File**: `acp/inspectors/repository_inspector.py`

```python
class RepositoryInspector(BaseInspector):
    """Phase 2: Repository Layer Compliance"""
    
    def __init__(self, spec: ModuleSpecification):
        super().__init__(spec, 2, "Repository Layer Compliance")
    
    def inspect(self) -> None:
        """Inspect repository layer"""
        if not self.spec.repositories:
            self.score = 0.0
            self.add_finding(Finding(
                severity="critical",
                title="No Repositories Found",
                description="Module has no repositories. Cannot proceed with certification.",
                evidence=[],
            ))
            return
        
        # 1. Check BaseRepository inheritance
        self._check_base_repository_inheritance()
        
        # 2. Check TenantAwareQuery usage
        self._check_tenant_aware_query()
        
        # 3. Check firm_id coverage
        self._check_firm_id_coverage()
        
        # 4. Check request_id coverage
        self._check_request_id_coverage()
        
        # 5. Check logging
        self._check_logging()
        
        # 6. Check error handling
        self._check_error_handling()
        
        # 7. Check indexes
        self._check_indexes()
        
        # Calculate score
        self._calculate_score()
    
    def _check_base_repository_inheritance(self) -> None:
        """Verify all repositories extend BaseRepository"""
        for repo in self.spec.repositories:
            if repo.extends != "BaseRepository":
                self.add_finding(Finding(
                    severity="critical",
                    title="Repository does not extend BaseRepository",
                    description=f"{repo.name} does not extend BaseRepository",
                    evidence=[Evidence(
                        type="file",
                        location=repo.file_path,
                        description=f"Class {repo.name} definition"
                    )],
                ))
    
    def _check_tenant_aware_query(self) -> None:
        """Verify TenantAwareQuery usage in repositories"""
        for repo in self.spec.repositories:
            if not repo.uses_tenant_aware_query:
                self.add_finding(Finding(
                    severity="high",
                    title="TenantAwareQuery not used",
                    description=f"{repo.name} does not use TenantAwareQuery",
                    evidence=[Evidence(
                        type="file",
                        location=repo.file_path,
                    )],
                ))
    
    def _check_firm_id_coverage(self) -> None:
        """Check firm_id parameter coverage"""
        for repo in self.spec.repositories:
            if repo.firm_id_filtering_percentage < 90:
                self.add_finding(Finding(
                    severity="high",
                    title="Incomplete firm_id coverage",
                    description=f"{repo.name}: {repo.firm_id_filtering_percentage:.1f}% coverage",
                    evidence=[],
                    recommendation="Add firm_id parameter to all public methods"
                ))
    
    def _check_request_id_coverage(self) -> None:
        """Check request_id parameter coverage"""
        for repo in self.spec.repositories:
            if repo.request_id_coverage < 90:
                self.add_finding(Finding(
                    severity="medium",
                    title="Incomplete request_id coverage",
                    description=f"{repo.name}: {repo.request_id_coverage:.1f}% coverage",
                    evidence=[],
                    recommendation="Add request_id parameter to all methods for traceability"
                ))
    
    def _check_logging(self) -> None:
        """Check logging coverage"""
        for repo in self.spec.repositories:
            if repo.logging_coverage < 80:
                self.add_finding(Finding(
                    severity="medium",
                    title="Insufficient logging coverage",
                    description=f"{repo.name}: {repo.logging_coverage:.1f}% coverage",
                    evidence=[],
                    recommendation="Add debug/info/error logging to all methods"
                ))
    
    def _check_error_handling(self) -> None:
        """Check error handling in all methods"""
        for repo in self.spec.repositories:
            for method in repo.methods or []:
                if not method.has_error_handling:
                    self.add_finding(Finding(
                        severity="high",
                        title="Missing error handling",
                        description=f"{repo.name}.{method.name} lacks try/except",
                        evidence=[Evidence(
                            type="method",
                            location=f"{repo.name}.{method.name}",
                            line_number=method.line_number_start,
                        )],
                        recommendation="Add try/except block with logging and re-raise"
                    ))
    
    def _check_indexes(self) -> None:
        """Check index strategy"""
        for repo in self.spec.repositories:
            if not repo.indexes:
                self.add_finding(Finding(
                    severity="medium",
                    title="No indexes defined",
                    description=f"{repo.name} has no ensure_indexes() method",
                    evidence=[],
                    recommendation="Define indexes with firm_id as first field"
                ))
            else:
                for index in repo.indexes:
                    if not index.is_firm_id_first:
                        self.add_finding(Finding(
                            severity="high",
                            title="Index missing firm_id as first field",
                            description=f"Index {index.name}: {index.fields}",
                            evidence=[],
                            recommendation="Restructure index to have firm_id first"
                        ))
    
    def _calculate_score(self) -> None:
        """Calculate repository compliance score"""
        # Scoring algorithm
        base_score = 100.0
        
        # Deductions
        if any(r.extends != "BaseRepository" for r in self.spec.repositories):
            base_score -= 20
        
        if any(not r.uses_tenant_aware_query for r in self.spec.repositories):
            base_score -= 15
        
        avg_firm_id = sum(r.firm_id_filtering_percentage for r in self.spec.repositories) / len(self.spec.repositories)
        if avg_firm_id < 90:
            base_score -= (100 - avg_firm_id) * 0.2
        
        avg_logging = sum(r.logging_coverage for r in self.spec.repositories) / len(self.spec.repositories)
        if avg_logging < 80:
            base_score -= (100 - avg_logging) * 0.1
        
        self.score = max(0, base_score)
```

### Component 4: Score Engine

**File**: `acp/engine/score_engine.py`

```python
class ScoreEngine:
    """Calculate weighted overall architecture score"""
    
    # Weights (must sum to 1.0)
    WEIGHTS = {
        "repository_layer": 0.25,
        "tenant_isolation": 0.20,
        "backward_compatibility": 0.15,
        "security": 0.15,
        "observability": 0.10,
        "risk_management": 0.05,
        "architecture_compliance": 0.10,  # (from governance)
    }
    
    # Thresholds
    APPROVED_THRESHOLD = 90.0
    CONDITIONAL_THRESHOLD = 85.0
    
    def __init__(self, inspector_results: List[InspectorResult]):
        self.inspector_results = inspector_results
        self.dimension_scores = {}
        self.overall_score = 0.0
    
    def calculate(self) -> float:
        """Calculate weighted overall score"""
        # Extract scores by dimension
        self.dimension_scores = self._extract_dimension_scores()
        
        # Calculate weighted sum
        self.overall_score = sum(
            self.dimension_scores.get(dim, 0) * weight
            for dim, weight in self.WEIGHTS.items()
        )
        
        return self.overall_score
    
    def _extract_dimension_scores(self) -> Dict[str, float]:
        """Map inspector results to dimensions"""
        scores = {}
        
        for result in self.inspector_results:
            if result.phase_number == 2:
                scores["repository_layer"] = result.score
            elif result.phase_number == 3:
                scores["tenant_isolation"] = result.score
            elif result.phase_number == 6:
                scores["backward_compatibility"] = result.score
            elif result.phase_number == 5:
                scores["security"] = result.score
            elif result.phase_number == 4:
                scores["observability"] = result.score
            # Phase 7 = risk_management (calculated separately)
        
        return scores
    
    def get_certification_status(self) -> str:
        """Determine certification status based on score"""
        if self.overall_score >= self.APPROVED_THRESHOLD:
            return "APPROVED"
        elif self.overall_score >= self.CONDITIONAL_THRESHOLD:
            return "CONDITIONAL"
        else:
            return "REJECTED"
```

### Component 5: Report Generator

**File**: `acp/reporting/report_generator.py`

```python
from jinja2 import Environment, FileSystemLoader
import os

class ReportGenerator:
    """Generate professional certification reports"""
    
    REPORT_TEMPLATES = {
        "certification_report": "certification_report.jinja2",
        "repository_compliance": "repository_compliance.jinja2",
        "security_report": "security_report.jinja2",
        "observability_report": "observability_report.jinja2",
        "final_scorecard": "final_scorecard.jinja2",
        "board_decision": "board_decision.jinja2",
    }
    
    def __init__(self, template_dir: str = "./acp/templates"):
        self.env = Environment(loader=FileSystemLoader(template_dir))
    
    def generate_reports(
        self,
        result: CertificationResult,
        output_dir: str
    ) -> List[str]:
        """Generate all certification reports"""
        os.makedirs(output_dir, exist_ok=True)
        
        generated_files = []
        
        for report_type, template_name in self.REPORT_TEMPLATES.items():
            file_path = os.path.join(output_dir, f"{result.module_name.upper()}_{report_type.upper()}.md")
            
            # Render template
            template = self.env.get_template(template_name)
            content = template.render(
                result=result,
                module_name=result.module_name,
                overall_score=result.overall_score,
                status=result.status,
                timestamp=result.timestamp,
            )
            
            # Write file
            with open(file_path, 'w') as f:
                f.write(content)
            
            generated_files.append(file_path)
        
        return generated_files
```

---

## PART 3: ORCHESTRATION

### CertificationOrchestrator

**File**: `acp/orchestrator/certify.py`

```python
class CertificationOrchestrator:
    """Main orchestration logic"""
    
    def __init__(self, request: ModuleAnalysisRequest):
        self.request = request
    
    def run(self) -> CertificationResult:
        """Execute complete certification pipeline"""
        
        # Phase 1: Analyze module
        print(f"[1/10] Analyzing module: {self.request.module_name}")
        analyzer = ModuleAnalyzer(
            self.request.module_path,
            self.request.module_name
        )
        spec = analyzer.analyze()
        
        # Phases 2-6: Run inspectors (can be parallel)
        print("[2-6/10] Running compliance inspectors...")
        inspectors = [
            RepositoryInspector(spec),
            TenantValidator(spec),
            ObservabilityValidator(spec),
            SecurityValidator(spec),
            BackwardCompatibilityValidator(spec),
            MetricsCalculator(spec),
        ]
        
        inspector_results = []
        for inspector in inspectors:
            inspector.inspect()
            inspector_results.append(inspector.get_result())
        
        # Phase 7: Calculate score
        print("[7/10] Calculating architecture score...")
        score_engine = ScoreEngine(inspector_results)
        overall_score = score_engine.calculate()
        
        # Phase 9: Validate governance
        print("[9/10] Validating governance compliance...")
        governance_validator = GovernanceValidator(spec)
        governance_checks = governance_validator.validate()
        
        # Phase 10: Emit certification decision
        print("[10/10] Emitting certification decision...")
        certification_engine = CertificationEngine(
            score_engine,
            governance_checks,
            inspector_results
        )
        
        result = certification_engine.certify()
        
        # Phase 8: Generate reports
        print("[8/10] Generating reports...")
        report_gen = ReportGenerator()
        output_dir = f"./certification_reports/{self.request.module_name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        report_files = report_gen.generate_reports(result, output_dir)
        
        print(f"\n✅ Certification complete: {result.status}")
        print(f"   Overall Score: {result.overall_score:.2f}/100")
        print(f"   Reports: {output_dir}")
        
        return result
```

---

## PART 4: COMMAND-LINE INTERFACE

**File**: `certify_module.py` (root level)

```python
#!/usr/bin/env python3
"""
Architecture Certification Platform (ACP v1.0)
Automated module certification for Punto Cero System OS
"""

import argparse
import sys
from pathlib import Path

from acp.orchestrator.certify import CertificationOrchestrator
from acp.models import ModuleAnalysisRequest, AuditDepth

def main():
    parser = argparse.ArgumentParser(
        description="Certify a module against Architecture Constitution v1.0"
    )
    
    parser.add_argument(
        "module_name",
        help="Module to certify (e.g., 'billing', 'organizations', 'payment')"
    )
    
    parser.add_argument(
        "--path", "-p",
        default=".",
        help="Path to module directory (default: current directory)"
    )
    
    parser.add_argument(
        "--depth", "-d",
        choices=["shallow", "deep"],
        default="deep",
        help="Audit depth (default: deep)"
    )
    
    parser.add_argument(
        "--monitor", "-m",
        action="store_true",
        help="Include production monitoring recommendations"
    )
    
    parser.add_argument(
        "--reports-only",
        action="store_true",
        help="Only generate reports (skip analysis)"
    )
    
    args = parser.parse_args()
    
    # Locate module
    module_path = Path(args.path) / "backend" / args.module_name
    if not module_path.exists():
        module_path = Path(args.path) / args.module_name
    
    if not module_path.exists():
        print(f"❌ Module not found: {module_path}")
        sys.exit(1)
    
    # Create certification request
    request = ModuleAnalysisRequest(
        module_name=args.module_name,
        module_path=str(module_path),
        reference_modules=["payment", "billing"],
        audit_depth=AuditDepth.DEEP if args.depth == "deep" else AuditDepth.SHALLOW,
        include_monitoring=args.monitor,
    )
    
    # Run certification
    try:
        orchestrator = CertificationOrchestrator(request)
        result = orchestrator.run()
        
        # Exit code based on result
        if result.status == "APPROVED":
            sys.exit(0)
        elif result.status == "CONDITIONAL":
            sys.exit(1)  # Warning
        else:
            sys.exit(2)  # Failure
    
    except Exception as e:
        print(f"❌ Certification failed: {str(e)}")
        sys.exit(2)

if __name__ == "__main__":
    main()
```

---

## PART 5: CONFIGURATION

### Configuration File: `acp/config.yaml`

```yaml
# ACP v1.0 Configuration

# Scoring thresholds
thresholds:
  approved: 90.0
  conditional: 85.0
  rejected: 0.0

# Dimension weights (must sum to 1.0)
weights:
  repository_layer: 0.25
  tenant_isolation: 0.20
  backward_compatibility: 0.15
  security: 0.15
  observability: 0.10
  risk_management: 0.05
  architecture_compliance: 0.10

# Inspector settings
inspectors:
  repository:
    enabled: true
    phase: 2
  tenant:
    enabled: true
    phase: 3
  observability:
    enabled: true
    phase: 4
  security:
    enabled: true
    phase: 5
  backward_compatibility:
    enabled: true
    phase: 6

# Reference modules (for comparison)
reference_modules:
  - name: "payment"
    score: 97.25
  - name: "billing"
    score: 97.65

# Report settings
reports:
  output_format: "markdown"
  include_json: true
  include_summary: true
  
# Monitoring settings
monitoring:
  enabled: true
  alert_on_critical: true
  track_score_history: true
```

---

**This completes the detailed component design specification.**

**Status**: Ready for implementation  
**Next**: Proceed to ACP_IMPLEMENTATION_PLAN.md for implementation roadmap
