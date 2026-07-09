# LEGAL VERTICAL IMPLEMENTATION PLAN
**Punto Cero Legal Enterprise Vertical Architecture**

Version: 1.0 | Status: SPECIFICATION | Frozen Date: [Execution Gate]

---

## EXECUTIVE SUMMARY

Punto Cero Legal is the **first official vertical application** of Punto Cero System OS. This document defines the complete functional, technical, operational, and commercial architecture required to:

1. Launch a **SaaS LegalTech platform** serving legal professionals, law firms, and enterprise clients
2. **Reuse exclusively** the Enterprise Kernel without modification
3. **Operate initially in Colombia** with multi-country/multi-currency/multi-language readiness
4. **Scale horizontally** across Latin America without architectural redesign
5. **Serve as the template** for all future verticals

---

## ARCHITECTURE GOVERNANCE

### Constraints (MANDATORY)
- **Kernel Integrity**: Zero modifications to System Kernel (ARCHITECTURE_FREEZE_v1.0 protected)
- **Vertical Separation**: All business logic isolated from kernel coordination
- **Event-Driven Only**: Integration with other components via Event Bus exclusively
- **Multi-Tenancy**: Organization/company/user isolation via Kernel Identity
- **No Duplication**: Shared services (auth, config, audit, resources) sourced from Kernel
- **Cloud-Neutral**: Compatible with AWS, Azure, GCP without vendor-specific logic
- **Provider-Agnostic AI**: All AI services route through AI Orchestration Layer

### Compliance Foundation
- Enterprise Trust, Security & Governance Framework (Phase Ω.11) is baseline
- Zero-Trust model applies to all Legal vertical access
- All legal operations subject to audit trail (Kernel Audit Engine)
- Compliance with Colombia (RUES, DIAN, Superintendencies) + LATAM-ready

---

## FUNCTIONAL SCOPE

### Core Business Domains

#### 1. Client Management (B2B)
- Law firm onboarding and profile management
- Client organization hierarchy (enterprise clients)
- Client relationship lifecycle
- Billing contacts and admin contacts
- Multi-organization support (corporate clients managing multiple legal entities)

#### 2. Professional Management
- Lawyer registration and certification tracking
- Bar association status and license renewal
- Specialization taxonomy and skills matrix
- Availability calendars and workload distribution
- Performance and reputation tracking

#### 3. Matter Management (Legal Cases)
- Matter creation and case intake
- Case classification (litigious, advisory, transactional)
- Matter lifecycle states (intake → closure)
- Multi-lawyer matter assignment
- Matter-level access control and confidentiality

#### 4. Document Management
- Document versioning and collaborative editing
- Legal template library (contracts, motions, briefs)
- AI-assisted document generation
- Document classification and tagging
- Secure document storage with encryption
- e-signature integration

#### 5. Legal Marketplace
- Service publishing by law firms and freelance attorneys
- Service discovery and search
- Lawyer profile visibility (public/private)
- Service pricing and availability management
- Referral and direct engagement workflows
- Commission and revenue sharing management

#### 6. CRM Integration
- Client communication history (conversations, emails, meetings)
- Contact management with organizational context
- Activity logging (calls, meetings, documents)
- WhatsApp integration for client communication
- Notification and reminder system

#### 7. Financial Management
- Matter-based time tracking and billing
- Invoice generation and payment processing
- Subscription management (firm subscriptions, add-ons)
- Commission calculation (marketplace transactions)
- Revenue and expense tracking
- Multi-currency support (COP, USD, EUR, etc.)

#### 8. Workflow & Automation
- Matter intake workflows
- Document review and approval workflows
- Client onboarding workflows
- Payment approval workflows
- Case escalation workflows
- Automated deadline and reminder triggers

#### 9. Legal Analytics & Intelligence
- Case outcome analytics
- Attorney productivity metrics
- Client value metrics
- Market pricing analytics
- Demand forecasting
- Performance dashboards

---

## KERNEL INTEGRATION POINTS

### 1. Identity Kernel
**What it provides**: User/organization identity, federation, multi-tenant isolation

**Legal Vertical Usage**:
- Law firm registration as Organization
- Lawyer user profiles with role-based permissions
- Client organization profiles
- Multi-level hierarchy: Enterprise Client → Legal Contact → Individual User
- SSO for enterprise clients
- API key management for integrations

