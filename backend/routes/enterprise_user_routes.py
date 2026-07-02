"""
Enterprise User Routes
/api/firms/{firm_id}/users CRUD endpoints
"""

from fastapi import APIRouter, Request, HTTPException, status, Query
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from services.enterprise_user_service import UserService
from services.enterprise_tenant_service import TenantService
from services.enterprise_permission_service import PermissionService
from services.enterprise_audit_service import AuditService
from middleware.tenant_isolation import require_tenant_context, TenantContext
from utils.enterprise_exceptions import (
    TenantIsolationViolation, PermissionDenied, TenantQuotaExceeded, 
    DuplicateResource, ResourceNotFound
)
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/firms/{firm_id}/users", tags=["users"])


# ============================================================================
# REQUEST/RESPONSE MODELS
# ============================================================================

class CreateUserRequest(BaseModel):
    """Create user request"""
    email: EmailStr
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    password: str = Field(..., min_length=8)
    role_id: str
    phone: Optional[str] = None


class UserResponse(BaseModel):
    """User response (no password)"""
    id: Optional[str] = Field(None, alias="_id")
    email: str
    first_name: str
    last_name: str
    role_id: str
    phone: Optional[str] = None
    is_active: bool
    email_verified: bool
    created_at: datetime
    
    class Config:
        populate_by_name = True


class UpdateUserRequest(BaseModel):
    """Update user request"""
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None


class UserPreferencesResponse(BaseModel):
    """User preferences response"""
    id: Optional[str] = Field(None, alias="_id")
    theme: str = "SYSTEM"
    language: str = "es"
    timezone: str = "America/Mexico_City"
    currency: str = "MXN"
    
    class Config:
        populate_by_name = True


class UpdatePreferencesRequest(BaseModel):
    """Update preferences request"""
    theme: Optional[str] = None
    language: Optional[str] = None
    timezone: Optional[str] = None
    currency: Optional[str] = None


# ============================================================================
# ROUTES
# ============================================================================

@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    request: Request,
    firm_id: str,
    payload: CreateUserRequest
) -> UserResponse:
    """
    Create new user in firm.
    Requires: ADMIN role or Manager with team management permission
    
    Args:
        firm_id: Firm ID (from path)
        email: User email (unique per firm)
        first_name: First name
        last_name: Last name
        password: Password (min 8 chars)
        role_id: Role ID to assign
        phone: Optional phone
        
    Returns:
        Created user
        
    Status Codes:
        201: Created
        403: Insufficient permissions or quota exceeded
        409: Email already exists
    """
    
    try:
        # Get tenant context
        tenant = require_tenant_context(request)
        
        # Verify firm match
        if tenant.firm_id != firm_id:
            raise TenantIsolationViolation(firm_id, tenant.firm_id)
        
        # Get services
        user_service: UserService = request.app.state.user_service
        tenant_service: TenantService = request.app.state.tenant_service
        permission_service: PermissionService = request.app.state.permission_service
        audit_service: AuditService = request.app.state.audit_service
        
        request_id = request.headers.get("x-request-id", "unknown")
        
        # Check permission: ADMIN or MANAGER
        try:
            await permission_service.require_permission(
                firm_id=firm_id,
                user_id=tenant.user_id,
                module="ADMIN",
                action="CREATE",
                request_id=request_id
            )
        except PermissionDenied:
            # Check if user can manage team (lower permission)
            # For now: require ADMIN
            raise
        
        # Check quota
        await tenant_service.enforce_user_quota(firm_id, request_id)
        
        # Create user
        user = await user_service.create_user(
            firm_id=firm_id,
            email=payload.email,
            first_name=payload.first_name,
            last_name=payload.last_name,
            password=payload.password,
            role_id=payload.role_id,
            phone=payload.phone,
            request_id=request_id
        )
        
        # Log user creation
        await audit_service.log_action(
            firm_id=firm_id,
            user_id=tenant.user_id,
            action="CREATE",
            category="SETTINGS",
            resource_type="USER",
            resource_id=user.get("_id"),
            severity="HIGH",
            status="SUCCESS",
            request_id=request_id,
            metadata={"email": payload.email, "role_id": payload.role_id}
        )
        
        logger.info(
            f"[USER] Created user: firm_id={firm_id} email={payload.email} "
            f"role_id={payload.role_id}"
        )
        
        return UserResponse(**user)
        
    except (TenantIsolationViolation, PermissionDenied, TenantQuotaExceeded, DuplicateResource) as e:
        raise e.http_detail if hasattr(e, 'http_detail') else HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"[USER] create_user error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user"
        )


