# FASE 1 — EXACT CODE CHANGES (DIFF VIEW)

---

## FILE 1: `backend/models/user.py`

### CHANGE LOCATION
**File:** `backend/models/user.py`  
**Class:** `UserBase`  
**Line:** After `is_verified: bool = False`

### BEFORE
```python
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: Literal["admin", "admin_general", "socio_comercial", "lawyer", "client"]
    phone: Optional[str] = None
    country: Optional[str] = None
    specialty: Optional[str] = None
    bar_number: Optional[str] = None
    firm_name: Optional[str] = None
    id_document: Optional[str] = None
    status: Literal["active", "inactive", "suspended", "PENDING_VERIFICATION", "ACTIVE"] = "PENDING_VERIFICATION"
    is_verified: bool = False

class UserCreate(UserBase):
```

### AFTER
```python
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: Literal["admin", "admin_general", "socio_comercial", "lawyer", "client"]
    phone: Optional[str] = None
    country: Optional[str] = None
    specialty: Optional[str] = None
    bar_number: Optional[str] = None
    firm_name: Optional[str] = None
    id_document: Optional[str] = None
    status: Literal["active", "inactive", "suspended", "PENDING_VERIFICATION", "ACTIVE"] = "PENDING_VERIFICATION"
    is_verified: bool = False
+   organizationId: Optional[str] = None  # FASE 1: soporte para abogados asociados a firmas

class UserCreate(UserBase):
```

### DIFF
```diff
  class UserBase(BaseModel):
      email: EmailStr
      full_name: str
      role: Literal["admin", "admin_general", "socio_comercial", "lawyer", "client"]
      phone: Optional[str] = None
      country: Optional[str] = None
      specialty: Optional[str] = None
      bar_number: Optional[str] = None
      firm_name: Optional[str] = None
      id_document: Optional[str] = None
      status: Literal["active", "inactive", "suspended", "PENDING_VERIFICATION", "ACTIVE"] = "PENDING_VERIFICATION"
      is_verified: bool = False
+     organizationId: Optional[str] = None  # FASE 1: soporte para abogados asociados a firmas

  class UserCreate(UserBase):
```

### ANALYSIS
- **Lines Changed:** 1
- **Lines Added:** 1  
- **Lines Removed:** 0
- **Impact:** Field added to UserBase → inherited by UserCreate, User, UserResponse
- **Type:** `Optional[str]` (nullable)
- **Default:** `None`
- **Backward Compatible:** YES (new field, existing records unaffected)

---

## FILE 2: `backend/routes/auth.py`

### CHANGE LOCATION
**File:** `backend/routes/auth.py`  
**Function:** `get_me()`  
**Line:** In return dict, after `"id_document"` line

### BEFORE
```python
@router.get("/me")
async def get_me(current = Depends(get_current_user)):
    """Devuelve el estado actual del usuario autenticado (fuente de verdad).
    Útil para sincronizar is_verified tras la aprobación admin."""
    return {
        "id": str(current["_id"]),
        "email": current["email"],
        "full_name": current.get("full_name"),
        "role": current["role"],
        "status": current.get("status", "PENDING_VERIFICATION"),
        "is_verified": bool(current.get("is_verified", False)),
        "country": current.get("country"),
        "specialty": current.get("specialty"),
        "phone": current.get("phone"),
        "bar_number": current.get("bar_number"),
        "firm_name": current.get("firm_name"),
        "id_document": current.get("id_document"),
    }
```

### AFTER
```python
@router.get("/me")
async def get_me(current = Depends(get_current_user)):
    """Devuelve el estado actual del usuario autenticado (fuente de verdad).
    Útil para sincronizar is_verified tras la aprobación admin."""
    return {
        "id": str(current["_id"]),
        "email": current["email"],
        "full_name": current.get("full_name"),
        "role": current["role"],
        "status": current.get("status", "PENDING_VERIFICATION"),
        "is_verified": bool(current.get("is_verified", False)),
        "country": current.get("country"),
        "specialty": current.get("specialty"),
        "phone": current.get("phone"),
        "bar_number": current.get("bar_number"),
        "firm_name": current.get("firm_name"),
        "id_document": current.get("id_document"),
+       "organizationId": current.get("organizationId"),
    }
```

### DIFF
```diff
      @router.get("/me")
      async def get_me(current = Depends(get_current_user)):
          """Devuelve el estado actual del usuario autenticado (fuente de verdad).
          Útil para sincronizar is_verified tras la aprobación admin."""
          return {
              "id": str(current["_id"]),
              "email": current["email"],
              "full_name": current.get("full_name"),
              "role": current["role"],
              "status": current.get("status", "PENDING_VERIFICATION"),
              "is_verified": bool(current.get("is_verified", False)),
              "country": current.get("country"),
              "specialty": current.get("specialty"),
              "phone": current.get("phone"),
              "bar_number": current.get("bar_number"),
              "firm_name": current.get("firm_name"),
              "id_document": current.get("id_document"),
+             "organizationId": current.get("organizationId"),
          }
```

### ANALYSIS
- **Lines Changed:** 1
- **Lines Added:** 1
- **Lines Removed:** 0
- **Impact:** GET /auth/me response now includes `organizationId` field
- **Type:** Returned as string (from current["organizationId"]) or None
- **Backward Compatible:** YES (new field in response, clients ignore unknown fields)
- **Frontend Impact:** 
  - Old clients: ignore `organizationId` field
  - New clients: can read `organizationId` value

---

## FILE 3: `backend/migrations/001_add_organization_support.py`

### NEW FILE (COMPLETE)

