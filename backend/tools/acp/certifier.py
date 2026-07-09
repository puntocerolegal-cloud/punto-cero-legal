"""ACP Certifier — Main orchestration logic"""

from pathlib import Path
from datetime import datetime
from typing import Optional
from .models import ModuleSpecification, CertificationResult, DecisionStatus
from .score_engine import ScoreEngine
from .inspectors.base import BaseInspector
from .inspectors.repository import RepositoryInspector
from .inspectors.tenant import TenantInspector
from .inspectors.observability import ObservabilityInspector
from .inspectors.security import SecurityInspector
from .inspectors.backward import BackwardCompatibilityInspector
from .inspectors.architecture import ArchitectureInspector
from .report_generator import ReportGenerator


class ACP:
    """Architecture Certification Platform"""
    
    def __init__(self, module_name: str, module_path: str):
        self.module_name = module_name
        self.module_path = Path(module_path)
        self.spec = ModuleSpecification(
            name=module_name,
            path=str(self.module_path),
        )
    
    def certify(self) -> CertificationResult:
        """Run complete certification pipeline"""
        print(f"\n🔍 ACP v1.0 — Certifying {self.module_name}...")
        print(f"   Module path: {self.module_path}")
        print()
        
        # Initialize inspectors
        inspectors = [
            RepositoryInspector(self.spec),
            TenantInspector(self.spec),
            ObservabilityInspector(self.spec),
            SecurityInspector(self.spec),
            BackwardCompatibilityInspector(self.spec),
            ArchitectureInspector(self.spec),
        ]
        
        # Run inspectors
        inspector_results = []
        for inspector in inspectors:
            print(f"   Phase {inspector.phase}: {inspector.name}...", end=" ")
            try:
                inspector.inspect()
                result = inspector.get_result()
                inspector_results.append(result)
                print(f"✓ {result.score:.1f}/100")
            except Exception as e:
                print(f"✗ Error: {str(e)}")
                result = inspector.get_result()
                result.score = 0
                inspector_results.append(result)
        
        print()
        
        # Calculate score
        print(f"   Calculating overall score...")
        score_engine = ScoreEngine(inspector_results)
        overall_score = score_engine.calculate()
        dimension_scores = score_engine.get_dimension_scores()
        decision = score_engine.get_decision_status()
        
        # Compile result
        result = CertificationResult(
            module_name=self.module_name,
            overall_score=overall_score,
            dimension_scores=dimension_scores,
            decision=decision,
            inspector_results=inspector_results,
            timestamp=datetime.now().isoformat(),
        )
        
        # Aggregate findings
        for inspector in inspector_results:
            result.findings.extend(inspector.findings)
            result.recommendations.extend(inspector.recommendations)
            result.risks.extend(inspector.risks)
        
        # Determine conditions/blockers
        if decision == DecisionStatus.CONDITIONAL:
            result.conditions = [
                "Module has minor issues that should be addressed in next iteration",
                "Monitoring recommended during initial deployment",
            ]
        elif decision == DecisionStatus.REJECTED:
            result.blockers = [
                finding.title for finding in result.findings
                if finding.severity.value == "critical"
            ]
        
        return result


def certify_module(module_name: str, module_path: Optional[str] = None) -> CertificationResult:
    """
    Certify a module.
    
    Args:
        module_name: Name of module (e.g., "billing", "payment")
        module_path: Path to module (defaults to backend/{module_name})
    
    Returns:
        CertificationResult with score, decision, and findings
    """
    if module_path is None:
        module_path = f"backend/{module_name}"
    
    certifier = ACP(module_name, module_path)
    return certifier.certify()
