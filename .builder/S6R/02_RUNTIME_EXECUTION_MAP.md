# S6R: Runtime Execution Map
**Date:** 2026-07-07  
**Scope:** Actual request flow through the system  
**Methodology:** Code trace from server startup through request completion

---

## A. SERVER STARTUP SEQUENCE

```
1. server.py loads
   ↓
2. .env configuration
   ↓
3. Logging setup
   ↓
4. Motor MongoDB async client created
   ↓
5. GuardedDB wraps real_db
   db = create_guarded_db(real_db)
   [GuardedDB.__getitem__ will intercept collection access]
   ↓
6. FastAPI app created
   ↓
7. Middleware registered (in order):
   - SecurityEnforcerMiddleware       [app.add_middleware]
   - TenantKernelMiddlewareWrapper    [app.add_middleware]
   - TenantIsolationMiddleware        [app.add_middleware]
   ↓
8. Routers included:
   - include_router(auth.router)
   - include_router(cases.router)
   - include_router(documents.router)
   - ... 40+ more routers ...
   ↓
9. @app.on_event("startup") triggers:
   bootstrap_enterprise(app, db)
   ↓
   [Inside bootstrap_enterprise]:
   9.1 AuditService instantiated
   9.2 PermissionService instantiated
   9.3 AuthService instantiated
   9.4 TenantService instantiated
   9.5 UserService instantiated
   9.6 CaseService instantiated
       - CaseRepository(db["cases"]) created
       - DocumentRepository(db["documents"]) created
       - DocumentAccessLogRepository(db["document_access_logs"]) created
   9.7 Services attached to app.state
   9.8 Enterprise routers included
   9.9 Async audit pipeline started
   9.10 Database indexes ensured
   ↓
10. Server listening on port 8000
```

**Status:** ✅ VERIFIED - Bootstrap sequence is intact and functional

---

## B. AUTHENTICATED REQUEST FLOW (Protected Route)

### Example: POST /api/cases (Create a case)

```
1. HTTP Request received
   POST /api/cases
   Headers: Authorization: Bearer {JWT}
   Body: { name, description, ... }
   ↓
2. SecurityEnforcerMiddleware.dispatch() executes
   - Validates request signature/CORS
   - Passes to next middleware
   ↓
3. TenantKernelMiddlewareWrapper.dispatch() executes
   - Extracts tenant_id from request context (or JWT claims)
   - Sets g.tenant_id or context.tenant_id
   - Passes to next middleware
   ↓
4. TenantIsolationMiddleware.dispatch() executes
   - Calls require_tenant_context(request)
   - Verifies tenant is valid in current user's organizations
   - Stores in request.state.tenant_context
   - Passes to route handler
   ↓
5. cases.py route handler: @router.post("/")
   ↓
6. get_current_user dependency injected
   - Calls routes/auth.py:get_current_user(token)
   - Queries db.users.find_one({"email": payload["sub"]})  [DIRECT DB - NO GUARDED]
   - Returns user object
   ↓
7. authorize() called from security_engine.py
   await authorize(
       action="create_case",
       user=current_user,
       tenant_id=request.state.tenant_context.id,
       context={...}
   )
   ↓
   [Inside authorize]:
   7.1 Checks RBAC via rbac_engine.get_user_permissions(user_id)
   7.2 Checks tenant ownership via tenant_scope.validate_tenant_access(user, tenant_id)
   7.3 Checks case-level policy via policy_matrix.policy_allows(...)
   7.4 Logs authorization attempt via audit_logger.log_authorization(...)
   7.5 Returns True or raises PermissionDenied
   ↓
   [Lookup for _apply_governor_validation]:
   7.6 Code mentions get_security_governor() but NOT CALLED
       Line: "if ENABLE_GOVERNOR_VALIDATION:" exists but is always False
       → Governor validation SKIPPED
   ↓
8. Case creation logic
   case_doc = {
       "number": generate_case_number(),
       "name": payload.name,
       "tenant_id": request.state.tenant_context.id,
       ...
   }
   ↓
9. Two paths exist in code:
   
   PATH A (Attempted but broken):
   secure_repo = get_secure_repository(db)
   result = await secure_repo.create(case_doc)
   [But secure_repository path has incomplete wiring]
   
   PATH B (Actual):
   result = await db.cases.insert_one(case_doc)  [DIRECT DB - BYPASSES GUARDED]
   ↓
10. Activity log created (ALSO DIRECT DB)
    await db.case_activities.insert_one({
        "case_id": result.inserted_id,
        "action": "created",
        ...
    })
    ↓
11. HTTP Response 201 returned to client
```

