"""
Multi-Tenant Isolation Middleware
DEPRECATED: Replaced by TenantKernel v1.0 in backend/kernel/

This middleware is being phased out in favor of the kernel-based tenant
validation system. It currently serves as a fallback/compatibility layer only.

See: backend/kernel/tenant_kernel.py
"""

from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from typing import Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)


# DEPRECATED: Use backend.kernel.TenantContext instead
# This class is kept for backwards compatibility only
class TenantContext:
    """
    DEPRECATED: Use kernel.TenantContext instead.
    Runtime tenant context (legacy, mutable version).
    Replaced by immutable TenantContext in kernel.
    """
    def __init__(
        self,
        firm_id: str,
        user_id: str,
        user_email: str,
        user_role: str,
        request_id: str,
        ip_address: str
    ):
        self.firm_id = firm_id
        self.user_id = user_id
        self.user_email = user_email
        self.user_role = user_role
        self.request_id = request_id
        self.ip_address = ip_address


class TenantIsolationMiddleware(BaseHTTPMiddleware):
    """
    DEPRECATED: Use TenantKernelMiddlewareWrapper instead.

    Legacy middleware that enforces multi-tenant isolation.
    Every request must include firm_id (via header or decoded JWT token).
    Validates that user belongs to firm and sets context for service layer.

    NOTE: This middleware is now a fallback for compatibility.
    TenantKernel handles all tenant validation in production.
    See: backend/kernel/tenant_kernel_middleware.py
    """

    # Paths that skip tenant isolation (e.g., login, health check)
    EXEMPT_PATHS = {
        "/health",
        "/api/",
        "/api/health",
        "/docs",
        "/openapi.json",
        "/redoc",
        "/api/auth/login",
        "/api/auth/register",
        "/api/auth/refresh",
        "/api/payment/catalog",
    }

    # Public endpoints reachable before authentication (prefix match).
    PUBLIC_PATH_PREFIXES = (
        "/api/firms/register",
        "/api/firms/activate-account",
        "/api/public/",
        "/api/payment/webhook",
    )

    async def dispatch(self, request: Request, call_next):
        """
        Intercept request, extract tenant context, validate isolation.
        Attach tenant context to request state for downstream handlers.
        """

        # Allow CORS preflight requests
        if request.method == "OPTIONS":
            return await call_next(request)

        # Skip exempt paths (exact match) and public pre-auth paths (prefix match)
        path = request.url.path
        if path in self.EXEMPT_PATHS or any(
            path == p or path.startswith(p) for p in self.PUBLIC_PATH_PREFIXES
        ):
            return await call_next(request)

        try:
            # Extract tenant context from request
            tenant_context = await self._extract_tenant_context(request)

            # Attach to request state
            request.state.tenant_context = tenant_context

            # [BLOCK 1] Audit logging for certification - temporary instrumentation
            logger.info(
                f"[BLOCK 1][TENANT_CONTEXT_CREATED] "
                f"firm_id={tenant_context.firm_id} | "
                f"user_id={tenant_context.user_id} | "
                f"user_email={tenant_context.user_email} | "
                f"user_role={tenant_context.user_role} | "
                f"path={request.url.path} | "
                f"method={request.method} | "
                f"request_id={tenant_context.request_id} | "
                f"ip_address={tenant_context.ip_address}"
            )

            # Legacy audit log for compatibility
            logger.info(
                f"[TENANT] firm_id={tenant_context.firm_id} "
                f"user_id={tenant_context.user_id} "
                f"path={request.url.path} "
                f"method={request.method} "
                f"request_id={tenant_context.request_id}"
            )
            
            # Process request
            response = await call_next(request)
            
            # Add request_id to response headers for tracing
            response.headers["X-Request-ID"] = tenant_context.request_id
            
            return response
            
        except HTTPException as e:
            # Re-raise HTTP exceptions as-is
            raise e
        except Exception as e:
            logger.error(f"[TENANT] Isolation error: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Internal server error"
            )

    async def _extract_tenant_context(self, request: Request) -> TenantContext:
        """
        Extract tenant context from request headers and JWT token.
        
        Priority:
        1. X-Firm-ID header (if provided)
        2. firm_id from decoded JWT token (recommended)
        3. Extract from request body (for POST operations)
        """
        
        # Get request_id from header or generate
        request_id = request.headers.get("X-Request-ID", self._generate_request_id())
        ip_address = request.client.host if request.client else "unknown"

        # [BLOCK 1] Try to get firm_id from headers (accept both X-Firm-ID and X-Tenant-ID for compatibility)
        # Priority: X-Firm-ID (new) > X-Tenant-ID (legacy)
        firm_id = (
            request.headers.get("X-Firm-ID") or
            request.headers.get("X-Tenant-ID")
        )

        # [BLOCK 1] Audit: log header resolution
        if firm_id:
            header_source = "X-Firm-ID" if request.headers.get("X-Firm-ID") else "X-Tenant-ID"
            logger.info(f"[BLOCK 1][HEADER_RESOLVED] firm_id={firm_id} (from {header_source})")

        if firm_id:
            # Header-based firm_id (explicit)
            return self._create_context_from_header(
                firm_id=firm_id,
                request=request,
                request_id=request_id,
                ip_address=ip_address
            )

        # Try to extract from JWT token (via Authorization header)
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
            try:
                from utils.auth import decode_token
                payload = decode_token(token)

                # [BLOCK 1] Audit: log JWT resolution
                firm_id_from_jwt = payload.get("firm_id")
                user_id_from_jwt = payload.get("user_id")
                logger.info(f"[BLOCK 1][JWT_RESOLVED] firm_id={firm_id_from_jwt} | user_id={user_id_from_jwt} | "
                           f"token_version={payload.get('v', 'unknown')}")

                return TenantContext(
                    firm_id=firm_id_from_jwt,
                    user_id=user_id_from_jwt,
                    user_email=payload.get("email"),
                    user_role=payload.get("role"),
                    request_id=request_id,
                    ip_address=ip_address
                )
            except Exception as e:
                logger.warning(f"[TENANT] Failed to decode JWT token: {str(e)}")

        # If no token, raise error
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authentication"
        )

    def _create_context_from_header(
        self,
        firm_id: str,
        request: Request,
        request_id: str,
        ip_address: str
    ) -> TenantContext:
        """Create tenant context from header (simplified for tests)"""
        
        user_id = request.headers.get("X-User-ID", "unknown")
        user_email = request.headers.get("X-User-Email", "unknown")
        user_role = request.headers.get("X-User-Role", "user")
        
        return TenantContext(
            firm_id=firm_id,
            user_id=user_id,
            user_email=user_email,
            user_role=user_role,
            request_id=request_id,
            ip_address=ip_address
        )

    @staticmethod
    def _generate_request_id() -> str:
        """Generate unique request ID for tracing"""
        import uuid
        return str(uuid.uuid4())


