# CUSTOMER ACTIVATION FLOW
## Complete Journey from Customer to Action

**Phase:** Ω (Omega)  
**Status:** ✅ Architecture Complete  
**Purpose:** Map complete conversation flow through activation system  

---

## HIGH-LEVEL FLOW

```
CUSTOMER INPUT (Any Channel)
        ↓
ACTIVATION ENGINE
  1. Accept input
  2. Classify profile
  3. Detect intent
  4. Assign priority
  5. Detect journey
  6. Determine action
  7. Check escalation
  8. Generate suggestions
  9. Track metrics
        ↓
ACTIVATION DECISION
  (Profile, Intent, Priority, Journey, Action, Escalation, Suggestions)
        ↓
ROUTING DECISION
  ├─→ ROUTE_TO_DARWIN
  ├─→ SEND_TO_ADMIN
  ├─→ CREATE_CASE
  ├─→ CREATE_LEAD
  ├─→ SCHEDULE_CALL
  ├─→ TRANSFER_TO_LAWYER
  ├─→ Or other actions...
        ↓
ACTION EXECUTION
  (Send to next system)
        ↓
COMPLETION
  Track in metrics
```

---

## CHANNEL ENTRY POINTS

### WhatsApp Channel

```
Customer sends WhatsApp message
        ↓
WhatsApp Channel Adapter
  - Parse message
  - Extract user context
  - Preserve conversation history
        ↓
ACTIVATION ENGINE
  [Full activation flow]
        ↓
DECISION
  - Respond via DARWIN
  - OR escalate to admin
  - OR create case
  - OR schedule
        ↓
Response sent back to WhatsApp
```

### Landing Page Channel

```
Website visitor fills contact form
        ↓
Landing Page Handler
  - Capture form data
  - Extract visitor context
  - Store initial interest
        ↓
ACTIVATION ENGINE
  [Full activation flow]
        ↓
DECISION
  - Create LEAD
  - OR send DARWIN response
  - OR schedule consultation
        ↓
Email confirmation sent to visitor
```

### Dashboard Channel

```
Logged-in customer initiates chat
        ↓
Dashboard Chat Handler
  - Identify authenticated user
  - Load customer history
  - Get account context
        ↓
ACTIVATION ENGINE
  [Full activation flow]
        ↓
DECISION
  - Route to DARWIN
  - OR escalate to support
  - OR create case
        ↓
Response shown in dashboard chat
```

### API Channel

```
External system sends request
        ↓
API Handler
  - Parse API payload
  - Validate authentication
  - Extract conversation
        ↓
ACTIVATION ENGINE
  [Full activation flow]
        ↓
DECISION
  - Return routing decision
  - Send to specified system
        ↓
API response returned
```

### Mobile App Channel (Future)

```
Mobile app user sends message
        ↓
Mobile Handler
  - Parse app payload
  - Load user context
  - Sync conversation
        ↓
ACTIVATION ENGINE
  [Full activation flow]
        ↓
DECISION
  - Route appropriately
        ↓
Response sent to app
```

---

## DETAILED ACTIVATION FLOW

