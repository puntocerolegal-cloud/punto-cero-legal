from fastapi import APIRouter, HTTPException, Depends, status
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorDatabase
from routes.auth import get_current_user
from utils.rbac import verify_firm_access, PermissionValidator
from bson import ObjectId

router = APIRouter(prefix="/team", tags=["Team Management - Firm OS"])


async def get_db():
    from server import db
    return db


# PATCH /team/{user_id}/status - Suspender o reactivar miembro
@router.patch("/{user_id}/status", status_code=status.HTTP_200_OK)
async def update_user_status(
    user_id: str,
    status_data: dict,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Cambiar estado de un miembro (suspend/reactivate)"""
    firm_id = current_user.get("firm_id")
    new_status = status_data.get("status")

    # Validar que sea authorized
    if not PermissionValidator.can_manage_team(current_user):
        raise HTTPException(status_code=403, detail="No tienes permiso para gestionar el equipo")

    if not new_status or new_status not in ["suspended", "ACTIVE"]:
        raise HTTPException(status_code=400, detail="Estado inválido")

    try:
        user_oid = ObjectId(user_id)
    except:
        raise HTTPException(status_code=400, detail="ID de usuario inválido")

    user = await db.users.find_one({"_id": user_oid})
    if not user or user.get("firm_id") != firm_id:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # Actualizar estado
    await db.users.update_one(
        {"_id": user_oid},
        {"$set": {
            "status": new_status,
            "updated_at": datetime.utcnow()
        }}
    )

    # Registrar cambio en auditoría
    if hasattr(db, "team_audit_log"):
        await db.team_audit_log.insert_one({
            "firm_id": firm_id,
            "user_id": user_id,
            "action": "status_change",
            "old_status": user.get("status"),
            "new_status": new_status,
            "changed_by": str(current_user.get("_id")),
            "changed_at": datetime.utcnow(),
        })

    return {
        "success": True,
        "message": f"Estado actualizado a {new_status}",
        "user_id": user_id,
        "status": new_status
    }


# PATCH /team/{user_id}/practice-area - Asignar área de práctica
@router.patch("/{user_id}/practice-area", status_code=status.HTTP_200_OK)
async def update_practice_area(
    user_id: str,
    area_data: dict,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Asignar área de práctica a un abogado"""
    firm_id = current_user.get("firm_id")
    practice_area = area_data.get("practice_area")

    if not PermissionValidator.can_manage_team(current_user):
        raise HTTPException(status_code=403, detail="No tienes permiso")

    try:
        user_oid = ObjectId(user_id)
    except:
        raise HTTPException(status_code=400, detail="ID de usuario inválido")

    user = await db.users.find_one({"_id": user_oid})
    if not user or user.get("firm_id") != firm_id:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # Actualizar área de práctica
    await db.users.update_one(
        {"_id": user_oid},
        {"$set": {
            "practice_area": practice_area,
            "updated_at": datetime.utcnow()
        }}
    )

    return {
        "success": True,
        "message": "Área de práctica actualizada",
        "user_id": user_id,
        "practice_area": practice_area
    }


# PATCH /team/{user_id}/supervisor - Asignar supervisor
@router.patch("/{user_id}/supervisor", status_code=status.HTTP_200_OK)
async def assign_supervisor(
    user_id: str,
    supervisor_data: dict,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Asignar supervisor a un abogado"""
    firm_id = current_user.get("firm_id")
    supervisor_id = supervisor_data.get("supervisor_id")

    if not PermissionValidator.can_manage_team(current_user):
        raise HTTPException(status_code=403, detail="No tienes permiso")

    try:
        user_oid = ObjectId(user_id)
    except:
        raise HTTPException(status_code=400, detail="ID de usuario inválido")

    # Verificar que el usuario existe
    user = await db.users.find_one({"_id": user_oid})
    if not user or user.get("firm_id") != firm_id:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # Verificar que supervisor existe y tiene rol permitido
    if supervisor_id:
        try:
            supervisor_oid = ObjectId(supervisor_id)
        except:
            raise HTTPException(status_code=400, detail="ID de supervisor inválido")

        supervisor = await db.users.find_one({"_id": supervisor_oid})
        if not supervisor or supervisor.get("firm_id") != firm_id:
            raise HTTPException(status_code=404, detail="Supervisor no encontrado")

        # Validar que supervisor tenga rol adecuado
        valid_roles = ["firm_owner", "partner", "senior_lawyer"]
        if supervisor.get("role") not in valid_roles:
            raise HTTPException(status_code=400, detail="Supervisor debe ser Partner o Senior Lawyer")

    # Actualizar supervisor
    await db.users.update_one(
        {"_id": user_oid},
        {"$set": {
            "supervisor_id": supervisor_id,
            "supervisor_name": supervisor.get("full_name") if supervisor_id else None,
            "updated_at": datetime.utcnow()
        }}
    )

    # Registrar en auditoría
    if hasattr(db, "team_audit_log"):
        await db.team_audit_log.insert_one({
            "firm_id": firm_id,
            "user_id": user_id,
            "action": "supervisor_assignment",
            "supervisor_id": supervisor_id,
            "assigned_by": str(current_user.get("_id")),
            "assigned_at": datetime.utcnow(),
        })

    return {
        "success": True,
        "message": "Supervisor asignado",
        "user_id": user_id,
        "supervisor_id": supervisor_id
    }


# GET /team/{user_id}/metrics - Obtener métricas de un miembro
@router.get("/{user_id}/metrics", status_code=status.HTTP_200_OK)
async def get_member_metrics(
    user_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Obtener métricas de desempeño de un miembro"""
    firm_id = current_user.get("firm_id")

    try:
        user_oid = ObjectId(user_id)
    except:
        raise HTTPException(status_code=400, detail="ID de usuario inválido")

    user = await db.users.find_one({"_id": user_oid})
    if not user or (user.get("firm_id") != firm_id and current_user.get("role") not in ["admin", "admin_general"]):
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # Obtener casos asignados
    cases = await db.cases.find({"lawyers_assigned": user_id}).to_list(None)
    active_cases = [c for c in cases if c.get("status") in ["open", "in_progress"]]
    closed_cases = [c for c in cases if c.get("status") == "closed"]

    # Calcular ingresos
    commissions = await db.commissions.find({
        "lawyer_id": user_id
    }).to_list(None) if hasattr(db, "commissions") else []
    
    total_revenue = sum(c.get("amount", 0) for c in commissions)

    return {
        "success": True,
        "user_id": user_id,
        "user_name": user.get("full_name"),
        "metrics": {
            "total_cases": len(cases),
            "active_cases": len(active_cases),
            "closed_cases": len(closed_cases),
            "total_revenue": round(total_revenue, 2),
            "joined_at": user.get("created_at"),
            "status": user.get("status")
        }
    }


# GET /team/stats/{firm_id} - Estadísticas del equipo
@router.get("/stats/{firm_id}", status_code=status.HTTP_200_OK)
async def get_team_stats(
    firm_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Obtener estadísticas del equipo completo"""
    if not verify_firm_access(current_user, firm_id):
        raise HTTPException(status_code=403, detail="No tienes acceso a esta firma")

    users = await db.users.find({"firm_id": firm_id}).to_list(None)

    # Agrupar por estado
    active = [u for u in users if u.get("status") in ["ACTIVE", "active"]]
    suspended = [u for u in users if u.get("status") in ["suspended", "SUSPENDED"]]

    # Agrupar por rol
    by_role = {}
    for user in users:
        role = user.get("role", "unknown")
        by_role[role] = by_role.get(role, 0) + 1

    # Casos totales del equipo
    lawyer_ids = [str(u.get("_id")) for u in users]
    all_cases = await db.cases.find({"lawyers_assigned": {"$in": lawyer_ids}}).to_list(None) if lawyer_ids else []
    active_cases = [c for c in all_cases if c.get("status") in ["open", "in_progress"]]

    return {
        "success": True,
        "firm_id": firm_id,
        "stats": {
            "total_members": len(users),
            "active_members": len(active),
            "suspended_members": len(suspended),
            "by_role": by_role,
            "total_cases": len(all_cases),
            "active_cases": len(active_cases)
        }
    }
