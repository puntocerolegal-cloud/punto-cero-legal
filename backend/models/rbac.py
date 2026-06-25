from datetime import datetime
from typing import Optional, List, Dict
from pydantic import BaseModel, Field
from enum import Enum


class FirmRole(str, Enum):
    """Roles disponibles en Firm OS"""
    FIRM_OWNER = "firm_owner"
    PARTNER = "partner"
    SENIOR_LAWYER = "senior_lawyer"
    LAWYER = "lawyer"
    PARALEGAL = "paralegal"
    ASSISTANT = "assistant"
    FINANCE = "finance"
    HR = "hr"


class Module(str, Enum):
    """Módulos del sistema"""
    DASHBOARD = "dashboard"
    LAWYERS = "lawyers"
    CASES = "cases"
    FINANCE = "finance"
    ANALYTICS = "analytics"
    SETTINGS = "settings"
    TEAM = "team"
    DOCUMENTS = "documents"
    AGENDA = "agenda"
    CONFIGURATION = "configuration"


class Permission(str, Enum):
    """Permisos granulares"""
    # Dashboard
    VIEW_DASHBOARD = "view_dashboard"
    
    # Lawyers/Team
    VIEW_LAWYERS = "view_lawyers"
    CREATE_LAWYER = "create_lawyer"
    UPDATE_LAWYER = "update_lawyer"
    DELETE_LAWYER = "delete_lawyer"
    MANAGE_ROLES = "manage_roles"
    
    # Cases
    VIEW_CASES = "view_cases"
    CREATE_CASE = "create_case"
    UPDATE_CASE = "update_case"
    DELETE_CASE = "delete_case"
    ASSIGN_CASE = "assign_case"
    CLOSE_CASE = "close_case"
    
    # Finance
    VIEW_FINANCES = "view_finances"
    CREATE_INVOICE = "create_invoice"
    UPDATE_INVOICE = "update_invoice"
    DELETE_INVOICE = "delete_invoice"
    PROCESS_PAYMENT = "process_payment"
    VIEW_PAYMENTS = "view_payments"
    
    # Analytics
    VIEW_ANALYTICS = "view_analytics"
    EXPORT_ANALYTICS = "export_analytics"
    
    # Documents
    VIEW_DOCUMENTS = "view_documents"
    UPLOAD_DOCUMENT = "upload_document"
    DELETE_DOCUMENT = "delete_document"
    SHARE_DOCUMENT = "share_document"
    
    # Agenda
    VIEW_AGENDA = "view_agenda"
    CREATE_EVENT = "create_event"
    UPDATE_EVENT = "update_event"
    DELETE_EVENT = "delete_event"
    
    # Configuration & Settings
    VIEW_SETTINGS = "view_settings"
    UPDATE_SETTINGS = "update_settings"
    MANAGE_INTEGRATIONS = "manage_integrations"
    MANAGE_CONFIGURATION = "manage_configuration"
    
    # HR & Team
    VIEW_TEAM = "view_team"
    MANAGE_TEAM = "manage_team"
    VIEW_PAYROLL = "view_payroll"
    MANAGE_PAYROLL = "manage_payroll"


class RolePermission(BaseModel):
    """Mapeo de rol → permisos"""
    id: Optional[str] = Field(None, alias="_id")
    firm_id: str
    role: FirmRole
    permissions: List[Permission] = Field(default_factory=list)
    modules: List[Module] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True


class UserRole(BaseModel):
    """Asignación de rol a usuario dentro de una firma"""
    id: Optional[str] = Field(None, alias="_id")
    firm_id: str
    user_id: str
    role: FirmRole
    assigned_at: datetime = Field(default_factory=datetime.utcnow)
    assigned_by: Optional[str] = None  # ID del admin que asignó
    
    class Config:
        populate_by_name = True


class PermissionCheck(BaseModel):
    """Resultado de validación de permiso"""
    has_permission: bool
    reason: Optional[str] = None
    role: Optional[str] = None
    required_permission: Optional[str] = None


