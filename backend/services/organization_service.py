"""Service layer de Organizaciones — Punto Cero OS (multi-tenant).

Migration to Repository Layer (O3 — Sprint S1.5)

Architecture:
- All CRUD operations delegated to OrganizationRepository
- Request tracing via request_id
- Tenant isolation via firm_id (TenantAwareQuery in repositories)
- Multi-tenant safety enforced at repository layer
- Backward compatible with existing REST APIs

Removed direct MongoDB access patterns:
- find_one() → repository.find_by_id()
- find() → repository.list_paginated()
- insert_one() → repository.create()
- update_one() → repository.update()
- delete_one() → repository.soft_delete()
"""
import re
import unicodedata
from datetime import datetime
from typing import Optional
import logging

from bson import ObjectId

from utils.responses import OrgError
from repositories.organization_repository import OrganizationRepository
from repositories.audit_log_repository import AuditLogRepository

logger = logging.getLogger(__name__)


# ───────────────────── Utilidades ─────────────────────
def slugify(value: str) -> str:
    """Convert string to URL-safe slug (no database access)"""
    value = unicodedata.normalize("NFKD", value or "").encode("ascii", "ignore").decode("ascii")
    value = re.sub(r"[^a-zA-Z0-9]+", "-", value).strip("-").lower()
    return value or "org"


def _oid(org_id: str) -> ObjectId:
    """Validate and convert string to ObjectId (no database access)"""
    if not ObjectId.is_valid(org_id):
        raise OrgError(404, "Organización no encontrada")
    return ObjectId(org_id)


def _serialize(doc: dict) -> dict:
    """Convert MongoDB ObjectId to string for API response (no database access)"""
    if not doc:
        return doc
    doc = {**doc, "_id": str(doc["_id"])}
    return doc


async def _audit(db, action: str, ctx: dict, detail: str = ""):
    """Legacy audit logging (kept for O5 scope, fire-and-forget)"""
    try:
        await db.audit_logs.insert_one({
            "action": action,
            "module": "organizations",
            "user": ctx.get("user", {}).get("email", "—"),
            "user_id": ctx.get("user_id"),
            "tenant_id": ctx.get("tenant_id"),
            "detail": detail,
            "created_at": datetime.utcnow(),
        })
    except Exception:
        pass


# ───────────────────── CRUD ─────────────────────
async def create_organization(db, ctx: dict, payload) -> dict:
    """
    Create organization via repository layer with audit logging.

    Tenant validation, slug uniqueness, and isolation all handled by OrganizationRepository.
    """
    firm_id = ctx.get("tenant_id")
    if not firm_id:
        raise OrgError(400, "Se requiere tenant para crear una organización")

    request_id = ctx.get("request_id", "no-request-id")
    user_id = ctx.get("user_id", "system")
    ip_address = ctx.get("ip_address", "unknown")
    slug = slugify(payload.slug or payload.name)

    # Pre-check: Validate slug uniqueness
    repo = OrganizationRepository(db.organizations)
    is_unique = await repo.validate_slug_unique(firm_id, slug, request_id=request_id)
    if not is_unique:
        raise OrgError(409, f"Ya existe una organización con el slug '{slug}' en este tenant")

    # Build document
    now = datetime.utcnow()
    org_data = {
        "name": payload.name,
        "slug": slug,
        "vertical": payload.vertical,
        "plan": payload.plan,
        "status": payload.status,
        "ownerId": payload.ownerId,
        "settings": payload.settings or {},
        "limits": payload.limits or {},
        "created_at": now,
        "updated_at": now,
    }

    # Create via repository
    try:
        result = await repo.create(firm_id, org_data, request_id)

        # Audit log
        audit_repo = AuditLogRepository(db.audit_logs)
        await audit_repo.log_action(
            firm_id=firm_id,
            action="create_organization",
            user_id=user_id,
            details={
                "resource": "organization",
                "resource_id": str(result.get("_id")),
                "name": payload.name,
                "slug": slug,
                "plan": payload.plan,
                "status": "success"
            },
            request_id=request_id,
            ip_address=ip_address
        )

        await _audit(db, "createOrganization", ctx, f"{payload.name} ({slug})")
        return _serialize(result)
    except Exception as e:
        logger.error(f"[organizations] create_organization error: {str(e)} request_id={request_id}")

        # Audit error
        audit_repo = AuditLogRepository(db.audit_logs)
        try:
            await audit_repo.log_action(
                firm_id=firm_id,
                action="create_organization",
                user_id=user_id,
                details={
                    "resource": "organization",
                    "name": payload.name,
                    "status": "error",
                    "error": str(e)
                },
                request_id=request_id,
                ip_address=ip_address
            )
        except Exception:
            pass  # Don't let audit failure break the operation

        raise


