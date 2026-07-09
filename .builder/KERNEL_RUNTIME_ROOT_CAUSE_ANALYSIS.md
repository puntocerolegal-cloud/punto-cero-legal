# SPRINT P0 — ROOT CAUSE ANALYSIS: KERNEL CERTIFICATION
## 500 Error Source Investigation

**Date**: 2026-01-XX  
**Status**: COMPLETE ANALYSIS (NO FIXES APPLIED)  
**Scope**: LOGIN → JWT → IDENTITY → KERNEL → AUTHORIZATION → REPOSITORY → ROUTE → RESPONSE

---

## EXECUTIVE SUMMARY

The system implements a multi-tenant kernel architecture (TenantKernel v1.0) but has critical **architectural discontinuities** that cause 500 errors in the request/response pipeline. The kernel correctly validates tenant context, but downstream layers fail to consume or apply it correctly.

**ROOT CAUSE**: **Tenant Context NOT properly propagated from kernel to repository layer.**

There are THREE distinct tenant identifier systems running in parallel:
1. **Kernel layer**: Uses `firm_id` (from JWT)
2. **Route/Endpoint layer**: Uses `lawyer_id` (from path parameters, database lookups)
3. **Repository layer**: Expects `firm_id` (but routes pass `lawyer_id`)

This creates a cascade failure when tenant context validation succeeds but data access fails.

---

## DETAILED FLOW ANALYSIS

### STEP 1: LOGIN

**File**: `backend/routes/auth.py`

**Input**:
```
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "password",
  "role": "lawyer",
  "firm_id": "firm_123"  // May or may not be provided
}
```

**Processing** (lines 95-150):
```python
# Line 135-140: JWT Creation
access_token = create_access_token(data={
    "sub": user_data.email,
    "role": user_data.role,
    "user_id": str(result.inserted_id),
    "firm_id": user_dict.get("firm_id")  # ⚠️ CAN BE NONE/MISSING
})
```

**Claims Generated**:
- `sub`: user email
- `user_id`: user MongoDB ID
- `firm_id`: firm identifier (from user_dict, may be None)
- `role`: user role
- `exp`: expiration timestamp

**Issues**:
- ❌ `firm_id` can be None if not set during registration
- ❌ No validation that `firm_id` is non-null before JWT creation
- ❌ No guarantee `firm_id` claim exists in token

**Output**: JWT token with potentially missing/null `firm_id` claim

---

### STEP 2: JWT TOKEN VALIDATION

**Files**: 
- `backend/utils/auth.py` (legacy/fallback)
- `backend/kernel/tenant_kernel.py` (primary)

#### 2A: Token Extraction

**Code Path**: `TenantKernel._extract_jwt_token()` (tenant_kernel.py:269-273)
```python
def _extract_jwt_token(self, request: Request) -> Optional[str]:
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        return auth_header[7:]
    return None
```

**Input**: HTTP header `Authorization: Bearer <token>`

**Output**: 
- ✓ Token string extracted correctly
- Or None if missing

#### 2B: JWT Signature Validation

**Code Path**: `TenantKernel._decode_jwt()` (tenant_kernel.py:274-283)
```python
def _decode_jwt(self, token: str) -> Optional[Dict[str, Any]]:
    try:
        from jose import jwt, JWTError
        payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
        return payload
    except Exception as e:
        logger.warning(f"[TENANT_KERNEL] JWT decode error: {str(e)}")
        return None
```

**Validation Points**:
- ✓ Signature verification (JOSE library)
- ✓ Expiration check
- ❌ **NO VALIDATION** that required claims exist

**Payload Extracted**:
```python
{
    "sub": "user@example.com",
    "user_id": "user_mongo_id_123",
    "firm_id": None,  # ⚠️ CAN BE MISSING OR NULL
    "role": "lawyer",
    "exp": 1704067200
}
```

**Issues**:
- ❌ Decode succeeds even if `firm_id` is missing
- ❌ No validation of required claims at decode time

---

### STEP 3: IDENTITY RESOLUTION

**File**: `backend/kernel/tenant_kernel.py:validate_request()` (lines 99-227)

