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
from fastapi import APIRouter, Depends, Query, HTTPException, status
from fastapi.responses import JSONResponse
from typing import Optional
from datetime import datetime
from bson import ObjectId

from models.organization import OrganizationCreate, OrganizationUpdate
from models.user import UserCreate
from utils.responses import ok, fail, OrgError
from utils.tenant import get_tenant_context, require_write
from utils.auth import get_password_hash
from services import organization_service as svc
from routes.auth import get_current_user

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


# ─────────────────────────────────────────────────────
# FASE 6: Endpoints para gestión de firmas jurídicas
# ─────────────────────────────────────────────────────

@router.get("/{org_id}/lawyers")
async def list_firm_lawyers(
    org_id: str,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    """Listar abogados asociados a una firma."""
    try:
        if not ObjectId.is_valid(org_id):
            raise HTTPException(status_code=404, detail="Organización no encontrada")

        # Verificar que la organización existe
        org = await db.organizations.find_one({"_id": ObjectId(org_id)})
        if not org:
            raise HTTPException(status_code=404, detail="Organización no encontrada")

        # Verificar permisos: solo admin de la firma o super_admin
        user_id = str(current_user["_id"])
        if str(org.get("ownerId")) != user_id and current_user.get("role") not in ["admin", "admin_general"]:
            raise HTTPException(status_code=403, detail="No autorizado")

        # Buscar todos los abogados con organizationId == org_id
        lawyers = await db.users.find({
            "organizationId": org_id,
            "role": "lawyer"
        }).to_list(None)

        for lawyer in lawyers:
            lawyer["_id"] = str(lawyer["_id"])

        return ok(data=lawyers, message=f"Abogados de la firma obtenidos ({len(lawyers)} total)")
    except HTTPException:
        raise
    except Exception as e:
        return JSONResponse(status_code=500, content=fail(str(e)))


@router.post("/{org_id}/lawyers", status_code=201)
async def create_firm_lawyer(
    org_id: str,
    lawyer_data: dict,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    """Crear un abogado asociado a una firma."""
    try:
        if not ObjectId.is_valid(org_id):
            raise HTTPException(status_code=404, detail="Organización no encontrada")

        org = await db.organizations.find_one({"_id": ObjectId(org_id)})
        if not org:
            raise HTTPException(status_code=404, detail="Organización no encontrada")

        # Verificar permisos: solo admin de la firma
        user_id = str(current_user["_id"])
        if str(org.get("ownerId")) != user_id and current_user.get("role") not in ["admin", "admin_general"]:
            raise HTTPException(status_code=403, detail="No autorizado")

        # Verificar que el email no existe
        existing = await db.users.find_one({"email": lawyer_data.get("email")})
        if existing:
            raise HTTPException(status_code=400, detail="Este email ya está registrado")

        # Crear nuevo abogado
        new_lawyer = {
            "email": lawyer_data.get("email"),
            "full_name": lawyer_data.get("full_name"),
            "role": "lawyer",
            "specialty": lawyer_data.get("specialty"),
            "bar_number": lawyer_data.get("bar_number"),
            "organizationId": org_id,
            "status": "PENDING_VERIFICATION",
            "is_verified": False,
            "password_hash": None,  # Will be set after email verification
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }

        result = await db.users.insert_one(new_lawyer)
        new_lawyer["_id"] = str(result.inserted_id)

        return JSONResponse(
            status_code=201,
            content=ok(data=new_lawyer, message="Abogado creado exitosamente")
        )
    except HTTPException:
        raise
    except Exception as e:
        return JSONResponse(status_code=500, content=fail(str(e)))


@router.get("/{org_id}/dashboard")
async def firm_dashboard(
    org_id: str,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    """Dashboard consolidado de una firma jurídica."""
    try:
        if not ObjectId.is_valid(org_id):
            raise HTTPException(status_code=404, detail="Organización no encontrada")

        org = await db.organizations.find_one({"_id": ObjectId(org_id)})
        if not org:
            raise HTTPException(status_code=404, detail="Organización no encontrada")

        # Verificar permisos
        user_id = str(current_user["_id"])
        if str(org.get("ownerId")) != user_id and current_user.get("role") not in ["admin", "admin_general"]:
            raise HTTPException(status_code=403, detail="No autorizado")

        # Contar abogados
        lawyers = await db.users.find({
            "organizationId": org_id,
            "role": "lawyer"
        }).to_list(None)

        lawyer_ids = [str(l["_id"]) for l in lawyers]

        # Contar leads
        leads = await db.leads.find({
            "lawyer_id": {"$in": lawyer_ids}
        }).to_list(None)

        # Contar casos
        cases = await db.cases.find({
            "lawyer_id": {"$in": lawyer_ids}
        }).to_list(None)

        # Sumar comisiones (desde referrals o transacciones)
        commissions = await db.referrals.find({
            "lawyer_id": {"$in": lawyer_ids}
        }).to_list(None)

        total_commissions = sum(c.get("commission_amount", 0) for c in commissions)

        dashboard = {
            "firm_id": str(org["_id"]),
            "firm_name": org.get("name"),
            "lawyers_count": len(lawyers),
            "leads_count": len(leads),
            "cases_count": len(cases),
            "commissions_total": total_commissions,
            "lawyers": [{"_id": l["_id"], "full_name": l.get("full_name"), "email": l["email"]} for l in lawyers]
        }

        return ok(data=dashboard, message="Dashboard de firma obtenido")
    except HTTPException:
        raise
    except Exception as e:
        return JSONResponse(status_code=500, content=fail(str(e)))
