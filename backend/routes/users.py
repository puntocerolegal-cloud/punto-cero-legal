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

# Campos de perfil editables por el propio usuario (personal + visual + i18n).
# NO incluye email/role/status/password (no se pueden cambiar por aquí).
PROFILE_FIELDS = [
    # Identidad / contacto
    "full_name", "public_name", "commercial_name", "legal_name", "title", "bio",
    "specialty", "specialties", "bar_number", "digital_signature",
    "phone", "phone_country_code", "email_public", "website", "social_links",
    "address", "city", "state", "postal_code", "country", "schedule", "business_hours",
    # i18n
    "language", "timezone", "currency",
    # Visual / White Label personal
    "avatar_url", "logo_url", "cover_url", "favicon_url",
    "primary_color", "secondary_color", "button_color", "theme", "background_url",
]


def _profile_view(u: dict) -> dict:
    out = {"id": str(u.get("_id")), "email": u.get("email", ""), "role": u.get("role", "")}
    for f in PROFILE_FIELDS:
        out[f] = u.get(f)
    return out


# GET /api/users/me - Obtener perfil del usuario actual
@router.get("/me", status_code=status.HTTP_200_OK)
async def get_profile(current_user: dict = Depends(get_current_user)):
    """Obtener perfil completo del usuario autenticado."""
    return _profile_view(current_user)


# PATCH /api/users/me - Actualizar perfil propio (self-scoped, whitelist de campos)
@router.patch("/me", status_code=status.HTTP_200_OK)
async def update_profile(
    payload: dict,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Actualiza el perfil del propio usuario. Whitelist: no permite email/rol/estado/password."""
    from datetime import datetime
    updates = {k: v for k, v in (payload or {}).items() if k in PROFILE_FIELDS}
    if not updates:
        raise HTTPException(status_code=400, detail="Sin campos válidos para actualizar")
    updates["updated_at"] = datetime.utcnow()
    await db.users.update_one({"email": current_user["email"]}, {"$set": updates})
    user = await db.users.find_one({"email": current_user["email"]})
    return {"success": True, **_profile_view(user)}
