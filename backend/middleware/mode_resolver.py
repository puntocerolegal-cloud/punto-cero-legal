"""
Mode Resolver Middleware

Detecta automáticamente si el usuario está operando en modo:
- 'independent': abogado independiente (1 usuario)
- 'firm': firma jurídica (multiusuario con RBAC)

Se ejecuta en cada solicitud para adjuntar contexto de modo.
"""

from fastapi import Request, Depends
from typing import Optional, Dict, Literal
from routes.auth import get_current_user


async def get_mode(current_user: dict = Depends(get_current_user)) -> Literal["independent", "firm"]:
    """
    Detecta el modo del usuario.
    
    Modo INDEPENDIENTE: usuario sin firm_id
    Modo FIRMA: usuario con firm_id
    """
    return "firm" if current_user.get("firm_id") else "independent"


async def get_mode_context(
    current_user: dict = Depends(get_current_user),
    mode: str = Depends(get_mode)
) -> Dict:
    """
    Retorna contexto completo del modo.
    
    Contiene:
    - mode: 'independent' | 'firm'
    - organization_id: user_id (independiente) | firm_id (firma)
    - user_id: ID del usuario
    - role: rol del usuario
    - scope: 'user' (independiente) | 'firm' (firma)
    """
    
    user_id = str(current_user.get("_id"))
    firm_id = current_user.get("firm_id")
    
    if mode == "firm":
        organization_id = firm_id
        scope = "firm"
    else:
        organization_id = user_id
        scope = "user"
    
    return {
        "mode": mode,
        "organization_id": organization_id,
        "user_id": user_id,
        "firm_id": firm_id,
        "role": current_user.get("role"),
        "scope": scope,
        "is_independent": mode == "independent",
        "is_firm": mode == "firm"
    }


def get_organization_id(mode_context: dict) -> str:
    """Obtener el ID de la organización (usuario o firma) según el modo"""
    return mode_context["organization_id"]


def is_independent_mode(mode_context: dict) -> bool:
    """¿Es modo independiente?"""
    return mode_context["mode"] == "independent"


def is_firm_mode(mode_context: dict) -> bool:
    """¿Es modo firma?"""
    return mode_context["mode"] == "firm"


class ModeAwareQuery:
    """
    Builder para queries que filtran automáticamente por modo.
    
    Ejemplo:
        query = ModeAwareQuery(mode_context).for_organization().build()
        # Retorna: {"owner_id": "user_id"} o {"firm_id": "firm_id"}
    """
    
    def __init__(self, mode_context: dict):
        self.mode_context = mode_context
        self.query = {}
    
    def for_organization(self) -> 'ModeAwareQuery':
        """Filtrar por organización (usuario o firma)"""
        if self.mode_context["is_independent"]:
            self.query["owner_id"] = self.mode_context["user_id"]
        else:
            self.query["firm_id"] = self.mode_context["organization_id"]
        return self
    
    def for_user(self) -> 'ModeAwareQuery':
        """Filtrar por usuario actual"""
        self.query["created_by"] = self.mode_context["user_id"]
        return self
    
    def for_team_member(self, member_id: str) -> 'ModeAwareQuery':
        """Filtrar para un miembro del equipo (solo en modo firma)"""
        if self.mode_context["is_firm"]:
            self.query["$or"] = [
                {"lawyer_id": member_id},
                {"lawyers_assigned": member_id}
            ]
        else:
            # En modo independiente, solo el usuario
            self.query["lawyer_id"] = self.mode_context["user_id"]
        return self
    
    def with_status(self, status: str) -> 'ModeAwareQuery':
        """Agregar filtro de status"""
        self.query["status"] = status
        return self
    
    def with_date_range(self, start_date, end_date) -> 'ModeAwareQuery':
        """Agregar rango de fechas"""
        self.query["created_at"] = {
            "$gte": start_date,
            "$lte": end_date
        }
        return self
    
    def build(self) -> dict:
        """Construir query final"""
        return self.query


