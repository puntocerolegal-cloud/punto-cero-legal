"""
Centralized Case Access Authorization Framework
═══════════════════════════════════════════════════════════════════════════

Purpose:
  Provide reusable helpers for validating:
  1. Ownership (case.lawyer_id == current_user._id)
  2. Tenant isolation (case.organization_id == current_user.organization_id)
  3. ObjectId safety (InvalidId → 400, not 500)

Usage (Example):
  from security.case_access import get_secure_case
  
  doc = await get_secure_case(
      case_id=case_id,
      current_user=current_user,
      db=db
  )
  # Returns case or raises HTTPException(403/404/400)

Reutilizable para:
  - Cases
  - Case activities
  - Case timeline
  - Case workflows (accept, decline, etc.)
"""

from fastapi import HTTPException, status
from bson import ObjectId
from bson.errors import InvalidId
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)


async def get_secure_case(
    case_id: str,
    current_user: dict,
    db: AsyncIOMotorDatabase,
    collection_name: str = "cases",
    ownership_field: str = "lawyer_id",
    org_field: str = "organization_id",
) -> Dict[str, Any]:
    """
    Safely retrieve a case with ownership and organization validation.
    
    Args:
        case_id: The MongoDB ObjectId as string
        current_user: User dict from get_current_user() (has _id, organization_id, etc.)
        db: AsyncIOMotorDatabase connection
        collection_name: Name of collection (default: "cases")
        ownership_field: Field name for ownership check (default: "lawyer_id")
        org_field: Field name for org/tenant check (default: "organization_id")
    
    Returns:
        Case dict from MongoDB
    
    Raises:
        HTTPException(400): Invalid ObjectId format
        HTTPException(403): Ownership or org validation failed (Forbidden)
        HTTPException(404): Case not found
    
    Behavior:
        1. Validate ObjectId format → 400 if invalid
        2. Fetch from database
        3. Check case exists → 404 if not
        4. Validate ownership (ownership_field == current_user._id) → 403 if fail
        5. Validate organization (org_field == current_user.organization_id) → 403 if fail
        6. Return case
    """
    
    # Step 1: Parse ObjectId safely
    try:
        object_id = ObjectId(case_id)
    except InvalidId:
        logger.warning(
            f"[CASE_ACCESS] Invalid ObjectId format: {case_id} "
            f"user={current_user.get('_id')}"
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid case ID format"
        )
    
    # Step 2: Fetch case
    collection = db[collection_name]
    case = await collection.find_one({"_id": object_id})
    
    # Step 3: Check exists
    if not case:
        logger.info(
            f"[CASE_ACCESS] Case not found: {case_id} "
            f"user={current_user.get('_id')}"
        )
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Case not found"
        )
    
    # Step 4: Validate ownership
    user_id = current_user.get("_id")
    case_owner = case.get(ownership_field)
    
    if case_owner != user_id:
        logger.warning(
            f"[CASE_ACCESS] Ownership violation: {case_id} "
            f"case_owner={case_owner} "
            f"current_user={user_id}"
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: you don't own this case"
        )
    
    # Step 5: Validate organization (defense in depth)
    user_org = current_user.get("organization_id")
    case_org = case.get(org_field)
    
    if case_org and user_org and case_org != user_org:
        logger.critical(
            f"[CASE_ACCESS] ORGANIZATION BYPASS ATTEMPT: {case_id} "
            f"case_org={case_org} "
            f"user_org={user_org} "
            f"user={user_id}"
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: organization mismatch"
        )
    
    logger.info(
        f"[CASE_ACCESS] Case access granted: {case_id} "
        f"user={user_id} "
        f"org={user_org}"
    )
    
    return case


async def validate_case_ownership(
    case_id: str,
    current_user: dict,
    db: AsyncIOMotorDatabase,
    collection_name: str = "cases",
    ownership_field: str = "lawyer_id",
    org_field: str = "organization_id",
) -> None:
    """
    Validate case ownership and organization without returning the case.
    
    Useful for PATCH/DELETE operations where you want to validate before modifying.
    
    Raises:
        HTTPException(400): Invalid ObjectId format
        HTTPException(403): Ownership or org validation failed
        HTTPException(404): Case not found
    """
    
    # This internally uses get_secure_case, which does all validation
    await get_secure_case(
        case_id=case_id,
        current_user=current_user,
        db=db,
        collection_name=collection_name,
        ownership_field=ownership_field,
        org_field=org_field,
    )
