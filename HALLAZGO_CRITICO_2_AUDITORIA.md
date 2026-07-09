# HALLAZGO CRÍTICO #2: INCONSISTENCIA DE HEADERS

## Problema
Existe inconsistencia en los nombres de headers entre frontend y backend para representar el tenant (firma jurídica).

---

## FASE 1: AUDITORÍA EXHAUSTIVA

### 1.1 Headers encontrados en FRONTEND

**Archivo:** `frontend/src/security/tenantStorage.js`

**Línea 26-31:**
```javascript
export function getTenantHeaders() {
  const t = readTenant();
  const headers = {};
  if (t?.tenantId) headers["X-Tenant-ID"] = String(t.tenantId);
  if (t?.organizationId) headers["X-Organization-ID"] = String(t.organizationId);
  return headers;
}
```

**Headers que envía frontend:**
1. **X-Tenant-ID** ← Cuando existe `tenant.tenantId`
2. **X-Organization-ID** ← Cuando existe `tenant.organizationId`

**Contexto de uso:**

`frontend/src/config/api/apiClient.js` (línea 54-57):
```javascript
// Propagar headers de tenant (X-Tenant-ID / X-Organization-ID)
const tenantHeaders = getTenantHeaders();
Object.entries(tenantHeaders).forEach(([k, v]) => {
  if (v) config.headers[k] = v;
});
```

✓ Frontend envía los headers vía apiClient interceptor a TODOS los requests

---

### 1.2 Headers esperados por BACKEND

#### En TenantIsolationMiddleware

**Archivo:** `backend/middleware/tenant_isolation.py` (línea 123-128)

```python
# [BLOCK 1] Try to get firm_id from headers (accept both X-Firm-ID and X-Tenant-ID for compatibility)
# Priority: X-Firm-ID (new) > X-Tenant-ID (legacy)
firm_id = (
    request.headers.get("X-Firm-ID") or
    request.headers.get("X-Tenant-ID")
)
```

**Headers que middleware espera:**
1. **X-Firm-ID** ← Preferido (nuevo)
2. **X-Tenant-ID** ← Fallback (legacy)

---

#### En utils/tenant.py

**Archivo:** `backend/utils/tenant.py` (línea 37-39)

```python
async def get_tenant_context(
    x_tenant_id: Optional[str] = Header(None, alias="X-Tenant-ID"),
    x_organization_id: Optional[str] = Header(None, alias="X-Organization-ID"),
    current=Depends(get_current_user),
):
```

**Headers que espera:**
1. **X-Tenant-ID** ← Para tenant_id
2. **X-Organization-ID** ← Para organization_id

---

### 1.3 Otros headers encontrados

#### X-Request-ID (para correlation)

**Frontend → Backend:**
- `frontend/src/config/api/apiClient.js:43-44`
- `frontend/src/config/api/apiClient.js:95`

**Backend usa:**
- `backend/middleware/tenant_isolation.py:94-95` (respuesta)
- Múltiples routes enterprise (correlación de audit)

**Estado:** ✓ Consistente — Mismo nombre en ambos lados

---

#### X-User-ID, X-User-Email, X-User-Role

**Backend:**
- `backend/middleware/tenant_isolation.py:184-186`

**Uso:**
```python
user_id = request.headers.get("X-User-ID", "unknown")
user_email = request.headers.get("X-User-Email", "unknown")
user_role = request.headers.get("X-User-Role", "user")
```

**Estado:** ✗ NO USADO — Frontend NUNCA envía estos headers

---

---

## FASE 2: CLASIFICACIÓN DE HEADERS

### Tabla de Headers Multi-Tenant

| Header | Origen | Destino | Actual | Necesario | Estado | Acción |
|--------|--------|---------|--------|-----------|--------|--------|
| **X-Tenant-ID** | Frontend (tenantId) | Middleware + utils/tenant | ✓ Enviado | ✓ Sí | Activo | Mantener |
| **X-Organization-ID** | Frontend (organizationId) | utils/tenant | ✓ Enviado | ✗ No | Enviado pero no usado en middleware | Remover del frontend |
| **X-Firm-ID** | Frontend ✗ NUNCA | Middleware (preferido) | ✗ Nunca | ✓ Preferido | Incompleto | Añadir al frontend |
| **X-Request-ID** | Frontend | Middleware (respuesta) | ✓ Enviado | ✓ Sí | Consistente | Mantener |
| **X-User-ID** | Frontend ✗ NUNCA | Middleware (fallback) | ✗ Nunca | ✗ No (JWT lo proporciona) | Innecesario | No usar |
| **X-User-Email** | Frontend ✗ NUNCA | Middleware (fallback) | ✗ Nunca | ✗ No (JWT lo proporciona) | Innecesario | No usar |
| **X-User-Role** | Frontend ✗ NUNCA | Middleware (fallback) | ✗ Nunca | ✗ No (JWT lo proporciona) | Innecesario | No usar |

