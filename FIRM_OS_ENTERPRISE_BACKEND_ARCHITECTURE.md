# FIRM OS — ENTERPRISE BACKEND ARCHITECTURE

**Document Type**: Technical Blueprint  
**Sprint**: SPRINT 7 — Enterprise Backend Architecture  
**Status**: DRAFT — Architecture Design (No Code Yet)  
**Date**: 2026  
**Audience**: Architecture, Backend Engineering, Product

---

## EXECUTIVE SUMMARY

This document defines the complete Enterprise Backend Architecture for Firm OS. It is the authoritative blueprint for all backend development work and ensures that the frontend (which currently has local heuristics, localStorage persistence, and derived data) can transition to a full-featured, persistent, scalable, enterprise-grade legal business platform.

**Key Principles**:
- Backend is the source of truth for all persistent state
- Frontend remains provider-agnostic for AI/ML integrations
- Multi-tenant isolation at every layer
- Audit trail, RBAC, and governance built into the core
- Event-driven architecture for loose coupling
- Async processing for long-running operations (workflows, automation)
- Clear separation between real-time and eventual consistency

---

## SECTION 1: COMPLETE DATA MODEL

### 1.1 Core Organization Structure

#### **Firm**
Represents a law firm (customer tenant).

| Field | Type | Key | Constraint | Purpose |
|-------|------|-----|-----------|---------|
| id | UUID | PK | NOT NULL | Unique firm identifier |
| name | VARCHAR(255) | | NOT NULL | Firm legal name |
| slug | VARCHAR(100) | UQ | NOT NULL | URL-safe identifier |
| country_code | CHAR(2) | | DEFAULT 'MX' | Tax/compliance jurisdiction |
| industry | VARCHAR(50) | | | Primary legal domain (corporate, labor, IP, etc.) |
| max_users | INT | | NOT NULL, DEFAULT 10 | Subscription seat limit |
| max_cases | INT | | NOT NULL, DEFAULT 100 | Subscription case limit (-1 = unlimited) |
| subscription_plan | VARCHAR(50) | | DEFAULT 'STARTER' | Billing tier (STARTER, PROFESSIONAL, ENTERPRISE) |
| active | BOOLEAN | | DEFAULT true | Soft delete flag |
| created_at | TIMESTAMP | | NOT NULL, DEFAULT NOW() | Audit timestamp |
| updated_at | TIMESTAMP | | NOT NULL, DEFAULT NOW() | Audit timestamp |
| deleted_at | TIMESTAMP | | NULL | Soft delete timestamp |

**Indexes**: `UQ(slug)`, `IDX(country_code)`, `IDX(subscription_plan)`, `IDX(active)`

**Relations**:
- `1:N` → User (all users belong to one Firm)
- `1:N` → Office (physical locations)
- `1:N` → Department (organizational units)
- `1:N` → Lawyer (employees)
- `1:N` → AuditLog (firm-level audit trail)
- `1:N` → GovernancePolicy (firm-level policies)

---

#### **User**
Represents a person with access to the system.

| Field | Type | Key | Constraint | Purpose |
|-------|------|-----|-----------|---------|
| id | UUID | PK | NOT NULL | Unique user identifier |
| firm_id | UUID | FK | NOT NULL | Multi-tenant isolation |
| email | VARCHAR(255) | | NOT NULL | Unique per firm, contact |
| email_verified | BOOLEAN | | DEFAULT false | Email verification flag |
| password_hash | VARCHAR(255) | | NOT NULL | Bcrypt hash (never store plain) |
| first_name | VARCHAR(100) | | NOT NULL | Given name |
| last_name | VARCHAR(100) | | NOT NULL | Family name |
| phone | VARCHAR(20) | | NULL | Contact number |
| role_id | UUID | FK | NOT NULL | Reference to Role (RBAC) |
| is_active | BOOLEAN | | DEFAULT true | Account status |
| last_login_at | TIMESTAMP | | NULL | For auditing and session mgmt |
| session_token | VARCHAR(255) | | NULL | Current active session (for password-less flows) |
| session_expires_at | TIMESTAMP | | NULL | Session expiration time |
| mfa_enabled | BOOLEAN | | DEFAULT false | Multi-factor authentication flag |
| mfa_secret | VARCHAR(255) | | NULL, ENCRYPTED | TOTP secret (encrypted) |
| created_at | TIMESTAMP | | NOT NULL, DEFAULT NOW() | Audit timestamp |
| updated_at | TIMESTAMP | | NOT NULL, DEFAULT NOW() | Audit timestamp |
| deleted_at | TIMESTAMP | | NULL | Soft delete timestamp |

**Indexes**: `UQ(firm_id, email)`, `IDX(firm_id)`, `IDX(role_id)`, `IDX(last_login_at)`, `IDX(is_active)`

**Relations**:
- `N:1` → Firm (multi-tenant)
- `N:1` → Role (RBAC)
- `1:N` → AuditLog (user actions)
- `1:N` → Activity (user activity tracking)
- `1:1` → Preferences (user settings)
- `1:N` → NotificationPreference (notification rules)

---

#### **Role**
Represents job roles with predefined permissions (RBAC).

| Field | Type | Key | Constraint | Purpose |
|-------|------|-----|-----------|---------|
| id | UUID | PK | NOT NULL | Unique role identifier |
| firm_id | UUID | FK | NOT NULL | Multi-tenant: firm-level roles |
| name | VARCHAR(100) | | NOT NULL | Role display name (e.g., "Partner", "Lawyer") |
| description | TEXT | | NULL | Role purpose documentation |
| is_system | BOOLEAN | | DEFAULT false | System role (cannot be deleted) |
| rank | INT | | NOT NULL | Hierarchical rank (for inheritance) |
| created_at | TIMESTAMP | | NOT NULL, DEFAULT NOW() | Audit timestamp |
| updated_at | TIMESTAMP | | NOT NULL, DEFAULT NOW() | Audit timestamp |

**Indexes**: `UQ(firm_id, name)`, `IDX(firm_id)`, `IDX(is_system)`, `IDX(rank)`

**Relations**:
- `N:1` → Firm
- `1:N` → Permission (many permissions per role)
- `1:N` → User (many users per role)

**Default System Roles**:
1. `Owner` (rank=0) — Full access, cannot be revoked
2. `Managing Partner` (rank=10) — All firm operations
3. `Partner` (rank=20) — Department + team operations
4. `Administrator` (rank=30) — Technical admin only
5. `Manager` (rank=40) — Team lead operations
6. `Lawyer` (rank=50) — Case operations, assigned work
7. `Assistant` (rank=60) — Support, limited access
8. `ReadOnly` (rank=100) — View-only (reports, dashboards)
9. `Client` (rank=110) — External: limited case visibility

---

#### **Permission**
Maps role-to-action access (fine-grained RBAC).

| Field | Type | Key | Constraint | Purpose |
|-------|------|-----|-----------|---------|
| id | UUID | PK | NOT NULL | Unique permission identifier |
| role_id | UUID | FK | NOT NULL | Which role has this permission |
| module | VARCHAR(100) | | NOT NULL | Module name (e.g., "CASES", "WORKFLOWS", "GOVERNANCE") |
| action | VARCHAR(50) | | NOT NULL | Action (CREATE, READ, UPDATE, DELETE, APPROVE, EXECUTE) |
| resource_type | VARCHAR(100) | | NULL | Specific entity type (for granular control) |
| conditions | JSONB | | NULL | Optional conditions (e.g., `{"own_cases_only": true}`) |
| created_at | TIMESTAMP | | NOT NULL, DEFAULT NOW() | Audit timestamp |

**Indexes**: `UQ(role_id, module, action, resource_type)`, `IDX(role_id)`, `IDX(module)`

**Relations**:
- `N:1` → Role

**Standard Modules**:
- `CASES` — Case management (CREATE, READ, UPDATE, DELETE)
- `LAWYERS` — Attorney management (CREATE, READ, UPDATE, DELETE)
- `CLIENTS` — Client management (CREATE, READ, UPDATE, DELETE)
- `DOCUMENTS` — Document management (UPLOAD, DOWNLOAD, DELETE)
- `WORKFLOWS` — Workflow engine (CREATE, EXECUTE, APPROVE, UPDATE)
- `AUTOMATION` — Automation rules (CREATE, UPDATE, DELETE, EXECUTE)
- `SCHEDULER` — Task scheduling (CREATE, UPDATE, DELETE, EXECUTE)
- `NOTIFICATIONS` — Notification rules (CREATE, UPDATE, DELETE)
- `AI_INSIGHTS` — AI/ML features (READ, REQUEST, EXPORT)
- `GOVERNANCE` — Governance policies (CREATE, UPDATE, DELETE, APPROVE)
- `MISSION_CONTROL` — Dashboard & analytics (READ, EXPORT)
- `AUTONOMOUS_OPS` — Autonomous operations (READ, EXECUTE, OVERRIDE)
- `AUDIT_LOGS` — Audit trail (READ only)
- `SETTINGS` — Firm settings (UPDATE only by admin)
- `ADMIN` — System administration (ALL)

---

#### **Office**
Represents a physical office location.

| Field | Type | Key | Constraint | Purpose |
|-------|------|-----|-----------|---------|
| id | UUID | PK | NOT NULL | Unique office identifier |
| firm_id | UUID | FK | NOT NULL | Multi-tenant |
| name | VARCHAR(255) | | NOT NULL | Office name/city |
| address | VARCHAR(255) | | NULL | Street address |
| city | VARCHAR(100) | | NULL | City/municipality |
| state_province | VARCHAR(100) | | NULL | State/province |
| postal_code | VARCHAR(20) | | NULL | ZIP/postal code |
| country | VARCHAR(100) | | NULL | Country name |
| phone | VARCHAR(20) | | NULL | Office phone |
| is_headquarters | BOOLEAN | | DEFAULT false | Primary office flag |
| active | BOOLEAN | | DEFAULT true | Soft delete flag |
| created_at | TIMESTAMP | | NOT NULL, DEFAULT NOW() | Audit timestamp |
| updated_at | TIMESTAMP | | NOT NULL, DEFAULT NOW() | Audit timestamp |

**Indexes**: `IDX(firm_id)`, `IDX(city)`, `IDX(is_headquarters)`

**Relations**:
- `N:1` → Firm
- `1:N` → Lawyer (can be assigned to multiple offices)
- `1:N` → Department (offices can have departments)

---

#### **Department**
Represents organizational units within the firm.

| Field | Type | Key | Constraint | Purpose |
|-------|------|-----|-----------|---------|
| id | UUID | PK | NOT NULL | Unique department identifier |
| firm_id | UUID | FK | NOT NULL | Multi-tenant |
| office_id | UUID | FK | NULL | Which office (optional) |
| name | VARCHAR(255) | | NOT NULL | Department name (e.g., "Litigation", "Corporate") |
| description | TEXT | | NULL | Department purpose |
| head_lawyer_id | UUID | FK | NULL | Department lead |
| budget_monthly | DECIMAL(12,2) | | NULL | Monthly budget allocation |
| active | BOOLEAN | | DEFAULT true | Soft delete flag |
| created_at | TIMESTAMP | | NOT NULL, DEFAULT NOW() | Audit timestamp |
| updated_at | TIMESTAMP | | NOT NULL, DEFAULT NOW() | Audit timestamp |

**Indexes**: `IDX(firm_id)`, `IDX(office_id)`, `IDX(head_lawyer_id)`

**Relations**:
- `N:1` → Firm
- `N:1` → Office (optional)
- `N:1` → Lawyer (as head)
- `1:N` → Lawyer (many lawyers per department)
- `1:N` → Case (department specializations)

---

#### **Lawyer**
Represents attorneys and staff.

| Field | Type | Key | Constraint | Purpose |
|-------|------|-----|-----------|---------|
| id | UUID | PK | NOT NULL | Unique lawyer identifier |
| firm_id | UUID | FK | NOT NULL | Multi-tenant |
| user_id | UUID | FK | NULL | Link to User (if system access) |
| department_id | UUID | FK | NULL | Primary department |
| office_id | UUID | FK | NULL | Primary office |
| first_name | VARCHAR(100) | | NOT NULL | Given name |
| last_name | VARCHAR(100) | | NOT NULL | Family name |
| email | VARCHAR(255) | | NULL | Work email |
| phone | VARCHAR(20) | | NULL | Work phone |
| bar_number | VARCHAR(50) | | NULL | Bar association license |
| specializations | JSONB | | NULL | Array of specializations (e.g., ["IP", "Corporate"]) |
| hourly_rate | DECIMAL(10,2) | | NULL | Billable rate (for reporting) |
| bio | TEXT | | NULL | Professional biography |
| is_active | BOOLEAN | | DEFAULT true | Availability flag |
| created_at | TIMESTAMP | | NOT NULL, DEFAULT NOW() | Audit timestamp |
| updated_at | TIMESTAMP | | NOT NULL, DEFAULT NOW() | Audit timestamp |

**Indexes**: `IDX(firm_id)`, `IDX(user_id)`, `IDX(department_id)`, `IDX(office_id)`, `IDX(is_active)`

**Relations**:
- `N:1` → Firm
- `1:1` → User (optional)
- `N:1` → Department
- `N:1` → Office
- `1:N` → Case (assigned cases)
- `1:N` → WorkflowExecution (executions)
- `1:N` → Team (team memberships)

---

#### **Team**
Groups lawyers for collaborative work.