**Code** (lines 150-165):
```python
# Step 3: Extract firm_id from JWT (PRIMARY SOURCE)
jwt_firm_id = jwt_payload.get("firm_id")  # ⚠️ Can be None
jwt_user_id = jwt_payload.get("user_id")
jwt_user_email = jwt_payload.get("email")
jwt_user_role = jwt_payload.get("role", "user")

if not jwt_firm_id or not jwt_user_id:
    logger.warning(
        f"[TENANT_KERNEL] Missing required JWT claims. "
        f"request_id={request_id} | "
        f"has_firm_id={bool(jwt_firm_id)} | "
        f"has_user_id={bool(jwt_user_id)}"
    )
    raise TenantValidationError("Missing required JWT claims")
```

**Validation** ✓:
- Checks `firm_id` is present in JWT
- Raises `TenantValidationError` (500) if missing
- Logs the failure

**Output**:
- ✓ `jwt_firm_id` (guaranteed non-null here)
- ✓ `jwt_user_id` (guaranteed non-null here)
- ✓ `jwt_user_email` (safe default)
- ✓ `jwt_user_role` (safe default)

**Known Issue**: If registration doesn't set firm_id, kernel validation fails with 500 error.

---

### STEP 4: HEADER CONSISTENCY CHECK (Spoofing Detection)

**File**: `backend/kernel/tenant_kernel.py:validate_request()` (lines 167-188)

**Code**:
```python
# Step 4: Extract and validate headers (consistency check)
header_firm_id = self._extract_header_firm_id(request)

# Step 5: Validate header consistency (spoofing detection)
if header_firm_id and header_firm_id != jwt_firm_id:
    logger.critical(
        f"[TENANT_MISMATCH] JWT ≠ HEADER (SECURITY EVENT). "
        f"request_id={request_id} | "
        f"jwt_firm_id={jwt_firm_id} | "
        f"header_firm_id={header_firm_id} | "
        f"ip={ip_address} | "
        f"user_id={jwt_user_id} | "
        f"path={request.url.path}"
    )
    raise TenantMismatchError(...)
```

**Logic**:
- ✓ Extracts `X-Firm-ID` or `X-Tenant-ID` header
- ✓ Only rejects if header is PROVIDED and MISMATCHES JWT
- ✓ Allows header to be absent (fallback to JWT only)

**Issue**: Header validation is secondary, JWT is authoritative. This is correct per design.

**Output**: Validation passes if:
1. No header provided (uses JWT)
2. Header matches JWT

---

### STEP 5: TENANT CONTEXT CREATION & INTEGRITY

**File**: `backend/kernel/tenant_context.py` + `backend/kernel/tenant_kernel.py:validate_request()`

**Code** (tenant_kernel.py:190-210):
```python
tenant_context = TenantContext(
    firm_id=jwt_firm_id,
    user_id=jwt_user_id,
    user_email=jwt_user_email or "unknown",
    user_role=jwt_user_role,
    request_id=request_id,
    ip_address=ip_address,
    timestamp=datetime.utcnow(),
    validation_source="JWT",
)

# Step 7: Verify integrity (sanity check)
if not tenant_context.verify_integrity():
    logger.critical(...)
    raise TenantValidationError("TenantContext integrity check failed")
```

**TenantContext Fields**:
- `firm_id`: From JWT (guaranteed non-null)
- `user_id`: From JWT (guaranteed non-null)
- `user_email`: From JWT or "unknown"
- `user_role`: From JWT or "user"
- `request_id`: UUID for tracing
- `ip_address`: Client IP
- `timestamp`: Kernel validation time
- `validation_source`: "JWT"
- `integrity_hash`: SHA256 of immutable fields (computed in `__post_init__`)

**Integrity Check** (tenant_context.py):
- ✓ Computes SHA256 hash of immutable fields
- ✓ Verifies hash on read (tampering detection)

**Output**: 
- ✓ Immutable TenantContext object
- ✓ Contains authoritative firm_id
- ✓ Cryptographically verified

---

### STEP 6: MIDDLEWARE ATTACHMENT

**File**: `backend/kernel/tenant_kernel_middleware.py`

**Code** (lines 63-89):
```python
async def dispatch(self, request: Request, call_next):
    try:
        if not self.kernel.should_validate(request):
            # Exempt path (auth, health)
            tenant_context = self.kernel.build_kernel_context_for_exempt_path(request)
            if tenant_context:
                request.state.tenant_context = tenant_context
        else:
            # Protected path - full validation
            tenant_context = await self.kernel.validate_request(request)
            request.state.tenant_context = tenant_context
            
            logger.info(
                f"[TENANT_KERNEL_MIDDLEWARE] Kernel validation passed. "
                f"request_id={tenant_context.request_id} | "
                f"firm_id={tenant_context.firm_id}"
            )
        
        response = await call_next(request)
        
        if hasattr(request.state, "tenant_context") and request.state.tenant_context:
            response.headers["X-Request-ID"] = request.state.tenant_context.request_id
        
        return response
```