@router.get("", response_model=List[UserResponse])
async def list_users(
    request: Request,
    firm_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    active_only: bool = Query(True)
) -> List[UserResponse]:
    """
    List users in firm.
    Requires: User belongs to firm
    
    Query params:
        skip: Pagination skip
        limit: Pagination limit
        active_only: Show only active users
        
    Returns:
        List of users
        
    Status Codes:
        200: Success
        403: Access denied
    """
    
    try:
        # Get tenant context
        tenant = require_tenant_context(request)
        
        # Verify firm match
        if tenant.firm_id != firm_id:
            raise TenantIsolationViolation(firm_id, tenant.firm_id)
        
        # Get services
        user_service: UserService = request.app.state.user_service
        
        request_id = request.headers.get("x-request-id", "unknown")
        
        # List users
        users, total = await user_service.list_users(
            firm_id=firm_id,
            skip=skip,
            limit=limit,
            active_only=active_only,
            request_id=request_id
        )
        
        logger.debug(
            f"[USER] Listed users: firm_id={firm_id} "
            f"found={len(users)} total={total}"
        )
        
        return [UserResponse(**u) for u in users]
        
    except TenantIsolationViolation as e:
        raise e.http_detail
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"[USER] list_users error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list users"
        )


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    request: Request,
    firm_id: str,
    user_id: str
) -> UserResponse:
    """
    Get user details.
    Requires: User belongs to firm
    
    Args:
        firm_id: Firm ID
        user_id: User ID
        
    Returns:
        User details
        
    Status Codes:
        200: Success
        403: Access denied
        404: User not found
    """
    
    try:
        # Get tenant context
        tenant = require_tenant_context(request)
        
        # Verify firm match
        if tenant.firm_id != firm_id:
            raise TenantIsolationViolation(firm_id, tenant.firm_id)
        
        # Get services
        user_service: UserService = request.app.state.user_service
        
        request_id = request.headers.get("x-request-id", "unknown")
        
        # Get user
        user = await user_service.get_user(firm_id, user_id, request_id)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return UserResponse(**user)
        
    except TenantIsolationViolation as e:
        raise e.http_detail
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"[USER] get_user error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get user"
        )


@router.patch("/{user_id}", response_model=UserResponse)
async def update_user(
    request: Request,
    firm_id: str,
    user_id: str,
    payload: UpdateUserRequest
) -> UserResponse:
    """
    Update user details.
    Requires: ADMIN or user updating own profile
    
    Args:
        firm_id: Firm ID
        user_id: User ID
        first_name: Optional new first name
        last_name: Optional new last name
        phone: Optional new phone
        
    Returns:
        Updated user
        
    Status Codes:
        200: Success
        403: Insufficient permissions
        404: User not found
    """
    
    try:
        # Get tenant context
        tenant = require_tenant_context(request)
        
        # Verify firm match
        if tenant.firm_id != firm_id:
            raise TenantIsolationViolation(firm_id, tenant.firm_id)
        
        # Check permission: ADMIN or own user
        if tenant.user_id != user_id and tenant.user_role not in ["owner", "admin"]:
            raise PermissionDenied("USERS", "UPDATE")
        
        # Get services
        user_service: UserService = request.app.state.user_service
        audit_service: AuditService = request.app.state.audit_service
        
        request_id = request.headers.get("x-request-id", "unknown")
        
        # Prepare update data
        update_data = {}
        if payload.first_name:
            update_data["first_name"] = payload.first_name
        if payload.last_name:
            update_data["last_name"] = payload.last_name
        if payload.phone:
            update_data["phone"] = payload.phone
        
        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields to update"
            )
        
        # Update user
        user = await user_service.update_user(
            firm_id=firm_id,
            user_id=user_id,
            update_data=update_data,
            request_id=request_id
        )
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Log update
        await audit_service.log_action(
            firm_id=firm_id,
            user_id=tenant.user_id,
            action="UPDATE",
            category="SETTINGS",
            resource_type="USER",
            resource_id=user_id,
            severity="INFO",
            status="SUCCESS",
            request_id=request_id
        )
        
        return UserResponse(**user)
        
    except (TenantIsolationViolation, PermissionDenied) as e:
        raise e.http_detail
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"[USER] update_user error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update user"
        )