| Field | Type | Key | Constraint | Purpose |
|-------|------|-----|-----------|---------|
| id | UUID | PK | NOT NULL | Unique team identifier |
| firm_id | UUID | FK | NOT NULL | Multi-tenant |
| name | VARCHAR(255) | | NOT NULL | Team name |
| description | TEXT | | NULL | Team purpose |
| leader_lawyer_id | UUID | FK | NOT NULL | Primary team lead |
| created_at | TIMESTAMP | | NOT NULL, DEFAULT NOW() | Audit timestamp |
| updated_at | TIMESTAMP | | NOT NULL, DEFAULT NOW() | Audit timestamp |

**Indexes**: `IDX(firm_id)`, `IDX(leader_lawyer_id)`

**Relations**:
- `N:1` → Firm
- `N:1` → Lawyer (as leader)
- `1:N` → TeamMember (many-to-many bridge)

---

#### **TeamMember**
Bridge table for Team ↔ Lawyer many-to-many.

| Field | Type | Key | Constraint | Purpose |
|-------|------|-----|-----------|---------|
| id | UUID | PK | NOT NULL | Unique membership identifier |
| team_id | UUID | FK | NOT NULL | Which team |
| lawyer_id | UUID | FK | NOT NULL | Which lawyer |
| role_in_team | VARCHAR(50) | | DEFAULT 'MEMBER' | Role (LEAD, MEMBER, OBSERVER) |
| joined_at | TIMESTAMP | | NOT NULL, DEFAULT NOW() | Membership start |
| left_at | TIMESTAMP | | NULL | Membership end (soft delete) |

**Indexes**: `UQ(team_id, lawyer_id)`, `IDX(team_id)`, `IDX(lawyer_id)`

**Relations**:
- `N:1` → Team
- `N:1` → Lawyer

---

### 1.2 Case Management

#### **Client**
Represents external parties (individuals, corporations, entities) with legal matters.

| Field | Type | Key | Constraint | Purpose |
|-------|------|-----|-----------|---------|
| id | UUID | PK | NOT NULL | Unique client identifier |
| firm_id | UUID | FK | NOT NULL | Multi-tenant |
| type | VARCHAR(50) | | NOT NULL | CLIENT_TYPE: INDIVIDUAL, CORPORATION, ENTITY, GOVERNMENT |
| name | VARCHAR(255) | | NOT NULL | Full name or corporate name |
| email | VARCHAR(255) | | NULL | Contact email |
| phone | VARCHAR(20) | | NULL | Contact phone |
| address | VARCHAR(255) | | NULL | Mailing address |
| city | VARCHAR(100) | | NULL | City |
| state_province | VARCHAR(100) | | NULL | State/province |
| postal_code | VARCHAR(20) | | NULL | ZIP/postal |
| country | VARCHAR(100) | | NULL | Country |
| tax_id | VARCHAR(50) | | NULL | Tax identification (RFC, EIN, etc.) |
| industry | VARCHAR(100) | | NULL | Industry classification |
| status | VARCHAR(50) | | DEFAULT 'ACTIVE' | ACTIVE, INACTIVE, PROSPECT, ARCHIVED |
| metadata | JSONB | | NULL | Custom fields (flexible schema) |
| created_at | TIMESTAMP | | NOT NULL, DEFAULT NOW() | Audit timestamp |
| updated_at | TIMESTAMP | | NOT NULL, DEFAULT NOW() | Audit timestamp |
| deleted_at | TIMESTAMP | | NULL | Soft delete timestamp |

**Indexes**: `IDX(firm_id)`, `IDX(type)`, `IDX(status)`, `IDX(name)`

**Relations**:
- `N:1` → Firm
- `1:N` → Case (all cases for a client)
- `1:N` → Document (client documents)
- `1:N` → Contact (related contacts)

---

#### **Case** (Expediente / Matter)
Represents a legal matter.

| Field | Type | Key | Constraint | Purpose |
|-------|------|-----|-----------|---------|
| id | UUID | PK | NOT NULL | Unique case identifier |
| firm_id | UUID | FK | NOT NULL | Multi-tenant |
| client_id | UUID | FK | NOT NULL | The client this case serves |
| case_number | VARCHAR(100) | | NOT NULL | Docket/case number (unique per firm) |
| title | VARCHAR(255) | | NOT NULL | Case title/name |
| description | TEXT | | NULL | Case summary/facts |
| case_type | VARCHAR(100) | | NOT NULL | CASE_TYPE: CIVIL, CRIMINAL, LABOR, IP, CORPORATE, etc. |
| status | VARCHAR(50) | | DEFAULT 'OPEN' | OPEN, ON_HOLD, PENDING_TRIAL, CLOSED, ARCHIVED |
| priority | VARCHAR(50) | | DEFAULT 'MEDIUM' | CRITICAL, HIGH, MEDIUM, LOW |
| jurisdiction | VARCHAR(100) | | NULL | Court jurisdiction |
| court_name | VARCHAR(255) | | NULL | Court name |
| judge_name | VARCHAR(100) | | NULL | Assigned judge |
| opposing_party | VARCHAR(255) | | NULL | Opposing party name |
| opposing_counsel | VARCHAR(255) | | NULL | Opposing counsel name |
| filing_date | DATE | | NULL | Initial filing date |
| trial_date | DATE | | NULL | Scheduled trial date |
| next_hearing_date | DATE | | NULL | Next scheduled hearing |
| closed_date | DATE | | NULL | Case closure date |
| assigned_lawyer_id | UUID | FK | NOT NULL | Primary responsible lawyer |
| department_id | UUID | FK | NULL | Department specialization |
| estimated_hours | DECIMAL(10,2) | | NULL | Time budget estimate |
| budget | DECIMAL(12,2) | | NULL | Case budget |
| outcome | VARCHAR(50) | | NULL | OUTCOME: WON, LOST, SETTLED, DISMISSED, WITHDRAWN |
| outcome_notes | TEXT | | NULL | Outcome details |
| risk_level | VARCHAR(50) | | NULL | RISK_LEVEL: LOW, MEDIUM, HIGH, CRITICAL |
| metadata | JSONB | | NULL | Custom fields |
| created_at | TIMESTAMP | | NOT NULL, DEFAULT NOW() | Audit timestamp |
| updated_at | TIMESTAMP | | NOT NULL, DEFAULT NOW() | Audit timestamp |
| deleted_at | TIMESTAMP | | NULL | Soft delete timestamp |

**Indexes**: `IDX(firm_id)`, `IDX(client_id)`, `IDX(assigned_lawyer_id)`, `IDX(department_id)`, `IDX(status)`, `IDX(priority)`, `IDX(case_number)`, `IDX(trial_date)`, `IDX(risk_level)`

**Relations**:
- `N:1` → Firm
- `N:1` → Client
- `N:1` → Lawyer (primary assignment)
- `N:1` → Department
- `1:N` → Document (case documents)
- `1:N` → CaseActivity (activity log)
- `1:N` → CaseExpense (billable expenses)
- `1:N` → WorkflowExecution (workflows running on case)
- `1:N` → Notification (case-related alerts)

---

#### **CaseActivity**
Activity log for case events (read-only from user perspective, but updatable by system).

| Field | Type | Key | Constraint | Purpose |
|-------|------|-----|-----------|---------|
| id | UUID | PK | NOT NULL | Unique activity identifier |
| case_id | UUID | FK | NOT NULL | Which case |
| activity_type | VARCHAR(100) | | NOT NULL | ACTIVITY_TYPE: CREATED, UPDATED, ASSIGNED, HEARING_SCHEDULED, DOCUMENT_ADDED, EXPENSE_LOGGED, etc. |
| description | TEXT | | NOT NULL | Activity description |
| performed_by_user_id | UUID | FK | NOT NULL | User who triggered the activity |
| old_value | TEXT | | NULL | Previous value (for field updates) |
| new_value | TEXT | | NULL | New value (for field updates) |
| related_object_id | UUID | | NULL | ID of related object (document, expense, etc.) |
| created_at | TIMESTAMP | | NOT NULL, DEFAULT NOW() | Audit timestamp |

**Indexes**: `IDX(case_id)`, `IDX(activity_type)`, `IDX(performed_by_user_id)`, `IDX(created_at)`

**Relations**:
- `N:1` → Case
- `N:1` → User

---

#### **CaseExpense**
Tracks billable and non-billable expenses per case.

| Field | Type | Key | Constraint | Purpose |
|-------|------|-----|-----------|---------|
| id | UUID | PK | NOT NULL | Unique expense identifier |
| case_id | UUID | FK | NOT NULL | Which case |
| expense_type | VARCHAR(100) | | NOT NULL | EXPENSE_TYPE: HOURLY, FIXED, DISBURSEMENT, COURT_FEE, EXPERT_WITNESS |
| description | TEXT | | NOT NULL | Expense description |
| amount | DECIMAL(12,2) | | NOT NULL | Amount in local currency |
| billable | BOOLEAN | | DEFAULT true | Should be billed to client |
| date_incurred | DATE | | NOT NULL | When expense occurred |
| recorded_by_user_id | UUID | FK | NOT NULL | User recording the expense |
| created_at | TIMESTAMP | | NOT NULL, DEFAULT NOW() | Audit timestamp |

**Indexes**: `IDX(case_id)`, `IDX(date_incurred)`, `IDX(billable)`

**Relations**:
- `N:1` → Case
- `N:1` → User

---

#### **Document**
Represents files associated with cases or clients.

| Field | Type | Key | Constraint | Purpose |
|-------|------|-----|-----------|---------|
| id | UUID | PK | NOT NULL | Unique document identifier |
| firm_id | UUID | FK | NOT NULL | Multi-tenant |
| case_id | UUID | FK | NULL | Associated case (optional) |
| client_id | UUID | FK | NULL | Associated client (optional) |
| file_name | VARCHAR(255) | | NOT NULL | Original file name |
| file_path | VARCHAR(512) | | NOT NULL | Storage path (S3, GCS, etc.) |
| file_size | BIGINT | | NOT NULL | Size in bytes |
| file_type | VARCHAR(50) | | NOT NULL | MIME type or extension |
| document_type | VARCHAR(100) | | NULL | DOCUMENT_TYPE: COMPLAINT, MOTION, BRIEF, EVIDENCE, CORRESPONDENCE, etc. |
| uploaded_by_user_id | UUID | FK | NOT NULL | Who uploaded |
| is_confidential | BOOLEAN | | DEFAULT false | Confidentiality flag |
| is_privileged | BOOLEAN | | DEFAULT false | Attorney-client privilege |
| metadata | JSONB | | NULL | OCR text, extracted data, etc. |
| created_at | TIMESTAMP | | NOT NULL, DEFAULT NOW() | Audit timestamp |
| updated_at | TIMESTAMP | | NOT NULL, DEFAULT NOW() | Audit timestamp |
| deleted_at | TIMESTAMP | | NULL | Soft delete timestamp |

**Indexes**: `IDX(firm_id)`, `IDX(case_id)`, `IDX(client_id)`, `IDX(uploaded_by_user_id)`, `IDX(is_confidential)`

**Relations**:
- `N:1` → Firm
- `N:1` → Case
- `N:1` → Client
- `N:1` → User (uploader)
- `1:N` → DocumentVersion (versioning)
- `1:N` → DocumentAccess (audit trail)

---

#### **DocumentVersion**
Tracks changes to documents over time.

| Field | Type | Key | Constraint | Purpose |
|-------|------|-----|-----------|---------|
| id | UUID | PK | NOT NULL | Unique version identifier |
| document_id | UUID | FK | NOT NULL | Parent document |
| version_number | INT | | NOT NULL | Sequential version |
| file_path | VARCHAR(512) | | NOT NULL | Storage path of this version |
| file_size | BIGINT | | NOT NULL | Size in bytes |
| created_by_user_id | UUID | FK | NOT NULL | Who made this version |
| change_description | TEXT | | NULL | What changed |
| created_at | TIMESTAMP | | NOT NULL, DEFAULT NOW() | Version timestamp |

**Indexes**: `IDX(document_id)`, `IDX(version_number)`

**Relations**:
- `N:1` → Document
- `N:1` → User

---

#### **DocumentAccess**
Audit trail for document access.

| Field | Type | Key | Constraint | Purpose |
|-------|------|-----|-----------|---------|
| id | UUID | PK | NOT NULL | Unique access record identifier |
| document_id | UUID | FK | NOT NULL | Which document |
| user_id | UUID | FK | NOT NULL | Who accessed |
| access_type | VARCHAR(50) | | NOT NULL | ACCESS_TYPE: VIEWED, DOWNLOADED, PRINTED, EXPORTED |
| ip_address | VARCHAR(45) | | NULL | IP for security audit |
| user_agent | VARCHAR(512) | | NULL | Browser/client info |
| accessed_at | TIMESTAMP | | NOT NULL, DEFAULT NOW() | Access timestamp |

**Indexes**: `IDX(document_id)`, `IDX(user_id)`, `IDX(accessed_at)`

**Relations**:
- `N:1` → Document
- `N:1` → User

---

### 1.3 Workflow & Automation

#### **Workflow**
Template for repeatable business processes.

