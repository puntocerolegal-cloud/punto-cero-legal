# DARWIN INTEGRATION MAP
## Complete Call Chain and Data Flow

**Status:** ✅ MAP COMPLETE - NO CHANGES MADE  
**Sprint:** Release 1.1 Sprint 1  

---

## OVERVIEW

This document maps:
1. **WHO calls WHO** - Function/method calls
2. **WHAT data flows** - Data structures passed
3. **WHEN it happens** - Call sequence
4. **WHERE it's stored** - Memory/persistence
5. **WHY it's needed** - Business purpose

---

## INTEGRATION FLOW: COMPLETE CALL CHAIN

```
┌──────────────────────────────────────────────────────────────────┐
│ COMPLETE CONVERSATION FLOW                                        │
└──────────────────────────────────────────────────────────────────┘

1. CUSTOMER INPUT (Any Channel)
   ├─ WhatsApp: Message arrives
   ├─ Landing: Contact form submitted
   ├─ Dashboard: Authenticated user sends message
   ├─ API: External system sends request
   └─ Mobile: App user sends message

2. CHANNEL ADAPTER (Parse Input)
   ├─ WhatsAppChannel.parse_message(raw_input)
   │   └─ Returns: ChannelMessage {content, channel_type, user_id, context}
   ├─ LandingChannel.parse_message(form_data)
   │   └─ Returns: ChannelMessage {content, channel_type, timestamp}
   ├─ DashboardChannel.parse_message(authenticated_input)
   │   └─ Returns: ChannelMessage {content, channel_type, user_id}
   ├─ ApiChannel.parse_message(api_payload)
   │   └─ Returns: ChannelMessage {content, channel_type, metadata}
   └─ MobileChannel.parse_message(app_input)
       └─ Returns: ChannelMessage {content, channel_type, user_id}

3. CUSTOMER ACTIVATION ENGINE
   
   CustomerActivationEngine.activate(ActivationInput)
   {
       message_content: str
       channel: str
       user_id: Optional[str]
       customer_id: Optional[str]
       conversation_history: Optional[List]
       user_metadata: Optional[Dict]
   }
   
   Step 3a: Classify Profile
   │  LeadClassifier.classify(customer_data)
   │  └─ Output: (CustomerProfile enum, confidence_score)
   │     Examples: FIRM, LAWYER, CLIENT, SUPPLIER, SUPPORT, ADMIN, UNKNOWN
   │
   Step 3b: Detect Intent
   │  IntentDetector.detect_intent(message_content, profile)
   │  └─ Output: (intent_string, confidence_score)
   │     Examples: legal_emergency, pricing_inquiry, sales_inquiry, support
   │
   Step 3c: Assign Priority
   │  PriorityEngine.assign(customer_data, profile, intent)
   │  └─ Output: ConversationPriority enum
   │     Examples: CRITICAL (5min SLA) → HIGH → NORMAL → LOW
   │
   Step 3d: Detect Journey Stage
   │  JourneyEngine.detect(customer_data, profile)
   │  └─ Output: JourneyStage enum
   │     Examples: VISITOR → INTEREST → DISCOVERY → CONSULTATION → ...
   │
   Step 3e: Determine Next Action
   │  NextActionEngine.determine(profile, intent, priority, journey)
   │  └─ Output: (NextAction enum, reason_string)
   │     Examples: ROUTE_TO_DARWIN, SEND_TO_ADMIN, CREATE_LEAD, etc.
   │
   Step 3f: Check Escalation
   │  EscalationRules.should_escalate(profile, intent, priority)
   │  └─ Output: (should_escalate: bool, reason: str)
   │
   Step 3g: Generate Suggestions
   │  SuggestionEngine.generate(profile, intent, priority, journey)
   │  └─ Output: List[AdminSuggestion] with priorities
   │
   Step 3h: Collect Metrics
   │  MetricsCollector.start_conversation(conversation_id, channel)
   │  └─ Output: ConversationMetrics object for tracking
   │
   ActivationDecision OUTPUT:
   {
       detected_profile: CustomerProfile
       confidence_profile: float (0.0-1.0)
       detected_intent: str
       confidence_intent: float
       priority: ConversationPriority
       customer_journey_stage: str
       next_action: str
       should_route_to_darwin: bool
       should_escalate: bool
       escalation_reason: Optional[str]
       suggestions: List[AdminSuggestion]
       metadata: Dict[channel, user_id, customer_id, etc.]
   }

4. CONVERSATION ROUTER
   
   ConversationRouter.route(
       message: str,
       channel: str,
       user_context: Dict = ActivationDecision.metadata,
       conversation_history: Optional[List]
   )
   
   NOTE: In integration, Router should receive ActivationDecision
   to avoid re-detecting profile/intent
   
   RoutingDecision OUTPUT:
   {
       channel: str (whatsapp/landing/dashboard/api/mobile)
       context: Dict (with detected profile, intent, priority)
       intention: str (from activation detection)
       selected_agent: str (commercial/lawyer/firm/support/client)
       confidence: float (routing confidence)
       metadata: Dict
   }

5. MEMORY LOADING
   
   MemoryManager.get_memory(user_id, conversation_id)
   ├─ Load ConversationMemory (messages, participants)
   ├─ Load ClientMemory (cases, contact info)
   ├─ Load BusinessMemory (rules, policies)
   └─ Load PreferencesMemory (language, timezone)
   
   OUTPUT: Dictionary of memory objects for context

6. AGENT SELECTION & PROCESSING
   
   Selected Agent (based on RoutingDecision.selected_agent):
   
   IF selected_agent == "commercial":
       CommercialAgent.process_message(
           message: str,
           context: ConversationContext,
           conversation_history: Optional[List],
           memory_data: Dict,
           activated_insights: ActivationDecision
       )
   
   ELSE IF selected_agent == "lawyer":
       LawyerAgent.process_message(...)
   
   ELSE IF selected_agent == "support":
       SupportAgent.process_message(...)
   
   [Similar for other agents]
   
   AgentResponse OUTPUT:
   {
       content: str (response text - empty if Phase 1)
       agent_type: str
       channel: str
       timestamp: datetime
       confidence: float (0.0 in Phase 1)
       metadata: Dict
       requires_escalation: bool
   }

7. COMMERCIAL DECISION SERVICE
   
   CommercialDecisionService.decide_next_step(
       conversation_state: Dict (from ActivationDecision),
       user_profile: str (from activation),
       detected_intent: str (from activation),
       message_history: Optional[List]
   )
   
   Sub-methods:
   ├─ identify_profile() → str (CLIENT/LAWYER/FIRM/etc)
   ├─ detect_commercial_opportunity() → Optional[Dict]
   ├─ select_playbook() → str (path to playbook)
   ├─ recommend_escalation() → bool
   └─ recommend_action() → str
   
   DecisionResult OUTPUT:
   {
       recommended_action: str
       selected_playbook: Optional[str]
       next_phase: Optional[str]
       commercial_opportunity: Optional[Dict]
       requires_escalation: bool
       reasoning: Dict
       confidence: float
       metadata: Dict
   }

8. KNOWLEDGE LOOKUP
   
   [NOT YET IMPLEMENTED - NEEDS KnowledgeLoader SERVICE]
   
   KnowledgeLoader.load_playbook(playbook_name: str)
   └─ Load from: backend/conversation/playbooks/{playbook_name}.md
      Returns: Playbook content
   
   KnowledgeLoader.load_knowledge(knowledge_topic: str)
   └─ Load from: backend/conversation/knowledge/{topic}.md
      Returns: Knowledge content
   
   KnowledgeLoader.load_policies()
   └─ Load from: backend/conversation/policies/*.md
      Returns: Policy rules

9. DARWIN PERSONALITY INJECTION
   
   DarwinPersonality.get_system_prompt()
   ├─ core_values: List
   ├─ tone: str (professional, empathetic, clear, patient)
   ├─ rules: Dict (what to do/how)
   ├─ prohibitions: List (what never to do)
   └─ response_guidelines: List
   
   OUTPUT: System prompt string for AI

10. AI RESPONSE GENERATION
    
    [FUTURE: Claude/Gemini Integration]
    
    AI_Service.generate_response(
        user_message: str,
        system_prompt: str (from DarwinPersonality),
        knowledge_context: Dict (from KnowledgeLoader),
        conversation_history: List,
        playbook_rules: Dict
    )
    
    OUTPUT: AI-generated response text

11. RESPONSE BUILDER
    
    ResponseBuilder.build_response(
        ai_response: str,
        agent_type: str,
        channel_type: ChannelType,
        metadata: Dict
    )
    
    ├─ Format for channel type
    ├─ Add next steps/suggestions
    ├─ Include disclaimers if needed
    └─ Add metadata
    
    ConversationResponse OUTPUT:
    {
        response_id: str
        content: str (formatted response)
        response_type: str
        agent_type: str
        channel_type: ChannelType
        timestamp: datetime
        next_steps: List[str]
        escalation_recommended: bool
    }

12. CHANNEL RESPONSE SEND
    
    Selected Channel (from ChannelType):
    
    IF channel_type == "whatsapp":
        WhatsAppChannel.send_response(ConversationResponse)
        └─ Send via WhatsApp API
    
    ELSE IF channel_type == "landing":
        LandingChannel.send_response(ConversationResponse)
        └─ Store in session/email/queue
    
    ELSE IF channel_type == "dashboard":
        DashboardChannel.send_response(ConversationResponse)
        └─ Update real-time dashboard
    
    ELSE IF channel_type == "api":
        ApiChannel.send_response(ConversationResponse)
        └─ Return JSON response
    
    ELSE IF channel_type == "mobile":
        MobileChannel.send_response(ConversationResponse)
        └─ Push to mobile app

13. CONVERSATION LOGGING
    
    ConversationLogger.log_interaction(
        conversation_id: str,
        user_id: str,
        message: str,
        response: str,
        agent_type: str,
        channel: str,
        duration: float,
        outcome: str
    )
    
    ConversationLog OBJECT:
    {
        log_id: str
        conversation_id: str
        timestamp: datetime
        message_in: str
        response_out: str
        agent: str
        channel: str
        duration_seconds: float
        success: bool
    }
    
    STORAGE: In-memory list (Phase 2 adds MongoDB)

14. METRICS RECORDING
    
    MetricsCollector.record_*(conversation_id, data)
    ├─ record_first_response(response_time)
    ├─ record_conversion(sales_amount)
    ├─ record_abandonment()
    ├─ record_escalation()
    ├─ record_case_created()
    ├─ record_transfer()
    └─ close_conversation()
    
    Aggregated Metrics (over time):
    {
        total_conversations: int
        conversion_rate: float (%)
        abandonment_rate: float (%)
        avg_response_time: float (seconds)
        by_channel: Dict[channel → count]
        by_profile: Dict[profile → count]
        by_intent: Dict[intent → count]
    }

15. CRM INTEGRATION
    
    [NOT YET IMPLEMENTED - NEEDS CRM ADAPTER SERVICE]
    
    IF decision.next_action == "CREATE_LEAD":
        CRMAdapter.create_lead(
            name: str,
            email: str,
            phone: str,
            profile: CustomerProfile,
            intent: str,
            priority: ConversationPriority,
            firm_id: str
        )
        └─ Write to: CRM/Leads table
    
    ELSE IF decision.next_action == "CREATE_CASE":
        CRMAdapter.create_case(
            customer_id: str,
            description: str,
            priority: ConversationPriority,
            agent_assigned: str,
            firm_id: str
        )
        └─ Write to: Cases table
    
    ELSE IF decision.next_action == "CREATE_OPPORTUNITY":
        CRMAdapter.create_opportunity(
            customer_id: str,
            opportunity_type: str,
            estimated_value: float,
            stage: str (from journey_stage),
            firm_id: str
        )
        └─ Write to: Opportunities table

16. MEMORY UPDATES
    
    MemoryManager.save_memory(user_id, conversation_id, updated_memory)
    ├─ Save ConversationMemory (append message to history)
    ├─ Update ClientMemory (if case created)
    ├─ Update BusinessMemory (if rules applied)
    └─ Update PreferencesMemory (if preferences changed)
    
    STORAGE: In-memory update (Phase 2 persists to MongoDB)

17. RESPONSE TO USER
    
    User receives message via original channel
    ├─ WhatsApp: In WhatsApp chat
    ├─ Landing: Email confirmation + follow-up
    ├─ Dashboard: Real-time chat message
    ├─ API: JSON response
    └─ Mobile: App notification + message

END OF FLOW
```

