# FASE 2: DIAGNÓSTICO DE DEPENDENCIAS

## Objetivo
Determinar si `bootstrap_enterprise()` es la **causa raíz principal** o si hay problemas independientes adicionales.

---

## 1. ANÁLISIS: bootstrap_enterprise()

### Ubicación
- **Definido en:** `backend/bootstrap_enterprise.py` línea 34
- **Función:** `async def bootstrap_enterprise(app: FastAPI, db: AsyncIOMotorDatabase)`
- **Tipo:** Función async que registra infraestructura enterprise

### ¿Quién debería llamarlo?
El comentario en el archivo dice:
```python
"""
Enterprise Bootstrap
Wire all services, middleware, routes into FastAPI application
Call this from main server.py to set up enterprise infrastructure
"""
```

**Respuesta:** Debería ser llamado desde `server.py` durante el startup.

### ¿Quién realmente lo llama?
```bash
$ grep -r "bootstrap_enterprise(" backend/
# RESULTADO: CERO llamadas
```

**Respuesta:** Nadie lo llama. **NUNCA se ejecuta**.

### ¿Qué registra exactamente cuando SÍ ejecuta?

Si `bootstrap_enterprise()` se ejecutara, registraría:

| Componente | Archivo | Línea | Estado |
|-----------|---------|-------|--------|
| **Services** | bootstrap_enterprise.py | 51-99 | Instanciaría 7 servicios enterprise |
| Audit Service | ... | 54-58 | ✓ Listo |
| Permission Service (RBAC) | ... | 61-65 | ✓ Listo |
| Auth Service | ... | 68-71 | ✓ Listo |
| Tenant Service | ... | 74-76 | ✓ Listo |
| User Service | ... | 79-83 | ✓ Listo |
| Case Service | ... | 86-89 | ✓ Listo |
| Document Service | ... | 92-99 | ✓ Listo |
| **Indexes** | bootstrap_enterprise.py | 105-115 | Se crearían en MongoDB |
| **Middleware** | bootstrap_enterprise.py | 127 | `app.add_middleware(TenantIsolationMiddleware)` |
| **Routes** | bootstrap_enterprise.py | 149-153 | 6 rutas enterprise se registrarían |
| **app.state** | bootstrap_enterprise.py | 137-143 | 7 servicios disponibles en app.state |

### ¿Qué DEJA SIN REGISTRAR cuando NO ejecuta?

**Crítico:**
- ✗ TenantIsolationMiddleware NUNCA se añade
- ✗ request.state.tenant_context NUNCA se asigna
- ✗ 6 enterprise routes NUNCA se registran
- ✗ 7 enterprise services NUNCA se instancian
- ✗ Enterprise indexes NUNCA se crean

**Consecuencia:** Toda la infraestructura multi-tenant **NUNCA ENTRA EN FUNCIONAMIENTO**.

---

## 2. ANÁLISIS: TenantIsolationMiddleware

### ¿Quién lo instancia?
```python
# backend/bootstrap_enterprise.py línea 127
app.add_middleware(TenantIsolationMiddleware)
```

**Respuesta:** Solo lo instancia `bootstrap_enterprise()` (que nunca se llama).

### ¿Quién lo consume?
```bash
$ grep -r "get_tenant_context\|require_tenant_context" backend/
```

**Resultado:**

| Archivo | Función | Línea | Patrón |
|---------|---------|-------|--------|
| routes/analytics.py | analytics_dashboard | 36 | `Depends(get_tenant_context)` |
| routes/analytics.py | 7 más | 44-87 | `Depends(get_tenant_context)` |
| routes/billing.py | list_invoices | 40 | `Depends(get_tenant_context)` |
| routes/billing.py | billing_dashboard | 51 | `Depends(get_tenant_context)` |
| routes/implementations.py | list_implementations | 39 | `Depends(get_tenant_context)` |
| routes/organizations.py | list_organizations | 43 | `Depends(get_tenant_context)` |
| routes/organizations.py | 5 más | 53-206 | `Depends(get_tenant_context)` |
| routes/partners.py | list_partners | 40 | `Depends(get_tenant_context)` |
| routes/partners.py | 5 más | 50-89 | `Depends(get_tenant_context)` |
| routes/subscriptions.py | list_subscriptions | 40 | `Depends(get_tenant_context)` |
| utils/tenant.py | require_write | 72 | `Depends(get_tenant_context)` |

