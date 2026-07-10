from fastapi import APIRouter, HTTPException, Depends, Header, status
from typing import List, Optional
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorDatabase
from models.user import UserCreate, User, UserLogin, UserResponse
from utils.auth import get_password_hash, verify_password, create_access_token, decode_token
from utils import notifier
from utils.rate_limiter_decorator import rate_limit  # CRITICAL FIX (S5.3-Finding#9)
from fastapi import Request
from bson import ObjectId
from repositories.user_repository import UserRepository

router = APIRouter(prefix="/auth", tags=["Authentication"])

# Dependency to get database
async def get_db():
    from server import db
    # Return the real database (bypass GuardedDB for auth operations)
    if hasattr(db, '_real_db'):
        return db._real_db
    return db


async def get_current_user(
    authorization: Optional[str] = Header(None),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Resuelve el usuario autenticado desde el JWT Bearer token.

    CRITICAL FIX (S5.3-Finding#5): Hardened Bearer token extraction and validation
    """
    from utils.auth import extract_bearer_token

    # CRITICAL FIX: Proper Bearer token extraction (not simple .replace())
    token = extract_bearer_token(authorization)

    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")

    # FIX: Use SecureRepository instead of direct db access
    user_repo = UserRepository(db.users)
    user = await user_repo.find_by_email(
        firm_id=payload.get("firm_id", ""),
        email=payload["sub"],
        request_id="auth"
    )
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
async def get_me(current = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    """Devuelve el estado actual del usuario autenticado (fuente de verdad).
    Útil para sincronizar is_verified tras la aprobación admin."""

    # FIX: Si el usuario es firm_owner y no tiene firm_id, buscar la firma por owner_email
    firm_id = current.get("firm_id")
    role = current.get("role", "lawyer")
    if role == "firm_owner" and not firm_id:
        # FIX: Use SecureRepository instead of direct db access
        from repositories.firm_repository import FirmRepository
        firm_repo = FirmRepository(db.firms)
        firm = await firm_repo.find_by_owner_email(
            owner_email=current["email"],
            request_id="auth"
        )
        if firm:
            firm_id = str(firm["_id"])
            # Actualizar el usuario con firm_id para futuros accesos
            user_repo = UserRepository(db.users)
            await user_repo.update_by_email(
                firm_id=firm.get("organization_id", ""),
                email=current["email"],
                updates={"firm_id": firm_id},
                request_id="auth"
            )

    return {
        "id": str(current["_id"]),
        "email": current["email"],
        "full_name": current.get("full_name"),
        "role": role,
        "status": current.get("status", "PENDING_VERIFICATION"),
        "is_verified": bool(current.get("is_verified", False)),
        "requires_password_change": bool(current.get("requires_password_change", False)),
        "firm_id": firm_id,
        "country": current.get("country"),
        "specialty": current.get("specialty"),
        "phone": current.get("phone"),
        "bar_number": current.get("bar_number"),
        "firm_name": current.get("firm_name"),
        "id_document": current.get("id_document"),
        "organizationId": current.get("organizationId"),
    }


@router.post("/register", response_model=dict, status_code=status.HTTP_201_CREATED)
@rate_limit(max_requests=3, window_seconds=60)  # 3 registration attempts per minute per IP
async def register(request: Request, user_data: UserCreate, db: AsyncIOMotorDatabase = Depends(get_db)):
    # FIX: Use SecureRepository instead of direct db access
    user_repo = UserRepository(db.users)

    # Check if user exists
    existing_user = await user_repo.find_by_email(
        firm_id="",
        email=user_data.email,
        request_id="register"
    )
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

    result_id = await user_repo.insert_one(
        collection_name="users",
        document=user_dict,
        user={},
        resource_type="user",
        db=db
    )
    user_dict["_id"] = result_id

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

    # [BLOCK 1] Create JWT with firm_id and user_id for multi-tenant isolation
    access_token = create_access_token(data={
        "sub": user_data.email,
        "role": user_data.role,
        "user_id": str(result_id),
        "firm_id": user_dict.get("firm_id")  # Required for tenant isolation
    })
    
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
@rate_limit(max_requests=5, window_seconds=60)  # 5 login attempts per minute per IP
async def login(request: Request, credentials: UserLogin, db: AsyncIOMotorDatabase = Depends(get_db)):
    # FIX: Use SecureRepository instead of direct db access
    user_repo = UserRepository(db.users)
    user = await user_repo.find_by_email(
        firm_id="",
        email=credentials.email,
        request_id="login"
    )

    # Guarda: candidatos creados vía landing tienen password_hash=None hasta ser aprobados
    if not user or not user.get("password_hash"):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    if not verify_password(credentials.password, user["password_hash"]):
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

    # FIX: Si el usuario es firm_owner y no tiene firm_id, buscar la firma por owner_email
    firm_id = user.get("firm_id")
    if role == "firm_owner" and not firm_id:
        # FIX: Use SecureRepository instead of direct db access
        from repositories.firm_repository import FirmRepository
        firm_repo = FirmRepository(db.firms)
        firm = await firm_repo.find_by_owner_email(
            owner_email=user["email"],
            request_id="login"
        )
        if firm:
            firm_id = str(firm["_id"])
            # Actualizar el usuario con firm_id para futuros logins
            await user_repo.update_by_email(
                firm_id=firm.get("organization_id", ""),
                email=user["email"],
                updates={"firm_id": firm_id},
                request_id="login"
            )

    # [BLOCK 1] Create JWT with firm_id and user_id for multi-tenant isolation
    access_token = create_access_token(data={
        "sub": user["email"],
        "role": role,
        "user_id": str(user["_id"]),
        "firm_id": firm_id  # Required for tenant isolation; None indicates independent user
    })

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
            "firm_id": firm_id,
            "country": user.get("country"),
            "specialty": user.get("specialty"),
            "phone": user.get("phone"),
            "bar_number": user.get("bar_number"),
            "firm_name": user.get("firm_name"),
            "id_document": user.get("id_document")
        }
    }

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

    # FIX: Use SecureRepository instead of direct db access
    user_repo = UserRepository(db.users)
    await user_repo.update_by_id(
        firm_id=current_user.get("firm_id", ""),
        user_id=current_user["_id"],
        update_data={
            "password_hash": password_hash,
            "requires_password_change": False,
            "updated_at": datetime.utcnow()
        },
        request_id="change-password"
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