**Data Contracts**:
```
User Aggregate:
  id: UUID (system-assigned)
  organizationId: UUID (law firm, marketplace, enterprise client)
  email: string
  roles: [lawyer | law_firm_admin | client_contact | marketplace_buyer | client_user]
  attributes: {legalSpecialties, barNumber, certifications, ...}
  permissions: [matters:read, documents:write, billing:read, ...]

Organization Aggregate:
  id: UUID
  type: [law_firm | marketplace_provider | enterprise_client]
  registrationNumber: string (RUES, tax ID)
  legalName: string
  jurisdiction: string (country, state)
  profile: {specializations, teamSize, yearsInBusiness, ...}
  subscriptionTier: [free | professional | enterprise]
```

**Events Consumed**:
- `identity.user.created` → Create lawyer/admin profile
- `identity.user.updated` → Sync role/permission changes
- `identity.organization.created` → Register law firm
- `identity.organization.membership.added` → Add user to law firm

**Events Produced**:
- `legal.lawyer.registered`
- `legal.firm.registered`
- `legal.client_organization.onboarded`

---

### 2. Security Kernel
**What it provides**: Authentication, authorization, encryption, secrets, audit logging

**Legal Vertical Usage**:
- Zero-Trust policy enforcement (access to matters, documents, financials)
- Matter-level confidentiality enforcement (attorney-client privilege)
- API security for marketplace integrations
- Document encryption at rest
- Secure webhook delivery for external integrations
- Session security for web/mobile clients

**Security Policies**:
```
Matter Access Policy:
  actor: User
  resource: Matter
  context: {organizationId, matterTeam, clientId, ...}
  decision: RBAC + ABAC
  
  Rules:
    - law_firm_partner > ANY matter in firm
    - lawyer > ASSIGNED matter only
    - admin > ALL matters in org
    - client_contact > OWN client's matters
    
  Enforcement: Kernel Security, Kernel Authorization
```

**Audit Events** (routed to Kernel Audit Engine):
- matter.accessed
- document.downloaded
- payment.processed
- invoice.viewed
- lawyer.assigned

---

### 3. Governance Kernel
**What it provides**: Policy management, compliance rules, approval workflows, attestation

**Legal Vertical Usage**:
- Jurisdiction-based legal compliance rules (Colombia, Peru, Mexico, etc.)
- Document signature policy enforcement
- Invoice approval workflows
- Matter escalation policies
- Client data retention policies
- AI validation workflows (human approval required)

**Governance Objects**:
```
Policy: "BrazilianLegalCompliance"
  AppliesTo: Organization where jurisdiction="Brazil"
  Rules:
    - documents.signature.method: "Digital certificate OIK"
    - documents.storage.location: "Brazil (data residency)"
    - audit.language: "Portuguese"
    - invoice.tax.rules: "Brazilian tax code"
    - pricing.currency: "BRL"

Policy: "AIGeneratedDocumentApproval"
  AppliesTo: Document.source="ai_generated"
  Rules:
    - requires.human.review: true
    - requires.lawyer.signature: true
    - logs.prompt: true
    - logs.model.version: true
```

**Events**:
- Consumes: `governance.policy.updated`
- Produces: `legal.document.approval_required`, `legal.workflow.policy_applied`

---

### 4. Event Bus
**What it provides**: Asynchronous event distribution, ordering, replay, dead-letter handling

**Legal Vertical Event Catalog**:

**Client Domain Events**:
- `legal.client.registered`
- `legal.client.subscription.activated`
- `legal.client.subscription.downgraded`
- `legal.client.subscription.cancelled`

**Matter Domain Events**:
- `legal.matter.created`
- `legal.matter.assigned_to_lawyer`
- `legal.matter.team_member_added`
- `legal.matter.status_changed`
- `legal.matter.deadline_approaching`
- `legal.matter.closed`

**Document Domain Events**:
- `legal.document.created`
- `legal.document.version_published`
- `legal.document.ai_generated`
- `legal.document.awaiting_review`
- `legal.document.signed`

**Financial Domain Events**:
- `legal.invoice.created`
- `legal.invoice.approved`
- `legal.invoice.sent_to_client`
- `legal.payment.received`
- `legal.timesheet.submitted`
- `legal.timesheet.approved`

