# DARWIN COMMERCIAL BRAIN - PHASE 2 REPORT

**Status:** ✅ PHASE 2 ARCHITECTURE COMPLETE - Ready for AI Integration

**Phase:** 2 - Commercial Brain Implementation Framework  
**Version:** 0.1 (Foundation)  
**Date:** 2024  

---

## EXECUTIVE SUMMARY

The **COMMERCIAL BRAIN v0.1** is a complete conversation framework built on the DARWIN CORE FOUNDATION from Phase 1. It transforms Darwin from a generic conversation router into an intelligent commercial advisor that:

- 🤖 Acts as first contact for users
- 🎯 Classifies users into profiles (Client, Lawyer, Firm, Support)
- 📋 Follows sophisticated conversation playbooks
- 🎪 Maintains state through conversation phases
- 💼 Identifies commercial opportunities
- 🚀 Makes intelligent decisions about next steps
- 🧠 Never reveals it's an AI unless asked

**Key Achievement:** Darwin now has personality, guardrails, knowledge, and decision intelligence—all without external AI integration.

---

## WHAT'S NEW IN PHASE 2

### 1. Playbooks (5 specialized conversation flows)
- **commercial.md** - Default Darwin entry point (core philosophy)
- **client.md** - For people seeking legal advice
- **lawyer.md** - For independent professionals
- **firm.md** - For organizations seeking digitalization
- **support.md** - For technical/platform issues

### 2. Knowledge Base (8 knowledge modules)
- **company.md** - Company identity and information
- **products.md** - What we offer
- **plans.md** - Pricing and packages
- **pricing.md** - Financial justification and ROI
- **countries.md** - Geographic and regulatory information
- **faq.md** - Frequently asked questions
- **sales_objections.md** - How to handle hesitations
- **vision.md** - Company purpose and values

### 3. Policies (4 guardrail modules)
- **legal.md** - Legal disclaimers and compliance
- **privacy.md** - Data handling and user privacy
- **security.md** - Information security standards
- **commercial.md** - Sales ethics and integrity

### 4. Conversation State Management
- **ConversationState** - Tracks conversation lifecycle
- **ConversationPhase** - 7 conversation phases (WELCOME → FINISHED)
- **UserProfile** - 5 user profile types
- **PhaseTransition** - Valid state machine transitions

### 5. Commercial Decision Service
- **CommercialDecisionService** - Intelligent routing decisions
- Profile identification
- Opportunity detection
- Playbook selection
- Escalation logic

---

## ARCHITECTURE

```
DARWIN COMMERCIAL BRAIN
│
├─ CORE (From Phase 1)
│  └─ ConversationRouter (unchanged)
│
├─ PLAYBOOKS (NEW)
│  ├─ commercial.md (core philosophy)
│  ├─ client.md (legal seekers)
│  ├─ lawyer.md (professionals)
│  ├─ firm.md (organizations)
│  └─ support.md (technical help)
│
├─ KNOWLEDGE (NEW)
│  ├─ company.md
│  ├─ products.md
│  ├─ plans.md
│  ├─ pricing.md
│  ├─ countries.md
│  ├─ faq.md
│  ├─ sales_objections.md
│  └─ vision.md
│
├─ POLICIES (NEW)
│  ├─ legal.md
│  ├─ privacy.md
│  ├─ security.md
│  └─ commercial.md
│
├─ SCHEMAS (Enhanced)
│  ├─ conversation_state.py (NEW - State machine)
│  ├─ conversation_schemas.py (Phase 1)
│  └─ ... (other schemas)
│
└─ SERVICES (Enhanced)
   ├─ commercial_decision_service.py (NEW)
   ├─ conversation_engine.py (Phase 1)
   ├─ intent_detector.py (Phase 1)
   ├─ response_builder.py (Phase 1)
   └─ conversation_logger.py (Phase 1)
```

---

## CONVERSATION FLOW

### User Journey Through Darwin

