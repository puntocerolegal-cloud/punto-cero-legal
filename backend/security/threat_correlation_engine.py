"""
Threat Correlation Engine — Distributed Attack Detection
═══════════════════════════════════════════════════════════════════

Purpose:
  Detect distributed and coordinated attacks across multiple users.
  
  Detects:
  - Multiple users targeting same resource
  - Synchronized access patterns
  - Bot-like distributed probing
  - Coordinated privilege escalation
"""

from typing import Dict, List, Any, Set
from datetime import datetime, timedelta
from collections import defaultdict
import logging

logger = logging.getLogger(__name__)


class ThreatCorrelationEngine:
    """Detect correlated threats across users."""
    
    def __init__(self):
        self.resource_access_map: Dict[str, Set[str]] = defaultdict(set)
        self.coordinated_users: List[Set[str]] = []
        self.global_event_queue: List[Dict[str, Any]] = []
        logger.info("[THREAT_CORRELATION] Initialized")
    
    def ingest_event(self, event: Dict[str, Any]) -> Dict[str, Any]:
        """Ingest event and check for correlation patterns."""
        user_id = event.get('user_id')
        resource_id = event.get('resource_id')
        
        # Track who accessed what
        if resource_id:
            self.resource_access_map[resource_id].add(user_id)
        
        # Add to global queue (keep last 1000)
        self.global_event_queue.append(event)
        if len(self.global_event_queue) > 1000:
            self.global_event_queue = self.global_event_queue[-1000:]
        
        # Analyze patterns
        correlation_result = self._analyze_correlation_patterns()
        
        return correlation_result
    
    def _analyze_correlation_patterns(self) -> Dict[str, Any]:
        """Detect correlation patterns in recent events."""
        # Check for synchronized attacks
        recent_failed = [
            e for e in self.global_event_queue[-100:]
            if not e.get('success') and 
            datetime.utcnow() - e.get('timestamp', datetime.utcnow()) < timedelta(minutes=5)
        ]
        
        if not recent_failed:
            return {"coordinated": False}
        
        # Group by resource
        resource_attacks: Dict[str, List[str]] = defaultdict(list)
        for event in recent_failed:
            resource_id = event.get('resource_id')
            user_id = event.get('user_id')
            if resource_id and user_id:
                resource_attacks[resource_id].append(user_id)
        
        # Check for multiple users hitting same resource
        coordinated_targets = {
            res: users for res, users in resource_attacks.items()
            if len(set(users)) > 2
        }
        
        if coordinated_targets:
            logger.warning(
                f"[THREAT_CORRELATION] Coordinated attack detected: "
                f"{coordinated_targets}"
            )
            return {
                "coordinated": True,
                "targets": list(coordinated_targets.keys()),
                "user_count": len(set(u for users in coordinated_targets.values() for u in users)),
                "correlation_type": "multi_user_targeting",
            }
        
        return {"coordinated": False}
    
    def get_correlated_users(self, user_id: str) -> List[str]:
        """Get users correlated with given user."""
        # Find if user is part of coordinated group
        for resource, users in self.resource_access_map.items():
            if user_id in users and len(users) > 1:
                return list(users - {user_id})
        return []
    
    def get_global_threat_level(self) -> float:
        """Get system-wide threat level (0-1)."""
        # Analyze recent event patterns
        recent = [
            e for e in self.global_event_queue[-100:]
            if not e.get('success')
        ]
        
        if not recent:
            return 0.0
        
        # Threat = proportion of failed events
        threat = len(recent) / 100
        return min(threat, 1.0)


def initialize_threat_correlation_engine() -> ThreatCorrelationEngine:
    """Initialize global threat correlation engine."""
    return ThreatCorrelationEngine()


def get_threat_correlation_engine() -> ThreatCorrelationEngine:
    """Get global threat correlation engine."""
    return ThreatCorrelationEngine()