**Marketplace Domain Events**:
- `legal.service.published`
- `legal.service.inquiry_received`
- `legal.engagement.booked`
- `legal.engagement.completed`
- `legal.engagement.rated`
- `legal.commission.calculated`

**Integration Patterns**:
```
Event: matter.created
  Source: Legal Vertical (Matter Service)
  Routing:
    → CRM (create contact record)
    → Analytics (pipeline event)
    → AI Orchestration (load knowledge base)
    → Workflow Engine (start matter intake process)
    → Notification Engine (notify assigned lawyer)

Guarantees:
  - At-least-once delivery
  - Order preservation by matterTeamId
  - 30-day replay window
  - DLQ for processing failures
```

---

### 5. Process Manager (Workflow Engine)
**What it provides**: Stateful workflow orchestration, compensation, retry, approval points

**Legal Vertical Workflows**:

**Matter Intake Workflow**:
```yaml
Workflow: "MatterIntake"
  Version: 1.0
  Trigger: matter.create_request
  Steps:
    1. ValidateClientInfo (sync)
        Service: client_service
        OnSuccess: CheckCompliance
        OnFailure: RequestMoreInfo
        
    2. CheckCompliance (sync)
        Service: governance_service
        Context: {jurisdiction, clientType}
        OnSuccess: AssignLawyer
        OnFailure: NotifyAdministrator
        
    3. AssignLawyer (async)
        Service: resource_manager
        Resource: lawyer_availability
        OnSuccess: CreateMatter
        OnFailure: EscalateToPrincipal
        
    4. CreateMatter (sync)
        Service: matter_service
        Data: {clientId, assignedLawyer, documents}
        OnSuccess: NotifyParties
        OnFailure: RollbackAndNotify
        
    5. NotifyParties (async)
        Service: notification_engine
        Recipients: [lawyer, client, manager]
        Compensation: true (undo if later step fails)
        
  CompensationSteps:
    - IF CreatedMatter: call matter_service.delete(matterid)
    - IF SentNotifications: call notification_engine.recall(...)
```

**Document Approval Workflow**:
```yaml
Workflow: "DocumentApprovalForAIGenerated"
  Trigger: document.created where source="ai_generated"
  Steps:
    1. LogPromptAndModel (audit)
        Context: {prompt, modelVersion, generationTimestamp}
        
    2. CreateApprovalTask
        Assigned: primary_lawyer
        Deadline: 2_hours
        
    3. AwaitApproval (human)
        Timeout: 24_hours
        Escalation: supervisor_review
        
    4. OnApproved
        Service: document_service
        Action: publish_version
        Event: document.signed_and_published
        
    5. OnRejected
        Action: document.marked_as_draft
        Notify: AI system (feedback for training)
```

---

### 6. Resource Manager
**What it provides**: Resource allocation, quota management, capacity planning, scaling signals

**Legal Vertical Resources**:

**Digital Resources**:
- Lawyer hours (capacity pool, billable/non-billable)
- Document generation quota (AI tokens)
- Meeting minutes quota
- Storage quota per organization

**Physical Resources**:
- Virtual meeting rooms (Zoom, Teams integrations)
- Phone numbers (for client hotline)

**Financial Resources**:
- Monthly subscription credit pool
- Commission reserve account
- Refund reserve account

**Resource Allocation Model**:
```
Organization: LawFirmXYZ (Enterprise subscription)
  Resources:
    - lawyer_hours: {allocated: 160/month, used: 125, available: 35}
    - document_generation: {allocated: 500/month, used: 320, available: 180}
    - storage: {allocated: 100GB, used: 65GB, available: 35GB}
    - meeting_rooms: {allocated: 10, used: 3, available: 7}

  Scaling Rules:
    IF used > 80% of lawyer_hours:
      → trigger.notification("Consider upgrade")
      → trigger.analytics.event("capacity_warning")
    IF used > 90%:
      → enforce.hard_limit
```

**Events**:
- Consumes: `legal.invoice.paid` → allocate resources
- Produces: `resource.allocation_warning`, `resource.limit_exceeded`

---

### 7. AI Orchestration Layer
**What it provides**: Provider-agnostic AI service routing, model versioning, fallback, governance

**Legal Vertical AI Services**:

**Document Generation**:
- Generate contract drafts (with jurisdiction customization)
- Generate legal motions and briefs
- Generate meeting summaries
- Model provider: OpenAI GPT-4 (primary) → Anthropic Claude (fallback) → Google PaLM (fallback)
- Governance: Lawyer must review before publishing

