# FASE 2.5: DEFINICIÓN DEL CONTRATO OFICIAL MULTI-TENANT

## Objetivo
Definir el identificador canónico y oficial que utilizará **Punto Cero System OS** para identificar un tenant en toda la plataforma, pensando en expansión futura a múltiples verticales, países y tipos de empresa.

---

## 1. MAPEO DE IDENTIFICADORES EXISTENTES

### 1.1 Identificadores Encontrados

| ID | Ubicación | Contexto | Frecuencia | Estado |
|----|-----------|---------|-----------| -------|
| **firm_id** | `backend/routes/firms.py`, `backend/middleware/tenant_isolation.py`, `frontend/hooks/useFirmOnboarding.js`, `user.firm_id` | Identifica firmas jurídicas | ALTA | Activo |
| **tenant_id** | `backend/utils/tenant.py`, `backend/middleware/mode_resolver.py`, Headers `X-Tenant-ID`, tests | Genérico (tenant cualquiera) | MEDIA | Activo |
| **organization_id** | `backend/routes/organizations.py`, `backend/models/organization.py`, `user.organizationId` | OS: organizaciones multi-verticales | MEDIA | Emergente |
| **org_id** | `backend/routes/ai_autopilot.py`, `frontend/admin/pages/AICopilot.jsx` | Alias de organization_id | BAJA | Inconsistente |
| **workspace_id** | Búsqueda no encontrada | N/A | NULA | No existe |
| **company_id** | Búsqueda no encontrada | N/A | NULA | No existe |

### 1.2 Estructura Actual por Capas

#### Base de Datos (MongoDB Collections)

```
┌─ db.firms
│  ├─ _id: ObjectId (firmas jurídicas)
│  ├─ name: string
│  ├─ nit: string (único por firma)
│  ├─ owner_id: string (referencia a user._id)
│  ├─ status: "PENDING_APPROVAL" | "ACTIVE" | "REJECTED"
│  ├─ trial_status: "active" | "expired" | "not_started"
│  └─ [PATRÓN: no tiene tenant_id ni organization_id]

├─ db.organizations (Punto Cero OS)
│  ├─ _id: ObjectId (org multi-vertical: Medicina, Odontología, Jurídico)
│  ├─ tenantId: string (REFERENCIA AL TENANT)
│  ├─ name: string
│  ├─ vertical: "Medicina" | "Odontología" | "Jurídico"
│  ├─ plan: "Essential" | "Professional" | "Enterprise"
│  └─ [PATRÓN: SÍ tiene tenantId]

├─ db.users
│  ├─ _id: ObjectId
│  ├─ email: string
│  ├─ firm_id: string (OPCIONAL: firma jurídica si es abogado)
│  ├─ organizationId: string (OPCIONAL: org OS si es usuario OS)
│  ├─ tenant_id: string (OPCIONAL: tenant canónico)
│  ├─ tenantId: string (OPCIONAL: variante del anterior)
│  └─ [PATRÓN: INCONSISTENCIA - múltiples referencias de tenant]

└─ db.partners, db.subscriptions, db.implementations
   ├─ tenantId: string (PATRÓN CONSISTENTE EN OS)
   └─ [PATRÓN: Punto Cero OS usa tenantId]
```

#### Frontend (localStorage + Context)

```
┌─ user objeto en localStorage
│  ├─ user.firm_id: string (desde JWT o user doc)
│  ├─ user.organizationId: string (desde JWT o user doc)
│  ├─ user.tenant_id: string (NO encontrado)
│  └─ [PATRÓN: Usa firm_id para Firm OS, organizationId para OS]

├─ TenantContext
│  ├─ tenantId: string (valor por defecto "demo")
│  ├─ organizationId: string
│  ├─ tenantName: string
│  └─ [PATRÓN: Define contexto de "tenant"]

└─ Headers (getTenantHeaders())
   ├─ X-Tenant-ID (del context tenantId)
   ├─ X-Organization-ID (del context organizationId)
   └─ [PATRÓN: Mantiene dos headers separados]
```

#### Backend (Routes + Middleware)

```
┌─ middleware/tenant_isolation.py
│  ├─ Espera: X-Firm-ID header
│  ├─ TenantContext.firm_id: string
│  └─ [PATRÓN: Especializado para firmas]

├─ utils/tenant.py
│  ├─ Lee: X-Tenant-ID header
│  ├─ Lee: X-Organization-ID header
│  ├─ Fallback a: user.tenant_id o user.tenantId
│  ├─ Variables: tenant_id, organization_id
│  └─ [PATRÓN: Genérico para tenants]

├─ routes/firms.py
│  ├─ Crea: db.firms con _id (ObjectId)
│  ├─ Crea user con: firm_id = str(firm._id)
│  └─ [PATRÓN: firm_id = string(firm._id)]

└─ routes/organizations.py
   ├─ Lee: organization_id desde context
   ├─ Query: db.organizations.find_one({"_id": ObjectId(organization_id)})
   └─ [PATRÓN: organization_id = string(organization._id)]
```

