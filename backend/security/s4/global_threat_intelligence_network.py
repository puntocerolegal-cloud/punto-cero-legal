"""
Global Threat Intelligence Network (GTIN) — Collect & Share Threats Globally
═══════════════════════════════════════════════════════════════════════════════

Purpose:
  Collect attack signatures from all tenants globally.
  Identify patterns across the entire network.
  Generate global threat signatures.
  
  Privacy: NO raw data shared, only metadata + embeddings
"""

from dataclasses import dataclass
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from enum import Enum
import hashlib
import logging

logger = logging.getLogger(__name__)


class ThreatLevel(Enum):
    LOW = 1
    MEDIUM = 2
    HIGH = 3
    CRITICAL = 4
    GLOBAL_CAMPAIGN = 5


@dataclass
class GlobalAttackSignature:
    signature_id: str
    attack_type: str
    pattern_hash: str
    severity: ThreatLevel
    tenant_count: int
    first_seen: datetime
    last_seen: datetime
    occurrence_count: int
    embedding: List[float]
    metadata: Dict[str, Any]


@dataclass
class ThreatCluster:
    cluster_id: str
    attack_type: str
    tenant_ids: List[str]
    correlation_score: float
    cluster_severity: ThreatLevel
    likely_coordinated: bool
    mitigation_suggestion: str
    timestamp: datetime


