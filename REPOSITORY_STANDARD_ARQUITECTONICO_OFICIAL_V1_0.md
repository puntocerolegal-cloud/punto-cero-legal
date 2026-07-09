# Repository Standard v1.0
## Especificación Arquitectónica Oficial de Punto Cero System OS

**Tipo de Documento:** Especificación Arquitectónica  
**Versión:** 1.0  
**Vigencia:** Todos los repositorios presentes y futuros  
**Autoridad:** Principal Software Architect, Enterprise Software Architect  
**Validez Legal:** Estándar vinculante para aceptación de cualquier repositorio en el ecosistema  

---

## 0. OBJETIVO Y ALCANCE

### 0.1 Objetivo Principal

Definir un **contrato arquitectónico universal** que garantice:
- **Aislamiento multi-tenant obligatorio** en TODOS los repositorios
- **Seguridad de datos** contra acceso y modificación cross-tenant
- **Integridad arquitectónica** mediante restricciones no negociables
- **Extensibilidad futura** sin comprometer el contrato público

### 0.2 Alcance

Este estándar aplica a:
✅ Todos los repositorios actuales (4 existentes)  
✅ Todos los repositorios futuros (22+ pendientes)  
✅ Verticales futuras (multiempresa, multipaís, IA, RAG, servicios distribuidos)  

Este estándar NO aplica a:
❌ Servicios que NO heredan de BaseRepository  
❌ Utilidades de MongoDB directas (utils, middleware)  
❌ Helpers que NO son repositorios  

### 0.3 Principios Fundadores

```
1. SEGURIDAD FIRST
   Toda decisión arquitectónica prioriza prevención de data leakage
   
2. TENANT OBLIGATORIO
   firm_id es un ciudadano de primera clase, nunca opcional
   
3. INVARIANCIA
   Métodos base NUNCA cambian; solo se extienden
   
4. VERIFICABILIDAD
   Todo debe ser auditado, trazable, y verificable
   
5. FUTURO-COMPATIBLE
   El contrato público NUNCA cambia; solo se agregan responsabilidades
```

---

## 1. RESPONSABILIDADES OBLIGATORIAS

### 1.1 ¿Qué DEBE Hacer Siempre un Repository?

#### **Responsabilidad 1: Garantizar Aislamiento firm_id**

**Definición:** Todo documento accedido debe pertenencer al firm_id solicitante.

**Evidencia en codebase:**
```
BaseRepository.create()        línea 50   → data["firm_id"] = firm_id
BaseRepository.find_by_id()    línea 89   → query["firm_id"] = firm_id
BaseRepository.find_many()     línea 137  → query["firm_id"] = firm_id (inyección)
BaseRepository.update()        línea 187  → query["firm_id"] = firm_id (WHERE)
BaseRepository.soft_delete()   línea 240  → query["firm_id"] = firm_id (WHERE)

CaseRepository.find_by_case_number()    línea 14  → TenantAwareQuery
DocumentRepository.find_by_case()       línea 13  → TenantAwareQuery
DocumentAccessLogRepository.log_access() línea 13 → firm_id inyectado
```

**Mecanismo Técnico:**
```
CREATE:  Inyección obligatoria en documento
READ:    Filtro automático en query
UPDATE:  Filtro obligatorio en cláusula WHERE
DELETE:  Filtro obligatorio en cláusula WHERE
BULK:    Filtro a cada operación individual
SEARCH:  Inyección automática vía TenantAwareQuery
AGGREGATE: Primer stage DEBE ser $match con firm_id
```

**Incumplimiento:** ❌ CRÍTICO — Data leakage entre tenants (VIOLACIÓN DE SEGURIDAD)

---

#### **Responsabilidad 2: Implementar Auditoría Completa**

**Definición:** Toda operación CRUD debe ser registrable, trazable y verificable.

**Evidencia en codebase:**
```
BaseRepository.create()       línea 55-58   → logger.info([collection] CREATE ...)
BaseRepository.find_by_id()   línea 97-105  → logger.debug([collection] FIND_BY_ID ...)
BaseRepository.update()       línea 202-206 → logger.info([collection] UPDATE ...)
BaseRepository.soft_delete()  línea 248-252 → logger.info([collection] SOFT_DELETE ...)
BaseRepository.hard_delete()  línea 285-289 → logger.warning([collection] HARD_DELETE ...)

CaseRepository.ensure_indexes() línea 77-84 → Índices para auditoría (firm_id, created_at)
```

**Información Auditada Mínima:**
```
CREATE:
  ✅ Colección
  ✅ firm_id
  ✅ document_id (resultado)
  ✅ request_id (trazabilidad HTTP)
  ✅ timestamp
  ✅ operación (CREATE, READ, UPDATE, DELETE)

READ:
  ✅ Colección
  ✅ firm_id
  ✅ document_id (si aplica)
  ✅ request_id
  ✅ found / not_found

UPDATE/DELETE:
  ✅ Colección
  ✅ firm_id
  ✅ document_id
  ✅ operación específica
  ✅ request_id
```

**Incumplimiento:** ⚠️ ALTO — Imposible auditar acceso indebido

---

#### **Responsabilidad 3: Crear Índices Optimales**

**Definición:** Indices deben garantizar performance de queries tenant-scoped sin degradación.

**Evidencia en codebase:**
```
BaseRepository.create_index()         línea 309-330  → Método para crear índices
CaseRepository.ensure_indexes()       línea 77-84    → Implementación requerida
DocumentRepository.ensure_indexes()   línea 102-111  → Implementación requerida
DocumentAccessLogRepository.ensure_indexes() línea 72-79 → Implementación requerida
FirmRepository.ensure_indexes()       (implícito)    → Implementación requerida

Patrón encontrado:
  - TODOS tienen [("firm_id", 1)] obligatorio
  - TODOS tienen índices compuestos [("firm_id", 1), ("field", 1)]
  - TODOS tienen índices únicos para campos únicos por tenant
```

**Incumplimiento:** ⚠️ MEDIO — Queries lentas, degradación de performance

---

#### **Responsabilidad 4: Manejar Errores Apropiadamente**

**Definición:** Errores deben ser capturados, loguados y relevanciados sin exposición de datos.

**Evidencia en codebase:**
```
BaseRepository.create()        línea 52-64   → try/except con logger.error
BaseRepository.find_by_id()    línea 87-110  → try/except con logger.error
BaseRepository.update()        línea 184-212 → try/except con logger.error
BaseRepository.soft_delete()   línea 235-257 → try/except con logger.error
BaseRepository.hard_delete()   línea 277-294 → try/except con logger.error
BaseRepository.create_index()  línea 324-330 → try/except con logger.error
```

**Patrón Obligatorio:**
```
try:
    operación_mongodb()
except Exception as e:
    logger.error(f"[COLLECTION] OPERATION error: {str(e)}")
    raise  # ← RE-LANZAR SIEMPRE (responsabilidad del servicio)
```

**Incumplimiento:** ❌ CRÍTICO — Silent failures, datos inconsistentes

---

### 1.2 ¿Qué NUNCA Debe Hacer un Repository?

