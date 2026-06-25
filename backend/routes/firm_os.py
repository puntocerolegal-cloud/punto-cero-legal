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
        if onboarding_data.get("invited_lawyers"):
            for lawyer_email in onboarding_data["invited_lawyers"]:
                # Aquí se enviaría email de invitación
                pass

        return {
            "success": True,
            "message": "Onboarding completado"
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
            "visibility_public": settings_data.get("visibility_public", False),
            "updated_at": datetime.utcnow()
        }

        await db.firms.update_one(
            {"_id": ObjectId(firm_id)},
            {"$set": update_data}
        )

        return {
            "success": True,
            "message": "Configuración actualizada"
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
    """Obtener listado público de firmas activas"""
    try:
        firms = await db.firms.find({
            "status": "ACTIVE",
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
            "status": "ACTIVE"
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
