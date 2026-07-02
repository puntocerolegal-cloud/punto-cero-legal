"""
Enterprise Firm Routes
/api/firms CRUD endpoints for tenant management
"""

from fastapi import APIRouter, Request, HTTPException, status, Query
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from services.enterprise_tenant_service import TenantService
from services.enterprise_audit_service import AuditService
from services.enterprise_permission_service import PermissionService
from middleware.tenant_isolation import require_tenant_context, TenantContext
from models.enterprise_core import SubscriptionPlan, FirmDTO
from utils.enterprise_exceptions import TenantNotFound, TenantIsolationViolation, PermissionDenied
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/firms", tags=["firms"])


# ============================================================================
# REQUEST/RESPONSE MODELS
# ============================================================================

class CreateFirmRequest(BaseModel):
    """Create firm request"""
    name: str = Field(..., min_length=1, max_length=255)
    slug: str = Field(..., min_length=1, max_length=100)
    email: str
    country_code: str = Field(default="MX")
    subscription_plan: str = Field(default="STARTER")
    owner_id: Optional[str] = None
    owner_name: Optional[str] = None


class UpdateFirmRequest(BaseModel):
    """Update firm request"""
    name: Optional[str] = None
    email: Optional[str] = None
    country_code: Optional[str] = None


class UpdateSubscriptionRequest(BaseModel):
    """Update subscription plan"""
    subscription_plan: str = Field(..., description="STARTER, PROFESSIONAL, ENTERPRISE")


class FirmResponse(BaseModel):
    """Firm response"""
    id: Optional[str] = Field(None, alias="_id")
    name: str
    slug: str
    email: str
    status: str
    subscription_plan: str
    max_users: int
    max_cases: int
    created_at: datetime
    
    class Config:
        populate_by_name = True


# ============================================================================
# DEPENDENCY INJECTION
# ============================================================================

async def get_tenant_service(request: Request) -> TenantService:
    """Inject TenantService from app state"""
    # In production: request.app.state.tenant_service
    raise NotImplementedError("Tenant service not wired")


async def get_permission_service(request: Request) -> PermissionService:
    """Inject PermissionService"""
    raise NotImplementedError("Permission service not wired")


# ============================================================================
# ROUTES
# ============================================================================

@router.post("", response_model=FirmResponse, status_code=status.HTTP_201_CREATED)
async def create_firm(
    request: Request,
    payload: CreateFirmRequest
) -> FirmResponse:
    """
    Create new firm (tenant).
    Requires: ADMIN or SUPER_ADMIN role (system-level, not firm-level)
    
    Args:
        name: Firm legal name
        slug: URL-safe identifier
        email: Contact email
        country_code: ISO 2-letter code
        subscription_plan: STARTER, PROFESSIONAL, ENTERPRISE
        
    Returns:
        Created firm
        
    Status Codes:
        201: Created
        409: Slug already exists
        403: Insufficient permissions
    """
    
    try:
        # Get services
        tenant_service: TenantService = request.app.state.tenant_service
        audit_service: AuditService = request.app.state.audit_service
        
        request_id = request.headers.get("x-request-id", "unknown")
        ip_address = request.client.host if request.client else "unknown"
        
        # In production: check if user has ADMIN role
        # For now: stub
        
        # Create firm
        firm = await tenant_service.create_firm(
            name=payload.name,
            slug=payload.slug,
            email=payload.email,
            country_code=payload.country_code,
            subscription_plan=SubscriptionPlan(payload.subscription_plan),
            owner_id=payload.owner_id,
            owner_name=payload.owner_name,
            request_id=request_id
        )
        
        # Log creation (system-level audit)
        # Use dummy firm_id for system audit
        await audit_service.log_action(
            firm_id=firm.get("_id", "system"),
            user_id=payload.owner_id or "system",
            action="CREATE",
            category="SETTINGS",
            resource_type="FIRM",
            resource_id=firm.get("_id"),
            severity="HIGH",
            status="SUCCESS",
            request_id=request_id,
            metadata={"slug": payload.slug}
        )
        
        logger.info(f"[FIRM] Created firm: {payload.slug} request_id={request_id}")
        
        return FirmResponse(**firm)
        
    except Exception as e:
        logger.error(f"[FIRM] create_firm error: {str(e)}")
        if "DuplicateResource" in str(type(e)):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Slug '{payload.slug}' already exists"
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create firm"
        )


