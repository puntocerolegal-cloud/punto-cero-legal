# Tenant Kernel v1.0 — Quick Reference

## 📌 What Changed?

**Before (Deprecated)**:
```python
# Old way: Manual tenant resolution in endpoint
from middleware.tenant_isolation import require_tenant_context

async def my_endpoint(request: Request, ...):
    tenant = require_tenant_context(request)  # DEPRECATED
    firm_id = tenant.firm_id
```

**Now (Kernel)**:
```python
# New way: Kernel-validated context
from kernel.tenant_kernel_middleware import get_tenant_context_from_request

async def my_endpoint(request: Request, ...):
    tenant = get_tenant_context_from_request(request)  # ✅ Guaranteed valid
    firm_id = tenant.firm_id
```

---

## 🚀 Quick Start for Endpoints

### Step 1: Import the helper
```python
from fastapi import APIRouter, Request
from kernel.tenant_kernel_middleware import get_tenant_context_from_request
```

### Step 2: Get tenant context in endpoint
```python
@router.get("/my-resource")
async def get_my_resource(request: Request):
    # This is GUARANTEED to be valid by kernel
    tenant = get_tenant_context_from_request(request)
    
    # Use tenant fields:
    firm_id = tenant.firm_id           # Organization ID
    user_id = tenant.user_id           # User ID
    user_email = tenant.user_email     # Email
    user_role = tenant.user_role       # Role/permissions
    request_id = tenant.request_id     # Trace ID
    ip_address = tenant.ip_address     # Client IP
    timestamp = tenant.timestamp       # Validation time
    
    # Pass to service/repository
    result = await service.process(
        firm_id=firm_id,
        request_id=request_id,
        ...
    )
    return result
```

---

## ⚠️ RULES (Non-Negotiable)

1. ✅ **Always use kernel context** — never manually resolve tenant
2. ✅ **Never bypass kernel** — no service/endpoint override
3. ✅ **Never use firm_id from auth** — use kernel context only
4. ✅ **Always pass request_id** — for tracing and audit
5. ✅ **Never have fallback tenant** — missing context = error

---

## 🛡️ What the Kernel Guarantees

| Guarantee | Meaning |
|-----------|---------|
| **Immutable** | TenantContext cannot be modified after creation |
| **Validated** | JWT signature verified before any code runs |
| **Isolated** | No cross-tenant data access possible |
| **Traceable** | request_id connects logs and events |
| **Auditable** | IP address, user_id, firm_id logged |

---

## 🚨 Failure Modes

| HTTP Status | Meaning | Cause | Action |
|-------------|---------|-------|--------|
| **401** | Invalid JWT | Missing/expired token | User must login again |
| **403** | Tenant mismatch | JWT ≠ header (spoofing) | CRITICAL SECURITY EVENT logged |
| **500** | Kernel error | System failure | Check logs, ops alert |

---

## 📊 TenantContext Structure

```python
@dataclass(frozen=True)
class TenantContext:
    firm_id: str              # Organization ID (from JWT)
    user_id: str              # User ID (from JWT)
    user_email: str           # Email (from JWT)
    user_role: str            # Role (from JWT)
    request_id: str           # Trace ID (UUID)
    ip_address: str           # Client IP
    timestamp: datetime       # Validation time
    validation_source: str    # "JWT" or "EXEMPT_PATH"
    integrity_hash: str       # SHA256 (tampering detection)
```

**Key Property**: `frozen=True` means you **cannot** do:
```python
tenant.firm_id = "different"  # ❌ WILL FAIL (frozen)
tenant.new_field = "value"    # ❌ WILL FAIL (frozen)
```

---

## 🔍 Logging Pattern

Always include request_id and firm_id in logs:

```python
import logging

logger = logging.getLogger(__name__)

async def my_endpoint(request: Request):
    tenant = get_tenant_context_from_request(request)
    
    # Good: includes request_id and firm_id
    logger.info(
        f"[MY_ENDPOINT] Processing request. "
        f"request_id={tenant.request_id} | "
        f"firm_id={tenant.firm_id} | "
        f"user_id={tenant.user_id}"
    )
    
    # Bad: missing tracing info
    # logger.info("Processing request")
    
    try:
        result = await service.process(tenant.firm_id)
        logger.info(
            f"[MY_ENDPOINT] Success. "
            f"request_id={tenant.request_id}"
        )
        return result
    except Exception as e:
        logger.error(
            f"[MY_ENDPOINT] Error. "
            f"request_id={tenant.request_id} | "
            f"error={str(e)}"
        )
        raise
```

---

## 🔐 Security Checklist

- [ ] All endpoints use `get_tenant_context_from_request()`
- [ ] No `firm_id` extracted from `current_user`
- [ ] No `request.state.tenant_context` accessed directly (use helper)
- [ ] All services receive `request_id` for audit
- [ ] All database queries include `firm_id` filter
- [ ] No fallback/default tenant anywhere
- [ ] All errors logged with `request_id` for tracing

---

## 📚 File Locations

**Kernel Core**:
- `backend/kernel/__init__.py` — Package exports
- `backend/kernel/tenant_context.py` — Immutable dataclass
- `backend/kernel/tenant_kernel.py` — Main validation logic
- `backend/kernel/tenant_kernel_exceptions.py` — Error types
- `backend/kernel/tenant_kernel_middleware.py` — FastAPI integration

**Bootstrap**:
- `backend/bootstrap_enterprise.py` — Middleware registration

**Legacy (Deprecated)**:
- `backend/middleware/tenant_isolation.py` — Old middleware (fallback)

---

## ❓ FAQ

### Q: What if I need to create a request without JWT (e.g., cron job)?
**A**: Use `build_kernel_context_for_exempt_path()` or add path to `EXEMPT_PATHS` in kernel. The endpoint must not require authenticated tenant.

### Q: Can I modify TenantContext in a service?
**A**: No. It's frozen. If you need to change something, pass it as a separate parameter.

### Q: What if JWT is missing firm_id claim?
**A**: Request gets 401 Unauthorized. Must include `firm_id` in JWT claims.

### Q: Can I check tenant in middleware before kernel?
**A**: No. Kernel runs after other middleware but BEFORE endpoints. If you need pre-kernel logic, use FastAPI `lifespan` events.

### Q: Is request_id always the same for a single request?
**A**: Yes. Same request_id throughout entire request lifecycle (middleware → endpoint → service → database).

### Q: What if header firm_id ≠ JWT firm_id?
**A**: 403 Forbidden. Logged as CRITICAL SECURITY EVENT with spoofing details.

### Q: Do I need to register the kernel myself?
**A**: No. `bootstrap_enterprise()` handles it. Just ensure bootstrap runs on startup.

---

## 🚦 Migration Path

**Phase 1 (Current)**: Kernel active, old middleware as fallback
- Kernel validates all protected routes
- Old middleware no longer primary authority
- Both exist for compatibility

**Phase 2 (Next)**: Endpoint migration
- Update endpoints to use `get_tenant_context_from_request()`
- Remove manual tenant resolution from services
- Deprecate old helper functions

**Phase 3 (Later)**: Legacy cleanup
- Remove old TenantIsolationMiddleware
- Remove deprecated functions
- Clean up old comments

---

## 📖 Related Reading

- **Full Spec**: `TENANT_KERNEL_v1_0_IMPLEMENTATION_SUMMARY.md`
- **Architecture**: `TENANT_KERNEL_ARCHITECTURE_IMMUTABLE_v1_0.md`
- **Repository**: `GOLDEN_REPOSITORY_TEMPLATE_V1_0.md`

---

**TenantKernel v1.0** is production-ready and fully implemented.  
Use the quick reference above for day-to-day development.