**Consumidores:** 11 rutas diferentes, ~25+ endpoints

### ¿Qué módulos dependen del middleware?

**Directamente:**
- `backend/utils/tenant.py` — `get_tenant_context()` desde middleware
- `backend/middleware/tenant_isolation.py` — define `get_tenant_context()`

**Indirectamente (a través de get_tenant_context):**
- analytics.py — 8 endpoints
- billing.py — 2 endpoints
- implementations.py — 2 endpoints
- organizations.py — 12 endpoints
- partners.py — 8 endpoints
- subscriptions.py — 2 endpoints
- **Total: ~34 endpoints** dependen del middleware

### ¿Qué rompe su ausencia?

**Crítico — Request nunca tiene tenant_context:**

```python
# backend/utils/tenant.py línea 37-48
async def get_tenant_context(
    x_tenant_id: Optional[str] = Header(None, alias="X-Tenant-ID"),
    ...
    current=Depends(get_current_user),  # Sí funciona (auth.py)
):
    os_role = to_os_role(current.get("role"))
    user_tenant = current.get("tenant_id") or current.get("tenantId")
    tenant_id = x_tenant_id or user_tenant
    
    if not is_platform_admin:
        if not tenant_id:
            raise HTTPException(status_code=400, detail="Falta X-Tenant-ID")  # ← FALLA aquí
```

**Comportamiento actual:**
1. Cliente no envía `X-Tenant-ID` header
2. Usuario no tiene `tenant_id` claim en JWT (no existe)
3. `get_tenant_context()` lanza `HTTPException 400` "Falta X-Tenant-ID"
4. **34 endpoints fallan sistemáticamente** sin tenant header

**Problema independiente:** Aunque el middleware SÍ ejecutara, JWT no tiene `firm_id` claim, así que fallará igual.

---

## 3. ANÁLISIS: request.state.tenant_context

### ¿Dónde se crea?

```python
# backend/middleware/tenant_isolation.py línea 70-71
request.state.tenant_context = tenant_context
```

**Respuesta:** Solo en `TenantIsolationMiddleware.dispatch()`, que NUNCA se ejecuta.

### ¿Dónde se modifica?

```bash
$ grep -r "request.state.tenant_context\s*=" backend/
# RESULTADO: Una sola ubicación (arriba)
```

**Respuesta:** NUNCA se modifica. Solo se crea una vez.

### ¿Dónde se consume?

```python
# backend/middleware/tenant_isolation.py línea 263
def get_tenant_context(request: Request) -> TenantContext:
    return getattr(request.state, "tenant_context", None)
```

**Consumidor único:** La función `get_tenant_context(request)` del middleware.

**Problema:** Esta función NUNCA devuelve un valor real (siempre `None`).

### ¿Qué módulos dependen?

- Nadie usa `middleware/tenant_isolation.py:get_tenant_context()` directamente
- Todos usan `utils/tenant.py:get_tenant_context()` (diferente función, mismo nombre)

**Conclusión:** Existe confusión de nombres. Hay DOS funciones `get_tenant_context()`:

| Ubicación | Tipo | Consumo | Estado |
|-----------|------|---------|--------|
| `middleware/tenant_isolation.py:263` | Request-based | Ninguno | INÚTIL |
| `utils/tenant.py:37` | Header+JWT-based | 34+ endpoints | **ACTIVA pero DEPENDE de JWT firm_id** |

---

## 4. ANÁLISIS: get_current_user()

### Ubicaciones

```bash
$ grep -r "async def get_current_user" backend/routes/
```

| Archivo | Línea | Consumo |
|---------|-------|---------|
| routes/auth.py | 18 | 70+ endpoints (defacto estándar) |
| routes/users.py | 14 | 5 endpoints |
| routes/enterprise_auth_routes.py | 344 | Enterprise endpoints |

### Implementación Actual (auth.py)

