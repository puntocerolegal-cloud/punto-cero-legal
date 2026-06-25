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
        "country": current_user.get("country")
    }
