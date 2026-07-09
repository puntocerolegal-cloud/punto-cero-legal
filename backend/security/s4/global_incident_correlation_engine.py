"""
Global Incident Correlation Engine — Detect Campaign-Level Attacks
═══════════════════════════════════════════════════════════════════════════════

Purpose:
  Correlate incidents across all tenants to detect global attack campaigns.
  
  Detects:
    • Same attack across multiple tenants
    • Coordinated multi-system campaigns
    • Attack waves spreading across network
"""

from dataclasses import dataclass
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from enum import Enum
import logging

logger = logging.getLogger(__name__)


class CampaignType(Enum):
    MASS_CREDENTIAL_ATTACK = "mass_credential_attack"
    DISTRIBUTED_BOTNET = "distributed_botnet"
    COORDINATED_IDOR = "coordinated_idor"
    API_ABUSE_CAMPAIGN = "api_abuse_campaign"
    SLOW_BURN_ATTACK = "slow_burn_attack"
    MULTI_VECTOR_CAMPAIGN = "multi_vector_campaign"


@dataclass
class GlobalIncident:
    incident_id: str
    campaign_type: CampaignType
    affected_tenants: List[str]
    affected_count: int
    severity: str
    correlation_score: float
    first_detection: datetime
    last_detection: datetime
    is_active: bool
    attributed_actor: Optional[str]
    recommended_response: str


