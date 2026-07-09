"""
PRIORITY ENGINE
Automatically assigns priority to conversations.

Priority Levels:
- CRITICAL: Urgent, requires immediate attention
- HIGH: Important, within hours
- NORMAL: Standard, within business hours
- LOW: Can wait, non-urgent
"""

from dataclasses import dataclass
from enum import Enum
from typing import Dict, Any, Optional
from datetime import datetime


class ConversationPriority(str, Enum):
    """Priority levels for conversations."""
    CRITICAL = "critical"
    HIGH = "high"
    NORMAL = "normal"
    LOW = "low"


class PriorityScore(Enum):
    """Internal scoring for priority assignment."""
    CRITICAL = 90  # 90-100
    HIGH = 70      # 70-89
    NORMAL = 40    # 40-69
    LOW = 0        # 0-39


@dataclass
class PriorityDecision:
    """Result of priority assignment."""
    priority: ConversationPriority
    score: int
    reasoning: Dict[str, Any]
    response_sla_minutes: int


class PriorityEngine:
    """
    Assigns priority based on:
    - Customer type (VIP/firm/lawyer/client/unknown)
    - Intent (legal emergency/general/support)
    - Time sensitivity (urgent/normal)
    - Customer history (VIP/recurring/new)
    - Keywords (emergency, urgent, help, etc.)
    
    Pluggable rules for extension.
    """
    
    def __init__(self):
        """Initialize priority rules."""
        self.custom_rules: list = []
        
        # Default SLA: Response time in minutes
        self.sla = {
            ConversationPriority.CRITICAL: 5,
            ConversationPriority.HIGH: 30,
            ConversationPriority.NORMAL: 480,  # 8 hours
            ConversationPriority.LOW: 1440,    # 24 hours
        }
        
        # Urgency keywords
        self.critical_keywords = [
            "emergency", "urgent", "help", "danger", "immediately",
            "now", "critical", "life", "death", "lawsuit", "arrest"
        ]
        
        self.high_keywords = [
            "important", "asap", "soon", "deadline", "quickly",
            "legal", "lawyer", "case", "contract", "document"
        ]
    
    def register_custom_rule(self, rule_func: callable):
        """Register a custom priority rule."""
        self.custom_rules.append(rule_func)
    
    def assign(
        self,
        conversation_data: Dict[str, Any]
    ) -> PriorityDecision:
        """
        Assign priority to a conversation.
        
        Input expected:
        - message_content (str)
        - customer_type (str): vip/firm/lawyer/client/unknown
        - is_returning_customer (bool)
        - keywords (list, optional)
        - time_sensitive (bool, optional)
        """
        
        score = 0
        reasoning = {}
        
        # 1. Check for custom rules
        for rule in self.custom_rules:
            rule_score, rule_reason = rule(conversation_data)
            if rule_score > score:
                score = rule_score
                reasoning.update(rule_reason)
        
        # 2. Customer type scoring
        customer_type = conversation_data.get("customer_type", "unknown").lower()
        if customer_type == "vip":
            score += 20
            reasoning["vip_customer"] = True
        elif customer_type == "firm":
            score += 15
            reasoning["firm_account"] = True
        elif customer_type == "lawyer":
            score += 15
            reasoning["lawyer_account"] = True
        elif customer_type == "client":
            score += 10
            reasoning["existing_client"] = True
        
        # 3. Keyword-based urgency
        message = conversation_data.get("message_content", "").lower()
        
        for keyword in self.critical_keywords:
            if keyword in message:
                score += 40
                reasoning["critical_keyword"] = keyword
                break  # Take first match
        
        if score < 40:  # If not already critical
            for keyword in self.high_keywords:
                if keyword in message:
                    score += 20
                    reasoning["high_keyword"] = keyword
                    break
        
        # 4. Time sensitivity
        if conversation_data.get("time_sensitive", False):
            score += 15
            reasoning["time_sensitive"] = True
        
        # 5. Returning customer bonus
        if conversation_data.get("is_returning_customer", False):
            score += 5
            reasoning["returning_customer"] = True
        
        # Normalize score
        score = min(100, max(0, score))
        
        # Determine priority from score
        if score >= 90:
            priority = ConversationPriority.CRITICAL
        elif score >= 70:
            priority = ConversationPriority.HIGH
        elif score >= 40:
            priority = ConversationPriority.NORMAL
        else:
            priority = ConversationPriority.LOW
        
        return PriorityDecision(
            priority=priority,
            score=score,
            reasoning=reasoning,
            response_sla_minutes=self.sla[priority]
        )
    
    def update_sla(self, priority: ConversationPriority, minutes: int):
        """Update SLA for a priority level."""
        self.sla[priority] = minutes


# Backward compatibility: No impact on existing systems