async def update_organization(db, ctx: dict, org_id: str, payload) -> dict:
    """
    Update organization via repository layer with audit logging.

    Slug uniqueness validation, tenant isolation, and state management handled by repository.
    """
    firm_id = ctx.get("tenant_id")
    if not firm_id:
        raise OrgError(400, "Se requiere tenant")

    request_id = ctx.get("request_id", "no-request-id")
    user_id = ctx.get("user_id", "system")
    ip_address = ctx.get("ip_address", "unknown")

    # Get before state for audit
    repo = OrganizationRepository(db.organizations)
    before_state = await repo.find_by_id(firm_id, org_id, request_id)
    if not before_state:
        raise OrgError(404, "Organización no encontrada")

    # Build updates from payload
    updates = {k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None}

    # Validate slug if changed
    if "slug" in updates:
        updates["slug"] = slugify(updates["slug"])
        is_unique = await repo.validate_slug_unique(firm_id, updates["slug"], exclude_id=org_id, request_id=request_id)
        if not is_unique:
            raise OrgError(409, f"El slug '{updates['slug']}' ya está en uso en este tenant")

    # Add timestamp
    updates["updated_at"] = datetime.utcnow()

    # Update via repository
    try:
        result = await repo.update(firm_id, org_id, updates, request_id)
        if not result:
            raise OrgError(404, "Organización no encontrada")

        # Audit log
        audit_repo = AuditLogRepository(db.audit_logs)
        await audit_repo.log_action(
            firm_id=firm_id,
            action="update_organization",
            user_id=user_id,
            details={
                "resource": "organization",
                "resource_id": org_id,
                "before_state": {k: v for k, v in before_state.items() if k in updates},
                "after_state": {k: result.get(k) for k in updates},
                "status": "success"
            },
            request_id=request_id,
            ip_address=ip_address
        )

        await _audit(db, "updateOrganization", ctx, org_id)
        return _serialize(result)
    except Exception as e:
        logger.error(f"[organizations] update_organization error: {str(e)} request_id={request_id}")

        # Audit error
        audit_repo = AuditLogRepository(db.audit_logs)
        try:
            await audit_repo.log_action(
                firm_id=firm_id,
                action="update_organization",
                user_id=user_id,
                details={
                    "resource": "organization",
                    "resource_id": org_id,
                    "status": "error",
                    "error": str(e)
                },
                request_id=request_id,
                ip_address=ip_address
            )
        except Exception:
            pass

        raise


async def delete_organization(db, ctx: dict, org_id: str) -> None:
    """
    Delete organization via repository layer (soft delete) with audit logging.

    Tenant isolation and deletion handling managed by repository.
    """
    firm_id = ctx.get("tenant_id")
    if not firm_id:
        raise OrgError(400, "Se requiere tenant")

    request_id = ctx.get("request_id", "no-request-id")
    user_id = ctx.get("user_id", "system")
    ip_address = ctx.get("ip_address", "unknown")

    try:
        repo = OrganizationRepository(db.organizations)

        # Get before state for audit
        before_state = await repo.find_by_id(firm_id, org_id, request_id)
        if not before_state:
            raise OrgError(404, "Organización no encontrada")

        # Delete via repository
        success = await repo.soft_delete(firm_id, org_id, request_id)
        if not success:
            raise OrgError(404, "Organización no encontrada")

        # Audit log
        audit_repo = AuditLogRepository(db.audit_logs)
        await audit_repo.log_action(
            firm_id=firm_id,
            action="soft_delete_organization",
            user_id=user_id,
            details={
                "resource": "organization",
                "resource_id": org_id,
                "name": before_state.get("name"),
                "status": "success"
            },
            request_id=request_id,
            ip_address=ip_address
        )

        await _audit(db, "deleteOrganization", ctx, org_id)
    except Exception as e:
        logger.error(f"[organizations] delete_organization error: {str(e)} request_id={request_id}")

        # Audit error
        audit_repo = AuditLogRepository(db.audit_logs)
        try:
            await audit_repo.log_action(
                firm_id=firm_id,
                action="soft_delete_organization",
                user_id=user_id,
                details={
                    "resource": "organization",
                    "resource_id": org_id,
                    "status": "error",
                    "error": str(e)
                },
                request_id=request_id,
                ip_address=ip_address
            )
        except Exception:
            pass

        raise


