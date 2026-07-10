"""
Tenant Kernel Middleware
PHASE 5: FastAPI integration layer.

Bridges TenantKernel with FastAPI request/response cycle.
Executes BEFORE any endpoint code.
Attaches validated TenantContext to request for downstream use.

Failure handling (PHASE 7):
- 401: Invalid JWT (authentication failure)
- 403: Tenant mismatch (security violation)
- 500: Kernel failure (system integrity)
"""

from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
import logging

from .tenant_kernel import get_tenant_kernel
from .tenant_context import TenantContext
from .tenant_kernel_exceptions import (
    InvalidJWTError,
    TenantMismatchError,
    MissingTenantError,
    TenantKernelError,
)

logger = logging.getLogger(__name__)


class TenantKernelMiddlewareWrapper(BaseHTTPMiddleware):
    """
    PHASE 5: Middleware that wraps TenantKernel for FastAPI.
    
    Execution order:
    1. Check if path is exempt (auth, health, etc.)
    2. If exempt: build minimal context, allow through
    3. If protected: validate with kernel
    4. Attach TenantContext to request
    5. Execute endpoint
    6. Return response with tracing headers
    
    PHASE 6: Enforcement Rules:
    - ❌ No request without TenantContext
    - ❌ No fallback tenant
    - ❌ No override from endpoint
    - ❌ No bypass from service
    - ❌ No access if JWT invalid
    - ❌ No inconsistency allowed
    
    PHASE 7: Failure Handling:
    - InvalidJWTError → 401 (auth problem)
    - TenantMismatchError → 403 (security problem)
    - TenantKernelError → 500 (system problem)
    - Generic Exception → 500 (unknown problem)
    """
    
    # Public endpoints reachable BEFORE authentication (no JWT yet). These are
    # exempted at the integration layer WITHOUT modifying the kernel core.
    # Prefix match, so it covers path params and trailing slashes.
    PUBLIC_PATH_PREFIXES = (
        "/api/firms/register",          # public firm registration + register-lead
        "/api/firms/activate-account",  # account activation from email link
        "/api/public/",                 # landing intake: case-intake, lawyer-application
        "/api/payment/webhook",         # payment provider webhooks (MercadoPago/PayPal)
        "/api/payment/catalog",         # public payment catalog (no auth required)
    )

    def __init__(self, app):
        super().__init__(app)
        self.kernel = get_tenant_kernel()

    def _is_public_path(self, path: str) -> bool:
        return any(
            path == p or path.startswith(p)
            for p in self.PUBLIC_PATH_PREFIXES
        )

    async def dispatch(self, request: Request, call_next):
        """
        Main middleware entry point.
        Validates tenant before endpoint execution.
        """

        # Allow CORS preflight requests
        if request.method == "OPTIONS":
            return await call_next(request)

        try:
            # Check if this path needs kernel validation
            if not self.kernel.should_validate(request) or self._is_public_path(request.url.path):
                # PHASE 9: Exempt path - build minimal context
                tenant_context = self.kernel.build_kernel_context_for_exempt_path(request)
                if tenant_context:
                    request.state.tenant_context = tenant_context
                    logger.debug(
                        f"[TENANT_KERNEL_MIDDLEWARE] Exempt path. "
                        f"request_id={tenant_context.request_id} | "
                        f"path={request.url.path}"
                    )
            else:
                # Protected path - full validation
                tenant_context = await self.kernel.validate_request(request)
                
                # PHASE 6: Attach to request (single source for downstream)
                request.state.tenant_context = tenant_context
                
                logger.info(
                    f"[TENANT_KERNEL_MIDDLEWARE] Kernel validation passed. "
                    f"request_id={tenant_context.request_id} | "
                    f"firm_id={tenant_context.firm_id}"
                )
            
            # Continue to endpoint
            response = await call_next(request)
            
            # Attach request_id to response headers for tracing
            if hasattr(request.state, "tenant_context") and request.state.tenant_context:
                response.headers["X-Request-ID"] = request.state.tenant_context.request_id
            
            return response
            
        except InvalidJWTError as e:
            # PHASE 7: Invalid JWT = 401 (authentication failure)
            request_id = getattr(request.state, "request_id", "unknown")
            logger.warning(
                f"[TENANT_KERNEL_MIDDLEWARE] 401 Invalid JWT. "
                f"request_id={request_id} | path={request.url.path} | "
                f"error={str(e)}"
            )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or missing authentication token",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        except TenantMismatchError as e:
            # PHASE 7: Tenant mismatch = 403 (security violation)
            request_id = getattr(request.state, "request_id", "unknown")
            logger.critical(
                f"[TENANT_KERNEL_MIDDLEWARE] 403 Tenant Mismatch (SECURITY). "
                f"request_id={request_id} | path={request.url.path} | "
                f"error={str(e)}"
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Tenant mismatch or spoofing detected",
            )
        
        except TenantKernelError as e:
            # PHASE 7: Kernel error = 500 (system failure)
            logger.critical(
                f"[TENANT_KERNEL_MIDDLEWARE] 500 Kernel Error (CRITICAL). "
                f"path={request.url.path} | error={str(e)}"
            )
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Tenant validation system failure",
            )
        
        except Exception as e:
            # Unexpected error = 500
            logger.critical(
                f"[TENANT_KERNEL_MIDDLEWARE] 500 Unexpected error. "
                f"path={request.url.path} | error={str(e)}",
                exc_info=True
            )
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Internal server error",
            )


def get_tenant_context_from_request(request: Request) -> TenantContext:
    """
    Helper to extract validated TenantContext from request.
    PHASE 6: Enforcement - raises if context missing.
    
    Use this in endpoints to get kernel-validated tenant.
    Example:
        @router.get("/cases")
        async def get_cases(request: Request):
            tenant = get_tenant_context_from_request(request)
            # tenant is guaranteed valid
            cases = await repo.find_by_firm(tenant.firm_id)
    """
    tenant_context = getattr(request.state, "tenant_context", None)
    
    if not tenant_context:
        logger.critical(
            f"[TENANT_CONTEXT] Missing TenantContext in request state. "
            f"Path: {request.url.path}"
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Tenant context not initialized by kernel",
        )
    
    # Verify integrity (sanity check)
    if not tenant_context.verify_integrity():
        logger.critical(
            f"[TENANT_CONTEXT] TenantContext integrity check failed. "
            f"request_id={tenant_context.request_id}"
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Tenant context integrity violation",
        )
    
    return tenant_context
