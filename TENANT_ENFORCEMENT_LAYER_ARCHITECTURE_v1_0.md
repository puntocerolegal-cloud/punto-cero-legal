# Tenant Enforcement Layer v1.0
## Arquitectura Formal de Aislamiento Multi-Tenant Inmutable

**Tipo de Documento:** Especificación Arquitectónica  
**Versión:** 1.0  
**Autoridad:** Principal Software Architect  
**Vigencia:** Inmediata - Define el contrato obligatorio del sistema multi-tenant  

**PROBLEMA A RESOLVER:**

El sistema actual tiene dependencias frágiles:
- `request.state.tenant_context` (runtime dependency)
- Orden de middleware (execution dependency)
- try/except en endpoints (error handling dependency)
- current_user.firm_id (auth layer coupling)

**OBJETIVO:**

Definir un **Tenant Enforcement Layer** que garantice:
- ✅ Tenant es determinístico por request
- ✅ Tenant NO depende de runtime state
- ✅ Tenant NO depende de auth layer
- ✅ Tenant NO depende de middleware order
- ✅ Tenant es inmutable y auditable
- ✅ Spoofing silencioso es imposible

---

## FASE 1: TENANT ENFORCEMENT LAYER (Conceptual)

### 1.1 Definición

**TenantContextResolver** es la abstracción única responsable de:

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│     TENANT CONTEXT RESOLVER (SINGLE ENTRY POINT)        │
│                                                          │
│  Responsabilidades:                                      │
│  - Extraer tenant de fuentes autoritativas              │
│  - Validar consistencia entre fuentes                   │
│  - Generar TenantContext inmutable                      │
│  - Auditar resolución                                   │
│  - Detectar intentos de spoofing                        │
│                                                          │
│  NUNCA:                                                 │
│  - Depender de request.state                           │
│  - Usar fallbacks silenciosos                          │
│  - Mezclar fuentes sin validación                      │
│  - Permitir omisión de tenant                          │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### 1.2 Responsabilidades Explícitas

| Responsabilidad | Descripción | Garantía |
|-----------------|-------------|----------|
| **Source Extraction** | Extraer firm_id de JWT y headers | Determinístico por request |
| **Consistency Validation** | Validar JWT vs Headers | Mismatch → BLOCK (403) |
| **Immutability** | Crear TenantContext inmutable | No modificable post-creation |
| **Audit Trail** | Log de resolución y decisiones | Trazable para forensics |
| **Spoofing Detection** | Detectar intentos de tampering | Header mismatch vs token |

---

## FASE 2: ORDEN DE RESOLUCIÓN CANÓNICO (Strict Priority)

### 2.1 Jerarquía de Fuentes

```
┌──────────────────────────────────────────┐
│ PRIORITY LEVEL 1 (Source of Truth)       │
│                                          │
│ JWT Token: firm_id claim                 │
│                                          │
│ Decisión: AUTORIDAD FINAL                │
│ Razón: Criptográficamente validado       │
│        Por autoridad central (auth svc)  │
│        No modificable por client         │
└────────────────┬─────────────────────────┘
                 │
        ┌────────v─────────┐
        │ VALIDAR:         │
        │ firm_id exists   │
        │ token not exp    │
        │ signature valid  │
        └────────┬─────────┘
                 │
        ┌────────v─────────┐
        │ EXTRAÍDO: JWT    │
        │ firm_id          │
        └────────┬─────────┘
                 │
┌────────────────v──────────────────────┐
│ PRIORITY LEVEL 2 (Validation Only)    │
│                                       │
│ X-Firm-ID Header                      │
│                                       │
│ Decisión: CONSISTENCIA CHECK          │
│ Razón: Puede ser spoofed por client   │
│        Solo usado para validar JWT    │
└────────────────┬──────────────────────┘
                 │
        ┌────────v──────────────────────┐
        │ VALIDAR:                       │
        │ header != None                 │
        │ header == JWT.firm_id          │
        │ (mismatch → SECURITY ERROR)    │
        └────────┬──────────────────────┘
                 │
        ┌────────v──────────────────────┐
        │ PASO: Validación completada   │
        │ firm_id confirmado desde JWT  │
        └────────┬──────────────────────┘
                 │
┌────────────────v──────────────────────┐
│ PRIORITY LEVEL 3 (Runtime Cache Only) │
│                                       │
│ request.state.tenant_context          │
│ (Middleware output)                   │
│                                       │
│ Decisión: CACHE SOLAMENTE             │
│ Razón: Derivado de Level 1            │
│        Para optimización runtime      │
│        NO es fuente de verdad         │
│                                       │
│ ⚠️ NUNCA como source primaria         │
│ ⚠️ NUNCA para resolución directa      │
│ ⚠️ SOLO si ambas Level 1+2 consistentes
└───────────────────────────────────────┘
```