---

## 2. QUID REPRESENTA REALMENTE LA EMPRESA JURÍDICA

### Análisis

**La firma jurídica (`db.firms`) se representa de TRES formas diferentes:**

| Representación | Uso | Problemas |
|---|---|---|
| **firm._id (ObjectId)** | PK en MongoDB | Nunca se envía al frontend |
| **firm_id = str(firm._id)** | JWT, user.firm_id, DB query | Inconsistencia de nombre (debería ser algo más genérico) |
| **organization_id cuando vertical="Jurídico"** | Punto Cero OS | Solo si se convierte firma en organización OS |

**Conclusión:** La firma jurídica es un **tipo específico de organización** en el contexto de Punto Cero System OS, pero históricamente se ha tratado como una entidad separada.

### El Problema Arquitectónico

```
ANTES (Punto Cero Legal aislado):
  User → firm_id → Firm

AHORA (Punto Cero System OS multi-vertical):
  User → organizationId → Organization {vertical, plan}
  
CONFLICTO:
  ¿Un usuario de una firma jurídica tiene firm_id O organizationId?
  → Actualmente: AMBOS (redundancia y confusión)
```

---

## 3. IDENTIFICADOR CANÓNICO RECOMENDADO: `organization_id`

### Recomendación Formal

**Identificador Canónico:** `organization_id`

**Justificación:**

1. **Escalabilidad Futura**
   - ✓ Soporta Punto Cero Legal (firmas jurídicas)
   - ✓ Soporta Punto Cero Health (clínicas, hospitales)
   - ✓ Soporta Punto Cero Retail (negocios)
   - ✓ Agnóstico de vertical
   - ✗ firm_id está limitado a "firma jurídica"

2. **Consistencia con Punto Cero OS**
   - ✓ `db.organizations` ya usa `_id` como PK
   - ✓ `db.partners`, `db.subscriptions` ya usan `tenantId`
   - ✓ Punto Cero OS es el estándar emergente
   - ✗ firm_id es legado

3. **Unificación**
   - ✓ Un único identificador para todo tenant (independiente de vertical)
   - ✓ Simplifica JWT (un claim instead de `firm_id` + `organization_id`)
   - ✓ Simplifica headers (X-Organization-ID instead of X-Tenant-ID + X-Firm-ID)
   - ✗ Mantener ambos causa duplicación

4. **Compatibilidad hacia Atrás**
   - ✓ Mapeo de firm_id a organization_id es determinista
   - ✓ Período de transición permitido
   - ✓ Puedo mantener firm_id como alias durante migración

### Estructura Recomendada del Tenant

```python
# Identificador Canónico
organization_id: string = str(organization._id)

# Metadatos
organization {
  _id: ObjectId
  type: "firm" | "clinic" | "shop" | ...  # Vertical
  name: string
  country: string
  plan: "essential" | "professional" | "enterprise"
  owner_id: string  # referencia a user._id
}

# User Association
user {
  _id: ObjectId
  email: string
  organization_id: string  # CANÓNICO
  # DEPRECATED (backward compat):
  firm_id: string = organization_id  # si type="firm"
}
```

---

## 4. IMPACTO: COMPONENTES QUE CAMBIAN

### 4.1 JWT Payload

**Actual:**
```json
{
  "sub": "lawyer@firma.com",
  "role": "lawyer",
  "exp": 1234567890
}
```

**Recomendado (v2):**
```json
{
  "v": 2,
  "sub": "lawyer@firma.com",
  "user_id": "507f1f77bcf86cd799439011",
  "organization_id": "507f1f77bcf86cd799439012",
  "organization_type": "firm",
  "role": "lawyer",
  "exp": 1234567890
}
```

**Cambios:**
- ✓ Agregar `v` (versión para compatibilidad)
- ✓ Agregar `user_id` (evita N+1 query)
- ✓ Agregar `organization_id` (reemplaza firm_id)
- ✓ Agregar `organization_type` (permite validación vertical)
- ✗ Mantener `sub` para backward compat