**Status:** ⚠️ PARTIAL PROTECTION
- Middleware chain: ✅ Functional
- Authorization: ✅ Checked
- Database write: ❌ Direct (bypasses GuardedDB)

---

## C. UNAUTHENTICATED PUBLIC FLOW (Example: POST /api/public/intake)

```
1. HTTP Request received
   POST /api/public/intake
   Headers: NO Authorization
   Body: { name, email, ... }
   ↓
2. SecurityEnforcerMiddleware.dispatch()
   - Public routes bypassed
   ↓
3. TenantKernelMiddlewareWrapper.dispatch()
   - No tenant context (public route)
   - Passes through
   ↓
4. TenantIsolationMiddleware.dispatch()
   - Skipped for public routes
   ↓
5. public_intake.py route handler
   @router.post("/")
   ↓
6. NO get_current_user required
   NO authorization check
   ↓
7. Direct DB write
   result = await db.leads.insert_one(intake_doc)
   ↓
8. HTTP Response 200 returned
```

**Status:** ⚠️ OPEN ACCESS
- No authorization
- Direct DB write
- No audit logging required

---

## D. ENTERPRISE ROUTE FLOW (Example: POST /api/enterprise/cases)

```
1. HTTP Request received
   POST /api/enterprise/cases
   Headers: Authorization: Bearer {JWT}
   ↓
2-4. Middleware chain same as B
   ↓
5. enterprise_case_routes.py handler
   @router.post("/")
   ↓
6. get_current_user dependency
   [SAME AS B - Direct DB query]
   ↓
7. Service dependency injected
   Depends(get_case_service)
   ↓
   [In dependencies.py]:
   case_service = app.state.case_service
   [Attached during bootstrap_enterprise]
   ↓
8. Case service method called
   await case_service.create_case(payload, user, tenant_id)
   ↓
   [Inside CaseService.create_case]:
   8.1 Calls authorization check
   8.2 Calls self.repository.create(case_doc)
   ↓
   [Inside CaseRepository.create]:
   8.3 Calls GuardedDB through:
       await self._db["cases"].insert_one(doc)
       [self._db is already GuardedDB wrapper]
       ↓
       [Inside GuardedCollection.__getitem__]:
       8.4 Checks if __guarded_operations is registered
       [In this case it IS - for enterprise flows]
       8.5 Executes guarded insert
   ↓
9. HTTP Response 201 returned
```

**Status:** ✅ VERIFIED PROTECTION
- Middleware: ✅ Functional
- Authorization: ✅ Checked
- Repository: ✅ GuardedDB path
- Audit: ✅ Logged

---

## E. DEAD RUNTIME PATHS (Never Executed)

### Runtime Lockdown Chain
```
[NEVER EXECUTES]

server.py startup
  ↓
install_runtime_lockdown() called?
  NO ❌
  
Expected:
install_runtime_lockdown()
  ↓
install_import_hook()
  ↓
seal_module("backend.security")
  ↓
integrity_check()
  
Actual:
NOT IN CODE
```

**Verification:**
- `server.py` has 180+ lines
- No call to `initialize_runtime_lockdown()`
- No call to `install_import_hook()`
- No call to `install_runtime_lockdown()`

**Status:** ❌ DEAD CODE

---

### Anomaly/Threat Detection Chain
```
[NEVER EXECUTES]

authorize() called in security_engine.py
  ↓
Does it call security_anomaly_engine?
  NO ❌
  
Does it call attack_graph_engine?
  NO ❌
  
Does it call threat_correlation_engine?
  NO ❌
  
Does it call adaptive_risk_engine?
  NO ❌
  
Actual flow:
authorize()
  → RBAC check
  → Policy check
  → Log attempt
  → SKIP governor ← (even though code exists)
  → Return True/False
```