### 2.2 Flujo de Resolución

```
CLIENT REQUEST
    │
    ├─ JWT Token (Authorization header)
    │  └─ Extract: firm_id claim
    │
    ├─ HTTP Headers
    │  └─ Extract: X-Firm-ID (validation only)
    │
    v
┌─────────────────────────────────────────┐
│ TENANT CONTEXT RESOLVER                 │
│                                         │
│ 1. Validar JWT                          │
│    ├─ Token no expirado?                │
│    ├─ Firma válida?                     │
│    └─ firm_id presente?                 │
│       └─ IF NO → 401 (Invalid Token)   │
│       └─ IF YES → jwt_firm_id = …      │
│                                         │
│ 2. Validar X-Firm-ID Header             │
│    ├─ Header presente?                  │
│    └─ header_firm_id = …                │
│       └─ IF MISSING → 403 (Missing)    │
│                                         │
│ 3. Validar Consistencia                 │
│    ├─ jwt_firm_id == header_firm_id?   │
│    │  ├─ IF YES → Continue             │
│    │  └─ IF NO → 403 (Spoofing)        │
│    │           Log SECURITY_INCIDENT   │
│    │                                   │
│    └─ firm_id in valid tenant list?    │
│       ├─ IF YES → Valid                │
│       └─ IF NO → 403 (Unknown Tenant)  │
│                                         │
│ 4. Generar TenantContext                │
│    ├─ firm_id = jwt_firm_id             │
│    ├─ request_id = …                   │
│    ├─ user_id = JWT.sub                 │
│    ├─ source = "jwt"                   │
│    ├─ validation_status = "valid"      │
│    └─ resolved_at = now()              │
│                                         │
│ 5. Retornar TenantContext (Inmutable)   │
│                                         │
└────────────────┬──────────────────────┘
                 │
                 v
         ENDPOINT consumes
         (tenant.firm_id,
          tenant.request_id)
```

---

## FASE 3: CONTRATO DE TENANTCONTEXT (Immutable Object)

### 3.1 Definición Formal

```
TenantContext {
  
  ════════════════════════════════════════════════════════
  CAMPOS OBLIGATORIOS (NUNCA pueden ser None)
  ════════════════════════════════════════════════════════
  
  firm_id: String
    - Identificador único del tenant
    - Extraído desde JWT claim "firm_id"
    - Validado contra header X-Firm-ID
    - Usado como filtro en ALL queries
    - INVARIANT: firm_id in VALID_TENANTS
  
  user_id: String
    - Identificador del usuario autenticado
    - Extraído desde JWT claim "sub"
    - INVARIANT: user_id belongs to firm_id
  
  request_id: String
    - UUID único del request
    - Generado centralmente (no por client)
    - Propagado a logs y auditoría
    - INVARIANT: globally unique per request
  
  ════════════════════════════════════════════════════════
  CAMPOS DE VALIDACIÓN (Auditoría)
  ════════════════════════════════════════════════════════
  
  source: Enum["jwt", "header"]
    - Origen autorizado de firm_id
    - INVARIANT: "jwt" (header solo valida)
  
  validation_status: Enum["valid", "invalid"]
    - Estado de validación
    - INVARIANT: "valid" (solo valid objects creados)
  
  resolved_at: Timestamp
    - Cuándo se resolvió el tenant
    - INVARIANT: resolved_at <= now()
  
  ════════════════════════════════════════════════════════
  CAMPOS OPCIONALES (Metadata)
  ════════════════════════════════════════════════════════
  
  organization_id: String (optional)
    - Organización superior (si aplica)
    - INVARIANT: org_id.contains(firm_id)
  
  ip_address: String (optional)
    - IP del cliente (para audit)
    - INVARIANT: valid IPv4 or IPv6
  
  user_role: String (optional)
    - Rol del usuario (admin, user, etc)
    - INVARIANT: role != None (auth responsibility)
  
  ════════════════════════════════════════════════════════
  REGLAS DE INMUTABILIDAD
  ════════════════════════════════════════════════════════
  
  ✅ PERMITIDO:
     - Lectura de cualquier campo
     - Validación contra invariants
     - Hash/serialización
     - Logging
  
  ❌ PROHIBIDO:
     - Modificación de firm_id
     - Modificación de user_id
     - Modificación de request_id
     - Casting a tipos mutables
     - Creación de versiones "fallback"
}
```

