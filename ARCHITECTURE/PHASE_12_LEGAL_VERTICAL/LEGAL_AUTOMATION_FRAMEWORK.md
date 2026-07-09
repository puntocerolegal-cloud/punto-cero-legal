# LEGAL AUTOMATION FRAMEWORK
**Event-Driven Workflows, Automations & Business Process Orchestration**

Version: 1.0 | Status: SPECIFICATION | Frozen Date: [Execution Gate]

---

## EXECUTIVE SUMMARY

The Legal Automation Framework defines **all workflows, automations, and business process orchestration** for Punto Cero Legal. Every automation is:

1. **Event-driven**: Triggered by events published to the Kernel Event Bus
2. **Resilient**: Implements compensation, retry, and dead-letter handling
3. **Auditable**: All automation decisions logged via Kernel Audit Engine
4. **Configurable**: Automation rules customizable per organization/country via Kernel Configuration Center
5. **Human-centric**: Includes escalation points, approval gates, and break-glass overrides

All orchestration flows through the **Kernel Process Manager (Workflow Engine)** — no standalone workflow engine in the vertical.

---

## ARCHITECTURE PRINCIPLES

### Event Sources
Events originate from:
- **Kernel Events**: `identity.user.created`, `configuration.changed`, `security.policy_updated`
- **Legal Domain Events**: `matter.created`, `document.published`, `invoice.approved`, `engagement.booked`
- **System Events**: Scheduled timers (e.g., daily deadline check), external API webhooks

### Workflow Execution Model
```
Event Published to Event Bus
    ↓
Event Router (Kernel) determines subscribers
    ↓
Legal Service subscribes and publishes workflow.trigger event
    ↓
Kernel Process Manager starts workflow instance
    ↓
Workflow steps execute (call services, wait for events, etc.)
    ↓
Compensation on failure
    ↓
Completion event published
    ↓
Other systems react to completion event
```

### Atomicity & Eventual Consistency
- Workflows are **eventually consistent**: no distributed transactions
- Each step is idempotent (can be retried without side effects)
- State stored in Kernel Process Manager state store
- Compensation handles rollback

---

## WORKFLOW CATALOG

### WORKFLOW 1: Matter Intake & Onboarding

**Trigger**: `legal.matter.intake_requested` event

**Purpose**: Validate client info, check compliance, assign lawyer, create matter

