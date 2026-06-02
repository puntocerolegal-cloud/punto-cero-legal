from fastapi import APIRouter, HTTPException, Depends, Header, status
from typing import List, Optional
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorDatabase
from models.user import UserCreate, User, UserLogin, UserResponse
from utils.auth import get_password_hash, verify_password, create_access_token, decode_token
from bson import ObjectId

router = APIRouter(prefix="/auth", tags=["Authentication"])

# Dependency to get database
async def get_db():
    from server import db
    return db


async def get_current_user(
    authorization: Optional[str] = Header(None),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Resuelve el usuario autenticado desde el JWT Bearer token."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="No autenticado")
    token = authorization.replace("Bearer ", "")
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")
    user = await db.users.find_one({"email": payload["sub"]})
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return user

@router.get("/me")
async def get_me(current = Depends(get_current_user)):
    """Devuelve el estado actual del usuario autenticado (fuente de verdad).
    Útil para sincronizar is_verified tras la aprobación admin."""
    return {
        "id": str(current["_id"]),
        "email": current["email"],
        "full_name": current.get("full_name"),
        "role": current["role"],
        "status": current.get("status", "PENDING_VERIFICATION"),
        "is_verified": bool(current.get("is_verified", False)),
        "country": current.get("country"),
        "specialty": current.get("specialty"),
        "phone": current.get("phone"),
        "bar_number": current.get("bar_number"),
        "firm_name": current.get("firm_name"),
        "id_document": current.get("id_document"),
    }


@router.post("/register", response_model=dict, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db: AsyncIOMotorDatabase = Depends(get_db)):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create user
    user_dict = user_data.model_dump(exclude={"password"})
    user_dict["password_hash"] = get_password_hash(user_data.password)
    user_dict["created_at"] = datetime.utcnow()
    user_dict["updated_at"] = datetime.utcnow()
    
    # Auto-verified solo para roles administrativos
    if user_data.role in ["admin", "admin_general", "socio_comercial"]:
        user_dict["status"] = "ACTIVE"
        user_dict["is_verified"] = True
    else:
        user_dict["status"] = "PENDING_VERIFICATION"
        user_dict["is_verified"] = False
    
    result = await db.users.insert_one(user_dict)
    user_dict["_id"] = str(result.inserted_id)
    
    # Create access token
    access_token = create_access_token(data={"sub": user_data.email, "role": user_data.role})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user_dict["_id"],
            "email": user_dict["email"],
            "full_name": user_dict["full_name"],
            "role": user_dict["role"],
            "status": user_dict["status"],
            "is_verified": user_dict["is_verified"]
        }
    }

@router.post("/login", response_model=dict)
async def login(credentials: UserLogin, db: AsyncIOMotorDatabase = Depends(get_db)):
    user = await db.users.find_one({"email": credentials.email})
    
    # Guarda: candidatos creados vía landing tienen password_hash=None hasta ser aprobados
    if not user or not user.get("password_hash"):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    if not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    if user.get("status") in ["inactive", "suspended"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is not active"
        )
    
    # Fuente de verdad de verificación: campo is_verified.
    # Para roles administrativos: siempre True (los maestros son confiables).
    admin_roles = ["admin", "admin_general", "socio_comercial"]
    role = user.get("role", "lawyer")
    if role in admin_roles:
        is_verified = True
    else:
        is_verified = bool(user.get("is_verified", False))

    access_token = create_access_token(data={"sub": user["email"], "role": role})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(user["_id"]),
            "email": user["email"],
            "full_name": user["full_name"],
            "role": role,
            "status": user.get("status", "PENDING_VERIFICATION"),
            "is_verified": is_verified,
            "country": user.get("country"),
            "specialty": user.get("specialty"),
            "phone": user.get("phone"),
            "bar_number": user.get("bar_number"),
            "firm_name": user.get("firm_name"),
            "id_document": user.get("id_document")
        }
    }