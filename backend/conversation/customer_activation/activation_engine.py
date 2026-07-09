"""
CUSTOMER ACTIVATION ENGINE
Main orchestrator that receives any conversation and determines next steps.

Responsibilities:
- Accept any conversation from any channel
- Classify the customer automatically
- Determine intent
- Determine priority
- Determine profile
- Prepare the next action

This is the first operational layer between customers and DARWIN.
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, Any, Optional, List
from enum import Enum
try:
    from backend.conversation.services.intelligent_escalation import IntelligentEscalation, EscalationReason
except ImportError:
    from conversation.services.intelligent_escalation import IntelligentEscalation, EscalationReason


class CustomerProfile(str, Enum):
    """Automatically detected customer profiles."""
    POTENTIAL_CLIENT = "potential_client"
    ACTIVE_CLIENT = "active_client"
    LAWYER = "lawyer"
    FIRM = "firm"
    COMPANY = "company"
    ADMIN = "admin"
    NEW_USER = "new_user"
    RETURNING_USER = "returning_user"
    HOT_LEAD = "hot_lead"
    COLD_LEAD = "cold_lead"


class ConversationStatus(str, Enum):
    """Status of a conversation in the activation system."""
    RECEIVED = "received"
    CLASSIFIED = "classified"
    PRIORITY_ASSIGNED = "priority_assigned"
    ACTION_DETERMINED = "action_determined"
    ROUTED = "routed"
    ACTIVE = "active"
    WAITING = "waiting"
    COMPLETED = "completed"
    TRANSFERRED = "transferred"
    ESCALATED = "escalated"


@dataclass
class ActivationDecision:
    """Decision made by the Customer Activation Engine."""
    conversation_id: str
    timestamp: datetime
    
    # Classifications
    detected_profile: CustomerProfile
    confidence_profile: float
    
    # Intent
    detected_intent: str
    confidence_intent: float
    
    # Priority
    priority: 'ConversationPriority'
    
    # Journey
    customer_journey_stage: str
    
    # Next action
    next_action: str
    action_reason: str
    
    # Routing
    should_route_to_darwin: bool
    should_escalate: bool
    escalation_reason: Optional[str] = None
    
    # Metadata
    suggestions: List[str] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def __post_init__(self):
        if not isinstance(self.timestamp, datetime):
            self.timestamp = datetime.now()


@dataclass
class ActivationInput:
    """Input to the Customer Activation Engine."""
    conversation_id: str
    channel: str  # whatsapp, landing, dashboard, api, mobile
    user_id: Optional[str]
    customer_id: Optional[str]
    message_content: str
    message_timestamp: datetime
    conversation_history: Optional[List[Dict[str, Any]]] = None
    user_metadata: Optional[Dict[str, Any]] = None
    context: Optional[Dict[str, Any]] = None
    
    def __post_init__(self):
        if not isinstance(self.message_timestamp, datetime):
            self.message_timestamp = datetime.now()


@dataclass
class ActivationMetrics:
    """Metrics for a single activation."""
    conversation_id: str
    created_at: datetime
    first_response_time: Optional[float] = None  # seconds
    classification_time: float = 0.0  # milliseconds
    priority_assignment_time: float = 0.0  # milliseconds
    action_determination_time: float = 0.0  # milliseconds
    total_activation_time: float = 0.0  # milliseconds


class CustomerActivationEngine:
    """
    Main orchestrator for customer activation.
    
    Receives any conversation and:
    1. Classifies the customer profile
    2. Detects intent
    3. Assigns priority
    4. Determines customer journey stage
    5. Decides next action
    6. Routes appropriately
    
    Pluggable classifiers and engines for extension without code changes.
    """
    
    def __init__(self):
        """Initialize the activation engine with all sub-engines."""
        self.profile_classifiers: Dict[str, Any] = {}  # Profile → Classifier
        self.intent_detectors: Dict[str, Any] = {}  # Intent type → Detector
        self.priority_assigner: Optional[Any] = None
        self.journey_detector: Optional[Any] = None
        self.next_action_engine: Optional[Any] = None
        self.escalation_rules: Optional[Any] = None
        self.suggestion_engine: Optional[Any] = None
        
        # Metrics tracking
        self.metrics_store: List[ActivationMetrics] = []
        
        # Supported profiles (extensible without code change)
        self.supported_profiles = [
            CustomerProfile.POTENTIAL_CLIENT,
            CustomerProfile.ACTIVE_CLIENT,
            CustomerProfile.LAWYER,
            CustomerProfile.FIRM,
            CustomerProfile.COMPANY,
            CustomerProfile.ADMIN,
            CustomerProfile.NEW_USER,
            CustomerProfile.RETURNING_USER,
            CustomerProfile.HOT_LEAD,
            CustomerProfile.COLD_LEAD,
        ]
        
        # Initialize intelligent escalation
        self.intelligent_escalation = IntelligentEscalation()
    
    def register_profile_classifier(self, profile: CustomerProfile, classifier):
        """Register a custom classifier for a profile."""
        self.profile_classifiers[profile.value] = classifier
    
    def register_intent_detector(self, intent_type: str, detector):
        """Register a custom detector for an intent type."""
        self.intent_detectors[intent_type] = detector
    
    def register_priority_assigner(self, assigner):
        """Register the priority assignment engine."""
        self.priority_assigner = assigner
    
    def register_journey_detector(self, detector):
        """Register the customer journey detector."""
        self.journey_detector = detector
    
    def register_next_action_engine(self, engine):
        """Register the next action determination engine."""
        self.next_action_engine = engine
    
    def register_escalation_rules(self, rules):
        """Register escalation rules engine."""
        self.escalation_rules = rules
    
    def register_suggestion_engine(self, engine):
        """Register the suggestion engine."""
        self.suggestion_engine = engine
    
    def activate(self, activation_input: ActivationInput) -> ActivationDecision:
        """
        Main activation flow.
        
        Receives a conversation and determines:
        1. Customer profile
        2. Intent
        3. Priority
        4. Journey stage
        5. Next action
        6. Escalation needs
        7. Suggestions for admin
        """
        start_time = datetime.now()
        
        # Step 1: Classify profile (with confidence)
        profile, confidence = self._classify_profile(activation_input)
        
        # Step 2: Detect intent
        intent, intent_confidence = self._detect_intent(activation_input, profile)
        
        # Step 3: Assign priority
        priority = self._assign_priority(activation_input, profile, intent)
        
        # Step 4: Detect journey stage
        journey_stage = self._detect_journey_stage(activation_input, profile)
        
        # Step 5: Determine next action
        next_action, action_reason = self._determine_next_action(
            activation_input, profile, intent, priority, journey_stage
        )
        
        # Step 6: Check escalation
        should_escalate, escalation_reason = self._check_escalation(
            activation_input, profile, intent, priority
        )
        
        # Step 7: Generate suggestions
        suggestions = self._generate_suggestions(
            activation_input, profile, intent, priority, journey_stage, next_action
        )
        
        # Step 8: Determine routing
        should_route_to_darwin = self._should_route_to_darwin(profile, next_action, should_escalate)
        
        # Record metrics
        end_time = datetime.now()
        total_time = (end_time - start_time).total_seconds() * 1000
        
        metrics = ActivationMetrics(
            conversation_id=activation_input.conversation_id,
            created_at=start_time,
            total_activation_time=total_time
        )
        self.metrics_store.append(metrics)
        
        # Return decision
        return ActivationDecision(
            conversation_id=activation_input.conversation_id,
            timestamp=datetime.now(),
            detected_profile=profile,
            confidence_profile=confidence,
            detected_intent=intent,
            confidence_intent=intent_confidence,
            priority=priority,
            customer_journey_stage=journey_stage,
            next_action=next_action,
            action_reason=action_reason,
            should_route_to_darwin=should_route_to_darwin,
            should_escalate=should_escalate,
            escalation_reason=escalation_reason,
            suggestions=suggestions,
            metadata={
                "activation_time_ms": total_time,
                "channel": activation_input.channel,
                "user_id": activation_input.user_id,
                "customer_id": activation_input.customer_id,
            }
        )
    
    def _classify_profile(self, activation_input: ActivationInput) -> tuple:
        """
        Classify customer profile using real classification logic.
        
        Returns: (profile, confidence_score)
        """
        message_lower = activation_input.message_content.lower()
        metadata = activation_input.user_metadata or {}
        
        # Check for admin
        if metadata.get("is_admin"):
            return CustomerProfile.ADMIN, 1.0
        
        # Check if returning customer
        is_returning = metadata.get("is_returning", False)
        existing_customer_id = activation_input.customer_id
        
        # Check for lawyer profile
        lawyer_signals = [
            "abogado", "profesional", "unirme", "registrar", "casos",
            "clientes", "plataforma", "trabajo", "oportunidad", "comisión"
        ]
        lawyer_score = sum(1 for signal in lawyer_signals if signal in message_lower)
        
        # Check for firm profile
        firm_signals = [
            "firma", "empresa", "bufete", "equipo", "abogados",
            "escalabilidad", "partnership", "integración", "solución",
            "volumen", "múltiples casos", "gestión"
        ]
        firm_score = sum(1 for signal in firm_signals if signal in message_lower)
        
        # Check for client profile
        client_signals = [
            "necesito", "ayuda", "abogado", "legal", "problema",
            "contrato", "demanda", "divorcio", "herencia", "caso",
            "asesoría", "consulta", "defensa", "reclamo", "deuda"
        ]
        client_score = sum(1 for signal in client_signals if signal in message_lower)
        
        # Determine profile based on highest score
        max_score = max(lawyer_score, firm_score, client_score)
        
        if max_score > 0:
            if lawyer_score == max_score:
                confidence = min(0.95, 0.5 + (lawyer_score * 0.1))
                return CustomerProfile.LAWYER, confidence
            elif firm_score == max_score:
                confidence = min(0.95, 0.5 + (firm_score * 0.1))
                return CustomerProfile.FIRM, confidence
            else:
                confidence = min(0.95, 0.5 + (client_score * 0.1))
                if is_returning or existing_customer_id:
                    return CustomerProfile.ACTIVE_CLIENT, confidence
                return CustomerProfile.POTENTIAL_CLIENT, confidence
        
        # No clear signals - classify based on customer status
        if is_returning or existing_customer_id:
            return CustomerProfile.RETURNING_USER, 0.7
        return CustomerProfile.NEW_USER, 0.6
    
    def _detect_intent(self, activation_input: ActivationInput, profile: CustomerProfile) -> tuple:
        """
        Detect intent from message using real detection logic.
        
        Returns: (intent_string, confidence_score)
        """
        message_lower = activation_input.message_content.lower()
        
        # Urgent intent
        urgent_patterns = [
            "urgente", "ahora", "inmediato", "emergencia", "critico",
            "emergency", "asap", "hoy mismo", "sin demora"
        ]
        if any(pattern in message_lower for pattern in urgent_patterns):
            return "urgent", 0.95
        
        # Sales intent
        sales_patterns = [
            "precio", "costo", "cuanto", "tarifa", "plan",
            "servicio", "contratar", "quiero", "necesito",
            "empezar", "comenzar", "información", "oferta"
        ]
        sales_matches = sum(1 for pattern in sales_patterns if pattern in message_lower)
        if sales_matches >= 2:
            return "sales", min(0.9, 0.5 + (sales_matches * 0.1))
        
        # Support intent
        support_patterns = [
            "no funciona", "error", "problema técnico", "ayuda",
            "no puedo", "se cayó", "lento", "contraseña", "acceso"
        ]
        support_matches = sum(1 for pattern in support_patterns if pattern in message_lower)
        if support_matches >= 2:
            return "support", min(0.85, 0.5 + (support_matches * 0.1))
        
        # Legal case intent
        legal_patterns = [
            "caso", "demanda", "divorcio", "herencia", "testamento",
            "contrato", "litigio", "asesoría legal", "consulta"
        ]
        legal_matches = sum(1 for pattern in legal_patterns if pattern in message_lower)
        if legal_matches >= 1:
            return "legal_case", min(0.9, 0.6 + (legal_matches * 0.1))
        
        # Partnership intent
        partnership_patterns = [
            "partnership", "alianza", "colaboración", "asociación",
            "firma", "empresa", "volumen", "múltiples", "integración"
        ]
        partnership_matches = sum(1 for pattern in partnership_patterns if pattern in message_lower)
        if partnership_matches >= 2:
            return "partnership", min(0.85, 0.5 + (partnership_matches * 0.1))
        
        # Default to inquiry
        return "inquiry", 0.5
    
    def _assign_priority(
        self, 
        activation_input: ActivationInput, 
        profile: CustomerProfile,
        intent: str
    ) -> 'ConversationPriority':
        """Assign priority to conversation."""
        if self.priority_assigner:
            return self.priority_assigner.assign(activation_input, profile, intent)
        # Default: NORMAL priority
        from .priority_engine import ConversationPriority
        return ConversationPriority.NORMAL
    
    def _detect_journey_stage(
        self,
        activation_input: ActivationInput,
        profile: CustomerProfile
    ) -> str:
        """Detect customer journey stage."""
        if self.journey_detector:
            return self.journey_detector.detect(activation_input, profile)
        # Default: VISITOR stage
        return "visitor"
    
    def _determine_next_action(
        self,
        activation_input: ActivationInput,
        profile: CustomerProfile,
        intent: str,
        priority: 'ConversationPriority',
        journey_stage: str
    ) -> tuple:
        """
        Determine next action based on profile, intent, and priority.
        
        Returns: (action_string, reason_string)
        """
        if self.next_action_engine:
            return self.next_action_engine.determine(
                activation_input, profile, intent, priority, journey_stage
            )
        
        # Real action determination logic
        message_lower = activation_input.message_content.lower()
        
        # Urgent cases need immediate escalation
        if intent == "urgent" or priority.value in ["critical", "high"]:
            return "escalate_to_human", "Urgent matter requiring immediate human attention"
        
        # Hot leads need immediate follow-up
        if profile == CustomerProfile.HOT_LEAD or (profile == CustomerProfile.POTENTIAL_CLIENT and intent == "sales"):
            return "create_lead_and_notify_sales", "High-value lead requiring immediate sales follow-up"
        
        # Partnership inquiries
        if profile in [CustomerProfile.FIRM, CustomerProfile.COMPANY] or intent == "partnership":
            return "create_firm_partnership_opportunity", "Firm/company partnership inquiry"
        
        # Lawyer recruitment
        if profile == CustomerProfile.LAWYER:
            return "create_lawyer_onboarding_flow", "Lawyer recruitment - initiate onboarding"
        
        # Legal cases
        if intent == "legal_case":
            return "create_case_or_consultation", "Legal case inquiry - create case or schedule consultation"
        
        # Support issues
        if intent == "support":
            return "route_to_support_agent", "Technical support needed"
        
        # Default: route to appropriate agent
        return "route_to_darwin", "Standard conversation routing"
    
    def _check_escalation(
        self,
        activation_input: ActivationInput,
        profile: CustomerProfile,
        intent: str,
        priority: 'ConversationPriority'
    ) -> tuple:
        """
        Check if escalation is needed using intelligent escalation system.
        
        Returns: (should_escalate, reason)
        """
        # Use intelligent escalation system
        escalation_decision = self.intelligent_escalation.should_escalate(
            profile=profile.value,
            intent=intent,
            priority=priority.value,
            message=activation_input.message_content,
            context={
                "estimated_value": activation_input.user_metadata.get("estimated_value", 0) if activation_input.user_metadata else 0,
                "is_vip": activation_input.user_metadata.get("is_vip", False) if activation_input.user_metadata else False,
                "is_returning_customer": activation_input.user_metadata.get("is_returning", False) if activation_input.user_metadata else False,
            }
        )
        
        if escalation_decision.should_escalate:
            return True, escalation_decision.reason.value
        
        # Fallback to registered escalation rules
        if self.escalation_rules:
            return self.escalation_rules.should_escalate(
                activation_input, profile, intent, priority
            )
        
        # Default: no escalation
        return False, None
    
    def _generate_suggestions(
        self,
        activation_input: ActivationInput,
        profile: CustomerProfile,
        intent: str,
        priority: 'ConversationPriority',
        journey_stage: str,
        next_action: str
    ) -> List[str]:
        """Generate suggestions for admin."""
        if self.suggestion_engine:
            return self.suggestion_engine.generate(
                activation_input, profile, intent, priority, journey_stage, next_action
            )
        # Default: empty suggestions
        return []
    
    def _should_route_to_darwin(
        self,
        profile: CustomerProfile,
        next_action: str,
        should_escalate: bool
    ) -> bool:
        """Determine if should route to Darwin."""
        # Route to Darwin unless explicitly escalated
        return not should_escalate and next_action == "route_to_darwin"


# Backward compatibility: No changes to existing router
# This engine is purely additive
