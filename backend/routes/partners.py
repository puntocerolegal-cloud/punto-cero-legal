"""Controller + rutas de Partners (Socios Comerciales) — Punto Cero OS.

Endpoints (prefijo global /api):
  GET    /api/partners            lista (filtrada por tenant)
  GET    /api/partners/dashboard  consolidado para el frontend
  GET    /api/partners/{id}       detalle
  POST   /api/partners            crear  (OWNER/ADMIN/SUPER_ADMIN)
  PUT    /api/partners/{id}       actualizar (OWNER/ADMIN/SUPER_ADMIN)
  DELETE /api/partners/{id}       eliminar  (OWNER/ADMIN/SUPER_ADMIN)

Respuesta estándar: { success, data, message, errors }.
"""
from fastapi import APIRouter, Depends, Query
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from typing import Optional

from models.partner import PartnerCreate, PartnerUpdate
from utils.responses import ok, fail, OrgError
from utils.tenant import get_tenant_context, require_write
from services import partner_service as svc

router = APIRouter(prefix="/partners", tags=["Partners · OS"])


async def get_db():
    from server import db
    return db


def _handle(e: OrgError):
    return JSONResponse(status_code=e.status_code, content=fail(e.message, e.errors))


@router.get("")
@router.get("/")
async def list_partners(
    status: Optional[str] = Query(None),
    stage: Optional[str] = Query(None),
    ctx=Depends(get_tenant_context),
    db=Depends(get_db),
):
    try:
        data = await svc.list_partners(db, ctx, status=status, stage=stage)
        return ok(data=data, message="Partners obtenidos")
    except OrgError as e:
        return _handle(e)


@router.get("/dashboard")
async def partners_dashboard(ctx=Depends(get_tenant_context), db=Depends(get_db)):
    try:
        data = await svc.get_dashboard(db, ctx)
        return ok(data=data, message="Dashboard de partners")
    except OrgError as e:
        return _handle(e)


@router.get("/{partner_id}")
async def get_partner(partner_id: str, ctx=Depends(get_tenant_context), db=Depends(get_db)):
    try:
        data = await svc.get_partner(db, ctx, partner_id)
        return ok(data=data, message="Partner obtenido")
    except OrgError as e:
        return _handle(e)


@router.post("/", status_code=201)
async def create_partner(payload: PartnerCreate, ctx=Depends(require_write), db=Depends(get_db)):
    try:
        data = await svc.create_partner(db, ctx, payload)
        # jsonable_encoder serializa datetime (createdAt/updatedAt); JSONResponse
        # crudo no lo hace y rompía con TypeError → 500.
        return JSONResponse(status_code=201, content=jsonable_encoder(ok(data=data, message="Partner creado")))
    except OrgError as e:
        return _handle(e)


@router.put("/{partner_id}")
async def update_partner(partner_id: str, payload: PartnerUpdate, ctx=Depends(require_write), db=Depends(get_db)):
    try:
        data = await svc.update_partner(db, ctx, partner_id, payload)
        return ok(data=data, message="Partner actualizado")
    except OrgError as e:
        return _handle(e)


@router.delete("/{partner_id}")
async def delete_partner(partner_id: str, ctx=Depends(require_write), db=Depends(get_db)):
    try:
        await svc.delete_partner(db, ctx, partner_id)
        return ok(data=None, message="Partner eliminado")
    except OrgError as e:
        return _handle(e)
