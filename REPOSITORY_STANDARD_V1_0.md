# Repository Standard v1.0
## Contrato Oficial para Todos los Repositorios de Punto Cero System OS

**Versión:** 1.0  
**Fecha:** 2025  
**Vigencia:** Todos los repositorios creados a partir de esta especificación  
**Autoridad:** Principal Software Architect

---

## 1. RESPONSABILIDADES OBLIGATORIAS

### 1.1 Responsabilidad #1: Aislamiento Automático por firm_id

**Definición:** Toda operación CRUD DEBE garantizar que los datos de un tenant NO sean accesibles por otro tenant.

**Implementación:**
- Cada documento DEBE tener campo `firm_id`
- Cada operación de lectura DEBE filtrar automáticamente por `firm_id`
- Cada operación de escritura DEBE inyectar `firm_id` automáticamente
- Cada operación de actualización DEBE validar `firm_id` en la cláusula WHERE
- Cada operación de eliminación DEBE validar `firm_id` en la cláusula WHERE

**Evidencia en codebase:**
```
BaseRepository.find_by_id() — línea 88-92 (valida firm_id en query)
BaseRepository.find_many() — línea 137 (inyecta firm_id)
BaseRepository.update() — línea 185-188 (valida firm_id en WHERE)
BaseRepository.soft_delete() — línea 238-241 (valida firm_id en WHERE)
```

**Incumplimiento:** ❌ CRÍTICO — Data leakage entre tenants

---

### 1.2 Responsabilidad #2: Auditoría Integrada

**Definición:** Toda operación DEBE ser auditable. Se DEBE registrar:
- Operación (CREATE, READ, UPDATE, DELETE)
- Colección
- firm_id
- resource_id
- request_id (trazabilidad de solicitud HTTP)

**Implementación:**
- logging en nivel INFO para CREATE, UPDATE, DELETE
- logging en nivel DEBUG para READ
- Formato estándar: `[{collection_name}] {OPERATION} firm_id={firm_id} id={resource_id} request_id={request_id}`
- Excepciones DEBEN loguear en nivel ERROR con stack trace

**Evidencia en codebase:**
```
BaseRepository.create() — línea 55-58 (INFO log)
BaseRepository.find_by_id() — línea 97-105 (DEBUG log)
BaseRepository.update() — línea 202-206 (INFO log)
BaseRepository.soft_delete() — línea 248-252 (INFO log)
```

**Incumplimiento:** ⚠️ ALTO — Imposible auditar uso incorrecto de datos

---

### 1.3 Responsabilidad #3: Manejo de Excepciones

**Definición:** Toda operación DEBE manejar errores sin exponer datos sensibles.

**Implementación:**
- Try/catch OBLIGATORIO en todos los métodos públicos
- Excepciones MongoDB DEBEN ser capturadas y re-lanzadas con contexto
- NO exponer detalles técnicos de MongoDB en mensajes de error
- Logs de ERROR DEBEN incluir stack trace completo (para auditoría interna)

**Evidencia en codebase:**
```
BaseRepository.create() — línea 52-64 (try/catch con logging)
BaseRepository.find_by_id() — línea 87-110 (try/catch con logging)
BaseRepository.update() — línea 184-212 (try/catch con logging)
```

**Incumplimiento:** ❌ CRÍTICO — Información sensible expuesta, riesgo de security breach

---

### 1.4 Responsabilidad #4: Índices Automáticos

**Definición:** Todo repositorio DEBE crear índices que optimicen queries tenant-scoped.

**Implementación:**
- Método `ensure_indexes()` OBLIGATORIO en TODOS los repositorios
- Índice OBLIGATORIO: `{"firm_id": 1}` (base para todas las queries)
- Índices RECOMENDADOS: `{"firm_id": 1, "field": 1}` para campos consultados frecuentemente
- Índice TTL para campos con `expiration_date` o similar (si aplica)

**Evidencia en codebase:**
```
CaseRepository.ensure_indexes() — línea 77-84
  await self.create_index({"firm_id": 1})  ← OBLIGATORIO
  await self.create_index({"firm_id": 1, "status": 1})  ← Recomendado
  
DocumentRepository.ensure_indexes() — línea 102-111
  await self.create_index({"firm_id": 1})  ← OBLIGATORIO
  await self.create_index({"firm_id": 1, "case_id": 1})  ← Recomendado
```

**Incumplimiento:** ⚠️ MEDIO — Queries lentas, degradación de performance

---

