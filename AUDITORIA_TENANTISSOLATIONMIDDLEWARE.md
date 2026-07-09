# FASE 1: AUDITORÍA COMPLETA — TenantIsolationMiddleware

## Estado Actual: CRÍTICO ❌

---

## 1. DEFINICIÓN DEL MIDDLEWARE

**Archivo:** `backend/middleware/tenant_isolation.py`

**Clase:** `TenantIsolationMiddleware`

**Líneas:** 33-100+ (middleware dispatch)

### Código Actual:
```python
class TenantIsolationMiddleware(BaseHTTPMiddleware):
    """
    Middleware that enforces multi-tenant isolation.
    
    Every request must include firm_id (via header or decoded JWT token).
    Validates that user belongs to firm and sets context for service layer.
    """

    # Paths that skip tenant isolation (e.g., login, health check)
    EXEMPT_PATHS = {
        "/health",
        "/docs",
        "/openapi.json",
        "/redoc",
        "/api/auth/login",
        "/api/auth/register",
        "/api/auth/refresh",
    }

    async def dispatch(self, request: Request, call_next):
        """
        Intercept request, extract tenant context, validate isolation.
        Attach tenant context to request state for downstream handlers.
        """
        
        # Skip exempt paths
        if request.url.path in self.EXEMPT_PATHS:
            return await call_next(request)

        try:
            # Extract tenant context from request
            tenant_context = await self._extract_tenant_context(request)
            
            # Attach to request state
            request.state.tenant_context = tenant_context
            
            # Log access for audit trail
            logger.info(
                f"[TENANT] firm_id={tenant_context.firm_id} "
                f"user_id={tenant_context.user_id} "
                f"path={request.url.path} "
                f"method={request.method} "
                f"request_id={tenant_context.request_id}"
            )
            
            # Process request
            response = await call_next(request)
            
            # Add request_id to response headers for tracing
            response.headers["X-Request-ID"] = tenant_context.request_id
            
            return response
```

**Componentes Incluidos:**
- ✓ `TenantContext` class (almacena firm_id, user_id, user_email, user_role, request_id, ip_address)
- ✓ `TenantIsolationValidator` class (valida aislamiento entre tenants)
- ✓ `TenantAwareQuery` class (inyecta firm_id en queries MongoDB)
- ✓ `get_tenant_context(request)` helper function
- ✓ `require_tenant_context(request)` helper function

**Estado:** Completamente definido, pero **NO REGISTRADO EN server.py**

---

## 2. DÓNDE DEBERÍA EJECUTARSE

**Debería ejecutarse:** En TODAS las rutas protegidas

**Rutas que DEBERÍAN ESTAR PROTEGIDAS:**
- `/api/cases/*` — Case management
- `/api/documents/*` — Document manager
- `/api/appointments/*` — Appointments/Agenda
- `/api/messages/*` — Messages
- `/api/meetings/*` — Meetings
- `/api/dashboard/*` — Dashboards
- `/api/clients/*` — Client management
- `/api/invoices/*` — Invoicing
- `/api/analytics/*` — Analytics
- `/api/firm-os/*` — Firm OS
- `/api/legal-os/*` — Legal OS
- `/api/firms/*` — Firm management (parcial)
- `/api/organizations/*` — Org management
- `/api/partners/*` — Partners
- `/api/subscriptions/*` — Subscriptions
- Y 30+ rutas más

**Rutas que DEBERÍAN ESTAR EXENTAS (EXEMPT):**
- `/api/auth/login` ✓ (en EXEMPT_PATHS)
- `/api/auth/register` ✓ (en EXEMPT_PATHS)
- `/api/auth/refresh` ✓ (en EXEMPT_PATHS)
- `/health` ✓ (en EXEMPT_PATHS)
- `/api/public/*` — Rutas públicas
- `/api/chatbot/*` — Webhooks públicos (WhatsApp)

---

## 3. DÓNDE SE REGISTRA ACTUALMENTE

**HALLAZGO CRÍTICO #1: El middleware NO está registrado en server.py**

### Ubicación Encontrada:
**Archivo:** `backend/bootstrap_enterprise.py` 
**Línea:** 127

```python
# ====================================================================
# 3. ADD MIDDLEWARE
# ====================================================================

logger.info("[ENTERPRISE] Adding middleware...")

# Tenant isolation middleware (must be added EARLY)
# Middleware added in reverse order (last added = first executed in request)
app.add_middleware(TenantIsolationMiddleware)

logger.info("[ENTERPRISE] Middleware registered")
```

### Ubicación en server.py:
**Archivo:** `backend/server.py` 
**Línenas:** 439-454

Solo contiene:
```python
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=[...],
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    max_age=86400,
)
```

**HALLAZGO CRÍTICO #2: `bootstrap_enterprise()` NUNCA se llama desde server.py**

Se define en `bootstrap_enterprise.py` pero:
- ✗ No hay `await bootstrap_enterprise(app, db)` en server.py
- ✗ No hay import de `bootstrap_enterprise` en server.py
- ✗ TenantIsolationMiddleware nunca se ejecuta
- ✗ El middleware NUNCA está activo

---

## 4. QIÉN LLAMARÍA A bootstrap_enterprise()

**Análisis de llamadas:**
```bash
$ grep -r "bootstrap_enterprise" backend/
backend\bootstrap_enterprise.py:33-async def bootstrap_enterprise(app: FastAPI, db: AsyncIOMotorDatabase):
```

**Resultado:** CERO llamadas a `bootstrap_enterprise()` en todo el backend.

---

## 5. MIDDLEWARES ACTUALES (en server.py)

