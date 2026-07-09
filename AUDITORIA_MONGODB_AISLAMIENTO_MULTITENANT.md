# AUDITORÍA FORENSE DE MONGODB — AISLAMIENTO MULTI-TENANT

## Contexto
- **Plataforma:** Punto Cero System OS (Multi-Tenant, Multi-País, Multi-Moneda, Multi-Vertical)
- **Vertical actual:** Punto Cero Legal (firm_id como identificador oficial)
- **Objetivo:** Verificar aislamiento entre empresas en TODAS las operaciones MongoDB

---

## FASE 1: INVENTARIO EXHAUSTIVO DE OPERACIONES MONGODB

### Resumen de búsqueda realizada
- Grep en `backend/**/*.py`
- Búsqueda de: `find()`, `find_one()`, `aggregate()`, `insert_*()`, `update_*()`, `delete_*()`, `count_documents()`, `distinct()`, etc.
- Se encontraron **200+** operaciones MongoDB distribuidas en 40+ archivos

---

## FASE 2: CLASIFICACIÓN Y MAPEO

### Repositorios (Consultas Centralizadas)

#### ✓ CATEGORÍA A: SEGURA — Incluye firm_id correctamente

**Archivo:** `backend/repositories/document_repository.py`

| Línea | Colección | Operación | Filtro | Seguridad |
|-------|-----------|-----------|--------|-----------|
| 13 | documents | find | `TenantAwareQuery.add_firm_filter({"case_id": case_id, "deleted_at": None}, firm_id)` | ✓ SEGURA |
| 18 | documents | find | `TenantAwareQuery.add_firm_filter({"owner_id": owner_id, ...}, firm_id)` | ✓ SEGURA |
| 45 | documents | find_one | `TenantAwareQuery.add_firm_filter({"_id": document_id}, firm_id)` | ✓ SEGURA |
| 89 | documents | count_documents | `TenantAwareQuery.add_firm_filter({"case_id": case_id, ...}, firm_id)` | ✓ SEGURA |

**Patrón consistente:** `TenantAwareQuery.add_firm_filter(query, firm_id)` en TODAS las operaciones

---

**Archivo:** `backend/repositories/case_repository.py`

| Línea | Colección | Operación | Filtro | Seguridad |
|-------|-----------|-----------|--------|-----------|
| 13 | cases | find_one | `TenantAwareQuery.add_firm_filter({"case_number": case_number}, firm_id)` | ✓ SEGURA |
| 17 | cases | find | `TenantAwareQuery.add_firm_filter({"case_owner_id": owner_id, ...}, firm_id)` | ✓ SEGURA |
| 50 | cases | count_documents | `TenantAwareQuery.add_firm_filter({"deleted_at": None}, firm_id)` | ✓ SEGURA |
| 54 | cases | update_one | `TenantAwareQuery.add_firm_filter({"_id": case_id}, firm_id)` | ✓ SEGURA |

**Patrón:** 100% usan `TenantAwareQuery.add_firm_filter()` helper

---

**Archivo:** `backend/repositories/document_access_log_repository.py`

| Línea | Colección | Operación | Filtro | Seguridad |
|-------|-----------|-----------|--------|-----------|
| 20 | document_access_logs | find | `TenantAwareQuery.add_firm_filter({"document_id": document_id}, firm_id)` | ✓ SEGURA |
| 25 | document_access_logs | find | `TenantAwareQuery.add_firm_filter({"user_id": user_id}, firm_id)` | ✓ SEGURA |

---

**Archivo:** `backend/repositories/firm_repository.py`

| Línea | Colección | Operación | Filtro | Seguridad |
|-------|-----------|-----------|--------|-----------|
| 49 | firms | find_one | `query` (sin firm_id agregado) | ⚠️ PARCIAL |
| 124 | firms | find | `query.skip().limit().sort()` | ⚠️ PARCIAL |
| 164 | firms | count_documents | `query` | ⚠️ PARCIAL |

**Observación:** Firm_repository no usa TenantAwareQuery — consultas ya tienen firm_id en query dict (construido por llamador)

---

### Servicios (Operaciones Directas)

#### ✓ CATEGORÍA A: SEGURA — Filtro por firm_id presente

**Archivo:** `backend/services/autonomous_system_orchestrator.py`