**Document Analysis**:
- Extract key clauses from contracts
- Identify risks and red flags
- Summarize case files
- Model provider: specialized legal model (fine-tuned) → GPT-4 (fallback)

**Search & Discovery**:
- Semantic search across case history
- Find similar past cases
- Recommend precedents
- Model provider: Embedding API (OpenAI) → Anthropic Claude (fallback)

**Classification**:
- Auto-classify documents (contract, motion, brief, etc.)
- Auto-classify legal areas (corporate, litigation, IP, etc.)
- Model provider: Specialized classifier → GPT-4 (fallback)

**AI Service Integration**:
```
Service: GenerateContractDraft
  Input: {
    contractType: "NDA",
    jurisdiction: "Colombia",
    parties: [{name, country, type}],
    context: {industry, dealValue, specialTerms}
  }
  
  AI Orchestration Flow:
    1. Check governance.policy for jurisdiction
    2. Route to primary_model(OpenAI GPT-4)
    3. Execute with prompt + context
    4. OnSuccess: Return draft, store prompt+response for audit
    5. OnFailure (rate limit): Retry with fallback_model(Claude)
    6. OnFailure (model error): NotifyAdministrator, suggest_manual_creation
    
  Output: {
    draft: string (markdown),
    promptUsed: string,
    modelUsed: string,
    generatedAt: timestamp,
    requiresReview: true
  }
  
  Audit Trail:
    - Logs to Kernel Audit Engine
    - Evidence: {prompt, response, review_notes, final_approval}
    - Non-repudiation: signed by reviewing lawyer
```

**AI Governance Rules** (via Governance Kernel):
```
Policy: "AIGeneratedDocumentRequirementsLatAm"
  Applies: All AI-generated legal documents
  Rules:
    - lawyer.review.mandatory: true
    - lawyer.signature.mandatory: true
    - audit.retention.years: 7
    - audit.logs.include: [prompt, model_version, temperature, timestamp]
    - fallback.chain: [OpenAI → Anthropic → GooglePalm → HumanDraft]
    - cost.tracking: billable_to_matter
```

---

### 8. Configuration Center
**What it provides**: Centralized configuration, multi-level hierarchy, versioning, encryption

**Legal Vertical Configuration Hierarchy**:

```
Level 1: GLOBAL (System-wide defaults)
  - AI model defaults (gpt-4-turbo)
  - Default approval workflows
  - Event retention policies
  - Standard SLAs

Level 2: COUNTRY (jurisdiction-specific)
  - Colombia: {language: Spanish, currency: COP, taxId: NIT, compliance: RUES}
  - Mexico: {language: Spanish, currency: MXN, taxId: RFC, compliance: SAT}
  - Brazil: {language: Portuguese, currency: BRL, taxId: CNPJ, compliance: Receita}

Level 3: VERTICAL (Legal business rules)
  - Document signature method: Digital + wet
  - Invoice frequency: Monthly
  - Audit retention: 7 years
  - Confidentiality model: Attorney-client privilege

Level 4: ORGANIZATION (Law firm-specific)
  - Billing rates: {junior: $50/hr, senior: $150/hr, partner: $300/hr}
  - Matter types: {litigious, advisory, transactional}
  - Approval thresholds: {invoice > $10k requires partner approval}
  - Operating hours: {timeZone, businessDays, holidays}

Level 5: USER (Individual preferences)
  - Notification preferences: {email, sms, in-app}
  - Dashboard customization
  - Calendar sync preferences

Level 6: REGION (Geographic sub-division)
  - Regional compliance rules
  - Regional SLAs
  - Regional pricing adjustments

Level 7: CHANNEL (Communication channel config)
  - WhatsApp business account config
  - Email template overrides
  - Webhook URL per channel

Level 8: CLIENT (Enterprise client-specific)
  - Client-specific billing codes
  - Client-specific compliance requirements
  - Client-specific communication rules
```

