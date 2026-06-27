from fastapi import APIRouter, HTTPException, Depends, status
from fastapi import APIRouter, HTTPException, Depends, status
from typing import List, Optional
from datetime import datetime, timedelta
import secrets
from motor.motor_asyncio import AsyncIOMotorDatabase
from models.firm import Firm, FirmCreate, FirmUpdate, FirmResponse, FirmRejectRequest
from models.user import UserActivateAccount
from routes.auth import get_current_user
from bson import ObjectId

router = APIRouter(prefix="/firms", tags=["Firm OS"])

async def get_db():
    from server import db
    return db

# POST /firms/register - Registro público de firmas (nuevo flujo: aprobación manual)
@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register_firm(
    firm_data: FirmCreate,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Registro público de solicitud de firma (sin autenticación requerida)

    NUEVO FLUJO (Manual Approval):
    1. Valida que no existan duplicados (email, NIT)
    2. Crea firma en colección 'firms' con estado PENDING_APPROVAL
    3. NO crea firm_owner (se crea en aprobación)
    4. NO envía email (aprobación manual desde Admin OS)
    5. NO activa trial (se activa en aprobación)
    6. Devuelve mensaje simple de confirmación
    """
    import logging
    logger = logging.getLogger(__name__)

    # VALIDACIONES
    # Verificar NIT duplicado
    existing_firm_nit = await db.firms.find_one({"nit": firm_data.nit})
    if existing_firm_nit:
        raise HTTPException(status_code=400, detail="Ya existe una firma registrada con este NIT")

    # Verificar email duplicado (firma)
    existing_firm_email = await db.firms.find_one({"email": firm_data.email})
    if existing_firm_email:
        raise HTTPException(status_code=400, detail="Ya existe una firma registrada con este correo")

    # NUEVO FLUJO: NO verificar si el usuario ya existe (puede haber usuario sin firma)
    # Será verificado al aprobar

    # PASO 1: Crear solicitud de firma en estado PENDING_APPROVAL (SIN firm_owner, SIN trial activo)
    now = datetime.utcnow()

    firm_doc = {
        "name": firm_data.name,
        "nit": firm_data.nit,
        "email": firm_data.email,
        "phone": firm_data.phone,
        "address": firm_data.address,
        "city": firm_data.city,
        "country": firm_data.country or "Colombia",
        "plan": firm_data.plan,
        "max_lawyers": 5 if firm_data.plan == "firm_growth" else 10,
        "active_lawyers_count": 0,
        "owner_id": None,  # Se asignará en aprobación
        "owner_name": firm_data.founder_name,
        "owner_email": firm_data.founder_email,
        "status": "PENDING_APPROVAL",  # NUEVO: Espera aprobación manual
        "approval_status": "pending",
        "approval_date": None,
        "approved_by": None,
        "rejection_reason": None,
        "is_verified": False,
        # Trial INACTIVO hasta aprobación
        "trial_status": "inactive",
        "trial_started_at": None,
        "trial_ends_at": None,
        "subscription_status": None,
        "subscription_plan": None,
        "created_at": now,
        "updated_at": now,
    }

    firm_result = await db.firms.insert_one(firm_doc)
    firm_id = str(firm_result.inserted_id)

    # Logging simple
    logger.info("[REGISTER_FIRM_NEW_FLOW] firm_id=%s | email=%s | status=PENDING_APPROVAL | requiere_aprobación_manual=true",
                firm_id, firm_data.founder_email)

    # PASO 2: Respuesta simple al cliente (sin sesión, sin redireccionamiento)
    from fastapi.responses import JSONResponse

    return JSONResponse(
        content={
            "success": True,
            "message": "Gracias. Hemos recibido tu solicitud. Nuestro equipo revisará la información y se comunicará contigo.",
            "firm_id": firm_id,
            "status": "PENDING_APPROVAL"
        },
        status_code=201
    )


# POST /firms/register-lead - Registro simplificado de firma (SPRINT UX - Flujo de mínimos datos)
@router.post("/register-lead", status_code=status.HTTP_201_CREATED)
async def register_firm_lead(
    payload: dict,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    SPRINT UX: Registro simplificado de firma desde landing page.

    DIFERENCIAS vs /register:
    - Solicita SOLO: nombre firma, contacto, email, WhatsApp, país, tamaño
    - NO solicita: NIT, dirección, documento, tarjeta profesional, etc.
    - Crea LEAD (lead en CRM), no firma completa
    - Guarda metadata automáticamente detectada
    - Dispara notificación en Admin OS
    - NO crea usuario ni suscripción todavía

    La firma se completa después en onboarding.
    """
    from utils import notifier
    from bson import ObjectId
    import json

    try:
        # Extraer datos requeridos
        firm_name = payload.get('name', '').strip()
        contact_name = payload.get('contact_name', '').strip()
        contact_email = payload.get('email', '').strip()
        contact_phone = payload.get('phone', '').strip()
        contact_country = payload.get('country', 'Colombia').strip()
        firm_size = payload.get('firm_size', 'solo')
        metadata = payload.get('metadata', {})

        # Validaciones básicas
        if not firm_name:
            raise HTTPException(status_code=400, detail="Nombre de firma requerido")
        if not contact_name:
            raise HTTPException(status_code=400, detail="Nombre de contacto requerido")
        if not contact_email:
            raise HTTPException(status_code=400, detail="Email corporativo requerido")
        if not contact_phone:
            raise HTTPException(status_code=400, detail="WhatsApp requerido")

        # Verificar email duplicado en leads (no firma completa)
        existing_lead = await db.leads.find_one({
            "source": "landing_firm_registration",
            "contact_email": contact_email
        })
        if existing_lead:
            raise HTTPException(status_code=409, detail="Este correo ya fue registrado como firma")

        now = datetime.utcnow()

        # PASO 1: Crear LEAD en CRM (no firma completa)
        lead_doc = {
            "source": "landing_firm_registration",
            "lead_type": "firm",
            "firm_name": firm_name,
            "contact_name": contact_name,
            "contact_email": contact_email,
            "contact_phone": contact_phone,
            "contact_country": contact_country,
            "firm_size": firm_size,

            # Metadata detectada automáticamente
            "metadata": {
                **metadata,
                "detected_at": now.isoformat(),
            },

            # Estado del lead
            "status": "new",  # new | contacted | qualified | rejected
            "assigned_to": None,
            "qualified": False,
            "rejected": False,
            "rejection_reason": None,

            # Timestamps
            "created_at": now,
            "updated_at": now,
            "contacted_at": None,
            "qualified_at": None,
        }

        lead_result = await db.leads.insert_one(lead_doc)
        lead_id = str(lead_result.inserted_id)

        # PASO 2: Notificar al administrador
        await notifier.create_app_notification(
            db,
            target="admin",
            type="new_firm_lead",
            title=f"Nueva firma registrada: {firm_name}",
            message=f"{contact_name} ({contact_email}) · {contact_country} · {firm_size} abogados",
            metadata={"lead_id": lead_id, "contact_email": contact_email},
        )

        # PASO 3: Enviar correo de bienvenida al contacto
        try:
            await notifier.send_email(
                contact_email,
                subject="Bienvenido a Punto Cero Legal",
                body=f"""
                Hola {contact_name},

                ¡Gracias por registrar tu firma en Punto Cero Legal!

                Tu espacio está casi listo. En los próximos pasos te pediremos:
                - Logo y descripción de tu firma
                - Áreas de práctica
                - Invitar a tus abogados

                Un especialista de nuestro equipo se pondrá en contacto contigo pronto por WhatsApp
                para ayudarte en el proceso.

                Saludos,
                Punto Cero Legal
                """
            )
        except Exception as e:
            # No fallar si el email falla
            pass

        return {
            "ok": True,
            "lead_id": lead_id,
            "message": "Firma registrada exitosamente. Un especialista se contactará pronto.",
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al registrar firma: {str(e)}")


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
            trial_status=firm.get("trial_status"),
            trial_started_at=firm.get("trial_started_at").isoformat() if isinstance(firm.get("trial_started_at"), datetime) else firm.get("trial_started_at"),
            trial_ends_at=firm.get("trial_ends_at").isoformat() if isinstance(firm.get("trial_ends_at"), datetime) else firm.get("trial_ends_at"),
            subscription_status=firm.get("subscription_status"),
            subscription_plan=firm.get("subscription_plan"),
            created_at=firm["created_at"].isoformat() if isinstance(firm["created_at"], datetime) else firm["created_at"],
            updated_at=firm["updated_at"].isoformat() if isinstance(firm["updated_at"], datetime) else firm["updated_at"]
        )
        for firm in firms
    ]