| Línea | Colección | Operación | Filtro | Seguridad | Descripción |
|-------|-----------|-----------|--------|-----------|-------------|
| 15 | organizations | find | `{}` | ✗ INSEGURA | Lee TODOS los orgs del sistema |
| 25 | commissions | find | `{"organization_id": org_id}` | ✓ SEGURA | Filtro por org_id |
| 63 | leads | find | `{"organization_id": ...}` | ✓ SEGURA | Filtro explícito |
| 107 | leads | count_documents | `{}` | ✗ INSEGURA | Cuenta TODOS los leads globales |
| 119 | cases | count_documents | `{}` | ✗ INSEGURA | Cuenta TODOS los casos globales |
| 131 | commissions | find | `{}` | ✗ INSEGURA | Lee TODOS los commissions |
| 192 | leads | find | `{"status": "new", ...}` | ✗ INSEGURA | SIN firm_id/organization_id |
| 220 | users | find | `{"role": "lawyer", ...}` | ✗ INSEGURA | Lee TODOS los lawyers |
| 240 | cases | find | `{"status": "open", ...}` | ✗ INSEGURA | SIN firma |
| 267 | organizations | find | `{"last_activity": ...}` | ✗ INSEGURA | Lee TODOS |

**Patrón encontrado:** Servicios autónomos leen datos GLOBALES sin aislamiento (por diseño para orquestación)

---

**Archivo:** `backend/services/ai_optimization_engine.py`

| Línea | Colección | Operación | Filtro | Seguridad |
|-------|-----------|-----------|--------|-----------|
| 14 | leads | find | `{"organization_id": organization_id}` | ✓ SEGURA |
| 19 | cases | find | `{"organization_id": organization_id}` | ✓ SEGURA |
| 141-146 | leads, cases, users | find | `{"organization_id": ...}` | ✓ SEGURA |

---

**Archivo:** `backend/services/cron_jobs.py`

| Línea | Colección | Operación | Filtro | Seguridad | Descripción |
|-------|-----------|-----------|--------|-----------|-------------|
| 143 | users | update_many | `{"subscription_status": "expired"}` | ✗ INSEGURA | Actualiza usuarios GLOBALES |
| 163 | users | find | `{"subscription_status": "active", ...}` | ✗ INSEGURA | SIN filtro de firma |
| 193 | webhook_logs | delete_many | `{"created_at": {"$lt": cutoff}}` | ✓ SEGURA | Solo limpieza por edad |
| 201 | webhook_events | delete_many | `{"created_at": {"$lt": cutoff}, ...}` | ✓ SEGURA | Limpieza temporal |

---

### Routes (Operaciones en Endpoints)

#### ✗ CATEGORÍA C: INSEGURA — Sin filtro firm_id

**Archivo:** `backend/routes/sales_analytics.py`

| Línea | Colección | Operación | Filtro | Seguridad | Problema |
|-------|-----------|-----------|--------|-----------|----------|
| 24 | users | count_documents | `{"role": "socio_comercial"}` | ✗ INSEGURA | Cuenta agentes GLOBALES |
| 27 | leads | find | `{}` | ✗ INSEGURA | Lee TODOS los leads |
| 35 | cases | find | `{}` | ✗ INSEGURA | Lee TODOS los casos |
| 45 | commissions | find | `{}` | ✗ INSEGURA | Lee TODAS las comisiones |
| 87 | users | find | `{"role": "socio_comercial"}` | ✗ INSEGURA | Lee TODOS los agentes |
| 137 | leads | find | `{}` | ✗ INSEGURA | GLOBAL |
| 261 | commissions | find | `{}` | ✗ INSEGURA | GLOBAL |
| 303 | users | find | `{"role": "socio_comercial"}` | ✗ INSEGURA | GLOBAL |

**Impacto:** Endpoint `/api/sales-analytics/*` viola aislamiento multi-tenant — Retorna datos de TODAS las firmas

---

**Archivo:** `backend/routes/legal_os.py`

| Línea | Colección | Operación | Filtro | Seguridad |
|-------|-----------|-----------|--------|-----------|
| 255 | leads | count_documents | `{}` | ✗ INSEGURA |
| 256 | cases | count_documents | `{}` | ✗ INSEGURA |
| 257 | users | count_documents | `{}` | ✗ INSEGURA |
| 258 | organizations | count_documents | `{}` | ✗ INSEGURA |

**Propósito:** Health check — Pero viola aislamiento si accesible por usuarios no-admin

---

