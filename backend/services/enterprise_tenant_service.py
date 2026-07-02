"""
Enterprise Tenant Service
Firm (tenant) lifecycle management: create, activate, suspend, delete
"""

from motor.motor_asyncio import AsyncIOMotorCollection
from datetime import datetime
from typing import Optional, Dict, Any, List
from models.enterprise_core import Firm, FirmStatus, SubscriptionPlan
from repositories.firm_repository import FirmRepository
import logging

logger = logging.getLogger(__name__)


class TenantService:
    """
    Service for managing firm (tenant) lifecycle.
    Handles creation, activation, suspension, deletion.
    """

    def __init__(self, firm_collection: AsyncIOMotorCollection):
        self.firm_repo = FirmRepository(firm_collection)

    # ========================================================================
    # FIRM CREATION & ONBOARDING
    # ========================================================================

    async def create_firm(
        self,
        name: str,
        slug: str,
        email: str,
        country_code: str = "MX",
        subscription_plan: SubscriptionPlan = SubscriptionPlan.STARTER,
        owner_id: str = None,
        owner_name: str = None,
        owner_email: str = None,
        request_id: str = None
    ) -> Dict[str, Any]:
        """
        Create new firm (customer tenant).
        
        Args:
            name: Firm legal name
            slug: URL-safe identifier (must be unique)
            email: Firm contact email
            country_code: ISO 2-letter code (MX, US, ES, etc.)
            subscription_plan: STARTER, PROFESSIONAL, ENTERPRISE
            owner_id: User ID of firm owner
            owner_name: Owner's name
            owner_email: Owner's email
            
        Returns:
            Created firm document
            
        Raises:
            DuplicateResource if slug already exists
        """
        from utils.enterprise_exceptions import DuplicateResource
        
        try:
            # Check if slug already exists
            existing = await self.firm_repo.find_by_slug(slug, request_id or "unknown")
            if existing:
                raise DuplicateResource("Firm", "slug", slug)
            
            # Determine max users/cases based on plan
            max_users = {
                SubscriptionPlan.STARTER: 5,
                SubscriptionPlan.PROFESSIONAL: 20,
                SubscriptionPlan.ENTERPRISE: 999
            }.get(subscription_plan, 5)
            
            max_cases = {
                SubscriptionPlan.STARTER: 50,
                SubscriptionPlan.PROFESSIONAL: 500,
                SubscriptionPlan.ENTERPRISE: -1  # Unlimited
            }.get(subscription_plan, 50)
            
            firm_data = {
                "name": name,
                "slug": slug,
                "email": email.lower(),
                "country_code": country_code,
                "subscription_plan": subscription_plan.value,
                "max_users": max_users,
                "max_cases": max_cases,
                "owner_id": owner_id,
                "owner_name": owner_name,
                "owner_email": owner_email,
                "status": FirmStatus.PENDING_VERIFICATION.value,
                "is_verified": False,
                "trial_status": "active",
                "trial_started_at": datetime.utcnow(),
                "subscription_status": "trial",
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            
            # Create using dummy firm_id for initial creation
            # In production, use a system firm_id or bypass firm_id requirement
            dummy_firm_id = "system"
            firm = await self.firm_repo.create(
                firm_id=dummy_firm_id,
                data=firm_data,
                request_id=request_id or "unknown"
            )
            
            # Update to use actual firm_id
            firm_id = firm.get("_id")
            await self.firm_repo.update(
                firm_id=firm_id,
                resource_id=firm_id,
                update_data={"firm_id": firm_id},
                request_id=request_id or "unknown"
            )
            
            logger.info(
                f"[TENANT] FIRM_CREATED firm_id={firm_id} name={name} "
                f"plan={subscription_plan.value} request_id={request_id}"
            )
            
            return firm
        except Exception as e:
            logger.error(f"[TENANT] create_firm error: {str(e)}")
            raise

    # ========================================================================
    # FIRM STATUS MANAGEMENT
    # ========================================================================

    async def activate_firm(
        self,
        firm_id: str,
        approved_by_user_id: str,
        request_id: str
    ) -> Dict[str, Any]:
        """
        Activate firm (PENDING_VERIFICATION → ACTIVE).
        """
        try:
            firm = await self.firm_repo.activate(
                firm_id=firm_id,
                approved_by_user_id=approved_by_user_id,
                request_id=request_id
            )
            
            logger.info(
                f"[TENANT] FIRM_ACTIVATED firm_id={firm_id} "
                f"approved_by={approved_by_user_id} request_id={request_id}"
            )
            
            return firm
        except Exception as e:
            logger.error(f"[TENANT] activate_firm error: {str(e)}")
            raise

    async def suspend_firm(
        self,
        firm_id: str,
        reason: str,
        suspended_by_user_id: str,
        request_id: str
    ) -> Dict[str, Any]:
        """
        Suspend firm (due to payment issues, ToS violation, etc.).
        """
        try:
            firm = await self.firm_repo.suspend(
                firm_id=firm_id,
                reason=reason,
                suspended_by_user_id=suspended_by_user_id,
                request_id=request_id
            )
            
            logger.info(
                f"[TENANT] FIRM_SUSPENDED firm_id={firm_id} "
                f"reason={reason} request_id={request_id}"
            )
            
            return firm
        except Exception as e:
            logger.error(f"[TENANT] suspend_firm error: {str(e)}")
            raise

    async def delete_firm(
        self,
        firm_id: str,
        deleted_by_user_id: str,
        request_id: str
    ) -> None:
        """
        Soft delete firm (mark as deleted, retain data for compliance).
        """
        try:
            from datetime import datetime
            
            # Soft delete
            await self.firm_repo.soft_delete(
                firm_id=firm_id,
                resource_id=firm_id,
                request_id=request_id
            )
            
            # Update status
            await self.firm_repo.update(
                firm_id=firm_id,
                resource_id=firm_id,
                update_data={
                    "status": FirmStatus.INACTIVE.value,
                    "active": False,
                    "deleted_by": deleted_by_user_id,
                    "updated_at": datetime.utcnow()
                },
                request_id=request_id
            )
            
            logger.info(
                f"[TENANT] FIRM_DELETED firm_id={firm_id} "
                f"deleted_by={deleted_by_user_id} request_id={request_id}"
            )
        except Exception as e:
            logger.error(f"[TENANT] delete_firm error: {str(e)}")
            raise

    # ========================================================================
    # FIRM QUERIES
    # ========================================================================

    async def get_firm(
        self,
        firm_id: str,
        request_id: str
    ) -> Optional[Dict[str, Any]]:
        """Get firm details"""
        try:
            firm = await self.firm_repo.find_by_id(firm_id, firm_id, request_id)
            
            if not firm:
                logger.warning(f"[TENANT] Firm not found: firm_id={firm_id}")
                return None
            
            return firm
        except Exception as e:
            logger.error(f"[TENANT] get_firm error: {str(e)}")
            raise

    async def get_firm_by_slug(
        self,
        slug: str,
        request_id: str
    ) -> Optional[Dict[str, Any]]:
        """Get firm by slug identifier"""
        try:
            firm = await self.firm_repo.find_by_slug(slug, request_id)
            return firm
        except Exception as e:
            logger.error(f"[TENANT] get_firm_by_slug error: {str(e)}")
            raise

    async def get_active_firms(
        self,
        skip: int = 0,
        limit: int = 100,
        request_id: str = None
    ) -> tuple[List[Dict[str, Any]], int]:
        """Get all active firms (admin only)"""
        try:
            firms, total = await self.firm_repo.find_active(
                skip=skip,
                limit=limit,
                request_id=request_id
            )
            
            logger.debug(
                f"[TENANT] GET_ACTIVE_FIRMS found={len(firms)} "
                f"total={total} request_id={request_id}"
            )
            
            return firms, total
        except Exception as e:
            logger.error(f"[TENANT] get_active_firms error: {str(e)}")
            raise

    async def get_user_firms(
        self,
        owner_id: str,
        request_id: str
    ) -> List[Dict[str, Any]]:
        """Get all firms owned by user"""
        try:
            firms = await self.firm_repo.find_by_owner(owner_id, request_id)
            
            logger.debug(
                f"[TENANT] GET_USER_FIRMS owner_id={owner_id} "
                f"found={len(firms)} request_id={request_id}"
            )
            
            return firms
        except Exception as e:
            logger.error(f"[TENANT] get_user_firms error: {str(e)}")
            raise

    # ========================================================================
    # QUOTA & LIMITS
    # ========================================================================

    async def check_user_quota(
        self,
        firm_id: str,
        request_id: str
    ) -> Dict[str, Any]:
        """Check firm's user seat quota"""
        try:
            return await self.firm_repo.check_user_quota(firm_id, request_id)
        except Exception as e:
            logger.error(f"[TENANT] check_user_quota error: {str(e)}")
            raise

    async def enforce_user_quota(
        self,
        firm_id: str,
        request_id: str
    ) -> None:
        """
        Enforce user quota (raise exception if limit exceeded).
        Call before creating new user.
        """
        from utils.enterprise_exceptions import TenantQuotaExceeded
        
        try:
            quota = await self.check_user_quota(firm_id, request_id)
            
            if quota["available"] <= 0:
                raise TenantQuotaExceeded(
                    firm_id=firm_id,
                    limit_type="users",
                    current=quota["current_users"],
                    max_allowed=quota["max_users"]
                )
        except TenantQuotaExceeded:
            raise
        except Exception as e:
            logger.error(f"[TENANT] enforce_user_quota error: {str(e)}")
            raise

    # ========================================================================
    # SUBSCRIPTION MANAGEMENT
    # ========================================================================

    async def update_subscription(
        self,
        firm_id: str,
        new_plan: SubscriptionPlan,
        updated_by_user_id: str,
        request_id: str
    ) -> Dict[str, Any]:
        """
        Upgrade or downgrade subscription plan.
        """
        try:
            # Get new plan limits
            new_limits = {
                SubscriptionPlan.STARTER: {"max_users": 5, "max_cases": 50},
                SubscriptionPlan.PROFESSIONAL: {"max_users": 20, "max_cases": 500},
                SubscriptionPlan.ENTERPRISE: {"max_users": 999, "max_cases": -1}
            }[new_plan]
            
            update_data = {
                "subscription_plan": new_plan.value,
                "max_users": new_limits["max_users"],
                "max_cases": new_limits["max_cases"],
                "updated_at": datetime.utcnow()
            }
            
            firm = await self.firm_repo.update(
                firm_id=firm_id,
                resource_id=firm_id,
                update_data=update_data,
                request_id=request_id
            )
            
            logger.info(
                f"[TENANT] SUBSCRIPTION_UPDATED firm_id={firm_id} "
                f"new_plan={new_plan.value} updated_by={updated_by_user_id} "
                f"request_id={request_id}"
            )
            
            return firm
        except Exception as e:
            logger.error(f"[TENANT] update_subscription error: {str(e)}")
            raise

    # ========================================================================
    # INITIALIZATION
    # ========================================================================

    async def ensure_indexes(self):
        """Create recommended indexes"""
        try:
            await self.firm_repo.ensure_indexes()
            logger.info("[TENANT] Indexes created successfully")
        except Exception as e:
            logger.warning(f"[TENANT] Index creation warning: {str(e)}")
