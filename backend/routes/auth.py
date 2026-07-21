from fastapi import APIRouter, HTTPException, Depends, Header, status
from typing import List, Optional
from datetime import datetime
import logging
from motor.motor_asyncio import AsyncIOMotorDatabase
from models.user import UserCreate, User, UserLogin, UserResponse
from utils.auth import get_password_hash, verify_password, create_access_token, decode_token
from utils import notifier
from bson import ObjectId

logger = logging.getLogger(__name__)

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
    # Tenant estable para el scoping de datos (cases/clients exigen organization_id):
    # organización explícita, o la firma, o el id propio (tenant personal).
    # Mismo criterio que ya inyecta el token; no cambia orgs ya asignadas.
    if not user.get("organization_id"):
        user["organization_id"] = user.get("firm_id") or str(user.get("_id"))
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
    """Registro público de usuario con activación oficial
    
    FLUJO OFICIAL DE ACTIVACIÓN:
    1. Para roles admin: activación inmediata (sin contraseña temporal)
    2. Para abogados/firmas: contraseña temporal + email de bienvenida + estado PENDING_VERIFICATION
    3. Alerta a admin para aprobación manual
    """
    from services.activation_service import ActivationService
    
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este correo ya está registrado"
        )
    
    # Auto-verified solo para roles administrativos
    if user_data.role in ["admin", "admin_general", "socio_comercial"]:
        # FLUJO ADMIN: activación inmediata sin contraseña temporal
        user_dict = user_data.model_dump(exclude={"password"})
        user_dict["password_hash"] = get_password_hash(user_data.password)
        user_dict["created_at"] = datetime.utcnow()
        user_dict["updated_at"] = datetime.utcnow()
        user_dict["status"] = "ACTIVE"
        user_dict["is_verified"] = True
        user_dict["requires_password_change"] = False
        user_dict["ready_for_onboarding"] = True
        
        result = await db.users.insert_one(user_dict)
        user_dict["_id"] = str(result.inserted_id)
        
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
    else:
        # FLUJO ACTIVACIÓN OFICIAL: crear usuario con contraseña temporal
        activation_data = await ActivationService.create_user_with_temp_password(
            db=db,
            email=user_data.email,
            full_name=user_data.full_name,
            role=user_data.role,
            phone=user_data.phone,
            country=user_data.country,
            specialty=user_data.specialty,
            bar_number=user_data.bar_number,
            firm_name=user_data.firm_name,
            id_document=user_data.id_document
        )
        
        user_id = activation_data["user_id"]
        temp_password = activation_data["temp_password"]
        expires_at = activation_data["expires_at"]
        
        # Alerta al administrador: nuevo usuario registrado (evento crítico).
        try:
            await notifier.create_app_notification(
                db, target="admin", type="new_user",
                title="Nuevo usuario registrado",
                message=f"{user_data.full_name} ({user_data.email}) se registró como {user_data.role}. Requiere aprobación manual.",
            )
        except Exception:
            pass
        
        # Integrar con CRM - Marcar cuenta como creada
        try:
            from services.crm_integration_service import CRMIntegrationService
            
            # Buscar lead asociado al email
            lead = await CRMIntegrationService.find_lead_by_email(
                db=db,
                email=user_data.email
            )
            
            if lead:
                lead_id = str(lead["_id"])
                
                # Actualizar estado del lead
                await CRMIntegrationService.update_lead_status(
                    db=db,
                    email=user_data.email,
                    status="ACCOUNT_CREATED",
                    metadata={
                        "user_id": user_id,
                        "role": user_data.role,
                        "created_at": datetime.utcnow().isoformat()
                    }
                )
                
                # Crear timeline event
                await CRMIntegrationService.create_timeline_event(
                    db=db,
                    event_type="ACCOUNT_CREATED",
                    description=f"Cuenta creada para: {user_data.full_name} ({user_data.email})",
                    lead_id=lead_id,
                    metadata={
                        "user_id": user_id,
                        "email": user_data.email,
                        "role": user_data.role
                    }
                )
        except Exception as e:
            # No fallar si la integración CRM falla
            pass

        # Enviar correo de bienvenida con credenciales temporales
        try:
            email_result = await ActivationService.send_welcome_email(
                email=user_data.email,
                full_name=user_data.full_name,
                temp_password=temp_password,
                expires_at=expires_at,
                firm_name=user_data.firm_name
            )
            email_sent = email_result.get("sent", False)
            email_trace = email_result.get("email_trace_id", "unknown")
        except Exception as e:
            email_sent = False
            email_trace = "error"
        
        # NO crear access token - usuario debe esperar aprobación y cambiar contraseña
        return {
            "success": True,
            "message": "Cuenta creada exitosamente. Revisa tu correo para las credenciales de acceso.",
            "user": {
                "id": user_id,
                "email": user_data.email,
                "full_name": user_data.full_name,
                "role": user_data.role,
                "status": "PENDING_VERIFICATION",
                "is_verified": False,
                "requires_password_change": True
            },
            "activation": {
                "email_sent": email_sent,
                "email_trace_id": email_trace,
                "expires_at": expires_at.isoformat(),
                "note": "Contraseña temporal enviada por email. Válida por 72 horas."
            }
        }