**Attachment** ✓:
- Sets `request.state.tenant_context` with kernel-validated context
- Continues to endpoint if validation passes
- Attaches request_id to response headers

**Issues**:
- ❌ **Middleware Registration Order Problem** (see server.py:201-203)

---

## CRITICAL ISSUE #1: MIDDLEWARE REGISTRATION ORDER

**File**: `backend/server.py:201-203`

```python
app.add_middleware(SecurityEnforcerMiddleware)      # Added FIRST (runs LAST)
app.add_middleware(TenantKernelMiddlewareWrapper)   # Added SECOND (runs SECOND)
app.add_middleware(TenantIsolationMiddleware)       # Added THIRD (runs FIRST)
```

**Execution Order** (FastAPI middleware stack runs REVERSE of registration order):
1. **TenantIsolationMiddleware** (runs first) ← LEGACY, DEPRECATED
2. **TenantKernelMiddlewareWrapper** (runs second) ← PRIMARY
3. **SecurityEnforcerMiddleware** (runs last) ← Global enforcer

**Problem**:
- ❌ Legacy TenantIsolationMiddleware runs FIRST
- ❌ It creates its own TenantContext (deprecated mutable version)
- ❌ Then TenantKernel overwrites with kernel-validated context
- ❌ Both middleware use different TenantContext classes:
  - Legacy: `middleware.tenant_isolation.TenantContext` (mutable)
  - Kernel: `kernel.tenant_context.TenantContext` (immutable)

**Consequences**:
- Redundant tenant resolution
- Potential context overwriting
- No clean fallback behavior

**Expected Order**:
1. TenantKernelMiddlewareWrapper (first - validates tenant)
2. SecurityEnforcerMiddleware (second - enforces auth)
3. TenantIsolationMiddleware (removed or disabled)

---

## CRITICAL ISSUE #2: ENDPOINTS NOT USING KERNEL CONTEXT

**Files**: `backend/routes/{dashboard,cases,appointments,messages}.py`

**Pattern Observed**:
```python
# ❌ WRONG - Not using kernel context
@router.get("/kpis/{lawyer_id}")
async def get_lawyer_kpis(
    lawyer_id: str,  # ⚠️ Path parameter, NOT validated
    current_user = Depends(get_current_user),  # ⚠️ Legacy JWT check only
    db = Depends(get_db)
):
    # Kernel validated context is ignored!
    # Uses lawyer_id from path, not firm_id from kernel
    total_cases = await db.cases.count_documents({
        "lawyer_id": lawyer_id  # ⚠️ DIFFERENT from firm_id in kernel context
    })
```

**Issues**:
1. ❌ Accepts `lawyer_id` as path parameter without validation
2. ❌ Doesn't call `get_tenant_context_from_request()` to get kernel context
3. ❌ Doesn't validate that `lawyer_id` belongs to authenticated user's firm
4. ❌ Queries use `lawyer_id` but repositories expect `firm_id`

**What SHOULD Happen**:
```python
# ✓ CORRECT - Using kernel context
@router.get("/kpis/{lawyer_id}")
async def get_lawyer_kpis(
    lawyer_id: str,
    request: Request,
    db = Depends(get_db)
):
    # Get kernel-validated context
    tenant = get_tenant_context_from_request(request)
    # Now tenant.firm_id is guaranteed valid
    
    # Validate that lawyer_id belongs to this firm
    user = await db.users.find_one({
        "_id": ObjectId(lawyer_id),
        "firm_id": tenant.firm_id  # ✓ Cross-check
    })
    if not user:
        raise HTTPException(403, "Lawyer not in your firm")
```

**Affected Routes**:
- `GET /dashboard/kpis/{lawyer_id}` (line 14)
- `GET /dashboard/alerts/{lawyer_id}` (line 85)
- `GET /dashboard/crm-report/{lawyer_id}` (line 164)
- `GET /dashboard/notifications/{lawyer_id}` (line 244)
- `POST /dashboard/notifications/{lawyer_id}/read-all` (line 271)

