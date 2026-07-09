# Tenant Kernel Migration Master Plan
## Complete Elimination of Legacy Tenant Resolution

**Status**: PLANNING PHASE  
**Scope**: Full system migration to TenantKernel v1.0  
**Target**: Zero legacy patterns, 100% kernel enforcement  
**Deadline**: Phased (non-breaking)  

---

## 📊 Codebase Audit Results

### Legacy Pattern Distribution

| Pattern | Count | Priority | Risk |
|---------|-------|----------|------|
| `current.get("firm_id")` | **1** | CRITICAL | HIGH |
| `request.state.tenant_context` | **2** | MEDIUM | LOW |
| Direct `db.collection` access | **100+** | CRITICAL | HIGH |
| Missing firm_id isolation | **50+** | CRITICAL | HIGH |

### Affected Areas

```
📁 backend/
├── 🔴 CRITICAL (Migration Required IMMEDIATELY)
│   ├── services/webhook_handler.py         (28 db direct accesses)
│   ├── services/renewal_service.py         (10 db direct accesses)
│   ├── services/subscription_service.py    (8 db direct accesses)
│   ├── services/trial_service.py           (3 db direct accesses)
│   ├── routes/auth.py                      (1 current.get("firm_id"))
│   ├── routes/referrals.py                 (8 db direct accesses)
│   ├── routes/rbac.py                      (6 db direct accesses)
│   ├── routes/messages.py                  (4 db direct accesses)
│   └── cron_jobs.py                        (CRITICAL - automated)
│
├── 🟠 HIGH (Migration Required Soon)
│   ├── routes/integration.py               (20+ db direct accesses)
│   ├── routes/organizations.py             (8 db direct accesses)
│   ├── routes/portal.py                    (12 db direct accesses)
│   ├── routes/billing_admin.py             (unknown - needs audit)
│   ├── services/partner_service.py         (12+ db direct accesses)
│   └── utils/*.py                          (various direct accesses)
│
├── 🟡 MEDIUM (Will migrate after critical)
│   ├── ai_engines.py                       (CRITICAL for data isolation)
│   ├── ai_operations.py
│   └── analytics routes
│
└── 🟢 LOW (Already compliant)
    ├── routes/payment.py                   (Already using TenantKernel ✓)
    ├── kernel/                             (New implementation ✓)
    ├── repositories/                       (Partial compliance)
    └── bootstrap_enterprise.py             (Updated ✓)
```

---

## 🚀 PHASE 1: CRITICAL SYSTEMS MIGRATION

### Step 1.1: Fix auth.py (1 file)
**Current**:
```python
firm_id = current.get("firm_id")  # ❌ WRONG
```

**Migrate to**:
```python
tenant = get_tenant_context_from_request(request)  # ✅ RIGHT
firm_id = tenant.firm_id
```

**File**: `backend/routes/auth.py`  
**Lines**: ~50-55  
**Risk**: LOW (isolated change)  
**Estimated Time**: 15 minutes

---

### Step 1.2: Create Core Service Repositories
**Rationale**: Services can't migrate without repository interfaces

#### 1.2.1: TransactionRepository (Already exists)
- Status: ✅ COMPLETE
- File: `backend/repositories/transaction/transaction_repository.py`
- Methods: `create()`, `find_by_id()`, `find_many()`, `update()`, `delete()`

#### 1.2.2: WebhookEventRepository (NEW - Required for webhook_handler.py)
**Create**: `backend/repositories/webhook_event_repository.py`

```python
class WebhookEventRepository(BaseRepository):
    """Webhook event audit trail"""
    
    async def find_by_event_id(self, firm_id: str, event_id: str):
        query = TenantAwareQuery.add_firm_filter(
            {"event_id": event_id}, firm_id
        )
        return await self.collection.find_one(query)
    
    async def create_event(self, firm_id: str, event_data: dict, request_id: str):
        event_data["firm_id"] = firm_id
        result = await self.collection.insert_one(event_data)
        return await self.find_by_id(firm_id, str(result.inserted_id), request_id)
```

#### 1.2.3: AuditLogRepository (NEW - For all audit logging)
**Create**: `backend/repositories/audit_log_repository.py`

```python
class AuditLogRepository(BaseRepository):
    """System audit trail"""
    
    async def log_action(
        self,
        firm_id: str,
        action: str,
        user_id: str,
        details: dict,
        request_id: str
    ):
        doc = {
            "action": action,
            "user_id": user_id,
            "details": details,
            "timestamp": datetime.utcnow(),
        }
        return await self.create(firm_id, doc, request_id)
```

#### 1.2.4: UserRepository (NEW - User operations)
**Create**: `backend/repositories/user_repository.py`

