from functools import wraps
from fastapi import HTTPException, status, Depends
from typing import Optional, List, Callable, Any
from models.rbac import FirmRole, Permission, Module, check_permission, check_module_access
from routes.auth import get_current_user


class RBACError(HTTPException):
    """Error de autorización RBAC"""
    def __init__(self, message: str = "No tienes permiso para acceder a este recurso"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=message
        )


def require_firm_role(*roles: FirmRole):
    """
    Decorador: Requerir uno o más roles específicos
    
    Uso:
        @require_firm_role(FirmRole.FIRM_OWNER, FirmRole.PARTNER)
        async def some_endpoint(...): ...
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs) -> Any:
            current_user = kwargs.get("current_user")
            if not current_user:
                raise RBACError("Usuario no autenticado")
            
            user_role = current_user.get("role")
            if user_role not in roles:
                allowed_roles = ", ".join([r.value for r in roles])
                raise RBACError(
                    f"Este recurso requiere uno de los siguientes roles: {allowed_roles}"
                )
            
            return await func(*args, **kwargs)
        
        return wrapper
    return decorator


def require_permission(permission: Permission):
    """
    Decorador: Requerir un permiso específico basado en el rol
    
    Uso:
        @require_permission(Permission.DELETE_CASE)
        async def delete_case(...): ...
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs) -> Any:
            current_user = kwargs.get("current_user")
            if not current_user:
                raise RBACError("Usuario no autenticado")
            
            user_role = FirmRole(current_user.get("role"))
            
            if not check_permission(user_role, permission):
                raise RBACError(
                    f"No tienes permiso para: {permission.value}"
                )
            
            return await func(*args, **kwargs)
        
        return wrapper
    return decorator