#### **Prohibición 1: Acceso Directo a MongoDB Sin Filtro firm_id**

❌ **PROHIBIDO:**
```python
# En cualquier método público:
await self.collection.find_one({"field": value})  # SIN firm_id
await self.collection.find({"field": value})      # SIN firm_id
await self.collection.update_one({...}, {...})    # SIN firm_id en WHERE
await self.collection.delete_one({...})           # SIN firm_id en WHERE
```

✅ **OBLIGATORIO:**
```python
# Patrón correcto:
query = TenantAwareQuery.add_firm_filter({"field": value}, firm_id)
await self.collection.find_one(query)
```

**Riesgo Técnico:** Data leakage cross-tenant (VIOLACIÓN CRÍTICA)

---

#### **Prohibición 2: Sobrescribir Métodos Base Sin Autorización**

❌ **PROHIBIDO:**
```python
class NuevoRepository(BaseRepository):
    async def create(...):  # ← Sobrescribir CREATE
        ...
    
    async def find_by_id(...):  # ← Sobrescribir READ
        ...
    
    async def update(...):  # ← Sobrescribir UPDATE
        ...
    
    async def soft_delete(...):  # ← Sobrescribir DELETE
        ...
```

**Métodos Inmutables (NUNCA sobrescribir):**
1. `create()` — Inyecta firm_id automáticamente
2. `find_by_id()` — Filtra siempre por firm_id
3. `update()` — Valida firm_id en WHERE
4. `soft_delete()` — Marca deleted_at con firm_id
5. `count_by_firm()` — Conteo tenant-scoped

**Verificación en codebase:**
```
✅ CaseRepository          — NO sobrescribe create, find_by_id, update
✅ DocumentRepository      — NO sobrescribe create, find_by_id, update
✅ FirmRepository          — NO sobrescribe create, find_by_id, update
✅ DocumentAccessLogRepository — NO sobrescribe create, find_by_id
```

**Riesgo Técnico:** Perder garantías de aislamiento

---

#### **Prohibición 3: Ejecutar Operaciones Globales Sin Documentación Explícita**

❌ **PROHIBIDO:**
```python
# Métodos que retornan datos SIN filtro firm_id:
async def list_all_documents(self):  # ← GLOBAL, no tenant-scoped
    return await self.collection.find({}).to_list(None)

async def count_all(self):  # ← GLOBAL
    return await self.collection.count_documents({})

async def get_statistics(self):  # ← GLOBAL
    return await self.collection.aggregate([...]).to_list(None)
```

✅ **PERMITIDO (si está documentado como global):**
```python
# Método EXPLÍCITAMENTE marcado como global:
async def list_all_documents_global(self) -> List[Dict]:
    """
    OPERACIÓN GLOBAL — NO FILTRA POR firm_id
    
    Razón: Este método es para estadísticas administrativas globales
    Usado por: Admin dashboard, reportes de sistema
    Seguridad: Requiere rol admin explícito en servicio/ruta
    """
    return await self.collection.find({}).to_list(None)
```

**Patrón:** Métodos globales DEBEN estar explícitamente documentados

---

#### **Prohibición 4: Silent Failures**

❌ **PROHIBIDO:**
```python
async def update(...):
    try:
        result = await self.collection.update_one(...)
    except Exception:
        pass  # ← SILENT FAILURE
    return None
```

✅ **OBLIGATORIO:**
```python
async def update(...):
    try:
        result = await self.collection.update_one(...)
    except Exception as e:
        logger.error(f"[COLLECTION] UPDATE error: {str(e)}")
        raise  # ← RE-LANZAR
```

**Riesgo Técnico:** Inconsistencia de datos, imposible auditar fallos

---

---

## 2. CONTRATO CRUD OBLIGATORIO

### 2.1 CREATE — Crear Documento

**Firma Requerida:**
```
async def create(
    self,
    firm_id: str,
    data: Dict[str, Any],
    request_id: str
) → Optional[Dict[str, Any]]
```

**Responsabilidades:**
- ✅ Inyectar `firm_id` automáticamente: `data["firm_id"] = firm_id`
- ✅ Validar datos mínimos antes de insert (responsabilidad del servicio)
- ✅ Insertar documento en MongoDB
- ✅ Loguear operación con request_id
- ✅ Retornar documento creado (con _id asignado)
- ✅ Manejar excepciones (DuplicateKeyError, etc.)
- ✅ RE-LANZAR excepciones (servicio las maneja)

**Patrón Verificado en Codebase:**
```
BaseRepository.create()  línea 32-64
├─ data["firm_id"] = firm_id  (línea 50)
├─ await self.collection.insert_one(data)  (línea 53)
├─ logger.info(...)  (línea 55-58)
├─ return await self.find_by_id(...)  (línea 61)
└─ try/except  (línea 52-64)
```

**Garantías de Seguridad:**
- ✅ firm_id SIEMPRE presente (imposible crear sin tenant)
- ✅ Retorno incluye _id del documento (para referencia)

**Operaciones Que NO Debe Hacer:**
- ❌ Validar datos específicos (responsabilidad del servicio)
- ❌ Ejecutar lógica de negocio (responsabilidad del servicio)
- ❌ Afectar otros documentos (solo insert)

---

### 2.2 READ (find_by_id) — Buscar Por ID

**Firma Requerida:**
```
async def find_by_id(
    self,
    firm_id: str,
    resource_id: str,
    request_id: str
) → Optional[Dict[str, Any]]
```

**Responsabilidades:**
- ✅ Filtrar SIEMPRE por firm_id en query (imposible bypassear)
- ✅ Convertir string a ObjectId si es válido
- ✅ Retornar documento O None (nunca lanzar excepción si no encontrado)
- ✅ Loguear búsqueda (DEBUG level)
- ✅ Garantizar que documento encontrado pertenece al firm_id
- ✅ Manejar excepciones MongoDB

**Patrón Verificado en Codebase:**
```
BaseRepository.find_by_id()  línea 70-110
├─ query = {"_id": ObjectId(...), "firm_id": firm_id}  (línea 89-92)
├─ doc = await self.collection.find_one(query)  (línea 94)
├─ logger.debug(...)  (línea 97-105)
└─ return doc  (línea 107)
```

**Garantías de Seguridad:**
- ✅ Retorna None si firm_id no coincide (nunca datos de otro tenant)
- ✅ Query SIEMPRE incluye firm_id (imposible leer cross-tenant)

**Operaciones Que NO Debe Hacer:**
- ❌ Filtrar por otros campos primarios
- ❌ Proyectar campos (responsabilidad del servicio)

---

### 2.3 READ (find_many) — Buscar Múltiples

**Firma Requerida:**
```
async def find_many(
    self,
    firm_id: str,
    query: Dict[str, Any],
    skip: int = 0,
    limit: int = 100,
    sort: Optional[List[tuple]] = None,
    request_id: str = None
) → Tuple[List[Dict[str, Any]], int]
```