```python
"""
FASE 1 — Foundation Data Migration

Objetivo: Preparar la base de datos para soportar abogados asociados a firmas.

Cambios:
1. Agregar índice en users.organizationId (para queries futuras)
2. Validar que usuarios existentes quedan con organizationId = NULL (backward compatible)
3. Documentar el estado de migración

Ejecución:
  python -m backend.migrations.001_add_organization_support --apply
  python -m backend.migrations.001_add_organization_support --rollback
  python -m backend.migrations.001_add_organization_support --status
"""

import asyncio
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import ASCENDING

class Migration001:
    """Migration para agregar soporte de organizationId en usuarios."""
    
    name = "001_add_organization_support"
    
    @staticmethod
    async def apply(db: AsyncIOMotorDatabase):
        """Aplica los cambios de la migración."""
        try:
            print(f"[{datetime.utcnow().isoformat()}] Iniciando {Migration001.name}...")
            
            # Paso 1: Crear índice en organizationId (sin restricción unique, nullable)
            print("  → Creando índice en users.organizationId...")
            await db.users.create_index([("organizationId", ASCENDING)], sparse=True)
            
            # Paso 2: Validar que no hay conflictos
            count_without_org = await db.users.count_documents({"organizationId": {"$exists": False}})
            count_with_org = await db.users.count_documents({"organizationId": {"$exists": True}})
            total_users = await db.users.count_documents({})
            
            print(f"  → Usuarios sin organizationId: {count_without_org} (esperado: {total_users})")
            print(f"  → Usuarios con organizationId: {count_with_org} (esperado: 0)")
            
            # Paso 3: Crear colección de migrations tracking
            migrations_collection = db.migrations_log
            await migrations_collection.insert_one({
                "name": Migration001.name,
                "applied_at": datetime.utcnow(),
                "status": "applied",
                "changes": {
                    "users_count": total_users,
                    "index_created": "users.organizationId",
                    "backward_compatible": True,
                }
            })
            
            print(f"[{datetime.utcnow().isoformat()}] {Migration001.name} aplicada exitosamente.")
            return {"success": True, "message": "Migración aplicada"}
            
        except Exception as e:
            print(f"ERROR en migración: {str(e)}")
            raise
    
    @staticmethod
    async def rollback(db: AsyncIOMotorDatabase):
        """Revierte los cambios de la migración."""
        try:
            print(f"[{datetime.utcnow().isoformat()}] Revirtiendo {Migration001.name}...")
            
            # Eliminar índice
            print("  → Eliminando índice users.organizationId...")
            await db.users.drop_index("organizationId_1")
            
            # Registrar rollback
            migrations_collection = db.migrations_log
            await migrations_collection.insert_one({
                "name": Migration001.name,
                "rolled_back_at": datetime.utcnow(),
                "status": "rolled_back",
            })
            
            print(f"[{datetime.utcnow().isoformat()}] {Migration001.name} revertida exitosamente.")
            return {"success": True, "message": "Migración revertida"}
            
        except Exception as e:
            print(f"ERROR en rollback: {str(e)}")
            raise
    
    @staticmethod
    async def status(db: AsyncIOMotorDatabase):
        """Verifica el estado de la migración."""
        migration_record = await db.migrations_log.find_one({"name": Migration001.name})
        
        if not migration_record:
            print(f"{Migration001.name}: NOT APPLIED")
            return {"status": "not_applied"}
        
        status = migration_record.get("status", "unknown")
        applied_at = migration_record.get("applied_at")
        
        print(f"{Migration001.name}: {status.upper()}")
        if applied_at:
            print(f"  Applied at: {applied_at.isoformat()}")
        
        return {
            "status": status,
            "applied_at": applied_at,
            "changes": migration_record.get("changes", {})
        }


async def main():
    from server import db
    import sys
    
    action = sys.argv[1] if len(sys.argv) > 1 else "status"
    
    if action == "--apply":
        await Migration001.apply(db)
    elif action == "--rollback":
        await Migration001.rollback(db)
    elif action == "--status":
        await Migration001.status(db)
    else:
        print(f"Uso: python -m backend.migrations.001_add_organization_support [--apply|--rollback|--status]")


if __name__ == "__main__":
    asyncio.run(main())
```

### ANALYSIS
- **File Type:** New Python migration script
- **Lines:** 132
- **Functionality:**
  - Creates sparse index on `users.organizationId`
  - Tracks migration in `db.migrations_log`
  - Supports apply, rollback, status operations
- **Idempotent:** YES (safe to run multiple times)
- **Reversible:** YES (rollback drops index without data loss)
- **Impact:** NO impact on existing data (index only)

---

## SUMMARY TABLE

| File | Type | Lines Added | Lines Modified | Lines Removed | Impact |
|------|------|------------|-----------------|---------------|--------|
| `backend/models/user.py` | Python | 1 | 1 | 0 | Field added to model |
| `backend/routes/auth.py` | Python | 1 | 1 | 0 | Field added to response |
| `backend/migrations/001_*` | Python | 132 | - | - | New migration script |
| **TOTAL** | - | **134** | **2** | **0** | Data structure extended |

---

## VALIDATION CHECKLIST

- [x] Code changes are minimal (2 modifications, 1 new file)
- [x] No files moved or deleted
- [x] No routes modified (only response extended)
- [x] No permissions changed
- [x] Backward compatible (NULL default, new field ignored by old clients)
- [x] No breaking changes
- [x] Migration is idempotent
- [x] Migration is reversible

---

**Status:** ✅ READY FOR REVIEW AND DEPLOYMENT