**Configuration Objects**:
```
Config: "ColombiaComplianceConfig"
  Scope: {country: Colombia}
  Values:
    signatureMethod: ["digital_certificate_OIK", "wet_signature"]
    auditLanguage: Spanish
    taxRules: DIAN2024
    dataResidency: Colombia_only
    invoiceNumbering: "{YEAR}-{SEQUENTIAL}"
    invoiceDeadlinePayment: 30_days
    timeTracking: required_for_all_matters

Config: "LawFirmXYZBillingConfig"
  Scope: {organization: firm-xyz}
  Values:
    billingRates:
      associate: 75
      counsel: 150
      partner: 300
    invoiceFrequency: monthly
    invoiceApprovalThreshold: 5000 (requires manager)
    discountForLargeMatters: 0.10
```

**Events**:
- Consumes: `configuration.changed` → Apply changes to all Legal services
- Produces: `legal.config_applied`, `legal.billing_config_changed`

---

### 9. Notification Engine
**What it provides**: Multi-channel notification delivery, scheduling, preferences, templates

**Legal Vertical Notification Types**:

**Lawyer Notifications**:
- Matter assignment
- New client inquiry
- Document awaiting review
- Deadline approaching (48h, 24h, 12h)
- Invoice approved
- Client payment received
- Marketplace service inquiry

**Client Notifications**:
- Case update
- Invoice created
- Invoice due (7d, 1d)
- Document ready for signature
- Appointment reminder
- New message from lawyer

**Admin Notifications**:
- Escalation required (unassigned matter)
- High-value transaction
- Compliance violation
- Performance alert

**Multi-Channel Delivery**:
```
Notification: MattersAssigned
  Recipient: lawyer
  Channels:
    - in_app: {priority: high, actionable: true}
    - email: {template: matter_assigned_email, delay: immediate}
    - sms: {text: "New matter assigned: #{matterName}", if: user.sms_opt_in}
    - whatsapp: {if: user.whatsapp_enabled, template: matter_summary}
    - notification_badge: {count: matters_pending}

  Scheduling:
    - send_time: 09:00 in user's timezone
    - if_no_response_in: 24h
    - escalate_to: supervisor

  Preferences Override: User can mute/disable per channel
```

---

### 10. Observability (System Telemetry)
**What it provides**: Metrics, tracing, logging, alerting, SLA monitoring

**Legal Vertical Observability**:

**Key Metrics**:
- Matter creation rate
- Average matter resolution time
- Lawyer utilization rate (hours billable / hours available)
- Client retention rate
- Invoice-to-payment time
- Document generation time (AI)
- API response time (marketplace)

**Business Metrics**:
- MRR (Monthly Recurring Revenue)
- ARPU (Average Revenue Per User)
- Churn rate
- Commission payout rate
- Marketplace transaction volume

**System Health Metrics**:
- Database query latency
- Event processing latency
- AI service response time
- Integration webhook success rate
- Data consistency checks (eventual consistency validation)

**Alerting Rules**:
```
Alert: "HighMatterCreationFailureRate"
  Trigger: failure_rate(matter.create) > 5% over 5_minutes
  Severity: high
  Route: [on_call_engineer, product_manager]

Alert: "LowLawyerUtilization"
  Trigger: avg_utilization(lawyers) < 40% over 1_week
  Severity: medium
  Route: [operations_manager]

Alert: "AIServiceLatency"
  Trigger: p99(ai_orchestration_latency) > 5_seconds
  Severity: critical
  Route: [on_call_engineer, ai_team]
```

**Audit Trail** (via Kernel Audit Engine):
- All document edits with who/when/what changed
- All financial transactions with full context
- All matter assignments with reasoning
- All AI-generated content with prompt + model version
- All compliance checks with pass/fail reason

---

## DEPLOYMENT STRATEGY

### Deployment Architecture

