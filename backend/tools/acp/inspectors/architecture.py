"""Architecture Inspector (Phase 9)"""

from pathlib import Path
from ..models import Finding, Recommendation, Severity, ModuleSpecification, Evidence
from ..utils import read_file, find_python_files
from .base import BaseInspector


class ArchitectureInspector(BaseInspector):
    """Phase 9: Architecture Compliance"""
    
    def __init__(self, spec: ModuleSpecification):
        super().__init__(spec, 9, "Architecture Compliance")
        self.details = {
            "constitution_compliant": True,
            "pattern_violations": 0,
            "frozen_components_modified": False,
        }
    
    def inspect(self) -> None:
        """Run architecture inspection"""
        # Check for frozen component modifications
        self._check_frozen_components()
        
        # Check for architecture pattern violations
        self._check_architecture_patterns()
        
        # Check for Constitution v1.0 compliance
        self._check_constitution()
    
    def _check_frozen_components(self) -> None:
        """Check that frozen components are not modified"""
        frozen_files = [
            "TenantKernel",
            "BaseRepository",
            "Golden Repository",
            "ExternalTenantResolver",
            "Payment",
            "Billing",
        ]
        
        # Just verify these components are imported, not modified
        for file_path in find_python_files(self.spec.path):
            content = read_file(str(file_path))
            
            # Check if module tries to override frozen classes
            for frozen in frozen_files:
                if f"class {frozen}" in content:
                    self.add_finding(Finding(
                        severity=Severity.CRITICAL,
                        title=f"Attempt to redefine frozen component: {frozen}",
                        description=f"Module attempts to redefine {frozen}",
                        evidence=[Evidence(
                            type="file",
                            location=str(file_path),
                            description=f"Redefines {frozen}"
                        )],
                        recommendation=f"Do not redefine {frozen}. Import and extend instead."
                    ))
                    self.details["frozen_components_modified"] = True
    
    def _check_architecture_patterns(self) -> None:
        """Check for correct architecture patterns"""
        # Services should use repositories
        services_dir = Path(self.spec.path) / "services"
        if services_dir.exists():
            for service_file in services_dir.glob("*service.py"):
                content = read_file(str(service_file))
                
                # Check if service imports repositories
                if "Repository" not in content:
                    self.add_finding(Finding(
                        severity=Severity.HIGH,
                        title=f"Service may not use repositories",
                        description=f"Service in {service_file} does not import repositories",
                        evidence=[],
                        recommendation="Use repository layer for data access"
                    ))
                    self.details["pattern_violations"] += 1
        
        # Routes should use TenantContext
        routes_dir = Path(self.spec.path) / "routes"
        if routes_dir.exists():
            for route_file in routes_dir.glob("*.py"):
                content = read_file(str(route_file))
                
                # Route handlers should use TenantContext
                if "Depends(get_tenant_context)" not in content:
                    # This is OK for public routes like login
                    if "login" not in str(route_file).lower() and "auth" not in str(route_file).lower():
                        self.add_finding(Finding(
                            severity=Severity.MEDIUM,
                            title=f"Route may lack tenant context",
                            description=f"Route in {route_file} may not enforce tenant context",
                            evidence=[],
                            recommendation="Use Depends(get_tenant_context) for tenant-scoped endpoints"
                        ))
    
    def _check_constitution(self) -> None:
        """Check Constitution v1.0 compliance"""
        # Constitution requires:
        # 1. No new patterns
        # 2. No unnecessary refactors
        # 3. Backward compatibility
        # 4. Frozen components untouched
        
        if self.details["pattern_violations"] > 0:
            self.details["constitution_compliant"] = False
            self.add_finding(Finding(
                severity=Severity.HIGH,
                title="Architecture Constitution violations",
                description="Module violates Architecture Constitution v1.0",
                evidence=[],
                recommendation="Ensure all patterns follow Constitution v1.0"
            ))
        
        if self.details["frozen_components_modified"]:
            self.details["constitution_compliant"] = False
    
    def calculate_score(self) -> float:
        """Calculate architecture score"""
        score = 100.0
        
        # Deductions
        score -= self.details["pattern_violations"] * 10
        
        if self.details["frozen_components_modified"]:
            score -= 50  # Critical violation
        
        if not self.details["constitution_compliant"]:
            score -= 20
        
        return max(0, score)
