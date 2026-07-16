"""
Rutas para Firm OS Enterprise
- Dashboard con métricas
- Configuración de firma
- Onboarding wizard
- Directorio público
- Contactos públicos
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from datetime import datetime, timedelta
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
# CONSENTIMIENTO LEGAL EMPRESARIAL (Términos, Privacidad, Habeas Data, SaaS, Tratamiento)
# ═══════════════════════════════════════════════════════════════════════════════════

# Documentos legales obligatorios y su versión vigente.
LEGAL_DOCUMENTS = ["terms", "privacy", "habeas_data", "saas_contract", "data_processing"]
LEGAL_VERSION = "1.0"

@router.get("/consent")
async def get_consent_status(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Devuelve si el usuario ya aceptó la versión vigente de los documentos legales."""
    email = current_user.get("email")
    record = await db.firm_consents.find_one(
        {"user_email": email, "version": LEGAL_VERSION},
        sort=[("accepted_at", -1)],
    )
    return {
        "accepted": bool(record),
        "version": LEGAL_VERSION,
        "documents": LEGAL_DOCUMENTS,
        "accepted_at": record.get("accepted_at").isoformat() if record and record.get("accepted_at") else None,
    }

@router.post("/consent")
async def record_consent(
    payload: dict,
    request: Request,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Registra la aceptación legal con auditoría (usuario, fecha, hora, IP, versión)."""
    docs = payload.get("documents") or {}
    missing = [d for d in LEGAL_DOCUMENTS if not docs.get(d)]
    if missing:
        raise HTTPException(status_code=400, detail=f"Debe aceptar todos los documentos: faltan {missing}")

    ip = request.headers.get("x-forwarded-for") or (request.client.host if request.client else None)
    consent_doc = {
        "firm_id": current_user.get("firm_id"),
        "organization_id": current_user.get("organization_id"),
        "user_id": str(current_user.get("_id")),
        "user_email": current_user.get("email"),
        "version": LEGAL_VERSION,
        "documents": {d: True for d in LEGAL_DOCUMENTS},
        "ip": ip,
        "user_agent": request.headers.get("user-agent"),
        "accepted_at": datetime.utcnow(),
    }
    await db.firm_consents.insert_one(consent_doc)
    try:
        await db.audit_logs.insert_one({
            "action": "legal_consent_accepted",
            "user_email": current_user.get("email"),
            "firm_id": current_user.get("firm_id"),
            "ip": ip,
            "version": LEGAL_VERSION,
            "timestamp": datetime.utcnow(),
        })
    except Exception:
        pass
    return {"success": True, "accepted": True, "version": LEGAL_VERSION, "accepted_at": consent_doc["accepted_at"].isoformat()}

# ═══════════════════════════════════════════════════════════════════════════════════
# ONBOARDING EMPRESARIAL SELF-SERVICE (FASE 4.3)
# Crea de forma atómica: Firm + Firm Owner + Firm Settings (comercial + White Label)
# + organization_id (tenant) + consentimiento legal, y devuelve token (auto-ingreso).
# Reutiliza las mismas colecciones/patrones que register+approve; no crea arquitectura nueva.
# ═══════════════════════════════════════════════════════════════════════════════════
@router.post("/onboarding", status_code=status.HTTP_201_CREATED)
async def firm_onboarding(payload: dict, request: Request, db: AsyncIOMotorDatabase = Depends(get_db)):
    from utils.auth import get_password_hash, create_access_token

    founder = payload.get("founder") or {}
    commercial = payload.get("commercial") or {}
    branding = payload.get("branding") or {}
    plan_id = payload.get("plan_id")
    consent = (payload.get("consent") or {}).get("documents") or {}

    email = (founder.get("email") or "").strip().lower()
    password = founder.get("password")
    if not email or not password:
        raise HTTPException(status_code=400, detail="Correo y contraseña del fundador son obligatorios")
    if not commercial.get("commercial_name"):
        raise HTTPException(status_code=400, detail="El nombre comercial es obligatorio")
    missing = [d for d in LEGAL_DOCUMENTS if not consent.get(d)]
    if missing:
        raise HTTPException(status_code=400, detail=f"Debe aceptar todos los documentos legales: faltan {missing}")

    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Ya existe un usuario con este correo")

    now = datetime.utcnow()
    trial_ends = now + timedelta(days=7)

    # 1) Firm
    firm_doc = {
        "name": commercial.get("commercial_name"),
        "legal_name": commercial.get("legal_name"),
        "nit": commercial.get("nit"),
        "email": commercial.get("corporate_email") or email,
        "phone": commercial.get("phone"),
        "address": commercial.get("address"),
        "city": commercial.get("city"),
        "country": commercial.get("country") or "Colombia",
        "plan": plan_id,
        "owner_email": email,
        "owner_name": founder.get("full_name"),
        "status": "ACTIVE",
        "approval_status": "approved",
        "is_verified": True,
        "trial_status": "active",
        "trial_started_at": now,
        "trial_ends_at": trial_ends,
        "subscription_status": "trial",
        "subscription_plan": plan_id or "trial",
        "created_at": now,
        "updated_at": now,
    }
    firm_result = await db.firms.insert_one(firm_doc)
    firm_id = str(firm_result.inserted_id)

    # 2) Firm Owner (tenant = firm_id)
    owner_doc = {
        "email": email,
        "full_name": founder.get("full_name"),
        "password_hash": get_password_hash(password),
        "phone": founder.get("phone") or commercial.get("phone"),
        "role": "firm_owner",
        "firm_id": firm_id,
        "organization_id": firm_id,
        "status": "ACTIVE",
        "is_verified": True,
        "requires_password_change": False,
        "country": commercial.get("country") or "Colombia",
        "created_at": now,
        "updated_at": now,
    }
    owner_result = await db.users.insert_one(owner_doc)
    owner_id = str(owner_result.inserted_id)
    await db.firms.update_one({"_id": firm_result.inserted_id}, {"$set": {"owner_id": owner_id}})

    # 3) Firm Settings (comercial + White Label) — sin datos huérfanos
    settings_doc = {
        "firm_id": firm_id,
        "commercial_name": commercial.get("commercial_name"),
        "legal_name": commercial.get("legal_name"),
        "tax_id": commercial.get("nit"),
        "address": commercial.get("address"),
        "city": commercial.get("city"),
        "country": commercial.get("country") or "Colombia",
        "phone": commercial.get("phone"),
        "corporate_email": commercial.get("corporate_email"),
        "website": commercial.get("website"),
        "specialties": commercial.get("specialties"),
        "social_links": commercial.get("social_links"),
        "logo_url": branding.get("logo_url"),
        "avatar_url": branding.get("avatar_url"),
        "cover_url": branding.get("cover_url"),
        "favicon_url": branding.get("favicon_url"),
        "primary_color": branding.get("primary_color"),
        "secondary_color": branding.get("secondary_color"),
        "public_name": branding.get("public_name") or commercial.get("commercial_name"),
        "created_at": now,
        "updated_at": now,
    }
    await db.firm_settings.insert_one(settings_doc)

    # 4) Consentimiento legal con auditoría
    ip = request.headers.get("x-forwarded-for") or (request.client.host if request.client else None)
    await db.firm_consents.insert_one({
        "firm_id": firm_id, "organization_id": firm_id, "user_id": owner_id, "user_email": email,
        "version": LEGAL_VERSION, "documents": {d: True for d in LEGAL_DOCUMENTS},
        "ip": ip, "user_agent": request.headers.get("user-agent"), "accepted_at": now,
    })

    # 5) Token de acceso (auto-ingreso, sin volver al login)
    token = create_access_token(data={"sub": email, "role": "firm_owner"})
    return {
        "success": True,
        "access_token": token,
        "token_type": "bearer",
        "firm_id": firm_id,
        "user": {"id": owner_id, "email": email, "full_name": founder.get("full_name"), "role": "firm_owner", "firm_id": firm_id},
    }

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
                    logger.error(f"Error invitando abogado {lawyer_email}: {str(e)}")
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
