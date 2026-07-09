"""Controller + rutas de Analytics — Punto Cero OS (solo lectura, multi-tenant).

Capa consolidada: agrega organizations/partners/implementations/os_subscriptions/
billing en tiempo real. NO escribe datos (todos los endpoints son GET).

Endpoints (prefijo global /api):
  GET /api/analytics/dashboard
  GET /api/analytics/kpis
  GET /api/analytics/revenue
  GET /api/analytics/growth
  GET /api/analytics/funnel
  GET /api/analytics/verticals
  GET /api/analytics/insights

Respuesta estándar: { success, data, message, errors }.
"""
from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse

from utils.responses import ok, fail, OrgError
from utils.tenant import get_tenant_context
from services import analytics_service as svc

router = APIRouter(prefix="/analytics", tags=["Analytics · OS"])


async def get_db():
    from server import db
    # Bypass GuardedDB for direct-access routes; tenant isolation is enforced
    # via get_current_user + explicit firm filtering (same pattern as routes/auth.py).
    if hasattr(db, "_real_db"):
        return db._real_db
    return db


def _handle(e: OrgError):
    return JSONResponse(status_code=e.status_code, content=fail(e.message, e.errors))


@router.get("/dashboard")
async def analytics_dashboard(ctx=Depends(get_tenant_context), db=Depends(get_db)):
    try:
        return ok(data=await svc.get_dashboard(db, ctx), message="Dashboard de analytics")
    except OrgError as e:
        return _handle(e)


@router.get("/kpis")
async def analytics_kpis(ctx=Depends(get_tenant_context), db=Depends(get_db)):
    try:
        return ok(data=await svc.get_kpis(db, ctx), message="KPIs de analytics")
    except OrgError as e:
        return _handle(e)


@router.get("/revenue")
async def analytics_revenue(ctx=Depends(get_tenant_context), db=Depends(get_db)):
    try:
        return ok(data=await svc.get_revenue_metrics(db, ctx), message="Analítica de ingresos")
    except OrgError as e:
        return _handle(e)


@router.get("/growth")
async def analytics_growth(ctx=Depends(get_tenant_context), db=Depends(get_db)):
    try:
        return ok(data=await svc.get_growth_metrics(db, ctx), message="Analítica de crecimiento")
    except OrgError as e:
        return _handle(e)


@router.get("/funnel")
async def analytics_funnel(ctx=Depends(get_tenant_context), db=Depends(get_db)):
    try:
        return ok(data=await svc.get_funnel_metrics(db, ctx), message="Embudo operativo")
    except OrgError as e:
        return _handle(e)


@router.get("/verticals")
async def analytics_verticals(ctx=Depends(get_tenant_context), db=Depends(get_db)):
    try:
        return ok(data=await svc.get_vertical_performance(db, ctx), message="Performance por vertical")
    except OrgError as e:
        return _handle(e)


@router.get("/insights")
async def analytics_insights(ctx=Depends(get_tenant_context), db=Depends(get_db)):
    try:
        return ok(data=await svc.get_executive_insights(db, ctx), message="Executive insights")
    except OrgError as e:
        return _handle(e)