```yaml
Workflow: MatterIntakeFlow
  Version: 2.1
  Trigger: legal.matter.intake_requested
  TriggerData:
    clientId: UUID
    matterTitle: string
    legalArea: Specialization
    jurisdiction: string
    requiredLawyerHours: int
    budgetEstimate: decimal

  Steps:
    1. ValidateClientInformation
       Service: client_service
       Operation: validateClientProfile
       Input: {clientId}
       Timeout: 10_seconds
       OnSuccess: CheckClientCompliance
       OnFailure: NotifyClientOfIssue
       CompensationAction: null

    2. CheckClientCompliance
       Service: governance_service
       Operation: evaluateClientRiskProfile
       Input:
         clientId: $trigger.clientId
         jurisdiction: $trigger.jurisdiction
         matterValue: $trigger.budgetEstimate
       Output: {riskLevel, complianceNotes, requiresEscalation}
       Timeout: 15_seconds
       OnSuccess:
         - If riskLevel=low: AssignLawyer
         - If riskLevel=medium: NotifyManager
         - If riskLevel=high: EscalateToPartner
       OnFailure: RollbackAndNotifyAdministrator
       CompensationAction: null

    3. NotifyManager
       Service: notification_service
       Operation: sendNotification
       Input:
         recipient: organization.managerId
         type: "compliance_review_required"
         context: {clientId, riskLevel, complianceNotes}
       Timeout: 5_seconds
       OnSuccess: AwaitManagerApproval
       OnFailure: Continue (notification failure non-critical)

    4. AwaitManagerApproval
       Type: ManualApproval
       Assignee: organization.manager
       Deadline: 24_hours
       OnApproved: AssignLawyer
       OnRejected: RejectIntake
       OnTimeout: EscalateToPartner

    5. EscalateToPartner
       Service: notification_service
       Operation: sendNotification
       Input:
         recipient: organization.partnerId
         type: "matter_escalation_required"
       Timeout: 5_seconds
       OnSuccess: AwaitPartnerDecision
       OnFailure: RejectIntake
       Compensation: Notify(manager, escalation_occurred)

    6. AwaitPartnerDecision
       Type: ManualApproval
       Assignee: organization.partner
       Deadline: 48_hours
       OnApproved: AssignLawyer
       OnRejected: RejectIntake
       OnTimeout: RejectIntake

    7. AssignLawyer
       Service: resource_manager
       Operation: findAvailableLawyer
       Input:
         specialization: $trigger.legalArea
         requiredHours: $trigger.requiredLawyerHours
         jurisdiction: $trigger.jurisdiction
         preferredLanguages: $clientInfo.languagePreferences
       Output: {lawyerId, availableHours, suggestedBillingRate}
       Timeout: 20_seconds
       OnSuccess: CreateMatter
       OnFailure:
         - If noLawyerAvailable: NotifyClientOfUnavailability
         - Else: EscalateToManager

    8. NotifyClientOfUnavailability
       Service: notification_service
       Operation: sendNotification
       Input:
         recipients: [clientContact, creatingLawyer]
         type: "no_available_lawyers"
         message: "No lawyers available with your requirements. Consider marketplace."
       Timeout: 5_seconds
       OnSuccess: RejectIntake
       OnFailure: RejectIntake (non-critical)

    9. EscalateToManager
       Service: notification_service
       Operation: sendNotification
       Input:
         recipient: organization.manager
         type: "assignment_failed_escalation"
       Timeout: 5_seconds
       OnSuccess: AwaitManagerOverride
       OnFailure: RejectIntake

    10. AwaitManagerOverride
        Type: ManualApproval
        Assignee: organization.manager
        Deadline: 12_hours
        Options: [AssignManually, RejectIntake]
        OnAssignManually: (proceed with provided lawyerId)
        OnTimeout: RejectIntake

    11. CreateMatter
        Service: matter_service
        Operation: createMatter
        Input:
          organizationId: $auth.organizationId
          clientId: $trigger.clientId
          title: $trigger.matterTitle
          legalArea: $trigger.legalArea
          jurisdiction: $trigger.jurisdiction
          leadLawyer: $assignedLawyer.lawyerId
          budgetAmount: $trigger.budgetEstimate
          billingMethod: $organization.defaultBillingMethod
        Output: {matterId, matterNumber}
        Timeout: 15_seconds
        OnSuccess: NotifyAllParties
        OnFailure: RejectIntakeAndCompensate

    12. NotifyAllParties
        Service: notification_service
        Operation: sendBatch
        Input:
          notifications:
            - recipient: $assignedLawyer
              type: "matter_assigned"
              message: "New matter assigned: #{$createMatter.matterNumber}"
            - recipient: $clientContact
              type: "matter_created"
              message: "Your matter has been assigned to {lawyer.name}"
            - recipient: $organization.manager
              type: "matter_created_notification"
        Timeout: 10_seconds
        OnSuccess: PublishMatterCreatedEvent
        OnFailure: LogAndContinue (non-critical, matter already created)

    13. PublishMatterCreatedEvent
        Service: event_bus
        Operation: publish
        Input:
          event: "legal.matter.created"
          payload:
            matterId: $createMatter.matterId
            clientId: $trigger.clientId
            lawyerId: $assignedLawyer.lawyerId
            budgetAmount: $trigger.budgetEstimate
        Timeout: 5_seconds
        OnSuccess: WorkflowComplete
        OnFailure: LogAndContinue (event delivery non-critical)

    14. RejectIntake
        Service: matter_service
        Operation: recordRejection
        Input:
          clientId: $trigger.clientId
          reason: $rejectionReason
        Timeout: 5_seconds
        OnSuccess: NotifyClientOfRejection
        OnFailure: LogError

    15. NotifyClientOfRejection
        Service: notification_service
        Operation: sendNotification
        Input:
          recipient: $clientContact
          type: "intake_rejected"
          message: "Your matter intake request was not approved. Reason: {reason}"
        Timeout: 5_seconds
        OnSuccess: WorkflowFailed
        OnFailure: WorkflowFailed

    16. RejectIntakeAndCompensate
        Type: Compensation
        Actions:
          - If createdMatter: matter_service.deleteMatter($createMatter.matterId)
          - Notify(allParties, matter_creation_failed)
        OnSuccess: PublishMatterIntakeFailedEvent
        OnFailure: LogCompensationError

    17. PublishMatterIntakeFailedEvent
        Service: event_bus
        Operation: publish
        Input:
          event: "legal.matter.intake_failed"
          payload: {clientId, reason}
        Timeout: 5_seconds
        OnSuccess: WorkflowFailed
        OnFailure: WorkflowFailed

  CompensationChain:
    - If CreateMatter succeeded but later steps failed:
        → matter_service.deleteMatter(matterId)
        → notification_service.recall(allNotifications)

  Monitoring:
    - Latency: p99 < 2 minutes (including manual approval waits)
    - SuccessRate: >= 95% (excluding client rejections)
    - AlertOnFailure: manager if >5% failure rate in 1 hour

  Configuration Overrides (per organization):
    config.MatterIntake.requireManagerApprovalAboveAmount: 5000_COP
    config.MatterIntake.defaultAssignmentStrategy: auto_balance | round_robin | manual
    config.MatterIntake.escalationThreshold: 48_hours
```

---

### WORKFLOW 2: Document AI Generation & Review

**Trigger**: `legal.document.ai_generation_requested` event

**Purpose**: Generate document using AI, store prompt/model info, require lawyer approval