class GlobalIncidentCorrelationEngine:
    """
    Correlate incidents across tenants to detect global campaigns.
    """

    def __init__(self):
        self.global_incidents: Dict[str, GlobalIncident] = []
        self.incident_counter = 0
        self.campaign_history: List[GlobalIncident] = []
        self.incident_correlations: Dict[str, List[str]] = {}

    async def correlate_tenant_incidents(
        self,
        incident_timeline: Dict[str, List[Dict[str, Any]]],
    ) -> List[GlobalIncident]:
        """
        Correlate incidents from multiple tenants.
        
        Input:
          {
            "tenant_A": [incident1, incident2],
            "tenant_B": [incident3],
            "tenant_C": [incident4, incident5],
          }
        
        Output:
          Grouped global incidents/campaigns
        """
        correlated_campaigns = []

        attack_types: Dict[str, List[str]] = {}
        for tenant_id, incidents in incident_timeline.items():
            for incident in incidents:
                attack_type = incident.get("type", "unknown")
                if attack_type not in attack_types:
                    attack_types[attack_type] = []
                attack_types[attack_type].append(tenant_id)

        for attack_type, affected_tenants in attack_types.items():
            if len(affected_tenants) >= 2:
                correlation_score = min(len(affected_tenants) / 5, 1.0)

                campaign = GlobalIncident(
                    incident_id=f"campaign_{self.incident_counter}",
                    campaign_type=self._map_attack_type_to_campaign(attack_type),
                    affected_tenants=list(set(affected_tenants)),
                    affected_count=len(set(affected_tenants)),
                    severity=self._compute_campaign_severity(len(set(affected_tenants))),
                    correlation_score=correlation_score,
                    first_detection=datetime.utcnow(),
                    last_detection=datetime.utcnow(),
                    is_active=True,
                    attributed_actor=None,
                    recommended_response=self._generate_campaign_response(attack_type),
                )

                correlated_campaigns.append(campaign)
                self.incident_counter += 1

                logger.warning(
                    f"[CORRELATION] Global campaign detected: {attack_type} "
                    f"({campaign.affected_count} tenants, correlation: {correlation_score:.2f})"
                )

        return correlated_campaigns

    async def detect_attack_waves(
        self,
        time_window_minutes: int,
        incident_events: List[Dict[str, Any]],
    ) -> Optional[GlobalIncident]:
        """
        Detect attack waves (same attack spreading across network over time).
        """
        recent_events = [
            e for e in incident_events
            if (datetime.utcnow() - e.get("timestamp", datetime.utcnow())).total_seconds() < time_window_minutes * 60
        ]

        if len(recent_events) < 3:
            return None

        attack_type = recent_events[0].get("type", "unknown")
        affected_tenants = list(set(e.get("tenant_id") for e in recent_events))

        if len(affected_tenants) < 2:
            return None

        wave_incident = GlobalIncident(
            incident_id=f"wave_{self.incident_counter}",
            campaign_type=CampaignType.DISTRIBUTED_BOTNET,
            affected_tenants=affected_tenants,
            affected_count=len(affected_tenants),
            severity="critical" if len(affected_tenants) >= 5 else "high",
            correlation_score=min(len(affected_tenants) / 10, 1.0),
            first_detection=min((e.get("timestamp") for e in recent_events), default=datetime.utcnow()),
            last_detection=datetime.utcnow(),
            is_active=True,
            attributed_actor="unknown_botnet",
            recommended_response="Immediate global incident response required",
        )

        self.incident_counter += 1

        logger.critical(
            f"[CORRELATION] ATTACK WAVE DETECTED: {attack_type} "
            f"affecting {len(affected_tenants)} tenants in {time_window_minutes} minutes"
        )

        return wave_incident

    async def attribute_campaign_actor(
        self,
        campaign_id: str,
        indicators: Dict[str, Any],
    ) -> Optional[str]:
        """
        Attempt to attribute campaign to known actor.
        """
        ip_range = indicators.get("ip_range")
        attack_pattern = indicators.get("attack_pattern")
        timing_signature = indicators.get("timing_signature")

        actor = None

        if timing_signature == "utc_business_hours":
            actor = "APT_Eastern_European"
        elif attack_pattern == "credential_stuffing_automated":
            actor = "Carder_Group_Unknown"
        elif ip_range and ip_range.startswith("AS64"):
            actor = "VPN_Proxy_Network_Unknown"

        return actor

    async def escalate_campaign(self, campaign: GlobalIncident) -> Dict[str, Any]:
        """
        Escalate global campaign for coordinated response.
        """
        escalation = {
            "campaign_id": campaign.incident_id,
            "severity": campaign.severity,
            "affected_tenants": campaign.affected_tenants,
            "recommended_action": campaign.recommended_response,
            "escalation_level": "global_soc" if campaign.affected_count >= 4 else "regional_soc",
            "coordination_required": campaign.affected_count >= 3,
        }

        logger.critical(
            f"[CORRELATION] Campaign escalated: {campaign.incident_id} "
            f"(level: {escalation['escalation_level']})"
        )

        return escalation

    def _map_attack_type_to_campaign(self, attack_type: str) -> CampaignType:
        """Map attack type to campaign type"""
        mapping = {
            "credential_stuffing": CampaignType.MASS_CREDENTIAL_ATTACK,
            "botnet": CampaignType.DISTRIBUTED_BOTNET,
            "idor": CampaignType.COORDINATED_IDOR,
            "api_abuse": CampaignType.API_ABUSE_CAMPAIGN,
            "slow_burn": CampaignType.SLOW_BURN_ATTACK,
        }
        return mapping.get(attack_type, CampaignType.MULTI_VECTOR_CAMPAIGN)

    def _compute_campaign_severity(self, tenant_count: int) -> str:
        """Compute severity based on tenant count"""
        if tenant_count >= 10:
            return "critical"
        elif tenant_count >= 5:
            return "high"
        elif tenant_count >= 3:
            return "medium"
        else:
            return "low"

    def _generate_campaign_response(self, attack_type: str) -> str:
        """Generate recommended response"""
        return f"Activate global mitigation playbook for {attack_type} campaign"

    def get_active_campaigns(self) -> List[Dict[str, Any]]:
        """Get active global campaigns"""
        return [
            {
                "campaign_id": c.incident_id,
                "type": c.campaign_type.value,
                "affected_tenants": len(c.affected_tenants),
                "severity": c.severity,
                "correlation_score": c.correlation_score,
                "is_active": c.is_active,
                "recommendation": c.recommended_response,
            }
            for c in self.campaign_history
            if c.is_active
        ]


_global_correlation_engine = GlobalIncidentCorrelationEngine()


def get_global_incident_correlation_engine() -> GlobalIncidentCorrelationEngine:
    return _global_correlation_engine