def require_module_access(module: Module):
    """
    Decorador: Requerir acceso a un módulo específico
    
    Uso:
        @require_module_access(Module.FINANCE)
        async def view_finances(...): ...
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs) -> Any:
            current_user = kwargs.get("current_user")
            if not current_user:
                raise RBACError("Usuario no autenticado")
            
            user_role = FirmRole(current_user.get("role"))
            
            if not check_module_access(user_role, module):
                raise RBACError(
                    f"No tienes acceso al módulo: {module.value}"
                )
            
            return await func(*args, **kwargs)
        
        return wrapper
    return decorator


def require_firm_owner():
    """Decorador simplificado: Solo firm_owner"""
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs) -> Any:
            current_user = kwargs.get("current_user")
            if not current_user:
                raise RBACError("Usuario no autenticado")
            
            if current_user.get("role") != FirmRole.FIRM_OWNER.value:
                raise RBACError("Solo firm_owner puede acceder a este recurso")
            
            return await func(*args, **kwargs)
        
        return wrapper
    return decorator


def verify_firm_access(current_user: dict, firm_id: str, allowed_roles: Optional[List[str]] = None) -> bool:
    """
    Función: Validar acceso a una firma específica
    
    Retorna True si:
    - El usuario es admin global
    - El usuario pertenece a la firma
    - El usuario tiene uno de los roles permitidos (si se especifican)
    """
    # Admin global siempre tiene acceso
    if current_user.get("role") in ["admin", "admin_general"]:
        return True
    
    # Verificar que el usuario pertenezca a la firma
    if current_user.get("firm_id") != firm_id:
        return False
    
    # Si se especifican roles permitidos, verificar
    if allowed_roles and current_user.get("role") not in allowed_roles:
        return False
    
    return True


def check_case_access(current_user: dict, case_data: dict) -> bool:
    """
    Función: Validar si un usuario puede ver/editar un caso específico
    
    Reglas:
    - firm_owner, partner, senior_lawyer: todos los casos
    - lawyer, paralegal: solo casos asignados
    - assistant: casos si está asignado a agenda/documentos
    """
    user_role = current_user.get("role")
    
    # Roles con acceso a todos los casos
    unrestricted_roles = ["firm_owner", "partner", "senior_lawyer"]
    if user_role in unrestricted_roles:
        return True
    
    # Para otros roles, verificar asignación específica
    user_id = str(current_user.get("_id"))
    lawyers_assigned = case_data.get("lawyers_assigned", [])
    
    if user_id in lawyers_assigned:
        return True
    
    return False


def filter_cases_by_role(current_user: dict, cases: List[dict]) -> List[dict]:
    """
    Función: Filtrar casos según el rol del usuario
    
    Retorna solo los casos que el usuario puede ver
    """
    user_role = current_user.get("role")
    user_id = str(current_user.get("_id"))
    
    # firm_owner, partner, senior_lawyer ven todos
    if user_role in ["firm_owner", "partner", "senior_lawyer"]:
        return cases
    
    # Otros roles solo ven casos asignados
    filtered = [
        case for case in cases
        if user_id in case.get("lawyers_assigned", [])
    ]
    
    return filtered


class PermissionValidator:
    """Clase para validaciones complejas de permisos"""
    
    @staticmethod
    def can_manage_lawyers(current_user: dict) -> bool:
        """¿Puede el usuario gestionar abogados?"""
        allowed_roles = ["firm_owner", "partner", "hr"]
        return current_user.get("role") in allowed_roles
    
    @staticmethod
    def can_manage_team(current_user: dict) -> bool:
        """¿Puede el usuario gestionar el equipo?"""
        allowed_roles = ["firm_owner", "partner", "hr"]
        return current_user.get("role") in allowed_roles
    
    @staticmethod
    def can_manage_finances(current_user: dict) -> bool:
        """¿Puede el usuario gestionar finanzas?"""
        allowed_roles = ["firm_owner", "partner", "finance"]
        return current_user.get("role") in allowed_roles
    
    @staticmethod
    def can_view_analytics(current_user: dict) -> bool:
        """¿Puede el usuario ver analytics?"""
        # Todos excepto assistant
        restricted = ["assistant"]
        return current_user.get("role") not in restricted
    
    @staticmethod
    def can_update_case(current_user: dict, case_data: dict) -> bool:
        """¿Puede el usuario actualizar un caso?"""
        user_role = current_user.get("role")
        
        # firm_owner y partner: siempre
        if user_role in ["firm_owner", "partner"]:
            return True
        
        # senior_lawyer: sí
        if user_role == "senior_lawyer":
            return True
        
        # lawyer, paralegal: solo si está asignado
        if user_role in ["lawyer", "paralegal"]:
            user_id = str(current_user.get("_id"))
            return user_id in case_data.get("lawyers_assigned", [])
        
        return False
    
    @staticmethod
    def can_close_case(current_user: dict) -> bool:
        """¿Puede el usuario cerrar casos?"""
        allowed_roles = ["firm_owner", "partner", "senior_lawyer"]
        return current_user.get("role") in allowed_roles
    
    @staticmethod
    def can_process_payment(current_user: dict) -> bool:
        """¿Puede el usuario procesar pagos?"""
        allowed_roles = ["firm_owner", "partner", "finance"]
        return current_user.get("role") in allowed_roles
    
    @staticmethod
    def can_manage_payroll(current_user: dict) -> bool:
        """¿Puede el usuario gestionar nómina?"""
        allowed_roles = ["firm_owner", "partner", "hr"]
        return current_user.get("role") in allowed_roles


# Decoradores de conveniencia para casos comunes
def require_case_manager():
    """Requerir que sea manager de casos (firm_owner, partner, senior_lawyer)"""
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs) -> Any:
            current_user = kwargs.get("current_user")
            if not PermissionValidator.can_update_case(current_user, {}):
                raise RBACError("No tienes permiso para gestionar casos")
            return await func(*args, **kwargs)
        return wrapper
    return decorator


def require_finance_manager():
    """Requerir que sea manager de finanzas"""
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs) -> Any:
            current_user = kwargs.get("current_user")
            if not PermissionValidator.can_manage_finances(current_user):
                raise RBACError("No tienes permiso para gestionar finanzas")
            return await func(*args, **kwargs)
        return wrapper
    return decorator


def require_team_manager():
    """Requerir que sea manager de equipo"""
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs) -> Any:
            current_user = kwargs.get("current_user")
            if not PermissionValidator.can_manage_team(current_user):
                raise RBACError("No tienes permiso para gestionar el equipo")
            return await func(*args, **kwargs)
        return wrapper
    return decorator