```yaml
Workflow: DocumentAIGenerationFlow
  Version: 1.2
  Trigger: legal.document.ai_generation_requested
  TriggerData:
    matterId: UUID
    documentType: enum [contract | motion | brief | memo]
    prompt: string (what user wants AI to do)
    context: {contractType, jurisdiction, parties, dealValue}
    requestedBy: UUID (user)

  Steps:
    1. LogGenerationRequest
       Service: audit_service
       Operation: auditLog
       Input:
         eventType: "ai_generation_initiated"
         prompt: $trigger.prompt
         documentType: $trigger.documentType
         requestedBy: $trigger.requestedBy
       Timeout: 5_seconds
       OnSuccess: ValidateGovernancePolicy
       OnFailure: RejectGeneration (audit failure = security risk)

    2. ValidateGovernancePolicy
       Service: governance_service
       Operation: checkAIPolicy
       Input:
         jurisdiction: $context.jurisdiction
         documentType: $trigger.documentType
         matter: $matterId
       Output: {policyAllows, requiresReview, approvers}
       Timeout: 10_seconds
       OnSuccess: CallAIOrchestration
       OnFailure: RejectGeneration

    3. CallAIOrchestration
       Service: ai_orchestration_layer
       Operation: generateDocument
       Input:
         prompt: $trigger.prompt
         context: $trigger.context
         documentType: $trigger.documentType
         primaryModel: "gpt-4-turbo"
         temperature: 0.3 (low creativity, legal precision)
         maxTokens: 4000
       Output: {documentContent, modelUsed, inputTokens, outputTokens}
       Timeout: 60_seconds
       OnSuccess: StoreGeneratedContent
       OnFailure:
         - If rateLimitExceeded: RetryWithFallbackModel
         - Else: NotifyUserOfError

    4. RetryWithFallbackModel
       Service: ai_orchestration_layer
       Operation: generateDocument
       Input:
         prompt: $trigger.prompt
         context: $trigger.context
         primaryModel: "claude-3-opus" (fallback)
         temperature: 0.3
         maxTokens: 4000
       Timeout: 60_seconds
       OnSuccess: StoreGeneratedContent
       OnFailure: NotifyUserOfError

    5. NotifyUserOfError
       Service: notification_service
       Operation: sendNotification
       Input:
         recipient: $trigger.requestedBy
         type: "ai_generation_failed"
         message: "Document generation failed. Please try again or create manually."
       Timeout: 5_seconds
       OnSuccess: WorkflowFailed
       OnFailure: WorkflowFailed

    6. StoreGeneratedContent
       Service: document_service
       Operation: createDocument
       Input:
         matterId: $trigger.matterId
         title: "{documentType} - AI Generated {timestamp}"
         documentType: $trigger.documentType
         content: $aiOrchestration.documentContent
         isAIGenerated: true
         status: "awaiting_review"
         aiGenerationDetails:
           prompt: $trigger.prompt
           model: $aiOrchestration.modelUsed
           generatedAt: now()
           generatedBy: "ai_system"
           costToken: {inputTokens, outputTokens}
       Output: {documentId, version}
       Timeout: 10_seconds
       OnSuccess: CreateReviewTask
       OnFailure: RejectGeneration

    7. CreateReviewTask
       Service: process_manager
       Operation: createManualTask
       Input:
         title: "Review AI-Generated Document"
         assignedTo: $matter.leadLawyer
         description: "Review the AI-generated {documentType}. Approve or request revisions."
         relatedEntity: {documentId}
         deadline: 24_hours
         priority: high
       Output: {taskId}
       Timeout: 5_seconds
       OnSuccess: NotifyReviewer
       OnFailure: LogErrorAndContinue

    8. NotifyReviewer
       Service: notification_service
       Operation: sendNotification
       Input:
         recipient: $matter.leadLawyer
         type: "document_awaiting_review"
         message: "AI-generated {documentType} ready for review"
         actionUrl: "/matters/{matterId}/documents/{documentId}"
       Timeout: 5_seconds
       OnSuccess: AwaitReviewerAction
       OnFailure: LogErrorAndContinue

    9. AwaitReviewerAction
       Type: EventWait
       WaitFor: 
         - "legal.document.reviewed_approved" (user approval event)
         - "legal.document.review_requested_revisions" (revision event)
       Timeout: 48_hours
       OnTimeout: SendReminder

    10. SendReminder
        Service: notification_service
        Operation: sendNotification
        Input:
          recipient: $matter.leadLawyer
          type: "document_review_reminder"
          message: "Reminder: AI-generated document awaiting your approval"
        Timeout: 5_seconds
        OnSuccess: AwaitReviewerAction (extend timeout)
        OnFailure: EscalateToManager

    11. EscalateToManager
        Service: notification_service
        Operation: sendNotification
        Input:
          recipient: $organization.manager
          type: "document_review_escalation"
          message: "Lawyer {name} has not reviewed AI-generated document for 48 hours"
        Timeout: 5_seconds
        OnSuccess: AwaitManagerDecision
        OnFailure: LogError

    12. AwaitManagerDecision
        Type: ManualApproval
        Assignee: $organization.manager
        Options: [ApproveDocument, RequestRevisions, AssignToOtherLawyer]
        Deadline: 24_hours
        OnApproveDocument: PublishDocument
        OnRequestRevisions: StartRevisionFlow
        OnAssignToOtherLawyer: (reassign to different lawyer, restart review)

    [When user approves in step 9:]
    13. ApproveDocument
        Service: document_service
        Operation: publishVersion
        Input:
          documentId: $documentId
          approvedBy: $currentUser
          approvalNotes: "Approved by lawyer"
        Timeout: 10_seconds
        OnSuccess: PublishDocumentApprovedEvent
        OnFailure: RollbackAndNotify

    14. PublishDocumentApprovedEvent
        Service: event_bus
        Operation: publish
        Input:
          event: "legal.document.ai_approved_published"
          payload:
            documentId: $documentId
            matterId: $trigger.matterId
            approvedBy: $currentUser
            approvalAt: now()
            aiGenerationDetails: $originalAIDetails
        Timeout: 5_seconds
        OnSuccess: WorkflowComplete
        OnFailure: LogError

    [When user requests revisions in step 9:]
    15. StartRevisionFlow
        Service: process_manager
        Operation: createManualTask
        Input:
          title: "Revise AI-Generated Document"
          assignedTo: $trigger.requestedBy
          description: "Requested revisions: {userFeedback}"
          relatedEntity: {documentId}
          deadline: 48_hours
        Timeout: 5_seconds
        OnSuccess: NotifyRevisionRequired
        OnFailure: LogError

    16. NotifyRevisionRequired
        Service: notification_service
        Operation: sendNotification
        Input:
          recipient: $trigger.requestedBy
          type: "document_revision_requested"
          message: "Lawyer {name} has requested revisions to the AI-generated document"
        Timeout: 5_seconds
        OnSuccess: AwaitRevisionCompletion
        OnFailure: LogError

    17. AwaitRevisionCompletion
        Type: EventWait
        WaitFor: "legal.document.revision_completed"
        Timeout: 72_hours
        OnEvent: CreateNewReviewTask (restart step 7)
        OnTimeout: NotifyAbandoned

    18. NotifyAbandoned
        Service: notification_service
        Operation: sendNotification
        Input:
          recipients: [$trigger.requestedBy, $matter.leadLawyer]
          type: "revision_abandoned"
          message: "Document revision task abandoned due to timeout"
        Timeout: 5_seconds
        OnSuccess: WorkflowFailed
        OnFailure: WorkflowFailed

  CompensationChain:
    - None (document creation is non-critical, can be re-done manually)

  Audit Trail:
    - ALL steps logged with prompt, model, approval, rejection
    - Cannot be deleted (immutable audit trail)
    - Accessible to compliance team for 7 years

  Configuration Overrides (per organization/country):
    config.AIDocument.requiresLawyerApproval: true (mandatory in all jurisdictions)
    config.AIDocument.reviewTimeoutHours: 24
    config.AIDocument.logPromptAndResponse: true
    config.AIDocument.allowedModels: [gpt-4, claude-3, palm-2]
    config.AIDocument.temperature: 0.3
```