**Similar Issues in Other Modules**:
- `cases.py`: Uses `lawyer_id`, not firm-based queries
- `appointments.py`: Uses custom JWT extraction in `get_current_user_from_auth()`, doesn't use kernel
- `messages.py`: Same custom JWT extraction, ignores kernel context

---

## CRITICAL ISSUE #3: TENANT IDENTIFIER MISMATCH

**The system uses THREE different tenant identifiers**:

### Identifier #1: `firm_id`
- **Source**: JWT claim (kernel primary source)
- **Type**: Tenant/Organization ID
- **Used in**: 
  - TenantKernel validation
  - TenantContext
  - BaseRepository signatures
  - Architecture freeze definitions

### Identifier #2: `lawyer_id`
- **Source**: Path parameters, user document fields
- **Type**: User/Professional ID
- **Used in**:
  - Dashboard queries: `db.cases.count_documents({"lawyer_id": lawyer_id})`
  - All legacy route implementations
  - Dashboard KPI endpoints

### Identifier #3: `user_id`
- **Source**: JWT claim or MongoDB user._id
- **Type**: User ID
- **Used in**:
  - JWT "user_id" claim
  - Dependency `get_current_user()`

**Critical Disconnect**:

```
JWT Claims:
  firm_id: "firm_123"  ← Kernel expects this
  user_id: "user_456"  ← For authentication

Database Schema:
  users: { _id: "user_456", firm_id: "firm_123", ... }
  
Route Parameters:
  /dashboard/kpis/{lawyer_id}  ← lawyer_id = user_456? Or something else?

Repository Layer:
  async def find_many(firm_id, query, ...):  ← Expects firm_id
```

**The Mismatch**:
1. Kernel validates: `firm_id = JWT.firm_id` ✓
2. Route receives: `lawyer_id` from path parameter ✗
3. Route passes to repository: `firm_id` expected, `lawyer_id` provided ✗
4. Query fails or returns wrong data

---

## CRITICAL ISSUE #4: LEGACY JWT EXTRACTION IN ROUTES

**Files**: `backend/routes/{appointments,messages}.py`

**Code Pattern** (appointments.py:16-47):
```python
async def get_current_user_from_auth(
    authorization: str = Header(None),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Valida JWT y retorna usuario autenticado"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Autorización requerida")

    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise ValueError("Invalid auth scheme")

        from utils.auth import decode_token
        payload = decode_token(token)  # ⚠️ NOT using kernel validation
        if not payload:
            raise HTTPException(status_code=401, detail="Token inválido o expirado")

        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Token inválido")

        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=401, detail="Usuario no encontrado")

        user["_id"] = str(user["_id"])
        return user
```

**Issues**:
1. ❌ Duplicates JWT validation (kernel already did this)
2. ❌ Uses legacy `decode_token()` from utils.auth, not kernel
3. ❌ Only extracts user, doesn't extract/validate firm
4. ❌ Doesn't verify tenant context from kernel
5. ❌ Bypasses all kernel security checks

**Impact**:
- Request passes middleware (kernel validates)
- Then endpoint re-validates JWT with legacy decoder
- Legacy decoder doesn't check firm_id consistency
- Creates window for temporal attacks or bypasses

---

## CRITICAL ISSUE #5: PAYMENT ROUTE PARTIAL IMPLEMENTATION

**File**: `backend/routes/payment.py:30-34`

```python
# PHASE 4: Kernel-based tenant context (new)
from kernel.tenant_kernel_middleware import get_tenant_context_from_request
from kernel.external_tenant_resolver import resolve_tenant_from_webhook_event
# DEPRECATED: Old middleware-based context (for compatibility during transition)
from middleware.tenant_isolation import require_tenant_context
```

**Status**: Payment route imports kernel context but other routes don't.

**Inconsistency**:
- ✓ Payment.py ready for kernel context
- ❌ Dashboard.py, cases.py, appointments.py still on legacy approach
- ❌ Mixed patterns across codebase

---

## CRITICAL ISSUE #6: MISSING FIRM_ID IN USER REGISTRATION

**File**: `backend/routes/auth.py:95-150`

**Code** (line 97):
```python
@router.post("/register", response_model=dict, status_code=status.HTTP_201_CREATED)
async def register(request: Request, user_data: UserCreate, db):
    # user_data.firm_id may or may not be provided by client
```