**Responsabilidades:**
- ✅ Inyectar firm_id automáticamente: `query["firm_id"] = firm_id`
- ✅ Retornar tupla (documentos, total_count)
- ✅ Contar ANTES de paginar (total_count sin pagination)
- ✅ Aplicar skip/limit
- ✅ Aplicar sorting si se proporciona
- ✅ Loguear operación
- ✅ Manejar excepciones

**Patrón Verificado en Codebase:**
```
BaseRepository.find_many()  línea 112-159
├─ query["firm_id"] = firm_id  (línea 137)
├─ total = await self.collection.count_documents(query)  (línea 140)
├─ cursor = self.collection.find(query).skip(skip).limit(limit)  (línea 143)
├─ if sort: cursor = cursor.sort(sort)  (línea 145-146)
├─ docs = await cursor.to_list(length=limit)  (línea 148)
├─ logger.debug(...)  (línea 150-154)
└─ return docs, total  (línea 156)
```

**Garantías de Seguridad:**
- ✅ firm_id inyectado (imposible queries globales)
- ✅ Total count respeta firm_id (no devuelve count global)

---

### 2.4 UPDATE — Actualizar Documento

**Firma Requerida:**
```
async def update(
    self,
    firm_id: str,
    resource_id: str,
    update_data: Dict[str, Any],
    request_id: str
) → Optional[Dict[str, Any]]
```

**Responsabilidades:**
- ✅ Filtrar por firm_id en cláusula WHERE (imposible actualizar otro tenant)
- ✅ Actualizar solo SI documento pertenece a firm_id
- ✅ Retornar documento actualizado O None (no solo confirmación)
- ✅ Loguear operación
- ✅ Manejar excepciones
- ✅ Validar que al menos 1 documento fue actualizado

**Patrón Verificado en Codebase:**
```
BaseRepository.update()  línea 165-212
├─ query = {"_id": ObjectId(...), "firm_id": firm_id}  (línea 185-188)
├─ result = await self.collection.update_one(query, {"$set": update_data})  (línea 190-193)
├─ if result.matched_count == 0: return None  (línea 195-200)
├─ logger.info(...)  (línea 202-206)
└─ return await self.find_by_id(...)  (línea 209)
```

**Garantías de Seguridad:**
- ✅ WHERE incluye firm_id (imposible actualizar documento de otro tenant)
- ✅ Retorna None si no encontrado (operación atómica)
- ✅ Retorna documento completo (no parcial)

**Operaciones Que NO Debe Hacer:**
- ❌ Actualizar múltiples documentos (usar update_many si es necesario)
- ❌ Modificar firm_id (campo inmutable después de creación)

---

### 2.5 DELETE (soft) — Marcar Como Eliminado

**Firma Requerida:**
```
async def soft_delete(
    self,
    firm_id: str,
    resource_id: str,
    request_id: str
) → bool
```

**Responsabilidades:**
- ✅ Filtrar por firm_id en cláusula WHERE
- ✅ Establecer `deleted_at` = datetime.utcnow() (soft delete)
- ✅ Retornar bool (éxito/fracaso)
- ✅ Loguear operación
- ✅ Manejar excepciones
- ✅ NO eliminar realmente (recuperable después)

**Patrón Verificado en Codebase:**
```
BaseRepository.soft_delete()  línea 218-257
├─ query = {"_id": ObjectId(...), "firm_id": firm_id}  (línea 238-241)
├─ result = await self.collection.update_one(query, {"$set": {"deleted_at": datetime.utcnow()}})  (línea 243-246)
├─ logger.info(...)  (línea 248-252)
└─ return result.matched_count > 0  (línea 254)
```

**Garantías de Seguridad:**
- ✅ WHERE incluye firm_id (imposible eliminar documento de otro tenant)
- ✅ No elimina realmente (datos recuperables)
- ✅ Marca timestamp (auditable)

---

### 2.6 DELETE (hard) — Eliminar Permanentemente

**Firma Requerida:**
```
async def hard_delete(
    self,
    firm_id: str,
    resource_id: str,
    request_id: str
) → bool
```

**Responsabilidades:**
- ✅ Filtrar por firm_id en cláusula WHERE
- ✅ Eliminar PERMANENTEMENTE documento
- ✅ Retornar bool (éxito/fracaso)
- ✅ Loguear operación (WARNING level — operación peligrosa)
- ✅ Manejar excepciones

**Patrón Verificado en Codebase:**
```
BaseRepository.hard_delete()  línea 259-294
├─ query = {"_id": ObjectId(...), "firm_id": firm_id}  (línea 278-281)
├─ result = await self.collection.delete_one(query)  (línea 283)
├─ logger.warning(...)  (línea 285-289)
└─ return result.deleted_count > 0  (línea 291)
```

**⚠️ RESTRICCIÓN CRÍTICA:**
- ❌ hard_delete() SOLO para:
  - Testing (limpieza de fixtures)
  - Cumplimiento regulatorio (GDPR right-to-be-forgotten)
  - Operaciones administrativas excepcionales (documentadas explícitamente)
- ✅ Preferencia absoluta: usar soft_delete()

**Garantías de Seguridad:**
- ✅ WHERE incluye firm_id (imposible eliminar otro tenant)
- ✅ Logged con WARNING (auditabilidad de operaciones peligrosas)

---

### 2.7 BULK Operations

**Contrato Obligatorio:**
```
BÚSQUEDA BULK:
  async def find_by_ids(
      self,
      firm_id: str,
      resource_ids: List[str],
      request_id: str
  ) → List[Dict[str, Any]]

ACTUALIZACIÓN BULK:
  async def update_many(
      self,
      firm_id: str,
      filter_query: Dict,
      update_data: Dict,
      request_id: str
  ) → int  (número de documentos actualizados)
```

**Responsabilidades:**
- ✅ Inyectar firm_id a CADA operación individual
- ✅ NUNCA ejecutar operación global
- ✅ Manejar excepciones parciales (algunos éxito, otros fallo)
- ✅ Retornar cantidad de documentos afectados
- ✅ Loguear operación y cantidad de resultados

**Patrón (Recomendado, No Verificado Actualmente):**
```
async def find_by_ids(self, firm_id, ids, request_id):
    query = TenantAwareQuery.add_firm_filter(
        {"_id": {"$in": [ObjectId(id) for id in ids]}},
        firm_id
    )
    return await self.collection.find(query).to_list(None)

async def update_many(self, firm_id, filter_query, update_data, request_id):
    query = TenantAwareQuery.add_firm_filter(filter_query, firm_id)
    result = await self.collection.update_many(query, {"$set": update_data})
    return result.modified_count
```

**Garantías de Seguridad:**
- ✅ firm_id en cada operación (imposible bulk global)

---

### 2.8 COUNT — Contar Documentos

**Firma Requerida:**
```
async def count_by_firm(self, firm_id: str) → int
```

**Responsabilidades:**
- ✅ Contar SOLO documentos pertenecientes a firm_id
- ✅ Excluir documentos soft-deleted (deleted_at != None)
- ✅ Retornar int
- ✅ Loguear operación
- ✅ Manejar excepciones

