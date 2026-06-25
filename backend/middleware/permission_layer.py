"""
Permission Layer - Multi-User & Multi-Tenant

Valida permisos considerando:
1. Modo (independiente vs firma)
2. Organización (usuario vs firma)
3. RBAC (roles y permisos)
4. Propiedad (es propietario del recurso)
5. Asignación (está asignado al caso/proyecto)
"""

from fastapi import HTTPException, status
from typing import Dict, List, Optional, Any
from models.rbac import FirmRole, check_permission, check_module_access
from middleware.mode_resolver import ModeAwareFilter


class PermissionDeniedException(HTTPException):
    def __init__(self, message: str = "No tienes permiso para acceder a este recurso"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=message
        )


class MultiUserPermissionValidator:
    """
    Valida permisos en modo multiusuario.
    
    Reglas:
    1. INDEPENDIENTE: Usuario solo accede a sus propios recursos
    2. FIRMA: Usuario accede según su rol + RBAC
    """
    
    @staticmethod
    def can_read_resource(
        user_context: Dict,
        resource: Dict,
        resource_type: str = "generic"
    ) -> bool:
        """¿Puede el usuario LEER este recurso?"""
        
        # Independiente: Solo sus recursos
        if user_context["is_independent"]:
            owner = resource.get("owner_id")
            creator = resource.get("created_by")
            user_id = user_context["user_id"]
            return owner == user_id or creator == user_id
        
        # Firma: Verificar pertenencia + RBAC
        if user_context["is_firm"]:
            firm_id = resource.get("firm_id")
            org_id = user_context["organization_id"]
            
            if firm_id != org_id:
                return False
            
            # Casi todos pueden leer en su firma
            return True
        
        return False
    
    @staticmethod
    def can_write_resource(
        user_context: Dict,
        resource: Dict,
        resource_type: str = "generic"
    ) -> bool:
        """¿Puede el usuario ESCRIBIR/ACTUALIZAR este recurso?"""
        
        # Independiente: Solo sus recursos
        if user_context["is_independent"]:
            owner = resource.get("owner_id")
            user_id = user_context["user_id"]
            return owner == user_id
        
        # Firma: Validar RBAC
        if user_context["is_firm"]:
            firm_id = resource.get("firm_id")
            org_id = user_context["organization_id"]
            
            if firm_id != org_id:
                return False
            
            # Verificar rol
            role = user_context["role"]
            allowed_roles = ["firm_owner", "partner", "senior_lawyer"]
            
            if resource_type == "case":
                return role in allowed_roles
            elif resource_type == "contact":
                return role in allowed_roles
            elif resource_type == "invoice":
                return role in ["firm_owner", "finance"]
            
            return role in allowed_roles
        
        return False
    
    @staticmethod
    def can_delete_resource(
        user_context: Dict,
        resource: Dict,
        resource_type: str = "generic"
    ) -> bool:
        """¿Puede el usuario ELIMINAR este recurso?"""
        
        # Independiente: Solo sus recursos
        if user_context["is_independent"]:
            owner = resource.get("owner_id")
            user_id = user_context["user_id"]
            return owner == user_id
        
        # Firma: Solo firm_owner
        if user_context["is_firm"]:
            firm_id = resource.get("firm_id")
            org_id = user_context["organization_id"]
            
            if firm_id != org_id:
                return False
            
            # Solo firm_owner puede eliminar
            return user_context["role"] == "firm_owner"
        
        return False
    
    @staticmethod
    def can_assign_resource(
        user_context: Dict,
        target_user_id: str,
        resource: Dict
    ) -> bool:
        """¿Puede el usuario asignar este recurso a otro?"""
        
        # Independiente: No puede asignar
        if user_context["is_independent"]:
            return False
        
        # Firma: Solo firm_owner y partner
        if user_context["is_firm"]:
            firm_id = resource.get("firm_id")
            org_id = user_context["organization_id"]
            
            if firm_id != org_id:
                return False
            
            allowed_roles = ["firm_owner", "partner"]
            return user_context["role"] in allowed_roles
        
        return False


class ResourceAccessValidator:
    """
    Valida acceso a recursos específicos antes de operaciones CRUD.
    """
    
    @staticmethod
    async def validate_read_access(
        user_context: Dict,
        resource: Dict,
        resource_type: str = "generic"
    ) -> None:
        """Valida lectura, lanza excepción si no puede"""
        if not MultiUserPermissionValidator.can_read_resource(
            user_context, resource, resource_type
        ):
            raise PermissionDeniedException(
                f"No tienes permiso para ver este {resource_type}"
            )
    
    @staticmethod
    async def validate_write_access(
        user_context: Dict,
        resource: Dict,
        resource_type: str = "generic"
    ) -> None:
        """Valida escritura, lanza excepción si no puede"""
        if not MultiUserPermissionValidator.can_write_resource(
            user_context, resource, resource_type
        ):
            raise PermissionDeniedException(
                f"No tienes permiso para editar este {resource_type}"
            )
    
    @staticmethod
    async def validate_delete_access(
        user_context: Dict,
        resource: Dict,
        resource_type: str = "generic"
    ) -> None:
        """Valida eliminación, lanza excepción si no puede"""
        if not MultiUserPermissionValidator.can_delete_resource(
            user_context, resource, resource_type
        ):
            raise PermissionDeniedException(
                f"No tienes permiso para eliminar este {resource_type}"
            )
    
    @staticmethod
    async def validate_assign_access(
        user_context: Dict,
        target_user_id: str,
        resource: Dict
    ) -> None:
        """Valida asignación, lanza excepción si no puede"""
        if not MultiUserPermissionValidator.can_assign_resource(
            user_context, target_user_id, resource
        ):
            raise PermissionDeniedException(
                "No tienes permiso para asignar este recurso"
            )


