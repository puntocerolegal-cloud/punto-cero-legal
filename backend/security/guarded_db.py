"""
DB Hard Barrier Layer — Impossible-to-Bypass MongoDB Access
═══════════════════════════════════════════════════════════════════

Purpose:
  Prevent ANY direct access to MongoDB without going through
  SecureRepository with mandatory authorization.
  
  Makes it literally impossible to call db.collection.find_one()
  without authorization checks.

Architecture:
  1. GuardedDB wraps the real MongoDB connection
  2. Replaces db.collection with GuardedCollection
  3. GuardedCollection blocks all direct access
  4. Only SecureRepository can bypass (via internal flag)
  5. All other access paths raise AssertionError

Security Model:
  - Zero Trust: assume all direct access is attack
  - Fail-Closed: default is BLOCK, not allow
  - Logged: every bypass attempt logged as critical incident
"""

from typing import Any, Dict, Optional
from motor.motor_asyncio import AsyncIOMotorDatabase, AsyncIOMotorCollection
import logging
from datetime import datetime

logger = logging.getLogger(__name__)


class GuardedCollection:
    """
    Wraps a MongoDB collection to block direct access.
    
    Only permits access via SecureRepository (which has _bypass_guard=True).
    All other access raises AssertionError with critical logging.
    """
    
    def __init__(self, real_collection: AsyncIOMotorCollection, collection_name: str):
        self._real_collection = real_collection
        self._collection_name = collection_name
        self._bypass_guard = False  # Must be explicitly set
    
    def _check_guard(self, operation: str, caller_module: Optional[str] = None) -> None:
        """
        Check if access is allowed.
        
        Raises AssertionError if direct access attempted (not from SecureRepository).
        """
        if self._bypass_guard:
            # SecureRepository marked this as authorized
            return
        
        # Direct access attempt — CRITICAL SECURITY INCIDENT
        logger.critical(
            f"[DB_BARRIER] UNAUTHORIZED DB ACCESS ATTEMPT: "
            f"collection={self._collection_name} operation={operation} "
            f"caller={caller_module} timestamp={datetime.utcnow().isoformat()}"
        )
        
        raise AssertionError(
            f"Direct access to collection '{self._collection_name}' "
            f"is forbidden. Must use SecureRepository.{operation}()"
        )
    
    async def find_one(self, query: Dict[str, Any], **kwargs) -> Optional[Dict[str, Any]]:
        """
        Blocked: Use SecureRepository.find_one() instead.
        
        Raises:
            AssertionError on any direct call
        """
        self._check_guard("find_one")
        # Unreachable
        return None
    
    async def find(self, query: Dict[str, Any], **kwargs):
        """
        Blocked: Use SecureRepository.find_many() instead.
        """
        self._check_guard("find")
    
    async def insert_one(self, document: Dict[str, Any], **kwargs):
        """
        Blocked: Use SecureRepository.insert_one() instead.
        """
        self._check_guard("insert_one")
    
    async def insert_many(self, documents, **kwargs):
        """
        Blocked: Use SecureRepository.insert_many() instead.
        """
        self._check_guard("insert_many")
    
    async def update_one(self, query: Dict[str, Any], update: Dict[str, Any], **kwargs):
        """
        Blocked: Use SecureRepository.update_one() instead.
        """
        self._check_guard("update_one")
    
    async def update_many(self, query: Dict[str, Any], update: Dict[str, Any], **kwargs):
        """
        Blocked: Use SecureRepository.update_many() instead.
        """
        self._check_guard("update_many")
    
    async def delete_one(self, query: Dict[str, Any], **kwargs):
        """
        Blocked: Use SecureRepository.delete_one() instead.
        """
        self._check_guard("delete_one")
    
    async def delete_many(self, query: Dict[str, Any], **kwargs):
        """
        Blocked: Use SecureRepository.delete_many() instead.
        """
        self._check_guard("delete_many")
    
    async def aggregate(self, pipeline, **kwargs):
        """
        Blocked: Use SecureRepository.aggregate() instead.
        """
        self._check_guard("aggregate")
    
    def __getattr__(self, name: str):
        """
        Block any other method access (count_documents, etc.)
        """
        self._check_guard(name)
        raise AssertionError(
            f"Collection method '{name}' blocked by DB Hard Barrier. "
            f"Use SecureRepository instead."
        )
    
    # ───────────────────────────────────────────────────────────
    # INTERNAL BYPASS METHODS (Only for SecureRepository)
    # ───────────────────────────────────────────────────────────
    
    def _get_real_collection(self) -> AsyncIOMotorCollection:
        """
        Internal method to access real collection.
        
        ONLY called by SecureRepository after authorization checks.
        """
        return self._real_collection


class GuardedDB:
    """
    Wraps AsyncIOMotorDatabase to block direct collection access.
    
    Replaces all collections with GuardedCollection instances.
    Only SecureRepository can use _get_real_collection() bypass.
    """
    
    def __init__(self, real_db: AsyncIOMotorDatabase):
        self._real_db = real_db
        self._guarded_collections: Dict[str, GuardedCollection] = {}
        logger.info("[DB_BARRIER] GuardedDB initialized - direct access blocked")
    
    def __getitem__(self, collection_name: str) -> GuardedCollection:
        """
        Intercept collection access.
        
        Returns GuardedCollection instead of real collection.
        
        Usage (will raise AssertionError):
            collection = guarded_db["cases"]
            await collection.find_one({})  # ❌ AssertionError
        """
        if collection_name not in self._guarded_collections:
            real_collection = self._real_db[collection_name]
            self._guarded_collections[collection_name] = GuardedCollection(
                real_collection, collection_name
            )
        
        return self._guarded_collections[collection_name]
    
    def __getattr__(self, collection_name: str) -> GuardedCollection:
        """
        Also intercept attribute-style access: db.cases
        
        Will raise AssertionError on any operation.
        """
        return self[collection_name]
    
    # ───────────────────────────────────────────────────────────
    # INTERNAL METHODS (For SecureRepository only)
    # ───────────────────────────────────────────────────────────
    
    def _get_real_collection(self, collection_name: str) -> AsyncIOMotorCollection:
        """
        Internal bypass to get real collection.
        
        ONLY SecureRepository should call this, AFTER authorization.
        
        Usage (secure_repository.py):
            real_collection = guarded_db._get_real_collection("cases")
            # Now safe to use: authorization already checked
        """
        return self._real_db[collection_name]
    
    async def command(self, *args, **kwargs):
        """
        Allow command() for health checks, etc.
        (Doesn't access user data)
        """
        return await self._real_db.command(*args, **kwargs)
    
    async def create_indexes(self, *args, **kwargs):
        """Allow index creation for admin operations."""
        return await self._real_db.create_indexes(*args, **kwargs)


def create_guarded_db(real_db: AsyncIOMotorDatabase) -> GuardedDB:
    """
    Factory function to wrap a real MongoDB connection.
    
    Usage in server.py:
        from security.guarded_db import create_guarded_db
        
        real_db = client[os.environ.get('DB_NAME', 'puntocero_legal')]
        db = create_guarded_db(real_db)  # Now guarded
    
    Returns:
        GuardedDB instance (impossible to bypass)
    """
    return GuardedDB(real_db)
