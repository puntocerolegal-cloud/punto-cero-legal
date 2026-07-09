# LEGAL BUSINESS ENGINE
**Punto Cero Legal Domain Model & Business Logic**

Version: 1.0 | Status: SPECIFICATION | Frozen Date: [Execution Gate]

---

## EXECUTIVE SUMMARY

The Legal Business Engine is the **domain-specific core** of Punto Cero Legal. It defines:

1. **Business entities** (aggregates, entities, value objects) using Domain-Driven Design
2. **Business rules** and state machines that enforce legal domain logic
3. **Business capabilities** organized by subdomain
4. **Integration points** with the Enterprise Kernel
5. **Multi-country, multi-currency, multi-language support**

All business logic is **vertical-specific**. All cross-cutting concerns (identity, security, events, config) are delegated to the Kernel.

---

## DOMAIN-DRIVEN DESIGN STRUCTURE

### Ubiquitous Language (Enterprise Domain Model)

**Core Legal Entities**:
- **Organization**: A law firm, in-house legal team, or legal service provider
- **Lawyer**: A licensed legal professional
- **Client Organization**: A business or individual requiring legal services
- **Matter**: A legal case, project, or advisory engagement
- **Document**: Legal content (contracts, motions, briefs, templates)
- **Service**: A marketplace offering by a lawyer or firm
- **Engagement**: A completed marketplace transaction
- **Invoice**: Billing record for work performed
- **Timesheet**: Time entry for matter-based billing

**Supporting Concepts**:
- **Specialization**: Legal practice area (Corporate, Litigation, IP, Labor, etc.)
- **Matter Status**: Lifecycle state (Intake, Active, Closed, Archived)
- **Document Type**: Classification (Contract, Motion, Brief, Memo, etc.)
- **Billing Method**: Rate type (Hourly, Fixed, Value-based, Retainer)
- **Subscription Tier**: Service level (Free, Professional, Enterprise)

---

## SUBDOMAIN 1: ORGANIZATION & PROFESSIONAL MANAGEMENT

### Organization Aggregate Root

**Aggregate**: Organization

```
Organization
  ├─ organizationId: UUID (unique identifier)
  ├─ type: enum [law_firm | marketplace_provider | internal_legal | consulting]
  ├─ legalName: string (official business name)
  ├─ registrationNumber: string (RUES, tax ID per country)
  ├─ jurisdiction: Jurisdiction (primary operating country)
  ├─ profile: OrganizationProfile
  │   ├─ description: string
  │   ├─ websiteUrl: string (optional)
  │   ├─ logoUrl: string (optional)
  │   ├─ specializations: [Specialization] (practice areas)
  │   ├─ teamSize: int (employees)
  │   ├─ yearsInBusiness: int
  │   ├─ certifications: [string] (ISO, quality certifications)
  │   └─ rating: decimal (marketplace only, 0-5)
  │
  ├─ subscription: Subscription
  │   ├─ tier: enum [free | professional | enterprise]
  │   ├─ startDate: date
  │   ├─ renewalDate: date
  │   ├─ status: enum [active | suspended | cancelled]
  │   ├─ features: [FeatureFlag] (enabled features)
  │   └─ creditPool: decimal (prepaid credit balance)
  │
  ├─ billing: BillingConfiguration
  │   ├─ billingEmail: email
  │   ├─ billingAddress: Address
  │   ├─ taxId: string
  │   ├─ paymentMethod: PaymentMethod (Stripe, local provider)
  │   ├─ invoiceFrequency: enum [monthly | quarterly | annual]
  │   └─ autoPay: boolean
  │
  ├─ contacts: [OrganizationContact]
  │   ├─ type: enum [primary | billing | technical | legal]
  │   ├─ email: email
  │   ├─ phone: phone
  │   └─ name: string
  │
  └─ settings: OrganizationSettings
      ├─ timeZone: string (IANA timezone)
      ├─ languagePreference: enum [Spanish | Portuguese | English]
      ├─ currencyPreference: string (COP | BRL | MXN)
      ├─ dataResidency: enum [Colombia | Mexico | Brazil | LATAM]
      └─ auditRetention: int (years, default 7)

Business Rules:
  - organizationId is immutable (assigned by Kernel Identity)
  - registrationNumber must be verified against country registry
  - subscription.tier determines feature access (enforced by Kernel License Engine)
  - Only organization admins can modify billing configuration
  - Audit trail required for all changes (via Kernel Audit Engine)
```

### Lawyer Aggregate Root

