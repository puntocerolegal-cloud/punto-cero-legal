"""
Case Activity Repository
CRUD operations for case activity timeline with multi-tenant isolation

Follows Golden Repository Template v1.0 specification.
Provides case activity management with:
- Multi-tenant isolation via firm_id
- Audit trail with request_id
- Comprehensive error handling
- Activity lifecycle and timeline management
- Reporting and aggregation support
"""

from typing import Dict, List, Any, Optional, Literal
from motor.motor_asyncio import AsyncIOMotorCollection
from bson import ObjectId
from datetime import datetime, timedelta
import logging

from repositories.enterprise_base_repository import BaseRepository
from middleware.tenant_isolation import TenantAwareQuery

logger = logging.getLogger(__name__)


class CaseActivityRepository(BaseRepository):
    """
    Repository for case activity/timeline operations.
    
    Manages all activity-related CRUD operations with strict multi-tenant
    isolation via firm_id. Activities represent the complete history and
    timeline of a legal case, including status changes, assignments,
    documents, communications, and internal notes.
    
    Key responsibilities:
    - Maintain complete case timeline and event history
    - Support activity queries by case, type, user, and date range
    - Maintain audit trail with request_id traceability
    - Ensure firm_id filtering on all queries
    - Provide domain-specific activity registration (status, assignment, comment, etc.)
    - Support timeline rendering and analytics
    
    Methods:
    - Base CRUD: create, find_by_id, update, soft_delete, hard_delete (inherited from BaseRepository)
    - Specialized Queries: find_by_case, find_by_activity_type, find_by_user, find_by_date_range,
                          find_recent, find_timeline, list_paginated, search
    - Domain Registration: register_activity, register_status_change, register_assignment,
                          register_comment, register_deadline, register_document,
                          register_hearing, register_note
    - Reporting: statistics, activity_summary, timeline_metrics
    - Validation: validate_activity
    """

    def __init__(self, collection: AsyncIOMotorCollection):
        """
        Initialize CaseActivityRepository.
        
        Args:
            collection: Motor async collection for case activities
        """
        super().__init__(collection, dict)
        self.collection = collection
        
        logger.info(
            f"[case_activities] CaseActivityRepository initialized "
            f"collection={collection.full_name}"
        )

    # ════════════════════════════════════════════════════════════════════════════════
    # REPOSITORY INITIALIZATION & INDEXES
    # ════════════════════════════════════════════════════════════════════════════════

    async def ensure_indexes(self) -> None:
        """
        Create all required indexes for case_activities collection.
        
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
            logger.info("[case_activities] Starting index creation...")

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
                    "name": "firm_activity_type",
                    "spec": [("firm_id", 1), ("activity_type", 1)],
                    "kwargs": {"background": True}
                },
                {
                    "name": "firm_user",
                    "spec": [("firm_id", 1), ("user_id", 1)],
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
                    "name": "firm_billable",
                    "spec": [("firm_id", 1), ("billable", 1)],
                    "kwargs": {"background": True}
                },
                {
                    "name": "firm_case_type_created",
                    "spec": [("firm_id", 1), ("case_id", 1), ("activity_type", 1), ("created_at", -1)],
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
                    logger.info(f"[case_activities] Index created: {index_name}")
                except Exception as e:
                    logger.warning(f"[case_activities] Index creation warning for {index['name']}: {str(e)}")

            logger.info("[case_activities] Index creation completed")
        except Exception as e:
            logger.error(f"[case_activities] ensure_indexes failed: {str(e)}")
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
        Find all activities for a case (complete timeline).
        
        Args:
            firm_id: Multi-tenant isolation
            case_id: Case ID
            request_id: For audit trail
            skip: Pagination skip
            limit: Pagination limit
            
        Returns:
            Tuple of (activities, total_count)
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
                f"[case_activities] FIND_BY_CASE firm_id={firm_id} case_id={case_id} "
                f"returned={len(docs)} total={total} elapsed={elapsed:.3f}s request_id={request_id}"
            )
            
            return docs, total
        except Exception as e:
            logger.error(f"[case_activities] FIND_BY_CASE error: {str(e)}")
            raise

    async def find_by_activity_type(
        self,
        firm_id: str,
        activity_type: str,
        request_id: str,
        skip: int = 0,
        limit: int = 100
    ) -> tuple[List[Dict[str, Any]], int]:
        """
        Find all activities of a specific type within firm.
        
        Args:
            firm_id: Multi-tenant isolation
            activity_type: Type of activity (note, call, email, document, meeting, hearing)
            request_id: For audit trail
            skip: Pagination skip
            limit: Pagination limit
            
        Returns:
            Tuple of (activities, total_count)
        """
        try:
            query = TenantAwareQuery.add_firm_filter(
                {"activity_type": activity_type, "deleted_at": None},
                firm_id
            )
            
            start_time = datetime.utcnow()
            
            total = await self.collection.count_documents(query)
            cursor = self.collection.find(query).skip(skip).limit(limit).sort("created_at", -1)
            docs = await cursor.to_list(length=limit)
            
            elapsed = (datetime.utcnow() - start_time).total_seconds()
            
            logger.info(
                f"[case_activities] FIND_BY_ACTIVITY_TYPE firm_id={firm_id} type={activity_type} "
                f"returned={len(docs)} total={total} elapsed={elapsed:.3f}s request_id={request_id}"
            )
            
            return docs, total
        except Exception as e:
            logger.error(f"[case_activities] FIND_BY_ACTIVITY_TYPE error: {str(e)}")
            raise

    async def find_by_user(
        self,
        firm_id: str,
        user_id: str,
        request_id: str,
        skip: int = 0,
        limit: int = 100
    ) -> tuple[List[Dict[str, Any]], int]:
        """
        Find all activities performed by a user within firm.
        
        Args:
            firm_id: Multi-tenant isolation
            user_id: User ID
            request_id: For audit trail
            skip: Pagination skip
            limit: Pagination limit
            
        Returns:
            Tuple of (activities, total_count)
        """
        try:
            query = TenantAwareQuery.add_firm_filter(
                {"user_id": user_id, "deleted_at": None},
                firm_id
            )
            
            start_time = datetime.utcnow()
            
            total = await self.collection.count_documents(query)
            cursor = self.collection.find(query).skip(skip).limit(limit).sort("created_at", -1)
            docs = await cursor.to_list(length=limit)
            
            elapsed = (datetime.utcnow() - start_time).total_seconds()
            
            logger.info(
                f"[case_activities] FIND_BY_USER firm_id={firm_id} user_id={user_id} "
                f"returned={len(docs)} total={total} elapsed={elapsed:.3f}s request_id={request_id}"
            )
            
            return docs, total
        except Exception as e:
            logger.error(f"[case_activities] FIND_BY_USER error: {str(e)}")
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
        Find activities created within a date range within firm.
        
        Args:
            firm_id: Multi-tenant isolation
            start_date: Range start
            end_date: Range end
            request_id: For audit trail
            skip: Pagination skip
            limit: Pagination limit
            
        Returns:
            Tuple of (activities, total_count)
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
                f"[case_activities] FIND_BY_DATE_RANGE firm_id={firm_id} start={start_date.date()} "
                f"end={end_date.date()} returned={len(docs)} total={total} "
                f"elapsed={elapsed:.3f}s request_id={request_id}"
            )
            
            return docs, total
        except Exception as e:
            logger.error(f"[case_activities] FIND_BY_DATE_RANGE error: {str(e)}")
            raise

    async def find_recent(
        self,
        firm_id: str,
        request_id: str,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Find most recent activities across all cases in firm.
        
        Args:
            firm_id: Multi-tenant isolation
            request_id: For audit trail
            limit: Number of recent activities to return
            
        Returns:
            List of recent activities
        """
        try:
            query = TenantAwareQuery.add_firm_filter({"deleted_at": None}, firm_id)
            
            start_time = datetime.utcnow()
            
            cursor = self.collection.find(query).sort("created_at", -1).limit(limit)
            docs = await cursor.to_list(length=limit)
            
            elapsed = (datetime.utcnow() - start_time).total_seconds()
            
            logger.info(
                f"[case_activities] FIND_RECENT firm_id={firm_id} limit={limit} "
                f"returned={len(docs)} elapsed={elapsed:.3f}s request_id={request_id}"
            )
            
            return docs
        except Exception as e:
            logger.error(f"[case_activities] FIND_RECENT error: {str(e)}")
            raise

    async def find_timeline(
        self,
        firm_id: str,
        case_id: str,
        request_id: str
    ) -> List[Dict[str, Any]]:
        """
        Find complete timeline for a case (all activities, ordered by date).
        
        Args:
            firm_id: Multi-tenant isolation
            case_id: Case ID
            request_id: For audit trail
            
        Returns:
            List of activities ordered chronologically
        """
        try:
            query = TenantAwareQuery.add_firm_filter(
                {"case_id": case_id, "deleted_at": None},
                firm_id
            )
            
            start_time = datetime.utcnow()
            
            cursor = self.collection.find(query).sort("created_at", 1)
            docs = await cursor.to_list(None)
            
            elapsed = (datetime.utcnow() - start_time).total_seconds()
            
            logger.info(
                f"[case_activities] FIND_TIMELINE firm_id={firm_id} case_id={case_id} "
                f"activities={len(docs)} elapsed={elapsed:.3f}s request_id={request_id}"
            )
            
            return docs
        except Exception as e:
            logger.error(f"[case_activities] FIND_TIMELINE error: {str(e)}")
            raise

    async def list_paginated(
        self,
        firm_id: str,
        skip: int = 0,
        limit: int = 50,
        case_id: Optional[str] = None,
        activity_type: Optional[str] = None,
        user_id: Optional[str] = None,
        billable_only: bool = False,
        request_id: str = None
    ) -> tuple[List[Dict[str, Any]], int]:
        """
        List activities with pagination and optional filters.
        
        Args:
            firm_id: Multi-tenant isolation
            skip: Pagination skip
            limit: Pagination limit (max 100)
            case_id: Filter by case
            activity_type: Filter by type
            user_id: Filter by user
            billable_only: Show only billable activities
            request_id: For audit trail
            
        Returns:
            Tuple of (activities, total_count)
        """
        try:
            limit = min(limit, 100)
            
            query = TenantAwareQuery.add_firm_filter({"deleted_at": None}, firm_id)
            if case_id:
                query["case_id"] = case_id
            if activity_type:
                query["activity_type"] = activity_type
            if user_id:
                query["user_id"] = user_id
            if billable_only:
                query["billable"] = True
            
            start_time = datetime.utcnow()
            
            total = await self.collection.count_documents(query)
            docs = await self.collection.find(query).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
            
            elapsed = (datetime.utcnow() - start_time).total_seconds()
            
            logger.info(
                f"[case_activities] LIST_PAGINATED firm_id={firm_id} skip={skip} limit={limit} "
                f"returned={len(docs)} total={total} elapsed={elapsed:.3f}s request_id={request_id}"
            )
            
            return docs, total
        except Exception as e:
            logger.error(f"[case_activities] LIST_PAGINATED error: {str(e)}")
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
        Search activities by description or metadata.
        
        Args:
            firm_id: Multi-tenant isolation
            search_term: Search text
            request_id: For audit trail
            skip: Pagination skip
            limit: Pagination limit
            
        Returns:
            Tuple of (activities, total_count)
        """
        try:
            query = TenantAwareQuery.add_firm_filter(
                {
                    "description": {"$regex": search_term, "$options": "i"},
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
                f"[case_activities] SEARCH firm_id={firm_id} query='{search_term}' "
                f"returned={len(docs)} total={total} elapsed={elapsed:.3f}s request_id={request_id}"
            )
            
            return docs, total
        except Exception as e:
            logger.error(f"[case_activities] SEARCH error: {str(e)}")
            raise

    # ════════════════════════════════════════════════════════════════════════════════
    # DOMAIN REGISTRATION OPERATIONS
    # ════════════════════════════════════════════════════════════════════════════════

    async def register_activity(
        self,
        firm_id: str,
        case_id: str,
        activity_type: str,
        user_id: str,
        description: str,
        request_id: str,
        duration_minutes: int = 0,
        billable: bool = False,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Register a generic activity for a case.
        
        Args:
            firm_id: Multi-tenant isolation
            case_id: Case ID
            activity_type: Type of activity
            user_id: User performing activity
            description: Activity description
            request_id: For audit trail
            duration_minutes: Duration if applicable
            billable: Whether activity is billable
            metadata: Additional metadata
            
        Returns:
            Created activity document
        """
        try:
            activity_data = {
                "firm_id": firm_id,
                "case_id": case_id,
                "activity_type": activity_type,
                "user_id": user_id,
                "description": description,
                "duration_minutes": duration_minutes,
                "billable": billable,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            
            if metadata:
                activity_data["metadata"] = metadata
            
            start_time = datetime.utcnow()
            
            result = await self.collection.insert_one(activity_data)
            
            elapsed = (datetime.utcnow() - start_time).total_seconds()
            
            logger.info(
                f"[case_activities] REGISTER_ACTIVITY firm_id={firm_id} case_id={case_id} "
                f"type={activity_type} activity_id={result.inserted_id} elapsed={elapsed:.3f}s "
                f"request_id={request_id}"
            )
            
            return await self.find_by_id(firm_id, str(result.inserted_id), request_id)
        except Exception as e:
            logger.error(f"[case_activities] REGISTER_ACTIVITY error: {str(e)}")
            raise

    async def register_status_change(
        self,
        firm_id: str,
        case_id: str,
        user_id: str,
        old_status: str,
        new_status: str,
        reason: str,
        request_id: str
    ) -> Dict[str, Any]:
        """
        Register a case status change activity.
        
        Args:
            firm_id: Multi-tenant isolation
            case_id: Case ID
            user_id: User making the change
            old_status: Previous status
            new_status: New status
            reason: Reason for change
            request_id: For audit trail
            
        Returns:
            Created activity document
        """
        try:
            description = f"Status changed from '{old_status}' to '{new_status}': {reason}"
            
            return await self.register_activity(
                firm_id=firm_id,
                case_id=case_id,
                activity_type="status_change",
                user_id=user_id,
                description=description,
                request_id=request_id,
                metadata={
                    "old_status": old_status,
                    "new_status": new_status,
                    "reason": reason
                }
            )
        except Exception as e:
            logger.error(f"[case_activities] REGISTER_STATUS_CHANGE error: {str(e)}")
            raise

    async def register_assignment(
        self,
        firm_id: str,
        case_id: str,
        user_id: str,
        assigned_to: str,
        assignment_type: str,
        request_id: str
    ) -> Dict[str, Any]:
        """
        Register an assignment activity (lawyer, team member assigned to case).
        
        Args:
            firm_id: Multi-tenant isolation
            case_id: Case ID
            user_id: User making the assignment
            assigned_to: User being assigned
            assignment_type: Type of assignment (lawyer, assistant, etc)
            request_id: For audit trail
            
        Returns:
            Created activity document
        """
        try:
            description = f"{assignment_type} assigned to case"
            
            return await self.register_activity(
                firm_id=firm_id,
                case_id=case_id,
                activity_type="assignment",
                user_id=user_id,
                description=description,
                request_id=request_id,
                metadata={
                    "assigned_to": assigned_to,
                    "assignment_type": assignment_type
                }
            )
        except Exception as e:
            logger.error(f"[case_activities] REGISTER_ASSIGNMENT error: {str(e)}")
            raise

    async def register_comment(
        self,
        firm_id: str,
        case_id: str,
        user_id: str,
        comment: str,
        request_id: str,
        is_internal: bool = False
    ) -> Dict[str, Any]:
        """
        Register a comment/note on the case.
        
        Args:
            firm_id: Multi-tenant isolation
            case_id: Case ID
            user_id: User adding comment
            comment: Comment text
            request_id: For audit trail
            is_internal: Whether comment is internal (not client-visible)
            
        Returns:
            Created activity document
        """
        try:
            return await self.register_activity(
                firm_id=firm_id,
                case_id=case_id,
                activity_type="comment",
                user_id=user_id,
                description=comment,
                request_id=request_id,
                metadata={
                    "internal": is_internal
                }
            )
        except Exception as e:
            logger.error(f"[case_activities] REGISTER_COMMENT error: {str(e)}")
            raise

    async def register_deadline(
        self,
        firm_id: str,
        case_id: str,
        user_id: str,
        deadline_type: str,
        deadline_date: datetime,
        description: str,
        request_id: str
    ) -> Dict[str, Any]:
        """
        Register a deadline update for the case.
        
        Args:
            firm_id: Multi-tenant isolation
            case_id: Case ID
            user_id: User setting deadline
            deadline_type: Type of deadline (filing, response, hearing, etc)
            deadline_date: Deadline date/time
            description: Deadline description
            request_id: For audit trail
            
        Returns:
            Created activity document
        """
        try:
            return await self.register_activity(
                firm_id=firm_id,
                case_id=case_id,
                activity_type="deadline",
                user_id=user_id,
                description=description,
                request_id=request_id,
                metadata={
                    "deadline_type": deadline_type,
                    "deadline_date": deadline_date.isoformat() if isinstance(deadline_date, datetime) else str(deadline_date)
                }
            )
        except Exception as e:
            logger.error(f"[case_activities] REGISTER_DEADLINE error: {str(e)}")
            raise

    async def register_document(
        self,
        firm_id: str,
        case_id: str,
        user_id: str,
        document_id: str,
        document_name: str,
        document_type: str,
        request_id: str
    ) -> Dict[str, Any]:
        """
        Register a document upload/addition to the case.
        
        Args:
            firm_id: Multi-tenant isolation
            case_id: Case ID
            user_id: User uploading document
            document_id: Document ID
            document_name: Document name/title
            document_type: Type of document (brief, motion, evidence, etc)
            request_id: For audit trail
            
        Returns:
            Created activity document
        """
        try:
            description = f"Document added: {document_name}"
            
            return await self.register_activity(
                firm_id=firm_id,
                case_id=case_id,
                activity_type="document",
                user_id=user_id,
                description=description,
                request_id=request_id,
                metadata={
                    "document_id": document_id,
                    "document_name": document_name,
                    "document_type": document_type
                }
            )
        except Exception as e:
            logger.error(f"[case_activities] REGISTER_DOCUMENT error: {str(e)}")
            raise

    async def register_hearing(
        self,
        firm_id: str,
        case_id: str,
        user_id: str,
        hearing_date: datetime,
        hearing_type: str,
        judge: Optional[str] = None,
        location: Optional[str] = None,
        request_id: str = None
    ) -> Dict[str, Any]:
        """
        Register a hearing scheduled for the case.
        
        Args:
            firm_id: Multi-tenant isolation
            case_id: Case ID
            user_id: User scheduling hearing
            hearing_date: Hearing date/time
            hearing_type: Type of hearing (trial, conference, oral argument, etc)
            judge: Judge name (optional)
            location: Hearing location (optional)
            request_id: For audit trail
            
        Returns:
            Created activity document
        """
        try:
            description = f"Hearing scheduled: {hearing_type} on {hearing_date.strftime('%Y-%m-%d')}"
            
            return await self.register_activity(
                firm_id=firm_id,
                case_id=case_id,
                activity_type="hearing",
                user_id=user_id,
                description=description,
                request_id=request_id,
                metadata={
                    "hearing_date": hearing_date.isoformat() if isinstance(hearing_date, datetime) else str(hearing_date),
                    "hearing_type": hearing_type,
                    "judge": judge,
                    "location": location
                }
            )
        except Exception as e:
            logger.error(f"[case_activities] REGISTER_HEARING error: {str(e)}")
            raise

    async def register_note(
        self,
        firm_id: str,
        case_id: str,
        user_id: str,
        note_text: str,
        request_id: str,
        note_type: str = "general"
    ) -> Dict[str, Any]:
        """
        Register an internal note on the case.
        
        Args:
            firm_id: Multi-tenant isolation
            case_id: Case ID
            user_id: User adding note
            note_text: Note text
            request_id: For audit trail
            note_type: Type of note (general, strategy, reminder, etc)
            
        Returns:
            Created activity document
        """
        try:
            return await self.register_activity(
                firm_id=firm_id,
                case_id=case_id,
                activity_type="note",
                user_id=user_id,
                description=note_text,
                request_id=request_id,
                metadata={
                    "note_type": note_type,
                    "internal": True
                }
            )
        except Exception as e:
            logger.error(f"[case_activities] REGISTER_NOTE error: {str(e)}")
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
        Calculate activity statistics for firm.
        
        Args:
            firm_id: Multi-tenant isolation
            request_id: For audit trail
            
        Returns:
            Statistics dictionary with activity counts
        """
        try:
            start_time = datetime.utcnow()
            
            base_query = TenantAwareQuery.add_firm_filter({}, firm_id)
            
            total = await self.collection.count_documents(base_query)
            
            type_counts = {}
            activity_types = ["note", "call", "email", "document", "meeting", "hearing", "status_change", "assignment"]
            for atype in activity_types:
                count = await self.collection.count_documents(
                    TenantAwareQuery.add_firm_filter({"activity_type": atype}, firm_id)
                )
                if count > 0:
                    type_counts[atype] = count
            
            billable = await self.collection.count_documents(
                TenantAwareQuery.add_firm_filter({"billable": True}, firm_id)
            )
            
            elapsed = (datetime.utcnow() - start_time).total_seconds()
            
            stats = {
                "total_activities": total,
                "by_type": type_counts,
                "billable_activities": billable,
            }
            
            logger.info(
                f"[case_activities] STATISTICS firm_id={firm_id} total={total} "
                f"billable={billable} elapsed={elapsed:.3f}s request_id={request_id}"
            )
            
            return stats
        except Exception as e:
            logger.error(f"[case_activities] STATISTICS error: {str(e)}")
            raise

    async def activity_summary(
        self,
        firm_id: str,
        case_id: str,
        request_id: str
    ) -> Dict[str, Any]:
        """
        Get activity summary for a specific case.
        
        Args:
            firm_id: Multi-tenant isolation
            case_id: Case ID
            request_id: For audit trail
            
        Returns:
            Activity summary dictionary
        """
        try:
            start_time = datetime.utcnow()
            
            query = TenantAwareQuery.add_firm_filter({"case_id": case_id}, firm_id)
            
            total = await self.collection.count_documents(query)
            
            type_counts = {}
            activity_types = ["note", "call", "email", "document", "meeting", "hearing", "status_change", "assignment"]
            for atype in activity_types:
                count = await self.collection.count_documents(
                    TenantAwareQuery.add_firm_filter({"case_id": case_id, "activity_type": atype}, firm_id)
                )
                if count > 0:
                    type_counts[atype] = count
            
            recent = await self.collection.find(query).sort("created_at", -1).limit(5).to_list(5)
            
            elapsed = (datetime.utcnow() - start_time).total_seconds()
            
            summary = {
                "total_activities": total,
                "by_type": type_counts,
                "recent_activity_count": len(recent),
            }
            
            logger.info(
                f"[case_activities] ACTIVITY_SUMMARY firm_id={firm_id} case_id={case_id} "
                f"total={total} elapsed={elapsed:.3f}s request_id={request_id}"
            )
            
            return summary
        except Exception as e:
            logger.error(f"[case_activities] ACTIVITY_SUMMARY error: {str(e)}")
            raise

    async def timeline_metrics(
        self,
        firm_id: str,
        case_id: str,
        request_id: str
    ) -> Dict[str, Any]:
        """
        Get timeline metrics for a case (activity velocity, coverage, etc).
        
        Args:
            firm_id: Multi-tenant isolation
            case_id: Case ID
            request_id: For audit trail
            
        Returns:
            Timeline metrics dictionary
        """
        try:
            start_time = datetime.utcnow()
            
            query = TenantAwareQuery.add_firm_filter({"case_id": case_id}, firm_id)
            
            activities = await self.collection.find(query).sort("created_at", 1).to_list(None)
            
            if not activities:
                return {"total_activities": 0, "days_spanned": 0, "activity_frequency": 0}
            
            first_activity = activities[0]
            last_activity = activities[-1]
            
            first_date = first_activity.get("created_at")
            last_date = last_activity.get("created_at")
            
            if first_date and last_date:
                days_spanned = (last_date - first_date).days + 1
            else:
                days_spanned = 0
            
            frequency = len(activities) / max(days_spanned, 1)
            
            elapsed = (datetime.utcnow() - start_time).total_seconds()
            
            metrics = {
                "total_activities": len(activities),
                "days_spanned": days_spanned,
                "activity_frequency_per_day": round(frequency, 2),
            }
            
            logger.info(
                f"[case_activities] TIMELINE_METRICS firm_id={firm_id} case_id={case_id} "
                f"activities={len(activities)} days={days_spanned} elapsed={elapsed:.3f}s "
                f"request_id={request_id}"
            )
            
            return metrics
        except Exception as e:
            logger.error(f"[case_activities] TIMELINE_METRICS error: {str(e)}")
            raise

    # ════════════════════════════════════════════════════════════════════════════════
    # VALIDATION HELPERS
    # ════════════════════════════════════════════════════════════════════════════════

    async def validate_activity(
        self,
        firm_id: str,
        activity_id: str,
        request_id: str = None
    ) -> bool:
        """
        Check if activity exists and belongs to firm.
        
        Args:
            firm_id: Multi-tenant isolation
            activity_id: Activity ID to check
            request_id: For audit trail
            
        Returns:
            True if activity exists, False otherwise
        """
        try:
            doc = await self.find_by_id(firm_id, activity_id, request_id or "")
            exists = doc is not None
            
            logger.debug(
                f"[case_activities] VALIDATE_ACTIVITY firm_id={firm_id} "
                f"activity_id={activity_id} exists={exists} request_id={request_id}"
            )
            
            return exists
        except Exception as e:
            logger.error(f"[case_activities] VALIDATE_ACTIVITY error: {str(e)}")
            raise

    @staticmethod
    def _is_valid_object_id(value: str) -> bool:
        """Check if string is valid MongoDB ObjectId"""
        try:
            ObjectId.from_string(value)
            return True
        except:
            return False