```python
async def get_current_user(
    authorization: Optional[str] = Header(None),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Resuelve el usuario autenticado desde el JWT Bearer token."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="No autenticado")
    token = authorization.replace("Bearer ", "")
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")
    user = await db.users.find_one({"email": payload["sub"]})  # ← Solo busca por email
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return user
```

**Payload JWT Actual:**
```python
# backend/utils/auth.py línea 21-27
def create_access_token(data: dict, expires_delta=None):
    to_encode = data.copy()
    # ...
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    # Típicamente: {"sub": user_email, "exp": timestamp}
    # Raramente: {"sub": user_email, "role": role_name, "exp": timestamp}
```

**Payload JWT FALTANTE:**
- ✗ No contiene `firm_id`
- ✗ No contiene `user_id`
- ✗ Típicamente solo contiene `sub` (email) y `exp`

### ¿Puede incorporar firm_id sin romper compatibilidad?

**SÍ, pero con precaución:**

1. **Agregar `firm_id` al payload:**
   ```python
   access_token = create_access_token(data={
       "sub": user["email"],
       "firm_id": str(user["firm_id"]),  # ← NUEVO
       "user_id": str(user["_id"]),       # ← NUEVO
       "role": user["role"]
   })
   ```

2. **Riesgo de compatibilidad:**
   - ✓ Token decodificado sigue teniendo `sub` (backward compatible)
   - ✓ Nuevas claims son opcionales en decode
   - ✗ Si código DEPENDE de firm_id estar presente, fallará
   - ✗ Tokens antiguos NO tendrán firm_id (problema si se quieren usar)

**Recomendación:** Versionar tokens (agregar `v: 2` al payload).

### ¿Qué endpoints utilizan esta función?

```bash
$ grep -r "Depends(get_current_user)" backend/routes/ | wc -l
# RESULTADO: 190+ líneas
```

**Endpoints que usan `get_current_user()`:**