**Status:** ❌ DEAD CODE

---

### SOC Incident Response Chain
```
[RARELY EXECUTES - only if mitigation triggered]

authorize() detects high-risk decision
  ↓
_apply_autonomous_response() called?
  PARTIAL ✓ (only if decision.actions exist)
  ↓
mitigation_engine.execute_actions() called?
  YES ✓
  ↓
  [Inside mitigation_engine]:
  
  Calls: get_fail_safe_manager()
  Expected symbol in fail_safe_mode.py:
    def get_fail_safe_manager()
  Actual symbol in fail_safe_mode.py:
    def get_fail_safe()
  
  Result: EXCEPTION at runtime ❌
  ↓
Circuit breaker triggered?
  BROKEN - same symbol error ❌
```

**Status:** ❌ BROKEN - Will fail at runtime if triggered

---

### Governor & Arbitration Chain
```
[NEVER EXECUTES]

authorize() checks:
  if ENABLE_GOVERNOR_VALIDATION:  ← Always False
    _apply_governor_validation()
  
ENABLE_GOVERNOR_VALIDATION is not set in config
Code path is unreachable ❌
```

**Status:** ❌ DEAD CODE / DISABLED

---

## F. ACTUAL PRODUCTION RUNTIME STATE

### What IS actively executing:

1. ✅ Server startup and bootstrap
2. ✅ Middleware authentication/tenant isolation
3. ✅ RBAC and basic authorization
4. ✅ Audit logging for auth attempts
5. ✅ Enterprise service/repository paths (with GuardedDB)
6. ✅ SOC event stream (low volume - only mitigation path)

### What IS NOT executing:

1. ❌ Runtime lockdown / import hooks
2. ❌ Anomaly detection
3. ❌ Attack graph analysis
4. ❌ Threat correlation
5. ❌ Behavioral profiling
6. ❌ Governor validation
7. ❌ Policy arbitration
8. ❌ Circuit breaker (broken)
9. ❌ Containment / recovery
10. ❌ Red team simulation
11. ❌ Advanced fail-safe (broken symbol)

### What IS partially executing:

1. ⚠️ SecureRepository (only in enterprise routes, not legacy)
2. ⚠️ GuardedDB (only wrapped, not enforced in legacy routes)
3. ⚠️ Mitigation engine (only if triggered, but broken)

---

## G. MULTI-TENANT SAFETY ANALYSIS

### Can tenant A access tenant B's data?

**Via middleware:** ✅ NO
- TenantIsolationMiddleware validates tenant_id in JWT
- TenantKernelMiddlewareWrapper enforces context

**Via direct DB queries:** ❌ POSSIBLE
- Example: `db.cases.find({"_id": attacker_provided_id})`
- No tenant_id filter in many legacy routes
- GuardedDB is wrapped but NOT enforced (legacy code bypasses)

**Via repositories:** ✅ NO
- CaseRepository adds tenant_id filter automatically
- But legacy routes don't use repositories

**Verdict:** ⚠️ PARTIAL PROTECTION
- Enterprise flows: ✅ Protected
- Legacy flows: ❌ Vulnerable if attacker knows ID

---

## SUMMARY

| Component | Executing | Status |
|-----------|-----------|--------|
| Bootstrap | YES | ✅ |
| Middleware | YES | ✅ |
| Auth/RBAC | YES | ✅ |
| GuardedDB (wrapped) | YES | ✅ |
| GuardedDB (enforced) | PARTIAL | ⚠️ |
| Repositories | PARTIAL | ⚠️ |
| Runtime Lockdown | NO | ❌ |
| Anomaly/Threat | NO | ❌ |
| Governor | NO | ❌ |
| Mitigation | BROKEN | ❌ |
| Incident Response | BROKEN | ❌ |

**Overall Runtime Status:** ⚠️ FUNCTIONAL BUT INCOMPLETE
