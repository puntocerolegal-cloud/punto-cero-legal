# CUSTOMER ACTIVATION ENGINE
## Architecture and Design Specification

**Phase:** Ω (Omega) - First Operational Layer  
**Status:** ✅ Architecture Complete - No Implementation Yet  
**Date:** 2024  
**Classification:** Punto Cero System OS (Not Legal-specific)  

---

## OVERVIEW

The Customer Activation Engine is the **first operational layer** that bridges DARWIN architecture with real customer interactions.

It operates between raw customer input (from any channel) and routing decisions (to DARWIN, admin, or other systems).

### Core Purpose

**Receive any conversation** → **Classify automatically** → **Determine next action** → **Route appropriately**

---

## CORE MODULES

### 1. CUSTOMER ACTIVATION ENGINE
**File:** `backend/conversation/customer_activation/activation_engine.py`

**Main Orchestrator** - Coordinates all sub-engines.

**Responsibilities:**
- Accept conversations from any channel
- Classify customer profile (with confidence score)
- Detect intent (with confidence score)
- Assign priority level
- Detect customer journey stage
- Determine next action
- Check escalation rules
- Generate suggestions for admin
- Route appropriately
- Track metrics

**Key Classes:**
- `CustomerActivationEngine` - Main orchestrator
- `ActivationInput` - Conversation input format
- `ActivationDecision` - Complete decision output
- `CustomerProfile` - Enum of profile types
- `ConversationStatus` - Enum of conversation states

**Extensibility:**
- Pluggable classifiers for profiles
- Pluggable intent detectors
- Pluggable sub-engines
- All can be registered without code changes

---

### 2. LEAD CLASSIFIER
**File:** `backend/conversation/customer_activation/lead_classifier.py`

**Automatic Lead Lifecycle Classification**

**Classifies customers into:**
- COLD_LEAD - No previous interaction
- WARM_LEAD - Some interest shown
- HOT_LEAD - High interest, ready
- ACTIVE_CLIENT - Current customer
- VIP_CLIENT - High-value customer
- RECURRING_CLIENT - Long-term customer
- FIRM - Legal firm account
- LAWYER - Individual lawyer account

**Algorithm:**
- Analyzes interaction history
- Checks purchase history and revenue
- Evaluates engagement level
- Determines customer lifecycle stage
- Customizable thresholds

**Extensibility:**
- Register custom classifiers per status
- Modify thresholds without code
- Pluggable classification logic

---

### 3. PRIORITY ENGINE
**File:** `backend/conversation/customer_activation/priority_engine.py`

**Automatic Priority Assignment**

**Assigns Levels:**
- CRITICAL (5-min SLA) - Urgent, immediate attention
- HIGH (30-min SLA) - Important, within hours
- NORMAL (8-hour SLA) - Standard, within business day
- LOW (24-hour SLA) - Non-urgent

**Scoring System:**
- Customer type scoring (+20 for VIP, +15 for firm)
- Keyword analysis (critical/urgent words)
- Time sensitivity detection
- Returning customer bonus
- Total score determines level

**Customization:**
- Keyword lists modifiable
- SLA times configurable
- Custom scoring rules
- Register additional rules

---

### 4. NEXT ACTION ENGINE
**File:** `backend/conversation/customer_activation/next_action_engine.py`

**Determines What Happens Next**

**Possible Actions:**
- ROUTE_TO_DARWIN - Send to AI system
- SEND_TO_ADMIN - Escalate to human
- CREATE_CASE - Generate support case
- CREATE_LEAD - Register potential customer
- CREATE_OPPORTUNITY - Mark sales opportunity
- REQUEST_MORE_INFO - Ask for details
- SCHEDULE_CALL - Propose call
- SCHEDULE_MEETING - Propose meeting
- TRANSFER_TO_LAWYER - Route to specialist
- TRANSFER_TO_FIRM - Route to firm
- WAIT_FOR_RESPONSE - Pause for admin
- QUEUE_FOR_LATER - Queue for processing

**Decision Logic:**
- Routes by profile (lawyer/firm/supplier)
- Routes by intent (emergency/sales/support)
- Routes by priority
- Routes by journey stage
- Default fallback to DARWIN

**Extensibility:**
- Custom decision rules
- Profile-specific routing
- Intent-specific routing
- Fallback action support

---

### 5. CUSTOMER JOURNEY ENGINE
**File:** `backend/conversation/customer_activation/journey_engine.py`

**Detects Customer Lifecycle Stage**

