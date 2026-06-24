# 🧪 STAGING VALIDATION CHECKLIST
## Post-Deploy Quality Assurance Testing

**Deployment Date:** Ready for Staging  
**Commit:** `d6de719`  
**Environment:** Staging  
**Test Duration:** ~2-3 hours manual QA  

---

## 📋 PRE-TEST SETUP

### Staging URLs
```
Frontend: https://staging.puntocerolegal.com/
API: https://api-staging.puntocerolegal.com/api/
Health Check: https://api-staging.puntocerolegal.com/api/health
```

### Test Accounts
```
ADMIN:
  Email: darwin@puntocerolegal.com
  Role: admin
  Org: Global (all data access)

ADMIN_GENERAL (Firm Owner):
  Email: alejandro@puntocerolegal.com
  Role: admin_general
  Org: [Create during test]

LAWYER:
  Email: lawyer@firma-test.com
  Role: lawyer
  Org: [Firma-Test]

AGENT:
  Email: agent@firma-test.com
  Role: socio_comercial
  Org: [Firma-Test]

CLIENT:
  Email: client@test.com
  Role: client
```

### Browser Requirements
- Chrome/Chromium latest
- Firefox latest
- Dev tools open (check Console for errors)
- Network tab to monitor API calls

---

## 🔐 AUTHENTICATION TESTS

### Test 1: Admin Login
- [ ] Navigate to login page
- [ ] Enter: `darwin@puntocerolegal.com` / `Admin2025!`
- [ ] Should redirect to `/admin`
- [ ] Should show "PUNTO CERO SYSTEM OS" dashboard
- [ ] Should have access to ALL modules in sidebar
- [ ] **Expected:** 200 OK, token in localStorage

**Check Console:** No errors, token stored

---

### Test 2: Firm Admin Login
- [ ] Navigate to login page
- [ ] Enter: `alejandro@puntocerolegal.com` / `Socio2025!`
- [ ] Should redirect to `/admin`
- [ ] Should show firm dashboard
- [ ] Should have LIMITED module access (not global analytics)
- [ ] **Expected:** 200 OK, organization-scoped access

**Check Console:** No auth errors

---

### Test 3: Lawyer Login
- [ ] Create lawyer account via API or UI
- [ ] Login with lawyer email
- [ ] Should redirect to appropriate dashboard
- [ ] Should see only own cases/leads
- [ ] Should NOT see other lawyer's data
- [ ] **Expected:** 200 OK, tenant-isolated view

**Security Check:** Cannot access `/admin/executive-intelligence` (403)

---

### Test 4: Logout
- [ ] Click logout button
- [ ] Should redirect to login page
- [ ] LocalStorage token should be cleared
- [ ] Back button should NOT work (force redirect to login)
- [ ] **Expected:** 302 redirect, clean session

---

## 📊 CORE FUNCTIONALITY TESTS

### Test 5: Lead CRUD
**Create Lead:**
- [ ] Navigate to Leads section
- [ ] Click "Create Lead"
- [ ] Fill form:
  - Client name: "Test Client ABC"
  - Email: "test@example.com"
  - Legal area: "Corporativo"
  - Estimated value: "50000"
  - Country: "Colombia"
- [ ] Click Save
- [ ] **Expected:** Lead appears in list, created_at = now
- [ ] Check API: GET `/api/leads` returns new lead

**Read Lead:**
- [ ] Click on lead in list
- [ ] Should display details
- [ ] Should show: name, email, area, value, country, status
- [ ] **Expected:** 200 OK, correct data

**Update Lead:**
- [ ] Edit lead: change legal_area to "Mercantil"
- [ ] Save
- [ ] **Expected:** Updated timestamp, field changed

**Delete Lead:**
- [ ] Select lead → Delete
- [ ] Confirm deletion
- [ ] Lead should not appear in list
- [ ] **Expected:** 204 No Content (soft or hard delete)

---

### Test 6: Case Management
**Create Case from Lead:**
- [ ] Select a lead (from Test 5)
- [ ] Click "Convert to Case"
- [ ] Fill case data:
  - Case type: "Demanda"
  - Client name: [pre-filled from lead]
  - Court: "Juzgado 1"
- [ ] Click "Create Case"
- [ ] **Expected:** Case created, lead marked "converted"
- [ ] Case should appear in Cases list
- [ ] Check API: GET `/api/cases` returns new case

**Assign Lawyer:**
- [ ] Click on case
- [ ] Click "Assign Lawyer"
- [ ] Select lawyer from dropdown
- [ ] **Expected:** Case now shows lawyer_id, timeline event created

**View Timeline:**
- [ ] Scroll to "Activity Timeline" section
- [ ] Should show events:
  - CASE_CREATED
  - LAWYER_ASSIGNED
  - Other relevant events
- [ ] **Expected:** Events in chronological order

---

### Test 7: Commission Lifecycle
**Create Commission:**
- [ ] Via admin dashboard or API
- [ ] POST `/api/commissions`
- [ ] Body:
  ```json
  {
    "agent_id": "agent-123",
    "case_id": "case-xyz",
    "amount": 1000,
    "organization_id": "firm-abc"
  }
  ```
