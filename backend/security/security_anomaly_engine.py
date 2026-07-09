"""
Security Anomaly Engine — Risk Detection & Behavioral Analysis
═══════════════════════════════════════════════════════════════════

Purpose:
  Detect suspicious behavior patterns and assign risk scores.
  
  Detects:
  - Unusual user access patterns
  - Spikes in authorization denials
  - Repeated access to restricted resources
  - Contextual anomalies
  - Statistical deviations from normal behavior

Risk Scoring:
  0-20: Normal
  21-50: Suspicious
  51-79: Highly suspicious
  80-100: Attack likely (block or alert)
"""

from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from collections import defaultdict
import logging
import math

logger = logging.getLogger(__name__)


# ═══════════════════════════════════════════════════════════════════
# ANOMALY DETECTION ENGINE
# ═══════════════════════════════════════════════════════════════════

class UserBehaviorProfile:
    """Track normal behavior for a user."""
    
    def __init__(self, user_id: str):
        self.user_id = user_id
        self.first_seen = datetime.utcnow()
        
        # Access patterns
        self.access_count = 0
        self.resource_accesses: Dict[str, int] = defaultdict(int)
        self.action_accesses: Dict[str, int] = defaultdict(int)
        
        # Failure patterns
        self.denial_count = 0
        self.denial_resources: Dict[str, int] = defaultdict(int)
        
        # Temporal
        self.last_access = datetime.utcnow()
        self.access_times: List[datetime] = []
    
    def add_access(self, resource_type: str, action: str) -> None:
        """Record successful access."""
        self.access_count += 1
        self.resource_accesses[resource_type] += 1
        self.action_accesses[action] += 1
        self.last_access = datetime.utcnow()
        self.access_times.append(self.last_access)
        
        # Keep only last 24 hours
        cutoff = datetime.utcnow() - timedelta(hours=24)
        self.access_times = [t for t in self.access_times if t > cutoff]
    
    def add_denial(self, resource_type: str) -> None:
        """Record access denial."""
        self.denial_count += 1
        self.denial_resources[resource_type] += 1
    
    def get_normal_access_rate(self) -> float:
        """Estimate normal accesses per hour."""
        if not self.access_times:
            return 0.0
        
        if len(self.access_times) < 2:
            return 1.0
        
        time_span = self.access_times[-1] - self.access_times[0]
        hours = max(time_span.total_seconds() / 3600, 0.1)
        return len(self.access_times) / hours


