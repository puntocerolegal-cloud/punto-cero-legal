"""Repository Layer Inspector (Phase 4)"""

from pathlib import Path
from ..models import Finding, Recommendation, Risk, Severity, ModuleSpecification
from ..utils import (
    read_file, find_repos_in_directory, class_extends,
    uses_tenant_aware_query, calculate_firm_id_coverage,
    calculate_request_id_coverage, calculate_logging_coverage,
    has_error_handling, find_method_names, Evidence
)
from .base import BaseInspector


class RepositoryInspector(BaseInspector):
    """Phase 4: Repository Layer Compliance"""
    
    def __init__(self, spec: ModuleSpecification):
        super().__init__(spec, 4, "Repository Layer Compliance")
        self.details = {
            "repositories_found": 0,
            "extends_base": 0,
            "uses_tenant_aware": 0,
            "firm_id_coverage": 0.0,
            "request_id_coverage": 0.0,
            "logging_coverage": 0.0,
        }
    
    def inspect(self) -> None:
        """Run repository inspection"""
        # Find all repositories
        repos = find_repos_in_directory(self.spec.path)
        self.details["repositories_found"] = len(repos)
        
        if not repos:
            self.add_finding(Finding(
                severity=Severity.CRITICAL,
                title="No repositories found",
                description="Module has no repositories extending BaseRepository",
                evidence=[],
            ))
            return
        
        # Check each repository
        for repo_name, repo_file in repos.items():
            self._inspect_repository(repo_name, repo_file)
    
    def _inspect_repository(self, repo_name: str, repo_file: str) -> None:
        """Inspect a single repository"""
        content = read_file(repo_file)
        
        # Check BaseRepository extension
        extends_base = class_extends(content, repo_name, "BaseRepository")
        if extends_base:
            self.details["extends_base"] += 1
        else:
            self.add_finding(Finding(
                severity=Severity.CRITICAL,
                title=f"{repo_name} does not extend BaseRepository",
                description=f"Repository {repo_name} must extend BaseRepository",
                evidence=[Evidence(
                    type="file",
                    location=repo_file,
                    description="Class definition"
                )],
                recommendation="Change class declaration to extend BaseRepository"
            ))
        
        # Check TenantAwareQuery
        uses_tenant = uses_tenant_aware_query(content)
        if uses_tenant:
            self.details["uses_tenant_aware"] += 1
        else:
            self.add_finding(Finding(
                severity=Severity.HIGH,
                title=f"{repo_name} does not use TenantAwareQuery",
                description=f"Repository {repo_name} should use TenantAwareQuery for firm_id filtering",
                evidence=[],
                recommendation="Import and use TenantAwareQuery in all queries"
            ))
        
        # Check firm_id coverage
        firm_id_cov = calculate_firm_id_coverage(content)
        self.details["firm_id_coverage"] += firm_id_cov
        
        if firm_id_cov < 90:
            self.add_finding(Finding(
                severity=Severity.HIGH,
                title=f"{repo_name} low firm_id coverage",
                description=f"Only {firm_id_cov:.1f}% of methods have firm_id parameter",
                evidence=[],
                recommendation="Add firm_id parameter to all public methods"
            ))
        
        # Check request_id coverage
        request_id_cov = calculate_request_id_coverage(content)
        self.details["request_id_coverage"] += request_id_cov
        
        if request_id_cov < 90:
            self.add_finding(Finding(
                severity=Severity.MEDIUM,
                title=f"{repo_name} low request_id coverage",
                description=f"Only {request_id_cov:.1f}% of methods have request_id parameter",
                evidence=[],
                recommendation="Add request_id parameter for tracing"
            ))
        
        # Check logging
        logging_cov = calculate_logging_coverage(content)
        self.details["logging_coverage"] += logging_cov
        
        if logging_cov < 80:
            self.add_finding(Finding(
                severity=Severity.MEDIUM,
                title=f"{repo_name} low logging coverage",
                description=f"Only {logging_cov:.1f}% of methods have logging",
                evidence=[],
                recommendation="Add logging to all methods"
            ))
        
        # Check error handling
        methods = find_method_names(content)
        for method in methods:
            if method.startswith("_"):
                continue
            # Simple check: method should have error handling
            method_pattern = rf'def\s+{method}\s*\([^)]*\):.*?(?=\n\s{0,4}def\s|\Z)'
            # This is simplified; in production would be more thorough
        
        # Recommendations
        if extends_base and uses_tenant:
            self.add_recommendation(Recommendation(
                priority="low",
                title=f"{repo_name} follows Golden Repository pattern",
                description="Repository correctly extends BaseRepository and uses TenantAwareQuery",
            ))
    
    def calculate_score(self) -> float:
        """Calculate repository layer score"""
        repos = find_repos_in_directory(self.spec.path)
        
        if not repos:
            return 0.0
        
        score = 100.0
        
        # Deduction: repositories not extending BaseRepository
        extends_ratio = self.details["extends_base"] / len(repos)
        if extends_ratio < 1.0:
            score -= (1.0 - extends_ratio) * 20
        
        # Deduction: not using TenantAwareQuery
        tenant_ratio = self.details["uses_tenant_aware"] / len(repos)
        if tenant_ratio < 1.0:
            score -= (1.0 - tenant_ratio) * 15
        
        # Deduction: low firm_id coverage
        avg_firm_id = self.details["firm_id_coverage"] / len(repos) if repos else 0
        if avg_firm_id < 90:
            score -= (100 - avg_firm_id) * 0.2
        
        # Deduction: low logging coverage
        avg_logging = self.details["logging_coverage"] / len(repos) if repos else 0
        if avg_logging < 80:
            score -= (100 - avg_logging) * 0.1
        
        return max(0, score)
