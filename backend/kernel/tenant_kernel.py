"""
Tenant Kernel v1.0
Global, immutable kernel that validates tenant context BEFORE any request execution.

PHASE IMPLEMENTATION:
- PHASE 1: TenantKernel class with core methods
- PHASE 2: TenantContext immutable (see tenant_context.py)
- PHASE 3: Complete pipeline validation
- PHASE 4: Mark obsolete patterns
- PHASE 5: FastAPI integration (via middleware wrapper)
- PHASE 6: Enforcement rules
- PHASE 7: Failure handling (401/403/500)
- PHASE 8: Observability logging
- PHASE 9: Compatibility with existing middleware
- PHASE 10: No breaking changes

Architecture principle:
The kernel MUST validate tenant BEFORE any endpoint code executes.
No endpoint can bypass or override kernel decisions.
No service layer can manually resolve tenant.
No request can proceed without valid TenantContext.
"""

from fastapi import Request
from typing import Optional, Dict, Any
import logging
from datetime import datetime
import uuid
import os

from .tenant_context import TenantContext
from .tenant_kernel_exceptions import (
    TenantKernelError,
    TenantValidationError,
    TenantMismatchError,
    MissingTenantError,
    InvalidJWTError,
)

logger = logging.getLogger(__name__)


class TenantKernel:
    """
    PHASE 1: Core kernel that manages tenant context lifecycle.
    
    Responsibilities:
    - Extract JWT from request
    - Extract headers from request
    - Validate JWT signature
    - Resolve tenant identity (JWT as primary source)
    - Validate header consistency (secondary check for spoofing)
    - Generate immutable TenantContext
    - Enforce integrity guarantees
    - Log security events
    
    Invariants:
    - Tenant resolution ONLY from JWT (authoritative)
    - Header validation is consistency check, not primary source
    - TenantContext is frozen/immutable
    - No fallback tenant (default, None)
    - No bypass mechanisms
    - All failures are security events
    """
    
    # Paths that bypass kernel (auth, health, etc.)
    EXEMPT_PATHS = {
        "/health",
        "/api/health",
        "/docs",
        "/openapi.json",
        "/redoc",
        "/api/auth/login",
        "/api/auth/register",
        "/api/auth/refresh",
    }
    
    # HTTP header names
    HEADER_FIRM_ID = "X-Firm-ID"
    HEADER_TENANT_ID = "X-Tenant-ID"  # Legacy, fallback
    HEADER_USER_ID = "X-User-ID"
    HEADER_USER_EMAIL = "X-User-Email"
    HEADER_USER_ROLE = "X-User-Role"
    
    def __init__(self):
        """Initialize kernel with JWT decoder."""
        # JWT Runtime Fix: Unify JWT_SECRET and SECRET_KEY. No hardcoded fallback.
        _secret = os.environ.get("JWT_SECRET") or os.environ.get("SECRET_KEY")
        if not _secret:
            raise RuntimeError(
                "FATAL: Neither JWT_SECRET nor SECRET_KEY is set in environment. "
                "JWT signing/validation cannot proceed."
            )
        self.secret_key = _secret
        self.algorithm = "HS256"
    
    def should_validate(self, request: Request) -> bool:
        """
        PHASE 3: Determine if request requires kernel validation.
        Exempt paths skip kernel but still get minimal context.
        """
        return request.url.path not in self.EXEMPT_PATHS
    
    async def validate_request(self, request: Request) -> TenantContext:
        """
        PHASE 3: Main kernel entry point.
        
        Executes complete validation pipeline:
        1. Extract JWT token
        2. Extract headers
        3. Decode JWT signature
        4. Resolve tenant from JWT (primary)
        5. Validate header consistency (secondary)
        6. Build immutable TenantContext
        7. Log security events
        
        Returns:
            TenantContext: Immutable, validated tenant context
            
        Raises:
            InvalidJWTError (401): JWT invalid or expired
            TenantMismatchError (403): JWT firm_id != header (spoofing attempt)
            MissingTenantError (500): Cannot resolve tenant (system failure)
            TenantValidationError (500): Kernel validation failed
        """
        
        request_id = self._generate_request_id()
        ip_address = request.client.host if request.client else "unknown"
        
        logger.info(
            f"[TENANT_KERNEL_START] request_id={request_id} | "
            f"path={request.url.path} | method={request.method} | "
            f"ip={ip_address}"
        )
        
        try:
            # Step 1: Extract JWT token
            jwt_token = self._extract_jwt_token(request)
            if not jwt_token:
                logger.warning(
                    f"[TENANT_KERNEL] Missing JWT token. "
                    f"request_id={request_id} | path={request.url.path}"
                )
                raise InvalidJWTError("Missing or invalid JWT token")
            
            # Step 2: Decode JWT (this validates signature)
            jwt_payload = self._decode_jwt(jwt_token)
            if not jwt_payload:
                logger.warning(
                    f"[TENANT_KERNEL] JWT decode failed. "
                    f"request_id={request_id}"
                )
                raise InvalidJWTError("JWT token decode failed")
            
            # Step 3: Extract firm_id from JWT (PRIMARY SOURCE)
            jwt_firm_id = jwt_payload.get("firm_id")
            jwt_user_id = jwt_payload.get("user_id")
            jwt_user_email = jwt_payload.get("email")
            jwt_user_role = jwt_payload.get("role", "user")
            
            if not jwt_firm_id or not jwt_user_id:
                logger.warning(
                    f"[TENANT_KERNEL] Missing required JWT claims. "
                    f"request_id={request_id} | "
                    f"has_firm_id={bool(jwt_firm_id)} | "
                    f"has_user_id={bool(jwt_user_id)}"
                )
                raise TenantValidationError("Missing required JWT claims")
            
            logger.info(
                f"[TENANT_RESOLVED] from JWT. "
                f"request_id={request_id} | firm_id={jwt_firm_id} | "
                f"user_id={jwt_user_id}"
            )
            
            # Step 4: Extract and validate headers (consistency check)
            header_firm_id = self._extract_header_firm_id(request)
            
            # Step 5: Validate header consistency (spoofing detection)
            if header_firm_id and header_firm_id != jwt_firm_id:
                logger.critical(
                    f"[TENANT_MISMATCH] JWT ≠ HEADER (SECURITY EVENT). "
                    f"request_id={request_id} | "
                    f"jwt_firm_id={jwt_firm_id} | "
                    f"header_firm_id={header_firm_id} | "
                    f"ip={ip_address} | "
                    f"user_id={jwt_user_id} | "
                    f"path={request.url.path}"
                )
                raise TenantMismatchError(
                    f"Tenant mismatch: JWT firm_id={jwt_firm_id} != "
                    f"header firm_id={header_firm_id}"
                )
            
            # Step 6: Build immutable TenantContext
            tenant_context = TenantContext(
                firm_id=jwt_firm_id,
                user_id=jwt_user_id,
                user_email=jwt_user_email or "unknown",
                user_role=jwt_user_role,
                request_id=request_id,
                ip_address=ip_address,
                timestamp=datetime.utcnow(),
                validation_source="JWT",
            )
            
            # Step 7: Verify integrity (sanity check)
            if not tenant_context.verify_integrity():
                logger.critical(
                    f"[TENANT_KERNEL_FAIL] Integrity check failed. "
                    f"request_id={request_id}"
                )
                raise TenantValidationError("TenantContext integrity check failed")
            
            # Step 8: Log successful validation
            logger.info(
                f"[TENANT_VALIDATION_OK] Kernel validation complete. "
                f"request_id={request_id} | firm_id={jwt_firm_id} | "
                f"user_id={jwt_user_id} | validation_source=JWT"
            )
            
            return tenant_context
            
        except (InvalidJWTError, TenantMismatchError, TenantValidationError) as e:
            # These are expected security/validation errors
            raise e
        except Exception as e:
            logger.critical(
                f"[TENANT_KERNEL_FAIL] Unexpected kernel error. "
                f"request_id={request_id} | error={str(e)}"
            )
            raise TenantKernelError(f"Kernel validation failed: {str(e)}")
    
    def _extract_jwt_token(self, request: Request) -> Optional[str]:
        """Extract JWT token from Authorization header."""
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            return auth_header[7:]
        return None
    
    def _decode_jwt(self, token: str) -> Optional[Dict[str, Any]]:
        """
        Decode JWT token with signature validation.
        Returns payload dict or None if invalid.
        """
        try:
            from jose import jwt, JWTError
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            return payload
        except Exception as e:
            logger.warning(f"[TENANT_KERNEL] JWT decode error: {str(e)}")
            return None
    
    def _extract_header_firm_id(self, request: Request) -> Optional[str]:
        """
        Extract firm_id from headers (consistency check only).
        Priority: X-Firm-ID (new) > X-Tenant-ID (legacy)
        """
        return (
            request.headers.get(self.HEADER_FIRM_ID) or
            request.headers.get(self.HEADER_TENANT_ID)
        )
    
    @staticmethod
    def _generate_request_id() -> str:
        """Generate unique request ID for tracing."""
        return str(uuid.uuid4())
    
    def build_kernel_context_for_exempt_path(
        self,
        request: Request
    ) -> Optional[TenantContext]:
        """
        PHASE 9: Build minimal context for exempt paths.
        Allows health checks, auth endpoints to proceed without full validation.
        Returns None if cannot build minimal context (e.g., no headers provided).
        """
        try:
            request_id = self._generate_request_id()
            ip_address = request.client.host if request.client else "unknown"
            
            return TenantContext(
                firm_id="exempt",
                user_id="exempt",
                user_email="exempt@system",
                user_role="system",
                request_id=request_id,
                ip_address=ip_address,
                timestamp=datetime.utcnow(),
                validation_source="EXEMPT_PATH",
            )
        except Exception as e:
            logger.debug(f"[TENANT_KERNEL] Could not build exempt context: {str(e)}")
            return None


# PHASE 9: Global singleton kernel instance
_kernel_instance = None


def get_tenant_kernel() -> TenantKernel:
    """Get or create global kernel instance (singleton)."""
    global _kernel_instance
    if _kernel_instance is None:
        _kernel_instance = TenantKernel()
    return _kernel_instance


# Re-export TenantContext for convenience
__all__ = ["TenantKernel", "TenantContext", "get_tenant_kernel"]