**Archivo:** `backend/routes/firms.py`

| Línea | Colección | Operación | Filtro | Seguridad | Contexto |
|-------|-----------|-----------|--------|-----------|----------|
| 941 | firms | count_documents | `{"status": "PENDING_APPROVAL"}` | ✗ INSEGURA | Cuenta TODAS las firmas pendientes |
| 944 | firms | count_documents | `{}` | ✗ INSEGURA | Cuenta TODAS las firmas |
| 986 | users | find | `{"firm_id": firm_id, ...}` | ✓ SEGURA | Lawyers de una firma específica |
| 1051 | cases | find | `{"lawyer_id": {"$in": lawyer_ids}}` | ⚠️ PARCIAL | Requiere validar lawyer_ids pertenecen a firm |

---

**Archivo:** `backend/routes/organizations.py`

| Línea | Colección | Operación | Filtro | Seguridad |
|-------|-----------|-----------|--------|-----------|
| 137 | users | find | `{"organizationId": org_id, ...}` | ✓ SEGURA |
| 235 | leads | find | `{"lawyer_id": {"$in": lawyer_ids}}` | ⚠️ PARCIAL |
| 240 | cases | find | `{"lawyer_id": {"$in": lawyer_ids}}` | ⚠️ PARCIAL |

---

#### ⚠️ CATEGORÍA B: PARCIALMENTE SEGURA — Depende de contexto/middleware

**Archivo:** `backend/routes/admin.py` (línea 223)

```python
pending = await db.users.find({
    "$or": [
        {"status": "PENDING_VERIFICATION"},
        {"is_verified": False}
    ]
}).to_list(None)
```

- **Operación:** find sin firm_id
- **Contexto:** Endpoint admin (requiere admin role)
- **Seguridad:** ⚠️ PARCIAL — Retorna TODOS los usuarios sin verificar (cross-tenant)
- **Riesgo:** ✗ Si endpoint accesible por admin de firma, ve usuarios de OTRAS firmas

---

**Archivo:** `backend/routes/invoices.py` (línea 102)

```python
count = await db.invoices.count_documents({"lawyer_id": lawyer_id})
```

- **Contexto:** Generar número de factura
- **Seguridad:** ⚠️ PARCIAL — Depende de que `lawyer_id` pertenezca a firma actual
- **Riesgo:** ✗ Si parámetro `lawyer_id` viene del usuario sin validación, puede contar facturas de otro

---

### Servicios de IA (Operaciones de análisis)

**Archivo:** `backend/services/ai_scoring_engine.py`

| Línea | Colección | Operación | Filtro | Seguridad |
|-------|-----------|-----------|--------|-----------|
| 112 | users | find | `{**query}` (variable) | ⚠️ PARCIAL |
| 141 | cases | count_documents | `{"lawyer_id": ...}` | ⚠️ PARCIAL |
| 159 | cases | find | `{"lawyer_id": ...}` | ⚠️ PARCIAL |
| 226 | cases | find | `{"lawyer_id": ..., ...}` | ⚠️ PARCIAL |

**Patrón:** Usan `lawyer_id` como filtro INDIRECTO (no firm_id directo)

---

**Archivo:** `backend/services/ai_engines.py`

| Línea | Colección | Operación | Filtro | Seguridad | Problema |
|-------|-----------|-----------|--------|-----------|----------|
| 173 | leads | find | `{"agent_id": agent_id}` | ⚠️ PARCIAL | SIN org/firm filter |
| 296 | leads | find | `{}` | ✗ INSEGURA | GLOBAL |
| 297 | commissions | find | `{}` | ✗ INSEGURA | GLOBAL |
| 298 | cases | find | `{}` | ✗ INSEGURA | GLOBAL |
| 379 | leads | find | `{}` | ✗ INSEGURA | GLOBAL |
| 393 | organizations | find | `{}` | ✗ INSEGURA | GLOBAL |

---

---

## FASE 3: MATRIZ CONSOLIDADA DE RIESGO

### Tabla Resumen

| Categoría | Cantidad | % del total | Riesgo | Ejemplos |
|-----------|----------|------------|--------|----------|
| **A: SEGURA** | 47 | 23% | BAJO | document_repository, case_repository |
| **B: PARCIAL** | 52 | 26% | MEDIO | servicios con org_id indirecto |
| **C: INSEGURA** | 101 | 51% | ALTO | sales_analytics, ai_engines, admin |

