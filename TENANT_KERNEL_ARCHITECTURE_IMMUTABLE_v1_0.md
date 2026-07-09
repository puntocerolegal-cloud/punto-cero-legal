# Tenant Kernel Architecture v1.0
## Ejecución Inmutable del Aislamiento Multi-Tenant

**Tipo de Documento:** Especificación Arquitectónica de Kernel  
**Versión:** 1.0  
**Autoridad:** Principal Software Architect  
**Clasificación:** Core System Architecture  

**OBJETIVO FUNDAMENTAL:**

Convertir la validación de tenant de una **convención arquitectónica** en una **garantía de ejecución estructural** que:

- ✅ No puede ser bypassada por endpoints
- ✅ No puede ser eludida por servicios
- ✅ No puede ser sorteada por repositorios
- ✅ No puede ser violada por auth layer
- ✅ No puede ser comprometida por desarrolladores
- ✅ No depende de request.state
- ✅ No depende de middleware order
- ✅ No depende de disciplina del desarrollador

**Principio Fundamental:**

> **Ninguna operación en el sistema puede ejecutarse sin TenantKernel.validated = TRUE**

---

## FASE 1: DEFINICIÓN DEL TENANT KERNEL

### 1.1 ¿Qué es Tenant Kernel?

El **Tenant Kernel (TK)** es una capa de ejecución **obligatoria**, **global**, **inmutable** que:

```
┌─────────────────────────────────────────────────────────────┐
│                   TENANT KERNEL (TK)                        │
│                                                             │
│  Ubicación: ANTES de cualquier endpoint, servicio, repo   │
│  Ejecuta: PARA TODA request entrante                      │
│  Responsabilidad: Validar tenant de forma AUTOMÁTICA      │
│  Resultado: TenantContext (immutable, audited)            │
│                                                             │
│  NO es:                                                    │
│  ✗ Middleware (ejecuta siempre, pero NO es parte del    │
│    flujo HTTP normal)                                     │
│  ✗ Auth layer (no autentica, valida aislamiento)        │
│  ✗ Business logic (puro enforcement de seguridad)        │
│  ✗ Configurable (SIEMPRE activo)                         │
│                                                             │
│  SÍ es:                                                    │
│  ✓ Kernel (nivel más profundo del sistema)               │
│  ✓ Inmutable (no puede ser modificado en runtime)        │
│  ✓ Global (cubre TODAS las requests)                     │
│  ✓ Obligatorio (no se puede deshabilitar)                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Responsabilidades Explícitas

| Responsabilidad | Descripción | Garantía |
|-----------------|-------------|----------|
| **Pre-execution validation** | Valida ANTES de cualquier endpoint | Ningún código corre sin validación |
| **Automatic resolution** | Resolve tenant sin llamada explícita | Developer no puede olvidar llamada |
| **Immutable context** | Crea TenantContext que NO se modifica | Context no puede ser alterado |
| **Blocking enforcement** | Bloquea request si validation falla | No hay fallback, no hay omisión |
| **Cryptographic verification** | Verifica integridad de tenant | Spoofing imposible |
| **Audit trail** | Logea toda resolución y fallo | Forensics siempre disponible |
| **Global scope** | Cubre 100% de requests | No hay endpoints sin validación |

---

## FASE 2: PRINCIPIO FUNDAMENTAL NO NEGOCIABLE

### 2.1 Regla Absoluta del Kernel

```
╔════════════════════════════════════════════════════════════════════╗
║                    TENANT KERNEL AXIOM                            ║
║                                                                    ║
║  No request executes unless:                                      ║
║                                                                    ║
║  TenantKernel.validated == TRUE                                   ║
║        AND                                                         ║
║  TenantContext.integrity_hash == CRYPTOGRAPHICALLY_VALID          ║
║        AND                                                         ║
║  TenantContext.firm_id ∈ VALID_TENANTS                           ║
║        AND                                                         ║
║  TenantContext.source IN ["jwt", "header"]  (never mixed)        ║
║                                                                    ║
║  IF ANY of above is FALSE:                                        ║
║      → REQUEST BLOCKED IMMEDIATELY                                ║
║      → NO BUSINESS LOGIC EXECUTES                                 ║
║      → SECURITY EVENT LOGGED                                      ║
║      → APPROPRIATE ERROR RETURNED (401/403/500)                   ║
║                                                                    ║
║  This is NON-OPTIONAL, NON-NEGOTIABLE, NON-BYPASSABLE.          ║
║                                                                    ║
╚════════════════════════════════════════════════════════════════════╝
```

### 2.2 Implementación del Principio

```
PSEUDOCODE (Conceptual):

async function request_execution(request):
    
    # PHASE 0: KERNEL VALIDATION (BEFORE ANYTHING ELSE)
    try:
        tenant_context = await TenantKernel.validate(request)
    except TenantKernelException as e:
        log_security_event("KERNEL_FAILURE", e)
        return error_response(e.status_code)
    
    # PHASE 1: VERIFY KERNEL STATE
    assert TenantKernel.validated == True, "Kernel validation incomplete"
    assert tenant_context is not None, "Kernel returned None context"
    assert tenant_context.integrity_hash_valid, "Context integrity compromised"
    
    # PHASE 2: NOW EXECUTE ENDPOINT (with guaranteed tenant)
    endpoint_function = route_mapping[request.path]
    result = await endpoint_function(
        request=request,
        tenant_context=tenant_context  # ← INJECTED BY KERNEL
    )
    
    return result
