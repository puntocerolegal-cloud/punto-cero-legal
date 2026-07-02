"""
Enterprise Auth Routes
/api/auth/login, /api/auth/logout, /api/auth/refresh, etc.
"""

from fastapi import APIRouter, Request, HTTPException, status, Depends
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Dict, Any
from services.enterprise_auth_service import AuthService
from services.enterprise_audit_service import AuditService
from middleware.tenant_isolation import get_tenant_context, require_tenant_context, TenantContext
from utils.enterprise_exceptions import InvalidCredentials, UserInactive
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["auth"])


# ============================================================================
# REQUEST/RESPONSE MODELS
# ============================================================================

class LoginRequest(BaseModel):
    """Login request"""
    firm_id: str = Field(..., description="Firm/Tenant ID")
    email: EmailStr
    password: str = Field(..., min_length=8)


class LoginResponse(BaseModel):
    """Login response"""
    access_token: str
    refresh_token: str
    user: Dict[str, Any]
    expires_in: int


class RefreshTokenRequest(BaseModel):
    """Refresh token request"""
    refresh_token: str


class RefreshTokenResponse(BaseModel):
    """Refresh token response"""
    access_token: str
    expires_in: int


class LogoutRequest(BaseModel):
    """Logout request"""
    pass


class ChangePasswordRequest(BaseModel):
    """Change password request"""
    old_password: str = Field(..., min_length=8)
    new_password: str = Field(..., min_length=8)


class ChangePasswordResponse(BaseModel):
    """Change password response"""
    message: str = "Password changed successfully"


# ============================================================================
# DEPENDENCY INJECTION
# ============================================================================

async def get_auth_service(request: Request) -> AuthService:
    """Inject AuthService (would come from app context in production)"""
    # In production: retrieve from app.state or dependency container
    # For now: create new instance (should be singleton)
    from motor.motor_asyncio import AsyncIOMotorClient
    
    # This is a stub; in production would use proper DI
    # auth_service = request.app.state.auth_service
    # For now, return a placeholder that would be wired up
    raise NotImplementedError("Auth service not wired in request context")


async def get_audit_service(request: Request) -> AuditService:
    """Inject AuditService"""
    raise NotImplementedError("Audit service not wired in request context")


# ============================================================================
# ROUTES
# ============================================================================

@router.post("/login", response_model=LoginResponse)
async def login(
    request: Request,
    payload: LoginRequest
) -> LoginResponse:
    """
    Authenticate user and return JWT tokens.
    
    Args:
        firm_id: Firm identifier
        email: User email
        password: User password
        
    Returns:
        JWT access_token, refresh_token, user info, expiration
        
    Status Codes:
        200: Success
        401: Invalid credentials
        403: User inactive
        404: User not found
    """
    
    try:
        # Get services from request context
        auth_service: AuthService = request.app.state.auth_service
        audit_service: AuditService = request.app.state.audit_service
        
        # Get client info
        ip_address = request.client.host if request.client else "unknown"
        user_agent = request.headers.get("user-agent", "unknown")
        request_id = request.headers.get("x-request-id", "unknown")
        
        # Authenticate
        result = await auth_service.login(
            firm_id=payload.firm_id,
            email=payload.email,
            password=payload.password,
            ip_address=ip_address,
            user_agent=user_agent,
            request_id=request_id
        )
        
        # Log successful login
        await audit_service.log_authentication(
            firm_id=payload.firm_id,
            user_id=result["user"]["id"],
            email=payload.email,
            action="LOGIN",
            status="SUCCESS",
            ip_address=ip_address,
            user_agent=user_agent,
            request_id=request_id
        )
        
        return LoginResponse(**result)
        
    except InvalidCredentials as e:
        # Log failed login attempt
        logger.warning(f"[AUTH] Login failed: invalid credentials email={payload.email}")
        raise e.http_detail
    except UserInactive as e:
        raise e.http_detail
    except Exception as e:
        logger.error(f"[AUTH] login error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication failed"
        )


