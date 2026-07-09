"""
Enterprise Auth Service
Authentication, JWT tokens, session management, password handling
"""

from motor.motor_asyncio import AsyncIOMotorCollection
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, Tuple
from models.enterprise_core import User
from models.enterprise_audit import Session
from repositories.enterprise_base_repository import BaseRepository
from passlib.context import CryptContext
import jwt
import logging
import os

logger = logging.getLogger(__name__)

# Hashing context for passwords
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT Runtime Fix: Unify JWT_SECRET and SECRET_KEY into one source of truth.
# Priority: JWT_SECRET > SECRET_KEY > fallback (dev only).
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
_JWT_SECRET = os.getenv("JWT_SECRET") or os.getenv("SECRET_KEY") or "dev-fallback-key-change-in-production"
JWT_SECRET = _JWT_SECRET
JWT_EXPIRATION_HOURS = int(os.getenv("JWT_EXPIRATION_HOURS", "24"))
JWT_REFRESH_EXPIRATION_DAYS = int(os.getenv("JWT_REFRESH_EXPIRATION_DAYS", "7"))


class AuthService:
    """
    Service for user authentication and session management.
    Handles login, token generation, password verification.
    """

    def __init__(
        self,
        user_collection: AsyncIOMotorCollection,
        session_collection: AsyncIOMotorCollection
    ):
        self.user_repo = BaseRepository(user_collection, User)
        self.session_repo = BaseRepository(session_collection, Session)

    # ========================================================================
    # AUTHENTICATION
    # ========================================================================

    async def login(
        self,
        firm_id: str,
        email: str,
        password: str,
        ip_address: str,
        user_agent: str,
        request_id: str
    ) -> Dict[str, Any]:
        """
        Authenticate user and return JWT token.
        
        Args:
            firm_id: Multi-tenant (obtained from firm selector or registration)
            email: User email
            password: Plain text password
            ip_address: Client IP (for session tracking)
            user_agent: Client browser/app info
            request_id: For audit
            
        Returns:
            {
                "access_token": "jwt...",
                "refresh_token": "jwt...",
                "user": {"id": "...", "email": "...", "role": "..."},
                "expires_in": 86400
            }
            
        Raises:
            InvalidCredentials if email/password wrong
            UserInactive if user disabled
        """
        from utils.enterprise_exceptions import InvalidCredentials, UserInactive
        
        try:
            # Find user by email (assuming unique per firm)
            # In real system, would use find_by_email if exists
            query = {"email": email.lower(), "deleted_at": None}
            user_doc = await self.user_repo.collection.find_one(
                {"firm_id": firm_id, **query}
            )
            
            if not user_doc:
                logger.warning(
                    f"[AUTH] Login failed: user not found firm_id={firm_id} "
                    f"email={email} request_id={request_id}"
                )
                raise InvalidCredentials()
            
            # Check user is active
            if not user_doc.get("is_active", False):
                logger.warning(
                    f"[AUTH] Login failed: user inactive firm_id={firm_id} "
                    f"user_id={user_doc.get('_id')} request_id={request_id}"
                )
                raise UserInactive(str(user_doc.get("_id")))
            
            # Verify password
            password_hash = user_doc.get("password_hash")
            if not self._verify_password(password, password_hash):
                logger.warning(
                    f"[AUTH] Login failed: wrong password firm_id={firm_id} "
                    f"email={email} request_id={request_id}"
                )
                raise InvalidCredentials()
            
            # Check if MFA enabled (simplified; doesn't require MFA challenge)
            if user_doc.get("mfa_enabled", False):
                logger.info(f"[AUTH] MFA enabled for user: {user_doc.get('_id')}")
                # In production: return MFA challenge instead of token
                # For now: continue (should not do this in production)
            
            # Generate tokens
            user_id = str(user_doc.get("_id"))
            access_token = self._generate_access_token(
                firm_id=firm_id,
                user_id=user_id,
                email=email,
                role=user_doc.get("role_id")  # Store role_id in token for RBAC
            )
            
            refresh_token = self._generate_refresh_token(
                firm_id=firm_id,
                user_id=user_id
            )
            
            # Create session record
            session_data = {
                "firm_id": firm_id,
                "user_id": user_id,
                "token": access_token,
                "ip_address": ip_address,
                "user_agent": user_agent,
                "is_active": True,
                "created_at": datetime.utcnow(),
                "expires_at": datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS),
                "last_activity_at": datetime.utcnow()
            }
            
            await self.session_repo.create(firm_id, session_data, request_id)
            
            # Update user's last_login_at
            await self.user_repo.update(
                firm_id=firm_id,
                resource_id=user_id,
                update_data={"last_login_at": datetime.utcnow()},
                request_id=request_id
            )
            
            logger.info(
                f"[AUTH] LOGIN SUCCESS firm_id={firm_id} user_id={user_id} "
                f"email={email} ip={ip_address} request_id={request_id}"
            )
            
            return {
                "access_token": access_token,
                "refresh_token": refresh_token,
                "user": {
                    "id": user_id,
                    "email": email,
                    "first_name": user_doc.get("first_name"),
                    "last_name": user_doc.get("last_name"),
                    "role_id": user_doc.get("role_id")
                },
                "expires_in": JWT_EXPIRATION_HOURS * 3600  # seconds
            }
        except Exception as e:
            logger.error(f"[AUTH] login error: {str(e)}")
            raise

    async def logout(
        self,
        firm_id: str,
        user_id: str,
        token: str,
        request_id: str
    ) -> None:
        """
        Logout user (invalidate session).
        """
        try:
            # Find and deactivate session
            query = {
                "user_id": user_id,
                "token": token,
                "is_active": True
            }
            
            session = await self.session_repo.collection.find_one(
                {"firm_id": firm_id, **query}
            )
            
            if session:
                await self.session_repo.update(
                    firm_id=firm_id,
                    resource_id=str(session.get("_id")),
                    update_data={"is_active": False},
                    request_id=request_id
                )
            
            logger.info(
                f"[AUTH] LOGOUT firm_id={firm_id} user_id={user_id} "
                f"request_id={request_id}"
            )
        except Exception as e:
            logger.error(f"[AUTH] logout error: {str(e)}")
            raise

    # ========================================================================
    # TOKEN MANAGEMENT
    # ========================================================================

    def _generate_access_token(
        self,
        firm_id: str,
        user_id: str,
        email: str,
        role: str
    ) -> str:
        """Generate JWT access token (short-lived)"""
        
        payload = {
            "firm_id": firm_id,
            "user_id": user_id,
            "email": email,
            "role": role,
            "type": "access",
            "iat": datetime.utcnow(),
            "exp": datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
        }
        
        token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
        return token

    def _generate_refresh_token(
        self,
        firm_id: str,
        user_id: str
    ) -> str:
        """Generate JWT refresh token (long-lived)"""
        
        payload = {
            "firm_id": firm_id,
            "user_id": user_id,
            "type": "refresh",
            "iat": datetime.utcnow(),
            "exp": datetime.utcnow() + timedelta(days=JWT_REFRESH_EXPIRATION_DAYS)
        }
        
        token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
        return token

    async def refresh_token(
        self,
        firm_id: str,
        refresh_token: str,
        request_id: str
    ) -> Dict[str, Any]:
        """
        Use refresh token to get new access token.
        """
        from utils.enterprise_exceptions import InvalidToken
        
        try:
            # Decode refresh token
            payload = jwt.decode(refresh_token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            
            if payload.get("type") != "refresh":
                raise InvalidToken()
            
            token_firm_id = payload.get("firm_id")
            token_user_id = payload.get("user_id")
            
            # Validate firm_id matches
            if token_firm_id != firm_id:
                raise InvalidToken()
            
            # Get user to retrieve email and role
            user = await self.user_repo.find_by_id(firm_id, token_user_id, request_id)
            if not user or not user.get("is_active"):
                raise InvalidToken()
            
            # Generate new access token
            new_access_token = self._generate_access_token(
                firm_id=firm_id,
                user_id=token_user_id,
                email=user.get("email"),
                role=user.get("role_id")
            )
            
            logger.info(
                f"[AUTH] TOKEN_REFRESH firm_id={firm_id} user_id={token_user_id} "
                f"request_id={request_id}"
            )
            
            return {
                "access_token": new_access_token,
                "expires_in": JWT_EXPIRATION_HOURS * 3600
            }
        except jwt.ExpiredSignatureError:
            logger.warning(f"[AUTH] Refresh token expired request_id={request_id}")
            raise InvalidToken()
        except jwt.InvalidTokenError as e:
            logger.warning(f"[AUTH] Invalid refresh token: {str(e)}")
            raise InvalidToken()
        except Exception as e:
            logger.error(f"[AUTH] refresh_token error: {str(e)}")
            raise

    def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        """
        Verify JWT token and return payload.
        Returns None if invalid.
        """
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            return payload
        except jwt.ExpiredSignatureError:
            logger.debug("[AUTH] Token expired")
            return None
        except jwt.InvalidTokenError:
            logger.debug("[AUTH] Invalid token")
            return None
        except Exception as e:
            logger.error(f"[AUTH] verify_token error: {str(e)}")
            return None

    # ========================================================================
    # PASSWORD MANAGEMENT
    # ========================================================================

    def hash_password(self, password: str) -> str:
        """Hash password with bcrypt"""
        return pwd_context.hash(password)

    def _verify_password(self, plain_password: str, password_hash: str) -> bool:
        """Verify plain password against hash"""
        return pwd_context.verify(plain_password, password_hash)

    async def change_password(
        self,
        firm_id: str,
        user_id: str,
        old_password: str,
        new_password: str,
        request_id: str
    ) -> None:
        """
        Change user password.
        Requires old password for verification.
        """
        from utils.enterprise_exceptions import InvalidCredentials
        
        try:
            # Get user
            user = await self.user_repo.find_by_id(firm_id, user_id, request_id)
            if not user:
                raise InvalidCredentials()
            
            # Verify old password
            if not self._verify_password(old_password, user.get("password_hash")):
                logger.warning(
                    f"[AUTH] CHANGE_PASSWORD failed: wrong old_password "
                    f"firm_id={firm_id} user_id={user_id}"
                )
                raise InvalidCredentials()
            
            # Hash new password
            new_hash = self.hash_password(new_password)
            
            # Update user
            await self.user_repo.update(
                firm_id=firm_id,
                resource_id=user_id,
                update_data={"password_hash": new_hash},
                request_id=request_id
            )
            
            logger.info(
                f"[AUTH] PASSWORD_CHANGED firm_id={firm_id} user_id={user_id} "
                f"request_id={request_id}"
            )
        except Exception as e:
            logger.error(f"[AUTH] change_password error: {str(e)}")
            raise

    # ========================================================================
    # SESSION MANAGEMENT
    # ========================================================================

    async def get_active_sessions(
        self,
        firm_id: str,
        user_id: str,
        request_id: str
    ) -> list:
        """Get all active sessions for user"""
        query = {
            "user_id": user_id,
            "is_active": True
        }
        
        try:
            sessions, _ = await self.session_repo.find_many(
                firm_id=firm_id,
                query=query,
                limit=100,
                request_id=request_id
            )
            return sessions
        except Exception as e:
            logger.error(f"[AUTH] get_active_sessions error: {str(e)}")
            raise

    async def revoke_all_sessions(
        self,
        firm_id: str,
        user_id: str,
        request_id: str
    ) -> None:
        """Revoke all sessions for user (logout all devices)"""
        try:
            # Find all active sessions
            sessions = await self.get_active_sessions(firm_id, user_id, request_id)
            
            # Deactivate all
            for session in sessions:
                await self.session_repo.update(
                    firm_id=firm_id,
                    resource_id=str(session.get("_id")),
                    update_data={"is_active": False},
                    request_id=request_id
                )
            
            logger.info(
                f"[AUTH] REVOKE_ALL_SESSIONS firm_id={firm_id} user_id={user_id} "
                f"request_id={request_id}"
            )
        except Exception as e:
            logger.error(f"[AUTH] revoke_all_sessions error: {str(e)}")
            raise

    # ========================================================================
    # INDEXING
    # ========================================================================

    async def ensure_indexes(self):
        """Create recommended indexes"""
        try:
            # Session indexes
            await self.session_repo.create_index([("user_id", 1), ("is_active", 1)])
            await self.session_repo.create_index([("firm_id", 1), ("expires_at", 1)])
            await self.session_repo.create_index([("created_at", 1)], expireAfterSeconds=604800)  # 7 days TTL
            
            # User indexes
            await self.user_repo.create_index([("firm_id", 1), ("email", 1)], unique=True)
            await self.user_repo.create_index([("is_active", 1)])
            
            logger.info("[AUTH] Indexes created successfully")
        except Exception as e:
            logger.warning(f"[AUTH] Index creation warning: {str(e)}")
