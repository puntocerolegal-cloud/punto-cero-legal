# PERSISTENCE AUDIT REPORT
## Complete Technical Assessment of Firm OS

**Date:** SPRINT 6 - Enterprise Production Readiness
**Status:** AUDIT COMPLETE - NO CODE CHANGES
**Scope:** Every page, every hook, every persistence mechanism

---

## EXECUTIVE SUMMARY

### Current State
- **Lawyer OS (user features):** 70% backend-persistent, 20% localStorage, 10% fake
- **Firm OS (enterprise):** 30% backend-persistent, 50% localStorage, 20% fake/read-only
- **Critical Risk:** 9 core enterprise features are localStorage-only (not shared, lost on device switch)
- **Trust Risk:** Settings page has ZERO persistence (fake save)
- **Usability Risk:** 15+ UI actions are alerts or disabled buttons

### Business Impact
**CANNOT SHIP AS-IS:** Enterprise customers will lose data and hit dead-end workflows.

**Required Fixes Before Sale:**
1. SettingsPage persistence (CRITICAL)
2. Enterprise orchestration state backend (Workflows, Scheduler, Automation, etc.)
3. Replace placeholder actions with real workflows
4. Complete incomplete CRUD flows

---

## PART 1: PERSISTENCE MATRIX

### Lawyer OS (User-Facing Features)

| Feature | Persistence | C | R | U | D | Method/Endpoint | Risk |
|---------|-------------|---|---|---|---|---|---|
| **Dashboard Home** | Backend | ✗ | ✓ | ✗ | ✗ | `GET /dashboard/*`, `GET /integration/*`, `GET /payment/my-plan` | Backend outage = no data |
| **Cases** | Backend | ✓ | ✓ | ✓ | ✓ | `GET/POST/PATCH/DELETE /cases`, `POST /cases/{id}/accept` | Safe |
| **Clients** | Backend | ✓ | ✓ | ✗ UI | ✓ | `GET/POST /clients`, `DELETE /clients/{id}` | No edit UI |
| **Agenda** | Backend | ✓ | ✓ | ✗ | ✗ | `GET/POST /appointments` | No edit/delete |
| **AI** | Mixed | ✓ Chat | ✓ | ✗ | ✗ | `GET /ai/usage`, `POST /ai/chat` | Chat lost on refresh |
| **Meetings** | Backend | ✓ | ✓ | ✗ | ✗ | `GET/POST /meetings` | No manage workflow |
| **Invoices** | Backend | ✓ | ✓ | ✓ | ✓ | `GET/POST/PATCH/DELETE /invoices`, `POST /invoices/{id}/mark-paid` | Safe |
| **Documents** | Backend + sessionStorage | ✓ | ✓ | ✓ | ✓ | `GET/POST/PATCH /documents`, session key `pcl_zk_pass` | Passphrase lost on tab close |
| **Settings** | ❌ NONE | ✗ | ✗ | ✗ | ✗ | `handleSave()` → fake toast only | ALL changes lost |

### Firm OS (Enterprise Features)

| Feature | Persistence | C | R | U | D | Method/Key | Risk |
|---------|-------------|---|---|---|---|---|---|
| **Dashboard** | Mixed | ✗ | ✓ | ✗ | ✗ | `useFirmCoreData()`, localStorage hooks | Partial state |
| **Cases** | Backend (read-only) | ✗ | ✓ | ✗ | ✗ | `GET /firms/{firmId}/cases` | No CRUD from UI |
| **Lawyers** | Backend + alerts | ✗ | ✓ | ✓ | ✗ | `GET /rbac/team`, `PATCH /rbac/users`, 5x alert() placeholders | Fake actions |
| **Team** | Backend | ✗ | ✓ | ✓ | ✗ | `GET /rbac/team`, `PATCH /rbac/users`, `POST /rbac/assign-role` | No delete |
| **Offices** | Backend fallback | ✗ | ✓ | ✗ | ✗ | `GET /firms/{firmId}/offices` | No CRUD, buttons without handlers |
| **Departments** | Backend fallback | ✗ | ✓ | ✗ | ✗ | `GET /firms/{firmId}/departments` | No CRUD, buttons without handlers |
| **Automation** | localStorage | ✓ | ✓ | ✓ | ✓ | key `firm-os/automation` | Lost on clear/device switch |
| **Workflows** | localStorage | ✓ | ✓ | ✓ | ✓ | key `firm-os/workflows`, `firm-os/workflow-executions` | Lost on clear/device switch |
| **Workflow Builder** | localStorage | ✓ | ✓ | ✓ | ✓ | key `firm-os/workflow-builder` | Lost on clear/device switch |
| **Scheduler** | localStorage (incomplete) | ⚠️ | ✓ | ✓ | ✓ | key `firm-os/scheduler` | Create UI missing; lost on clear |
| **Intelligence** | Computed | ✗ | ✓ | ✗ | ✗ | `useAIDecision()` (no persistence) | No history |
| **Mission Control** | Derived | ✗ | ✓ | ✗ | ✗ | Composes localStorage hooks | Upstream localStorage risk |
| **Autonomous Ops** | localStorage | ✓ | ✓ | ✓ | ✓ | key `firm-os/autonomous-engine` | Lost on clear/device switch |
| **Governance** | localStorage | ✓ | ✓ | ✓ | ✓ | key `firm-os/governance` | Lost on clear/device switch |
| **Expedientes** | Derived | ✗ | ✓ | ✗ | ✗ | `useExpedientes()` (read-only) | No persistence |