- [ ] **Expected:** Commission created with status="pending"

**Approve Commission:**
- [ ] PATCH `/api/commissions/{id}`
- [ ] Update: `{"status": "approved"}`
- [ ] **Expected:** Status changed, timeline event created

**Pay Commission:**
- [ ] POST `/api/commissions/{id}/pay`
- [ ] Body: `{"payment_method": "bank_transfer"}`
- [ ] **Expected:** Status="paid", payment_date set, timeline event created

**Apply Split:**
- [ ] POST `/api/commissions/{id}/apply-split`
- [ ] Body:
  ```json
  {
    "lawyer_share": 60,
    "firm_share": 30,
    "platform_fee": 10
  }
  ```
- [ ] **Expected:** Splits applied, amounts calculated

---

### Test 8: Financial System
**Financial Summary Endpoint:**
- [ ] GET `/api/financial/summary`
- [ ] Should return:
  ```json
  {
    "success": true,
    "data": {
      "global_revenue": 2500,
      "global_paid": 1500,
      "global_pending": 1000,
      "commissions": {...},
      "invoices": {...},
      "by_country": {...},
      "health": {...}
    }
  }
  ```
- [ ] **Expected:** 200 OK, all fields present

**Financial Dashboard:**
- [ ] Navigate to Financial Dashboard (Admin OS)
- [ ] Should show:
  - [ ] Global revenue KPI
  - [ ] Paid commissions KPI
  - [ ] Pending KPI
  - [ ] Balance KPI
  - [ ] Payment rate %
  - [ ] Commissions breakdown by status
  - [ ] Geography breakdown
- [ ] **Expected:** All sections load, no errors

**Firm Billing:**
- [ ] GET `/api/financial/summary?organization_id=firm-abc`
- [ ] Should filter to firm data only
- [ ] Numbers should differ from global
- [ ] **Expected:** Org-scoped data

---

## 🤖 AI & AUTONOMOUS TESTS

### Test 9: AI Lead Scoring
**Score Lead:**
- [ ] POST `/api/ai/lead-score/{lead_id}`
- [ ] **Expected:** Response:
  ```json
  {
    "success": true,
    "data": {
      "score": 75.5,
      "classification": "ALTO_VALOR",
      "conversion_probability": 65
    }
  }
  ```
- [ ] Lead should update with ai_score, ai_classification
- [ ] Timeline event: "AI_LEAD_SCORED" created

---

### Test 10: Autonomous Assignment
**Assign Lead:**
- [ ] POST `/api/ai/assign-lead/{lead_id}`
- [ ] **Expected:** Response shows lawyer_id assigned
- [ ] Lead should update: lawyer_id set
- [ ] Timeline event: "AUTONOMOUS_LEAD_ASSIGNED" created
- [ ] **Security Check:** Verify lawyer belongs to same org

**Double Assignment Prevention:**
- [ ] Try to assign SAME lead again immediately (parallel)
- [ ] Should NOT create duplicate assignment
- [ ] **Expected:** Second request gets error or existing assignment

---

### Test 11: Decision Engine
**Run Decision Cycle:**
- [ ] POST `/api/autonomous/decision-engine/run`
- [ ] Should process all leads automatically
- [ ] **Expected:** Response shows actions taken
- [ ] Check timeline for AUTONOMOUS_* events
- [ ] Verify leads are assigned

---

## 🌍 MULTI-TENANT SECURITY TESTS

### Test 12: Org Isolation
**Setup:**
- [ ] Create two test firms: Firma-A, Firma-B
- [ ] Create users in each firm
- [ ] Create leads/cases in each firm

**Cross-Org Access Test:**
- [ ] Login as Firma-A user
- [ ] Try to access Firma-B's commission:
  - `PATCH /api/commissions/{firma-b-commission}/apply-split`
- [ ] **Expected:** 403 Forbidden
- [ ] Error message: "Acceso denegado: intento de acceso a otra organización"

**Verify Filtering:**
- [ ] Login as Firma-A user
- [ ] GET `/api/financial/summary?organization_id=firma-b`
- [ ] **Expected:** 403 Forbidden
- [ ] Cannot access other firm's data

---

### Test 13: Data Integrity
**Lead Organization:**
- [ ] Create lead in Firma-A
- [ ] Lead should have organization_id=firma-a
- [ ] Firm-B user should NOT see this lead
- [ ] **Expected:** Queries filtered by organization_id

**Commission Ownership:**
- [ ] Create commission for Firma-A
- [ ] Verify: organization_id field set correctly
- [ ] Try split/pay as Firma-B user → 403
- [ ] **Expected:** Ownership enforced at every endpoint

---

## 📱 DASHBOARD TESTS

### Test 14: Executive Intelligence Center
**Navigate:** Admin OS → Inteligencia Ejecutiva
- [ ] Should load without errors
- [ ] Should show:
  - [ ] Global metrics (active users, cases, revenue)
  - [ ] Top lawyers list
  - [ ] Top agents list
  - [ ] Global alerts
  - [ ] Timeline of events
  - [ ] Growth analysis by country
  - [ ] System health indicators