### 3.2 Invariants y Garantías

```
INVARIANTS (Siempre verdaderos):

1. firm_id ≠ None
   └─ Si firm_id es None → TenantContext NUNCA se crea
   └─ Exception: 403 Forbidden

2. firm_id ∈ VALID_TENANTS
   └─ Si firm_id no está en base de datos → 403
   └─ No existe "default" o wildcard tenant

3. user_id ∈ USERS[firm_id]
   └─ Usuario debe pertenecer al tenant
   └─ Si no → 403 Forbidden (tenant violation)

4. request_id es globally unique
   └─ UUID generado centralmente
   └─ NO acepta request_id del cliente

5. TenantContext es FINAL (no heredable, no modificable)
   └─ Si necesitas cambiar → crea NEW TenantContext
   └─ Nunca modifiques después de creation

6. Validación JWT vs Header SIEMPRE
   └─ Si mismatch → 403 (potential spoofing)
   └─ Si missing header → 403 (incomplete auth)

7. Auditoría SIEMPRE
   └─ Cada resolución se logea
   └─ Cada fallo se logea como SECURITY_EVENT
   └─ Forensics siempre posible
```

---

## FASE 4: REGLAS DE SEGURIDAD INMUTABLES

### 4.1 Matriz de Decisión de Seguridad

