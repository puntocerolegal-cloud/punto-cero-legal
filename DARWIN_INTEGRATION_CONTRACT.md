# DARWIN INTEGRATION CONTRACT
## Standard Interfaces for All Components

**Status:** ✅ CONTRACT DEFINED - NO CHANGES MADE  
**Purpose:** Define the language all modules speak  

---

## CORE DATA CONTRACTS

### Contract 1: ActivationDecision
**Source:** CustomerActivationEngine  
**Consumers:** ConversationRouter, Agents, Services  

```python
@dataclass
class ActivationDecision:
    conversation_id: str              # Unique ID
    timestamp: datetime               # When created
    detected_profile: CustomerProfile # AUTO: CLIENT/LAWYER/FIRM/SUPPLIER/SUPPORT/ADMIN/UNKNOWN
    confidence_profile: float         # 0.0-1.0 confidence
    detected_intent: str              # AUTO: sales_inquiry, support, emergency, etc.
    confidence_intent: float          # 0.0-1.0 confidence
    priority: ConversationPriority    # CRITICAL/HIGH/NORMAL/LOW
    customer_journey_stage: str       # VISITOR/INTEREST/DISCOVERY/CONSULTATION/etc.
    next_action: str                  # CREATE_LEAD, ROUTE_TO_DARWIN, SEND_TO_ADMIN, etc.
    action_reason: str                # Why this action
    should_route_to_darwin: bool      # Route to AI?
    should_escalate: bool             # Escalate to human?
    escalation_reason: Optional[str]  # Why escalate
    suggestions: List[str]            # Admin recommendations
    metadata: Dict[str, Any]          # Channel, user_id, etc.
```

**Usage:**
```python
# Produced by
activation_decision = CustomerActivationEngine().activate(ActivationInput)

# Consumed by
router.route(..., context=activation_decision.metadata)
agent.process_message(..., activation_insights=activation_decision)
decision_service.decide_next_step(...)
```

---

### Contract 2: RoutingDecision
**Source:** ConversationRouter  
**Consumers:** Agents, Services  

```python
@dataclass
class RoutingDecision:
    channel: str                  # Input channel (whatsapp/landing/dashboard/api/mobile)
    context: Dict[str, Any]       # Full context (include activation insights)
    intention: str                # Detected user intention
    selected_agent: str           # Agent to handle (commercial/lawyer/firm/support/client)
    confidence: float             # Routing confidence (0.0-1.0)
    metadata: Dict[str, Any]      # Additional routing metadata
```

**Usage:**
```python
# Produced by
routing_decision = router.route(
    message=message,
    channel=channel,
    user_context=activation_decision.metadata
)

# Consumed by
agent = agent_factory.get_agent(routing_decision.selected_agent)
agent.process_message(message, context, routing_decision)
```

---

### Contract 3: AgentResponse
**Source:** All Agents  
**Consumers:** DecisionService, ResponseBuilder, Logger  

```python
@dataclass
class AgentResponse:
    content: str                     # Response text (empty in Phase 1)
    agent_type: str                  # Which agent generated
    channel: str                      # Target channel
    timestamp: datetime              # When generated
    metadata: Dict[str, Any]         # Agent metadata
    confidence: float                # Response confidence (0.0-1.0)
    requires_escalation: bool = False # Escalate?
    escalation_reason: Optional[str] = None  # Why escalate
```

**Usage:**
```python
# Produced by
agent_response = agent.process_message(
    message=message,
    context=ConversationContext(...),
    conversation_history=history
)

# Consumed by
decision = decision_service.evaluate(agent_response)
response = response_builder.build(agent_response)
```

---

### Contract 4: ConversationResponse
**Source:** ResponseBuilder  
**Consumers:** Channels  

```python
@dataclass
class ConversationResponse:
    response_id: str              # Unique ID
    content: str                  # Formatted response
    response_type: str            # text/html/json/structured
    agent_type: str               # Which agent
    channel_type: ChannelType     # Target channel
    timestamp: datetime           # When created
    confidence_level: float       # 0.0-1.0
    includes_disclaimer: bool     # Include legal disclaimer
    next_steps: List[str]         # Suggested next actions
    suggested_follow_up: Optional[str]
    escalation_recommended: bool  # Is escalation suggested
    metadata: Dict[str, Any]      # Full context
```