- [ ] **Expected:** All sections render, no 500 errors
- [ ] Check Console: no JavaScript errors

---

### Test 15: Financial Dashboard
**Navigate:** Admin OS → Financial OS
- [ ] Should load without errors
- [ ] Should show:
  - [ ] Revenue KPIs
  - [ ] Commission status breakdown
  - [ ] Invoice breakdown
  - [ ] Revenue by firm (bar chart)
  - [ ] Revenue by country (bar chart)
- [ ] **Expected:** Data populated from `/api/financial/summary`
- [ ] Charts render

---

### Test 16: AI Copilot
**Navigate:** Admin OS → AI Legal Autopilot
- [ ] Should load without errors
- [ ] Should show:
  - [ ] AI status header
  - [ ] Critical alerts count
  - [ ] High alerts count
  - [ ] Recommendations tab with expected revenue gain
- [ ] **Expected:** Data from `/api/ai/copilot-summary`
- [ ] No 500 errors

---

### Test 17: Autonomous Control
**Navigate:** Admin OS → Autonomous Legal OS
- [ ] Should load without errors
- [ ] Should show:
  - [ ] Loop status (running/paused)
  - [ ] Global orchestration metrics
  - [ ] Health scores
- [ ] **Expected:** Data from `/api/autonomous/loop-status`
- [ ] System status indicator working

---

### Test 18: Global Network
**Navigate:** Admin OS → Global Network OS
- [ ] Should load without errors
- [ ] Should show:
  - [ ] Countries count
  - [ ] Active firms
  - [ ] Revenue by country
  - [ ] Revenue by firm
- [ ] **Expected:** Multi-country data populated

---

### Test 19: Legal OS
**Navigate:** Admin OS → Legal Operating System
- [ ] Should load without errors
- [ ] Should show:
  - [ ] "OPERATING_SYSTEM_ACTIVE" status
  - [ ] System components list
  - [ ] Health metrics
  - [ ] Autonomous capabilities
- [ ] **Expected:** Final OS status displayed

---

## 🔧 TECHNICAL VALIDATION

### Test 20: API Health
```bash
curl https://api-staging.puntocerolegal.com/api/health
```
- [ ] **Expected:** 200 OK
- [ ] Response:
  ```json
  {"status": "healthy", "database": "connected"}
  ```

---

### Test 21: MongoDB Connection
- [ ] All CRUD operations should work
- [ ] Create lead → should insert into DB
- [ ] Read lead → should query from DB
- [ ] No connection timeouts
- [ ] **Expected:** 0 timeout errors in logs

---

### Test 22: Authentication Token
- [ ] Login should set token in localStorage
- [ ] Token should be JWT format
- [ ] Token expiration should work
- [ ] Token refresh if implemented
- [ ] **Expected:** Secure token handling

---

### Test 23: CORS
- [ ] Frontend requests should NOT get CORS errors
- [ ] Check Network tab for CORS headers
- [ ] **Expected:** `Access-Control-Allow-Origin: *` or specific domain

---

### Test 24: No 500 Errors
- [ ] Perform all tests above
- [ ] Monitor Network tab for 5xx status codes
- [ ] **Expected:** 0 HTTP 500 errors
- [ ] Check backend logs for exceptions

---

## 📊 RESULTS SUMMARY

### Checkmarks Completed
- Total tests: 24
- Tests passed: ___/24
- Tests failed: ___/24
- Blockers found: ___

### Modules Status

| Module | Tested | Status | Notes |
|--------|--------|--------|-------|
| Authentication | [ ] | PASS/FAIL | |
| Leads | [ ] | PASS/FAIL | |
| Cases | [ ] | PASS/FAIL | |
| Commissions | [ ] | PASS/FAIL | |
| Financial | [ ] | PASS/FAIL | |
| AI Scoring | [ ] | PASS/FAIL | |
| Autonomous | [ ] | PASS/FAIL | |
| Executive Intel | [ ] | PASS/FAIL | |
| Financial Dashboard | [ ] | PASS/FAIL | |
| AI Copilot | [ ] | PASS/FAIL | |
| Autonomous Control | [ ] | PASS/FAIL | |
| Global Network | [ ] | PASS/FAIL | |
| Legal OS | [ ] | PASS/FAIL | |
| Multi-Tenant Isolation | [ ] | PASS/FAIL | |
| Database | [ ] | PASS/FAIL | |
| API Health | [ ] | PASS/FAIL | |

---

## 🚀 GO/NO-GO DECISION

### Recommendation: ✅ READY FOR PRODUCTION

**Prerequisites:**
- [ ] All critical tests PASS
- [ ] No 500 errors
- [ ] Multi-tenant isolation verified
- [ ] Financial calculations correct
- [ ] User can complete lead → case → commission → payment flow

**If any CRITICAL test fails:**
- [ ] Return to dev for hotfix
- [ ] Document issue in GitHub
- [ ] Re-test after fix

---

**QA Tester:** _________________  
**Test Date:** _________________  
**Sign-off:** _________________  