class ModeAwareFilter:
    """
    Filtrador que elimina recursos que el usuario no puede ver según el modo.
    """
    
    @staticmethod
    def filter_resources(
        resources: list,
        mode_context: dict,
        resource_type: str = "generic"
    ) -> list:
        """
        Filtra recursos según:
        - Modo (independiente/firma)
        - Propiedad (es dueño/es su firma)
        
        Args:
            resources: Lista de recursos a filtrar
            mode_context: Contexto del modo
            resource_type: Tipo de recurso ('case', 'contact', 'invoice', etc.)
        
        Returns:
            Lista filtrada
        """
        if not resources:
            return []
        
        if mode_context["is_independent"]:
            # En modo independiente: solo sus propios recursos
            user_id = mode_context["user_id"]
            return [
                r for r in resources
                if r.get("owner_id") == user_id or r.get("created_by") == user_id
            ]
        else:  # firm mode
            # En modo firma: recursos de su firma
            firm_id = mode_context["organization_id"]
            return [
                r for r in resources
                if r.get("firm_id") == firm_id
            ]
    
    @staticmethod
    def can_access_resource(
        resource: dict,
        mode_context: dict,
        action: str = "read"
    ) -> bool:
        """
        Valida si el usuario puede acceder a un recurso específico.
        
        Args:
            resource: Datos del recurso
            mode_context: Contexto del modo
            action: 'read', 'write', 'delete'
        
        Returns:
            True si tiene acceso, False si no
        """
        user_id = mode_context["user_id"]
        organization_id = mode_context["organization_id"]
        
        # Verificar pertenencia
        if mode_context["is_independent"]:
            belongs = resource.get("owner_id") == user_id
        else:
            belongs = resource.get("firm_id") == organization_id
        
        if not belongs:
            return False
        
        # En modo firma, validar permisos RBAC por acción
        if mode_context["is_firm"]:
            from utils.rbac import PermissionValidator
            
            if action == "read":
                return True  # Casi todos pueden leer
            elif action == "write":
                return PermissionValidator.can_update_case(mode_context)
            elif action == "delete":
                return mode_context["role"] == "firm_owner"
        
        # Modo independiente: acceso total a sus propios recursos
        return True


class ModeAwareResponse:
    """
    Normaliza respuestas según el modo.
    
    En modo independiente: retorna datos del usuario
    En modo firma: retorna datos de la firma
    """
    
    @staticmethod
    def normalize_resource(
        resource: dict,
        mode_context: dict
    ) -> dict:
        """
        Normaliza un recurso para ser retornado según el modo.
        
        Ejemplo:
            {
                "id": "...",
                "title": "Case 123",
                "owner_id": "..." (independiente) | "firm_id": "..." (firma)
            }
        """
        normalized = dict(resource)
        
        # Agregar contexto de modo
        normalized["_mode"] = mode_context["mode"]
        normalized["_organization_id"] = mode_context["organization_id"]
        
        return normalized


# Decoradores de conveniencia

def require_mode(required_mode: str):
    """
    Decorador que requiere un modo específico.
    
    Uso:
        @require_mode("firm")
        async def firm_only_endpoint(...): ...
    """
    async def decorator(mode: str = Depends(get_mode)):
        if mode != required_mode:
            from fastapi import HTTPException
            raise HTTPException(
                status_code=403,
                detail=f"Este recurso solo está disponible en modo {required_mode}"
            )
        return mode
    
    return decorator


def require_modes(*modes: str):
    """
    Decorador que requiere uno de varios modos.
    
    Uso:
        @require_modes("independent", "firm")
        async def general_endpoint(...): ...
    """
    async def decorator(mode: str = Depends(get_mode)):
        if mode not in modes:
            from fastapi import HTTPException
            raise HTTPException(
                status_code=403,
                detail=f"Este recurso no está disponible en tu modo de operación"
            )
        return mode
    
    return decorator