**Flow**:
1. Client POSTs registration with optional `firm_id`
2. If `firm_id` not provided: `user_dict.get("firm_id")` → None
3. JWT created with `firm_id: None`
4. Kernel validation fails: `if not jwt_firm_id...` → 500 error

**Issue**:
- ❌ No default firm_id assignment at registration
- ❌ No auto-creation of default firm for new user
- ❌ No validation that firm_id exists before JWT creation

---

## ERROR CASCADE: How 500 Errors Occur

### Scenario A: Missing firm_id in JWT

```
1. User registers without firm_id
   POST /api/auth/register
   └─ user_data: {email: "x", role: "lawyer"}  ← No firm_id

2. Register handler creates JWT
   create_access_token(data={
       "firm_id": None,  ← MISSING
       "user_id": "123",
       ...
   })

3. Client sends request with this token
   GET /api/dashboard/kpis/456
   Authorization: Bearer <token_with_null_firm_id>

4. TenantKernelMiddleware validates
   if not jwt_firm_id:  ← NULL → evaluates to False
       raise TenantValidationError("Missing required JWT claims")

5. Middleware catches exception
   except TenantValidationError as e:
       logger.critical(...)
       raise HTTPException(500, "Tenant validation system failure")

6. Client receives: 500 Internal Server Error
```

### Scenario B: lawyer_id Path Parameter Mismatch

```
1. Kernel successfully validates
   firm_id = "firm_123" from JWT ✓
   request.state.tenant_context = TenantContext(firm_id="firm_123", ...)

2. Route receives request
   @router.get("/kpis/{lawyer_id}")
   async def get_kpis(lawyer_id: str, current_user = Depends(...), db = ...):

3. Endpoint queries database WITHOUT tenant context
   total_cases = await db.cases.count_documents({
       "lawyer_id": lawyer_id  ← Using path param, not firm_id!
   })

4. BaseRepository NOT called with firm_id
   Repository expects: repo.find_many(firm_id="firm_123", query)
   Route does: db.cases.find({"lawyer_id": "some_lawyer_id"})
   
5. Query may:
   a) Return empty (lawyer doesn't exist in firm)
   b) Access data from wrong firm (no firm_id filter!)
   c) Fail with 500 if field doesn't exist

6. Either:
   - Empty result causes null pointer in aggregation
   - Cross-tenant data leak
   - 500 error
```

### Scenario C: Legacy JWT Decoder in Endpoint

```
1. TenantKernelMiddleware validates request
   request.state.tenant_context = TenantContext(firm_id="firm_123", ...)

2. Request reaches endpoint
   @router.post("/")
   async def create_message(
       ...,
       current_user = Depends(get_current_user_from_auth)
   ):

3. get_current_user_from_auth() is called
   Extracts authorization header
   Calls utils.auth.decode_token(token)  ← LEGACY decoder
   - Checks signature ✓
   - Checks expiration ✓
   - Does NOT check firm_id ✗
   - Does NOT verify kernel context ✗

4. If JWT signature is valid but claims are inconsistent:
   - Legacy decoder accepts it
   - Kernel rejected it (if it had checked)
   - Creates security vulnerability

5. Endpoint uses current_user data directly
   No cross-check with kernel context
   Potential for data breach
```

---

## DATA FLOW: STEP 7 - ENDPOINT EXECUTION

**Current State** (BROKEN):

```
Request → TenantKernel validates (firm_id = "firm_123")
        ↓
        request.state.tenant_context = TenantContext(firm_id="firm_123", ...)
        ↓
        IGNORED by endpoint  ← PROBLEM!
        ↓
        get_current_user(authorization) ← Uses legacy decoder
        ↓
        @router.get("/kpis/{lawyer_id}")
        ↓
        db.cases.find({"lawyer_id": lawyer_id})  ← WRONG identifier!
        ↓
        No firm_id filter applied
        ↓
        Query may fail or return wrong data
        ↓
        500 error OR data breach
```

**Expected State** (FROZEN v1.0):