---

### WORKFLOW 3: Matter Deadline Tracking & Escalation

**Trigger**: Daily scheduled job at 08:00 (org timezone)

**Purpose**: Check all critical dates, send reminders, escalate if deadline approaching

```yaml
Workflow: DeadlineTrackingFlow
  Version: 1.1
  Trigger: scheduler.daily_deadline_check
  TriggerData:
    organizationId: UUID
    timezone: string (IANA, e.g., "America/Bogota")

  Steps:
    1. FetchAllMatterCriticalDates
       Service: matter_service
       Operation: listCriticalDatesDueInWindow
       Input:
         organizationId: $trigger.organizationId
         startDate: today
         endDate: today + 30_days
         statusFilter: [active, on_hold] (exclude closed)
       Output: [CriticalDate]
       Timeout: 30_seconds
       OnSuccess: ProcessEachDeadline
       OnFailure: LogErrorAndRetry

    2. ProcessEachDeadline (iterate)
       Type: ForEach
       Items: $fetchAllMatterCriticalDates
       ItemProcessing:
         - CalculateDaysUntilDue: days_remaining = deadline - today
         - DetermineReminderLevel:
             - If days_remaining <= 0: OVERDUE (critical)
             - If days_remaining <= 1: IMMINENT (critical)
             - If days_remaining <= 7: APPROACHING (high)
             - If days_remaining <= 14: UPCOMING (normal)
             - Else: FUTURE (low priority)
         - SendReminder (based on level)

    3. SendReminder_OVERDUE
       Condition: days_remaining <= 0
       Service: notification_service
       Operation: sendBatch
       Input:
         recipients:
           - $matter.leadLawyer (critical)
           - $organization.manager (critical)
           - $matter.assignedLawyers (high priority)
         type: "deadline_overdue"
         severity: "critical"
         message: "DEADLINE MISSED: {deadlineName} was due {days_ago} days ago"
         actionUrl: "/matters/{matterId}/timeline"
       Timeout: 10_seconds
       OnSuccess: CreateEscalationTask
       OnFailure: LogError

    4. CreateEscalationTask
       Service: process_manager
       Operation: createManualTask
       Input:
         title: "URGENT: Overdue Deadline - {deadlineName}"
         assignedTo: $organization.manager
         priority: critical
         deadline: 4_hours
         description: "Matter {matterNumber}: {deadlineName} deadline missed. Immediate action required."
         relatedEntity: {matterId}
       Timeout: 5_seconds
       OnSuccess: ContinueToNextDeadline
       OnFailure: LogErrorAndContinue

    5. SendReminder_IMMINENT
       Condition: days_remaining = 1
       Service: notification_service
       Operation: sendBatch
       Input:
         recipients: [$matter.leadLawyer, $organization.manager]
         type: "deadline_imminent"
         severity: "critical"
         message: "DEADLINE TOMORROW: {deadlineName} due {tomorrow_date}"
       Timeout: 5_seconds
       OnSuccess: ContinueToNextDeadline
       OnFailure: LogError

    6. SendReminder_APPROACHING
       Condition: days_remaining = 7
       Service: notification_service
       Operation: sendBatch
       Input:
         recipients: [$matter.leadLawyer]
         type: "deadline_approaching"
         severity: "high"
         message: "Deadline in 7 days: {deadlineName} on {deadline_date}"
       Timeout: 5_seconds
       OnSuccess: ContinueToNextDeadline
       OnFailure: LogError

    7. SendReminder_UPCOMING
       Condition: days_remaining = 14
       Service: notification_service
       Operation: sendNotification
       Input:
         recipients: [$matter.leadLawyer]
         type: "deadline_upcoming"
         message: "Upcoming deadline: {deadlineName} in 14 days ({deadline_date})"
       Timeout: 5_seconds
       OnSuccess: ContinueToNextDeadline
       OnFailure: LogError

    8. ContinueToNextDeadline
       Type: NoOp
       OnSuccess: (iterate to next item from step 2)

  Monitoring:
    - ExecutionTime: < 5 minutes (max)
    - AllDeadlinesProcessed: 100%
    - ReminderDeliveryRate: >= 99%
    - AlertOnFailure: admin if execution fails 2+ times

  Configuration Overrides (per organization):
    config.Deadline.reminderDaysAdvance: [14, 7, 1, 0] (which days to send reminders)
    config.Deadline.escalationHours: 4 (hours for manager to respond to overdue)
    config.Deadline.includeWeekends: false (don't calculate weekends)
```