## 2. MÉTODOS CRUD QUE DEBEN HEREDARSE SIEMPRE

### 2.1 Métodos CRUD Base (NO Sobrescribibles)

**Estos 5 métodos NO deben ser modificados en repositorios derivados:**

#### **create(firm_id, data, request_id) → Dict[str, Any]**
```
Responsabilidad: Crear documento con firm_id automático
Firma: async def create(firm_id: str, data: Dict, request_id: str) → Dict
Garantías:
  ✅ firm_id inyectado automáticamente en data["firm_id"]
  ✅ Retorna documento creado con _id
  ✅ Loguea operación con request_id
  ✅ Valida firma e id en respuesta
  ❌ NO debe validar datos específicos (responsabilidad del servicio)

Implementación encontrada: BaseRepository.create() línea 32-64
NO puede ser sobrescrita en derivadas
```

#### **find_by_id(firm_id, resource_id, request_id) → Optional[Dict]**
```
Responsabilidad: Buscar documento por ID con filtro firm_id
Firma: async def find_by_id(firm_id: str, resource_id: str, request_id: str) → Optional[Dict]
Garantías:
  ✅ Filtra SIEMPRE por firm_id (imposible bypassear)
  ✅ Retorna None si firm_id no coincide
  ✅ Loguea búsqueda (DEBUG)
  ✅ Convierte string a ObjectId si es válido
  ❌ NO debe aplicar lógica adicional

Implementación encontrada: BaseRepository.find_by_id() línea 70-110
NO puede ser sobrescrita en derivadas
```

#### **update(firm_id, resource_id, update_data, request_id) → Optional[Dict]**
```
Responsabilidad: Actualizar documento con filtro firm_id
Firma: async def update(firm_id: str, resource_id: str, update_data: Dict, request_id: str) → Optional[Dict]
Garantías:
  ✅ Filtra por firm_id en WHERE (imposible actualizar otro tenant)
  ✅ Retorna None si no encontrado (404 seguro)
  ✅ Loguea actualización
  ✅ Retorna documento actualizado (no solo confirmación)
  ❌ NO debe validar campos específicos

Implementación encontrada: BaseRepository.update() línea 165-212
NO puede ser sobrescrita en derivadas
```

#### **soft_delete(firm_id, resource_id, request_id) → bool**
```
Responsabilidad: Marcar como eliminado (no eliminar realmente)
Firma: async def soft_delete(firm_id: str, resource_id: str, request_id: str) → bool
Garantías:
  ✅ Filtra por firm_id (imposible eliminar de otro tenant)
  ✅ Establece deleted_at = datetime.utcnow()
  ✅ Loguea eliminación
  ✅ Retorna bool (éxito/fracaso)
  ❌ NO puede sobrescribirse

Implementación encontrada: BaseRepository.soft_delete() línea 218-257
NO puede ser sobrescrita en derivadas
```

#### **count_by_firm(firm_id) → int**
```
Responsabilidad: Contar documentos de un tenant
Firma: async def count_by_firm(firm_id: str) → int
Garantías:
  ✅ Filtra SIEMPRE por firm_id
  ✅ Retorna count exacto
  ✅ No incluye eliminados (soft-deleted)
  ❌ NO puede ser modificada

Implementación encontrada: BaseRepository.count_by_firm() línea 332-339
NO puede ser sobrescrita en derivadas
```

---

### 2.2 Método CRUD Opcional (Puede Sobrescribirse)

#### **hard_delete(firm_id, resource_id, request_id) → bool** [SOLO TESTING]
```
Responsabilidad: Eliminar permanentemente (SOLO TESTING)
Firma: async def hard_delete(firm_id: str, resource_id: str, request_id: str) → bool
Limitaciones:
  ✅ Filtra por firm_id
  ⚠️ Puede sobrescribirse SI y SOLO SI:
     - No se usa en producción
     - Se usa solo en tests de limpieza
     - Se documenta su riesgo
  ❌ Nunca en rutas o servicios productivos

Implementación encontrada: BaseRepository.hard_delete() línea 259-294
Puede sobrescribirse CON ADVERTENCIA EXPLÍCITA
```

---

### 2.3 Método find_many (Patrón de Extensión)

**Este método SÍ debe ser extendido, NO reemplazado:**

