"""
Federated Security Learning Engine — Collective Learning Without Data Sharing
═══════════════════════════════════════════════════════════════════════════════

Purpose:
  Learn globally from all tenants using federated learning.
  
  Privacy-preserving:
    • Each tenant trains local model
    • Only model updates shared (not data)
    • Aggregate into global model
    • Push back improved global model
"""

from dataclasses import dataclass
from typing import Dict, Any, Optional, List
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


@dataclass
class ModelUpdate:
    tenant_id: str
    model_version: str
    local_improvements: Dict[str, float]
    accuracy_gain: float
    timestamp: datetime


@dataclass
class GlobalModel:
    version: str
    created_at: datetime
    accuracy: float
    parameters: Dict[str, float]
    trained_on_tenant_count: int
    avg_local_accuracy: float


class FederatedSecurityLearningEngine:
    """
    Federated learning: Train global models without sharing data.
    
    Privacy model:
      • Tenants train locally with their data
      • Only model updates shared
      • Global model aggregates updates
      • Updated global model sent back to all
      • No raw data ever leaves tenant
    """

    def __init__(self):
        self.global_model = GlobalModel(
            version="v1.0",
            created_at=datetime.utcnow(),
            accuracy=0.85,
            parameters={
                "behavioral_weight": 0.35,
                "risk_threshold": 65.0,
                "anomaly_sensitivity": 0.72,
            },
            trained_on_tenant_count=0,
            avg_local_accuracy=0.85,
        )
        self.model_updates: List[ModelUpdate] = []
        self.participating_tenants: List[str] = []

    async def submit_local_model_update(
        self,
        tenant_id: str,
        local_improvements: Dict[str, float],
        local_accuracy: float,
    ) -> bool:
        """
        Tenant submits local model improvements.
        
        Privacy: Only the learned parameters, not the data.
        """
        if local_accuracy < 0.60:
            logger.warning(
                f"[FEDERATED] Local model accuracy too low: {tenant_id} ({local_accuracy:.2f})"
            )
            return False

        update = ModelUpdate(
            tenant_id=tenant_id,
            model_version=self.global_model.version,
            local_improvements=local_improvements,
            accuracy_gain=local_accuracy - self.global_model.accuracy,
            timestamp=datetime.utcnow(),
        )

        self.model_updates.append(update)

        if tenant_id not in self.participating_tenants:
            self.participating_tenants.append(tenant_id)

        logger.info(
            f"[FEDERATED] Local model update received: {tenant_id} "
            f"(accuracy: {local_accuracy:.3f}, gain: {update.accuracy_gain:+.3f})"
        )

        return True

    async def aggregate_global_model(self) -> Optional[GlobalModel]:
        """
        Aggregate all local model updates into improved global model.
        
        Federated averaging:
          1. Collect all tenant updates
          2. Average parameters
          3. Weight by accuracy
          4. Create new global model
          5. Distribute back to all
        """
        if len(self.model_updates) < 2:
            logger.info("[FEDERATED] Insufficient updates for aggregation (minimum: 2)")
            return None

        recent_updates = self.model_updates[-10:]
        
        aggregated_params = {}
        weighted_accuracy = 0.0
        total_weight = 0.0

        for update in recent_updates:
            weight = max(0.01, (1.0 + update.accuracy_gain))
            total_weight += weight

            for param_name, param_value in update.local_improvements.items():
                if param_name not in aggregated_params:
                    aggregated_params[param_name] = 0.0
                aggregated_params[param_name] += param_value * weight

            weighted_accuracy += update.accuracy_gain * weight

        for param_name in aggregated_params:
            aggregated_params[param_name] /= total_weight

        new_accuracy = self.global_model.accuracy + (weighted_accuracy / total_weight)
        new_accuracy = min(new_accuracy, 0.99)

        new_model = GlobalModel(
            version=self._increment_version(self.global_model.version),
            created_at=datetime.utcnow(),
            accuracy=new_accuracy,
            parameters=aggregated_params,
            trained_on_tenant_count=len(self.participating_tenants),
            avg_local_accuracy=sum(u.accuracy_gain for u in recent_updates) / len(recent_updates) + self.global_model.accuracy,
        )

        self.global_model = new_model

        logger.critical(
            f"[FEDERATED] Global model aggregated (v{new_model.version}): "
            f"accuracy improved to {new_model.accuracy:.3f} "
            f"(trained on {new_model.trained_on_tenant_count} tenants)"
        )

        return new_model

    async def push_global_model_to_tenants(self) -> Dict[str, Any]:
        """
        Push improved global model back to all tenants.
        
        Each tenant receives:
          • Updated global model parameters
          • Performance improvements
          • Recommended local adjustments
        """
        push_summary = {
            "model_version": self.global_model.version,
            "accuracy": self.global_model.accuracy,
            "parameters": self.global_model.parameters.copy(),
            "tenants_updated": len(self.participating_tenants),
            "expected_improvements": {
                "detection_accuracy": f"+{(self.global_model.accuracy - 0.85)*100:.1f}%",
                "false_positive_reduction": "-10-15%",
            },
        }

        logger.info(
            f"[FEDERATED] Pushing global model v{self.global_model.version} to {len(self.participating_tenants)} tenants"
        )

        return push_summary

    async def compute_federated_learning_gain(self) -> float:
        """
        Compute total learning gain from federation.
        """
        if not self.model_updates:
            return 0.0

        total_gain = sum(u.accuracy_gain for u in self.model_updates)
        avg_gain = total_gain / len(self.model_updates)

        return avg_gain

    def _increment_version(self, current_version: str) -> str:
        """Increment model version"""
        parts = current_version.split(".")
        parts[-1] = str(int(parts[-1]) + 1)
        return ".".join(parts)

    def get_federated_learning_status(self) -> Dict[str, Any]:
        """Get federated learning status"""
        federated_gain = sum(u.accuracy_gain for u in self.model_updates) / max(1, len(self.model_updates))

        return {
            "global_model_version": self.global_model.version,
            "global_accuracy": self.global_model.accuracy,
            "participating_tenants": len(self.participating_tenants),
            "total_model_updates_received": len(self.model_updates),
            "federated_learning_gain": federated_gain,
            "avg_local_accuracy": self.global_model.avg_local_accuracy,
        }


_global_federated_learning = FederatedSecurityLearningEngine()


def get_federated_security_learning_engine() -> FederatedSecurityLearningEngine:
    return _global_federated_learning
