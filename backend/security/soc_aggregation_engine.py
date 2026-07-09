"""
SOC Aggregation Engine — Real-Time Intelligence Aggregation
═══════════════════════════════════════════════════════════════════

Purpose:
  Aggregate raw events into actionable intelligence.
  
  Calculates:
  - Active incidents
  - Top attack vectors
  - Tenant risk heatmap
  - User risk scores
  - System security health
"""

from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from collections import defaultdict
import logging

logger = logging.getLogger(__name__)


class SOCMetrics:
    """Aggregated SOC metrics."""
    
    def __init__(self):
        self.event_count = 0
        self.active_incidents = []
        self.critical_events = []
        self.tenant_risks: Dict[str, float] = {}
        self.user_risks: Dict[str, float] = {}
        self.attack_vectors: Dict[str, int] = defaultdict(int)
        self.system_health_score = 100.0
        self.last_updated = datetime.utcnow()


class SOCAggregationEngine:
    """Aggregate events into metrics."""
    
    def __init__(self):
        self.metrics = SOCMetrics()
        self.event_history: List[Dict[str, Any]] = []
        logger.info("[SOC_AGGREGATION] Initialized")
    
    def ingest_event(self, event: Dict[str, Any]) -> None:
        """Process event for aggregation."""
        self.event_history.append(event)
        if len(self.event_history) > 1000:
            self.event_history = self.event_history[-1000:]
        
        self._recalculate_metrics()
    
    def _recalculate_metrics(self) -> None:
        """Recalculate all metrics from event history."""
        # Reset metrics
        self.metrics = SOCMetrics()
        
        # Count events
        self.metrics.event_count = len(self.event_history)
        
        # Extract critical events
        critical = [e for e in self.event_history if e.get("severity") == "critical"]
        self.metrics.critical_events = critical[-10:]  # Last 10
        
        # Calculate tenant risks
        tenant_events: Dict[str, List[Dict]] = defaultdict(list)
        for event in self.event_history[-100:]:
            tenant_id = event.get("data", {}).get("tenant_id", "unknown")
            tenant_events[tenant_id].append(event)
        
        for tenant_id, events in tenant_events.items():
            critical_count = len([e for e in events if e.get("severity") == "critical"])
            total = len(events)
            risk = (critical_count / total * 100) if total > 0 else 0
            self.metrics.tenant_risks[tenant_id] = min(risk, 100.0)
        
        # Calculate user risks
        user_events: Dict[str, List[Dict]] = defaultdict(list)
        for event in self.event_history[-100:]:
            user_id = event.get("user_id", "unknown")
            user_events[user_id].append(event)
        
        for user_id, events in user_events.items():
            denied = len([e for e in events if not e.get("data", {}).get("success", True)])
            total = len(events)
            risk = (denied / total * 100) if total > 0 else 0
            self.metrics.user_risks[user_id] = min(risk, 100.0)
        
        # Count attack vectors
        for event in self.event_history[-100:]:
            attack_type = event.get("data", {}).get("attack_type", "unknown")
            self.metrics.attack_vectors[attack_type] += 1
        
        # Calculate system health (100 - avg tenant risk)
        if self.metrics.tenant_risks:
            avg_tenant_risk = sum(self.metrics.tenant_risks.values()) / len(self.metrics.tenant_risks)
            self.metrics.system_health_score = max(0, 100 - avg_tenant_risk)
        
        self.metrics.last_updated = datetime.utcnow()
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get current metrics."""
        return {
            "event_count": self.metrics.event_count,
            "active_incidents": len(self.metrics.critical_events),
            "critical_events": len(self.metrics.critical_events),
            "system_health_score": self.metrics.system_health_score,
            "tenant_risks": dict(self.metrics.tenant_risks),
            "top_users_at_risk": sorted(
                self.metrics.user_risks.items(),
                key=lambda x: x[1],
                reverse=True
            )[:10],
            "attack_vectors": dict(self.metrics.attack_vectors),
            "timestamp": self.metrics.last_updated.isoformat(),
        }
    
    def get_tenant_risk(self, tenant_id: str) -> float:
        """Get risk score for tenant."""
        return self.metrics.tenant_risks.get(tenant_id, 0.0)
    
    def get_user_risk(self, user_id: str) -> float:
        """Get risk score for user."""
        return self.metrics.user_risks.get(user_id, 0.0)


def initialize_soc_aggregation() -> SOCAggregationEngine:
    """Initialize aggregation engine."""
    return SOCAggregationEngine()


def get_soc_aggregation() -> SOCAggregationEngine:
    """Get aggregation engine."""
    return SOCAggregationEngine()