```
find_many(firm_id, query, skip, limit, sort, request_id) → Tuple[List[Dict], int]

Implementación base: BaseRepository.find_many() línea 112-159

Patrón de extensión (CaseRepository):
  ✅ Los repositorios derivados NO sobrescriben find_many()
  ✅ Crean métodos específicos que USAN TenantAwareQuery
  
Ejemplo correcto:
  async def find_by_status(self, firm_id, status, request_id, skip=0, limit=50):
      query = TenantAwareQuery.add_firm_filter({"status": status}, firm_id)
      # Usa self.collection.find(), NO sobrescribe find_many()
      cursor = self.collection.find(query).skip(skip).limit(limit)
      return await cursor.to_list(None)

Implementación encontrada: CaseRepository.find_by_status() línea 21-23
Este es el patrón CORRECTO para extender
```

---

## 3. VALIDACIONES AUTOMÁTICAS DE firm_id

### 3.1 Validación #1: Inyección Automática en CREATE

**Patrón obligatorio:**
```
En BaseRepository.create() línea 50:
    data["firm_id"] = firm_id
    
Este campo NUNCA puede venir desde el cliente
GARANTÍA: Imposible crear documento sin firm_id o con firm_id erróneo
```

---

### 3.2 Validación #2: Filtro Automático en READ

**Patrón obligatorio:**
```
En BaseRepository.find_by_id() línea 89-92:
    query = {
        "_id": ObjectId(...),
        "firm_id": firm_id  ← SIEMPRE presente
    }
    
En BaseRepository.find_many() línea 137:
    query["firm_id"] = firm_id  ← INYECTADO automáticamente
    
GARANTÍA: Imposible leer documento de otro tenant
IMPLEMENTACIÓN: NO es verificable en código, es AUTOMÁTICA
```

---

### 3.3 Validación #3: Filtro en WHERE para UPDATE

**Patrón obligatorio:**
```
En BaseRepository.update() línea 185-188:
    query = {
        "_id": ObjectId(...),
        "firm_id": firm_id  ← SIEMPRE en WHERE
    }
    result = await self.collection.update_one(query, {"$set": ...})
    
GARANTÍA: Imposible actualizar documento de otro tenant
(si alguien intenta actualizar caso_123 con firm_id_X, pero documento tiene firm_id_Y → no encuentra nada)
```

---

### 3.4 Validación #4: Filtro en WHERE para DELETE

**Patrón obligatorio:**
```
En BaseRepository.soft_delete() línea 238-241:
    query = {
        "_id": ObjectId(...),
        "firm_id": firm_id  ← SIEMPRE en WHERE
    }
    result = await self.collection.update_one(query, {"$set": {"deleted_at": ...}})
    
En BaseRepository.hard_delete() línea 278-281:
    query = {
        "_id": ObjectId(...),
        "firm_id": firm_id  ← SIEMPRE en WHERE
    }
    result = await self.collection.delete_one(query)
    
GARANTÍA: Imposible eliminar documento de otro tenant
```

---

## 4. OPERACIONES QUE NUNCA DEBEN SOBRESCRIBIRSE

### 4.1 Métodos Inmutables

**Los siguientes métodos NUNCA pueden sobrescribirse (son final):**

1. **create()** — línea 32-64
   - Razón: Inyecta firm_id automáticamente
   - Riesgo si se modifica: Data leakage (crear doc sin firm_id)

2. **find_by_id()** — línea 70-110
   - Razón: Filtra siempre por firm_id
   - Riesgo si se modifica: Data leakage (leer doc de otro tenant)

3. **update()** — línea 165-212
   - Razón: Valida firm_id en WHERE
   - Riesgo si se modifica: Data corruption (actualizar doc de otro tenant)

4. **soft_delete()** — línea 218-257
   - Razón: Valida firm_id en WHERE
   - Riesgo si se modifica: Data loss (eliminar doc de otro tenant)

5. **count_by_firm()** — línea 332-339
   - Razón: Conteo seguro por tenant
   - Riesgo si se modifica: Estadísticas incorrectas, data leakage

6. **_is_valid_object_id()** — línea 300-307
   - Razón: Utilidad de validación
   - Riesgo si se modifica: Errores en conversión de ID

---

### 4.2 Patrón de Restricción

**En implementación (Python), no hay `final` nativo, pero el contrato establece:**

```
# Pseudo-sintaxis de contrato:
class BaseRepository:
    
    # FINAL — Nunca sobrescribir
    @final
    async def create(...) → Dict
    
    @final
    async def find_by_id(...) → Optional[Dict]
    
    @final
    async def update(...) → Optional[Dict]
    
    @final
    async def soft_delete(...) → bool
    
    @final
    async def count_by_firm(...) → int
    
    # EXTENSIBLE — Puede usarse en métodos derivados
    async def find_many(...) → Tuple[List, int]
    
    # UTILITY — Puede ser llamado pero no sobrescrito
    @staticmethod
    @final
    def _is_valid_object_id(...) → bool
```

