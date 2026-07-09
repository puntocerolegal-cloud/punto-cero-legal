"""
Distributed SOC Coordination Layer — Multi-SOC Global Command
═══════════════════════════════════════════════════════════════════════════════

Purpose:
  Coordinate multiple SOCs globally as single unified command center.
  
  Capabilities:
    • Global alert routing
    • Multi-tenant incident sync
    • Coordinated response
    • Federated SOC operations
"""

from dataclasses import dataclass
from typing import Dict, Any, Optional, List
from datetime import datetime
from enum import Enum
import logging

logger = logging.getLogger(__name__)


class SOCRegion(Enum):
    AMERICAS = "americas"
    EMEA = "emea"
    APAC = "apac"


@dataclass
class SOCNode:
    soc_id: str
    region: SOCRegion
    active: bool
    incident_queue_size: int
    avg_response_time_ms: int
    last_heartbeat: datetime
    assigned_tenants: List[str]


@dataclass
class GlobalAlert:
    alert_id: str
    severity: str
    source_tenant: str
    assigned_soc: str
    incident_type: str
    requires_escalation: bool
    created_at: datetime
    acknowledged_at: Optional[datetime]


class DistributedSOCCoordinationLayer:
    """
    Coordinate multiple SOCs globally.
    """

    def __init__(self):
        self.soc_nodes: Dict[str, SOCNode] = {}
        self.global_alert_queue: List[GlobalAlert] = []
        self.alert_counter = 0
        self.soc_counter = 0
        self.regional_incident_logs: Dict[str, List[Dict[str, Any]]] = {
            "americas": [],
            "emea": [],
            "apac": [],
        }

    async def register_soc_node(
        self,
        region: SOCRegion,
        assigned_tenants: List[str],
    ) -> str:
        """
        Register a regional SOC node.
        """
        soc_id = f"soc_{region.value}_{self.soc_counter}"
        self.soc_counter += 1

        node = SOCNode(
            soc_id=soc_id,
            region=region,
            active=True,
            incident_queue_size=0,
            avg_response_time_ms=0,
            last_heartbeat=datetime.utcnow(),
            assigned_tenants=assigned_tenants,
        )

        self.soc_nodes[soc_id] = node

        logger.info(
            f"[SOC_COORDINATION] SOC node registered: {soc_id} "
            f"(region: {region.value}, tenants: {len(assigned_tenants)})"
        )

        return soc_id

    async def route_global_alert(
        self,
        severity: str,
        source_tenant: str,
        incident_type: str,
        requires_escalation: bool = False,
    ) -> Optional[str]:
        """
        Route alert to appropriate SOC node.
        
        Routing logic:
          • Check tenant assignment
          • Balance queue load
          • Consider escalation
          • Assign to available SOC
        """
        target_soc = None

        for soc_id, soc_node in self.soc_nodes.items():
            if source_tenant in soc_node.assigned_tenants and soc_node.active:
                if target_soc is None or soc_node.incident_queue_size < self.soc_nodes[target_soc].incident_queue_size:
                    target_soc = soc_id

        if target_soc is None:
            logger.error(f"[SOC_COORDINATION] No SOC available for tenant: {source_tenant}")
            return None

        alert = GlobalAlert(
            alert_id=f"alert_{self.alert_counter}",
            severity=severity,
            source_tenant=source_tenant,
            assigned_soc=target_soc,
            incident_type=incident_type,
            requires_escalation=requires_escalation,
            created_at=datetime.utcnow(),
            acknowledged_at=None,
        )

        self.alert_counter += 1
        self.global_alert_queue.append(alert)

        self.soc_nodes[target_soc].incident_queue_size += 1

        logger.info(
            f"[SOC_COORDINATION] Alert routed: {alert.alert_id} → {target_soc} "
            f"(severity: {severity}, escalation: {requires_escalation})"
        )

        return alert.alert_id

    async def sync_regional_incidents(self) -> Dict[str, Any]:
        """
        Sync incidents across all regional SOCs.
        
        Enables coordinated response to global incidents.
        """
        sync_status = {
            "soc_count": len(self.soc_nodes),
            "synced_incidents": 0,
            "total_queue_size": 0,
            "escalated_incidents": 0,
        }

        for soc_id, soc_node in self.soc_nodes.items():
            sync_status["total_queue_size"] += soc_node.incident_queue_size

            for alert in self.global_alert_queue:
                if alert.assigned_soc == soc_id and alert.requires_escalation:
                    sync_status["escalated_incidents"] += 1

        logger.info(
            f"[SOC_COORDINATION] Regional incidents synced "
            f"(total queue: {sync_status['total_queue_size']}, "
            f"escalated: {sync_status['escalated_incidents']})"
        )

        return sync_status

    async def escalate_to_global_soc(self, alert_id: str) -> bool:
        """
        Escalate alert to global SOC for cross-region response.
        """
        alert = next((a for a in self.global_alert_queue if a.alert_id == alert_id), None)
        if not alert:
            return False

        alert.requires_escalation = True
        alert.acknowledged_at = datetime.utcnow()

        logger.critical(
            f"[SOC_COORDINATION] Alert escalated to global SOC: {alert_id} "
            f"(from {alert.assigned_soc})"
        )

        return True

    async def broadcast_global_mitigation(
        self,
        mitigation_strategy: Dict[str, Any],
        affected_regions: List[SOCRegion],
    ) -> Dict[str, int]:
        """
        Broadcast mitigation strategy to SOCs in affected regions.
        """
        deployment_status = {region.value: 0 for region in affected_regions}

        for soc_id, soc_node in self.soc_nodes.items():
            if soc_node.region in affected_regions:
                deployment_status[soc_node.region.value] += 1

        logger.critical(
            f"[SOC_COORDINATION] Global mitigation broadcast to {len(affected_regions)} regions "
            f"({sum(deployment_status.values())} SOCs)"
        )

        return deployment_status

    async def get_soc_federation_health(self) -> Dict[str, Any]:
        """
        Check health of entire SOC federation.
        """
        if not self.soc_nodes:
            return {"status": "offline", "soc_count": 0}

        active_socs = sum(1 for s in self.soc_nodes.values() if s.active)
        avg_queue = sum(s.incident_queue_size for s in self.soc_nodes.values()) / max(1, len(self.soc_nodes))
        avg_response_time = sum(s.avg_response_time_ms for s in self.soc_nodes.values()) / max(1, len(self.soc_nodes))

        return {
            "status": "healthy" if active_socs == len(self.soc_nodes) else "degraded",
            "soc_count": len(self.soc_nodes),
            "active_socs": active_socs,
            "total_incident_queue": sum(s.incident_queue_size for s in self.soc_nodes.values()),
            "avg_queue_per_soc": avg_queue,
            "avg_response_time_ms": avg_response_time,
            "pending_escalations": sum(1 for a in self.global_alert_queue if a.requires_escalation),
        }

    def get_federation_status(self) -> Dict[str, Any]:
        """Get SOC federation operational status"""
        return {
            "soc_nodes": len(self.soc_nodes),
            "regions_covered": len(set(s.region for s in self.soc_nodes.values())),
            "total_alerts_processed": self.alert_counter,
            "pending_alerts": len([a for a in self.global_alert_queue if a.acknowledged_at is None]),
            "alert_routing_efficiency": self._compute_routing_efficiency(),
        }

    def _compute_routing_efficiency(self) -> float:
        """Compute alert routing efficiency"""
        if not self.global_alert_queue:
            return 1.0

        routed_efficiently = sum(
            1 for a in self.global_alert_queue
            if a.assigned_soc and a.assigned_soc in self.soc_nodes
        )

        return routed_efficiently / len(self.global_alert_queue)


_global_soc_coordination = DistributedSOCCoordinationLayer()


def get_distributed_soc_coordination_layer() -> DistributedSOCCoordinationLayer:
    return _global_soc_coordination
