"""
Case Document Repository
CRUD operations for case documents with multi-tenant isolation and version control

Follows Golden Repository Template v1.0 specification.
Provides document management with:
- Multi-tenant isolation via firm_id
- Audit trail with request_id
- Document versioning and access control
- Comprehensive error handling
- Document lifecycle management
- Reporting and aggregation support
"""

from typing import Dict, List, Any, Optional
from motor.motor_asyncio import AsyncIOMotorCollection
from bson import ObjectId
from datetime import datetime, timedelta
import logging

from repositories.enterprise_base_repository import BaseRepository
from middleware.tenant_isolation import TenantAwareQuery

logger = logging.getLogger(__name__)


class CaseDocumentRepository(BaseRepository):
    """
    Repository for case document operations.
    
    Manages all document-related CRUD operations with strict multi-tenant
    isolation via firm_id. Documents represent evidence, contracts, court
    filings, and other materials associated with a legal case, with support
    for versioning, access control, and signing workflows.
    
    Key responsibilities:
    - Maintain document library for cases
    - Support document queries by case, type, category, date range
    - Maintain document versions with change tracking
    - Manage access control per document
    - Ensure firm_id filtering on all queries
    - Provide document metrics and reporting
    - Support document signing and verification workflows
    
    Methods:
    - Base CRUD: create, find_by_id, update, soft_delete, hard_delete (inherited from BaseRepository)
    - Specialized Queries: find_by_case, find_by_document_type, find_by_category, find_uploaded_by,
                          find_by_date_range, find_recent, list_paginated, search
    - Domain Operations: upload_document, replace_document, archive_document, restore_document,
                        link_to_case, unlink_from_case, mark_signed, mark_verified, download_metadata
    - Reporting: statistics, storage_summary, document_metrics
    - Validation: validate_document, validate_file
    """

    def __init__(self, collection: AsyncIOMotorCollection):
        """
        Initialize CaseDocumentRepository.
        
        Args:
            collection: Motor async collection for case documents
        """
        super().__init__(collection, dict)
        self.collection = collection
        
        logger.info(
            f"[case_documents] CaseDocumentRepository initialized "
            f"collection={collection.full_name}"
        )

    # ════════════════════════════════════════════════════════════════════════════════
    # REPOSITORY INITIALIZATION & INDEXES
    # ════════════════════════════════════════════════════════════════════════════════

    async def ensure_indexes(self) -> None:
        """
        Create all required indexes for case_documents collection.
        
        Follows Golden Repository Template v1.0:
        - First field: firm_id (multi-tenant isolation)
        - Compound indexes for common query patterns
        - Sparse indexes for optional fields
        
        Indexes are created asynchronously without blocking.
        Safe to call multiple times (idempotent).
        
        Raises:
            Exception: If index creation fails
        """
        try:
            logger.info("[case_documents] Starting index creation...")

            indexes = [
                {
                    "name": "firm_case",
                    "spec": [("firm_id", 1), ("case_id", 1)],
                    "kwargs": {"background": True}
                },
                {
                    "name": "firm_case_created",
                    "spec": [("firm_id", 1), ("case_id", 1), ("created_at", -1)],
                    "kwargs": {"background": True}
                },
                {
                    "name": "firm_document_type",
                    "spec": [("firm_id", 1), ("document_type", 1)],
                    "kwargs": {"background": True}
                },
                {
                    "name": "firm_status",
                    "spec": [("firm_id", 1), ("status", 1)],
                    "kwargs": {"background": True}
                },
                {
                    "name": "firm_uploaded_by",
                    "spec": [("firm_id", 1), ("owner_id", 1)],
                    "kwargs": {"background": True}
                },
                {
                    "name": "firm_created",
                    "spec": [("firm_id", 1), ("created_at", -1)],
                    "kwargs": {"background": True}
                },
                {
                    "name": "firm_deleted",
                    "spec": [("firm_id", 1), ("deleted_at", 1)],
                    "kwargs": {"background": True, "sparse": True}
                },
                {
                    "name": "firm_confidential",
                    "spec": [("firm_id", 1), ("is_confidential", 1)],
                    "kwargs": {"background": True}
                },
            ]

            for index in indexes:
                try:
                    index_name = await self.collection.create_index(
                        index["spec"],
                        name=index["name"],
                        **index["kwargs"]
                    )
                    logger.info(f"[case_documents] Index created: {index_name}")
                except Exception as e:
                    logger.warning(f"[case_documents] Index creation warning for {index['name']}: {str(e)}")

            logger.info("[case_documents] Index creation completed")
        except Exception as e:
            logger.error(f"[case_documents] ensure_indexes failed: {str(e)}")
            raise

    @staticmethod
    def init() -> None:
        """Initialize repository (no-op for compatibility)"""
        pass

    # ════════════════════════════════════════════════════════════════════════════════
    # SPECIALIZED QUERIES
    # ════════════════════════════════════════════════════════════════════════════════

    async def find_by_case(
        self,
        firm_id: str,
        case_id: str,
        request_id: str,
        skip: int = 0,
        limit: int = 100
    ) -> tuple[List[Dict[str, Any]], int]:
        """
        Find all documents for a case.
        
        Args:
            firm_id: Multi-tenant isolation
            case_id: Case ID
            request_id: For audit trail
            skip: Pagination skip
            limit: Pagination limit
            
        Returns:
            Tuple of (documents, total_count)
        """
        try:
            query = TenantAwareQuery.add_firm_filter(
                {"case_id": case_id, "deleted_at": None},
                firm_id
            )
            
            start_time = datetime.utcnow()
            
            total = await self.collection.count_documents(query)
            cursor = self.collection.find(query).skip(skip).limit(limit).sort("created_at", -1)
            docs = await cursor.to_list(length=limit)
            
            elapsed = (datetime.utcnow() - start_time).total_seconds()
            
            logger.info(
                f"[case_documents] FIND_BY_CASE firm_id={firm_id} case_id={case_id} "
                f"returned={len(docs)} total={total} elapsed={elapsed:.3f}s request_id={request_id}"
            )
            
            return docs, total
        except Exception as e:
            logger.error(f"[case_documents] FIND_BY_CASE error: {str(e)}")
            raise

    async def find_by_document_type(
        self,
        firm_id: str,
        document_type: str,
        request_id: str,
        skip: int = 0,
        limit: int = 100
    ) -> tuple[List[Dict[str, Any]], int]:
        """
        Find all documents of a specific type within firm.
        
        Args:
            firm_id: Multi-tenant isolation
            document_type: Type of document (brief, motion, contract, etc)
            request_id: For audit trail
            skip: Pagination skip
            limit: Pagination limit
            
        Returns:
            Tuple of (documents, total_count)
        """
        try:
            query = TenantAwareQuery.add_firm_filter(
                {"document_type": document_type, "deleted_at": None},
                firm_id
            )
            
            start_time = datetime.utcnow()
            
            total = await self.collection.count_documents(query)
            cursor = self.collection.find(query).skip(skip).limit(limit).sort("created_at", -1)
            docs = await cursor.to_list(length=limit)
            
            elapsed = (datetime.utcnow() - start_time).total_seconds()
            
            logger.info(
                f"[case_documents] FIND_BY_DOCUMENT_TYPE firm_id={firm_id} type={document_type} "
                f"returned={len(docs)} total={total} elapsed={elapsed:.3f}s request_id={request_id}"
            )
            
            return docs, total
        except Exception as e:
            logger.error(f"[case_documents] FIND_BY_DOCUMENT_TYPE error: {str(e)}")
            raise

    async def find_by_category(
        self,
        firm_id: str,
        category: str,
        request_id: str,
        skip: int = 0,
        limit: int = 100
    ) -> tuple[List[Dict[str, Any]], int]:
        """
        Find documents in a category (tag-based filtering).
        
        Args:
            firm_id: Multi-tenant isolation
            category: Category/tag name
            request_id: For audit trail
            skip: Pagination skip
            limit: Pagination limit
            
        Returns:
            Tuple of (documents, total_count)
        """
        try:
            query = TenantAwareQuery.add_firm_filter(
                {"tags": category, "deleted_at": None},
                firm_id
            )
            
            start_time = datetime.utcnow()
            
            total = await self.collection.count_documents(query)
            cursor = self.collection.find(query).skip(skip).limit(limit).sort("created_at", -1)
            docs = await cursor.to_list(length=limit)
            
            elapsed = (datetime.utcnow() - start_time).total_seconds()
            
            logger.info(
                f"[case_documents] FIND_BY_CATEGORY firm_id={firm_id} category={category} "
                f"returned={len(docs)} total={total} elapsed={elapsed:.3f}s request_id={request_id}"
            )
            
            return docs, total
        except Exception as e:
            logger.error(f"[case_documents] FIND_BY_CATEGORY error: {str(e)}")
            raise

    async def find_uploaded_by(
        self,
        firm_id: str,
        user_id: str,
        request_id: str,
        skip: int = 0,
        limit: int = 100
    ) -> tuple[List[Dict[str, Any]], int]:
        """
        Find all documents uploaded by a specific user within firm.
        
        Args:
            firm_id: Multi-tenant isolation
            user_id: User ID (document owner)
            request_id: For audit trail
            skip: Pagination skip
            limit: Pagination limit
            
        Returns:
            Tuple of (documents, total_count)
        """
        try:
            query = TenantAwareQuery.add_firm_filter(
                {"owner_id": user_id, "deleted_at": None},
                firm_id
            )
            
            start_time = datetime.utcnow()
            
            total = await self.collection.count_documents(query)
            cursor = self.collection.find(query).skip(skip).limit(limit).sort("created_at", -1)
            docs = await cursor.to_list(length=limit)
            
            elapsed = (datetime.utcnow() - start_time).total_seconds()
            
            logger.info(
                f"[case_documents] FIND_UPLOADED_BY firm_id={firm_id} user_id={user_id} "
                f"returned={len(docs)} total={total} elapsed={elapsed:.3f}s request_id={request_id}"
            )
            
            return docs, total
        except Exception as e:
            logger.error(f"[case_documents] FIND_UPLOADED_BY error: {str(e)}")
            raise

    async def find_by_date_range(
        self,
        firm_id: str,
        start_date: datetime,
        end_date: datetime,
        request_id: str,
        skip: int = 0,
        limit: int = 100
    ) -> tuple[List[Dict[str, Any]], int]:
        """
        Find documents created within a date range within firm.
        
        Args:
            firm_id: Multi-tenant isolation
            start_date: Range start
            end_date: Range end
            request_id: For audit trail
            skip: Pagination skip
            limit: Pagination limit
            
        Returns:
            Tuple of (documents, total_count)
        """
        try:
            query = TenantAwareQuery.add_firm_filter(
                {
                    "created_at": {"$gte": start_date, "$lte": end_date},
                    "deleted_at": None
                },
                firm_id
            )
            
            start_time = datetime.utcnow()
            
            total = await self.collection.count_documents(query)
            cursor = self.collection.find(query).skip(skip).limit(limit).sort("created_at", -1)
            docs = await cursor.to_list(length=limit)
            
            elapsed = (datetime.utcnow() - start_time).total_seconds()
            
            logger.info(
                f"[case_documents] FIND_BY_DATE_RANGE firm_id={firm_id} start={start_date.date()} "
                f"end={end_date.date()} returned={len(docs)} total={total} "
                f"elapsed={elapsed:.3f}s request_id={request_id}"
            )
            
            return docs, total
        except Exception as e:
            logger.error(f"[case_documents] FIND_BY_DATE_RANGE error: {str(e)}")
            raise

    async def find_recent(
        self,
        firm_id: str,
        request_id: str,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Find most recent documents across all cases in firm.
        
        Args:
            firm_id: Multi-tenant isolation
            request_id: For audit trail
            limit: Number of recent documents to return
            
        Returns:
            List of recent documents
        """
        try:
            query = TenantAwareQuery.add_firm_filter({"deleted_at": None}, firm_id)
            
            start_time = datetime.utcnow()
            
            cursor = self.collection.find(query).sort("created_at", -1).limit(limit)
            docs = await cursor.to_list(length=limit)
            
            elapsed = (datetime.utcnow() - start_time).total_seconds()
            
            logger.info(
                f"[case_documents] FIND_RECENT firm_id={firm_id} limit={limit} "
                f"returned={len(docs)} elapsed={elapsed:.3f}s request_id={request_id}"
            )
            
            return docs
        except Exception as e:
            logger.error(f"[case_documents] FIND_RECENT error: {str(e)}")
            raise

    async def list_paginated(
        self,
        firm_id: str,
        skip: int = 0,
        limit: int = 50,
        case_id: Optional[str] = None,
        document_type: Optional[str] = None,
        status: Optional[str] = None,
        confidential_only: bool = False,
        request_id: str = None
    ) -> tuple[List[Dict[str, Any]], int]:
        """
        List documents with pagination and optional filters.
        
        Args:
            firm_id: Multi-tenant isolation
            skip: Pagination skip
            limit: Pagination limit (max 100)
            case_id: Filter by case
            document_type: Filter by type
            status: Filter by status
            confidential_only: Show only confidential documents
            request_id: For audit trail
            
        Returns:
            Tuple of (documents, total_count)
        """
        try:
            limit = min(limit, 100)
            
            query = TenantAwareQuery.add_firm_filter({"deleted_at": None}, firm_id)
            if case_id:
                query["case_id"] = case_id
            if document_type:
                query["document_type"] = document_type
            if status:
                query["status"] = status
            if confidential_only:
                query["is_confidential"] = True
            
            start_time = datetime.utcnow()
            
            total = await self.collection.count_documents(query)
            docs = await self.collection.find(query).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
            
            elapsed = (datetime.utcnow() - start_time).total_seconds()
            
            logger.info(
                f"[case_documents] LIST_PAGINATED firm_id={firm_id} skip={skip} limit={limit} "
                f"returned={len(docs)} total={total} elapsed={elapsed:.3f}s request_id={request_id}"
            )
            
            return docs, total
        except Exception as e:
            logger.error(f"[case_documents] LIST_PAGINATED error: {str(e)}")
            raise

    async def search(
        self,
        firm_id: str,
        search_term: str,
        request_id: str,
        skip: int = 0,
        limit: int = 50
    ) -> tuple[List[Dict[str, Any]], int]:
        """
        Search documents by title or content.
        
        Args:
            firm_id: Multi-tenant isolation
            search_term: Search text
            request_id: For audit trail
            skip: Pagination skip
            limit: Pagination limit
            
        Returns:
            Tuple of (documents, total_count)
        """
        try:
            query = TenantAwareQuery.add_firm_filter(
                {
                    "$or": [
                        {"title": {"$regex": search_term, "$options": "i"}},
                        {"content_text": {"$regex": search_term, "$options": "i"}},
                        {"tags": {"$in": [search_term]}}
                    ],
                    "deleted_at": None
                },
                firm_id
            )
            
            start_time = datetime.utcnow()
            
            total = await self.collection.count_documents(query)
            cursor = self.collection.find(query).skip(skip).limit(limit).sort("created_at", -1)
            docs = await cursor.to_list(length=limit)
            
            elapsed = (datetime.utcnow() - start_time).total_seconds()
            
            logger.info(
                f"[case_documents] SEARCH firm_id={firm_id} query='{search_term}' "
                f"returned={len(docs)} total={total} elapsed={elapsed:.3f}s request_id={request_id}"
            )
            
            return docs, total
        except Exception as e:
            logger.error(f"[case_documents] SEARCH error: {str(e)}")
            raise

    # ════════════════════════════════════════════════════════════════════════════════
    # DOMAIN OPERATIONS
    # ════════════════════════════════════════════════════════════════════════════════

    async def upload_document(
        self,
        firm_id: str,
        case_id: str,
        owner_id: str,
        title: str,
        document_type: str,
        file_url: str,
        file_size: int,
        mime_type: str,
        request_id: str,
        file_hash: Optional[str] = None,
        tags: Optional[List[str]] = None,
        is_confidential: bool = False,
        requires_signature: bool = False,
        expiration_date: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """
        Upload a new document to a case.
        
        Args:
            firm_id: Multi-tenant isolation
            case_id: Case ID
            owner_id: User uploading document
            title: Document title
            document_type: Type of document
            file_url: URL to file storage
            file_size: Size in bytes
            mime_type: MIME type
            request_id: For audit trail
            file_hash: SHA256 hash (optional)
            tags: Document tags/categories
            is_confidential: Confidentiality flag
            requires_signature: Requires signature flag
            expiration_date: Optional expiration date
            
        Returns:
            Created document
        """
        try:
            doc_data = {
                "firm_id": firm_id,
                "case_id": case_id,
                "owner_id": owner_id,
                "title": title,
                "document_type": document_type,
                "file_url": file_url,
                "file_size": file_size,
                "mime_type": mime_type,
                "file_hash": file_hash,
                "tags": tags or [],
                "is_confidential": is_confidential,
                "requires_signature": requires_signature,
                "expiration_date": expiration_date,
                "status": "draft",
                "version_number": 1,
                "versions": [{
                    "version": 1,
                    "file_url": file_url,
                    "file_size": file_size,
                    "created_at": datetime.utcnow(),
                    "created_by": owner_id,
                    "file_hash": file_hash,
                    "change_summary": "Initial upload"
                }],
                "access_list": {owner_id: "owner"},
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "created_by": owner_id,
                "updated_by": owner_id
            }
            
            start_time = datetime.utcnow()
            
            result = await self.collection.insert_one(doc_data)
            
            elapsed = (datetime.utcnow() - start_time).total_seconds()
            
            logger.info(
                f"[case_documents] UPLOAD_DOCUMENT firm_id={firm_id} case_id={case_id} "
                f"document_id={result.inserted_id} size={file_size} elapsed={elapsed:.3f}s "
                f"request_id={request_id}"
            )
            
            return await self.find_by_id(firm_id, str(result.inserted_id), request_id)
        except Exception as e:
            logger.error(f"[case_documents] UPLOAD_DOCUMENT error: {str(e)}")
            raise

    async def replace_document(
        self,
        firm_id: str,
        document_id: str,
        user_id: str,
        new_file_url: str,
        new_file_size: int,
        new_file_hash: Optional[str] = None,
        change_summary: Optional[str] = None,
        request_id: str = None
    ) -> Dict[str, Any]:
        """
        Replace document with new version (create new version entry).
        
        Args:
            firm_id: Multi-tenant isolation
            document_id: Document ID
            user_id: User replacing document
            new_file_url: New file URL
            new_file_size: New file size
            new_file_hash: New file hash
            change_summary: Summary of changes
            request_id: For audit trail
            
        Returns:
            Updated document with new version
        """
        try:
            start_time = datetime.utcnow()
            
            doc = await self.find_by_id(firm_id, document_id, request_id or "")
            if not doc:
                raise ValueError(f"Document not found: {document_id}")
            
            current_version = doc.get("version_number", 1)
            new_version_num = current_version + 1
            
            new_version = {
                "version": new_version_num,
                "file_url": new_file_url,
                "file_size": new_file_size,
                "created_at": datetime.utcnow(),
                "created_by": user_id,
                "file_hash": new_file_hash,
                "change_summary": change_summary or "Document replaced"
            }
            
            result = await self.update(
                firm_id=firm_id,
                resource_id=document_id,
                update_data={
                    "file_url": new_file_url,
                    "file_size": new_file_size,
                    "file_hash": new_file_hash,
                    "version_number": new_version_num,
                    "status": "review",
                    "$push": {"versions": new_version},
                    "updated_at": datetime.utcnow(),
                    "updated_by": user_id
                },
                request_id=request_id or ""
            )
            
            elapsed = (datetime.utcnow() - start_time).total_seconds()
            
            logger.info(
                f"[case_documents] REPLACE_DOCUMENT firm_id={firm_id} document_id={document_id} "
                f"version={new_version_num} elapsed={elapsed:.3f}s request_id={request_id}"
            )
            
            return result
        except Exception as e:
            logger.error(f"[case_documents] REPLACE_DOCUMENT error: {str(e)}")
            raise

    async def archive_document(
        self,
        firm_id: str,
        document_id: str,
        request_id: str
    ) -> Dict[str, Any]:
        """
        Archive a document (set status to archived).
        
        Args:
            firm_id: Multi-tenant isolation
            document_id: Document ID
            request_id: For audit trail
            
        Returns:
            Updated document
        """
        try:
            start_time = datetime.utcnow()
            
            result = await self.update(
                firm_id=firm_id,
                resource_id=document_id,
                update_data={"status": "archived", "updated_at": datetime.utcnow()},
                request_id=request_id
            )
            
            elapsed = (datetime.utcnow() - start_time).total_seconds()
            
            logger.info(
                f"[case_documents] ARCHIVE_DOCUMENT firm_id={firm_id} document_id={document_id} "
                f"elapsed={elapsed:.3f}s request_id={request_id}"
            )
            
            return result
        except Exception as e:
            logger.error(f"[case_documents] ARCHIVE_DOCUMENT error: {str(e)}")
            raise

    async def restore_document(
        self,
        firm_id: str,
        document_id: str,
        request_id: str
    ) -> Dict[str, Any]:
        """
        Restore an archived document (set status back to draft).
        
        Args:
            firm_id: Multi-tenant isolation
            document_id: Document ID
            request_id: For audit trail
            
        Returns:
            Updated document
        """
        try:
            start_time = datetime.utcnow()
            
            result = await self.update(
                firm_id=firm_id,
                resource_id=document_id,
                update_data={"status": "draft", "updated_at": datetime.utcnow()},
                request_id=request_id
            )
            
            elapsed = (datetime.utcnow() - start_time).total_seconds()
            
            logger.info(
                f"[case_documents] RESTORE_DOCUMENT firm_id={firm_id} document_id={document_id} "
                f"elapsed={elapsed:.3f}s request_id={request_id}"
            )
            
            return result
        except Exception as e:
            logger.error(f"[case_documents] RESTORE_DOCUMENT error: {str(e)}")
            raise

    async def link_to_case(
        self,
        firm_id: str,
        document_id: str,
        case_id: str,
        request_id: str
    ) -> Dict[str, Any]:
        """
        Link document to a case.
        
        Args:
            firm_id: Multi-tenant isolation
            document_id: Document ID
            case_id: Case ID to link to
            request_id: For audit trail
            
        Returns:
            Updated document
        """
        try:
            start_time = datetime.utcnow()
            
            result = await self.update(
                firm_id=firm_id,
                resource_id=document_id,
                update_data={"case_id": case_id, "updated_at": datetime.utcnow()},
                request_id=request_id
            )
            
            elapsed = (datetime.utcnow() - start_time).total_seconds()
            
            logger.info(
                f"[case_documents] LINK_TO_CASE firm_id={firm_id} document_id={document_id} "
                f"case_id={case_id} elapsed={elapsed:.3f}s request_id={request_id}"
            )
            
            return result
        except Exception as e:
            logger.error(f"[case_documents] LINK_TO_CASE error: {str(e)}")
            raise

    async def unlink_from_case(
        self,
        firm_id: str,
        document_id: str,
        request_id: str
    ) -> Dict[str, Any]:
        """
        Unlink document from case.
        
        Args:
            firm_id: Multi-tenant isolation
            document_id: Document ID
            request_id: For audit trail
            
        Returns:
            Updated document
        """
        try:
            start_time = datetime.utcnow()
            
            result = await self.update(
                firm_id=firm_id,
                resource_id=document_id,
                update_data={"case_id": None, "updated_at": datetime.utcnow()},
                request_id=request_id
            )
            
            elapsed = (datetime.utcnow() - start_time).total_seconds()
            
            logger.info(
                f"[case_documents] UNLINK_FROM_CASE firm_id={firm_id} document_id={document_id} "
                f"elapsed={elapsed:.3f}s request_id={request_id}"
            )
            
            return result
        except Exception as e:
            logger.error(f"[case_documents] UNLINK_FROM_CASE error: {str(e)}")
            raise

    async def mark_signed(
        self,
        firm_id: str,
        document_id: str,
        signer_id: str,
        request_id: str
    ) -> Dict[str, Any]:
        """
        Mark document as signed by a user.
        
        Args:
            firm_id: Multi-tenant isolation
            document_id: Document ID
            signer_id: User ID of signer
            request_id: For audit trail
            
        Returns:
            Updated document
        """
        try:
            query = TenantAwareQuery.add_firm_filter({"_id": document_id}, firm_id)
            
            start_time = datetime.utcnow()
            
            result = await self.collection.update_one(
                query,
                {
                    "$addToSet": {"signed_by": signer_id},
                    "$push": {"signed_at": datetime.utcnow()},
                    "$set": {
                        "status": "signed",
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            
            elapsed = (datetime.utcnow() - start_time).total_seconds()
            
            logger.info(
                f"[case_documents] MARK_SIGNED firm_id={firm_id} document_id={document_id} "
                f"signer_id={signer_id} elapsed={elapsed:.3f}s request_id={request_id}"
            )
            
            return await self.find_by_id(firm_id, document_id, request_id)
        except Exception as e:
            logger.error(f"[case_documents] MARK_SIGNED error: {str(e)}")
            raise

    async def mark_verified(
        self,
        firm_id: str,
        document_id: str,
        reviewer_id: str,
        request_id: str
    ) -> Dict[str, Any]:
        """
        Mark document as verified/approved.
        
        Args:
            firm_id: Multi-tenant isolation
            document_id: Document ID
            reviewer_id: User ID of reviewer
            request_id: For audit trail
            
        Returns:
            Updated document
        """
        try:
            start_time = datetime.utcnow()
            
            result = await self.update(
                firm_id=firm_id,
                resource_id=document_id,
                update_data={
                    "status": "approved",
                    "last_reviewed_by": reviewer_id,
                    "last_reviewed_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                },
                request_id=request_id
            )
            
            elapsed = (datetime.utcnow() - start_time).total_seconds()
            
            logger.info(
                f"[case_documents] MARK_VERIFIED firm_id={firm_id} document_id={document_id} "
                f"reviewer_id={reviewer_id} elapsed={elapsed:.3f}s request_id={request_id}"
            )
            
            return result
        except Exception as e:
            logger.error(f"[case_documents] MARK_VERIFIED error: {str(e)}")
            raise

    async def download_metadata(
        self,
        firm_id: str,
        document_id: str,
        request_id: str
    ) -> Dict[str, Any]:
        """
        Get document metadata for download (file URL, size, hash, etc).
        
        Args:
            firm_id: Multi-tenant isolation
            document_id: Document ID
            request_id: For audit trail
            
        Returns:
            Document metadata dictionary
        """
        try:
            start_time = datetime.utcnow()
            
            doc = await self.find_by_id(firm_id, document_id, request_id)
            
            elapsed = (datetime.utcnow() - start_time).total_seconds()
            
            if not doc:
                logger.warning(
                    f"[case_documents] DOWNLOAD_METADATA not found document_id={document_id} "
                    f"request_id={request_id}"
                )
                return {}
            
            metadata = {
                "document_id": str(doc.get("_id")),
                "title": doc.get("title"),
                "file_url": doc.get("file_url"),
                "file_size": doc.get("file_size"),
                "file_hash": doc.get("file_hash"),
                "mime_type": doc.get("mime_type"),
                "version_number": doc.get("version_number"),
                "status": doc.get("status"),
                "created_at": doc.get("created_at"),
                "updated_at": doc.get("updated_at")
            }
            
            logger.info(
                f"[case_documents] DOWNLOAD_METADATA firm_id={firm_id} document_id={document_id} "
                f"elapsed={elapsed:.3f}s request_id={request_id}"
            )
            
            return metadata
        except Exception as e:
            logger.error(f"[case_documents] DOWNLOAD_METADATA error: {str(e)}")
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
        Calculate document statistics for firm.
        
        Args:
            firm_id: Multi-tenant isolation
            request_id: For audit trail
            
        Returns:
            Statistics dictionary with document counts
        """
        try:
            start_time = datetime.utcnow()
            
            base_query = TenantAwareQuery.add_firm_filter({}, firm_id)
            
            total = await self.collection.count_documents(base_query)
            
            type_counts = {}
            doc_types = ["brief", "motion", "complaint", "resolution", "agreement", "contract", "evidence", "deposition", "court_order", "memo", "letter"]
            for dtype in doc_types:
                count = await self.collection.count_documents(
                    TenantAwareQuery.add_firm_filter({"document_type": dtype}, firm_id)
                )
                if count > 0:
                    type_counts[dtype] = count
            
            status_counts = {}
            statuses = ["draft", "review", "approved", "signed", "filed", "archived", "obsolete"]
            for status in statuses:
                count = await self.collection.count_documents(
                    TenantAwareQuery.add_firm_filter({"status": status}, firm_id)
                )
                if count > 0:
                    status_counts[status] = count
            
            confidential = await self.collection.count_documents(
                TenantAwareQuery.add_firm_filter({"is_confidential": True}, firm_id)
            )
            
            elapsed = (datetime.utcnow() - start_time).total_seconds()
            
            stats = {
                "total_documents": total,
                "by_type": type_counts,
                "by_status": status_counts,
                "confidential_count": confidential,
            }
            
            logger.info(
                f"[case_documents] STATISTICS firm_id={firm_id} total={total} "
                f"confidential={confidential} elapsed={elapsed:.3f}s request_id={request_id}"
            )
            
            return stats
        except Exception as e:
            logger.error(f"[case_documents] STATISTICS error: {str(e)}")
            raise

    async def storage_summary(
        self,
        firm_id: str,
        request_id: str
    ) -> Dict[str, Any]:
        """
        Get storage usage summary for firm.
        
        Args:
            firm_id: Multi-tenant isolation
            request_id: For audit trail
            
        Returns:
            Storage summary with total size, average, etc
        """
        try:
            start_time = datetime.utcnow()
            
            query = TenantAwareQuery.add_firm_filter({}, firm_id)
            docs = await self.collection.find(query).to_list(None)
            
            total_size = sum(doc.get("file_size", 0) for doc in docs)
            avg_size = total_size / len(docs) if docs else 0
            max_size = max((doc.get("file_size", 0) for doc in docs), default=0)
            
            elapsed = (datetime.utcnow() - start_time).total_seconds()
            
            summary = {
                "total_documents": len(docs),
                "total_storage_bytes": total_size,
                "average_document_size": round(avg_size, 0),
                "largest_document_size": max_size,
                "total_storage_mb": round(total_size / (1024 * 1024), 2),
            }
            
            logger.info(
                f"[case_documents] STORAGE_SUMMARY firm_id={firm_id} total_mb={summary['total_storage_mb']} "
                f"elapsed={elapsed:.3f}s request_id={request_id}"
            )
            
            return summary
        except Exception as e:
            logger.error(f"[case_documents] STORAGE_SUMMARY error: {str(e)}")
            raise

    async def document_metrics(
        self,
        firm_id: str,
        request_id: str
    ) -> Dict[str, Any]:
        """
        Get document metrics for firm (usage patterns, trends, etc).
        
        Args:
            firm_id: Multi-tenant isolation
            request_id: For audit trail
            
        Returns:
            Metrics dictionary
        """
        try:
            start_time = datetime.utcnow()
            
            query = TenantAwareQuery.add_firm_filter({}, firm_id)
            
            total = await self.collection.count_documents(query)
            
            signed_count = await self.collection.count_documents(
                TenantAwareQuery.add_firm_filter({"status": {"$in": ["signed", "filed"]}}, firm_id)
            )
            
            confidential_count = await self.collection.count_documents(
                TenantAwareQuery.add_firm_filter({"is_confidential": True}, firm_id)
            )
            
            requires_sig = await self.collection.count_documents(
                TenantAwareQuery.add_firm_filter({"requires_signature": True}, firm_id)
            )
            
            elapsed = (datetime.utcnow() - start_time).total_seconds()
            
            metrics = {
                "total_documents": total,
                "signed_documents": signed_count,
                "confidential_documents": confidential_count,
                "requires_signature_count": requires_sig,
                "signed_percentage": round((signed_count / total * 100) if total > 0 else 0, 2),
            }
            
            logger.info(
                f"[case_documents] DOCUMENT_METRICS firm_id={firm_id} total={total} "
                f"signed={signed_count} elapsed={elapsed:.3f}s request_id={request_id}"
            )
            
            return metrics
        except Exception as e:
            logger.error(f"[case_documents] DOCUMENT_METRICS error: {str(e)}")
            raise

    # ════════════════════════════════════════════════════════════════════════════════
    # VALIDATION HELPERS
    # ════════════════════════════════════════════════════════════════════════════════

    async def validate_document(
        self,
        firm_id: str,
        document_id: str,
        request_id: str = None
    ) -> bool:
        """
        Check if document exists and belongs to firm.
        
        Args:
            firm_id: Multi-tenant isolation
            document_id: Document ID to check
            request_id: For audit trail
            
        Returns:
            True if document exists, False otherwise
        """
        try:
            doc = await self.find_by_id(firm_id, document_id, request_id or "")
            exists = doc is not None
            
            logger.debug(
                f"[case_documents] VALIDATE_DOCUMENT firm_id={firm_id} "
                f"document_id={document_id} exists={exists} request_id={request_id}"
            )
            
            return exists
        except Exception as e:
            logger.error(f"[case_documents] VALIDATE_DOCUMENT error: {str(e)}")
            raise

    async def validate_file(
        self,
        file_size: int,
        mime_type: str,
        request_id: str = None
    ) -> bool:
        """
        Validate file for upload (size, type).
        
        Args:
            file_size: File size in bytes
            mime_type: MIME type
            request_id: For audit trail
            
        Returns:
            True if file is valid, False otherwise
        """
        try:
            MAX_FILE_SIZE = 100 * 1024 * 1024  # 100MB
            ALLOWED_TYPES = {
                "application/pdf", "application/msword",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "image/jpeg", "image/png", "image/tiff",
                "audio/mpeg", "video/mp4", "text/plain"
            }
            
            is_valid = file_size <= MAX_FILE_SIZE and mime_type in ALLOWED_TYPES
            
            logger.debug(
                f"[case_documents] VALIDATE_FILE size={file_size} type={mime_type} "
                f"valid={is_valid} request_id={request_id}"
            )
            
            return is_valid
        except Exception as e:
            logger.error(f"[case_documents] VALIDATE_FILE error: {str(e)}")
            raise

    @staticmethod
    def _is_valid_object_id(value: str) -> bool:
        """Check if string is valid MongoDB ObjectId"""
        try:
            ObjectId.from_string(value)
            return True
        except:
            return False
