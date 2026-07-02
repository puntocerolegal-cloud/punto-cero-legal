"""
Enterprise Base Repository
Abstract CRUD operations with multi-tenant isolation and audit support
"""

from abc import ABC, abstractmethod
from typing import Optional, List, Dict, Any, TypeVar, Generic
from motor.motor_asyncio import AsyncIOMotorCollection
from bson import ObjectId
import logging

logger = logging.getLogger(__name__)

T = TypeVar('T')  # Generic type for model


class BaseRepository(ABC, Generic[T]):
    """
    Abstract base repository for all models.
    Enforces multi-tenant isolation via firm_id filtering.
    Provides common CRUD operations.
    """

    def __init__(self, collection: AsyncIOMotorCollection, model_class: type):
        self.collection = collection
        self.model_class = model_class

    # ========================================================================
    # CREATE OPERATIONS
    # ========================================================================

    async def create(
        self,
        firm_id: str,
        data: Dict[str, Any],
        request_id: str
    ) -> Dict[str, Any]:
        """
        Create new document with firm_id isolation.
        
        Args:
            firm_id: Multi-tenant isolation
            data: Document data
            request_id: For audit trail
            
        Returns:
            Created document with _id
        """
        # Ensure firm_id is set
        data["firm_id"] = firm_id
        
        try:
            result = await self.collection.insert_one(data)
            
            logger.info(
                f"[{self.collection.name}] CREATE firm_id={firm_id} "
                f"id={result.inserted_id} request_id={request_id}"
            )
            
            # Return created document
            return await self.find_by_id(firm_id, str(result.inserted_id), request_id)
        except Exception as e:
            logger.error(f"[{self.collection.name}] CREATE error: {str(e)}")
            raise

    # ========================================================================
    # READ OPERATIONS
    # ========================================================================

    async def find_by_id(
        self,
        firm_id: str,
        resource_id: str,
        request_id: str
    ) -> Optional[Dict[str, Any]]:
        """
        Find single document by ID with firm_id isolation.
        
        Args:
            firm_id: Multi-tenant isolation
            resource_id: Document ID (as string)
            request_id: For audit trail
            
        Returns:
            Document or None
        """
        try:
            # Ensure firm_id match
            query = {
                "_id": ObjectId(resource_id) if self._is_valid_object_id(resource_id) else resource_id,
                "firm_id": firm_id
            }
            
            doc = await self.collection.find_one(query)
            
            if doc:
                logger.debug(
                    f"[{self.collection.name}] FIND_BY_ID firm_id={firm_id} "
                    f"id={resource_id} found request_id={request_id}"
                )
            else:
                logger.debug(
                    f"[{self.collection.name}] FIND_BY_ID firm_id={firm_id} "
                    f"id={resource_id} not_found request_id={request_id}"
                )
            
            return doc
        except Exception as e:
            logger.error(f"[{self.collection.name}] FIND_BY_ID error: {str(e)}")
            raise

    async def find_many(
        self,
        firm_id: str,
        query: Dict[str, Any],
        skip: int = 0,
        limit: int = 100,
        sort: Optional[List[tuple]] = None,
        request_id: str = None
    ) -> tuple[List[Dict[str, Any]], int]:
        """
        Find multiple documents with firm_id isolation and pagination.
        
        Args:
            firm_id: Multi-tenant isolation
            query: MongoDB query filter
            skip: Pagination skip
            limit: Pagination limit
            sort: Sort specification [(field, direction), ...]
            request_id: For audit trail
            
        Returns:
            Tuple of (documents, total_count)
        """
        try:
            # Inject firm_id filter
            query["firm_id"] = firm_id
            
            # Get total count (without pagination)
            total = await self.collection.count_documents(query)
            
            # Find with pagination and sorting
            cursor = self.collection.find(query).skip(skip).limit(limit)
            
            if sort:
                cursor = cursor.sort(sort)
            
            docs = await cursor.to_list(length=limit)
            
            logger.debug(
                f"[{self.collection.name}] FIND_MANY firm_id={firm_id} "
                f"skip={skip} limit={limit} found={len(docs)} total={total} "
                f"request_id={request_id}"
            )
            
            return docs, total
        except Exception as e:
            logger.error(f"[{self.collection.name}] FIND_MANY error: {str(e)}")
            raise

    # ========================================================================
    # UPDATE OPERATIONS
    # ========================================================================

    async def update(
        self,
        firm_id: str,
        resource_id: str,
        update_data: Dict[str, Any],
        request_id: str
    ) -> Dict[str, Any]:
        """
        Update document with firm_id isolation.
        
        Args:
            firm_id: Multi-tenant isolation
            resource_id: Document ID
            update_data: Fields to update
            request_id: For audit trail
            
        Returns:
            Updated document
        """
        try:
            query = {
                "_id": ObjectId(resource_id) if self._is_valid_object_id(resource_id) else resource_id,
                "firm_id": firm_id
            }
            
            result = await self.collection.update_one(
                query,
                {"$set": update_data}
            )
            
            if result.matched_count == 0:
                logger.warning(
                    f"[{self.collection.name}] UPDATE firm_id={firm_id} "
                    f"id={resource_id} not_found request_id={request_id}"
                )
                return None
            
            logger.info(
                f"[{self.collection.name}] UPDATE firm_id={firm_id} "
                f"id={resource_id} modified={result.modified_count} "
                f"request_id={request_id}"
            )
            
            # Return updated document
            return await self.find_by_id(firm_id, resource_id, request_id)
        except Exception as e:
            logger.error(f"[{self.collection.name}] UPDATE error: {str(e)}")
            raise

    # ========================================================================
    # DELETE OPERATIONS
    # ========================================================================

    async def soft_delete(
        self,
        firm_id: str,
        resource_id: str,
        request_id: str
    ) -> bool:
        """
        Soft delete document (set deleted_at timestamp).
        
        Args:
            firm_id: Multi-tenant isolation
            resource_id: Document ID
            request_id: For audit trail
            
        Returns:
            Success boolean
        """
        try:
            from datetime import datetime
            
            query = {
                "_id": ObjectId(resource_id) if self._is_valid_object_id(resource_id) else resource_id,
                "firm_id": firm_id
            }
            
            result = await self.collection.update_one(
                query,
                {"$set": {"deleted_at": datetime.utcnow()}}
            )
            
            logger.info(
                f"[{self.collection.name}] SOFT_DELETE firm_id={firm_id} "
                f"id={resource_id} modified={result.modified_count} "
                f"request_id={request_id}"
            )
            
            return result.matched_count > 0
        except Exception as e:
            logger.error(f"[{self.collection.name}] SOFT_DELETE error: {str(e)}")
            raise

    async def hard_delete(
        self,
        firm_id: str,
        resource_id: str,
        request_id: str
    ) -> bool:
        """
        Hard delete document (permanent removal).
        Only use for testing or explicitly required scenarios.
        
        Args:
            firm_id: Multi-tenant isolation
            resource_id: Document ID
            request_id: For audit trail
            
        Returns:
            Success boolean
        """
        try:
            query = {
                "_id": ObjectId(resource_id) if self._is_valid_object_id(resource_id) else resource_id,
                "firm_id": firm_id
            }
            
            result = await self.collection.delete_one(query)
            
            logger.warning(
                f"[{self.collection.name}] HARD_DELETE firm_id={firm_id} "
                f"id={resource_id} deleted={result.deleted_count} "
                f"request_id={request_id}"
            )
            
            return result.deleted_count > 0
        except Exception as e:
            logger.error(f"[{self.collection.name}] HARD_DELETE error: {str(e)}")
            raise

    # ========================================================================
    # UTILITY METHODS
    # ========================================================================

    @staticmethod
    def _is_valid_object_id(value: str) -> bool:
        """Check if string is valid MongoDB ObjectId"""
        try:
            ObjectId.from_string(value)
            return True
        except:
            return False

    async def create_index(
        self,
        index_spec: List[tuple],
        **kwargs
    ) -> str:
        """
        Create database index.
        
        Args:
            index_spec: [(field, direction), ...]
            **kwargs: Additional options (unique=True, etc.)
            
        Returns:
            Index name
        """
        try:
            index_name = await self.collection.create_index(index_spec, **kwargs)
            logger.info(f"[{self.collection.name}] INDEX_CREATED {index_name}")
            return index_name
        except Exception as e:
            logger.error(f"[{self.collection.name}] INDEX_CREATE error: {str(e)}")
            raise

    async def count_by_firm(self, firm_id: str) -> int:
        """Count total documents for a firm"""
        try:
            count = await self.collection.count_documents({"firm_id": firm_id})
            return count
        except Exception as e:
            logger.error(f"[{self.collection.name}] COUNT_BY_FIRM error: {str(e)}")
            raise