```
╔════════════════════════════════════════════════════════════════╗
║ TENANT RESOLUTION DECISION MATRIX                              ║
╠════════════════════════════════════════════════════════════════╣

CASO 1: JWT válido, firm_id presente, header consistente
├─ Validar: token signature ✓
├─ Validar: token not expired ✓
├─ Validar: firm_id en JWT ✓
├─ Validar: X-Firm-ID header ✓
├─ Validar: JWT.firm_id == Header.firm_id ✓
├─ Decisión: ACCEPT
├─ Status: 200 (continue)
└─ Acción: Crear TenantContext, propagar a endpoint

CASO 2: JWT válido, pero header MISMATCH
├─ Validar: token signature ✓
├─ Validar: token not expired ✓
├─ Validar: firm_id en JWT ✓
├─ Validar: X-Firm-ID header ✓
├─ Validar: JWT.firm_id == Header.firm_id ✗ MISMATCH
├─ Decisión: REJECT (spoofing attempt)
├─ Status: 403 Forbidden
├─ Log: SECURITY_EVENT[TENANT_MISMATCH]
├─ Action: Block, log IP, audit trail
└─ Response: "Tenant validation failed"

CASO 3: JWT expirado
├─ Validar: token signature ✓
├─ Validar: token not expired ✗ EXPIRED
├─ Decisión: REJECT (invalid auth)
├─ Status: 401 Unauthorized
├─ Log: AUTH_FAILURE[TOKEN_EXPIRED]
└─ Response: "Token expired, please re-authenticate"

CASO 4: JWT inválido (bad signature)
├─ Validar: token signature ✗ INVALID
├─ Decisión: REJECT (invalid auth)
├─ Status: 401 Unauthorized
├─ Log: AUTH_FAILURE[INVALID_SIGNATURE]
└─ Response: "Invalid authentication token"

CASO 5: firm_id ausente en JWT
├─ Validar: token signature ✓
├─ Validar: token not expired ✓
├─ Validar: firm_id en JWT ✗ MISSING
├─ Decisión: REJECT (incomplete auth)
├─ Status: 403 Forbidden
├─ Log: SECURITY_EVENT[MISSING_TENANT]
└─ Response: "Tenant information missing in token"

CASO 6: Header X-Firm-ID ausente
├─ Validar: token signature ✓
├─ Validar: token not expired ✓
├─ Validar: firm_id en JWT ✓
├─ Validar: X-Firm-ID header ✗ MISSING
├─ Decisión: REJECT (incomplete validation)
├─ Status: 403 Forbidden
├─ Log: SECURITY_EVENT[MISSING_HEADER]
└─ Response: "Required tenant validation header missing"

CASO 7: firm_id desconocido (not in VALID_TENANTS)
├─ Validar: token signature ✓
├─ Validar: token not expired ✓
├─ Validar: firm_id en JWT ✓
├─ Validar: X-Firm-ID header ✓
├─ Validar: JWT.firm_id == Header.firm_id ✓
├─ Validar: firm_id in VALID_TENANTS ✗ UNKNOWN
├─ Decisión: REJECT (unknown tenant)
├─ Status: 403 Forbidden
├─ Log: SECURITY_EVENT[UNKNOWN_TENANT]
└─ Response: "Unknown tenant"

CASO 8: request.state.tenant_context falta (middleware failed)
├─ Validar: request.state.tenant_context exists ✗ MISSING
├─ Decisión: REJECT (system failure)
├─ Status: 500 Internal Server Error
├─ Log: CRITICAL[MIDDLEWARE_FAILURE]
├─ Action: Alert ops, escalate
└─ Response: "Tenant isolation system failure"

╚════════════════════════════════════════════════════════════════╝
```

### 4.2 Reglas de Bloqueo (ZERO TOLERANCE)

```
NUNCA permitir:

❌ 1. firm_id = "default"
      Razón: No existe tenant "default"
      Acción: 403 Forbidden
      Log: SECURITY_EVENT[DEFAULT_TENANT_BLOCKED]

❌ 2. firm_id = None o ""
      Razón: Tenant es OBLIGATORIO
      Acción: 403 Forbidden
      Log: SECURITY_EVENT[MISSING_TENANT]

❌ 3. Fallback silencioso a cached value
      Razón: Cada request debe revalidarse
      Acción: 500 Internal Server Error
      Log: CRITICAL[CACHE_DEPENDENCY]

❌ 4. Usar request.state como source primario
      Razón: Runtime state es frágil
      Acción: Architecture violation, refactor
      Log: CRITICAL[ARCHITECTURE_VIOLATION]

❌ 5. Resolver firm_id en endpoint
      Razón: Resolución centralizada obligatoria
      Acción: Architecture violation, refactor
      Log: CRITICAL[ENDPOINT_RESOLVING_TENANT]

❌ 6. Usar current_user.firm_id
      Razón: Auth layer no debe definir tenant
      Acción: Remove dependency, use middleware output
      Log: CRITICAL[AUTH_TENANT_COUPLING]

❌ 7. Aceptar firm_id desde headers sin JWT validation
      Razón: Headers son spoofeable
      Acción: 403 Forbidden
      Log: SECURITY_EVENT[HEADER_ONLY_TENANT]

❌ 8. Permitir omisión de X-Firm-ID header
      Razón: Validación obligatoria
      Acción: 403 Forbidden
      Log: SECURITY_EVENT[INCOMPLETE_VALIDATION]

TODAS las violaciones → SECURITY_EVENT log
TODAS → Auditoría inmediata
TODAS → Posible escalación a ops
```

---

## FASE 5: FLUJO COMPLETO DE REQUEST

### 5.1 Diagrama de Flujo