**Mecanismo de Cumplimiento:**
- Code review en PRs DEBE validar que no sobrescriban estos métodos
- Tests automáticos DEBEN fallar si alguien intenta sobrescribir

---

## 5. OPERACIONES QUE SÍ PUEDEN EXTENDERSE

### 5.1 Métodos Extensibles

**Los siguientes DEBEN ser extendidos en repositorios derivados:**

#### **find_many()** — línea 112-159
```
Razón para extender: Cada entidad tiene lógica de búsqueda única
Ejemplo: CaseRepository.find_by_status() usa find_many() internamente
Patrón: NO sobrescribir, sino crear métodos que lo USAN

Correcto:
  async def find_by_status(self, firm_id, status, request_id, skip=0, limit=50):
      query = TenantAwareQuery.add_firm_filter({"status": status}, firm_id)
      cursor = self.collection.find(query).skip(skip).limit(limit)
      return await cursor.to_list(None)

Incorrecto:
  async def find_many(self, ...):  # ← NO, esto es sobrescribir
      ...
```

---

#### **create_index()** — línea 309-330
```
Razón para extender: Cada colección tiene índices únicos
Obligatorio: Método ensure_indexes() en CADA repositorio derivado

Correcto:
  async def ensure_indexes(self):
      await self.create_index([("firm_id", 1)])  ← OBLIGATORIO
      await self.create_index([("firm_id", 1), ("case_number", 1)], unique=True)  ← Específico
      await self.create_index([("case_number", 1, "firm_id", 1)], unique=True)  ← Compound
```

---

### 5.2 Métodos de Utilidad (Pueden Crearse Nuevos)

**Cada repositorio derivado PUEDE crear métodos de utilidad:**

```
Ejemplos válidos:

1. Métodos de búsqueda específicos:
   async def find_by_case_number(self, firm_id, case_number, request_id)
   async def find_by_owner(self, firm_id, owner_id, request_id)
   async def search(self, firm_id, search_term, request_id)

2. Métodos de validación:
   async def exists_by_unique_field(self, firm_id, field_value)
   
3. Métodos de actualización específicos:
   async def assign_user(self, firm_id, resource_id, user_id)
   async def mark_signed(self, firm_id, resource_id, user_id)

4. Métodos de conteo específico:
   async def count_active(self, firm_id)
   async def count_by_status(self, firm_id, status)

Requisitos para métodos nuevos:
  ✅ DEBEN usar TenantAwareQuery.add_firm_filter()
  ✅ DEBEN incluir request_id si es relevante
  ✅ DEBEN loguear operaciones en nivel INFO
  ✅ DEBEN tener docstring claro
  ✅ DEBEN manejar excepciones
```

---

## 6. ÍNDICES QUE DEBEN CREARSE SIEMPRE

### 6.1 Índice Obligatorio

**TODOS los repositorios DEBEN crear:**

```python
await self.create_index([("firm_id", 1)])
```

**Razón:** Toda query filtra por firm_id. Este índice es base para todas las búsquedas.

**Evidencia:**
```
CaseRepository.ensure_indexes() línea 77 — ✅ Presente
DocumentRepository.ensure_indexes() línea 103 — ✅ Presente
DocumentAccessLogRepository.ensure_indexes() — ✅ Presente
FirmRepository — ✅ Presente (aunque no mostrado en lectura)
```

---

### 6.2 Índices Recomendados (Colección-Específicos)

**Se DEBEN crear para campos consultados frecuentemente:**

```
Patrón:
  await self.create_index([("firm_id", 1), "field", 1)])
  
Ejemplos encontrados en código:

CaseRepository.ensure_indexes() línea 78-84:
  [("firm_id", 1), ("status", 1)]  ← casos por status
  [("firm_id", 1), ("case_owner_id", 1)]  ← casos por owner
  [("firm_id", 1), ("assigned_users", 1)]  ← casos por asignado
  [("firm_id", 1), ("legal_area", 1)]  ← casos por área

DocumentRepository.ensure_indexes() línea 104-107:
  [("firm_id", 1), ("case_id", 1)]  ← documentos por caso
  [("firm_id", 1), ("owner_id", 1)]  ← documentos por owner
  [("firm_id", 1), ("document_type", 1)]  ← documentos por tipo
  [("firm_id", 1), ("status", 1)]  ← documentos por status
```

