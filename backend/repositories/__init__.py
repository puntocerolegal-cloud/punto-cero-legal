"""
Repositories Package
Centralized data access layer with multi-tenant isolation

All repositories follow the Golden Repository Template v1.0 specification,
enforcing firm_id multi-tenant isolation and comprehensive auditing.
"""

from .enterprise_base_repository import BaseRepository
from .case_repository import CaseRepository
from .document_repository import DocumentRepository
from .document_access_log_repository import DocumentAccessLogRepository
from .firm_repository import FirmRepository
from .transaction import TransactionRepository
# Phase 1 Migration: New repositories for TenantKernel migration
from .webhook_event_repository import WebhookEventRepository
from .audit_log_repository import AuditLogRepository
from .user_repository import UserRepository
from .notification_repository import NotificationRepository
from .refund_repository import RefundRepository, ChargebackRepository
# Sprint S2-A Billing Foundation
from .invoice_repository import InvoiceRepository
from .commission_repository import CommissionRepository
# Sprint S1.5 Organizations Foundation
from .organization_repository import OrganizationRepository
from .office_repository import OfficeRepository
from .department_repository import DepartmentRepository
from .role_repository import RoleRepository
from .membership_repository import MembershipRepository
from .permission_repository import PermissionRepository

__all__ = [
    "BaseRepository",
    "CaseRepository",
    "DocumentRepository",
    "DocumentAccessLogRepository",
    "FirmRepository",
    "TransactionRepository",
    # Phase 1 Migration repositories
    "WebhookEventRepository",
    "AuditLogRepository",
    "UserRepository",
    "NotificationRepository",
    "RefundRepository",
    "ChargebackRepository",
    # Sprint S2-A Billing Foundation repositories
    "InvoiceRepository",
    "CommissionRepository",
    # Sprint S1.5 Organizations Foundation repositories
    "OrganizationRepository",
    "OfficeRepository",
    "DepartmentRepository",
    "RoleRepository",
    "MembershipRepository",
    "PermissionRepository",
]
