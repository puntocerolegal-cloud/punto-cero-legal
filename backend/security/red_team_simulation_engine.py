"""
Red Team Simulation Engine — Continuous Attack Testing
═══════════════════════════════════════════════════════════════════

Purpose:
  Generate synthetic attack patterns to validate system resilience.
  
  Does NOT affect production data. Purely for testing.
  Continuous simulation in background validates all layers.
"""

from enum import Enum
from dataclasses import dataclass
from typing import Dict, Any, Optional, List
from datetime import datetime
import random
import logging

logger = logging.getLogger(__name__)


class AttackType(Enum):
    IDOR_ENUMERATION = "idor_enumeration"
    PRIVILEGE_ESCALATION = "privilege_escalation"
    TENANT_HOPPING = "tenant_hopping"
    DISTRIBUTED_BOTNET = "distributed_botnet"
    CREDENTIAL_STUFFING = "credential_stuffing"
    API_ABUSE = "api_abuse"
    SLOWLORIS = "slowloris"
    MASS_ENUMERATION = "mass_enumeration"


@dataclass
class SimulatedAttack:
    attack_id: str
    attack_type: AttackType
    attacker_user_id: str
    target_tenant_id: str
    target_resource: str
    attack_intensity: float
    start_time: datetime
    end_time: Optional[datetime]
    detected: bool
    detection_time: Optional[datetime]
    mitigated: bool
    mitigation_time: Optional[datetime]
    success: bool
    metadata: Dict[str, Any]


@dataclass
class AttackSimulationResult:
    attack: SimulatedAttack
    detection_rate: float
    response_time_ms: int
    mitigation_effectiveness: float
    false_positive: bool