| Field | Type | Key | Constraint | Purpose |
|-------|------|-----|-----------|---------|
| id | UUID | PK | NOT NULL | Unique workflow identifier |
| firm_id | UUID | FK | NOT NULL | Multi-tenant |
| name | VARCHAR(255) | | NOT NULL | Workflow name |
| description | TEXT | | NULL | Workflow purpose |
| status | VARCHAR(50) | | DEFAULT 'DRAFT' | DRAFT, ACTIVE, PAUSED, ARCHIVED |
| workflow_type | VARCHAR(100) | | NOT NULL | WORKFLOW_TYPE: CASE_INTAKE, DISCOVERY, TRIAL_PREP, CONTRACT_REVIEW, etc. |
| trigger_type | VARCHAR(50) | | NOT NULL | TRIGGER_TYPE: MANUAL, CASE_CREATED, CASE_UPDATED, SCHEDULER, APPROVAL_NEEDED |
| trigger_condition | JSONB | | NULL | Condition for auto-trigger (flexible) |
| steps | JSONB | | NOT NULL | Array of workflow steps (see WorkflowStep) |
| current_step_index | INT | | DEFAULT 0 | For executions |
| is_approval_required | BOOLEAN | | DEFAULT false | Needs approval before execution |
| approval_roles | JSONB | | NULL | Array of role IDs that can approve |
| estimated_days_to_complete | INT | | NULL | SLA estimate |
| created_by_user_id | UUID | FK | NOT NULL | Template creator |
| created_at | TIMESTAMP | | NOT NULL, DEFAULT NOW() | Audit timestamp |
| updated_at | TIMESTAMP | | NOT NULL, DEFAULT NOW() | Audit timestamp |

**Indexes**: `IDX(firm_id)`, `IDX(status)`, `IDX(workflow_type)`

**Relations**:
- `N:1` → Firm
- `N:1` → User (creator)
- `1:N` → WorkflowExecution (instances)

**Example Steps Structure** (in `steps` JSONB):
```json
[
  {
    "id": "step-1",
    "order": 1,
    "name": "Intake Interview",
    "type": "MANUAL_TASK|APPROVAL|WEBHOOK|DELAY",
    "assigned_to_role": "LAWYER",
    "due_days": 3,
    "action_config": {
      "webhook_url": "...",
      "approval_required": true
    }
  },
  {
    "id": "step-2",
    "order": 2,
    "name": "Send Welcome Email",
    "type": "WEBHOOK",
    "action_config": {
      "webhook_url": "https://mail-service/send",
      "payload": { "template": "welcome" }
    }
  }
]
```

---

#### **WorkflowExecution**
Represents a running instance of a workflow.

| Field | Type | Key | Constraint | Purpose |
|-------|------|-----|-----------|---------|
| id | UUID | PK | NOT NULL | Unique execution identifier |
| firm_id | UUID | FK | NOT NULL | Multi-tenant |
| workflow_id | UUID | FK | NOT NULL | Which workflow template |
| case_id | UUID | FK | NOT NULL | Case being processed |
| status | VARCHAR(50) | | NOT NULL | EXECUTING, PAUSED, COMPLETED, FAILED, CANCELLED |
| current_step_index | INT | | DEFAULT 0 | Which step is active |
| current_step_status | VARCHAR(50) | | NULL | PENDING, IN_PROGRESS, COMPLETED, FAILED |
| assigned_to_lawyer_id | UUID | FK | NULL | Assigned for manual tasks |
| assigned_to_role_id | UUID | FK | NULL | Or assigned by role |
| started_at | TIMESTAMP | | NOT NULL, DEFAULT NOW() | Execution start |
| completed_at | TIMESTAMP | | NULL | Execution end |
| failed_at | TIMESTAMP | | NULL | Failure timestamp |
| failure_reason | TEXT | | NULL | Why it failed |
| current_step_started_at | TIMESTAMP | | NULL | Current step start |
| current_step_due_at | TIMESTAMP | | NULL | Current step due date |
| created_by_user_id | UUID | FK | NOT NULL | Who triggered |
| metadata | JSONB | | NULL | Execution context, form submissions, etc. |
| created_at | TIMESTAMP | | NOT NULL, DEFAULT NOW() | Audit timestamp |
| updated_at | TIMESTAMP | | NOT NULL, DEFAULT NOW() | Audit timestamp |

**Indexes**: `IDX(firm_id)`, `IDX(workflow_id)`, `IDX(case_id)`, `IDX(status)`, `IDX(assigned_to_lawyer_id)`, `IDX(completed_at)`

**Relations**:
- `N:1` → Firm
- `N:1` → Workflow
- `N:1` → Case
- `N:1` → Lawyer (assigned)
- `N:1` → Role (assigned by role)
- `N:1` → User (creator)
- `1:N` → WorkflowStepExecution (step progress)

---

#### **WorkflowStepExecution**
Tracks progress through each step of a workflow execution.

| Field | Type | Key | Constraint | Purpose |
|-------|------|-----|-----------|---------|
| id | UUID | PK | NOT NULL | Unique step execution identifier |
| workflow_execution_id | UUID | FK | NOT NULL | Parent workflow execution |
| step_index | INT | | NOT NULL | Which step (0-indexed) |
| step_id | VARCHAR(100) | | NOT NULL | Step template ID (from Workflow.steps) |
| status | VARCHAR(50) | | NOT NULL | PENDING, IN_PROGRESS, COMPLETED, FAILED, SKIPPED |
| started_at | TIMESTAMP | | NULL | Step start |
| completed_at | TIMESTAMP | | NULL | Step completion |
| due_at | TIMESTAMP | | NULL | Step due date |
| assigned_to_user_id | UUID | FK | NULL | User assigned |
| result_data | JSONB | | NULL | Output/form submission data |
| error_message | TEXT | | NULL | If failed |
| created_at | TIMESTAMP | | NOT NULL, DEFAULT NOW() | Audit timestamp |

**Indexes**: `IDX(workflow_execution_id)`, `IDX(status)`, `IDX(assigned_to_user_id)`

**Relations**:
- `N:1` → WorkflowExecution
- `N:1` → User

---

#### **AutomationRule**
Defines rules for automatic case/business actions.

| Field | Type | Key | Constraint | Purpose |
|-------|------|-----|-----------|---------|
| id | UUID | PK | NOT NULL | Unique rule identifier |
| firm_id | UUID | FK | NOT NULL | Multi-tenant |
| name | VARCHAR(255) | | NOT NULL | Rule name |
| description | TEXT | | NULL | Rule purpose |
| status | VARCHAR(50) | | DEFAULT 'ACTIVE' | ACTIVE, INACTIVE, ARCHIVED |
| rule_type | VARCHAR(100) | | NOT NULL | RULE_TYPE: CASE_ASSIGNMENT, NOTIFICATION, ESCALATION, TASK_CREATION, DOCUMENT_GENERATION |
| trigger_event | VARCHAR(100) | | NOT NULL | EVENT: CASE_CREATED, CASE_UPDATED, HEARING_SCHEDULED, DEADLINE_APPROACHING, EXPENSE_LOGGED |
| trigger_condition | JSONB | | NOT NULL | Conditions to match (flexible query) |
| action_type | VARCHAR(100) | | NOT NULL | ACTION_TYPE: NOTIFY, ASSIGN, ESCALATE, CREATE_TASK, SEND_EMAIL, UPDATE_FIELD |
| action_config | JSONB | | NOT NULL | Action parameters |
| priority | INT | | DEFAULT 100 | Execution order (lower = first) |
| created_by_user_id | UUID | FK | NOT NULL | Rule creator |
| created_at | TIMESTAMP | | NOT NULL, DEFAULT NOW() | Audit timestamp |
| updated_at | TIMESTAMP | | NOT NULL, DEFAULT NOW() | Audit timestamp |

**Indexes**: `IDX(firm_id)`, `IDX(status)`, `IDX(trigger_event)`, `IDX(priority)`

**Relations**:
- `N:1` → Firm
- `N:1` → User (creator)
- `1:N` → AutomationHistory (execution log)

**Example Structure** (`trigger_condition` and `action_config`):
```json
{
  "trigger_condition": {
    "case_type": "CIVIL",
    "priority": ["HIGH", "CRITICAL"],
    "assigned_to_department_id": "dept-123"
  },
  "action_config": {
    "notify_roles": ["PARTNER", "MANAGER"],
    "escalation_level": 2,
    "notify_via": ["EMAIL", "IN_APP"]
  }
}
```

---

#### **AutomationHistory**
Audit trail for automation rule executions.

| Field | Type | Key | Constraint | Purpose |
|-------|------|-----|-----------|---------|
| id | UUID | PK | NOT NULL | Unique history record identifier |
| firm_id | UUID | FK | NOT NULL | Multi-tenant |
| automation_rule_id | UUID | FK | NOT NULL | Which rule triggered |
| trigger_event | VARCHAR(100) | | NOT NULL | Event that triggered |
| related_case_id | UUID | FK | NULL | Associated case |
| action_taken | VARCHAR(255) | | NOT NULL | What action was performed |
| status | VARCHAR(50) | | NOT NULL | SUCCESS, FAILED, PARTIAL |
| error_message | TEXT | | NULL | If failed, why |
| affected_count | INT | | NULL | Number of records affected |
| executed_at | TIMESTAMP | | NOT NULL, DEFAULT NOW() | Execution timestamp |
| created_at | TIMESTAMP | | NOT NULL, DEFAULT NOW() | Audit timestamp |

**Indexes**: `IDX(firm_id)`, `IDX(automation_rule_id)`, `IDX(related_case_id)`, `IDX(executed_at)`

**Relations**:
- `N:1` → Firm
- `N:1` → AutomationRule
- `N:1` → Case

---

### 1.4 Scheduling & Task Management

#### **Scheduler** (SchedulerTemplate)
Defines recurring or one-time scheduled tasks.

| Field | Type | Key | Constraint | Purpose |
|-------|------|-----|-----------|---------|
| id | UUID | PK | NOT NULL | Unique scheduler identifier |
| firm_id | UUID | FK | NOT NULL | Multi-tenant |
| name | VARCHAR(255) | | NOT NULL | Schedule name |
| description | TEXT | | NULL | Schedule purpose |
| schedule_type | VARCHAR(50) | | NOT NULL | SCHEDULE_TYPE: ONE_TIME, DAILY, WEEKLY, MONTHLY, ANNUAL, CRON |
| cron_expression | VARCHAR(255) | | NULL | CRON pattern (if CRON) |
| next_execution_at | TIMESTAMP | | NOT NULL | When it should next run |
| task_type | VARCHAR(100) | | NOT NULL | TASK_TYPE: EMAIL_REMINDER, REPORT_GENERATION, BACKUP, CLEANUP, WEBHOOK, CUSTOM |
| task_config | JSONB | | NOT NULL | Task-specific configuration |
| assigned_to_user_id | UUID | FK | NULL | User responsible |
| assigned_to_role_id | UUID | FK | NULL | Or role-based assignment |
| related_case_id | UUID | FK | NULL | Case-specific schedule |
| status | VARCHAR(50) | | DEFAULT 'ACTIVE' | ACTIVE, INACTIVE, COMPLETED, ARCHIVED |
| max_executions | INT | | NULL | Max number of runs (NULL = unlimited) |
| execution_count | INT | | DEFAULT 0 | Number of times executed |
| last_execution_at | TIMESTAMP | | NULL | Last successful execution |
| last_execution_status | VARCHAR(50) | | NULL | Last status: SUCCESS, FAILED, PARTIAL |
| created_by_user_id | UUID | FK | NOT NULL | Schedule creator |
| created_at | TIMESTAMP | | NOT NULL, DEFAULT NOW() | Audit timestamp |
| updated_at | TIMESTAMP | | NOT NULL, DEFAULT NOW() | Audit timestamp |

**Indexes**: `IDX(firm_id)`, `IDX(next_execution_at)`, `IDX(status)`, `IDX(related_case_id)`

**Relations**:
- `N:1` → Firm
- `N:1` → User (assigned)
- `N:1` → Role (assigned by role)
- `N:1` → Case (optional)
- `N:1` → User (creator)
- `1:N` → SchedulerExecution (execution history)

---

#### **SchedulerExecution**
Tracks each execution of a scheduled task.

| Field | Type | Key | Constraint | Purpose |
|-------|------|-----|-----------|---------|
| id | UUID | PK | NOT NULL | Unique execution identifier |
| firm_id | UUID | FK | NOT NULL | Multi-tenant |
| scheduler_id | UUID | FK | NOT NULL | Which schedule |
| scheduled_for_time | TIMESTAMP | | NOT NULL | When it was scheduled |
| started_at | TIMESTAMP | | NOT NULL | When it actually started |
| completed_at | TIMESTAMP | | NULL | When it finished |
| status | VARCHAR(50) | | NOT NULL | PENDING, RUNNING, SUCCESS, FAILED, PARTIAL, SKIPPED |
| output_data | JSONB | | NULL | Result data (e.g., report generated) |
| error_message | TEXT | | NULL | Error if failed |
| duration_ms | INT | | NULL | Execution time in milliseconds |
| executed_by_system | BOOLEAN | | DEFAULT true | System vs. manual |
| created_at | TIMESTAMP | | NOT NULL, DEFAULT NOW() | Audit timestamp |

**Indexes**: `IDX(firm_id)`, `IDX(scheduler_id)`, `IDX(status)`, `IDX(scheduled_for_time)`

**Relations**:
- `N:1` → Firm
- `N:1` → Scheduler

---

### 1.5 Notifications & Alerts

#### **Notification**
System notifications to users.