**Legend:** C=Create, R=Read, U=Update, D=Delete, ✓=Works, ✗=Missing, ⚠️=Incomplete, ❌=Broken

---

## PART 2: EXISTING ENDPOINTS

### Lawyer OS Endpoints (In Use)
```
Authentication:
  GET/POST /auth/login
  GET /auth/me
  POST /auth/logout
  POST /auth/register
  POST /auth/password-reset

Dashboard:
  GET /dashboard/notifications/{userId}
  GET /dashboard/kpis/{userId}
  GET /dashboard/alerts/{userId}
  GET /integration/expedientes?lawyer_id={userId}
  GET /integration/expediente/{expedienteId}
  GET /payment/my-plan
  GET /referrals/my-code
  GET /referrals/notifications

Cases:
  GET /cases?lawyer_id={userId}
  POST /cases
  PATCH /cases/{caseId}
  DELETE /cases/{caseId}
  POST /cases/{caseId}/accept
  POST /cases/{caseId}/decline
  GET /cases/{caseId}/timeline
  POST /cases/{caseId}/send-timeline

Clients:
  GET /clients?lawyer_id={userId}
  POST /clients
  DELETE /clients/{id}

Appointments:
  GET /appointments?lawyer_id={userId}
  POST /appointments

AI:
  GET /ai/usage/{userId}
  POST /ai/chat
  POST /ai/upgrade (implicit)

Meetings:
  GET /meetings?host_id={userId}
  POST /meetings

Invoices:
  GET /invoices?lawyer_id={userId}
  POST /invoices
  POST /invoices/{invoiceId}/pay-link
  POST /invoices/{invoiceId}/mark-paid
  POST /invoices/{invoiceId}/attach-payment
  PATCH /invoices/{invoiceId}
  DELETE /invoices/{invoiceId}

Documents:
  GET /documents?lawyer_id={userId}
  GET /documents/folders/{userId}
  GET /integration/storage/{userId}
  POST /documents/upload
  GET /documents/{documentId}/content
  PATCH /documents/{documentId}
  DELETE /documents/{documentId}
  POST /integration/storage/backup-email
  GET /backup/manual

Settings:
  (NO ENDPOINTS — all fake)
```

### Firm OS Endpoints (In Use)
```
Core Data:
  GET /firms/{firmId}/lawyers
  GET /firms/{firmId}/cases
  GET /firms/{firmId}/clients
  GET /firms/{firmId}/departments (optional, may 404)
  GET /firms/{firmId}/offices (optional, may 404)

Team/RBAC:
  GET /rbac/team/{firmId}
  GET /firm-config/{firmId}/practice-areas
  POST /firm-os/invite-lawyer
  PATCH /rbac/users/{userId}/status
  POST /rbac/users/{userId}/assign-role
  PATCH /firms/{firmId}/team/{memberId}

All Others:
  (NO ENDPOINTS — localStorage or computed)
```

---

## PART 3: MISSING ENDPOINTS (Critical Gaps)

### P0 — Required for Enterprise Sale

