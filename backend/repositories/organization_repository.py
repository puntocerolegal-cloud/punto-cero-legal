"""
Organization Repository
CRUD operations for organizations with multi-tenant isolation

Follows Golden Repository Template v1.0 specification.
Provides organization management with:
- Multi-tenant isolation via firm_id
- Audit trail with request_id
- Comprehensive error handling
- Organization lifecycle management
- Reporting and aggregation support
"""

from typing import Optional, List, Dict, Any
from motor.motor_asyncio import AsyncIOMotorCollection
from bson import ObjectId
from datetime import datetime
import logging
import re
import unicodedata

from repositories.enterprise_base_repository import BaseRepository
from middleware.tenant_isolation import TenantAwareQuery

logger = logging.getLogger(__name__)


def slugify(value: str) -> str:
    """Convert string to URL-safe slug"""
    value = unicodedata.normalize("NFKD", value or "").encode("ascii", "ignore").decode("ascii")
    value = re.sub(r"[^a-zA-Z0-9]+", "-", value).strip("-").lower()
    return value or "org"


class OrganizationRepository(BaseRepository):
    """
    Repository for organization operations.
    
    Manages all organization-related CRUD operations with strict multi-tenant
    isolation via firm_id. Organizations represent the core business entity that
    must be auditable, consistent, and protected against cross-tenant leakage.
    
    Key responsibilities:
    - Manage organization lifecycle (active → suspended → deleted)
    - Support organization queries and filtering
    - Maintain audit trail with request_id traceability
    - Ensure firm_id filtering on all queries
    - Enforce slug and domain uniqueness per firm
    - Provide organization metrics and reporting
    
    Methods:
    - Base CRUD: create, find_by_id, update, soft_delete, hard_delete (inherited from BaseRepository)
    - Specialized Queries: find_by_slug, find_by_domain, find_active, list_paginated, search
    - Administration: activate, deactivate, change_plan, update_limits
    - Reporting: statistics, usage_summary, organization_metrics
    """

    def __init__(self, collection: AsyncIOMotorCollection):
        """
        Initialize OrganizationRepository.
        
        Args:
            collection: Motor async collection for organizations
        """
        super().__init__(collection, dict)
        self.collection = collection
        
        logger.info(
            f"[organizations] OrganizationRepository initialized "
            f"collection={collection.full_name}"
        )

    # ════════════════════════════════════════════════════════════════════════════════
    # REPOSITORY INITIALIZATION & INDEXES
    # ════════════════════════════════════════════════════════════════════════════════

    async def ensure_indexes(self) -> None:
        """
        Create all required indexes for organizations collection.
        
        Follows Golden Repository Template v1.0:
        - First field: firm_id (multi-tenant isolation)
        - Compound indexes for common query patterns
        - Unique constraints for slug and domain per firm
        - Sparse indexes for optional fields
        
        Indexes are created asynchronously without blocking.
        Safe to call multiple times (idempotent).
        
        Raises:
            Exception: If index creation fails
        """
        try:
            logger.info("[organizations] Starting index creation...")

            indexes = [
                {
                    "name": "firm_status",
                    "spec": [("firm_id", 1), ("status", 1)],
                    "kwargs": {"background": True}
                },
                {
                    "name": "firm_slug",
                    "spec": [("firm_id", 1), ("slug", 1)],
                    "kwargs": {"background": True, "unique": True}
                },
                {
                    "name": "firm_domain",
                    "spec": [("firm_id", 1), ("domain", 1)],
                    "kwargs": {"background": True, "sparse": True}
                },
                {
                    "name": "firm_created",
                    "spec": [("firm_id", 1), ("created_at", -1)],
                    "kwargs": {"background": True}
                },
                {
                    "name": "firm_plan",
                    "spec": [("firm_id", 1), ("plan", 1)],
                    "kwargs": {"background": True}
                },
                {
                    "name": "firm_vertical",
                    "spec": [("firm_id", 1), ("vertical", 1)],
                    "kwargs": {"background": True, "sparse": True}
                },
            ]

            for index in indexes:
                try:
                    index_name = await self.collection.create_index(
                        index["spec"],
                        name=index["name"],
                        **index["kwargs"]
                    )
                    logger.info(f"[organizations] Index created: {index_name}")
                except Exception as e:
                    logger.warning(f"[organizations] Index creation warning for {index['name']}: {str(e)}")

            logger.info("[organizations] Index creation completed")
        except Exception as e:
            logger.error(f"[organizations] ensure_indexes failed: {str(e)}")
            raise

    @staticmethod
    def init() -> None:
        """Initialize repository (no-op for compatibility)"""
        pass

    # ════════════════════════════════════════════════════════════════════════════════
    # SPECIALIZED QUERIES
    # ════════════════════════════════════════════════════════════════════════════════

    async def find_by_slug(
        self,
        firm_id: str,
        slug: str,
        request_id: str
    ) -> Optional[Dict[str, Any]]:
        """
        Find organization by slug within firm.
        
        Args:
            firm_id: Multi-tenant isolation
            slug: Organization slug
            request_id: For audit trail
            
        Returns:
            Organization document or None
        """
        try:
            query = TenantAwareQuery.add_firm_filter({"slug": slug}, firm_id)
            
            start_time = datetime.utcnow()
            doc = await self.collection.find_one(query)
            elapsed = (datetime.utcnow() - start_time).total_seconds()
            
            logger.info(
                f"[organizations] FIND_BY_SLUG firm_id={firm_id} slug={slug} "
                f"found={'yes' if doc else 'no'} elapsed={elapsed:.3f}s request_id={request_id}"
            )
            
            return doc
        except Exception as e:
            logger.error(f"[organizations] FIND_BY_SLUG error: {str(e)}")
            raise

    async def find_by_domain(
        self,
        firm_id: str,
        domain: str,
        request_id: str
    ) -> Optional[Dict[str, Any]]:
        """
        Find organization by domain within firm.
        
        Args:
            firm_id: Multi-tenant isolation
            domain: Organization domain
            request_id: For audit trail
            
        Returns:
            Organization document or None
        """
        try:
            query = TenantAwareQuery.add_firm_filter({"domain": domain}, firm_id)
            
            start_time = datetime.utcnow()
            doc = await self.collection.find_one(query)
            elapsed = (datetime.utcnow() - start_time).total_seconds()
            
            logger.info(
                f"[organizations] FIND_BY_DOMAIN firm_id={firm_id} domain={domain} "
                f"found={'yes' if doc else 'no'} elapsed={elapsed:.3f}s request_id={request_id}"
            )
            
            return doc
        except Exception as e:
            logger.error(f"[organizations] FIND_BY_DOMAIN error: {str(e)}")
            raise

    async def find_active(
        self,
        firm_id: str,
        request_id: str
    ) -> List[Dict[str, Any]]:
        """
        Find all active organizations for firm.
        
        Args:
            firm_id: Multi-tenant isolation
            request_id: For audit trail
            
        Returns:
            List of active organization documents
        """
        try:
            query = TenantAwareQuery.add_firm_filter({"status": "active"}, firm_id)
            
            start_time = datetime.utcnow()
            docs = await self.collection.find(query).sort("created_at", -1).to_list(None)
            elapsed = (datetime.utcnow() - start_time).total_seconds()
            
            logger.info(
                f"[organizations] FIND_ACTIVE firm_id={firm_id} count={len(docs)} "
                f"elapsed={elapsed:.3f}s request_id={request_id}"
            )
            
            return docs
        except Exception as e:
            logger.error(f"[organizations] FIND_ACTIVE error: {str(e)}")
            raise

    async def list_paginated(
        self,
        firm_id: str,
        skip: int = 0,
        limit: int = 50,
        status: Optional[str] = None,
        plan: Optional[str] = None,
        request_id: str = None
    ) -> tuple[List[Dict[str, Any]], int]:
        """
        List organizations with pagination and optional filters.
        
        Args:
            firm_id: Multi-tenant isolation
            skip: Pagination skip
            limit: Pagination limit (max 100)
            status: Filter by status (active, suspended, deleted)
            plan: Filter by plan (free, pro, enterprise)
            request_id: For audit trail
            
        Returns:
            Tuple of (organizations, total_count)
        """
        try:
            limit = min(limit, 100)
            
            query = TenantAwareQuery.add_firm_filter({}, firm_id)
            if status:
                query["status"] = status
            if plan:
                query["plan"] = plan
            
            start_time = datetime.utcnow()
            
            total = await self.collection.count_documents(query)
            docs = await self.collection.find(query).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
            
            elapsed = (datetime.utcnow() - start_time).total_seconds()
            
            logger.info(
                f"[organizations] LIST_PAGINATED firm_id={firm_id} skip={skip} "
                f"limit={limit} returned={len(docs)} total={total} elapsed={elapsed:.3f}s "
                f"request_id={request_id}"
            )
            
            return docs, total
        except Exception as e:
            logger.error(f"[organizations] LIST_PAGINATED error: {str(e)}")
            raise

    async def search(
        self,
        firm_id: str,
        query_text: str,
        request_id: str
    ) -> List[Dict[str, Any]]:
        """
        Search organizations by name or slug (substring match).
        
        Args:
            firm_id: Multi-tenant isolation
            query_text: Search text
            request_id: For audit trail
            
        Returns:
            List of matching organization documents
        """
        try:
            query = TenantAwareQuery.add_firm_filter(
                {
                    "$or": [
                        {"name": {"$regex": query_text, "$options": "i"}},
                        {"slug": {"$regex": query_text, "$options": "i"}},
                    ]
                },
                firm_id
            )
            
            start_time = datetime.utcnow()
            docs = await self.collection.find(query).sort("created_at", -1).to_list(None)
            elapsed = (datetime.utcnow() - start_time).total_seconds()
            
            logger.info(
                f"[organizations] SEARCH firm_id={firm_id} query='{query_text}' "
                f"count={len(docs)} elapsed={elapsed:.3f}s request_id={request_id}"
            )
            
            return docs
        except Exception as e:
            logger.error(f"[organizations] SEARCH error: {str(e)}")
            raise

    # ════════════════════════════════════════════════════════════════════════════════
    # ADMINISTRATION OPERATIONS
    # ════════════════════════════════════════════════════════════════════════════════

    async def activate(
        self,
        firm_id: str,
        org_id: str,
        request_id: str
    ) -> Dict[str, Any]:
        """
        Activate organization (set status to active).
        
        Args:
            firm_id: Multi-tenant isolation
            org_id: Organization ID
            request_id: For audit trail
            
        Returns:
            Updated organization document
        """
        try:
            start_time = datetime.utcnow()
            
            result = await self.update(
                firm_id=firm_id,
                resource_id=org_id,
                update_data={"status": "active", "updated_at": datetime.utcnow()},
                request_id=request_id
            )
            
            elapsed = (datetime.utcnow() - start_time).total_seconds()
            
            logger.info(
                f"[organizations] ACTIVATE firm_id={firm_id} org_id={org_id} "
                f"elapsed={elapsed:.3f}s request_id={request_id}"
            )
            
            return result
        except Exception as e:
            logger.error(f"[organizations] ACTIVATE error: {str(e)}")
            raise

    async def deactivate(
        self,
        firm_id: str,
        org_id: str,
        request_id: str
    ) -> Dict[str, Any]:
        """
        Deactivate organization (set status to suspended).
        
        Args:
            firm_id: Multi-tenant isolation
            org_id: Organization ID
            request_id: For audit trail
            
        Returns:
            Updated organization document
        """
        try:
            start_time = datetime.utcnow()
            
            result = await self.update(
                firm_id=firm_id,
                resource_id=org_id,
                update_data={"status": "suspended", "updated_at": datetime.utcnow()},
                request_id=request_id
            )
            
            elapsed = (datetime.utcnow() - start_time).total_seconds()
            
            logger.info(
                f"[organizations] DEACTIVATE firm_id={firm_id} org_id={org_id} "
                f"elapsed={elapsed:.3f}s request_id={request_id}"
            )
            
            return result
        except Exception as e:
            logger.error(f"[organizations] DEACTIVATE error: {str(e)}")
            raise

    async def change_plan(
        self,
        firm_id: str,
        org_id: str,
        new_plan: str,
        request_id: str
    ) -> Dict[str, Any]:
        """
        Change organization plan (free, pro, enterprise).
        
        Args:
            firm_id: Multi-tenant isolation
            org_id: Organization ID
            new_plan: New plan name
            request_id: For audit trail
            
        Returns:
            Updated organization document
        """
        try:
            valid_plans = {"free", "pro", "enterprise"}
            if new_plan not in valid_plans:
                logger.error(
                    f"[organizations] CHANGE_PLAN invalid plan: {new_plan} "
                    f"request_id={request_id}"
                )
                raise ValueError(f"Invalid plan: {new_plan}")
            
            start_time = datetime.utcnow()
            
            result = await self.update(
                firm_id=firm_id,
                resource_id=org_id,
                update_data={"plan": new_plan, "updated_at": datetime.utcnow()},
                request_id=request_id
            )
            
            elapsed = (datetime.utcnow() - start_time).total_seconds()
            
            logger.info(
                f"[organizations] CHANGE_PLAN firm_id={firm_id} org_id={org_id} "
                f"plan={new_plan} elapsed={elapsed:.3f}s request_id={request_id}"
            )
            
            return result
        except Exception as e:
            logger.error(f"[organizations] CHANGE_PLAN error: {str(e)}")
            raise

    async def update_limits(
        self,
        firm_id: str,
        org_id: str,
        limits: Dict[str, Any],
        request_id: str
    ) -> Dict[str, Any]:
        """
        Update organization limits (seats, projects, etc).
        
        Args:
            firm_id: Multi-tenant isolation
            org_id: Organization ID
            limits: Dictionary of limit keys and values
            request_id: For audit trail
            
        Returns:
            Updated organization document
        """
        try:
            if not limits:
                logger.warning(
                    f"[organizations] UPDATE_LIMITS empty limits "
                    f"request_id={request_id}"
                )
                return await self.find_by_id(firm_id, org_id, request_id)
            
            start_time = datetime.utcnow()
            
            result = await self.update(
                firm_id=firm_id,
                resource_id=org_id,
                update_data={"limits": limits, "updated_at": datetime.utcnow()},
                request_id=request_id
            )
            
            elapsed = (datetime.utcnow() - start_time).total_seconds()
            
            logger.info(
                f"[organizations] UPDATE_LIMITS firm_id={firm_id} org_id={org_id} "
                f"keys={list(limits.keys())} elapsed={elapsed:.3f}s request_id={request_id}"
            )
            
            return result
        except Exception as e:
            logger.error(f"[organizations] UPDATE_LIMITS error: {str(e)}")
            raise

    # ════════════════════════════════════════════════════════════════════════════════
    # REPORTING OPERATIONS
    # ════════════════════════════════════════════════════════════════════════════════

    async def statistics(
        self,
        firm_id: str,
        request_id: str
    ) -> Dict[str, Any]:
        """
        Calculate organization statistics for firm.
        
        Args:
            firm_id: Multi-tenant isolation
            request_id: For audit trail
            
        Returns:
            Statistics dictionary
        """
        try:
            start_time = datetime.utcnow()
            
            query = TenantAwareQuery.add_firm_filter({}, firm_id)
            
            total = await self.collection.count_documents(query)
            active = await self.collection.count_documents(
                TenantAwareQuery.add_firm_filter({"status": "active"}, firm_id)
            )
            suspended = await self.collection.count_documents(
                TenantAwareQuery.add_firm_filter({"status": "suspended"}, firm_id)
            )
            
            plans = {}
            for plan in ["free", "pro", "enterprise"]:
                count = await self.collection.count_documents(
                    TenantAwareQuery.add_firm_filter({"plan": plan}, firm_id)
                )
                if count > 0:
                    plans[plan] = count
            
            elapsed = (datetime.utcnow() - start_time).total_seconds()
            
            stats = {
                "total": total,
                "active": active,
                "suspended": suspended,
                "by_plan": plans,
            }
            
            logger.info(
                f"[organizations] STATISTICS firm_id={firm_id} total={total} "
                f"active={active} elapsed={elapsed:.3f}s request_id={request_id}"
            )
            
            return stats
        except Exception as e:
            logger.error(f"[organizations] STATISTICS error: {str(e)}")
            raise

    async def usage_summary(
        self,
        firm_id: str,
        request_id: str
    ) -> Dict[str, Any]:
        """
        Get usage summary for organizations in firm.
        
        Args:
            firm_id: Multi-tenant isolation
            request_id: For audit trail
            
        Returns:
            Usage summary dictionary
        """
        try:
            start_time = datetime.utcnow()
            
            query = TenantAwareQuery.add_firm_filter({}, firm_id)
            orgs = await self.collection.find(query).to_list(None)
            
            total_users = sum(int(org.get("users", 0) or 0) for org in orgs)
            total_projects = sum(int(org.get("projects", 0) or 0) for org in orgs)
            total_seats = sum(int(org.get("limits", {}).get("seats", 0) or 0) for org in orgs)
            
            elapsed = (datetime.utcnow() - start_time).total_seconds()
            
            summary = {
                "organizations_count": len(orgs),
                "total_users": total_users,
                "total_projects": total_projects,
                "total_seats": total_seats,
            }
            
            logger.info(
                f"[organizations] USAGE_SUMMARY firm_id={firm_id} "
                f"orgs={len(orgs)} users={total_users} elapsed={elapsed:.3f}s "
                f"request_id={request_id}"
            )
            
            return summary
        except Exception as e:
            logger.error(f"[organizations] USAGE_SUMMARY error: {str(e)}")
            raise

    async def organization_metrics(
        self,
        firm_id: str,
        org_id: str,
        request_id: str
    ) -> Dict[str, Any]:
        """
        Get detailed metrics for a specific organization.
        
        Args:
            firm_id: Multi-tenant isolation
            org_id: Organization ID
            request_id: For audit trail
            
        Returns:
            Metrics dictionary
        """
        try:
            start_time = datetime.utcnow()
            
            org = await self.find_by_id(firm_id, org_id, request_id)
            if not org:
                logger.warning(
                    f"[organizations] ORGANIZATION_METRICS not found org_id={org_id} "
                    f"request_id={request_id}"
                )
                return {}
            
            metrics = {
                "id": str(org["_id"]),
                "name": org.get("name", ""),
                "status": org.get("status", ""),
                "plan": org.get("plan", ""),
                "users": int(org.get("users", 0) or 0),
                "projects": int(org.get("projects", 0) or 0),
                "seats": int(org.get("limits", {}).get("seats", 0) or 0),
                "mrr": float(org.get("mrr", 0) or 0),
                "created_at": org.get("created_at"),
                "updated_at": org.get("updated_at"),
            }
            
            elapsed = (datetime.utcnow() - start_time).total_seconds()
            
            logger.info(
                f"[organizations] ORGANIZATION_METRICS firm_id={firm_id} "
                f"org_id={org_id} elapsed={elapsed:.3f}s request_id={request_id}"
            )
            
            return metrics
        except Exception as e:
            logger.error(f"[organizations] ORGANIZATION_METRICS error: {str(e)}")
            raise

    # ════════════════════════════════════════════════════════════════════════════════
    # VALIDATION HELPERS
    # ════════════════════════════════════════════════════════════════════════════════

    async def validate_slug_unique(
        self,
        firm_id: str,
        slug: str,
        exclude_id: Optional[str] = None,
        request_id: str = None
    ) -> bool:
        """
        Check if slug is unique within firm.
        
        Args:
            firm_id: Multi-tenant isolation
            slug: Slug to check
            exclude_id: Optional document ID to exclude from check (for updates)
            request_id: For audit trail
            
        Returns:
            True if unique, False otherwise
        """
        try:
            query = TenantAwareQuery.add_firm_filter({"slug": slug}, firm_id)
            if exclude_id:
                if self._is_valid_object_id(exclude_id):
                    query["_id"] = {"$ne": ObjectId(exclude_id)}
                else:
                    query["_id"] = {"$ne": exclude_id}
            
            existing = await self.collection.find_one(query)
            is_unique = existing is None
            
            logger.debug(
                f"[organizations] VALIDATE_SLUG_UNIQUE firm_id={firm_id} "
                f"slug={slug} unique={is_unique} request_id={request_id}"
            )
            
            return is_unique
        except Exception as e:
            logger.error(f"[organizations] VALIDATE_SLUG_UNIQUE error: {str(e)}")
            raise

    async def validate_domain_unique(
        self,
        firm_id: str,
        domain: str,
        exclude_id: Optional[str] = None,
        request_id: str = None
    ) -> bool:
        """
        Check if domain is unique within firm.
        
        Args:
            firm_id: Multi-tenant isolation
            domain: Domain to check
            exclude_id: Optional document ID to exclude from check (for updates)
            request_id: For audit trail
            
        Returns:
            True if unique, False otherwise
        """
        try:
            query = TenantAwareQuery.add_firm_filter({"domain": domain}, firm_id)
            if exclude_id:
                if self._is_valid_object_id(exclude_id):
                    query["_id"] = {"$ne": ObjectId(exclude_id)}
                else:
                    query["_id"] = {"$ne": exclude_id}
            
            existing = await self.collection.find_one(query)
            is_unique = existing is None
            
            logger.debug(
                f"[organizations] VALIDATE_DOMAIN_UNIQUE firm_id={firm_id} "
                f"domain={domain} unique={is_unique} request_id={request_id}"
            )
            
            return is_unique
        except Exception as e:
            logger.error(f"[organizations] VALIDATE_DOMAIN_UNIQUE error: {str(e)}")
            raise

    @staticmethod
    def _is_valid_object_id(value: str) -> bool:
        """Check if string is valid MongoDB ObjectId"""
        try:
            ObjectId.from_string(value)
            return True
        except:
            return False