```
Lawyer
  ├─ lawyerId: UUID (Kernel User identity)
  ├─ organizationId: UUID (parent firm)
  ├─ professionalProfile: ProfessionalProfile
  │   ├─ fullName: string
  │   ├─ barNumber: string (license from bar association, country-specific)
  │   ├─ barAssociation: string (college name per country)
  │   ├─ licenseExpiration: date
  │   ├─ specializations: [Specialization] (1-5 primary areas)
  │   ├─ yearsExperience: int
  │   ├─ education: [Education]
  │   │   ├─ degree: string (JD, LLM, etc.)
  │   │   ├─ university: string
  │   │   └─ graduationYear: year
  │   └─ certifications: [Certification]
  │       ├─ name: string
  │       ├─ issuer: string
  │       └─ expirationDate: date
  │
  ├─ status: enum [active | inactive | suspended | retired]
  ├─ availability: LawyerAvailability
  │   ├─ workingHoursPerWeek: int (capacity)
  │   ├─ currentWorkload: int (hours allocated)
  │   ├─ availableHours: computed = workingHoursPerWeek - currentWorkload
  │   ├─ specialties: [Specialization] (case types can handle)
  │   ├─ languages: [Language]
  │   ├─ geographicCoverage: [Region] (states/countries willing to serve)
  │   └─ rateCard: RateCard
  │       ├─ hourlyRate: decimal (billing rate)
  │       ├─ fixedFeeRate: decimal (per-project base rate)
  │       ├─ effectiveDate: date
  │       └─ currencyCodes: [string] (COP, USD, etc.)
  │
  ├─ marketplace: MarketplaceProfile (optional, if offering services)
  │   ├─ isActive: boolean
  │   ├─ services: [Service]
  │   ├─ rating: decimal (0-5, avg of all engagements)
  │   ├─ reviewCount: int
  │   ├─ responseTime: Hours (avg response to inquiries)
  │   └─ acceptanceRate: decimal (% of inquiries accepted)
  │
  ├─ performance: PerformanceMetrics
  │   ├─ casesCompletedYTD: int
  │   ├─ averageCaseResolutionDays: int
  │   ├─ clientSatisfactionScore: decimal (0-5)
  │   ├─ billableHoursYTD: decimal
  │   ├─ revenueGeneratedYTD: decimal
  │   └─ costOfWork: decimal (overhead allocation)
  │
  └─ settings: LawyerSettings
      ├─ defaultBillingRate: decimal
      ├─ preferredLanguages: [Language]
      ├─ notificationPreferences: NotificationPreference
      ├─ matterFocusAreas: [Specialization] (preferred case types)
      └─ outOfOfficeUntil: date (optional, if on leave)

Business Rules:
  - barNumber.country must match organizationId.jurisdiction (or lawyer is multi-country licensed)
  - licenseExpiration triggers alert at 90 days before expiration
  - availableHours is calculated as workingHoursPerWeek - sum(matter.allocatedHours)
  - Cannot assign matters if availableHours < requiredHours
  - Marketplace.isActive requires: status=active AND licenseExpiration > today + 90 days
  - Rating is immutable once matter is closed (no retroactive changes)
  - Audit trail for all profile changes (Kernel Audit Engine)
```

---

## SUBDOMAIN 2: CLIENT MANAGEMENT

### Client Organization Aggregate Root

```
ClientOrganization
  ├─ clientId: UUID
  ├─ type: enum [business | individual | government | nonprofit]
  ├─ businessInfo: BusinessInfo
  │   ├─ legalName: string
  │   ├─ registrationNumber: string (RUC, CNPJ, tax ID)
  │   ├─ industry: string (SIC classification)
  │   ├─ businessSize: enum [micro | small | medium | large | enterprise]
  │   ├─ yearFounded: year
  │   └─ headOfficeAddress: Address
  │
  ├─ contacts: [ClientContact]
  │   ├─ contactId: UUID
  │   ├─ fullName: string
  │   ├─ email: email
  │   ├─ phone: phone
  │   ├─ title: string (CEO, In-house Counsel, CFO)
  │   ├─ department: string
  │   ├─ isPrimary: boolean
  │   ├─ isDecisionMaker: boolean
  │   └─ preferredCommunication: enum [email | phone | whatsapp]
  │
  ├─ legalRepresentative: ClientRepresentative (optional)
  │   ├─ name: string
  │   ├─ title: string (In-house counsel)
  │   ├─ email: email
  │   └─ phone: phone
  │
  ├─ subscription: ClientSubscription
  │   ├─ currentPlan: SubscriptionPlan
  │   ├─ startDate: date
  │   ├─ renewalDate: date
  │   ├─ autoRenew: boolean
  │   ├─ monthlyBudget: decimal (spending limit)
  │   ├─ currentMonthlyCost: decimal
  │   └─ paymentTerms: string (Net 30, COD, etc.)
  │
  ├─ relationships: [LawyerRelationship]
  │   ├─ lawyerId: UUID
  │   ├─ type: enum [primary_counsel | secondary | on_call]
  │   ├─ startDate: date
  │   ├─ specialization: Specialization
  │   └─ status: enum [active | suspended | archived]
  │
  ├─ history: ClientHistory
  │   ├─ totalMattersOpened: int
  │   ├─ totalMattersCompleted: int
  │   ├─ cumulativeSpent: decimal
  │   ├─ averageMonthlySpend: decimal
  │   ├─ firstMatterDate: date
  │   ├─ lastMatterDate: date
  │   └─ tenure: int (years as client)
  │
  └─ settings: ClientSettings
      ├─ invoiceFrequency: enum [per_matter | monthly | quarterly]
      ├─ invoiceTo: string (address or email)
      ├─ requiresPurchaseOrder: boolean
      ├─ requiresApprovalWorkflow: boolean
      ├─ paymentTerms: int (days)
      ├─ currencyPreference: string
      └─ confidentialityLevel: enum [standard | high | top_secret]

Business Rules:
  - clientId is issued by Kernel Identity
  - businessInfo.registrationNumber must be verified (or flag as unverified)
  - At least one contact required
  - isPrimary contact uniqueness: max 1 per client
  - subscription.monthlyBudget > currentMonthlyCost triggers warning to client
  - subscription.renewalDate < today triggers renewal reminder
  - All client communications routed through Kernel CRM (Darwin)
  - Client confidentiality level affects document access (Kernel Security)
```