#### Settings Persistence (SettingsPage)
```
MISSING:
  PATCH /auth/me/profile (full_name, phone, specialty, bar_number, country)
  POST /auth/me/password (old_password, new_password)
  POST /auth/me/2fa/enable
  POST /auth/me/2fa/verify
  PATCH /user/preferences (notification_flags, timezone, language, etc.)
  PATCH /firms/{firmId}/profile (name, logo, address, etc.)
  GET /user/integrations
  POST /user/integrations/{provider}/connect
  DELETE /user/integrations/{provider}/disconnect
```

#### Workflow Persistence (Workflow Center + Builder)
```
MISSING:
  POST /firms/{firmId}/workflows (create)
  GET /firms/{firmId}/workflows (list)
  GET /firms/{firmId}/workflows/{workflowId} (detail)
  PATCH /firms/{firmId}/workflows/{workflowId} (update)
  DELETE /firms/{firmId}/workflows/{workflowId}
  POST /firms/{firmId}/workflows/{workflowId}/execute (trigger)
  GET /firms/{firmId}/workflows/{workflowId}/executions (history)
  GET /firms/{firmId}/workflow-builder/graph (save/load graph)
```

#### Scheduler Persistence (Scheduler Page)
```
MISSING:
  POST /firms/{firmId}/schedules (create)
  GET /firms/{firmId}/schedules (list)
  GET /firms/{firmId}/schedules/{scheduleId} (detail)
  PATCH /firms/{firmId}/schedules/{scheduleId} (update)
  DELETE /firms/{firmId}/schedules/{scheduleId}
  POST /firms/{firmId}/schedules/{scheduleId}/execute
  GET /firms/{firmId}/schedules/{scheduleId}/executions (history)
```

#### Automation Persistence (Automation Center)
```
MISSING:
  POST /firms/{firmId}/automation/rules (create)
  GET /firms/{firmId}/automation/rules (list)
  PATCH /firms/{firmId}/automation/rules/{ruleId}
  DELETE /firms/{firmId}/automation/rules/{ruleId}
  GET /firms/{firmId}/automation/history (execution log)
  POST /firms/{firmId}/automation/rules/{ruleId}/trigger
```

#### Governance Persistence (Governance Page)
```
MISSING:
  POST /firms/{firmId}/governance/policies
  GET /firms/{firmId}/governance/policies
  PATCH /firms/{firmId}/governance/policies/{policyId}
  DELETE /firms/{firmId}/governance/policies/{policyId}
  GET /firms/{firmId}/governance/audit-trail
  POST /firms/{firmId}/governance/audit (manual entry)
```

#### Autonomous Operations Persistence (Autonomous Ops Page)
```
MISSING:
  GET /firms/{firmId}/autonomous/mode (current mode)
  PATCH /firms/{firmId}/autonomous/mode (change mode)
  POST /firms/{firmId}/autonomous/decisions (log decision)
  GET /firms/{firmId}/autonomous/decisions (history)
  POST /firms/{firmId}/autonomous/approvals (approve/reject)
  GET /firms/{firmId}/autonomous/approvals (pending)
```

### P1 — High Priority

#### Notifications Persistence
```
MISSING:
  GET /firms/{firmId}/notifications (all)
  POST /firms/{firmId}/notifications/{notificationId}/read
  DELETE /firms/{firmId}/notifications/{notificationId}
  GET /user/notification-settings
  PATCH /user/notification-settings
```

#### AI Session Persistence
```
MISSING:
  POST /ai/sessions (create conversation)
  GET /ai/sessions (list)
  GET /ai/sessions/{sessionId}/messages
  POST /ai/sessions/{sessionId}/message
  DELETE /ai/sessions/{sessionId}
```

#### Firm Admin CRUD (Offices, Departments)
```
MISSING:
  POST /firms/{firmId}/offices (create)
  PATCH /firms/{firmId}/offices/{officeId}
  DELETE /firms/{firmId}/offices/{officeId}
  POST /firms/{firmId}/departments (create)
  PATCH /firms/{firmId}/departments/{deptId}
  DELETE /firms/{firmId}/departments/{deptId}
```

#### Meeting Management
```
MISSING:
  PATCH /meetings/{meetingId} (reschedule, update)
  DELETE /meetings/{meetingId} (cancel)
  POST /meetings/{meetingId}/participants (manage)
```

#### Case Management (from Firm OS)
```
MISSING:
  POST /firms/{firmId}/cases (create)
  PATCH /firms/{firmId}/cases/{caseId}
  DELETE /firms/{firmId}/cases/{caseId}
```

