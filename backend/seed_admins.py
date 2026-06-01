"""
Seed script para crear usuarios administrativos:
- Dr. Darwin Gomez (ADMIN_GENERAL)
- Dr. Alejandro Cetina (SOCIO_COMERCIAL)
"""
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from datetime import datetime
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).parent / '.env')

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def seed_admins():
    client = AsyncIOMotorClient(os.environ['MONGO_URL'])
    db = client[os.environ['DB_NAME']]
    
    admins = [
        {
            "email": "darwin@puntocerolegal.com",
            "password_hash": pwd_context.hash("Admin2025!"),
            "full_name": "Dr. Darwin Gomez",
            "role": "admin_general",
            "phone": "+57 3028322083",
            "country": "Colombia",
            "specialty": "Director Ejecutivo",
            "bar_number": "DG-ADMIN-001",
            "status": "active",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "email": "alejandro@puntocerolegal.com",
            "password_hash": pwd_context.hash("Socio2025!"),
            "full_name": "Dr. Alejandro Cetina",
            "role": "socio_comercial",
            "phone": "+57 3028322083",
            "country": "Colombia",
            "specialty": "Director Comercial",
            "bar_number": "AC-SOCIO-002",
            "status": "active",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
    ]
    
    for admin in admins:
        existing = await db.users.find_one({"email": admin["email"]})
        if existing:
            await db.users.update_one(
                {"email": admin["email"]},
                {"$set": {
                    "password_hash": admin["password_hash"],
                    "role": admin["role"],
                    "full_name": admin["full_name"],
                    "updated_at": datetime.utcnow()
                }}
            )
            print(f"✅ Actualizado: {admin['full_name']} ({admin['role']})")
        else:
            await db.users.insert_one(admin)
            print(f"✅ Creado: {admin['full_name']} ({admin['role']})")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_admins())
