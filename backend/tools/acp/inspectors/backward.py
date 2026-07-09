"""Backward Compatibility Inspector (Phase 8)"""

import re
from pathlib import Path
from ..models import Finding, Recommendation, Severity, ModuleSpecification, Evidence
from ..utils import read_file, find_python_files, extract_rest_endpoints
from .base import BaseInspector


class BackwardCompatibilityInspector(BaseInspector):
    """Phase 8: Backward Compatibility"""
    
    def __init__(self, spec: ModuleSpecification):
        super().__init__(spec, 8, "Backward Compatibility")
        self.details = {
            "breaking_changes": [],
            "endpoints_count": 0,
            "schema_changes": 0,
        }
    
    def inspect(self) -> None:
        """Run backward compatibility inspection"""
        # Check REST endpoints
        self._check_rest_endpoints()
        
        # Check for breaking changes in schemas
        self._check_schema_changes()
        
        # Check for HTTP status codes
        self._check_status_codes()
    
    def _check_rest_endpoints(self) -> None:
        """Check REST endpoints for changes"""
        endpoints_found = 0
        
        for file_path in find_python_files(self.spec.path):
            if "route" not in str(file_path).lower():
                continue
            
            content = read_file(str(file_path))
            endpoints = extract_rest_endpoints(content)
            
            for path, method in endpoints:
                endpoints_found += 1
                
                # Check for expected patterns
                # Routes should not have changed significantly
                if method in ["GET", "POST", "PUT", "DELETE"]:
                    # Expected HTTP methods
                    pass
        
        self.details["endpoints_count"] = endpoints_found
    
    def _check_schema_changes(self) -> None:
        """Check for breaking schema changes"""
        # Look at models directory
        models_dir = Path(self.spec.path) / "models"
        if not models_dir.exists():
            return
        
        for file_path in models_dir.glob("*.py"):
            content = read_file(str(file_path))
            
            # Check for removed fields (would break backward compatibility)
            # This is a simplified check
            if "@deprecated" in content:
                self.add_finding(Finding(
                    severity=Severity.LOW,
                    title="Deprecated field detected",
                    description=f"Model in {file_path} has deprecated fields",
                    evidence=[],
                    recommendation="Provide migration path for deprecated fields"
                ))
    
    def _check_status_codes(self) -> None:
        """Check for changed HTTP status codes"""
        status_code_changes = []
        
        for file_path in find_python_files(self.spec.path):
            if "route" not in str(file_path).lower():
                continue
            
            content = read_file(str(file_path))
            
            # Look for status_code specifications
            # Check if they follow conventions (200, 201, 204, 400, 401, 403, 404, 500)
            if re.search(r'status_code\s*=\s*(\d{3})', content):
                matches = re.findall(r'status_code\s*=\s*(\d{3})', content)
                for code in matches:
                    # Validate it's a reasonable code
                    if int(code) not in [200, 201, 204, 304, 400, 401, 403, 404, 500, 502, 503]:
                        status_code_changes.append(code)
        
        if status_code_changes:
            self.add_finding(Finding(
                severity=Severity.MEDIUM,
                title="Unusual HTTP status codes",
                description=f"Detected non-standard status codes: {status_code_changes}",
                evidence=[],
                recommendation="Use standard HTTP status codes"
            ))
    
    def calculate_score(self) -> float:
        """Calculate backward compatibility score"""
        score = 100.0
        
        # Deductions for breaking changes
        score -= len(self.details["breaking_changes"]) * 30
        score -= self.details["schema_changes"] * 10
        
        # If no endpoints found, that's suspicious
        if self.details["endpoints_count"] == 0:
            score -= 10
        
        return max(0, score)