---

### WORKFLOW 4: Invoice Approval Workflow

**Trigger**: `legal.invoice.created` event (total > approvalThreshold)

**Purpose**: Route invoice to approver(s), handle approval/rejection

```yaml
Workflow: InvoiceApprovalFlow
  Version: 1.3
  Trigger: legal.invoice.created
  Condition: $invoice.total > $organization.approvalThreshold

  TriggerData:
    invoiceId: UUID
    clientId: UUID
    amount: decimal
    organizationId: UUID

  Steps:
    1. DetermineApprovers
       Service: governance_service
       Operation: getApproversForInvoice
       Input:
         invoiceAmount: $trigger.amount
         clientId: $trigger.clientId
         organizationId: $trigger.organizationId
       Output: {primaryApprover, secondaryApprovers, escalationApprover}
       Timeout: 10_seconds
       OnSuccess: CreateApprovalTask
       OnFailure: UseDefaultApprover

    2. UseDefaultApprover
       Service: organization_service
       Operation: getPrincipalContact
       Input: {organizationId: $trigger.organizationId}
       Output: {managerId}
       Timeout: 5_seconds
       OnSuccess: CreateApprovalTask
       OnFailure: LogErrorAndFail

    3. CreateApprovalTask
       Service: process_manager
       Operation: createApprovalTask
       Input:
         title: "Invoice Approval Required"
         description: "Invoice for {client.name}: {currency}{amount}"
         assignedTo: $approver
         deadline: 3_days
         relatedEntity: {invoiceId}
         approvalOptions: [Approve, Reject, RequestChanges]
       Output: {taskId}
       Timeout: 5_seconds
       OnSuccess: NotifyApprover
       OnFailure: LogError

    4. NotifyApprover
       Service: notification_service
       Operation: sendNotification
       Input:
         recipient: $approver
         type: "invoice_approval_required"
         message: "Invoice awaiting your approval: {currency}{amount}"
         actionUrl: "/invoices/{invoiceId}"
       Timeout: 5_seconds
       OnSuccess: AwaitApprovalDecision
       OnFailure: LogErrorAndContinue

    5. AwaitApprovalDecision
       Type: EventWait
       WaitFor:
         - "legal.invoice.approved"
         - "legal.invoice.rejected"
         - "legal.invoice.changes_requested"
       Timeout: 3_days
       OnTimeout: SendReminder

    6. SendReminder
       Service: notification_service
       Operation: sendNotification
       Input:
         recipient: $approver
         type: "invoice_approval_reminder"
         message: "Reminder: Invoice awaiting your approval since {created_date}"
       Timeout: 5_seconds
       OnSuccess: AwaitApprovalDecision (extend timeout by 1 day)
       OnFailure: LogError

    [When approver approves:]
    7a. ApproveInvoice
        Service: financial_service
        Operation: updateInvoiceStatus
        Input:
          invoiceId: $trigger.invoiceId
          newStatus: "approved"
          approvedBy: $approver
          approvalNotes: "Approved"
        Timeout: 10_seconds
        OnSuccess: PublishInvoiceApprovedEvent
        OnFailure: RollbackApproval

    8a. PublishInvoiceApprovedEvent
        Service: event_bus
        Operation: publish
        Input:
          event: "legal.invoice.approved"
          payload: {invoiceId, approvedBy, approvalAt}
        Timeout: 5_seconds
        OnSuccess: WorkflowComplete
        OnFailure: LogError

    [When approver rejects:]
    7b. RejectInvoice
        Service: financial_service
        Operation: updateInvoiceStatus
        Input:
          invoiceId: $trigger.invoiceId
          newStatus: "rejected"
          rejectedBy: $approver
          rejectionReason: $approverFeedback
        Timeout: 10_seconds
        OnSuccess: NotifyInvoiceCreator
        OnFailure: LogError

    8b. NotifyInvoiceCreator
        Service: notification_service
        Operation: sendNotification
        Input:
          recipient: $invoice.createdBy
          type: "invoice_rejected"
          message: "Invoice rejected. Reason: {rejectionReason}"
        Timeout: 5_seconds
        OnSuccess: WorkflowFailed
        OnFailure: WorkflowFailed

    [When approver requests changes:]
    7c. RequestChanges
        Service: process_manager
        Operation: createManualTask
        Input:
          title: "Invoice Changes Requested"
          assignedTo: $invoice.createdBy
          description: "Requested changes: {approverFeedback}"
          deadline: 2_days
        Timeout: 5_seconds
        OnSuccess: NotifyInvoiceCreator_Changes
        OnFailure: LogError

    8c. NotifyInvoiceCreator_Changes
        Service: notification_service
        Operation: sendNotification
        Input:
          recipient: $invoice.createdBy
          type: "invoice_changes_requested"
          message: "Changes requested to invoice: {feedback}"
        Timeout: 5_seconds
        OnSuccess: AwaitChangesCompletion
        OnFailure: LogError

    9c. AwaitChangesCompletion
        Type: EventWait
        WaitFor: "legal.invoice.updated"
        Timeout: 2_days
        OnEvent: CreateApprovalTask (restart approval flow with new invoice version)
        OnTimeout: NotifyOverdue

    10c. NotifyOverdue
         Service: notification_service
         Operation: sendNotification
         Input:
           recipients: [$invoice.createdBy, $approver, $manager]
           type: "invoice_revision_overdue"
         Timeout: 5_seconds
         OnSuccess: WorkflowFailed
         OnFailure: WorkflowFailed

  Configuration Overrides (per organization):
    config.Invoice.approvalThreshold: 5000 (COP, in org currency)
    config.Invoice.approvalTimeoutDays: 3
    config.Invoice.requiresMultipleApprovals: false
```

