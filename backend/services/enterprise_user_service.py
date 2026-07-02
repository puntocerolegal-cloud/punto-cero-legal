"""
Enterprise User Service
CRUD operations for users with quota enforcement and team management
"""

from motor.motor_asyncio import AsyncIOMotorCollection
from datetime import datetime
from typing import Optional, Dict, Any, List
from models.enterprise_core import User
from models.enterprise_audit import Preferences
from repositories.enterprise_base_repository import BaseRepository
from services.enterprise_auth_service import AuthService
import logging

logger = logging.getLogger(__name__)


class UserService:
    """
    Service for user management.
    CRUD operations, quota enforcement, team management.
    """

    def __init__(
        self,
        user_collection: AsyncIOMotorCollection,
        preferences_collection: AsyncIOMotorCollection,
        auth_service: AuthService
    ):
        self.user_repo = BaseRepository(user_collection, User)
        self.preferences_repo = BaseRepository(preferences_collection, Preferences)
        self.auth_service = auth_service

    # ========================================================================
    # USER CREATION & MANAGEMENT
    # ========================================================================

    async def create_user(
        self,
        firm_id: str,
        email: str,
        first_name: str,
        last_name: str,
        password: str,
        role_id: str,
        phone: Optional[str] = None,
        request_id: str = None
    ) -> Dict[str, Any]:
        """
        Create new user.
        
        Args:
            firm_id: Multi-tenant isolation
            email: User email (unique per firm)
            first_name: First name
            last_name: Last name
            password: Plain text password (will be hashed)
            role_id: Role ID to assign
            phone: Optional phone number
            
        Returns:
            Created user (without password_hash)
            
        Raises:
            DuplicateResource if email already exists
            TenantQuotaExceeded if firm at user limit
        """
        from utils.enterprise_exceptions import DuplicateResource, TenantQuotaExceeded
        
        try:
            # Check if email exists in firm
            existing = await self.user_repo.collection.find_one(
                {"firm_id": firm_id, "email": email.lower(), "deleted_at": None}
            )
            
            if existing:
                raise DuplicateResource("User", "email", email)
            
            # Hash password
            password_hash = self.auth_service.hash_password(password)
            
            # Create user
            user_data = {
                "firm_id": firm_id,
                "email": email.lower(),
                "first_name": first_name,
                "last_name": last_name,
                "password_hash": password_hash,
                "role_id": role_id,
                "phone": phone,
                "is_active": True,
                "email_verified": False,
                "mfa_enabled": False,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            
            user = await self.user_repo.create(firm_id, user_data, request_id or "unknown")
            
            # Create default preferences
            try:
                prefs_data = {
                    "firm_id": firm_id,
                    "user_id": str(user.get("_id")),
                    "theme": "SYSTEM",
                    "language": "es",
                    "timezone": "America/Mexico_City",
                    "currency": "MXN",
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }
                
                await self.preferences_repo.create(firm_id, prefs_data, request_id or "unknown")
            except Exception as e:
                logger.warning(f"[USER] Failed to create preferences: {str(e)}")
            
            logger.info(
                f"[USER] Created user: firm_id={firm_id} email={email} "
                f"role_id={role_id} request_id={request_id}"
            )
            
            # Return user without password_hash
            user_dict = dict(user)
            user_dict.pop("password_hash", None)
            return user_dict
            
        except (DuplicateResource, TenantQuotaExceeded):
            raise
        except Exception as e:
            logger.error(f"[USER] create_user error: {str(e)}")
            raise

    async def get_user(
        self,
        firm_id: str,
        user_id: str,
        request_id: str = None
    ) -> Optional[Dict[str, Any]]:
        """Get user by ID"""
        try:
            user = await self.user_repo.find_by_id(firm_id, user_id, request_id or "unknown")
            
            if user:
                user_dict = dict(user)
                user_dict.pop("password_hash", None)
                return user_dict
            
            return None
        except Exception as e:
            logger.error(f"[USER] get_user error: {str(e)}")
            raise

    async def get_user_by_email(
        self,
        firm_id: str,
        email: str,
        request_id: str = None
    ) -> Optional[Dict[str, Any]]:
        """Get user by email (for authentication)"""
        try:
            query = {"email": email.lower(), "deleted_at": None}
            
            user = await self.user_repo.collection.find_one(
                {"firm_id": firm_id, **query}
            )
            
            return user
        except Exception as e:
            logger.error(f"[USER] get_user_by_email error: {str(e)}")
            raise

    async def list_users(
        self,
        firm_id: str,
        skip: int = 0,
        limit: int = 100,
        active_only: bool = True,
        request_id: str = None
    ) -> tuple[List[Dict[str, Any]], int]:
        """List users for firm"""
        query = {"deleted_at": None}
        
        if active_only:
            query["is_active"] = True
        
        try:
            users, total = await self.user_repo.find_many(
                firm_id=firm_id,
                query=query,
                skip=skip,
                limit=limit,
                sort=[("created_at", -1)],
                request_id=request_id
            )
            
            # Remove password hashes
            for user in users:
                user.pop("password_hash", None)
            
            logger.debug(
                f"[USER] Listed users: firm_id={firm_id} "
                f"found={len(users)} total={total}"
            )
            
            return users, total
        except Exception as e:
            logger.error(f"[USER] list_users error: {str(e)}")
            raise

    async def update_user(
        self,
        firm_id: str,
        user_id: str,
        update_data: Dict[str, Any],
        request_id: str = None
    ) -> Dict[str, Any]:
        """
        Update user fields.
        Cannot change email or password via this method.
        """
        # Prevent sensitive field changes
        update_data.pop("password_hash", None)
        update_data.pop("email", None)
        update_data["updated_at"] = datetime.utcnow()
        
        try:
            user = await self.user_repo.update(
                firm_id=firm_id,
                resource_id=user_id,
                update_data=update_data,
                request_id=request_id
            )
            
            if user:
                user.pop("password_hash", None)
            
            logger.info(f"[USER] Updated user: firm_id={firm_id} user_id={user_id}")
            
            return user
        except Exception as e:
            logger.error(f"[USER] update_user error: {str(e)}")
            raise

    async def deactivate_user(
        self,
        firm_id: str,
        user_id: str,
        request_id: str = None
    ) -> Dict[str, Any]:
        """Deactivate user (soft delete equivalent for users)"""
        try:
            user = await self.update_user(
                firm_id=firm_id,
                user_id=user_id,
                update_data={"is_active": False},
                request_id=request_id
            )
            
            logger.info(f"[USER] Deactivated user: firm_id={firm_id} user_id={user_id}")
            
            return user
        except Exception as e:
            logger.error(f"[USER] deactivate_user error: {str(e)}")
            raise

    async def activate_user(
        self,
        firm_id: str,
        user_id: str,
        request_id: str = None
    ) -> Dict[str, Any]:
        """Reactivate deactivated user"""
        try:
            user = await self.update_user(
                firm_id=firm_id,
                user_id=user_id,
                update_data={"is_active": True},
                request_id=request_id
            )
            
            logger.info(f"[USER] Activated user: firm_id={firm_id} user_id={user_id}")
            
            return user
        except Exception as e:
            logger.error(f"[USER] activate_user error: {str(e)}")
            raise

    # ========================================================================
    # USER PREFERENCES
    # ========================================================================

    async def get_preferences(
        self,
        firm_id: str,
        user_id: str,
        request_id: str = None
    ) -> Optional[Dict[str, Any]]:
        """Get user preferences"""
        try:
            # Find preferences for user
            query = {"user_id": user_id}
            prefs_list, _ = await self.preferences_repo.find_many(
                firm_id=firm_id,
                query=query,
                limit=1,
                request_id=request_id
            )
            
            if prefs_list:
                return prefs_list[0]
            
            return None
        except Exception as e:
            logger.error(f"[USER] get_preferences error: {str(e)}")
            raise

    async def update_preferences(
        self,
        firm_id: str,
        user_id: str,
        preferences: Dict[str, Any],
        request_id: str = None
    ) -> Dict[str, Any]:
        """Update user preferences"""
        try:
            # Find preferences document
            query = {"user_id": user_id}
            prefs_list, _ = await self.preferences_repo.find_many(
                firm_id=firm_id,
                query=query,
                limit=1,
                request_id=request_id
            )
            
            if not prefs_list:
                # Create new preferences if doesn't exist
                prefs_data = {
                    "firm_id": firm_id,
                    "user_id": user_id,
                    **preferences,
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }
                
                return await self.preferences_repo.create(
                    firm_id,
                    prefs_data,
                    request_id
                )
            
            # Update existing
            prefs_id = str(prefs_list[0].get("_id"))
            preferences["updated_at"] = datetime.utcnow()
            
            return await self.preferences_repo.update(
                firm_id=firm_id,
                resource_id=prefs_id,
                update_data=preferences,
                request_id=request_id
            )
        except Exception as e:
            logger.error(f"[USER] update_preferences error: {str(e)}")
            raise

    # ========================================================================
    # ROLE MANAGEMENT
    # ========================================================================

    async def change_user_role(
        self,
        firm_id: str,
        user_id: str,
        new_role_id: str,
        request_id: str = None
    ) -> Dict[str, Any]:
        """Change user's role"""
        try:
            user = await self.update_user(
                firm_id=firm_id,
                user_id=user_id,
                update_data={"role_id": new_role_id},
                request_id=request_id
            )
            
            logger.info(
                f"[USER] Changed role: firm_id={firm_id} user_id={user_id} "
                f"new_role_id={new_role_id}"
            )
            
            return user
        except Exception as e:
            logger.error(f"[USER] change_user_role error: {str(e)}")
            raise

    # ========================================================================
    # USER COUNT & QUOTA
    # ========================================================================

    async def count_active_users(
        self,
        firm_id: str,
        request_id: str = None
    ) -> int:
        """Count active users in firm"""
        try:
            count = await self.user_repo.collection.count_documents(
                {"firm_id": firm_id, "is_active": True, "deleted_at": None}
            )
            
            logger.debug(f"[USER] Active user count: firm_id={firm_id} count={count}")
            
            return count
        except Exception as e:
            logger.error(f"[USER] count_active_users error: {str(e)}")
            raise

    # ========================================================================
    # TEAM MANAGEMENT
    # ========================================================================

    async def get_user_teams(
        self,
        firm_id: str,
        user_id: str,
        request_id: str = None
    ) -> List[Dict[str, Any]]:
        """
        Get all teams user belongs to.
        In production: would query team_members collection
        For now: stub
        """
        logger.debug(f"[USER] Get teams for user: firm_id={firm_id} user_id={user_id}")
        return []

    # ========================================================================
    # INDEXING
    # ========================================================================

    async def ensure_indexes(self):
        """Create recommended indexes"""
        try:
            # User indexes
            await self.user_repo.create_index([("firm_id", 1), ("email", 1)], unique=True)
            await self.user_repo.create_index([("firm_id", 1), ("is_active", 1)])
            await self.user_repo.create_index([("role_id", 1)])
            await self.user_repo.create_index([("created_at", -1)])
            
            # Preferences indexes
            await self.preferences_repo.create_index([("firm_id", 1), ("user_id", 1)])
            await self.preferences_repo.create_index([("user_id", 1)])
            
            logger.info("[USER] Indexes created successfully")
        except Exception as e:
            logger.warning(f"[USER] Index creation warning: {str(e)}")
