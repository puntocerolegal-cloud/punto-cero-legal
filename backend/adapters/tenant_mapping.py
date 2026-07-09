"""
Tenant Mapping Adapter Layer
Provides bidirectional translation between organization_id and firm_id

This layer bridges the gap between:
- Legacy/Storage Layer: Uses organization_id (MongoDB documents, BillingService)
- Repository Layer: Uses firm_id (TenantKernel standard, all repositories)
- Request Layer: Uses firm_id from TenantContext (FastAPI routes)

Design Pattern:
  organization_id ←→ firm_id (1:1 mapping)
  
Key Properties:
- Transparent translation (caller doesn't see the difference)
- Reversible (can go both directions)
- Logged (all mappings tracked with request_id)
- Fallback-safe (handles missing values gracefully)
- No modifications to TenantKernel, BaseRepository, or MongoDB schemas

Compatibility Guarantee:
- organization_id remains in MongoDB (no schema changes)
- firm_id used in Repository API boundary
- All existing REST contracts unchanged
- BillingService continues to work during transition
- Gradual migration possible in B4-B5

Usage:
  From routes (have firm_id via TenantContext):
    org_id = await TenantMapping.firm_to_organization(firm_id, db, request_id)
    # Use org_id for legacy BillingService calls
    
  From repositories (need firm_id):
    firm_id = await TenantMapping.organization_to_firm(org_id, db, request_id)
    # Use firm_id for repository operations
"""