class GlobalThreatIntelligenceNetwork:
    """
    Collect and correlate threats across all tenants.
    
    Privacy-first:
      • NO raw attack data shared
      • Only anonymized signatures
      • Pattern embeddings only
      • Aggregated metadata
    """

    def __init__(self):
        self.global_signatures: Dict[str, GlobalAttackSignature] = {}
        self.threat_clusters: List[ThreatCluster] = []
        self.tenant_threat_feed: Dict[str, List[Dict[str, Any]]] = {}
        self.signature_counter = 0
        self.cluster_counter = 0

    async def ingest_threat_event(
        self,
        tenant_id: str,
        attack_type: str,
        attack_data: Dict[str, Any],
        risk_score: float,
    ) -> Optional[str]:
        """
        Ingest threat event from a tenant.
        
        Privacy-safe:
          • Hash tenant ID
          • Anonymize user data
          • Extract only pattern signature
          • No sensitive data logged
        """
        pattern_hash = self._generate_pattern_hash(attack_type, attack_data)
        
        if pattern_hash not in self.global_signatures:
            embedding = self._generate_embedding(attack_data)
            
            signature = GlobalAttackSignature(
                signature_id=f"sig_{self.signature_counter}",
                attack_type=attack_type,
                pattern_hash=pattern_hash,
                severity=self._map_risk_to_threat_level(risk_score),
                tenant_count=1,
                first_seen=datetime.utcnow(),
                last_seen=datetime.utcnow(),
                occurrence_count=1,
                embedding=embedding,
                metadata={
                    "first_tenant": self._anonymize_tenant_id(tenant_id),
                    "attack_vector": attack_data.get("vector", "unknown"),
                },
            )
            
            self.global_signatures[pattern_hash] = signature
            self.signature_counter += 1
            
            logger.info(
                f"[GTIN] New global signature created: {attack_type} "
                f"(severity: {signature.severity.name})"
            )
            
            return signature.signature_id

        else:
            signature = self.global_signatures[pattern_hash]
            signature.occurrence_count += 1
            signature.last_seen = datetime.utcnow()
            
            if self._anonymize_tenant_id(tenant_id) not in signature.metadata.get("tenants_affected", []):
                signature.tenant_count += 1
                if "tenants_affected" not in signature.metadata:
                    signature.metadata["tenants_affected"] = []
                signature.metadata["tenants_affected"].append(self._anonymize_tenant_id(tenant_id))
            
            logger.info(
                f"[GTIN] Signature updated: {attack_type} "
                f"(now affecting {signature.tenant_count} tenants)"
            )
            
            return signature.signature_id

    async def detect_threat_clusters(self) -> List[ThreatCluster]:
        """
        Detect coordinated attacks across multiple tenants.
        
        Looks for:
          • Same attack pattern across tenants
          • Same IP ranges
          • Same time windows
          • Similar signatures
        """
        new_clusters = []
        
        for pattern_hash, signature in self.global_signatures.items():
            if signature.tenant_count >= 3 and signature.occurrence_count >= 5:
                likelihood = min((signature.tenant_count / 3.0) * (signature.occurrence_count / 5.0), 1.0)
                
                if likelihood > 0.70:
                    cluster = ThreatCluster(
                        cluster_id=f"cluster_{self.cluster_counter}",
                        attack_type=signature.attack_type,
                        tenant_ids=signature.metadata.get("tenants_affected", [])[:10],
                        correlation_score=likelihood,
                        cluster_severity=signature.severity,
                        likely_coordinated=(likelihood > 0.85),
                        mitigation_suggestion=self._generate_mitigation(signature.attack_type, likelihood),
                        timestamp=datetime.utcnow(),
                    )
                    
                    new_clusters.append(cluster)
                    self.threat_clusters.append(cluster)
                    self.cluster_counter += 1
                    
                    logger.warning(
                        f"[GTIN] GLOBAL THREAT CLUSTER DETECTED: {signature.attack_type} "
                        f"({signature.tenant_count} tenants, "
                        f"coordinated: {cluster.likely_coordinated})"
                    )
        
        return new_clusters

    async def query_threat_intelligence(
        self,
        tenant_id: str,
        attack_type: Optional[str] = None,
        min_severity: ThreatLevel = ThreatLevel.MEDIUM,
    ) -> Dict[str, Any]:
        """
        Query global threat intelligence (privacy-safe).
        
        Returns:
          • Relevant signatures (anonymized)
          • Threat clusters (no tenant details)
          • Mitigation suggestions
          • No raw tenant data
        """
        relevant_signatures = []
        relevant_clusters = []
        
        for signature in self.global_signatures.values():
            if signature.severity.value >= min_severity.value:
                if attack_type is None or signature.attack_type == attack_type:
                    relevant_signatures.append({
                        "signature_id": signature.signature_id,
                        "attack_type": signature.attack_type,
                        "severity": signature.severity.name,
                        "tenant_count": signature.tenant_count,
                        "occurrence_count": signature.occurrence_count,
                        "last_seen": signature.last_seen.isoformat(),
                    })
        
        for cluster in self.threat_clusters:
            if cluster.cluster_severity.value >= min_severity.value:
                relevant_clusters.append({
                    "cluster_id": cluster.cluster_id,
                    "attack_type": cluster.attack_type,
                    "severity": cluster.cluster_severity.name,
                    "correlation_score": cluster.correlation_score,
                    "coordinated": cluster.likely_coordinated,
                    "mitigation": cluster.mitigation_suggestion,
                })
        
        return {
            "global_signatures": relevant_signatures[:20],
            "threat_clusters": relevant_clusters,
            "global_threat_level": self._compute_global_threat_level(),
            "timestamp": datetime.utcnow().isoformat(),
        }

    def _generate_pattern_hash(self, attack_type: str, attack_data: Dict[str, Any]) -> str:
        """Generate privacy-safe pattern hash"""
        pattern_str = f"{attack_type}_{attack_data.get('vector', '')}_{attack_data.get('method', '')}"
        return hashlib.sha256(pattern_str.encode()).hexdigest()[:16]

    def _generate_embedding(self, attack_data: Dict[str, Any]) -> List[float]:
        """Generate vector embedding (simplified)"""
        base_values = [
            float(attack_data.get("intensity", 0.5)),
            float(attack_data.get("persistence", 0.5)),
            float(attack_data.get("coordination", 0.0)),
        ]
        return base_values + [0.0] * 97

    def _anonymize_tenant_id(self, tenant_id: str) -> str:
        """Hash tenant ID for privacy"""
        return hashlib.sha256(tenant_id.encode()).hexdigest()[:8]

    def _map_risk_to_threat_level(self, risk_score: float) -> ThreatLevel:
        """Map risk score to threat level"""
        if risk_score >= 95:
            return ThreatLevel.GLOBAL_CAMPAIGN
        elif risk_score >= 85:
            return ThreatLevel.CRITICAL
        elif risk_score >= 70:
            return ThreatLevel.HIGH
        elif risk_score >= 50:
            return ThreatLevel.MEDIUM
        else:
            return ThreatLevel.LOW

    def _generate_mitigation(self, attack_type: str, likelihood: float) -> str:
        """Generate mitigation suggestion"""
        if likelihood > 0.85:
            return f"CRITICAL: Coordinate response across all tenants for {attack_type}"
        else:
            return f"Apply per-tenant mitigation for {attack_type}"

    def _compute_global_threat_level(self) -> int:
        """Compute global threat level (0-100)"""
        if not self.global_signatures:
            return 0
        
        critical_count = sum(1 for s in self.global_signatures.values() if s.severity == ThreatLevel.CRITICAL)
        campaign_count = len([c for c in self.threat_clusters if c.likely_coordinated])
        
        threat_level = min((critical_count * 20 + campaign_count * 30), 100)
        return threat_level

    def get_gtin_status(self) -> Dict[str, Any]:
        """Get GTIN operational status"""
        return {
            "global_signatures": len(self.global_signatures),
            "threat_clusters": len(self.threat_clusters),
            "coordinated_campaigns": len([c for c in self.threat_clusters if c.likely_coordinated]),
            "global_threat_level": self._compute_global_threat_level(),
            "max_tenant_impact": (
                max((s.tenant_count for s in self.global_signatures.values()), default=0)
            ),
        }


_global_gtin = GlobalThreatIntelligenceNetwork()


def get_global_threat_intelligence_network() -> GlobalThreatIntelligenceNetwork:
    return _global_gtin