---

## PART 4: FAKE ACTIONS / PLACEHOLDERS (All locations)

### Critical (Should not be in shipping code)
- **SettingsPage.jsx:57-59** → `handleSave()` is fake (2-second toast only)
- **FirmLawyers.jsx** → 6 alert() placeholders:
  - `handleViewAgenda()` → alert
  - `handleAssignCase()` → alert
  - `handleSendMessage()` → alert
  - `handleViewDocuments()` → alert
  - `handleViewHistory()` → alert
  - Preferences change → no-op

### High Priority (Dead features)
- **SchedulerPage.jsx** → "Create new" state exists but no modal rendered; edit is TODO
- **WorkflowBuilderPage.jsx** → Save button has no onClick; import throws alert
- **FirmCases.jsx** → "Nuevo Caso" button is disabled with title "Funcionalidad en desarrollo"
- **AssignmentsPage.jsx** → `handleAssignCase()` is alert only
- **FirmDashboard.jsx** → "Administrar Equipo" CTA has no handler
- **OfficesPage.jsx** / **DepartmentsPage.jsx** → "Ver detalles" and "Editar" buttons have no onClick
- **Offices/Departments edit buttons** → Properties panel not connected

### Medium (Incomplete workflows)
- **ClientsPage.jsx** → No edit client flow (button not visible but API exists)
- **AgendaPage.jsx** → No edit/delete event UI
- **MeetingsPage.jsx** → No update/cancel/rejoin workflows
- **CasesPage.jsx** → Generic alert errors instead of specific feedback
- **InvoicesPage.jsx** → Multiple alert() error messages instead of inline feedback
- **DocumentsPage.jsx** → Multiple alert() error messages

---

## PART 5: LOCALSTORAGE DEPENDENCIES

### Critical Keys (Enterprise Features)
```
firm-os/workflows                 → Workflows Center
firm-os/workflow-executions       → Workflow execution history
firm-os/workflow-builder          → Workflow Builder graph/state
firm-os/scheduler                 → Scheduler schedules + executions
firm-os/automation                → Automation rules + history
firm-os/notifications             → Notification state
firm-os/governance                → Governance policies + audit
firm-os/autonomous-engine         → Autonomous mode + decisions + approvals
firm-os/preferences/*             → User preferences per firm
```

### Session/Auth Keys
```
pcl_token, token                  → Auth session (lost on logout)
pcl_user, user                    → Logged-in user (lost on logout)
pcl_active_expediente             → Selected case context (browser-bound)
pcl_session_id                    → Session ID (lost on browser close)
pcl_zk_pass                       → Document decryption (sessionStorage, lost on tab close)
```

### UI State Keys
```
firm-lawyers-search               → Search query (browser-bound)
firm-lawyers-filters              → Filter state (browser-bound)
firm-offices-search, firm-offices-filters
firm-departments-search, firm-departments-filters
pcl_ai_upgrade_dismissed_until    → Banner dismiss (browser-bound)
pcl_trial_agreement               → Accept legal (lost on clear)
```

### Risk Summary
- **9 core enterprise features** entirely depend on localStorage
- **Lost on:** browser clear, device switch, cache purge, incognito mode, app uninstall+reinstall
- **Not shared:** between team members, across devices, not backed up
- **No recovery:** no version history, no conflict resolution, no sync

---

## PART 6: DATA LOSS RISK MATRIX

### Refresh / Navigation
| Scenario | Lawyer OS | Firm OS localStorage | Firm OS backend | Impact |
|----------|-----------|-------|---|---|
| Page refresh | Safe (backend) | Safe (persisted) | Safe (backend) | Low |
| Tab close | Safe (backend) | Safe (persisted) | Safe (backend) | Low |
| Browser crash | Safe (backend) | Safe (persisted) | Safe (backend) | Low |
| Unsaved Settings changes | LOST | N/A | N/A | HIGH |
| Unsaved AI chat | LOST | N/A | N/A | MEDIUM |

### Device / Browser Switch
| Scenario | Lawyer OS | Firm OS localStorage | Firm OS backend | Impact |
|----------|-----------|-------|---|---|
| Switch browser | Safe | LOST | Safe | HIGH |
| Switch device | Safe | LOST | Safe | HIGH |
| Incognito mode | Safe (if logged in) | LOST | Safe | HIGH |
| Private browsing | Safe (if logged in) | LOST | Safe | HIGH |
| New device onboarding | Safe | LOST | Safe | HIGH |