---

### WORKFLOW 5: Payment Processing & Reconciliation

**Trigger**: `legal.invoice.sent_to_client` event (payment expected)

**Purpose**: Track payment, reconcile, apply to invoice, handle late payments

```yaml
Workflow: PaymentProcessingFlow
  Version: 1.2
  Trigger: legal.invoice.sent_to_client OR legal.payment.received
  TriggerData:
    invoiceId: UUID
    expectedAmount: decimal
    dueDate: date
    clientId: UUID

  Steps:
    1. AwaitPaymentReceipt
       Type: EventWait
       WaitFor: "legal.payment.received"
       Timeout: (dueDate + 14_days) - today
       OnEvent: ProcessPayment
       OnTimeout: SendPaymentReminder

    2. SendPaymentReminder
       Condition: payment not received by dueDate + 7_days
       Service: notification_service
       Operation: sendNotification
       Input:
         recipients: [$clientContact]
         type: "payment_reminder"
         message: "Payment reminder: Invoice due {dueDate}, amount {currency}{amount}"
       Timeout: 5_seconds
       OnSuccess: AwaitPaymentReceipt (continue waiting)
       OnFailure: LogError

    3. ProcessPayment
       Service: financial_service
       Operation: recordPayment
       Input:
         invoiceId: $trigger.invoiceId
         amountReceived: $paymentEvent.amount
         paymentDate: $paymentEvent.processedAt
         paymentReference: $paymentEvent.referenceNumber
         paymentMethod: $paymentEvent.method
       Output: {reconciliationStatus, discrepancy}
       Timeout: 15_seconds
       OnSuccess: ValidatePayment
       OnFailure: LogErrorAndManualReview

    4. ValidatePayment
       Condition:
         - If amountReceived >= expectedAmount: PaymentValid
         - If amountReceived < expectedAmount: PaymentShortfall
         - If amountReceived > expectedAmount: PartialPaymentOrOverpayment

    5. PaymentValid
       Condition: amountReceived = expectedAmount
       Service: financial_service
       Operation: updateInvoiceStatus
       Input:
         invoiceId: $trigger.invoiceId
         newStatus: "paid"
         paidAt: now()
       Timeout: 10_seconds
       OnSuccess: PublishPaymentReceivedEvent
       OnFailure: LogError

    6. PublishPaymentReceivedEvent
       Service: event_bus
       Operation: publish
       Input:
         event: "legal.payment.received_and_reconciled"
         payload: {invoiceId, amountPaid, paidAt, clientId}
       Timeout: 5_seconds
       OnSuccess: SendPaymentConfirmation
       OnFailure: LogError

    7. SendPaymentConfirmation
       Service: notification_service
       Operation: sendNotification
       Input:
         recipients: [$clientContact, $invoiceCreator, $manager]
         type: "payment_received"
         message: "Payment of {currency}{amount} received. Invoice marked as paid."
       Timeout: 5_seconds
       OnSuccess: WorkflowComplete
       OnFailure: LogError

    [If payment shortfall:]
    8a. PaymentShortfall
        Service: notification_service
        Operation: sendNotification
        Input:
          recipients: [$clientContact]
          type: "payment_shortfall"
          message: "Payment received: {currency}{amountReceived}. Shortfall: {currency}{shortfall}"
        Timeout: 5_seconds
        OnSuccess: CreateFollowUpTask
        OnFailure: LogError

    9a. CreateFollowUpTask
        Service: process_manager
        Operation: createManualTask
        Input:
          title: "Payment Shortfall Follow-up"
          assignedTo: $invoiceCreator
          description: "Collect remaining {currency}{shortfall} from {client.name}"
          deadline: 3_days
        Timeout: 5_seconds
        OnSuccess: AwaitPaymentReceipt (continue waiting for remaining)
        OnFailure: LogError

    [If payment overpayment:]
    8b. PartialPaymentOrOverpayment
        Service: financial_service
        Operation: handleOverpayment
        Input:
          invoiceId: $trigger.invoiceId
          overpaymentAmount: $amountReceived - $expectedAmount
          clientId: $trigger.clientId
        Options: [ApplyToFuture, IssueRefund, HoldAsCredit]
        Timeout: 10_seconds
        OnSuccess: NotifyClientOfOverpayment
        OnFailure: LogError

    9b. NotifyClientOfOverpayment
        Service: notification_service
        Operation: sendNotification
        Input:
          recipient: $clientContact
          type: "overpayment_received"
          message: "Overpayment received: {currency}{overpaymentAmount}. Applying to future invoices."
        Timeout: 5_seconds
        OnSuccess: WorkflowComplete
        OnFailure: LogError

    10. LogErrorAndManualReview
        Service: audit_service
        Operation: auditLog
        Input:
          eventType: "payment_processing_error"
          invoiceId: $trigger.invoiceId
          error: $error
          escalatedTo: manager
        Timeout: 5_seconds
        OnSuccess: NotifyManager
        OnFailure: LogCritical

    11. NotifyManager
        Service: notification_service
        Operation: sendNotification
        Input:
          recipient: $organization.manager
          type: "payment_processing_error"
          message: "Manual review required for payment processing"
        Timeout: 5_seconds
        OnSuccess: WorkflowFailed
        OnFailure: WorkflowFailed

  Configuration Overrides (per organization):
    config.Payment.gracePeriodDays: 7 (before sending reminder)
    config.Payment.allowShortfalls: true
    config.Payment.autoRefundThreshold: 500 (refund if overpayment > 500)
```

