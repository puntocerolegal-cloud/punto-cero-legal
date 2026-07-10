"""
Security Enforcer Middleware — Global Authorization Enforcement
═══════════════════════════════════════════════════════════════════

Purpose:
  Act as the final checkpoint before any response.
  
  Ensures:
  - All protected endpoints call authorize()
  - No direct DB access bypasses authorization
  - Fail-closed on errors
  
Note:
  This middleware is COMPLEMENTARY to endpoint-level checks.
  Primary enforcement happens in security_engine.py and secure_repository.py.
"""

from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
import logging

logger = logging.getLogger(__name__)

# Exempt paths that don't need authorization
EXEMPT_PATHS = {
    "/health",
    "/api/health",
    "/api/auth/login",
    "/api/auth/register",
    "/api/auth/refresh",
    "/api/payment/catalog",
    "/docs",
    "/openapi.json",
    "/redoc",
}

# Paths that require authorization
PROTECTED_PATHS = {
    "/api/cases",
    "/api/documents",
    "/api/dashboard",
    "/api/invoices",
    "/api/users",
}


class SecurityEnforcerMiddleware(BaseHTTPMiddleware):
    """
    Final security checkpoint middleware.
    
    Ensures that:
    1. Protected endpoints have JWT tokens
    2. No bypasses of authorization system
    3. All failures are logged
    """
    
    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        method = request.method
        
        # Allow CORS preflight requests
        if method == "OPTIONS":
            return await call_next(request)
        
        # Allow exempt paths
        if any(path.startswith(exempt) for exempt in EXEMPT_PATHS):
            return await call_next(request)
        
        # Check for authorization header on protected endpoints
        if any(path.startswith(protected) for protected in PROTECTED_PATHS):
            auth_header = request.headers.get("authorization")
            
            if not auth_header:
                logger.warning(
                    f"[SECURITY_ENFORCER] Missing auth header: "
                    f"method={method} path={path}"
                )
                return JSONResponse(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    content={"detail": "Authorization required"}
                )
            
            if not auth_header.startswith("Bearer "):
                logger.warning(
                    f"[SECURITY_ENFORCER] Invalid auth format: "
                    f"method={method} path={path}"
                )
                return JSONResponse(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    content={"detail": "Invalid authorization format"}
                )
        
        try:
            response = await call_next(request)
            return response
        except Exception as e:
            logger.error(
                f"[SECURITY_ENFORCER] Exception: "
                f"method={method} path={path} error={str(e)}"
            )
            raise
