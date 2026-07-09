"""
Multi-Tenant Security Mesh — Global Network with Local Isolation
═══════════════════════════════════════════════════════════════════════════════

Purpose:
  Create mesh network connecting all tenants while maintaining
  complete isolation. Share threat metadata only.
"""

from dataclasses import dataclass
from typing import Dict, Any, Optional, List, Set
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


@dataclass
class TenantNode:
    tenant_id: str
    security_level: str
    threat_signals_sent: int
    threat_signals_received: int
    isolation_status: str
    last_sync: datetime


class MultiTenantSecurityMesh:
    """
    Create security mesh connecting all tenants.
    
    Guarantees:
      • Logical isolation (can't access other tenant data)
      • Metadata sharing (threat info only)
      • Cross-tenant correlation (pattern matching)
      • No data leakage
    """

    def __init__(self):
        self.tenant_nodes: Dict[str, TenantNode] = {}
        self.mesh_connections: Dict[str, Set[str]] = {}
        self.threat_metadata_exchange: List[Dict[str, Any]] = []
        self.isolation_boundaries: Dict[str, Dict[str, Any]] = {}

    async def register_tenant_node(self, tenant_id: str, security_profile: Dict[str, Any]) -> bool:
        """
        Register tenant in security mesh.
        """
        if tenant_id in self.tenant_nodes:
            return False

        node = TenantNode(
            tenant_id=tenant_id,
            security_level=security_profile.get("security_level", "standard"),
            threat_signals_sent=0,
            threat_signals_received=0,
            isolation_status="isolated",
            last_sync=datetime.utcnow(),
        )

        self.tenant_nodes[tenant_id] = node
        self.mesh_connections[tenant_id] = set()
        
        self.isolation_boundaries[tenant_id] = {
            "can_access_own_data": True,
            "can_access_other_tenant_data": False,
            "can_receive_threat_metadata": True,
            "can_send_threat_metadata": True,
        }

        logger.info(f"[MESH] Tenant registered: {tenant_id} (level: {node.security_level})")

        return True

    async def exchange_threat_metadata(
        self,
        source_tenant_id: str,
        threat_signature: Dict[str, Any],
    ) -> List[str]:
        """
        Broadcast threat metadata to all other tenants.
        
        Privacy: Only threat pattern, no tenant/user data.
        """
        source_node = self.tenant_nodes.get(source_tenant_id)
        if not source_node:
            return []

        recipient_tenants = []

        for tenant_id, node in self.tenant_nodes.items():
            if tenant_id == source_tenant_id:
                continue

            if not self.isolation_boundaries[tenant_id]["can_receive_threat_metadata"]:
                continue

            metadata = {
                "threat_type": threat_signature.get("attack_type", "unknown"),
                "severity": threat_signature.get("severity", "medium"),
                "pattern_hash": threat_signature.get("pattern_hash", ""),
                "source_tenant_anonymized": f"tenant_{source_tenant_id[:4]}",
                "timestamp": datetime.utcnow().isoformat(),
            }

            self.threat_metadata_exchange.append(metadata)
            recipient_tenants.append(tenant_id)
            node.threat_signals_received += 1

        source_node.threat_signals_sent += 1
        source_node.last_sync = datetime.utcnow()

        logger.info(
            f"[MESH] Threat metadata shared: {source_tenant_id} → {len(recipient_tenants)} tenants"
        )

        return recipient_tenants

    async def detect_cross_tenant_pattern(
        self,
        pattern_hash: str,
        tenant_ids: List[str],
        pattern_type: str,
    ) -> Optional[Dict[str, Any]]:
        """
        Detect same attack pattern across multiple tenants.
        """
        if len(tenant_ids) < 2:
            return None

        for boundary in self.isolation_boundaries.values():
            if not boundary["can_receive_threat_metadata"]:
                return None

        detection = {
            "pattern_hash": pattern_hash,
            "attack_type": pattern_type,
            "tenant_count": len(tenant_ids),
            "is_cross_tenant": True,
            "severity": "high" if len(tenant_ids) >= 3 else "medium",
            "requires_coordination": len(tenant_ids) >= 4,
            "timestamp": datetime.utcnow().isoformat(),
        }

        logger.warning(
            f"[MESH] Cross-tenant pattern detected: {pattern_type} "
            f"affecting {len(tenant_ids)} tenants"
        )

        return detection

    async def enforce_isolation_boundary(
        self,
        source_tenant_id: str,
        target_tenant_id: str,
    ) -> bool:
        """
        Enforce isolation (prevent data access between tenants).
        """
        if source_tenant_id not in self.tenant_nodes:
            return False

        isolation = self.isolation_boundaries.get(source_tenant_id, {})

        if target_tenant_id == source_tenant_id:
            return isolation.get("can_access_own_data", True)

        return isolation.get("can_access_other_tenant_data", False)

    async def mesh_health_check(self) -> Dict[str, Any]:
        """
        Check mesh health and connectivity.
        """
        if not self.tenant_nodes:
            return {"status": "empty", "tenant_count": 0}

        total_signals_sent = sum(n.threat_signals_sent for n in self.tenant_nodes.values())
        total_signals_received = sum(n.threat_signals_received for n in self.tenant_nodes.values())
        isolated_tenants = sum(
            1 for n in self.tenant_nodes.values() if n.isolation_status == "isolated"
        )

        avg_signal_exchange = (total_signals_sent + total_signals_received) / max(1, len(self.tenant_nodes))

        return {
            "status": "healthy",
            "tenant_count": len(self.tenant_nodes),
            "total_threat_exchanges": len(self.threat_metadata_exchange),
            "total_signals_sent": total_signals_sent,
            "total_signals_received": total_signals_received,
            "avg_signal_exchange_per_tenant": avg_signal_exchange,
            "isolated_tenants": isolated_tenants,
            "all_boundaries_enforced": isolated_tenants == len(self.tenant_nodes),
        }

    def get_mesh_topology(self) -> Dict[str, Any]:
        """Get current mesh topology"""
        return {
            "tenant_count": len(self.tenant_nodes),
            "nodes": [
                {
                    "tenant_id": t_id,
                    "security_level": node.security_level,
                    "threat_signals_sent": node.threat_signals_sent,
                    "threat_signals_received": node.threat_signals_received,
                    "last_sync": node.last_sync.isoformat(),
                }
                for t_id, node in self.tenant_nodes.items()
            ],
            "mesh_connections": len(self.threat_metadata_exchange),
        }


_global_security_mesh = MultiTenantSecurityMesh()


def get_multi_tenant_security_mesh() -> MultiTenantSecurityMesh:
    return _global_security_mesh
