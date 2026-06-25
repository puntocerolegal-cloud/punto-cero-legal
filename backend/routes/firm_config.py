from fastapi import APIRouter, HTTPException, Depends, status
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorDatabase
from models.firm_config import FirmConfiguration, OnboardingStepUpdate, LawyerInvitation
from routes.auth import get_current_user
from bson import ObjectId

router = APIRouter(prefix="/firm-config", tags=["Firm Configuration"])


async def get_db():
    from server import db
    return db


# GET /firm-config/:firm_id - Obtener configuración actual
@router.get("/{firm_id}", status_code=status.HTTP_200_OK)
async def get_firm_config(
    firm_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Obtener configuración actual de la firma"""
    # Validar acceso: solo firm_owner, firm_admin o admin global
    if current_user.get("role") not in ["admin", "admin_general"]:
        if current_user.get("firm_id") != firm_id:
            raise HTTPException(status_code=403, detail="No tienes permiso para ver esta configuración")
    
    try:
        oid = ObjectId(firm_id)
    except:
        raise HTTPException(status_code=400, detail="ID de firma inválido")
    
    # Obtener o crear configuración
    config = await db.firm_configurations.find_one({"firm_id": firm_id})
    if not config:
        # Crear configuración nueva
        config_doc = {
            "firm_id": firm_id,
            "commercial_name": None,
            "description": None,
            "website": None,
            "phone": None,
            "logo_url": None,
            "primary_color": None,
            "secondary_color": None,
            "cover_image_url": None,
            "practice_areas": [],
            "invited_lawyers": [],
            "current_step": 0,
            "onboarding_completed": False,
            "completed_at": None,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }
        result = await db.firm_configurations.insert_one(config_doc)
        config = config_doc
        config["_id"] = str(result.inserted_id)
    else:
        config["_id"] = str(config["_id"])
    
    return {
        "success": True,
        "data": config
    }


# POST /firm-config/:firm_id/step - Guardar progreso de un paso
@router.post("/{firm_id}/step", status_code=status.HTTP_200_OK)
async def update_onboarding_step(
    firm_id: str,
    step_update: OnboardingStepUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Actualizar un paso del onboarding y guardar progreso"""
    # Validar acceso
    if current_user.get("role") not in ["admin", "admin_general"]:
        if current_user.get("firm_id") != firm_id:
            raise HTTPException(status_code=403, detail="No tienes permiso para actualizar esta configuración")
    
    try:
        oid = ObjectId(firm_id)
    except:
        raise HTTPException(status_code=400, detail="ID de firma inválido")
    
    # Validar paso
    if step_update.step < 0 or step_update.step > 3:
        raise HTTPException(status_code=400, detail="Paso inválido (0-3)")
    
    step = step_update.step
    data = step_update.data
    
    # Mapear datos según el paso
    update_fields = {
        "current_step": step,
        "updated_at": datetime.utcnow()
    }
    
    if step == 0:  # Datos corporativos
        if "commercial_name" in data:
            update_fields["commercial_name"] = data["commercial_name"]
        if "description" in data:
            update_fields["description"] = data["description"]
        if "website" in data:
            update_fields["website"] = data["website"]
        if "phone" in data:
            update_fields["phone"] = data["phone"]
    
    elif step == 1:  # Identidad
        if "logo_url" in data:
            update_fields["logo_url"] = data["logo_url"]
        if "primary_color" in data:
            update_fields["primary_color"] = data["primary_color"]
        if "secondary_color" in data:
            update_fields["secondary_color"] = data["secondary_color"]
        if "cover_image_url" in data:
            update_fields["cover_image_url"] = data["cover_image_url"]
    
    elif step == 2:  # Áreas de práctica
        if "practice_areas" in data:
            update_fields["practice_areas"] = data["practice_areas"]
    
    elif step == 3:  # Invitar abogados
        if "invited_lawyers" in data:
            # Validar estructura de invitaciones
            invited = []
            for inv in data["invited_lawyers"]:
                try:
                    validated = LawyerInvitation(
                        email=inv.get("email"),
                        full_name=inv.get("full_name"),
                        role=inv.get("role", "firm_lawyer")
                    )
                    invited.append(validated.model_dump())
                except Exception as e:
                    raise HTTPException(status_code=400, detail=f"Invitación inválida: {str(e)}")
            update_fields["invited_lawyers"] = invited
    
    # Actualizar configuración
    result = await db.firm_configurations.update_one(
        {"firm_id": firm_id},
        {"$set": update_fields},
        upsert=True
    )
    
    # Obtener configuración actualizada
    config = await db.firm_configurations.find_one({"firm_id": firm_id})
    config["_id"] = str(config["_id"])
    
    return {
        "success": True,
        "message": f"Paso {step} guardado correctamente",
        "data": config
    }


# POST /firm-config/:firm_id/complete - Completar onboarding
@router.post("/{firm_id}/complete", status_code=status.HTTP_200_OK)
async def complete_onboarding(
    firm_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Completar el onboarding e invitar abogados"""
    # Validar acceso
    if current_user.get("role") not in ["admin", "admin_general"]:
        if current_user.get("firm_id") != firm_id:
            raise HTTPException(status_code=403, detail="No tienes permiso para completar el onboarding")
    
    try:
        oid = ObjectId(firm_id)
    except:
        raise HTTPException(status_code=400, detail="ID de firma inválido")
    
    # Obtener configuración actual
    config = await db.firm_configurations.find_one({"firm_id": firm_id})
    if not config:
        raise HTTPException(status_code=404, detail="Configuración no encontrada")
    
    # Invitar abogados
    invited_count = 0
    if config.get("invited_lawyers"):
        from utils.notifier import send_email
        
        for invitation in config["invited_lawyers"]:
            # Verificar que no exista usuario
            existing = await db.users.find_one({"email": invitation["email"]})
            if existing:
                continue
            
            # Crear invitación temporal (no usuario aún)
            # Se enviará email con enlace de aceptación
            invite_doc = {
                "firm_id": firm_id,
                "email": invitation["email"],
                "full_name": invitation["full_name"],
                "role": invitation["role"],
                "status": "pending",
                "created_at": datetime.utcnow(),
            }
            
            await db.lawyer_invitations.insert_one(invite_doc)
            
            # Enviar email
            firm = await db.firms.find_one({"_id": oid})
            firm_name = firm.get("name", "Firma") if firm else "Firma"
            
            email_html = f"""
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; }}
                    .container {{ max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; }}
                    .button {{ display: inline-block; background: #10b981; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: 600; margin: 20px 0; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <h2>¡Invitación a Punto Cero Legal!</h2>
                    <p>Hola <strong>{invitation['full_name']}</strong>,</p>
                    <p>Has sido invitado a unirte a <strong>{firm_name}</strong> en Punto Cero Legal como {invitation['role']}.</p>
                    <p>Accede con tu cuenta o regístrate usando este email.</p>
                    <p style="text-align: center;">
                        <a href="https://puntocerolegal.com/register" class="button">ACEPTAR INVITACIÓN</a>
                    </p>
                </div>
            </body>
            </html>
            """
            
            send_email(
                to_email=invitation["email"],
                subject=f"Invitación a {firm_name} - Punto Cero Legal",
                body_html=email_html
            )
            
            invited_count += 1
    
    # Marcar onboarding como completado
    await db.firm_configurations.update_one(
        {"firm_id": firm_id},
        {"$set": {
            "onboarding_completed": True,
            "completed_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }}
    )
    
    return {
        "success": True,
        "message": "Onboarding completado",
        "invited_lawyers": invited_count
    }


# GET /firm-config/:firm_id/practice-areas - Obtener áreas de práctica disponibles
@router.get("/{firm_id}/practice-areas", status_code=status.HTTP_200_OK)
async def get_practice_areas(
    firm_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Obtener lista de áreas de práctica disponibles"""
    areas = [
        {"id": "laboral", "name": "Laboral", "description": "Derecho laboral y relaciones industriales"},
        {"id": "civil", "name": "Civil", "description": "Derecho civil y contratos"},
        {"id": "penal", "name": "Penal", "description": "Derecho penal y defensa criminal"},
        {"id": "comercial", "name": "Comercial", "description": "Derecho comercial y empresarial"},
        {"id": "tributario", "name": "Tributario", "description": "Derecho tributario e impuestos"},
        {"id": "administrativo", "name": "Administrativo", "description": "Derecho administrativo"},
        {"id": "familia", "name": "Familia", "description": "Derecho de familia y sucesiones"},
    ]
    
    return {
        "success": True,
        "data": areas
    }
