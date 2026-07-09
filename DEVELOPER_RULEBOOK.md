# PUNTO CERO SYSTEM OS
## OFFICIAL DEVELOPER RULEBOOK v1.0

**Document**: Official Mandatory Developer Rules  
**Authority**: Architecture Governance Board  
**Effective**: Immediately  
**Status**: FROZEN - No Exceptions  

---

## PREAMBLE

These rules are non-negotiable. They enforce Punto Cero System OS v1.0 Architecture Baseline.

Every developer, team, and sprint must comply. Non-compliance requires formal Architecture Review Board approval.

---

## CATEGORY 1: REPOSITORY LAYER RULES

### Rule 1.1: Never Access MongoDB Directly
**Statement**: No `db.collection.operation()` in primary code paths.

**Forbidden**:
```python
# ❌ FORBIDDEN in primary path
result = await db.transactions.find_one({"payment_id": id})
await db.users.update_one({...}, {"$set": {...}})
```

**Required**:
```python
# ✅ REQUIRED
result = await transaction_repo.find_by_payment_id(firm_id, id, request_id)
await user_repo.update_by_id(firm_id, id, update_data, request_id)
```

**Exception**: Legacy fallback paths ONLY (backward compatibility)

**Enforcement**: Code review mandatory. Merge blocked if violated.

---

### Rule 1.2: Always Use Repository Layer
**Statement**: All data access through Repository Layer exclusively.

**Pattern**:
```python
async def handler(
    db: AsyncIOMotorDatabase = Depends(get_db),  # ← For legacy fallback only
    repo: SomeRepository = Depends(get_some_repo)  # ← Primary path
):
    if repo and firm_id:
        data = await repo.method(firm_id, ..., request_id)  # ← PRIMARY
    else:
        data = await db.collection.operation(...)  # ← FALLBACK ONLY
```

**Enforcement**: All new code must use repositories.

---

### Rule 1.3: All Repositories Inherit BaseRepository
**Statement**: No custom repository without BaseRepository inheritance.

**Required**:
```python
from backend.repositories.base_repository import BaseRepository

class MyRepository(BaseRepository):
    pass  # Automatic firm_id enforcement
```

**Forbidden**: Direct MongoDB driver usage in custom repos.

**Enforcement**: Linting rule + code review.

---

### Rule 1.4: All Methods Receive firm_id
**Statement**: No repository method without firm_id parameter.

**Pattern**:
```python
async def find_entity(
    self,
    firm_id: str,  # ← MANDATORY
    entity_id: str,
    request_id: str  # ← MANDATORY
) -> Optional[Dict]:
    return await self.db.find_one({
        "firm_id": firm_id,  # ← ENFORCED AT DB LEVEL
        "_id": ObjectId(entity_id)
    })
```

**Exception**: None. All methods must have firm_id.

**Enforcement**: Linting + code review.

---

### Rule 1.5: All Methods Receive request_id
**Statement**: Every repository method receives request_id for audit trail.

**Pattern**:
```python
async def create_entity(
    self,
    firm_id: str,
    data: Dict,
    request_id: str  # ← For audit trail
):
    result = await self.db.insert_one({
        **data,
        "firm_id": firm_id,
        "created_at": datetime.utcnow()
    })
    # request_id automatically added to audit
```

**Enforcement**: Missing request_id = merge blocked.

---

### Rule 1.6: No Direct Property Access on Repository Results
**Statement**: Always null-check repository returns.

**Required**:
```python
user = await user_repo.find_by_email(firm_id, email, request_id)
if user:  # ← MANDATORY
    user_id = user.get("_id")
```

**Forbidden**:
```python
user = await user_repo.find_by_email(firm_id, email, request_id)
user_id = user["_id"]  # ← Can raise KeyError
```

**Enforcement**: Linting (mypy strict mode).

---

## CATEGORY 2: MULTI-TENANT RULES

### Rule 2.1: Never Hardcode firm_id
**Statement**: firm_id is always system-derived, never from user input.