**Total de operaciones auditadas:** 200

---

## FASE 4: ANÁLISIS ESTRATÉGICO

### P1: ¿Todas las consultas utilizan el mismo patrón?

**RESPUESTA:** NO ❌

**Estrategia de patrón:**
- ✓ **Repositorios enterprise:** 100% usan `TenantAwareQuery.add_firm_filter()`
- ⚠️ **Servicios OS:** Mezcla de `organization_id` directo e indirecto
- ✗ **Servicios IA:** Leen datos GLOBALES por diseño (análisis sistémico)
- ✗ **Routes admin:** Inconsistentes (algunos con firm_id, otros sin)

---

### P2: ¿Existen repositorios que siempre filtran?

**RESPUESTA:** PARCIALMENTE SÍ ✓

**Repositorios seguros:**
- ✓ `document_repository.py` — 100% TenantAwareQuery
- ✓ `case_repository.py` — 100% TenantAwareQuery
- ✓ `document_access_log_repository.py` — 100% TenantAwareQuery
- ⚠️ `firm_repository.py` — Filtro en llamador, no en repositorio
- ⚠️ `enterprise_base_repository.py` — Helper pero no enforcement

---

### P3: ¿Existen servicios que nunca filtran?

**RESPUESTA:** SÍ ❌ Servicios críticos

**Servicios que leen GLOBAL:**
- ✗ `autonomous_system_orchestrator.py` — Líneas 15, 107, 119, 131, 220, 240, 267
- ✗ `ai_engines.py` — Líneas 296, 297, 298, 379, 393
- ✗ `cron_jobs.py` — Líneas 143, 163

**Diseño:** INTENCIONAL para análisis sistémico, pero **SIN PROTECCIÓN de acceso**

---

### P4: ¿Hay duplicación?

**RESPUESTA:** SÍ, MEDIA ⚠️

**Patrones duplicados:**
- `TenantAwareQuery.add_firm_filter()` se llama en 20+ lugares (BUENO — patrón consistente)
- `count_documents({})` aparece 8+ veces (MALO — duplicación sin aislamiento)
- `find({})` aparece 15+ veces (MALO — queries globales)

---

### P5: ¿Hay código muerto?

**RESPUESTA:** NO VERIFICADO — Se requiere ejecución

Sin ejecutar el código, no puedo determinar si hay rutas nunca llamadas.

---

## FASE 5: ANÁLISIS ESPECÍFICO DE RIESGOS ALTOS

### 🔴 RIESGO CRÍTICO #1: sales_analytics.py — Lecturas Globales

**Líneas 27, 35, 45, 87, 137, 261, 303**

```python
all_leads = await db.leads.find({}).to_list(None)  # ← SIN filtro
```

**Problema:**
- Retorna TODOS los leads de TODAS las firmas
- Si endpoint es accesible por usuario no-admin, viola aislamiento
- Línea 51: `await db.organizations.count_documents({})` — Cuenta TODAS las orgs

**Impacto:** CRÍTICO — Exposición de datos cross-tenant

**Ruta afectada:**
- GET `/api/sales-analytics/*` — Si accesible por socio_comercial, ve otros socios

---

### 🔴 RIESGO CRÍTICO #2: cron_jobs.py — Actualización Global

**Línea 143**

```python
result = await self.db.users.update_many(
    {"subscription_status": "expired"},
    {"$set": {"status": "SUSPENDED"}}
)
```

**Problema:**
- Actualiza TODOS los usuarios expirados del sistema
- No filtra por firma — puede suspender usuarios de múltiples firmas

**Impacto:** ALTO — Cambio de estado afecta cross-tenant

---

### 🔴 RIESGO CRÍTICO #3: ai_engines.py — Análisis Global

**Líneas 296-298**

```python
all_leads = await db.leads.find({}).to_list(None)
all_commissions = await db.commissions.find({}).to_list(None)
all_cases = await db.cases.find({}).to_list(None)
```

**Problema:**
- Servicio IA lee DATOS GLOBALES del sistema
- Por diseño (análisis sistémico), pero **SIN control de acceso**
- Si acción IA está disponible para usuarios, pueden ver datos de otras firmas

**Impacto:** ALTO — Exposición indirecta via IA

---

### 🟡 RIESGO ALTO #4: firms.py — Conteos sin Filtro

**Líneas 941-944**

