# LEGAL MARKETPLACE MODEL
**Provider-Client Marketplace for Legal Services in Punto Cero Ecosystem**

Version: 1.0 | Status: SPECIFICATION | Frozen Date: [Execution Gate]

---

## EXECUTIVE SUMMARY

The **Legal Marketplace** is a **reusable marketplace pattern** embedded in Punto Cero Legal that enables:

1. **Law firms and freelance lawyers** to publish legal services (hourly, fixed-fee, retainer)
2. **Clients and in-house counsel** to discover and book those services
3. **Escrow-based payments** with dispute resolution
4. **Reputation & rating system** for quality control
5. **Commission-based monetization** (Punto Cero takes percentage)

This model is **intentionally generic** so that other verticals (Medical, Financial Advisory, etc.) can reuse the same Kernel-level marketplace infrastructure.

---

## DESIGN PRINCIPLE: VERTICAL INDEPENDENCE

The marketplace is designed as:
- **Kernel-provided infrastructure**: Search, matching, payment, rating, dispute resolution
- **Vertical-provided configuration**: Service types, pricing models, rating criteria, commission tiers

This enables:
- **Legal vertical** uses: "Contract reviews" (legal service type)
- **Medical vertical** uses: "Telemedicine consultations" (medical service type)
- **Financial vertical** uses: "Tax advice" (financial service type)
- **Same infrastructure**, different configurations

---

## MARKETPLACE ARCHITECTURE

### Layer 1: Service Catalog Management

**Service Aggregate Root** (defined in LEGAL_BUSINESS_ENGINE.md, extended here):

```
Service (Marketplace Publishing)
  ├─ serviceId: UUID
  ├─ serviceType: enum [legal_consultation, document_review, contract_negotiation, 
                       litigation_support, research, due_diligence, other]
  ├─ provider: ProviderProfile
  │   ├─ providerId: UUID (lawyer or law firm)
  │   ├─ providerType: enum [individual_lawyer | law_firm | legal_clinic]
  │   ├─ licenseVerified: boolean (bar association verified)
  │   ├─ verifiedAt: timestamp
  │   └─ licenseExpiryDate: date
  │
  ├─ catalog: ServiceCatalog
  │   ├─ title: string ("Colombian Contract Review", "M&A Due Diligence")
  │   ├─ description: text (detailed service description)
  │   ├─ specialization: Specialization (Corporate, Litigation, IP, etc.)
  │   ├─ legalAreas: [string] (tags: contracts, employment law, etc.)
  │   ├─ jurisdiction: [string] (where service offered)
  │   ├─ languages: [Language] (service offered in which languages)
  │   ├─ maxClients: int (concurrent capacity)
  │   ├─ averageResolutionTime: Days (estimated delivery time)
  │   └─ detailSection: markdown (rich description)
  │
  ├─ pricing: ServicePricing
  │   ├─ pricingModel: enum [hourly | fixed_fee | retainer | hybrid | free_consultation]
  │   ├─ hourlyRate: {amount: decimal, currency: string, minHours: int}
  │   ├─ fixedFeeOptions: [{name: string, amount: decimal, currency: string}]
  │   │   Example: [{name: "Simple NDA Review", amount: 200, currency: "COP"}]
  │   ├─ retainerOption: {amount: decimal, currency: string, period: "month|quarter|year"}
  │   ├─ freeTrial: {minutes: int} (optional, e.g., 15 min free initial consultation)
  │   ├─ bundleDiscounts: [{minQuantity: int, discountPercent: decimal}]
  │   └─ availablePaymentMethods: [stripe | local_gateway | bank_transfer]
  │
  ├─ availability: ServiceAvailability
  │   ├─ isPublished: boolean (visible in marketplace)
  │   ├─ isAcceptingClients: boolean (currently taking new bookings)
  │   ├─ capacityRemaining: int (slots available)
  │   ├─ responseTime: Hours (expected reply to inquiry)
  │   ├─ workingDays: [Monday-Friday, with exclusions]
  │   ├─ timeZone: string (IANA: "America/Bogota")
  │   ├─ blackoutDates: [date] (vacation, unavailable dates)
  │   └─ geographicReach: [Region] (countries/states where offered)
  │
  ├─ engagement: EngagementRules
  │   ├─ minimumEngagementValue: decimal (won't accept smaller bookings)
  │   ├─ maximumEngagementDuration: Days
  │   ├─ requireInitialConsultation: boolean
  │   ├─ consultationFormat: enum [phone | video | in_person | async]
  │   ├─ cancellationPolicy: "24h refund", "3-day refund", "non-refundable"
  │   ├─ completionGuideline: "Within {X} days" or "By {date}"
  │   └─ deliverables: [string] (what client receives)
  │
  ├─ marketplace: MarketplacePresence
  │   ├─ listing_created_at: timestamp
  │   ├─ listing_views: int
  │   ├─ inquiries_received: int
  │   ├─ inquiries_accepted: int
  │   ├─ acceptance_rate: decimal (% of inquiries accepted)
  │   ├─ response_time_avg: Hours (actual response time to inquiries)
  │   ├─ rating: decimal (0-5)
  │   ├─ reviewCount: int
  │   ├─ badge: enum [top_rated | responsive | verified | new_provider]
  │   ├─ searchRanking: int (internal ranking for search results)
  │   └─ featuredUntil: timestamp (if service is paid-featured)
  │
  └─ status: enum [draft | published | suspended | archived]

Business Rules:
  - isPublished=true requires: licenseVerified=true AND licenseExpiryDate > today + 90 days
  - capacityRemaining >= 0 (cannot accept inquiries beyond capacity)
  - isAcceptingClients=true only if isPublished=true
  - rating is readonly (computed from completed engagements)
  - Service description must be unique (no duplicates for same provider)
  - Configuration per vertical controls which pricingModels are allowed
```

