"""
Enterprise Audit Service
Logging, compliance, audit trail management
"""

from motor.motor_asyncio import AsyncIOMotorCollection
from datetime import datetime
from typing import Optional, Dict, Any, List
from models.enterprise_core import AuditLog
from models.enterprise_audit import Activity, DocumentAccess
from repositories.enterprise_base_repository import BaseRepository
import logging

logger = logging.getLogger(__name__)


class AuditService:
    """
    Service for enterprise audit logging and compliance.
    Logs all actions for compliance (GDPR, CCPA, Mexico).
    """

    def __init__(
        self,
        audit_log_collection: AsyncIOMotorCollection,
        activity_collection: AsyncIOMotorCollection,
        document_access_collection: AsyncIOMotorCollection
    ):
        self.audit_repo = BaseRepository(audit_log_collection, AuditLog)
        self.activity_repo = BaseRepository(activity_collection, Activity)
        self.document_access_repo = BaseRepository(document_access_collection, DocumentAccess)

    # ========================================================================
    # AUDIT LOGGING (Compliance Trail)
    # ========================================================================

    async def log_action(
        self,
        firm_id: str,
        user_id: str,
        action: str,
        category: str,
        resource_type: str,
        resource_id: str,
        status: str = "SUCCESS",
        severity: str = "INFO",
        old_value: Optional[str] = None,
        new_value: Optional[str] = None,
        error_message: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        request_id: str = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Log an action to audit trail (primary compliance log).
        
        Args:
            firm_id: Multi-tenant isolation
            user_id: Who performed action
            action: CREATE, READ, UPDATE, DELETE, LOGIN, LOGOUT, EXPORT, etc.
            category: AUTHENTICATION, CASE_MANAGEMENT, DOCUMENT, WORKFLOW, etc.
            resource_type: CASE, DOCUMENT, USER, WORKFLOW, etc.
            resource_id: ID of affected resource
            status: SUCCESS, FAILURE, PARTIAL
            severity: CRITICAL, HIGH, MEDIUM, INFO, DEBUG
            old_value: Previous value (for updates)
            new_value: New value (for updates)
            error_message: If status=FAILURE
            ip_address: User's IP (for location tracking)
            user_agent: Browser/client info
            request_id: Correlation ID for request tracing
            metadata: Additional context
            
        Returns:
            Created AuditLog document
        """
        
        audit_data = {
            "firm_id": firm_id,
            "user_id": user_id,
            "action": action,
            "category": category,
            "resource_type": resource_type,
            "resource_id": resource_id,
            "status": status,
            "severity": severity,
            "old_value": old_value,
            "new_value": new_value,
            "error_message": error_message,
            "ip_address": ip_address,
            "user_agent": user_agent,
            "request_id": request_id,
            "metadata": metadata,
            "created_at": datetime.utcnow()
        }
        
        try:
            result = await self.audit_repo.create(
                firm_id=firm_id,
                data=audit_data,
                request_id=request_id or "unknown"
            )
            
            logger.info(
                f"[AUDIT] {action}:{category} firm_id={firm_id} "
                f"user_id={user_id} resource_type={resource_type} "
                f"status={status} severity={severity}"
            )
            
            return result
        except Exception as e:
            logger.error(f"[AUDIT] log_action error: {str(e)}")
            raise

    async def log_authentication(
        self,
        firm_id: str,
        user_id: str,
        email: str,
        action: str,  # LOGIN, LOGOUT, MFA_CHALLENGE, MFA_VERIFY
        status: str,
        ip_address: str,
        user_agent: str,
        request_id: str
    ) -> Dict[str, Any]:
        """
        Log authentication events (logins, logouts).
        Critical for security audit.
        """
        return await self.log_action(
            firm_id=firm_id,
            user_id=user_id,
            action=action,
            category="AUTHENTICATION",
            resource_type="USER",
            resource_id=user_id,
            status=status,
            severity="HIGH" if action == "LOGOUT" else "INFO",
            ip_address=ip_address,
            user_agent=user_agent,
            request_id=request_id,
            metadata={"email": email}
        )

    async def log_case_access(
        self,
        firm_id: str,
        user_id: str,
        case_id: str,
        action: str,  # CREATE, UPDATE, DELETE, VIEW
        status: str,
        request_id: str,
        ip_address: Optional[str] = None
    ) -> Dict[str, Any]:
        """Log case management actions"""
        return await self.log_action(
            firm_id=firm_id,
            user_id=user_id,
            action=action,
            category="CASE_MANAGEMENT",
            resource_type="CASE",
            resource_id=case_id,
            status=status,
            severity="HIGH" if action in ["DELETE"] else "INFO",
            ip_address=ip_address,
            request_id=request_id
        )

    async def log_document_access(
        self,
        firm_id: str,
        user_id: str,
        document_id: str,
        access_type: str,  # VIEWED, DOWNLOADED, PRINTED, EXPORTED
        ip_address: str,
        user_agent: str,
        request_id: str
    ) -> Dict[str, Any]:
        """Log document access (for confidentiality tracking)"""
        
        # Log to audit
        audit_result = await self.log_action(
            firm_id=firm_id,
            user_id=user_id,
            action="ACCESS",
            category="DOCUMENT",
            resource_type="DOCUMENT",
            resource_id=document_id,
            status="SUCCESS",
            severity="INFO",
            ip_address=ip_address,
            user_agent=user_agent,
            request_id=request_id,
            metadata={"access_type": access_type}
        )
        
        # Also log to DocumentAccess for quick queries
        try:
            doc_access_data = {
                "firm_id": firm_id,
                "document_id": document_id,
                "user_id": user_id,
                "access_type": access_type,
                "ip_address": ip_address,
                "user_agent": user_agent,
                "accessed_at": datetime.utcnow()
            }
            
            await self.document_access_repo.create(
                firm_id=firm_id,
                data=doc_access_data,
                request_id=request_id
            )
        except Exception as e:
            logger.warning(f"[AUDIT] DocumentAccess logging failed: {str(e)}")
        
        return audit_result

    async def log_permission_violation(
        self,
        firm_id: str,
        user_id: str,
        resource_type: str,
        resource_id: str,
        required_permission: str,
        required_action: str,
        ip_address: str,
        request_id: str
    ) -> Dict[str, Any]:
        """Log unauthorized access attempts (security incidents)"""
        return await self.log_action(
            firm_id=firm_id,
            user_id=user_id,
            action="UNAUTHORIZED_ACCESS",
            category="ACCESS",
            resource_type=resource_type,
            resource_id=resource_id,
            status="FAILURE",
            severity="HIGH",  # Always HIGH for security
            ip_address=ip_address,
            request_id=request_id,
            error_message=f"Missing permission: {required_permission}:{required_action}"
        )

    # ========================================================================
    # ACTIVITY TRACKING (Lightweight)
    # ========================================================================

    async def log_activity(
        self,
        firm_id: str,
        user_id: str,
        activity_type: str,
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None,
        duration_ms: Optional[int] = None,
        metadata: Optional[Dict[str, Any]] = None,
        request_id: str = None
    ) -> Dict[str, Any]:
        """
        Log lightweight activity (for analytics, not compliance).
        Faster than audit logging; no IP/user_agent.
        """
        activity_data = {
            "firm_id": firm_id,
            "user_id": user_id,
            "activity_type": activity_type,
            "resource_type": resource_type,
            "resource_id": resource_id,
            "duration_ms": duration_ms,
            "metadata": metadata,
            "created_at": datetime.utcnow()
        }
        
        try:
            return await self.activity_repo.create(
                firm_id=firm_id,
                data=activity_data,
                request_id=request_id or "unknown"
            )
        except Exception as e:
            logger.warning(f"[ACTIVITY] log_activity error: {str(e)}")
            raise

    # ========================================================================
    # COMPLIANCE QUERIES
    # ========================================================================

    async def get_user_audit_trail(
        self,
        firm_id: str,
        user_id: str,
        skip: int = 0,
        limit: int = 100,
        request_id: str = None
    ) -> tuple[List[Dict[str, Any]], int]:
        """
        Get audit trail for specific user (GDPR right to access).
        
        Args:
            firm_id: Multi-tenant
            user_id: Whose trail
            skip: Pagination
            limit: Pagination
            
        Returns:
            Tuple of (audit logs, total count)
        """
        query = {
            "user_id": user_id,
            "deleted_at": None
        }
        
        try:
            logs, total = await self.audit_repo.find_many(
                firm_id=firm_id,
                query=query,
                skip=skip,
                limit=limit,
                sort=[("created_at", -1)],
                request_id=request_id
            )
            
            logger.debug(
                f"[AUDIT] GET_USER_TRAIL user_id={user_id} "
                f"firm_id={firm_id} found={len(logs)}"
            )
            
            return logs, total
        except Exception as e:
            logger.error(f"[AUDIT] get_user_audit_trail error: {str(e)}")
            raise

    async def get_resource_history(
        self,
        firm_id: str,
        resource_type: str,
        resource_id: str,
        skip: int = 0,
        limit: int = 100,
        request_id: str = None
    ) -> tuple[List[Dict[str, Any]], int]:
        """
        Get complete history of resource changes (who did what, when).
        """
        query = {
            "resource_type": resource_type,
            "resource_id": resource_id,
            "deleted_at": None
        }
        
        try:
            logs, total = await self.audit_repo.find_many(
                firm_id=firm_id,
                query=query,
                skip=skip,
                limit=limit,
                sort=[("created_at", -1)],
                request_id=request_id
            )
            
            logger.debug(
                f"[AUDIT] GET_RESOURCE_HISTORY {resource_type}:{resource_id} "
                f"firm_id={firm_id} found={len(logs)}"
            )
            
            return logs, total
        except Exception as e:
            logger.error(f"[AUDIT] get_resource_history error: {str(e)}")
            raise

    async def get_document_access_log(
        self,
        firm_id: str,
        document_id: str,
        skip: int = 0,
        limit: int = 100,
        request_id: str = None
    ) -> tuple[List[Dict[str, Any]], int]:
        """
        Get who accessed a document and when (confidentiality audit).
        """
        query = {
            "document_id": document_id,
            "deleted_at": None
        }
        
        try:
            logs, total = await self.document_access_repo.find_many(
                firm_id=firm_id,
                query=query,
                skip=skip,
                limit=limit,
                sort=[("accessed_at", -1)],
                request_id=request_id
            )
            
            logger.debug(
                f"[AUDIT] GET_DOCUMENT_ACCESS_LOG document_id={document_id} "
                f"firm_id={firm_id} found={len(logs)}"
            )
            
            return logs, total
        except Exception as e:
            logger.error(f"[AUDIT] get_document_access_log error: {str(e)}")
            raise

    async def get_firm_audit_summary(
        self,
        firm_id: str,
        days: int = 7,
        request_id: str = None
    ) -> Dict[str, Any]:
        """
        Get audit summary for firm (for dashboards/reports).
        """
        from datetime import timedelta
        
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        query = {
            "created_at": {"$gte": cutoff_date},
            "deleted_at": None
        }
        
        try:
            count = await self.audit_repo.collection.count_documents(
                {"firm_id": firm_id, **query}
            )
            
            # Get critical events (security incidents)
            critical_query = {
                **query,
                "severity": "CRITICAL"
            }
            critical_count = await self.audit_repo.collection.count_documents(
                {"firm_id": firm_id, **critical_query}
            )
            
            # Get by category
            categories = await self.audit_repo.collection.distinct(
                "category",
                {"firm_id": firm_id, **query}
            )
            
            summary = {
                "firm_id": firm_id,
                "period_days": days,
                "total_audit_logs": count,
                "critical_events": critical_count,
                "categories": categories,
                "period_start": cutoff_date.isoformat(),
                "period_end": datetime.utcnow().isoformat()
            }
            
            logger.debug(
                f"[AUDIT] GET_FIRM_SUMMARY firm_id={firm_id} "
                f"total={count} critical={critical_count}"
            )
            
            return summary
        except Exception as e:
            logger.error(f"[AUDIT] get_firm_audit_summary error: {str(e)}")
            raise

    # ========================================================================
    # INDEXING
    # ========================================================================

    async def ensure_indexes(self):
        """Create recommended indexes for audit collections"""
        try:
            # AuditLog indexes
            await self.audit_repo.create_index([("firm_id", 1), ("created_at", -1)])
            await self.audit_repo.create_index([("user_id", 1), ("created_at", -1)])
            await self.audit_repo.create_index([("resource_type", 1), ("resource_id", 1)])
            await self.audit_repo.create_index([("severity", 1), ("created_at", -1)])
            await self.audit_repo.create_index([("category", 1)])
            await self.audit_repo.create_index([("deleted_at", 1)])  # Soft delete
            
            # TTL index: auto-delete logs older than 7 years (for compliance)
            # await self.audit_repo.create_index([("created_at", 1)], expireAfterSeconds=220752000)
            
            # DocumentAccess indexes
            await self.document_access_repo.create_index([("document_id", 1), ("accessed_at", -1)])
            await self.document_access_repo.create_index([("user_id", 1), ("accessed_at", -1)])
            await self.document_access_repo.create_index([("firm_id", 1), ("accessed_at", -1)])
            
            # Activity indexes
            await self.activity_repo.create_index([("firm_id", 1), ("created_at", -1)])
            await self.activity_repo.create_index([("activity_type", 1)])
            
            logger.info("[AUDIT] Indexes created successfully")
        except Exception as e:
            logger.warning(f"[AUDIT] Index creation warning: {str(e)}")