```
┌─────────────────────────────┐
│ 1. CLIENT REQUEST           │
│                             │
│ POST /payment/init          │
│ Authorization: Bearer {jwt} │
│ X-Firm-ID: firm-123        │
│ X-Request-ID: req-uuid      │
└────────────┬────────────────┘
             │
             v
┌─────────────────────────────────────────────┐
│ 2. HTTP REQUEST RECEIVED (FastAPI)          │
│                                             │
│ Routing matched                             │
│ Dependencies about to resolve               │
└────────────┬────────────────────────────────┘
             │
             v
┌──────────────────────────────────────────────────────────┐
│ 3. TenantContextResolver.resolve_tenant(request)         │
│    (SINGLE ENTRY POINT - NOT middleware yet)             │
│                                                          │
│ Step 3.1: Extract Authorization header                  │
│           ├─ Get JWT token                              │
│           ├─ Validate signature (using secret key)      │
│           ├─ Validate not expired                       │
│           └─ Extract claim: firm_id, user_id, etc.     │
│                                                          │
│ Step 3.2: Extract X-Firm-ID Header                      │
│           ├─ Parse header value                         │
│           └─ Store for validation (not source)          │
│                                                          │
│ Step 3.3: CONSISTENCY CHECK                             │
│           ├─ Compare: JWT.firm_id == X-Firm-ID         │
│           ├─ IF mismatch → REJECT (403)                │
│           └─ IF match → Continue                       │
│                                                          │
│ Step 3.4: TENANT VALIDATION                             │
│           ├─ Is firm_id in VALID_TENANTS?             │
│           ├─ IF no → REJECT (403)                      │
│           └─ IF yes → Continue                         │
│                                                          │
│ Step 3.5: GENERATE IMMUTABLE TenantContext              │
│           ├─ firm_id = JWT.firm_id (source of truth)   │
│           ├─ user_id = JWT.sub                         │
│           ├─ request_id = UUID (generated, not client) │
│           ├─ source = "jwt"                            │
│           ├─ validation_status = "valid"               │
│           └─ Create FINAL object (immutable)           │
│                                                          │
│ Step 3.6: AUDIT RESOLUTION                             │
│           ├─ Log: tenant resolved                      │
│           ├─ Log: firm_id = X                          │
│           ├─ Log: source = jwt                         │
│           └─ Log: timestamp                            │
│                                                          │
│ Return: TenantContext (immutable)                        │
└──────────────────┬───────────────────────────────────────┘
                   │
                   v
┌──────────────────────────────────────────┐
│ 4. TenantContext AVAILABLE TO ENDPOINT   │
│                                          │
│ - is immutable                           │
│ - is audit-ready                         │
│ - is request-scoped                      │
│ - is deterministic                       │
│ - NO runtime state dependency            │
└──────────────────┬───────────────────────┘
                   │
                   v
┌──────────────────────────────────────────────┐
│ 5. DEPENDENCY INJECTION                      │
│                                              │
│ @router.post("/payment/init")               │
│ async def init_payment(                     │
│     request: PaymentInitRequest,            │
│     tenant: TenantContext = Depends(...),   │
│     current_user = Depends(get_current..),  │
│     db = Depends(get_db),                   │
│     repo = Depends(get_transaction_repo)    │
│ ):                                          │
│                                              │
│ # Endpoint receives:                        │
│ # - tenant.firm_id (NOT request.state)      │
│ # - tenant.request_id (NOT UUID.uuid4)      │
│ # - current_user (identity only)            │
└──────────────────┬───────────────────────────┘
                   │
                   v
┌──────────────────────────────────────────────┐
│ 6. ENDPOINT BUSINESS LOGIC                   │
│                                              │
│ # Create transaction                        │
│ transaction = {                             │
│     "payment_id": ...,                     │
│     "user_email": request.user_email,      │
│     ...                                     │
│ }                                           │
│                                              │
│ # Persist with tenant isolation             │
│ await repo.create(                          │
│     firm_id=tenant.firm_id,    # ✓ REAL   │
│     data=transaction,                       │
│     request_id=tenant.request_id # ✓ REAL │
│ )                                           │
└──────────────────┬───────────────────────────┘
                   │
                   v
┌──────────────────────────────────────────────┐
│ 7. REPOSITORY ENFORCES ISOLATION             │
│                                              │
│ # Create injects firm_id                    │
│ data["firm_id"] = firm_id  # Always         │
│                                              │
│ # Insert to database                        │
│ await collection.insert_one(data)           │
│                                              │
│ # Logged with request_id                    │
│ logger.info(                                │
│     f"[transactions] CREATE "               │
│     f"firm_id={firm_id} "                   │
│     f"request_id={request_id}"              │
│ )                                           │
└──────────────────┬───────────────────────────┘
                   │
                   v
┌──────────────────────────────────────────────┐
│ 8. DATABASE (MongoDB)                        │
│                                              │
│ Document:                                    │
│ {                                            │
│   "_id": ObjectId(...),                     │
│   "firm_id": "firm-123",  # ← ISOLATION    │
│   "payment_id": "PCL-...",                  │
│   "user_email": "...",                      │
│   "status": "pending",                      │
│   ...                                        │
│ }                                            │
│                                              │
│ Index: {"firm_id": 1, "payment_id": 1}     │
│ └─ Ensures isolation at DB level           │
└──────────────────┬───────────────────────────┘
                   │
                   v
┌──────────────────────────────────────────────┐
│ 9. RESPONSE TO CLIENT                        │
│                                              │
│ HTTP 200 OK                                 │
│ {                                            │
│   "payment_id": "PCL-...",                  │
│   "checkout_url": "https://...",            │
│   "status": "pending",                      │
│   ...                                        │
│ }                                            │
│                                              │
│ X-Request-ID: req-uuid (for tracing)       │
└──────────────────────────────────────────────┘
```