---

## SUBDOMAIN 3: MATTER MANAGEMENT

### Matter Aggregate Root

```
Matter
  ├─ matterId: UUID (unique per organization, not globally unique)
  ├─ organizationId: UUID (owning law firm)
  ├─ matterNumber: string (firm's internal numbering scheme)
  ├─ title: string (case name or project name)
  ├─ description: text (case summary)
  │
  ├─ parties: MatterParties
  │   ├─ clientOrganizations: [ClientReference] (paying parties)
  │   ├─ opposingParties: [Party] (opposing side, if litigious)
  │   │   ├─ name: string
  │   │   ├─ type: enum [individual | organization | government]
  │   │   ├─ representation: string (by which firm/lawyer)
  │   │   └─ contact: Contact (optional)
  │   ├─ relatedThirdParties: [Party] (co-defendants, witnesses, etc.)
  │   └─ witnesses: [Witness] (litigious matters only)
  │
  ├─ jurisdiction: MatterJurisdiction
  │   ├─ primaryJurisdiction: string (country, state)
  │   ├─ court: string (court name, if litigious)
  │   ├─ caseNumber: string (court docket number, if assigned)
  │   ├─ judge: string (assigned judge)
  │   └─ secondaryJurisdictions: [string] (multi-jurisdictional matters)
  │
  ├─ legalArea: MatterClassification
  │   ├─ primaryArea: Specialization (Corporate, Litigation, IP, Labor, etc.)
  │   ├─ secondaryAreas: [Specialization]
  │   ├─ matterType: enum [litigious | advisory | transactional | regulatory]
  │   └─ urgency: enum [routine | normal | high | critical]
  │
  ├─ status: MatterStatus
  │   ├─ currentStatus: enum [intake | active | on_hold | closed | archived]
  │   ├─ statusHistory: [StatusChange]
  │   │   ├─ status: enum
  │   │   ├─ changedAt: timestamp
  │   │   ├─ changedBy: UUID (user)
  │   │   └─ reason: string
  │   ├─ createdAt: timestamp
  │   ├─ activatedAt: timestamp (when moved from intake to active)
  │   ├─ closedAt: timestamp
  │   ├─ expectedClosureDate: date (estimated, may be updated)
  │   └─ actualClosureDate: date
  │
  ├─ team: MatterTeam
  │   ├─ leadLawyer: Lawyer (primary responsible)
  │   ├─ assignedLawyers: [Lawyer] (team members)
  │   ├─ roles: [TeamMember]
  │   │   ├─ lawyerId: UUID
  │   │   ├─ role: enum [lead | counsel | associate | paralegal | support]
  │   │   ├─ allocatedHours: int (capacity on this matter)
  │   │   └─ assignedAt: timestamp
  │   ├─ supportStaff: [SupportPerson] (paralegals, secretaries)
  │   └─ externalCounsel: [ExternalCounsel] (co-counsel, experts)
  │
  ├─ billing: MatterBilling
  │   ├─ billingMethod: enum [hourly | fixed_fee | value_based | retainer | hybrid]
  │   ├─ budgetAmount: decimal (total budget approved)
  │   ├─ currentSpent: decimal (sum of invoiced hours/fees)
  │   ├─ estimatedRemaining: decimal (computed: budgetAmount - currentSpent)
  │   ├─ hourlyRate: decimal (if hourly or hybrid)
  │   ├─ fixedFeeAmount: decimal (if fixed_fee)
  │   ├─ retainerAmount: decimal (if retainer)
  │   ├─ billingStartDate: date
  │   ├─ billingEndDate: date (optional, if time-bound)
  │   ├─ invoiceFrequency: enum [upon_completion | monthly | quarterly]
  │   └─ currencyCode: string (COP, USD, etc.)
  │
  ├─ timeline: MatterTimeline
  │   ├─ criticalDates: [CriticalDate]
  │   │   ├─ eventName: string (statute of limitations, trial date, etc.)
  │   │   ├─ dueDate: date
  │   │   ├─ priority: enum [low | medium | high | critical]
  │   │   ├─ reminder: int (days before)
  │   │   └─ status: enum [pending | in_progress | completed | missed]
  │   ├─ nextAction: string (next required step)
  │   └─ nextActionDate: date
  │
  ├─ documents: [DocumentReference] (foreign key references)
  │   ├─ documentId: UUID
  │   ├─ documentType: enum
  │   ├─ addedAt: timestamp
  │   └─ linkedAt: timestamp
  │
  ├─ expenses: [Expense]
  │   ├─ expenseId: UUID
  │   ├─ category: enum [filing_fees | expert_witnesses | court_costs | travel | other]
  │   ├─ amount: decimal
  │   ├─ incurredDate: date
  │   ├─ description: string
  │   └─ vendorName: string (optional)
  │
  ├─ confidentiality: ConfidentialityLevel
  │   ├─ level: enum [standard | high | top_secret]
  │   ├─ accessList: [UUID] (explicit user IDs allowed)
  │   ├─ restrictedFrom: [UUID] (explicitly denied users)
  │   └─ nda_required: boolean
  │
  └─ outcome: MatterOutcome (populated at closure)
      ├─ result: enum [won | settled | dismissed | withdrawn | other]
      ├─ settlement_amount: decimal (if settled)
      ├─ notes: text (summary of outcome)
      ├─ clientSatisfaction: int (1-5 rating post-closure)
      └─ lessonsLearned: text (internal documentation)

Business Rules:
  - matterId is scoped per organization (firm can't see other firm's matters)
  - title and description required before status moves to active
  - leadLawyer.availableHours >= sum(assignedLawyers.allocatedHours)
  - status.currentStatus transitions: intake → active → on_hold → closed → archived
  - Reverse transitions (e.g., closed → active) require manager approval
  - currentSpent cannot exceed budgetAmount (triggers approval gate if approaching limit)
  - expectedClosureDate cannot be before max(criticalDates.dueDate)
  - When status=closed, outcome must be populated (required for analytics)
  - All changes to matters trigger events (matter.updated) routed to Event Bus
  - Confidentiality enforced at Kernel Security level
```