@router.post("/logout")
async def logout(
    request: Request,
    payload: LogoutRequest
) -> Dict[str, Any]:
    """
    Logout user (invalidate session).
    Requires: Authorization header with valid JWT
    
    Status Codes:
        200: Success
        401: Invalid token
    """
    
    try:
        # Get tenant context (validates JWT)
        tenant = require_tenant_context(request)
        
        # Get services
        auth_service: AuthService = request.app.state.auth_service
        audit_service: AuditService = request.app.state.audit_service
        
        # Get token from header
        auth_header = request.headers.get("Authorization", "")
        token = auth_header.split(" ")[1] if " " in auth_header else ""
        
        request_id = request.headers.get("x-request-id", "unknown")
        ip_address = request.client.host if request.client else "unknown"
        
        # Logout
        await auth_service.logout(
            firm_id=tenant.firm_id,
            user_id=tenant.user_id,
            token=token,
            request_id=request_id
        )
        
        # Log logout
        await audit_service.log_authentication(
            firm_id=tenant.firm_id,
            user_id=tenant.user_id,
            email=tenant.user_email,
            action="LOGOUT",
            status="SUCCESS",
            ip_address=ip_address,
            user_agent=request.headers.get("user-agent", "unknown"),
            request_id=request_id
        )
        
        return {"message": "Logged out successfully"}
        
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"[AUTH] logout error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Logout failed"
        )


@router.post("/refresh", response_model=RefreshTokenResponse)
async def refresh(
    request: Request,
    payload: RefreshTokenRequest
) -> RefreshTokenResponse:
    """
    Refresh access token using refresh token.
    
    Args:
        refresh_token: Refresh token from login response
        
    Returns:
        New access_token with extended expiration
        
    Status Codes:
        200: Success
        401: Invalid/expired refresh token
    """
    
    try:
        # Extract firm_id from header (or could be in refresh token)
        firm_id = request.headers.get("x-firm-id", "")
        if not firm_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing firm_id header"
            )
        
        request_id = request.headers.get("x-request-id", "unknown")
        
        # Get auth service
        auth_service: AuthService = request.app.state.auth_service
        
        # Refresh
        result = await auth_service.refresh_token(
            firm_id=firm_id,
            refresh_token=payload.refresh_token,
            request_id=request_id
        )
        
        logger.info(f"[AUTH] Token refreshed successfully firm_id={firm_id}")
        
        return RefreshTokenResponse(**result)
        
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"[AUTH] refresh error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )


@router.put("/password")
async def change_password(
    request: Request,
    payload: ChangePasswordRequest
) -> ChangePasswordResponse:
    """
    Change user password.
    Requires: Authorization header with valid JWT
    
    Args:
        old_password: Current password
        new_password: New password
        
    Returns:
        Success message
        
    Status Codes:
        200: Success
        401: Invalid old password
        403: Insufficient permissions
    """
    
    try:
        # Get tenant context
        tenant = require_tenant_context(request)
        
        # Get services
        auth_service: AuthService = request.app.state.auth_service
        audit_service: AuditService = request.app.state.audit_service
        
        request_id = request.headers.get("x-request-id", "unknown")
        
        # Change password
        await auth_service.change_password(
            firm_id=tenant.firm_id,
            user_id=tenant.user_id,
            old_password=payload.old_password,
            new_password=payload.new_password,
            request_id=request_id
        )
        
        # Log password change (security event)
        await audit_service.log_action(
            firm_id=tenant.firm_id,
            user_id=tenant.user_id,
            action="PASSWORD_CHANGED",
            category="AUTHENTICATION",
            resource_type="USER",
            resource_id=tenant.user_id,
            severity="HIGH",
            status="SUCCESS",
            request_id=request_id
        )
        
        return ChangePasswordResponse()
        
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"[AUTH] change_password error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to change password"
        )


@router.get("/me")
async def get_current_user(
    request: Request
) -> Dict[str, Any]:
    """
    Get current authenticated user info.
    Requires: Authorization header with valid JWT
    
    Returns:
        Current user details
        
    Status Codes:
        200: Success
        401: Invalid/missing token
    """
    
    try:
        # Get tenant context
        tenant = require_tenant_context(request)
        
        # Get user service (stub for now)
        # In production: UserService.get_user(firm_id, user_id)
        
        return {
            "id": tenant.user_id,
            "email": tenant.user_email,
            "role": tenant.user_role,
            "firm_id": tenant.firm_id,
            "request_id": tenant.request_id
        }
        
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"[AUTH] get_current_user error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get user info"
        )
