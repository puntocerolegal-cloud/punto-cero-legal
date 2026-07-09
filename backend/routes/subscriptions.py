"""Controller + rutas de Suscripciones — Punto Cero OS (multi-tenant).

Endpoints (prefijo global /api):
  GET    /api/subscriptions            lista (filtrada por tenant)
  GET    /api/subscriptions/dashboard  consolidado + métricas SaaS
  GET    /api/subscriptions/{id}       detalle
  POST   /api/subscriptions            crear  (OWNER/ADMIN/SUPER_ADMIN)
  PUT    /api/subscriptions/{id}        actualizar (OWNER/ADMIN/SUPER_ADMIN)
  DELETE /api/subscriptions/{id}        eliminar  (OWNER/ADMIN/SUPER_ADMIN)
  POST   /api/subscriptions/{id}/renew renovar (OWNER/ADMIN/SUPER_ADMIN)

Respuesta estándar: { success, data, message, errors }.
"""
from fastapi import APIRouter, Depends, Query, Body
from fastapi.responses import JSONResponse
from typing import Optional

from models.os_subscription import SubscriptionCreate, SubscriptionUpdate
from utils.responses import ok, fail, OrgError
from utils.tenant import get_tenant_context, require_write
from services import subscription_service as svc

router = APIRouter(prefix="/subscriptions", tags=["Subscriptions · OS"])


async def get_db():
    from server import db
    # Bypass GuardedDB for direct-access routes; tenant isolation is enforced
    # via get_current_user + explicit firm filtering (same pattern as routes/auth.py).
    if hasattr(db, "_real_db"):
        return db._real_db
    return db


def _handle(e: OrgError):
    return JSONResponse(status_code=e.status_code, content=fail(e.message, e.errors))


@router.get("")
@router.get("/")
async def list_subscriptions(
    status: Optional[str] = Query(None),
    plan: Optional[str] = Query(None),
    ctx=Depends(get_tenant_context),
    db=Depends(get_db),
):
    try:
        data = await svc.list_subscriptions(db, ctx, status=status, plan=plan)
        return ok(data=data, message="Suscripciones obtenidas")
    except OrgError as e:
        return _handle(e)


@router.get("/dashboard")
async def subscriptions_dashboard(ctx=Depends(get_tenant_context), db=Depends(get_db)):
    try:
        data = await svc.get_dashboard(db, ctx)
        return ok(data=data, message="Dashboard de suscripciones")
    except OrgError as e:
        return _handle(e)


@router.get("/{sub_id}")
async def get_subscription(sub_id: str, ctx=Depends(get_tenant_context), db=Depends(get_db)):
    try:
        data = await svc.get_subscription(db, ctx, sub_id)
        return ok(data=data, message="Suscripción obtenida")
    except OrgError as e:
        return _handle(e)


@router.post("/", status_code=201)
async def create_subscription(payload: SubscriptionCreate, ctx=Depends(require_write), db=Depends(get_db)):
    try:
        data = await svc.create_subscription(db, ctx, payload)
        return JSONResponse(status_code=201, content=ok(data=data, message="Suscripción creada"))
    except OrgError as e:
        return _handle(e)


@router.put("/{sub_id}")
async def update_subscription(sub_id: str, payload: SubscriptionUpdate, ctx=Depends(require_write), db=Depends(get_db)):
    try:
        data = await svc.update_subscription(db, ctx, sub_id, payload)
        return ok(data=data, message="Suscripción actualizada")
    except OrgError as e:
        return _handle(e)


@router.delete("/{sub_id}")
async def delete_subscription(sub_id: str, ctx=Depends(require_write), db=Depends(get_db)):
    try:
        await svc.delete_subscription(db, ctx, sub_id)
        return ok(data=None, message="Suscripción eliminada")
    except OrgError as e:
        return _handle(e)


@router.post("/{sub_id}/renew")
async def renew_subscription(
    sub_id: str,
    renewalDate: Optional[str] = Body(None, embed=True),
    ctx=Depends(require_write),
    db=Depends(get_db),
):
    try:
        data = await svc.renew_subscription(db, ctx, sub_id, renewal_date=renewalDate)
        return ok(data=data, message="Suscripción renovada")
    except OrgError as e:
        return _handle(e)