```

---

## FASE 3: PIPELINE OBLIGATORIO DEL KERNEL

### 3.1 Flujo de Validación Detallado

```
┌─────────────────────────────────────────────────────────────────┐
│                  REQUEST INCOMING (ANY METHOD)                   │
│                                                                 │
│  POST /payment/init                                             │
│  GET /cases/123                                                 │
│  PUT /documents/456                                             │
│  DELETE /users/789                                              │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 │ IMMEDIATE: HTTP stack receives request
                 │ NO ROUTING YET
                 │ NO AUTH YET
                 │ NO BUSINESS LOGIC YET
                 │
                 v
┌──────────────────────────────────────────────────────────────────┐
│           TENANT KERNEL INTERCEPTOR (GLOBAL)                     │
│                                                                  │
│  Executes: BEFORE any middleware                                │
│  Responsibility: Validate tenant exhaustively                   │
│  Authority: Core system kernel (highest priority)               │
│                                                                  │
│  STEP 1: Extract JWT Token                                      │
│  ────────────────────────────                                    │
│  ├─ Read: Authorization header                                  │
│  ├─ Parse: Extract bearer token                                 │
│  ├─ Validate: Token format is valid                             │
│  └─ IF MISSING → STOP, return 401 Unauthorized                 │
│                                                                  │
│  STEP 2: Decrypt and Validate JWT                               │
│  ─────────────────────────────────                               │
│  ├─ Verify: Signature using HMAC-SHA256                         │
│  ├─ Verify: Token not expired (exp claim)                       │
│  ├─ Verify: Issuer matches system (iss claim)                   │
│  └─ IF INVALID → STOP, return 401 Unauthorized                 │
│                                                                  │
│  STEP 3: Extract firm_id from JWT                               │
│  ───────────────────────────────────                             │
│  ├─ Read: JWT claim "firm_id"                                   │
│  ├─ Read: JWT claim "user_id" (sub)                             │
│  ├─ Type check: firm_id is non-null string                      │
│  └─ IF MISSING → STOP, return 403 Forbidden                    │
│                                                                  │
│  STEP 4: Extract X-Firm-ID Header                               │
│  ──────────────────────────────────                              │
│  ├─ Read: HTTP header X-Firm-ID                                 │
│  ├─ Type check: is non-null string                              │
│  └─ IF MISSING → STOP, return 403 Forbidden (incomplete)       │
│                                                                  │
│  STEP 5: Cross-Validate JWT vs Header                           │
│  ────────────────────────────────────────                        │
│  ├─ Compare: JWT.firm_id == X-Firm-ID header                   │
│  ├─ IF MISMATCH → STOP, return 403 Forbidden                   │
│  │               log SECURITY_EVENT[TENANT_SPOOFING_ATTEMPT]    │
│  └─ IF MATCH → Continue                                         │
│                                                                  │
│  STEP 6: Validate firm_id in VALID_TENANTS                      │
│  ────────────────────────────────────────────                    │
│  ├─ Query: Is firm_id in VALID_TENANTS?                        │
│  ├─ IF NOT → STOP, return 403 Forbidden                        │
│  │           log SECURITY_EVENT[UNKNOWN_TENANT]                 │
│  └─ IF YES → Continue                                           │
│                                                                  │
│  STEP 7: Verify User Belongs to Tenant                          │
│  ────────────────────────────────────────                        │
│  ├─ Query: Does user_id belong to firm_id?                     │
│  ├─ IF NOT → STOP, return 403 Forbidden                        │
│  │           log SECURITY_EVENT[USER_NOT_IN_TENANT]             │
│  └─ IF YES → Continue                                           │
│                                                                  │
│  STEP 8: Generate TenantContext (Immutable)                     │
│  ──────────────────────────────────────────                      │
│  ├─ Create: TenantContext object                                │
│  │   ├─ firm_id = JWT.firm_id                                   │
│  │   ├─ user_id = JWT.sub                                       │
│  │   ├─ request_id = UUID.uuid4() (kernel-generated)            │
│  │   ├─ validation_source = "jwt"                               │
│  │   ├─ kernel_timestamp = now()                                │
│  │   └─ integrity_hash = HMAC_SHA256(tenant_data, secret)      │
│  │                                                              │
│  ├─ Freeze: @dataclass(frozen=True) inmutable                  │
│  └─ Seal: Object cannot be modified after creation             │
│                                                                  │
│  STEP 9: Mark Kernel as VALIDATED                               │
│  ───────────────────────────────────                             │
│  ├─ Set: TenantKernel.validated = True                         │
│  ├─ Set: TenantKernel.validated_at = now()                     │
│  ├─ Set: TenantKernel.context = tenant_context                 │
│  └─ INVARIANT: validated == True for rest of request           │
│                                                                  │
│  STEP 10: Audit Trail                                           │
│  ─────────────────────                                          │
│  ├─ Log: Tenant resolution completed                            │
│  ├─ Log: firm_id = X                                            │
│  ├─ Log: user_id = Y                                            │
│  ├─ Log: source = jwt                                           │
│  ├─ Log: timestamp = T                                          │
│  └─ Log: request_id = U (for tracing)                           │
│                                                                  │
│  Return: TenantContext (ready for execution)                    │
│                                                                  │
│  ✓ Tenant context is IMMUTABLE                                  │
│  ✓ Tenant context is CRYPTOGRAPHICALLY VERIFIED                │
│  ✓ Tenant context is GLOBALLY AVAILABLE                        │
│  ✓ NO request can execute without this context                 │
│                                                                  │
└──────────────────┬───────────────────────────────────────────────┘
                   │
                   │ Kernel validation complete
                   │ TenantKernel.validated = TRUE
                   │
                   v