---

## SUBDOMAIN 4: DOCUMENT MANAGEMENT

### Document Aggregate Root

```
Document
  ├─ documentId: UUID
  ├─ organizationId: UUID (owner firm)
  ├─ matterId: UUID (optional, if linked to matter)
  ├─ title: string (document name)
  ├─ documentType: DocumentType
  │   ├─ category: enum [template | contract | motion | brief | memo | email | other]
  │   ├─ legalCategory: enum [agreement | pleading | correspondence | report | etc]
  │   └─ jurisdiction: string (country/state law applicable)
  │
  ├─ content: DocumentContent
  │   ├─ format: enum [docx | pdf | plaintext | markdown | rtf]
  │   ├─ storagePath: string (S3 path, encrypted)
  │   ├─ fileSize: int (bytes)
  │   ├─ contentHash: string (SHA-256 for integrity verification)
  │   ├─ pageCount: int
  │   └─ language: string (es, pt, en)
  │
  ├─ metadata: DocumentMetadata
  │   ├─ author: UUID (lawyer/user who created)
  │   ├─ createdAt: timestamp
  │   ├─ lastModifiedBy: UUID
  │   ├─ lastModifiedAt: timestamp
  │   ├─ tags: [string] (searchable tags)
  │   ├─ description: text (internal notes)
  │   └─ isTemplate: boolean
  │
  ├─ versions: [DocumentVersion] (append-only versioning)
  │   ├─ versionId: UUID
  │   ├─ versionNumber: int (1, 2, 3, ...)
  │   ├─ createdAt: timestamp
  │   ├─ createdBy: UUID
  │   ├─ content: DocumentContent (snapshot)
  │   ├─ changeDescription: string (what changed)
  │   └─ isPublished: boolean (version is final/released)
  │
  ├─ collaboration: CollaborationState
  │   ├─ isLocked: boolean (locked for editing if true)
  │   ├─ lockedBy: UUID (user who locked)
  │   ├─ lockedAt: timestamp
  │   ├─ activeEditors: [UUID] (users currently editing)
  │   ├─ comments: [DocumentComment]
  │   │   ├─ commentId: UUID
  │   │   ├─ author: UUID
  │   │   ├─ text: string
  │   │   ├─ resolvedAt: timestamp (if resolved)
  │   │   └─ resolutionNotes: string
  │   └─ changeTracking: boolean (enable Track Changes)
  │
  ├─ review: DocumentReviewState
  │   ├─ status: enum [draft | awaiting_review | in_review | approved | rejected | archived]
  │   ├─ reviewers: [Reviewer]
  │   │   ├─ reviewerId: UUID
  │   │   ├─ status: enum [pending | approved | rejected]
  │   │   ├─ feedback: string
  │   │   └─ reviewedAt: timestamp
  │   ├─ isAIGenerated: boolean (flag if AI-assisted)
  │   ├─ aiGenerationDetails: AIGenerationDetails (if true)
  │   │   ├─ prompt: string (what user asked AI to do)
  │   │   ├─ model: string (GPT-4, Claude, etc.)
  │   │   ├─ generatedAt: timestamp
  │   │   ├─ generatedBy: UUID (AI system, logged)
  │   │   └─ approvedBy: UUID (lawyer who approved)
  │   └─ requiresLawyerApproval: boolean
  │
  ├─ signature: SignatureState (optional, for executed documents)
  │   ├─ status: enum [unsigned | pending_signature | partially_signed | fully_signed | rejected]
  │   ├─ signers: [Signer]
  │   │   ├─ signerId: UUID
  │   │   ├─ signatureType: enum [wet | digital | electronic]
  │   │   ├─ status: enum [pending | signed | declined]
  │   │   ├─ signedAt: timestamp
  │   │   ├─ signatureProvider: string (LawSignings, DocuSign, etc.)
  │   │   ├─ signatureProofUrl: string (audit trail)
  │   │   └─ nonRepudiationCertificate: string (digital signature cert)
  │   ├─ executionDate: timestamp (when fully signed)
  │   └─ witnessedBy: [UUID] (optional, for certain documents)
  │
  ├─ compliance: DocumentCompliance
  │   ├─ jurisdiction: string (law applicable to doc)
  │   ├─ retentionPeriod: int (years to keep)
  │   ├─ confidentialityLevel: enum [public | internal | high | top_secret]
  │   ├─ requiresArchiving: boolean
  │   ├─ isArchivedAt: timestamp
  │   └─ legalHolds: [LegalHold] (litigation holds)
  │
  └─ linkedObjects: DocumentLinks
      ├─ linkedMatters: [matterId] (cases this doc applies to)
      ├─ linkedContacts: [contactId] (people mentioned/involved)
      ├─ linkedContracts: [documentId] (related agreements)
      └─ relatedDocuments: [documentId] (previous versions, related work)

Business Rules:
  - documentId globally unique, scoped by organizationId
  - title + documentType + matterid uniqueness: no duplicates
  - isAIGenerated=true requires aiGenerationDetails populated + lawyer approval
  - version.isPublished moves status to "published" (immutable thereafter)
  - signature.status=fully_signed triggers document.signed event → Kernel Audit Engine
  - contentHash prevents tampering (verified on every access)
  - Confidentiality enforced: user can only access if in organization + proper permission
  - Retention period enforced by Kernel Governance (auto-archive/delete after period)
  - All edits tracked in versions (append-only, no deletions)
```