**Patrón Verificado en Codebase:**
```
BaseRepository.count_by_firm()  línea 332-339
├─ return await self.collection.count_documents({"firm_id": firm_id})  (línea 335)
```

**Extensiones Comunes:**
```
async def count_active(self, firm_id: str) → int
    return await self.collection.count_documents(
        TenantAwareQuery.add_firm_filter({"deleted_at": None}, firm_id)
    )

async def count_by_status(self, firm_id: str, status: str) → int
    return await self.collection.count_documents(
        TenantAwareQuery.add_firm_filter({"status": status}, firm_id)
    )
```

**Garantías de Seguridad:**
- ✅ firm_id siempre en query (imposible count global)

---

### 2.9 SEARCH — Buscar Con Términos

**Firma Recomendada:**
```
async def search(
    self,
    firm_id: str,
    search_term: str,
    request_id: str,
    skip: int = 0,
    limit: int = 50
) → List[Dict[str, Any]]
```

**Responsabilidades:**
- ✅ Buscar en múltiples campos con $regex o full-text
- ✅ Inyectar firm_id via TenantAwareQuery
- ✅ Paginar resultados
- ✅ Loguear búsqueda
- ✅ Manejar excepciones

**Patrón Verificado en Codebase:**
```
CaseRepository.search()  línea 37-48
├─ query = TenantAwareQuery.add_firm_filter({
│   "$or": [
│       {"title": {"$regex": search_term, "$options": "i"}},
│       {"description": {"$regex": search_term, "$options": "i"}},
│   ]
│ }, firm_id)  (línea 37-45)
├─ cursor = self.collection.find(query).skip(skip).limit(limit)  (línea 46)
└─ return await cursor.to_list(None)  (línea 48)
```

**Garantías de Seguridad:**
- ✅ firm_id inyectado en $or (imposible search global)
- ✅ Paginación (protección contra large result sets)

---

### 2.10 AGGREGATE — Operaciones Complejas

**Patrón Obligatorio:**
```
async def aggregate_by_firm(
    self,
    firm_id: str,
    pipeline: List[Dict],
    request_id: str
) → List[Dict[str, Any]]
```

**Responsabilidades:**
- ✅ PRIMER STAGE DEBE SER `$match` con firm_id
- ✅ Inyectar firm_id automáticamente
- ✅ Validar pipeline no sobrescribe primer stage
- ✅ Loguear operación
- ✅ Manejar excepciones

**Patrón Obligatorio:**
```
async def aggregate_by_firm(self, firm_id, pipeline, request_id):
    # ⚠️ CRÍTICO: firm_id SIEMPRE en primer stage
    full_pipeline = [
        {"$match": {"firm_id": firm_id}},  ← OBLIGATORIO PRIMERO
        *pipeline  # Usuario proporciona stages adicionales
    ]
    return await self.collection.aggregate(full_pipeline).to_list(None)
```

**Garantías de Seguridad:**
- ✅ Primer $match garantiza firm_id (imposible aggregate global)

**NO VERIFICADO EN CODEBASE ACTUAL** (pero implementable)

---

### 2.11 SORTING — Ordenamiento

**Contrato:**
- ✅ Parámetro sort: `List[Tuple[str, int]]` ó string campo
- ✅ Permitir ordenamiento por campos específicos
- ✅ Valores válidos: 1 (ascendente), -1 (descendente)
- ✅ Predeterminado: "created_at" descendente (más reciente primero)

**Patrón Verificado en Codebase:**
```
CaseRepository.find_by_status()  línea 21-23
├─ cursor = self.collection.find(query).skip(skip).limit(limit).sort("created_at", -1)
```

---

### 2.12 PAGINATION — Paginación

**Contrato:**
- ✅ Parámetros: skip (offset), limit (page size)
- ✅ Predeterminado: skip=0, limit=100
- ✅ Máximo limit: 1000 (protección contra large queries)
- ✅ Retornar siempre (documents, total_count) para cálculo de páginas

**Patrón Verificado en Codebase:**
```
BaseRepository.find_many()  línea 112-159
├─ cursor = self.collection.find(query).skip(skip).limit(limit)
```

---

### 2.13 PROJECTION — Selección de Campos

**Contrato:**
- ✅ NO IMPLEMENTAR en repository (responsabilidad del servicio/ruta)
- ✅ Repository retorna documento COMPLETO
- ✅ Servicio filtra campos antes de responder a cliente

**Razón:** Proyección es lógica de presentación, no de acceso a datos

---

### 2.14 SOFT DELETE — Patrón obligatorio

**Implementación Obligatoria:**
- ✅ Campo `deleted_at` (timestamp de eliminación)
- ✅ Lógica: documentos donde `deleted_at` != null son "eliminados"
- ✅ Queries deben EXCLUIR soft-deleted por defecto

**Patrón Verificado en Codebase:**
```
CaseRepository.find_by_status()  línea 21-23
├─ query = TenantAwareQuery.add_firm_filter({"status": status, "deleted_at": None}, firm_id)
```

---

### 2.15 RESTORE — Recuperar Documento Eliminado

**Contrato Obligatorio:**
```
async def restore(
    self,
    firm_id: str,
    resource_id: str,
    request_id: str
) → bool
```

**Responsabilidades:**
- ✅ Eliminar `deleted_at` (volver a active)
- ✅ Filtrar por firm_id
- ✅ Retornar bool (éxito/fracaso)
- ✅ Loguear operación

**NO VERIFICADO EN CODEBASE ACTUAL** (pero implementable)

---

### 2.16 ENSURE_INDEXES — Creación de Índices

**Contrato Obligatorio:**
```
async def ensure_indexes(self) → None
```

**Responsabilidades:**
- ✅ Crear TODOS los índices necesarios para la colección
- ✅ SER IDEMPOTENTE (llamable múltiples veces sin error)
- ✅ Loguear índices creados
- ✅ Manejar excepciones (índice ya existe, etc.)

**Patrón Verificado en Codebase:**
```
CaseRepository.ensure_indexes()  línea 77-84
├─ await self.create_index({"firm_id": 1})  ← OBLIGATORIO
├─ await self.create_index({"firm_id": 1, "status": 1})  ← Compuesto
├─ await self.create_index({"case_number": 1, "firm_id": 1}, unique=True, sparse=True)
```

---

---

## 3. AISLAMIENTO MULTI-TENANT (REGULACIÓN CRÍTICA)

### 3.1 Dónde Se Aplica firm_id

**Obligatorio en TODAS las operaciones:**

| Operación | Requisito | Verificación |
|-----------|-----------|--------------|
| CREATE | Inyección automática en data["firm_id"] | antes de insert |
| READ (find_by_id) | Filtro en query | {"_id": X, "firm_id": Y} |
| READ (find_many) | Inyección automática | query["firm_id"] = firm_id |
| UPDATE | Filtro en WHERE | {"_id": X, "firm_id": Y} |
| DELETE (soft) | Filtro en WHERE | {"_id": X, "firm_id": Y} |
| DELETE (hard) | Filtro en WHERE | {"_id": X, "firm_id": Y} |
| BULK (find_by_ids) | Inyección en cada operación | query con firm_id |
| BULK (update_many) | Inyección en WHERE | query con firm_id |
| COUNT | Filtro en query | {"firm_id": firm_id} |
| SEARCH | Via TenantAwareQuery | firm_id inyectado en $or |
| AGGREGATE | Primer $match con firm_id | $match stage obligatorio |