┌──────────────────────────────────────────────────────────────────┐
│                  ALLOW REQUEST EXECUTION                         │
│                                                                  │
│  Now safe to execute:                                           │
│  ├─ Routing                                                      │
│  ├─ Endpoint handler                                             │
│  ├─ Business logic                                               │
│  └─ All with GUARANTEED tenant context                          │
│                                                                  │
│  Endpoint receives:                                             │
│  ├─ request (original)                                           │
│  ├─ tenant_context (kernel-injected, immutable)                │
│  └─ No need to resolve tenant again                            │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## FASE 4: ELIMINACIÓN COMPLETA DE DEPENDENCIAS FRÁGILES

### 4.1 Qué Debe Ser PROHIBIDO

```
╔════════════════════════════════════════════════════════════════════╗
║        PROHIBITED PATTERNS (Kernel Will Detect & Block)           ║
╠════════════════════════════════════════════════════════════════════╣

❌ PATTERN 1: request.state.tenant_context
   ─────────────────────────────────────────
   Code:   tenant = request.state.tenant_context
   Problem: Runtime dependency, fragile, order-dependent
   Kernel:  DETECTED → TypeError (TenantKernel not in request.state)
   Fix:     Use Depends(get_tenant_context) instead

❌ PATTERN 2: current_user.get("firm_id")
   ─────────────────────────────────────────
   Code:   firm_id = current_user.get("firm_id")
   Problem: Auth layer should NOT define tenant
   Kernel:  Not accessible (firm_id ONLY in TenantContext)
   Fix:     Use tenant_context.firm_id from kernel

❌ PATTERN 3: Manual resolve_tenant() calls
   ─────────────────────────────────────
   Code:   tenant = resolve_tenant(request)
   Problem: Duplication, inconsistency
   Kernel:  REDUNDANT (kernel already resolved)
   Fix:     Remove, use kernel-injected context

❌ PATTERN 4: Fallback to "default" tenant
   ─────────────────────────────────────────
   Code:   firm_id = context.get("firm_id") or "default"
   Problem: Default tenant never exists
   Kernel:  BLOCKS (default ∉ VALID_TENANTS)
   Fix:     Always require valid firm_id

❌ PATTERN 5: Tenant derivation in endpoint
   ──────────────────────────────────────────
   Code:   firm_id = extract_from_headers_manually()
   Problem: Endpoint should not resolve tenant
   Kernel:  INJECTION (kernel provides context as Depends)
   Fix:     Accept tenant_context parameter, use it

❌ PATTERN 6: Tenant logic in services
   ────────────────────────────────────
   Code:   def service_method(firm_id): ...
   Problem: Service receives firm_id, can be manipulated
   Kernel:  CONTEXT INJECTION (service receives tenant context)
   Fix:     Receive tenant_context from endpoint

❌ PATTERN 7: Conditional tenant handling
   ──────────────────────────────────────
   Code:   if tenant: use_tenant() else: use_default()
   Problem: Conditional logic breaks guarantee
   Kernel:  TENANT ALWAYS PRESENT (kernel validates before execution)
   Fix:     Remove conditional, tenant is guaranteed

❌ PATTERN 8: Tenant override in repository
   ──────────────────────────────────────────
   Code:   repo.create(firm_id=user_specified)
   Problem: Repository could accept wrong firm_id
   Kernel:  PARAMETER VALIDATION (repo receives from kernel)
   Fix:     Repo uses firm_id from kernel context only

╚════════════════════════════════════════════════════════════════════╝
```

### 4.2 Qué Debe Ser ELIMINADO del Sistema

| Componente | Razón Eliminación | Acción |
|-----------|-------------------|--------|
| **TenantIsolationMiddleware** | Kernel reemplaza | Convertir en simple cache validator |
| **resolve_tenant() function** | Kernel la ejecuta automáticamente | Remover si no es usada |
| **request.state.tenant_context** | Kernel provee via Depends | Remover acceso directo |
| **try/except for tenant** | Kernel bloquea antes | Remover, no hay fallo en endpoint |
| **Multiple firm_id sources** | Kernel unifica | Usar SOLO kernel context |
| **Fallback logic** | Kernel no permite fallback | Remover all defaults |
| **Optional tenant** | Kernel requiere SIEMPRE | Remover optionality |

---

## FASE 5: TENANTCONTEXT COMO OBJETO DE KERNEL

### 5.1 Especificación Formal