**Stages:**
- VISITOR - First viewer, no commitment
- INTEREST - Showing interest
- DISCOVERY - Learning about solutions
- CONSULTATION - Seeking advice
- QUALIFICATION - Being evaluated
- PURCHASE - Buying or bought
- ONBOARDING - New customer setup
- ACTIVE - Current active customer
- LOYAL - Long-term satisfied
- ADVOCATE - Recommends to others

**Detection Criteria:**
- Interaction count
- Time in pipeline
- Purchase history
- Subscription status
- NPS score
- Referral activity

**Extensibility:**
- Custom detection rules
- Configurable thresholds
- Profile-specific paths

---

### 6. METRICS COLLECTOR
**File:** `backend/conversation/customer_activation/metrics.py`

**Tracks Conversation Performance**

**Individual Conversation Metrics:**
- First response time
- Total conversation duration
- Activation processing time
- Classification time
- Opened/closed status
- Conversion tracking
- Abandonment tracking
- Transfer tracking
- Case creation
- Sales generated
- Escalations

**Aggregated Metrics:**
- Conversion rates
- Abandonment rates
- Average response times
- Average conversation duration
- Total sales
- Total cases created
- Escalation rates
- Breakdown by channel, profile, intent

**Extensibility:**
- Custom metric types
- Custom aggregation logic

---

### 7. SUGGESTION ENGINE
**File:** `backend/conversation/customer_activation/suggestion_engine.py`

**Generates Admin Recommendations**

**Types of Suggestions:**
- "Ready for qualification call"
- "Needs lawyer consultation"
- "Needs firm assignment"
- "Needs follow-up"
- "High-potential opportunity"
- "Urgent attention needed"
- "VIP customer - assign account manager"

**Based On:**
- Customer profile
- Detected intent
- Journey stage
- Conversation content
- Engagement level
- Deal size

**Extensibility:**
- Register custom suggestion rules
- Add new suggestion types
- Custom reasoning logic

---

### 8. ESCALATION RULES
**File:** `backend/conversation/customer_activation/escalation_rules.py`

**Determines When to Escalate**

**Built-in Escalation Rules:**
- Emergency/urgent situations
- VIP customers
- Angry/upset customers
- Large transactions (>$50K)
- Complex/international matters
- Repeated escalation attempts
- Critical priority conversations

**Rule System:**
- Each rule is a condition + reason
- Rules can be added without code changes
- Multiple matching rules tracked
- Custom rules register easily

**Extensibility:**
- Register additional rules
- Modify rule conditions
- Add custom escalation triggers

---

## DATA FLOW ARCHITECTURE

```
INPUT
  ↓
[Customer Message from Any Channel]
  ↓
ACTIVATION ENGINE
  ├─→ Profile Classifier → Customer Type
  ├─→ Intent Detector → Intent + Confidence
  ├─→ Priority Engine → Priority Level
  ├─→ Journey Detector → Journey Stage
  ├─→ Next Action Engine → Action Decision
  ├─→ Escalation Rules → Check Escalation
  ├─→ Suggestion Engine → Admin Suggestions
  └─→ Metrics Collector → Track Metrics
  ↓
ACTIVATION DECISION
  Contains:
  - Detected profile + confidence
  - Detected intent + confidence
  - Priority level
  - Journey stage
  - Next action
  - Escalation status
  - Admin suggestions
  - Metadata
  ↓
ROUTING DECISION
  ├→ Route to DARWIN
  ├→ Send to Administrator
  ├→ Create Case/Lead/Opportunity
  ├→ Schedule Call/Meeting
  ├→ Transfer to Specialist
  └→ Queue for Later
  ↓
OUTPUT
  Send to appropriate system
```

---

## PROFILE DETECTION

### Automatically Detected Profiles

```
CLIENT
  ├─ Current paying customer
  ├─ Past customer (recurring)
  ├─ Potential customer (lead)
  └─ One-time customer

LAWYER
  ├─ Individual practitioner
  ├─ Specialized attorney
  ├─ In-house counsel
  └─ Law student/trainee

FIRM
  ├─ Law firm
  ├─ Legal services company
  ├─ Corporate legal dept
  └─ International firm

SUPPLIER
  ├─ Service provider
  ├─ Technology vendor
  ├─ Outsourced services
  └─ Partner company

SUPPORT
  ├─ Existing customer support request
  ├─ System issue report
  ├─ Help request
  └─ Technical support

ADMIN
  ├─ Internal staff
  ├─ Management
  ├─ Team members
  └─ Internal inquiry

UNKNOWN
  └─ Cannot determine profile
```

### Extensibility

New profiles can be added:
1. Add to `CustomerProfile` enum
2. Register classifier
3. No code changes to routing

---

## INTENT DETECTION

### Common Intents

