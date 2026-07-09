"""
Behavioral Profile Engine — User Pattern Learning
═══════════════════════════════════════════════════════════════════

Purpose:
  Build dynamic user behavior profiles for anomaly detection.
  
  Learns:
  - Normal access rates and patterns
  - Resource access distribution
  - Temporal activity patterns
  - Tenant consistency
  - Action entropy (behavior variability)
  - Historical trust score
  
  Enables:
  - Baseline deviation detection
  - Personalized anomaly thresholds
  - Adaptive risk scoring
"""

from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from collections import defaultdict, deque
import math
import logging

logger = logging.getLogger(__name__)


# ═══════════════════════════════════════════════════════════════════
# BEHAVIORAL PROFILE MODEL
# ═══════════════════════════════════════════════════════════════════

class BehavioralProfile:
    """
    Dynamic behavior profile for a single user.
    
    Tracks:
    - Access patterns
    - Resource preferences
    - Temporal behavior
    - Trust evolution
    """
    
    def __init__(self, user_id: str):
        self.user_id = user_id
        self.created_at = datetime.utcnow()
        self.last_updated = datetime.utcnow()
        self.samples = 0
        
        # ─────────────────────────────────────────────────────────
        # RATE PATTERNS
        # ─────────────────────────────────────────────────────────
        self.request_times: deque = deque(maxlen=1000)  # Last 1000 requests
        self.avg_requests_per_minute = 0.0
        self.max_requests_per_minute = 0.0
        self.request_variance = 0.0
        
        # ─────────────────────────────────────────────────────────
        # RESOURCE PATTERNS
        # ─────────────────────────────────────────────────────────
        self.resource_access_count: Dict[str, int] = defaultdict(int)
        self.resource_distribution: Dict[str, float] = {}
        self.primary_resource = None
        
        # ─────────────────────────────────────────────────────────
        # ACTION PATTERNS
        # ─────────────────────────────────────────────────────────
        self.action_count: Dict[str, int] = defaultdict(int)
        self.action_distribution: Dict[str, float] = {}
        self.action_entropy = 0.0  # Shannon entropy of actions
        
        # ─────────────────────────────────────────────────────────
        # TEMPORAL PATTERNS
        # ─────────────────────────────────────────────────────────
        self.hourly_distribution: List[int] = [0] * 24
        self.peak_hours: List[int] = []
        self.off_hours: List[int] = []
        
        # ─────────────────────────────────────────────────────────
        # TENANT CONSISTENCY
        # ─────────────────────────────────────────────────────────
        self.tenant_accesses: Dict[str, int] = defaultdict(int)
        self.primary_tenant = None
        self.tenant_consistency_score = 1.0
        
        # ─────────────────────────────────────────────────────────
        # TRUST EVOLUTION
        # ─────────────────────────────────────────────────────────
        self.successful_actions = 0
        self.failed_actions = 0
        self.denied_actions = 0
        self.historical_trust_score = 0.5  # Start neutral
        self.trust_history: deque = deque(maxlen=100)
        
        # ─────────────────────────────────────────────────────────
        # ANOMALIES
        # ─────────────────────────────────────────────────────────
        self.anomaly_count = 0
        self.last_anomaly = None
        self.anomaly_severity_history: deque = deque(maxlen=50)
    
    def add_event(self, event: Dict[str, Any]) -> None:
        """
        Update profile with new security event.
        
        Args:
            event: Security event dict with:
                - timestamp
                - resource_type
                - action
                - success (bool)
        """
        self.samples += 1
        self.last_updated = datetime.utcnow()
        
        timestamp = event.get('timestamp', datetime.utcnow())
        resource_type = event.get('resource_type', 'unknown')
        action = event.get('action', 'unknown')
        success = event.get('success', False)
        tenant_id = event.get('tenant_id', 'unknown')
        
        # ─────────────────────────────────────────────────────────
        # UPDATE RATE PATTERNS
        # ─────────────────────────────────────────────────────────
        self.request_times.append(timestamp)
        self._update_rate_stats()
        
        # ─────────────────────────────────────────────────────────
        # UPDATE RESOURCE PATTERNS
        # ─────────────────────────────────────────────────────────
        self.resource_access_count[resource_type] += 1
        self._update_resource_distribution()
        
        # ─────────────────────────────────────────────────────────
        # UPDATE ACTION PATTERNS
        # ─────────────────────────────────────────────────────────
        self.action_count[action] += 1
        self._update_action_entropy()
        
        # ─────────────────────────────────────────────────────────
        # UPDATE TEMPORAL PATTERNS
        # ─────────────────────────────────────────────────────────
        hour = timestamp.hour
        self.hourly_distribution[hour] += 1
        self._update_temporal_patterns()
        
        # ─────────────────────────────────────────────────────────
        # UPDATE TENANT CONSISTENCY
        # ─────────────────────────────────────────────────────────
        self.tenant_accesses[tenant_id] += 1
        self._update_tenant_consistency()
        
        # ─────────────────────────────────────────────────────────
        # UPDATE TRUST SCORE
        # ─────────────────────────────────────────────────────────
        if success:
            self.successful_actions += 1
        else:
            self.failed_actions += 1
        self._update_trust_score()
    
    def _update_rate_stats(self) -> None:
        """Calculate request rate statistics."""
        if len(self.request_times) < 2:
            self.avg_requests_per_minute = 0.0
            return
        
        time_span = self.request_times[-1] - self.request_times[0]
        minutes = max(time_span.total_seconds() / 60, 1.0)
        rate = len(self.request_times) / minutes
        
        self.avg_requests_per_minute = rate
        self.max_requests_per_minute = max(self.max_requests_per_minute, rate)
    
    def _update_resource_distribution(self) -> None:
        """Calculate resource access distribution."""
        total = sum(self.resource_access_count.values())
        if total == 0:
            return
        
        self.resource_distribution = {
            resource: count / total
            for resource, count in self.resource_access_count.items()
        }
        
        # Primary resource is most accessed
        self.primary_resource = max(
            self.resource_access_count,
            key=self.resource_access_count.get
        )
    
    def _update_action_entropy(self) -> None:
        """Calculate Shannon entropy of actions (behavior variability)."""
        total = sum(self.action_count.values())
        if total == 0:
            self.action_entropy = 0.0
            return
        
        entropy = 0.0
        for count in self.action_count.values():
            p = count / total
            if p > 0:
                entropy -= p * math.log2(p)
        
        self.action_entropy = entropy
    
    def _update_temporal_patterns(self) -> None:
        """Identify peak and off hours."""
        total = sum(self.hourly_distribution)
        if total == 0:
            return
        
        avg = total / 24
        self.peak_hours = [h for h in range(24) if self.hourly_distribution[h] > avg * 1.5]
        self.off_hours = [h for h in range(24) if self.hourly_distribution[h] < avg * 0.5]
    
    def _update_tenant_consistency(self) -> None:
        """Calculate tenant consistency score."""
        if not self.tenant_accesses:
            self.tenant_consistency_score = 1.0
            return
        
        total = sum(self.tenant_accesses.values())
        max_count = max(self.tenant_accesses.values())
        
        # Score: proportion of requests in primary tenant
        self.tenant_consistency_score = max_count / total if total > 0 else 1.0
        self.primary_tenant = max(self.tenant_accesses, key=self.tenant_accesses.get)
    
    def _update_trust_score(self) -> None:
        """Update historical trust score based on success rate."""
        total = self.successful_actions + self.failed_actions + self.denied_actions
        if total == 0:
            return
        
        # Success rate contributes to trust
        success_rate = self.successful_actions / total if total > 0 else 0
        
        # Deny rate reduces trust (attempting forbidden operations)
        deny_rate = self.denied_actions / total if total > 0 else 0
        
        # Exponential moving average
        new_score = success_rate * 0.7 - deny_rate * 0.3
        self.historical_trust_score = self.historical_trust_score * 0.8 + new_score * 0.2
        self.historical_trust_score = max(0.0, min(1.0, self.historical_trust_score))
        self.trust_history.append(self.historical_trust_score)
    
    def get_profile_summary(self) -> Dict[str, Any]:
        """Get current profile summary."""
        return {
            "user_id": self.user_id,
            "samples": self.samples,
            "created_at": self.created_at.isoformat(),
            "last_updated": self.last_updated.isoformat(),
            "avg_requests_per_minute": self.avg_requests_per_minute,
            "max_requests_per_minute": self.max_requests_per_minute,
            "primary_resource": self.primary_resource,
            "primary_tenant": self.primary_tenant,
            "action_entropy": self.action_entropy,
            "tenant_consistency_score": self.tenant_consistency_score,
            "historical_trust_score": self.historical_trust_score,
            "peak_hours": self.peak_hours,
            "off_hours": self.off_hours,
            "total_events": self.samples,
            "successful": self.successful_actions,
            "failed": self.failed_actions,
            "denied": self.denied_actions,
        }
    
    def get_behavioral_deviation(self, event: Dict[str, Any]) -> float:
        """
        Calculate how much this event deviates from normal behavior.
        
        Returns:
            Deviation score (0.0 = normal, 1.0 = extreme deviation)
        """
        deviations = []
        
        # Rate deviation
        now = datetime.utcnow()
        recent_rate = 0
        if len(self.request_times) > 0:
            last_minute = [t for t in self.request_times if now - t < timedelta(minutes=1)]
            recent_rate = len(last_minute)
        
        if self.max_requests_per_minute > 0:
            rate_deviation = min(recent_rate / self.max_requests_per_minute, 1.0)
            deviations.append(rate_deviation)
        
        # Resource deviation (accessing unusual resource)
        resource_type = event.get('resource_type', 'unknown')
        normal_resources = set(r for r, p in self.resource_distribution.items() if p > 0.05)
        if resource_type not in normal_resources and self.samples > 10:
            deviations.append(0.5)
        
        # Temporal deviation (accessing at unusual hour)
        hour = datetime.utcnow().hour
        if self.peak_hours and hour not in self.peak_hours and self.samples > 10:
            deviations.append(0.3)
        
        # Tenant deviation (accessing different tenant)
        tenant_id = event.get('tenant_id', 'unknown')
        if self.primary_tenant and tenant_id != self.primary_tenant:
            deviations.append(0.7)
        
        if not deviations:
            return 0.0
        
        # Average deviation (weighted)
        return sum(deviations) / len(deviations)


