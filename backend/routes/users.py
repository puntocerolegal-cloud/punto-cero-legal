from fastapi import APIRouter, HTTPException, Depends, Header, status
from typing import Optional, List
from motor.motor_asyncio import AsyncIOMotorDatabase
from utils.auth import decode_token
from bson import ObjectId
from pydantic import BaseModel

router = APIRouter(prefix="/users", tags=["Users"])

async def get_db():
    from server import db
    return db

async def get_current_user(
    authorization: Optional[str] = Header(None),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Obtener usuario actual desde el token"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="No autenticado")
    
    token = authorization.replace("Bearer ", "")
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Token inválido")
    
    user = await db.users.find_one({"email": payload["sub"]})
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    user["_id"] = str(user["_id"])
    return user

class UserResponse(BaseModel):
    id: str
    full_name: str
    email: str
    role: str
    country: Optional[str] = None

# GET /api/users - Listar usuarios (para admin, para seleccionar propietarios de firma)
@router.get("/", response_model=List[UserResponse], status_code=status.HTTP_200_OK)
async def list_users(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Listar usuarios para admin (ej: seleccionar propietarios de firma)"""
    # Solo admin, admin_general pueden listar usuarios
    if current_user.get("role") not in ["admin", "admin_general"]:
        raise HTTPException(status_code=403, detail="No autorizado para listar usuarios")
    
    users = await db.users.find(
        {"role": {"$in": ["lawyer", "admin_general", "socio_comercial"]}}
    ).sort("full_name", 1).to_list(None)
    
    return [
        UserResponse(
            id=str(user["_id"]),
            full_name=user.get("full_name", ""),
            email=user.get("email", ""),
            role=user.get("role", ""),
            country=user.get("country")
        )
        for user in users
    ]

# GET /api/users/me - Obtener perfil del usuario actual
@router.get("/me", status_code=status.HTTP_200_OK)
async def get_profile(current_user: dict = Depends(get_current_user)):
    """Obtener perfil del usuario autenticado"""
    return {
        "id": current_user["_id"],
        "full_name": current_user.get("full_name", ""),
        "email": current_user.get("email", ""),
        "role": current_user.get("role", ""),
        "country": current_user.get("country"),
        "phone": current_user.get("phone"),
        "specialty": current_user.get("specialty"),
        "bar_number": current_user.get("bar_number"),
    }


class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    country: Optional[str] = None
    specialty: Optional[str] = None
    bar_number: Optional[str] = None


# PATCH /api/users/me - Actualizar perfil propio (self-scoped, campos permitidos)
@router.patch("/me", status_code=status.HTTP_200_OK)
async def update_profile(
    payload: ProfileUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Actualiza el perfil del propio usuario. No permite cambiar email/rol/estado."""
    from datetime import datetime
    updates = {k: v for k, v in payload.dict().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="Sin campos para actualizar")
    updates["updated_at"] = datetime.utcnow()
    await db.users.update_one({"email": current_user["email"]}, {"$set": updates})
    user = await db.users.find_one({"email": current_user["email"]})
    return {
        "success": True,
        "id": str(user["_id"]),
        "full_name": user.get("full_name", ""),
        "email": user.get("email", ""),
        "phone": user.get("phone"),
        "country": user.get("country"),
        "specialty": user.get("specialty"),
        "bar_number": user.get("bar_number"),
    }