async def get_organization(db, ctx: dict, org_id: str) -> dict:
    """
    Get organization by ID via repository layer with audit logging.

    Tenant isolation and access control handled by repository.
    """
    firm_id = ctx.get("tenant_id")
    if not firm_id:
        raise OrgError(400, "Se requiere tenant")

    request_id = ctx.get("request_id", "no-request-id")
    user_id = ctx.get("user_id", "system")
    ip_address = ctx.get("ip_address", "unknown")

    try:
        repo = OrganizationRepository(db.organizations)
        doc = await repo.find_by_id(firm_id, org_id, request_id)
        if not doc:
            raise OrgError(404, "Organización no encontrada")

        # Audit read operation
        audit_repo = AuditLogRepository(db.audit_logs)
        await audit_repo.log_action(
            firm_id=firm_id,
            action="view_organization",
            user_id=user_id,
            details={
                "resource": "organization",
                "resource_id": org_id,
                "status": "success"
            },
            request_id=request_id,
            ip_address=ip_address
        )

        await _audit(db, "viewOrganization", ctx, org_id)
        return _serialize(doc)
    except Exception as e:
        logger.error(f"[organizations] get_organization error: {str(e)} request_id={request_id}")
        raise


async def get_organizations(db, ctx: dict, status: Optional[str] = None, skip: int = 0, limit: int = 1000) -> list:
    """
    List organizations via repository layer.

    Tenant isolation and pagination handled by repository.
    Note: Default limit set to 1000 for backward compatibility.
    """
    firm_id = ctx.get("tenant_id")
    if not firm_id:
        raise OrgError(400, "Se requiere tenant")

    request_id = ctx.get("request_id", "no-request-id")

    try:
        repo = OrganizationRepository(db.organizations)
        docs, total = await repo.list_paginated(
            firm_id=firm_id,
            skip=skip,
            limit=limit,
            status=status,
            request_id=request_id
        )
        return [_serialize(d) for d in docs]
    except Exception as e:
        logger.error(f"[organizations] get_organizations error: {str(e)} request_id={request_id}")
        raise


async def get_dashboard(db, ctx: dict) -> dict:
    """
    Dashboard consolidado para el frontend.

    Aggregates organizations list with KPIs.
    Uses repository layer for data access.
    """
    firm_id = ctx.get("tenant_id")
    if not firm_id:
        raise OrgError(400, "Se requiere tenant")

    request_id = ctx.get("request_id", "no-request-id")

    try:
        repo = OrganizationRepository(db.organizations)

        # Get all organizations for this firm (KPI aggregation)
        orgs, total = await repo.list_paginated(
            firm_id=firm_id,
            skip=0,
            limit=10000,  # Fetch all for KPI calc
            request_id=request_id
        )

        # Serialize organizations
        org_list = [_serialize(o) for o in orgs]

        # Calculate KPIs from fetched organizations
        active = [o for o in org_list if o.get("status") == "active"]
        at_risk = [o for o in org_list if o.get("status") in ("at_risk", "suspended")]
        total_users = sum(int(o.get("users", 0) or 0) for o in org_list)
        total_mrr = sum(int(o.get("mrr", 0) or 0) for o in org_list)

        return {
            "organizations": org_list,
            "KPIS": {
                "activeOrgs": len(active),
                "totalUsers": total_users,
                "activeVerticals": len({o.get("vertical") for o in org_list if o.get("vertical")}),
                "activeSubscriptions": len(active),
                "totalMrr": total_mrr,
                "orgsAtRisk": len(at_risk),
            },
        }
    except Exception as e:
        logger.error(f"[organizations] get_dashboard error: {str(e)} request_id={request_id}")
        raise
