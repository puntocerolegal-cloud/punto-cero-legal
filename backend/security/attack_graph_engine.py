"""
Attack Graph Engine — Multi-Step Attack Detection
═══════════════════════════════════════════════════════════════════

Purpose:
  Detect multi-step attacks by building attack graphs from events.
  
  Converts isolated events into attack patterns:
  - IDOR → enumeration → escalation chains
  - Privilege escalation attempts
  - Cross-resource exploitation
  
  Outputs:
  - AttackGraph with nodes (events) and edges (causal relationships)
  - Attack classification
  - Attack progression tracking
"""

from typing import Dict, List, Any, Optional, Set, Tuple
from datetime import datetime, timedelta
from enum import Enum
import logging

logger = logging.getLogger(__name__)


# ═══════════════════════════════════════════════════════════════════
# ATTACK CLASSIFICATION
# ═══════════════════════════════════════════════════════════════════

class AttackType(Enum):
    """Detected attack types."""
    IDOR_ENUMERATION = "idor_enumeration"
    PRIVILEGE_ESCALATION = "privilege_escalation"
    TENANT_BOUNDARY_PROBING = "tenant_boundary_probing"
    BRUTE_FORCE = "brute_force"
    PRIVILEGE_ABUSE = "privilege_abuse"
    DISTRIBUTED_ATTACK = "distributed_attack"
    DATA_EXFILTRATION = "data_exfiltration"
    UNKNOWN = "unknown"


class EventNode:
    """Single event node in attack graph."""
    
    def __init__(self, event_id: str, event: Dict[str, Any]):
        self.event_id = event_id
        self.timestamp = event.get('timestamp', datetime.utcnow())
        self.user_id = event.get('user_id')
        self.action = event.get('action')
        self.resource_type = event.get('resource_type')
        self.resource_id = event.get('resource_id')
        self.success = event.get('success')
        self.risk_score = event.get('risk_score', 0.0)
        self.incoming_edges: Set[str] = set()
        self.outgoing_edges: Set[str] = set()
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "event_id": self.event_id,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "user_id": self.user_id,
            "action": self.action,
            "resource_type": self.resource_type,
            "resource_id": self.resource_id,
            "success": self.success,
            "risk_score": self.risk_score,
        }


# ═══════════════════════════════════════════════════════════════════
# ATTACK GRAPH
# ═══════════════════════════════════════════════════════════════════

class AttackGraph:
    """
    Graph representation of attack sequence.
    
    Nodes = events
    Edges = causal relationships
    """
    
    def __init__(self, attack_id: str, user_id: str):
        self.attack_id = attack_id
        self.user_id = user_id
        self.started_at = datetime.utcnow()
        self.last_updated = datetime.utcnow()
        
        self.nodes: Dict[str, EventNode] = {}
        self.edges: List[Tuple[str, str]] = []
        
        self.attack_type = AttackType.UNKNOWN
        self.severity = 0.0  # 0-1
        self.is_active = True
        self.event_count = 0
    
    def add_event(self, event_node: EventNode) -> None:
        """Add event to graph."""
        self.nodes[event_node.event_id] = event_node
        self.last_updated = datetime.utcnow()
        self.event_count += 1
    
    def add_edge(self, from_event: str, to_event: str) -> None:
        """Add causal relationship."""
        if from_event in self.nodes and to_event in self.nodes:
            self.edges.append((from_event, to_event))
            self.nodes[from_event].outgoing_edges.add(to_event)
            self.nodes[to_event].incoming_edges.add(from_event)
    
    def get_attack_chain(self) -> List[EventNode]:
        """Get chronological attack chain."""
        # Topological sort of events
        sorted_nodes = sorted(
            self.nodes.values(),
            key=lambda n: n.timestamp
        )
        return sorted_nodes
    
    def get_severity(self) -> float:
        """Calculate graph severity (0-1)."""
        if not self.nodes:
            return 0.0
        
        # Factors:
        # - Number of events
        # - Highest risk score
        # - Graph depth (chained attacks)
        
        avg_risk = sum(n.risk_score for n in self.nodes.values()) / len(self.nodes)
        max_risk = max(n.risk_score for n in self.nodes.values())
        graph_depth = max(len(n.incoming_edges) for n in self.nodes.values()) if self.nodes else 0
        
        # Weighted severity
        severity = (
            avg_risk * 0.4 +
            max_risk * 0.4 +
            min(graph_depth / 5, 1.0) * 0.2
        )
        
        return min(severity, 1.0)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "attack_id": self.attack_id,
            "user_id": self.user_id,
            "started_at": self.started_at.isoformat(),
            "attack_type": self.attack_type.value,
            "severity": self.get_severity(),
            "event_count": self.event_count,
            "is_active": self.is_active,
            "nodes": [n.to_dict() for n in self.nodes.values()],
            "chain_length": len(self.edges),
        }


# ═══════════════════════════════════════════════════════════════════
# ATTACK PATTERN DETECTOR
# ═══════════════════════════════════════════════════════════════════