---

### 6.3 Índices Únicos (Campos Únicos por Tenant)

**Para campos que deben ser únicos DENTRO de cada tenant:**

```
Patrón:
  await self.create_index(
    [("field", 1), ("firm_id", 1)],
    unique=True,
    sparse=True
  )

Ejemplo en código:

CaseRepository.ensure_indexes() línea 83:
  await self.create_index(
    [("case_number", 1), ("firm_id", 1)],
    unique=True,
    sparse=True
  )
  
Razón: case_number debe ser único DENTRO de cada firma, no globalmente
```

---

### 6.4 Índices TTL (Para Expiración Automática)

**Para campos con fecha de expiración:**

```
Patrón:
  await self.create_index(
    [("expiration_date", 1)],
    expireAfterSeconds=0,
    sparse=True
  )

Ejemplo en código:

DocumentRepository.ensure_indexes() línea 111:
  await self.create_index(
    [("expiration_date", 1)],
    expireAfterSeconds=0,
    sparse=True
  )
  
MongoDB eliminará documentos automáticamente cuando expiration_date < now()
```

---

## 7. INTEGRACIÓN OBLIGATORIA CON TenantAwareQuery

### 7.1 Dónde Usarlo

**TenantAwareQuery DEBE usarse en TODOS los métodos de búsqueda de repositorios derivados.**

**Ubicación:** backend/middleware/tenant_isolation.py línea 258-288

**Métodos:**
```
1. TenantAwareQuery.add_firm_filter(query, firm_id) → Dict
   - Inyecta firm_id en query existente
   - Implementación: query["firm_id"] = firm_id; return query
   
2. TenantAwareQuery.add_firm_filter_bulk(queries, firm_id) → List
   - Inyecta firm_id en múltiples queries
   - Implementación: [TenantAwareQuery.add_firm_filter(q, firm_id) for q in queries]
```

---

### 7.2 Patrón de Uso Obligatorio

**Cada método find_* en repositorio derivado DEBE:**

```python
# CORRECTO (CaseRepository.find_by_case_number línea 14):
async def find_by_case_number(self, firm_id: str, case_number: str, request_id: str):
    query = TenantAwareQuery.add_firm_filter(
        {"case_number": case_number},  ← Query específica
        firm_id  ← Tenant isolation
    )
    return await self.collection.find_one(query)

# INCORRECTO (data leakage):
async def find_by_case_number(self, case_number: str, request_id: str):
    return await self.collection.find_one({"case_number": case_number})  ← SIN firm_id
```

---

### 7.3 Ejemplos en Codebase

```
CaseRepository:
  find_by_case_number() línea 14 — ✅ Usa TenantAwareQuery
  find_by_owner() línea 16 — ✅ Usa TenantAwareQuery
  find_by_status() línea 21 — ✅ Usa TenantAwareQuery
  search() línea 37 — ✅ Usa TenantAwareQuery
  assign_user() línea 54 — ✅ Usa TenantAwareQuery

DocumentRepository:
  find_by_case() línea 13 — ✅ Usa TenantAwareQuery
  find_by_owner() línea 18 — ✅ Usa TenantAwareQuery
  search() línea 33 — ✅ Usa TenantAwareQuery
  add_version() línea 45 — ✅ Usa TenantAwareQuery

PATRÓN: 100% de métodos find usan TenantAwareQuery
```

---

## 8. MANEJO DE EXCEPCIONES (Obligatorio)

### 8.1 Estructura Try-Catch Obligatoria

**TODOS los métodos públicos DEBEN tener:**

```python
async def any_method(self, ...):
    try:
        # Operación MongoDB
        result = await self.collection.find_one(query)
        # Logging
        logger.debug(f"[{self.collection.name}] OPERATION success")
        return result
    except Exception as e:
        # Logging de error
        logger.error(f"[{self.collection.name}] OPERATION error: {str(e)}")
        # Re-lanzar para que servicio/ruta maneje
        raise
```

**Evidencia en código:**
```
BaseRepository.create() línea 52-64 — ✅ Try-catch presente
BaseRepository.find_by_id() línea 87-110 — ✅ Try-catch presente
BaseRepository.update() línea 184-212 — ✅ Try-catch presente
BaseRepository.soft_delete() línea 235-257 — ✅ Try-catch presente
BaseRepository.hard_delete() línea 277-294 — ✅ Try-catch presente
BaseRepository.create_index() línea 324-330 — ✅ Try-catch presente
```