**Forbidden**:
```python
# ❌ FORBIDDEN
firm_id = request.json().get("firm_id")  # User input
firm_id = "system"  # Hardcoded (except fallback)
firm_id = current.get("firm_id")  # Not from auth context
```

**Required**:
```python
# ✅ REQUIRED
firm_id = await resolve_tenant_from_webhook_event(db, event_type, data)
# OR
firm_id = get_tenant_context(request).firm_id
```

**Enforcement**: Code review + security audit.

---

### Rule 2.2: Webhooks Always Use ExternalTenantResolver
**Statement**: External events must resolve firm_id via transaction lookup.

**Required Pattern**:
```python
# Webhook entry point
event_data = body.get("data", {})
resolved_firm_id = await resolve_tenant_from_webhook_event(
    db, event_type, event_data
)
if not resolved_firm_id:
    resolved_firm_id = "system"  # Fallback with logging
    logger.warning(f"Could not resolve firm_id for {event_type}:{event_id}")

# Pass to handler
await handler(..., firm_id=resolved_firm_id, ...)
```

**Exception**: None. All webhooks use ExternalTenantResolver.

**Enforcement**: Code review + integration tests.

---

### Rule 2.3: No Manual Tenant Resolution Except ExternalTenantResolver
**Statement**: Never implement custom firm_id resolution logic.

**Forbidden**:
```python
# ❌ FORBIDDEN
if "firm_id" in headers:
    firm_id = headers["firm_id"]
if "firm_id" in data:
    firm_id = data["firm_id"]
```

**Required**: Use TenantKernel or ExternalTenantResolver.

**Enforcement**: Code review veto.

---

### Rule 2.4: All Operations Scoped by firm_id
**Statement**: No operation without firm_id filter.

**Required**:
```python
# All queries
{"firm_id": firm_id, ...other_filters...}

# All updates
{"$set": {...}, "$addToSet": {...}}  # Data change
# ← Must be on doc filtered by firm_id
```

**Enforcement**: Linting + database-level enforcement.

---

### Rule 2.5: No Cross-Tenant Data Leakage
**Statement**: Cannot read/write data from another firm.

**Verification**:
```python
# For every query:
assert "firm_id" in query_filter, "Missing firm_id filter"
assert query_filter["firm_id"] == authenticated_firm_id
```

**Enforcement**: Unit tests + integration tests mandatory.

---

## CATEGORY 3: IDEMPOTENCY & EVENT RULES

### Rule 3.1: All External Events Must Be Idempotent
**Statement**: Processing the same event twice = same result.

**Pattern**:
```python
# Check for duplicate
if await is_event_duplicate(db, event_id, repo, firm_id):
    return 200  # Already processed, idempotent response
# Process
await process_event(...)
```

**Enforcement**: Webhook processing must check duplicates.

---

### Rule 3.2: Webhook Events Must Include event_id
**Statement**: Every webhook has unique event_id for deduplication.

**Required**:
```python
event_id = qp.get("id") or body.get("data", {}).get("id")
assert event_id, "Missing event_id"

if await is_event_duplicate(db, event_id, repo, firm_id):
    return {"received": True, "status": "duplicate"}
```

**Enforcement**: Webhook validation.

---

### Rule 3.3: HMAC Validation on All Webhooks
**Statement**: Every webhook signature must be validated.

**Required**:
```python
hmac_payload = f"id={event_id}&type={event_type}"
signature = headers.get("x-signature")

if not await validate_hmac_signature(hmac_payload, signature):
    return 401, "Invalid signature"
```

**Enforcement**: Mandatory in webhook handlers.

---

## CATEGORY 4: AUDIT & OBSERVABILITY RULES

### Rule 4.1: All State-Changing Operations Must Generate Audit Entries
**Statement**: No write without audit trail.

**Required**:
```python
await audit_repo.log_action(
    firm_id=firm_id,
    action="entity_created",
    user_id="system" or user_id,
    details={...},
    request_id=request_id,
    ip_address=client_ip
)
```

**Exception**: None. Every write must be audited.

