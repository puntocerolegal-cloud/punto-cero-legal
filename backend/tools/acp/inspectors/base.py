"""Base inspector class for all inspectors"""

from abc import ABC, abstractmethod
from typing import List
from ..models import InspectorResult, Finding, Recommendation, Risk, ModuleSpecification


class BaseInspector(ABC):
    """Abstract base inspector"""
    
    def __init__(self, spec: ModuleSpecification, phase: int, name: str):
        self.spec = spec
        self.phase = phase
        self.name = name
        self.findings: List[Finding] = []
        self.recommendations: List[Recommendation] = []
        self.risks: List[Risk] = []
        self.score = 0.0
        self.details = {}
    
    @abstractmethod
    def inspect(self) -> None:
        """Run inspection. Populate findings, recommendations, and calculate score."""
        pass
    
    @abstractmethod
    def calculate_score(self) -> float:
        """Calculate phase score (0-100)"""
        pass
    
    def get_result(self) -> InspectorResult:
        """Return standardized result"""
        self.score = self.calculate_score()
        
        return InspectorResult(
            phase=self.phase,
            name=self.name,
            passed=self.score >= 85,  # Phase threshold
            score=self.score,
            findings=self.findings,
            recommendations=self.recommendations,
            risks=self.risks,
            details=self.details,
        )
    
    def add_finding(self, finding: Finding) -> None:
        """Add a finding"""
        self.findings.append(finding)
    
    def add_recommendation(self, rec: Recommendation) -> None:
        """Add a recommendation"""
        self.recommendations.append(rec)
    
    def add_risk(self, risk: Risk) -> None:
        """Add a risk"""
        self.risks.append(risk)
