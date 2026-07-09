"""
SOC Alert Engine — Intelligent Alert Management
═══════════════════════════════════════════════════════════════════

Purpose:
  Generate and manage security alerts with intelligent escalation.
  
  Alert Levels:
  🟢 LOW: Monitor
  🟡 MEDIUM: Investigate
  🟠 HIGH: Escalate
  🔴 CRITICAL: Activate fail-safe
"""

from typing import Dict, List, Any, Callable, Optional
from datetime import datetime
from enum import Enum
import logging

logger = logging.getLogger(__name__)


class AlertLevel(Enum):
    """Alert severity levels."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class SecurityAlert:
    """Single security alert."""
    
    def __init__(
        self,
        alert_id: str,
        level: AlertLevel,
        title: str,
        description: str,
        event_data: Dict[str, Any],
    ):
        self.alert_id = alert_id
        self.level = level
        self.title = title
        self.description = description
        self.event_data = event_data
        
        self.created_at = datetime.utcnow()
        self.acknowledged_at: Optional[datetime] = None
        self.is_acknowledged = False
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "alert_id": self.alert_id,
            "level": self.level.value,
            "title": self.title,
            "description": self.description,
            "created_at": self.created_at.isoformat(),
            "is_acknowledged": self.is_acknowledged,
        }


class SOCAlertEngine:
    """Manage security alerts."""
    
    def __init__(self):
        self.alerts: Dict[str, SecurityAlert] = {}
        self.alert_counter = 0
        self.callbacks: Dict[AlertLevel, List[Callable]] = {
            AlertLevel.LOW: [],
            AlertLevel.MEDIUM: [],
            AlertLevel.HIGH: [],
            AlertLevel.CRITICAL: [],
        }
        logger.info("[SOC_ALERT] Initialized")
    
    def create_alert(
        self,
        level: str,
        title: str,
        description: str,
        event_data: Dict[str, Any],
    ) -> SecurityAlert:
        """Create new alert."""
        self.alert_counter += 1
        alert_id = f"alert_{self.alert_counter}"
        alert_level = AlertLevel(level)
        
        alert = SecurityAlert(
            alert_id=alert_id,
            level=alert_level,
            title=title,
            description=description,
            event_data=event_data,
        )
        
        self.alerts[alert_id] = alert
        
        # Trigger callbacks
        self._trigger_callbacks(alert)
        
        logger.warning(f"[SOC_ALERT] {alert_level.value.upper()}: {title}")
        
        return alert
    
    def acknowledge_alert(self, alert_id: str) -> None:
        """Mark alert as acknowledged."""
        if alert_id in self.alerts:
            alert = self.alerts[alert_id]
            alert.is_acknowledged = True
            alert.acknowledged_at = datetime.utcnow()
            logger.info(f"[SOC_ALERT] Acknowledged: {alert_id}")
    
    def subscribe(self, level: str, callback: Callable) -> str:
        """Subscribe to alerts."""
        alert_level = AlertLevel(level)
        self.callbacks[alert_level].append(callback)
        
        sub_id = f"alert_sub_{id(callback)}"
        logger.info(f"[SOC_ALERT] Subscriber registered: {sub_id}")
        
        return sub_id
    
    def _trigger_callbacks(self, alert: SecurityAlert) -> None:
        """Trigger callbacks for alert level."""
        import asyncio
        
        for callback in self.callbacks[alert.level]:
            try:
                if asyncio.iscoroutinefunction(callback):
                    asyncio.create_task(callback(alert))
                else:
                    callback(alert)
            except Exception as e:
                logger.error(f"[SOC_ALERT] Callback error: {e}")
    
    def get_unacknowledged_alerts(self) -> List[Dict[str, Any]]:
        """Get all unacknowledged alerts."""
        alerts = [
            a for a in self.alerts.values()
            if not a.is_acknowledged
        ]
        return [a.to_dict() for a in alerts]
    
    def get_critical_alerts(self) -> List[Dict[str, Any]]:
        """Get all critical alerts."""
        alerts = [
            a for a in self.alerts.values()
            if a.level == AlertLevel.CRITICAL
        ]
        return [a.to_dict() for a in alerts]
    
    def get_alert_summary(self) -> Dict[str, Any]:
        """Get alert summary."""
        summary = {
            "total": len(self.alerts),
            "unacknowledged": len(self.get_unacknowledged_alerts()),
            "critical": len(self.get_critical_alerts()),
            "by_level": {
                "low": len([a for a in self.alerts.values() if a.level == AlertLevel.LOW]),
                "medium": len([a for a in self.alerts.values() if a.level == AlertLevel.MEDIUM]),
                "high": len([a for a in self.alerts.values() if a.level == AlertLevel.HIGH]),
                "critical": len([a for a in self.alerts.values() if a.level == AlertLevel.CRITICAL]),
            },
        }
        return summary


def initialize_alert_engine() -> SOCAlertEngine:
    """Initialize alert engine."""
    return SOCAlertEngine()


def get_alert_engine() -> SOCAlertEngine:
    """Get alert engine."""
    return SOCAlertEngine()