**Impacto:** 
- 150+ rutas autenticadas ✓ (pueden usar nuevo claim)
- 18+ rutas multi-tenant ✓ (ahora tienen organization_id disponible)
- Frontend auth context ✓ (recibe user_id, organization_id, role)

### 4.2 Headers HTTP

**Actual:**
```
X-Tenant-ID: <string>
X-Organization-ID: <string>
X-Firm-ID: <string>  # Esperado por middleware pero nunca enviado
```

**Recomendado:**
```
X-Organization-ID: <string>  # Identificador canónico
```

**Cambios:**
- ✗ Eliminar X-Tenant-ID (redundante)
- ✓ Mantener X-Organization-ID (canónico)
- ✗ Eliminar X-Firm-ID (nunca se usó)
- ✓ Agregar X-Organization-Type: "firm" | "clinic" | "shop" (opcional)

**Impacto:**
- Middleware tenant_isolation.py ✓ (reemplaza X-Firm-ID por X-Organization-ID)
- utils/tenant.py ✓ (simplifica a un solo header)
- Frontend getTenantHeaders() ✓ (envía X-Organization-ID)

### 4.3 Middleware

**Actual (middleware/tenant_isolation.py):**
```python
firm_id = request.headers.get("X-Firm-ID")  # ❌ Nunca se envía
tenant_context = TenantContext(firm_id=..., user_id=..., ...)
```

**Recomendado:**
```python
organization_id = request.headers.get("X-Organization-ID")
organization_type = request.headers.get("X-Organization-Type")
tenant_context = TenantContext(
    organization_id=..., 
    organization_type=...,
    user_id=..., 
    role=...
)
```

**Impacto:**
- `TenantContext` ✓ (reemplaza firm_id por organization_id)
- `get_tenant_context()` ✓ (simplificada)
- `TenantIsolationValidator` ✓ (valida organization_id, no firm_id)

### 4.4 Repositorios

**Actual:**
```python
# backend/repositories/enterprise_base_repository.py
async def find_by_id(self, firm_id: str, resource_id: str):
    return await self.collection.find_one({
        "firm_id": firm_id,
        "_id": ObjectId(resource_id)
    })
```

**Recomendado:**
```python
async def find_by_id(self, organization_id: str, resource_id: str):
    return await self.collection.find_one({
        "organization_id": organization_id,
        "_id": ObjectId(resource_id)
    })
```

**Impacto:**
- CaseRepository ✓ (busca por organization_id)
- DocumentRepository ✓ (busca por organization_id)
- Todas las queries ✓ (añaden organization_id filter)

### 4.5 Servicios

**Actual:**
```python
# backend/services/enterprise_case_service.py
async def list_by_firm(self, firm_id: str):
    return await self.case_repo.find_many(firm_id=firm_id)
```

**Recomendado:**
```python
async def list_by_organization(self, organization_id: str):
    return await self.case_repo.find_many(organization_id=organization_id)
```

**Impacto:**
- CaseService ✓ (list_by_organization)
- DocumentService ✓ (list_by_organization)
- UserService ✓ (list_by_organization)
- PermissionService ✓ (check por organization_id)

### 4.6 Frontend

**Actual:**
```javascript
// frontend/hooks/useFirmOnboarding.js
const firmId = user?.firm_id;
const res = await axios.get(`${API}/firm-config/${user.firm_id}`, {...});

// frontend/security/tenantStorage.js
const headers = {};
if (t?.tenantId) headers["X-Tenant-ID"] = String(t.tenantId);
if (t?.organizationId) headers["X-Organization-ID"] = String(t.organizationId);
```

**Recomendado:**
```javascript
// frontend/hooks/useOrganizationData.js
const organizationId = user?.organization_id;
const res = await axios.get(
  `${API}/organizations/${user.organization_id}`,
  {...}
);

// frontend/security/tenantStorage.js
const headers = {};
if (t?.organizationId) headers["X-Organization-ID"] = String(t.organizationId);
// Mantener firm_id como alias para backward compat:
if (!t?.organizationId && t?.firmId) {
  headers["X-Organization-ID"] = String(t.firmId);
}
```

**Impacto:**
- Cambios en 40+ componentes (useFirmOnboarding, OfficesPage, FirmTeam, FirmSettings, etc.)
- getTenantHeaders() simplificada (un solo header)
- TenantContext simplificado (tenantId → organizationId)

### 4.7 Rutas Backend

**Actual:**
```python
@router.get("/{firm_id}/lawyers")
async def get_firm_lawyers(firm_id: str, ...):
    oid = ObjectId(firm_id)
    firm = await db.firms.find_one({"_id": oid})
    ...
```

