"""
Router de Onboarding y Activación - Punto Cero Legal V1.0

Gestiona el flujo post-primer-login:
- Asistente de Activación
- Selección de plan
- Confirmación de cuenta
"""
from fastapi import APIRouter, HTTPException, Depends, status
from typing import Optional
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from pydantic import BaseModel, Field

from routes.auth import get_current_user
from services.activation_service import ActivationService

router = APIRouter(prefix="/onboarding", tags=["Onboarding"])


async def get_db():
    from server import db
    return db


class PlanSelection(BaseModel):
    """Modelo para selección de plan durante onboarding"""
    plan_id: str = Field(..., description="ID del plan seleccionado")
    confirm_interest: bool = Field(default=True, description="Confirma el plan de interés mostrado")


class WizardStep(BaseModel):
    """Modelo para completar paso del wizard"""
    step: str = Field(..., description="ID del paso completado")
    data: Optional[dict] = Field(default=None, description="Datos del paso")


@router.get("/status")
async def get_onboarding_status(
    current_user = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Obtiene el estado de onboarding del usuario actual
    
    Retorna:
    - ready_for_onboarding: Si el usuario puede iniciar onboarding
    - completed: Si ya completó el onboarding
    - current_step: Paso actual del wizard
    - plan_interest: Plan de interés mostrado
    """
    user_id = str(current_user["_id"])
    
    # Verificar si el usuario tiene requires_password_change (no debería llegar aquí)
    if current_user.get("requires_password_change"):
        raise HTTPException(
            status_code=400,
            detail="Debes cambiar tu contraseña antes de iniciar el onboarding"
        )
    
    # Verificar si ya completó el onboarding
    onboarding_completed = current_user.get("onboarding_completed", False)
    
    # Obtener el paso actual
    current_step = current_user.get("onboarding_current_step", "welcome")
    
    # Obtener plan de interés (si existe)
    plan_interest = current_user.get("subscription_plan", None)
    
    # Si no tiene plan de interés, verificar si viene de una firma con plan
    if not plan_interest and current_user.get("firm_id"):
        firm = await db.firms.find_one({"_id": ObjectId(current_user["firm_id"])})
        if firm:
            plan_interest = firm.get("plan")
    
    return {
        "user_id": user_id,
        "ready_for_onboarding": current_user.get("ready_for_onboarding", False),
        "completed": onboarding_completed,
        "current_step": current_step,
        "plan_interest": plan_interest,
        "email": current_user["email"],
        "full_name": current_user["full_name"],
        "role": current_user["role"],
        "firm_id": current_user.get("firm_id")
    }


@router.post("/select-plan")
async def select_plan(
    plan_data: PlanSelection,
    current_user = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Selecciona plan durante el onboarding
    
    Flujo:
    1. Usuario ve plan de interés (del registro)
    2. Puede confirmarlo o elegir otro
    3. Se guarda la selección
    4. Continúa al siguiente paso del wizard
    """
    user_id = str(current_user["_id"])
    
    # Validar que el usuario esté listo para onboarding
    if not current_user.get("ready_for_onboarding"):
        raise HTTPException(
            status_code=400,
            detail="El usuario no está listo para onboarding"
        )
    
    # Validar que el plan sea válido (lista de planes permitidos)
    valid_plans = ["lawyer_growth", "lawyer_enterprise", "firm_growth", "firm_enterprise", "trial"]
    if plan_data.plan_id not in valid_plans:
        raise HTTPException(
            status_code=400,
            detail=f"Plan no válido. Opciones: {', '.join(valid_plans)}"
        )
    
    # Integrar con CRM - Registrar plan seleccionado
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
                status="PLAN_SELECTED",
                metadata={
                    "user_id": user_id,
                    "plan_id": plan_data.plan_id,
                    "selected_at": datetime.utcnow().isoformat()
                }
            )
            
            # Actualizar información del plan
            await CRMIntegrationService.update_plan_information(
                db=db,
                lead_id=lead_id,
                plan_id=plan_data.plan_id,
                plan_name=plan_data.plan_id
            )
            
            # Crear timeline event
            await CRMIntegrationService.create_timeline_event(
                db=db,
                event_type="PLAN_SELECTED",
                description=f"Plan seleccionado: {plan_data.plan_id}",
                lead_id=lead_id,
                metadata={
                    "user_id": user_id,
                    "plan_id": plan_data.plan_id,
                    "plan_name": plan_data.plan_id,
                    "selected_at": datetime.utcnow().isoformat()
                }
            )
    except Exception as e:
        # No fallar si la integración CRM falla
        pass

    # Actualizar usuario con el plan seleccionado
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {
            "subscription_plan": plan_data.plan_id,
            "onboarding_current_step": "payment",
            "updated_at": datetime.utcnow()
        }}
    )
    
    # Si tiene firma, actualizar el plan de la firma también
    if current_user.get("firm_id"):
        await db.firms.update_one(
            {"_id": ObjectId(current_user["firm_id"])},
            {"$set": {
                "plan": plan_data.plan_id,
                "updated_at": datetime.utcnow()
            }}
        )
    
    return {
        "success": True,
        "message": f"Plan '{plan_data.plan_id}' seleccionado exitosamente",
        "plan_id": plan_data.plan_id,
        "next_step": "payment"
    }