```
┌─────────────────────────────────────────────────────┐
│ STEP 1: ACCEPT INPUT                                │
│                                                     │
│ Input:                                              │
│ - conversation_id (unique)                          │
│ - channel (whatsapp/landing/dashboard/api/mobile)  │
│ - user_id (if known)                                │
│ - message_content (the actual text)                 │
│ - timestamp (when received)                         │
│ - context (any additional metadata)                 │
│                                                     │
│ Output: ActivationInput dataclass                   │
└─────────────────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────────────────┐
│ STEP 2: CLASSIFY PROFILE                            │
│                                                     │
│ Analysis:                                           │
│ - Check if user_id is in database                   │
│ - Analyze message content for signals               │
│ - Check if firm or lawyer account                   │
│ - Look for profile-specific keywords                │
│                                                     │
│ Profiles to Detect:                                 │
│ - CLIENT: Previous customer                         │
│ - LAWYER: Individual practitioner                   │
│ - FIRM: Legal firm account                          │
│ - SUPPLIER: Service provider                        │
│ - SUPPORT: Support request                          │
│ - ADMIN: Internal staff                             │
│ - UNKNOWN: Cannot determine                         │
│                                                     │
│ Output: (profile, confidence_score)                 │
│ Example: (CustomerProfile.CLIENT, 0.92)             │
└─────────────────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────────────────┐
│ STEP 3: DETECT INTENT                               │
│                                                     │
│ Analysis:                                           │
│ - Keyword matching                                  │
│ - Semantic analysis                                 │
│ - Question detection                                │
│ - Request classification                            │
│                                                     │
│ Possible Intents:                                   │
│ - legal_emergency                                   │
│ - general_inquiry                                   │
│ - pricing_inquiry                                   │
│ - sales_inquiry                                     │
│ - support_request                                   │
│ - complaint                                         │
│ - consultation                                      │
│ - And many more...                                  │
│                                                     │
│ Output: (intent, confidence_score)                  │
│ Example: ("sales_inquiry", 0.85)                    │
└─────────────────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────────────────┐
│ STEP 4: ASSIGN PRIORITY                             │
│                                                     │
│ Scoring Factors:                                    │
│ - Customer type (+20 for VIP, +15 for firm)         │
│ - Keywords (+40 for "emergency", +20 for "urgent")  │
│ - Time sensitivity (+15)                            │
│ - Returning customer (+5)                           │
│                                                     │
│ Priority Levels:                                    │
│ - CRITICAL (90+) → 5 min SLA                        │
│ - HIGH (70-89) → 30 min SLA                         │
│ - NORMAL (40-69) → 8 hour SLA                       │
│ - LOW (0-39) → 24 hour SLA                          │
│                                                     │
│ Output: ConversationPriority enum                   │
│ Example: ConversationPriority.HIGH                  │
└─────────────────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────────────────┐
│ STEP 5: DETECT CUSTOMER JOURNEY STAGE               │
│                                                     │
│ Signals Analyzed:                                   │
│ - Interaction count                                 │
│ - Purchase history                                  │
│ - Time as customer                                  │
│ - Engagement level                                  │
│ - Account status                                    │
│ - NPS score                                         │
│                                                     │
│ Possible Stages:                                    │
│ - VISITOR (first contact)                           │
│ - INTEREST (showing interest)                       │
│ - DISCOVERY (learning)                              │
│ - CONSULTATION (seeking advice)                     │
│ - QUALIFICATION (being evaluated)                   │
│ - PURCHASE (buying/bought)                          │
│ - ONBOARDING (new customer)                         │
│ - ACTIVE (current customer)                         │
│ - LOYAL (repeat customer)                           │
│ - ADVOCATE (promotes service)                       │
│                                                     │
│ Output: JourneyStage enum                           │
│ Example: JourneyStage.CONSULTATION                  │
└─────────────────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────────────────┐
│ STEP 6: DETERMINE NEXT ACTION                       │
│                                                     │
│ Decision Logic (in order):                          │
│ 1. If escalation required → SEND_TO_ADMIN           │
│ 2. Route by profile → specific handling             │
│ 3. Route by intent → specific handling              │
│ 4. Route by priority → escalate if high             │
│ 5. Route by journey stage → contextual              │
│ 6. Default → ROUTE_TO_DARWIN                        │
│                                                     │
│ Possible Actions:                                   │
│ - ROUTE_TO_DARWIN (AI handles)                      │
│ - SEND_TO_ADMIN (human takes over)                  │
│ - CREATE_CASE (support case)                        │
│ - CREATE_LEAD (potential customer)                  │
│ - CREATE_OPPORTUNITY (sales opportunity)            │
│ - SCHEDULE_CALL (propose call)                      │
│ - SCHEDULE_MEETING (propose meeting)                │
│ - TRANSFER_TO_LAWYER (specialist)                   │
│ - TRANSFER_TO_FIRM (firm routing)                   │
│ - QUEUE_FOR_LATER (defer)                           │
│                                                     │
│ Output: (NextAction enum, reasoning_string)         │
│ Example: (NextAction.SCHEDULE_CALL,                 │
│           "consultation_stage_requires_call")       │
└─────────────────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────────────────┐
│ STEP 7: CHECK ESCALATION RULES                      │
│                                                     │
│ Rules Checked:                                      │
│ 1. Emergency/urgent keywords detected               │
│ 2. VIP customer identified                          │
│ 3. Angry/upset customer detected                    │
│ 4. Large deal (>$50K) identified                    │
│ 5. Complex/international matter                     │
│ 6. Multiple escalation attempts                     │
│ 7. Critical priority flag                           │
│                                                     │
│ Output: (should_escalate, reason)                   │
│ Example: (True, "Emergency legal matter")           │
└─────────────────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────────────────┐
│ STEP 8: GENERATE ADMIN SUGGESTIONS                  │
│                                                     │
│ Suggestions Based On:                               │
│ - Profile analysis                                  │
│ - Intent matching                                   │
│ - Journey stage recommendations                     │
│ - Engagement indicators                             │
│ - Deal size analysis                                │
│ - Timing analysis                                   │
│                                                     │
│ Example Suggestions:                                │
│ - "Customer ready for qualification call"           │
│ - "High-value opportunity - assign manager"         │
│ - "Follow-up needed (5 days in pipeline)"           │
│ - "VIP customer - priority handling"                │
│                                                     │
│ Output: List of AdminSuggestion objects             │
└─────────────────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────────────────┐
│ STEP 9: TRACK METRICS                               │
│                                                     │
│ Data Recorded:                                      │
│ - Conversation ID                                   │
│ - Timestamp                                         │
│ - Channel                                           │
│ - Activation processing time                        │
│ - User/Customer ID                                  │
│ - Profile detected                                  │
│ - Intent detected                                   │
│ - Priority assigned                                 │
│ - Journey stage                                     │
│ - Action taken                                      │
│ - Escalated or not                                  │
│                                                     │
│ Used For:                                           │
│ - Performance analysis                              │
│ - Trend identification                              │
│ - System optimization                               │
│ - Reporting and dashboards                          │
│                                                     │
│ Output: ActivationMetrics stored                    │
└─────────────────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────────────────┐
│ FINAL OUTPUT: ACTIVATION DECISION                   │
│                                                     │
│ Contains:                                           │
│ - conversation_id                                   │
│ - timestamp                                         │
│ - detected_profile + confidence                     │
│ - detected_intent + confidence                      │
│ - priority (CRITICAL/HIGH/NORMAL/LOW)               │
│ - customer_journey_stage                            │
│ - next_action (what to do)                          │
│ - action_reason (why)                               │
│ - should_route_to_darwin (yes/no)                   │
│ - should_escalate (yes/no)                          │
│ - escalation_reason (if escalating)                 │
│ - suggestions (admin recommendations)               │
│ - metadata (channel, user_id, etc.)                 │
│                                                     │
│ Ready for: Routing to next system                   │
└─────────────────────────────────────────────────────┘
```

