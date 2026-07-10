#!/usr/bin/env python3
"""
INTERNAL DIAGNOSTIC SCRIPT - Solo para debugging, no expone datos públicamente.
Verifica el estado de cuentas oficiales en MongoDB.
"""

import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
import json

async def diagnose():
    """Verifica el estado de las cuentas oficiales en MongoDB."""
    
    # Conexión a MongoDB
    mongo_url = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
    db_name = os.environ.get("DB_NAME", "puntocero_legal")
    
    print(f"[{datetime.now().isoformat()}] Iniciando diagnóstico...")
    print(f"MONGO_URL: {mongo_url}")
    print(f"DB_NAME: {db_name}")
    print("-" * 80)
    
    try:
        client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=5000)
        db = client[db_name]
        
        # Test conexión
        await db.command('ping')
        print("✅ MongoDB conectado exitosamente")
        
    except Exception as e:
        print(f"❌ Error conectando a MongoDB: {e}")
        return
    
    # Cuentas a verificar
    official_accounts = [
        "darwin@puntocerolegal.com",
        "alejandro@puntocerolegal.com",
        "abogado@puntocerolegal.com",
        "firma@puntocerolegal.com"
    ]
    
    print("\n" + "=" * 80)
    print("DIAGNÓSTICO DE CUENTAS OFICIALES")
    print("=" * 80 + "\n")
    
    for email in official_accounts:
        print(f"\n📧 {email}")
        print("-" * 80)
        
        user = await db.users.find_one({"email": email})
        
        if not user:
            print("  ❌ NO EXISTE en MongoDB")
            continue
        
        print("  ✅ EXISTE en MongoDB")
        print(f"  _id: {user.get('_id')}")
        print(f"  full_name: {user.get('full_name')}")
        print(f"  role: {user.get('role')}")
        print(f"  status: {user.get('status')}")
        print(f"  is_verified: {user.get('is_verified')}")
        print(f"  deleted_at: {user.get('deleted_at')}")
        print(f"  firm_id: {user.get('firm_id')}")
        print(f"  organizationId: {user.get('organizationId')}")
        print(f"  has password_hash: {bool(user.get('password_hash'))}")
        print(f"  has password: {bool(user.get('password'))}")
        print(f"  created_at: {user.get('created_at')}")
        print(f"  updated_at: {user.get('updated_at')}")
        
        # Análisis de potenciales bloqueadores
        blockers = []
        if not user.get('password_hash') and not user.get('password'):
            blockers.append("⚠️  Sin password_hash ni password → No puede autenticar")
        if user.get('deleted_at'):
            blockers.append("⚠️  deleted_at != null → Usuario marcado como eliminado")
        if user.get('status') in ['inactive', 'suspended', 'PENDING_VERIFICATION']:
            blockers.append(f"⚠️  status={user.get('status')} → Puede bloquear según lógica")
        if user.get('role') not in ['admin', 'admin_general', 'socio_comercial', 'lawyer', 'firm_owner']:
            blockers.append(f"⚠️  role inválido: {user.get('role')}")
        
        if blockers:
            print("\n  🔴 POTENCIALES BLOQUEADORES:")
            for blocker in blockers:
                print(f"     {blocker}")
        else:
            print("\n  🟢 Sin bloqueadores evidentes")
    
    print("\n" + "=" * 80)
    print("FIN DIAGNÓSTICO")
    print("=" * 80)
    
    client.close()

if __name__ == "__main__":
    asyncio.run(diagnose())
