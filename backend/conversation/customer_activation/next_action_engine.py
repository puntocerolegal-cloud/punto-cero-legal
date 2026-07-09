"""
NEXT ACTION ENGINE
Decides what should happen next for a conversation.

Possible Actions:
- route_to_darwin: Send to AI response system
- send_to_admin: Escalate to human administrator
- create_case: Create support case
- create_lead: Register as potential customer
- create_opportunity: Mark as sales opportunity
- request_more_info: Ask for additional information
- schedule_call: Propose call with specialist
- schedule_meeting: Propose meeting with firm
- transfer_to_lawyer: Route to specific lawyer
- transfer_to_firm: Route to firm
- wait_for_response: Pause and wait for admin response
- queue_for_later: Queue for later handling
"""

from dataclasses import dataclass
from enum import Enum
from typing import Dict, Any, Optional, Tuple


class NextAction(str, Enum):
    """Possible next actions in conversation flow."""
    ROUTE_TO_DARWIN = "route_to_darwin"
    SEND_TO_ADMIN = "send_to_admin"
    CREATE_CASE = "create_case"
    CREATE_LEAD = "create_lead"
    CREATE_OPPORTUNITY = "create_opportunity"
    REQUEST_MORE_INFO = "request_more_info"
    SCHEDULE_CALL = "schedule_call"
    SCHEDULE_MEETING = "schedule_meeting"
    TRANSFER_TO_LAWYER = "transfer_to_lawyer"
    TRANSFER_TO_FIRM = "transfer_to_firm"
    WAIT_FOR_RESPONSE = "wait_for_response"
    QUEUE_FOR_LATER = "queue_for_later"


@dataclass
class ActionDecision:
    """Result of next action determination."""
    action: NextAction
    reasoning: Dict[str, Any]
    required_data: Dict[str, str]  # What info is needed for this action
    estimated_time_minutes: int
    fallback_action: Optional[NextAction] = None


class NextActionEngine:
    """
    Determines what should happen next based on:
    - Customer profile
    - Detected intent
    - Priority level
    - Journey stage
    - Previous interactions
    - Availability
    
    Pluggable decision rules.
    """
    
    def __init__(self):
        """Initialize action decision rules."""
        self.custom_rules: list = []
        
        # Default estimated handling times (minutes)
        self.handling_times = {
            NextAction.ROUTE_TO_DARWIN: 0,  # Immediate
            NextAction.SEND_TO_ADMIN: 5,
            NextAction.CREATE_CASE: 2,
            NextAction.CREATE_LEAD: 1,
            NextAction.CREATE_OPPORTUNITY: 3,
            NextAction.REQUEST_MORE_INFO: 0,
            NextAction.SCHEDULE_CALL: 10,
            NextAction.SCHEDULE_MEETING: 20,
            NextAction.TRANSFER_TO_LAWYER: 5,
            NextAction.TRANSFER_TO_FIRM: 5,
            NextAction.WAIT_FOR_RESPONSE: 0,
            NextAction.QUEUE_FOR_LATER: 0,
        }
    
    def register_custom_rule(self, rule_func: callable):
        """Register a custom decision rule."""
        self.custom_rules.append(rule_func)
    
    def determine(
        self,
        profile: str,
        intent: str,
        priority: str,
        journey_stage: str,
        conversation_data: Dict[str, Any]
    ) -> Tuple[NextAction, str]:
        """
        Determine next action.
        
        Returns: (action, reasoning_string)
        """
        
        # 1. Check custom rules first
        for rule in self.custom_rules:
            action = rule(profile, intent, priority, journey_stage, conversation_data)
            if action:
                return action, "custom_rule_applied"
        
        # 2. If escalation required
        if conversation_data.get("should_escalate", False):
            return NextAction.SEND_TO_ADMIN, "escalation_required"
        
        # 3. Route by profile
        if profile == "lawyer":
            return NextAction.ROUTE_TO_DARWIN, "lawyer_inquiry"
        
        if profile == "firm":
            return NextAction.ROUTE_TO_DARWIN, "firm_inquiry"
        
        if profile == "supplier":
            return NextAction.SEND_TO_ADMIN, "supplier_requires_admin"
        
        if profile == "support":
            return NextAction.CREATE_CASE, "support_request"
        
        if profile == "admin":
            return NextAction.ROUTE_TO_DARWIN, "admin_internal"
        
        # 4. Route by intent
        if "emergency" in intent or "urgent" in intent:
            return NextAction.SEND_TO_ADMIN, "urgent_intent"
        
        if "general_inquiry" in intent or "information" in intent:
            return NextAction.ROUTE_TO_DARWIN, "darwin_can_help"
        
        if "complaint" in intent or "support" in intent:
            return NextAction.CREATE_CASE, "support_needed"
        
        if "sales" in intent or "pricing" in intent:
            return NextAction.ROUTE_TO_DARWIN, "sales_inquiry"
        
        # 5. Route by priority
        if priority == "critical":
            return NextAction.SEND_TO_ADMIN, "critical_priority"
        
        if priority == "high":
            return NextAction.SEND_TO_ADMIN, "high_priority_escalation"
        
        # 6. Route by journey stage
        if journey_stage in ["visitor", "interest"]:
            return NextAction.CREATE_LEAD, "new_potential_customer"
        
        if journey_stage == "discovery":
            return NextAction.ROUTE_TO_DARWIN, "darwin_for_discovery"
        
        if journey_stage == "consultation":
            return NextAction.SCHEDULE_CALL, "consultation_needed"
        
        if journey_stage == "qualification":
            return NextAction.SEND_TO_ADMIN, "sales_qualification"
        
        if journey_stage == "purchase":
            return NextAction.CREATE_OPPORTUNITY, "purchase_ready"
        
        if journey_stage in ["active", "loyal", "advocate"]:
            return NextAction.ROUTE_TO_DARWIN, "existing_customer"
        
        # 7. Default fallback
        return NextAction.ROUTE_TO_DARWIN, "default_darwin_routing"
    
    def get_required_data(self, action: NextAction) -> Dict[str, str]:
        """Get required data for executing an action."""
        requirements = {
            NextAction.CREATE_CASE: {
                "customer_email": "email",
                "issue_description": "description",
            },
            NextAction.CREATE_LEAD: {
                "customer_name": "string",
                "customer_email": "email",
                "customer_phone": "phone",
                "lead_source": "string",
            },
            NextAction.CREATE_OPPORTUNITY: {
                "customer_id": "id",
                "opportunity_type": "string",
                "estimated_value": "number",
            },
            NextAction.SCHEDULE_CALL: {
                "preferred_times": "datetime_list",
                "specialist_type": "string",
            },
            NextAction.SCHEDULE_MEETING: {
                "preferred_location": "string",
                "meeting_type": "string",
                "participants": "list",
            },
            NextAction.TRANSFER_TO_LAWYER: {
                "lawyer_specialty": "string",
                "lawyer_id": "id",
            },
            NextAction.TRANSFER_TO_FIRM: {
                "firm_type": "string",
                "firm_id": "id",
            },
        }
        return requirements.get(action, {})


# Backward compatibility: No impact on existing systems