---

## ROUTING EXAMPLES

### Example 1: New Visitor with Sales Inquiry

```
INPUT:
- Message: "Hi, I need help with a contract review"
- Channel: landing
- No previous customer record
- Time: Tuesday 10am

ACTIVATION FLOW:
1. Profile: UNKNOWN (0.6 confidence) - no customer history
2. Intent: sales_inquiry (0.85 confidence)
3. Priority: NORMAL (score: 45)
   - New profile: 0 points
   - Keyword "help": +20
   - Normal hours: normal score
4. Journey: DISCOVERY (0.7 confidence)
   - First interaction
   - Asking about solution
5. Next Action: CREATE_LEAD
   - New potential customer
   - Should track for sales pipeline
6. Escalation: No
7. Suggestions:
   - "New lead with sales interest - nurture sequence"
   - "Contract review request - legal complexity indicated"

OUTPUT ROUTING:
→ CREATE_LEAD in CRM
→ Send to sales nurture sequence
→ (DARWIN can engage after lead creation)
```

### Example 2: VIP Firm with Emergency

```
INPUT:
- Message: "We have an urgent legal emergency! Need a lawyer NOW"
- Channel: whatsapp
- From: ABC_LAW_FIRM
- Account status: VIP
- Customer history: 50 interactions, 5 years, $200K revenue

ACTIVATION FLOW:
1. Profile: FIRM (0.98 confidence)
   - Known account "ABC_LAW_FIRM"
   - Account type: firm
2. Intent: legal_emergency (0.95 confidence)
   - Keywords: "emergency", "urgent", "NOW"
3. Priority: CRITICAL (score: 95)
   - VIP customer: +20
   - Firm: +15
   - Emergency keywords: +40
   - Time sensitive: +15
   - Returning customer: +5
4. Journey: ACTIVE (0.95 confidence)
   - Long-time customer
   - Regular interactions
5. Next Action: SEND_TO_ADMIN
   - Critical + firm + emergency = escalate
   - Needs human decision
6. Escalation: YES
   - Reason: "Emergency legal matter + VIP firm"
   - Priority: CRITICAL (5 min SLA)
7. Suggestions:
   - "URGENT: VIP firm with legal emergency"
   - "Assign senior lawyer - $200K+ client"
   - "Possible case creation with expedited timeline"

OUTPUT ROUTING:
→ SEND_TO_ADMIN (CRITICAL priority queue)
→ Alert assigned account manager
→ Create escalation ticket
→ Notify senior lawyer
→ 5-minute response SLA
```

