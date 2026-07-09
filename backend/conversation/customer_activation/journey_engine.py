"""
CUSTOMER JOURNEY ENGINE
Detects what stage of the customer journey a person is in.

Stages:
- VISITOR: First-time viewer, no commitment
- INTEREST: Showed interest, started exploring
- DISCOVERY: Learning about solutions
- CONSULTATION: Seeking advice/consultation
- QUALIFICATION: Being evaluated for fit
- PURCHASE: Ready to buy or buying
- ONBOARDING: New customer being set up
- ACTIVE: Current active customer
- LOYAL: Long-term satisfied customer
- ADVOCATE: Recommends to others
"""

from dataclasses import dataclass
from enum import Enum
from typing import Dict, Any, Optional


class JourneyStage(str, Enum):
    """Stages in the customer journey."""
    VISITOR = "visitor"
    INTEREST = "interest"
    DISCOVERY = "discovery"
    CONSULTATION = "consultation"
    QUALIFICATION = "qualification"
    PURCHASE = "purchase"
    ONBOARDING = "onboarding"
    ACTIVE = "active"
    LOYAL = "loyal"
    ADVOCATE = "advocate"


@dataclass
class JourneyDetection:
    """Result of journey stage detection."""
    stage: JourneyStage
    confidence: float
    reasoning: Dict[str, Any]
    recommended_action: str
    time_in_stage_days: Optional[int] = None


class JourneyEngine:
    """
    Detects customer journey stage based on:
    - Interaction history
    - Purchase history
    - Time as customer
    - Engagement level
    - Account status
    - Support interactions
    
    Pluggable for extension.
    """
    
    def __init__(self):
        """Initialize journey detection rules."""
        self.custom_rules: list = []
        
        # Thresholds for automatic detection
        self.thresholds = {
            "visitor_max_days": 7,
            "interest_interactions": 3,
            "discovery_time_days": 14,
            "consultation_time_days": 30,
            "active_purchases": 1,
            "loyal_purchases": 3,
            "loyal_time_days": 180,
        }
    
    def register_custom_rule(self, rule_func: callable):
        """Register custom journey detection rule."""
        self.custom_rules.append(rule_func)
    
    def detect(self, customer_data: Dict[str, Any]) -> JourneyDetection:
        """
        Detect customer journey stage.
        
        Input expected:
        - first_interaction_date (datetime)
        - last_interaction_date (datetime)
        - total_interactions (int)
        - has_purchased (bool)
        - purchase_count (int)
        - has_paid_subscription (bool)
        - days_as_customer (int)
        - support_tickets (int)
        - nps_score (optional)
        - referral_source (optional)
        """
        
        # 1. Check custom rules
        for rule in self.custom_rules:
            result = rule(customer_data)
            if result:
                return result
        
        # 2. If has made purchase
        if customer_data.get("has_purchased", False):
            
            # Advocate: Refers others / NPS positive
            if (customer_data.get("nps_score", 0) >= 9 or 
                customer_data.get("referrals_made", 0) > 0):
                return JourneyDetection(
                    stage=JourneyStage.ADVOCATE,
                    confidence=0.9,
                    reasoning={
                        "reason": "Active promoter of service",
                        "nps_score": customer_data.get("nps_score"),
                    },
                    recommended_action="nurture_advocate"
                )
            
            # Loyal: Multiple purchases, long tenure
            purchase_count = customer_data.get("purchase_count", 1)
            days_customer = customer_data.get("days_as_customer", 0)
            
            if (purchase_count >= self.thresholds["loyal_purchases"] or
                days_customer >= self.thresholds["loyal_time_days"]):
                return JourneyDetection(
                    stage=JourneyStage.LOYAL,
                    confidence=0.95,
                    reasoning={
                        "reason": "Long-term customer",
                        "purchases": purchase_count,
                        "tenure_days": days_customer,
                    },
                    recommended_action="retain_loyal_customer",
                    time_in_stage_days=days_customer
                )
            
            # Active: Current customer with recent interaction
            if customer_data.get("has_paid_subscription", False):
                return JourneyDetection(
                    stage=JourneyStage.ACTIVE,
                    confidence=0.9,
                    reasoning={"reason": "Active paid customer"},
                    recommended_action="support_active_customer"
                )
            
            # Onboarding: Just purchased, setting up
            if days_customer < 30:
                return JourneyDetection(
                    stage=JourneyStage.ONBOARDING,
                    confidence=0.85,
                    reasoning={"reason": "New customer being set up"},
                    recommended_action="onboard_new_customer",
                    time_in_stage_days=days_customer
                )
            
            # Purchase: Already bought
            return JourneyDetection(
                stage=JourneyStage.PURCHASE,
                confidence=0.85,
                reasoning={"reason": "Customer with past purchase"},
                recommended_action="nurture_repeat_purchase"
            )
        
        # 3. If never purchased - check pre-purchase stage
        total_interactions = customer_data.get("total_interactions", 0)
        days_since_first = customer_data.get("days_since_first_interaction", float('inf'))
        
        # Qualification: High engagement, being evaluated
        if total_interactions >= 5 and days_since_first <= 30:
            return JourneyDetection(
                stage=JourneyStage.QUALIFICATION,
                confidence=0.8,
                reasoning={
                    "reason": "Prospect being qualified",
                    "interactions": total_interactions,
                },
                recommended_action="sales_qualification",
                time_in_stage_days=min(days_since_first, 30)
            )
        
        # Consultation: Seeking advice
        if total_interactions >= 3 and days_since_first <= 14:
            return JourneyDetection(
                stage=JourneyStage.CONSULTATION,
                confidence=0.75,
                reasoning={
                    "reason": "Active consultation phase",
                    "interactions": total_interactions,
                },
                recommended_action="consultation_support",
                time_in_stage_days=days_since_first
            )
        
        # Discovery: Learning about solutions
        if total_interactions >= 2:
            return JourneyDetection(
                stage=JourneyStage.DISCOVERY,
                confidence=0.7,
                reasoning={
                    "reason": "Actively discovering solutions",
                    "interactions": total_interactions,
                },
                recommended_action="provide_resources"
            )
        
        # Interest: Some interaction but early
        if total_interactions >= 1:
            return JourneyDetection(
                stage=JourneyStage.INTEREST,
                confidence=0.65,
                reasoning={
                    "reason": "Initial interest shown",
                    "interactions": total_interactions,
                },
                recommended_action="nurture_lead"
            )
        
        # Visitor: No interactions yet
        return JourneyDetection(
            stage=JourneyStage.VISITOR,
            confidence=0.9,
            reasoning={"reason": "First-time visitor"},
            recommended_action="introduce_solution"
        )


# Backward compatibility: No impact on existing systems
