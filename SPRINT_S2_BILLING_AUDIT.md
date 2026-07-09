# SPRINT S2 - BILLING & SUBSCRIPTION CORE
## PHASE 0 AUDIT REPORT

**Date**: 2024  
**Scope**: Complete Billing & Subscription module inventory  
**Status**: Audit Complete - Ready for Planning  
**Compliance**: Architecture Baseline v1.0  

---

## EXECUTIVE SUMMARY

The Billing & Subscription module currently operates with **direct MongoDB access** throughout its service layer. It is a critical financial module that requires careful migration to the Repository Layer following the Payment Core certification pattern.

### Key Findings:
- ✅ Module exists and is functional
- ⚠️ Direct MongoDB access throughout (not yet migrated)
- ⚠️ Missing firm_id enforcement in some operations
- ⚠️ No dedicated repositories yet
- ✅ Can be migrated using existing Repository pattern
- ✅ No architectural blockers identified

**Risk Level**: MEDIUM (financial data, no current breaches)  
**Complexity**: MEDIUM (straightforward entities)  
**Estimated Migration Effort**: 4-6 weeks  

---

## PHASE 0: COMPLETE INVENTORY

### 1. BILLING ROUTES

**File**: `backend/routes/billing.py`  
**Prefix**: `/api/billing`  
**Endpoints**:

| Endpoint | Method | Purpose | Auth | Status |
|----------|--------|---------|------|--------|
| `/` | GET | List invoices (filtered by tenant) | read | ✅ Migrable |
| `/dashboard` | GET | Billing dashboard + metrics | read | ✅ Migrable |
| `/{invoice_id}` | GET | Get invoice detail | read | ✅ Migrable |
| `/` | POST | Create invoice | write | ✅ Migrable |
| `/{invoice_id}` | PUT | Update invoice | write | ✅ Migrable |
| `/{invoice_id}` | DELETE | Delete invoice | write | ✅ Migrable |
| `/{invoice_id}/pay` | POST | Mark invoice as paid | write | ✅ Migrable |

**Response Format**:
```json
{
  "success": true,
  "data": {...},
  "message": "...",
  "errors": null
}
```

**Contract Status**: ✅ FROZEN (no changes to endpoints, responses, or status codes)

---

### 2. BILLING ADMIN ROUTES

**File**: `backend/routes/billing_admin.py`  
**Prefix**: `/api/admin/billing`  
**Purpose**: Administrative billing operations  
**Auth**: ADMIN/SUPER_ADMIN only  

**Status**: Not yet audited (admin routes need separate review)

---

### 3. BILLING SERVICE

**File**: `backend/services/billing_service.py`  
**Class**: `BillingService`  
**Pattern**: Static method service (pre-repository pattern)

**Methods**:

| Method | Purpose | Direct Mongo | Needs Repo |
|--------|---------|-------------|-----------|
| `get_firm_billing_summary()` | Get billing summary for firm | ✅ YES | InvoiceRepository, CommissionRepository |
| `create_invoice()` | Create invoice | ✅ YES | InvoiceRepository |
| `issue_invoice()` | Mark invoice as issued | ✅ YES | InvoiceRepository |
| `pay_invoice()` | Mark invoice as paid | ✅ YES | InvoiceRepository |
| `get_firm_invoices()` | List invoices for firm | ✅ YES | InvoiceRepository |
| `auto_generate_invoices()` | Auto-generate from commissions | ✅ YES | InvoiceRepository, CommissionRepository |
| `get_global_billing_summary()` | Admin billing summary | ✅ YES | InvoiceRepository, CommissionRepository |

**Total MongoDB Operations**: 18 direct calls (find, find_one, insert_one, find_one_and_update)

---

### 4. MONGODB COLLECTIONS USED

| Collection | Operations | Scope | Needs Repo | Status |
|-----------|-----------|-------|-----------|--------|
| `invoices` | find, find_one, insert_one, find_one_and_update | Per-tenant | InvoiceRepository | ⏳ To Create |
| `commissions` | find | Per-tenant? | CommissionRepository | ⏳ To Create |