---

### WORKFLOW 6: Marketplace Engagement Booking

**Trigger**: `legal.marketplace.engagement_requested` event

**Purpose**: Verify service availability, confirm lawyer acceptance, create engagement

```yaml
Workflow: MarketplaceEngagementFlow
  Version: 1.1
  Trigger: legal.marketplace.engagement_requested
  TriggerData:
    serviceId: UUID
    lawyerId: UUID
    inquirerClientId: UUID
    projectDescription: string
    budgetRange: {min, max}
    timelineRequired: string

  Steps:
    1. VerifyLawyerAvailability
       Service: resource_manager
       Operation: checkLawyerCapacity
       Input:
         lawyerId: $trigger.lawyerId
         requiredHours: $estimatedHoursFromBudget
       Output: {availableHours, canAccept}
       Timeout: 10_seconds
       OnSuccess:
         - If canAccept: NotifyLawyer
         - Else: NotifyInquirerOfUnavailability

    2. NotifyInquirerOfUnavailability
       Service: notification_service
       Operation: sendNotification
       Input:
         recipient: $trigger.inquirerClientId
         type: "engagement_unavailable"
         message: "The requested lawyer is not available. Try browsing other options."
       Timeout: 5_seconds
       OnSuccess: WorkflowFailed
       OnFailure: WorkflowFailed

    3. NotifyLawyer
       Service: notification_service
       Operation: sendNotification
       Input:
         recipient: $trigger.lawyerId
         type: "engagement_inquiry"
         message: "New engagement inquiry: {projectDescription}"
         actionUrl: "/marketplace/inquiries/{inquiryId}"
       Timeout: 5_seconds
       OnSuccess: AwaitLawyerDecision
       OnFailure: LogErrorAndContinue

    4. AwaitLawyerDecision
       Type: EventWait
       WaitFor:
         - "legal.engagement.accepted"
         - "legal.engagement.declined"
       Timeout: 24_hours
       OnTimeout: SendReminder

    5. SendReminder
       Service: notification_service
       Operation: sendNotification
       Input:
         recipient: $trigger.lawyerId
         type: "engagement_inquiry_reminder"
         message: "Please respond to engagement inquiry from {client.name}"
       Timeout: 5_seconds
       OnSuccess: AwaitLawyerDecision (extend timeout)
       OnFailure: LogError

    [When lawyer accepts:]
    6a. AcceptEngagement
        Service: marketplace_service
        Operation: createEngagement
        Input:
          serviceId: $trigger.serviceId
          lawyerId: $trigger.lawyerId
          clientId: $trigger.inquirerClientId
          proposedPrice: $trigger.budgetRange.max
          timeline: $trigger.timelineRequired
          description: $trigger.projectDescription
          status: "accepted"
        Output: {engagementId}
        Timeout: 10_seconds
        OnSuccess: ReserveResourcesAndNotify
        OnFailure: LogError

    7a. ReserveResourcesAndNotify
        Service: resource_manager
        Operation: allocateHours
        Input:
          lawyerId: $trigger.lawyerId
          hours: $estimatedHours
          engagementId: $engagementId
        Timeout: 10_seconds
        OnSuccess: NotifyBothParties
        OnFailure: RollbackEngagement

    8a. NotifyBothParties
        Service: notification_service
        Operation: sendBatch
        Input:
          notifications:
            - recipient: $trigger.lawyerId
              type: "engagement_accepted"
              message: "Engagement confirmed. Begin work and track time in the system."
            - recipient: $trigger.inquirerClientId
              type: "engagement_confirmed"
              message: "Your engagement with {lawyer.name} has been confirmed."
        Timeout: 10_seconds
        OnSuccess: PublishEngagementCreatedEvent
        OnFailure: LogErrorAndContinue

    9a. PublishEngagementCreatedEvent
        Service: event_bus
        Operation: publish
        Input:
          event: "legal.engagement.created"
          payload: {engagementId, lawyerId, clientId, proposedPrice}
        Timeout: 5_seconds
        OnSuccess: WorkflowComplete
        OnFailure: LogError

    [When lawyer declines:]
    6b. DeclineEngagement
        Service: notification_service
        Operation: sendNotification
        Input:
          recipient: $trigger.inquirerClientId
          type: "engagement_declined"
          message: "The requested lawyer declined your inquiry. Browse other options."
        Timeout: 5_seconds
        OnSuccess: PublishEngagementDeclinedEvent
        OnFailure: LogError

    7b. PublishEngagementDeclinedEvent
        Service: event_bus
        Operation: publish
        Input:
          event: "legal.engagement.declined"
          payload: {serviceId, lawyerId, clientId}
        Timeout: 5_seconds
        OnSuccess: WorkflowFailed
        OnFailure: LogError

    8. RollbackEngagement
       Type: Compensation
       Actions:
         - If engagementCreated: marketplace_service.deleteEngagement(engagementId)
         - If resourcesAllocated: resource_manager.deallocateHours(lawyerId, engagementId)
       OnSuccess: PublishEngagementFailedEvent
       OnFailure: LogCompensationError

  Configuration Overrides (per marketplace):
    config.Engagement.acceptanceTimeoutHours: 24
    config.Engagement.autoEscalationAfterDecline: true
```