| Field | Type | Key | Constraint | Purpose |
|-------|------|-----|-----------|---------|
| id | UUID | PK | NOT NULL | Unique notification identifier |
| firm_id | UUID | FK | NOT NULL | Multi-tenant |
| recipient_user_id | UUID | FK | NOT NULL | Who receives it |
| case_id | UUID | FK | NULL | Related case |
| notification_type | VARCHAR(100) | | NOT NULL | NOTIFICATION_TYPE: CASE_ASSIGNED, DEADLINE_APPROACHING, APPROVAL_NEEDED, TASK_CREATED, WORKFLOW_COMPLETED, etc. |
| title | VARCHAR(255) | | NOT NULL | Notification title |
| message | TEXT | | NOT NULL | Notification message |
| is_read | BOOLEAN | | DEFAULT false | Read status |
| read_at | TIMESTAMP | | NULL | Read timestamp |
| priority | VARCHAR(50) | | DEFAULT 'NORMAL' | CRITICAL, HIGH, NORMAL, LOW |
| action_url | VARCHAR(512) | | NULL | Link to related resource |
| related_object_id | UUID | | NULL | Object ID (case, workflow, etc.) |
| related_object_type | VARCHAR(50) | | NULL | Object type (CASE, WORKFLOW, etc.) |
| created_at | TIMESTAMP | | NOT NULL, DEFAULT NOW() | Audit timestamp |
| expires_at | TIMESTAMP | | NULL | Notification expiration |

**Indexes**: `IDX(firm_id)`, `IDX(recipient_user_id)`, `IDX(is_read)`, `IDX(priority)`, `IDX(created_at)`

**Relations**:
- `N:1` → Firm
- `N:1` → User (recipient)
- `N:1` → Case (optional)

---

#### **NotificationPreference**
User preferences for notification delivery.

| Field | Type | Key | Constraint | Purpose |
|-------|------|-----|-----------|---------|
| id | UUID | PK | NOT NULL | Unique preference identifier |
| user_id | UUID | FK | NOT NULL | Which user |
| notification_type | VARCHAR(100) | | NOT NULL | NOTIFICATION_TYPE (from Notification) |
| enabled | BOOLEAN | | DEFAULT true | User wants these notifications |
| delivery_channels | JSONB | | NOT NULL | Array: ["EMAIL", "IN_APP", "SMS", "PUSH"] |
| digest_frequency | VARCHAR(50) | | DEFAULT 'IMMEDIATE' | IMMEDIATE, HOURLY, DAILY, WEEKLY |
| do_not_disturb_start | TIME | | NULL | Quiet hours start |
| do_not_disturb_end | TIME | | NULL | Quiet hours end |
| created_at | TIMESTAMP | | NOT NULL, DEFAULT NOW() | Audit timestamp |
| updated_at | TIMESTAMP | | NOT NULL, DEFAULT NOW() | Audit timestamp |

**Indexes**: `IDX(user_id)`, `IDX(notification_type)`

**Relations**:
- `N:1` → User

---

### 1.6 Governance & Approvals

#### **GovernancePolicy**
Enterprise governance rules and policies.

| Field | Type | Key | Constraint | Purpose |
|-------|------|-----|-----------|---------|
| id | UUID | PK | NOT NULL | Unique policy identifier |
| firm_id | UUID | FK | NOT NULL | Multi-tenant |
| name | VARCHAR(255) | | NOT NULL | Policy name |
| description | TEXT | | NULL | Policy rationale |
| policy_type | VARCHAR(100) | | NOT NULL | POLICY_TYPE: SPENDING_LIMIT, APPROVAL_CHAIN, DOCUMENT_RETENTION, CASE_ASSIGNMENT, DATA_CLASSIFICATION |
| policy_rules | JSONB | | NOT NULL | Policy rules (flexible) |
| status | VARCHAR(50) | | DEFAULT 'ACTIVE' | DRAFT, ACTIVE, DEPRECATED, ARCHIVED |
| created_by_user_id | UUID | FK | NOT NULL | Policy author |
| approved_by_user_id | UUID | FK | NULL | Policy approver (if required) |
| approved_at | TIMESTAMP | | NULL | Approval timestamp |
| effective_date | DATE | | NOT NULL | When policy takes effect |
| end_date | DATE | | NULL | Policy expiration (NULL = ongoing) |
| created_at | TIMESTAMP | | NOT NULL, DEFAULT NOW() | Audit timestamp |
| updated_at | TIMESTAMP | | NOT NULL, DEFAULT NOW() | Audit timestamp |

**Indexes**: `IDX(firm_id)`, `IDX(policy_type)`, `IDX(status)`, `IDX(effective_date)`

**Relations**:
- `N:1` → Firm
- `N:1` → User (creator)
- `N:1` → User (approver)
- `1:N` → ApprovalRequest (enforces approvals)

**Example Policy Rules** (JSONB):
```json
{
  "policy_type": "SPENDING_LIMIT",
  "rules": [
    {
      "condition": {"expense_type": "EXPERT_WITNESS"},
      "limit_amount": 5000,
      "requires_approval_from": ["PARTNER", "MANAGING_PARTNER"],
      "message": "Expert witness expenses > $5K need partner approval"
    }
  ]
}
```

---

#### **ApprovalRequest**
Track items requiring approval (governed by GovernancePolicy).

| Field | Type | Key | Constraint | Purpose |
|-------|------|-----|-----------|---------|
| id | UUID | PK | NOT NULL | Unique approval request identifier |
| firm_id | UUID | FK | NOT NULL | Multi-tenant |
| governance_policy_id | UUID | FK | NOT NULL | Which policy triggered this |
| approval_type | VARCHAR(100) | | NOT NULL | APPROVAL_TYPE: WORKFLOW_EXECUTION, CASE_ASSIGNMENT, EXPENSE, DOCUMENT_RELEASE, EXTERNAL_COMMUNICATION |
| related_object_id | UUID | | NOT NULL | ID of object needing approval |
| related_object_type | VARCHAR(50) | | NOT NULL | Type (CASE, DOCUMENT, EXPENSE, WORKFLOW_EXECUTION) |
| requested_by_user_id | UUID | FK | NOT NULL | Who requested approval |
| requested_at | TIMESTAMP | | NOT NULL, DEFAULT NOW() | Request timestamp |
| approver_user_id | UUID | FK | NULL | Assigned approver |
| approver_role_id | UUID | FK | NULL | Or assigned to role |
| status | VARCHAR(50) | | DEFAULT 'PENDING' | PENDING, APPROVED, REJECTED, EXPIRED |
| approved_at | TIMESTAMP | | NULL | Approval timestamp |
| approval_notes | TEXT | | NULL | Approver's notes |
| expires_at | TIMESTAMP | | NOT NULL | When approval expires |
| created_at | TIMESTAMP | | NOT NULL, DEFAULT NOW() | Audit timestamp |

**Indexes**: `IDX(firm_id)`, `IDX(status)`, `IDX(requested_by_user_id)`, `IDX(approver_user_id)`, `IDX(expires_at)`

**Relations**:
- `N:1` → Firm
- `N:1` → GovernancePolicy
- `N:1` → User (requester)
- `N:1` → User (approver)
- `N:1` → Role (approver role)

---

### 1.7 AI & Intelligence

#### **AIInsight**
Represents AI-generated insights and recommendations.

| Field | Type | Key | Constraint | Purpose |
|-------|------|-----|-----------|---------|
| id | UUID | PK | NOT NULL | Unique insight identifier |
| firm_id | UUID | FK | NOT NULL | Multi-tenant |
| case_id | UUID | FK | NULL | Related case |
| insight_type | VARCHAR(100) | | NOT NULL | INSIGHT_TYPE: CASE_RISK, WORKLOAD_ANALYSIS, DEADLINE_ALERT, AUTOMATION_OPPORTUNITY, PATTERN_DETECTION, COST_OPTIMIZATION |
| insight_category | VARCHAR(100) | | NOT NULL | CATEGORY: FINANCIAL, LEGAL_STRATEGY, OPERATIONAL_EFFICIENCY, RISK_MANAGEMENT, COMPLIANCE |
| title | VARCHAR(255) | | NOT NULL | Insight title |
| description | TEXT | | NOT NULL | Insight details |
| confidence_score | DECIMAL(3,2) | | NOT NULL | 0.0–1.0 confidence |
| recommended_actions | JSONB | | NULL | Array of recommended actions |
| source | VARCHAR(100) | | NOT NULL | SOURCE: HEURISTIC, LLM, ML_MODEL, HUMAN_EXPERT |
| model_name | VARCHAR(100) | | NULL | Which AI model (if LLM-based) |
| is_actionable | BOOLEAN | | DEFAULT true | Can user act on it |
| is_archived | BOOLEAN | | DEFAULT false | User archived it |
| created_at | TIMESTAMP | | NOT NULL, DEFAULT NOW() | Audit timestamp |
| updated_at | TIMESTAMP | | NOT NULL, DEFAULT NOW() | Audit timestamp |

**Indexes**: `IDX(firm_id)`, `IDX(case_id)`, `IDX(insight_type)`, `IDX(source)`, `IDX(confidence_score)`

**Relations**:
- `N:1` → Firm
- `N:1` → Case (optional)

---

#### **AutonomousDecision**
Tracks decisions made by autonomous/automated systems.

| Field | Type | Key | Constraint | Purpose |
|-------|------|-----|-----------|---------|
| id | UUID | PK | NOT NULL | Unique decision identifier |
| firm_id | UUID | FK | NOT NULL | Multi-tenant |
| case_id | UUID | FK | NULL | Related case |
| decision_type | VARCHAR(100) | | NOT NULL | DECISION_TYPE: CASE_PRIORITIZATION, LAWYER_ASSIGNMENT, DEADLINE_ALERT, WORKFLOW_TRIGGER, ESCALATION |
| decision_description | TEXT | | NOT NULL | What decision was made |
| decision_rationale | TEXT | | NOT NULL | Why it was made |
| confidence_score | DECIMAL(3,2) | | NOT NULL | 0.0–1.0 confidence |
| requires_approval | BOOLEAN | | DEFAULT false | Needs human review |
| approval_request_id | UUID | FK | NULL | Link to ApprovalRequest if needed |
| was_approved | BOOLEAN | | NULL | Whether approved |
| approved_by_user_id | UUID | FK | NULL | Who approved |
| approved_at | TIMESTAMP | | NULL | Approval timestamp |
| decision_status | VARCHAR(50) | | DEFAULT 'PENDING' | PENDING, APPROVED, REJECTED, IMPLEMENTED, CANCELLED |
| implemented_at | TIMESTAMP | | NULL | When decision was executed |
| created_at | TIMESTAMP | | NOT NULL, DEFAULT NOW() | Audit timestamp |

**Indexes**: `IDX(firm_id)`, `IDX(case_id)`, `IDX(decision_status)`, `IDX(decision_type)`

**Relations**:
- `N:1` → Firm
- `N:1` → Case
- `N:1` → ApprovalRequest
- `N:1` → User (approver)

---

### 1.8 User Management & Preferences

#### **Preferences** (or UserPreferences)
User settings and preferences.

| Field | Type | Key | Constraint | Purpose |
|-------|------|-----|-----------|---------|
| id | UUID | PK | NOT NULL | Unique preferences identifier |
| user_id | UUID | FK | NOT NULL | Which user |
| theme | VARCHAR(50) | | DEFAULT 'SYSTEM' | LIGHT, DARK, SYSTEM |
| language | VARCHAR(10) | | DEFAULT 'es' | Language code |
| timezone | VARCHAR(50) | | DEFAULT 'America/Mexico_City' | Timezone |
| date_format | VARCHAR(20) | | DEFAULT 'DD/MM/YYYY' | Preferred date format |
| time_format | VARCHAR(20) | | DEFAULT '24H' | 24H or 12H |
| currency | VARCHAR(3) | | DEFAULT 'MXN' | Preferred currency |
| dashboard_widgets | JSONB | | NULL | Custom dashboard layout |
| sidebar_collapsed | BOOLEAN | | DEFAULT false | UI preference |
| email_digest_frequency | VARCHAR(50) | | DEFAULT 'DAILY' | IMMEDIATE, DAILY, WEEKLY, MONTHLY |
| case_sort_order | VARCHAR(50) | | NULL | Default case sorting |
| default_view | VARCHAR(50) | | DEFAULT 'TABLE' | Default data view (TABLE, KANBAN, GRID) |
| created_at | TIMESTAMP | | NOT NULL, DEFAULT NOW() | Audit timestamp |
| updated_at | TIMESTAMP | | NOT NULL, DEFAULT NOW() | Audit timestamp |

**Indexes**: `UQ(user_id)`, `IDX(language)`, `IDX(timezone)`

**Relations**:
- `1:1` → User

---

### 1.9 Audit & Compliance

#### **AuditLog**
Complete audit trail for compliance and security.

| Field | Type | Key | Constraint | Purpose |
|-------|------|-----|-----------|---------|
| id | UUID | PK | NOT NULL | Unique audit log entry identifier |
| firm_id | UUID | FK | NOT NULL | Multi-tenant |
| user_id | UUID | FK | NOT NULL | Who performed action |
| action | VARCHAR(255) | | NOT NULL | ACTION: CREATE, READ, UPDATE, DELETE, LOGIN, LOGOUT, EXPORT, APPROVE, REJECT |
| action_category | VARCHAR(100) | | NOT NULL | CATEGORY: AUTHENTICATION, CASE_MANAGEMENT, DOCUMENT, WORKFLOW, AUTOMATION, SETTINGS, GOVERNANCE, AI |
| resource_type | VARCHAR(100) | | NOT NULL | RESOURCE_TYPE: CASE, DOCUMENT, USER, WORKFLOW, etc. |
| resource_id | UUID | | NOT NULL | ID of resource |
| old_value | TEXT | | NULL | Previous value (for updates) |
| new_value | TEXT | | NULL | New value (for updates) |
| severity | VARCHAR(50) | | DEFAULT 'INFO' | CRITICAL, HIGH, MEDIUM, INFO, DEBUG |
| status | VARCHAR(50) | | NOT NULL | SUCCESS, FAILURE, PARTIAL |
| error_message | TEXT | | NULL | If failed |
| ip_address | VARCHAR(45) | | NULL | User's IP address |
| user_agent | VARCHAR(512) | | NULL | Browser/client info |
| request_id | VARCHAR(255) | | NULL | Correlation ID |
| metadata | JSONB | | NULL | Additional context |
| created_at | TIMESTAMP | | NOT NULL, DEFAULT NOW() | Audit timestamp |

