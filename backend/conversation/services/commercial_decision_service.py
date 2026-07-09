"""
CommercialDecisionService

Responsible for:
- Deciding next step in conversation
- Identifying commercial opportunities
- Selecting appropriate playbook
- Recommending actions

Does NOT respond directly to users - only decides.
"""

from typing import Optional, Dict, Any
from datetime import datetime
from dataclasses import dataclass


@dataclass
class DecisionResult:
    """Result of commercial decision logic"""
    recommended_action: str
    selected_playbook: Optional[str]
    next_phase: Optional[str]
    commercial_opportunity: Optional[Dict[str, Any]]
    requires_escalation: bool
    reasoning: Dict[str, Any]
    confidence: float
    metadata: Dict[str, Any]


class CommercialDecisionService:
    """
    Makes intelligent decisions about conversation flow.
    
    Does NOT respond to user - only decides what should happen next.
    
    Responsibilities:
    - Analyze conversation state
    - Identify user profile
    - Detect commercial opportunities
    - Select appropriate playbook
    - Recommend escalation
    - Guide conversation progression
    """
    
    def __init__(self):
        self.service_id = "commercial-decision-service-v1"
        self.version = "1.0.0"
        self.created_at = datetime.now()
        
        # Playbook mapping
        self.playbooks = {
            "client": "backend/conversation/playbooks/client.md",
            "lawyer": "backend/conversation/playbooks/lawyer.md",
            "firm": "backend/conversation/playbooks/firm.md",
            "support": "backend/conversation/playbooks/support.md",
            "commercial": "backend/conversation/playbooks/commercial.md"
        }
    
    def decide_next_step(
        self,
        conversation_state: Dict[str, Any],
        user_profile: str,
        detected_intent: Optional[str],
        message_history: Optional[list] = None
    ) -> DecisionResult:
        """
        Decide the next step in conversation.
        
        Args:
            conversation_state: Current state of conversation
            user_profile: Identified user profile
            detected_intent: Primary detected intention
            message_history: Previous messages for context
            
        Returns:
            DecisionResult with recommended action
        """
        
        reasoning = {
            "user_profile": user_profile,
            "detected_intent": detected_intent,
            "decision_basis": []
        }
        
        # Determine recommended playbook
        selected_playbook = self._select_playbook(user_profile)
        reasoning["decision_basis"].append(f"Profile matched to {selected_playbook}")
        
        # Identify commercial opportunity
        opportunity = self._identify_opportunity(user_profile, detected_intent)
        if opportunity:
            reasoning["decision_basis"].append(f"Commercial opportunity identified: {opportunity['type']}")
        
        # Determine if escalation needed
        requires_escalation = self._should_escalate(
            user_profile,
            detected_intent,
            len(message_history or [])
        )
        
        if requires_escalation:
            reasoning["decision_basis"].append("Escalation required")
        
        # Recommend next action
        action = self._recommend_action(
            user_profile,
            detected_intent,
            requires_escalation
        )
        
        return DecisionResult(
            recommended_action=action,
            selected_playbook=selected_playbook,
            next_phase=self._determine_next_phase(user_profile, detected_intent),
            commercial_opportunity=opportunity,
            requires_escalation=requires_escalation,
            reasoning=reasoning,
            confidence=0.85,  # Phase 2: Calculate based on signals
            metadata={
                "decision_timestamp": datetime.now().isoformat(),
                "service_version": self.version
            }
        )
    
    def identify_profile(
        self,
        message: str,
        message_history: Optional[list] = None
    ) -> Dict[str, Any]:
        """
        Analyze message to identify user profile.
        
        Returns profile classification with confidence.
        Phase 2: Will use NLP/ML for better detection.
        """
        
        signals = {
            "client_signals": 0,
            "lawyer_signals": 0,
            "firm_signals": 0,
            "support_signals": 0
        }
        
        keywords = {
            "client": ["legal advice", "abogado", "asesoría", "problema legal", "consulta"],
            "lawyer": ["independiente", "oficina virtual", "clientes", "práctica privada"],
            "firm": ["despacho", "equipo", "digitalización", "casos"],
            "support": ["no puedo", "no funciona", "error", "acceso", "ayuda"]
        }
        
        message_lower = message.lower()
        
        for profile, kw_list in keywords.items():
            for keyword in kw_list:
                if keyword in message_lower:
                    signals[f"{profile}_signals"] += 1
        
        # Determine highest profile
        max_signals = max(signals.values())
        if max_signals == 0:
            return {
                "profile": "unknown",
                "confidence": 0.0,
                "signals": signals
            }
        
        for profile, count in signals.items():
            if count == max_signals:
                profile_name = profile.split("_")[0]
                return {
                    "profile": profile_name,
                    "confidence": min(0.9, max_signals / 3),  # Simple confidence calc
                    "signals": signals
                }
    
    def _select_playbook(self, user_profile: str) -> str:
        """Select appropriate playbook for profile"""
        
        playbook_map = {
            "client": "client",
            "lawyer": "lawyer",
            "firm": "firm",
            "support": "support",
            "unknown": "commercial"
        }
        
        return playbook_map.get(user_profile, "commercial")
    
    def _identify_opportunity(
        self,
        user_profile: str,
        detected_intent: Optional[str]
    ) -> Optional[Dict[str, Any]]:
        """Identify commercial opportunity based on profile and intent"""
        
        opportunities = {
            "client": {
                "legal_consultation": {
                    "type": "consultation_upgrade",
                    "value": "professional_representation"
                },
                "case_tracking": {
                    "type": "ongoing_support",
                    "value": "premium_plan"
                }
            },
            "lawyer": {
                "practice_growth": {
                    "type": "virtual_office",
                    "value": "professional_network"
                },
                "client_access": {
                    "type": "network_expansion",
                    "value": "referral_network"
                }
            },
            "firm": {
                "efficiency": {
                    "type": "digitalization",
                    "value": "process_optimization"
                },
                "scaling": {
                    "type": "team_tools",
                    "value": "collaboration_platform"
                }
            }
        }
        
        if user_profile in opportunities:
            if detected_intent and detected_intent in opportunities[user_profile]:
                return opportunities[user_profile][detected_intent]
        
        return None
    
    def _should_escalate(
        self,
        user_profile: str,
        detected_intent: Optional[str],
        message_count: int
    ) -> bool:
        """Determine if conversation should be escalated"""
        
        escalation_triggers = {
            "client": [
                "urgent_case",
                "litigation",
                "complex_legal"
            ],
            "lawyer": [
                "high_volume_opportunity",
                "partnership_inquiry"
            ],
            "firm": [
                "enterprise_request",
                "custom_solution",
                "large_implementation"
            ]
        }
        
        if user_profile in escalation_triggers:
            if detected_intent in escalation_triggers[user_profile]:
                return True
        
        # Escalate if complex (many messages without resolution)
        if message_count > 5 and not detected_intent:
            return True
        
        return False
    
    def _recommend_action(
        self,
        user_profile: str,
        detected_intent: Optional[str],
        requires_escalation: bool
    ) -> str:
        """Recommend specific action for conversation"""
        
        if requires_escalation:
            return "escalate_to_specialist"
        
        action_map = {
            "client": "schedule_consultation",
            "lawyer": "present_virtual_office",
            "firm": "request_demo",
            "support": "resolve_issue"
        }
        
        return action_map.get(user_profile, "continue_discovery")
    
    def _determine_next_phase(
        self,
        user_profile: str,
        detected_intent: Optional[str]
    ) -> str:
        """Determine appropriate next conversation phase"""
        
        if user_profile == "unknown":
            return "CLASSIFICATION"
        elif detected_intent:
            return "RECOMMENDATION"
        else:
            return "GUIDANCE"
    
    def get_service_status(self) -> Dict[str, Any]:
        """Get service status and capabilities"""
        return {
            "service_id": self.service_id,
            "version": self.version,
            "created_at": self.created_at.isoformat(),
            "status": "initialized",
            "capabilities": [
                "profile_identification",
                "opportunity_detection",
                "playbook_selection",
                "escalation_logic",
                "next_step_recommendation"
            ],
            "phase": "1_decision_framework",
            "awaiting_implementation": "Phase 2 - Integrate with NLP"
        }