```python
class UserRepository(BaseRepository):
    """User management with multi-tenant isolation"""
    
    async def find_by_email(self, firm_id: str, email: str, request_id: str):
        query = TenantAwareQuery.add_firm_filter(
            {"email": email}, firm_id
        )
        return await self.collection.find_one(query)
    
    async def update_by_email(
        self,
        firm_id: str,
        email: str,
        updates: dict,
        request_id: str
    ):
        query = TenantAwareQuery.add_firm_filter(
            {"email": email}, firm_id
        )
        result = await self.collection.update_one(
            query,
            {"$set": updates}
        )
        return result.modified_count > 0
```

#### 1.2.5: NotificationRepository (NEW)
**Create**: `backend/repositories/notification_repository.py`

#### 1.2.6: RefundRepository (NEW)
**Create**: `backend/repositories/refund_repository.py`

#### 1.2.7: ChargebackRepository (NEW)
**Create**: `backend/repositories/chargeback_repository.py`

---

### Step 1.3: Migrate webhook_handler.py
**Status**: HIGHEST PRIORITY (payment system critical)  
**Lines**: ~500  
**DB Accesses**: 28  
**Complexity**: HIGH (complex business logic)

**Migration Strategy**:
1. Inject required repositories via dependency injection
2. Replace each `db.collection.find_one()` with `repo.find_by_id()` or `repo.find_by_email()`
3. Replace each `db.collection.insert_one()` with `repo.create()`
4. Replace each `db.collection.update_one()` with `repo.update()`
5. Add firm_id to all queries
6. Add request_id to all logging

**Key Changes**:

**Before**:
```python
async def handle_webhook(event: dict, db: AsyncIOMotorDatabase):
    existing = await db.webhook_events.find_one({"event_id": event_id})
    result = await db.webhook_events.insert_one(doc)
    
    tx = await db.transactions.find_one({"payment_id": external_ref})
    await db.transactions.update_one(
        {"payment_id": external_ref},
        {"$set": {"status": "paid"}}
    )
```

**After**:
```python
async def handle_webhook(
    event: dict,
    request: Request,
    webhook_repo: WebhookEventRepository = Depends(get_webhook_repo),
    transaction_repo: TransactionRepository = Depends(get_transaction_repo),
    audit_repo: AuditLogRepository = Depends(get_audit_repo),
):
    tenant = get_tenant_context_from_request(request)
    firm_id = tenant.firm_id
    request_id = tenant.request_id
    
    existing = await webhook_repo.find_by_event_id(
        firm_id, event_id
    )
    result = await webhook_repo.create(
        firm_id=firm_id,
        data=doc,
        request_id=request_id
    )
    
    tx = await transaction_repo.find_by_id(
        firm_id, payment_id, request_id
    )
    await transaction_repo.update(
        firm_id=firm_id,
        resource_id=tx["_id"],
        updates={"status": "paid"},
        request_id=request_id
    )
```

**Estimated Time**: 2-3 hours  
**Rollback Strategy**: Keep old code in comments (marked DEPRECATED), can revert imports  
**Validation**: Check logs for `[WEBHOOK_HANDLER]` events with request_id

---

### Step 1.4: Migrate renewal_service.py
**Status**: CRITICAL (subscription renewals)  
**Lines**: ~300  
**DB Accesses**: 10  
**Complexity**: MEDIUM

**Same migration pattern as webhook_handler.py**

**Key Changes**:
- Inject `TransactionRepository`, `UserRepository`
- Get tenant_context from request (need to check function signature)
- Replace all `db.transactions.find_one/insert_one/update_one` with repo methods
- Add firm_id to all queries

**Estimated Time**: 1.5 hours

---

### Step 1.5: Migrate subscription_service.py
**Status**: CRITICAL (subscriptions)  
**Lines**: ~200  
**DB Accesses**: 8  
**Complexity**: MEDIUM

**Same migration pattern**

**Estimated Time**: 1 hour

---

### Step 1.6: Migrate trial_service.py
**Status**: HIGH  
**Lines**: ~150  
**DB Accesses**: 3  
**Complexity**: LOW

**Estimated Time**: 30 minutes

---

## 🎯 PHASE 2: ROUTE LAYER MIGRATION

### Step 2.1: Migrate routes/auth.py
**Fix**: Replace `current.get("firm_id")` with kernel context

**Estimated Time**: 15 minutes

---

### Step 2.2: Migrate routes/referrals.py
**Status**: CRITICAL (revenue tracking)  
**Lines**: ~150  
**DB Accesses**: 8  
**Complexity**: MEDIUM

**Pattern**: Same as services

**Estimated Time**: 1 hour

---

### Step 2.3: Migrate routes/rbac.py
**Status**: HIGH (access control)  
**Lines**: ~300  
**DB Accesses**: 6  
**Complexity**: MEDIUM

