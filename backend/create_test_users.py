"""
Script para crear/verificar los 3 usuarios de prueba:
1. admin@puntocerolegal.com (rol: admin) -> /admin
2. abogado@puntocerolegal.com (rol: lawyer) -> /dashboard
3. firma@puntocerolegal.com (rol: firm_owner) -> /firm-os

No modifica ProtectedRoute ni la arquitectura.
Solo asegura que los usuarios existan en la BD.
"""
import asyncio
import os
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext

pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")

TEST_USERS = [
    {
        "email": "admin@puntocerolegal.com",
        "password": "Admin2025!",
        "full_name": "Admin Principal",
        "role": "admin",
        "status": "ACTIVE",
        "is_verified": True,
        "country": "Colombia",
    },
    {
        "email": "abogado@puntocerolegal.com",
        "password": "Abogado2025!",
        "full_name": "Abogado de Prueba",
        "role": "lawyer",
        "status": "ACTIVE",
        "is_verified": True,
        "country": "Colombia",
    },
    {
        "email": "firma@puntocerolegal.com",
        "password": "Firma2025!",
        "full_name": "Dueño de Firma",
        "role": "firm_owner",
        "status": "ACTIVE",
        "is_verified": True,
        "country": "Colombia",
    },
]

async def main():
    mongo_url = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
    db_name = os.environ.get("DB_NAME", "puntocero_legal")
    
    print(f"Conectando a MongoDB: {mongo_url}")
    client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=5000)
    db = client[db_name]
    
    # Test connection
    await db.command('ping')
    print("✅ MongoDB conectado")
    
    for u in TEST_USERS:
        existing = await db.users.find_one({"email": u["email"]})
        if existing:
            # Update role and ensure active
            await db.users.update_one(
                {"email": u["email"]},
                {"$set": {
                    "role": u["role"],
                    "status": "ACTIVE",
                    "is_verified": True,
                    "password_hash": pwd.hash(u["password"][:72]),
                }}
            )
            print(f"✅ Usuario actualizado: {u['email']} (rol: {u['role']})")
        else:
            await db.users.insert_one({
                "email": u["email"],
                "password_hash": pwd.hash(u["password"][:72]),
                "full_name": u["full_name"],
                "role": u["role"],
                "status": "ACTIVE",
                "is_verified": True,
                "country": u["country"],
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
            })
            print(f"✅ Usuario creado: {u['email']} (rol: {u['role']})")
    
    # Verify
    print("\n--- VERIFICACIÓN ---")
    for u in TEST_USERS:
        user = await db.users.find_one({"email": u["email"]})
        if user:
            print(f"  {user['email']} -> role={user['role']}, status={user.get('status')}, verified={user.get('is_verified')}")
        else:
            print(f"  ❌ {u['email']} NO ENCONTRADO")
    
    client.close()
    print("\n✅ Script completado")

if __name__ == "__main__":
    asyncio.run(main())