---

### 3.2 Cuándo Es Obligatorio

**SIEMPRE obligatorio excepto:**

| Caso | Justificación | Documentación Requerida |
|------|---------------|------------------------|
| Métodos GLOBALES para admin | Estadísticas del sistema | Docstring explícito |
| Operaciones de sistema | Crons, webhooks globales | Docstring explícito |

**Todos los otros casos:** firm_id DEBE estar presente

---

### 3.3 Integración de TenantAwareQuery

**Patrón Obligatorio en TODOS los find_*:**

```python
# ✅ CORRECTO
async def find_by_field(self, firm_id, field, request_id):
    query = TenantAwareQuery.add_firm_filter(
        {"field": field},
        firm_id
    )
    return await self.collection.find_one(query)

# ❌ INCORRECTO
async def find_by_field(self, firm_id, field, request_id):
    return await self.collection.find_one({"field": field})  # SIN firm_id
```

**Mecanismo:**
```
TenantAwareQuery.add_firm_filter(query_dict, firm_id) → Dict
├─ Inyecta: query_dict["firm_id"] = firm_id
└─ Retorna: query_dict modificado
```

**Verificado en Codebase:**
```
CaseRepository.find_by_case_number()  línea 14
DocumentRepository.find_by_case()     línea 13
DocumentAccessLogRepository.find_by_document()  línea 20
FirmRepository.find_by_slug()         (implícito en find_one)
```

---

### 3.4 Operaciones Globales (Excepciones)

**Permitidas SOLO si:**
1. ✅ Documentadas explícitamente como globales en docstring
2. ✅ No se llaman desde rutas sin validación de rol (admin-only)
3. ✅ Loguean a nivel WARNING (operación excepcional)
4. ✅ No modifican datos globalmente sin intención explícita

**Ejemplo (NO EN CODEBASE ACTUAL):**
```python
async def get_all_statistics_global(self) → Dict:
    """
    OPERACIÓN GLOBAL — NO FILTRA POR firm_id
    
    ⚠️ ADVERTENCIA: Retorna datos de TODOS los tenants
    
    Uso: Dashboard de administrador único del sistema
    Seguridad: Debe validarse en ruta que solo admin_global puede llamar
    
    Razón: Estadísticas del sistema requieren datos globales
    """
    total_documents = await self.collection.count_documents({})
    return {"total": total_documents}
```

---

### 3.5 Documentación de Aislamiento

**CADA repositorio DEBE documentar:**

```python
class MyRepository(BaseRepository):
    """
    MyRepository
    ============
    
    MULTI-TENANT ISOLATION POLICY
    
    Aislamiento: ✅ COMPLETO
    Patrón: firm_id obligatorio en TODAS las operaciones
    Validación: TenantAwareQuery para queries complejas
    
    Operaciones Globales: NINGUNA
    
    Ejemplo seguro:
        async def find_by_field(self, firm_id, field, request_id):
            query = TenantAwareQuery.add_firm_filter({"field": field}, firm_id)
            return await self.collection.find_one(query)
    
    Métodos no sobrescribibles: create, find_by_id, update, soft_delete
    """
```

---

---

## 4. SEGURIDAD (REGULACIONES CRÍTICAS)

### 4.1 Validaciones Mínimas Obligatorias

| Validación | Dónde | Cómo |
|------------|-------|------|
| firm_id no vacío | En entrada de método | `assert firm_id`, tipo str |
| resource_id válido | Para operaciones por ID | `_is_valid_object_id()` |
| query NUNCA global | En find/update/delete | TenantAwareQuery obligatoria |
| WHERE SIEMPRE filtra | En update/delete | query["firm_id"] = firm_id |
| Excepciones manejadas | En TODOS los métodos | try/except, re-raise |

**Verificado en Codebase:**
```
BaseRepository._is_valid_object_id()  línea 300-307
BaseRepository.find_by_id()           línea 90 (conversión ObjectId)
BaseRepository.create()               línea 50 (firma_id inyección)
```

---

### 4.2 Protección Contra Acceso Cross-Tenant

**Implementación Verificada:**
```
1. Inyección firm_id en CREATE
   └─ Imposible crear documento sin firm_id
   └─ Imposible especificar otro firm_id desde cliente

2. Filtro firm_id en READ
   └─ Imposible leer documento de otro tenant
   └─ Retorna None si firm_id no coincide

3. Filtro firm_id en UPDATE WHERE
   └─ Imposible actualizar documento de otro tenant
   └─ Operación no afecta a otro tenant

4. Filtro firm_id en DELETE WHERE
   └─ Imposible eliminar documento de otro tenant
   └─ Operación no afecta a otro tenant
```

---

### 4.3 Protección Contra Update Global

**Prohibido:**
```python
await self.collection.update_many({}, {"$set": {...}})  # ❌ UPDATE GLOBAL
```

**Obligatorio:**
```python
query = TenantAwareQuery.add_firm_filter({}, firm_id)
result = await self.collection.update_many(query, {"$set": {...}})
```

**Garantía:** Actualiza SOLO documentos de firm_id especificado

---

### 4.4 Protección Contra Delete Global

**Prohibido:**
```python
await self.collection.delete_many({})  # ❌ DELETE GLOBAL
```

**Obligatorio:**
```python
query = TenantAwareQuery.add_firm_filter({}, firm_id)
result = await self.collection.delete_many(query)
```

**Garantía:** Elimina SOLO documentos de firm_id especificado

---

### 4.5 Protección Contra Aggregate Sin Filtro

**Prohibido:**
```python
pipeline = [
    {"$group": {"_id": "$status", "count": {"$sum": 1}}}  # ❌ Sin firm_id
]
await self.collection.aggregate(pipeline).to_list(None)
```

**Obligatorio:**
```python
pipeline = [
    {"$match": {"firm_id": firm_id}},  # ← PRIMERO
    {"$group": {"_id": "$status", "count": {"$sum": 1}}}
]
await self.collection.aggregate(pipeline).to_list(None)
```

**Garantía:** Primer stage SIEMPRE filtra por firm_id

---

---

## 5. INTEGRIDAD (CONSISTENCY & ATOMICITY)

### 5.1 Manejo de Transacciones

**Contrato:**
- ✅ MongoDB 4.0+: soporte nativo para transacciones multi-documento
- ⚠️ NO VERIFICADO EN CODEBASE ACTUAL (implementable)
- ✅ Para operaciones que requieren atomicidad: usar sesiones MongoDB

**Patrón Recomendado:**
```python
async def atomic_operation(self, firm_id, data1, data2):
    """
    Operación atómica: insertar dos documentos o ninguno
    """
    async with await self.collection.database.client.start_session() as session:
        async with session.start_transaction():
            await self.collection.insert_one(
                {"firm_id": firm_id, **data1},
                session=session
            )
            await self.collection.insert_one(
                {"firm_id": firm_id, **data2},
                session=session
            )
```