---

### 8.2 Logging de Excepciones

**En nivel ERROR, incluir stack trace:**

```python
except Exception as e:
    logger.error(f"[{self.collection.name}] OPERATION error: {str(e)}")
    raise  # Re-lanzar para que servicio maneje
```

**NO hacer:**
```python
except Exception as e:
    pass  # ❌ Silent failure
    
except Exception as e:
    return None  # ❌ Ocultar error
    
except Exception as e:
    logger.info(f"Error: {e}")  # ❌ Log incorrecto (ERROR no INFO)
```

---

### 8.3 Tipos de Excepciones a Manejar

| Excepción | Acción | Ejemplo |
|-----------|--------|---------|
| `DuplicateKeyError` | Re-lanzar (servicio decide) | Unique constraint violation |
| `ValueError` | Re-lanzar (datos inválidos) | ID inválido |
| `Exception` (generic) | Loguear y re-lanzar | Cualquier error MongoDB |

**Patrón:**
```python
try:
    result = await self.collection.insert_one(data)
except DuplicateKeyError:
    logger.error(f"Duplicate key: {data}")
    raise
except Exception as e:
    logger.error(f"Insert error: {str(e)}")
    raise
```

---

## 9. ESTRUCTURA ESTÁNDAR DE NUEVO REPOSITORY

### 9.1 Template de Estructura

```python
"""
{Entity}Repository
CRUD operations for {Entity} with multi-tenant isolation
"""

from typing import Dict, List, Any, Optional
from motor.motor_asyncio import AsyncIOMotorCollection
from datetime import datetime
from backend.middleware.tenant_isolation import TenantAwareQuery
from backend.repositories.enterprise_base_repository import BaseRepository
import logging

logger = logging.getLogger(__name__)


class {Entity}Repository(BaseRepository):
    """
    {Entity} repository for managing {entity_description}.
    Each {entity} is isolated via firm_id in all operations.
    """

    def __init__(self, collection: AsyncIOMotorCollection):
        super().__init__(collection)

    # ========================================================================
    # {ENTITY}-SPECIFIC QUERIES
    # ========================================================================

    async def find_by_[unique_field](
        self,
        firm_id: str,
        [field]: str,
        request_id: str
    ) -> Optional[Dict[str, Any]]:
        """
        Find {entity} by {field}.
        
        Args:
            firm_id: Multi-tenant isolation
            {field}: Field value
            request_id: For audit trail
            
        Returns:
            {Entity} document or None
        """
        try:
            query = TenantAwareQuery.add_firm_filter(
                {"{field}": {field}},
                firm_id
            )
            doc = await self.collection.find_one(query)
            
            logger.debug(
                f"[{self.collection.name}] FIND_BY_{field.upper()} "
                f"firm_id={firm_id} {field}={field} found={doc is not None} "
                f"request_id={request_id}"
            )
            
            return doc
        except Exception as e:
            logger.error(
                f"[{self.collection.name}] FIND_BY_{field.upper()} error: {str(e)}"
            )
            raise

    async def find_by_[filter_field](
        self,
        firm_id: str,
        [filter]: str,
        request_id: str,
        skip: int = 0,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """
        Find {entities} by {filter}.
        
        Args:
            firm_id: Multi-tenant isolation
            {filter}: Filter value
            request_id: For audit trail
            skip: Pagination skip
            limit: Pagination limit
            
        Returns:
            List of {entity} documents
        """
        try:
            query = TenantAwareQuery.add_firm_filter(
                {"{filter}": {filter}, "deleted_at": None},
                firm_id
            )
            cursor = self.collection.find(query).skip(skip).limit(limit).sort("created_at", -1)
            docs = await cursor.to_list(None)
            
            logger.debug(
                f"[{self.collection.name}] FIND_BY_{filter.upper()} "
                f"firm_id={firm_id} {filter}={filter} found={len(docs)} "
                f"request_id={request_id}"
            )
            
            return docs
        except Exception as e:
            logger.error(
                f"[{self.collection.name}] FIND_BY_{filter.upper()} error: {str(e)}"
            )
            raise

    async def search(
        self,
        firm_id: str,
        search_term: str,
        request_id: str,
        skip: int = 0,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """
        Search {entities} by multiple fields.
        
        Args:
            firm_id: Multi-tenant isolation
            search_term: Search term
            request_id: For audit trail
            skip: Pagination skip
            limit: Pagination limit
            
        Returns:
            List of {entity} documents
        """
        try:
            query = TenantAwareQuery.add_firm_filter(
                {
                    "$or": [
                        {"field1": {"$regex": search_term, "$options": "i"}},
                        {"field2": {"$regex": search_term, "$options": "i"}},
                    ],
                    "deleted_at": None
                },
                firm_id
            )
            cursor = self.collection.find(query).skip(skip).limit(limit).sort("created_at", -1)
            docs = await cursor.to_list(None)
            
            logger.debug(
                f"[{self.collection.name}] SEARCH firm_id={firm_id} "
                f"search_term={search_term} found={len(docs)} request_id={request_id}"
            )
            
            return docs
        except Exception as e:
            logger.error(f"[{self.collection.name}] SEARCH error: {str(e)}")
            raise

    async def count_active(self, firm_id: str) -> int:
        """Count active {entities} for a firm"""
        try:
            query = TenantAwareQuery.add_firm_filter({"deleted_at": None}, firm_id)
            count = await self.collection.count_documents(query)
            
            logger.debug(
                f"[{self.collection.name}] COUNT_ACTIVE firm_id={firm_id} count={count}"
            )
            
            return count
        except Exception as e:
            logger.error(f"[{self.collection.name}] COUNT_ACTIVE error: {str(e)}")
            raise

    # ========================================================================
    # INDEXING
    # ========================================================================

    async def ensure_indexes(self) -> None:
        """Create recommended indexes for {Entity} collection"""
        try:
            # Obligatory indexes
            await self.create_index([("firm_id", 1)])  ← OBLIGATORIO
            
            # Query indexes (collection-specific)
            await self.create_index([("firm_id", 1), ("[field1]", 1)])
            await self.create_index([("firm_id", 1), ("[field2]", 1)])
            
            # Unique indexes (if needed)
            await self.create_index(
                [("[unique_field]", 1), ("firm_id", 1)],
                unique=True,
                sparse=True
            )
            
            # TTL indexes (if needed)
            # await self.create_index(
            #     [("[expiration_field]", 1)],
            #     expireAfterSeconds=0,
            #     sparse=True
            # )
            
            logger.info(f"[{self.collection.name}] Indexes created successfully")
        except Exception as e:
            logger.warning(f"[{self.collection.name}] Index creation warning: {str(e)}")
```