---

## FASE 6: COMPONENTES OBSOLETOS Y REFACTORIZACIÓN

### 6.1 Qué Debe Ser Eliminado

| Componente | Razón Obsolescence | Acción |
|-----------|-------------------|--------|
| **request.state.tenant_context** | Frágil (runtime dependency) | Remover como source primario |
| **TenantIsolationMiddleware** | Orden de ejecución frágil | Convertir en cache validator SOLO |
| **current_user.get("firm_id")** | Auth layer no debe definir tenant | Remover completamente |
| **Fallback a "default"** | Violación de seguridad | Prohibir explícitamente |
| **try/except en endpoints** | Endpoint no debe resolver tenant | Mover a TenantContextResolver |
| **Múltiples fuentes de verdad** | Confusión y errores | Unificar en TenantContextResolver |

### 6.2 Qué Debe Ser Creado/Mejorado

| Componente | Descripción | Responsabilidad |
|-----------|-------------|-----------------|
| **TenantContextResolver** | Nueva clase central | Extraer, validar, crear TenantContext |
| **TenantContext (Immutable)** | Dataclass final/sealed | Contrato de tenant |
| **resolve_tenant(request) dependency** | FastAPI Depends function | Inyectar TenantContext en endpoints |
| **Audit logger** | Centralizado | Loguear resolución y fallos |
| **Middleware v2** | Validador pasivo | Opcional cache, NO source |

### 6.3 Timeline de Refactorización

```
FASE A: Crear arquitectura (THIS DOCUMENT)
└─ Define: TenantContextResolver, TenantContext, flujo

FASE B: Implementar TenantContextResolver
└─ Nueva clase única de resolución
└─ Reemplaza lógica dispersa

FASE C: Crear TenantContext inmutable
└─ Dataclass @dataclass(frozen=True)
└─ Invariants checkeados en __post_init__

FASE D: Crear dependency inyectable
└─ async def get_tenant_context(request) → TenantContext
└─ Usable en @router.get(..., tenant: TenantContext = Depends(...))

FASE E: Refactorizar endpoints UNO POR UNO
└─ /payment/init → usar Depends(get_tenant_context)
└─ /payment/renew → usar Depends(get_tenant_context)
└─ ... (otros)

FASE F: Remover dependencias frágiles
└─ Eliminar request.state acceso directo en endpoints
└─ Remover current_user.firm_id

FASE G: Convertir middleware en validator (opcional)
└─ Middleware PUEDE mantener request.state (para cache)
└─ PERO NO como source primaria

FASE H: Auditoría final
└─ Verificar NO hay múltiples fuentes de verdad
└─ Verificar NO hay fallbacks
└─ Verificar NO hay omisiones de tenant
```