@router.get("/{firm_id}", response_model=FirmResponse)
async def get_firm(
    request: Request,
    firm_id: str
) -> FirmResponse:
    """
    Get firm details.
    Requires: User belongs to firm or ADMIN role
    
    Args:
        firm_id: Firm ID
        
    Returns:
        Firm details
        
    Status Codes:
        200: Success
        403: Access denied (cross-tenant access)
        404: Firm not found
    """
    
    try:
        # Get tenant context (validates JWT)
        tenant = require_tenant_context(request)
        
        request_id = request.headers.get("x-request-id", "unknown")
        
        # Check tenant isolation
        if tenant.firm_id != firm_id:
            # Check if user is admin (has access to other firms)
            # For now: block cross-tenant access
            logger.warning(
                f"[FIRM] Cross-tenant access attempt: "
                f"user_firm_id={tenant.firm_id} requested_firm_id={firm_id}"
            )
            raise TenantIsolationViolation(firm_id, tenant.firm_id)
        
        # Get services
        tenant_service: TenantService = request.app.state.tenant_service
        
        # Get firm
        firm = await tenant_service.get_firm(firm_id, request_id)
        
        if not firm:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Firm not found"
            )
        
        return FirmResponse(**firm)
        
    except TenantIsolationViolation as e:
        raise e.http_detail
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"[FIRM] get_firm error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get firm"
        )


@router.get("", response_model=List[FirmResponse])
async def list_firms(
    request: Request,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000)
) -> List[FirmResponse]:
    """
    List active firms.
    Requires: ADMIN role (system-level)
    
    Query params:
        skip: Pagination skip
        limit: Pagination limit (max 1000)
        
    Returns:
        List of firms
        
    Status Codes:
        200: Success
        403: Insufficient permissions
    """
    
    try:
        # Get services
        tenant_service: TenantService = request.app.state.tenant_service
        
        request_id = request.headers.get("x-request-id", "unknown")
        
        # In production: check if user has ADMIN role
        # For now: stub
        
        # List firms
        firms, total = await tenant_service.get_active_firms(
            skip=skip,
            limit=limit,
            request_id=request_id
        )
        
        logger.debug(f"[FIRM] Listed {len(firms)} active firms")
        
        return [FirmResponse(**firm) for firm in firms]
        
    except Exception as e:
        logger.error(f"[FIRM] list_firms error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list firms"
        )


@router.patch("/{firm_id}/subscription", response_model=FirmResponse)
async def update_subscription(
    request: Request,
    firm_id: str,
    payload: UpdateSubscriptionRequest
) -> FirmResponse:
    """
    Update firm subscription plan (upgrade/downgrade).
    Requires: Firm owner or ADMIN role
    
    Args:
        firm_id: Firm ID
        subscription_plan: New plan (STARTER, PROFESSIONAL, ENTERPRISE)
        
    Returns:
        Updated firm
        
    Status Codes:
        200: Success
        403: Insufficient permissions
        404: Firm not found
    """
    
    try:
        # Get tenant context
        tenant = require_tenant_context(request)
        
        # Check isolation
        if tenant.firm_id != firm_id:
            raise TenantIsolationViolation(firm_id, tenant.firm_id)
        
        # Get services
        tenant_service: TenantService = request.app.state.tenant_service
        audit_service: AuditService = request.app.state.audit_service
        permission_service: PermissionService = request.app.state.permission_service
        
        request_id = request.headers.get("x-request-id", "unknown")
        
        # Check permission (only owner or ADMIN can change subscription)
        can_update = tenant.user_role in ["owner", "admin"]
        if not can_update:
            raise PermissionDenied("SETTINGS", "UPDATE")
        
        # Update subscription
        firm = await tenant_service.update_subscription(
            firm_id=firm_id,
            new_plan=SubscriptionPlan(payload.subscription_plan),
            updated_by_user_id=tenant.user_id,
            request_id=request_id
        )
        
        # Log subscription change
        await audit_service.log_action(
            firm_id=firm_id,
            user_id=tenant.user_id,
            action="UPDATE",
            category="SETTINGS",
            resource_type="SUBSCRIPTION",
            resource_id=firm_id,
            severity="HIGH",
            status="SUCCESS",
            request_id=request_id,
            new_value=payload.subscription_plan,
            metadata={"updated_by": tenant.user_id}
        )
        
        logger.info(
            f"[FIRM] Subscription updated: firm_id={firm_id} "
            f"new_plan={payload.subscription_plan}"
        )
        
        return FirmResponse(**firm)
        
    except (TenantIsolationViolation, PermissionDenied) as e:
        raise e.http_detail
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"[FIRM] update_subscription error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update subscription"
        )


@router.get("/{firm_id}/quota")
async def get_firm_quota(
    request: Request,
    firm_id: str
) -> Dict[str, Any]:
    """
    Get firm quota usage (seats, cases, etc.).
    Requires: User belongs to firm
    
    Args:
        firm_id: Firm ID
        
    Returns:
        Quota info: {max_users, current_users, available, quota_exceeded}
        
    Status Codes:
        200: Success
        403: Access denied
        404: Firm not found
    """
    
    try:
        # Get tenant context
        tenant = require_tenant_context(request)
        
        # Check isolation
        if tenant.firm_id != firm_id:
            raise TenantIsolationViolation(firm_id, tenant.firm_id)
        
        # Get services
        tenant_service: TenantService = request.app.state.tenant_service
        
        request_id = request.headers.get("x-request-id", "unknown")
        
        # Get quota
        quota = await tenant_service.check_user_quota(firm_id, request_id)
        
        return quota
        
    except TenantIsolationViolation as e:
        raise e.http_detail
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"[FIRM] get_firm_quota error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get quota"
        )