class SecurityAnomalyEngine:
    """
    Detect anomalous behavior and assign risk scores.
    """
    
    def __init__(self, alert_callback=None):
        self.user_profiles: Dict[str, UserBehaviorProfile] = {}
        self.alert_callback = alert_callback
        self.denial_spike_threshold = 5  # >5 denials in 5 min = spike
        self.resource_access_spike_threshold = 20  # >20 accesses to same resource in 1 min
        logger.info("[ANOMALY_ENGINE] Initialized")
    
    def analyze_access(
        self,
        user_id: str,
        resource_type: str,
        action: str,
        success: bool,
        context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Analyze user access and compute risk score.
        
        Args:
            user_id: User making access
            resource_type: Type of resource ("case", "document", etc.)
            action: Action type ("read", "write", "delete")
            success: Whether access was allowed
            context: Additional context (IP, headers, etc.)
        
        Returns:
            Risk analysis dict with risk_score (0-100)
        """
        
        # Get or create profile
        if user_id not in self.user_profiles:
            self.user_profiles[user_id] = UserBehaviorProfile(user_id)
        
        profile = self.user_profiles[user_id]
        risk_score = 0.0
        risk_factors: List[str] = []
        
        if success:
            profile.add_access(resource_type, action)
            
            # ─────────────────────────────────────────────────────────
            # FACTOR 1: Access rate anomaly
            # ─────────────────────────────────────────────────────────
            access_rate = len(profile.access_times[-10:])  # Last 10 accesses
            if access_rate > 10:
                # High access rate
                risk_score += 15
                risk_factors.append("high_access_rate")
            
            # ─────────────────────────────────────────────────────────
            # FACTOR 2: Unusual resource access
            # ─────────────────────────────────────────────────────────
            resource_count = profile.resource_accesses[resource_type]
            if resource_count > 50 and action == "read":
                risk_score += 10
                risk_factors.append("bulk_read_access")
            
            # ─────────────────────────────────────────────────────────
            # FACTOR 3: Dangerous action pattern
            # ─────────────────────────────────────────────────────────
            if action == "delete":
                risk_score += 5  # Delete is higher risk
                if profile.action_accesses["delete"] > 10:
                    risk_score += 10  # Multiple deletes suspicious
                    risk_factors.append("multiple_deletes")
            
        else:
            profile.add_denial(resource_type)
            
            # ─────────────────────────────────────────────────────────
            # FACTOR 4: Denial spike (IDOR attempt pattern)
            # ─────────────────────────────────────────────────────────
            recent_denials = sum(
                1 for t in profile.access_times[-20:]
                if profile.denial_resources.get(resource_type, 0) > 0
            )
            
            if profile.denial_count > self.denial_spike_threshold:
                risk_score += 20
                risk_factors.append("denial_spike")
            
            # ─────────────────────────────────────────────────────────
            # FACTOR 5: Repeated denied access to same resource
            # ─────────────────────────────────────────────────────────
            if profile.denial_resources[resource_type] > 3:
                risk_score += 15
                risk_factors.append("repeated_denied_access")
            
            # ─────────────────────────────────────────────────────────
            # FACTOR 6: Privilege escalation attempt
            # ─────────────────────────────────────────────────────────
            if action in ("delete", "admin", "assign"):
                risk_score += 25
                risk_factors.append("privilege_escalation_attempt")
        
        # ───────────────────────────────────────────────────────────
        # FACTOR 7: Contextual anomaly
        # ───────────────────────────────────────────────────────────
        if context:
            if context.get("ip_changed"):
                risk_score += 10
                risk_factors.append("ip_changed")
            
            if context.get("user_agent_changed"):
                risk_score += 5
                risk_factors.append("user_agent_changed")
            
            if context.get("unusual_time"):
                risk_score += 8
                risk_factors.append("unusual_time")
        
        # ───────────────────────────────────────────────────────────
        # FACTOR 8: New user behavior (first 24 hours)
        # ───────────────────────────────────────────────────────────
        age = datetime.utcnow() - profile.first_seen
        if age < timedelta(hours=24):
            risk_score += 10
            risk_factors.append("new_user")
        
        # ───────────────────────────────────────────────────────────
        # NORMALIZATION
        # ───────────────────────────────────────────────────────────
        risk_score = min(risk_score, 100.0)
        
        # ───────────────────────────────────────────────────────────
        # CLASSIFICATION
        # ───────────────────────────────────────────────────────────
        if risk_score >= 80:
            risk_level = "critical"
        elif risk_score >= 50:
            risk_level = "high"
        elif risk_score >= 20:
            risk_level = "medium"
        else:
            risk_level = "low"
        
        result = {
            "user_id": user_id,
            "risk_score": risk_score,
            "risk_level": risk_level,
            "factors": risk_factors,
            "success": success,
            "resource_type": resource_type,
            "action": action,
            "timestamp": datetime.utcnow().isoformat(),
        }
        
        # Alert on high risk
        if risk_level in ("high", "critical"):
            logger.warning(
                f"[ANOMALY_ENGINE] High risk activity: user={user_id} "
                f"score={risk_score} level={risk_level} factors={risk_factors}"
            )
            
            if self.alert_callback:
                try:
                    self.alert_callback({
                        "level": "warning" if risk_level == "high" else "critical",
                        "type": "anomaly",
                        "message": f"Anomalous activity detected for user {user_id}",
                        "risk_score": risk_score,
                        "factors": risk_factors,
                    })
                except Exception as e:
                    logger.error(f"[ANOMALY_ENGINE] Alert callback failed: {e}")
        
        return result
    
    def should_block(self, risk_score: float, threshold: float = 80.0) -> bool:
        """
        Determine if access should be blocked based on risk.
        
        Args:
            risk_score: Risk score (0-100)
            threshold: Block if >= threshold
        
        Returns:
            True if should block
        """
        return risk_score >= threshold
    
    def get_user_profile(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user behavior profile."""
        if user_id not in self.user_profiles:
            return None
        
        profile = self.user_profiles[user_id]
        return {
            "user_id": user_id,
            "access_count": profile.access_count,
            "denial_count": profile.denial_count,
            "first_seen": profile.first_seen.isoformat(),
            "last_access": profile.last_access.isoformat(),
            "normal_access_rate": profile.get_normal_access_rate(),
            "resources_accessed": dict(profile.resource_accesses),
        }
    
    def reset_user_profile(self, user_id: str) -> None:
        """Reset anomaly profile for user (after incident resolution)."""
        if user_id in self.user_profiles:
            del self.user_profiles[user_id]
            logger.info(f"[ANOMALY_ENGINE] Reset profile for user: {user_id}")


# ═══════════════════════════════════════════════════════════════════
# GLOBAL ANOMALY ENGINE
# ═══════════════════════════════════════════════════════════════════

_global_anomaly_engine: Optional[SecurityAnomalyEngine] = None


def initialize_anomaly_engine(alert_callback=None) -> SecurityAnomalyEngine:
    """
    Initialize global anomaly engine.
    
    Usage in server.py:
        from security.security_anomaly_engine import initialize_anomaly_engine
        
        @app.on_event("startup")
        async def startup():
            anomaly_engine = initialize_anomaly_engine()
    """
    global _global_anomaly_engine
    _global_anomaly_engine = SecurityAnomalyEngine(alert_callback=alert_callback)
    return _global_anomaly_engine


def get_anomaly_engine() -> SecurityAnomalyEngine:
    """Get global anomaly engine."""
    global _global_anomaly_engine
    if _global_anomaly_engine is None:
        _global_anomaly_engine = SecurityAnomalyEngine()
    return _global_anomaly_engine