---

## DETAILED CALL SIGNATURES

### 1. Channel Adapter → Activation Engine

```python
# Input
channel_input = {
    "message": "Hi, I need help with a contract",
    "channel": "landing",
    "user_email": "john@company.com",
    "timestamp": "2024-01-15T10:30:00Z"
}

# Channel parses to ChannelMessage
channel_message = ChannelMessage(
    content="Hi, I need help with a contract",
    channel_type="landing",
    channel_user_id="user_12345",
    timestamp=datetime.now(),
    metadata={"email": "john@company.com"},
    context={}
)

# Convert to ActivationInput
activation_input = ActivationInput(
    conversation_id="conv_abc123",
    channel="landing",
    user_id=None,  # Unknown
    customer_id=None,
    message_content="Hi, I need help with a contract",
    message_timestamp=datetime.now(),
    user_metadata={"email": "john@company.com"}
)

# Call activation engine
activation_decision = CustomerActivationEngine().activate(activation_input)

# Output
activation_decision = ActivationDecision(
    conversation_id="conv_abc123",
    timestamp=datetime.now(),
    detected_profile=CustomerProfile.UNKNOWN,
    confidence_profile=0.6,
    detected_intent="sales_inquiry",
    confidence_intent=0.85,
    priority=ConversationPriority.NORMAL,
    customer_journey_stage="discovery",
    next_action="create_lead",
    action_reason="New visitor with clear sales interest",
    should_route_to_darwin=False,
    should_escalate=False,
    suggestions=[
        "New lead with sales interest",
        "Add to nurture sequence"
    ]
)
```

