from fastapi import APIRouter, HTTPException, Depends, status
from typing import List, Optional
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorDatabase
from models.firm import Firm, FirmCreate, FirmUpdate, FirmResponse
from routes.auth import get_current_user
from bson import ObjectId

router = APIRouter(prefix="/firms", tags=["Firm OS"])

async def get_db():
    from server import db
    return db

# GET /firms - Listar todas las firmas (admin only)
@router.get("/", response_model=List[FirmResponse], status_code=status.HTTP_200_OK)
async def list_firms(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Listar todas las firmas registradas (solo admin)"""
    if current_user.get("role") not in ["admin", "admin_general"]:
        raise HTTPException(status_code=403, detail="Solo administradores pueden listar firmas")
    
    firms = await db.firms.find().sort("created_at", -1).to_list(None)
    return [
        FirmResponse(
            id=str(firm["_id"]),
            name=firm["name"],
            email=firm["email"],
            plan=firm["plan"],
            max_lawyers=firm["max_lawyers"],
            active_lawyers_count=firm.get("active_lawyers_count", 0),
            owner_name=firm["owner_name"],
            owner_email=firm["owner_email"],
            status=firm["status"],
            is_verified=firm["is_verified"],
            created_at=firm["created_at"].isoformat() if isinstance(firm["created_at"], datetime) else firm["created_at"],
            updated_at=firm["updated_at"].isoformat() if isinstance(firm["updated_at"], datetime) else firm["updated_at"]
        )
        for firm in firms
    ]

# POST /firms - Crear nueva firma
@router.post("/", response_model=FirmResponse, status_code=status.HTTP_201_CREATED)
async def create_firm(
    firm_data: FirmCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Crear nueva firma (solo admin)"""
    if current_user.get("role") not in ["admin", "admin_general"]:
        raise HTTPException(status_code=403, detail="Solo administradores pueden crear firmas")
    
    # Verificar que el owner existe
    owner = await db.users.find_one({"_id": ObjectId(firm_data.owner_id)})
    if not owner:
        raise HTTPException(status_code=404, detail="Usuario propietario no encontrado")
    
    # Verificar que no exista firma con mismo email
    existing = await db.firms.find_one({"email": firm_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Ya existe una firma con este email")
    
    firm_doc = {
        "name": firm_data.name,
        "email": firm_data.email,
        "phone": firm_data.phone,
        "address": firm_data.address,
        "city": firm_data.city,
        "country": firm_data.country or "Colombia",
        "plan": firm_data.plan,
        "max_lawyers": 5 if firm_data.plan == "firm_growth" else 20,
        "active_lawyers_count": 0,
        "owner_id": firm_data.owner_id,
        "owner_name": owner.get("full_name", ""),
        "owner_email": owner.get("email", ""),
        "status": "active",
        "is_verified": False,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    
    result = await db.firms.insert_one(firm_doc)
    
    # Actualizar usuario propietario: asignar firm_id y role = firm_owner
    await db.users.update_one(
        {"_id": ObjectId(firm_data.owner_id)},
        {"$set": {
            "firm_id": str(result.inserted_id),
            "role": "firm_owner",
            "updated_at": datetime.utcnow()
        }}
    )
    
    return FirmResponse(
        id=str(result.inserted_id),
        name=firm_doc["name"],
        email=firm_doc["email"],
        plan=firm_doc["plan"],
        max_lawyers=firm_doc["max_lawyers"],
        active_lawyers_count=0,
        owner_name=firm_doc["owner_name"],
        owner_email=firm_doc["owner_email"],
        status=firm_doc["status"],
        is_verified=False,
        created_at=firm_doc["created_at"].isoformat(),
        updated_at=firm_doc["updated_at"].isoformat()
    )

# GET /firms/:id - Obtener firma por ID
@router.get("/{firm_id}", response_model=FirmResponse, status_code=status.HTTP_200_OK)
async def get_firm(
    firm_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Obtener detalles de una firma"""
    try:
        oid = ObjectId(firm_id)
    except:
        raise HTTPException(status_code=400, detail="ID de firma inválido")
    
    firm = await db.firms.find_one({"_id": oid})
    if not firm:
        raise HTTPException(status_code=404, detail="Firma no encontrada")
    
    # Validación: solo owner, admin de la firma o admin global pueden ver
    if current_user.get("role") not in ["admin", "admin_general"]:
        if current_user.get("firm_id") != firm_id and str(current_user.get("_id")) != firm.get("owner_id"):
            raise HTTPException(status_code=403, detail="No tienes permiso para ver esta firma")
    
    return FirmResponse(
        id=str(firm["_id"]),
        name=firm["name"],
        email=firm["email"],
        plan=firm["plan"],
        max_lawyers=firm["max_lawyers"],
        active_lawyers_count=firm.get("active_lawyers_count", 0),
        owner_name=firm["owner_name"],
        owner_email=firm["owner_email"],
        status=firm["status"],
        is_verified=firm["is_verified"],
        created_at=firm["created_at"].isoformat() if isinstance(firm["created_at"], datetime) else firm["created_at"],
        updated_at=firm["updated_at"].isoformat() if isinstance(firm["updated_at"], datetime) else firm["updated_at"]
    )

# PATCH /firms/:id - Actualizar firma
@router.patch("/{firm_id}", response_model=FirmResponse, status_code=status.HTTP_200_OK)
async def update_firm(
    firm_id: str,
    firm_update: FirmUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Actualizar detalles de una firma"""
    try:
        oid = ObjectId(firm_id)
    except:
        raise HTTPException(status_code=400, detail="ID de firma inválido")
    
    firm = await db.firms.find_one({"_id": oid})
    if not firm:
        raise HTTPException(status_code=404, detail="Firma no encontrada")
    
    # Solo owner o admin puede actualizar
    if current_user.get("role") not in ["admin", "admin_general"]:
        if str(current_user.get("_id")) != firm.get("owner_id"):
            raise HTTPException(status_code=403, detail="No tienes permiso para actualizar esta firma")
    
    update_data = {k: v for k, v in firm_update.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    
    await db.firms.update_one({"_id": oid}, {"$set": update_data})
    
    updated_firm = await db.firms.find_one({"_id": oid})
    return FirmResponse(
        id=str(updated_firm["_id"]),
        name=updated_firm["name"],
        email=updated_firm["email"],
        plan=updated_firm["plan"],
        max_lawyers=updated_firm["max_lawyers"],
        active_lawyers_count=updated_firm.get("active_lawyers_count", 0),
        owner_name=updated_firm["owner_name"],
        owner_email=updated_firm["owner_email"],
        status=updated_firm["status"],
        is_verified=updated_firm["is_verified"],
        created_at=updated_firm["created_at"].isoformat() if isinstance(updated_firm["created_at"], datetime) else updated_firm["created_at"],
        updated_at=updated_firm["updated_at"].isoformat() if isinstance(updated_firm["updated_at"], datetime) else updated_firm["updated_at"]
    )