```
TenantContext (Kernel Object):

@dataclass(frozen=True)  # ← IMMUTABLE, CANNOT BE CHANGED
class TenantContext:
    """
    Tenant context generated and sealed by TenantKernel.
    This object is:
    - Immutable (frozen=True)
    - Non-overridable
    - Cryptographically verified
    - Globally available to request
    - Audit-ready
    """
    
    # ═══════════════════════════════════════════════════════════════
    # MANDATORY FIELDS (NEVER None)
    # ═══════════════════════════════════════════════════════════════
    
    firm_id: str
        """Tenant identifier (from JWT claim, validated against header)
        - Extracted from JWT as authoritative source
        - Validated against X-Firm-ID header
        - Must exist in VALID_TENANTS
        - INVARIANT: firm_id ≠ None, firm_id ∉ "default"
        """
    
    user_id: str
        """Authenticated user identifier (from JWT sub claim)
        - Must belong to firm_id
        - Used for audit trail
        - INVARIANT: user_id ≠ None
        """
    
    request_id: str
        """Unique request identifier (kernel-generated UUID)
        - NOT from client (cannot be spoofed)
        - Used for distributed tracing
        - Globally unique
        - INVARIANT: request_id is valid UUID
        """
    
    # ═══════════════════════════════════════════════════════════════
    # VALIDATION FIELDS (Audit & Integrity)
    # ═══════════════════════════════════════════════════════════════
    
    validation_source: Literal["jwt", "header"] = "jwt"
        """Where firm_id was ultimately validated
        - "jwt" means JWT claim is authoritative
        - "header" means header validation (never as primary)
        - INVARIANT: source == "jwt" (header only validates)
        """
    
    kernel_timestamp: datetime
        """When kernel completed validation (UTC)
        - Timestamp of kernel execution
        - Used for audit trail
        - INVARIANT: kernel_timestamp <= now()
        """
    
    integrity_hash: str
        """Cryptographic hash of tenant context
        - HMAC-SHA256(firm_id + user_id + request_id, secret)
        - Verifiable by system
        - Detects tampering attempts
        - INVARIANT: hash_valid(integrity_hash) == True
        """
    
    # ═══════════════════════════════════════════════════════════════
    # OPTIONAL FIELDS (Metadata)
    # ═══════════════════════════════════════════════════════════════
    
    organization_id: Optional[str] = None
        """Parent organization (if multi-level tenant)
        - May be None if single-level
        - INVARIANT: organization_id.contains(firm_id) if not None
        """
    
    user_role: Optional[str] = None
        """User role within tenant
        - e.g., "admin", "user", "viewer"
        - Used for authorization (not authentication)
        - May be None (defer to auth layer)
        """
    
    ip_address: Optional[str] = None
        """Client IP address for audit
        - Optional (may not be available in all environments)
        - Used only for forensics
        """
    
    # ═══════════════════════════════════════════════════════════════
    # CLASS INVARIANTS (Frozen dataclass enforces)
    # ═══════════════════════════════════════════════════════════════
    
    def __post_init__(self):
        """Validate invariants at creation time"""
        
        # INVARIANT 1: firm_id is non-null and non-"default"
        assert self.firm_id is not None, "firm_id cannot be None"
        assert self.firm_id != "default", "default tenant does not exist"
        assert self.firm_id != "", "firm_id cannot be empty"
        
        # INVARIANT 2: user_id is non-null
        assert self.user_id is not None, "user_id cannot be None"
        assert self.user_id != "", "user_id cannot be empty"
        
        # INVARIANT 3: request_id is non-null UUID
        assert self.request_id is not None, "request_id cannot be None"
        assert is_valid_uuid(self.request_id), "request_id must be valid UUID"
        
        # INVARIANT 4: kernel_timestamp is valid
        assert self.kernel_timestamp is not None, "kernel_timestamp cannot be None"
        assert self.kernel_timestamp <= datetime.utcnow(), \
            "kernel_timestamp cannot be in future"
        
        # INVARIANT 5: integrity_hash is valid
        assert self.integrity_hash is not None, "integrity_hash cannot be None"
        assert verify_integrity_hash(self), "integrity_hash invalid"
        
        # INVARIANT 6: source is valid
        assert self.validation_source in ["jwt", "header"], \
            f"validation_source must be 'jwt' or 'header', got {self.validation_source}"
    
    # ═══════════════════════════════════════════════════════════════
    # IMMUTABILITY GUARANTEES
    # ═══════════════════════════════════════════════════════════════
    
    # @dataclass(frozen=True) ensures:
    # ✓ NO attribute assignment after creation
    # ✓ NO deletion of attributes
    # ✓ NO inheritance modifications
    # ✓ Object is hashable (can be used in sets/dicts)
    # ✓ Object is thread-safe for reads
```

### 5.2 Garantías de Integridad