# POST /firms - Crear nueva firma (sin requerir abogado previo)
@router.post("/", response_model=FirmResponse, status_code=status.HTTP_201_CREATED)
async def create_firm(
    firm_data: FirmCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Crear nueva firma y generar automáticamente usuario firm_owner (solo admin)

    FLUJO:
    1. Crea la firma
    2. Crea automáticamente un usuario firm_owner con los datos del socio fundador
    3. Asocia el firm_owner a la firma
    """
    if current_user.get("role") not in ["admin", "admin_general"]:
        raise HTTPException(status_code=403, detail="Solo administradores pueden crear firmas")

    # Verificar que no exista firma con mismo email
    existing_firm = await db.firms.find_one({"email": firm_data.email})
    if existing_firm:
        raise HTTPException(status_code=400, detail="Ya existe una firma con este email")

    # Verificar que no exista usuario con el email del socio fundador
    existing_user = await db.users.find_one({"email": firm_data.founder_email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Ya existe un usuario con el email del socio fundador")

    # PASO 1: Crear la firma (sin owner_id todavía)
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
        "owner_id": None,  # Se asignará después de crear el usuario
        "owner_name": firm_data.founder_name,
        "owner_email": firm_data.founder_email,
        "status": "active",
        "is_verified": False,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }

    firm_result = await db.firms.insert_one(firm_doc)
    firm_id = str(firm_result.inserted_id)

    # PASO 2: Crear automáticamente el usuario firm_owner
    from utils.auth import get_password_hash

    # Generar una contraseña temporal aleatoria
    temp_password = secrets.token_urlsafe(12)

    user_doc = {
        "email": firm_data.founder_email,
        "full_name": firm_data.founder_name,
        "password_hash": get_password_hash(temp_password),
        "phone": firm_data.founder_phone,
        "bar_number": firm_data.founder_bar_number,
        "role": "firm_owner",
        "firm_id": firm_id,
        "status": "ACTIVE",
        "is_verified": True,
        "country": "Colombia",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }

    user_result = await db.users.insert_one(user_doc)
    owner_id = str(user_result.inserted_id)

    # PASO 3: Actualizar la firma con el owner_id del nuevo usuario
    await db.firms.update_one(
        {"_id": ObjectId(firm_id)},
        {"$set": {
            "owner_id": owner_id,
            "updated_at": datetime.utcnow()
        }}
    )

    # PASO 4: Registrar credenciales de acceso inicial (opcional: almacenar para enviar por email)
    # Esto podría usarse para enviar credenciales iniciales al propietario
    initial_credentials = {
        "firm_owner_id": owner_id,
        "email": firm_data.founder_email,
        "temp_password": temp_password,
        "firm_id": firm_id,
        "created_at": datetime.utcnow(),
    }

    return FirmResponse(
        id=firm_id,
        name=firm_doc["name"],
        email=firm_doc["email"],
        plan=firm_doc["plan"],
        max_lawyers=firm_doc["max_lawyers"],
        active_lawyers_count=0,
        owner_name=firm_data.founder_name,
        owner_email=firm_data.founder_email,
        status=firm_doc["status"],
        is_verified=False,
        trial_status=firm_doc.get("trial_status"),
        trial_started_at=firm_doc.get("trial_started_at").isoformat() if firm_doc.get("trial_started_at") else None,
        trial_ends_at=firm_doc.get("trial_ends_at").isoformat() if firm_doc.get("trial_ends_at") else None,
        subscription_status=firm_doc.get("subscription_status"),
        subscription_plan=firm_doc.get("subscription_plan"),
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
        trial_status=firm.get("trial_status"),
        trial_started_at=firm.get("trial_started_at").isoformat() if isinstance(firm.get("trial_started_at"), datetime) else firm.get("trial_started_at"),
        trial_ends_at=firm.get("trial_ends_at").isoformat() if isinstance(firm.get("trial_ends_at"), datetime) else firm.get("trial_ends_at"),
        subscription_status=firm.get("subscription_status"),
        subscription_plan=firm.get("subscription_plan"),
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
        trial_status=updated_firm.get("trial_status"),
        trial_started_at=updated_firm.get("trial_started_at").isoformat() if isinstance(updated_firm.get("trial_started_at"), datetime) else updated_firm.get("trial_started_at"),
        trial_ends_at=updated_firm.get("trial_ends_at").isoformat() if isinstance(updated_firm.get("trial_ends_at"), datetime) else updated_firm.get("trial_ends_at"),
        subscription_status=updated_firm.get("subscription_status"),
        subscription_plan=updated_firm.get("subscription_plan"),
        created_at=updated_firm["created_at"].isoformat() if isinstance(updated_firm["created_at"], datetime) else updated_firm["created_at"],
        updated_at=updated_firm["updated_at"].isoformat() if isinstance(updated_firm["updated_at"], datetime) else updated_firm["updated_at"]
    )

# POST /firms/:id/approve - Aprobar firma (admin only)
@router.post("/{firm_id}/approve", status_code=status.HTTP_200_OK)
async def approve_firm(
    firm_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """PHASE 2: Aprobar firma y crear firm_owner con contraseña temporal (solo admin)

    NUEVO FLUJO (Manual Approval):
    1. Verifica que sea admin
    2. Busca firma en PENDING_APPROVAL
    3. Crea firm_owner si no existe
    4. Genera contraseña temporal segura
    5. Activa la firma (status=ACTIVE)
    6. Activa el trial (7 días desde aprobación)
    7. Intenta enviar email (no bloquea si falla)
    8. Devuelve credenciales para que admin las entregue manualmente
    """
    from utils.auth import get_password_hash
    from utils.notifier import send_email
    import logging
    logger = logging.getLogger(__name__)

    if current_user.get("role") not in ["admin", "admin_general"]:
        raise HTTPException(status_code=403, detail="Solo administradores pueden aprobar firmas")

    try:
        oid = ObjectId(firm_id)
    except:
        raise HTTPException(status_code=400, detail="ID de firma inválido")

    firm = await db.firms.find_one({"_id": oid})
    if not firm:
        raise HTTPException(status_code=404, detail="Firma no encontrada")

    # Verificar que esté en PENDING_APPROVAL
    if firm.get("status") != "PENDING_APPROVAL":
        raise HTTPException(status_code=400, detail=f"Firma no está en estado PENDING_APPROVAL (estado actual: {firm.get('status')})")

    # PASO 1: Crear firm_owner si no existe
    existing_owner = await db.users.find_one({"email": firm.get("owner_email"), "role": "firm_owner"})
    temp_password_for_display = None

    if existing_owner:
        owner_id = str(existing_owner["_id"])
        # Actualizar owner_id en firma si estaba None
        if not firm.get("owner_id"):
            await db.firms.update_one(
                {"_id": oid},
                {"$set": {"owner_id": owner_id}}
            )
    else:
        # Generar contraseña temporal segura (16 caracteres)
        temp_password = secrets.token_urlsafe(16)
        password_hash = get_password_hash(temp_password)

        owner_doc = {
            "email": firm.get("owner_email"),
            "full_name": firm.get("owner_name"),
            "password_hash": password_hash,
            "phone": firm.get("phone"),
            "role": "firm_owner",
            "firm_id": firm_id,
            "status": "ACTIVE",
            "is_verified": True,
            "requires_password_change": True,  # Forzar cambio en primer login
            "country": firm.get("country", "Colombia"),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }

        owner_result = await db.users.insert_one(owner_doc)
        owner_id = str(owner_result.inserted_id)
        temp_password_for_display = temp_password

        # Actualizar firma con owner_id
        await db.firms.update_one(
            {"_id": oid},
            {"$set": {"owner_id": owner_id}}
        )

    # PASO 2: Activar firma y trial
    now = datetime.utcnow()
    trial_ends = now + timedelta(days=7)

    await db.firms.update_one(
        {"_id": oid},
        {"$set": {
            "status": "ACTIVE",
            "approval_status": "approved",
            "approval_date": now,
            "approved_by": str(current_user.get("_id")),
            "trial_status": "active",
            "trial_started_at": now,
            "trial_ends_at": trial_ends,
            "subscription_status": "trial",
            "subscription_plan": "trial",
            "updated_at": now
        }}
    )

    # PASO 3: Intentar enviar email (pero no bloquear si falla)
    email_html = f"""
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background: #f5f5f5; }}
            .container {{ max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
            .header {{ text-align: center; margin-bottom: 30px; }}
            .logo {{ color: #f97316; font-size: 28px; font-weight: bold; }}
            .title {{ color: #1f2937; font-size: 24px; font-weight: bold; margin: 20px 0; }}
            .section {{ margin: 20px 0; padding: 15px; background: #ecfdf5; border-left: 4px solid #10b981; }}
            .credentials {{ background: #f3f4f6; padding: 15px; border-radius: 6px; font-family: monospace; }}
            .footer {{ color: #9ca3af; font-size: 12px; text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">PUNTO CERO</div>
            </div>

            <div class="title">¡Tu Firma Fue Aprobada!</div>
            <p>Hola <strong>{firm.get('owner_name')}</strong>,</p>

            <p>Nos complace informarte que tu firma <strong>{firm.get('name')}</strong> ha sido aprobada por nuestro equipo y ya puedes acceder a Punto Cero Legal.</p>

            <div class="section">
                <p><strong>✓ Firma Activada</strong></p>
                <p>Plan: {firm.get('plan', 'firm_growth')}</p>
                <p>Trial: 7 días</p>
            </div>

            <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
                Tus credenciales de acceso se te han proporcionado por separado.<br>
                Al ingresar por primera vez, deberás cambiar tu contraseña.
            </p>

            <div class="footer">
                <p>Punto Cero Legal © 2025 — Todos los derechos reservados</p>
                <p>¿Preguntas? Escribe a <strong>soporte@puntocerolegal.com</strong></p>
            </div>
        </div>
    </body>
    </html>
    """

    # Intentar envío sin bloquear
    try:
        email_result = send_email(
            to_email=firm.get("owner_email"),
            subject=f"¡Bienvenido a Punto Cero Legal! {firm.get('name')}",
            body_html=email_html
        )
        email_sent = email_result.get("sent", False)
        email_trace = email_result.get("email_trace_id", "unknown")
    except Exception as e:
        logger.warning(f"[APPROVE_FIRM] Email send failed: {str(e)}")
        email_sent = False
        email_trace = "error"

    # PASO 4: Preparar respuesta con credenciales para el administrador
    logger.info(f"[APPROVE_FIRM] firm_id={firm_id} | owner_id={owner_id} | email_sent={email_sent} | email_trace={email_trace}")

    return {
        "success": True,
        "message": f"Firma {firm.get('name')} aprobada exitosamente.",
        "firm_id": firm_id,
        "owner_id": owner_id,
        "credentials": {
            "email": firm.get("owner_email"),
            "temp_password": temp_password_for_display,
            "note": "Contraseña temporal válida para primer acceso. Usuario debe cambiarla al ingresar." if temp_password_for_display else "Propietario ya tiene acceso configurado."
        },
        "trial": {
            "status": "active",
            "days": 7,
            "started_at": now.isoformat(),
            "ends_at": trial_ends.isoformat()
        },
        "email_notification": {
            "sent": email_sent,
            "trace_id": email_trace,
            "note": "Email de bienvenida enviado (si SMTP está disponible). Admin debe comunicar credenciales manualmente."
        }
    }

# POST /firms/:id/reject - Rechazar firma con auditoría completa (admin only)
@router.post("/{firm_id}/reject", status_code=status.HTTP_200_OK)
async def reject_firm(
    firm_id: str,
    rejection_request: FirmRejectRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """PHASE 3: Rechazar firma con registro de auditoría (solo admin)

    FLUJO:
    1. Verifica que sea admin
    2. Busca firma (debe estar en PENDING_APPROVAL)
    3. Registra rechazo en DB con auditoría completa
    4. Intenta enviar correo de notificación (no bloquea si falla)
    5. Devuelve confirmación con detalles de auditoría
    """
    from utils.notifier import send_email
    import logging
    logger = logging.getLogger(__name__)

    if current_user.get("role") not in ["admin", "admin_general"]:
        raise HTTPException(status_code=403, detail="Solo administradores pueden rechazar firmas")

    try:
        oid = ObjectId(firm_id)
    except:
        raise HTTPException(status_code=400, detail="ID de firma inválido")

    firm = await db.firms.find_one({"_id": oid})
    if not firm:
        raise HTTPException(status_code=404, detail="Firma no encontrada")

    rejection_reason = rejection_request.reason
    now = datetime.utcnow()

    # Validar que esté en PENDING_APPROVAL (mejor práctica: solo rechazar solicitudes pendientes)
    current_status = firm.get("status", "unknown")
    if current_status not in ["PENDING_APPROVAL", "REJECTED"]:
        logger.warning(f"[REJECT_FIRM] Intento de rechazar firma en estado {current_status} | firm_id={firm_id} | rejected_by={str(current_user.get('_id'))}")
        raise HTTPException(
            status_code=400,
            detail=f"Firma no puede ser rechazada desde estado '{current_status}'. Solo se pueden rechazar firmas en PENDING_APPROVAL."
        )

    # PASO 1: Actualizar firma con rechazo (auditoría completa)
    rejection_doc = {
        "status": "REJECTED",
        "approval_status": "rejected",
        "rejection_reason": rejection_reason,
        "rejected_by": str(current_user.get("_id")),
        "rejected_at": now,
        "updated_at": now
    }

    # Si la firma tenía un owner_id, mantener la referencia pero desactivar el usuario
    if firm.get("owner_id"):
        await db.users.update_one(
            {"_id": ObjectId(firm.get("owner_id"))},
            {"$set": {
                "status": "REJECTED",
                "updated_at": now
            }}
        )

    await db.firms.update_one(
        {"_id": oid},
        {"$set": rejection_doc}
    )

    # Logging de auditoría
    logger.info(f"[REJECT_FIRM] firm_id={firm_id} | firm_name={firm.get('name')} | rejected_by={str(current_user.get('_id'))} | reason={rejection_reason[:50]}...")

    # PASO 2: Intentar enviar correo de notificación (no bloquear si falla)
    email_html = f"""
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background: #f5f5f5; }}
            .container {{ max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
            .header {{ text-align: center; margin-bottom: 30px; }}
            .logo {{ color: #f97316; font-size: 28px; font-weight: bold; }}
            .title {{ color: #1f2937; font-size: 24px; font-weight: bold; margin: 20px 0; }}
            .section {{ margin: 20px 0; padding: 15px; background: #fef2f2; border-left: 4px solid #ef4444; }}
            .reason {{ background: #f3f4f6; padding: 12px; border-radius: 6px; margin: 10px 0; font-size: 14px; color: #374151; }}
            .footer {{ color: #9ca3af; font-size: 12px; text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">PUNTO CERO</div>
            </div>

            <div class="title">Revisión de Solicitud Completada</div>
            <p>Hola <strong>{firm.get('owner_name')}</strong>,</p>

            <p>Hemos revisado tu solicitud de registro para la firma <strong>{firm.get('name')}</strong>.</p>

            <div class="section">
                <p><strong>⚠️ Estatus: No Aprobado</strong></p>
                <div class="reason">
                    <strong>Motivo:</strong><br>
                    {rejection_reason}
                </div>
            </div>

            <p style="margin-top: 30px; color: #6b7280;">
                Si tienes dudas o deseas apelar esta decisión, por favor contacta a nuestro equipo de soporte en <strong>soporte@puntocerolegal.com</strong>
            </p>

            <div class="footer">
                <p>Punto Cero Legal © 2025 — Todos los derechos reservados</p>
                <p>Contáctanos: soporte@puntocerolegal.com | +57 1 XXXX-XXXX</p>
            </div>
        </div>
    </body>
    </html>
    """

    email_sent = False
    email_trace = "skipped"

    try:
        email_result = send_email(
            to_email=firm.get("owner_email"),
            subject=f"Resultado de Revisión - {firm.get('name')}",
            body_html=email_html
        )
        email_sent = email_result.get("sent", False)
        email_trace = email_result.get("email_trace_id", "unknown")
        logger.info(f"[REJECT_FIRM_EMAIL] email_sent={email_sent} | trace_id={email_trace} | recipient={firm.get('owner_email')}")
    except Exception as e:
        logger.warning(f"[REJECT_FIRM_EMAIL_FAILED] firm_id={firm_id} | error={str(e)[:100]}")
        email_trace = "email_failed"

    # PASO 3: Respuesta al admin con detalles de auditoría
    return {
        "success": True,
        "message": f"Firma '{firm.get('name')}' rechazada exitosamente.",
        "firm_id": firm_id,
        "firm_name": firm.get("name"),
        "rejection": {
            "reason": rejection_reason,
            "rejected_by_admin": str(current_user.get("_id")),
            "rejected_at": now.isoformat(),
            "audit_record": {
                "firm_status_before": current_status,
                "firm_status_after": "REJECTED",
                "owner_id": firm.get("owner_id"),
                "owner_status_after": "REJECTED" if firm.get("owner_id") else None
            }
        },
        "email_notification": {
            "sent": email_sent,
            "trace_id": email_trace,
            "recipient": firm.get("owner_email"),
            "note": "Notificación enviada al propietario de la firma (si SMTP disponible)"
        }
    }

# POST /firms/activate-account - Activar cuenta de firm_owner (sin autenticación - usa token)
@router.post("/activate-account", status_code=status.HTTP_200_OK)
async def activate_firm_account(
    activation_data: UserActivateAccount,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Activar cuenta de firm_owner usando token de activación"""
    from utils.auth import get_password_hash

    token = activation_data.token
    password = activation_data.password

    if not token or not password:
        raise HTTPException(status_code=400, detail="Token y contraseña requeridos")

    # PASO 1: Buscar usuario por token
    user = await db.users.find_one({"activation_token": token})
    if not user:
        raise HTTPException(status_code=404, detail="Token inválido o no encontrado")

    # PASO 2: Validar expiración
    if user.get("activation_expires_at"):
        expires_at = user["activation_expires_at"]
        if isinstance(expires_at, str):
            expires_at = datetime.fromisoformat(expires_at)
        if datetime.utcnow() > expires_at:
            raise HTTPException(status_code=410, detail="Token expirado")

    # PASO 3: Hash contraseña
    password_hash = get_password_hash(password)

    # PASO 4: Actualizar usuario
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {
            "password_hash": password_hash,
            "status": "ACTIVE",
            "is_verified": True,
            "activation_token": None,
            "activation_expires_at": None,
            "activated_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }}
    )

    # PASO 5: Actualizar firma a ACTIVE
    if user.get("firm_id"):
        await db.firms.update_one(
            {"_id": ObjectId(user["firm_id"])},
            {"$set": {
                "status": "ACTIVE",
                "is_verified": True,
                "updated_at": datetime.utcnow()
            }}
        )

    return {
        "success": True,
        "message": "Cuenta activada exitosamente. Inicia sesión para continuar.",
        "email": user.get("email")
    }

# GET /firms/status/pending - Listar firmas pendientes de aprobación (admin only)
@router.get("/status/pending", status_code=status.HTTP_200_OK)
async def get_pending_firms(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """PHASE 4: Listar firmas pendientes de aprobación con filtros y detalles completos"""
    if current_user.get("role") not in ["admin", "admin_general"]:
        raise HTTPException(status_code=403, detail="Solo administradores pueden ver firmas pendientes")

    firms = await db.firms.find({"status": "PENDING_APPROVAL"}).sort("created_at", -1).to_list(None)

    result = []
    for firm in firms:
        result.append({
            "id": str(firm["_id"]),
            "name": firm["name"],
            "nit": firm.get("nit", "N/A"),
            "email": firm["email"],
            "phone": firm.get("phone", ""),
            "address": firm.get("address", ""),
            "city": firm.get("city", ""),
            "country": firm.get("country", "Colombia"),
            "plan": firm["plan"],
            "owner_name": firm["owner_name"],
            "owner_email": firm["owner_email"],
            "created_at": firm["created_at"].isoformat() if isinstance(firm["created_at"], datetime) else firm["created_at"],
            "updated_at": firm.get("updated_at", firm["created_at"]).isoformat() if isinstance(firm.get("updated_at", firm["created_at"]), datetime) else firm.get("updated_at", firm["created_at"]),
            "status": firm["status"],
            "trial_status": firm.get("trial_status", "inactive"),
            "approval_status": firm.get("approval_status", "pending")
        })

    return {
        "success": True,
        "data": result,
        "count": len(result)
    }

# GET /firms/stats/summary - Estadísticas de firmas (admin only)
@router.get("/stats/summary", status_code=status.HTTP_200_OK)
async def get_firms_summary(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """PHASE 4: Obtener estadísticas completas de firmas para dashboard"""
    if current_user.get("role") not in ["admin", "admin_general"]:
        raise HTTPException(status_code=403, detail="Solo administradores pueden ver estadísticas")

    # Contar firmas por estado
    pending_count = await db.firms.count_documents({"status": "PENDING_APPROVAL"})
    approved_count = await db.firms.count_documents({"status": "ACTIVE"})
    rejected_count = await db.firms.count_documents({"status": "REJECTED"})
    total_count = await db.firms.count_documents({})

    # Contar trials activos
    trial_active_count = await db.firms.count_documents({
        "trial_status": "active",
        "status": "ACTIVE"
    })

    return {
        "success": True,
        "data": {
            "pending": pending_count,
            "approved": approved_count,
            "rejected": rejected_count,
            "total": total_count,
            "trial_active": trial_active_count
        }
    }

# GET /firms/:id/lawyers - Obtener abogados de una firma
@router.get("/{firm_id}/lawyers", status_code=status.HTTP_200_OK)
async def get_firm_lawyers(
    firm_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Obtener todos los abogados de una firma"""
    try:
        oid = ObjectId(firm_id)
    except:
        raise HTTPException(status_code=400, detail="ID de firma inválido")

    firm = await db.firms.find_one({"_id": oid})
    if not firm:
        raise HTTPException(status_code=404, detail="Firma no encontrada")

    # Access control
    if current_user.get("role") not in ["admin", "admin_general"]:
        if current_user.get("firm_id") != firm_id and str(current_user.get("_id")) != firm.get("owner_id"):
            raise HTTPException(status_code=403, detail="No tienes permiso para ver estos abogados")

    # Get lawyers from this firm
    lawyers = await db.users.find({
        "firm_id": firm_id,
        "role": {"$in": ["firm_lawyer", "lawyer"]}
    }).to_list(None)

    result = []
    for lawyer in lawyers:
        # Get lawyer's cases
        cases = await db.cases.find({"lawyer_id": str(lawyer["_id"])}).to_list(None)

        # Calculate revenue from commissions
        case_ids = [str(c["_id"]) for c in cases]
        commissions = await db.commissions.find({
            "case_id": {"$in": case_ids}
        }).to_list(None) if case_ids else []

        revenue = sum(c.get("amount", 0) for c in commissions)

        result.append({
            "id": str(lawyer["_id"]),
            "name": lawyer.get("full_name"),
            "specialty": lawyer.get("specialty"),
            "email": lawyer.get("email"),
            "phone": lawyer.get("phone"),
            "active_cases": len([c for c in cases if c.get("status") in ["open", "in_progress"]]),
            "total_cases": len(cases),
            "revenue": round(revenue, 2),
        })

    return {
        "success": True,
        "data": result,
        "count": len(result),
    }

# GET /firms/:id/cases - Obtener casos de una firma
@router.get("/{firm_id}/cases", status_code=status.HTTP_200_OK)
async def get_firm_cases(
    firm_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Obtener todos los casos de una firma"""
    try:
        oid = ObjectId(firm_id)
    except:
        raise HTTPException(status_code=400, detail="ID de firma inválido")

    firm = await db.firms.find_one({"_id": oid})
    if not firm:
        raise HTTPException(status_code=404, detail="Firma no encontrada")

    # Access control
    if current_user.get("role") not in ["admin", "admin_general"]:
        if current_user.get("firm_id") != firm_id and str(current_user.get("_id")) != firm.get("owner_id"):
            raise HTTPException(status_code=403, detail="No tienes permiso para ver estos casos")

    # Get lawyers from this firm
    lawyers = await db.users.find({
        "firm_id": firm_id,
        "role": {"$in": ["firm_lawyer", "lawyer"]}
    }).to_list(None)
    lawyer_ids = [str(l["_id"]) for l in lawyers]

    # Get cases for these lawyers
    cases = await db.cases.find({
        "lawyer_id": {"$in": lawyer_ids}
    }).sort("created_at", -1).to_list(None)

    result = []
    for case in cases:
        result.append({
            "id": str(case["_id"]),
            "case_number": case.get("case_number", ""),
            "client_name": case.get("client_name", ""),
            "matter": case.get("matter", ""),
            "status": case.get("status", "open"),
            "estado": case.get("estado", ""),
            "lawyer_id": case.get("lawyer_id"),
            "created_at": case.get("created_at").isoformat() if isinstance(case.get("created_at"), datetime) else case.get("created_at"),
        })

    return {
        "success": True,
        "data": result,
        "count": len(result),
    }

# GET /firms/:id/clients - Obtener clientes de una firma
@router.get("/{firm_id}/clients", status_code=status.HTTP_200_OK)
async def get_firm_clients(
    firm_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Obtener todos los clientes únicos de una firma"""
    try:
        oid = ObjectId(firm_id)
    except:
        raise HTTPException(status_code=400, detail="ID de firma inválido")

    firm = await db.firms.find_one({"_id": oid})
    if not firm:
        raise HTTPException(status_code=404, detail="Firma no encontrada")

    # Access control
    if current_user.get("role") not in ["admin", "admin_general"]:
        if current_user.get("firm_id") != firm_id and str(current_user.get("_id")) != firm.get("owner_id"):
            raise HTTPException(status_code=403, detail="No tienes permiso para ver estos clientes")

    # Get lawyers from this firm
    lawyers = await db.users.find({
        "firm_id": firm_id,
        "role": {"$in": ["firm_lawyer", "lawyer"]}
    }).to_list(None)
    lawyer_ids = [str(l["_id"]) for l in lawyers]

    # Get cases for these lawyers
    cases = await db.cases.find({
        "lawyer_id": {"$in": lawyer_ids}
    }).to_list(None)

    # Collect unique clients
    unique_clients = {}
    for case in cases:
        client_id = case.get("client_id")
        client_name = case.get("client_name")

        if client_id and client_id not in unique_clients:
            unique_clients[client_id] = {
                "id": client_id,
                "name": client_name,
                "cases_count": 0,
            }

        if client_id:
            unique_clients[client_id]["cases_count"] += 1

    return {
        "success": True,
        "data": list(unique_clients.values()),
        "count": len(unique_clients),
    }

# GET /firms/:id/financial - Obtener resumen financiero de una firma
@router.get("/{firm_id}/financial", status_code=status.HTTP_200_OK)
async def get_firm_financial(
    firm_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Obtener resumen financiero de una firma"""
    try:
        oid = ObjectId(firm_id)
    except:
        raise HTTPException(status_code=400, detail="ID de firma inválido")

    firm = await db.firms.find_one({"_id": oid})
    if not firm:
        raise HTTPException(status_code=404, detail="Firma no encontrada")

    # Access control
    if current_user.get("role") not in ["admin", "admin_general"]:
        if current_user.get("firm_id") != firm_id and str(current_user.get("_id")) != firm.get("owner_id"):
            raise HTTPException(status_code=403, detail="No tienes permiso para ver finanzas de esta firma")

    # Get lawyers from this firm
    lawyers = await db.users.find({
        "firm_id": firm_id,
        "role": {"$in": ["firm_lawyer", "lawyer"]}
    }).to_list(None)
    lawyer_ids = [str(l["_id"]) for l in lawyers]

    # Get cases for these lawyers
    cases = await db.cases.find({
        "lawyer_id": {"$in": lawyer_ids}
    }).to_list(None)
    case_ids = [str(c["_id"]) for c in cases]

    # Get commissions for these cases
    commissions = await db.commissions.find({
        "case_id": {"$in": case_ids}
    }).to_list(None)

    # Calculate financial metrics
    total_revenue = sum(c.get("amount", 0) for c in commissions)
    pending_revenue = sum(c.get("amount", 0) for c in commissions if c.get("status") in ["pending", "approved"])
    paid_revenue = sum(c.get("amount", 0) for c in commissions if c.get("status") == "paid")
    rejected_revenue = sum(c.get("amount", 0) for c in commissions if c.get("status") == "rejected")

    commission_payment_rate = (paid_revenue / total_revenue * 100) if total_revenue > 0 else 0

    # Get invoices for this firm (if any)
    invoices = await db.invoices.find({
        "firm_id": firm_id
    }).to_list(None) if hasattr(db, 'invoices') else []

    total_invoiced = sum(i.get("amount", 0) for i in invoices)
    paid_invoices = sum(i.get("amount", 0) for i in invoices if i.get("status") == "paid")

    return {
        "success": True,
        "data": {
            "firm_id": firm_id,
            "firm_name": firm.get("name"),
            "total_revenue": round(total_revenue, 2),
            "pending_revenue": round(pending_revenue, 2),
            "paid_revenue": round(paid_revenue, 2),
            "rejected_revenue": round(rejected_revenue, 2),
            "commission_payment_rate": round(commission_payment_rate, 2),
            "total_invoiced": round(total_invoiced, 2),
            "paid_invoices": round(paid_invoices, 2),
            "balance": round(total_revenue - paid_revenue, 2),
            "commissions_count": len(commissions),
            "active_cases": len([c for c in cases if c.get("status") in ["open", "in_progress"]]),
            "avg_revenue_per_case": round(total_revenue / max(len(cases), 1), 2),
        },
    }

# GET /firms/trial/summary - Resumen de trials (admin only)
@router.get("/trial/summary", status_code=status.HTTP_200_OK)
async def get_trial_summary(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Obtener resumen de todos los trials activos y expirados"""
    if current_user.get("role") not in ["admin", "admin_general"]:
        raise HTTPException(status_code=403, detail="Solo administradores pueden ver resumen de trials")

    from services.trial_service import get_trial_summary_by_status
    summary = await get_trial_summary_by_status(db)

    return {
        "success": True,
        "data": summary
    }

# GET /firms/{firm_id}/trial - Obtener estado del trial de una firma (admin only)
@router.get("/{firm_id}/trial", status_code=status.HTTP_200_OK)
async def get_firm_trial_status(
    firm_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Obtener estado del trial de una firma específica"""
    if current_user.get("role") not in ["admin", "admin_general"]:
        raise HTTPException(status_code=403, detail="Solo administradores pueden ver estado de trial")

    try:
        oid = ObjectId(firm_id)
    except:
        raise HTTPException(status_code=400, detail="ID de firma inválido")

    firm = await db.firms.find_one({"_id": oid})
    if not firm:
        raise HTTPException(status_code=404, detail="Firma no encontrada")

    from services.trial_service import calculate_trial_remaining_days, is_trial_active

    remaining_days = calculate_trial_remaining_days(firm.get("trial_ends_at"))
    is_active = is_trial_active(firm.get("trial_status"), firm.get("trial_ends_at"))

    return {
        "success": True,
        "data": {
            "firm_id": firm_id,
            "firm_name": firm.get("name"),
            "trial_status": firm.get("trial_status", "not_started"),
            "trial_started_at": firm.get("trial_started_at").isoformat() if firm.get("trial_started_at") else None,
            "trial_ends_at": firm.get("trial_ends_at").isoformat() if firm.get("trial_ends_at") else None,
            "remaining_days": remaining_days,
            "is_active": is_active,
            "subscription_status": firm.get("subscription_status"),
            "subscription_plan": firm.get("subscription_plan"),
        }
    }