---

### 9.2 Checklist de Cumplimiento

**Al crear un nuevo repository, DEBE cumplir:**

```
✅ Hereda de BaseRepository
✅ __init__ recibe AsyncIOMotorCollection
✅ Implementa ensure_indexes()
✅ Índice obligatorio [("firm_id", 1)]
✅ TODOS los métodos find usan TenantAwareQuery.add_firm_filter()
✅ TODOS los métodos tienen try/catch
✅ TODOS los métodos loguean operación
✅ Logging sigue formato: [COLLECTION_NAME] OPERATION firm_id=X id=Y request_id=Z
✅ Docstrings completos con Args y Returns
✅ NO sobrescribe métodos create, find_by_id, update, soft_delete, count_by_firm
✅ SÍ extiende find_many mediante métodos específicos
✅ NO acceso directo a db.<colección> (solo a través de self.collection)
```

---

## 10. RESUMEN EJECUTIVO: CONTRATO OFICIAL

### 10.1 Los 7 Mandamientos del Repository Pattern

```
1. FIRM_ID OBLIGATORIO
   Toda operación DEBE filtrar automáticamente por firm_id.
   NO hay excepciones. NO hay bypasses.

2. BASE REPOSITORY INVIOLABLE
   Los 5 métodos CRUD base (create, find_by_id, update, soft_delete, count_by_firm)
   NUNCA pueden sobrescribirse. Son final, inmutables, sagradas.

3. TENANT AWARE QUERY OBLIGATORIA
   TODOS los métodos find DEBEN usar TenantAwareQuery.add_firm_filter().
   NO queries directas sin firm_id.

4. AUDITORÍA INTEGRADA
   Loguear TODOS las operaciones: CREATE, READ, UPDATE, DELETE.
   Incluir request_id en TODOS los logs.

5. ÍNDICES GARANTIZADOS
   Índice obligatorio [("firm_id", 1)].
   Índices compuestos para campos consultados frecuentemente.
   Índices únicos para campos únicos por tenant.

6. EXCEPCIONES MANEJADAS
   Try/catch en TODOS los métodos.
   Loguear errores, re-lanzar siempre.
   NO silent failures.

7. EXTENSIÓN, NO REEMPLAZO
   NO sobrescribir métodos base.
   SÍ extender creando métodos específicos.
   SÍ crear ensure_indexes() único.
```