from typing import Optional, Dict, Any
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class TenantMapping:
    """
    Bidirectional tenant mapping between organization_id and firm_id.
    
    This is the official adapter for B3 (Tenant Mapping Implementation).
    Enables gradual migration from organization_id-based BillingService
    to firm_id-based Repository pattern without breaking compatibility.
    
    Thread-safe, async-compatible, request-traceable.
    """

    # ════════════════════════════════════════════════════════════════════════════════
    # MAPPING: organization_id → firm_id
    # ════════════════════════════════════════════════════════════════════════════════

    @staticmethod
    async def organization_to_firm(
        organization_id: str,
        db: AsyncIOMotorDatabase,
        request_id: str
    ) -> Optional[str]:
        """
        Resolve firm_id from organization_id.
        
        Maps legacy organization_id (used in BillingService, MongoDB documents)
        to firm_id (used in TenantKernel and Repositories).
        
        Lookup Strategy:
        1. Query organizations collection for organization_id
        2. Extract firm_id from organization document
        3. Return firm_id or None if not found
        
        Args:
            organization_id: Legacy organization identifier (from BillingService)
            db: MongoDB database connection
            request_id: Request trace ID for audit trail
        
        Returns:
            firm_id string if found, None otherwise
        
        Raises:
            None (returns None on lookup failure, logs warning)
        """
        try:
            # Lookup organization document
            org_doc = await db.organizations.find_one({
                "_id": organization_id
            })
            
            if not org_doc:
                logger.warning(
                    f"[tenant-mapping] ORGANIZATION_TO_FIRM organization_id={organization_id} "
                    f"not_found request_id={request_id}"
                )
                return None
            
            # Extract firm_id from organization
            firm_id = org_doc.get("firm_id")
            
            if not firm_id:
                logger.warning(
                    f"[tenant-mapping] ORGANIZATION_TO_FIRM organization_id={organization_id} "
                    f"firm_id_missing request_id={request_id}"
                )
                return None
            
            logger.debug(
                f"[tenant-mapping] ORGANIZATION_TO_FIRM organization_id={organization_id} "
                f"firm_id={firm_id} request_id={request_id}"
            )
            
            return firm_id
        except Exception as e:
            logger.error(
                f"[tenant-mapping] ORGANIZATION_TO_FIRM error: {str(e)} "
                f"organization_id={organization_id} request_id={request_id}"
            )
            return None

    # ════════════════════════════════════════════════════════════════════════════════
    # MAPPING: firm_id → organization_id
    # ════════════════════════════════════════════════════════════════════════════════

    @staticmethod
    async def firm_to_organization(
        firm_id: str,
        db: AsyncIOMotorDatabase,
        request_id: str
    ) -> Optional[str]:
        """
        Resolve organization_id from firm_id.
        
        Maps firm_id (used in TenantKernel, Repositories)
        to organization_id (used in BillingService, MongoDB documents).
        
        Reverse of organization_to_firm().
        
        Lookup Strategy:
        1. Query organizations collection for firm_id match
        2. Extract organization_id (which is the _id field)
        3. Return organization_id or None if not found
        
        Args:
            firm_id: Modern tenant identifier (from TenantKernel)
            db: MongoDB database connection
            request_id: Request trace ID for audit trail
        
        Returns:
            organization_id string if found, None otherwise
        
        Raises:
            None (returns None on lookup failure, logs warning)
        """
        try:
            # Lookup organization by firm_id
            org_doc = await db.organizations.find_one({
                "firm_id": firm_id
            })
            
            if not org_doc:
                logger.warning(
                    f"[tenant-mapping] FIRM_TO_ORGANIZATION firm_id={firm_id} "
                    f"not_found request_id={request_id}"
                )
                return None
            
            # Extract organization_id (stored as _id)
            organization_id = org_doc.get("_id")
            
            if not organization_id:
                logger.warning(
                    f"[tenant-mapping] FIRM_TO_ORGANIZATION firm_id={firm_id} "
                    f"organization_id_missing request_id={request_id}"
                )
                return None
            
            logger.debug(
                f"[tenant-mapping] FIRM_TO_ORGANIZATION firm_id={firm_id} "
                f"organization_id={organization_id} request_id={request_id}"
            )
            
            return organization_id
        except Exception as e:
            logger.error(
                f"[tenant-mapping] FIRM_TO_ORGANIZATION error: {str(e)} "
                f"firm_id={firm_id} request_id={request_id}"
            )
            return None

    # ════════════════════════════════════════════════════════════════════════════════
    # SAFE MAPPING: with fallbacks
    # ════════════════════════════════════════════════════════════════════════════════

    @staticmethod
    async def organization_to_firm_safe(
        organization_id: Optional[str],
        firm_id: Optional[str],
        db: AsyncIOMotorDatabase,
        request_id: str
    ) -> Optional[str]:
        """
        Resolve firm_id with fallback strategy.
        
        Used when both organization_id and firm_id might be available.
        Prioritizes firm_id if already present (avoids unnecessary lookup).
        
        Fallback Order:
        1. If firm_id provided, use it directly (no lookup needed)
        2. If organization_id provided, resolve it
        3. If both missing, return None
        
        Args:
            organization_id: Optional legacy identifier
            firm_id: Optional modern identifier
            db: MongoDB database connection
            request_id: Request trace ID
        
        Returns:
            firm_id if resolved, None otherwise
        """
        # If firm_id already available, return it (no lookup needed)
        if firm_id:
            logger.debug(
                f"[tenant-mapping] ORGANIZATION_TO_FIRM_SAFE using_provided_firm_id={firm_id} "
                f"request_id={request_id}"
            )
            return firm_id
        
        # If only organization_id available, resolve it
        if organization_id:
            resolved_firm_id = await TenantMapping.organization_to_firm(
                organization_id, db, request_id
            )
            return resolved_firm_id
        
        # Both missing
        logger.warning(
            f"[tenant-mapping] ORGANIZATION_TO_FIRM_SAFE both_identifiers_missing "
            f"request_id={request_id}"
        )
        return None

    @staticmethod
    async def firm_to_organization_safe(
        firm_id: Optional[str],
        organization_id: Optional[str],
        db: AsyncIOMotorDatabase,
        request_id: str
    ) -> Optional[str]:
        """
        Resolve organization_id with fallback strategy.
        
        Used when both firm_id and organization_id might be available.
        Prioritizes organization_id if already present (avoids unnecessary lookup).
        
        Fallback Order:
        1. If organization_id provided, use it directly (no lookup needed)
        2. If firm_id provided, resolve it
        3. If both missing, return None
        
        Args:
            firm_id: Optional modern identifier
            organization_id: Optional legacy identifier
            db: MongoDB database connection
            request_id: Request trace ID
        
        Returns:
            organization_id if resolved, None otherwise
        """
        # If organization_id already available, return it (no lookup needed)
        if organization_id:
            logger.debug(
                f"[tenant-mapping] FIRM_TO_ORGANIZATION_SAFE using_provided_organization_id={organization_id} "
                f"request_id={request_id}"
            )
            return organization_id
        
        # If only firm_id available, resolve it
        if firm_id:
            resolved_org_id = await TenantMapping.firm_to_organization(
                firm_id, db, request_id
            )
            return resolved_org_id
        
        # Both missing
        logger.warning(
            f"[tenant-mapping] FIRM_TO_ORGANIZATION_SAFE both_identifiers_missing "
            f"request_id={request_id}"
        )
        return None

    # ════════════════════════════════════════════════════════════════════════════════
    # VALIDATION
    # ════════════════════════════════════════════════════════════════════════════════

    @staticmethod
    async def validate_mapping(
        organization_id: str,
        firm_id: str,
        db: AsyncIOMotorDatabase,
        request_id: str
    ) -> bool:
        """
        Validate that organization_id and firm_id refer to the same tenant.
        
        Used to ensure consistency before operations.
        Returns True only if mapping is valid and matches.
        
        Args:
            organization_id: Legacy identifier
            firm_id: Modern identifier
            db: MongoDB database connection
            request_id: Request trace ID
        
        Returns:
            True if both identifiers map to each other, False otherwise
        """
        try:
            # Resolve firm_id from organization_id
            resolved_firm_id = await TenantMapping.organization_to_firm(
                organization_id, db, request_id
            )
            
            if resolved_firm_id != firm_id:
                logger.warning(
                    f"[tenant-mapping] VALIDATE_MAPPING mismatch organization_id={organization_id} "
                    f"firm_id={firm_id} resolved_firm_id={resolved_firm_id} "
                    f"request_id={request_id}"
                )
                return False
            
            logger.debug(
                f"[tenant-mapping] VALIDATE_MAPPING valid organization_id={organization_id} "
                f"firm_id={firm_id} request_id={request_id}"
            )
            
            return True
        except Exception as e:
            logger.error(
                f"[tenant-mapping] VALIDATE_MAPPING error: {str(e)} "
                f"organization_id={organization_id} firm_id={firm_id} "
                f"request_id={request_id}"
            )
            return False

    # ════════════════════════════════════════════════════════════════════════════════
    # INTEGRATION POINTS FOR B4-B5 MIGRATION
    # ════════════════════════════════════════════════════════════════════════════════

    @staticmethod
    async def create_billing_context_for_repository(
        organization_id: str,
        db: AsyncIOMotorDatabase,
        request_id: str
    ) -> Optional[Dict[str, str]]:
        """
        Create repository call context from BillingService parameters.
        
        Helper for B4 migration: converts BillingService call context
        (which has organization_id) to repository call context (which needs firm_id).
        
        Used in B4 to wrap BillingService calls to InvoiceRepository.
        
        Args:
            organization_id: From BillingService method parameter
            db: MongoDB connection
            request_id: From request context
        
        Returns:
            Dict with {organization_id, firm_id} or None if mapping fails
        """
        try:
            firm_id = await TenantMapping.organization_to_firm(
                organization_id, db, request_id
            )
            
            if not firm_id:
                logger.warning(
                    f"[tenant-mapping] CREATE_BILLING_CONTEXT_FOR_REPOSITORY "
                    f"firm_id_resolution_failed organization_id={organization_id} "
                    f"request_id={request_id}"
                )
                return None
            
            context = {
                "organization_id": organization_id,
                "firm_id": firm_id,
                "request_id": request_id
            }
            
            logger.debug(
                f"[tenant-mapping] CREATE_BILLING_CONTEXT_FOR_REPOSITORY "
                f"organization_id={organization_id} firm_id={firm_id} "
                f"request_id={request_id}"
            )
            
            return context
        except Exception as e:
            logger.error(
                f"[tenant-mapping] CREATE_BILLING_CONTEXT_FOR_REPOSITORY error: {str(e)} "
                f"organization_id={organization_id} request_id={request_id}"
            )
            return None

    @staticmethod
    async def create_legacy_context_from_repository(
        firm_id: str,
        db: AsyncIOMotorDatabase,
        request_id: str
    ) -> Optional[Dict[str, str]]:
        """
        Create BillingService call context from repository parameters.
        
        Reverse helper for B4 migration: converts repository context
        (which uses firm_id) to BillingService context (which needs organization_id).
        
        Used if any repository method needs to call legacy code.
        
        Args:
            firm_id: From repository parameter or request context
            db: MongoDB connection
            request_id: From request context
        
        Returns:
            Dict with {firm_id, organization_id} or None if mapping fails
        """
        try:
            organization_id = await TenantMapping.firm_to_organization(
                firm_id, db, request_id
            )
            
            if not organization_id:
                logger.warning(
                    f"[tenant-mapping] CREATE_LEGACY_CONTEXT_FROM_REPOSITORY "
                    f"organization_id_resolution_failed firm_id={firm_id} "
                    f"request_id={request_id}"
                )
                return None
            
            context = {
                "firm_id": firm_id,
                "organization_id": organization_id,
                "request_id": request_id
            }
            
            logger.debug(
                f"[tenant-mapping] CREATE_LEGACY_CONTEXT_FROM_REPOSITORY "
                f"firm_id={firm_id} organization_id={organization_id} "
                f"request_id={request_id}"
            )
            
            return context
        except Exception as e:
            logger.error(
                f"[tenant-mapping] CREATE_LEGACY_CONTEXT_FROM_REPOSITORY error: {str(e)} "
                f"firm_id={firm_id} request_id={request_id}"
            )
            return None