---

## SUBDOMAIN 5: FINANCIAL MANAGEMENT

### Invoice Aggregate Root

```
Invoice
  ├─ invoiceId: UUID
  ├─ organizationId: UUID (issuing law firm)
  ├─ invoiceNumber: string (firm's numbering scheme, country-specific format)
  ├─ clientOrganizationId: UUID (client being billed)
  ├─ matterId: UUID (optional, if matter-based)
  │
  ├─ billingPeriod: BillingPeriod
  │   ├─ startDate: date (period start)
  │   ├─ endDate: date (period end)
  │   └─ invoiceDate: date (when issued)
  │
  ├─ lineItems: [LineItem]
  │   ├─ lineItemId: UUID
  │   ├─ description: string (what was billed)
  │   ├─ quantity: decimal (hours, count, etc.)
  │   ├─ unitPrice: decimal (hourly rate, unit cost)
  │   ├─ totalAmount: decimal (quantity × unitPrice)
  │   ├─ category: enum [professional_services | expenses | retainer | other]
  │   ├─ lawyerId: UUID (if labor-based)
  │   ├─ timesheetIds: [UUID] (reference to timesheets if hourly)
  │   ├─ expenseIds: [UUID] (reference to expenses if cost-based)
  │   └─ discountApplied: decimal (percentage or amount)
  │
  ├─ totals: InvoiceTotals
  │   ├─ subtotal: decimal (sum of line items)
  │   ├─ taxes: TaxCalculation
  │   │   ├─ taxableAmount: decimal
  │   │   ├─ taxRate: decimal (jurisdiction-based, e.g., 19% Colombia VAT)
  │   │   ├─ taxAmount: decimal
  │   │   └─ taxDescription: string (VAT, IVA, GST, etc.)
  │   ├─ discountTotal: decimal
  │   ├─ total: decimal (subtotal + taxes - discount)
  │   └─ currencyCode: string (COP, USD, BRL, etc.)
  │
  ├─ status: InvoiceStatus
  │   ├─ currentStatus: enum [draft | submitted | approved | paid | overdue | cancelled | disputed]
  │   ├─ statusHistory: [StatusChange]
  │   │   ├─ status: enum
  │   │   ├─ changedAt: timestamp
  │   │   ├─ changedBy: UUID
  │   │   └─ reason: string (why changed)
  │   ├─ createdAt: timestamp
  │   ├─ submittedAt: timestamp (sent to client)
  │   ├─ approvedAt: timestamp (if approval workflow required)
  │   ├─ paidAt: timestamp
  │   └─ dueDate: date
  │
  ├─ approval: ApprovalWorkflow (if required)
  │   ├─ requiresApproval: boolean (based on client settings + amount)
  │   ├─ approvalThreshold: decimal (e.g., $5000)
  │   ├─ approvers: [Approver]
  │   │   ├─ approverId: UUID
  │   │   ├─ status: enum [pending | approved | rejected]
  │   │   ├─ feedback: string (if rejected)
  │   │   ├─ approvedAt: timestamp
  │   │   └─ requiredApprovals: int (how many approvals needed)
  │   └─ escalationTo: UUID (manager if approval rejected)
  │
  ├─ payment: PaymentInformation
  │   ├─ paymentMethod: enum [bank_transfer | credit_card | check | paypal]
  │   ├─ paymentTerms: int (days, e.g., Net 30)
  │   ├─ paymentReference: string (check #, wire trace #, etc.)
  │   ├─ amountPaid: decimal
  │   ├─ paymentDate: date
  │   ├─ bankAccount: BankAccount (for firm receiving payment)
  │   │   ├─ accountNumber: string (encrypted)
  │   │   ├─ routingNumber: string
  │   │   ├─ bankName: string
  │   │   └─ accountholderName: string
  │   └─ lateFeeApplied: decimal (if past dueDate)
  │
  ├─ reconciliation: PaymentReconciliation
  │   ├─ isReconciled: boolean
  │   ├─ reconciledAt: timestamp
  │   ├─ reconciledBy: UUID
  │   ├─ discrepancies: [Discrepancy] (if any)
  │   │   ├─ description: string
  │   │   ├─ amount: decimal
  │   │   └─ resolution: string
  │   └─ creditMemoId: UUID (if overpayment issued)
  │
  └─ compliance: InvoiceCompliance
      ├─ taxJurisdiction: string (country/state)
      ├─ taxId: string (firm's tax ID on invoice)
      ├─ legalRequirements: [Requirement] (jurisdiction-specific)
      │   ├─ sequentialNumbering: boolean (required in some countries)
      │   ├─ signatureRequired: boolean
      │   └─ digitalTransmissionRequired: boolean
      ├─ auditPath: string (immutable, via Kernel Audit Engine)
      └─ digitalSignature: DigitalSignature (if required)

Business Rules:
  - invoiceNumber must be sequentially unique per organization per country (legal requirement in many jurisdictions)
  - invoiceNumber format determined by Configuration Center (country-specific)
  - subtotal ≥ 0 (cannot invoice for negative amounts)
  - taxAmount calculated by country-specific tax rules (Configuration Center)
  - dueDate = invoiceDate + paymentTerms
  - status transitions: draft → submitted → approved (conditional) → paid
  - If total > approvalThreshold, approval workflow triggered automatically
  - payment.amountPaid cannot exceed total (capture overpayment warning)
  - Once paidAt is set, invoice is immutable (audit trail via Kernel Audit Engine)
  - Duplicate invoice detection: cannot create invoice for same client + same period + same amount within 24 hours
  - All financial events trigger audit log entry (Kernel Audit Engine)
```

