"""
Tenant Kernel Exception Hierarchy
Defines failure modes for tenant validation and resolution.
"""


class TenantKernelError(Exception):
    """Base exception for all kernel-level tenant errors."""
    pass


class TenantValidationError(TenantKernelError):
    """Raised when JWT signature or structure is invalid."""
    pass


class TenantMismatchError(TenantKernelError):
    """Raised when JWT firm_id != header X-Firm-ID (security event)."""
    pass


class MissingTenantError(TenantKernelError):
    """Raised when no valid tenant context can be resolved from request."""
    pass


class InvalidJWTError(TenantKernelError):
    """Raised when JWT token cannot be decoded or is expired."""
    pass
