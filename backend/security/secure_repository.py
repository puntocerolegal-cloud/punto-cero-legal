"""
Secure Repository — MongoDB Access Wrapper
═══════════════════════════════════════════════════════════════════

Purpose:
  SINGLE POINT OF ENTRY for all MongoDB access.
  
  Enforces:
  - Authorization check before query
  - Audit logging
  - Tenant isolation
  - ObjectId safety
  
Rules:
  ❌ NEVER call: db.collection.find_one()
  ✔ ALWAYS call: secure_repo.find_one()
  
  This ensures authorization is NEVER bypassed.
"""

from typing import Dict, List, Any, Optional
from fastapi import HTTPException, status
from bson import ObjectId
from bson.errors import InvalidId
from motor.motor_asyncio import AsyncIOMotorDatabase, AsyncIOMotorCollection
import logging

from security.security_engine import authorize
from security.audit_logger import log_access_denied

logger = logging.getLogger(__name__)


class SecureRepository:
    """
    Secure wrapper around MongoDB collections.

    Enforces authorization and audit logging on every operation.

    ONLY valid way to access MongoDB in the system.
    All other access paths are blocked by GuardedDB hard barrier.
    """

    def __init__(self, db):
        # db can be either real AsyncIOMotorDatabase or GuardedDB
        # GuardedDB will be unwrapped to real collection below
        self.db = db
        self._is_guarded_db = hasattr(db, '_get_real_collection')
    
    def _get_real_collection(self, collection_name: str):
        """Get real collection, bypassing GuardedDB if needed."""
        if self._is_guarded_db:
            return self.db._get_real_collection(collection_name)
        return self.db[collection_name]

    async def find_one(
        self,
        collection_name: str,
        query: Dict[str, Any],
        user: Dict[str, Any],
        resource_type: str,
        action: str = "read",
        db: Optional[AsyncIOMotorDatabase] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Safely find a single document with authorization check.

        Args:
            collection_name: "cases", "documents", etc.
            query: MongoDB query dict
            user: Current user (from get_current_user)
            resource_type: "case", "document", etc. (for policy)
            action: "read", "write", etc. (for policy)
            db: Optional separate db for audit logging

        Returns:
            Document dict if found and authorized, None if not found

        Raises:
            HTTPException(403) if not authorized
            HTTPException(400) if invalid ObjectId
        """

        # Step 1: Parse ObjectId if in query
        try:
            if "_id" in query and isinstance(query["_id"], str):
                query["_id"] = ObjectId(query["_id"])
        except InvalidId:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid document ID format"
            )

        # Step 2: Fetch document (bypass GuardedDB with authorization check done below)
        collection = self._get_real_collection(collection_name)
        document = await collection.find_one(query)
        
        if not document:
            return None
        
        # Step 3: Authorize access
        await authorize(
            user=user,
            resource_type=resource_type,
            action=action,
            resource=document,
            db=db,
        )
        
        return document
    
    async def find_many(
        self,
        collection_name: str,
        query: Dict[str, Any],
        user: Dict[str, Any],
        resource_type: str,
        action: str = "read",
        db: Optional[AsyncIOMotorDatabase] = None,
    ) -> List[Dict[str, Any]]:
        """
        Safely find multiple documents with authorization.

        Note: For list operations, authorization is typically at the
        query-level (filtering by organization/owner), not per-document.

        Args:
            collection_name: Collection name
            query: MongoDB query
            user: Current user
            resource_type: Resource type for policy
            action: Action type for policy
            db: Optional db for audit logging

        Returns:
            List of authorized documents
        """

        # For list operations, add tenant filter automatically
        if "organization_id" not in query:
            query["organization_id"] = user.get("organization_id")

        # Verify authorization for list action
        await authorize(
            user=user,
            resource_type=resource_type,
            action=action,
        )

        collection = self._get_real_collection(collection_name)
        cursor = collection.find(query)
        documents = await cursor.to_list(1000)
        
        return documents
    
    async def insert_one(
        self,
        collection_name: str,
        document: Dict[str, Any],
        user: Dict[str, Any],
        resource_type: str,
        db: Optional[AsyncIOMotorDatabase] = None,
    ) -> str:
        """
        Safely insert a document with authorization check.

        Args:
            collection_name: Collection name
            document: Document to insert
            user: Current user
            resource_type: Resource type (for policy)
            db: Optional db for audit logging

        Returns:
            Inserted document ID (as string)

        Raises:
            HTTPException(403) if not authorized to create
        """

        # Authorize creation
        await authorize(
            user=user,
            resource_type=resource_type,
            action="create",
            db=db,
        )

        # Ensure organization_id is set
        if "organization_id" not in document:
            document["organization_id"] = user.get("organization_id")

        # Ensure owner is set (if applicable)
        if "lawyer_id" not in document and "owner_id" not in document:
            document["lawyer_id"] = user.get("_id")

        collection = self._get_real_collection(collection_name)
        result = await collection.insert_one(document)
        
        return str(result.inserted_id)
    
    async def update_one(
        self,
        collection_name: str,
        query: Dict[str, Any],
        update: Dict[str, Any],
        user: Dict[str, Any],
        resource_type: str,
        db: Optional[AsyncIOMotorDatabase] = None,
    ) -> int:
        """
        Safely update a document with authorization check.

        Args:
            collection_name: Collection name
            query: Query to find document
            update: Update dict (e.g., {"$set": {...}})
            user: Current user
            resource_type: Resource type
            db: Optional db for audit logging

        Returns:
            Number of documents matched

        Raises:
            HTTPException(403) if not authorized
            HTTPException(404) if document not found
        """

        # Step 1: Fetch document to check authorization
        document = await self.find_one(
            collection_name=collection_name,
            query=query,
            user=user,
            resource_type=resource_type,
            action="write",
            db=db,
        )

        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )

        # Step 2: Perform update
        collection = self._get_real_collection(collection_name)
        result = await collection.update_one(query, update)
        
        return result.matched_count
    
    async def delete_one(
        self,
        collection_name: str,
        query: Dict[str, Any],
        user: Dict[str, Any],
        resource_type: str,
        db: Optional[AsyncIOMotorDatabase] = None,
    ) -> int:
        """
        Safely delete a document with authorization check.

        Args:
            collection_name: Collection name
            query: Query to find document
            user: Current user
            resource_type: Resource type
            db: Optional db for audit logging

        Returns:
            Number of documents deleted

        Raises:
            HTTPException(403) if not authorized
            HTTPException(404) if document not found
        """

        # Step 1: Fetch document to check authorization
        document = await self.find_one(
            collection_name=collection_name,
            query=query,
            user=user,
            resource_type=resource_type,
            action="delete",
            db=db,
        )

        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )

        # Step 2: Perform deletion
        collection = self._get_real_collection(collection_name)
        result = await collection.delete_one(query)
        
        return result.deleted_count


def get_secure_repository(db: AsyncIOMotorDatabase) -> SecureRepository:
    """Factory function to create a secure repository."""
    return SecureRepository(db)
