"""
Seed de prueba para Firm OS - FASE 1
Crea 3 firmas de prueba con propietarios
"""
import asyncio
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from bson import ObjectId
from passlib.context import CryptContext

async def seed_firms():
    """Crear firmas de prueba"""
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["punto-cero"]
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    
    # Crear propietarios de firmas
    owners = [
        {
            "full_name": "María García - Firma Growth",
            "email": "maria.firma@puntocero.local",
            "password": pwd_context.hash("Admin2025!"),
            "role": "firm_owner",
            "country": "Colombia",
            "status": "ACTIVE",
            "is_verified": True,
        },
        {
            "full_name": "Carlos López - Firma Enterprise",
            "email": "carlos.firma@puntocero.local",
            "password": pwd_context.hash("Admin2025!"),
            "role": "firm_owner",
            "country": "Colombia",
            "status": "ACTIVE",
            "is_verified": True,
        },
        {
            "full_name": "Ana Martínez - Firma Boutique",
            "email": "ana.firma@puntocero.local",
            "password": pwd_context.hash("Admin2025!"),
            "role": "firm_owner",
            "country": "Colombia",
            "status": "ACTIVE",
            "is_verified": True,
        }
    ]
    
    # Insertar propietarios
    owner_results = await db.users.insert_many(owners)
    owner_ids = [str(oid) for oid in owner_results.inserted_ids]
    
    # Crear firmas
    firms = [
        {
            "name": "Firma Jurídica en Crecimiento",
            "email": "contacto@firmacrecimiento.co",
            "phone": "+57 1 2345678",
            "address": "Cra 7 #120-50",
            "city": "Bogotá",
            "country": "Colombia",
            "plan": "firm_growth",
            "max_lawyers": 5,
            "active_lawyers_count": 2,
            "owner_id": owner_ids[0],
            "owner_name": owners[0]["full_name"],
            "owner_email": owners[0]["email"],
            "status": "active",
            "is_verified": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        },
        {
            "name": "Firma Corporativa Enterprise",
            "email": "contacto@firmacorporativa.co",
            "phone": "+57 1 9876543",
            "address": "Cra 11 #80-25",
            "city": "Medellín",
            "country": "Colombia",
            "plan": "firm_enterprise",
            "max_lawyers": 20,
            "active_lawyers_count": 8,
            "owner_id": owner_ids[1],
            "owner_name": owners[1]["full_name"],
            "owner_email": owners[1]["email"],
            "status": "active",
            "is_verified": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        },
        {
            "name": "Firma Boutique Especializada",
            "email": "contacto@firmaboutique.co",
            "phone": "+57 2 5555555",
            "address": "Cra 5 #15-45",
            "city": "Cali",
            "country": "Colombia",
            "plan": "firm_growth",
            "max_lawyers": 5,
            "active_lawyers_count": 1,
            "owner_id": owner_ids[2],
            "owner_name": owners[2]["full_name"],
            "owner_email": owners[2]["email"],
            "status": "active",
            "is_verified": False,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }
    ]
    
    # Insertar firmas
    firm_results = await db.firms.insert_many(firms)
    firm_ids = firm_results.inserted_ids
    
    # Actualizar propietarios con firm_id
    for i, owner_id in enumerate(owner_ids):
        await db.users.update_one(
            {"_id": ObjectId(owner_id)},
            {"$set": {"firm_id": str(firm_ids[i])}}
        )
    
    # Crear abogados para las firmas
    lawyers = [
        # Firma 1
        {
            "full_name": "Dr. Juan Pérez",
            "email": "juan.perez@firmacrecimiento.co",
            "password": pwd_context.hash("Lawyer2025!"),
            "role": "firm_lawyer",
            "firm_id": str(firm_ids[0]),
            "specialty": "Derecho Corporativo",
            "bar_number": "COL-001",
            "country": "Colombia",
            "status": "ACTIVE",
            "is_verified": True,
        },
        {
            "full_name": "Dra. Sandra López",
            "email": "sandra.lopez@firmacrecimiento.co",
            "password": pwd_context.hash("Lawyer2025!"),
            "role": "firm_lawyer",
            "firm_id": str(firm_ids[0]),
            "specialty": "Derecho Laboral",
            "bar_number": "COL-002",
            "country": "Colombia",
            "status": "ACTIVE",
            "is_verified": True,
        },
        # Firma 2
        {
            "full_name": "Dr. Roberto González",
            "email": "roberto.gonzalez@firmacorporativa.co",
            "password": pwd_context.hash("Lawyer2025!"),
            "role": "firm_lawyer",
            "firm_id": str(firm_ids[1]),
            "specialty": "M&A",
            "bar_number": "COL-003",
            "country": "Colombia",
            "status": "ACTIVE",
            "is_verified": True,
        },
        {
            "full_name": "Dr. Miguel Ramírez",
            "email": "miguel.ramirez@firmacorporativa.co",
            "password": pwd_context.hash("Lawyer2025!"),
            "role": "firm_lawyer",
            "firm_id": str(firm_ids[1]),
            "specialty": "Tributario",
            "bar_number": "COL-004",
            "country": "Colombia",
            "status": "ACTIVE",
            "is_verified": True,
        },
        # Firma 3
        {
            "full_name": "Dra. Catalina Morales",
            "email": "catalina.morales@firmaboutique.co",
            "password": pwd_context.hash("Lawyer2025!"),
            "role": "firm_lawyer",
            "firm_id": str(firm_ids[2]),
            "specialty": "Derecho Ambiental",
            "bar_number": "COL-005",
            "country": "Colombia",
            "status": "ACTIVE",
            "is_verified": True,
        },
    ]
    
    await db.users.insert_many(lawyers)
    
    # Actualizar contador de abogados activos en las firmas
    await db.firms.update_one(
        {"_id": firm_ids[0]},
        {"$set": {"active_lawyers_count": 2}}
    )
    await db.firms.update_one(
        {"_id": firm_ids[1]},
        {"$set": {"active_lawyers_count": 4}}
    )
    await db.firms.update_one(
        {"_id": firm_ids[2]},
        {"$set": {"active_lawyers_count": 1}}
    )
    
    client.close()
    print("✅ Seed de Firm OS completado")
    print(f"   - 3 firmas creadas")
    print(f"   - 3 propietarios creados")
    print(f"   - 5 abogados asociados creados")

if __name__ == "__main__":
    asyncio.run(seed_firms())