### Example 3: Returning Client with Support Question

```
INPUT:
- Message: "How do I update my billing address?"
- Channel: dashboard
- User: jane_doe (authenticated)
- Customer history: 2 purchases, 6 months, active subscription

ACTIVATION FLOW:
1. Profile: CLIENT (0.95 confidence)
   - Authenticated user
   - Known customer account
2. Intent: support_request (0.9 confidence)
   - Question about billing/account
3. Priority: LOW (score: 20)
   - Existing client: +10
   - No urgency keywords: 0
   - Standard question: normal score
4. Journey: ACTIVE (0.95 confidence)
   - Current paid customer
   - Recent interactions
   - Subscription active
5. Next Action: ROUTE_TO_DARWIN
   - Routine support question
   - DARWIN can handle account questions
   - Route to support playbook
6. Escalation: No
7. Suggestions:
   - "Routine account maintenance question"
   - "Opportunity to improve user experience"

OUTPUT ROUTING:
→ ROUTE_TO_DARWIN (support playbook)
→ DARWIN responds with: "You can update billing at..."
→ Track as support interaction
→ Monitor for escalation
```

### Example 4: Lawyer Prospect in Consultation

```
INPUT:
- Message: "I'm considering switching to Punto Cero. Can we discuss?"
- Channel: api (from referral system)
- New contact
- From: lawyer_referral source

ACTIVATION FLOW:
1. Profile: LAWYER (0.9 confidence)
   - Source indicates lawyer
   - Discussing service
2. Intent: consultation (0.85 confidence)
   - Asking to discuss
   - Considering partnership
3. Priority: HIGH (score: 75)
   - Lawyer account: +15
   - "considering switching" interest: +20
   - Time sensitive (decision): +15
   - Returning (referred): +5
   - New prospect bonus: +20
4. Journey: CONSULTATION (0.85 confidence)
   - Active discussion phase
   - Seeking information
   - Qualification needed
5. Next Action: SCHEDULE_CALL
   - Lawyer wants to discuss
   - Needs specialist call
   - Qualification needed
6. Escalation: No (but HIGH priority)
7. Suggestions:
   - "Lawyer prospect ready for consultation call"
   - "High conversion probability"
   - "Schedule with lawyer success manager"
   - "Prepare case studies for discussion"

OUTPUT ROUTING:
→ SCHEDULE_CALL automatically
→ Send calendar invite
→ Prepare specialist profile
→ Alert account manager
→ 30-minute response SLA
```

---

## INTEGRATION POINTS WITH DARWIN

After Activation Engine routes to DARWIN:

```
ACTIVATION DECISION
        ↓
IF should_route_to_darwin:
        ↓
┌───────────────────────────────────────────────┐
│ DARWIN RECEIVES:                              │
│ - detected_profile (context)                  │
│ - detected_intent (what customer wants)       │
│ - priority (how urgent)                       │
│ - journey_stage (where in process)            │
│ - admin_suggestions (hints)                   │
│ - full conversation history                   │
│ - customer metadata                           │
│ - escalation status                           │
└───────────────────────────────────────────────┘
        ↓
DARWIN CAN:
- Respond contextually
- Adjust tone to profile
- Answer based on intent
- Provide journey-appropriate content
- Escalate if needed
- Learn from outcomes
        ↓
RESPONSE SENT BACK:
- Via original channel
- With appropriate formatting
- With escalation option visible
- With suggestions for next steps
```

---

## INTEGRATION POINTS WITH CRM/CASES

```
ACTIVATION DECISION
        ↓
IF next_action == CREATE_CASE:
        ↓
→ Write to Cases table
→ Set priority from activation priority
→ Link to customer
→ Add conversation to case history
→ Alert support team
        ↓
IF next_action == CREATE_LEAD:
        ↓
→ Write to Leads/CRM
→ Set lead score from activation signals
→ Assign to sales pipeline
→ Add to nurture sequence
→ Alert sales team
        ↓
IF next_action == CREATE_OPPORTUNITY:
        ↓
→ Create in CRM/Opportunities
→ Set estimated value
→ Assign to sales
→ Set stage from journey_stage
→ Add to pipeline
```