@router.post("/complete-wizard-step")
async def complete_wizard_step(
    step_data: WizardStep,
    current_user = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Completa un paso del wizard de onboarding
    
    Args:
        step_data: Datos del paso a completar
    """
    user_id = str(current_user["_id"])
    
    # Validar que el usuario esté listo para onboarding
    if not current_user.get("ready_for_onboarding"):
        raise HTTPException(
            status_code=400,
            detail="El usuario no está listo para onboarding"
        )
    
    # Mapa de pasos y sus siguientes pasos
    step_flow = {
        "welcome": "profile_setup",
        "profile_setup": "plan_selection",
        "plan_selection": "payment",
        "payment": "finalization"
    }
    
    current_step = step_data.step
    if current_step not in step_flow:
        raise HTTPException(
            status_code=400,
            detail=f"Paso no válido: {current_step}"
        )
    
    # Guardar datos del paso si se proporcionaron
    update_data = {
        "onboarding_current_step": step_flow[current_step],
        "updated_at": datetime.utcnow()
    }
    
    if step_data.data:
        # Guardar datos específicos del paso
        update_data[f"onboarding_data.{current_step}"] = step_data.data
    
    # Si el paso es "profile_setup", actualizar datos del perfil
    if current_step == "profile_setup" and step_data.data:
        profile_data = step_data.data
        allowed_fields = ["phone", "country", "specialty", "bar_number", "firm_name", "id_document"]
        profile_updates = {k: v for k, v in profile_data.items() if k in allowed_fields and v}
        
        if profile_updates:
            for field, value in profile_updates.items():
                update_data[field] = value
    
    # Actualizar usuario
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": update_data}
    )
    
    next_step = step_flow[current_step]
    
    return {
        "success": True,
        "message": f"Paso '{current_step}' completado",
        "current_step": current_step,
        "next_step": next_step
    }


@router.post("/complete")
async def complete_onboarding(
    current_user = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Completa el onboarding y activa la cuenta
    
    Flujo final:
    1. Verifica que todos los pasos estén completos
    2. Marca onboarding como completado
    3. Activa la cuenta completamente
    4. Redirige al Dashboard
    """
    user_id = str(current_user["_id"])
    
    # Validar que el usuario esté listo para onboarding
    if not current_user.get("ready_for_onboarding"):
        raise HTTPException(
            status_code=400,
            detail="El usuario no está listo para completar el onboarding"
        )
    
    # Completar onboarding usando el servicio
    result = await ActivationService.complete_activation_onboarding(
        db=db,
        user_id=user_id,
        selected_plan=current_user.get("subscription_plan")
    )
    
    # Marcar onboarding como completado
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {
            "onboarding_completed": True,
            "onboarding_completed_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }}
    )
    
    # Integrar con CRM - Registrar onboarding completado
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
                status="ONBOARDING_COMPLETED",
                metadata={
                    "user_id": user_id,
                    "completed_at": datetime.utcnow().isoformat(),
                    "selected_plan": current_user.get("subscription_plan")
                }
            )
            
            # Crear timeline event
            await CRMIntegrationService.create_timeline_event(
                db=db,
                event_type="ONBOARDING_COMPLETED",
                description=f"Onboarding completado por: {current_user.get('full_name')} ({current_user.get('email')})",
                lead_id=lead_id,
                metadata={
                    "user_id": user_id,
                    "email": current_user["email"],
                    "selected_plan": current_user.get("subscription_plan"),
                    "completed_at": datetime.utcnow().isoformat()
                }
            )
            
            # Registrar estado comercial previo al pago
            selected_plan = current_user.get("subscription_plan", "trial")
            
            # Obtener información del plan (precio)
            plan_prices = {
                "lawyer_growth": 99.00,
                "lawyer_enterprise": 199.00,
                "firm_growth": 299.00,
                "firm_enterprise": 499.00,
                "trial": 0.00
            }
            plan_price = plan_prices.get(selected_plan, 0.00)
            
            # Registrar PAYMENT_PENDING
            await CRMIntegrationService.register_payment_pending(
                db=db,
                email=current_user["email"],
                plan_id=selected_plan,
                plan_name=selected_plan,
                plan_price=plan_price,
                currency="USD",
                country=current_user.get("country"),
                lead_source=lead.get("source"),
                organization_id=current_user.get("organization_id"),
                lawyer_id=current_user.get("lawyer_id") or user_id,
                firm_id=current_user.get("firm_id"),
                selected_at=datetime.utcnow().isoformat()
            )
    except Exception as e:
        # No fallar si la integración CRM falla
        pass
    
    return {
        "success": True,
        "message": "Onboarding completado exitosamente. Bienvenido a Punto Cero Legal.",
        "data": result,
        "next_step": "dashboard"
    }


