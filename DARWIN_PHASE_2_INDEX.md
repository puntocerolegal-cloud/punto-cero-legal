# DARWIN COMMERCIAL BRAIN - PHASE 2 DOCUMENTATION INDEX

**Quick Navigation to All Phase 2 Content**

---

## 📖 Main Reports

### DARWIN_COMMERCIAL_BRAIN_REPORT.md (826 lines)
**The Complete Technical Specification**
- Executive summary
- Architecture overview
- Playbook structure
- Knowledge base organization
- Policy framework
- Conversation state machine
- Decision service details
- Integration with Phase 1
- Ready for Phase 3

**Best for:** Technical architecture review, implementation planning

### DARWIN_PHASE_2_SUMMARY.md (380 lines)
**Quick Summary**
- What was built (in brief)
- File counts and statistics
- How it works (high level)
- Key features
- Constraints respected
- Go/No-go decision

**Best for:** Quick understanding, status updates, stakeholder briefing

### PHASE_2_COMPLETE.txt (506 lines)
**Visual Completion Summary**
- ASCII diagrams
- Flow visualization
- Statistics
- Requirements checklist
- Status dashboard

**Best for:** Visual learners, presentations, understanding scope

---

## 🎪 Playbooks (5 Files)

### backend/conversation/playbooks/

**commercial.md** (269 lines)
- Core Darwin philosophy
- First-contact strategy
- State machine basics
- Key messages
- Response examples

**client.md** (107 lines)
- Flow for legal advice seekers
- Understanding phase
- Discovery phase
- Guidance phase
- Key value messages
- Exit conditions

**lawyer.md** (110 lines)
- Flow for independent professionals
- Virtual office opportunity
- Growth positioning
- Partnership setup
- Key benefits

**firm.md** (113 lines)
- Flow for organizations
- Digitalization approach
- Efficiency messaging
- Implementation planning
- ROI justification

**support.md** (143 lines)
- Flow for technical support
- Issue identification
- Troubleshooting steps
- Common issues
- Escalation paths

---

## 📚 Knowledge Base (8 Files)

### backend/conversation/knowledge/

**company.md** (93 lines)
- Company identity
- What we do
- Team expertise
- Contact information
- [Phase 2: To be filled]

**products.md** (86 lines)
- For Clients: Legal consultation
- For Lawyers: Virtual office
- For Firms: Digitalization platform
- For Support: Help and training
- Feature lists by product

**plans.md** (115 lines)
- Basic / Professional / Premium tiers
- By profile type
- Feature comparison
- Pricing transparency
- Payment options

**pricing.md** (148 lines)
- Cost justification
- ROI calculations by profile
- Alternative comparisons
- Payment options
- Discount integrity

**countries.md** (114 lines)
- Supported jurisdictions
- Legal markets info
- Local regulations
- Currency support
- Language support
- Local partnerships

**faq.md** (143 lines)
- General questions
- By profile questions
- Technical questions
- Billing questions
- Account questions
- Pre-answered responses

**sales_objections.md** (272 lines)
- Price objections
- Commitment objections
- Trust objections
- Technical objections
- Market objections
- Time objections
- Multiple objection handling
- When to accept "no"

**vision.md** (155 lines)
- Vision statement
- Mission statement
- Core values
- Strategic pillars
- Impact metrics
- Philosophy
- Evolution understanding

---

## 🛡️ Policies (4 Files)

### backend/conversation/policies/

**legal.md** (177 lines)
- Legal disclaimers
- Professional practice limitations
- Bar association regulations
- Unauthorized practice prevention
- Privilege clarification
- Confidentiality standards
- Liability limitations
- Escalation to lawyers

**privacy.md** (277 lines)
- Data collection limits
- Data usage principles
- User rights (access, delete, export, correct)
- Consent and opt-out
- Third-party sharing
- GDPR compliance
- Data retention
- International transfers
- Breach response
- User responsibilities

**security.md** (302 lines)
- Security principles
- Authentication & access
- Data encryption (transit & rest)
- Network security
- Application security (OWASP top 10)
- Vulnerability management
- Third-party audits
- Compliance standards
- Monitoring & logging
- Incident response
- Disaster recovery
- Security responsibilities

**commercial.md** (351 lines)
- Sales ethics
- Product representation
- Competitive positioning
- Pricing communication
- Promotional standards
- Customer communication
- Anti-bribery & corruption
- Fair dealing
- Data integrity
- Objection handling philosophy

---

## 🤖 Services (NEW)

### backend/conversation/services/

**commercial_decision_service.py** (322 lines)
- Profile identification
- Opportunity detection
- Playbook selection
- Escalation logic
- Action recommendation
- Next step determination
- Service status

**Methods:**
- `decide_next_step()` - Main decision logic
- `identify_profile()` - Profile classification
- `_select_playbook()` - Playbook matching
- `_identify_opportunity()` - Commercial detection
- `_should_escalate()` - Escalation triggers
- `_recommend_action()` - Action selection
- `_determine_next_phase()` - Phase progression

---

## 📊 Schemas (NEW)

### backend/conversation/schemas/

**conversation_state.py** (241 lines)
- `ConversationState` - Main state class
- `ConversationPhase` - 7 phases (enum)
- `UserProfile` - 5 profiles (enum)
- `PhaseTransition` - State transitions
- `PHASE_TRANSITIONS` - Valid paths

**Classes:**
- `ConversationState` - Tracks conversation lifecycle
- `PhaseTransition` - Defines allowed transitions