| Módulo | Cantidad | Ejemplos |
|--------|----------|----------|
| auth.py | 15 | /auth/me, /auth/refresh, etc. |
| cases.py | 8 | POST /cases, GET /cases, etc. |
| clients.py | 4 | /clients/*, operaciones CRUD |
| invoices.py | 4 | /invoices/*, operaciones CRUD |
| documents.py | 12+ | /documents/*, storage/versioning |
| firms.py | 30+ | /firms/*, admin operations |
| leads.py | 8 | /leads/*, lead management |
| organizations.py | 6 | /organizations/{org_id}/lawyers, etc. |
| users.py | 5 | /users/*, user management |
| payment.py | 15+ | /payment/*, subscription operations |
| financial.py | 10+ | /invoices/*, billing operations |
| rbac.py | 8 | /roles/*, permission checking |
| team.py | 7 | /team/*, team management |
| analytics.py | 8 | Analytics endpoints |
| **Total** | **~150+** | **Una de cada 2 rutas protegidas usa esta función** |

### Impacto del cambio (agregar firm_id)

**Positivo:**
- ✓ Reduce N+1 query (no necesita buscar user nuevamente)
- ✓ Permite validación de tenant en middleware
- ✓ Elimina dependencia de email único

**Negativo:**
- ✗ Tokens emitidos sin firm_id serán inválidos después de cambio
- ✗ Requiere migración de tokens activos
- ✗ Posible downtime si no se maneja correctamente

**Riesgo de ruptura:** MEDIO (requiere manejo cuidadoso)

---

## 5. ANÁLISIS: JWT — Payload Actual vs Recomendado

### Payload Actual

```python
# routes/auth.py línea ~210
access_token = create_access_token(data={"sub": user["email"], "role": role})
```

**Contenido típico:**
```json
{
  "sub": "abogado@puntocerolegal.com",
  "role": "lawyer",  // Opcional
  "exp": 1234567890,
  "iat": 1234567800
}
```

**Problemas:**
- ✗ Sin `firm_id` (aislamiento multi-tenant imposible)
- ✗ Sin `user_id` (requiere query DB para resolver)
- ✗ Email como clave primaria (cambios complejos)
- ✗ Sin versión de token

### Payload Recomendado

```json
{
  "v": 2,                                    // ← Versión para compatibilidad
  "sub": "abogado@puntocerolegal.com",      // ← Mantener para backward compat
  "user_id": "507f1f77bcf86cd799439011",   // ← NUEVO: ID de usuario
  "firm_id": "507f1f77bcf86cd799439012",   // ← NUEVO: ID de firma
  "role": "lawyer",                         // ← MANTENER
  "exp": 1234567890,
  "iat": 1234567800
}
```

### Compatibilidad

| Escenario | Impacto |
|-----------|--------|
| Token v1 (sin firm_id) presentado a endpoint v2 | Depende de si es obligatorio o optional |
| Token v2 (con firm_id) presentado a endpoint v1 | ✓ Compatible (solo ignora firm_id) |
| Refresh con token v1 | Puede generar v2 |
| Refresh con token v2 | Genera v2 |

**Recomendación:** Hacer `firm_id` OPTIONAL pero PREFERIDO. Si está presente, usarlo; si no, derivarlo de DB.

### Riesgos

| Riesgo | Severidad | Mitigación |
|--------|-----------|-----------|
| Tokens viejos sin firm_id fallan | MEDIO | Versioning + fallback a DB |
| Cambio de firma rompe token | ALTO | Reissue durante cambio |
| Token interceptado revela firm_id | BAJO | Usar HTTPS (siempre) |
| Ataque de firma falsa en payload | BAJO | JWT ya lo valida con SECRET_KEY |

---

## 6. ANÁLISIS: Headers — Frontend vs Backend

### Headers en Frontend

**Archivo:** `frontend/src/security/tenantStorage.js` línea 26-31

```javascript
export function getTenantHeaders() {
  const t = readTenant();
  const headers = {};
  if (t?.tenantId) headers["X-Tenant-ID"] = String(t.tenantId);
  if (t?.organizationId) headers["X-Organization-ID"] = String(t.organizationId);
  return headers;
}
```

**Headers que ENVÍA frontend:**
- `X-Tenant-ID` (de tenantId)
- `X-Organization-ID` (de organizationId)

### Headers que ESPERA Backend

**Middleware:**
```python
# backend/middleware/tenant_isolation.py línea 130-135
firm_id = request.headers.get("X-Firm-ID")
```

**utils/tenant.py:**
```python
# backend/utils/tenant.py línea 38
x_tenant_id: Optional[str] = Header(None, alias="X-Tenant-ID")
x_organization_id: Optional[str] = Header(None, alias="X-Organization-ID")
```

### Tabla de Mismatch

| Frontend Envía | Backend Espera (middleware) | Backend Espera (utils/tenant) | Estado |
|---|---|---|---|
| `X-Tenant-ID` | `X-Firm-ID` | `X-Tenant-ID` ✓ | ❌ MISMATCH |
| `X-Organization-ID` | - | `X-Organization-ID` ✓ | ❌ INCONSISTENCIA |
| - | - | `X-Firm-ID` | ❌ NUNCA SINCRONIZADO |

**Conclusión:**
- Middleware espera `X-Firm-ID` (no existe en frontend)
- utils/tenant.py espera `X-Tenant-ID` (frontend SÍ envía)
- Dos sistemas de aislamiento desconectados

---

## 7. ANÁLISIS: Rutas — Clasificación Completa

### Métodos de conteo

```bash
# Rutas públicas (sin auth)
$ grep -r "@router\.\(get\|post\)" backend/routes/*.py | \
  grep -v "get_current_user\|get_tenant_context\|get_admin" | \
  wc -l
# ~50 rutas públicas

# Rutas autenticadas (con get_current_user)
$ grep -r "Depends(get_current_user)" backend/routes/*.py | wc -l
# ~190 líneas = ~95 endpoints

# Rutas multi-tenant (con get_tenant_context)
$ grep -r "Depends(get_tenant_context)\|Depends(require_write)" \
  backend/routes/*.py | wc -l
# ~35 líneas = ~18 endpoints
```

### Clasificación por Tipo

| Categoría | Rutas | Requisito | Status | Ejemplo |
|-----------|-------|-----------|--------|---------|
| **Públicas** | ~50 | Ninguno | ✓ Funciona | `/auth/login`, `/health`, `/public/intake` |
| **Autenticadas** | ~95 | JWT Bearer | ✓ Funciona | `GET /cases`, `POST /documents` |
| **Multi-Tenant** | ~18 | JWT + X-Tenant-ID | ❌ FALLA | `GET /organizations`, `GET /billings` |
| **Enterprise** | ~6 | bootstrap_enterprise() | ❌ NUNCA LLEGA | `/api/firms/{firm_id}/cases/*, etc.` |
| **Admin-only** | ~30 | JWT + admin role | ✓ Funciona (pero sin aislamiento) | `POST /admin/seed` |

### Rutas que REQUIEREN TenantIsolationMiddleware

**Críticas (sin aislamiento = violación de datos):**
1. `/api/organizations/*` — Listar orgs por tenant
2. `/api/partners/*` — Red de partners
3. `/api/subscriptions/*` — Suscripciones por tenant
4. `/api/implementations/*` — Implementaciones
5. `/api/billing/*` — Facturación
6. `/api/analytics/*` — Analytics consolidadas

**Secundarias (deberían tenerlo):**
- `/api/cases/*` — Casos (actualmente solo usa get_current_user)
- `/api/documents/*` — Documentos
- `/api/invoices/*` — Facturas
- `/api/leads/*` — Leads

### Rutas que NO necesitan TenantIsolationMiddleware

- `/health` ✓
- `/api/auth/*` (login, register) ✓
- `/api/public/*` ✓
- `/api/chatbot/webhook/*` (webhooks públicas) ✓

---

## 8. ANÁLISIS: Árbol de Dependencias

```
┌─────────────────────────────────────────────────────────────────┐
│                     server.py (Main App)                        │
│                  ❌ NUNCA LLAMA bootstrap_enterprise()           │
└────────────┬──────────────────────────────────────────────┬─────┘
             │                                              │
    ┌────────▼────────────────┐              ┌─────────────▼──┐
    │ bootstrap_enterprise()   │              │  CORSMiddleware │
    │ (CÓDIGO MUERTO)          │              │  ✓ Registrado  │
    │ ❌ NUNCA SE EJECUTA      │              └────────────────┘
    └─────────┬─────────────────┘
              │
              ├─→ TenantIsolationMiddleware ❌ NUNCA SE REGISTRA
              │
              ├─→ 7 Enterprise Services ❌ NUNCA SE INSTANCIAN
              │
              ├─→ 6 Enterprise Routes ❌ NUNCA SE REGISTRAN
              │
              └─→ Enterprise Indexes ❌ NUNCA SE CREAN
              
┌─────────────────────────────────────────────────────────────────┐
│                    RUTAS ACTIVAS EN RUNTIME                     │
└─────────────────────────────────────────────────────────────────┘

    ┌────────────────────────────────────────────────────┐
    │ routes/auth.py                                     │
    │ ├─ create_access_token()                          │
    │ │  └─ JWT Payload: {sub, role, exp}              │
    │ │     ❌ SIN firm_id                              │
    │ └─ get_current_user()                            │
    │    └─ Resuelve: user_id de email               │
    │       ✓ Funciona (aunque es N+1 query)         │
    └────────────────────────────────────────────────────┘
                           │
                           ▼
    ┌────────────────────────────────────────────────────┐
    │ utils/tenant.py                                    │
    │ ├─ get_tenant_context() (Función A)              │
    │ │  ├─ Usa X-Tenant-ID header  ✓                 │
    │ │  ├─ Usa X-Organization-ID header ✓            │
    │ │  ├─ Fallback a user.tenant_id (sin firma)     │
    │ │  └─ Valida aislamiento: user.tenant == header  │
    │ │                                                │
    │ ├─ Problema: JWT SIN tenant_id claim            │
    │ │  → Requiere OBLIGATORIAMENTE X-Tenant-ID     │
    │ │  → Frontend SÍ envía X-Tenant-ID ✓            │
    │ │  → Pero middleware nunca ejecuta              │
    │ │                                                │
    │ └─ 34 endpoints dependen de esto:               │
    │    analytics (8), organizations (12), etc.      │
    └────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│          middleware/tenant_isolation.py (FUNCIÓN B)             │
│          ❌ NUNCA EJECUTA (solo en bootstrap)                   │
└─────────────────────────────────────────────────────────────────┘

    ├─ Intenta usar TenantContext
    ├─ Asigna request.state.tenant_context
    └─ Define get_tenant_context(request) [Función B]
       └─ NUNCA se consume (todos usan Función A de utils/)
```

### Análisis de Causa-Efecto

**Hipótesis: bootstrap_enterprise() es la causa raíz PRINCIPAL**

```
bootstrap_enterprise() NO ejecuta
              ↓
        TenantIsolationMiddleware NO se registra
              ↓
        request.state.tenant_context NUNCA se asigna
              ↓
        middleware/tenant_isolation.py:get_tenant_context() NUNCA funciona
              ↓
        ✓ PERO: utils/tenant.py:get_tenant_context() SÍ funciona
              ↓
        34+ endpoints SÍ se ejecutan (con headers correctos)
              ↓
        ✓ Aislamiento PARCIAL: si cliente envía X-Tenant-ID
              ✗ Aislamiento FALLA: si cliente NO envía header
```

**Conclusión: FALSO POSITIVO en la hipótesis**

El middleware NO es actualmente necesario porque `utils/tenant.py:get_tenant_context()` usa headers directamente, NO depende del middleware.

---

## ÁRBOL FINAL DE DEPENDENCIAS

```
INDEPENDIENTE #1: JWT sin firm_id
  └─ Afecta: Validación de tenant en utils/tenant.py
  └─ Requiere fallback a header X-Tenant-ID
  └─ PROBLEM: Si no hay header, falla
  └─ SOLUTION: Agregar firm_id a JWT

INDEPENDIENTE #2: Header mismatch
  └─ Frontend envía: X-Tenant-ID ✓
  └─ Middleware espera: X-Firm-ID ❌
  └─ utils/tenant espera: X-Tenant-ID ✓
  └─ PROBLEM: Inconsistencia de nombres
  └─ SOLUTION: Estandarizar a X-Firm-ID

INDEPENDIENTE #3: Dos funciones get_tenant_context()
  └─ middleware/tenant_isolation.py:263 (nunca se usa)
  └─ utils/tenant.py:37 (se usa siempre)
  └─ PROBLEM: Confusión, duplicación
  └─ SOLUTION: Eliminar la del middleware O usarla

DERIVADO #1: bootstrap_enterprise() no llamado
  └─ Causa: NUNCA agregado a server.py startup
  └─ Efecto directo:
     ├─ TenantIsolationMiddleware NUNCA se registra
     ├─ Enterprise services NUNCA se instancian
     ├─ Enterprise routes NUNCA se registran
  └─ Efecto INDIRECTO en aislamiento: CERO
     (porque utils/tenant.py NO depende del middleware)

DERIVADO #2: Enterprise routes no registradas
  └─ Causa: bootstrap_enterprise() no llama a app.include_router()
  └─ Efecto: Rutas como /api/firms/{firm_id}/cases/* no existen
  └─ Aislamiento: NO afecta (rutas legacy SÍ funcionan parcialmente)
```

---

## RESUMEN DE PROBLEMAS

| Problema | Causa Raíz | Independiente | Bloqueante |
|----------|-----------|---------------|-----------|
| bootstrap_enterprise() no se llama | NO en server.py | Sí (primaria) | SÍ - bloquea enterprise |
| TenantIsolationMiddleware no se registra | bootstrap() no llama | Derivado | NO - utils/tenant funciona |
| JWT sin firm_id | create_access_token() | Sí (primaria) | SÍ - requiere fallback |
| Header mismatch X-Tenant vs X-Firm | Inconsistencia de diseño | Sí (primaria) | MEDIO - ambos funcionan |
| Dos funciones get_tenant_context() | Código muerto | Derivado | NO - se resuelve naturalmente |
| Enterprise routes no registradas | bootstrap() no ejecuta | Derivado | SÍ - pero legacy funciona |
| 34+ endpoints sin validación tenant | get_current_user() sin firm_id | Derivado | SÍ - sin header fallan |

---

## CONCLUSIONES PREVIAS (antes de corrección)

### A. CAUSA RAÍZ PRINCIPAL

**Causa Raíz #1:** `bootstrap_enterprise()` nunca se llama desde `server.py`
- **Archivo:** server.py
- **Línea:** No existe la llamada
- **Efecto:** Middleware enterprise, servicios, rutas enterprise nunca registran

**Causa Raíz #2:** JWT sin `firm_id` claim
- **Archivo:** utils/auth.py línea 21-27
- **Efecto:** Imposible validar tenant sin header X-Tenant-ID

**Causa Raíz #3:** Mismatch de headers (X-Tenant-ID vs X-Firm-ID)
- **Frontend:** Envía X-Tenant-ID
- **Middleware:** Espera X-Firm-ID
- **utils/tenant:** Espera X-Tenant-ID
- **Efecto:** Inconsistencia de diseño

### B. PROBLEMAS DERIVADOS (desaparecerían si se arreglan causas raíz)

1. TenantIsolationMiddleware no se registra → Desaparece si bootstrap() se llama
2. Enterprise servicios no se instancian → Desaparece si bootstrap() se llama
3. Enterprise routes no se registran → Desaparece si bootstrap() se llama
4. request.state.tenant_context nunca se asigna → Desaparece si middleware se registra
5. 34+ endpoints fallan sin X-Tenant-ID header → Desaparece si JWT tiene firm_id
6. Confusión de dos funciones get_tenant_context() → Desaparece si middleware se registra

### C. PROBLEMAS INDEPENDIENTES (persistirían incluso si se arreglan otras causas)

1. **JWT sin firm_id** — Causa raíz independiente
   - Solución: Agregar firm_id al payload de create_access_token()
   - Riesgo: Compatibilidad con tokens viejos

2. **Header naming mismatch** — Causa raíz independiente
   - Solución: Unificar a X-Firm-ID en frontend Y middleware
   - Riesgo: Breaking change en frontend

3. **get_current_user() usa N+1 query** — Ineficiencia, no bloqueante
   - Solución: Agregar user_id a JWT
   - Riesgo: Compatibilidad

### D. ORDEN ÓPTIMO DE CORRECCIÓN

1. **FASE 0 - Prerequisitos:**
   - Agregar `firm_id` y `user_id` a JWT payload
   - Unificar headers a `X-Firm-ID`
   - Razón: Sin esto, el resto no funciona de forma completa

2. **FASE 1 - Integración enterprise (corrige bootstrap):**
   - Llamar `bootstrap_enterprise()` desde server.py startup
   - Registrar TenantIsolationMiddleware
   - Razón: Infraestructura multi-tenant completamente integrada

3. **FASE 2 - Validación (corrige queries):**
   - Agregar firma_id validation a todas las queries
   - Usar TenantAwareQuery.add_firm_filter()
   - Razón: Garantizar aislamiento en datos

4. **FASE 3 - Limpieza (code cleanup):**
   - Eliminar función middleware/tenant_isolation.py:get_tenant_context()
   - Unificar en utils/tenant.py:get_tenant_context()
   - Razón: Una sola fuente de verdad

---

## EVIDENCIA RECOPILADA

### Líneas de Código Clave

| Componente | Archivo | Línea | Evidencia |
|-----------|---------|-------|-----------|
| bootstrap no llamado | server.py | N/A | grep -r "bootstrap_enterprise" devuelve cero |
| JWT sin firm_id | utils/auth.py | 24-25 | `jwt.encode(to_encode, SECRET_KEY, ...)` |
| create_access_token | auth.py/payment.py | ~200 | `{"sub": user["email"], "role": role}` |
| utils/tenant esperando header | utils/tenant.py | 38 | `alias="X-Tenant-ID"` |
| middleware esperando header | middleware/tenant_isolation.py | 130 | `request.headers.get("X-Firm-ID")` |
| Frontend enviando header | frontend/security/tenantStorage.js | 29 | `"X-Tenant-ID"` |
| 34+ endpoints con get_tenant_context | routes/*.py | ~40 ubicaciones | `Depends(get_tenant_context)` |
| bootstrap intenta registrar middleware | bootstrap_enterprise.py | 127 | `app.add_middleware(TenantIsolationMiddleware)` |

