"""Score Engine — Calculate overall certification score"""

from typing import List, Dict
from .models import InspectorResult, DimensionScores, CertificationResult, DecisionStatus


class ScoreEngine:
    """Calculate weighted architecture score"""
    
    # Weights (must sum to 1.0)
    WEIGHTS = {
        "Repository Layer": 0.25,
        "Tenant Isolation": 0.20,
        "Backward Compatibility": 0.15,
        "Security": 0.15,
        "Observability": 0.10,
        "Architecture": 0.10,
        "Risk Management": 0.05,
    }
    
    # Thresholds
    APPROVED_THRESHOLD = 90.0
    CONDITIONAL_THRESHOLD = 85.0
    
    def __init__(self, inspector_results: List[InspectorResult]):
        self.inspector_results = inspector_results
        self.dimension_scores = {}
        self.overall_score = 0.0
    
    def calculate(self) -> float:
        """Calculate overall weighted score"""
        # Map inspector results to dimensions
        self.dimension_scores = self._map_dimensions()
        
        # Calculate weighted sum
        self.overall_score = sum(
            self.dimension_scores.get(dim, 0) * weight
            for dim, weight in self.WEIGHTS.items()
        )
        
        # Ensure result is in range
        self.overall_score = max(0, min(100, self.overall_score))
        
        return self.overall_score
    
    def _map_dimensions(self) -> Dict[str, float]:
        """Map inspector results to dimensions"""
        scores = {}
        
        for result in self.inspector_results:
            if result.phase == 4:  # Repository Inspector
                scores["Repository Layer"] = result.score
            elif result.phase == 5:  # Tenant Inspector
                scores["Tenant Isolation"] = result.score
            elif result.phase == 8:  # Backward Compatibility Inspector
                scores["Backward Compatibility"] = result.score
            elif result.phase == 7:  # Security Inspector
                scores["Security"] = result.score
            elif result.phase == 6:  # Observability Inspector
                scores["Observability"] = result.score
            elif result.phase == 9:  # Architecture Inspector
                scores["Architecture"] = result.score
            elif result.phase == 3:  # Risk (placeholder for now)
                scores["Risk Management"] = result.score
        
        # Fill missing dimensions with defaults
        for dim in self.WEIGHTS:
            if dim not in scores:
                scores[dim] = 70.0  # Default to 70 if not found
        
        return scores
    
    def get_decision_status(self) -> DecisionStatus:
        """Determine certification status based on score"""
        if self.overall_score >= self.APPROVED_THRESHOLD:
            return DecisionStatus.APPROVED
        elif self.overall_score >= self.CONDITIONAL_THRESHOLD:
            return DecisionStatus.CONDITIONAL
        else:
            return DecisionStatus.REJECTED
    
    def get_dimension_scores(self) -> DimensionScores:
        """Return dimension scores object"""
        return DimensionScores(
            repository_layer=self.dimension_scores.get("Repository Layer", 0),
            tenant_isolation=self.dimension_scores.get("Tenant Isolation", 0),
            backward_compatibility=self.dimension_scores.get("Backward Compatibility", 0),
            security=self.dimension_scores.get("Security", 0),
            observability=self.dimension_scores.get("Observability", 0),
            architecture=self.dimension_scores.get("Architecture", 0),
            risk_management=self.dimension_scores.get("Risk Management", 0),
        )
