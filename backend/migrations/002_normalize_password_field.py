"""
HOTFIX — Password Field Normalization

Objetivo: Normalizar usuarios antiguos que tienen "password" a "password_hash".

Contexto: Usuarios creados vía seed (02_seed_firms.py) tienen el hash bajo "password"
en lugar de "password_hash". Esto causa 401 en login para usuarios antiguos.

Cambios:
1. Migrar usuarios con "password" pero sin "password_hash" a usar "password_hash"
2. Dejar "password" para compatibilidad temporal (será removido en próxima release)
3. Documentar migración
"""

import asyncio
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorDatabase


class Migration002:
    """Migration para normalizar el campo password_hash en usuarios antiguos."""
    
    name = "002_normalize_password_field"
    
    @staticmethod
    async def apply(db: AsyncIOMotorDatabase):
        """Aplica los cambios de la migración."""
        try:
            print(f"[{datetime.utcnow().isoformat()}] Iniciando {Migration002.name}...")
            
            # Paso 1: Encontrar usuarios con "password" pero sin "password_hash"
            query = {
                "password": {"$exists": True},
                "password_hash": {"$exists": False}
            }
            affected_users = await db.users.count_documents(query)
            print(f"  → Usuarios a migrar: {affected_users}")
            
            if affected_users > 0:
                # Paso 2: Actualizar todos los usuarios afectados
                result = await db.users.update_many(
                    query,
                    [
                        {
                            "$set": {
                                "password_hash": "$password",
                                "updated_at": datetime.utcnow()
                            }
                        }
                    ]
                )
                print(f"  → Usuarios actualizados: {result.modified_count}")
            
            # Paso 3: Registrar migración
            migrations_collection = db.migrations_log
            await migrations_collection.insert_one({
                "name": Migration002.name,
                "applied_at": datetime.utcnow(),
                "status": "applied",
                "changes": {
                    "users_migrated": affected_users,
                    "description": "Normalize password to password_hash for old users",
                    "backward_compatible": True,
                }
            })
            
            print(f"  ✅ {Migration002.name} completada")
            return True
            
        except Exception as e:
            print(f"  ❌ Error en {Migration002.name}: {str(e)}")
            raise
    
    @staticmethod
    async def rollback(db: AsyncIOMotorDatabase):
        """Revierte los cambios de la migración."""
        try:
            print(f"[{datetime.utcnow().isoformat()}] Revirtiendo {Migration002.name}...")
            
            # Buscar usuarios que fueron migrados (tienen ambos campos ahora)
            query = {
                "password": {"$exists": True},
                "password_hash": {"$exists": True}
            }
            affected_users = await db.users.count_documents(query)
            print(f"  → Usuarios a revertir: {affected_users}")
            
            if affected_users > 0:
                # Remover password_hash (dejando password original)
                result = await db.users.update_many(
                    query,
                    {
                        "$unset": {"password_hash": ""},
                        "$set": {"updated_at": datetime.utcnow()}
                    }
                )
                print(f"  → Usuarios revertidos: {result.modified_count}")
            
            # Registrar rollback
            migrations_collection = db.migrations_log
            await migrations_collection.insert_one({
                "name": f"{Migration002.name}_rollback",
                "applied_at": datetime.utcnow(),
                "status": "rolled_back"
            })
            
            print(f"  ✅ {Migration002.name} revertida")
            return True
            
        except Exception as e:
            print(f"  ❌ Error revirtiendo {Migration002.name}: {str(e)}")
            raise


async def run_migration():
    """Helper para ejecutar migración desde CLI."""
    import os
    from motor.motor_asyncio import AsyncIOMotorClient
    
    mongo_url = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
    client = AsyncIOMotorClient(mongo_url)
    db_name = os.environ.get("DB_NAME", "puntocero_legal")
    db = client[db_name]
    
    try:
        await Migration002.apply(db)
    finally:
        client.close()


if __name__ == "__main__":
    asyncio.run(run_migration())
