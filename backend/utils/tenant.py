"""Contexto y seguridad multi-tenant — Punto Cero OS.

Dependencia FastAPI que valida el JWT (vía get_current_user), resuelve el
tenant activo desde la cabecera X-Tenant-ID y mapea el rol del backend al rol
del OS. Garantiza que ninguna operación se ejecute sin tenant (salvo
SUPER_ADMIN, que tiene visión cross-tenant).
"""
from typing import Optional
from fastapi import Depends, Header, HTTPException
from routes.auth import get_current_user

# Roles del OS
SUPER_ADMIN = "SUPER_ADMIN"
OWNER = "OWNER"
ADMIN = "ADMIN"
MANAGER = "MANAGER"
STAFF = "STAFF"
CLIENT = "CLIENT"

# Mapeo rol backend actual → rol OS.
APP_ROLE_TO_OS_ROLE = {
    "admin": SUPER_ADMIN,
    "admin_general": OWNER,
    "socio_comercial": ADMIN,
    "lawyer": STAFF,
    "client": CLIENT,
}

# Roles con permiso de escritura (crear/editar/eliminar).
WRITE_ROLES = {SUPER_ADMIN, OWNER, ADMIN}


def to_os_role(app_role: Optional[str]) -> str:
    return APP_ROLE_TO_OS_ROLE.get(app_role, STAFF)


async def get_tenant_context(
    x_tenant_id: Optional[str] = Header(None, alias="X-Tenant-ID"),
    x_organization_id: Optional[str] = Header(None, alias="X-Organization-ID"),
    current=Depends(get_current_user),
):
    os_role = to_os_role(current.get("role"))
    user_tenant = current.get("tenant_id") or current.get("tenantId")

    # Resolución del tenant: cabecera tiene prioridad; respaldo al del usuario.
    tenant_id = x_tenant_id or user_tenant

    if os_role != SUPER_ADMIN:
        if not tenant_id:
            raise HTTPException(status_code=400, detail="Falta la cabecera X-Tenant-ID")
        # Aislamiento: si el usuario tiene tenant asignado, debe coincidir.
        if user_tenant and x_tenant_id and str(user_tenant) != str(x_tenant_id):
            raise HTTPException(status_code=403, detail="Tenant no autorizado para este usuario")

    return {
        "user": current,
        "user_id": str(current.get("_id")),
        "os_role": os_role,
        "tenant_id": tenant_id,
        "organization_id": x_organization_id,
        "can_write": os_role in WRITE_ROLES,
        "is_super_admin": os_role == SUPER_ADMIN,
    }


def require_write(ctx=Depends(get_tenant_context)):
    """Exige rol con permiso de escritura (SUPER_ADMIN / OWNER / ADMIN)."""
    if not ctx["can_write"]:
        raise HTTPException(status_code=403, detail="Tu rol no permite esta operación")
    return ctx