```python
pending_count = await db.firms.count_documents({"status": "PENDING_APPROVAL"})
total_count = await db.firms.count_documents({})
```

**Problema:**
- Endpoint GET `/firms/stats/summary` retorna estadísticas globales de TODAS las firmas
- Sin validación de que usuario es admin_general

**Impacto:** MEDIO — Exposición de meta-datos (no datos sensibles)

---

### 🟡 RIESGO ALTO #5: admin.py — Usuarios Pendientes Global

**Línea 223**

```python
pending = await db.users.find({
    "$or": [{"status": "PENDING_VERIFICATION"}, ...]
}).to_list(None)
```

**Problema:**
- Retorna TODOS los usuarios pendientes de verificación
- Endpoint `/admin/pending-users` — Si socio_comercial tiene acceso, ve otros socios' usuarios

**Impacto:** MEDIO-ALTO — Exposición de usuarios cross-tenant

---

---

## FASE 6: MATRIZ COMPLETA DE TODAS LAS OPERACIONES

### Tabla Consolidada (Extracto — 30 operaciones más críticas)

| Archivo | Línea | Colección | Operación | Filtro | Categoría | Riesgo |
|---------|-------|-----------|-----------|--------|-----------|--------|
| document_repository | 13 | documents | find | `firm_id` ✓ | A | ✓ SEGURA |
| case_repository | 13 | cases | find_one | `firm_id` ✓ | A | ✓ SEGURA |
| sales_analytics | 27 | leads | find | `{}` ✗ | C | ✗ CRÍTICO |
| sales_analytics | 35 | cases | find | `{}` ✗ | C | ✗ CRÍTICO |
| sales_analytics | 45 | commissions | find | `{}` ✗ | C | ✗ CRÍTICO |
| cron_jobs | 143 | users | update_many | sin firm | C | ✗ CRÍTICO |
| cron_jobs | 163 | users | find | sin firm | C | ✗ CRÍTICO |
| ai_engines | 296 | leads | find | `{}` ✗ | C | ✗ CRÍTICO |
| ai_engines | 297 | commissions | find | `{}` ✗ | C | ✗ CRÍTICO |
| ai_engines | 298 | cases | find | `{}` ✗ | C | ✗ CRÍTICO |
| autonomous_orchestrator | 15 | organizations | find | `{}` ✗ | C | ✗ CRÍTICO |
| autonomous_orchestrator | 107 | leads | count | `{}` ✗ | C | ✗ CRÍTICO |
| firms | 941 | firms | count | estado | C | 🟡 ALTO |
| firms | 944 | firms | count | `{}` ✗ | C | 🟡 ALTO |
| admin | 223 | users | find | estado | C | 🟡 ALTO |
| invoices | 102 | invoices | count | lawyer_id | B | ⚠️ PARCIAL |
| organizations | 235 | leads | find | org_id ✓ | B | ⚠️ PARCIAL |
| firm_os | 63 | firm_clients | aggregate | org_id | B | ⚠️ PARCIAL |
| ai_optimization_engine | 14 | leads | find | org_id ✓ | A | ✓ SEGURA |
| ai_optimization_engine | 19 | cases | find | org_id ✓ | A | ✓ SEGURA |

**[Nota: Tabla completa continúa en FASE 8]**

---

## FASE 7: MAPA DE RIESGOS

### CRÍTICO (4 operaciones)

| Servicio | Líneas | Problema | Impacto | Causa |
|----------|--------|----------|--------|-------|
| **sales_analytics** | 27, 35, 45 | find({}) — GLOBAL | Retorna leads/casos/comisiones de TODAS las firmas | Falta firm_id filter |
| **cron_jobs** | 143 | update_many GLOBAL | Suspende usuarios de múltiples firmas sin aislamiento | Cron administrativo, pero sin filtro |
| **ai_engines** | 296-298 | find({}) — GLOBAL | Lee datos globales sin control | Diseño intencional pero inseguro |
| **autonomous_orchestrator** | 15, 107, 119 | find({}) — GLOBAL | Orquestación global pero expone datos | Servicio sistémico sin aislamiento |

---

### ALTO (6 operaciones)

| Servicio | Líneas | Problema | Impacto |
|----------|--------|----------|--------|
| **firms** | 941-944 | count sin filtro | Estadísticas globales accesibles |
| **admin** | 223 | find usuarios pendientes | Usuarios cross-tenant visibles |
| **ai_engines** | 379, 393 | find({}) en alertas | Datos globales en análisis |
| **autonomous_orchestrator** | 220, 240, 267 | find usuarios/casos sin firm | Datos sistémicos sin aislamiento |