- **legal_emergency** - Urgent legal matter
- **general_inquiry** - General information
- **pricing_inquiry** - Cost/pricing question
- **sales_inquiry** - Purchase interest
- **support_request** - Help needed
- **complaint** - Expressing dissatisfaction
- **consultation** - Seeking advice
- **document_request** - Requesting forms/docs
- **case_status** - Checking case progress
- **billing_inquiry** - Invoice/payment question

### Extensibility

Custom intent detectors register per intent type.

---

## PRIORITY ASSIGNMENT FACTORS

### Scoring Components

| Factor | Points | Trigger |
|--------|--------|---------|
| VIP Customer | +20 | `customer_type == "vip"` |
| Firm Account | +15 | `customer_type == "firm"` |
| Lawyer Account | +15 | `customer_type == "lawyer"` |
| Existing Client | +10 | `is_returning_customer == true` |
| Critical Keyword | +40 | "emergency", "urgent", etc. |
| High Keyword | +20 | "important", "deadline", etc. |
| Time Sensitive | +15 | `time_sensitive == true` |
| Returning Customer | +5 | Previously interacted |

### Score → Priority Mapping

- 90-100: CRITICAL (5 min SLA)
- 70-89: HIGH (30 min SLA)
- 40-69: NORMAL (8 hour SLA)
- 0-39: LOW (24 hour SLA)

---

## JOURNEY STAGE DETECTION

### Signals for Each Stage

```
VISITOR
  ├─ First interaction
  ├─ 0 previous visits
  ├─ No purchase history
  └─ Low engagement

INTEREST
  ├─ 1+ interactions
  ├─ Some content engagement
  ├─ <3 visits
  └─ Initial inquiry shown

DISCOVERY
  ├─ 2+ interactions
  ├─ Multiple pages viewed
  ├─ Exploring options
  └─ Asking detailed questions

CONSULTATION
  ├─ 3+ interactions
  ├─ Detailed questions
  ├─ Seeking advice
  └─ <30 days in pipeline

QUALIFICATION
  ├─ 5+ interactions
  ├─ High engagement
  ├─ Asking specific questions
  └─ Sales being evaluated

PURCHASE
  ├─ Transaction made
  ├─ First order
  ├─ <30 days since purchase
  └─ Onboarding phase

ONBOARDING
  ├─ Recent customer
  ├─ <30 days old
  ├─ Setting up account
  └─ Initial support needed

ACTIVE
  ├─ Current customer
  ├─ Paid subscription
  ├─ Regular usage
  └─ Recent interaction

LOYAL
  ├─ 3+ purchases
  ├─ OR >180 days customer
  ├─ Repeat buyer
  └─ High satisfaction

ADVOCATE
  ├─ NPS >= 9
  ├─ Made referrals
  ├─ Promotes service
  └─ Highest satisfaction
```

---

## NEXT ACTION DECISION TREE

```
IF escalation_required
  → SEND_TO_ADMIN

IF profile == "lawyer"
  → ROUTE_TO_DARWIN

IF profile == "firm"
  → ROUTE_TO_DARWIN

IF profile == "supplier"
  → SEND_TO_ADMIN

IF profile == "support"
  → CREATE_CASE

IF intent == "emergency" OR "urgent"
  → SEND_TO_ADMIN

IF intent == "general_inquiry" OR "information"
  → ROUTE_TO_DARWIN

IF intent == "support"
  → CREATE_CASE

IF intent == "sales" OR "pricing"
  → ROUTE_TO_DARWIN

IF priority == "critical"
  → SEND_TO_ADMIN

IF priority == "high"
  → SEND_TO_ADMIN

IF journey_stage == "visitor" OR "interest"
  → CREATE_LEAD

IF journey_stage == "discovery"
  → ROUTE_TO_DARWIN

IF journey_stage == "consultation"
  → SCHEDULE_CALL

IF journey_stage == "qualification"
  → SEND_TO_ADMIN

IF journey_stage == "purchase"
  → CREATE_OPPORTUNITY

IF journey_stage IN ["active", "loyal", "advocate"]
  → ROUTE_TO_DARWIN

DEFAULT
  → ROUTE_TO_DARWIN
```

---

## ESCALATION TRIGGERS

### Automatic Escalation Rules

| Trigger | Reason | Priority |
|---------|--------|----------|
| Emergency keywords | Legal emergency detected | CRITICAL |
| VIP customer | High-value customer | HIGH |
| Angry customer | Upset/frustrated tone | HIGH |
| Large deal (>$50K) | Significant opportunity | HIGH |
| International/Complex | Specialist needed | HIGH |
| 2+ escalations | Already escalated | HIGH |
| Critical priority | CRITICAL flag | CRITICAL |