**Enums:**
- `ConversationPhase` - WELCOME through FINISHED
- `UserProfile` - CLIENT, LAWYER, FIRM, SUPPORT, UNKNOWN

---

## 📋 How to Use These Files

### For Understanding Darwin's Brain
**Read in order:**
1. DARWIN_PHASE_2_SUMMARY.md (15 min)
2. PHASE_2_COMPLETE.txt (10 min)
3. DARWIN_COMMERCIAL_BRAIN_REPORT.md (30 min)

### For Specific Component Details
**Playbooks:** `backend/conversation/playbooks/[name].md`
**Knowledge:** `backend/conversation/knowledge/[name].md`
**Policies:** `backend/conversation/policies/[name].md`

### For Implementation
**Decision logic:** `commercial_decision_service.py`
**State tracking:** `conversation_state.py`
**Core flow:** `commercial.md` playbook

### For Reference
**Architecture:** DARWIN_COMMERCIAL_BRAIN_REPORT.md
**Quick lookup:** DARWIN_PHASE_2_SUMMARY.md
**Visual guide:** PHASE_2_COMPLETE.txt

---

## 🎯 By Use Case

### "I need to understand Darwin's personality"
→ Read: commercial.md, vision.md

### "I need to add a new playbook"
→ Reference: client.md or lawyer.md, then create new file

### "I need to know what Darwin knows"
→ Browse: backend/conversation/knowledge/ directory

### "I need to understand compliance"
→ Read: legal.md, privacy.md, security.md, commercial.md

### "I need to implement Phase 3"
→ Reference: DARWIN_COMMERCIAL_BRAIN_REPORT.md section "Ready for Phase 3"

### "I need to debug a conversation"
→ Check: conversation_state.py, commercial_decision_service.py

### "I need to customize the flow"
→ Edit: Relevant playbook in backend/conversation/playbooks/

---

## 📊 File Statistics

| Category | Files | Lines | Purpose |
|----------|-------|-------|---------|
| Playbooks | 5 | 742 | Conversation flows |
| Knowledge | 8 | 1,125 | Company information |
| Policies | 4 | 1,117 | Guardrails |
| Services | 1 | 322 | Decision logic |
| Schemas | 1 | 241 | State tracking |
| **Total** | **19** | **~3,547** | **Full framework** |

---

## 🔍 Finding Information

### "Where is...?"

**Conversation flows?**
→ `backend/conversation/playbooks/`

**Company information?**
→ `backend/conversation/knowledge/company.md`

**Pricing information?**
→ `backend/conversation/knowledge/pricing.md`

**FAQ answers?**
→ `backend/conversation/knowledge/faq.md`

**Legal compliance?**
→ `backend/conversation/policies/legal.md`

**Data protection?**
→ `backend/conversation/policies/privacy.md`

**Security standards?**
→ `backend/conversation/policies/security.md`

**Sales ethics?**
→ `backend/conversation/policies/commercial.md`

**Profile identification?**
→ `commercial_decision_service.py`

**Conversation phases?**
→ `conversation_state.py`

**Core architecture?**
→ DARWIN_COMMERCIAL_BRAIN_REPORT.md

---

## 🚀 Getting Started

### Step 1: Understand the Concept (5 min)
→ Read first paragraph of DARWIN_PHASE_2_SUMMARY.md

### Step 2: Learn the Architecture (20 min)
→ Read PHASE_2_COMPLETE.txt (visual overview)

### Step 3: Deep Dive (45 min)
→ Read DARWIN_COMMERCIAL_BRAIN_REPORT.md

### Step 4: Explore Components (30 min)
→ Browse playbooks, knowledge, policies directories

### Step 5: Implementation Planning (as needed)
→ Reference specific files based on component

---

## ✅ Verification Checklist

- [✓] 5 playbooks created and documented
- [✓] 8 knowledge files created and documented
- [✓] 4 policy files created and documented
- [✓] DecisionService implemented
- [✓] ConversationState implemented
- [✓] Main architecture report written (826 lines)
- [✓] Quick summary written (380 lines)
- [✓] Visual guide written (506 lines)
- [✓] This index created

---

## 🎓 Learning Path

**Beginner (2 hours)**
1. DARWIN_PHASE_2_SUMMARY.md
2. PHASE_2_COMPLETE.txt (visual)
3. One playbook example

**Intermediate (4 hours)**
1. DARWIN_COMMERCIAL_BRAIN_REPORT.md (complete)
2. All playbooks
3. Policy framework

**Expert (6+ hours)**
1. All documentation
2. Service implementation
3. Schema design
4. Phase 3 planning

---

## 📞 Documentation Questions

**"What is this file for?"**
→ Check the description in this index or read the file header

**"Where do I find [topic]?"**
→ Use the "Finding Information" section above

**"How do I [task]?"**
→ Find task in "By Use Case" section

**"Is this explained anywhere?"**
→ Search DARWIN_COMMERCIAL_BRAIN_REPORT.md (most comprehensive)

---

## 🔗 Cross-References

**Phase 1 Foundation**
→ See: DARWIN_CORE_FOUNDATION_REPORT.md

**Overall Project**
→ See: README_DARWIN.md, START_HERE.md

**Phase 3 Planning**
→ See: DARWIN_COMMERCIAL_BRAIN_REPORT.md section "Ready for Phase 3"

**All Documentation**
→ See: DARWIN_DOCUMENTATION_INDEX.md (entire project)

---

**Status:** ✅ Phase 2 Complete  
**Version:** 0.1  
**Next:** Phase 3 - AI & Persistence Integration

*Everything you need to understand, implement, and extend Darwin's Commercial Brain.*