class ResourceFilter:
    """
    Filtra listas de recursos según permisos del usuario.
    """
    
    @staticmethod
    def filter_readable(
        user_context: Dict,
        resources: List[Dict],
        resource_type: str = "generic"
    ) -> List[Dict]:
        """Retorna solo recursos que el usuario puede leer"""
        return [
            r for r in resources
            if MultiUserPermissionValidator.can_read_resource(
                user_context, r, resource_type
            )
        ]
    
    @staticmethod
    def filter_writable(
        user_context: Dict,
        resources: List[Dict],
        resource_type: str = "generic"
    ) -> List[Dict]:
        """Retorna solo recursos que el usuario puede escribir"""
        return [
            r for r in resources
            if MultiUserPermissionValidator.can_write_resource(
                user_context, r, resource_type
            )
        ]
    
    @staticmethod
    def filter_assigned_to_user(
        user_context: Dict,
        resources: List[Dict]
    ) -> List[Dict]:
        """Retorna solo recursos asignados al usuario"""
        user_id = user_context["user_id"]
        return [
            r for r in resources
            if user_id in r.get("lawyers_assigned", []) or r.get("assigned_to") == user_id
        ]


class PermissionMatrix:
    """
    Matriz de permisos: qué puede hacer cada rol en cada recurso
    """
    
    PERMISSIONS = {
        # INDEPENDIENTE (1 usuario, acceso total a sus propios recursos)
        "independent": {
            "case": {
                "read": True,
                "create": True,
                "write": True,
                "delete": True,
                "assign": False
            },
            "contact": {
                "read": True,
                "create": True,
                "write": True,
                "delete": True,
                "assign": False
            },
            "invoice": {
                "read": True,
                "create": True,
                "write": True,
                "delete": True,
                "assign": False
            },
            "document": {
                "read": True,
                "create": True,
                "write": True,
                "delete": True,
                "assign": False
            },
            "appointment": {
                "read": True,
                "create": True,
                "write": True,
                "delete": True,
                "assign": False
            }
        },
        # FIRMA (multiusuario con roles)
        "firm": {
            "case": {
                "firm_owner": {"read": True, "create": True, "write": True, "delete": True, "assign": True},
                "partner": {"read": True, "create": True, "write": True, "delete": False, "assign": True},
                "senior_lawyer": {"read": True, "create": True, "write": True, "delete": False, "assign": False},
                "lawyer": {"read": True, "create": False, "write": True, "delete": False, "assign": False},
                "paralegal": {"read": True, "create": False, "write": True, "delete": False, "assign": False},
                "assistant": {"read": True, "create": False, "write": False, "delete": False, "assign": False},
                "finance": {"read": True, "create": False, "write": False, "delete": False, "assign": False},
                "hr": {"read": True, "create": False, "write": False, "delete": False, "assign": False},
            },
            "contact": {
                "firm_owner": {"read": True, "create": True, "write": True, "delete": True, "assign": True},
                "partner": {"read": True, "create": True, "write": True, "delete": False, "assign": True},
                "senior_lawyer": {"read": True, "create": True, "write": True, "delete": False, "assign": False},
                "lawyer": {"read": True, "create": True, "write": True, "delete": False, "assign": False},
                "paralegal": {"read": True, "create": True, "write": True, "delete": False, "assign": False},
                "assistant": {"read": True, "create": False, "write": False, "delete": False, "assign": False},
                "finance": {"read": True, "create": False, "write": False, "delete": False, "assign": False},
                "hr": {"read": True, "create": False, "write": False, "delete": False, "assign": False},
            },
            "invoice": {
                "firm_owner": {"read": True, "create": True, "write": True, "delete": True, "assign": False},
                "partner": {"read": True, "create": True, "write": True, "delete": False, "assign": False},
                "finance": {"read": True, "create": True, "write": True, "delete": False, "assign": False},
                "senior_lawyer": {"read": True, "create": False, "write": False, "delete": False, "assign": False},
                "lawyer": {"read": True, "create": False, "write": False, "delete": False, "assign": False},
                "paralegal": {"read": True, "create": False, "write": False, "delete": False, "assign": False},
                "assistant": {"read": False, "create": False, "write": False, "delete": False, "assign": False},
                "hr": {"read": True, "create": False, "write": False, "delete": False, "assign": False},
            },
            "document": {
                "firm_owner": {"read": True, "create": True, "write": True, "delete": True, "assign": True},
                "partner": {"read": True, "create": True, "write": True, "delete": False, "assign": True},
                "senior_lawyer": {"read": True, "create": True, "write": True, "delete": False, "assign": False},
                "lawyer": {"read": True, "create": True, "write": True, "delete": False, "assign": False},
                "paralegal": {"read": True, "create": True, "write": True, "delete": False, "assign": False},
                "assistant": {"read": True, "create": True, "write": True, "delete": False, "assign": False},
                "finance": {"read": True, "create": False, "write": False, "delete": False, "assign": False},
                "hr": {"read": True, "create": False, "write": False, "delete": False, "assign": False},
            },
        }
    }
    
    @classmethod
    def get_permission(
        cls,
        mode: str,
        resource_type: str,
        role: Optional[str] = None,
        action: str = "read"
    ) -> bool:
        """Obtener permiso desde la matriz"""
        
        if mode == "independent":
            return cls.PERMISSIONS["independent"][resource_type][action]
        
        elif mode == "firm":
            perms = cls.PERMISSIONS["firm"].get(resource_type, {})
            if role:
                return perms.get(role, {}).get(action, False)
        
        return False