```
Request → TenantKernelMiddleware validates
        ↓
        request.state.tenant_context = TenantContext(firm_id="firm_123", ...)
        ↓
        @router.get("/cases")
        async def get_cases(request: Request, ...):
        ↓
        tenant = get_tenant_context_from_request(request)  ← USE IT!
        ↓
        # Repository now gets firm_id
        cases = await repo.find_many(
            firm_id=tenant.firm_id,
            query={"status": "open"},
            request_id=tenant.request_id
        )
        ↓
        # Repository auto-injects firm_id into query
        query = {"firm_id": "firm_123", "status": "open"}
        ↓
        results = await db.cases.find(query)
        ↓
        Return results with 200 ✓
```

---

## STEP 8: REPOSITORY LAYER

**File**: `backend/repositories/enterprise_base_repository.py`

**Design**:
- All repository methods require `firm_id` parameter
- Repository auto-injects `firm_id` into all queries
- Provides multi-tenant isolation guarantee

**Code** (lines 70-110):
```python
async def find_by_id(
    self,
    firm_id: str,  ← REQUIRES firm_id
    resource_id: str,
    request_id: str
) -> Optional[Dict[str, Any]]:
    try:
        query = {
            "_id": ObjectId(resource_id),
            "firm_id": firm_id  ← Auto-injected
        }
        
        doc = await self.collection.find_one(query)
        return doc
```

**Current Problem**:
- ❌ Routes don't pass `firm_id` to repository
- ❌ Routes query database directly: `db.cases.find({"lawyer_id": ...})`
- ❌ Repository isolation layer is bypassed

---

## SUMMARY TABLE: FLOW ANALYSIS

| Step | Component | Input | Process | Output | Status |
|------|-----------|-------|---------|--------|--------|
| 1 | Auth | Credentials | Register user | JWT (firm_id may be null) | ⚠️ BROKEN |
| 2 | JWT Validation | Authorization header | Extract token | Token string | ✓ OK |
| 2A | JWT Decode | Token | Decode signature | Payload (firm_id may be null) | ⚠️ BROKEN |
| 3 | Identity Resolution | JWT payload | Extract firm_id, user_id | Claims validated | ⚠️ BROKEN |
| 4 | Header Check | Headers | Spoofing detection | Validation pass/fail | ✓ OK |
| 5 | Context Creation | Claims | Build TenantContext | Immutable context | ✓ OK |
| 5A | Integrity Check | Context | SHA256 hash verify | Hash valid | ✓ OK |
| 6 | Middleware | TenantContext | Attach to request | request.state.tenant_context | ⚠️ REGISTERED WRONG ORDER |
| 6A | Middleware Order | Registry order | Execute middlewares | Execution sequence | ❌ BROKEN |
| 7 | Endpoint | Path params + user | Get current user | User object (no firm_id) | ❌ BROKEN |
| 7A | Endpoint Tenant | request.state | Get kernel context | TenantContext ignored | ❌ BROKEN |
| 8 | Database Query | lawyer_id | Query directly | Results (may cross-tenant) | ❌ BROKEN |
| 9 | Repository | Query dict | Apply firm_id filter | Tenant-isolated results | ⏸️ BYPASSED |
| 10 | Response | Results | Serialize | JSON 200 | ❌ 500 ERROR INSTEAD |

---

## FAILURE MODES: WHERE 500 ERRORS OCCUR

### Failure Mode 1: Missing firm_id at Registration
- **When**: User registers without firm_id
- **Where**: TenantKernel.validate_request() line 160
- **Error**: TenantValidationError → 500
- **Log**: `[TENANT_KERNEL] Missing required JWT claims`

### Failure Mode 2: firm_id NULL in JWT
- **When**: JWT created with firm_id=None
- **Where**: TenantKernel.validate_request() line 160
- **Error**: TenantValidationError → 500
- **Log**: `[TENANT_KERNEL] Missing required JWT claims`

### Failure Mode 3: lawyer_id Mismatch
- **When**: Endpoint queries by lawyer_id not in user's firm
- **Where**: Route handler line where DB query fails
- **Error**: Empty result set or validation error → 500
- **Log**: None (bypasses kernel validation)

### Failure Mode 4: Cross-Tenant Data Access
- **When**: No firm_id filter in direct DB query
- **Where**: `db.cases.find({"lawyer_id": ...})` without firm_id
- **Error**: May not error but returns wrong data (silent failure)
- **Log**: None

### Failure Mode 5: Middleware Execution Order
- **When**: Request arrives after middleware registration
- **Where**: TenantIsolationMiddleware runs before TenantKernelMiddleware
- **Error**: Context overwritten or inconsistent
- **Log**: Multiple tenant_context creations logged