**Estimated Time**: 1.5 hours

---

### Step 2.4: Migrate routes/messages.py
**Status**: MEDIUM  
**Lines**: ~100  
**DB Accesses**: 4  
**Complexity**: LOW

**Estimated Time**: 30 minutes

---

## 🔧 PHASE 3: UTILITY FUNCTIONS MIGRATION

### Step 3.1: Migrate utils/notifier.py
**DB Accesses**: 1 (notification insert)  
**Complexity**: LOW

```python
# Before
await db.notifications.insert_one(doc)

# After
await notif_repo.create(firm_id, doc, request_id)
```

---

### Step 3.2: Migrate utils/audit.py
**DB Accesses**: 1 (audit log insert)  
**Complexity**: LOW

```python
# Before
await db.audit_logs.insert_one(doc)

# After
await audit_repo.log_action(firm_id, action, user_id, details, request_id)
```

---

### Step 3.3: Migrate utils/expediente.py
**DB Accesses**: 5  
**Complexity**: MEDIUM

---

### Step 3.4: Audit Remaining Utilities
- `utils/case_number_generator.py` - Needs counter repo
- `utils/*.py` - Others

---

## 🌐 PHASE 4: INTEGRATION ROUTES MIGRATION

### Step 4.1: routes/integration.py
**Status**: HIGH  
**Lines**: ~450  
**DB Accesses**: 20+  
**Complexity**: HIGH (complex queries)

**Strategy**:
1. Create specialized repositories for integration queries
2. Move query logic to repositories
3. Replace each db access with repo call

**Estimated Time**: 3 hours

---

### Step 4.2: routes/organizations.py
**Status**: HIGH  
**Lines**: ~300  
**DB Accesses**: 8  
**Complexity**: MEDIUM

**Estimated Time**: 1.5 hours

---

### Step 4.3: routes/portal.py
**Status**: MEDIUM  
**Lines**: ~200  
**DB Accesses**: 12  
**Complexity**: MEDIUM

**Estimated Time**: 1.5 hours

---

## 🤖 PHASE 5: AI & AUTOMATION MIGRATION (CRITICAL FOR DATA ISOLATION)

### Step 5.1: AI Engines Migration
**Status**: CRITICAL - High risk for data leakage  
**Files**: `ai_engines.py`, `ai_operations.py`, etc.  
**Risk**: SEVERE (ML models could see cross-tenant data)

**Migration Strategy**:
1. All AI queries MUST include firm_id filter
2. Create AIDataRepository for secure data fetching
3. Ensure no ML pipeline accesses unfiltered data
4. Add firm_id parameter to all AI functions

**Estimated Time**: 4-6 hours

---

### Step 5.2: Cron Jobs Migration
**Status**: CRITICAL - Automated, unmonitored  
**File**: `services/cron_jobs.py`  
**Risk**: SEVERE (background jobs could bypass security)

**Migration Strategy**:
1. Each cron job must have an associated firm_id
2. Jobs must iterate by firm, not globally
3. Add request_id for each job invocation
4. Log every cron action with firm_id

**Estimated Time**: 3-4 hours

---

## 📋 PHASE 6: VALIDATION & VERIFICATION

### Validation Checklist

For each migrated file:
- [ ] No `current.get("firm_id")` remaining
- [ ] No `request.state.tenant_context` direct access (only via helper)
- [ ] No `db.collection` direct access (all via repository)
- [ ] All queries include `firm_id` filter
- [ ] All logs include `request_id`
- [ ] No fallback/default tenant logic
- [ ] Tests pass
- [ ] No regression in functionality

### Global Validation

```bash
# Should find ZERO matches (we're removing all)
grep -r "db\.[a-z_]*\.find" backend/ | grep -v "repository" | grep -v "#"
grep -r "current\.get\(\"firm_id\"\)" backend/
grep -r "request\.state\.tenant_context" backend/routes
```

---

## 🔄 MIGRATION ORDER (RECOMMENDED)

### Week 1 (Critical Systems)
1. **Day 1**: Create all required repositories
2. **Day 1-2**: Migrate webhook_handler.py
3. **Day 2-3**: Migrate renewal_service.py
4. **Day 3**: Migrate subscription_service.py
5. **Day 3-4**: Migrate trial_service.py
6. **Day 4**: Migrate auth.py

**Validation**: All critical payment systems working

### Week 2 (Route Layer)
1. **Day 1-2**: Migrate referrals.py
2. **Day 2-3**: Migrate rbac.py
3. **Day 3-4**: Migrate messages.py
4. **Day 4-5**: Migrate utility functions

**Validation**: All API routes returning firm_id-filtered data