**Enforcement**: Code review + test coverage.

---

### Rule 4.2: Every Request Has request_id
**Statement**: All requests traceable via request_id.

**Pattern**:
```python
# HTTP request
request_id = uuid.uuid4().hex

# Webhook
request_id = f"webhook_{event_id}"

# Background job
request_id = f"cron_{job_name}_{datetime.now()}"
```

**Enforcement**: Automatic at entry point.

---

### Rule 4.3: request_id Propagates to All Repositories
**Statement**: Complete audit trail from request entry to database write.

**Required**:
```python
# Route
request_id = generate_request_id()

# Handler
await repo.operation(..., request_id=request_id)

# Audit
await audit_repo.log_action(..., request_id=request_id)
```

**Enforcement**: Linting for missing request_id.

---

### Rule 4.4: All Errors Must Be Logged
**Statement**: No silent failures.

**Required**:
```python
try:
    result = await handler(...)
except Exception as e:
    logger.error(f"Handler failed: {e}", exc_info=True)
    raise  # Don't swallow
```

**Enforcement**: Code review.

---

## CATEGORY 5: REST CONTRACT RULES

### Rule 5.1: Never Change REST Endpoint URLs
**Statement**: Endpoint paths are immutable.

**Frozen**:
```python
@router.post("/webhook")  # ← IMMUTABLE
@router.get("/status/{payment_id}")  # ← IMMUTABLE
@router.post("/init-checkout")  # ← IMMUTABLE
```

**Exception**: Only with major version change (rare).

**Enforcement**: Linting + deployment review.

---

### Rule 5.2: Never Change Response JSON Schema
**Statement**: Response structure cannot change in breaking ways.

**Frozen**:
```python
{
    "received": bool,
    "status": str,
    "error": str or None
}
```

**Allowed**: Add new optional fields (backward compatible)  
**Forbidden**: Remove fields, change types, rename fields

**Enforcement**: API contract tests.

---

### Rule 5.3: Never Change HTTP Status Codes
**Statement**: Status code meanings are immutable.

**Frozen**:
```python
200 OK → Webhook received (always)
400 Bad Request → Malformed request
401 Unauthorized → Invalid HMAC
500 Internal Error → Processing error
```

**Enforcement**: Integration tests.

---

### Rule 5.4: Never Change MercadoPago Integration
**Statement**: Payment gateway contracts are immutable.

**Frozen**:
- HMAC validation algorithm
- Event types supported
- Field mappings
- State transitions

**Exception**: Only if MP changes API (rare).

**Enforcement**: Smoke tests.

---

## CATEGORY 6: BREAKING CHANGES RULES

### Rule 6.1: Zero Breaking Changes Policy
**Statement**: No changes that break existing clients.

**Examples of Breaking Changes**:
- Remove endpoint
- Remove response field
- Change HTTP status code meaning
- Change event schema
- Change database collection structure (without migration)

**Policy**: All changes must be backward compatible.

**Enforcement**: Strict code review.

---

### Rule 6.2: Deprecated Features Have Sunset Dates
**Statement**: If something must change, announce 6 months in advance.

**Pattern**:
```python
# Old endpoint (deprecated 2024-01-01, sunset 2024-07-01)
@router.post("/old-endpoint")
async def old_handler():
    """DEPRECATED. Use /new-endpoint. Sunset: 2024-07-01"""
    logger.warning("Old endpoint used, will be removed")
    return await new_handler()
```

**Enforcement**: Documentation + warnings.

---

### Rule 6.3: Fallback Paths Never Removed
**Statement**: Legacy code paths persist until explicit sunsetting.

**Frozen**:
```python
if repo and firm_id:
    # New path
else:
    # Legacy path (preserved for backward compatibility)
```

**Exception**: Only after full module rewrite + explicit approval.

**Enforcement**: Code review.

---

## CATEGORY 7: ARCHITECTURE GOVERNANCE RULES

### Rule 7.1: No Architecture Changes Without Review
**Statement**: Architecture decisions require formal approval.