### Storage Clearing
| Scenario | Lawyer OS | Firm OS localStorage | Firm OS backend | Impact |
|----------|-----------|-------|---|---|
| Clear cache | Safe | LOST | Safe | HIGH |
| Clear cookies | Safe (if token in sessionStorage) | LOST | Safe | HIGH |
| Clear site data | LOST (if logged out) | LOST | Safe (need login) | CRITICAL |
| Browser update | Safe (usually preserves) | LOST (if browser wipes) | Safe | HIGH |
| Cache management app | Safe | LOST | Safe | HIGH |

### Offline Scenario
| Feature | Offline status | Risk |
|---------|---|---|
| Workflows | Stale local view available | Can't sync when online |
| Scheduler | Stale local view available | Can't sync when online |
| Automation | Stale local view available | Can't sync when online |
| Backend features | NO data | Need backend |

---

## PART 7: BUSINESS IMPACT RANKING

### P0 — CRITICAL (Prevent enterprise sale)
1. **SettingsPage has ZERO persistence** — Users change settings, reload, lose everything. Trust breaker.
2. **Workflow, Scheduler, Automation, Governance, Autonomous are localStorage-only** — Not shareable between team. Lost on device switch. Not enterprise-grade.
3. **FirmCases is read-only** — Admin can't create/manage cases from UI.
4. **FirmLawyers is 50% fake actions** — Clicking "View Agenda" / "Assign Case" shows alerts instead of workflows.
5. **SchedulerPage create flow is incomplete** — Modal state exists but no UI rendered.

### P1 — HIGH (Must fix for demo)
6. **AI chat has no conversation history persistence** — Fine for demo, weak for daily use.
7. **Meetings lack update/cancel workflows** — Operationally incomplete.
8. **Clients/Agenda lack edit flows** — Can create but not manage.
9. **Offices/Departments are read-only with fake buttons** — Can't administer organizational structure from UI.
10. **Multiple alert() error messages** — Looks unprofessional.
11. **Document recovery has no UI** — Passphrase lost = unrecoverable data.

### P2 — MEDIUM (Polish)
12. **Dashboard/FirmDashboard have orphaned buttons** — No handler, reduces trust.
13. **AI upgrade links distract from settings** — Move out of core settings.
14. **Search/filter state browser-bound** — Not critical but odd for enterprise.
15. **No audit trail for governance changes** — Compliance gap.

---

## PART 8: DEPENDENCY MAP

### Frontend → Backend
```
Lawyer OS pages:
  ✓ DashboardHome → multiple endpoints (safe)
  ✓ Cases → case CRUD endpoints (safe)
  ✓ Clients → client CRUD endpoints (safe if edit UI existed)
  ✓ Agenda → appointment endpoints (safe)
  ⚠️ AI → chat endpoint + usage (chat not persisted)
  ✓ Meetings → meeting endpoints (safe)
  ✓ Invoices → invoice endpoints (safe)
  ✓ Documents → document endpoints + sessionStorage passphrase (passphrase recovery missing)
  ❌ Settings → NO endpoints

Firm OS pages:
  ✓ FirmDashboard → useFirmCoreData (safe read-only)
  ✓ FirmCases → GET /firms/{firmId}/cases (safe read-only)
  ⚠️ FirmLawyers → team endpoint + placeholder actions (partial)
  ✓ FirmTeam → team management endpoints (mostly safe, no delete)
  ⚠️ Offices → GET /firms/{firmId}/offices or fallback (buttons have no handlers)
  ⚠️ Departments → GET /firms/{firmId}/departments or fallback (buttons have no handlers)
  ❌ Automation → NO endpoint (localStorage only)
  ❌ Workflows → NO endpoint (localStorage only)
  ❌ WorkflowBuilder → NO endpoint (localStorage only)
  ❌ Scheduler → NO endpoint (localStorage only)
  ❌ Governance → NO endpoint (localStorage only)
  ❌ AutonomousOps → NO endpoint (localStorage only)
  ⚠️ Intelligence → NO persistence (computed only)
  ❌ MissionControl → depends on localStorage hooks above
  ⚠️ Expedientes → computed/derived (read-only)
```