**Usage:**
```python
# Produced by
response = response_builder.build_response(
    agent_response=agent_response,
    channel_type=ChannelType.WHATSAPP
)

# Consumed by
channel_adapter.send_response(response)
logger.log_response(response)
```

---

### Contract 5: DecisionResult
**Source:** CommercialDecisionService  
**Consumers:** Logger, CRM adapter, NextSteps  

```python
@dataclass
class DecisionResult:
    recommended_action: str            # What to do next
    selected_playbook: Optional[str]   # Path to playbook
    next_phase: Optional[str]          # Conversation phase
    commercial_opportunity: Optional[Dict]  # Sales opportunity if any
    requires_escalation: bool          # Escalate?
    reasoning: Dict[str, Any]          # Decision reasoning
    confidence: float                  # 0.0-1.0
    metadata: Dict[str, Any]           # All context
```

**Usage:**
```python
# Produced by
decision = decision_service.decide_next_step(
    conversation_state=activation_decision.to_dict(),
    user_profile=profile,
    detected_intent=intent
)

# Consumed by
if decision.requires_escalation:
    send_to_admin(decision)
if "CREATE_LEAD" in decision.recommended_action:
    crm.create_lead(...)
```

---

### Contract 6: ConversationContext
**Source:** Channels  
**Consumers:** All agents, services  

```python
@dataclass
class ConversationContext:
    user_id: str
    firm_id: str                  # Multi-tenant isolation
    conversation_id: str
    session_id: str
    channel: ChannelType          # INPUT CHANNEL
    user_role: str
    timestamp: datetime = field(default_factory=datetime.now)
    timezone: Optional[str] = None
    language: str = "es"          # Multi-language support
    device_info: Dict[str, Any] = field(default_factory=dict)
    geo_location: Optional[Dict[str, Any]] = None
    additional_context: Dict[str, Any] = field(default_factory=dict)
```

**Usage:**
```python
# Created by
context = ConversationContext(
    user_id="user_123",
    firm_id="firm_456",
    conversation_id="conv_789",
    channel=ChannelType.WHATSAPP
)

# Passed to all agents
agent.process_message(message, context=context)
```

---

## ENUM CONTRACTS

### CustomerProfile Enum
```python
class CustomerProfile(str, Enum):
    CLIENT = "client"
    LAWYER = "lawyer"
    FIRM = "firm"
    SUPPLIER = "supplier"
    SUPPORT = "support"
    ADMIN = "admin"
    UNKNOWN = "unknown"
```

### ConversationPriority Enum
```python
class ConversationPriority(str, Enum):
    CRITICAL = "critical"  # 5 min SLA
    HIGH = "high"          # 30 min SLA
    NORMAL = "normal"      # 8 hour SLA
    LOW = "low"            # 24 hour SLA
```

### JourneyStage Enum
```python
class JourneyStage(str, Enum):
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
```

### ChannelType Enum
```python
class ChannelType(str, Enum):
    WHATSAPP = "whatsapp"
    LANDING = "landing"
    DASHBOARD = "dashboard"
    API = "api"
    MOBILE = "mobile"
```

### NextAction Enum
```python
class NextAction(str, Enum):
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
```

---

## SERVICE CONTRACTS

### Channel Adapter Contract
```python
class ChannelAdapter(ABC):
    @abstractmethod
    def parse_message(self, raw_input) → ChannelMessage:
        """Parse channel-specific input to standard format"""
        pass
    
    @abstractmethod
    def send_response(self, response: ConversationResponse) → bool:
        """Send response via channel"""
        pass
    
    @abstractmethod
    def validate_connection(self) → bool:
        """Verify channel is available"""
        pass
    
    def get_channel_metadata(self) → Dict:
        """Get channel capabilities"""
        pass
```

---

### Base Agent Contract
```python
class BaseAgent(ABC):
    @abstractmethod
    def process_message(
        self, 
        message: str, 
        context: ConversationContext, 
        conversation_history: Optional[List]
    ) → AgentResponse:
        """Process message and generate response"""
        pass
    
    @abstractmethod
    def validate_intent(self, intent: str) → bool:
        """Check if agent handles this intent"""
        pass
    
    @abstractmethod
    def get_agent_type(self) → str:
        """Return agent identifier"""
        pass
```