### Timesheet Aggregate Root

```
Timesheet
  ├─ timesheetId: UUID
  ├─ lawyerId: UUID (employee)
  ├─ organizationId: UUID
  ├─ billingPeriod: date (week or month)
  ├─ entries: [TimesheetEntry]
  │   ├─ entryId: UUID
  │   ├─ matterId: UUID (case worked on)
  │   ├─ workDate: date
  │   ├─ hours: decimal (billable hours)
  │   ├─ description: string (what work was done)
  │   ├─ category: enum [billable | non_billable | training | admin]
  │   ├─ billingRate: decimal (rate for this entry)
  │   ├─ amount: decimal (hours × rate)
  │   ├─ notes: string (optional)
  │   └─ approvedBy: UUID (manager who approved)
  │
  ├─ totals: TimesheetTotals
  │   ├─ totalHours: decimal
  │   ├─ billableHours: decimal
  │   ├─ nonBillableHours: decimal
  │   ├─ totalAmount: decimal (sum of all line items)
  │   └─ utilizationRate: decimal (billableHours / totalHours)
  │
  ├─ status: enum [draft | submitted | approved | invoiced | archived]
  ├─ submittedAt: timestamp
  ├─ approvedAt: timestamp
  └─ invoicedAt: timestamp (when included in invoice)

Business Rules:
  - Only the timesheet owner or manager can edit
  - Once submitted, further edits require manager approval
  - Once invoiced, immutable (historical record)
  - totalHours ≤ 24 hours per day (validation, flag anomalies)
  - All timesheet changes audit-logged (Kernel Audit Engine)
```

---

## SUBDOMAIN 6: MARKETPLACE

### Service Aggregate Root