---

### Layer 2: Discovery & Search

**Service Discovery** (powered by Kernel Search/Indexing):

```
SearchIndex: LegalServices
  Indexed Fields:
    - serviceType (exact match)
    - specialization (facet)
    - jurisdiction (facet)
    - languages (facet)
    - price_range (facet: <100, 100-500, 500-2k, >2k)
    - provider_rating (facet: 5-star, 4-star, etc.)
    - provider_type (facet: individual, firm, clinic)
    - isAcceptingClients (filter)
    
  Example Query:
    {
      q: "contract review Colombia",
      filters: {
        serviceType: "document_review",
        jurisdiction: "Colombia",
        minRating: 4.0,
        isAcceptingClients: true,
        priceRange: [100, 1000]
      },
      sort: "relevance" | "price_low" | "price_high" | "rating" | "response_time",
      limit: 20,
      offset: 0
    }
    
  Response:
    [
      {
        serviceId: UUID,
        title: "Colombian Contract Review (Fast Track)",
        provider: {name, rating: 4.8, reviewCount: 127},
        pricing: {model: "fixed_fee", amount: 300, currency: "COP"},
        responseTime: "2 hours",
        matchScore: 0.95 (relevance to query)
      },
      ...
    ]
```

**Matching Algorithm**:

```
Matching Score = 
  (relevance_score * 0.40) +
  (price_match_score * 0.20) +
  (rating_score * 0.20) +
  (response_time_score * 0.10) +
  (availability_score * 0.10)

Example:
  Service A: "Colombian Contract Review"
    - relevance: 0.98 (exact match on specialization)
    - price_match: 0.80 (within user's budget range)
    - rating: 0.96 (4.8/5 stars)
    - response_time: 0.90 (2 hour response time)
    - availability: 1.0 (accepting clients)
    → Total Score: (0.98*0.40) + (0.80*0.20) + (0.96*0.20) + (0.90*0.10) + (1.0*0.10) = 0.924

  Service B: "General Legal Consulting"
    - relevance: 0.65 (loose match)
    - price_match: 0.95 (below budget)
    - rating: 0.85 (4.25/5 stars)
    - response_time: 0.70 (8 hour response time)
    - availability: 1.0 (accepting clients)
    → Total Score: (0.65*0.40) + (0.95*0.20) + (0.85*0.20) + (0.70*0.10) + (1.0*0.10) = 0.745

  Ranking: Service A (0.924) > Service B (0.745)
```

---

### Layer 3: Engagement Workflow

**Inquiry Lifecycle** (from LEGAL_BUSINESS_ENGINE.md, integrated with Automation Framework):

