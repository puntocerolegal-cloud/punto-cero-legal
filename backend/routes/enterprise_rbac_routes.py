"""
Enterprise RBAC Routes
/api/roles, /api/permissions endpoints
"""

from fastapi import APIRouter, Request, HTTPException, status, Query
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from services.enterprise_permission_service import PermissionService
from services.enterprise_audit_service import AuditService
from middleware.tenant_isolation import require_tenant_context, TenantContext
from models.enterprise_core import RoleDTO, PermissionDTO
from utils.enterprise_exceptions import TenantIsolationViolation, PermissionDenied, ResourceNotFound
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/roles", tags=["rbac"])


# ============================================================================
# REQUEST/RESPONSE MODELS
# ============================================================================

class CreateRoleRequest(BaseModel):
    """Create role request"""
    name: str = Field(..., min_length=1, max_length=100)
    rank: int = Field(..., ge=0, le=110, description="Role rank (lower = more privilege)")
    description: Optional[str] = None
    permissions: Optional[List[Dict[str, Any]]] = None


class RoleWithPermissionsResponse(BaseModel):
    """Role with permissions"""
    id: Optional[str] = Field(None, alias="_id")
    name: str
    rank: int
    description: Optional[str] = None
    permissions: List[Dict[str, Any]] = Field(default_factory=list)
    created_at: datetime
    
    class Config:
        populate_by_name = True


class AssignPermissionRequest(BaseModel):
    """Assign permission request"""
    module: str = Field(..., description="Module name (CASES, DOCUMENTS, etc.)")
    action: str = Field(..., description="Action (CREATE, READ, UPDATE, DELETE, etc.)")
    resource_type: Optional[str] = None
    conditions: Optional[Dict[str, Any]] = None


class PermissionResponse(BaseModel):
    """Permission response"""
    id: Optional[str] = Field(None, alias="_id")
    role_id: str
    module: str
    action: str
    resource_type: Optional[str] = None
    conditions: Optional[Dict[str, Any]] = None
    created_at: datetime
    
    class Config:
        populate_by_name = True


class CheckPermissionRequest(BaseModel):
    """Check permission request"""
    module: str
    action: str
    resource_type: Optional[str] = None
    resource_id: Optional[str] = None


class CheckPermissionResponse(BaseModel):
    """Check permission response"""
    has_permission: bool
    required_permission: str
    required_action: str


# ============================================================================
# DEPENDENCY INJECTION
# ============================================================================

async def get_permission_service(request: Request) -> PermissionService:
    """Inject PermissionService"""
    raise NotImplementedError("Permission service not wired")


async def get_audit_service(request: Request) -> AuditService:
    """Inject AuditService"""
    raise NotImplementedError("Audit service not wired")


# ============================================================================
# ROUTES
# ============================================================================

@router.post("", response_model=RoleWithPermissionsResponse, status_code=status.HTTP_201_CREATED)
async def create_role(
    request: Request,
    payload: CreateRoleRequest
) -> RoleWithPermissionsResponse:
    """
    Create new role.
    Requires: ADMIN role (firm-level)
    
    Args:
        name: Role name (e.g., "Senior Lawyer")
        rank: Hierarchical rank (0=Owner, 50=Lawyer, 100=ReadOnly)
        description: Role purpose
        permissions: Initial permissions
        
    Returns:
        Created role with permissions
        
    Status Codes:
        201: Created
        403: Insufficient permissions
    """
    
    try:
        # Get tenant context
        tenant = require_tenant_context(request)
        
        # Get services
        permission_service: PermissionService = request.app.state.permission_service
        audit_service: AuditService = request.app.state.audit_service
        
        request_id = request.headers.get("x-request-id", "unknown")
        
        # Check permission: ADMIN only
        await permission_service.require_permission(
            firm_id=tenant.firm_id,
            user_id=tenant.user_id,
            module="ADMIN",
            action="CREATE",
            request_id=request_id
        )
        
        # Create role
        role = await permission_service.create_role(
            firm_id=tenant.firm_id,
            name=payload.name,
            rank=payload.rank,
            description=payload.description,
            permissions=payload.permissions or [],
            request_id=request_id
        )
        
        # Log creation
        await audit_service.log_action(
            firm_id=tenant.firm_id,
            user_id=tenant.user_id,
            action="CREATE",
            category="SETTINGS",
            resource_type="ROLE",
            resource_id=role.get("_id"),
            severity="HIGH",
            status="SUCCESS",
            request_id=request_id,
            metadata={"role_name": payload.name, "rank": payload.rank}
        )
        
        logger.info(
            f"[RBAC] Created role: firm_id={tenant.firm_id} "
            f"name={payload.name} rank={payload.rank}"
        )
        
        return RoleWithPermissionsResponse(**role)
        
    except PermissionDenied as e:
        raise e.http_detail
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"[RBAC] create_role error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create role"
        )


@router.get("", response_model=List[RoleWithPermissionsResponse])
async def list_roles(
    request: Request,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000)
) -> List[RoleWithPermissionsResponse]:
    """
    List roles for firm.
    Requires: User belongs to firm
    
    Query params:
        skip: Pagination skip
        limit: Pagination limit
        
    Returns:
        List of roles with permissions
        
    Status Codes:
        200: Success
        403: Access denied
    """
    
    try:
        # Get tenant context
        tenant = require_tenant_context(request)
        
        # Get services
        permission_service: PermissionService = request.app.state.permission_service
        
        request_id = request.headers.get("x-request-id", "unknown")
        
        # In production: use permission_service.list_roles(firm_id, skip, limit)
        # For now: stub
        
        logger.debug(f"[RBAC] Listed roles for firm_id={tenant.firm_id}")
        
        return []
        
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"[RBAC] list_roles error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list roles"
        )


