"""Controller + rutas de Implementaciones — Punto Cero OS (multi-tenant).

Endpoints (prefijo global /api):
  GET    /api/implementations            lista (filtrada por tenant)
  GET    /api/implementations/dashboard  consolidado + métricas ejecutivas
  GET    /api/implementations/{id}       detalle
  POST   /api/implementations            crear  (OWNER/ADMIN/SUPER_ADMIN)
  PUT    /api/implementations/{id}        actualizar (OWNER/ADMIN/SUPER_ADMIN)
  DELETE /api/implementations/{id}        eliminar  (OWNER/ADMIN/SUPER_ADMIN)

Respuesta estándar: { success, data, message, errors }.
"""
from fastapi import APIRouter, Depends, Query
from fastapi.responses import JSONResponse
from typing import Optional

from models.implementation import ImplementationCreate, ImplementationUpdate
from utils.responses import ok, fail, OrgError
from utils.tenant import get_tenant_context, require_write
from services import implementation_service as svc

router = APIRouter(prefix="/implementations", tags=["Implementations · OS"])


async def get_db():
    from server import db
    return db


def _handle(e: OrgError):
    return JSONResponse(status_code=e.status_code, content=fail(e.message, e.errors))


@router.get("")
@router.get("/")
async def list_implementations(
    stage: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    ctx=Depends(get_tenant_context),
    db=Depends(get_db),
):
    try:
        data = await svc.list_implementations(db, ctx, stage=stage, status=status)
        return ok(data=data, message="Implementaciones obtenidas")
    except OrgError as e:
        return _handle(e)


@router.get("/dashboard")
async def implementations_dashboard(ctx=Depends(get_tenant_context), db=Depends(get_db)):
    try:
        data = await svc.get_dashboard(db, ctx)
        return ok(data=data, message="Dashboard de implementaciones")
    except OrgError as e:
        return _handle(e)


@router.get("/{impl_id}")
async def get_implementation(impl_id: str, ctx=Depends(get_tenant_context), db=Depends(get_db)):
    try:
        data = await svc.get_implementation(db, ctx, impl_id)
        return ok(data=data, message="Implementación obtenida")
    except OrgError as e:
        return _handle(e)


@router.post("/", status_code=201)
async def create_implementation(payload: ImplementationCreate, ctx=Depends(require_write), db=Depends(get_db)):
    try:
        data = await svc.create_implementation(db, ctx, payload)
        return JSONResponse(status_code=201, content=ok(data=data, message="Implementación creada"))
    except OrgError as e:
        return _handle(e)


@router.put("/{impl_id}")
async def update_implementation(impl_id: str, payload: ImplementationUpdate, ctx=Depends(require_write), db=Depends(get_db)):
    try:
        data = await svc.update_implementation(db, ctx, impl_id, payload)
        return ok(data=data, message="Implementación actualizada")
    except OrgError as e:
        return _handle(e)


@router.delete("/{impl_id}")
async def delete_implementation(impl_id: str, ctx=Depends(require_write), db=Depends(get_db)):
    try:
        await svc.delete_implementation(db, ctx, impl_id)
        return ok(data=None, message="Implementación eliminada")
    except OrgError as e:
        return _handle(e)