```
INTEGRITY VERIFICATION:

┌─────────────────────────────────────────────────────┐
│ TenantContext Integrity Check                       │
├─────────────────────────────────────────────────────┤

1. Cryptographic Hash Validation
   ────────────────────────────────
   received_hash = context.integrity_hash
   
   computed_hash = HMAC_SHA256(
       payload = f"{context.firm_id}:{context.user_id}:{context.request_id}",
       secret = KERNEL_SECRET_KEY
   )
   
   IF received_hash != computed_hash:
       → INTEGRITY_FAILURE
       → Block request (500)
       → Log CRITICAL[KERNEL_TAMPERING]
       → Alert ops

2. Field Presence Validation
   ──────────────────────────
   IF context.firm_id is None → TypeError
   IF context.user_id is None → TypeError
   IF context.request_id is None → TypeError
   
   None of these can be optional once kernel creates context

3. Format Validation
   ──────────────────
   firm_id: must match /^[a-zA-Z0-9_-]+$/ (no spaces, special chars)
   user_id: must be non-empty string
   request_id: must be valid UUID format (36 chars)
   kernel_timestamp: must be datetime object
   integrity_hash: must be 64-char hex string (SHA256)

4. Temporal Validation
   ───────────────────
   kernel_timestamp <= now() ✓
   kernel_timestamp >= (now - 1 hour) ✓
   IF outside range → STALE_CONTEXT → reject

5. Immutability Check
   ──────────────────
   isinstance(context, ImmutableObject) ✓
   dir(context) cannot be modified ✓
   setattr(context, ...) raises FrozenInstanceError ✓

IF ANY check fails:
    → Request blocked immediately
    → No business logic executes
    → SECURITY_EVENT logged
    → Appropriate error returned

└─────────────────────────────────────────────────────┘
```

---

## FASE 6: ENFORCEMENT RULES (NON-BYPASSABLE)

### 6.1 Rules Engine

```
╔════════════════════════════════════════════════════════════════════╗
║             KERNEL ENFORCEMENT RULES (ABSOLUTE)                   ║
╠════════════════════════════════════════════════════════════════════╣

RULE 1: Tenant Must Exist
├─ IF firm_id not in VALID_TENANTS → 403 Forbidden
├─ Log: SECURITY_EVENT[INVALID_TENANT]
└─ No exception, no retry, no fallback

RULE 2: User Must Belong to Tenant
├─ IF user_id ∉ USERS[firm_id] → 403 Forbidden
├─ Log: SECURITY_EVENT[USER_NOT_IN_TENANT]
└─ Prevents cross-tenant user access

RULE 3: JWT Must Be Valid
├─ IF signature invalid → 401 Unauthorized
├─ IF expired → 401 Unauthorized
├─ Log: AUTH_FAILURE[INVALID_JWT]
└─ No business logic runs

RULE 4: Header Must Exist
├─ IF X-Firm-ID header missing → 403 Forbidden
├─ Log: SECURITY_EVENT[MISSING_HEADER]
└─ Header is mandatory validation point

RULE 5: JWT vs Header Must Match
├─ IF JWT.firm_id ≠ X-Firm-ID → 403 Forbidden
├─ Log: SECURITY_EVENT[TENANT_MISMATCH] (SPOOFING ATTEMPT)
├─ Alert ops (potential attack)
└─ Block immediately

RULE 6: TenantContext Must Be Immutable
├─ IF endpoint modifies context → TypeError
├─ Dataclass is @frozen
└─ No modifications possible

RULE 7: Every Request Gets Unique request_id
├─ IF request_id is reused → 403 Forbidden
├─ Log: SECURITY_EVENT[DUPLICATE_REQUEST_ID]
└─ Prevents replay attacks

RULE 8: Kernel Must Execute Before Endpoint
├─ IF kernel.validated != True → 500 Internal Server Error
├─ Log: CRITICAL[KERNEL_BYPASS_ATTEMPT]
└─ System integrity failure

RULE 9: No Tenant Defaults Allowed
├─ IF someone tries firm_id = "default" → 403 Forbidden
├─ Default tenant NEVER exists in VALID_TENANTS
└─ Explicit rejection

RULE 10: Tenant Context Is Read-Only
├─ endpoint receives: TenantContext (frozen)
├─ endpoint CANNOT: assign, modify, override
└─ violation raises: FrozenInstanceError (Python enforces)

RULE 11: No Multiple Tenant Sources
├─ Tenant source = JWT ONLY (header validates only)
├─ No mixing sources, no fallback chains
└─ One source of truth: JWT claim

RULE 12: Integrity Hash Must Validate
├─ IF integrity_hash invalid → 500 Internal Server Error
├─ IF context was tampered → DETECTED and BLOCKED
├─ Log: CRITICAL[CONTEXT_TAMPERING]
└─ System integrity compromised

╚════════════════════════════════════════════════════════════════════╝
```

### 6.2 What Gets Blocked