@router.get("/{role_id}", response_model=RoleWithPermissionsResponse)
async def get_role(
    request: Request,
    role_id: str
) -> RoleWithPermissionsResponse:
    """
    Get role details with permissions.
    Requires: User belongs to firm
    
    Args:
        role_id: Role ID
        
    Returns:
        Role with all permissions
        
    Status Codes:
        200: Success
        403: Access denied
        404: Role not found
    """
    
    try:
        # Get tenant context
        tenant = require_tenant_context(request)
        
        # Get services
        permission_service: PermissionService = request.app.state.permission_service
        
        request_id = request.headers.get("x-request-id", "unknown")
        
        # Get role
        role = await permission_service._get_role(tenant.firm_id, role_id, request_id)
        
        if not role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Role not found"
            )
        
        return RoleWithPermissionsResponse(**role)
        
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"[RBAC] get_role error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get role"
        )


@router.post("/{role_id}/permissions", response_model=PermissionResponse, status_code=status.HTTP_201_CREATED)
async def assign_permission(
    request: Request,
    role_id: str,
    payload: AssignPermissionRequest
) -> PermissionResponse:
    """
    Assign permission to role.
    Requires: ADMIN role
    
    Args:
        role_id: Role ID
        module: Module name (CASES, DOCUMENTS, etc.)
        action: Action (CREATE, READ, UPDATE, DELETE, etc.)
        resource_type: Specific entity type (optional)
        conditions: Conditional rules (optional)
        
    Returns:
        Created permission
        
    Status Codes:
        201: Created
        403: Insufficient permissions
        404: Role not found
    """
    
    try:
        # Get tenant context
        tenant = require_tenant_context(request)
        
        # Get services
        permission_service: PermissionService = request.app.state.permission_service
        audit_service: AuditService = request.app.state.audit_service
        
        request_id = request.headers.get("x-request-id", "unknown")
        
        # Check permission: ADMIN only
        await permission_service.require_permission(
            firm_id=tenant.firm_id,
            user_id=tenant.user_id,
            module="ADMIN",
            action="CREATE",
            request_id=request_id
        )
        
        # Verify role exists
        role = await permission_service._get_role(tenant.firm_id, role_id, request_id)
        if not role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Role not found"
            )
        
        # Assign permission
        permission = await permission_service.assign_permission(
            firm_id=tenant.firm_id,
            role_id=role_id,
            module=payload.module,
            action=payload.action,
            resource_type=payload.resource_type,
            conditions=payload.conditions,
            request_id=request_id
        )
        
        # Log assignment
        await audit_service.log_action(
            firm_id=tenant.firm_id,
            user_id=tenant.user_id,
            action="CREATE",
            category="SETTINGS",
            resource_type="PERMISSION",
            resource_id=permission.get("_id"),
            severity="HIGH",
            status="SUCCESS",
            request_id=request_id,
            metadata={
                "role_id": role_id,
                "module": payload.module,
                "action": payload.action
            }
        )
        
        logger.info(
            f"[RBAC] Assigned permission: role_id={role_id} "
            f"{payload.module}:{payload.action}"
        )
        
        return PermissionResponse(**permission)
        
    except PermissionDenied as e:
        raise e.http_detail
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"[RBAC] assign_permission error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to assign permission"
        )


@router.post("/check-permission")
async def check_permission(
    request: Request,
    payload: CheckPermissionRequest
) -> CheckPermissionResponse:
    """
    Check if current user has permission.
    Requires: Valid JWT token
    
    Args:
        module: Module name
        action: Action
        resource_type: Specific entity type (optional)
        resource_id: Specific resource ID (optional, for conditional perms)
        
    Returns:
        {has_permission: bool, required_permission, required_action}
        
    Status Codes:
        200: Success
        401: Invalid token
    """
    
    try:
        # Get tenant context
        tenant = require_tenant_context(request)
        
        # Get services
        permission_service: PermissionService = request.app.state.permission_service
        
        request_id = request.headers.get("x-request-id", "unknown")
        
        # Check permission
        has_perm = await permission_service.has_permission(
            firm_id=tenant.firm_id,
            user_id=tenant.user_id,
            module=payload.module,
            action=payload.action,
            resource_type=payload.resource_type,
            resource_id=payload.resource_id,
            request_id=request_id
        )
        
        return CheckPermissionResponse(
            has_permission=has_perm,
            required_permission=payload.module,
            required_action=payload.action
        )
        
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"[RBAC] check_permission error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to check permission"
        )


@router.get("/{role_id}/permissions", response_model=List[PermissionResponse])
async def get_role_permissions(
    request: Request,
    role_id: str
) -> List[PermissionResponse]:
    """
    Get all permissions for a role.
    Requires: User belongs to firm
    
    Args:
        role_id: Role ID
        
    Returns:
        List of permissions
        
    Status Codes:
        200: Success
        403: Access denied
        404: Role not found
    """
    
    try:
        # Get tenant context
        tenant = require_tenant_context(request)
        
        # Get services
        permission_service: PermissionService = request.app.state.permission_service
        
        request_id = request.headers.get("x-request-id", "unknown")
        
        # Verify role exists
        role = await permission_service._get_role(tenant.firm_id, role_id, request_id)
        if not role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Role not found"
            )
        
        # Get permissions
        permissions = await permission_service.get_role_permissions(
            firm_id=tenant.firm_id,
            role_id=role_id,
            request_id=request_id
        )
        
        return [PermissionResponse(**perm) for perm in permissions]
        
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"[RBAC] get_role_permissions error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get role permissions"
        )
