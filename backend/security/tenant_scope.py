"""
Middleware de Tenant Scope — HARDENING MULTI-TENANT
═════════════════════════════════════════════════════

Valida automáticamente que organization_id en la request = user.organization_id
Previene filtración de datos entre organizaciones.

Uso:
  @router.post("/endpoint")
  async def endpoint(
      org_id: str = Depends(require_org_scope),
      current_user: dict = Depends(get_current_user),
      db = Depends(get_db)
  ):
      # org_id está garantizado que = user.organization_id
      # Puedes usarlo en queries sin validación adicional
"""

from fastapi import HTTPException, Depends, status, Query, Body
from typing import Optional
from routes.auth import get_current_user


async def require_org_scope(
    organization_id: Optional[str] = Query(None),
    org_id: Optional[str] = Query(None),
    body_org_id: Optional[str] = Body(None, embed=False),
    current_user: dict = Depends(get_current_user),
) -> str:
    """
    Valida que organization_id en la request = user.organization_id.
    
    Acepta organization_id desde:
    1. Query parameter: ?organization_id=...
    2. Query parameter (alias): ?org_id=...
    3. Body JSON: { "organization_id": ... }
    
    Levanta 403 si hay intento de acceso a otra org.
    Levanta 400 si falta organization_id (excepto admin).
    
    Returns: organization_id validado y seguro
    """
    user_org_id = current_user.get("organizationId")
    is_admin = current_user.get("role") in ["admin", "admin_general"]
    
    # Normalizar parametros (soportar múltiples nombres)
    requested_org_id = organization_id or org_id or body_org_id
    
    # Admin puede acceder a cualquier org (o global si no especifica)
    if is_admin:
        return requested_org_id  # None es válido para admin (datos globales)
    
    # No-admin REQUIERE organization_id
    if not requested_org_id:
        raise HTTPException(
            status_code=400,
            detail="organization_id requerido para acceso multi-tenant"
        )
    
    # Validar que requested_org_id = user_org_id
    if requested_org_id != user_org_id:
        raise HTTPException(
            status_code=403,
            detail="Acceso denegado: intento de acceso a otra organización"
        )
    
    return requested_org_id


async def get_org_id_from_path(
    organization_id: str,
    current_user: dict = Depends(get_current_user),
) -> str:
    """
    Valida organization_id desde path parameter (ej: /organizations/{organization_id}).
    
    Más estricto que require_org_scope: NO permite admin acceder sin validación.
    """
    user_org_id = current_user.get("organizationId")
    is_admin = current_user.get("role") in ["admin", "admin_general"]
    
    # Admin puede acceder a cualquier org
    if is_admin:
        return organization_id
    
    # No-admin DEBE tener coincidencia perfecta
    if organization_id != user_org_id:
        raise HTTPException(
            status_code=403,
            detail="Acceso denegado: no tienes acceso a esta organización"
        )
    
    return organization_id


def build_org_filter(org_id: Optional[str]) -> dict:
    """
    Construye filter MongoDB para organization_id.
    
    Si org_id es None (admin global), retorna {} (sin filtro).
    Si org_id existe, retorna {"organization_id": org_id}.
    """
    if org_id:
        return {"organization_id": org_id}
    return {}  # Admin puede ver global


def validate_org_ownership(
    resource: Optional[dict],
    current_user: dict,
    org_field: str = "organization_id"
) -> dict:
    """
    Valida que un recurso pertenezca a la org del usuario actual.
    
    Args:
        resource: Documento MongoDB (ej: commission)
        current_user: Usuario autenticado
        org_field: Nombre del campo con organization_id (default: "organization_id")
    
    Returns: El recurso si la validación pasa
    
    Raises:
        404 si recurso no existe
        403 si usuario no tiene acceso a esa org
    """
    if resource is None:
        raise HTTPException(status_code=404, detail="Recurso no encontrado")
    
    user_org_id = current_user.get("organizationId")
    is_admin = current_user.get("role") in ["admin", "admin_general"]
    resource_org_id = resource.get(org_field)
    
    # Admin siempre puede acceder
    if is_admin:
        return resource
    
    # No-admin requiere coincidencia perfecta
    if resource_org_id != user_org_id:
        raise HTTPException(
            status_code=403,
            detail="No tienes acceso a este recurso"
        )
    
    return resource