**Recomendado:**
```python
@router.get("/{organization_id}/lawyers")
async def get_organization_lawyers(organization_id: str, ...):
    oid = ObjectId(organization_id)
    org = await db.organizations.find_one({"_id": oid})
    ...
```

**Impacto:**
- Routes con `/firms/{firm_id}/*` → `/organizations/{organization_id}/*`
- Búsquedas en db.firms → búsquedas en db.organizations (cuando sea aplicable)
- 30+ rutas en firms.py

---

## 5. ESTRATEGIA DE COMPATIBILIDAD HACIA ATRÁS

### 5.1 Principio de No-Ruptura

**Objetivo:** Migrar a `organization_id` sin romper frontend, clientes activos, ni integraciones.

### 5.2 Plan de Transición (3 fases)

#### FASE A: Habilitación Dual (Semana 1-2)

```python
# backend/utils/auth.py
def create_access_token(data: dict, ...):
    to_encode = data.copy()
    
    # NUEVO: versión 2 con organization_id
    to_encode.update({
        "v": 2,
        "user_id": str(user.get("_id")),
        "organization_id": str(user.get("organization_id")),
        "organization_type": org.get("type"),
        
        # LEGACY: backward compat
        "firm_id": str(user.get("firm_id")) if user.get("firm_id") else None,
    })
    
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
```

**Frontend (no requiere cambios):**
```javascript
// Sigue funcionando con firm_id del token
const firmId = decoded.firm_id || decoded.organization_id;
```

**Backend (acepta ambos):**
```python
@router.get("/{identifier}/lawyers")  # identifier puede ser firm_id u org_id
async def get_lawyers(identifier: str, ctx=Depends(get_tenant_context)):
    # Intenta buscar por organization_id primero, luego firm_id
    org = await db.organizations.find_one({"_id": ObjectId(identifier)})
    if not org:
        # Fallback: buscar en legacy firms (solo si type="firm")
        org = await db.firms.find_one({"_id": ObjectId(identifier)})
    ...
```

**Headers (aceptan ambos):**
```python
# middleware/tenant_isolation.py
organization_id = (
    request.headers.get("X-Organization-ID") or  # Nuevo
    request.headers.get("X-Firm-ID")  # Legacy
)
```

**Duración:** 2 semanas. Tiempo suficiente para detectar breaking changes.

#### FASE B: Deprecación (Semana 3-4)

```
- Tokens v1 (sin organization_id): WARNINGS en logs
- Headers X-Firm-ID: WARNINGS en logs
- Frontend: Actualizar getTenantHeaders() para usar organization_id
- Clientes API: Notificación de cambio inminente
```

**Actualización de cliente API (ejemplo):**
```
ANTES: X-Firm-ID: firm-123
AHORA: X-Organization-ID: 507f1f77bcf86cd799439012
```

#### FASE C: Eliminación (Semana 5+)

```
- Eliminar soporte para firm_id en JWT
- Eliminar soporte para X-Firm-ID header
- Requerir X-Organization-ID
- Eliminar rutas /firms/{firm_id}/* (mover todo a /organizations/{org_id}/*)
```

### 5.3 Estrategia de Datos

**Mapeo de datos existentes (ejecutar una sola vez):**

```python
# script: migrate_firm_to_organization.py

async def migrate():
    """Convierte cada firma en una organización"""
    
    # PASO 1: Crear organización por cada firma
    async for firm in db.firms.find():
        org_doc = {
            "type": "firm",
            "name": firm.get("name"),
            "country": firm.get("country"),
            "plan": firm.get("subscription_plan") or "trial",
            "status": "active" if firm.get("status") == "ACTIVE" else "suspended",
            "ownerId": firm.get("owner_id"),
            "created_at": firm.get("created_at"),
            "updated_at": firm.get("updated_at"),
        }
        result = await db.organizations.insert_one(org_doc)
        organization_id = str(result.inserted_id)
        
        # PASO 2: Actualizar firma con referencia a organización
        await db.firms.update_one(
            {"_id": firm["_id"]},
            {"$set": {"organization_id": organization_id}}
        )
        
        # PASO 3: Actualizar usuarios de esa firma
        await db.users.update_many(
            {"firm_id": str(firm["_id"])},
            {"$set": {"organization_id": organization_id}}
        )
        
        # PASO 4: Actualizar todos los documentos que referencien firm_id
        for collection_name in ["cases", "documents", "invoices", "leads"]:
            await db[collection_name].update_many(
                {"firm_id": str(firm["_id"])},
                {"$set": {"organization_id": organization_id}}
            )
    
    print("Migración completada")
```