**Orden de ejecución (último agregado = primero ejecutado):**

1. **CORSMiddleware** (línea 439-454)
   - allow_credentials=True
   - allow_origins: localhost:3000, localhost:3001, Vercel, Render
   - allow_methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
   - allow_headers: ["*"]
   - max_age: 86400

**Middleware FALTANTE:**
- ✗ TenantIsolationMiddleware

---

## 6. RUTAS ANALIZADAS

### Rutas que usan `get_tenant_context()`:
```bash
backend/routes/analytics.py:36-87 (8 endpoints)
backend/routes/ai_operations.py:21-203 (7 endpoints)
backend/routes/ai_autopilot.py:18-203 (6 endpoints)
backend/routes/partners.py:35-89 (8 endpoints)
backend/routes/organizations.py:39-206 (12+ endpoints)
```

**Patrón encontrado:**
```python
@router.get("/dashboard")
async def analytics_dashboard(ctx=Depends(get_tenant_context), db=Depends(get_db)):
    # Usan get_tenant_context directamente en Depends
    pass
```

**Problema:** `get_tenant_context()` depende de `request.state.tenant_context`, que solo se asigna si el middleware ejecuta. Sin el middleware, `get_tenant_context()` siempre devuelve `None`.

### Rutas que usan `get_current_user()`:
```bash
backend/routes/auth.py
backend/routes/referrals.py
backend/routes/admin_ops.py
backend/routes/admin_master.py
...y más (50+ rutas)
```

**Patrón encontrado:**
```python
@router.get("/me")
async def get_me(current = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    # Extrae usuario del JWT, pero NO valida firm_id
    pass
```

**Problema:** Estas rutas NO tienen protección de tenant/firm. Pueden acceder a datos de otros tenants.

---

## 7. MÚLTIPLES VERSIONES DEL MIDDLEWARE

**¿Existen múltiples definiciones?**

```bash
$ grep -r "class.*Middleware" backend/ | grep -i tenant
backend\middleware\tenant_isolation.py:33:class TenantIsolationMiddleware(BaseHTTPMiddleware):
```

**Resultado:** UNA sola definición. No hay duplicados.

---

## 8. OTROS MIDDLEWARES EN BOOTSTRAP_ENTERPRISE

**Archivo:** `backend/bootstrap_enterprise.py`
**Línea:** 126-128

```python
logger.info("[ENTERPRISE] Adding middleware...")

# Tenant isolation middleware (must be added EARLY)
# Middleware added in reverse order (last added = first executed in request)
app.add_middleware(TenantIsolationMiddleware)

logger.info("[ENTERPRISE] Middleware registered")
```

**Resultado:** Solo se intenta registrar TenantIsolationMiddleware. Nada más.

---

## 9. CÓDIGO MUERTO / DUPLICADO

### Importes en bootstrap_enterprise.py que NUNCA se usan:

```python
from middleware.tenant_isolation import TenantIsolationMiddleware  # Línea 21
# ↓ Se importa pero bootstrap_enterprise() nunca se llama
```

### Rutas importadas pero NO registradas:

```python
from routes import (
    enterprise_auth_routes,      # NO REGISTRADA
    enterprise_firm_routes,      # NO REGISTRADA
    enterprise_rbac_routes,      # NO REGISTRADA
    enterprise_user_routes,      # NO REGISTRADA
    enterprise_case_routes,      # NO REGISTRADA
    enterprise_document_routes   # NO REGISTRADA
)
```

En bootstrap_enterprise.py línea 149+:
```python
# ====================================================================
# 5. REGISTER ROUTES
# ====================================================================
# (CÓDIGO NO COMPLETADO EN EL ARCHIVO)
```

---

## 10. STARTUP EVENTS EN server.py

**Orden de ejecución:**
1. Línea 219: `@app.on_event("startup")` — `init_cron_jobs()`
2. Línea 251: `@app.on_event("startup")` — `init_db_indexes()`
3. Línea 316: `@app.on_event("startup")` — `init_master_accounts()`

**Análisis:** Ninguno de estos intenta llamar a `bootstrap_enterprise()`.

---

## RESUMEN DE HALLAZGOS

| Hallazgo | Severidad | Evidencia |
|----------|-----------|-----------|
| TenantIsolationMiddleware NO registrado | **CRÍTICO** | bootstrap_enterprise() nunca se llama |
| Rutas protegidas sin firm_id validation | **CRÍTICO** | 50+ rutas usan get_current_user() sin validar firm |
| get_tenant_context() inútil | **CRÍTICO** | Depende de middleware no ejecutado |
| EXEMPT_PATHS incompleto | **ALTO** | Faltan /api/public/*, /api/chatbot/* |
| JWT sin firm_id claim | **ALTO** | Token solo contiene {sub, role} |
| frontend headers mismatch | **ALTO** | Frontend envía X-Tenant-ID, backend espera X-Firm-ID |
| Código bootstrap muerto | **MEDIO** | enterprise_*_routes nunca se registran |

---

## CONCLUSIÓN

**Estado Actual:** ❌ **CRÍTICO**

El middleware está **completamente definido pero totalmente desconectado de la aplicación**. 

- ✓ El código existe y es de buena calidad
- ✗ Nunca se ejecuta
- ✗ Las rutas no están protegidas
- ✗ El aislamiento multi-tenant NO está garantizado

**Riesgo de Producción:** CRÍTICO — Violación de privacidad de datos entre empresas.

**Próximo Paso:** FASE 2 — DIAGNÓSTICO detallado de cada dependencia para reparación.