---

### 5.2 Consistency

**Garantías:**
- ✅ MongoDB garantiza consistencia a nivel documento
- ✅ Queries siempre ven estado consistente
- ✅ firm_id field NUNCA puede cambiar después de creación (inmutable)

**Enforced By:**
```
- BaseRepository.create() inyecta firm_id (no puede modificarse después)
- Índices con firm_id (garantizan lookups consistentes)
- Logging de todas las operaciones (trazabilidad de cambios)
```

---

### 5.3 Atomicidad

**Garantías:**
- ✅ Operaciones MongoDB son atómicas a nivel documento
- ✅ find_by_id() + update() no es atómico (require sesiones)
- ✅ Soft delete es atómico (single update_one)

**Verificado en Codebase:**
```
BaseRepository.soft_delete()  línea 243-246
└─ await self.collection.update_one(query, {"$set": {"deleted_at": ...}})
└─ Operación atómica: documento se marca o no se marca
```

---

### 5.4 Idempotencia

**Contrato Obligatorio:**
- ✅ Métodos CRUD deben ser idempotentes cuando sea posible
- ✅ Crear índice múltiples veces NO debe fallar (idempotente)
- ✅ find_by_id() es idempotente (sin side effects)
- ⚠️ DELETE no es idempotente (segundo delete retorna false)

**Patrón:**
```python
async def ensure_indexes(self):
    """Idempotente: llamable múltiples veces sin error"""
    try:
        await self.create_index([("firm_id", 1)])
    except Exception:
        # MongoDB lanza excepción si índice existe, la ignoramos
        pass
```

---

---

## 6. ÍNDICES (CONVENCIONES Y ESTÁNDARES)

### 6.1 Índice Obligatorio

**TODOS los repositorios DEBEN tener:**
```
[("firm_id", 1)]
```

**Razón:** Toda query filtra por firm_id

**Verificado en Codebase:**
```
CaseRepository.ensure_indexes()       línea 77
DocumentRepository.ensure_indexes()   línea 103
DocumentAccessLogRepository.ensure_indexes()  línea 73
FirmRepository (implícito)
```

---

### 6.2 Índices Recomendados

**Para campos frecuentemente consultados:**

```
[("firm_id", 1), ("field1", 1)]     # Single compound
[("firm_id", 1), ("field2", 1)]     # Single compound
[("firm_id", 1), ("field3", -1)]    # Descending for sorting
```

**Ejemplos en Codebase:**
```
CaseRepository:
  [("firm_id", 1), ("status", 1)]           línea 78
  [("firm_id", 1), ("case_owner_id", 1)]    línea 79
  [("firm_id", 1), ("assigned_users", 1)]   línea 80
  [("firm_id", 1), ("legal_area", 1)]       línea 81
  [("firm_id", 1), ("created_at", -1)]      línea 82

DocumentRepository:
  [("firm_id", 1), ("case_id", 1)]          línea 104
  [("firm_id", 1), ("owner_id", 1)]         línea 105
  [("firm_id", 1), ("document_type", 1)]    línea 106
```

---

### 6.3 Índices Únicos (Por Tenant)

**Para campos que deben ser únicos DENTRO de cada tenant:**

```
[("field", 1), ("firm_id", 1)], unique=True, sparse=True
```

**Ejemplos en Codebase:**
```
CaseRepository:
  [("case_number", 1), ("firm_id", 1)], unique=True, sparse=True  línea 83
  
  Garantía: case_number es único por firma, no globalmente
```

---

### 6.4 Índices TTL (Time To Live)

**Para documentos que deben expirar:**

```
[("expiration_date", 1)], expireAfterSeconds=0, sparse=True
```

**Ejemplos en Codebase:**
```
DocumentRepository:
  [("expiration_date", 1)], expireAfterSeconds=0, sparse=True  línea 111
  
  Garantía: MongoDB elimina documentos automáticamente cuando expiration_date < ahora

DocumentAccessLogRepository:
  [("created_at", 1)], expireAfterSeconds=7776000, sparse=True  línea 79
  
  Garantía: Elimina automáticamente después de 90 días (recolección de basura)
```

---

### 6.5 Convenciones de Nombres

**Índices:**
```
nombre_1                            → ascending
nombre_-1                           → descending
nombre_1_field_1                    → compound
uniq_tenant_company_impl            → custom name (opcional)
```

**Verificado en Codebase:**
```
[("firm_id", 1)]                    → firm_id_1
[("case_number", 1), ("firm_id", 1)]  → case_number_1_firm_id_1
[("created_at", 1), expireAfterSeconds...]  → auto-named por MongoDB
```

---

### 6.6 Prefijos en Índices Compuestos

**REGLA CRÍTICA:**
```
firm_id SIEMPRE debe ser PRIMER campo (o muy próximo)

✅ CORRECTO:  [("firm_id", 1), ("status", 1)]
❌ INCORRECTO: [("status", 1), ("firm_id", 1)]
```

**Razón:** Queries filtran PRIMERO por firm_id

---

---

## 7. EXTENSIBILIDAD (QUÉ PUEDE/NO PUEDE CAMBIAR)

### 7.1 Métodos Que NUNCA Deben Sobrescribirse

**Inmutables (FINAL):**

| Método | Razón | Riesgo |
|--------|-------|--------|
| `create()` | Inyecta firm_id automáticamente | Data sin tenant |
| `find_by_id()` | Filtra SIEMPRE por firm_id | Cross-tenant leakage |
| `update()` | Valida firm_id en WHERE | Cross-tenant corruption |
| `soft_delete()` | Valida firm_id en WHERE | Cross-tenant deletion |
| `count_by_firm()` | Conteo tenant-scoped | Estadísticas incorrectas |

**No debe sobrescribirse porque:**
- Pierden garantías de aislamiento
- Permiten data leakage
- Violación de seguridad CRÍTICA

---

### 7.2 Métodos Que PUEDEN Extenderse

**Extensibles:**

| Método | Patrón | Ejemplo |
|--------|--------|---------|
| `find_many()` | Crear find_by_* que lo usan | find_by_status() |
| `create_index()` | Implementar ensure_indexes() | Índices específicos |
| N/A (crear nuevos) | Métodos de negocio | find_by_field(), count_active() |

**Patrón:**
```python
# NO sobrescribir find_many():
async def find_by_status(self, firm_id, status, request_id):
    query = TenantAwareQuery.add_firm_filter({"status": status}, firm_id)
    cursor = self.collection.find(query)  # Usa find_many() internamente
    return await cursor.to_list(None)
```

---

### 7.3 Métodos Que Deben Permanecer Abstractos

**En BaseRepository:**
```python
@abstractmethod
async def ensure_indexes(self) → None
    """Cada repository DEBE implementar sus propios índices"""
```

