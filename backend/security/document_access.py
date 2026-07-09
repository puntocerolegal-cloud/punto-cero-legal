"""
Centralized Document Access Authorization Framework
═══════════════════════════════════════════════════════════════════════════

Purpose:
  Provide reusable helpers for validating:
  1. Ownership (document.lawyer_id == current_user._id)
  2. Tenant isolation (document.firm_id == tenant_context.firm_id)
  3. ObjectId safety (InvalidId → 400, not 500)

Usage (Example):
  from security.document_access import get_secure_document, validate_document_access
  
  # In your endpoint:
  doc = await get_secure_document(
      document_id=document_id,
      current_user=current_user,
      tenant_context=request.state.tenant_context,
      db=db
  )
  # Returns document or raises HTTPException(403/404/400)

Reutilizable para:
  - Documents
  - Cases
  - Invoices
  - Messages
  - Meetings
  - Appointments
  - CRM
  - Dashboard
"""

from fastapi import HTTPException, status
from bson import ObjectId
from bson.errors import InvalidId
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)


async def get_secure_document(
    document_id: str,
    current_user: dict,
    tenant_context: Optional[Any],
    db: AsyncIOMotorDatabase,
    collection_name: str = "documents",
    ownership_field: str = "lawyer_id",
    tenant_field: str = "firm_id",
) -> Dict[str, Any]:
    """
    Safely retrieve a document with ownership and tenant validation.
    
    Args:
        document_id: The MongoDB ObjectId as string
        current_user: User dict from get_current_user() (has _id, email, etc.)
        tenant_context: TenantContext from request.state.tenant_context
        db: AsyncIOMotorDatabase connection
        collection_name: Name of collection (default: "documents")
        ownership_field: Field name for ownership check (default: "lawyer_id")
        tenant_field: Field name for tenant check (default: "firm_id")
    
    Returns:
        Document dict from MongoDB
    
    Raises:
        HTTPException(400): Invalid ObjectId format
        HTTPException(403): Ownership or tenant validation failed (Forbidden)
        HTTPException(404): Document not found
    
    Behavior:
        1. Validate ObjectId format → 400 if invalid
        2. Fetch from database
        3. Check document exists → 404 if not
        4. Validate ownership (ownership_field == current_user._id) → 403 if fail
        5. Validate tenant isolation (tenant_field == tenant_context.firm_id) → 403 if fail
        6. Return document
    """
    
    # Step 1: Parse ObjectId safely
    try:
        object_id = ObjectId(document_id)
    except InvalidId:
        logger.warning(
            f"[DOCUMENT_ACCESS] Invalid ObjectId format: {document_id} "
            f"user={current_user.get('_id')} "
            f"tenant={tenant_context.firm_id if tenant_context else 'unknown'}"
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid document ID format"
        )
    
    # Step 2: Fetch document
    collection = db[collection_name]
    document = await collection.find_one({"_id": object_id})
    
    # Step 3: Check exists
    if not document:
        logger.info(
            f"[DOCUMENT_ACCESS] Document not found: {document_id} "
            f"user={current_user.get('_id')} "
            f"tenant={tenant_context.firm_id if tenant_context else 'unknown'}"
        )
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document not found"
        )
    
    # Step 4: Validate ownership
    user_id = current_user.get("_id")
    doc_owner = document.get(ownership_field)
    
    if doc_owner != user_id:
        logger.warning(
            f"[DOCUMENT_ACCESS] Ownership violation: {document_id} "
            f"document_owner={doc_owner} "
            f"current_user={user_id} "
            f"tenant={tenant_context.firm_id if tenant_context else 'unknown'}"
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: you don't own this document"
        )
    
    # Step 5: Validate tenant (defense in depth)
    if tenant_context:
        doc_tenant = document.get(tenant_field)
        request_tenant = tenant_context.firm_id
        
        if doc_tenant and doc_tenant != request_tenant:
            logger.critical(
                f"[DOCUMENT_ACCESS] TENANT BYPASS ATTEMPT: {document_id} "
                f"document_tenant={doc_tenant} "
                f"request_tenant={request_tenant} "
                f"user={user_id}"
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: tenant mismatch"
            )
    
    logger.info(
        f"[DOCUMENT_ACCESS] Document access granted: {document_id} "
        f"user={user_id} "
        f"tenant={tenant_context.firm_id if tenant_context else 'unknown'}"
    )
    
    return document


async def validate_document_ownership(
    document_id: str,
    current_user: dict,
    tenant_context: Optional[Any],
    db: AsyncIOMotorDatabase,
    collection_name: str = "documents",
    ownership_field: str = "lawyer_id",
    tenant_field: str = "firm_id",
) -> None:
    """
    Validate document ownership and tenant without returning the document.
    
    Useful for PATCH/DELETE operations where you want to validate before modifying.
    
    Raises:
        HTTPException(400): Invalid ObjectId format
        HTTPException(403): Ownership or tenant validation failed
        HTTPException(404): Document not found
    """
    
    # This internally uses get_secure_document, which does all validation
    await get_secure_document(
        document_id=document_id,
        current_user=current_user,
        tenant_context=tenant_context,
        db=db,
        collection_name=collection_name,
        ownership_field=ownership_field,
        tenant_field=tenant_field,
    )


def validate_lawyer_id_ownership(
    lawyer_id: str,
    current_user: dict,
    tenant_context: Optional[Any],
) -> None:
    """
    Validate that requested lawyer_id matches current_user.
    
    Used for endpoints like GET /documents/?lawyer_id=X where lawyer_id
    is a query parameter that should match the authenticated user.
    
    Args:
        lawyer_id: The lawyer_id from URL/query params
        current_user: User dict from get_current_user()
        tenant_context: TenantContext (optional, for logging)
    
    Raises:
        HTTPException(403): Ownership validation failed
    """
    
    user_id = current_user.get("_id")
    
    if lawyer_id != user_id:
        logger.warning(
            f"[DOCUMENT_ACCESS] Lawyer ID ownership violation: "
            f"requested={lawyer_id} "
            f"current_user={user_id} "
            f"tenant={tenant_context.firm_id if tenant_context else 'unknown'}"
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: lawyer_id mismatch"
        )
    
    logger.info(
        f"[DOCUMENT_ACCESS] Lawyer ID ownership validated: "
        f"lawyer_id={lawyer_id} "
        f"user={user_id}"
    )


def validate_document_payload_ownership(
    payload_lawyer_id: str,
    current_user: dict,
    tenant_context: Optional[Any],
) -> None:
    """
    Validate that document creation payload's lawyer_id matches current_user.
    
    Used for POST /documents/ and POST /documents/upload where the payload
    contains a lawyer_id field that must match the authenticated user.
    
    Raises:
        HTTPException(403): Ownership validation failed
    """
    
    user_id = current_user.get("_id")
    
    if payload_lawyer_id != user_id:
        logger.warning(
            f"[DOCUMENT_ACCESS] Payload lawyer_id ownership violation: "
            f"payload_lawyer_id={payload_lawyer_id} "
            f"current_user={user_id} "
            f"tenant={tenant_context.firm_id if tenant_context else 'unknown'}"
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: cannot create document for another user"
        )
    
    logger.info(
        f"[DOCUMENT_ACCESS] Payload lawyer_id ownership validated: "
        f"payload_lawyer_id={payload_lawyer_id} "
        f"user={user_id}"
    )