---

## FASE 7: NUEVO FLUJO OBLIGATORIO (POST-REFACTORIZACIÓN)

### 7.1 Arquitectura Final

```
┌────────────────────────────────────────────────────────────────┐
│                      TENANT ENFORCEMENT LAYER                   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ CLIENT REQUEST                                           │  │
│  │ JWT + X-Firm-ID Header                                  │  │
│  └────────────────┬─────────────────────────────────────────┘  │
│                   │                                              │
│                   v                                              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ TenantContextResolver.resolve_tenant(request)          │  │
│  │                                                          │  │
│  │ ✅ Extract JWT (source of truth)                       │  │
│  │ ✅ Validate signature                                  │  │
│  │ ✅ Extract firm_id from token                          │  │
│  │ ✅ Validate X-Firm-ID header (consistency check)      │  │
│  │ ✅ Check firm_id in VALID_TENANTS                     │  │
│  │ ✅ Generate TenantContext (immutable)                 │  │
│  │ ✅ Log audit trail                                     │  │
│  │                                                          │  │
│  │ Return: TenantContext                                   │  │
│  │   {                                                     │  │
│  │     firm_id: "firm-123",     # from JWT               │  │
│  │     user_id: "user-456",                              │  │
│  │     request_id: "req-uuid",                           │  │
│  │     source: "jwt",                                    │  │
│  │     validation_status: "valid"                        │  │
│  │   }                                                     │  │
│  └────────────────┬─────────────────────────────────────┘  │  │
│                   │                                           │  │
│                   v                                           │  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ ENDPOINT (Dependency Injection)                         │  │
│  │                                                          │  │
│  │ @router.post("/payment/init")                          │  │
│  │ async def init_payment(                                │  │
│  │     request: PaymentInitRequest,                       │  │
│  │     tenant: TenantContext = Depends(resolve_tenant),   │  │
│  │     current_user = Depends(get_current_user),          │  │
│  │     repo = Depends(get_transaction_repo)               │  │
│  │ ):                                                      │  │
│  │     # tenant.firm_id guaranteed valid                  │  │
│  │     # tenant.request_id unique                         │  │
│  │     # current_user = identity only                     │  │
│  │                                                          │  │
│  │     await repo.create(                                 │  │
│  │         firm_id=tenant.firm_id,                        │  │
│  │         data=transaction,                              │  │
│  │         request_id=tenant.request_id                   │  │
│  │     )                                                   │  │
│  └────────────────┬─────────────────────────────────────┘  │  │
│                   │                                           │  │
│                   v                                           │  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ REPOSITORY                                              │  │
│  │                                                          │  │
│  │ ✅ Receive: firm_id (guaranteed)                       │  │
│  │ ✅ Inject: data["firm_id"] = firm_id                  │  │
│  │ ✅ Persist: db.insert(data)                            │  │
│  │ ✅ Log: request_id for tracing                         │  │
│  └────────────────┬─────────────────────────────────────┘  │  │
│                   │                                           │  │
│                   v                                           │  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ DATABASE                                                │  │
│  │                                                          │  │
│  │ Document persisted with firm_id                        │  │
│  │ Index ensures isolation                                │  │
│  │ Query filters by firm_id                               │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  GUARANTEES:                                                    │
│  ✓ Tenant is deterministic (same request → same firm_id)      │
│  ✓ Tenant is immutable (TenantContext is frozen)              │
│  ✓ Tenant is auditable (logged at resolution)                 │
│  ✓ Tenant cannot be spoofed (JWT validation)                  │
│  ✓ Tenant cannot be omitted (403 if missing)                  │
│  ✓ Single source of truth (JWT)                               │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

---

## FASE 8: REGLAS DE SEGURIDAD INMUTABLES

### 8.1 Principios No Negociables

```
PRINCIPIO 1: Tenant Resolution es CENTRALIZADO
├─ NUNCA en endpoint
├─ NUNCA en auth layer
├─ NUNCA en middleware directamente
└─ SIEMPRE en TenantContextResolver