**Multi-Tier Deployment**:
```
┌─────────────────────────────────────────────┐
│   API Gateway (Kong, rate limiting, auth)   │
└──────────────┬──────────────────────────────┘
               │
┌──────────────┴──────────────────────────────┐
│    Load Balancer (Kubernetes Ingress)       │
└────────┬────────────────────────────┬───────┘
         │                            │
    ┌────▼────┐            ┌─────────▼───────┐
    │  Web    │            │ Mobile App      │
    │ Client  │            │ (iOS/Android)   │
    │(React)  │            │                 │
    └────┬────┘            └────────┬────────┘
         │                          │
    ┌────▼──────────────────────────▼─────┐
    │  Legal Vertical Service Mesh        │
    │  (Istio, mTLS, observability)       │
    └────┬──────────────────────────┬─────┘
         │                          │
    ┌────▼──────┐  ┌──────────┐  ┌─▼──────────┐
    │ Matter     │  │Document  │  │ Marketplace│
    │ Service    │  │ Service  │  │ Service    │
    │            │  │          │  │            │
    │ (Domain)   │  │(Domain)  │  │ (Domain)   │
    └────────────┘  └──────────┘  └────────────┘
         │              │              │
    ┌────▼──────────────▼──────────────▼─────┐
    │    Kernel Integration Layer            │
    │  (Event Bus, Security, Config, etc.)   │
    └────┬──────────────────────────┬────────┘
         │                          │
    ┌────▼──────┐  ┌──────────┐  ┌─▼──────────┐
    │PostgreSQL  │  │Event Log │  │ Redis      │
    │(Matters,   │  │(Append   │  │ (Cache,    │
    │Docs,Users) │  │Only)     │  │ Sessions)  │
    └────────────┘  └──────────┘  └────────────┘
```

### Kubernetes Deployment Model

**Namespace Strategy**:
```
punto-cero-legal-prod/
  ├─ matter-service (3 replicas)
  ├─ document-service (3 replicas)
  ├─ marketplace-service (3 replicas)
  ├─ crm-service (3 replicas)
  ├─ financial-service (2 replicas)
  ├─ notification-service (2 replicas)
  ├─ integration-service (2 replicas)
  └─ ai-orchestration-client (2 replicas)
  
Kernel Services (shared):
  ├─ event-bus (3 replicas)
  ├─ identity-service (3 replicas)
  ├─ security-service (3 replicas)
  ├─ configuration-service (2 replicas)
  └─ audit-service (3 replicas)
```

**Database Sharding Strategy**:
```
Primary Key Pattern: {organizationId}_{sequentialId}

Shard Mapping: organizationId % 8 = shard_number
  Shard 0: Organizations [0000-1fff]
  Shard 1: Organizations [2000-3fff]
  ...
  Shard 7: Organizations [e000-ffff]

Matters Table:
  matterid = "{organizationId}_{matterSequence}_{country}"
  Primary: {matterid}
  Index: {organizationId, createdAt} (for list queries)
  Index: {lawyerId, status} (for lawyer's workload)

Scaling:
  - Each shard is a separate PostgreSQL cluster (primary + 2 replicas)
  - Read traffic distributed to replicas
  - Writes routed to primary, then replicated
  - Backup: continuous replication to warm standby
```

### Phased Rollout

**Phase 1: MVP (Weeks 1-8)**
- Matter management (create, assign, close)
- Basic document storage and versioning
- Lawyer and client onboarding
- Time tracking and basic invoicing
- Email integration for notifications
- Single-country: Colombia

**Phase 2: CRM & Marketplace (Weeks 9-16)**
- Full CRM integration
- Marketplace service publishing
- Service discovery and booking
- Commission calculation

**Phase 3: Advanced Automation (Weeks 17-24)**
- Workflow engine integration
- Deadline tracking and reminders
- Approval workflows
- Payment automation

**Phase 4: AI Integration (Weeks 25-32)**
- AI document generation
- Document analysis and classification
- Semantic search
- Contract risk detection

**Phase 5: Multi-Country (Weeks 33-40)**
- Mexico deployment
- Brazil deployment
- Multi-currency support
- Localization (Spanish, Portuguese)
- Jurisdiction-specific compliance

**Phase 6: Marketplace Maturity (Weeks 41-48)**
- Advanced matching algorithms
- Reputation and rating system
- Provider analytics dashboard
- Commission payout automation

**Phase 7: Enterprise Scale (Weeks 49+)**
- Enterprise client support
- Advanced reporting and analytics
- SLA management
- White-label capability

---

## DEPENDENCY MATRIX

