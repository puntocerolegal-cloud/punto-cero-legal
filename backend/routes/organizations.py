"""Controller + rutas de Organizaciones — Punto Cero OS (multi-tenant).

Endpoints (prefijo global /api):
  GET    /api/organizations           lista (filtrada por tenant)
  GET    /api/organizations/dashboard consolidado para el frontend
  GET    /api/organizations/{id}       detalle
  POST   /api/organizations           crear  (OWNER/ADMIN/SUPER_ADMIN)
  PUT    /api/organizations/{id}       actualizar (OWNER/ADMIN/SUPER_ADMIN)
  DELETE /api/organizations/{id}       eliminar  (OWNER/ADMIN/SUPER_ADMIN)

Respuesta estándar: { success, data, message, errors }.
"""
from fastapi import APIRouter, Depends, Query
from fastapi.responses import JSONResponse
from typing import Optional

from models.organization import OrganizationCreate, OrganizationUpdate
from utils.responses import ok, fail, OrgError
from utils.tenant import get_tenant_context, require_write
from services import organization_service as svc

router = APIRouter(prefix="/organizations", tags=["Organizations · OS"])


async def get_db():
    from server import db
    return db


def _handle(e: OrgError):
    return JSONResponse(status_code=e.status_code, content=fail(e.message, e.errors))


@router.get("")
@router.get("/")
async def list_organizations(
    status: Optional[str] = Query(None),
    ctx=Depends(get_tenant_context),
    db=Depends(get_db),
):
    try:
        data = await svc.get_organizations(db, ctx, status=status)
        return ok(data=data, message="Organizaciones obtenidas")
    except OrgError as e:
        return _handle(e)


@router.get("/dashboard")
async def organizations_dashboard(ctx=Depends(get_tenant_context), db=Depends(get_db)):
    try:
        data = await svc.get_dashboard(db, ctx)
        return ok(data=data, message="Dashboard de organizaciones")
    except OrgError as e:
        return _handle(e)


@router.get("/{org_id}")
async def get_organization(org_id: str, ctx=Depends(get_tenant_context), db=Depends(get_db)):
    try:
        data = await svc.get_organization(db, ctx, org_id)
        return ok(data=data, message="Organización obtenida")
    except OrgError as e:
        return _handle(e)


@router.post("/", status_code=201)
async def create_organization(
    payload: OrganizationCreate,
    ctx=Depends(require_write),
    db=Depends(get_db),
):
    try:
        data = await svc.create_organization(db, ctx, payload)
        return JSONResponse(status_code=201, content=ok(data=data, message="Organización creada"))
    except OrgError as e:
        return _handle(e)


@router.put("/{org_id}")
async def update_organization(
    org_id: str,
    payload: OrganizationUpdate,
    ctx=Depends(require_write),
    db=Depends(get_db),
):
    try:
        data = await svc.update_organization(db, ctx, org_id, payload)
        return ok(data=data, message="Organización actualizada")
    except OrgError as e:
        return _handle(e)


@router.delete("/{org_id}")
async def delete_organization(
    org_id: str,
    ctx=Depends(require_write),
    db=Depends(get_db),
):
    try:
        await svc.delete_organization(db, ctx, org_id)
        return ok(data=None, message="Organización eliminada")
    except OrgError as e:
        return _handle(e)