# ═══════════════════════════════════════════════════════════════════
# BEHAVIORAL PROFILE ENGINE
# ═══════════════════════════════════════════════════════════════════

class BehavioralProfileEngine:
    """
    Manage behavioral profiles for all users.
    """
    
    def __init__(self):
        self.profiles: Dict[str, BehavioralProfile] = {}
        logger.info("[BEHAVIORAL_ENGINE] Initialized")
    
    def ingest_event(self, user_id: str, event: Dict[str, Any]) -> None:
        """Ingest security event into user profile."""
        if user_id not in self.profiles:
            self.profiles[user_id] = BehavioralProfile(user_id)
        
        self.profiles[user_id].add_event(event)
    
    def get_profile(self, user_id: str) -> Optional[BehavioralProfile]:
        """Get user's behavioral profile."""
        return self.profiles.get(user_id)
    
    def get_profile_summary(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user's profile summary."""
        profile = self.profiles.get(user_id)
        return profile.get_profile_summary() if profile else None
    
    def get_behavioral_deviation(self, user_id: str, event: Dict[str, Any]) -> float:
        """Get behavioral deviation for this user's event."""
        profile = self.profiles.get(user_id)
        if not profile or profile.samples < 5:
            return 0.0  # Not enough data yet
        
        return profile.get_behavioral_deviation(event)
    
    def get_all_profiles(self) -> Dict[str, BehavioralProfile]:
        """Get all profiles (for analysis)."""
        return self.profiles.copy()


# ═══════════════════════════════════════════════════════════════════
# GLOBAL ENGINE
# ═══════════════════════════════════════════════════════════════════

_global_engine: Optional[BehavioralProfileEngine] = None


def initialize_behavioral_engine() -> BehavioralProfileEngine:
    """Initialize global behavioral engine."""
    global _global_engine
    _global_engine = BehavioralProfileEngine()
    return _global_engine


def get_behavioral_engine() -> BehavioralProfileEngine:
    """Get global behavioral engine."""
    global _global_engine
    if _global_engine is None:
        _global_engine = BehavioralProfileEngine()
    return _global_engine