### Kernel Dependencies (MANDATORY)
| Legal Component | Identity | Security | Event Bus | Config | Resource Manager | AI Orchestration | Audit |
|---|---|---|---|---|---|---|---|
| Matter Service | ✓ (org, user) | ✓ (access control) | ✓ (events) | ✓ (SLAs) | ✓ (capacity) | — | ✓ (all changes) |
| Document Service | ✓ (user) | ✓ (encryption, access) | ✓ (versioning events) | ✓ (retention policy) | ✓ (storage quota) | ✓ (generation) | ✓ (AI logs) |
| Marketplace | ✓ (lawyer profile) | ✓ (service access) | ✓ (booking events) | ✓ (pricing rules) | ✓ (availability) | — | ✓ (transactions) |
| Financial | ✓ (user, org) | ✓ (payment auth) | ✓ (invoice events) | ✓ (rates, tax rules) | ✓ (credit pool) | — | ✓ (all payments) |
| CRM | ✓ (user, contact) | ✓ (data access) | ✓ (communication events) | ✓ (templates) | — | — | ✓ (conversations) |

### Internal Dependencies
```
Matter Service
  ├─ depends: Document Service (documents in matters)
  ├─ depends: CRM Service (client data)
  └─ depends: Financial Service (time tracking, billing)

Document Service
  ├─ depends: Matter Service (documents belong to matters)
  ├─ depends: AI Orchestration (generation)
  └─ depends: Integration Service (e-signature)

Financial Service
  ├─ depends: Matter Service (billing scope)
  ├─ depends: CRM Service (client billing address)
  └─ depends: Marketplace Service (commission calculation)

Marketplace Service
  ├─ depends: CRM Service (lawyer profiles)
  └─ depends: Financial Service (payment processing)
```

---

## COMPLIANCE & REGULATORY FRAMEWORK

### Colombia Initial Deployment
- **Tax ID**: NIT (Número de Identificación Tributaria)
- **Business Registry**: RUES (Registro Único Empresarial y Social)
- **Legal Framework**: Código de Procedimiento Administrativo y de lo Contencioso Administrativo (CPACA)
- **Data Protection**: Ley 1581 de 2012 (Colombian Privacy Law)
- **Document Signature**: Ley 527 de 1999 (Digital Signature Law)
- **Accounting**: NIIF (International Financial Reporting Standards)

### Multi-Country Readiness
Configuration at COUNTRY level:
```
CountryConfig: Colombia
  taxRules: DIAN regulations
  signatureLaw: Ley 527
  dataResidency: within_country
  language: Spanish
  currency: COP
  businessRegistry: RUES

CountryConfig: Mexico
  taxRules: SAT regulations
  signatureLaw: Ley de Firma Electrónica
  dataResidency: within_country
  language: Spanish
  currency: MXN
  businessRegistry: SAT

CountryConfig: Brazil
  taxRules: Receita regulations
  signatureLaw: Lei 14.063
  dataResidency: within_country
  language: Portuguese
  currency: BRL
  businessRegistry: CNPJ
```

---

## OPEN QUESTIONS & ASSUMPTIONS

### Assumptions Made
1. **Lawyer licensing**: Assume bar association data (state-issued licenses) is external and verified via integration
2. **E-signature providers**: Assume partnerships with regional e-signature providers (Colombia: Legaltech partners, Brazil: native providers)
3. **Payment processing**: Assume integration with regional payment gateways (Stripe, Adyen, local providers per country)
4. **WhatsApp Business**: Assume integration via WhatsApp Business API (requires provider account)
5. **AI model availability**: Assume access to OpenAI, Anthropic, Google APIs with fallback chain

### Design Decisions Deferred
- **Time entry granularity**: Hourly vs. 6-minute increments vs. free-form (to be decided based on market feedback)
- **Matter state machine**: Exact states and transitions (to be finalized in LEGAL_BUSINESS_ENGINE.md)
- **Marketplace commission**: Fixed percentage vs. sliding scale vs. market-based (to be finalized in LEGAL_REVENUE_MODEL.md)
- **AI temperature/creativity**: Model parameters for document generation (to be determined during Phase 4)

---

## COMPLETION CRITERIA

**This document is complete when**:
- ✓ Functional scope fully enumerated
- ✓ All Kernel integration points mapped
- ✓ Deployment architecture defined
- ✓ Dependency matrix complete
- ✓ Compliance framework established
- ✓ Phased rollout plan defined
- ✓ No Kernel modifications required
- ✓ Ready for LEGAL_BUSINESS_ENGINE.md

---

## STATUS

**Document Version**: 1.0  
**Frozen**: No (awaiting Phase Ω.12 execution approval)  
**Ready for next deliverable**: Yes  
**Blockers**: None  

---

*End of LEGAL_VERTICAL_IMPLEMENTATION_PLAN.md*
