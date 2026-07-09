"""
SOC Incident Manager — Security Incident Lifecycle Management
═══════════════════════════════════════════════════════════════════

Purpose:
  Manage security incidents from detection to resolution.
  
  Incident States:
  - OPEN: Detected
  - INVESTIGATING: In progress
  - MITIGATED: Attack stopped
  - RESOLVED: Closed
"""

from typing import Dict, List, Any, Optional
from datetime import datetime
from enum import Enum
import logging

logger = logging.getLogger(__name__)


class IncidentState(Enum):
    """Incident lifecycle states."""
    OPEN = "open"
    INVESTIGATING = "investigating"
    MITIGATED = "mitigated"
    RESOLVED = "resolved"


class SecurityIncident:
    """Single security incident."""
    
    def __init__(
        self,
        incident_id: str,
        incident_type: str,
        severity: str,
        user_id: str,
        description: str,
    ):
        self.incident_id = incident_id
        self.incident_type = incident_type
        self.severity = severity
        self.user_id = user_id
        self.description = description
        
        self.state = IncidentState.OPEN
        self.created_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()
        self.resolved_at: Optional[datetime] = None
        
        self.events: List[str] = []
        self.notes: List[str] = []
        self.assigned_to: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "incident_id": self.incident_id,
            "type": self.incident_type,
            "severity": self.severity,
            "user_id": self.user_id,
            "state": self.state.value,
            "created_at": self.created_at.isoformat(),
            "resolved_at": self.resolved_at.isoformat() if self.resolved_at else None,
            "duration_seconds": (
                (self.resolved_at - self.created_at).total_seconds()
                if self.resolved_at else
                (datetime.utcnow() - self.created_at).total_seconds()
            ),
            "event_count": len(self.events),
        }


class SOCIncidentManager:
    """Manage security incidents."""
    
    def __init__(self):
        self.incidents: Dict[str, SecurityIncident] = {}
        self.incident_counter = 0
        logger.info("[SOC_INCIDENT] Initialized")
    
    def create_incident(
        self,
        incident_type: str,
        severity: str,
        user_id: str,
        description: str,
    ) -> SecurityIncident:
        """Create new incident."""
        self.incident_counter += 1
        incident_id = f"inc_{self.incident_counter}"
        
        incident = SecurityIncident(
            incident_id=incident_id,
            incident_type=incident_type,
            severity=severity,
            user_id=user_id,
            description=description,
        )
        
        self.incidents[incident_id] = incident
        
        logger.info(
            f"[SOC_INCIDENT] Created: {incident_id} "
            f"type={incident_type} severity={severity}"
        )
        
        return incident
    
    def add_event(self, incident_id: str, event_id: str) -> None:
        """Add event to incident."""
        if incident_id in self.incidents:
            self.incidents[incident_id].events.append(event_id)
            self.incidents[incident_id].updated_at = datetime.utcnow()
    
    def add_note(self, incident_id: str, note: str) -> None:
        """Add investigation note."""
        if incident_id in self.incidents:
            self.incidents[incident_id].notes.append(note)
            self.incidents[incident_id].updated_at = datetime.utcnow()
    
    def update_state(self, incident_id: str, new_state: str) -> None:
        """Update incident state."""
        if incident_id in self.incidents:
            self.incidents[incident_id].state = IncidentState(new_state)
            self.incidents[incident_id].updated_at = datetime.utcnow()
            
            if new_state == "resolved":
                self.incidents[incident_id].resolved_at = datetime.utcnow()
            
            logger.info(f"[SOC_INCIDENT] State update: {incident_id} → {new_state}")
    
    def assign_incident(self, incident_id: str, assigned_to: str) -> None:
        """Assign incident to analyst."""
        if incident_id in self.incidents:
            self.incidents[incident_id].assigned_to = assigned_to
    
    def get_active_incidents(self) -> List[Dict[str, Any]]:
        """Get all active incidents."""
        active = [
            i for i in self.incidents.values()
            if i.state != IncidentState.RESOLVED
        ]
        return [i.to_dict() for i in active]
    
    def get_critical_incidents(self) -> List[Dict[str, Any]]:
        """Get all critical incidents."""
        critical = [
            i for i in self.incidents.values()
            if i.severity == "critical" and i.state != IncidentState.RESOLVED
        ]
        return [i.to_dict() for i in critical]
    
    def get_incident(self, incident_id: str) -> Optional[Dict[str, Any]]:
        """Get specific incident."""
        incident = self.incidents.get(incident_id)
        return incident.to_dict() if incident else None


def initialize_incident_manager() -> SOCIncidentManager:
    """Initialize incident manager."""
    return SOCIncidentManager()


def get_incident_manager() -> SOCIncidentManager:
    """Get incident manager."""
    return SOCIncidentManager()