---

### 2. Activation Engine → Router

```python
# Router input (should evolve to accept ActivationDecision)
routing_input = {
    "message": "Hi, I need help with a contract",
    "channel": "landing",
    "user_context": {
        "profile": "unknown",
        "confidence": 0.6,
        "intent": "sales_inquiry",
        "priority": "normal"
    },
    "conversation_history": []
}

# Current router.route() call
routing_decision = ConversationRouter().route(
    message="Hi, I need help with a contract",
    channel="landing",
    user_context=activation_decision.metadata
)

# Output
routing_decision = RoutingDecision(
    channel="landing",
    context={"profile": "unknown", "intent": "sales"},
    intention="sales_inquiry",
    selected_agent="commercial",
    confidence=0.85,
    metadata={"activation_detected": True}
)
```

---

### 3. Router → Agent

```python
# Agent input
agent_input = {
    "message": "Hi, I need help with a contract",
    "context": ConversationContext(...),
    "conversation_history": [],
    "memory_data": {
        "conversation_memory": ConversationMemory(...),
        "client_memory": ClientMemory(...),
        "business_memory": BusinessMemory(...)
    }
}

# Agent call
agent_response = commercial_agent.process_message(
    message="Hi, I need help with a contract",
    context=ConversationContext(...),
    conversation_history=[],
)

# Output
agent_response = AgentResponse(
    content="",  # Phase 1: empty
    agent_type="commercial",
    channel="landing",
    timestamp=datetime.now(),
    confidence=0.0,  # Phase 1: placeholder
    metadata={"status": "awaiting_phase_2"},
    requires_escalation=False
)
```