# MATRIZ DE PERMISOS POR ROL
ROLE_PERMISSIONS = {
    FirmRole.FIRM_OWNER: {
        "permissions": [
            Permission.VIEW_DASHBOARD,
            Permission.VIEW_LAWYERS, Permission.CREATE_LAWYER, Permission.UPDATE_LAWYER, 
            Permission.DELETE_LAWYER, Permission.MANAGE_ROLES,
            Permission.VIEW_CASES, Permission.CREATE_CASE, Permission.UPDATE_CASE, 
            Permission.DELETE_CASE, Permission.ASSIGN_CASE, Permission.CLOSE_CASE,
            Permission.VIEW_FINANCES, Permission.CREATE_INVOICE, Permission.UPDATE_INVOICE,
            Permission.DELETE_INVOICE, Permission.PROCESS_PAYMENT, Permission.VIEW_PAYMENTS,
            Permission.VIEW_ANALYTICS, Permission.EXPORT_ANALYTICS,
            Permission.VIEW_DOCUMENTS, Permission.UPLOAD_DOCUMENT, Permission.DELETE_DOCUMENT,
            Permission.SHARE_DOCUMENT,
            Permission.VIEW_AGENDA, Permission.CREATE_EVENT, Permission.UPDATE_EVENT,
            Permission.DELETE_EVENT,
            Permission.VIEW_SETTINGS, Permission.UPDATE_SETTINGS, Permission.MANAGE_INTEGRATIONS,
            Permission.MANAGE_CONFIGURATION,
            Permission.VIEW_TEAM, Permission.MANAGE_TEAM, Permission.VIEW_PAYROLL,
            Permission.MANAGE_PAYROLL,
        ],
        "modules": list(Module),
        "description": "Acceso total al sistema"
    },
    
    FirmRole.PARTNER: {
        "permissions": [
            Permission.VIEW_DASHBOARD,
            Permission.VIEW_LAWYERS, Permission.CREATE_LAWYER, Permission.UPDATE_LAWYER,
            Permission.VIEW_CASES, Permission.CREATE_CASE, Permission.UPDATE_CASE,
            Permission.ASSIGN_CASE, Permission.CLOSE_CASE,
            Permission.VIEW_FINANCES, Permission.VIEW_PAYMENTS,
            Permission.VIEW_ANALYTICS,
            Permission.VIEW_DOCUMENTS, Permission.UPLOAD_DOCUMENT, Permission.SHARE_DOCUMENT,
            Permission.VIEW_AGENDA,
            Permission.VIEW_SETTINGS, Permission.VIEW_TEAM,
        ],
        "modules": [Module.DASHBOARD, Module.LAWYERS, Module.CASES, Module.FINANCE, 
                   Module.ANALYTICS, Module.DOCUMENTS, Module.AGENDA, Module.TEAM],
        "description": "Gestión jurídica y casos"
    },
    
    FirmRole.SENIOR_LAWYER: {
        "permissions": [
            Permission.VIEW_DASHBOARD,
            Permission.VIEW_LAWYERS,
            Permission.VIEW_CASES, Permission.CREATE_CASE, Permission.UPDATE_CASE,
            Permission.VIEW_DOCUMENTS, Permission.UPLOAD_DOCUMENT, Permission.SHARE_DOCUMENT,
            Permission.VIEW_AGENDA, Permission.CREATE_EVENT, Permission.UPDATE_EVENT,
            Permission.VIEW_ANALYTICS,
        ],
        "modules": [Module.DASHBOARD, Module.CASES, Module.DOCUMENTS, Module.AGENDA, Module.ANALYTICS],
        "description": "Gestión de casos senior y mentoría"
    },
    
    FirmRole.LAWYER: {
        "permissions": [
            Permission.VIEW_DASHBOARD,
            Permission.VIEW_CASES, Permission.UPDATE_CASE,
            Permission.VIEW_DOCUMENTS, Permission.UPLOAD_DOCUMENT,
            Permission.VIEW_AGENDA, Permission.CREATE_EVENT, Permission.UPDATE_EVENT,
            Permission.VIEW_ANALYTICS,
        ],
        "modules": [Module.DASHBOARD, Module.CASES, Module.DOCUMENTS, Module.AGENDA, Module.ANALYTICS],
        "description": "Gestión de casos asignados"
    },
    
    FirmRole.PARALEGAL: {
        "permissions": [
            Permission.VIEW_DASHBOARD,
            Permission.VIEW_CASES, Permission.UPDATE_CASE,
            Permission.VIEW_DOCUMENTS, Permission.UPLOAD_DOCUMENT,
            Permission.VIEW_AGENDA, Permission.CREATE_EVENT,
        ],
        "modules": [Module.DASHBOARD, Module.CASES, Module.DOCUMENTS, Module.AGENDA],
        "description": "Soporte en casos y documentos"
    },
    
    FirmRole.ASSISTANT: {
        "permissions": [
            Permission.VIEW_DASHBOARD,
            Permission.VIEW_AGENDA, Permission.CREATE_EVENT, Permission.UPDATE_EVENT,
            Permission.VIEW_DOCUMENTS, Permission.UPLOAD_DOCUMENT,
        ],
        "modules": [Module.DASHBOARD, Module.AGENDA, Module.DOCUMENTS],
        "description": "Gestión de agenda y documentos"
    },
    
    FirmRole.FINANCE: {
        "permissions": [
            Permission.VIEW_DASHBOARD,
            Permission.VIEW_FINANCES, Permission.CREATE_INVOICE, Permission.UPDATE_INVOICE,
            Permission.PROCESS_PAYMENT, Permission.VIEW_PAYMENTS,
            Permission.VIEW_ANALYTICS,
        ],
        "modules": [Module.DASHBOARD, Module.FINANCE, Module.ANALYTICS],
        "description": "Facturación, pagos e ingresos"
    },
    
    FirmRole.HR: {
        "permissions": [
            Permission.VIEW_DASHBOARD,
            Permission.VIEW_TEAM, Permission.MANAGE_TEAM,
            Permission.VIEW_PAYROLL, Permission.MANAGE_PAYROLL,
            Permission.VIEW_ANALYTICS,
        ],
        "modules": [Module.DASHBOARD, Module.TEAM, Module.ANALYTICS],
        "description": "Gestión de equipo y talento"
    },
}


def get_role_permissions(role: FirmRole) -> Dict:
    """Obtener permisos de un rol"""
    return ROLE_PERMISSIONS.get(role, {"permissions": [], "modules": []})


def check_permission(role: FirmRole, required_permission: Permission) -> bool:
    """Validar si un rol tiene un permiso específico"""
    permissions = get_role_permissions(role).get("permissions", [])
    return required_permission in permissions


def check_module_access(role: FirmRole, module: Module) -> bool:
    """Validar si un rol puede acceder a un módulo"""
    modules = get_role_permissions(role).get("modules", [])
    return module in modules