```
Service
  ├─ serviceId: UUID
  ├─ organizationId: UUID (law firm offering service)
  ├─ lawyerId: UUID (specific lawyer, or null if firm-wide)
  ├─ serviceProfile: ServiceProfile
  │   ├─ serviceName: string
  │   ├─ description: text (what is offered)
  │   ├─ specialization: Specialization (practice area)
  │   ├─ legalArea: enum [corporate | litigation | ip | labor | real_estate | other]
  │   ├─ jurisdiction: [string] (countries/states where offered)
  │   ├─ maxClients: int (optional capacity limit)
  │   ├─ averageResolutionTime: Days (estimated time to complete)
  │   └─ tags: [string] (searchable tags)
  │
  ├─ pricing: ServicePricing
  │   ├─ pricingModel: enum [hourly | fixed_fee | retainer | value_based | market_dependent]
  │   ├─ hourlyRate: decimal (if hourly)
  │   ├─ fixedFeeRange: {min: decimal, max: decimal} (if fixed_fee)
  │   ├─ retainerAmount: decimal (if retainer)
  │   ├─ currencyCode: string (COP, USD, etc.)
  │   ├─ discountAvailable: boolean
  │   ├─ bulkDiscountTiers: [BulkDiscount]
  │   │   ├─ minHours: int
  │   │   ├─ discountPercent: decimal
  │   │   └─ validUntil: date
  │   └─ lastUpdated: timestamp
  │
  ├─ availability: ServiceAvailability
  │   ├─ isActive: boolean (can accept new inquiries)
  │   ├─ capacityRemaining: int
  │   ├─ responseTimeHours: int (expected response to inquiry)
  │   ├─ workingHours: WorkingHours
  │   │   ├─ timezone: string (IANA)
  │   │   ├─ businessDays: [Monday-Friday, with holidays]
  │   │   └─ officeHours: {startTime, endTime}
  │   ├─ geographicCoverage: [Region]
  │   ├─ languagesOffered: [Language]
  │   └─ blackoutDates: [date] (unavailable periods)
  │
  ├─ marketplace: MarketplacePresence
  │   ├─ isListed: boolean (visible in marketplace)
  │   ├─ listingViews: int (how many times viewed)
  │   ├─ inquiries: int (total inquiries received)
  │   ├─ acceptanceRate: decimal (inquiries accepted / total)
  │   ├─ rating: decimal (0-5, avg of client ratings)
  │   ├─ reviews: int (count of client reviews)
  │   └─ badge: enum [top_rated | responsive | verified | etc]
  │
  └─ status: enum [draft | active | suspended | archived]

Business Rules:
  - isListed=true requires: lawyerId.licenseExpiration > today + 90 days
  - capacityRemaining ≥ 0 (cannot accept inquiries if at capacity)
  - rating is readonly (computed from completed engagements)
  - Service descriptions must be non-discriminatory (Kernel Governance)
  - Price changes applied only to new inquiries, not existing engagements
```

### Engagement Aggregate Root

```
Engagement
  ├─ engagementId: UUID
  ├─ serviceId: UUID (service being engaged)
  ├─ lawyerId: UUID (service provider)
  ├─ organizationId: UUID (provider's firm)
  ├─ clientId: UUID (person seeking service)
  ├─ clientOrganizationId: UUID (client's company, if B2B)
  │
  ├─ timeline: EngagementTimeline
  │   ├─ inquiredAt: timestamp (client submitted inquiry)
  │   ├─ acceptedAt: timestamp (lawyer accepted)
  │   ├─ startedAt: timestamp (work commenced)
  │   ├─ completedAt: timestamp
  │   ├─ expectedCompletionDate: date
  │   └─ reviewedAt: timestamp (client left review)
  │
  ├─ deliverables: [Deliverable]
  │   ├─ deliverableId: UUID
  │   ├─ description: string
  │   ├─ deliveryDate: date
  │   ├─ status: enum [pending | delivered | approved | rejected]
  │   └─ acceptanceNotes: string
  │
  ├─ financial: EngagementFinancial
  │   ├─ agreedPrice: decimal
  │   ├─ currencyCode: string
  │   ├─ paymentStatus: enum [pending | partially_paid | fully_paid | disputed]
  │   ├─ invoices: [invoiceId]
  │   ├─ payments: [Payment]
  │   └─ escrowHeld: decimal (funds held during engagement)
  │
  ├─ communication: EngagementCommunication
  │   ├─ lastMessageAt: timestamp
  │   ├─ messages: [Message]
  │   ├─ responseTime: Hours (avg)
  │   └─ clientSatisfaction: int (1-5, during engagement)
  │
  ├─ outcome: EngagementOutcome
  │   ├─ status: enum [completed | cancelled | disputed | refunded]
  │   ├─ clientRating: int (1-5, post-completion)
  │   ├─ clientReview: text
  │   ├─ lawyerRating: int (1-5, lawyer rates client)
  │   └─ wouldRecommend: boolean (both parties)
  │
  └─ documents: [documentId] (generated/used in engagement)

Business Rules:
  - engagementId is unique per marketplace transaction
  - acceptedAt must be within 24 hours of inquiredAt (or inquiry expires)
  - status.completed requires both client AND lawyer to confirm
  - rating can only be left once status=completed
  - payment must be processed before engagement.completedAt (escrow release)
  - If disputed, escalate to firm management + support team
```

---

## SUBDOMAIN 7: NOTIFICATIONS & REMINDERS

### Notification Aggregate

```
Notification
  ├─ notificationId: UUID
  ├─ recipientId: UUID (user)
  ├─ organizationId: UUID
  ├─ type: enum [matter_update | document_review | payment_due | deadline | engagement_inquiry | other]
  ├─ title: string
  ├─ message: string
  ├─ relatedEntityId: UUID (matterId, documentId, etc.)
  ├─ relatedEntityType: enum [matter | document | invoice | engagement]
  ├─ priority: enum [low | normal | high | critical]
  ├─ channels: NotificationChannels
  │   ├─ inApp: boolean (show in app notification)
  │   ├─ email: boolean
  │   ├─ sms: boolean
  │   ├─ whatsapp: boolean
  │   └─ push: boolean (mobile app)
  ├─ createdAt: timestamp
  ├─ readAt: timestamp (nullable)
  ├─ actionUrl: string (deep link to related entity)
  ├─ expiresAt: timestamp (when notification becomes irrelevant)
  └─ status: enum [unread | read | dismissed]

Business Rules:
  - Recipient must have access to relatedEntity (enforced by Kernel Security)
  - Channels determined by user preferences (Kernel Configuration)
  - Critical notifications cannot be dismissed until actioned
  - Notification expiration prevents stale notifications
```