### Week 3 (Integration & Analytics)
1. **Day 1-2**: Migrate integration.py
2. **Day 2-3**: Migrate organizations.py
3. **Day 3-4**: Migrate portal.py
4. **Day 4-5**: Migrate analytics routes

**Validation**: Complex queries returning correct firm-scoped data

### Week 4 (AI & Automation)
1. **Day 1-3**: Migrate AI engines
2. **Day 3-4**: Migrate cron jobs
3. **Day 4-5**: Final validation

**Validation**: AI models only see tenant-scoped data

---

## 🛡️ SAFETY MEASURES

### Pre-Migration
- [ ] Database backup created
- [ ] Staging environment tested
- [ ] Rollback plan documented
- [ ] Feature flags prepared

### During Migration
- [ ] Gradual rollout (canary deployment)
- [ ] Monitor logs for errors
- [ ] Monitor error rates by endpoint
- [ ] Team on standby for rollback

### Post-Migration
- [ ] Verify firm_id filtering on sample data
- [ ] Check audit logs for any cross-tenant access
- [ ] Monitor performance impact
- [ ] Validate with real users

---

## ⚠️ RISK ASSESSMENT

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Breaking payment webhooks | LOW | CRITICAL | Extensive testing, canary |
| Cross-tenant data exposure | LOW | CRITICAL | Repo layer, firm_id filters |
| Performance regression | MEDIUM | MEDIUM | Index optimization, caching |
| Rollback complexity | MEDIUM | MEDIUM | Version control, testing |
| Developer errors | HIGH | MEDIUM | Code review, pair programming |

---

## 📞 ROLLBACK PROCEDURE

If critical issues discovered:

1. **Identify affected service**: Check logs for `[ERROR]` with service name
2. **Revert file**: `git revert <commit>`
3. **Restart service**: Docker restart or similar
4. **Verify**: Check logs for normal operation
5. **Root cause analysis**: Post-mortem on what went wrong

**Estimated Rollback Time**: 15-30 minutes per file

---

## 📊 SUCCESS CRITERIA

✅ **System is fully migrated when**:

1. **Zero Legacy Code**
   - 0 instances of `current.get("firm_id")`
   - 0 direct `db.collection` access in routes/services
   - 0 non-repository data access

2. **100% Kernel Enforcement**
   - Every request validated by TenantKernel
   - Every database query includes firm_id
   - Every log includes request_id

3. **Perfect Data Isolation**
   - All queries automatically scoped to firm_id
   - No cross-tenant data possible
   - AI/ML sees only tenant data

4. **Complete Observability**
   - All requests traceable by request_id
   - All actions logged with firm_id
   - Security events logged as CRITICAL

5. **Production Stable**
   - Zero downtime migration
   - No performance degradation
   - All tests passing
   - User-facing functionality unchanged

---

## 📈 Estimated Timeline

| Phase | Duration | Files | Complexity |
|-------|----------|-------|------------|
| 1: Critical Systems | 1.5 weeks | 5 services | HIGH |
| 2: Route Layer | 1 week | 4 routes | MEDIUM |
| 3: Utils | 0.5 weeks | 3+ utils | LOW |
| 4: Integration | 1 week | 3 routes | HIGH |
| 5: AI/Automation | 1 week | 3+ modules | CRITICAL |
| 6: Validation | 1 week | All | - |
| **TOTAL** | **~6 weeks** | **20+ files** | - |

---

## 🎓 Key Principles

1. **Never break production** — Always have rollback ready
2. **Gradual migration** — One file at a time, validate each
3. **Repository layer** — All data access through repositories
4. **firm_id everywhere** — Every query, every log
5. **request_id tracing** — Connect all actions to original request
6. **Zero fallback** — No default tenant, explicit only
7. **Kernel is law** — No endpoint override of tenant

---

## 📝 Next Actions

**Immediate** (Next 24 hours):
1. [ ] Review this plan with team
2. [ ] Create all required repositories
3. [ ] Set up staging environment
4. [ ] Begin webhook_handler.py migration

**This Week**:
1. [ ] Migrate all critical services
2. [ ] Validate payment system stability
3. [ ] Deploy to staging with monitoring

**Next Week**:
1. [ ] Migrate route layer
2. [ ] Update utility functions
3. [ ] Comprehensive testing

---

**Status**: READY FOR EXECUTION  
**Approval**: Awaiting sign-off  
**Start Date**: TBD  
**Lead Architect**: Punto Cero System OS  

---

## 📚 Related Documents

- `TENANT_KERNEL_v1_0_IMPLEMENTATION_SUMMARY.md` — Kernel implementation
- `TENANT_KERNEL_QUICK_REFERENCE.md` — Developer guide
- `GOLDEN_REPOSITORY_TEMPLATE_V1_0.md` — Repository pattern