**Indexes**: `IDX(firm_id)`, `IDX(user_id)`, `IDX(action)`, `IDX(resource_type)`, `IDX(resource_id)`, `IDX(created_at)`, `IDX(severity)`, `IDX(status)`

**Relations**:
- `N:1` → Firm
- `N:1` → User

---

#### **Activity**
Lightweight activity tracking (less detailed than AuditLog, for analytics).

| Field | Type | Key | Constraint | Purpose |
|-------|------|-----|-----------|---------|
| id | UUID | PK | NOT NULL | Unique activity record identifier |
| firm_id | UUID | FK | NOT NULL | Multi-tenant |
| user_id | UUID | FK | NOT NULL | Who |
| activity_type | VARCHAR(100) | | NOT NULL | ACTIVITY_TYPE: PAGE_VIEW, ACTION, EVENT, WORKFLOW_STEP, etc. |
| resource_type | VARCHAR(100) | | NULL | What resource (optional) |
| resource_id | UUID | | NULL | Which resource (optional) |
| duration_ms | INT | | NULL | How long (in milliseconds) |
| metadata | JSONB | | NULL | Additional data |
| created_at | TIMESTAMP | | NOT NULL, DEFAULT NOW() | Timestamp |

**Indexes**: `IDX(firm_id)`, `IDX(user_id)`, `IDX(activity_type)`, `IDX(created_at)`

**Relations**:
- `N:1` → Firm
- `N:1` → User

---

#### **Settings** (FirmSettings)
Firm-level configuration and settings.

| Field | Type | Key | Constraint | Purpose |
|-------|------|-----|-----------|---------|
| id | UUID | PK | NOT NULL | Unique settings record identifier |
| firm_id | UUID | FK | NOT NULL | Multi-tenant |
| setting_key | VARCHAR(255) | | NOT NULL | Configuration key |
| setting_value | TEXT | | NOT NULL | Configuration value (JSON serialized) |
| setting_type | VARCHAR(50) | | NOT NULL | TYPE: STRING, NUMBER, BOOLEAN, JSON, ARRAY |
| description | TEXT | | NULL | Setting description |
| created_at | TIMESTAMP | | NOT NULL, DEFAULT NOW() | Audit timestamp |
| updated_at | TIMESTAMP | | NOT NULL, DEFAULT NOW() | Audit timestamp |

**Indexes**: `UQ(firm_id, setting_key)`, `IDX(firm_id)`

**Relations**:
- `N:1` → Firm

**Example Settings**:
- `default_case_status` = "OPEN"
- `document_retention_years` = 7
- `approval_required_for_expenses_above` = 1000
- `ai_model_provider` = "HEURISTIC" (or "OPENAI", "CLAUDE", etc.)
- `timezone` = "America/Mexico_City"

---

## SECTION 2: BACKEND ARCHITECTURE

### 2.1 Core Principles

1. **Clean Architecture**: Domain → Application → Infrastructure (ports & adapters)
2. **Multi-tenancy**: Every query filters by `firm_id`
3. **Event-Driven**: Major actions publish internal events
4. **Eventual Consistency**: Some state changes propagate asynchronously
5. **Audit Everything**: All mutations logged to `AuditLog`
6. **RBAC at Endpoint**: Every endpoint checks permissions before execution
7. **Provider-Agnostic AI**: Abstract AI layer allows swapping LLM providers

### 2.2 Module Architecture

#### **AUTH MODULE**
Responsibilities:
- User authentication (login, logout, password reset)
- Token generation and validation (JWT)
- Session management
- MFA/2FA
- Password hashing and validation
- Token refresh and expiration

Key Entities: User, Role, Permission

Key External Interfaces:
- Login endpoint
- Logout endpoint
- Token refresh endpoint
- Password reset endpoint
- MFA setup/verify endpoints

---

#### **RBAC MODULE** (Role-Based Access Control)
Responsibilities:
- Role management (CRUD)
- Permission assignment (role → permission mapping)
- Access control enforcement (check user has permission for action)
- Role hierarchy and inheritance
- Audit role changes

Key Entities: Role, Permission, User

Key External Interfaces:
- List roles
- Get role details
- Create/update/delete role
- Assign/revoke permissions
- Check user permission

---

#### **FIRM CORE MODULE**
Responsibilities:
- Firm management (CRUD)
- Office management (CRUD)
- Department management (CRUD)
- Lawyer/staff management (CRUD)
- Team management (CRUD)
- Basic organization queries

Key Entities: Firm, Office, Department, Lawyer, Team, TeamMember

Key External Interfaces:
- Firm CRUD endpoints
- Office CRUD endpoints
- Department CRUD endpoints
- Lawyer CRUD endpoints
- Team CRUD endpoints
- Organization hierarchy queries

---

#### **CASE MANAGEMENT MODULE**
Responsibilities:
- Case CRUD
- Client CRUD
- Case activity tracking
- Expense tracking
- Case search and filtering
- Case status transitions
- Case assignment

Key Entities: Case, Client, CaseActivity, CaseExpense, Document, DocumentVersion, DocumentAccess

Key External Interfaces:
- Case CRUD endpoints
- Client CRUD endpoints
- Case activity endpoints
- Case expense endpoints
- Document upload/download endpoints
- Case search/filter endpoints

---

#### **WORKFLOW ENGINE MODULE**
Responsibilities:
- Workflow template management (CRUD)
- Workflow execution engine
- Step progression logic
- Approval workflows
- Webhook execution
- Workflow state machine
- Long-running operation handling

Key Entities: Workflow, WorkflowExecution, WorkflowStepExecution

Key External Interfaces:
- Workflow template CRUD
- Create/start workflow execution
- Update workflow step (move to next step)
- Get workflow execution status
- List active/completed workflows

---

#### **AUTOMATION ENGINE MODULE**
Responsibilities:
- Automation rule management (CRUD)
- Event listener/trigger system
- Rule evaluation and action execution
- Async task queue (e.g., send notifications, create assignments)
- History tracking
- Rule priority/ordering

Key Entities: AutomationRule, AutomationHistory

Key External Interfaces:
- AutomationRule CRUD
- Trigger event (internal, called by other modules)
- List automation history
- Enable/disable rules

---

#### **SCHEDULER MODULE**
Responsibilities:
- Schedule template management (CRUD)
- Cron-based and interval-based scheduling
- Background job processing
- Schedule execution tracking
- Job queue management
- Retry logic for failed jobs

Key Entities: Scheduler, SchedulerExecution

Key External Interfaces:
- Scheduler CRUD
- Get next execution time
- Execute scheduler (internal, called by background service)
- List execution history

---

#### **NOTIFICATION ENGINE MODULE**
Responsibilities:
- Notification creation and delivery
- Multi-channel support (email, SMS, push, in-app)
- Delivery preferences
- Notification digest aggregation
- Delivery status tracking

Key Entities: Notification, NotificationPreference

Key External Interfaces:
- Create notification (internal)
- Send notification (async)
- Get user notifications
- Mark as read
- Update preferences

---

#### **AI ENGINE MODULE**
Responsibilities:
- Local heuristic analysis (provider-agnostic)
- Provider adapter interface (OpenAI, Claude, local LLMs)
- Insight generation
- Analysis requests
- Caching of results
- Confidence scoring

Key Entities: AIInsight, AutonomousDecision

Key External Interfaces:
- Request case analysis
- Request workload analysis
- Request pattern detection
- Get insights (with caching)
- List recommendations

---

#### **GOVERNANCE MODULE**
Responsibilities:
- Policy management (CRUD)
- Approval request creation and tracking
- Policy rule evaluation
- Approval workflow
- Compliance reporting

Key Entities: GovernancePolicy, ApprovalRequest

Key External Interfaces:
- GovernancePolicy CRUD
- Create approval request (internal)
- Approve/reject request
- List pending approvals
- Compliance report

---

#### **MISSION CONTROL MODULE** (Dashboard/Analytics)
Responsibilities:
- Dashboard data aggregation
- KPI calculations
- Executive summaries
- Report generation
- Analytics queries

Key Entities: Activity, AuditLog (read-only)

Key External Interfaces:
- Get dashboard metrics
- Generate report
- Get analytics data
- Export data (with audit logging)

---

#### **AUTONOMOUS ENGINE MODULE**
Responsibilities:
- Autonomous decision proposals
- Decision evaluation and approval flow
- Autonomous operation mode management
- Fallback to manual when needed
- Decision logging

Key Entities: AutonomousDecision

Key External Interfaces:
- Get autonomous decisions
- Approve/reject decision
- Get autonomous mode status
- Switch autonomous mode

---

### 2.3 Inter-Module Communication

**Synchronous**:
- REST endpoints (direct calls)
- Authorization checks (RBAC module)
- Data validation

**Asynchronous**:
- Event bus/message queue
- Automation triggers
- Workflow steps (webhooks)
- Notifications
- Long-running operations (schedulers)

**Internal Events** (Section 1.5 defines these in detail):
- `CaseCreated` → triggers AutomationRules, creates initial Notifications
- `WorkflowExecuted` → logs activity, updates case timeline
- `WorkflowFailed` → sends notification, escalates if needed
- `SchedulerTriggered` → executes task, logs execution
- `NotificationCreated` → delivers via enabled channels
- `ApprovalRequested` → notifies approver
- `LawyerAssigned` → creates activity log, sends notification
- `DocumentUploaded` → creates activity, triggers automations
- etc.

---

## SECTION 3: REST API DESIGN

### 3.1 API Standards

**Base URL**: `/api`

**Response Format**:
```json
{
  "success": true,
  "status": 200,
  "data": {...},
  "error": null,
  "timestamp": "2026-01-15T10:30:00Z",
  "request_id": "uuid-here"
}
```

**Error Response**:
```json
{
  "success": false,
  "status": 400,
  "data": null,
  "error": {
    "code": "INVALID_INPUT",
    "message": "User-facing error message",
    "details": {...}
  },
  "timestamp": "2026-01-15T10:30:00Z",
  "request_id": "uuid-here"
}
```

**Pagination**:
```
?page=1&page_size=20&sort_by=created_at&sort_order=DESC
```

