# KERNEL ROOT CAUSE ANALYSIS - EXECUTIVE SUMMARY

## The Problem

**500 errors occur because the TenantKernel correctly validates tenant context, but downstream layers fail to use it.**

System architecture has a critical **discontinuity**:
- **Middleware layer**: Validates `firm_id` from JWT ✓
- **Endpoint layer**: Ignores validated context, uses `lawyer_id` from path parameters ✗
- **Repository layer**: Expects `firm_id` but receives `lawyer_id` ✗

---

## Root Causes (8 Critical Issues)

### 1. **Kernel Context Set But Not Used** (CRITICAL)
- Middleware validates and attaches `request.state.tenant_context`
- **Endpoints never call** `get_tenant_context_from_request()`
- Validated security context is discarded
- Routes query database directly, bypassing all isolation

### 2. **Tenant Identifier Mismatch** (CRITICAL)
- JWT provides: `firm_id` (organization/tenant)
- Endpoints expect: `lawyer_id` (user within tenant)
- Database queries use wrong identifier
- Results in data leakage or 500 errors

### 3. **Middleware Execution Order** (CRITICAL)
```
Registered order:        Execution order:
1. SecurityEnforcer     (runs 3rd)
2. TenantKernel  ← want first!
3. TenantIsolation      (runs 1st - WRONG!)
```
- Legacy middleware runs BEFORE kernel
- Both create tenant context (second overwrites)
- Contradicts kernel-first architecture

### 4. **Legacy JWT Extraction in Endpoints** (HIGH)
- Each endpoint re-validates JWT with old decoder
- Bypasses kernel security checks
- Creates security gap: legacy decoder missing firm_id validation

### 5. **Repository Isolation Bypassed** (HIGH)
- Routes query database directly: `db.cases.find(...)`
- Skip `BaseRepository` multi-tenant filtering
- GuardedDB protections not enforced
- No firm_id auto-injection into queries

### 6. **Missing firm_id at Registration** (HIGH)
- User can register WITHOUT firm_id
- JWT created with `firm_id: null`
- Kernel validation fails: `if not jwt_firm_id...` → 500
- No default firm creation

### 7. **No firm_id Validation at JWT Creation** (MEDIUM)
- `create_access_token()` doesn't verify firm_id exists
- Allows null/missing claims in JWT
- Causes kernel validation to fail

### 8. **Inconsistent Endpoint Implementation** (MEDIUM)
- `payment.py` imports kernel context (ready)
- `dashboard.py`, `cases.py`, `appointments.py` don't (legacy)
- Mixed patterns across codebase

---

## Error Cascade Example

```
1. User registers without firm_id
   └─ create_access_token({"firm_id": None, ...})

2. Next request with this token
   └─ TenantKernel validates
   └─ if not jwt_firm_id: raise TenantValidationError()
   └─ TenantKernelMiddleware catches
   └─ HTTPException(500, "Tenant validation failed")

3. Client receives: 500 Internal Server Error
```

---

## Critical Flow Gaps

| Layer | Expected | Actual | Status |
|-------|----------|--------|--------|
| **Middleware** | Validate tenant | ✓ Done | ✓ OK |
| **Middleware** | Attach context to request | ✓ Done | ✓ OK |
| **Middleware** | Execute in correct order | Kernel first | ✗ WRONG (legacy first) |
| **Endpoint** | Retrieve kernel context | NOT DONE | ✗ BROKEN |
| **Endpoint** | Validate path parameters | NOT DONE | ✗ BROKEN |
| **Endpoint** | Use firm_id for isolation | Uses lawyer_id | ✗ BROKEN |
| **Repository** | Receive firm_id parameter | Receives lawyer_id | ✗ BROKEN |
| **Repository** | Apply tenant filtering | Bypassed | ✗ BROKEN |
| **Response** | Return 200 with data | Return 500 error | ✗ BROKEN |

---

## What Works ✓

- JWT signature validation
- TenantContext immutability
- Integrity hash verification
- Kernel logging (audit trail)
- Middleware framework

## What's Broken ✗

- Kernel context propagation to endpoints
- Tenant identifier consistency (firm_id vs lawyer_id)
- Middleware execution order
- Repository layer usage
- firm_id validation at registration

---

## P1 Remediation Tasks

Must fix in order:

1. **Fix middleware execution order** → TenantKernel first
2. **Remove legacy TenantIsolationMiddleware** → Clean up
3. **Update all endpoints** → Use get_tenant_context_from_request()
4. **Validate path parameters** → Cross-check with kernel context
5. **Use repository layer** → firm_id isolation
6. **Validate firm_id at registration** → No null claims
7. **Unify identifiers** → firm_id everywhere
8. **Remove legacy JWT extraction** → Single validation point

**All changes respect Architecture Freeze v1.0**

---

## Full Analysis Document

See: `.builder/KERNEL_RUNTIME_ROOT_CAUSE_ANALYSIS.md`
- 1042 lines of detailed flow analysis
- Step-by-step fault localization
- Claims tracking end-to-end
- Error cascade examples
- Remediation path