**Datos después de migración:**
```
db.firms
├─ _id: ObjectId
├─ organization_id: string  (NUEVO: referencia a db.organizations._id)
├─ legacy_firm_id: string   (Histórico)
└─ ... resto de campos

db.organizations  (NUEVO)
├─ _id: ObjectId
├─ type: "firm" | "clinic" | ...
├─ name: string
└─ ...

db.users
├─ _id: ObjectId
├─ organization_id: string  (NUEVO: canónico)
├─ firm_id: string          (LEGACY: único si type="firm")
└─ ...

db.cases, db.documents, etc.
├─ _id: ObjectId
├─ organization_id: string  (NUEVO: canónico)
├─ firm_id: string          (LEGACY: durante transición)
└─ ...
```

---

## 6. TABLA RESUMEN: CAMBIOS POR COMPONENTE

| Componente | Actual | Recomendado | Impacto | Período |
|-----------|--------|-------------|--------|---------|
| **JWT** | {sub, role, exp} | {v, sub, user_id, org_id, org_type, role, exp} | 150+ endpoints | Fase A (dual) → C |
| **Headers** | X-Tenant-ID, X-Organization-ID, X-Firm-ID | X-Organization-ID | Middleware, frontend | Fase A (dual) → C |
| **Middleware** | firm_id → TenantContext | organization_id → TenantContext | 18+ endpoints | Fase A (dual) → C |
| **Repositorios** | firm_id en queries | organization_id en queries | 7 servicios | Fase B → C |
| **Servicios** | list_by_firm() | list_by_organization() | 7 servicios | Fase B → C |
| **Routes** | /firms/{firm_id}/* | /organizations/{org_id}/* | 30+ rutas | Fase B → C |
| **Frontend** | user.firm_id, tenantId | user.organization_id | 40+ componentes | Fase A (dual) → C |
| **MongoDB** | firm_id en documents | organization_id en documents | Datos | Script migración |

---

## 7. MAPA DE CAMBIOS MÍNIMOS (Fase 0)

**Para integrar TenantIsolationMiddleware correctamente:**

### 7.1 Decisión de Diseño

**OPCIÓN A (Conservadora):** Mantener firm_id, reemplazar solo internamente
- Menos cambios en frontend
- Más compatibilidad inmediata
- Pero perpetúa inconsistencia

**OPCIÓN B (Progresiva - RECOMENDADA):** Migrar a organization_id escalonadamente
- Corrección arquitectónica fundamental
- Prepara para futuro multi-vertical
- Período de transición manejable

### 7.2 Pasos Mínimos para FASE 0 (Prerrequisitos)

1. **JWT - Agregar claims:**
   - ✓ user_id (evita N+1)
   - ✓ organization_id (nuevo canónico)
   - ✓ v: 2 (versioning)
   - ✓ organization_type (context)

2. **Middleware - Actualizar esperado:**
   - ✓ X-Organization-ID header (reemplaza X-Firm-ID)
   - ✓ TenantContext(organization_id, organization_type)
   - ✓ Aceptar X-Tenant-ID como fallback (2 semanas)

3. **Frontend - Actualizar headers:**
   - ✓ getTenantHeaders() → envía X-Organization-ID
   - ✓ TenantContext.organizationId (ya existe)
   - ✓ Compatibilidad con firmware viejo (optional)

4. **Datos - Script de migración:**
   - ✓ Crear db.organizations por cada db.firm
   - ✓ Referenciar en users, cases, documents
   - ✓ Mantener firm_id como alias 2 semanas

5. **Rutas - Dual support (2 semanas):**
   - ✓ Aceptar tanto /firms/{id}/* como /organizations/{id}/*
   - ✓ Internamente usar organization_id
   - ✓ Logging de deprecación

---

## 8. CONCLUSIÓN Y RECOMENDACIÓN

### Recomendación Final

**Identificador Canónico Oficial:** `organization_id`

**Razonamiento:**
1. ✓ Soporta Punto Cero Legal (firmas = tipo "firm")
2. ✓ Soporta futura expansión (clínicas, negocios)
3. ✓ Unifica JWT y headers
4. ✓ Simplifica arquitectura
5. ✓ Estrategia de migración clara y sin ruptura

**Timeline:**
- **FASE A (2 semanas):** Dual support (ambos sistemas funcionan)
- **FASE B (2 semanas):** Deprecación (warnings)
- **FASE C (después):** Limpieza (solo organization_id)

**Próximo Paso:** Implementación de FASE 0 (prereq uisitos) antes de corregir TenantIsolationMiddleware.