```
1. Client Submits Inquiry
   Event: legal.marketplace.service_inquiry_submitted
   Input:
     serviceId: UUID
     clientId: UUID
     projectDescription: text
     budgetRange: {min, max}
     timelineRequired: string
     preferredLanguage: Language
     contactMethod: enum [email, phone, whatsapp, in_app_message]
   
   System: Record inquiry, notify provider

2. Provider Receives Notification
   Via Notification Engine:
     - In-app notification
     - Email (if configured)
     - SMS/WhatsApp (if opted-in)
   
   CTA: "View Inquiry & Respond"
   Timeout: 24 hours (after which inquiry expires)

3. Provider Reviews & Responds
   Options:
     a) Accept Inquiry
        → Provides quote, timeline, delivery details
        → Event: legal.engagement.accepted
        → Move to booking confirmation
        
     b) Decline Inquiry
        → Optionally provides reason
        → Event: legal.engagement.declined
        → Client notified, can search for other providers
        
     c) Request Clarification
        → Ask follow-up questions
        → Event: legal.engagement.question_asked
        → Client responds, workflow continues

4. Booking Confirmation
   Once provider accepts:
   - Client confirms project scope
   - System calculates final price (from provider's quote)
   - Client authorizes payment
   - Event: legal.engagement.payment_authorized
   - Escrow funds held (via payment processor)

5. Engagement Execution
   - Provider delivers work
   - Client reviews deliverables
   - Optionally request revisions
   - Accept delivery
   - Event: legal.engagement.completed

6. Payment Release
   - System releases funds from escrow
   - Event: legal.payment.released_to_provider
   - Provider receives payment (within 3-5 business days)

7. Rating & Review
   - Client rates service (1-5 stars)
   - Client writes review (optional)
   - Event: legal.engagement.rated
   - Provider can respond to review
   - Service rating updated (average of all ratings)
```

---

### Layer 4: Pricing & Payment

**Payment Flow** (via Kernel Payment Integration):

```
PricingModel: fixed_fee
  Client Quote: "Colombianabunicode NDA Review - $250 USD"
  Total Calculation:
    Base Amount: 250 USD
    Currency: USD (client selects)
    Exchange Rate: 1 USD = 4,000 COP (locked at time of inquiry)
    Locked Amount: 250 * 4,000 = 1,000,000 COP (immutable)
    
    Punto Cero Commission: 20% (marketplace provider takes cut)
    Commission Amount: 1,000,000 * 0.20 = 200,000 COP
    Provider Receives: 1,000,000 - 200,000 = 800,000 COP
    
    Platform Fee (VAT, processing): 50,000 COP (to offset payment processor fees)
    
    Total Charged to Client: 1,000,000 COP
    Provider Net Payout: 750,000 COP (after platform fee)

PricingModel: hourly
  Client Budget: "Up to $500"
  Provider Rate: $75/hour = 300,000 COP/hour
  Estimate: 4 hours estimated = 1,200,000 COP
  
  Escrow Amount: $500 (highest client is willing to pay)
  
  Execution:
    - Provider tracks hours worked (via timesheet integration)
    - After 4 hours, total is 1,200,000 COP
    - But client budget is $500 = 2,000,000 COP (client wins)
    - Client only charged 1,200,000 COP for work
    
  Payment Release:
    - Final invoice: 1,200,000 COP
    - Punto Cero Commission (20%): 240,000 COP
    - Provider Receives: 960,000 COP

Commission Structure (by tier, per marketplace):
  config: MarketplaceCommission
    IndividualLawyer:
      defaultCommission: 20%
      bulkDiscount: if_provider_processes_>$5k_per_month → 15%
    
    LawFirm:
      defaultCommission: 15% (higher volume expected)
      enterpriseDiscount: if_firm_processes_>$50k_per_month → 10%
      
    ExpertNetwork:
      defaultCommission: 25% (smaller volume, higher QA cost)

Payment Methods:
  - Stripe (for credit card, ACH, SEPA)
  - Local processors (Stripe Connect, local bank transfers)
  - Cryptocurrency (optional, per organization preference)
```

---

### Layer 5: Quality Control & Dispute Resolution

**Rating System**:

```
Engagement Rating (5-star scale):

Quality Factors Rated by Client:
  1. Expertise & Knowledge (Does provider know the law?)
  2. Communication (Were you kept informed?)
  3. Timeliness (Were deliverables on time?)
  4. Value for Money (Was it worth the price?)
  5. Would Recommend (Would you hire again?)

AI Moderation:
  - System flags ratings with unusual patterns
    (e.g., single star for perfect service, or 5 stars for never-deliveryered)
  - Flags extremely detailed reviews (might be competitive sabotage)
  - Alerts if rating deviates significantly from provider's baseline

Review Content Policy:
  - No personal attacks
  - No irrelevant information
  - No solicitation of other services
  - Enforce via Kernel Governance

Rating Display:
  - Overall rating: 4.2/5 (average)
  - Rating breakdown: 
      5-star: ⭐⭐⭐⭐⭐ (60%)
      4-star: ⭐⭐⭐⭐ (25%)
      3-star: ⭐⭐⭐ (10%)
      2-star: ⭐⭐ (3%)
      1-star: ⭐ (2%)
  - Recent ratings weighted higher (last 30 days)
  - Badges: "Top Rated" (4.5+), "Responsive" (responds <2h avg), "Verified" (license checked)

Provider Response:
  Provider can respond to reviews:
    - Acknowledge feedback
    - Explain any issues
    - Offer to make right (revision, refund, etc.)
  Response visibility: Public on service page
```

**Dispute Resolution**:

```
Dispute Scenarios:
  1. Client says deliverable incomplete → Provider says it's complete
  2. Client says provider missed deadline → Provider says client delayed providing info
  3. Client says quality is poor → Provider says client had unrealistic expectations
  4. Client refuses to pay → Provider says work was completed

Dispute Resolution Process:

  Step 1: Direct Negotiation (48 hours)
    - Notify both parties of dispute
    - Allow both to respond with their version
    - Suggest resolution path
    
  Step 2: Mediation by Punto Cero Team (5 business days)
    - Punto Cero support agent reviews both sides
    - Analyzes deliverables (if document-based)
    - Reviews communications history (via Darwin CRM)
    - Proposes fair resolution:
      Options:
        a) Refund to client (if client refutes payment)
        b) Partial payment (if work was partially complete)
        c) Provider revision (if minor issues)
        d) Rating adjustment (if dispute resolution appears unfair to provider)
    
  Step 3: Arbitration (if mediation fails)
    - Escalate to arbitration (per service agreement)
    - Third-party arbitrator (pre-agreed list)
    - Binding decision
    - Cost split between parties

  Fraud Prevention:
    - Pattern detection: If client files disputes on >10% of engagements → flag as problematic
    - If provider has >20% dispute rate → flag for quality review
    - Limit provider refunds per month (e.g., max 5% of monthly revenue refunded)
    - Limits client cancellations per month (e.g., max 3 cancellations)

  Escrow Protection:
    - Funds held in escrow by payment processor (not in Punto Cero accounts)
    - Only released upon mutual agreement OR dispute resolution
    - If no resolution within 60 days, refund to client
```

---

### Layer 6: Reputation & Trust Signals

**Provider Trust Profile**:

```
TrustProfile:
  ├─ licenseStatus
  │   ├─ verified: boolean (bar association verified)
  │   ├─ verifiedAt: timestamp
  │   ├─ expiryDate: date
  │   └─ verificationMethod: "Bar Association API" | "Manual Review"
  │
  ├─ performanceMetrics
  │   ├─ acceptanceRate: decimal (% of inquiries accepted)
  │   ├─ responseTimeAvg: Hours (average response to inquiry)
  │   ├─ completionRate: decimal (% of engagements completed without cancellation)
  │   ├─ clientSatisfactionScore: decimal (0-5)
  │   ├─ disputeRate: decimal (% of engagements resulting in dispute)
  │   ├─ refundRate: decimal (% of payments refunded)
  │   └─ repeatClientRate: decimal (% of clients that book again)
  │
  ├─ badges
  │   ├─ TopRated (rating >= 4.5 AND >50 reviews)
  │   ├─ Responsive (avg response time <= 2 hours)
  │   ├─ Verified (license verified with bar association)
  │   ├─ LongTime (member for >2 years)
  │   ├─ Expert (specialization-specific badges)
  │   └─ ProBono (offers free/reduced services)
  │
  ├─ violations
  │   ├─ flaggedContent (reviews with policy violations)
  │   ├─ disputesLost (provider lost arbitration)
  │   ├─ complaints (client complaints to bar association, if any)
  │   └─ suspensions (temporary marketplace suspension due to violations)
  │
  └─ certifications
      ├─ specialtyExpertises (certified specializations)
      ├─ training (relevant trainings completed)
      └─ publications (articles, books published in specialty)

Display in Listing:
  "Maria Garcia | ⭐ 4.8 (247 reviews) | ✓ Verified | 🏆 Top Rated | 
   Responsive (avg reply: 1.2h) | 15 yrs experience | Colombian Employment Law Specialist"
```

---

### Layer 7: Analytics & Provider Intelligence

**Provider Dashboard**:

```
Analytics:
  ├─ earnings
  │   ├─ totalEarnings: YTD, MTD
  │   ├─ pendingPayouts (awaiting 3-5 day processing)
  │   ├─ nextPaymentDate
  │   └─ revenueByService (breakdown)
  │
  ├─ engagement
  │   ├─ activeEngagements: int
  │   ├─ completedThisMonth: int
  │   ├─ averageEngagementValue
  │   ├─ averageEngagementDuration
  │   └─ timeToCompletion (how long to finish engagements)
  │
  ├─ marketplace
  │   ├─ inquiriesReceived: this month
  │   ├─ acceptanceRate: % inquiries accepted
  │   ├─ responseTime: avg hours to respond
  │   ├─ listingViews: this month
  │   └─ listingImpressions (estimated from search results)
  │
  ├─ rating
  │   ├─ currentRating: 4.3/5
  │   ├─ ratingTrend (improving, stable, declining)
  │   ├─ recentReviews (last 10)
  │   └─ reviewSentiment (% positive)
  │
  └─ recommendations
      ├─ "Improve response time (currently 8h, top performers: 2h)"
      ├─ "Increase price by 15% (similar providers in your tier charge 25% more)"
      ├─ "Consider specialization badge (you have all criteria)"
      └─ "Proactive tip: Clients who book 2+ times have high lifetime value"
```

---

## REUSABILITY ACROSS VERTICALS

The marketplace is designed to be **vertical-agnostic**:

```
GenericMarketplace Structure:

ServiceType: Configurable
  Legal: [contract_review, litigation, research, ...]
  Medical: [consultation, diagnosis, telemedicine, ...]
  Financial: [tax_advice, investment_consulting, bookkeeping, ...]
  
  All use same Service aggregate, with different serviceType enums

PricingModels: Configurable
  All verticals support: [hourly, fixed_fee, retainer, free_trial]
  Vertical-specific: Legal adds "retainer_with_success_fee"
  
CommissionStructure: Configurable
  Legal: 20% default, 15% for firms, 10% for high-volume
  Medical: 25% default, 20% for clinics (different economics)
  Financial: 15% default (higher trust-based)
  
QualityGating: Configurable
  Legal: Verify bar license
  Medical: Verify medical license
  Financial: Verify financial advisor certification
  
DisputeResolution: Same process, vertical-specific arbitrators

Analytics: Same platform, vertical-specific KPIs
  Legal: case_resolution_time, client_satisfaction
  Medical: patient_outcome_score, response_time
  Financial: portfolio_growth_rate, compliance_rating
```

---

## INTEGRATION WITH KERNEL

**Event Flow**:
```
marketplace.service_inquiry_submitted 
  → notification_engine.send (provider notification)
  → audit_engine.log (inquiry created)
  → resource_manager.check_availability (verify capacity)
  
engagement.accepted
  → payment_processor.authorize_escrow (hold funds)
  → resource_manager.allocate_hours (reserve provider time)
  → event_bus.publish (other systems react)
  
engagement.completed
  → payment_processor.release_escrow (transfer funds)
  → marketplace.update_rating (aggregate reviews)
  → notification_engine.send (both parties)
  → audit_engine.log (transaction complete)
```

**Security & Governance**:
```
access_control: Only authenticated users can post inquiries
  - Kernel Identity verifies client identity
  - Kernel Security enforces encryption in transit
  
rate_limiting: Prevent spam/abuse
  - Max 10 inquiries per hour per user
  - Max 100 active inquiries per provider
  
kyc_verification: KYC/AML checks on payment methods
  - Via payment processor (Stripe, etc.)
  - Kernel Security integrated with processor webhooks
  
dispute_handling: All disputes logged and reviewed
  - Audit trail via Kernel Audit Engine
  - Evidence preservation (messages, deliverables)
```

---

## COMPLETION CRITERIA

**This document is complete when**:
- ✓ Marketplace aggregates and workflows defined
- ✓ Discovery & search algorithm specified
- ✓ Pricing & payment model complete
- ✓ Quality control & disputes documented
- ✓ Reusability across verticals shown
- ✓ Integration with Kernel mapped
- ✓ Ready for LEGAL_REVENUE_MODEL.md

---

## STATUS

**Document Version**: 1.0  
**Frozen**: No (awaiting Phase Ω.12 execution approval)  
**Ready for next deliverable**: Yes  
**Blockers**: None  

---

*End of LEGAL_MARKETPLACE_MODEL.md*