```
User Message
    ↓
[1] ConversationRouter (Phase 1)
    - Receives message from channel
    - Routes through appropriate path
    ↓
[2] CommercialDecisionService (Phase 2)
    - Identifies user profile
    - Detects commercial opportunity
    - Selects playbook
    - Decides next step
    ↓
[3] ConversationState (Phase 2)
    - Tracks conversation phase (WELCOME → FINISHED)
    - Records classification signals
    - Monitors escalation needs
    ↓
[4] Appropriate Playbook (Phase 2)
    - Client playbook
    - Lawyer playbook
    - Firm playbook
    - Support playbook
    - OR continue in commercial playbook
    ↓
[5] Knowledge Base (Phase 2)
    - Access relevant information
    - Provide contextual answers
    - Reference company policies
    ↓
[6] Policies (Phase 2)
    - Apply legal requirements
    - Respect privacy
    - Maintain security
    - Uphold commercial ethics
    ↓
[7] Response Builder (Phase 1)
    - Format response for channel
    - Apply personality
    - Add disclaimers if needed
    ↓
[8] Channel Adapter (Phase 1)
    - Send response to user
    ↓
Response Delivered
```

---

## CONVERSATION PHASES

### WELCOME
**Purpose:** Initial greeting and rapport  
**Darwin's role:** Warm greeting, establish credibility  
**User signals:** Just arriving, not yet shared details  
**Next step:** Move to DISCOVERY  

### DISCOVERY
**Purpose:** Understand user's situation  
**Darwin's role:** Active listening, asking clarifying questions  
**User signals:** Sharing their situation, goals, concerns  
**Next step:** Move to CLASSIFICATION  

### CLASSIFICATION
**Purpose:** Identify user profile  
**Darwin's role:** Detect signals, classify into profile  
**Profiles:** Client, Lawyer, Firm, Support, Unknown  
**Next step:** Move to GUIDANCE  

### GUIDANCE
**Purpose:** Provide relevant information  
**Darwin's role:** Expert advisor, explain options  
**User signals:** Understanding deepening, questions emerging  
**Next step:** RECOMMENDATION or continue GUIDANCE  

### RECOMMENDATION
**Purpose:** Suggest specific solutions  
**Darwin's role:** Recommend based on playbook  
**User signals:** Ready to make decision or learn about solution  
**Next step:** TRANSFER to specialist or FINISHED  

### TRANSFER
**Purpose:** Connect to appropriate specialist  
**Darwin's role:** Warm handoff, ensure continuity  
**User signals:** Agreed to take action  
**Next step:** FINISHED  

### FINISHED
**Purpose:** End conversation gracefully  
**Darwin's role:** Confirm satisfaction, next steps  
**User signals:** Has clarity, knows what to do next  
**Status:** Conversation complete  

---

## USER PROFILES & ROUTING

### CLIENT Profile
**Signals:** "Legal advice", "abogado", "problem", "consult"  
**Playbook:** client.md  
**Conversation Flow:**
- Understand legal issue
- Assess urgency
- Recommend service level
- Transfer to lawyer

**Commercial Opportunity:** Service upgrades, ongoing representation

---

### LAWYER Profile
**Signals:** "Independent", "practice", "clients", "grow"  
**Playbook:** lawyer.md  
**Conversation Flow:**
- Understand practice
- Learn growth goals
- Present virtual office value
- Discuss partnership

**Commercial Opportunity:** Virtual office subscription, referral network

---

### FIRM Profile
**Signals:** "Despacho", "team", "digitalization", "efficiency"  
**Playbook:** firm.md  
**Conversation Flow:**
- Understand firm structure
- Identify pain points
- Show digitalization ROI
- Present implementation

**Commercial Opportunity:** Enterprise platform subscription, implementation services

---

### SUPPORT Profile
**Signals:** "Can't access", "not working", "error", "help"  
**Playbook:** support.md  
**Conversation Flow:**
- Identify issue
- Troubleshoot step by step
- Resolve or escalate
- Provide prevention tips

**Commercial Opportunity:** Premium support upgrades, training

---

### UNKNOWN Profile
**Signals:** Not enough information yet  
**Playbook:** commercial.md (default)  
**Conversation Flow:**
- Continue discovery
- Ask clarifying questions
- Gather classification signals
- Transition to specific playbook once classified

**Next Step:** Re-analyze after more messages

---

## PLAYBOOK STRUCTURE

Each playbook defines:

1. **Target Profile** - Who this playbook is for
2. **Characteristic Signals** - Keywords/phrases that indicate this profile
3. **Conversation Flow** - Step-by-step progression
4. **Tone & Personality** - How Darwin speaks to this profile
5. **Key Messages** - Important value propositions
6. **Playbook Rules** - Do's and Don'ts
7. **Exit Conditions** - When conversation is done
8. **Integration Points** - Future system connections

