"""
Enterprise Permission Service
RBAC enforcement, permission validation, role hierarchy
"""

from motor.motor_asyncio import AsyncIOMotorCollection
from typing import Optional, List, Dict, Any
from models.enterprise_core import Role, Permission, User
from repositories.enterprise_base_repository import BaseRepository
import logging

logger = logging.getLogger(__name__)


class PermissionService:
    """
    Service for role-based access control (RBAC).
    Validates user permissions against actions.
    """

    def __init__(
        self,
        role_collection: AsyncIOMotorCollection,
        permission_collection: AsyncIOMotorCollection,
        user_collection: AsyncIOMotorCollection
    ):
        self.role_repo = BaseRepository(role_collection, Role)
        self.permission_repo = BaseRepository(permission_collection, Permission)
        self.user_repo = BaseRepository(user_collection, User)
        self.role_cache = {}  # In-memory cache for roles (should use Redis in prod)

    # ========================================================================
    # PERMISSION CHECKING
    # ========================================================================

    async def has_permission(
        self,
        firm_id: str,
        user_id: str,
        module: str,
        action: str,
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None,
        request_id: str = None
    ) -> bool:
        """
        Check if user has permission to perform action on module.
        
        Args:
            firm_id: Multi-tenant
            user_id: User ID
            module: CASES, DOCUMENTS, WORKFLOWS, etc.
            action: CREATE, READ, UPDATE, DELETE, APPROVE, EXECUTE
            resource_type: Specific entity type (optional, for granular control)
            resource_id: Specific resource ID (for conditional perms like own_cases_only)
            request_id: For audit
            
        Returns:
            Boolean: True if user has permission, False otherwise
        """
        try:
            # Get user
            user = await self.user_repo.find_by_id(firm_id, user_id, request_id or "unknown")
            if not user:
                logger.warning(f"[PERMISSION] User not found: firm_id={firm_id} user_id={user_id}")
                return False
            
            # Get role
            role = await self._get_role(firm_id, user.get("role_id"), request_id)
            if not role:
                logger.warning(f"[PERMISSION] Role not found: firm_id={firm_id} role_id={user.get('role_id')}")
                return False
            
            # Check permission in role
            has_perm = await self._check_role_permission(
                role=role,
                module=module,
                action=action,
                resource_type=resource_type,
                resource_id=resource_id,
                user_id=user_id,
                firm_id=firm_id,
                request_id=request_id
            )
            
            if has_perm:
                logger.debug(
                    f"[PERMISSION] GRANTED user_id={user_id} "
                    f"{module}:{action} request_id={request_id}"
                )
            else:
                logger.warning(
                    f"[PERMISSION] DENIED user_id={user_id} "
                    f"{module}:{action} request_id={request_id}"
                )
            
            return has_perm
        except Exception as e:
            logger.error(f"[PERMISSION] has_permission error: {str(e)}")
            return False

    async def require_permission(
        self,
        firm_id: str,
        user_id: str,
        module: str,
        action: str,
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None,
        request_id: str = None
    ) -> None:
        """
        Require permission; raise exception if denied.
        Use in route handlers.
        
        Raises:
            PermissionDenied exception if user lacks permission
        """
        from utils.enterprise_exceptions import PermissionDenied
        
        has_perm = await self.has_permission(
            firm_id=firm_id,
            user_id=user_id,
            module=module,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            request_id=request_id
        )
        
        if not has_perm:
            raise PermissionDenied(
                required_permission=module,
                required_action=action
            )

    # ========================================================================
    # ROLE HIERARCHY
    # ========================================================================

    async def _get_role(
        self,
        firm_id: str,
        role_id: str,
        request_id: str
    ) -> Optional[Dict[str, Any]]:
        """Get role with caching (should use Redis in production)"""
        
        cache_key = f"{firm_id}:{role_id}"
        
        # Check cache
        if cache_key in self.role_cache:
            return self.role_cache[cache_key]
        
        # Query database
        try:
            role = await self.role_repo.find_by_id(firm_id, role_id, request_id)
            
            if role:
                # Cache for 15 minutes (should be configurable)
                self.role_cache[cache_key] = role
            
            return role
        except Exception as e:
            logger.error(f"[PERMISSION] _get_role error: {str(e)}")
            return None

    async def _check_role_permission(
        self,
        role: Dict[str, Any],
        module: str,
        action: str,
        resource_type: Optional[str],
        resource_id: Optional[str],
        user_id: str,
        firm_id: str,
        request_id: str
    ) -> bool:
        """
        Check if role has permission.
        Evaluates rank-based inheritance and conditional permissions.
        """
        
        # Owner (rank=0) always has all permissions
        role_rank = role.get("rank", 999)
        if role_rank == 0:  # Owner
            logger.debug(f"[PERMISSION] Owner always has permission")
            return True
        
        # Get permissions for role
        permissions = role.get("permissions", [])
        
        for perm in permissions:
            # Check module:action match
            if perm.get("module") != module or perm.get("action") != action:
                continue
            
            # Check resource_type if specified
            if resource_type and perm.get("resource_type") and perm.get("resource_type") != resource_type:
                continue
            
            # Check conditional permissions
            conditions = perm.get("conditions", {})
            if conditions:
                if not await self._evaluate_conditions(
                    conditions=conditions,
                    user_id=user_id,
                    resource_id=resource_id,
                    firm_id=firm_id,
                    request_id=request_id
                ):
                    continue
            
            # Permission matched!
            return True
        
        return False

    async def _evaluate_conditions(
        self,
        conditions: Dict[str, Any],
        user_id: str,
        resource_id: Optional[str],
        firm_id: str,
        request_id: str
    ) -> bool:
        """
        Evaluate conditional permissions.
        Example: own_cases_only → check if user is assigned to case
        """
        
        # own_cases_only: user must be assigned to case
        if conditions.get("own_cases_only") and resource_id:
            # Check if user is assigned to this case
            # This would query Case collection and check assigned_lawyer_id
            # For now, stub implementation
            logger.debug(f"[PERMISSION] Checking own_cases_only for user_id={user_id} case={resource_id}")
            # return user_is_assigned_to_case(user_id, resource_id)
            return True
        
        # department_scoped: user must be in same department as case
        if conditions.get("department_scoped") and resource_id:
            logger.debug(f"[PERMISSION] Checking department_scoped for user_id={user_id}")
            # return user_same_department_as_case(user_id, resource_id)
            return True
        
        return True

    # ========================================================================
    # ROLE MANAGEMENT
    # ========================================================================

    async def create_role(
        self,
        firm_id: str,
        name: str,
        rank: int,
        description: Optional[str] = None,
        permissions: Optional[List[Dict[str, Any]]] = None,
        request_id: str = None
    ) -> Dict[str, Any]:
        """
        Create new role.
        
        Args:
            firm_id: Multi-tenant
            name: Role name (e.g., "Senior Lawyer")
            rank: Hierarchical rank (0=Owner, 50=Lawyer, 100=ReadOnly)
            description: Purpose
            permissions: List of permissions to assign
            
        Returns:
            Created role document
        """
        from datetime import datetime
        
        role_data = {
            "firm_id": firm_id,
            "name": name,
            "rank": rank,
            "description": description,
            "is_system": False,
            "permissions": permissions or [],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        try:
            role = await self.role_repo.create(firm_id, role_data, request_id or "unknown")
            
            # Invalidate cache
            self._invalidate_role_cache(firm_id)
            
            logger.info(f"[PERMISSION] Created role: firm_id={firm_id} name={name} rank={rank}")
            return role
        except Exception as e:
            logger.error(f"[PERMISSION] create_role error: {str(e)}")
            raise

    async def assign_permission(
        self,
        firm_id: str,
        role_id: str,
        module: str,
        action: str,
        resource_type: Optional[str] = None,
        conditions: Optional[Dict[str, Any]] = None,
        request_id: str = None
    ) -> Dict[str, Any]:
        """
        Assign permission to role.
        """
        from datetime import datetime
        
        permission_data = {
            "firm_id": firm_id,
            "role_id": role_id,
            "module": module,
            "action": action,
            "resource_type": resource_type,
            "conditions": conditions,
            "created_at": datetime.utcnow()
        }
        
        try:
            permission = await self.permission_repo.create(
                firm_id,
                permission_data,
                request_id or "unknown"
            )
            
            # Invalidate cache
            self._invalidate_role_cache(firm_id, role_id)
            
            logger.info(
                f"[PERMISSION] Assigned permission: firm_id={firm_id} "
                f"role_id={role_id} {module}:{action}"
            )
            return permission
        except Exception as e:
            logger.error(f"[PERMISSION] assign_permission error: {str(e)}")
            raise

    async def get_role_permissions(
        self,
        firm_id: str,
        role_id: str,
        request_id: str = None
    ) -> List[Dict[str, Any]]:
        """
        Get all permissions for a role.
        """
        try:
            query = {
                "role_id": role_id,
                "deleted_at": None
            }
            
            permissions, _ = await self.permission_repo.find_many(
                firm_id=firm_id,
                query=query,
                limit=1000,
                request_id=request_id
            )
            
            logger.debug(
                f"[PERMISSION] GET_ROLE_PERMISSIONS role_id={role_id} "
                f"found={len(permissions)}"
            )
            
            return permissions
        except Exception as e:
            logger.error(f"[PERMISSION] get_role_permissions error: {str(e)}")
            raise

    # ========================================================================
    # CACHE MANAGEMENT
    # ========================================================================

    def _invalidate_role_cache(self, firm_id: str, role_id: Optional[str] = None):
        """Invalidate role cache (after role/permission changes)"""
        if role_id:
            cache_key = f"{firm_id}:{role_id}"
            self.role_cache.pop(cache_key, None)
            logger.debug(f"[PERMISSION] Invalidated role cache: {cache_key}")
        else:
            # Invalidate all roles for firm
            keys_to_delete = [k for k in self.role_cache.keys() if k.startswith(f"{firm_id}:")]
            for key in keys_to_delete:
                self.role_cache.pop(key)
            logger.debug(f"[PERMISSION] Invalidated firm cache: firm_id={firm_id}")

    def clear_cache(self):
        """Clear all permission cache (use after major changes)"""
        self.role_cache.clear()
        logger.info("[PERMISSION] Cleared permission cache")

    # ========================================================================
    # INDEXING
    # ========================================================================

    async def ensure_indexes(self):
        """Create recommended indexes"""
        try:
            # Role indexes
            await self.role_repo.create_index([("firm_id", 1), ("rank", 1)])
            await self.role_repo.create_index([("firm_id", 1), ("name", 1)])
            await self.role_repo.create_index([("is_system", 1)])
            
            # Permission indexes
            await self.permission_repo.create_index([("role_id", 1)])
            await self.permission_repo.create_index([("firm_id", 1), ("module", 1)])
            
            logger.info("[PERMISSION] Indexes created successfully")
        except Exception as e:
            logger.warning(f"[PERMISSION] Index creation warning: {str(e)}")