---

### 10.2 Tabla de Autoridades y Responsabilidades

| Responsabilidad | Quién | Cómo | Verificación |
|-----------------|-------|------|--------------|
| Aislamiento firm_id | BaseRepository | Automático en create/find/update/delete | Code review + tests |
| Auditoría | BaseRepository | Logging en INFO/DEBUG/ERROR | Code review |
| Índices | Cada Repository | ensure_indexes() colección-específica | MongoDB indexes |
| TenantAwareQuery | Cada Repository | TODOS los find usan add_firm_filter() | Code review |
| Excepciones | Cada Repository | Try/catch en métodos públicos | Code review + tests |
| Extensiones seguras | Cada Repository | Métodos nuevos respetan patrón | Code review |

---

## 11. MECANISMO DE CUMPLIMIENTO

### 11.1 Code Review Obligatoria

**Toda PR que cree un repository DEBE**:
- [ ] Heredar de BaseRepository
- [ ] Implementar ensure_indexes()
- [ ] Usar TenantAwareQuery en todos find
- [ ] NO sobrescribir métodos base
- [ ] Try/catch en todos métodos
- [ ] Logging completo con request_id
- [ ] Docstrings en todos métodos

### 11.2 Automatización

**Tests automáticos DEBEN fallar si**:
- Repository no hereda de BaseRepository
- Método sobrescribe create, find_by_id, update, soft_delete
- Query no filtra por firm_id
- No hay try/catch
- Falta ensure_indexes()

---

## 12. VIGENCIA Y ACTUALIZACIONES

**Vigencia:** Indefinida hasta próxima versión  
**Versión:** 1.0  
**Fecha de creación:** 2025  
**Próxima revisión:** Q2 2025  

**Cambios permitidos:**
- Nuevos métodos opcionales en BaseRepository
- Nuevos tipos de índices (TTL, texto)
- Mejoras a logging/auditoría

**Cambios NO permitidos:**
- Cambios a firma de métodos base
- Cambios a responsabilidades 1-7
- Remover validaciones de firm_id

---

## FIN ESPECIFICACIÓN REPOSITORY STANDARD v1.0

**Creado por:** Principal Software Architect  
**Aplicable a:** Todos los repositorios futuros (22 pendientes)  
**Autoridad máxima:** Este documento es la fuente única de verdad para patrones de repositorio  

---

# APÉNDICE A: Referencias a Implementaciones

### Implementaciones Correctas (Seguir como Modelo)

1. **BaseRepository** → backend/repositories/enterprise_base_repository.py
2. **CaseRepository** → backend/repositories/case_repository.py
3. **DocumentRepository** → backend/repositories/document_repository.py
4. **FirmRepository** → backend/repositories/firm_repository.py
5. **DocumentAccessLogRepository** → backend/repositories/document_access_log_repository.py

### Referencias Clave

- **TenantAwareQuery** → backend/middleware/tenant_isolation.py línea 258
- **BaseRepository métodos** → empresa base repository.py líneas 32-339
- **Indexing pattern** → CaseRepository.ensure_indexes() línea 77-84

---

# APÉNDICE B: Plantilla Resumen para PRs

```markdown
## Nueva Repository: {Entity}Repository

### Cumplimiento de Repository Standard v1.0

- [ ] Hereda de BaseRepository
- [ ] Implementa ensure_indexes() con:
  - [ ] Índice obligatorio [("firm_id", 1)]
  - [ ] Índices específicos de colección
  - [ ] Índices únicos si aplican
- [ ] Todos los métodos find usan TenantAwareQuery
- [ ] Try/catch en todos los métodos públicos
- [ ] Logging con request_id
- [ ] NO sobrescribe métodos base (create, find_by_id, update, soft_delete, count_by_firm)
- [ ] Docstrings completos

### Métodos Implementados

- `find_by_[field]` → ✅
- `find_by_[filter]` → ✅
- `search` → ✅
- `count_active` → ✅
- `ensure_indexes` → ✅
- (otros) → ✅

### Validación

- Tests de CRUD con firm_id filtering
- Tests de error handling
- Tests de indexing
```

---

**DOCUMENTO FINAL: Repository Standard v1.0 — Contrato Oficial de Punto Cero System OS**