**Example - Client Playbook:**
```
Phase 1: Welcome & Understanding
  → Listen actively without interrupting
  → Ask "Tell me what happened"
  → Show empathy
  
Phase 2: Discovery
  → Understand timeline
  → Identify who's affected
  → Assess urgency
  → Ask clarifying questions

Phase 3: Guidance
  → Explain legal landscape
  → Outline approaches
  → Set expectations
  → Address concerns

Phase 4: Recommendation
  → Suggest service
  → Explain why
  → Share next steps

Phase 5: Transfer
  → Transfer to lawyer
  → Ensure continuity
```

---

## KNOWLEDGE BASE STRUCTURE

### company.md
- Company identity
- What we do
- Team and expertise
- Contact information

### products.md
- For Clients: Legal consultation services
- For Lawyers: Virtual office
- For Firms: Digitalization platform
- For Support: Help and training

### plans.md
- Basic, Professional, Premium tiers
- By profile type
- Feature comparison
- Pricing transparency

### pricing.md
- Cost justification by profile
- ROI calculations
- Alternative cost comparison
- Discount handling

### countries.md
- Supported jurisdictions
- Legal market info
- Regulatory compliance
- Local partnerships

### faq.md
- Pre-answered common questions
- By profile and topic
- Covers pricing, features, process
- Handles objections

### sales_objections.md
- "It's too expensive" → ROI explanation
- "I need to think" → Respect + offer info
- "I've been burned before" → Transparency + guarantee
- "Competitor is cheaper" → Quality comparison
- Principle: Listen, empathize, provide value

### vision.md
- Company mission and values
- Strategic pillars
- Impact metrics
- Inspiring narrative

---

## POLICIES FRAMEWORK

### Legal Policies
**What Darwin Must Do:**
- Disclose limitations (not a lawyer)
- Provide general information only
- Recommend professional counsel
- Maintain confidentiality
- Respect regulations

**What Darwin Cannot Do:**
- Provide legal advice
- Create attorney-client relationship
- Draft legal documents
- Make legal predictions
- Practice law

### Privacy Policies
**Commitments:**
- Transparent about data usage
- Minimal data collection
- Strong data protection
- User control over data
- GDPR compliance

**User Rights:**
- Access their data
- Delete their data
- Correct their data
- Export their data
- Opt out of processing

### Security Policies
**Standards:**
- Encrypt all data (TLS 1.2+, AES-256)
- Validate all inputs
- Authenticate users
- Maintain audit logs
- Keep systems updated

**Compliance:**
- OWASP Top 10 protection
- SOC 2 standards
- Industry regulations
- Regular penetration testing

### Commercial Policies
**Sales Ethics:**
- Be honest about products
- Listen before recommending
- Recommend what's right (even if cheaper)
- Respect customer time
- Honor commitments

**What Not to Do:**
- Never pressure or manipulate
- Never deceive
- Never ignore concerns
- Never make empty promises
- Never mislead about pricing

---

## CONVERSATION STATE MACHINE

### State Transitions

```
WELCOME → DISCOVERY → CLASSIFICATION → GUIDANCE → RECOMMENDATION → TRANSFER → FINISHED
         ↓           ↓                 ↓          ↓                ↓
    Can user   Profile          Intent      Recommend         User
    respond?   determined?      detected?   solution       committed?
```

### Conditions for Transitions

**WELCOME → DISCOVERY:**
- User engaged
- Message received

**DISCOVERY → CLASSIFICATION:**
- User shared information
- Enough signals collected

**CLASSIFICATION → GUIDANCE:**
- Profile determined (confidence > threshold)

**GUIDANCE → RECOMMENDATION:**
- Intent clearly detected
- Information provided

**RECOMMENDATION → TRANSFER:**
- User interested in specialist
- Playbook complete

**RECOMMENDATION → FINISHED:**
- User satisfied with information
- No further action needed

**Any Phase → TRANSFER:**
- Escalation required (urgent, complex, specialist needed)

---

## COMMERCIAL DECISION SERVICE

### Responsibilities

1. **Profile Identification**
   - Analyze messages for signals
   - Calculate confidence score
   - Update classification as new signals arrive

2. **Opportunity Detection**
   - Identify what user might need
   - Suggest complementary services
   - Create upsell/cross-sell opportunities

3. **Playbook Selection**
   - Match profile to playbook
   - Load appropriate flow
   - Maintain consistency

