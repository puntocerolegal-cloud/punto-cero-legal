"""Tenant Isolation Inspector (Phase 5)"""

from pathlib import Path
from ..models import Finding, Recommendation, Risk, Severity, ModuleSpecification, Evidence
from ..utils import (
    read_file, find_repos_in_directory, find_services_in_directory,
    has_direct_mongodb, uses_firm_id, uses_tenant_aware_query
)
from .base import BaseInspector


class TenantInspector(BaseInspector):
    """Phase 5: Tenant Isolation Validation"""
    
    def __init__(self, spec: ModuleSpecification):
        super().__init__(spec, 5, "Tenant Isolation")
        self.details = {
            "queries_scoped": 0,
            "queries_unscoped": 0,
            "direct_mongodb_found": 0,
            "tenant_aware_usage": 0,
            "firm_id_usage": 0,
        }
    
    def inspect(self) -> None:
        """Run tenant isolation inspection"""
        # Check repositories
        self._inspect_repositories()
        
        # Check services
        self._inspect_services()
    
    def _inspect_repositories(self) -> None:
        """Check repository tenant isolation"""
        repos = find_repos_in_directory(self.spec.path)
        
        for repo_name, repo_file in repos.items():
            content = read_file(repo_file)
            
            # Check for TenantAwareQuery usage
            if uses_tenant_aware_query(content):
                self.details["tenant_aware_usage"] += 1
                self.details["queries_scoped"] += 1
            else:
                # Check for direct MongoDB without tenant scoping
                if has_direct_mongodb(content):
                    self.details["queries_unscoped"] += 1
                    self.add_finding(Finding(
                        severity=Severity.HIGH,
                        title=f"{repo_name} has unscoped MongoDB queries",
                        description="Repository has direct MongoDB access without firm_id filtering",
                        evidence=[Evidence(
                            type="file",
                            location=repo_file,
                            description="Repository with direct MongoDB access"
                        )],
                        recommendation="Use TenantAwareQuery for all database queries"
                    ))
            
            # Check firm_id usage
            if uses_firm_id(content):
                self.details["firm_id_usage"] += 1
    
    def _inspect_services(self) -> None:
        """Check service tenant isolation"""
        services = find_services_in_directory(self.spec.path)
        
        for service_name, service_file in services.items():
            content = read_file(service_file)
            
            # Check for tenant mapping usage
            if "TenantMapping" in content:
                # Good: uses tenant mapping adapter
                pass
            else:
                # Check if there's any firm_id handling
                if "firm_id" not in content and "organization_id" not in content:
                    self.add_finding(Finding(
                        severity=Severity.MEDIUM,
                        title=f"{service_name} lacks tenant context",
                        description="Service does not handle tenant context (firm_id or organization_id)",
                        evidence=[],
                        recommendation="Use TenantMapping adapter or receive firm_id from routes"
                    ))
    
    def calculate_score(self) -> float:
        """Calculate tenant isolation score"""
        score = 100.0
        
        # Critical: any unscoped queries
        if self.details["queries_unscoped"] > 0:
            score -= 20
        
        # Check firm_id usage
        if self.details["firm_id_usage"] == 0:
            score -= 10
        
        # Perfect isolation requires all checks to pass
        repos = find_repos_in_directory(self.spec.path)
        if repos and self.details["tenant_aware_usage"] == len(repos):
            # Perfect tenant isolation
            pass
        elif repos and self.details["tenant_aware_usage"] < len(repos):
            score -= (1 - (self.details["tenant_aware_usage"] / len(repos))) * 15
        
        return max(0, score)
