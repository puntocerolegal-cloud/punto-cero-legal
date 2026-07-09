"""Controller + rutas de Facturación — Punto Cero OS (multi-tenant).

Endpoints (prefijo global /api):
  GET    /api/billing            lista (filtrada por tenant)
  GET    /api/billing/dashboard  consolidado + métricas financieras
  GET    /api/billing/{id}       detalle
  POST   /api/billing            crear  (OWNER/ADMIN/SUPER_ADMIN)
  PUT    /api/billing/{id}        actualizar (OWNER/ADMIN/SUPER_ADMIN)
  DELETE /api/billing/{id}        eliminar  (OWNER/ADMIN/SUPER_ADMIN)
  POST   /api/billing/{id}/pay    marcar pagada (OWNER/ADMIN/SUPER_ADMIN)

Respuesta estándar: { success, data, message, errors }.
"""
from fastapi import APIRouter, Depends, Query, Body
from fastapi.responses import JSONResponse
from typing import Optional

from models.billing import InvoiceCreate, InvoiceUpdate
from utils.responses import ok, fail, OrgError
from utils.tenant import get_tenant_context, require_write
from services import billing_service as svc

router = APIRouter(prefix="/billing", tags=["Billing · OS"])


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
async def list_invoices(
    status: Optional[str] = Query(None),
    source: Optional[str] = Query(None),
    ctx=Depends(get_tenant_context),
    db=Depends(get_db),
):
    try:
        data = await svc.get_invoices(db, ctx, status=status, source=source, request_id=ctx.request_id)
        return ok(data=data, message="Facturas obtenidas")
    except OrgError as e:
        return _handle(e)


@router.get("/dashboard")
async def billing_dashboard(ctx=Depends(get_tenant_context), db=Depends(get_db)):
    try:
        data = await svc.get_dashboard(db, ctx, request_id=ctx.request_id)
        return ok(data=data, message="Dashboard de facturación")
    except OrgError as e:
        return _handle(e)


@router.get("/{invoice_id}")
async def get_invoice(invoice_id: str, ctx=Depends(get_tenant_context), db=Depends(get_db)):
    try:
        data = await svc.get_invoice(db, ctx, invoice_id, request_id=ctx.request_id)
        return ok(data=data, message="Factura obtenida")
    except OrgError as e:
        return _handle(e)


@router.post("/", status_code=201)
async def create_invoice(payload: InvoiceCreate, ctx=Depends(require_write), db=Depends(get_db)):
    try:
        data = await svc.create_invoice(db, ctx, payload, request_id=ctx.request_id)
        return JSONResponse(status_code=201, content=ok(data=data, message="Factura creada"))
    except OrgError as e:
        return _handle(e)


@router.put("/{invoice_id}")
async def update_invoice(invoice_id: str, payload: InvoiceUpdate, ctx=Depends(require_write), db=Depends(get_db)):
    try:
        data = await svc.update_invoice(db, ctx, invoice_id, payload, request_id=ctx.request_id)
        return ok(data=data, message="Factura actualizada")
    except OrgError as e:
        return _handle(e)


@router.delete("/{invoice_id}")
async def delete_invoice(invoice_id: str, ctx=Depends(require_write), db=Depends(get_db)):
    try:
        await svc.delete_invoice(db, ctx, invoice_id, request_id=ctx.request_id)
        return ok(data=None, message="Factura eliminada")
    except OrgError as e:
        return _handle(e)


@router.post("/{invoice_id}/pay")
async def pay_invoice(
    invoice_id: str,
    paymentMethod: Optional[str] = Body(None, embed=True),
    paidDate: Optional[str] = Body(None, embed=True),
    ctx=Depends(require_write),
    db=Depends(get_db),
):
    try:
        data = await svc.pay_invoice(db, ctx, invoice_id, payment_method=paymentMethod, paid_date=paidDate, request_id=ctx.request_id)
        return ok(data=data, message="Factura pagada")
    except OrgError as e:
        return _handle(e)