4. **Escalation Logic**
   - Determine if specialist needed
   - Flag urgent situations
   - Route to appropriate human

5. **Action Recommendation**
   - Suggest next step
   - Phase progression guidance
   - Ensure smooth flow

### Key Methods

**identify_profile(message)**
- Returns: profile, confidence, signals
- Uses: Keyword matching (Phase 1), ML (Phase 2)

**decide_next_step(state, profile, intent)**
- Returns: DecisionResult with:
  - Recommended action
  - Selected playbook
  - Next phase
  - Commercial opportunity
  - Escalation flag
  - Reasoning

**is_escalation_needed(profile, intent, messages)**
- Returns: boolean indicating if human needed
- Triggers: Urgent cases, complex issues, specialist needs

---

## NO AI CONNECTED YET

**Phase 2 Framework is Complete:**
✅ Conversation flows defined
✅ Knowledge base structured
✅ Policies documented
✅ Decision logic prepared
✅ State management ready
✅ All playbooks created

**NOT Connected Yet (Phase 3):**
❌ Gemini/Claude for natural language
❌ MongoDB for persistence
❌ WhatsApp API
❌ Email/SMS
❌ Chat widget
❌ CRM integration
❌ Actual NLP for better intent detection

**Result:** Darwin has structure and intelligence WITHOUT external dependencies.
Can be tested locally, refined before integration.

---

## PERSONALITY EXPRESSION

Darwin's personality comes from **DarwinPersonality** (Phase 1) applied through playbooks:

### Warmth Without Being Fake
- "Entiendo que..." (empathy)
- "Cuéntame..." (genuine interest)
- Natural, conversational tone
- Never corporate-speak

### Professional Without Being Cold
- Expert knowledge
- Clear explanations
- Structured thinking
- Confident recommendations

### Listening Before Advising
- Discovery before guidance
- Questions before answers
- Understanding before recommendation
- Respect for user intelligence

### Tranquility in Complexity
- "No hay prisa"
- Step by step explanations
- Patient with questions
- Calm reassurance

---

## FILE STRUCTURE

```
backend/conversation/
│
├─ playbooks/                           (NEW - 5 files, 742 lines)
│  ├─ __init__.py
│  ├─ commercial.md (269 lines - core philosophy)
│  ├─ client.md (107 lines - legal seekers)
│  ├─ lawyer.md (110 lines - professionals)
│  ├─ firm.md (113 lines - organizations)
│  └─ support.md (143 lines - support)
│
├─ knowledge/                           (NEW - 8 files, 1,125 lines)
│  ├─ __init__.py
│  ├─ company.md (93 lines)
│  ├─ products.md (86 lines)
│  ├─ plans.md (115 lines)
│  ├─ pricing.md (148 lines)
│  ├─ countries.md (114 lines)
│  ├─ faq.md (143 lines)
│  ├─ sales_objections.md (272 lines)
│  └─ vision.md (155 lines)
│
├─ policies/                            (NEW - 4 files, 1,117 lines)
│  ├─ __init__.py
│  ├─ legal.md (177 lines)
│  ├─ privacy.md (277 lines)
│  ├─ security.md (302 lines)
│  └─ commercial.md (351 lines)
│
├─ schemas/
│  ├─ conversation_state.py             (NEW - 241 lines - State machine)
│  ├─ conversation_schemas.py           (Phase 1)
│  └─ ... (other Phase 1 schemas)
│
├─ services/
│  ├─ commercial_decision_service.py    (NEW - 322 lines)
│  ├─ conversation_engine.py            (Phase 1)
│  ├─ intent_detector.py                (Phase 1)
│  ├─ response_builder.py               (Phase 1)
│  └─ conversation_logger.py            (Phase 1)
│
└─ ... (other Phase 1 modules)

TOTAL NEW FILES: 19
TOTAL NEW LINES: ~2,900 (not including documentation in this report)
```

---

## STATISTICS

| Metric | Count |
|--------|-------|
| New Files | 19 |
| New Lines of Code | ~1,000 |
| New Lines of Documentation | ~1,900 |
| Playbooks | 5 |
| Knowledge Files | 8 |
| Policy Files | 4 |
| Conversation Phases | 7 |
| User Profiles | 5 |
| Supported Intents | 25+ |
| State Transitions | 8 |

---

## INTEGRATION WITH PHASE 1