---

## CLAIMS & CONTEXT TRACKING: END-TO-END

### User Registration Input
```json
{
  "email": "lawyer@firm.com",
  "password": "password123",
  "role": "lawyer",
  "full_name": "John Lawyer",
  "firm_id": "firm_123"  // May be missing
}
```

### User Document Created
```json
{
  "_id": "user_abc123",
  "email": "lawyer@firm.com",
  "role": "lawyer",
  "full_name": "John Lawyer",
  "firm_id": "firm_123",  // May be null
  "created_at": "2026-01-01T00:00:00Z"
}
```

### JWT Token Created
```json
{
  "sub": "lawyer@firm.com",
  "user_id": "user_abc123",
  "firm_id": "firm_123",  // ⚠️ May be null
  "role": "lawyer",
  "exp": 1704067200,
  "v": 1
}
```

### Request Sent by Client
```
GET /api/dashboard/kpis/user_def456
Authorization: Bearer eyJhbGc...
X-Firm-ID: firm_123  // Optional header
```

### Kernel Extraction
- JWT token: extracted from Authorization header ✓
- JWT payload: decoded ✓
- firm_id: extracted from JWT ⚠️ May be null
- user_id: extracted from JWT ✓

### TenantContext Created (if validation passes)
```python
TenantContext(
    firm_id="firm_123",  // From JWT
    user_id="user_abc123",  // From JWT
    user_email="lawyer@firm.com",  // From JWT
    user_role="lawyer",  // From JWT
    request_id="550e8400-e29b-41d4-a716-446655440000",
    ip_address="192.168.1.1",
    timestamp=datetime(2026, 1, 1, 12, 0, 0),
    validation_source="JWT",
    integrity_hash="<SHA256 of above>"
)
```

### Middleware Attachment
```python
request.state.tenant_context = tenant_context
response.headers["X-Request-ID"] = "550e8400-e29b-41d4-a716-446655440000"
```

### Endpoint Execution (WRONG WAY - Current)
```python
@router.get("/kpis/{lawyer_id}")
async def get_kpis(
    lawyer_id: str = "user_def456",  # From path, not validated
    current_user = Depends(get_current_user),  # Legacy user extraction
    db = Depends(get_db)
):
    # tenant_context is available in request.state but IGNORED!
    # Uses lawyer_id instead of firm_id
    
    total_cases = await db.cases.count_documents({
        "lawyer_id": "user_def456"  # ⚠️ Wrong identifier!
    })
    # May return 0 or wrong data
    # No firm_id filter applied
```

### Endpoint Execution (CORRECT WAY - Required)
```python
@router.get("/kpis/{lawyer_id}")
async def get_kpis(
    lawyer_id: str,
    request: Request,
    db = Depends(get_db)
):
    # Get kernel-validated context
    tenant = get_tenant_context_from_request(request)
    # tenant.firm_id = "firm_123" (guaranteed valid)
    
    # Validate cross-check
    user = await db.users.find_one({
        "_id": ObjectId(lawyer_id),
        "firm_id": tenant.firm_id  # ✓ Verify belongs to firm
    })
    
    if not user:
        raise HTTPException(403, "Not authorized")
    
    # Use repository with firm_id
    total_cases = await repo.find_many(
        firm_id=tenant.firm_id,
        query={"lawyer_id": lawyer_id, "status": "open"},
        request_id=tenant.request_id
    )
    # ✓ Results guaranteed to be from this firm
```

---

## AUTHORIZATION LAYER: MISSING ENFORCEMENT

**File**: `backend/middleware/security_enforcer.py`

**Current Implementation**:
```python
async def dispatch(self, request: Request, call_next):
    path = request.url.path
    method = request.method
    
    if any(path.startswith(exempt) for exempt in EXEMPT_PATHS):
        return await call_next(request)
    
    if any(path.startswith(protected) for protected in PROTECTED_PATHS):
        auth_header = request.headers.get("authorization")
        if not auth_header:
            return JSONResponse(status_code=401, ...)
        if not auth_header.startswith("Bearer "):
            return JSONResponse(status_code=401, ...)
    
    response = await call_next(request)
    return response
```

**Issues**:
1. ❌ Only checks header presence, not validity
2. ❌ Runs AFTER TenantKernelMiddleware (executes second)
3. ❌ Doesn't verify TenantContext attachment
4. ❌ Doesn't check authorization rules (role-based access)