**Review Levels**:
1. **Small Changes** (single file, no new patterns): Code review only
2. **Medium Changes** (multiple files, new repository): Architecture review
3. **Large Changes** (new module, new patterns): Full governance review + security
4. **Breaking Changes** (API contracts, Core changes): Executive approval

**Enforcement**: Merge gate.

---

### Rule 7.2: Cannot Modify Frozen Components Without Board Approval
**Statement**: TenantKernel, BaseRepository, Golden Template, ExternalTenantResolver are immutable.

**Frozen Components**:
- ✅ TenantKernel v1.0
- ✅ BaseRepository
- ✅ Golden Repository Template v1.0
- ✅ ExternalTenantResolver v1.0

**To Modify**: Requires Architecture Review Board approval + new version number.

**Enforcement**: Code review veto.

---

### Rule 7.3: Cannot Modify Certified Modules Without Recertification
**Statement**: Certified modules require re-certification after changes.

**Certified Modules**:
- ✅ Payment Core

**To Modify**: Must recertify (8-phase audit).

**Enforcement**: Deployment gate.

---

### Rule 7.4: All New Patterns Must Be Documented
**Statement**: Innovation requires documentation.

**Required**:
1. Document new pattern
2. Provide examples
3. Document constraints
4. Document who can use it
5. Get architecture approval

**Enforcement**: Code review.

---

## CATEGORY 8: CODE QUALITY RULES

### Rule 8.1: All Public Methods Have Type Hints
**Statement**: TYPE_CHECKING for type safety.

**Required**:
```python
from typing import Optional, Dict, Any, TYPE_CHECKING

if TYPE_CHECKING:
    from repositories.transaction import TransactionRepository

async def handler(
    repo: Optional['TransactionRepository'] = None,
    data: Dict[str, Any] = None
) -> bool:
```

**Enforcement**: mypy strict mode.

---

### Rule 8.2: All Public Methods Have Docstrings
**Statement**: Document what, why, and constraints.

**Pattern**:
```python
async def create_entity(
    self,
    firm_id: str,
    data: Dict[str, Any],
    request_id: str
) -> Dict[str, Any]:
    """Create entity for firm.
    
    firm_id: Tenant identifier (required)
    data: Entity data
    request_id: For audit trail
    
    Returns: Created entity document
    Raises: ValueError if data invalid
    """
```

**Enforcement**: Code review.

---

### Rule 8.3: No Silent Failures
**Statement**: Always handle errors explicitly.

**Required**:
```python
try:
    result = await operation()
except SpecificException as e:
    logger.error(f"Operation failed: {e}")
    return False  # Explicit failure
except Exception:
    logger.exception("Unexpected error")
    raise  # Escalate
```

**Forbidden**:
```python
try:
    result = await operation()
except:
    pass  # Silent failure
```

**Enforcement**: Code review + linting.

---

## SUMMARY: MANDATORY RULES TABLE

| Rule | Category | Severity | Enforcement |
|------|----------|----------|------------|
| No direct MongoDB | Repository | CRITICAL | Code review veto |
| Always use repos | Repository | CRITICAL | Linting |
| Never hardcode firm_id | Multi-tenant | CRITICAL | Security review |
| Always HMAC validate | Webhooks | CRITICAL | Linting |
| Audit all writes | Observability | HIGH | Code review |
| Type hints | Quality | HIGH | mypy |
| No breaking changes | Compatibility | HIGH | Deployment gate |
| Frozen components immutable | Governance | CRITICAL | Board approval |
| request_id propagation | Observability | HIGH | Linting |
| Zero silent failures | Quality | HIGH | Code review |

---

## NON-NEGOTIABLE

These rules are the foundation of Punto Cero System OS v1.0. They cannot be bent, broken, or bypassed.

**Authority**: Architecture Governance Board  
**Revision**: Requires formal process  
**Exceptions**: Only via documented Architecture Review

---

**NEXT DOCUMENT**: ARCHITECTURE_GOVERNANCE.md
