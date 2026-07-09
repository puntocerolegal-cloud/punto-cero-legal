"""
Adaptive Risk Engine — Intelligent Dynamic Risk Scoring
═══════════════════════════════════════════════════════════════════

Purpose:
  Replace static risk scoring with adaptive, context-aware scoring.
  
  Formula:
  risk_score = base_risk
              * behavior_deviation_factor
              * tenant_sensitivity_factor
              * historical_trust_inverse
              * attack_graph_weight
              * decay_over_time
  
  Enables:
  - Personalized thresholds
  - Context-aware scoring
  - Self-adjusting sensitivity
"""

from typing import Dict, Any, Optional
from datetime import datetime, timedelta
import math
import logging

logger = logging.getLogger(__name__)


# ═══════════════════════════════════════════════════════════════════
# ADAPTIVE RISK CALCULATOR
# ═══════════════════════════════════════════════════════════════════

class AdaptiveRiskEngine:
    """
    Calculate adaptive, context-aware risk scores.
    """
    
    # Base risk scores for different violation types
    BASE_RISK_SCORES = {
        "missing_jwt": 95.0,
        "malformed_jwt": 90.0,
        "expired_jwt": 75.0,
        "role_mismatch": 85.0,
        "org_boundary_violation": 90.0,
        "idor_attempt": 70.0,
        "privilege_escalation": 80.0,
        "denial_spike": 60.0,
        "repeated_denied_access": 65.0,
        "impersonation": 85.0,
        "permission_override": 95.0,
        "dangerous_role_transition": 85.0,
        "unusual_action": 40.0,
    }
    
    def __init__(self):
        self.user_risk_histories: Dict[str, list] = {}
        self.global_risk_baseline = 50.0
        logger.info("[ADAPTIVE_RISK] Initialized")
    
    def calculate_risk(
        self,
        user_id: str,
        event_type: str,
        base_risk: Optional[float] = None,
        behavior_deviation: float = 0.0,
        attack_graph: Optional[Any] = None,
        behavioral_profile: Optional[Any] = None,
    ) -> Dict[str, Any]:
        """
        Calculate adaptive risk score.
        
        Args:
            user_id: User ID
            event_type: Type of security event
            base_risk: Custom base risk or None to use defaults
            behavior_deviation: Behavior deviation factor (0-1)
            attack_graph: Active attack graph if exists
            behavioral_profile: User behavioral profile
        
        Returns:
            Risk assessment dict with score and factors
        """
        
        # Step 1: Base risk
        if base_risk is None:
            base_risk = self.BASE_RISK_SCORES.get(event_type, 50.0)
        
        # Step 2: Behavior deviation factor (0.5-2.0)
        # Deviation increases risk
        behavior_factor = 1.0 + (behavior_deviation * 1.0)
        
        # Step 3: Tenant sensitivity factor (0.8-1.5)
        # Based on organizational risk
        tenant_factor = self._calculate_tenant_sensitivity(user_id)
        
        # Step 4: Historical trust inverse (0.5-2.0)
        # High trust reduces risk, low trust increases
        trust_factor = self._calculate_trust_factor(behavioral_profile)
        
        # Step 5: Attack graph weight (1.0-3.0)
        # If part of active attack, multiply risk
        attack_factor = self._calculate_attack_factor(attack_graph)
        
        # Step 6: Time decay (0.5-1.0)
        # Recent severe events weighted higher
        time_decay = self._calculate_time_decay(user_id)
        
        # ───────────────────────────────────────────────────────────
        # FINAL CALCULATION
        # ───────────────────────────────────────────────────────────
        final_risk = (
            base_risk
            * behavior_factor
            * tenant_factor
            * trust_factor
            * attack_factor
            * time_decay
        )
        
        # Normalize to 0-100
        final_risk = min(max(final_risk, 0.0), 100.0)
        
        # Store in history
        self._record_risk(user_id, final_risk)
        
        return {
            "user_id": user_id,
            "event_type": event_type,
            "final_risk_score": final_risk,
            "base_risk": base_risk,
            "factors": {
                "behavior_deviation": behavior_deviation,
                "behavior_factor": behavior_factor,
                "tenant_sensitivity": tenant_factor,
                "trust_factor": trust_factor,
                "attack_graph_weight": attack_factor,
                "time_decay": time_decay,
            },
            "timestamp": datetime.utcnow().isoformat(),
        }
    
    def _calculate_tenant_sensitivity(self, user_id: str) -> float:
        """
        Calculate tenant sensitivity factor.
        
        Some organizations are higher risk (more strict thresholds).
        """
        # Could be based on:
        # - Organization security level
        # - Previous breaches
        # - Compliance requirements
        
        # Default: neutral
        return 1.0
    
    def _calculate_trust_factor(self, behavioral_profile: Optional[Any]) -> float:
        """
        Calculate trust factor based on historical behavior.
        
        High trust: 0.5 (reduces risk)
        Low trust: 2.0 (increases risk)
        """
        if not behavioral_profile:
            return 1.0  # Unknown user, neutral
        
        trust_score = behavioral_profile.historical_trust_score
        
        # Trust score: 0.0-1.0
        # At 1.0 (high trust): factor = 0.5
        # At 0.0 (no trust): factor = 2.0
        # At 0.5 (neutral): factor = 1.0
        
        factor = 2.0 - (trust_score * 1.5)  # 2.0 to 0.5
        return max(0.5, min(factor, 2.0))
    
    def _calculate_attack_factor(self, attack_graph: Optional[Any]) -> float:
        """
        Calculate attack graph weight.
        
        If user has active attack graph, multiply risk.
        """
        if not attack_graph:
            return 1.0  # No active attack
        
        severity = attack_graph.get_severity()
        event_count = attack_graph.event_count
        
        # Factor ranges from 1.0 to 3.0
        # Severity: 0-1, events: 1+
        factor = 1.0 + (severity * 1.5) + (min(event_count, 10) / 10)
        return min(factor, 3.0)
    
    def _calculate_time_decay(self, user_id: str) -> float:
        """
        Calculate time decay factor.
        
        Recent events weighted higher, older events decay.
        """
        if user_id not in self.user_risk_histories:
            return 1.0
        
        history = self.user_risk_histories[user_id]
        if not history:
            return 1.0
        
        # Check if recent spike
        last_24h = [
            (timestamp, risk)
            for timestamp, risk in history[-20:]
            if datetime.utcnow() - timestamp < timedelta(hours=24)
        ]
        
        if not last_24h:
            return 0.7  # Old history, less relevant
        
        # Recent activity: boost weight
        return 1.0
    
    def _record_risk(self, user_id: str, risk_score: float) -> None:
        """Record risk score in history."""
        if user_id not in self.user_risk_histories:
            self.user_risk_histories[user_id] = []
        
        self.user_risk_histories[user_id].append(
            (datetime.utcnow(), risk_score)
        )
        
        # Keep last 100 scores
        if len(self.user_risk_histories[user_id]) > 100:
            self.user_risk_histories[user_id] = self.user_risk_histories[user_id][-100:]
    
    def get_user_risk_trend(self, user_id: str) -> Dict[str, Any]:
        """Get user's risk trend."""
        if user_id not in self.user_risk_histories:
            return {"trend": "unknown"}
        
        history = self.user_risk_histories[user_id]
        if not history:
            return {"trend": "unknown"}
        
        scores = [score for _, score in history]
        
        avg = sum(scores) / len(scores)
        max_risk = max(scores)
        recent_avg = sum(scores[-5:]) / min(5, len(scores))
        
        # Trend direction
        if recent_avg > avg:
            trend = "increasing"
        elif recent_avg < avg:
            trend = "decreasing"
        else:
            trend = "stable"
        
        return {
            "user_id": user_id,
            "trend": trend,
            "average_risk": avg,
            "max_risk": max_risk,
            "recent_average": recent_avg,
            "sample_count": len(scores),
        }
    
    def get_adaptive_threshold(self, user_id: str) -> float:
        """
        Get adaptive risk threshold for user.
        
        High-trust users: higher threshold (less blocking)
        Low-trust users: lower threshold (more blocking)
        """
        trend = self.get_user_risk_trend(user_id)
        
        if trend["trend"] == "unknown":
            return 70.0  # Default
        
        avg_risk = trend.get("average_risk", 50.0)
        
        # If user consistently low risk: raise threshold
        # If user consistently high risk: lower threshold
        
        threshold = 70.0 - (avg_risk - 50.0) * 0.2
        return max(50.0, min(threshold, 80.0))


# ═══════════════════════════════════════════════════════════════════
# GLOBAL ENGINE
# ═══════════════════════════════════════════════════════════════════

_global_engine: Optional[AdaptiveRiskEngine] = None


def initialize_adaptive_risk_engine() -> AdaptiveRiskEngine:
    """Initialize global adaptive risk engine."""
    global _global_engine
    _global_engine = AdaptiveRiskEngine()
    return _global_engine


def get_adaptive_risk_engine() -> AdaptiveRiskEngine:
    """Get global adaptive risk engine."""
    global _global_engine
    if _global_engine is None:
        _global_engine = AdaptiveRiskEngine()
    return _global_engine