---

## MULTI-TENANT CONTRACT

**Requirement:** All modules MUST respect firm_id isolation

```python
# Every operation must include firm_id
context = ConversationContext(
    firm_id="firm_123",  # REQUIRED
    user_id="user_456"
)

# Services check firm_id
def create_lead(name, email, firm_id):
    # Verify firm_id access
    # Create lead scoped to firm_id
    pass

# No cross-firm data visibility
def get_leads(firm_id):
    # Only return leads WHERE firm_id = given_id
    pass
```

---

## MULTI-LANGUAGE CONTRACT

**Requirement:** All responses must respect language preference

```python
context = ConversationContext(
    language="es",  # Spanish
    ...
)

# Service respects language
response = build_response(
    message=message,
    language=context.language  # Use "es" for Spanish
)
```

---

## MULTI-CHANNEL CONTRACT

**Requirement:** All responses must be channel-appropriate

```python
# Each channel has different capabilities
channel_capabilities = {
    ChannelType.WHATSAPP: {
        "supports_rich_content": True,
        "supports_file_upload": True,
        "message_limit": 4096
    },
    ChannelType.LANDING: {
        "supports_rich_content": True,
        "supports_file_upload": False,
        "message_limit": None
    },
    ChannelType.DASHBOARD: {
        "supports_rich_content": True,
        "supports_file_upload": True,
        "message_limit": None
    }
}

# Format response for channel
response = response_builder.to_channel_format(
    content=content,
    channel=context.channel,
    capabilities=channel_capabilities[context.channel]
)
```

---

## VERSION CONTRACT

**Requirement:** All modules must specify versions

```python
# Header in each module
__version__ = "1.0.0"
__compatible_versions__ = ["1.0.x", "1.1.x"]

# At runtime
def validate_compatibility(module_version, required_version):
    """Check version compatibility"""
    return (
        module_version == required_version or 
        matches_pattern(module_version, required_version)
    )
```

---

## METRICS CONTRACT

**Requirement:** All interactions must be logged for metrics

```python
# Every conversation must generate metrics
@dataclass
class ConversationMetrics:
    conversation_id: str
    timestamp: datetime
    channel: str
    first_response_time: Optional[float]
    total_duration: Optional[float]
    converted: bool
    abandoned: bool
    escalated: bool
    sales_generated: float
    cases_created: int
```

---

## ERROR HANDLING CONTRACT

**Requirement:** All modules must handle errors gracefully

```python
# Every module must implement
def execute_with_fallback(operation, fallback_action):
    """Execute operation with fallback"""
    try:
        return operation()
    except Exception as e:
        log_error(e)
        return fallback_action()

# Examples
try:
    decision = decision_service.decide(...)
except:
    return ActivationDecision(next_action="SEND_TO_ADMIN")  # Fallback

try:
    response = agent.process(...)
except:
    return AgentResponse(content="", confidence=0.0)  # Fallback
```

---

## EXTENSIBILITY CONTRACT

**Requirement:** All modules must be pluggable

```python
# Register custom implementations
engine.register_profile_classifier(
    profile=CustomerProfile.CLIENT,
    classifier=MyCustomClassifier()
)

engine.register_intent_detector(
    intent_type="custom_intent",
    detector=MyCustomDetector()
)

engine.register_escalation_rule(
    rule=MyCustomEscalationRule()
)

# No code changes required to add new types
```

---

## CONSISTENCY CHECKS

### Profile Classification Consistency
```
If CustomerProfile == FIRM:
  - Confidence should be > 0.8
  - Has firm_id in metadata
  - Has multiple users possible
```

### Priority Assignment Consistency
```
If Priority == CRITICAL:
  - Escalation should = True OR
  - next_action == SEND_TO_ADMIN
```

### Journey Stage Consistency
```
If JourneyStage == PURCHASE:
  - has_purchased == True
  - suggested_action should include sales
```

---

## CONCLUSION

**Contract Status:** ✅ **DEFINED**

All modules have clear, consistent interfaces.

Ready for implementation.

---

**Version:** 1.0 - Contract Complete  
**Status:** ✅ NO CHANGES MADE - CONTRACT ONLY  