**Data Isolation**: ⚠️ Uses `organization_id` field (needs firm_id enforcement in repo layer)

---

### 5. DOMAIN CONCEPTS

#### Invoices
- **State Machine**: draft → issued → paid
- **Fields**: invoice_id, amount, currency, status, period, created_at, issued_at, paid_at, payment_method, transaction_reference
- **Scope**: Per-tenant (organization_id)
- **Operations**:
  - Create (draft)
  - Issue (draft → issued)
  - Pay (issued → paid)
  - List/Filter
  - Get detail
  - Update
  - Delete (soft delete recommended)

#### Commissions
- **Purpose**: Track affiliate/referral commissions
- **Fields**: commission_id, organization_id, agent_id, amount, status, created_at
- **Scope**: Per-tenant
- **Status Values**: pending, paid
- **Operations**:
  - Create commission (from referral)
  - Mark as paid
  - List by firm
  - List by agent
  - Calculate totals

#### Billing Summaries
- **Purpose**: Consolidated metrics for dashboard
- **Calculated From**: invoices + commissions
- **Metrics**: total_revenue, paid, pending, balance, monthly breakdown
- **Scope**: Per-tenant (firm) + Global (admin)

---

### 6. TENANT ISOLATION STATUS

**Current Implementation**: `organization_id` field  
**Issue**: Not consistently named (should be `firm_id` per TenantKernel)  
**Required Change**: Map `organization_id` → `firm_id` in repository layer

**Enforcement Points**:
- ✅ Routes receive `ctx` (TenantContext) from `get_tenant_context()`
- ✅ Routes require authentication
- ⚠️ Service methods don't verify firm_id parameter
- ⚠️ Direct MongoDB access doesn't enforce filtering

**Risk**: MEDIUM (context exists, but not enforced in service layer)

---

### 7. REQUEST TRACING

**Current**: No explicit request_id tracking  
**Required**: request_id propagation from route → service → repository  
**Migration**: Add request_id parameter to all service methods

---

### 8. AUDITING

**Current**: No audit trail for billing operations  
**Required**: Log all invoice state changes (create, issue, pay)  
**Migration**: Integrate with AuditLogRepository

---

## PHASE 1: REPOSITORY AUDIT

### Current Repository Status

**Repositories Available**:
- ✅ TransactionRepository (for payments)
- ✅ AuditLogRepository (for audit trails)
- ✅ UserRepository (for users)
- ⏳ InvoiceRepository: **DOES NOT EXIST** - Must create
- ⏳ CommissionRepository: **DOES NOT EXIST** - Must create
- ⏳ SubscriptionRepository: **DOES NOT EXIST** (for future subscription handling)

### Required Repositories (New)

#### InvoiceRepository
**Purpose**: Manage invoices  
**Methods Needed**:
- `find_by_id(firm_id, invoice_id, request_id)` → Optional[Dict]
- `find_by_status(firm_id, status, request_id)` → List[Dict]
- `find_by_period(firm_id, period, request_id)` → List[Dict]
- `create(firm_id, invoice_data, request_id)` → Dict
- `update_by_id(firm_id, invoice_id, update_data, request_id)` → bool
- `update_status(firm_id, invoice_id, new_status, request_id)` → bool
- `delete_by_id(firm_id, invoice_id, request_id)` → bool
- `get_summary(firm_id, request_id)` → Dict (paid, pending, total)

**Fields to Enforce**:
- firm_id (for multi-tenant scoping)
- status (draft, issued, paid)
- amount, currency
- period
- timestamps: created_at, issued_at, paid_at, updated_at

#### CommissionRepository
**Purpose**: Manage affiliate commissions  
**Methods Needed**:
- `find_by_id(firm_id, commission_id, request_id)` → Optional[Dict]
- `find_by_agent(firm_id, agent_id, request_id)` → List[Dict]
- `find_by_status(firm_id, status, request_id)` → List[Dict]
- `create(firm_id, commission_data, request_id)` → Dict
- `update_status(firm_id, commission_id, new_status, request_id)` → bool
- `get_total_by_firm(firm_id, request_id)` → float
- `get_total_by_status(firm_id, status, request_id)` → float