---

## METRICS COLLECTION TIMELINE

```
T=0: Conversation arrives
     → Start metrics collection
     → Record received timestamp

T=0-100ms: Activation processing
     → Record classification time
     → Record priority assignment time
     → Record decision time

T=100ms: Decision ready
     → Send to routing system

T=0-5min: First response (if DARWIN routed)
     → Record first_response_time

T=ongoing: Conversation continues
     → Track transfers
     → Track escalations
     → Track messages exchanged

T=final: Conversation ends
     → Record close timestamp
     → Record total duration
     → Track conversion/abandonment
     → Track final outcome (case/sale/etc)
     → Move to historical data
     → Update aggregated metrics
```

---

## NO MODIFICATIONS TO EXISTING SYSTEMS

### What Stays Unchanged

✅ Landing page continues to work exactly as before  
✅ Dashboard continues to work exactly as before  
✅ CRM continues to work (integration is additive)  
✅ Cases continue to work (integration is additive)  
✅ JWT/Auth continues to work unchanged  
✅ MongoDB continues to work unchanged  
✅ Existing routes continue to work unchanged  
✅ Conversation Router continues to work  
✅ DARWIN agents continue to work unchanged  
✅ Mercado Pago continues to work unchanged  
✅ All existing functionality 100% intact  

### What's New (Non-breaking)

✅ Activation Engine sits independently  
✅ Can be plugged in when ready  
✅ Pluggable interfaces only  
✅ No required changes  
✅ All backward compatible  

---

## FLOW DIAGRAMS BY CHANNEL

### WhatsApp Flow

```
WhatsApp Message
    ↓
WhatsApp Adapter
    ├─ Parse message
    ├─ Get user context
    ├─ Extract conversation history
    ↓
ACTIVATION ENGINE
    ├─ Classify
    ├─ Prioritize
    ├─ Decide action
    ↓
Route Decision
    ├─→ DARWIN response via WhatsApp
    ├─→ Admin notification via dashboard
    ├─→ Case created, linked to WhatsApp
    └─→ Lead created, linked to WhatsApp
    ↓
Metrics recorded
```

### Landing Page Flow

```
Contact Form Submitted
    ↓
Landing Adapter
    ├─ Parse form data
    ├─ Create visitor context
    ├─ Capture inquiry details
    ↓
ACTIVATION ENGINE
    ├─ Classify as potential customer
    ├─ Detect interest intent
    ├─ Assess journey stage
    ↓
Route Decision
    ├─→ CREATE_LEAD
    ├─→ Send confirmation email
    ├─→ Queue for nurture sequence
    └─→ Alert sales team
    ↓
Metrics recorded
```

### Dashboard Flow

```
Authenticated Customer Opens Chat
    ↓
Dashboard Adapter
    ├─ Load customer account
    ├─ Get subscription status
    ├─ Load interaction history
    ↓
ACTIVATION ENGINE
    ├─ Classify as CLIENT
    ├─ Detect support/sales intent
    ├─ Assess journey stage
    ↓
Route Decision
    ├─→ ROUTE_TO_DARWIN (support playbook)
    ├─→ OR CREATE_CASE (if complex)
    └─→ OR ESCALATE (if urgent)
    ↓
Response shown in dashboard
```

### API Flow

```
External System Calls API
    ↓
API Handler
    ├─ Validate token
    ├─ Parse payload
    ├─ Extract conversation
    ↓
ACTIVATION ENGINE
    ├─ Classify from context
    ├─ Detect intent from payload
    ├─ Apply rules
    ↓
Route Decision
    ├─→ Return JSON decision
    ├─→ Caller decides action
    └─→ Metrics tracked
    ↓
JSON response returned
```

---

## CONCLUSION

The Customer Activation Flow is a **complete, non-breaking integration** that:

✅ Classifies all conversations  
✅ Prioritizes automatically  
✅ Routes intelligently  
✅ Escalates appropriately  
✅ Generates suggestions  
✅ Tracks metrics  
✅ Integrates with all channels  
✅ Works with DARWIN  
✅ Works with CRM/Cases  
✅ Completely backward compatible  

---

**Version:** 1.0 - Flow Complete  
**Status:** ✅ Architecture Ready  
**Channels:** WhatsApp, Landing, Dashboard, API, Mobile (future)  
**Integration:** Non-breaking, fully compatible  