---

### 4. Agent → Decision Service

```python
# Decision service input
decision_input = {
    "conversation_state": {
        "profile": "unknown",
        "intent": "sales_inquiry",
        "priority": "normal"
    },
    "user_profile": "unknown",
    "detected_intent": "sales_inquiry",
    "message_history": ["Hi, I need help with a contract"]
}

# Decision service call
decision_result = commercial_decision_service.decide_next_step(
    conversation_state=activation_decision.to_dict(),
    user_profile="unknown",
    detected_intent="sales_inquiry",
    message_history=["Hi, I need help with a contract"]
)

# Output
decision_result = DecisionResult(
    recommended_action="create_lead",
    selected_playbook="commercial.md",
    next_phase="lead_nurture",
    commercial_opportunity=None,
    requires_escalation=False,
    reasoning={
        "intent": "sales_inquiry",
        "profile": "unknown",
        "confidence": 0.85
    },
    confidence=0.85,
    metadata={"decision_id": "dec_xyz123"}
)
```

---

### 5. Knowledge Lookup (NOT YET IMPLEMENTED)

```python
# Needed: KnowledgeLoader service

knowledge_loader = KnowledgeLoader()

# Load playbook
playbook = knowledge_loader.load_playbook("commercial")
# Returns: {content, rules, examples, tone}

# Load specific knowledge topic
knowledge = knowledge_loader.load_knowledge("pricing")
# Returns: Pricing information for context

# Load all policies
policies = knowledge_loader.load_policies()
# Returns: {legal.md, privacy.md, security.md, commercial.md}
```

---

### 6. CRM Integration (NOT YET IMPLEMENTED)