```
SCENARIOS THAT TRIGGER KERNEL BLOCKING:

┌────────────────────────────────────────────────────────┐
│ SCENARIO 1: Missing JWT Token                          │
├────────────────────────────────────────────────────────┤
Request: POST /payment/init (no Authorization header)
Kernel: Detects missing token in STEP 1
Result: 401 Unauthorized
Log: AUTH_FAILURE[MISSING_TOKEN]
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│ SCENARIO 2: Expired Token                              │
├────────────────────────────────────────────────────────┤
Request: POST /cases (Authorization: Bearer {expired_token})
Kernel: Validates expiry in STEP 2
Result: 401 Unauthorized
Log: AUTH_FAILURE[TOKEN_EXPIRED]
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│ SCENARIO 3: Missing firm_id in JWT                     │
├────────────────────────────────────────────────────────┤
Request: GET /documents (JWT without firm_id claim)
Kernel: Checks claim in STEP 3
Result: 403 Forbidden
Log: SECURITY_EVENT[MISSING_TENANT_CLAIM]
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│ SCENARIO 4: Missing X-Firm-ID Header                   │
├────────────────────────────────────────────────────────┤
Request: PUT /cases/123 (no X-Firm-ID header)
Kernel: Checks header in STEP 4
Result: 403 Forbidden
Log: SECURITY_EVENT[MISSING_HEADER]
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│ SCENARIO 5: JWT firm_id ≠ Header firm_id               │
├────────────────────────────────────────────────────────┤
Request: JWT has firm_id="firm-123", Header="firm-456"
Kernel: Cross-validates in STEP 5
Result: 403 Forbidden
Log: SECURITY_EVENT[TENANT_MISMATCH] (SPOOFING DETECTED)
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│ SCENARIO 6: Unknown firm_id                            │
├────────────────────────────────────────────────────────┤
Request: firm_id="firm-unknown" not in VALID_TENANTS
Kernel: Validates tenant list in STEP 6
Result: 403 Forbidden
Log: SECURITY_EVENT[UNKNOWN_TENANT]
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│ SCENARIO 7: Endpoint Tries to Modify Context           │
├────────────────────────────────────────────────────────┤
Code: tenant_context.firm_id = "other-firm"
Kernel: Enforces immutability
Result: FrozenInstanceError (Python exception)
Log: N/A (exception on modification)
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│ SCENARIO 8: Endpoint Tries Fallback                    │
├────────────────────────────────────────────────────────┤
Code: firm_id = tenant_context.firm_id or "default"
Problem: tenant_context.firm_id NEVER None (kernel guarantee)
Result: Fallback code NEVER executes
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│ SCENARIO 9: Request Reuse (Replay Attack)              │
├────────────────────────────────────────────────────────┤
Request 1: request_id = "uuid-123"
Request 2: request_id = "uuid-123" (same)
Kernel: Detects duplicate in STEP 7
Result: 403 Forbidden
Log: SECURITY_EVENT[DUPLICATE_REQUEST_ID]
└────────────────────────────────────────────────────────┘
```

---

## FASE 7: SYSTEM GUARANTEE MODEL

### 7.1 What the Kernel Guarantees

```
╔════════════════════════════════════════════════════════════════════╗
║                   KERNEL GUARANTEES (NON-NEGOTIABLE)              ║
╠════════════════════════════════════════════════════════════════════╣

GUARANTEE 1: No Request Executes Without Tenant Validation
   Status: STRUCTURAL (enforced by kernel execution order)
   Mechanism: Kernel MUST complete before routing
   Failure: 500 Internal Server Error (kernel failure)

GUARANTEE 2: No Endpoint Can Override Tenant
   Status: STRUCTURAL (TenantContext is frozen/immutable)
   Mechanism: @dataclass(frozen=True) Python enforcement
   Failure: FrozenInstanceError (no fallback)

GUARANTEE 3: No Repository Can Bypass firm_id Enforcement
   Status: STRUCTURAL (firm_id injected by kernel)
   Mechanism: Repository receives firm_id as kernel-provided parameter
   Failure: Repository cannot modify it (typed, immutable)

GUARANTEE 4: No Service Can Inject Tenant Manually
   Status: STRUCTURAL (service receives kernel-injected context)
   Mechanism: Service parameter is typed as TenantContext (frozen)
   Failure: Cannot create new TenantContext outside kernel

GUARANTEE 5: No Fallback to Default Ever Exists
   Status: STRUCTURAL ("default" ∉ VALID_TENANTS)
   Mechanism: Database validation, kernel checks
   Failure: 403 Forbidden (tenant unknown)

GUARANTEE 6: Tenant Identity Cannot Be Spoofed
   Status: CRYPTOGRAPHIC (JWT signature + header match check)
   Mechanism: HMAC-SHA256 validation + cross-field consistency
   Failure: 403 Forbidden (security event logged, ops alerted)

GUARANTEE 7: Every Request Is Traceable
   Status: STRUCTURAL (request_id generated by kernel, unique per request)
   Mechanism: UUID.uuid4() generated by kernel, stored in context
   Failure: Request_id in all logs for forensics

GUARANTEE 8: Tenant Context Has Integrity Proofs
   Status: CRYPTOGRAPHIC (integrity_hash in context)
   Mechanism: HMAC of context fields detects tampering
   Failure: 500 Internal Server Error (integrity failure)

GUARANTEE 9: Kernel Failure Blocks Everything
   Status: STRUCTURAL (if kernel.validated != True, block)
   Mechanism: Assertion before endpoint execution
   Failure: 500 Internal Server Error (system failure)

GUARANTEE 10: Security Events Are Audited
   Status: STRUCTURAL (kernel logs all failures as SECURITY_EVENT)
   Mechanism: Dedicated security event logger, immutable logs
   Failure: Cannot disable or modify (separate system)

╚════════════════════════════════════════════════════════════════════╝
```

---

## FASE 8: ARCHITECTURAL SHIFT

### 8.1 Before (Fragile)

```
BEFORE KERNEL:
────────────

Endpoint receives request
    ↓
Endpoint extracts firm_id (from current, headers, or state)
    ↓
Endpoint validates firm_id manually
    ↓
Endpoint passes to business logic
    ↓
Business logic assumes firm_id is valid
    ↓
Repository enforces isolation
    ↓
Database persist

PROBLEMS:
- Validation is DISTRIBUTED (multiple places)
- Validation is OPTIONAL (developer can forget)
- Validation is DUPLICATE (many places check)
- Validation is FRAGILE (depends on execution order)
- Validation is MANUAL (no automated guarantee)
- Validation is INCONSISTENT (different styles)
```