---

## FASE 3: DEFINICIÓN DEL CONTRATO OFICIAL

### Contexto de Decisión

**El Bloque 1 usa firm_id como identificador oficial** (no organization_id).

**Evidencia:**
- JWT contiene `firm_id` (obligatorio)
- Middleware busca `firm_id`
- TenantContext contiene `firm_id`
- Todas las queries filtran por `firm_id`

---

### Decisión

**Header oficial para Bloque 1:**

```
X-Firm-ID
```

**Razón:**
1. ✓ Representa el identificador oficial (firm_id)
2. ✓ Específico y claro (no ambiguo)
3. ✓ Permite diferenciación de X-Tenant-ID en futuro
4. ✓ Middleware ya lo espera como preferido
5. ✓ Preparación para evolution hacia organization_id (sin cambios)

---

### Compatibilidad Temporal

**Durante Bloque 1:**
- ✓ Aceptar X-Tenant-ID como fallback (frontend legacy)
- ✓ Aceptar X-Organization-ID (por si acaso, pero ignorarla)
- ✗ Dejar de usar X-User-ID, X-User-Email, X-User-Role (el JWT proporciona)

**Estrategia:**
```
Priority: X-Firm-ID (oficial) > X-Tenant-ID (fallback)
```

---

## FASE 4: MAPA DE CAMBIOS MÍNIMOS

### 4.1 Frontend

**Actual:**
```javascript
// tenantStorage.js línea 26-31
if (t?.tenantId) headers["X-Tenant-ID"] = String(t.tenantId);
if (t?.organizationId) headers["X-Organization-ID"] = String(t.organizationId);
```

**Cambio mínimo necesario:**

Agregar X-Firm-ID como alias primario:
```javascript
if (t?.tenantId) headers["X-Firm-ID"] = String(t.tenantId);  // ← NUEVO: Oficial
if (t?.tenantId) headers["X-Tenant-ID"] = String(t.tenantId);  // ← MANTENER: Fallback
// X-Organization-ID: Remover (no la usa middleware)
```

**Impacto:**
- ✓ Minimal — 1 línea agregada
- ✓ Backward compatible — X-Tenant-ID sigue siendo enviado
- ✓ Sin cambios en TenantContext.jsx ni otros componentes

---

### 4.2 Backend

**Actual:**
```python
# middleware/tenant_isolation.py línea 125-128
firm_id = (
    request.headers.get("X-Firm-ID") or
    request.headers.get("X-Tenant-ID")
)
```

**Ya está implementado correctamente:**
- ✓ Prioridad: X-Firm-ID > X-Tenant-ID
- ✓ Logs de auditoría: [BLOCK 1][HEADER_RESOLVED]
- ✓ Sin cambios necesarios

---

## RESUMEN

### Tabla de Cambios

| Componente | Cambio | Líneas | Impacto | Riesgo |
|-----------|--------|--------|--------|--------|
| **Frontend** | Agregar X-Firm-ID oficial | tenantStorage.js:27 | Minimal (1 línea) | BAJO |
| **Backend middleware** | Ya está correcto | Ya existe | Ninguno | NINGUNO |
| **Backend utils/tenant** | Compatibilidad con X-Organization-ID | Ya existe | Ninguno | NINGUNO |

### Headers Finales

| Header | Enviado | Recibido | Uso |
|--------|---------|----------|-----|
| **X-Firm-ID** | Sí (nuevo, oficial) | Sí | firm_id oficial |
| **X-Tenant-ID** | Sí (fallback) | Sí | firm_id fallback |
| **X-Organization-ID** | Sí (legacy) | Sí pero ignorado | Compatibilidad |
| **X-Request-ID** | Sí | Sí | Correlación |

---

## Siguiente Paso

**FASE 4 — IMPLEMENTACIÓN:** Agregar X-Firm-ID a getTenantHeaders()