---

## SCHEDULED AUTOMATIONS

### Daily Scheduler

```
Scheduled Task: DailyDeadlineCheck
  Frequency: Daily at 08:00 (org timezone)
  Trigger: scheduler.daily_deadline_check
  Workflow: DeadlineTrackingFlow
  Timeout: 5_minutes
  Retry: 3_times with 60_second backoff
  Alert: admin if failed

Scheduled Task: WeeklyUtilizationReport
  Frequency: Weekly Monday at 09:00
  Trigger: scheduler.weekly_utilization_check
  Operation: GenerateUtilizationMetrics
  Timeout: 10_minutes
  Output: Dashboard + email to managers

Scheduled Task: MonthlyBillingCycle
  Frequency: 1st of month at 00:00
  Trigger: scheduler.monthly_billing_cycle_start
  Operation: GenerateInvoicesForMonthlyClients
  Timeout: 30_minutes
  Error: Escalate to finance team if failed

Scheduled Task: QuarterlyComplianceAudit
  Frequency: 1st day of each quarter at 00:00
  Trigger: scheduler.quarterly_audit
  Operation: VerifyDataResidency + ComplianceRules
  Timeout: 1_hour
  Output: Compliance report for legal team
```

---

## INTEGRATION WITH KERNEL

### Event Bus Contracts

All automations consume/produce events via Kernel Event Bus:

```
Event: legal.matter.created
  Source: Matter Service (via Workflow)
  Schema:
    matterId: UUID
    organizationId: UUID
    clientId: UUID
    lawyerId: UUID
    createdAt: timestamp
    legalArea: Specialization
  Delivery: At-least-once
  Retention: 30 days
  DLQ: legal-matter-created-dlq

Event: legal.document.ai_generated
  Source: Document Service (via Workflow)
  Schema:
    documentId: UUID
    matterId: UUID
    prompt: string (encrypted)
    model: string
    generatedAt: timestamp
    approvalStatus: enum [pending | approved | rejected]
  Delivery: Exactly-once
  Retention: 7 years (legal hold)
  DLQ: legal-document-ai-dlq

Event: legal.invoice.approved
  Source: Financial Service (via Workflow)
  Schema:
    invoiceId: UUID
    approvedBy: UUID
    approvalAt: timestamp
    approvalNotes: string
  Delivery: At-least-once
  Retention: 7 years
  DLQ: legal-invoice-approved-dlq

Event: legal.engagement.completed
  Source: Marketplace Service (via Workflow)
  Schema:
    engagementId: UUID
    lawyerId: UUID
    clientId: UUID
    completedAt: timestamp
    finalPrice: decimal
    clientRating: int
  Delivery: At-least-once
  Retention: 7 years
  DLQ: legal-engagement-completed-dlq
```

### Process Manager Integration

All workflows managed by Kernel Process Manager:

```
Workflow Execution Model:
  ├─ Workflow definition stored in Configuration Center
  ├─ Execution state stored in Kernel Process Manager state store
  ├─ Compensation managed by Kernel Process Manager
  ├─ Retries handled by Kernel Process Manager
  ├─ Timeouts enforced by Kernel Process Manager
  └─ Events published to Kernel Event Bus

Workflow Versioning:
  - All workflows have version numbers
  - Configuration Center manages active workflow version per organization
  - Organization can override workflow behavior via configuration
  - Backward compatibility maintained for running workflow instances
```

### Security & Governance Integration

```
Access Control (Kernel Security):
  - Only authorized users can approve workflows
  - Matter access enforced at workflow level
  - Document confidentiality enforced at retrieval
  - Payment approval routed to configured approvers

Policy Enforcement (Kernel Governance):
  - Jurisdiction-based rules applied at each workflow step
  - AI model selection controlled by Governance policies
  - Compliance checks integrated into critical workflows
  - Audit logging enforced by Kernel Audit Engine

Configuration Management (Kernel Configuration Center):
  - Workflow timeouts configurable per organization
  - Approval thresholds configurable by organization/country
  - Reminder frequencies configurable
  - Escalation paths configurable
```

---

## COMPLETION CRITERIA

**This document is complete when**:
- ✓ All 6 core workflows fully specified
- ✓ Scheduled automation jobs defined
- ✓ Event contracts documented
- ✓ Integration with Kernel components mapped
- ✓ Compensation & error handling specified
- ✓ Ready for LEGAL_AI_ORCHESTRATION.md

---

## STATUS

**Document Version**: 1.0  
**Frozen**: No (awaiting Phase Ω.12 execution approval)  
**Ready for next deliverable**: Yes  
**Blockers**: None  

---

*End of LEGAL_AUTOMATION_FRAMEWORK.md*
