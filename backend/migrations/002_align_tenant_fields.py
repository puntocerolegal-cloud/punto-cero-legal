"""
BLOQUEADOR 3 — Tenant Field Alignment Migration

Objetivo: Garantizar que TODOS los usuarios tengan:
  - firm_id (requerido por AI auth y payment routes)
  - tenant_id (requerido por legacy routes)

Si un usuario tiene uno pero no el otro, copia el valor.
Si un usuario tiene ninguno, registra para auditoría.

Ejecución:
  python -m backend.migrations.002_align_tenant_fields --apply
  python -m backend.migrations.002_align_tenant_fields --status
"""

import asyncio
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

class Migration002:
    """Migración para alinear firm_id y tenant_id en usuarios."""
    
    name = "002_align_tenant_fields"
    
    @staticmethod
    async def apply(db: AsyncIOMotorDatabase):
        """Aplica los cambios de la migración."""
        try:
            print(f"[{datetime.utcnow().isoformat()}] Iniciando {Migration002.name}...")
            
            # Paso 1: Contar usuarios sin firma/tenant
            users = await db.users.find({}).to_list(length=None)
            total = len(users)
            
            missing_firm_id = []
            missing_tenant_id = []
            both_missing = []
            aligned = 0
            updated = 0
            
            for user in users:
                user_id = str(user.get("_id"))
                firm_id = user.get("firm_id")
                tenant_id = user.get("tenant_id")
                
                # Caso 1: Tiene firm_id pero no tenant_id
                if firm_id and not tenant_id:
                    print(f"  → User {user_id}: Copiando firm_id ({firm_id}) → tenant_id")
                    await db.users.update_one(
                        {"_id": user["_id"]},
                        {"$set": {"tenant_id": firm_id}}
                    )
                    updated += 1
                
                # Caso 2: Tiene tenant_id pero no firm_id
                elif tenant_id and not firm_id:
                    print(f"  → User {user_id}: Copiando tenant_id ({tenant_id}) → firm_id")
                    await db.users.update_one(
                        {"_id": user["_id"]},
                        {"$set": {"firm_id": tenant_id}}
                    )
                    updated += 1
                
                # Caso 3: Tiene ambos (OK)
                elif firm_id and tenant_id:
                    aligned += 1
                
                # Caso 4: No tiene ninguno
                else:
                    both_missing.append(user_id)
            
            # Paso 2: Registrar resultado
            result = {
                "total_users": total,
                "aligned": aligned,
                "updated": updated,
                "missing_both": len(both_missing),
                "users_missing_both": both_missing[:10]  # Mostrar primeros 10
            }
            
            print(f"  → Total usuarios: {total}")
            print(f"  → Con firm_id y tenant_id: {aligned}")
            print(f"  → Actualizados en esta pasada: {updated}")
            print(f"  → Sin ninguno (requerirán acción manual): {len(both_missing)}")
            
            # Paso 3: Registrar migración
            await db.migrations_log.insert_one({
                "name": Migration002.name,
                "applied_at": datetime.utcnow(),
                "status": "applied",
                "changes": result
            })
            
            print(f"[{datetime.utcnow().isoformat()}] {Migration002.name} aplicada exitosamente.")
            
            if both_missing:
                print(f"\n⚠️  ACCIÓN REQUERIDA: {len(both_missing)} usuarios sin firma/tenant:")
                for uid in both_missing[:5]:
                    print(f"    - {uid}")
            
            return {"success": True, "result": result}
            
        except Exception as e:
            print(f"ERROR en migración: {str(e)}")
            raise
    
    @staticmethod
    async def status(db: AsyncIOMotorDatabase):
        """Verifica el estado de la migración."""
        migration_record = await db.migrations_log.find_one({"name": Migration002.name})
        
        if not migration_record:
            print(f"{Migration002.name}: NOT APPLIED")
            return {"status": "not_applied"}
        
        status = migration_record.get("status", "unknown")
        applied_at = migration_record.get("applied_at")
        changes = migration_record.get("changes", {})
        
        print(f"{Migration002.name}: {status.upper()}")
        if applied_at:
            print(f"  Applied at: {applied_at.isoformat()}")
            print(f"  Changes: {changes}")
        
        return {
            "status": status,
            "applied_at": applied_at,
            "changes": changes
        }


async def main():
    from server import db
    import sys
    
    action = sys.argv[1] if len(sys.argv) > 1 else "status"
    
    if action == "--apply":
        await Migration002.apply(db)
    elif action == "--status":
        await Migration002.status(db)
    else:
        print(f"Uso: python -m backend.migrations.002_align_tenant_fields [--apply|--status]")


if __name__ == "__main__":
    asyncio.run(main())
