"""
SUGGESTION ENGINE
Generates recommendations for administrators.

Automatically suggests next steps based on conversation analysis.

Examples:
- "Customer ready for call"
- "Customer needs lawyer"
- "Customer needs firm"
- "Customer needs follow-up"
- "High-potential opportunity"
- "Urgent attention needed"
"""

from dataclasses import dataclass
from enum import Enum
from typing import List, Dict, Any


class SuggestionPriority(str, Enum):
    """Priority of a suggestion."""
    URGENT = "urgent"
    HIGH = "high"
    NORMAL = "normal"
    LOW = "low"


@dataclass
class AdminSuggestion:
    """A suggestion for the administrator."""
    suggestion: str
    priority: SuggestionPriority
    reasoning: Dict[str, Any]
    action_type: str
    estimated_value: Optional[float] = None


class SuggestionEngine:
    """
    Generates suggestions for administrators based on:
    - Customer profile
    - Detected intent
    - Journey stage
    - Conversation content
    - Historical patterns
    - Current opportunities
    
    Pluggable rule system.
    """
    
    def __init__(self):
        """Initialize suggestion rules."""
        self.custom_rules: list = []
    
    def register_custom_rule(self, rule_func: callable):
        """Register custom suggestion rule."""
        self.custom_rules.append(rule_func)
    
    def generate(
        self,
        profile: str,
        intent: str,
        priority: str,
        journey_stage: str,
        conversation_data: Dict[str, Any]
    ) -> List[AdminSuggestion]:
        """
        Generate suggestions for administrator.
        
        Returns list of actionable suggestions.
        """
        suggestions: List[AdminSuggestion] = []
        
        # 1. Check custom rules
        for rule in self.custom_rules:
            rule_suggestions = rule(profile, intent, priority, journey_stage, conversation_data)
            if rule_suggestions:
                suggestions.extend(rule_suggestions)
        
        # 2. Profile-based suggestions
        if profile == "lawyer":
            suggestions.append(AdminSuggestion(
                suggestion="Route to specialized lawyer support channel",
                priority=SuggestionPriority.NORMAL,
                reasoning={"type": "profile"},
                action_type="route_to_lawyer_support"
            ))
        
        if profile == "firm":
            suggestions.append(AdminSuggestion(
                suggestion="Consider dedicated account manager for this firm",
                priority=SuggestionPriority.HIGH,
                reasoning={"type": "profile"},
                action_type="assign_account_manager"
            ))
        
        # 3. Intent-based suggestions
        if "emergency" in intent:
            suggestions.append(AdminSuggestion(
                suggestion="Customer reports legal emergency - needs immediate lawyer consultation",
                priority=SuggestionPriority.URGENT,
                reasoning={"type": "intent", "intent": intent},
                action_type="schedule_emergency_call"
            ))
        
        if "price" in intent:
            suggestions.append(AdminSuggestion(
                suggestion="Customer inquiring about pricing - sales opportunity",
                priority=SuggestionPriority.HIGH,
                reasoning={"type": "intent", "intent": intent},
                action_type="send_pricing_info",
                estimated_value=conversation_data.get("estimated_deal_size", 0)
            ))
        
        # 4. Journey stage suggestions
        if journey_stage == "qualification":
            suggestions.append(AdminSuggestion(
                suggestion="Customer is ready for qualification call",
                priority=SuggestionPriority.HIGH,
                reasoning={"type": "journey", "stage": journey_stage},
                action_type="schedule_qualification_call"
            ))
        
        if journey_stage == "purchase":
            suggestions.append(AdminSuggestion(
                suggestion="Customer appears ready to purchase - prepare contract",
                priority=SuggestionPriority.HIGH,
                reasoning={"type": "journey", "stage": journey_stage},
                action_type="prepare_purchase",
                estimated_value=conversation_data.get("estimated_deal_size", 0)
            ))
        
        if journey_stage == "interest":
            suggestions.append(AdminSuggestion(
                suggestion="New lead showing initial interest - nurture with content",
                priority=SuggestionPriority.NORMAL,
                reasoning={"type": "journey", "stage": journey_stage},
                action_type="send_nurture_email"
            ))
        
        # 5. Priority-based suggestions
        if priority == "critical":
            suggestions.append(AdminSuggestion(
                suggestion="Critical priority conversation - requires immediate attention",
                priority=SuggestionPriority.URGENT,
                reasoning={"type": "priority", "priority": priority},
                action_type="escalate_to_supervisor"
            ))
        
        # 6. Engagement level suggestions
        engagement_score = conversation_data.get("engagement_score", 0)
        if engagement_score >= 80:
            suggestions.append(AdminSuggestion(
                suggestion="Highly engaged customer - excellent conversion opportunity",
                priority=SuggestionPriority.HIGH,
                reasoning={"type": "engagement", "score": engagement_score},
                action_type="priority_follow_up",
                estimated_value=conversation_data.get("estimated_deal_size", 0)
            ))
        
        # 7. Timing-based suggestions
        time_since_first_contact = conversation_data.get("days_since_first_contact", 0)
        if 5 < time_since_first_contact < 14:
            suggestions.append(AdminSuggestion(
                suggestion=f"Customer has been in pipeline for {time_since_first_contact} days - needs follow-up",
                priority=SuggestionPriority.NORMAL,
                reasoning={"type": "timing", "days": time_since_first_contact},
                action_type="schedule_follow_up"
            ))
        
        return suggestions


# Backward compatibility: No impact on existing systems