class AttackGraphEngine:
    """
    Detect and build attack graphs from security events.
    """
    
    def __init__(self):
        self.active_graphs: Dict[str, AttackGraph] = {}
        self.event_counter = 0
        logger.info("[ATTACK_GRAPH] Initialized")
    
    def ingest_event(self, user_id: str, event: Dict[str, Any]) -> Optional[AttackGraph]:
        """
        Ingest event and build attack graph.
        
        Returns:
            AttackGraph if attack detected, None otherwise
        """
        self.event_counter += 1
        event_id = f"event_{self.event_counter}"
        
        # Check if this event belongs to existing attack
        matching_graph = None
        for graph in self.active_graphs.values():
            if self._is_event_in_attack(user_id, event, graph):
                matching_graph = graph
                break
        
        # Create new graph if needed
        if not matching_graph and self._is_potentially_malicious(event):
            attack_id = f"attack_{self.event_counter}"
            matching_graph = AttackGraph(attack_id, user_id)
            self.active_graphs[attack_id] = matching_graph
        
        # Add to graph
        if matching_graph:
            event_node = EventNode(event_id, event)
            matching_graph.add_event(event_node)
            
            # Detect edges (causal relationships)
            self._detect_edges(matching_graph, event_node)
            
            # Classify attack
            self._classify_attack(matching_graph)
            
            logger.info(
                f"[ATTACK_GRAPH] Event ingested: user={user_id} "
                f"graph={matching_graph.attack_id} "
                f"severity={matching_graph.get_severity():.2f}"
            )
            
            return matching_graph
        
        return None
    
    def _is_event_in_attack(
        self,
        user_id: str,
        event: Dict[str, Any],
        graph: AttackGraph
    ) -> bool:
        """Check if event belongs to existing attack graph."""
        if graph.user_id != user_id:
            return False
        
        # Same user within time window
        time_diff = datetime.utcnow() - graph.last_updated
        if time_diff > timedelta(minutes=10):
            # Attack probably over
            graph.is_active = False
            return False
        
        return True
    
    def _is_potentially_malicious(self, event: Dict[str, Any]) -> bool:
        """Check if event could be part of attack."""
        risk_score = event.get('risk_score', 0.0)
        success = event.get('success', True)
        
        # Failed access attempts might indicate attack
        if not success and risk_score > 30:
            return True
        
        # High-risk events always potentially malicious
        if risk_score > 50:
            return True
        
        return False
    
    def _detect_edges(self, graph: AttackGraph, new_node: EventNode) -> None:
        """Detect causal relationships."""
        # Simple heuristic: same resource access indicates relationship
        for existing_node in graph.nodes.values():
            if existing_node.event_id != new_node.event_id:
                if (existing_node.resource_type == new_node.resource_type or
                    existing_node.resource_id == new_node.resource_id):
                    
                    # Temporal ordering
                    if existing_node.timestamp < new_node.timestamp:
                        graph.add_edge(existing_node.event_id, new_node.event_id)
    
    def _classify_attack(self, graph: AttackGraph) -> None:
        """Classify attack type based on pattern."""
        chain = graph.get_attack_chain()
        
        if not chain:
            return
        
        # Pattern 1: Multiple failed accesses to different resources
        failed_different = [
            n for n in chain
            if not n.success
        ]
        if len(failed_different) > 3:
            graph.attack_type = AttackType.IDOR_ENUMERATION
            return
        
        # Pattern 2: Failed accesses then successful (escalation)
        if len(failed_different) > 0:
            successful = [n for n in chain if n.success]
            if successful:
                graph.attack_type = AttackType.PRIVILEGE_ESCALATION
                return
        
        # Pattern 3: High-risk resource access
        high_risk = [n for n in chain if n.risk_score > 70]
        if high_risk:
            if any(n.action == "delete" for n in high_risk):
                graph.attack_type = AttackType.PRIVILEGE_ABUSE
                return
        
        # Default
        graph.attack_type = AttackType.UNKNOWN
    
    def get_active_attacks(self) -> List[AttackGraph]:
        """Get all active attack graphs."""
        active = [g for g in self.active_graphs.values() if g.is_active]
        return active
    
    def get_high_severity_attacks(self, threshold: float = 0.7) -> List[AttackGraph]:
        """Get attacks above severity threshold."""
        attacks = self.get_active_attacks()
        return [a for a in attacks if a.get_severity() >= threshold]
    
    def get_attack_graph(self, attack_id: str) -> Optional[AttackGraph]:
        """Get specific attack graph."""
        return self.active_graphs.get(attack_id)
    
    def get_user_attacks(self, user_id: str) -> List[AttackGraph]:
        """Get all attacks by a user."""
        return [g for g in self.active_graphs.values() if g.user_id == user_id]


# ═══════════════════════════════════════════════════════════════════
# GLOBAL ENGINE
# ═══════════════════════════════════════════════════════════════════

_global_engine: Optional[AttackGraphEngine] = None


def initialize_attack_graph_engine() -> AttackGraphEngine:
    """Initialize global attack graph engine."""
    global _global_engine
    _global_engine = AttackGraphEngine()
    return _global_engine


def get_attack_graph_engine() -> AttackGraphEngine:
    """Get global attack graph engine."""
    global _global_engine
    if _global_engine is None:
        _global_engine = AttackGraphEngine()
    return _global_engine