Response includes:
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "page_size": 20,
    "total_count": 150,
    "total_pages": 8
  }
}
```

**Authentication**:
- Header: `Authorization: Bearer <JWT_TOKEN>`
- All endpoints require auth (except /auth/login)

**Headers**:
- `X-Tenant-ID` or `X-Organization-ID` (optional, derived from token if not provided)
- `X-Request-ID` (correlation ID, auto-generated if not provided)
- `Content-Type: application/json`

---

### 3.2 Endpoint Inventory (without implementation)

#### **AUTH MODULE** (`/api/auth`)

| Method | Endpoint | Purpose | RBAC |
|--------|----------|---------|------|
| POST | `/auth/login` | Authenticate user | NONE |
| POST | `/auth/logout` | End session | AUTH |
| POST | `/auth/refresh` | Refresh JWT token | AUTH |
| POST | `/auth/password-reset` | Initiate password reset | NONE |
| PUT | `/auth/password` | Update password | AUTH |
| POST | `/auth/mfa/setup` | Start MFA setup | AUTH |
| POST | `/auth/mfa/verify` | Verify MFA code | AUTH |
| POST | `/auth/mfa/disable` | Disable MFA | AUTH |

---

#### **RBAC MODULE** (`/api/rbac`)

| Method | Endpoint | Purpose | RBAC |
|--------|----------|---------|------|
| GET | `/rbac/roles` | List roles | ADMIN, RBAC_READ |
| GET | `/rbac/roles/{roleId}` | Get role details | ADMIN, RBAC_READ |
| POST | `/rbac/roles` | Create role | ADMIN, RBAC_CREATE |
| PATCH | `/rbac/roles/{roleId}` | Update role | ADMIN, RBAC_UPDATE |
| DELETE | `/rbac/roles/{roleId}` | Delete role | ADMIN, RBAC_DELETE |
| GET | `/rbac/roles/{roleId}/permissions` | List role permissions | ADMIN, RBAC_READ |
| POST | `/rbac/roles/{roleId}/permissions` | Assign permission | ADMIN, RBAC_UPDATE |
| DELETE | `/rbac/roles/{roleId}/permissions/{permId}` | Revoke permission | ADMIN, RBAC_DELETE |
| GET | `/rbac/permissions` | List all permissions (for selection) | ADMIN, RBAC_READ |
| POST | `/rbac/check-permission` | Check if user has permission | AUTH |

---

#### **FIRM CORE MODULE** (`/api/firms`)

| Method | Endpoint | Purpose | RBAC |
|--------|----------|---------|------|
| GET | `/firms/{firmId}` | Get firm details | AUTH |
| PATCH | `/firms/{firmId}` | Update firm | ADMIN, SETTINGS |
| GET | `/firms/{firmId}/offices` | List offices | AUTH |
| POST | `/firms/{firmId}/offices` | Create office | ADMIN, FIRM_MANAGE |
| GET | `/firms/{firmId}/offices/{officeId}` | Get office | AUTH |
| PATCH | `/firms/{firmId}/offices/{officeId}` | Update office | ADMIN, FIRM_MANAGE |
| DELETE | `/firms/{firmId}/offices/{officeId}` | Delete office | ADMIN, FIRM_MANAGE |
| GET | `/firms/{firmId}/departments` | List departments | AUTH |
| POST | `/firms/{firmId}/departments` | Create department | ADMIN, FIRM_MANAGE |
| GET | `/firms/{firmId}/departments/{deptId}` | Get department | AUTH |
| PATCH | `/firms/{firmId}/departments/{deptId}` | Update department | ADMIN, FIRM_MANAGE |
| DELETE | `/firms/{firmId}/departments/{deptId}` | Delete department | ADMIN, FIRM_MANAGE |
| GET | `/firms/{firmId}/lawyers` | List lawyers | AUTH |
| POST | `/firms/{firmId}/lawyers` | Create lawyer | ADMIN, LAWYER_MANAGE |
| GET | `/firms/{firmId}/lawyers/{lawyerId}` | Get lawyer | AUTH |
| PATCH | `/firms/{firmId}/lawyers/{lawyerId}` | Update lawyer | ADMIN, LAWYER_MANAGE |
| DELETE | `/firms/{firmId}/lawyers/{lawyerId}` | Deactivate lawyer | ADMIN, LAWYER_MANAGE |
| GET | `/firms/{firmId}/teams` | List teams | AUTH |
| POST | `/firms/{firmId}/teams` | Create team | MANAGER, TEAM_MANAGE |
| GET | `/firms/{firmId}/teams/{teamId}` | Get team | AUTH |
| PATCH | `/firms/{firmId}/teams/{teamId}` | Update team | MANAGER, TEAM_MANAGE |
| DELETE | `/firms/{firmId}/teams/{teamId}` | Delete team | MANAGER, TEAM_MANAGE |
| POST | `/firms/{firmId}/teams/{teamId}/members` | Add team member | MANAGER, TEAM_MANAGE |
| DELETE | `/firms/{firmId}/teams/{teamId}/members/{lawyerId}` | Remove team member | MANAGER, TEAM_MANAGE |

---

#### **CASE MANAGEMENT MODULE** (`/api/firms/{firmId}/cases`)

| Method | Endpoint | Purpose | RBAC |
|--------|----------|---------|------|
| GET | `/firms/{firmId}/cases` | List cases (with filters) | CASES_READ |
| POST | `/firms/{firmId}/cases` | Create case | CASES_CREATE |
| GET | `/firms/{firmId}/cases/{caseId}` | Get case details | CASES_READ |
| PATCH | `/firms/{firmId}/cases/{caseId}` | Update case | CASES_UPDATE |
| DELETE | `/firms/{firmId}/cases/{caseId}` | Soft delete case | CASES_DELETE |
| GET | `/firms/{firmId}/cases/{caseId}/activity` | List case activity | CASES_READ |
| GET | `/firms/{firmId}/cases/{caseId}/expenses` | List case expenses | CASES_READ |
| POST | `/firms/{firmId}/cases/{caseId}/expenses` | Record expense | CASES_UPDATE |
| GET | `/firms/{firmId}/clients` | List clients | CLIENTS_READ |
| POST | `/firms/{firmId}/clients` | Create client | CLIENTS_CREATE |
| GET | `/firms/{firmId}/clients/{clientId}` | Get client | CLIENTS_READ |
| PATCH | `/firms/{firmId}/clients/{clientId}` | Update client | CLIENTS_UPDATE |
| DELETE | `/firms/{firmId}/clients/{clientId}` | Soft delete client | CLIENTS_DELETE |
| POST | `/firms/{firmId}/cases/{caseId}/documents` | Upload document | DOCUMENTS_UPLOAD |
| GET | `/firms/{firmId}/cases/{caseId}/documents` | List documents | DOCUMENTS_READ |
| GET | `/firms/{firmId}/documents/{docId}` | Get document metadata | DOCUMENTS_READ |
| GET | `/firms/{firmId}/documents/{docId}/download` | Download document | DOCUMENTS_READ |
| POST | `/firms/{firmId}/documents/{docId}/versions` | Upload new version | DOCUMENTS_UPLOAD |
| GET | `/firms/{firmId}/documents/{docId}/versions` | List versions | DOCUMENTS_READ |
| GET | `/firms/{firmId}/documents/{docId}/access-log` | View access audit | DOCUMENTS_READ, AUDIT_READ |
| DELETE | `/firms/{firmId}/documents/{docId}` | Soft delete | DOCUMENTS_DELETE |

---

#### **WORKFLOW ENGINE MODULE** (`/api/firms/{firmId}/workflows`)

| Method | Endpoint | Purpose | RBAC |
|--------|----------|---------|------|
| GET | `/firms/{firmId}/workflows` | List workflow templates | WORKFLOWS_READ |
| POST | `/firms/{firmId}/workflows` | Create template | WORKFLOWS_CREATE |
| GET | `/firms/{firmId}/workflows/{wfId}` | Get template | WORKFLOWS_READ |
| PATCH | `/firms/{firmId}/workflows/{wfId}` | Update template | WORKFLOWS_UPDATE |
| DELETE | `/firms/{firmId}/workflows/{wfId}` | Delete template | WORKFLOWS_DELETE |
| POST | `/firms/{firmId}/cases/{caseId}/workflow-executions` | Start workflow | WORKFLOWS_EXECUTE |
| GET | `/firms/{firmId}/workflow-executions` | List executions | WORKFLOWS_READ |
| GET | `/firms/{firmId}/workflow-executions/{execId}` | Get execution | WORKFLOWS_READ |
| PATCH | `/firms/{firmId}/workflow-executions/{execId}` | Update execution (move step) | WORKFLOWS_EXECUTE |
| POST | `/firms/{firmId}/workflow-executions/{execId}/steps/{stepIdx}` | Complete step | WORKFLOWS_EXECUTE |
| POST | `/firms/{firmId}/workflow-executions/{execId}/pause` | Pause execution | WORKFLOWS_EXECUTE |
| POST | `/firms/{firmId}/workflow-executions/{execId}/resume` | Resume execution | WORKFLOWS_EXECUTE |
| POST | `/firms/{firmId}/workflow-executions/{execId}/cancel` | Cancel execution | WORKFLOWS_EXECUTE |
| GET | `/firms/{firmId}/workflow-executions/{execId}/steps` | List step executions | WORKFLOWS_READ |

---

#### **AUTOMATION ENGINE MODULE** (`/api/firms/{firmId}/automations`)

| Method | Endpoint | Purpose | RBAC |
|--------|----------|---------|------|
| GET | `/firms/{firmId}/automations/rules` | List automation rules | AUTOMATION_READ |
| POST | `/firms/{firmId}/automations/rules` | Create rule | AUTOMATION_CREATE |
| GET | `/firms/{firmId}/automations/rules/{ruleId}` | Get rule | AUTOMATION_READ |
| PATCH | `/firms/{firmId}/automations/rules/{ruleId}` | Update rule | AUTOMATION_UPDATE |
| DELETE | `/firms/{firmId}/automations/rules/{ruleId}` | Delete rule | AUTOMATION_DELETE |
| POST | `/firms/{firmId}/automations/rules/{ruleId}/enable` | Enable rule | AUTOMATION_UPDATE |
| POST | `/firms/{firmId}/automations/rules/{ruleId}/disable` | Disable rule | AUTOMATION_UPDATE |
| GET | `/firms/{firmId}/automations/history` | List execution history | AUTOMATION_READ |
| POST | `/firms/{firmId}/automations/trigger` | Trigger rule (for testing) | AUTOMATION_ADMIN |

---

#### **SCHEDULER MODULE** (`/api/firms/{firmId}/schedules`)

| Method | Endpoint | Purpose | RBAC |
|--------|----------|---------|------|
| GET | `/firms/{firmId}/schedules` | List schedules | SCHEDULER_READ |
| POST | `/firms/{firmId}/schedules` | Create schedule | SCHEDULER_CREATE |
| GET | `/firms/{firmId}/schedules/{schedId}` | Get schedule | SCHEDULER_READ |
| PATCH | `/firms/{firmId}/schedules/{schedId}` | Update schedule | SCHEDULER_UPDATE |
| DELETE | `/firms/{firmId}/schedules/{schedId}` | Delete schedule | SCHEDULER_DELETE |
| POST | `/firms/{firmId}/schedules/{schedId}/execute` | Execute now | SCHEDULER_ADMIN |
| GET | `/firms/{firmId}/schedules/{schedId}/executions` | List executions | SCHEDULER_READ |
| GET | `/firms/{firmId}/schedules/executions/{execId}` | Get execution | SCHEDULER_READ |

---

#### **NOTIFICATION MODULE** (`/api/firms/{firmId}/notifications`)

| Method | Endpoint | Purpose | RBAC |
|--------|----------|---------|------|
| GET | `/firms/{firmId}/notifications` | List user notifications | AUTH |
| GET | `/firms/{firmId}/notifications/unread` | Get unread count | AUTH |
| POST | `/firms/{firmId}/notifications/{notifId}/read` | Mark as read | AUTH |
| POST | `/firms/{firmId}/notifications/read-all` | Mark all as read | AUTH |
| DELETE | `/firms/{firmId}/notifications/{notifId}` | Delete notification | AUTH |
| DELETE | `/firms/{firmId}/notifications/read-all/delete` | Delete all read | AUTH |
| GET | `/users/{userId}/notification-preferences` | Get preferences | AUTH |
| PATCH | `/users/{userId}/notification-preferences` | Update preferences | AUTH |

---

#### **GOVERNANCE MODULE** (`/api/firms/{firmId}/governance`)

| Method | Endpoint | Purpose | RBAC |
|--------|----------|---------|------|
| GET | `/firms/{firmId}/governance/policies` | List policies | GOVERNANCE_READ |
| POST | `/firms/{firmId}/governance/policies` | Create policy | GOVERNANCE_CREATE |
| GET | `/firms/{firmId}/governance/policies/{policyId}` | Get policy | GOVERNANCE_READ |
| PATCH | `/firms/{firmId}/governance/policies/{policyId}` | Update policy | GOVERNANCE_UPDATE |
| DELETE | `/firms/{firmId}/governance/policies/{policyId}` | Delete policy | GOVERNANCE_DELETE |
| POST | `/firms/{firmId}/governance/policies/{policyId}/approve` | Approve policy | GOVERNANCE_APPROVE |
| GET | `/firms/{firmId}/governance/approvals` | List approval requests | GOVERNANCE_READ |
| GET | `/firms/{firmId}/governance/approvals/{approvalId}` | Get approval | GOVERNANCE_READ |
| POST | `/firms/{firmId}/governance/approvals/{approvalId}/approve` | Approve request | GOVERNANCE_APPROVE |
| POST | `/firms/{firmId}/governance/approvals/{approvalId}/reject` | Reject request | GOVERNANCE_APPROVE |
| GET | `/firms/{firmId}/governance/compliance-report` | Get compliance report | GOVERNANCE_READ, AUDIT_READ |

---

#### **AI ENGINE MODULE** (`/api/firms/{firmId}/ai`)

| Method | Endpoint | Purpose | RBAC |
|--------|----------|---------|------|
| GET | `/firms/{firmId}/ai/insights` | List insights | AI_READ |
| GET | `/firms/{firmId}/ai/insights/{insightId}` | Get insight | AI_READ |
| POST | `/firms/{firmId}/ai/insights/archive/{insightId}` | Archive insight | AI_UPDATE |
| POST | `/firms/{firmId}/ai/analyze/case/{caseId}` | Request case analysis | AI_REQUEST |
| POST | `/firms/{firmId}/ai/analyze/workload` | Request workload analysis | AI_REQUEST |
| POST | `/firms/{firmId}/ai/analyze/pattern` | Request pattern detection | AI_REQUEST |
| GET | `/firms/{firmId}/ai/recommendations` | Get recommendations | AI_READ |
| GET | `/firms/{firmId}/ai/config` | Get AI configuration | ADMIN |
| PATCH | `/firms/{firmId}/ai/config` | Update AI provider config | ADMIN |

---

#### **AUTONOMOUS ENGINE MODULE** (`/api/firms/{firmId}/autonomous`)

| Method | Endpoint | Purpose | RBAC |
|--------|----------|---------|------|
| GET | `/firms/{firmId}/autonomous/decisions` | List decisions | AUTONOMOUS_READ |
| GET | `/firms/{firmId}/autonomous/decisions/{decisionId}` | Get decision | AUTONOMOUS_READ |
| POST | `/firms/{firmId}/autonomous/decisions/{decisionId}/approve` | Approve decision | AUTONOMOUS_APPROVE |
| POST | `/firms/{firmId}/autonomous/decisions/{decisionId}/reject` | Reject decision | AUTONOMOUS_APPROVE |
| GET | `/firms/{firmId}/autonomous/mode` | Get operation mode | AUTH |
| PATCH | `/firms/{firmId}/autonomous/mode` | Set operation mode | AUTONOMOUS_ADMIN |

---

#### **MISSION CONTROL MODULE** (`/api/firms/{firmId}/dashboard`)

| Method | Endpoint | Purpose | RBAC |
|--------|----------|---------|------|
| GET | `/firms/{firmId}/dashboard/metrics` | Get dashboard KPIs | AUTH |
| GET | `/firms/{firmId}/dashboard/analytics/cases` | Case analytics | ANALYTICS_READ |
| GET | `/firms/{firmId}/dashboard/analytics/workload` | Workload analytics | ANALYTICS_READ |
| GET | `/firms/{firmId}/dashboard/analytics/financials` | Financial analytics | ANALYTICS_READ |
| POST | `/firms/{firmId}/dashboard/reports/generate` | Generate report | REPORTS_GENERATE |
| GET | `/firms/{firmId}/dashboard/reports/{reportId}` | Get report | REPORTS_READ |
| POST | `/firms/{firmId}/dashboard/export` | Export data | EXPORT_DATA |

---

#### **AUDIT & COMPLIANCE MODULE** (`/api/firms/{firmId}/audit`)

| Method | Endpoint | Purpose | RBAC |
|--------|----------|---------|------|
| GET | `/firms/{firmId}/audit/logs` | List audit logs | AUDIT_READ |
| GET | `/firms/{firmId}/audit/logs/{logId}` | Get log entry | AUDIT_READ |
| GET | `/firms/{firmId}/audit/activity` | List activity | AUDIT_READ |
| POST | `/firms/{firmId}/audit/export` | Export logs | AUDIT_READ, EXPORT_DATA |

---

#### **USER MANAGEMENT MODULE** (`/api/users`)

| Method | Endpoint | Purpose | RBAC |
|--------|----------|---------|------|
| GET | `/users/profile` | Get current user | AUTH |
| PATCH | `/users/profile` | Update profile | AUTH |
| GET | `/users/{userId}/preferences` | Get preferences | AUTH |
| PATCH | `/users/{userId}/preferences` | Update preferences | AUTH |
| GET | `/firms/{firmId}/users` | List firm users | ADMIN, USER_READ |
| POST | `/firms/{firmId}/users` | Invite user | ADMIN, USER_CREATE |
| GET | `/firms/{firmId}/users/{userId}` | Get user | ADMIN, USER_READ |
| PATCH | `/firms/{firmId}/users/{userId}` | Update user | ADMIN, USER_UPDATE |
| DELETE | `/firms/{firmId}/users/{userId}` | Deactivate user | ADMIN, USER_DELETE |
| POST | `/firms/{firmId}/users/{userId}/roles` | Assign role | ADMIN, RBAC_UPDATE |
| DELETE | `/firms/{firmId}/users/{userId}/roles/{roleId}` | Revoke role | ADMIN, RBAC_UPDATE |

---

#### **SETTINGS MODULE** (`/api/firms/{firmId}/settings`)

| Method | Endpoint | Purpose | RBAC |
|--------|----------|---------|------|
| GET | `/firms/{firmId}/settings` | List firm settings | ADMIN, SETTINGS_READ |
| GET | `/firms/{firmId}/settings/{key}` | Get setting | ADMIN, SETTINGS_READ |
| PATCH | `/firms/{firmId}/settings/{key}` | Update setting | ADMIN, SETTINGS_UPDATE |
| DELETE | `/firms/{firmId}/settings/{key}` | Delete setting | ADMIN, SETTINGS_DELETE |

---

## SECTION 4: DATABASE SCHEMA

### 4.1 Schema Design Principles

1. **Multi-Tenancy**: All tables have `firm_id` FK (except Users, which has `firm_id` but not always)
2. **Soft Deletes**: `deleted_at` timestamp instead of hard deletes (audit trail)
3. **Versioning**: Document versions tracked in separate table
4. **Audit Timestamps**: `created_at`, `updated_at` on all entities
5. **Indexing**: Heavy on foreign keys, status, firm_id, created_at for analytics
6. **Constraints**: NOT NULL on required fields, unique constraints for business keys
7. **JSONB**: Flexible schema for metadata, configurations, custom fields

### 4.2 SQL DDL (DDL structure only, no implementation)

All tables follow this pattern:

```sql
CREATE TABLE entity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES firm(id) ON DELETE CASCADE,
  -- business fields
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_entity_firm_id ON entity(firm_id);
CREATE INDEX idx_entity_created_at ON entity(created_at);
-- business-specific indexes
```

**Database**: PostgreSQL 14+  
**Collation**: UTF-8 (for Spanish text)  
**Timezone**: UTC for all timestamps  
**Backup**: Daily incremental, monthly full backups

---

### 4.3 Key Indexes for Performance

**High-Volume Queries**:
- `firm(id)` — fast tenant lookup
- `user(firm_id, email)` — login queries
- `case(firm_id, status)` — case lists, filtering
- `case(assigned_lawyer_id)` — lawyer's workload
- `document(case_id)` — case documents
- `audit_log(firm_id, created_at DESC)` — compliance queries
- `workflow_execution(case_id, status)` — case workflows
- `notification(recipient_user_id, is_read)` — user notifications
- `automation_history(firm_id, executed_at DESC)` — automation audit

---

## SECTION 5: INTERNAL EVENTS

Events are published internally (within the backend) to trigger automations, notifications, and side-effects.

### 5.1 Event-Driven Architecture

**Publisher-Subscriber Pattern**:
- Module publishes event (e.g., "CaseCreated")
- Event bus routes event to subscribers
- Subscribers are notified (sync or async)
- No direct coupling between modules

**Event Structure**:
```json
{
  "event_id": "uuid",
  "event_type": "CaseCreated",
  "aggregate_id": "case-uuid",
  "aggregate_type": "Case",
  "firm_id": "firm-uuid",
  "user_id": "user-uuid",
  "timestamp": "2026-01-15T10:30:00Z",
  "payload": {
    "case_id": "...",
    "client_id": "...",
    "assigned_lawyer_id": "...",
    "priority": "HIGH",
    ...
  }
}
```

### 5.2 Event Types

| Event | Source Module | Subscribers | Payload |
|-------|---------------|-------------|---------|
| **CaseCreated** | Case Management | Automation Engine, Notification Engine, Scheduler | case_id, client_id, assigned_lawyer_id, priority |
| **CaseUpdated** | Case Management | Automation Engine, Notification Engine | case_id, changed_fields, old_values, new_values |
| **CaseStatusChanged** | Case Management | Automation Engine, Notification Engine, Governance | case_id, old_status, new_status |
| **CaseAssigned** | Case Management | Notification Engine | case_id, lawyer_id |
| **CaseArchived** | Case Management | Scheduler (disable related) | case_id |
| **ClientCreated** | Case Management | Notification Engine, Automation | client_id, firm_id |
| **DocumentUploaded** | Case Management | Automation Engine, Notification Engine, AI Engine | document_id, case_id, file_type |
| **DocumentVersioned** | Case Management | Audit Log | document_id, version_number |
| **DocumentAccessed** | Case Management | Audit Log | document_id, user_id, access_type |
| **WorkflowCreated** | Workflow Engine | Notification Engine | workflow_id, name |
| **WorkflowExecutionStarted** | Workflow Engine | Scheduler (set due dates), Notification Engine | execution_id, workflow_id, case_id |
| **WorkflowStepCompleted** | Workflow Engine | Workflow Engine (next step), Notification Engine, Audit Log | execution_id, step_index |
| **WorkflowExecutionCompleted** | Workflow Engine | Case Management (update activity), Notification Engine, Automation Engine | execution_id, case_id |
| **WorkflowExecutionFailed** | Workflow Engine | Notification Engine (escalation), Audit Log | execution_id, reason, assigned_lawyer_id |
| **ApprovalRequested** | Governance Module | Notification Engine | approval_id, approver_user_id, approval_type |
| **ApprovalApproved** | Governance Module | Audit Log, related module (Workflow, Case, etc.) | approval_id, approver_user_id |
| **ApprovalRejected** | Governance Module | Notification Engine, Audit Log | approval_id, approver_user_id, reason |
| **AutomationRuleTriggered** | Automation Engine | Automation Engine (execute action), Audit Log | rule_id, trigger_event, target_count |
| **AutomationRuleExecuted** | Automation Engine | Notification Engine, Audit Log | rule_id, status, affected_count |
| **SchedulerExecuted** | Scheduler Module | Notification Engine (if failed), Audit Log | scheduler_id, execution_id, status |
| **NotificationCreated** | Notification Engine | Notification Engine (send via channels), Audit Log | notification_id, user_id, channels |
| **LawyerAssigned** | Case Management / HR | Notification Engine, Activity Log | lawyer_id, resource_type, resource_id |
| **LawyerUnavailable** | HR / Scheduler | Automation Engine (reassign), Notification Engine | lawyer_id, until_date |
| **AIInsightGenerated** | AI Engine | Notification Engine (if high confidence), Audit Log | insight_id, case_id, confidence_score |
| **AutonomousDecisionProposed** | Autonomous Engine | Notification Engine (notify approvers) | decision_id, case_id, requires_approval |
| **AutonomousDecisionApproved** | Autonomous Engine | Autonomous Engine (execute), Audit Log | decision_id, approver_user_id |
| **ExpenseLogged** | Case Management | Automation Engine (check policy), Notification Engine | expense_id, case_id, amount |
| **GovernancePolicyCreated** | Governance | Audit Log, Notification Engine | policy_id, policy_type |
| **GovernancePolicyApproved** | Governance | Audit Log, Notification Engine | policy_id |
| **UserLoggedIn** | Auth Module | Audit Log, Activity Log | user_id, ip_address, timestamp |
| **UserLoggedOut** | Auth Module | Audit Log, Activity Log | user_id, timestamp |
| **UserPasswordChanged** | Auth Module | Notification Engine (security alert), Audit Log | user_id |
| **UserMFAEnabled** | Auth Module | Notification Engine (security event), Audit Log | user_id |
| **RoleAssigned** | RBAC Module | Audit Log, Notification Engine | user_id, role_id |
| **PermissionChanged** | RBAC Module | Audit Log | role_id, permission_id, action (added/removed) |
| **RoleCreated** | RBAC Module | Audit Log | role_id, name |
| **BulkOperationStarted** | Any Module | Notification Engine, Activity Log | operation_type, count |
| **BulkOperationCompleted** | Any Module | Notification Engine, Audit Log | operation_type, success_count, failure_count |

---

## SECTION 6: ENTERPRISE RBAC DESIGN

### 6.1 System Roles

**1. Owner** (Rank 0)
- Full system access
- Cannot be modified or removed
- Implicit approval for all actions
- Used only for account/subscription management

**2. Managing Partner** (Rank 10)
- Full operational access
- Can manage users, roles, permissions
- Can approve high-level decisions
- Can modify governance policies

**3. Partner** (Rank 20)
- Department/team leader access
- Can manage cases in their department
- Can approve workflows for their team
- Can manage team members
- View firm dashboards

**4. Administrator** (Rank 30)
- Technical/system admin only
- User management, system settings
- No case management by default
- Can manage integrations

**5. Manager** (Rank 40)
- Team lead access
- Manage assigned cases
- Assign and manage team members
- View team analytics

**6. Lawyer** (Rank 50)
- Case attorney
- Can view/edit assigned cases
- Can execute assigned workflows
- Limited administrative access
- View own performance metrics

**7. Assistant** (Rank 60)
- Support staff
- Limited case access (assigned support)
- Can perform data entry
- Limited reporting

**8. ReadOnly** (Rank 100)
- View-only dashboards and reports
- No modifications
- No sensitive data access (documents with privilege)

**9. Client** (Rank 110)
- External user
- View own cases only
- Cannot access firm internal operations
- No document access by default

---

### 6.2 Permission Matrix (by Module)

| Module | Owner | Mgmt Partner | Partner | Admin | Manager | Lawyer | Asst | ReadOnly | Client |
|--------|-------|--------------|---------|-------|---------|--------|------|----------|--------|
| **CASES** | ✓ | ✓ | ✓ | ✗ | ✓ | ✓ | ✓ | R | LIMITED |
| **CLIENTS** | ✓ | ✓ | ✓ | ✗ | ✓ | R | ✓ | R | ✗ |
| **DOCUMENTS** | ✓ | ✓ | ✓ | ✗ | ✓ | ✓ | ✓ | R | LIMITED |
| **WORKFLOWS** | ✓ | ✓ | ✓ | ✗ | ✓ | ✓ | ✗ | R | ✗ |
| **AUTOMATION** | ✓ | ✓ | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| **SCHEDULER** | ✓ | ✓ | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| **GOVERNANCE** | ✓ | ✓ | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| **AI_INSIGHTS** | ✓ | ✓ | ✓ | ✗ | ✓ | ✓ | ✗ | R | ✗ |
| **AUTONOMOUS** | ✓ | ✓ | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| **DASHBOARD** | ✓ | ✓ | ✓ | ✗ | ✓ | R | ✗ | R | ✗ |
| **AUDIT_LOGS** | ✓ | ✓ | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| **SETTINGS** | ✓ | ✓ | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| **ADMIN** | ✓ | ✓ | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |

Legend: ✓ = Full Access, R = Read-Only, LIMITED = Restricted, ✗ = No Access

---

### 6.3 Conditional Permissions

Some permissions depend on data context:

**Own Cases Only**:
- Lawyers can only CRUD cases where they are `assigned_lawyer_id`
- Assistants can only CRUD cases assigned to their manager

**Own Documents Only**:
- Users cannot view privileged documents unless explicitly granted

**Department-Scoped**:
- Partners can only manage cases in their department
- Managers can only manage cases assigned to their team

---

## SECTION 7: PERSISTENCE STRATEGY

### 7.1 What Lives Where

| Feature | Storage | Sync Strategy | Durability | Notes |
|---------|---------|---------------|-----------|-------|
| User Authentication | Backend (DB) | Real-time | ✓ Critical | JWT tokens validated server-side |
| User Profile | Backend (DB) | Real-time | ✓ Critical | Cached in frontend (TTL: 1 hour) |
| Firm Data | Backend (DB) | Real-time | ✓ Critical | Immutable; read-heavy |
| Roles & Permissions | Backend (DB) + Cache | On-change | ✓ Critical | Cached in-memory on backend |
| Cases | Backend (DB) | Real-time | ✓ Critical | Frontend can derive workload/expedientes |
| Clients | Backend (DB) | Real-time | ✓ Critical | Largely read-only |
| Documents | Backend (Object Storage + DB) | On-upload | ✓ Critical | S3/GCS for files; DB for metadata |
| Workflows (Templates) | Backend (DB) | Real-time | ✓ Critical | Versioned |
| Workflow Executions | Backend (DB) | Real-time | ✓ Important | Audit trail + state machine |
| Automation Rules | Backend (DB) | Real-time | ✓ Important | Triggered by backend events |
| Automation History | Backend (DB) | Batch | ✓ Important | Audit trail; can be archived old records |
| Schedules | Backend (DB) | Real-time | ✓ Important | Executed by background service |
| Scheduler Executions | Backend (DB) | Async | ✓ Important | Audit trail |
| Notifications | Backend (DB) | Real-time | ✓ Important | Sent async; logged for audit |
| Governance Policies | Backend (DB) | Real-time | ✓ Critical | Must be consistent |
| Approval Requests | Backend (DB) | Real-time | ✓ Important | Time-sensitive |
| AI Insights | Backend (DB) | On-generate | ✓ Important | Can be regenerated |
| Autonomous Decisions | Backend (DB) | Real-time | ✓ Important | Audit trail |
| Audit Logs | Backend (DB, Archive) | Batch | ✓ Critical | Compliance retention |
| Activity Logs | Backend (DB, Archive) | Batch | ✓ Important | Analytics only |
| User Preferences | Backend (DB) | On-change | ✓ Optional | Cached locally (localStorage) OK |
| Settings | Backend (DB) + Cache | On-change | ✓ Important | Cached; short TTL |
| Local Heuristics Cache | Frontend (localStorage) | Best-effort | ✗ Optional | Expediente derivations, dashboards |

---

### 7.2 Caching Strategy

**Redis Cache Layer** (optional but recommended for scale):
- Session tokens (TTL: token expiry)
- User permissions (TTL: 15 min)
- Firm settings (TTL: 1 hour)
- Dashboard aggregations (TTL: 15 min)
- Case search indexes (TTL: 30 min)

**Frontend localStorage**:
- Last selected firm (for UX)
- User preferences (UI theme, language)
- Expediente derivations (stale OK; refresh on load)
- Heuristic AI results (with expiry)

**CDN** (optional):
- Public documents (if supported)
- Static reports

---

### 7.3 Sync & Reconciliation

**Real-Time Sync**:
- WebSocket subscriptions for live updates (case changes, notifications)
- Optimistic updates on frontend (rollback on error)

**Eventual Consistency**:
- Automation rule executions (fire-and-forget, logged for audit)
- Notification delivery (async queue)
- Scheduler executions (background service)

**Conflict Resolution**:
- Last-write-wins for simple fields
- Explicit versioning for documents
- Event sourcing for workflows (immutable steps)

---

## SECTION 8: IMPLEMENTATION ROADMAP

### 8.1 Phasing & Priorities

**PHASE 1: MVP Backend Infrastructure (P0 — Weeks 1–4)**
- [ ] Database setup (PostgreSQL schema)
- [ ] Auth module (login, JWT, session management)
- [ ] User/Firm CRUD endpoints
- [ ] Basic RBAC (role assignment, permission checks)
- [ ] Core data endpoints (Lawyers, Cases, Clients)
- [ ] Audit logging infrastructure

**Effort**: 4 weeks, 2–3 engineers  
**Deliverable**: Functional backend with auth and basic data operations

---

**PHASE 2: Case Management & Document Handling (P0 — Weeks 5–8)**
- [ ] Case CRUD (full implementation)
- [ ] Client CRUD
- [ ] Document upload/storage (S3/GCS integration)
- [ ] Document versioning
- [ ] Document access audit
- [ ] Case activity tracking
- [ ] Expense tracking
- [ ] Search & filtering

**Effort**: 4 weeks, 2–3 engineers  
**Deliverable**: Production-ready case management backend

---

**PHASE 3: Workflow Engine (P1 — Weeks 9–12)**
- [ ] Workflow template CRUD
- [ ] Workflow execution engine (state machine)
- [ ] Step progression & assignment
- [ ] Approval workflows
- [ ] Webhook execution
- [ ] Long-running operation handling
- [ ] Workflow history & audit

**Effort**: 4 weeks, 2 engineers  
**Deliverable**: Functional workflow automation

---

**PHASE 4: Automation & Scheduling (P1 — Weeks 13–16)**
- [ ] Automation rule CRUD
- [ ] Event trigger system
- [ ] Rule evaluation engine
- [ ] Action execution (notifications, assignments, tasks)
- [ ] Automation history
- [ ] Scheduler template CRUD
- [ ] Cron-based task execution
- [ ] Background job processing

**Effort**: 4 weeks, 2 engineers  
**Deliverable**: Automation & scheduling engine ready

---

**PHASE 5: Governance & Approvals (P1 — Weeks 17–20)**
- [ ] Governance policy management
- [ ] Approval request workflow
- [ ] Policy rule evaluation
- [ ] Escalation chains
- [ ] Compliance reporting

**Effort**: 3 weeks, 1–2 engineers  
**Deliverable**: Enterprise governance framework

---

**PHASE 6: AI Integration Layer (P2 — Weeks 21–24)**
- [ ] AI module architecture (provider-agnostic)
- [ ] Local heuristic analyzer
- [ ] Insight generation engine
- [ ] Provider adapter interface (OpenAI, Claude, local)
- [ ] Autonomous decision proposals
- [ ] Decision approval workflow
- [ ] Caching & optimization

**Effort**: 4 weeks, 2 engineers  
**Deliverable**: Production AI/ML integration layer

---

**PHASE 7: Notifications & Real-Time (P2 — Weeks 25–28)**
- [ ] Notification creation & delivery
- [ ] Multi-channel support (email, SMS, push, in-app)
- [ ] WebSocket live updates
- [ ] Notification preferences
- [ ] Delivery logging & audit

**Effort**: 3 weeks, 1–2 engineers  
**Deliverable**: Real-time notification system

---

**PHASE 8: Dashboard & Analytics (P2 — Weeks 29–32)**
- [ ] Dashboard data aggregation
- [ ] KPI calculations
- [ ] Executive summaries
- [ ] Report generation
- [ ] Analytics queries & export

**Effort**: 3 weeks, 1–2 engineers  
**Deliverable**: Mission Control dashboard backend

---

**PHASE 9: Performance & Scaling (P3 — Weeks 33–36)**
- [ ] Database indexing optimization
- [ ] Redis caching layer
- [ ] Query optimization
- [ ] Connection pooling
- [ ] Load testing & tuning
- [ ] Monitoring & observability

**Effort**: 3 weeks, 1–2 engineers  
**Deliverable**: Production-grade performance

---

**PHASE 10: Integration & Polish (P3 — Weeks 37–40)**
- [ ] Frontend integration testing
- [ ] API documentation
- [ ] Error handling & edge cases
- [ ] Security hardening
- [ ] Compliance review
- [ ] Performance validation

**Effort**: 2 weeks, Full team  
**Deliverable**: Production-ready backend

---

### 8.2 Priority Classification

**P0 — Critical Path** (Must have for MVP):
- Auth, User, RBAC
- Case, Client, Document management
- Core data endpoints
- Audit logging

**P1 — Core Features** (Must have for Enterprise):
- Workflows
- Automation
- Scheduling
- Governance & Approvals

**P2 — Advanced Features** (Should have):
- AI/ML integration
- Notifications & real-time
- Dashboard & analytics

**P3 — Polish & Optimization** (Nice to have):
- Performance tuning
- Advanced caching
- Extended integrations

---

### 8.3 Estimation Summary

| Phase | Duration | Effort (person-weeks) | Engineers | P.Priority |
|-------|----------|----------------------|-----------|-----------|
| 1. Infrastructure | 4 weeks | 8–12 | 2–3 | P0 |
| 2. Case Management | 4 weeks | 8–12 | 2–3 | P0 |
| 3. Workflows | 4 weeks | 8 | 2 | P1 |
| 4. Automation & Scheduler | 4 weeks | 8 | 2 | P1 |
| 5. Governance | 3 weeks | 6 | 2 | P1 |
| 6. AI Integration | 4 weeks | 8 | 2 | P2 |
| 7. Notifications & Real-Time | 3 weeks | 6 | 2 | P2 |
| 8. Dashboard & Analytics | 3 weeks | 6 | 2 | P2 |
| 9. Performance & Scaling | 3 weeks | 6 | 2 | P3 |
| 10. Integration & Polish | 2 weeks | 8 | Full team | P3 |
| **TOTAL** | **40 weeks** | **74–98 person-weeks** | **2–3 core** | |

**Timeline**: ~10 months with 2–3 engineers; can be parallelized to 6–7 months with additional resources.

---

### 8.4 Risk & Dependencies

**Critical Dependencies**:
- Database infrastructure (PostgreSQL, backups)
- Object storage (S3/GCS for documents)
- Message queue (if using async events)
- Email/SMS providers (for notifications)
- Monitoring & logging (Sentry, DataDog, etc.)

**Key Risks**:
1. Database migration when scaling (handle carefully)
2. Multi-tenancy isolation bugs (test extensively)
3. Event ordering issues (use event timestamps)
4. AI provider integration complexity (defer to P2; MVP uses heuristics)
5. Audit compliance (build in from day 1)

**Mitigation**:
- Comprehensive integration tests for multi-tenancy
- Event sourcing for critical operations
- Separate test environments per phase
- Early security & compliance review

---

## SECTION 9: DEPLOYMENT & OPERATIONS

### 9.1 Infrastructure

**Production Stack**:
- **Compute**: Kubernetes (GKE, EKS, or Managed K8s)
- **Database**: PostgreSQL 14+ (managed: Cloud SQL, RDS, Supabase)
- **Storage**: S3 or Cloud Storage
- **Cache**: Redis (ElastiCache, Memorystore)
- **Message Queue**: RabbitMQ or Pub/Sub (for events)
- **Monitoring**: Prometheus + Grafana, DataDog, or Sentry
- **Logging**: ELK Stack or Cloud Logging

**HA/DR**:
- Multi-region backup
- Read replicas for analytics
- Connection pooling
- Circuit breakers for external services

---

### 9.2 API Versioning

**Strategy**: Backward-compatible changes by default.

**Versioning**:
- Current: `/api/v1/...`
- Future: `/api/v2/...` if breaking changes needed
- Deprecation: Support v1 for 12 months after v2 release

---

### 9.3 Rate Limiting & Quotas

**Per-Firm Quotas** (configurable by subscription):
- API calls/month: based on plan
- Concurrent users: based on seats
- Storage: based on plan
- Workflows/month: based on plan
- AI requests: based on plan (premium)

**Rate Limiting**:
- 100 requests/min per user
- 1000 requests/min per firm
- Backoff: 429 Too Many Requests

---

### 9.4 Monitoring & Observability

**Metrics**:
- Request latency (p50, p95, p99)
- Error rate (by endpoint, by error type)
- Database query times
- Cache hit ratio
- Event processing latency
- Workflow execution times

**Alerts**:
- Error rate > 5%
- P99 latency > 1s
- Database CPU > 80%
- Memory > 85%
- Queue depth > 10K
- Failed events (CRITICAL)

**Logging**:
- All API requests (with correlation ID)
- All database queries (slow query log)
- All events (for audit & debugging)
- All errors (stack trace)
- All audit actions (AuditLog table)

---

## SECTION 10: SECURITY CONSIDERATIONS

### 10.1 Authentication & Authorization

- **MFA Mandatory** for Partners, Admins, Owners
- **Session Timeout**: 30 min idle (configurable)
- **Password Policy**: Min 12 chars, complexity rules
- **Token Refresh**: 1-hour access token, 7-day refresh token
- **RBAC Enforcement**: Every endpoint validates user permissions

---

### 10.2 Data Protection

- **Encryption at Rest**: AES-256 for sensitive fields (MFA secrets, password hashes)
- **Encryption in Transit**: TLS 1.3 for all endpoints
- **Document Encryption**: Optional per-document encryption
- **PII Handling**: Encrypted fields for SSN, tax IDs, phone numbers

---

### 10.3 Audit & Compliance

- **Complete Audit Trail**: Every action logged to AuditLog
- **Document Access Log**: Every document access tracked
- **Event Logging**: All events published and logged
- **Retention**: 7 years for audit logs (configurable by jurisdiction)
- **Export**: Secure audit export (with auth)

---

### 10.4 API Security

- **CORS**: Strict origin validation
- **CSRF**: Token-based protection (built into SPA framework)
- **Input Validation**: All inputs validated server-side
- **SQL Injection**: Prepared statements, ORM parameterization
- **XSS Prevention**: Output encoding, CSP headers
- **Rate Limiting**: Per-user, per-firm limits

---

## CONCLUSION

This Enterprise Backend Architecture blueprint defines the complete technical foundation for Firm OS. It ensures:

1. **Scalability**: Multi-tenant isolation, horizontal scaling ready
2. **Durability**: Complete audit trails, event sourcing for critical operations
3. **Security**: RBAC at every layer, encryption, compliance-ready
4. **Flexibility**: Provider-agnostic AI, pluggable notification channels
5. **Extensibility**: Event-driven design allows new modules without breaking existing ones

**Next Steps**:
1. **Approval**: Review with tech leads and product
2. **Database Design**: Finalize SQL schema based on this model
3. **API Specification**: Generate OpenAPI/Swagger docs
4. **Infrastructure**: Set up CI/CD, monitoring, databases
5. **Phase 1 Development**: Begin AUTH and FIRM CORE modules

---

**Document Version**: 1.0  
**Last Updated**: [Date]  
**Maintained By**: [Architecture Team]  
**Status**: DRAFT — Ready for Review