**Fields to Enforce**:
- firm_id
- agent_id
- amount
- status (pending, paid)
- created_at

#### SubscriptionRepository (Future)
**Purpose**: Manage subscription plans and renewals  
**Defer to**: S2-B or S3 (depends on requirements)

---

## PHASE 2: TENANT VALIDATION

### Current Tenant Handling

**Route Level** (`billing.py`):
```python
ctx = Depends(get_tenant_context)  # ✅ Tenant context available
```

**Service Level** (`billing_service.py`):
```python
async def get_firm_invoices(
    db: AsyncIOMotorDatabase,
    organization_id: str,  # ⚠️ Called "organization_id", not "firm_id"
    status: Optional[str] = None,
):
    query = {"organization_id": organization_id}  # ✅ Used in filter
    invoices = await db.invoices.find(query)...
```

### Issues Found

| Issue | Severity | Impact | Solution |
|-------|----------|--------|----------|
| No firm_id parameter passed from routes to service | MEDIUM | Cannot enforce multi-tenant isolation | Add firm_id param to all service methods |
| Service methods don't receive request_id | MEDIUM | No request tracing | Add request_id param to all service methods |
| No audit trail | MEDIUM | Cannot track changes for compliance | Integrate AuditLogRepository |
| Field name mismatch (organization_id vs firm_id) | MEDIUM | Inconsistent with TenantKernel | Map in repository layer |

### Tenant Isolation Assessment

**Current Risk**: ⚠️ MEDIUM
- Routes have tenant context
- Service methods accept organization_id
- Direct MongoDB access without explicit firm_id verification
- No audit trail for changes

**Post-Migration Risk**: ✅ LOW
- Repository layer will enforce firm_id filtering
- AuditLogRepository will track all changes
- request_id propagation enables tracing
- Type hints will ensure firm_id is always passed

---

## PHASE 3: DEPENDENCY MAP

```
Billing Module
├─ InvoiceRepository (create)
├─ CommissionRepository (create)
├─ AuditLogRepository (migrate logging)
├─ Request Context (firm_id extraction)
└─ TenantKernel (firm_id validation)

Invoices
├─ Are created by: Users subscribing to plans
├─ Reference: Organization (firm_id)
└─ Linked to: Commissions (affiliate tracking)

Commissions
├─ Created by: Referral system
├─ Reference: Agent (user who referred)
├─ Reference: Organization (firm)
└─ Linked to: Invoices (financial summary)

Dependencies on Billing:
├─ Financial Module (S4): Ledger entries
├─ Analytics Module (S10): Revenue reporting
├─ Admin Dashboard: Metrics display
└─ Payment Core (S1): Payment confirmation

Blocking Dependencies:
├─ Organizations Module (S1.5): Must exist first
└─ None other (Billing is independent once Organizations exists)

Circular Dependencies:
├─ None detected ✅
```

### Critical Path

```
Organizations (S1.5) - READY
    ↓
Billing (S2) - Can start after Organizations certified
    ↓
Financial (S4) - Depends on Billing
    ↓
Analytics (S10) - Depends on all modules
```

---

## PHASE 4: ECONOMIC RISK CLASSIFICATION

### Priority by Economic Impact

| Endpoint | Priority | Impact | Critical | Rollback |
|----------|----------|--------|----------|----------|
| `POST /billing` (create) | **P0** | **CRITICAL** | Yes | Simple (DELETE) |
| `POST /billing/{id}/pay` (mark paid) | **P0** | **CRITICAL** | Yes | Complex (UNDO) |
| `PUT /billing/{id}` (update) | **P1** | HIGH | Yes | Simple (RESTORE) |
| `DELETE /billing/{id}` (delete) | **P1** | HIGH | Yes | Complex (RECOVER) |
| `GET /billing` (list) | **P2** | MEDIUM | No | None |
| `GET /billing/dashboard` (metrics) | **P2** | MEDIUM | No | None |
| `GET /billing/{id}` (detail) | **P2** | MEDIUM | No | None |

