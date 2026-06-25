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

# POST /firms/register - Registro público de firmas (desde landing page)
@router.post("/register", response_model=FirmResponse, status_code=status.HTTP_201_CREATED)
async def register_firm(
    firm_data: FirmCreate,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Registro público de firma (sin autenticación requerida)

    FLUJO:
    1. Valida que no existan duplicados (email, NIT)
    2. Crea firma en colección 'firms'
    3. Crea usuario 'firm_owner' automáticamente
    4. Crea suscripción inicial
    5. Crea configuración inicial de Firm OS
    6. Envía correo de bienvenida
    """
    from utils.auth import get_password_hash
    import secrets

    # VALIDACIONES
    # Verificar email duplicado (firma)
    existing_firm_email = await db.firms.find_one({"email": firm_data.email})
    if existing_firm_email:
        raise HTTPException(status_code=400, detail="Ya existe una firma registrada con este correo")

    # Verificar NIT duplicado
    existing_firm_nit = await db.firms.find_one({"nit": firm_data.nit})
    if existing_firm_nit:
        raise HTTPException(status_code=400, detail="Ya existe una firma registrada con este NIT")

    # Verificar email duplicado (usuario fundador)
    existing_user = await db.users.find_one({"email": firm_data.founder_email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Este correo ya está registrado en el sistema")

    # PASO 1: Crear la firma
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
        "owner_id": None,  # Se asignará después
        "owner_name": firm_data.founder_name,
        "owner_email": firm_data.founder_email,
        "status": "active",
        "is_verified": False,  # Requiere validación de email
        "subscription_status": "trial",
        "trial_ends_at": datetime.utcnow() + __import__('datetime').timedelta(days=30),
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }

    firm_result = await db.firms.insert_one(firm_doc)
    firm_id = str(firm_result.inserted_id)

    # PASO 2: Crear usuario firm_owner
    temp_password = secrets.token_urlsafe(12)

    user_doc = {
        "email": firm_data.founder_email,
        "full_name": firm_data.founder_name,
        "password_hash": get_password_hash(temp_password),
        "phone": firm_data.founder_phone,
        "id_document": firm_data.founder_document,
        "bar_number": firm_data.founder_bar_number,
        "role": "firm_owner",
        "firm_id": firm_id,
        "status": "PENDING_VERIFICATION",  # Requiere verificación de email
        "is_verified": False,
        "country": firm_data.country or "Colombia",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }

    user_result = await db.users.insert_one(user_doc)
    owner_id = str(user_result.inserted_id)

    # PASO 3: Actualizar firma con owner_id
    await db.firms.update_one(
        {"_id": ObjectId(firm_id)},
        {"$set": {
            "owner_id": owner_id,
            "updated_at": datetime.utcnow()
        }}
    )

    # PASO 4: Crear suscripción inicial
    subscription_doc = {
        "firm_id": firm_id,
        "owner_id": owner_id,
        "plan": firm_data.plan,
        "status": "trial",
        "started_at": datetime.utcnow(),
        "trial_ends_at": datetime.utcnow() + __import__('datetime').timedelta(days=30),
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }

    if hasattr(db, 'subscriptions'):
        await db.subscriptions.insert_one(subscription_doc)

    # PASO 5: Crear configuración inicial de Firm OS
    config_doc = {
        "firm_id": firm_id,
        "firm_name": firm_data.name,
        "settings": {
            "language": "es",
            "timezone": "America/Bogota",
            "currency": "COP",
            "max_lawyers": 5 if firm_data.plan == "firm_growth" else 10,
        },
        "features": {
            "firm_dashboard": True,
            "case_management": True,
            "lawyer_management": True,
            "finance_module": True,
            "analytics": True,
        },
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }

    if hasattr(db, 'firm_configurations'):
        await db.firm_configurations.insert_one(config_doc)

    # PASO 6: Enviar correo de bienvenida con credenciales
    from utils.notifier import send_email

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
            .subtitle {{ color: #6b7280; font-size: 14px; margin-bottom: 30px; }}
            .section {{ margin: 20px 0; padding: 15px; background: #f9fafb; border-left: 4px solid #f97316; }}
            .label {{ color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase; margin: 10px 0 5px 0; }}
            .value {{ color: #1f2937; font-size: 16px; font-weight: 600; font-family: 'Monaco', 'Courier New', monospace; }}
            .button {{ display: inline-block; background: #f97316; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: 600; margin: 20px 0; }}
            .button:hover {{ background: #fb923c; }}
            .footer {{ color: #9ca3af; font-size: 12px; text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; }}
            .warning {{ background: #fef3c7; border: 1px solid #fcd34d; color: #92400e; padding: 15px; border-radius: 6px; margin: 20px 0; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">PUNTO CERO</div>
                <div class="subtitle">Sistema Integral de Gestión Jurídica</div>
            </div>

            <div class="title">¡Bienvenido a Punto Cero!</div>
            <p>Hola <strong>{firm_data.founder_name}</strong>,</p>

            <p>Tu firma <strong>{firm_data.name}</strong> ha sido registrada exitosamente en Punto Cero.
            A continuación encontrarás tus credenciales iniciales para acceder a tu panel de control.</p>

            <div class="section">
                <div class="label">Datos de tu Firma</div>
                <p>
                    <strong>Nombre:</strong> {firm_data.name}<br>
                    <strong>NIT:</strong> {firm_data.nit}<br>
                    <strong>Email:</strong> {firm_data.email}<br>
                    <strong>Plan:</strong> {'Firma en Crecimiento (5 abogados)' if firm_data.plan == 'firm_growth' else 'Consolidación Empresarial (10 abogados)'}<br>
                    <strong>Período de prueba:</strong> 30 días completos
                </p>
            </div>

            <div class="section">
                <div class="label">Tus Credenciales de Acceso</div>
                <p>
                    <strong>Usuario/Email:</strong><br>
                    <span class="value">{firm_data.founder_email}</span>
                </p>
                <p>
                    <strong>Contraseña Temporal:</strong><br>
                    <span class="value">{temp_password}</span>
                </p>
            </div>

            <div class="warning">
                <strong>⚠️ Importante:</strong> Esta es tu contraseña temporal.
                Por seguridad, te recomendamos cambiarla inmediatamente al primer acceso.
            </div>

            <p style="text-align: center; margin: 30px 0;">
                <a href="https://puntocerolegal.com/login" class="button">Acceder a Mi Firma</a>
            </p>

            <h3 style="color: #1f2937; margin-top: 30px;">¿Qué sigue?</h3>
            <ul>
                <li><strong>Inicia sesión</strong> con tus credenciales</li>
                <li><strong>Cambia tu contraseña</strong> en la sección de Configuración</li>
                <li><strong>Completa tu perfil</strong> con información de la firma</li>
                <li><strong>Invita abogados</strong> desde el panel de control</li>
                <li><strong>Comienza a crear casos</strong> y gestionar tu firma</li>
            </ul>

            <h3 style="color: #1f2937;">Acceso a Punto Cero Firm OS</h3>
            <p>Una vez dentro del sistema, tendrás acceso a:</p>
            <ul>
                <li>📊 Dashboard de tu Firma</li>
                <li>👥 Gestión de Abogados</li>
                <li>📁 Administrador de Casos</li>
                <li>💰 Módulo de Finanzas</li>
                <li>📈 Analytics y Reportes</li>
            </ul>

            <div class="footer">
                <p>Punto Cero Legal © 2025 — Todos los derechos reservados</p>
                <p>Si tienes preguntas, contacta a <strong>soporte@puntocerolegal.com</strong></p>
                <p style="margin-top: 10px; font-size: 11px;">Este correo fue enviado porque registraste una nueva firma en Punto Cero. Si no fue así, ignora este mensaje.</p>
            </div>
        </div>
    </body>
    </html>
    """

    email_result = send_email(
        to_email=firm_data.founder_email,
        subject=f"¡Bienvenido a Punto Cero! Credenciales para {firm_data.name}",
        body_html=email_html
    )

    # PASO 7: Registrar envío en BD
    credentials_doc = {
        "firm_id": firm_id,
        "owner_id": owner_id,
        "email": firm_data.founder_email,
        "temp_password": temp_password,
        "sent": email_result.get("sent", False),
        "email_channel": email_result.get("channel", "email"),
        "email_reason": email_result.get("reason"),
        "created_at": datetime.utcnow(),
    }

    if hasattr(db, 'initial_credentials'):
        await db.initial_credentials.insert_one(credentials_doc)

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
        created_at=firm_doc["created_at"].isoformat(),
        updated_at=firm_doc["updated_at"].isoformat()
    )

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
    import secrets

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