### 8.2 After (Kernel)

```
AFTER KERNEL:
─────────────

┌─────────────────────────────────┐
│ REQUEST INCOMING                │
│ (No processing yet)             │
└────────────┬────────────────────┘
             │
             ↓
┌──────────────────────────────────────────────┐
│ TENANT KERNEL EXECUTES (MANDATORY)           │
│                                              │
│ 1. Extract & validate JWT                    │
│ 2. Extract & validate header                 │
│ 3. Cross-validate                            │
│ 4. Generate immutable TenantContext          │
│ 5. Seal with integrity hash                  │
│ 6. Mark kernel.validated = True              │
│                                              │
│ IF FAIL → Block immediately                  │
│ IF OK → Continue                             │
└────────────┬───────────────────────────────────┘
             │
             ↓
┌──────────────────────────────────────────────┐
│ ENDPOINT (Dependency Injection)              │
│                                              │
│ async def init_payment(                      │
│     request: PaymentInitRequest,             │
│     tenant: TenantContext = Depends(...),    │
│     ...                                      │
│ ):                                           │
│     # tenant is guaranteed valid             │
│     # tenant is immutable                    │
│     # tenant is kernel-injected              │
│     # NO manual validation needed            │
│                                              │
│     business_logic(tenant)                   │
└────────────┬───────────────────────────────────┘
             │
             ↓
┌──────────────────────────────────────────────┐
│ REPOSITORY                                   │
│                                              │
│ def create(tenant, data):                    │
│     data["firm_id"] = tenant.firm_id         │
│     # firm_id guaranteed valid               │
│     db.insert(data)                          │
└────────────┬───────────────────────────────────┘
             │
             ↓
┌──────────────────────────────────────────────┐
│ DATABASE                                     │
│                                              │
│ Document with firm_id enforced               │
│ Isolated by kernel-guaranteed tenant         │
└──────────────────────────────────────────────┘

BENEFITS:
- Validation is AUTOMATIC (kernel does it)
- Validation is MANDATORY (kernel blocks if fails)
- Validation is CENTRALIZED (one place)
- Validation is ROBUST (cryptographically verified)
- Validation is GUARANTEED (no developer opt-out)
- Validation is CONSISTENT (always same way)
```

---

## FASE 9: FAILURE CLASSIFICATION MODEL

### 9.1 HTTP Status Code Mapping

```
╔════════════════════════════════════════════════════════════════════╗
║             KERNEL FAILURE CLASSIFICATION                         ║
╠════════════════════════════════════════════════════════════════════╣

401 UNAUTHORIZED (Authentication Failure)
├─ Cause: Invalid or missing authentication credentials
├─ Scenarios:
│  ├─ Missing Authorization header
│  ├─ Malformed JWT token
│  ├─ Invalid JWT signature
│  ├─ Expired JWT token
│  ├─ Invalid issuer in JWT
│  └─ Invalid subject in JWT
├─ Kernel Response: BLOCK (no business logic)
├─ Logging: AUTH_FAILURE[SPECIFIC_CAUSE]
├─ Ops Alert: No (authentication is expected to fail sometimes)
└─ User Action: Re-authenticate, refresh token

403 FORBIDDEN (Tenant Violation - SECURITY FAILURE)
├─ Cause: Tenant validation failed, potential security breach
├─ Scenarios:
│  ├─ Missing firm_id in JWT
│  ├─ Unknown tenant (not in VALID_TENANTS)
│  ├─ Missing X-Firm-ID header (incomplete validation)
│  ├─ JWT firm_id ≠ X-Firm-ID header (SPOOFING ATTEMPT)
│  ├─ User not in tenant
│  ├─ User trying to access other tenant's data
│  ├─ Invalid tenant claim format
│  └─ Tenant validation inconsistency
├─ Kernel Response: BLOCK (no business logic)
├─ Logging: SECURITY_EVENT[SPECIFIC_CAUSE]
├─ Ops Alert: YES (potential attack)
│  ├─ Alert on SPOOFING attempts (JWT vs Header mismatch)
│  ├─ Alert on UNKNOWN_TENANT (unauthorized tenant ID)
│  └─ Alert on USER_NOT_IN_TENANT (cross-tenant access)
└─ User Action: Request correct tenant authorization

500 INTERNAL SERVER ERROR (System Failure - KERNEL BREAKDOWN)
├─ Cause: Kernel itself failed, system integrity broken
├─ Scenarios:
│  ├─ Kernel not executed before endpoint (architecture failure)
│  ├─ TenantContext integrity verification failed (tampering)
│  ├─ Kernel.validated flag not set (system invariant broken)
│  ├─ TenantContext is None (kernel returned invalid)
│  ├─ Database failure in tenant lookup
│  └─ Cryptographic failure (HMAC validation)
├─ Kernel Response: BLOCK (system unreliable)
├─ Logging: CRITICAL[KERNEL_FAILURE_SPECIFIC_CAUSE]
├─ Ops Alert: IMMEDIATE (system integrity compromised)
│  ├─ Page on-call
│  ├─ Escalate to infrastructure team
│  └─ Possible system shutdown if integrity cannot be restored
└─ User Action: Wait, system is under investigation

╚════════════════════════════════════════════════════════════════════╝
```