### Economic Risk Assessment

**P0 Operations** (Create, Pay - Financial Records):
- Risk: Data loss, incorrect payment recording
- Mitigation: Strong tests, careful migration, audit trail
- Rollback Complexity: Medium-High

**P1 Operations** (Update, Delete):
- Risk: Data corruption, accidental deletions
- Mitigation: Soft deletes, audit trail, careful filtering
- Rollback Complexity: Medium

**P2 Operations** (Read, Dashboard):
- Risk: None (read-only)
- Mitigation: Query optimization
- Rollback Complexity: Low

---

## PHASE 5: SPRINT BACKLOG (DRAFT)

### Task T1: InvoiceRepository Implementation
- **Objective**: Create InvoiceRepository following Golden Template v1.0
- **Time**: 2-3 days
- **Dependencies**: BaseRepository, TenantKernel
- **Definition of Done**:
  - Inherits from BaseRepository ✅
  - All methods have firm_id parameter ✅
  - All methods have request_id parameter ✅
  - Audit integration (AuditLogRepository) ✅
  - Type hints complete ✅
  - No direct MongoDB access ✅
  - Tests passing ✅
- **Rollback**: git checkout
- **Risk**: MEDIUM (new entity, must be correct)

### Task T2: CommissionRepository Implementation
- **Objective**: Create CommissionRepository following Golden Template v1.0
- **Time**: 2-3 days
- **Dependencies**: BaseRepository, TenantKernel
- **Definition of Done**: Same as T1
- **Rollback**: git checkout
- **Risk**: MEDIUM

### Task T3: Migrate BillingService to Use Repositories
- **Objective**: Replace all db.invoices.* calls with InvoiceRepository
- **Time**: 3-4 days
- **Dependencies**: T1, T2 complete
- **Definition of Done**:
  - All direct MongoDB access removed (primary path) ✅
  - Legacy fallback paths preserved ✅
  - All methods receive firm_id parameter ✅
  - All methods receive request_id parameter ✅
  - Tests passing ✅
  - Backward compatible ✅
- **Rollback**: git checkout
- **Risk**: HIGH (financial data)

### Task T4: Integrate AuditLogRepository
- **Objective**: Add audit trail to all state-changing operations
- **Time**: 2 days
- **Dependencies**: T3 complete
- **Definition of Done**:
  - All create operations logged ✅
  - All update operations logged ✅
  - All delete operations logged ✅
  - Audit entries queryable per firm_id ✅
  - Tests passing ✅
- **Rollback**: git checkout
- **Risk**: MEDIUM

### Task T5: Add Request Tracing
- **Objective**: Propagate request_id through all layers
- **Time**: 1-2 days
- **Dependencies**: T3 complete
- **Definition of Done**:
  - Routes pass request_id to service ✅
  - Service passes request_id to repository ✅
  - Audit logs include request_id ✅
  - Tests passing ✅
- **Rollback**: git checkout
- **Risk**: LOW

### Task T6: 8-Phase Certification Audit
- **Objective**: Execute full certification audit (Payment Core pattern)
- **Time**: 4-6 weeks
- **Dependencies**: T1-T5 complete
- **Phases**:
  1. Repository Layer Compliance
  2. Tenant Isolation Validation
  3. Backward Compatibility
  4. Observability
  5. Security
  6. Metrics
  7. Risk Assessment
  8. Certification Decision
- **Rollback**: Fallback to legacy paths
- **Risk**: LOW (follows proven pattern)

---

## PHASE 6: QUICK WINS

**High-Impact, Low-Effort Tasks** (< 2 hours each):

| Task | Effort | Impact | Notes |
|------|--------|--------|-------|
| Add firm_id parameter to service methods | 1 hour | HIGH | Type consistency |
| Add request_id parameter to service methods | 1 hour | HIGH | Tracing enablement |
| Document current MongoDB operations | 30 min | MEDIUM | Clarity for team |
| Create stub for InvoiceRepository | 1 hour | MEDIUM | Unblocks migration |
| Create stub for CommissionRepository | 1 hour | MEDIUM | Unblocks migration |