---

## METRICS TRACKING

### Per-Conversation Metrics

- First response time (seconds)
- Total conversation duration (seconds)
- Activation processing time (milliseconds)
- Classification time (milliseconds)
- Status tracking (open/closed)
- Conversion tracking
- Abandonment tracking
- Transfer tracking
- Case creation tracking
- Sales amount tracking
- Escalation count

### Aggregated Metrics (Time Period)

- Total conversations
- Open vs closed count
- Average response time
- Average duration
- Conversion rate
- Abandonment rate
- Escalation rate
- Total sales
- Total cases created
- Breakdown by channel, profile, intent

---

## BACKWARD COMPATIBILITY

### No Changes to:
- ✅ Landing page
- ✅ Dashboard
- ✅ CRM
- ✅ JWT/Auth
- ✅ MongoDB
- ✅ Existing routes
- ✅ Conversation router
- ✅ DARWIN agents
- ✅ Knowledge library
- ✅ Playbooks
- ✅ Master Book
- ✅ Founder Legacy

### Integration Points Only:
- New module sits independently
- Pluggable into existing router
- No required modifications
- All interfaces prepared but not connected
- Purely architectural

---

## EXTENSIBILITY PATTERNS

### Plugin Pattern 1: Custom Classifier

```python
def my_custom_classifier(conversation_data):
    # Custom logic
    return CustomerProfile.CLIENT, 0.95

engine.register_profile_classifier(
    CustomerProfile.CLIENT, 
    my_custom_classifier
)
```

### Plugin Pattern 2: Custom Intent Detector

```python
def my_intent_detector(message_content):
    # Custom logic
    return "custom_intent", 0.85

engine.register_intent_detector(
    "custom_intent",
    my_intent_detector
)
```

### Plugin Pattern 3: Custom Escalation Rule

```python
def my_escalation_rule(profile, intent, priority, data):
    # Custom condition
    if some_condition(data):
        return EscalationRule(
            name="my_rule",
            condition_func=lambda ...: True,
            escalation_reason="My reason",
            priority="high"
        )

engine.register_escalation_rules(
    escalation_engine_with_my_rule
)
```

---

## PHASE Ω SCOPE

### What's Included:
✅ Complete architectural design  
✅ All module definitions  
✅ Data structures and interfaces  
✅ Processing flow documentation  
✅ Extension patterns defined  
✅ No implementation code  
✅ Ready for future implementation  

### What's NOT Included:
❌ Implementation of classifiers  
❌ Intent detection algorithms  
❌ Database connections  
❌ API integrations  
❌ MongoDB persistence  
❌ WhatsApp API connectivity  
❌ Functional code execution  
❌ Live conversation routing  

### Future Phases:
- **Phase 3:** Implement classifiers
- **Phase 4:** Connect to MongoDB
- **Phase 5:** Connect to external APIs
- **Phase 6:** Production deployment

---

## SYSTEM CHARACTERISTICS

### Reusability

**This system belongs to Punto Cero System OS, not to Punto Cero Legal.**

It is completely reusable for all future verticals:
- Health AI
- Education AI
- Accounting AI
- Government AI
- Marketplace AI
- Banking AI
- Any vertical

Just customize the profiles, intents, and rules.

### Scalability

Can handle:
- Millions of conversations
- Multiple channels simultaneously
- Real-time classification
- Parallel processing
- Distributed deployment

### Flexibility

- Pluggable at every level
- No code changes for customization
- Rules-based not code-based
- Configuration-driven
- Extensible without impact

### Reliability

- Fallback actions defined
- Graceful degradation
- Error handling
- Metrics tracking
- Audit trail

---

## INTEGRATION WITH DARWIN

The Customer Activation Engine feeds DARWIN with:

1. **Pre-classified conversations** - Profile already determined
2. **Priority context** - How urgent is this?
3. **Journey context** - What stage is customer in?
4. **Escalation status** - Is this escalated?
5. **Suggestions** - What should happen next?
6. **Metrics** - Performance data
7. **Admin hints** - What admin sees

DARWIN can then:
- Respond contextually
- Adjust tone based on profile
- Prioritize differently
- Escalate if needed
- Learn from outcomes

---

## CONCLUSION

The Customer Activation Engine is **the bridge between raw customer input and intelligent routing**.

It's completely:
- Independent
- Extensible
- Reusable
- Backward compatible
- Non-breaking
- Ready for future integration

---

**Version:** 1.0 - Architecture Complete  
**Status:** ✅ Ready for Implementation  
**Next:** Phase 3 Implementation (TBD)