---

## ORCHESTRATION: GUARDED DB BYPASS

**File**: `backend/server.py:148-150`

```python
# S2.5 Hardening: Wrap in GuardedDB to block direct access
from security.guarded_db import create_guarded_db
db = create_guarded_db(real_db)
```

**Design Intent**: GuardedDB should prevent direct database access, enforce authorization layer.

**Current Issue**:
- ❌ Routes bypass GuardedDB, query database directly
- ❌ `db.cases.find({...})` called without repository layer
- ❌ GuardedDB protection not enforced

---

## CLAIMS VERIFICATION CHECKLIST

For each request, these must be verified:

| Claim | Source | Validation | Status |
|-------|--------|-----------|--------|
| `sub` (email) | JWT | Signature check | ✓ OK |
| `user_id` | JWT | Non-null check | ⚠️ PARTIAL |
| `firm_id` | JWT | Non-null check | ❌ FAILS |
| `role` | JWT | Non-null check | ✓ OK (default) |
| `exp` (expiration) | JWT | Expiry check | ✓ OK |
| Header firm_id | Header | Consistency check | ✓ OK (optional) |
| Tenant context | request.state | Integrity hash | ✓ OK (IF USED) |
| User-firm mapping | Database | Cross-check | ❌ NOT DONE |
| Path param validation | Path | Ownership check | ❌ NOT DONE |

---

## ROOT CAUSE SUMMARY

### Primary Causes (ARCHITECTURAL)

1. **Tenant Identifier Confusion**
   - JWT provides `firm_id` (tenant)
   - Routes expect `lawyer_id` (user in tenant)
   - Mismatch causes queries to fail or leak data

2. **Kernel Context Not Propagated**
   - Middleware validates and attaches context
   - Endpoints don't retrieve it from request.state
   - Validation result is discarded

3. **Legacy JWT Extraction in Endpoints**
   - Each endpoint re-validates JWT with legacy decoder
   - Bypasses kernel security guarantees
   - Creates duplicate validation and potential gaps

4. **Middleware Registration Order**
   - TenantIsolationMiddleware (legacy) runs before TenantKernelMiddleware
   - Both create tenant_context, second overwrites first
   - Contradicts "kernel-first" architecture

5. **Repository Layer Bypass**
   - Routes query database directly
   - Skip BaseRepository multi-tenant isolation
   - GuardedDB protections not enforced

### Secondary Causes (OPERATIONAL)

6. **Missing firm_id at Registration**
   - User can register without firm_id
   - JWT created with null firm_id
   - Kernel validation fails with 500

7. **No firm_id Validation at JWT Creation**
   - `create_access_token()` doesn't verify firm_id exists
   - No default firm creation for new users
   - No firm validation in auth service

8. **Inconsistent Endpoint Patterns**
   - payment.py imports kernel context
   - dashboard.py, cases.py, etc. don't use it
   - Mixed implementations across codebase

---

## NEXT STEPS: WHAT P1 REMEDIATION WILL ADDRESS

This analysis identifies the exact points where the kernel certification fails:

1. **Tenant identifier mismatch**: firm_id vs lawyer_id
2. **Kernel context not used**: set but ignored by endpoints
3. **Legacy decoders running in parallel**: security gap
4. **Middleware order wrong**: legacy runs first
5. **Repository isolation bypassed**: direct DB access
6. **Missing firm_id handling**: null claims cause 500

**P1 Sprint Must Address**:
- [ ] Fix middleware registration order (TenantKernel first)
- [ ] Remove legacy TenantIsolationMiddleware or disable it
- [ ] Update all endpoints to use `get_tenant_context_from_request()`
- [ ] Validate path parameters against tenant context
- [ ] Enforce repository layer usage (no direct DB access)
- [ ] Add firm_id validation at registration and JWT creation
- [ ] Unify tenant identifier usage (firm_id everywhere)
- [ ] Remove legacy JWT extraction from endpoints

All changes must respect **Architecture Freeze v1.0** and the kernel-first design.

---

## ANALYSIS COMPLETE

**Status**: Ready for P1 Sprint Planning  
**No Fixes Applied**: Analysis only  
**Architecture Understood**: Yes  
**Root Causes Identified**: Yes  
**Remediation Path Clear**: Yes