@router.post("/login", response_model=dict)
async def login(credentials: UserLogin, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Login con soporte para flujo de activación oficial
    
    FLUJO:
    1. Verifica credenciales
    2. Si requires_password_change=True → permite login pero marca para cambio
    3. Si status=PENDING_VERIFICATION → permite login con contraseña temporal
    4. Retorna token JWT + metadata de activación
    """
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
    
    # FLUJO DE ACTIVACIÓN: permitir login si:
    # - status es PENDING_VERIFICATION (esperando aprobación)
    # - requires_password_change es True (debe cambiar contraseña temporal)
    # - status es ACTIVE (cuenta activada)
    user_status = user.get("status", "PENDING_VERIFICATION")
    if user_status not in ["PENDING_VERIFICATION", "ACTIVE", "ACTIVACION_EXPIRADA", "REACTIVACION"]:
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

    # Integrar con CRM - Registrar primer login
    try:
        from services.crm_integration_service import CRMIntegrationService
        
        # Buscar lead asociado al email
        lead = await CRMIntegrationService.find_lead_by_email(
            db=db,
            email=user["email"]
        )
        
        if lead:
            lead_id = str(lead["_id"])
            
            # Crear timeline event de primer login
            await CRMIntegrationService.create_timeline_event(
                db=db,
                event_type="FIRST_LOGIN",
                description=f"Primer acceso realizado por: {user.get('full_name')} ({user.get('email')})",
                lead_id=lead_id,
                metadata={
                    "user_id": str(user["_id"]),
                    "email": user["email"],
                    "role": role
                }
            )
    except Exception as e:
        # No fallar si la integración CRM falla
        pass

    # Metadata de activación para el frontend
    requires_password_change = bool(user.get("requires_password_change", False))
    ready_for_onboarding = bool(user.get("ready_for_onboarding", False))
    
    # Determinar next_step
    next_step = None
    if requires_password_change:
        next_step = "change_password"
    elif ready_for_onboarding and not user.get("onboarding_completed"):
        next_step = "activation_wizard"
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(user["_id"]),
            "email": user["email"],
            "full_name": user["full_name"],
            "role": role,
            "status": user_status,
            "is_verified": is_verified,
            "requires_password_change": requires_password_change,
            "ready_for_onboarding": ready_for_onboarding,
            "firm_id": user.get("firm_id"),
            "country": user.get("country"),
            "specialty": user.get("specialty"),
            "phone": user.get("phone"),
            "bar_number": user.get("bar_number"),
            "firm_name": user.get("firm_name"),
            "id_document": user.get("id_document")
        },
        "activation": {
            "requires_password_change": requires_password_change,
            "next_step": next_step,
            "note": "Debes cambiar tu contraseña temporal" if requires_password_change else None
        }
    }

@router.post("/change-password-first-login", response_model=dict, status_code=status.HTTP_200_OK)
async def change_password_first_login(
    payload: dict,
    current_user = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Cambiar contraseña en primer login (flujo oficial de activación)

    FLUJO OFICIAL:
    1. Usuario se registra → recibe email con contraseña temporal
    2. Usuario hace login con contraseña temporal → requiere cambio
    3. Usuario cambia contraseña → queda listo para onboarding
    4. Usuario completa onboarding → cuenta activada completamente

    Validaciones:
    1. Usuario debe tener requires_password_change = True
    2. Nueva contraseña debe ser diferente a la actual
    3. Nueva contraseña debe cumplir requisitos de seguridad

    Después del cambio:
    - Marca requires_password_change = False
    - Marca ready_for_onboarding = True
    - Usuario es redirigido al Asistente de Activación
    """
    from utils.auth import verify_password, get_password_hash
    from services.activation_service import ActivationService

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

    # Marcar usuario como listo para onboarding
    await db.users.update_one(
        {"_id": ObjectId(current_user["_id"])},
        {"$set": {
            "ready_for_onboarding": True,
            "updated_at": datetime.utcnow()
        }}
    )

    # Integrar con CRM - Registrar cambio de contraseña
    try:
        from services.crm_integration_service import CRMIntegrationService
        
        # Buscar lead asociado al email
        lead = await CRMIntegrationService.find_lead_by_email(
            db=db,
            email=current_user["email"]
        )
        
        if lead:
            lead_id = str(lead["_id"])
            
            # Actualizar estado del lead
            await CRMIntegrationService.update_lead_status(
                db=db,
                email=current_user["email"],
                status="PASSWORD_CHANGED",
                metadata={
                    "user_id": str(current_user["_id"]),
                    "changed_at": datetime.utcnow().isoformat()
                }
            )
            
            # Crear timeline event
            await CRMIntegrationService.create_timeline_event(
                db=db,
                event_type="PASSWORD_CHANGED",
                description=f"Contraseña temporal cambiada por: {current_user.get('full_name')} ({current_user.get('email')})",
                lead_id=lead_id,
                metadata={
                    "user_id": str(current_user["_id"]),
                    "email": current_user["email"]
                }
            )
    except Exception as e:
        # No fallar si la integración CRM falla
        pass

    # Log de activación
    logger.info(
        f"[ACTIVATION] Contraseña cambiada | user_id={current_user['_id']} | email={current_user['email']} | listo_para_onboarding=True"
    )

    return {
        "success": True,
        "message": "Contraseña actualizada exitosamente. Inicia el Asistente de Activación.",
        "user": {
            "id": str(current_user["_id"]),
            "email": current_user["email"],
            "requires_password_change": False,
            "ready_for_onboarding": True,
            "next_step": "activation_wizard"
        }
    }


# POST /auth/resend-activation - Reenviar correo de activación (admin only)
@router.post("/resend-activation", response_model=dict, status_code=status.HTTP_200_OK)
async def resend_activation(
    payload: dict,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Reenviar correo de activación con nuevas credenciales (solo admin)
    
    FLUJO OFICIAL:
    1. Verifica que el usuario esté en PENDING_VERIFICATION o ACTIVACION_EXPIRADA
    2. Genera nueva contraseña temporal (72h)
    3. Actualiza usuario con nuevas credenciales
    4. Envía correo de reenvío
    5. Retorna confirmación con trace_id
    
    NO crea una nueva cuenta.
    """
    from services.activation_service import ActivationService
    
    # Validar que sea admin
    if current_user.get("role") not in ["admin", "admin_general"]:
        raise HTTPException(
            status_code=403,
            detail="Solo administradores pueden reenviar activaciones"
        )
    
    user_id = payload.get("user_id")
    if not user_id:
        raise HTTPException(
            status_code=400,
            detail="user_id es requerido"
        )
    
    try:
        # Reenviar activación usando el servicio oficial
        result = await ActivationService.resend_activation(db, user_id)
        
        logger.info(
            f"[RESEND_ACTIVATION] user_id={user_id} | email={result.get('email')} | "
            f"new_expires={result.get('expires_at').isoformat() if result.get('expires_at') else 'N/A'} | "
            f"email_sent={result.get('email_sent')} | trace_id={result.get('email_trace_id')}"
        )
        
        return {
            "success": True,
            "message": "Correo de activación reenviado exitosamente",
            "data": result
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"[RESEND_ACTIVATION] Error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error al reenviar activación: {str(e)}"
        )