### What Carries Forward
✅ ConversationRouter (unchanged, at core)
✅ Channel Adapters (all working)
✅ Memory System (ready for Phase 2)
✅ DarwinPersonality (guides all interactions)
✅ BaseAgent interface (extended by playbooks)

### What's New
✅ Playbooks (conversation flows)
✅ Knowledge base (information system)
✅ Policies (guardrails)
✅ State machine (phase tracking)
✅ Decision service (intelligent routing)

### Backward Compatible
✅ All Phase 1 components work unchanged
✅ New features build on Phase 1
✅ No modifications to existing systems
✅ Clean separation of concerns

---

## READY FOR PHASE 3

### Phase 3 Will Add:

1. **AI Integration**
   - Gemini/Claude for natural language
   - Intent detection improvement
   - Response generation
   - Personalization

2. **Data Persistence**
   - MongoDB for conversation storage
   - User profile persistence
   - Interaction history
   - Analytics data

3. **Channel Integration**
   - WhatsApp activation
   - Email/SMS routing
   - Chat widget implementation
   - Dashboard integration

4. **System Integration**
   - CRM connection
   - Lawyer matching
   - Case management linking
   - Subscription system integration

### Phase 3 Roadmap

**Month 1:** AI integration (natural language processing)
**Month 2:** Database integration (MongoDB persistence)
**Month 3:** External APIs (WhatsApp, Email)
**Month 4:** System integrations (CRM, Case management)
**Month 5:** Testing, optimization, launch

---

## FUTURE VERTICAL EXTENSIBILITY

This Commercial Brain is designed to scale to new verticals:

### Adding New Vertical (e.g., Accounting)

1. **Create new playbooks:**
   - `playbooks/accountant.md`
   - `playbooks/business_owner.md`
   - etc.

2. **Create vertical-specific knowledge:**
   - `knowledge/accounting_products.md`
   - `knowledge/tax_faqs.md`
   - etc.

3. **Update profiles:**
   - Add "Accountant" profile
   - Update identification signals
   - Map to appropriate playbook

4. **Update decision service:**
   - New profile detection
   - New opportunity types
   - New escalation triggers

**Result:** New vertical works with same core infrastructure

---

## SUCCESS METRICS (PHASE 2)

### Functional Metrics
- [ ] Conversation state tracking works
- [ ] Profile classification accuracy > 80%
- [ ] Phase transitions valid
- [ ] Playbook flows complete
- [ ] Decision service makes recommendations
- [ ] No external dependencies for basic flow

### Usability Metrics
- [ ] Conversations feel natural (not robotic)
- [ ] Darwin understood well (in testing)
- [ ] Playbooks guide conversations smoothly
- [ ] Knowledge base provides relevant info
- [ ] Policies respected (legal, privacy, security)

### Scalability Metrics
- [ ] Can add new profiles easily
- [ ] Can add new playbooks easily
- [ ] Can add new knowledge modules
- [ ] Can add new policies
- [ ] Ready for vertical expansion

---

## IMPORTANT CONSTRAINTS MAINTAINED

✅ **No modifications to:**
- Landing page
- Formularios
- Dashboard
- IA Jurídica
- Módulos de Casos
- CRM
- Sistema de Suscripciones
- JWT
- Multi-tenant
- Base de datos existente

✅ **Reutilizable across verticals:**
- No references to Punto Cero Legal specifically
- Generic terminology
- Applicable to any vertical
- Extensible architecture

✅ **Not implemented yet:**
- Gemini/Claude
- MongoDB
- WhatsApp API
- External APIs
- Real system integrations

---

## CONCLUSION

**DARWIN COMMERCIAL BRAIN v0.1** is a complete, sophisticated framework that:

1. **Identifies who** the user is (5 profiles)
2. **Understands what** they need (25+ intents)
3. **Knows where** to take them (playbooks)
4. **Makes intelligent decisions** (decision service)
5. **Maintains conversation state** (state machine)
6. **Applies policies** (legal, privacy, security)
7. **Guides naturally** (personality-driven)
8. **Scales to new verticals** (extensible design)

All without external AI, database, or API integration.

**Status:** 🟢 **Ready for Phase 3 - AI Integration**

---

**Version:** 0.1 (Foundation)  
**Next:** Phase 3 - AI Integration & Persistence  
**Date:** 2024

---

*DARWIN COMMERCIAL BRAIN - Phase 2 Complete*
*The conversation framework is ready. Now let's add intelligence.*
