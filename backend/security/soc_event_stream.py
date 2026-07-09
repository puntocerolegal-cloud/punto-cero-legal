"""
SOC Event Stream — Real-Time Security Event Pipeline
═══════════════════════════════════════════════════════════════════

Purpose:
  Centralize all security events in real-time for SOC visibility.
  
  Ingests from:
  - GSCL authorize()
  - Anomaly engine
  - Attack graph engine
  - Fail-safe mode
  - Audit pipeline
  
  Broadcasts to:
  - SOC dashboard
  - Aggregation engines
  - Incident managers
"""

from typing import Dict, List, Any, Callable, Optional
from datetime import datetime
from collections import deque
import asyncio
import logging

logger = logging.getLogger(__name__)


class SecurityEvent:
    """Single security event."""
    
    def __init__(
        self,
        event_id: str,
        event_type: str,
        user_id: str,
        severity: str,
        data: Dict[str, Any],
    ):
        self.event_id = event_id
        self.event_type = event_type  # "authorization", "anomaly", "attack", "incident"
        self.user_id = user_id
        self.severity = severity  # "low", "medium", "high", "critical"
        self.data = data
        self.timestamp = datetime.utcnow()
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "event_id": self.event_id,
            "event_type": self.event_type,
            "user_id": self.user_id,
            "severity": self.severity,
            "timestamp": self.timestamp.isoformat(),
            "data": self.data,
        }


class SOCEventStream:
    """
    Central event stream for SOC monitoring.
    """
    
    def __init__(self, max_buffer: int = 5000):
        self.event_buffer: deque = deque(maxlen=max_buffer)
        self.subscribers: Dict[str, List[Callable]] = {
            "all": [],
            "high": [],
            "critical": [],
        }
        self.event_counter = 0
        logger.info("[SOC_STREAM] Initialized")
    
    def ingest_event(
        self,
        event_type: str,
        user_id: str,
        severity: str,
        data: Dict[str, Any],
    ) -> SecurityEvent:
        """
        Ingest security event into stream.
        
        Args:
            event_type: "authorization", "anomaly", "attack", etc.
            user_id: User ID
            severity: "low", "medium", "high", "critical"
            data: Event-specific data
        
        Returns:
            SecurityEvent object
        """
        self.event_counter += 1
        event_id = f"evt_{self.event_counter}"
        
        event = SecurityEvent(
            event_id=event_id,
            event_type=event_type,
            user_id=user_id,
            severity=severity,
            data=data,
        )
        
        self.event_buffer.append(event)
        
        # Notify subscribers
        self._notify_subscribers(event)
        
        logger.info(
            f"[SOC_STREAM] Event: {event_type} user={user_id} "
            f"severity={severity}"
        )
        
        return event
    
    def subscribe(
        self,
        severity: str,
        callback: Callable,
    ) -> str:
        """
        Subscribe to events.
        
        Args:
            severity: "all", "high", "critical"
            callback: Async function(event)
        
        Returns:
            Subscription ID
        """
        if severity not in self.subscribers:
            self.subscribers[severity] = []
        
        self.subscribers[severity].append(callback)
        
        sub_id = f"sub_{id(callback)}"
        logger.info(f"[SOC_STREAM] Subscriber registered: {sub_id}")
        
        return sub_id
    
    def log_autonomous_action(
        self,
        action_type: str,
        target: str,
        decision_type: str,
        risk_score: float,
        status: str,
    ) -> SecurityEvent:
        """Log S2.8 autonomous action."""
        return self.ingest_event(
            event_type="autonomous_action",
            user_id="system",
            severity="high" if risk_score > 75 else "medium",
            data={
                "action_type": action_type,
                "target": target,
                "decision_type": decision_type,
                "risk_score": risk_score,
                "status": status,
            }
        )

    def _notify_subscribers(self, event: SecurityEvent) -> None:
        """Notify all matching subscribers."""
        # Notify "all" subscribers
        for callback in self.subscribers.get("all", []):
            try:
                if asyncio.iscoroutinefunction(callback):
                    asyncio.create_task(callback(event))
                else:
                    callback(event)
            except Exception as e:
                logger.error(f"[SOC_STREAM] Subscriber error: {e}")

        # Notify severity-specific subscribers
        for callback in self.subscribers.get(event.severity, []):
            try:
                if asyncio.iscoroutinefunction(callback):
                    asyncio.create_task(callback(event))
                else:
                    callback(event)
            except Exception as e:
                logger.error(f"[SOC_STREAM] Subscriber error: {e}")
    
    def get_recent_events(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Get recent events."""
        events = list(self.event_buffer)[-limit:]
        return [e.to_dict() for e in events]
    
    def get_events_by_user(self, user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Get events for specific user."""
        events = [
            e for e in self.event_buffer
            if e.user_id == user_id
        ][-limit:]
        return [e.to_dict() for e in events]
    
    def get_critical_events(self) -> List[Dict[str, Any]]:
        """Get all critical events."""
        events = [
            e for e in self.event_buffer
            if e.severity == "critical"
        ]
        return [e.to_dict() for e in events]


# ═══════════════════════════════════════════════════════════════════
# GLOBAL STREAM
# ═══════════════════════════════════════════════════════════════════

_global_stream: Optional[SOCEventStream] = None


def initialize_soc_stream() -> SOCEventStream:
    """Initialize global SOC event stream."""
    global _global_stream
    _global_stream = SOCEventStream()
    return _global_stream


def get_soc_stream() -> SOCEventStream:
    """Get global SOC event stream."""
    global _global_stream
    if _global_stream is None:
        _global_stream = SOCEventStream()
    return _global_stream
