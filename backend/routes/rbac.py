from fastapi import APIRouter, HTTPException, Depends, status
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorDatabase
from models.rbac import (
    FirmRole, Permission, Module, RolePermission, UserRole,
    ROLE_PERMISSIONS, get_role_permissions, check_permission
)
from routes.auth import get_current_user
from utils.rbac import PermissionValidator, verify_firm_access
from bson import ObjectId

router = APIRouter(prefix="/rbac", tags=["RBAC - Roles & Permissions"])


async def get_db():
    from server import db
    return db


# GET /rbac/roles - Listar todos los roles disponibles
@router.get("/roles", status_code=status.HTTP_200_OK)
async def list_roles(
    current_user: dict = Depends(get_current_user),
):
    """Obtener lista de roles disponibles con sus permisos"""
    roles_data = []
    
    for role, details in ROLE_PERMISSIONS.items():
        roles_data.append({
            "id": role.value,
            "name": role.value.replace("_", " ").title(),
            "description": details.get("description", ""),
            "permissions_count": len(details.get("permissions", [])),
            "modules": [m.value for m in details.get("modules", [])],
        })
    
    return {
        "success": True,
        "data": roles_data,
        "count": len(roles_data)
    }


# GET /rbac/roles/:role_id/permissions - Obtener permisos de un rol
@router.get("/roles/{role_id}/permissions", status_code=status.HTTP_200_OK)
async def get_role_permissions_endpoint(
    role_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Obtener lista completa de permisos de un rol"""
    try:
        role = FirmRole(role_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Rol inválido")
    
    perms = get_role_permissions(role)
    
    return {
        "success": True,
        "role": role.value,
        "permissions": [p.value for p in perms.get("permissions", [])],
        "modules": [m.value for m in perms.get("modules", [])],
    }


# POST /rbac/users/:user_id/assign-role - Asignar rol a usuario
@router.post("/users/{user_id}/assign-role", status_code=status.HTTP_200_OK)
async def assign_role_to_user(
    user_id: str,
    role_data: dict,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Asignar un rol a un usuario dentro de una firma"""
    # Solo firm_owner puede asignar roles
    if current_user.get("role") != "firm_owner":
        raise HTTPException(
            status_code=403,
            detail="Solo firm_owner puede asignar roles"
        )
    
    firm_id = current_user.get("firm_id")
    role_name = role_data.get("role")
    
    if not role_name:
        raise HTTPException(status_code=400, detail="Rol requerido")
    
    try:
        role = FirmRole(role_name)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Rol inválido: {role_name}")
    
    # Verificar que el usuario existe en la firma
    try:
        user_oid = ObjectId(user_id)
    except:
        raise HTTPException(status_code=400, detail="ID de usuario inválido")
    
    user = await db.users.find_one({"_id": user_oid})
    if not user or user.get("firm_id") != firm_id:
        raise HTTPException(status_code=404, detail="Usuario no encontrado en esta firma")
    
    # Actualizar rol del usuario
    await db.users.update_one(
        {"_id": user_oid},
        {"$set": {
            "role": role.value,
            "updated_at": datetime.utcnow()
        }}
    )
    
    # Registrar cambio de rol
    if hasattr(db, "role_assignments"):
        await db.role_assignments.insert_one({
            "firm_id": firm_id,
            "user_id": user_id,
            "role": role.value,
            "assigned_by": str(current_user.get("_id")),
            "assigned_at": datetime.utcnow(),
        })
    
    return {
        "success": True,
        "message": f"Rol {role.value} asignado a usuario {user_id}",
        "user_id": user_id,
        "role": role.value
    }


# GET /rbac/users/:user_id/permissions - Obtener permisos de un usuario
@router.get("/users/{user_id}/permissions", status_code=status.HTTP_200_OK)
async def get_user_permissions(
    user_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Obtener todos los permisos de un usuario basado en su rol"""
    firm_id = current_user.get("firm_id")
    
    try:
        target_user_oid = ObjectId(user_id)
    except:
        raise HTTPException(status_code=400, detail="ID de usuario inválido")
    
    user = await db.users.find_one({"_id": target_user_oid})
    if not user or (user.get("firm_id") != firm_id and current_user.get("role") not in ["admin", "admin_general"]):
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    user_role = user.get("role")
    
    try:
        role = FirmRole(user_role)
    except ValueError:
        return {
            "success": True,
            "user_id": user_id,
            "role": user_role,
            "permissions": [],
            "modules": []
        }
    
    perms = get_role_permissions(role)
    
    return {
        "success": True,
        "user_id": user_id,
        "user_email": user.get("email"),
        "user_name": user.get("full_name"),
        "role": user_role,
        "permissions": [p.value for p in perms.get("permissions", [])],
        "modules": [m.value for m in perms.get("modules", [])],
    }


# GET /rbac/users/:user_id/check-permission - Verificar un permiso específico
@router.get("/users/{user_id}/check-permission/{permission}", status_code=status.HTTP_200_OK)
async def check_user_permission(
    user_id: str,
    permission: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Verificar si un usuario tiene un permiso específico"""
    firm_id = current_user.get("firm_id")
    
    try:
        target_user_oid = ObjectId(user_id)
    except:
        raise HTTPException(status_code=400, detail="ID de usuario inválido")
    
    user = await db.users.find_one({"_id": target_user_oid})
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    try:
        perm = Permission(permission)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Permiso inválido: {permission}")
    
    user_role = user.get("role")
    
    try:
        role = FirmRole(user_role)
    except ValueError:
        has_perm = False
    else:
        has_perm = check_permission(role, perm)
    
    return {
        "success": True,
        "user_id": user_id,
        "role": user_role,
        "permission": permission,
        "has_permission": has_perm
    }


# GET /rbac/matrix - Obtener matriz completa de permisos
@router.get("/matrix", status_code=status.HTTP_200_OK)
async def get_permission_matrix(
    current_user: dict = Depends(get_current_user),
):
    """Obtener matriz completa: roles × permisos × módulos"""
    # Solo firm_owner o admin
    if current_user.get("role") not in ["firm_owner", "admin", "admin_general"]:
        raise HTTPException(status_code=403, detail="No tienes acceso a esta información")
    
    matrix = {}
    
    for role, details in ROLE_PERMISSIONS.items():
        matrix[role.value] = {
            "description": details.get("description", ""),
            "permissions": [p.value for p in details.get("permissions", [])],
            "modules": [m.value for m in details.get("modules", [])],
            "permissions_count": len(details.get("permissions", [])),
            "modules_count": len(details.get("modules", [])),
        }
    
    return {
        "success": True,
        "matrix": matrix,
        "total_roles": len(matrix),
        "all_permissions": [p.value for p in Permission],
        "all_modules": [m.value for m in Module],
    }


# GET /rbac/team/:firm_id - Listar equipo con roles
@router.get("/team/{firm_id}", status_code=status.HTTP_200_OK)
async def get_team_with_roles(
    firm_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Obtener equipo de una firma con sus roles"""
    if not verify_firm_access(current_user, firm_id):
        raise HTTPException(status_code=403, detail="No tienes acceso a esta firma")
    
    try:
        firm_oid = ObjectId(firm_id)
    except:
        raise HTTPException(status_code=400, detail="ID de firma inválido")
    
    users = await db.users.find({"firm_id": firm_id}).to_list(None)
    
    team_data = []
    for user in users:
        user_role = user.get("role")
        perms = get_role_permissions(FirmRole(user_role)) if user_role in [r.value for r in FirmRole] else {}
        
        team_data.append({
            "id": str(user["_id"]),
            "name": user.get("full_name"),
            "email": user.get("email"),
            "role": user_role,
            "status": user.get("status"),
            "permissions_count": len(perms.get("permissions", [])),
            "joined_at": user.get("created_at"),
        })
    
    return {
        "success": True,
        "firm_id": firm_id,
        "team": sorted(team_data, key=lambda x: x["name"]),
        "count": len(team_data)
    }
