"""
LEAD CLASSIFIER
Automatically classifies customers based on their lifecycle stage.

Classifications:
- COLD_LEAD: No previous interaction
- WARM_LEAD: Some interaction, interested
- HOT_LEAD: High interest, ready to convert
- ACTIVE_CLIENT: Current paying customer
- VIP_CLIENT: High-value customer
- RECURRING_CLIENT: Long-term customer
- FIRM: Legal firm account
- LAWYER: Individual lawyer account
"""

from dataclasses import dataclass
from enum import Enum
from typing import Tuple, Optional, Dict, Any


class LeadStatus(str, Enum):
    """Lifecycle stages for customers."""
    COLD_LEAD = "cold_lead"
    WARM_LEAD = "warm_lead"
    HOT_LEAD = "hot_lead"
    ACTIVE_CLIENT = "active_client"
    VIP_CLIENT = "vip_client"
    RECURRING_CLIENT = "recurring_client"
    FIRM = "firm"
    LAWYER = "lawyer"


@dataclass
class LeadClassification:
    """Result of lead classification."""
    status: LeadStatus
    confidence: float
    reasoning: Dict[str, Any]
    recommended_action: str


class LeadClassifier:
    """
    Automatically classifies leads based on:
    - Conversation history
    - Customer metadata
    - Interaction patterns
    - Purchase history
    - Account type
    
    Pluggable for extension without code changes.
    """
    
    def __init__(self):
        """Initialize with default classification rules."""
        self.custom_classifiers: Dict[LeadStatus, callable] = {}
        self.thresholds = {
            "cold_to_warm": 2,  # interactions needed
            "warm_to_hot": 5,   # interactions
            "hot_to_client": 1,  # purchase
            "vip_threshold": 50000,  # revenue in currency units
            "recurring_threshold": 3,  # repeat purchases
        }
    
    def register_custom_classifier(self, status: LeadStatus, classifier_func: callable):
        """Register a custom classifier for a specific status."""
        self.custom_classifiers[status] = classifier_func
    
    def classify(self, customer_data: Dict[str, Any]) -> LeadClassification:
        """
        Classify a lead based on customer data.
        
        Input expected:
        - customer_id (optional)
        - customer_type (optional): 'firm', 'lawyer', 'individual'
        - interaction_count (int)
        - last_interaction_days_ago (int)
        - has_paid (bool)
        - total_revenue (float)
        - purchase_count (int)
        - engagement_score (0-100)
        - account_created_days_ago (int)
        """
        
        # Determine if known entity types
        customer_type = customer_data.get("customer_type", "unknown")
        if customer_type == "firm":
            return LeadClassification(
                status=LeadStatus.FIRM,
                confidence=0.9,
                reasoning={"reason": "Firm account type"},
                recommended_action="route_to_firm_manager"
            )
        
        if customer_type == "lawyer":
            return LeadClassification(
                status=LeadStatus.LAWYER,
                confidence=0.9,
                reasoning={"reason": "Lawyer account type"},
                recommended_action="route_to_lawyer_onboarding"
            )
        
        # Check if existing customer
        if customer_data.get("has_paid", False):
            total_revenue = customer_data.get("total_revenue", 0)
            purchase_count = customer_data.get("purchase_count", 0)
            
            # VIP: High revenue
            if total_revenue >= self.thresholds["vip_threshold"]:
                return LeadClassification(
                    status=LeadStatus.VIP_CLIENT,
                    confidence=0.95,
                    reasoning={
                        "reason": "High-value customer",
                        "total_revenue": total_revenue
                    },
                    recommended_action="route_to_account_manager"
                )
            
            # Recurring: Multiple purchases
            if purchase_count >= self.thresholds["recurring_threshold"]:
                return LeadClassification(
                    status=LeadStatus.RECURRING_CLIENT,
                    confidence=0.95,
                    reasoning={
                        "reason": "Multiple purchases",
                        "purchase_count": purchase_count
                    },
                    recommended_action="route_to_retention"
                )
            
            # Active: Recent purchase
            return LeadClassification(
                status=LeadStatus.ACTIVE_CLIENT,
                confidence=0.9,
                reasoning={"reason": "Current customer"},
                recommended_action="route_to_support"
            )
        
        # Not yet a customer - classify by engagement
        interaction_count = customer_data.get("interaction_count", 0)
        engagement_score = customer_data.get("engagement_score", 0)
        last_interaction_days = customer_data.get("last_interaction_days_ago", float('inf'))
        
        # Hot lead: High engagement, recent, ready to convert
        if engagement_score >= 75 and last_interaction_days <= 3:
            return LeadClassification(
                status=LeadStatus.HOT_LEAD,
                confidence=0.85,
                reasoning={
                    "reason": "High engagement, ready to convert",
                    "engagement_score": engagement_score,
                    "recency_days": last_interaction_days
                },
                recommended_action="prepare_sales_call"
            )
        
        # Warm lead: Some engagement
        if engagement_score >= 40 or interaction_count >= self.thresholds["warm_to_hot"]:
            return LeadClassification(
                status=LeadStatus.WARM_LEAD,
                confidence=0.75,
                reasoning={
                    "reason": "Some interest shown",
                    "engagement_score": engagement_score,
                    "interactions": interaction_count
                },
                recommended_action="nurture_content"
            )
        
        # Cold lead: No significant engagement
        return LeadClassification(
            status=LeadStatus.COLD_LEAD,
            confidence=0.8,
            reasoning={
                "reason": "No significant engagement",
                "engagement_score": engagement_score
            },
            recommended_action="start_nurture_sequence"
        )
    
    def get_confidence(self, status: LeadStatus, customer_data: Dict[str, Any]) -> float:
        """Get confidence score for a specific status."""
        classification = self.classify(customer_data)
        if classification.status == status:
            return classification.confidence
        return 0.0


# Backward compatibility: No impact on existing systems