@router.post("/{user_id}/deactivate")
async def deactivate_user(
    request: Request,
    firm_id: str,
    user_id: str
) -> Dict[str, str]:
    """
    Deactivate user.
    Requires: ADMIN role
    
    Returns:
        Success message
        
    Status Codes:
        200: Success
        403: Insufficient permissions
        404: User not found
    """
    
    try:
        # Get tenant context
        tenant = require_tenant_context(request)
        
        # Verify firm match
        if tenant.firm_id != firm_id:
            raise TenantIsolationViolation(firm_id, tenant.firm_id)
        
        # Check permission: ADMIN only
        if tenant.user_role not in ["owner", "admin"]:
            raise PermissionDenied("USERS", "DELETE")
        
        # Get services
        user_service: UserService = request.app.state.user_service
        audit_service: AuditService = request.app.state.audit_service
        
        request_id = request.headers.get("x-request-id", "unknown")
        
        # Deactivate
        user = await user_service.deactivate_user(firm_id, user_id, request_id)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Log deactivation
        await audit_service.log_action(
            firm_id=firm_id,
            user_id=tenant.user_id,
            action="DELETE",
            category="SETTINGS",
            resource_type="USER",
            resource_id=user_id,
            severity="HIGH",
            status="SUCCESS",
            request_id=request_id
        )
        
        return {"message": "User deactivated successfully"}
        
    except (TenantIsolationViolation, PermissionDenied) as e:
        raise e.http_detail
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"[USER] deactivate_user error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to deactivate user"
        )


@router.get("/{user_id}/preferences", response_model=UserPreferencesResponse)
async def get_preferences(
    request: Request,
    firm_id: str,
    user_id: str
) -> UserPreferencesResponse:
    """
    Get user preferences.
    Requires: Own user or ADMIN
    
    Returns:
        User preferences
        
    Status Codes:
        200: Success
        403: Access denied
        404: Preferences not found
    """
    
    try:
        # Get tenant context
        tenant = require_tenant_context(request)
        
        # Verify firm match
        if tenant.firm_id != firm_id:
            raise TenantIsolationViolation(firm_id, tenant.firm_id)
        
        # Check permission: own user or admin
        if tenant.user_id != user_id and tenant.user_role not in ["owner", "admin"]:
            raise PermissionDenied("USERS", "READ")
        
        # Get services
        user_service: UserService = request.app.state.user_service
        
        request_id = request.headers.get("x-request-id", "unknown")
        
        # Get preferences
        prefs = await user_service.get_preferences(firm_id, user_id, request_id)
        
        if not prefs:
            # Return defaults
            return UserPreferencesResponse()
        
        return UserPreferencesResponse(**prefs)
        
    except (TenantIsolationViolation, PermissionDenied) as e:
        raise e.http_detail
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"[USER] get_preferences error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get preferences"
        )


@router.patch("/{user_id}/preferences", response_model=UserPreferencesResponse)
async def update_preferences(
    request: Request,
    firm_id: str,
    user_id: str,
    payload: UpdatePreferencesRequest
) -> UserPreferencesResponse:
    """
    Update user preferences.
    Requires: Own user or ADMIN
    
    Returns:
        Updated preferences
        
    Status Codes:
        200: Success
        403: Access denied
    """
    
    try:
        # Get tenant context
        tenant = require_tenant_context(request)
        
        # Verify firm match
        if tenant.firm_id != firm_id:
            raise TenantIsolationViolation(firm_id, tenant.firm_id)
        
        # Check permission: own user or admin
        if tenant.user_id != user_id and tenant.user_role not in ["owner", "admin"]:
            raise PermissionDenied("USERS", "UPDATE")
        
        # Get services
        user_service: UserService = request.app.state.user_service
        
        request_id = request.headers.get("x-request-id", "unknown")
        
        # Prepare update data
        update_data = payload.dict(exclude_unset=True)
        
        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields to update"
            )
        
        # Update preferences
        prefs = await user_service.update_preferences(
            firm_id=firm_id,
            user_id=user_id,
            preferences=update_data,
            request_id=request_id
        )
        
        return UserPreferencesResponse(**prefs)
        
    except (TenantIsolationViolation, PermissionDenied) as e:
        raise e.http_detail
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"[USER] update_preferences error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update preferences"
        )