PRINCIPIO 2: Tenant Source es JWT (Cryptographic Authority)
├─ JWT es AUTORIDAD FINAL
├─ Headers validan (no determinan)
├─ Mismatch → BLOCK
└─ NUNCA fallback silencioso

PRINCIPIO 3: TenantContext es INMUTABLE
├─ Una vez creado → final
├─ No se modifica en runtime
├─ No se reasigna
└─ NUNCA hay "tenant switching"

PRINCIPIO 4: Tenant es OBLIGATORIO
├─ Ningún endpoint sin tenant
├─ Missing tenant → 403 Forbidden
├─ No existe "anonymous tenant"
└─ No existe "default tenant"

PRINCIPIO 5: Tenant Validation es COMPLETA
├─ JWT signature validated
├─ Token not expired
├─ firm_id exists
├─ X-Firm-ID header consistent
├─ firm_id in VALID_TENANTS
└─ user_id belongs to firm_id

PRINCIPIO 6: Auditoría es INMEDIATA
├─ Cada resolución → log
├─ Cada fallo → SECURITY_EVENT log
├─ Trazable hasta IP client
├─ Forensics siempre posible

PRINCIPIO 7: Spoofing es IMPOSIBLE
├─ Cannot override JWT firm_id
├─ Cannot omit X-Firm-ID header
├─ Cannot use mismatched header
├─ Cannot fake tenant
└─ Mismatch detected → BLOCK
```

### 8.2 Testing Strategy

```
UNIT TESTS - TenantContextResolver:

✓ Valid JWT, matching header → TenantContext created
✓ Expired JWT → 401 Unauthorized
✓ Invalid signature → 401 Unauthorized
✓ Missing firm_id claim → 403 Forbidden
✓ Missing X-Firm-ID header → 403 Forbidden
✓ Mismatched firm_id vs header → 403 Forbidden (security event)
✓ Unknown firm_id → 403 Forbidden
✓ TenantContext is immutable → no modifications allowed

INTEGRATION TESTS - Endpoint Flow:

✓ Valid request → TenantContext injected
✓ Transaction created with correct firm_id
✓ Transaction queryable only by same firm_id
✓ Cross-tenant query returns empty

SECURITY TESTS:

✓ Attempt to modify TenantContext → exception
✓ Attempt to create transaction without tenant → 403
✓ Attempt to spoof firm_id via header → 403 + security event
✓ Multiple concurrent requests → unique request_ids
```

---

## RESUMEN EJECUTIVO

### Cambio Arquitectónico

**DE (Frágil):**
```
request.state.tenant_context (runtime dependency)
    ↓
Middleware sets (order-dependent)
    ↓
Endpoint reads (try/except required)
    ↓
Repository uses
```

**A (Robusto):**
```
TenantContextResolver.resolve_tenant(request)
    ↓ (deterministic, cryptographically validated)
TenantContext (immutable, audit-ready)
    ↓ (injected as dependency)
Endpoint receives (no try/except, no state access)
    ↓ (guaranteed valid)
Repository uses (single firm_id source)
```

### Garantías Proporcionadas

| Garantía | Cómo se logra |
|----------|---------------|
| **Determinístico** | JWT + Header validation siempre |
| **Inmutable** | TenantContext @dataclass(frozen=True) |
| **Auditable** | Resolver logea resolución + fallos |
| **No spoofeable** | JWT signature validation + header match check |
| **No omisible** | Endpoint recibe como Depends (FastAPI enforces) |
| **Centralizado** | Una única fuente de verdad (TenantContextResolver) |
| **Escalable** | Agregar tenants = update VALID_TENANTS lista |

---

**FIN DEL DOCUMENTO**

Versión: 1.0  
Estado: ✅ ARQUITECTURA FORMAL COMPLETA  
Siguiente: Implementación de TenantContextResolver (Phase B)
