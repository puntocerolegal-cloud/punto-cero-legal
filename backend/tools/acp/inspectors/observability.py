"""Observability Inspector (Phase 6)"""

from pathlib import Path
from ..models import Finding, Recommendation, Risk, Severity, ModuleSpecification, Evidence
from ..utils import (
    read_file, find_repos_in_directory, find_services_in_directory,
    uses_request_id, has_logging
)
from .base import BaseInspector


class ObservabilityInspector(BaseInspector):
    """Phase 6: Observability & Tracing"""
    
    def __init__(self, spec: ModuleSpecification):
        super().__init__(spec, 6, "Observability")
        self.details = {
            "request_id_coverage": 0.0,
            "logging_coverage": 0.0,
            "audit_log_usage": False,
            "error_context_quality": 0.0,
        }
    
    def inspect(self) -> None:
        """Run observability inspection"""
        # Check repositories
        self._inspect_repositories()
        
        # Check services
        self._inspect_services()
        
        # Check for audit logging
        self._check_audit_logging()
    
    def _inspect_repositories(self) -> None:
        """Check repository observability"""
        repos = find_repos_in_directory(self.spec.path)
        
        request_id_count = 0
        logging_count = 0
        
        for repo_name, repo_file in repos.items():
            content = read_file(repo_file)
            
            # Check request_id usage
            if uses_request_id(content):
                request_id_count += 1
            else:
                self.add_finding(Finding(
                    severity=Severity.MEDIUM,
                    title=f"{repo_name} lacks request_id tracing",
                    description=f"Repository {repo_name} does not use request_id for tracing",
                    evidence=[],
                    recommendation="Add request_id parameter to methods for end-to-end tracing"
                ))
            
            # Check logging
            if has_logging(content):
                logging_count += 1
            else:
                self.add_finding(Finding(
                    severity=Severity.MEDIUM,
                    title=f"{repo_name} lacks logging",
                    description=f"Repository {repo_name} has minimal logging",
                    evidence=[],
                    recommendation="Add comprehensive logging at debug, info, and error levels"
                ))
        
        if repos:
            self.details["request_id_coverage"] = (request_id_count / len(repos)) * 100
            self.details["logging_coverage"] = (logging_count / len(repos)) * 100
    
    def _inspect_services(self) -> None:
        """Check service observability"""
        services = find_services_in_directory(self.spec.path)
        
        for service_name, service_file in services.items():
            content = read_file(service_file)
            
            # Check for proper error context
            if "logger.error" in content and "str(e)" in content:
                # Good: logging errors with context
                self.details["error_context_quality"] += 1
            else:
                self.add_finding(Finding(
                    severity=Severity.LOW,
                    title=f"{service_name} lacks error context",
                    description=f"Service {service_name} should log error context",
                    evidence=[],
                    recommendation="Log exceptions with context: logger.error(f'... {str(e)}')"
                ))
    
    def _check_audit_logging(self) -> None:
        """Check for audit logging"""
        # Look for AuditLogRepository usage
        for file_path in find_services_in_directory(self.spec.path).values():
            content = read_file(file_path)
            if "AuditLogRepository" in content:
                self.details["audit_log_usage"] = True
                self.add_recommendation(Recommendation(
                    priority="high",
                    title="Audit logging properly configured",
                    description="Service uses AuditLogRepository for comprehensive audit trail",
                ))
                return
        
        self.add_finding(Finding(
            severity=Severity.MEDIUM,
            title="Limited audit logging",
            description="Module does not use AuditLogRepository for financial operation audit",
            evidence=[],
            recommendation="Use AuditLogRepository for all financial operations"
        ))
    
    def calculate_score(self) -> float:
        """Calculate observability score"""
        score = 100.0
        
        # Deductions based on coverage
        if self.details["request_id_coverage"] < 90:
            score -= (100 - self.details["request_id_coverage"]) * 0.3
        
        if self.details["logging_coverage"] < 80:
            score -= (100 - self.details["logging_coverage"]) * 0.3
        
        if not self.details["audit_log_usage"]:
            score -= 10
        
        return max(0, score)


from ..models import Recommendation