### Backend Outage Impact
```
UNUSABLE:
  - Dashboard
  - Cases
  - Clients
  - Agenda
  - AI
  - Meetings
  - Invoices
  - Documents
  - FirmCases
  - FirmLawyers
  - FirmTeam
  - Offices
  - Departments

PARTIALLY AVAILABLE (stale local data):
  - Workflows (cached version only)
  - Scheduler (cached version only)
  - Automation (cached version only)
  - Governance (cached version only)
  - Autonomous Ops (cached version only)
```

---

## PART 9: CORRECTION SCOPE (Backend vs Frontend Only)

### Requires Backend Development
1. **SettingsPage endpoints** (5-6 new endpoints)
2. **Workflow persistence endpoints** (6 new endpoints)
3. **Scheduler persistence endpoints** (6 new endpoints)
4. **Automation persistence endpoints** (4 new endpoints)
5. **Governance persistence endpoints** (5 new endpoints)
6. **Autonomous persistence endpoints** (4 new endpoints)
7. **Notifications endpoints** (4 new endpoints)
8. **AI session endpoints** (4 new endpoints)
9. **Firm admin CRUD endpoints** (offices, departments, cases) (6 new endpoints)
10. **Meeting management endpoints** (3 new endpoints)
11. **Document recovery endpoints** (1-2 new endpoints)

**Total:** ~50 new endpoints needed

### Frontend Only (No Backend)
1. Remove Settings fake save, add form state validation (but no backend to call)
2. Remove alert() placeholders, hide unimplemented buttons
3. Complete SchedulerPage create/edit UI (but no backend to call)
4. Add error handling / success feedback patterns
5. Add loading states
6. Fix responsive design
7. Unify language (Spanish)
8. Fix accessibility

---

## SUMMARY TABLE: WHAT NEEDS TO BE DONE

| Issue | Backend Work | Frontend Work | Priority | Business Impact |
|-------|---|---|---|---|
| Settings persistence | ✓ 5-6 endpoints | Form state + validation | P0 | CRITICAL |
| Workflow persistence | ✓ 6 endpoints | Wire to API | P0 | CRITICAL |
| Scheduler persistence | ✓ 6 endpoints | Complete create UI, wire to API | P0 | CRITICAL |
| Automation persistence | ✓ 4 endpoints | Wire to API | P0 | CRITICAL |
| Governance persistence | ✓ 5 endpoints | Wire to API | P0 | CRITICAL |
| Autonomous persistence | ✓ 4 endpoints | Wire to API | P0 | CRITICAL |
| Remove fake actions | — | Replace alerts with real navigation | P1 | HIGH |
| SchedulerPage create flow | — | Render modal UI, validate form | P1 | HIGH |
| FirmCases CRUD | ✓ 3 endpoints | Add create/edit UI | P1 | HIGH |
| Document recovery | ✓ 1-2 endpoints | Add recovery UI | P1 | HIGH |
| AI chat persistence | ✓ 4 endpoints | Wire to API | P1 | HIGH |
| Meeting management | ✓ 3 endpoints | Add update/cancel UI | P1 | HIGH |
| Offices/Departments CRUD | ✓ 6 endpoints | Add buttons handlers | P2 | MEDIUM |
| Error handling patterns | — | Inline feedback, remove alerts | P2 | MEDIUM |
| Loading states | — | Add skeletons | P2 | MEDIUM |
| Language unification | — | Translate all English labels | P2 | MEDIUM |

---

## CONCLUSION

### Cannot Ship Without Fixing P0
Enterprise customers will experience:
- Data loss (Settings)
- No cross-device sync (Workflows, Scheduler, etc.)
- Dead UI (5+ pages with fake/disabled actions)
- Incomplete workflows (Scheduler, Assignments, etc.)

### Backend Prerequisite
Approximately **50 new API endpoints** needed to persist enterprise state server-side.
Frontend can implement UI but cannot save data without backend support.

### Phased Approach Recommendation
**Phase 1 (Frontend only):** Remove fake/broken actions, complete UI flows (but data won't persist)
**Phase 2 (Backend):** Implement P0 endpoint groups (Settings, Workflows, Scheduler, etc.)
**Phase 3 (Sync):** Wire frontend to backend endpoints
**Phase 4 (Polish):** Error handling, loading states, accessibility

---

**This audit is complete. Ready for approval to begin fixes.**

