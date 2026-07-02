"""
Enterprise Exception Handling
Custom exceptions for business logic, security, and multi-tenancy
"""

from fastapi import HTTPException, status
from typing import Optional, Dict, Any


# ============================================================================
# MULTI-TENANCY EXCEPTIONS
# ============================================================================

class TenantException(Exception):
    """Base tenant exception"""
    def __init__(self, message: str, code: str = "TENANT_ERROR"):
        self.message = message
        self.code = code
        super().__init__(self.message)


class TenantNotFound(TenantException):
    """Firm/Tenant not found"""
    def __init__(self, firm_id: str):
        super().__init__(
            f"Tenant (Firm) not found: {firm_id}",
            "TENANT_NOT_FOUND"
        )
        self.http_detail = HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"message": "Firm not found", "code": "TENANT_NOT_FOUND"}
        )


class TenantIsolationViolation(TenantException):
    """Cross-tenant data access attempt"""
    def __init__(self, requested_firm_id: str, user_firm_id: str):
        super().__init__(
            f"Tenant isolation violation: user from {user_firm_id} attempted to access {requested_firm_id}",
            "TENANT_ISOLATION_VIOLATION"
        )
        self.http_detail = HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"message": "Unauthorized tenant access", "code": "TENANT_ISOLATION_VIOLATION"}
        )


class TenantQuotaExceeded(TenantException):
    """Tenant exceeded subscription limits"""
    def __init__(self, firm_id: str, limit_type: str, current: int, max_allowed: int):
        super().__init__(
            f"Quota exceeded: {limit_type} ({current} / {max_allowed}) for firm {firm_id}",
            "TENANT_QUOTA_EXCEEDED"
        )
        self.limit_type = limit_type
        self.current = current
        self.max_allowed = max_allowed
        self.http_detail = HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail={
                "message": f"Quota exceeded: {limit_type}",
                "code": "TENANT_QUOTA_EXCEEDED",
                "limit_type": limit_type,
                "current": current,
                "max_allowed": max_allowed
            }
        )


# ============================================================================
# AUTHENTICATION EXCEPTIONS
# ============================================================================

class AuthenticationException(Exception):
    """Base authentication exception"""
    def __init__(self, message: str, code: str = "AUTH_ERROR"):
        self.message = message
        self.code = code
        super().__init__(self.message)


class InvalidCredentials(AuthenticationException):
    """Invalid email/password"""
    def __init__(self):
        super().__init__(
            "Invalid email or password",
            "INVALID_CREDENTIALS"
        )
        self.http_detail = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"message": "Invalid credentials", "code": "INVALID_CREDENTIALS"}
        )


class UserNotFound(AuthenticationException):
    """User does not exist"""
    def __init__(self, email: str):
        super().__init__(
            f"User not found: {email}",
            "USER_NOT_FOUND"
        )
        self.http_detail = HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"message": "User not found", "code": "USER_NOT_FOUND"}
        )


class UserInactive(AuthenticationException):
    """User account is inactive"""
    def __init__(self, user_id: str):
        super().__init__(
            f"User inactive: {user_id}",
            "USER_INACTIVE"
        )
        self.http_detail = HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"message": "User account is inactive", "code": "USER_INACTIVE"}
        )


class InvalidToken(AuthenticationException):
    """Token is invalid or expired"""
    def __init__(self):
        super().__init__(
            "Invalid or expired token",
            "INVALID_TOKEN"
        )
        self.http_detail = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"message": "Invalid or expired token", "code": "INVALID_TOKEN"}
        )


class MFARequired(AuthenticationException):
    """MFA challenge required"""
    def __init__(self, user_id: str):
        super().__init__(
            f"MFA required for user: {user_id}",
            "MFA_REQUIRED"
        )
        self.http_detail = HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"message": "MFA verification required", "code": "MFA_REQUIRED"}
        )


# ============================================================================
# AUTHORIZATION (RBAC) EXCEPTIONS
# ============================================================================

class AuthorizationException(Exception):
    """Base authorization exception"""
    def __init__(self, message: str, code: str = "AUTHZ_ERROR"):
        self.message = message
        self.code = code
        super().__init__(self.message)


class PermissionDenied(AuthorizationException):
    """User lacks required permission"""
    def __init__(self, required_permission: str, required_action: str):
        super().__init__(
            f"Permission denied: {required_permission}:{required_action}",
            "PERMISSION_DENIED"
        )
        self.required_permission = required_permission
        self.required_action = required_action
        self.http_detail = HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "message": "Permission denied",
                "code": "PERMISSION_DENIED",
                "required_permission": required_permission,
                "required_action": required_action
            }
        )