```python
# Needed: CRMAdapter service

crm_adapter = CRMAdapter(firm_id="firm_123")

# Create lead
lead_id = crm_adapter.create_lead(
    name="John Doe",
    email="john@company.com",
    phone="+34123456789",
    source="landing",
    profile=CustomerProfile.UNKNOWN,
    intent="sales_inquiry",
    priority=ConversationPriority.NORMAL,
    firm_id="firm_123"
)
# Returns: "lead_abc123"

# Create case
case_id = crm_adapter.create_case(
    customer_id="cust_123",
    title="Contract Review Request",
    description="Customer needs help with contract",
    priority=ConversationPriority.NORMAL,
    assigned_to="lawyer_1",
    firm_id="firm_123"
)
# Returns: "case_xyz789"
```

---

## DATA FLOW BY TYPE

### Profile Classification Flow
```
Input: customer_data Dict
  ├─ interaction_count
  ├─ has_paid
  ├─ total_revenue
  ├─ customer_type (firm/lawyer/individual)
  └─ account_created_days_ago

LeadClassifier.classify()
  ├─ Check if FIRM
  ├─ Check if LAWYER
  ├─ Check if VIP (revenue > $50K)
  ├─ Check if RECURRING (3+ purchases)
  ├─ Check if ACTIVE (current subscription)
  └─ Otherwise COLD/WARM/HOT/UNKNOWN

Output: LeadStatus enum + confidence
```

---

### Priority Assignment Flow
```
Input: conversation context
  ├─ message_content: str
  ├─ customer_type: str
  ├─ is_returning_customer: bool
  └─ time_sensitive: bool

PriorityEngine.assign()
  ├─ Score customer type (+20 VIP, +15 firm/lawyer, +10 client)
  ├─ Keyword analysis (+40 emergency, +20 urgent)
  ├─ Time sensitivity (+15)
  ├─ Returning customer (+5)
  └─ Sum score → CRITICAL/HIGH/NORMAL/LOW

Output: ConversationPriority + SLA
```

---

### Intent Detection Flow
```
Input: message_content: str + profile

IntentDetector.detect_intent()
  ├─ Keyword matching
  ├─ Pattern recognition
  ├─ Profile-specific analysis
  └─ Confidence scoring

Output: intent_string + confidence
  Example: ("sales_inquiry", 0.85)
```

---

### Journey Stage Detection Flow
```
Input: customer_data Dict
  ├─ interaction_count
  ├─ has_purchased
  ├─ days_as_customer
  ├─ purchase_count
  ├─ nps_score
  └─ account_status

JourneyEngine.detect()
  ├─ IF has_purchased:
  │   ├─ IF VIP → ADVOCATE
  │   ├─ IF repeat → LOYAL
  │   ├─ IF <30 days → ONBOARDING
  │   └─ ELSE → ACTIVE
  ├─ ELSE IF high engagement
  │   ├─ IF consultation phase → CONSULTATION
  │   ├─ IF discovery phase → DISCOVERY
  │   └─ ELSE → INTEREST
  └─ ELSE → VISITOR

Output: JourneyStage enum
```

---

## INTEGRATION MATRIX

| Component | Calls | Called By | Data Passes | Status |
|-----------|-------|-----------|-------------|--------|
| Channel | Activation | User | ChannelMessage | ✅ Ready |
| Activation | Router | Channel | ActivationDecision | ⚠️ Needs alignment |
| Router | Agent | Activation | RoutingDecision | ✅ Ready |
| Agent | Decision | Router | AgentResponse | ✅ Ready |
| Decision | Knowledge | Agent | DecisionResult | ❌ Missing |
| Knowledge | Builder | Decision | Knowledge data | ❌ Missing |
| Builder | Channel | Knowledge | Response | ✅ Ready |
| Channel | User | Builder | Channel message | ✅ Ready |
| Logger | Memory | Channel | Log data | ✅ Ready |
| CRM | None | Decision | None | ❌ Missing |

---

## PERSISTENCE POINTS

### Current (In-Memory Only)

1. **Memory System** → In-memory lists
2. **Conversation Log** → In-memory list
3. **Metrics** → In-memory list
4. **Session State** → In-memory dict

### Future (Phase 2: MongoDB)

1. **Conversations** → MongoDB
2. **Client Data** → MongoDB
3. **Metrics** → MongoDB
4. **Logs** → MongoDB (audit trail)

---

## CONCLUSION

**Integration Map Status:** ✅ **COMPLETE**

All integration points identified and documented.

Ready to proceed with Sprint-by-Sprint integration planning.

---

**Version:** 1.0 - Map Complete  
**Status:** ✅ NO CHANGES MADE - DOCUMENTATION ONLY  