### 9.2 Logging Hierarchy

```
Log Levels by Severity:

DEBUG:
  ├─ Kernel started validation
  ├─ JWT extracted
  ├─ Header extracted
  └─ Validation step N completed

INFO:
  ├─ Tenant context created successfully
  ├─ Request allowed to execute
  └─ Request completed successfully

WARNING:
  ├─ Token about to expire (in X minutes)
  ├─ Tenant lookup slow (performance issue)
  └─ Integrity hash computation slow

SECURITY_EVENT:
  ├─ JWT signature invalid
  ├─ Token expired
  ├─ Tenant mismatch (JWT vs Header)
  ├─ Unknown tenant
  ├─ User not in tenant
  ├─ Spoofing attempt detected
  └─ Duplicate request ID

CRITICAL:
  ├─ Kernel validation failed completely
  ├─ TenantContext integrity failure
  ├─ System invariant violated
  └─ Kernel not executed (architecture failure)

All logs are:
- Immutable (append-only)
- Timestamped (kernel timestamp)
- Traceable (request_id)
- Auditable (firm_id logged)
- Searchable (structured)
```

---

## FASE 10: WHY REQUEST.STATE IS NO LONGER ALLOWED

### 10.1 Problems with request.state

```
PROBLEM 1: Runtime Dependency
──────────────────────────────
request.state is populated by middleware
Middleware order affects when state exists
If middleware order changes → request.state not available
If middleware is skipped → state is missing
Endpoint cannot guarantee state availability

PROBLEM 2: Fragile Execution Order
──────────────────────────────────
Middlewares execute in sequence
If TenantIsolationMiddleware runs AFTER auth
   Then request.state might not have tenant yet
If another middleware clears request.state
   Then tenant context disappears
Order is implicit, not checked

PROBLEM 3: Distributed Responsibility
─────────────────────────────────────
Middleware sets request.state
Endpoint reads request.state
Repository uses request.state
Each component assumes others executed correctly
If ANY fails → silent cascading failure

PROBLEM 4: No Guarantee of Execution
────────────────────────────────────
Middleware can be disabled in config
Middleware can be removed without warning
Middleware can be reordered
Endpoint has NO WAY to verify middleware ran

PROBLEM 5: Type Safety Breaks Down
─────────────────────────────────────
request.state is untyped
Could contain ANYTHING
Could be None
Could be wrong type
Type checker cannot help

PROBLEM 6: Testing Complexity
──────────────────────────────
Must manually set request.state in tests
Tests don't catch if middleware is missing
Tests don't catch if state is wrong type
Unit tests bypass middleware entirely

PROBLEM 7: No Fail-Safe Mechanism
─────────────────────────────────
If request.state is missing → try/except
Try/except hides real problems
Fallback logic masks architecture issues
No way to detect that middleware failed

SOLUTION: Tenant Kernel
───────────────────────
- Kernel executes FIRST (before anything)
- Kernel is MANDATORY (cannot be disabled)
- Kernel provides TenantContext as dependency
- Kernel is type-safe (frozen dataclass)
- Kernel is testable (deterministic)
- Kernel cannot be bypassed (immutable context)
- Kernel has no fallback logic (guaranteed execution)
```

### 10.2 How Kernel Replaces request.state

```
OLD PATTERN (request.state):
────────────────────────────

async def endpoint(request: Request):
    # Hope middleware set this
    tenant = request.state.tenant_context
    # If not set → AttributeError
    # If None → TypeError
    # If wrong type → runtime error

NEW PATTERN (Kernel):
────────────────────

async def endpoint(
    request: Request,
    tenant: TenantContext = Depends(get_tenant_context_from_kernel)
):
    # tenant is GUARANTEED
    # tenant is IMMUTABLE
    # tenant is TYPE-SAFE
    # tenant is KERNEL-INJECTED
    # No request.state access needed
    # No fallback logic needed
    # No try/except needed
```

---

## RESUMEN EJECUTIVO

### Arquitectura del Kernel

```
TENANT KERNEL = SECURITY KERNEL

- Ejecuta ANTES de cualquier endpoint
- Valida tenant de forma AUTOMÁTICA
- Bloquea si validation falla
- Inyecta TenantContext (inmutable, sellado)
- Garantiza aislamiento multi-tenant estructuralmente
- NO puede ser bypassado por código incorrecto
- NO depende de request.state
- NO depende de middleware order
- NO depende de disciplina del desarrollador
```

### Garantías Proporcionadas

```
✓ ESTRUCTURAL: Kernel ejecuta antes de endpoint
✓ CRIPTOGRÁFICO: Validación de integridad de JWT + header
✓ INMUTABLE: TenantContext congelado (@frozen)
✓ DETERMINÍSTICO: Mismo resultado siempre
✓ AUDITABLE: Todos los fallos loguiados
✓ IMPOSIBLE: No se puede spoofear tenant
✓ MANDATORY: No se puede omitir validación
✓ GLOBAL: Cubre 100% de requests
```

---

**FIN DEL DOCUMENTO**

Versión: 1.0  
Estado: ✅ KERNEL ARCHITECTURE FORMAL COMPLETA  
Siguiente: Implementación de TenantKernel (Phase B)