@router.get("/wizard")
async def get_wizard_steps(
    current_user = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Obtiene los pasos del wizard de onboarding
    
    Retorna la lista de pasos a completar según el rol del usuario
    """
    role = current_user.get("role", "lawyer")
    
    # Pasos base para todos los usuarios
    steps = [
        {
            "id": "welcome",
            "name": "Bienvenida",
            "description": "Información básica de bienvenida",
            "completed": True  # Ya pasó por el login
        },
        {
            "id": "profile_setup",
            "name": "Configuración de Perfil",
            "description": "Completa tu información profesional",
            "completed": False
        },
        {
            "id": "plan_selection",
            "name": "Selección de Plan",
            "description": "Elige el plan que mejor se adapte a tus necesidades",
            "completed": False
        },
        {
            "id": "payment",
            "name": "Pago",
            "description": "Configura tu método de pago",
            "completed": False
        },
        {
            "id": "finalization",
            "name": "Finalización",
            "description": "Últimos pasos antes de comenzar",
            "completed": False
        }
    ]
    
    # Si es firm_owner o firm_admin, agregar paso de configuración de firma
    if role in ["firm_owner", "firm_admin"]:
        steps.insert(3, {
            "id": "firm_setup",
            "name": "Configuración de Firma",
            "description": "Configura los datos de tu firma",
            "completed": False
        })
    
    # Marcar pasos completados según el progreso del usuario
    current_step = current_user.get("onboarding_current_step", "welcome")
    onboarding_completed = current_user.get("onboarding_completed", False)
    
    if onboarding_completed:
        for step in steps:
            step["completed"] = True
    else:
        # Marcar pasos anteriores al actual como completados
        step_ids = [s["id"] for s in steps]
        if current_step in step_ids:
            current_index = step_ids.index(current_step)
            for i in range(current_index):
                steps[i]["completed"] = True
    
    return {
        "steps": steps,
        "current_step": current_step,
        "completed": onboarding_completed,
        "total_steps": len(steps)
    }