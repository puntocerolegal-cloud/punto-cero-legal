"""Security Inspector (Phase 7)"""

from pathlib import Path
from ..models import Finding, Recommendation, Risk, Severity, ModuleSpecification, Evidence
from ..utils import (
    read_file, find_python_files, has_direct_mongodb,
    has_error_handling
)
from .base import BaseInspector


class SecurityInspector(BaseInspector):
    """Phase 7: Security Assessment"""
    
    def __init__(self, spec: ModuleSpecification):
        super().__init__(spec, 7, "Security")
        self.details = {
            "direct_mongodb_count": 0,
            "silent_failures": 0,
            "unvalidated_inputs": 0,
            "security_issues": 0,
        }
    
    def inspect(self) -> None:
        """Run security inspection"""
        # Find direct MongoDB access
        self._check_direct_mongodb()
        
        # Check for silent failures
        self._check_silent_failures()
        
        # Check for common vulnerabilities
        self._check_vulnerabilities()
    
    def _check_direct_mongodb(self) -> None:
        """Check for direct MongoDB access"""
        for file_path in find_python_files(self.spec.path):
            content = read_file(str(file_path))
            
            if has_direct_mongodb(content):
                self.details["direct_mongodb_count"] += 1
                
                # Check if it's acceptable (e.g., admin fallback)
                if "admin" not in str(file_path).lower() and "fallback" not in content.lower():
                    self.add_finding(Finding(
                        severity=Severity.HIGH,
                        title="Direct MongoDB access detected",
                        description=f"File {file_path} has direct MongoDB access without repository",
                        evidence=[Evidence(
                            type="file",
                            location=str(file_path),
                            description="Direct MongoDB access"
                        )],
                        recommendation="Use repositories instead of direct MongoDB access"
                    ))
    
    def _check_silent_failures(self) -> None:
        """Check for silent failures (empty except blocks)"""
        for file_path in find_python_files(self.spec.path):
            content = read_file(str(file_path))
            
            # Look for empty except blocks
            import re
            pattern = r'except\s*[:\w\s]+:\s*pass'
            if re.search(pattern, content):
                self.details["silent_failures"] += 1
                self.add_finding(Finding(
                    severity=Severity.HIGH,
                    title="Silent failure detected",
                    description=f"Empty except block in {file_path}",
                    evidence=[],
                    recommendation="All exceptions should be logged and re-raised"
                ))
    
    def _check_vulnerabilities(self) -> None:
        """Check for common vulnerabilities"""
        import re
        
        for file_path in find_python_files(self.spec.path):
            content = read_file(str(file_path))
            
            # Check for hardcoded credentials
            if re.search(r'(password|secret|key)\s*=\s*["\'][^"\']+["\']', content, re.IGNORECASE):
                self.details["security_issues"] += 1
                self.add_finding(Finding(
                    severity=Severity.CRITICAL,
                    title="Hardcoded credential detected",
                    description=f"Hardcoded credential in {file_path}",
                    evidence=[],
                    recommendation="Use environment variables or secrets management"
                ))
            
            # Check for eval/exec
            if "eval(" in content or "exec(" in content:
                self.details["security_issues"] += 1
                self.add_finding(Finding(
                    severity=Severity.CRITICAL,
                    title="Dangerous function usage",
                    description=f"eval() or exec() usage in {file_path}",
                    evidence=[],
                    recommendation="Never use eval() or exec() on user input"
                ))
    
    def calculate_score(self) -> float:
        """Calculate security score"""
        score = 100.0
        
        # Deductions for security issues
        score -= self.details["security_issues"] * 20
        score -= self.details["silent_failures"] * 15
        score -= self.details["direct_mongodb_count"] * 5  # Minor deduction if documented
        
        return max(0, score)