**Total Quick Wins**: 5 hours (achievable in 1 day)

---

## PHASE 7: BLOCKERS DETECTED

### Architectural Blockers

| Blocker | Severity | Impact | Solution | Timeline |
|---------|----------|--------|----------|----------|
| Organizations module must exist first | MEDIUM | Tenant scoping | Organizations certified (S1.5) | Blocks S2 start |
| InvoiceRepository doesn't exist | MEDIUM | No repository abstraction | Create new repo | Task T1 |
| CommissionRepository doesn't exist | MEDIUM | No repository abstraction | Create new repo | Task T2 |

### Functional Blockers

| Blocker | Severity | Impact | Solution |
|---------|----------|--------|----------|
| Commission data model undefined | MEDIUM | Unknown schema | Clarify commission structure |
| Subscription model not yet defined | LOW | Future feature | Defer to S3/S4 |

### Technical Blockers

**None identified** ✅

### Operational Blockers

**None identified** ✅

### Mitigation Strategy

1. **Organizations Module**: Already in progress (S1.5) - use test firm_id for early work
2. **Repository Creation**: Standard work, no blockers
3. **Commission Schema**: Clarify from current codebase usage
4. **Subscription Model**: Defer to future sprint (not blocking S2)

---

## ASSESSMENT SUMMARY

### Readiness Matrix

| Dimension | Status | Score | Comments |
|-----------|--------|-------|----------|
| **Code Exists** | ✅ Ready | 100 | Routes + Service exist |
| **Repository Pattern Available** | ✅ Ready | 100 | Can follow Golden Template |
| **Tenant Context Available** | ✅ Ready | 100 | Routes have ctx |
| **Audit Pattern Available** | ✅ Ready | 100 | AuditLogRepository exists |
| **Business Logic Defined** | ✅ Ready | 100 | Clear state machines |
| **Database Schema** | ⚠️ Needs Clarification | 80 | Fields documented, commission schema TBD |
| **Dependency Chain** | ✅ Ready | 90 | Minor unknown dependencies on future modules |
| **Test Coverage** | ⚠️ Unknown | ? | Current test status unknown |

### Migration Complexity Assessment

| Factor | Complexity | Effort | Risk |
|--------|-----------|--------|------|
| Direct MongoDB → Repository | MEDIUM | 3-4 days | MEDIUM |
| Tenant Isolation Enforcement | LOW | 1-2 days | LOW |
| Audit Trail Integration | LOW | 1-2 days | LOW |
| Request Tracing | LOW | 1-2 days | LOW |
| 8-Phase Certification | MEDIUM | 4-6 weeks | LOW (proven pattern) |
| **Overall** | **MEDIUM** | **4-6 weeks** | **MEDIUM** |

---

## RECOMMENDATIONS

### Pre-S2 Work (S1.5 Parallel)

1. ✅ Clarify commission data model (if not already done)
2. ✅ Prepare InvoiceRepository stub structure
3. ✅ Prepare CommissionRepository stub structure
4. ⚠️ Ensure Organizations module provides firm_id (for tenant scoping)

### S2 Execution Order

1. **Week 1-2**: Create InvoiceRepository + CommissionRepository
2. **Week 3-4**: Migrate BillingService to use repositories
3. **Week 5-6**: Integrate auditing + request tracing
4. **Week 7-12**: Execute 8-phase certification audit
5. **Week 13**: Certification decision + approval

---

## CONCLUSION

**Billing & Subscription Core is READY for migration planning.**

✅ No architectural blockers  
✅ Clear migration path (follows Payment Core pattern)  
✅ Medium complexity (reasonable effort)  
✅ Medium risk (financial data, but manageable)  
✅ Can proceed to Task Planning phase

---

**Next Phase**: SPRINT_S2_REPOSITORY_AUDIT.md