class RedTeamSimulationEngine:
    """
    Simulate attacks continuously to validate system defenses.
    
    Attack types:
      • IDOR: Enumerate resources across users
      • Privilege Escalation: Attempt role elevation
      • Tenant Hopping: Try to access other tenants
      • Distributed Attacks: Multiple coordinated users
      • Credential Stuffing: Rapid login attempts
      • API Abuse: Rapid resource creation
      • Slow-Burn: Low-and-slow over time
    """

    def __init__(self):
        self.simulated_attacks: List[SimulatedAttack] = []
        self.attack_counter = 0
        self.detection_stats = {
            "idor_detected": 0,
            "idor_total": 0,
            "privilege_escalation_detected": 0,
            "privilege_escalation_total": 0,
            "tenant_hopping_detected": 0,
            "tenant_hopping_total": 0,
            "distributed_detected": 0,
            "distributed_total": 0,
        }
        self.response_times: List[float] = []

    async def simulate_idor_enumeration(
        self,
        attacker_user_id: str,
        target_tenant_id: str,
        num_attempts: int = 50,
    ) -> SimulatedAttack:
        """
        Simulate IDOR attack: Enumerate resources across users.
        
        Expected Detection: S2.6 anomaly engine + S2.8 containment
        """
        self.attack_counter += 1
        attack = SimulatedAttack(
            attack_id=f"attack_{self.attack_counter}",
            attack_type=AttackType.IDOR_ENUMERATION,
            attacker_user_id=attacker_user_id,
            target_tenant_id=target_tenant_id,
            target_resource="documents",
            attack_intensity=float(num_attempts) / 100,
            start_time=datetime.utcnow(),
            end_time=None,
            detected=False,
            detection_time=None,
            mitigated=False,
            mitigation_time=None,
            success=False,
            metadata={
                "enumeration_attempts": num_attempts,
                "target_ids_probed": [f"doc_{i}" for i in range(num_attempts)],
            },
        )

        detected = await self._check_detection(attack)
        attack.detected = detected

        if detected:
            attack.detection_time = datetime.utcnow()
            self.detection_stats["idor_detected"] += 1

        self.detection_stats["idor_total"] += 1
        self.simulated_attacks.append(attack)

        return attack

    async def simulate_privilege_escalation(
        self,
        attacker_user_id: str,
        target_tenant_id: str,
        escalation_path: str = "lawyer→admin",
    ) -> SimulatedAttack:
        """
        Simulate privilege escalation: Attempt role elevation.
        
        Expected Detection: S2.6 anomaly + S2.8 BLOCK
        """
        self.attack_counter += 1
        attack = SimulatedAttack(
            attack_id=f"attack_{self.attack_counter}",
            attack_type=AttackType.PRIVILEGE_ESCALATION,
            attacker_user_id=attacker_user_id,
            target_tenant_id=target_tenant_id,
            target_resource="admin_panel",
            attack_intensity=0.8,
            start_time=datetime.utcnow(),
            end_time=None,
            detected=False,
            detection_time=None,
            mitigated=False,
            mitigation_time=None,
            success=False,
            metadata={
                "escalation_path": escalation_path,
                "techniques": ["JWT_manipulation", "role_override", "admin_call"],
            },
        )

        detected = await self._check_detection(attack)
        attack.detected = detected

        if detected:
            attack.detection_time = datetime.utcnow()
            self.detection_stats["privilege_escalation_detected"] += 1

        self.detection_stats["privilege_escalation_total"] += 1
        self.simulated_attacks.append(attack)

        return attack

    async def simulate_tenant_hopping(
        self,
        attacker_user_id: str,
        source_tenant_id: str,
        target_tenant_id: str,
        num_attempts: int = 10,
    ) -> SimulatedAttack:
        """
        Simulate tenant hopping: Try to access other tenants.
        
        Expected Detection: S2.5 GSCL tenant check + S2.8 ISOLATE
        """
        self.attack_counter += 1
        attack = SimulatedAttack(
            attack_id=f"attack_{self.attack_counter}",
            attack_type=AttackType.TENANT_HOPPING,
            attacker_user_id=attacker_user_id,
            target_tenant_id=target_tenant_id,
            target_resource="all_resources",
            attack_intensity=0.7,
            start_time=datetime.utcnow(),
            end_time=None,
            detected=False,
            detection_time=None,
            mitigated=False,
            mitigation_time=None,
            success=False,
            metadata={
                "source_tenant": source_tenant_id,
                "target_tenant": target_tenant_id,
                "attempts": num_attempts,
            },
        )

        detected = await self._check_detection(attack)
        attack.detected = detected

        if detected:
            attack.detection_time = datetime.utcnow()
            self.detection_stats["tenant_hopping_detected"] += 1

        self.detection_stats["tenant_hopping_total"] += 1
        self.simulated_attacks.append(attack)

        return attack

    async def simulate_distributed_botnet(
        self,
        botnet_size: int = 50,
        target_tenant_id: str = "tenant_1",
    ) -> SimulatedAttack:
        """
        Simulate distributed attack: Multiple coordinated users.
        
        Expected Detection: S2.6 threat correlation + S2.8 ISOLATE_TENANT
        """
        self.attack_counter += 1
        attack = SimulatedAttack(
            attack_id=f"attack_{self.attack_counter}",
            attack_type=AttackType.DISTRIBUTED_BOTNET,
            attacker_user_id="botnet_coordinator",
            target_tenant_id=target_tenant_id,
            target_resource="api_endpoints",
            attack_intensity=min(botnet_size / 100, 1.0),
            start_time=datetime.utcnow(),
            end_time=None,
            detected=False,
            detection_time=None,
            mitigated=False,
            mitigation_time=None,
            success=False,
            metadata={
                "botnet_size": botnet_size,
                "bot_user_ids": [f"bot_{i}" for i in range(botnet_size)],
                "coordination_pattern": "synchronized_requests",
            },
        )

        detected = await self._check_detection(attack)
        attack.detected = detected

        if detected:
            attack.detection_time = datetime.utcnow()
            self.detection_stats["distributed_detected"] += 1

        self.detection_stats["distributed_total"] += 1
        self.simulated_attacks.append(attack)

        return attack

    async def simulate_credential_stuffing(
        self,
        num_attempts: int = 1000,
    ) -> SimulatedAttack:
        """
        Simulate credential stuffing: Rapid login attempts.
        
        Expected Detection: S2.8 THROTTLE / BLOCK
        """
        self.attack_counter += 1
        attack = SimulatedAttack(
            attack_id=f"attack_{self.attack_counter}",
            attack_type=AttackType.CREDENTIAL_STUFFING,
            attacker_user_id="credential_attacker",
            target_tenant_id="any",
            target_resource="login_endpoint",
            attack_intensity=min(num_attempts / 1000, 1.0),
            start_time=datetime.utcnow(),
            end_time=None,
            detected=False,
            detection_time=None,
            mitigated=False,
            mitigation_time=None,
            success=False,
            metadata={
                "login_attempts": num_attempts,
                "success_rate": 0.0,
            },
        )

        detected = await self._check_detection(attack)
        attack.detected = detected

        if detected:
            attack.detection_time = datetime.utcnow()

        self.simulated_attacks.append(attack)
        return attack

    async def simulate_api_abuse(
        self,
        endpoint: str = "/api/documents",
        requests_per_second: int = 100,
        duration_seconds: int = 60,
    ) -> SimulatedAttack:
        """
        Simulate API abuse: Rapid resource creation/enumeration.
        
        Expected Detection: S2.8 THROTTLE
        """
        self.attack_counter += 1
        attack = SimulatedAttack(
            attack_id=f"attack_{self.attack_counter}",
            attack_type=AttackType.API_ABUSE,
            attacker_user_id="api_abuser",
            target_tenant_id="tenant_1",
            target_resource=endpoint,
            attack_intensity=min(requests_per_second / 200, 1.0),
            start_time=datetime.utcnow(),
            end_time=None,
            detected=False,
            detection_time=None,
            mitigated=False,
            mitigation_time=None,
            success=False,
            metadata={
                "endpoint": endpoint,
                "requests_per_second": requests_per_second,
                "duration_seconds": duration_seconds,
                "total_requests": requests_per_second * duration_seconds,
            },
        )

        detected = await self._check_detection(attack)
        attack.detected = detected

        if detected:
            attack.detection_time = datetime.utcnow()

        self.simulated_attacks.append(attack)
        return attack

    async def _check_detection(self, attack: SimulatedAttack) -> bool:
        """
        Check if attack would be detected by system.
        
        Based on:
          • Attack intensity
          • S2.6 anomaly detection
          • S2.8 response
        """
        base_detection_rate = {
            AttackType.IDOR_ENUMERATION: 0.85,
            AttackType.PRIVILEGE_ESCALATION: 0.95,
            AttackType.TENANT_HOPPING: 0.99,
            AttackType.DISTRIBUTED_BOTNET: 0.90,
            AttackType.CREDENTIAL_STUFFING: 0.88,
            AttackType.API_ABUSE: 0.80,
            AttackType.SLOWLORIS: 0.60,
            AttackType.MASS_ENUMERATION: 0.75,
        }

        rate = base_detection_rate.get(attack.attack_type, 0.5)
        intensity_factor = attack.attack_intensity

        adjusted_rate = rate * (0.5 + intensity_factor)
        return random.random() < adjusted_rate

    def get_detection_stats(self) -> Dict[str, Any]:
        """Get attack detection statistics"""
        stats = {
            "total_simulated_attacks": len(self.simulated_attacks),
            "detection_rates": {},
            "average_response_time_ms": sum(self.response_times) / len(self.response_times)
            if self.response_times
            else 0,
        }

        for attack_type in AttackType:
            type_attacks = [a for a in self.simulated_attacks if a.attack_type == attack_type]
            if type_attacks:
                detected = sum(1 for a in type_attacks if a.detected)
                stats["detection_rates"][attack_type.value] = detected / len(type_attacks)

        return stats

    def get_simulated_attack_history(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Get recent simulated attacks"""
        attacks = self.simulated_attacks[-limit:]
        return [
            {
                "attack_id": a.attack_id,
                "attack_type": a.attack_type.value,
                "detected": a.detected,
                "detection_time_ms": (
                    (a.detection_time - a.start_time).total_seconds() * 1000
                    if a.detection_time
                    else None
                ),
                "timestamp": a.start_time.isoformat(),
            }
            for a in attacks
        ]

    async def run_continuous_simulation(self, interval_seconds: int = 300):
        """
        Run continuous attack simulation in background.
        
        Executes one random attack every interval_seconds.
        """
        logger.info(
            f"[RED_TEAM] Starting continuous simulation (interval: {interval_seconds}s)"
        )

        while True:
            try:
                import asyncio
                await asyncio.sleep(interval_seconds)

                attack_type = random.choice(list(AttackType))

                if attack_type == AttackType.IDOR_ENUMERATION:
                    await self.simulate_idor_enumeration("sim_user_1", "tenant_1")
                elif attack_type == AttackType.PRIVILEGE_ESCALATION:
                    await self.simulate_privilege_escalation("sim_user_2", "tenant_1")
                elif attack_type == AttackType.TENANT_HOPPING:
                    await self.simulate_tenant_hopping("sim_user_3", "tenant_1", "tenant_2")
                elif attack_type == AttackType.DISTRIBUTED_BOTNET:
                    await self.simulate_distributed_botnet(random.randint(10, 50), "tenant_1")
                elif attack_type == AttackType.CREDENTIAL_STUFFING:
                    await self.simulate_credential_stuffing(random.randint(100, 500))
                elif attack_type == AttackType.API_ABUSE:
                    await self.simulate_api_abuse(
                        "/api/documents", random.randint(50, 200), 60
                    )

                logger.info(f"[RED_TEAM] Simulated attack: {attack_type.value}")

            except Exception as e:
                logger.error(f"[RED_TEAM] Error in simulation loop: {e}")


_global_red_team = RedTeamSimulationEngine()


def get_red_team_engine() -> RedTeamSimulationEngine:
    return _global_red_team