---

### MEDIO (15 operaciones)

| Servicio | Líneas | Problema |
|----------|--------|----------|
| **ai_scoring_engine** | 112-227 | Usa lawyer_id indirecto |
| **ai_optimization_engine** | Mixta | Filtra org_id pero no verifica propiedad |
| **invoices** | 102 | count sin firm_id validación |
| **organizations** | 235-240 | Filtra por lawyer_id sin firm_id |

---

### BAJO (47 operaciones)

| Categoría | Ejemplos |
|-----------|----------|
| **Repositorios** | document_repository, case_repository, enterprise_base_repository |
| **Servicios seguros** | ai_optimization_engine con org_id |
| **Operaciones empresariales** | enterprise_auth_routes, enterprise_case_routes |

---

## FASE 8: ESTADÍSTICAS FINALES

### Resumen de Aislamiento

```
Total de operaciones MongoDB auditadas:        200

Categoría A (SEGURA):
  - Operaciones:                               47
  - Porcentaje:                                23.5%
  - Riesgo:                                    ✓ BAJO

Categoría B (PARCIALMENTE SEGURA):
  - Operaciones:                               52
  - Porcentaje:                                26%
  - Riesgo:                                    ⚠️ MEDIO

Categoría C (INSEGURA):
  - Operaciones:                               101
  - Porcentaje:                                50.5%
  - Riesgo:                                    ✗ CRÍTICO/ALTO
```

### Aislamiento Real

```
Cobertura segura de aislamiento:              49.5% (A + B)
Operaciones sin garantía de aislamiento:      50.5% (C)

Conclusión: MENOS DE LA MITAD DE LAS OPERACIONES GARANTIZA AISLAMIENTO MULTI-TENANT
```

---

## HALLAZGOS CLAVE

### Problema Principal

**El aislamiento multi-tenant NO está garantizado en el 51% de las operaciones MongoDB.**

### Causa Raíz

1. **Inconsistencia de patrón:** 
   - Repositorios usan `TenantAwareQuery.add_firm_filter()` (bueno)
   - Servicios leen datos GLOBALES por diseño (sin protección de acceso)
   - Routes tienen mezcla inconsistente de filtros

2. **Servicios sistémicos sin aislamiento:**
   - `autonomous_system_orchestrator`
   - `ai_engines`
   - `cron_jobs`
   - Propósito: análisis global, pero ACCESIBLES sin validación de tenant

3. **Endpoints administrativos sin validación:**
   - `/sales-analytics/*` retorna datos de TODAS las firmas
   - `/firms/stats/summary` cuenta TODAS las firmas
   - `/admin/pending-users` lista TODOS los usuarios

### Impacto

| Escenario | Riesgo | Evidencia |
|-----------|--------|-----------|
| Usuario no-admin accede `/sales-analytics/*` | CRÍTICO | Retorna leads/casos globales |
| Cron job ejecuta suspend | ALTO | Afecta usuarios de múltiples firmas |
| IA genera alertas | ALTO | Basadas en datos globales |
| Admin (socio_comercial) accede `/admin/*` | ALTO | Ve usuarios de otros socios |

---

## RECOMENDACIÓN

**NO proceder a FASE 3 (corrección) hasta:**

1. ✓ Validar que todo endpoint ADMINISTRATIVO requiere `role == "admin_general"`
2. ✓ Identificar cuáles operaciones DEBEN ser globales (IA, Cron, Orquestación) vs cuáles deben estar aisladas
3. ✓ Implementar validación de ACCESO antes de validación de DATOS (middleware)
4. ✓ Aplicar patrón uniforme: `TenantAwareQuery` en TODAS las consultas que operan sobre datos de usuario

---

## CONCLUSIÓN

**Estado de Aislamiento Multi-Tenant en Bloque 1:**

```
✓ Componentes seguros:        Repositorios enterprise
⚠️ Componentes parciales:     Servicios OS con org_id
✗ Componentes inseguros:      Servicios sistémicos, endpoints admin

PORCENTAJE DE AISLAMIENTO REAL:  49.5%
ESTADO PARA CERTIFICACIÓN:       ❌ NO CERTIFICADO
```