**Verificado en Codebase:**
```
BaseRepository (abstract, no implementa ensure_indexes)
CaseRepository.ensure_indexes()       ✅ Implementado
DocumentRepository.ensure_indexes()   ✅ Implementado
FirmRepository.ensure_indexes()       ✅ Implementado
```

---

---

## 8. MANEJO DE ERRORES (REGULACIÓN CRÍTICA)

### 8.1 Excepciones Obligatorias

| Excepción | Cuándo | Manejo |
|-----------|--------|--------|
| `DuplicateKeyError` | Insertar documento duplicado | Re-lanzar (servicio decide) |
| `ValueError` | ID inválido, datos inválidos | Re-lanzar |
| `MongoDB exception` | Cualquier error MongoDB | Loguear error, re-lanzar |
| Generic `Exception` | Captura fallback | Loguear, re-lanzar |

**Patrón Verificado en Codebase:**
```
BaseRepository.create()       línea 52-64
├─ try:
├─ except Exception as e:
│  ├─ logger.error(...)
│  └─ raise  ← RE-LANZAR SIEMPRE
```

---

### 8.2 Logging Obligatorio

| Nivel | Operación | Formato |
|-------|-----------|---------|
| INFO | CREATE, UPDATE, DELETE | `[COLLECTION] OPERATION firm_id={} id={} request_id={}` |
| DEBUG | READ (find_by_id, find_many) | `[COLLECTION] READ firm_id={} found={} request_id={}` |
| WARNING | hard_delete(), operaciones peligrosas | `[COLLECTION] HARD_DELETE firm_id={} id={} request_id={}` |
| ERROR | Excepciones | `[COLLECTION] OPERATION error: {exception} request_id={}` |

**Verificado en Codebase:**
```
BaseRepository.create()       línea 55-58   → logger.info()
BaseRepository.find_by_id()   línea 97-105  → logger.debug()
BaseRepository.update()       línea 202-206 → logger.info()
BaseRepository.soft_delete()  línea 248-252 → logger.info()
BaseRepository.hard_delete()  línea 285-289 → logger.warning()
```

---

### 8.3 Auditoría Obligatoria

**TODOS los logs DEBEN incluir:**
- ✅ Nombre de colección
- ✅ Operación (CREATE, READ, UPDATE, DELETE, etc.)
- ✅ firm_id
- ✅ resource_id (si aplica)
- ✅ request_id (trazabilidad HTTP)
- ✅ Resultado (found/not_found, modified_count, etc.)

**Patrón:**
```
[COLLECTION] OPERATION firm_id={firm_id} id={resource_id} request_id={request_id}
[COLLECTION] OPERATION firm_id={firm_id} skip={skip} limit={limit} found={count} request_id={request_id}
```

---

### 8.4 Mensajes de Error

**Permitido:**
```
"Document not found"
"Invalid ObjectId format"
"Update failed"
```

**Prohibido:**
```
"MongoDB connection error: ..." ← Expone detalles técnicos
"Index creation failed: ..." ← Expone detalles de DB
```

---

### 8.5 Errores de MongoDB

**Manejar específicamente:**
```
DuplicateKeyError           → Clave única violada
ValidationError             → Validación esquema
OperationFailure           → Operación MongoDB falló
```

---

### 8.6 Errores de Tenant

**Manejar:**
```
Firm_id missing             → 400 Bad Request (entrada)
Cross-tenant access attempt → 403 Forbidden (seguridad)
Document belongs to different tenant → 404 Not Found (ocultación)
```

---

### 8.7 Errores de Concurrencia

**NO VERIFICADO EN CODEBASE ACTUAL**

**Patrón Recomendado:**
```
Optimistic locking:         Usar versión campo (_version)
Pessimistic locking:        Usar sesiones MongoDB
Conflict resolution:        Retry or merge strategy
```

---

---

## 9. COMPATIBILIDAD FUTURA

### 9.1 Multiempresa

**Actual:** firm_id para aislamiento  
**Futuro:** organization_id para multiempresa  
**Compatibilidad:** Agregar organization_id sin cambiar contract create/read/update

```
Patrón:
  data["firm_id"] = firm_id        ← Presente
  data["organization_id"] = org_id ← Agregar
  
La query sigue siendo:
  query["firm_id"] = firm_id  ← No cambia
```

---

### 9.2 Multivertical

**Actual:** Único vertical (legal)  
**Futuro:** Múltiples verticales (legal, commerce, HR, etc.)  
**Compatibilidad:** Agregar vertical_id sin cambiar contract

```
Patrón:
  data["firm_id"] = firm_id     ← Presente
  data["vertical_id"] = "legal" ← Agregar
  
El contrato no cambia, solo se extienden métodos
```

---

### 9.3 Multipaís

**Actual:** Sin consideración de país  
**Futuro:** Operaciones multi-país  
**Compatibilidad:** Agregar country code sin cambiar contract

```
Patrón:
  data["firm_id"] = firm_id    ← Presente
  data["country"] = "MX"       ← Agregar
  
El contrato CRUD no cambia
```

---

### 9.4 Multimoneda

**Actual:** Sin moneda en repository  
**Futuro:** Moneda en documentos  
**Compatibilidad:** Métodos adicionales (convert, exchange, etc.)

```
Patrón:
  data["amount"] = 100         ← Presente
  data["currency"] = "USD"     ← Agregar
  
El contrato CRUD no cambia
```

---

### 9.5 IA/ML

**Actual:** Operaciones CRUD estándares  
**Futuro:** Embeddings, vectores, ML features  
**Compatibilidad:** Nuevos métodos sin cambiar CRUD base

```
Patrón:
  async def find_similar(self, firm_id, embedding, k=10):
      # Nuevo método, no cambia create/read/update/delete
      ...
```

---

### 9.6 RAG (Retrieval-Augmented Generation)

**Actual:** Queries estándares  
**Futuro:** Semantic search, document chunks  
**Compatibilidad:** Nuevas colecciones (chunks) con mismo pattern

```
Patrón:
  DocumentRepository         ← Actual
  DocumentChunkRepository    ← Nuevo, mismo patrón
  
Ambos heredan BaseRepository
```

---

### 9.7 Servicios Distribuidos

**Actual:** Single MongoDB instance  
**Futuro:** Sharding, replicación, distributed transactions  
**Compatibilidad:** No requiere cambios en contract

```
Patrón:
  BaseRepository no cambia
  MongoDB driver maneja sharding internamente
  firm_id sigue siendo clave de particionamiento
```

---

---

## 10. DOCUMENTO OFICIAL: Repository Standard v1.0

### 10.1 Objetivo

Establecer un **contrato arquitectónico universal, vinculante y futuro-compatible** que garantice:
- ✅ Aislamiento multi-tenant OBLIGATORIO
- ✅ Seguridad de datos contra cross-tenant access
- ✅ Integridad ACID mínima
- ✅ Auditabilidad completa
- ✅ Extensibilidad sin ruptura de contrato

---

### 10.2 Principios Fundamentales