### Reminder Aggregate

```
Reminder
  ├─ reminderId: UUID
  ├─ organizationId: UUID
  ├─ userId: UUID
  ├─ relatedEntity: RemindedEntity
  │   ├─ entityType: enum [critical_date | deadline | task | payment_due]
  │   ├─ entityId: UUID
  │   └─ entityName: string
  ├─ dueDate: date
  ├─ remindBefore: [int] (days, e.g., [7, 1])
  ├─ frequency: enum [once | daily | weekly]
  ├─ lastSentAt: timestamp
  ├─ nextSendAt: timestamp (calculated)
  ├─ channels: NotificationChannels
  ├─ status: enum [active | completed | snoozed | archived]
  └─ snoozedUntil: timestamp (if snoozed)

Business Rules:
  - Cannot create reminder for past due dates
  - Reminders auto-cancel after due date passes (if one-time)
  - Snoozed reminders reappear at snoozeUntil time
  - Multiple reminders can exist for same entity (different users, different send times)
```

---

## COMPLIANCE & DATA GOVERNANCE

### Attorney-Client Privilege

All matters and related documents inherit **confidentiality level** from the Matter aggregate:
```
ConfidentialityLevel: enum [standard | high | top_secret]

Access Control:
  standard: visible to firm members + client contacts
  high: visible to matter team + client's primary contact only
  top_secret: visible to lead lawyer + explicitly named individuals only

Enforcement: Kernel Security (not in Business Engine, delegated to Kernel)
```

### Audit & Non-Repudiation

All business operations produce audit events:
```
Audit Events:
  - matter.created
  - matter.status_changed
  - lawyer_assigned
  - document.created
  - document.ai_generated (includes prompt, model)
  - invoice.created
  - invoice.approved
  - payment.received
  - engagement.completed

Audit Details (via Kernel Audit Engine):
  - who (userId)
  - what (entity changed, field changed, old→new value)
  - when (timestamp)
  - why (context, reason)
  - evidence (digital signatures, hashes)

Immutability: All audit records append-only, cannot be deleted or modified.
Non-repudiation: Entity generating the event is cryptographically signed.
```

### Data Retention

Configured at COUNTRY level (Configuration Center):

```
RetentionPolicy: Colombia
  matterRecords: 10 years (statute of limitations extended)
  invoices: 7 years (tax authority requirement)
  timesheets: 7 years
  emails_and_communications: 5 years
  draft_documents: 3 years
  audit_logs: 10 years (immutable, cannot delete)
```

---

## MULTI-COUNTRY, MULTI-CURRENCY SUPPORT

### Country-Specific Configuration

Each document/invoice/matter inherits jurisdiction rules via Configuration Center:

```
Configuration: "ColombiaBillingRules"
  Scope: {country: Colombia}
  Values:
    invoiceNumberingFormat: "{YEAR}-{SEQUENTIAL}" (legal requirement)
    taxDescription: "IVA"
    taxRate: 0.19
    dataResidency: within_colombia
    currencyDefault: COP
    languageDefault: Spanish

Configuration: "BrazilBillingRules"
  Scope: {country: Brazil}
  Values:
    invoiceNumberingFormat: "{SEQUENTIAL}" (CNPJ-based)
    taxDescription: "ICMS"
    taxRate: variable_by_state
    dataResidency: within_brazil
    currencyDefault: BRL
    languageDefault: Portuguese
```

### Currency Conversion

All financial aggregates support multi-currency:

```
Invoice.currencyCode: string (COP, USD, BRL, etc.)
Invoice.totals.currencyCode: string

Exchange Rate Handling:
  1. Use live rates from Kernel Configuration (cached, updated daily)
  2. Lock exchange rate at invoice.createdAt (for historical accuracy)
  3. For reporting, convert to base currency (COP) at time of report generation
  4. Currency differences tracked separately (gains/losses)
```

---

## COMPLETION CRITERIA

**This document is complete when**:
- ✓ All 7 subdomains fully modeled
- ✓ Entity relationships and aggregates defined
- ✓ Business rules specified for each aggregate
- ✓ Multi-country support designed
- ✓ Audit & compliance framework integrated
- ✓ No Kernel duplication
- ✓ Ready for LEGAL_AUTOMATION_FRAMEWORK.md

---

## STATUS

**Document Version**: 1.0  
**Frozen**: No (awaiting Phase Ω.12 execution approval)  
**Ready for next deliverable**: Yes  
**Blockers**: None  

---

*End of LEGAL_BUSINESS_ENGINE.md*
