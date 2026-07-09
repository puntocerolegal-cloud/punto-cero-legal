"""
Security Context — Intelligence-Enriched Authorization Context
═══════════════════════════════════════════════════════════════════

Purpose:
  Central context object that carries security intelligence through
  the entire authorization pipeline.
  
  Carries:
  - User behavioral profile
  - Risk assessment
  - Attack graph state
  - Correlation signals
  - Adaptive decision context
"""

from typing import Dict, Any, Optional, List
from datetime import datetime


class SecurityContext:
    """
    Rich security context for intelligent authorization.
    
    Flows through entire security pipeline:
    Request → SIL → GSCL → Authorization → Response
    """
    
    def __init__(
        self,
        user_id: str,
        event_id: str,
        request_timestamp: Optional[datetime] = None,
    ):
        self.user_id = user_id
        self.event_id = event_id
        self.request_timestamp = request_timestamp or datetime.utcnow()
        
        # ─────────────────────────────────────────────────────────
        # S2.5 CORE CONTEXT
        # ─────────────────────────────────────────────────────────
        self.user: Optional[Dict[str, Any]] = None
        self.resource: Optional[Dict[str, Any]] = None
        self.action: Optional[str] = None
        self.resource_type: Optional[str] = None
        
        # ─────────────────────────────────────────────────────────
        # S2.6 INTELLIGENCE CONTEXT
        # ─────────────────────────────────────────────────────────
        
        # Behavioral intelligence
        self.behavioral_profile: Optional[Dict[str, Any]] = None
        self.behavioral_deviation: float = 0.0
        self.trust_score: float = 0.5
        
        # Risk assessment
        self.base_risk: float = 0.0
        self.adaptive_risk: float = 0.0
        self.risk_factors: Dict[str, float] = {}
        self.risk_level: str = "unknown"  # low, medium, high, critical
        
        # Attack intelligence
        self.active_attack_graph: Optional[Dict[str, Any]] = None
        self.is_part_of_attack: bool = False
        self.attack_chain_depth: int = 0
        
        # Correlation intelligence
        self.correlated_users: List[str] = []
        self.global_threat_level: float = 0.0
        self.is_coordinated_attack: bool = False
        
        # Adaptive thresholds
        self.adaptive_block_threshold: float = 70.0
        
        # ─────────────────────────────────────────────────────────
        # DECISION CONTEXT
        # ─────────────────────────────────────────────────────────
        self.decision: Optional[str] = None  # "allow", "block", "challenge"
        self.decision_reason: Optional[str] = None
        self.confidence: float = 0.0
        self.required_mfa: bool = False
        
        # ─────────────────────────────────────────────────────────
        # AUDIT CONTEXT
        # ─────────────────────────────────────────────────────────
        self.audit_data: Dict[str, Any] = {}
        
    def with_user(self, user: Dict[str, Any]) -> 'SecurityContext':
        """Set user context."""
        self.user = user
        return self
    
    def with_resource(self, resource: Dict[str, Any]) -> 'SecurityContext':
        """Set resource context."""
        self.resource = resource
        return self
    
    def with_action(self, action: str, resource_type: str) -> 'SecurityContext':
        """Set action context."""
        self.action = action
        self.resource_type = resource_type
        return self
    
    def with_behavioral_profile(self, profile: Dict[str, Any]) -> 'SecurityContext':
        """Add behavioral profile."""
        self.behavioral_profile = profile
        return self
    
    def with_behavioral_deviation(self, deviation: float) -> 'SecurityContext':
        """Set behavioral deviation."""
        self.behavioral_deviation = deviation
        return self
    
    def with_risk_assessment(
        self,
        base_risk: float,
        adaptive_risk: float,
        factors: Dict[str, float],
        level: str,
    ) -> 'SecurityContext':
        """Add risk assessment."""
        self.base_risk = base_risk
        self.adaptive_risk = adaptive_risk
        self.risk_factors = factors
        self.risk_level = level
        return self
    
    def with_attack_graph(
        self,
        attack_graph: Dict[str, Any],
        is_part: bool,
        depth: int,
    ) -> 'SecurityContext':
        """Add attack graph intelligence."""
        self.active_attack_graph = attack_graph
        self.is_part_of_attack = is_part
        self.attack_chain_depth = depth
        return self
    
    def with_correlation(
        self,
        correlated_users: List[str],
        global_threat: float,
        is_coordinated: bool,
    ) -> 'SecurityContext':
        """Add correlation intelligence."""
        self.correlated_users = correlated_users
        self.global_threat_level = global_threat
        self.is_coordinated_attack = is_coordinated
        return self
    
    def with_adaptive_threshold(self, threshold: float) -> 'SecurityContext':
        """Set adaptive block threshold."""
        self.adaptive_block_threshold = threshold
        return self
    
    def set_decision(
        self,
        decision: str,
        reason: str,
        confidence: float,
        require_mfa: bool = False,
    ) -> 'SecurityContext':
        """Record authorization decision."""
        self.decision = decision
        self.decision_reason = reason
        self.confidence = confidence
        self.required_mfa = require_mfa
        return self
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert context to dict for logging/auditing."""
        return {
            "user_id": self.user_id,
            "event_id": self.event_id,
            "action": self.action,
            "resource_type": self.resource_type,
            "timestamp": self.request_timestamp.isoformat(),
            "behavioral_deviation": self.behavioral_deviation,
            "base_risk": self.base_risk,
            "adaptive_risk": self.adaptive_risk,
            "risk_level": self.risk_level,
            "is_part_of_attack": self.is_part_of_attack,
            "attack_chain_depth": self.attack_chain_depth,
            "is_coordinated_attack": self.is_coordinated_attack,
            "global_threat_level": self.global_threat_level,
            "decision": self.decision,
            "decision_reason": self.decision_reason,
            "confidence": self.confidence,
            "required_mfa": self.required_mfa,
        }