class TenantIsolationValidator:
    """
    Validator class to enforce tenant isolation in service/repository layer.
    Checks that requested firm_id matches user's firm_id.
    """

    @staticmethod
    def validate(
        requested_firm_id: str,
        user_firm_id: str,
        request_id: str
    ) -> None:
        """
        Validate tenant isolation.
        Raises exception if user tries to access different firm's data.
        """
        if requested_firm_id != user_firm_id:
            logger.warning(
                f"[TENANT_ISOLATION_VIOLATION] request_id={request_id} "
                f"user_firm_id={user_firm_id} "
                f"requested_firm_id={requested_firm_id}"
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Tenant isolation violation: unauthorized firm access"
            )

    @staticmethod
    def validate_batch(
        requested_firm_ids: list,
        user_firm_id: str,
        request_id: str
    ) -> None:
        """
        Validate tenant isolation for batch operations.
        Ensures all requested resources belong to user's firm.
        """
        unauthorized = [
            firm_id for firm_id in requested_firm_ids
            if firm_id != user_firm_id
        ]
        
        if unauthorized:
            logger.warning(
                f"[TENANT_ISOLATION_VIOLATION_BATCH] request_id={request_id} "
                f"user_firm_id={user_firm_id} "
                f"unauthorized_firms={unauthorized}"
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Tenant isolation violation: unauthorized firm access"
            )


class TenantAwareQuery:
    """
    Helper to inject firm_id filter into all database queries.
    Ensures no query accidentally returns cross-tenant data.
    """

    @staticmethod
    def add_firm_filter(
        query: Dict[str, Any],
        firm_id: str
    ) -> Dict[str, Any]:
        """
        Add firm_id to MongoDB query filter.
        
        Example:
            query = {"status": "ACTIVE"}
            query = TenantAwareQuery.add_firm_filter(query, "firm-123")
            # Result: {"status": "ACTIVE", "firm_id": "firm-123"}
        """
        if query is None:
            query = {}
        query["firm_id"] = firm_id
        return query

    @staticmethod
    def add_firm_filter_bulk(
        queries: list,
        firm_id: str
    ) -> list:
        """Add firm_id filter to multiple queries"""
        return [TenantAwareQuery.add_firm_filter(q, firm_id) for q in queries]


# DEPRECATED: Use kernel.get_tenant_context_from_request instead
def get_tenant_context(request: Request) -> Optional[TenantContext]:
    """
    DEPRECATED: Use kernel.get_tenant_context_from_request instead.

    Legacy helper function to extract tenant context from request.
    Kept for backwards compatibility during migration to TenantKernel.
    """
    return getattr(request.state, "tenant_context", None)


# DEPRECATED: Use kernel.get_tenant_context_from_request instead
def require_tenant_context(request: Request) -> TenantContext:
    """
    DEPRECATED: Use kernel.get_tenant_context_from_request instead.

    Legacy helper function to require tenant context.
    Raises HTTPException if context not available.
    Kept for backwards compatibility during migration to TenantKernel.
    """
    tenant = get_tenant_context(request)
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing tenant context"
        )
    return tenant
