from fastapi import APIRouter, HTTPException, Depends, Header, status
from typing import List, Optional
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorDatabase
from models.user import UserCreate, User, UserLogin, UserResponse
from utils.auth import get_password_hash, verify_password, create_access_token, decode_token
from utils import notifier
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


async def get_current_admin(
    authorization: Optional[str] = Header(None),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Verifica que el usuario autenticado es un administrador."""
    user = await get_current_user(authorization, db)
    admin_roles = ["admin", "admin_general", "socio_comercial"]
    if user.get("role") not in admin_roles:
        raise HTTPException(status_code=403, detail="Acceso denegado: solo administradores")
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
        "requires_password_change": bool(current.get("requires_password_change", False)),
        "firm_id": current.get("firm_id"),
        "country": current.get("country"),
        "specialty": current.get("specialty"),
        "phone": current.get("phone"),
        "bar_number": current.get("bar_number"),
        "firm_name": current.get("firm_name"),
        "id_document": current.get("id_document"),
        "organizationId": current.get("organizationId"),
    }


@router.post("/register", response_model=dict, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db: AsyncIOMotorDatabase = Depends(get_db)):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este correo ya está registrado"
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

    # Alerta al administrador: nuevo usuario registrado (evento crítico).
    if user_data.role not in ["admin", "admin_general", "socio_comercial"]:
        try:
            await notifier.create_app_notification(
                db, target="admin", type="new_user",
                title="Nuevo usuario registrado",
                message=f"{user_dict.get('full_name', '')} ({user_dict['email']}) se registró como {user_data.role}.",
            )
        except Exception:
            pass

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
    password_hash = user.get("password_hash") if user else None
    # Compatibilidad: usuarios antiguos pueden tener "password" en lugar de "password_hash"
    if not password_hash and user:
        password_hash = user.get("password")

    if not user or not password_hash:
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    if not verify_password(credentials.password, password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo o contraseña incorrectos"
        )
    
    if user.get("status") in ["inactive", "suspended"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tu cuenta no está activa. Contacta al soporte."
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
            "requires_password_change": bool(user.get("requires_password_change", False)),
            "firm_id": user.get("firm_id"),
            "country": user.get("country"),
            "specialty": user.get("specialty"),
            "phone": user.get("phone"),
            "bar_number": user.get("bar_number"),
            "firm_name": user.get("firm_name"),
            "id_document": user.get("id_document")
        }
    }

@router.get("/debug/check-official-accounts")
async def debug_check_accounts(db: AsyncIOMotorDatabase = Depends(get_db)):
    """TEMPORAL: Verificar estado de cuentas oficiales para debug."""
    accounts_to_check = [
        "darwin@puntocerolegal.com",
        "alejandro@puntocerolegal.com",
        "abogado@puntocerolegal.com",
        "firma@puntocerolegal.com"
    ]
    result = {}
    for email in accounts_to_check:
        user = await db.users.find_one({"email": email})
        if user:
            result[email] = {
                "exists": True,
                "role": user.get("role"),
                "status": user.get("status"),
                "is_verified": user.get("is_verified"),
                "has_password_hash": bool(user.get("password_hash")),
                "has_password": bool(user.get("password")),
                "firm_id": user.get("firm_id"),
                "deleted_at": user.get("deleted_at")
            }
        else:
            result[email] = {"exists": False}
    return result

@router.post("/change-password-first-login", response_model=dict, status_code=status.HTTP_200_OK)
async def change_password_first_login(
    payload: dict,
    current_user = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Cambiar contraseña en primer login (requiere requires_password_change=True)

    Validaciones:
    1. Usuario debe tener requires_password_change = True
    2. Nueva contraseña debe ser diferente a la actual
    3. Nueva contraseña debe cumplir requisitos de seguridad
    """
    from utils.auth import verify_password, get_password_hash

    new_password = payload.get("new_password", "").strip()
    current_password = payload.get("current_password", "").strip()

    # Validar que requires_password_change sea true
    if not current_user.get("requires_password_change"):
        raise HTTPException(
            status_code=400,
            detail="Este usuario no requiere cambio de contraseña"
        )

    # Validar que la contraseña actual sea correcta
    if not current_password or not verify_password(current_password, current_user.get("password_hash", "")):
        raise HTTPException(
            status_code=401,
            detail="Contraseña actual incorrecta"
        )

    # Validar nueva contraseña
    if not new_password:
        raise HTTPException(
            status_code=400,
            detail="La nueva contraseña es requerida"
        )

    if len(new_password) < 8:
        raise HTTPException(
            status_code=400,
            detail="La contraseña debe tener al menos 8 caracteres"
        )

    # Validar que sea diferente
    if verify_password(new_password, current_user.get("password_hash")):
        raise HTTPException(
            status_code=400,
            detail="La nueva contraseña debe ser diferente a la anterior"
        )

    # Actualizar contraseña
    password_hash = get_password_hash(new_password)

    await db.users.update_one(
        {"_id": ObjectId(current_user["_id"])},
        {"$set": {
            "password_hash": password_hash,
            "requires_password_change": False,
            "updated_at": datetime.utcnow()
        }}
    )

    return {
        "success": True,
        "message": "Contraseña actualizada exitosamente",
        "user": {
            "id": str(current_user["_id"]),
            "email": current_user["email"],
            "requires_password_change": False
        }
    }
