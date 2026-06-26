"""
Rutas para Firm OS Enterprise
- Dashboard con métricas
- Configuración de firma
- Onboarding wizard
- Directorio público
- Contactos públicos
"""

from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from datetime import datetime
from typing import List, Optional
import re

from routes.auth import get_current_user

router = APIRouter(prefix="/firm-os", tags=["Firm OS Enterprise"])

async def get_db():
    from server import db
    return db

# ═══════════════════════════════════════════════════════════════════════════════════
# DASHBOARD - Métricas de firma
# ═══════════════════════════════════════════════════════════════════════════════════

@router.get("/dashboard")
async def get_firm_dashboard(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Obtener dashboard con métricas de firma"""
    if current_user.get("role") not in ["firm_owner", "firm_admin"]:
        raise HTTPException(status_code=403, detail="Acceso denegado")

    firm_id = current_user.get("firm_id")
    if not firm_id:
        raise HTTPException(status_code=400, detail="Usuario sin firma asignada")

    try:
        # Contar abogados activos
        lawyers = await db.firm_lawyers.count_documents({
            "firm_id": firm_id,
            "status": "active"
        })

        # Contar clientes activos
        clients = await db.firm_clients.count_documents({
            "firm_id": firm_id,
            "status": "active"
        })

        # Contar casos activos
        cases = await db.firm_cases.count_documents({
            "firm_id": firm_id,
            "status": {"$in": ["open", "in_progress"]}
        })

        # Calcular ingresos mensuales
        current_month = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        monthly_revenue = await db.firm_clients.aggregate([
            {"$match": {
                "firm_id": firm_id,
                "created_at": {"$gte": current_month}
            }},
            {"$group": {"_id": None, "total": {"$sum": "$monthly_value"}}}
        ]).to_list(1)

        revenue = monthly_revenue[0]["total"] if monthly_revenue else 0

        # Tareas pendientes
        pending_tasks = await db.firm_cases.count_documents({
            "firm_id": firm_id,
            "status": "pending"
        })

        return {
            "success": True,
            "data": {
                "total_lawyers": lawyers,
                "active_clients": clients,
                "active_cases": cases,
                "monthly_revenue": round(revenue, 2),
                "pending_tasks": pending_tasks
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ═══════════════════════════════════════════════════════════════════════════════════
# CONFIGURACIÓN DE FIRMA
# ═══════════════════════════════════════════════════════════════════════════════════

@router.get("/settings")
async def get_firm_settings(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Obtener configuración de firma"""
    if current_user.get("role") not in ["firm_owner", "firm_admin"]:
        raise HTTPException(status_code=403, detail="Acceso denegado")

    firm_id = current_user.get("firm_id")
    if not firm_id:
        raise HTTPException(status_code=400, detail="Usuario sin firma asignada")

    try:
        settings = await db.firm_settings.find_one({"firm_id": firm_id})
        
        if not settings:
            # Crear configuración por defecto
            default_settings = {
                "firm_id": firm_id,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            result = await db.firm_settings.insert_one(default_settings)
            settings = default_settings
            settings["_id"] = result.inserted_id

        settings["id"] = str(settings.get("_id"))
        del settings["_id"]

        return {
            "success": True,
            "data": settings
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/settings")
async def update_firm_settings(
    settings_data: dict,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Actualizar configuración de firma"""
    if current_user.get("role") not in ["firm_owner", "firm_admin"]:
        raise HTTPException(status_code=403, detail="Acceso denegado")

    firm_id = current_user.get("firm_id")
    if not firm_id:
        raise HTTPException(status_code=400, detail="Usuario sin firma asignada")

    try:
        update_data = settings_data.copy()
        update_data["updated_at"] = datetime.utcnow()

        result = await db.firm_settings.update_one(
            {"firm_id": firm_id},
            {"$set": update_data},
            upsert=True
        )

        return {
            "success": True,
            "message": "Configuración actualizada",
            "modified_count": result.modified_count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ═══════════════════════════════════════════════════════════════════════════════════
# ONBOARDING WIZARD
# ═══════════════════════════════════════════════════════════════════════════════════

@router.post("/firms/{firm_id}/onboarding-complete")
async def complete_onboarding(
    firm_id: str,
    onboarding_data: dict,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Completar wizard de onboarding"""
    if current_user.get("role") not in ["firm_owner", "firm_admin"]:
        raise HTTPException(status_code=403, detail="Acceso denegado")

    if str(current_user.get("firm_id")) != firm_id:
        raise HTTPException(status_code=403, detail="No puedes acceder a esta firma")

    try:
        update_data = {
            "onboarding_completed": True,
            "onboarding_completed_at": datetime.utcnow(),
            "practice_areas": onboarding_data.get("practice_areas", []),
            "brand_color": onboarding_data.get("brand_color", "#3b82f6"),
            "logo_url": onboarding_data.get("logo_url", ""),
            "updated_at": datetime.utcnow()
        }

        await db.firms.update_one(
            {"_id": ObjectId(firm_id)},
            {"$set": update_data}
        )

        # Procesar invitaciones a abogados si existen
        invited_count = 0
        if onboarding_data.get("invited_lawyers"):
            from utils.email_service import send_email
            import secrets

            firm = await db.firms.find_one({"_id": ObjectId(firm_id)})
            firm_name = firm.get("name", "Firma") if firm else "Firma"

            for lawyer_email in onboarding_data["invited_lawyers"]:
                try:
                    # Generar token de invitación único
                    invitation_token = secrets.token_urlsafe(32)

                    # Crear documento de invitación
                    invitation_doc = {
                        "firm_id": firm_id,
                        "email": lawyer_email,
                        "token": invitation_token,
                        "role": "firm_lawyer",
                        "status": "pending",
                        "created_at": datetime.utcnow(),
                        "expires_at": datetime.utcnow() + \
                            __import__('datetime').timedelta(days=7)
                    }

                    result = await db.lawyer_invitations.insert_one(invitation_doc)

                    # Construir URL de activación
                    activation_url = f"https://puntocerolegal.com/activate-lawyer?token={invitation_token}"

                    # Enviar email
                    email_html = f"""
                    <html>
                    <head>
                        <meta charset="utf-8">
                        <style>
                            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; }}
                            .container {{ max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; }}
                            .button {{ display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: 600; margin: 20px 0; }}
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <h2>¡Invitación a unirte a {firm_name}!</h2>
                            <p>Hola,</p>
                            <p>Has sido invitado a unirte a <strong>{firm_name}</strong> como abogado en Punto Cero Legal.</p>
                            <p>Haz clic en el botón de abajo para activar tu cuenta:</p>
                            <p style="text-align: center;">
                                <a href="{activation_url}" class="button">ACTIVAR CUENTA</a>
                            </p>
                            <p style="color: #666; font-size: 12px; margin-top: 30px;">
                                Este link expira en 7 días. Si tienes preguntas, contáctanos.
                            </p>
                        </div>
                    </body>
                    </html>
                    """

                    try:
                        from utils.email_service import send_email
                        send_email(
                            to_email=lawyer_email,
                            subject=f"Invitación a {firm_name} - Punto Cero Legal",
                            body_html=email_html
                        )
                    except:
                        pass  # Email service may not be available

                    invited_count += 1
                except Exception as e:
                    print(f"Error invitando abogado {lawyer_email}: {str(e)}")
                    continue

        return {
            "success": True,
            "message": "Onboarding completado",
            "invited_lawyers": invited_count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ═══════════════════════════════════════════════════════════════════════════════════
# CONFIGURACIÓN DE DIRECTORIO Y PERFIL PÚBLICO
# ═══════════════════════════════════════════════════════════════════════════════════

def generate_slug(name: str) -> str:
    """Generar slug desde nombre de firma"""
    slug = re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')
    return slug

@router.get("/firms/{firm_id}/directory-settings")
async def get_directory_settings(
    firm_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Obtener configuración de directorio público"""
    if str(current_user.get("firm_id")) != firm_id:
        raise HTTPException(status_code=403, detail="Acceso denegado")

    try:
        firm = await db.firms.find_one({"_id": ObjectId(firm_id)})
        
        if not firm:
            raise HTTPException(status_code=404, detail="Firma no encontrada")

        # Generar slug si no existe
        if not firm.get("slug"):
            slug = generate_slug(firm["name"])
            await db.firms.update_one(
                {"_id": ObjectId(firm_id)},
                {"$set": {"slug": slug}}
            )
        else:
            slug = firm["slug"]

        return {
            "success": True,
            "data": {
                "id": str(firm["_id"]),
                "slug": slug,
                "logo": firm.get("logo", ""),
                "description": firm.get("description", ""),
                "city": firm.get("city", ""),
                "country": firm.get("country", ""),
                "website": firm.get("website", ""),
                "linkedin": firm.get("linkedin", ""),
                "whatsapp": firm.get("whatsapp", ""),
                "visibility_public": firm.get("visibility_public", False),
                "practice_areas": firm.get("practice_areas", [])
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/firms/{firm_id}/directory-settings")
async def update_directory_settings(
    firm_id: str,
    settings_data: dict,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Actualizar configuración de directorio público"""
    if str(current_user.get("firm_id")) != firm_id:
        raise HTTPException(status_code=403, detail="Acceso denegado")

    try:
        update_data = {
            "logo": settings_data.get("logo", ""),
            "description": settings_data.get("description", ""),
            "website": settings_data.get("website", ""),
            "linkedin": settings_data.get("linkedin", ""),
            "whatsapp": settings_data.get("whatsapp", ""),
            "city": settings_data.get("city", ""),
            "country": settings_data.get("country", ""),
            "practice_areas": settings_data.get("practice_areas", []),
            "visibility_public": settings_data.get("visibility_public", False),
            "updated_at": datetime.utcnow()
        }

        result = await db.firms.update_one(
            {"_id": ObjectId(firm_id)},
            {"$set": update_data}
        )

        return {
            "success": True,
            "message": "Configuración actualizada",
            "modified_count": result.modified_count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ═══════════════════════════════════════════════════════════════════════════════════
# DIRECTORIO PÚBLICO (sin autenticación)
# ═══════════════════════════════════════════════════════════════════════════════════

@router.get("/public/firms")
async def get_public_firms(
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Obtener listado público de firmas activas y completadas"""
    try:
        firms = await db.firms.find({
            "status": "ACTIVE",
            "onboarding_completed": True,
            "visibility_public": True
        }).sort("created_at", -1).to_list(None)

        result = []
        for firm in firms:
            result.append({
                "id": str(firm["_id"]),
                "slug": firm.get("slug", ""),
                "name": firm["name"],
                "logo": firm.get("logo", ""),
                "description": firm.get("description", ""),
                "city": firm["city"],
                "country": firm["country"],
                "plan": firm["plan"],
                "active_lawyers_count": firm.get("active_lawyers_count", 0)
            })

        return {
            "success": True,
            "data": result,
            "count": len(result)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/public/firms/{slug}")
async def get_public_firm_profile(
    slug: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Obtener perfil público de firma"""
    try:
        firm = await db.firms.find_one({
            "slug": slug,
            "status": "ACTIVE",
            "onboarding_completed": True,
            "visibility_public": True
        })

        if not firm:
            raise HTTPException(status_code=404, detail="Firma no encontrada")

        return {
            "success": True,
            "data": {
                "id": str(firm["_id"]),
                "slug": firm.get("slug"),
                "name": firm["name"],
                "logo": firm.get("logo", ""),
                "description": firm.get("description", ""),
                "city": firm["city"],
                "country": firm["country"],
                "plan": firm["plan"],
                "active_lawyers_count": firm.get("active_lawyers_count", 0),
                "website": firm.get("website", ""),
                "linkedin": firm.get("linkedin", ""),
                "whatsapp": firm.get("whatsapp", ""),
                "practice_areas": firm.get("practice_areas", []),
                "specialties": firm.get("practice_areas", [])
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/public/firms/{slug}/contact")
async def submit_firm_contact(
    slug: str,
    contact_data: dict,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Enviar formulario de contacto a firma"""
    try:
        firm = await db.firms.find_one({
            "slug": slug,
            "status": "ACTIVE",
            "onboarding_completed": True,
            "visibility_public": True
        })

        if not firm:
            raise HTTPException(status_code=404, detail="Firma no encontrada")

        # Guardar contacto en colección
        contact_doc = {
            "firm_id": str(firm["_id"]),
            "name": contact_data.get("name"),
            "email": contact_data.get("email"),
            "phone": contact_data.get("phone", ""),
            "message": contact_data.get("message"),
            "created_at": datetime.utcnow(),
            "status": "new"
        }

        await db.firm_contacts.insert_one(contact_doc)

        # Aquí se enviaría email de notificación a la firma

        return {
            "success": True,
            "message": "Mensaje enviado exitosamente"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ═══════════════════════════════════════════════════════════════════════════════════
# INVITACIÓN DE ABOGADOS - Flujo completo
# ═══════════════════════════════════════════════════════════════════════════════════

@router.post("/invite-lawyer")
async def invite_lawyer(
    invite_data: dict,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Invitar abogado a la firma (solo firm_owner y firm_admin)"""
    if current_user.get("role") not in ["firm_owner", "firm_admin"]:
        raise HTTPException(status_code=403, detail="Solo firm_owner y firm_admin pueden invitar abogados")

    firm_id = current_user.get("firm_id")
    if not firm_id:
        raise HTTPException(status_code=400, detail="Usuario sin firma asignada")

    lawyer_email = invite_data.get("email")
    if not lawyer_email:
        raise HTTPException(status_code=400, detail="Email requerido")

    try:
        import secrets
        from utils.email_service import send_email

        # Generar token de invitación único
        invitation_token = secrets.token_urlsafe(32)

        # Crear documento de invitación
        invitation_doc = {
            "firm_id": firm_id,
            "email": lawyer_email,
            "token": invitation_token,
            "role": "firm_lawyer",
            "status": "pending",
            "created_at": datetime.utcnow(),
            "expires_at": datetime.utcnow() + __import__('datetime').timedelta(days=7)
        }

        await db.lawyer_invitations.insert_one(invitation_doc)

        # Construir URL de activación
        activation_url = f"https://puntocerolegal.com/activate-lawyer?token={invitation_token}"

        # Obtener nombre de firma
        firm = await db.firms.find_one({"_id": ObjectId(firm_id)})
        firm_name = firm.get("name", "Firma") if firm else "Firma"

        # Enviar email
        email_html = f"""
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; }}
                .container {{ max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; }}
                .button {{ display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: 600; margin: 20px 0; }}
            </style>
        </head>
        <body>
            <div class="container">
                <h2>¡Invitación a unirte a {firm_name}!</h2>
                <p>Hola,</p>
                <p>Has sido invitado a unirte a <strong>{firm_name}</strong> como abogado en Punto Cero Legal.</p>
                <p>Haz clic en el botón de abajo para activar tu cuenta:</p>
                <p style="text-align: center;">
                    <a href="{activation_url}" class="button">ACTIVAR CUENTA</a>
                </p>
                <p style="color: #666; font-size: 12px; margin-top: 30px;">
                    Este link expira en 7 días. Si tienes preguntas, contáctanos.
                </p>
            </div>
        </body>
        </html>
        """

        try:
            send_email(
                to_email=lawyer_email,
                subject=f"Invitación a {firm_name} - Punto Cero Legal",
                body_html=email_html
            )
        except:
            pass  # Email service may not be available

        return {
            "success": True,
            "message": f"Invitación enviada a {lawyer_email}",
            "token": invitation_token
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/activate-lawyer")
async def activate_lawyer_invitation(
    activation_data: dict,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Activar invitación de abogado con token"""
    token = activation_data.get("token")
    if not token:
        raise HTTPException(status_code=400, detail="Token requerido")

    full_name = activation_data.get("full_name")
    password = activation_data.get("password")

    if not full_name or not password:
        raise HTTPException(status_code=400, detail="Nombre y contraseña requeridos")

    try:
        # Buscar invitación válida
        invitation = await db.lawyer_invitations.find_one({
            "token": token,
            "status": "pending",
            "expires_at": {"$gt": datetime.utcnow()}
        })

        if not invitation:
            raise HTTPException(status_code=404, detail="Invitación no encontrada o expirada")

        firm_id = invitation["firm_id"]
        lawyer_email = invitation["email"]

        # Verificar si usuario ya existe
        existing_user = await db.users.find_one({"email": lawyer_email})

        if existing_user:
            # Actualizar usuario existente
            from utils.hash_utils import hash_password
            hashed_pw = hash_password(password)

            await db.users.update_one(
                {"_id": existing_user["_id"]},
                {"$set": {
                    "full_name": full_name,
                    "password_hash": hashed_pw,
                    "firm_id": firm_id,
                    "role": "firm_lawyer",
                    "status": "ACTIVE",
                    "updated_at": datetime.utcnow()
                }}
            )
            user_id = str(existing_user["_id"])
        else:
            # Crear nuevo usuario
            from utils.hash_utils import hash_password

            hashed_pw = hash_password(password)

            user_doc = {
                "email": lawyer_email,
                "full_name": full_name,
                "password_hash": hashed_pw,
                "firm_id": firm_id,
                "role": "firm_lawyer",
                "status": "ACTIVE",
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }

            result = await db.users.insert_one(user_doc)
            user_id = str(result.inserted_id)

        # Marcar invitación como aceptada
        await db.lawyer_invitations.update_one(
            {"_id": invitation["_id"]},
            {"$set": {
                "status": "accepted",
                "accepted_at": datetime.utcnow(),
                "user_id": user_id
            }}
        )

        return {
            "success": True,
            "message": "Invitación activada exitosamente",
            "user_id": user_id,
            "firm_id": firm_id,
            "role": "firm_lawyer"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