class InsufficientRole(AuthorizationException):
    """User role is insufficient for action"""
    def __init__(self, user_role: str, required_role: str, required_rank: int, user_rank: int):
        super().__init__(
            f"Insufficient role: {user_role} (rank {user_rank}) requires {required_role} (rank {required_rank})",
            "INSUFFICIENT_ROLE"
        )
        self.http_detail = HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "message": "Insufficient role",
                "code": "INSUFFICIENT_ROLE",
                "user_role": user_role,
                "required_role": required_role
            }
        )


class AccessDenied(AuthorizationException):
    """Resource access denied"""
    def __init__(self, resource_type: str, resource_id: str, reason: str = "Access denied"):
        super().__init__(
            f"Access denied: {resource_type} {resource_id}. {reason}",
            "ACCESS_DENIED"
        )
        self.http_detail = HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "message": "Access denied",
                "code": "ACCESS_DENIED",
                "resource_type": resource_type,
                "resource_id": resource_id,
                "reason": reason
            }
        )


# ============================================================================
# VALIDATION EXCEPTIONS
# ============================================================================

class ValidationException(Exception):
    """Base validation exception"""
    def __init__(self, message: str, field: Optional[str] = None, code: str = "VALIDATION_ERROR"):
        self.message = message
        self.field = field
        self.code = code
        super().__init__(self.message)


class InvalidInput(ValidationException):
    """Invalid input data"""
    def __init__(self, field: str, message: str):
        super().__init__(
            f"Invalid input: {field} - {message}",
            field=field,
            code="INVALID_INPUT"
        )
        self.http_detail = HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "message": message,
                "code": "INVALID_INPUT",
                "field": field
            }
        )


class DuplicateResource(ValidationException):
    """Resource already exists"""
    def __init__(self, resource_type: str, unique_field: str, value: str):
        super().__init__(
            f"{resource_type} with {unique_field}={value} already exists",
            field=unique_field,
            code="DUPLICATE_RESOURCE"
        )
        self.http_detail = HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "message": f"{resource_type} already exists",
                "code": "DUPLICATE_RESOURCE",
                "field": unique_field
            }
        )


class ResourceNotFound(ValidationException):
    """Resource not found"""
    def __init__(self, resource_type: str, resource_id: str):
        super().__init__(
            f"{resource_type} not found: {resource_id}",
            code="RESOURCE_NOT_FOUND"
        )
        self.http_detail = HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "message": f"{resource_type} not found",
                "code": "RESOURCE_NOT_FOUND",
                "resource_type": resource_type,
                "resource_id": resource_id
            }
        )


# ============================================================================
# GOVERNANCE & COMPLIANCE EXCEPTIONS
# ============================================================================

class GovernanceException(Exception):
    """Base governance exception"""
    def __init__(self, message: str, code: str = "GOVERNANCE_ERROR"):
        self.message = message
        self.code = code
        super().__init__(self.message)


class ApprovalRequired(GovernanceException):
    """Action requires approval"""
    def __init__(self, action: str, reason: str):
        super().__init__(
            f"Approval required for {action}: {reason}",
            "APPROVAL_REQUIRED"
        )
        self.http_detail = HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "message": "Approval required",
                "code": "APPROVAL_REQUIRED",
                "action": action,
                "reason": reason
            }
        )


class PolicyViolation(GovernanceException):
    """Governance policy violation"""
    def __init__(self, policy_name: str, violation: str):
        super().__init__(
            f"Policy violation: {policy_name} - {violation}",
            "POLICY_VIOLATION"
        )
        self.http_detail = HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "message": "Policy violation",
                "code": "POLICY_VIOLATION",
                "policy": policy_name,
                "violation": violation
            }
        )


# ============================================================================
# BUSINESS LOGIC EXCEPTIONS
# ============================================================================

class BusinessLogicException(Exception):
    """Base business logic exception"""
    def __init__(self, message: str, code: str = "BUSINESS_ERROR"):
        self.message = message
        self.code = code
        super().__init__(self.message)


class InvalidStateTransition(BusinessLogicException):
    """Invalid state transition"""
    def __init__(self, resource_type: str, current_state: str, target_state: str):
        super().__init__(
            f"Invalid state transition for {resource_type}: {current_state} → {target_state}",
            "INVALID_STATE_TRANSITION"
        )
        self.http_detail = HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "message": "Invalid state transition",
                "code": "INVALID_STATE_TRANSITION",
                "resource_type": resource_type,
                "current_state": current_state,
                "target_state": target_state
            }
        )
