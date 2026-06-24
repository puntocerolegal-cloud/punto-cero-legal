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
            # Contar usuarios sin organizationId (deben ser todos, pues es nueva migración)
            count_without_org = await db.users.count_documents({"organizationId": {"$exists": False}})
            count_with_org = await db.users.count_documents({"organizationId": {"$exists": True}})
            total_users = await db.users.count_documents({})
            
            print(f"  → Usuarios sin organizationId: {count_without_org} (esperado: {total_users})")
            print(f"  → Usuarios con organizationId: {count_with_org} (esperado: 0)")
            
            # Paso 3: Crear colección de migrations tracking (si no existe)
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