```
1. SEGURIDAD FIRST
   Data leakage es el riesgo máximo

2. TENANT OBLIGATORIO
   firm_id es citizen de primera clase

3. INVARIANCIA
   Métodos base NUNCA cambian

4. VERIFICABILIDAD
   Todo auditable y trazable

5. FUTURO-COMPATIBLE
   Contrato público nunca cambia
```

---

### 10.3 Reglas Obligatorias

```
✅ SIEMPRE:
  1. Heredar de BaseRepository
  2. Inyectar firm_id en CREATE
  3. Filtrar firm_id en READ, UPDATE, DELETE
  4. Usar TenantAwareQuery en finds complejos
  5. Try/catch en TODOS los métodos
  6. Loguear TODAS las operaciones
  7. Implementar ensure_indexes()
  8. Manejar excepciones, re-lanzar
  9. Documentar operaciones globales (si existen)
  10. Crear índices [("firm_id", 1)] obligatorio

❌ NUNCA:
  1. Queries sin firm_id
  2. Updates globales sin firm_id filter
  3. Deletes globales sin firm_id filter
  4. Sobrescribir create, find_by_id, update, soft_delete
  5. Silent failures (try/except sin raise)
  6. Acceso directo a db.* sin patrón
  7. Aggregate sin $match firm_id primero
  8. Proyectar campos en repository (servicio lo hace)
  9. Modificar firm_id después de creación
  10. Loguear sin request_id
```

---

### 10.4 Reglas Recomendadas

```
✅ RECOMENDADO:
  1. Crear métodos find_by_* para queries comunes
  2. Implementar search() para búsquedas full-text
  3. Implementar count_active() para estadísticas
  4. Usar soft delete como patrón predeterminado
  5. Crear índices compuestos [("firm_id", 1), ("field", 1)]
  6. Crear índices únicos para campos únicos por tenant
  7. Implementar pagination (skip, limit)
  8. Documentar operaciones globales explícitamente
  9. Usar request_id en TODOS los logs
  10. Retornar documento completo, no parcial
```

---

### 10.5 Checklist de Certificación

**Para aceptar un nuevo repository en Punto Cero System OS:**

```
ESTRUCTURA:
  ☐ Hereda de BaseRepository
  ☐ Implementa __init__(collection: AsyncIOMotorCollection)
  ☐ Implementa ensure_indexes()
  ☐ Docstring explícito con política multi-tenant

MÉTODOS CRUD BASE (NO SOBRESCRITOS):
  ☐ create() funciona con inyección firm_id
  ☐ find_by_id() retorna None si firm_id no coincide
  ☐ update() filtra firma_id en WHERE
  ☐ soft_delete() marca deleted_at con firm_id
  ☐ count_by_firm() cuenta solo por tenant

MÉTODOS EXTENDIDOS:
  ☐ find_by_*() usa TenantAwareQuery
  ☐ search() inyecta firm_id en $or
  ☐ Todos los find tienen pagination (skip, limit)
  ☐ Todos retornan documento completo

SEGURIDAD:
  ☐ NINGUNA query sin firm_id
  ☐ NINGÚN update/delete sin firm_id en WHERE
  ☐ NINGÚN aggregate sin $match firm_id primero
  ☐ NINGUNA operación global sin documentación explícita

MANEJO DE ERRORES:
  ☐ Try/catch en TODOS los métodos públicos
  ☐ Logging en INFO/DEBUG/ERROR
  ☐ Re-lanzar excepciones (nunca silent failure)
  ☐ Logs incluyen firm_id, resource_id, request_id

ÍNDICES:
  ☐ [("firm_id", 1)] obligatorio
  ☐ Índices compuestos para queries frecuentes
  ☐ Índices únicos para campos únicos por tenant
  ☐ Índices TTL para expiración (si aplica)

AUDITORÍA:
  ☐ Logging en cada operación CRUD
  ☐ Formato estándar [COLLECTION] OPERATION firm_id={} ...
  ☐ request_id en cada log
  ☐ Trazabilidad completa

DOCUMENTACIÓN:
  ☐ Docstring claro en cada método
  ☐ Ejemplos de uso seguro
  ☐ Notas de seguridad si aplican
  ☐ Operaciones globales documentadas explícitamente

COMPATIBILIDAD:
  ☐ Contrato público no cambia
  ☐ Métodos nuevos son extensiones, no reemplazos
  ☐ firm_id permanece como aislamiento principal
  ☐ Permite agregar organization_id, vertical_id, etc. en futuro
```

---

### 10.6 Criterios de Aceptación

**Un Repository es aceptado en Punto Cero System OS SI Y SOLO SI:**

1. ✅ **Aislamiento:** firm_id en TODAS las operaciones
2. ✅ **Seguridad:** Protección contra cross-tenant, update/delete global
3. ✅ **Integridad:** Try/catch, logging, auditoría completa
4. ✅ **Índices:** [("firm_id", 1)] obligatorio + compuestos recomendados
5. ✅ **Extensibilidad:** NO sobrescribe métodos base, SÍ extiende
6. ✅ **Errores:** Manejo apropiado, re-lanzar siempre
7. ✅ **Documentación:** Política multi-tenant explícita
8. ✅ **Compatibilidad:** Soporta multiempresa, multivertical, multipaís futuro

**Criterios de RECHAZO:**

❌ Queries sin firm_id  
❌ Sobrescribe create, find_by_id, update, soft_delete  
❌ Silent failures  
❌ Sin logging  
❌ Sin índices  
❌ Operaciones globales sin documentación  
❌ No hereda BaseRepository  

---

---

## CONCLUSIÓN

Este **Repository Standard v1.0** establece el contrato arquitectónico definitivo que TODOS los repositories de Punto Cero System OS DEBEN cumplir.

El estándar es:
- ✅ **Riguroso:** Basado 100% en análisis de 4 repositorios existentes
- ✅ **Verificable:** Cada regla se puede comprobar en código
- ✅ **Futuro-compatible:** Soporta multiempresa, multivertical, IA, RAG, servicios distribuidos
- ✅ **Vinculante:** Es condición de aceptación en el ecosistema
- ✅ **Consistente:** Sin ambigüedades, sin excepciones no documentadas

**Autoridad:** Principal Software Architect, Enterprise Software Architect  
**Vigencia:** Indefinida hasta próxima revisión  
**Efectividad:** Inmediata para todos los nuevos repositories  

---

**FIN ESPECIFICACIÓN ARQUITECTÓNICA OFICIAL**

---

# APÉNDICES

## A. Referencias en Codebase

- BaseRepository: `backend/repositories/enterprise_base_repository.py` línea 17-340
- TenantAwareQuery: `backend/middleware/tenant_isolation.py` línea 258-289
- CaseRepository: `backend/repositories/case_repository.py`
- DocumentRepository: `backend/repositories/document_repository.py`
- FirmRepository: `backend/repositories/firm_repository.py`
- DocumentAccessLogRepository: `backend/repositories/document_access_log_repository.py`

## B. Patrones Completos (Verificados)

Toda evidencia se puede validar línea por línea en los 4 repositorios existentes.

## C. Historial de Versiones

- **v1.0** (2025): Especificación inaugural basada en análisis de 4 repositorios

---
