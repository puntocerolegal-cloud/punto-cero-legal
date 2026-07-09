"""
Audit Log Repository
Multi-tenant system audit trail
"""

from typing import List, Dict, Any
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorCollection
from .enterprise_base_repository import BaseRepository
from middleware.tenant_isolation import TenantAwareQuery


class AuditLogRepository(BaseRepository):
    """
    Repository for audit logs with multi-tenant isolation.
    
    Tracks all system actions for compliance and security.
    All logs automatically scoped to firm_id.
    """
    
    def __init__(self, collection: AsyncIOMotorCollection):
        """Initialize with audit_logs collection."""
        super().__init__(collection)
    
    async def log_action(
        self,
        firm_id: str,
        action: str,
        user_id: str,
        details: Dict[str, Any],
        request_id: str,
        ip_address: str = "unknown"
    ) -> Dict[str, Any]:
        """
        Log system action.
        
        Args:
            firm_id: Organization ID
            action: Action name (e.g., "subscription_paid", "webhook_processed")
            user_id: User who triggered action
            details: Action details (JSON)
            request_id: Request trace ID
            ip_address: Client IP for security audit
        
        Returns:
            Created log document
        """
        doc = {
            "action": action,
            "user_id": user_id,
            "details": details,
            "ip_address": ip_address,
            "timestamp": datetime.utcnow(),
        }
        
        result = await self.create(firm_id, doc, request_id)
        
        self.logger.info(
            f"[AUDIT] {action}. "
            f"request_id={request_id} | firm_id={firm_id} | "
            f"user_id={user_id}"
        )
        
        return result
    
    async def get_by_action(
        self,
        firm_id: str,
        action: str,
        limit: int = 100,
        request_id: str = None
    ) -> List[Dict[str, Any]]:
        """
        Get audit logs by action type.
        
        Args:
            firm_id: Organization ID
            action: Action name to filter
            limit: Max results
            request_id: Request trace ID
        
        Returns:
            List of audit log documents
        """
        query = TenantAwareQuery.add_firm_filter(
            {"action": action},
            firm_id
        )
        
        docs = await self.collection.find(query) \
            .sort("timestamp", -1) \
            .limit(limit) \
            .to_list(None)
        
        return docs
    
    async def get_by_user(
        self,
        firm_id: str,
        user_id: str,
        limit: int = 100,
        request_id: str = None
    ) -> List[Dict[str, Any]]:
        """
        Get audit logs by user.
        
        Args:
            firm_id: Organization ID
            user_id: User ID to filter
            limit: Max results
            request_id: Request trace ID
        
        Returns:
            List of audit log documents
        """
        query = TenantAwareQuery.add_firm_filter(
            {"user_id": user_id},
            firm_id
        )
        
        docs = await self.collection.find(query) \
            .sort("timestamp", -1) \
            .limit(limit) \
            .to_list(None)
        
        return docs
    
    async def log_security_event(
        self,
        firm_id: str,
        event_type: str,
        severity: str,
        details: Dict[str, Any],
        request_id: str,
        ip_address: str = "unknown"
    ) -> Dict[str, Any]:
        """
        Log security event (elevated importance).
        
        Args:
            firm_id: Organization ID
            event_type: Type of security event
            severity: "LOW", "MEDIUM", "HIGH", "CRITICAL"
            details: Event details
            request_id: Request trace ID
            ip_address: Client IP
        
        Returns:
            Created log document
        """
        doc = {
            "action": f"security_{event_type}",
            "severity": severity,
            "details": details,
            "ip_address": ip_address,
            "timestamp": datetime.utcnow(),
        }
        
        result = await self.create(firm_id, doc, request_id)
        
        log_level = "critical" if severity == "CRITICAL" else "warning"
        self.logger.log(
            getattr(__import__("logging"), log_level.upper()),
            f"[SECURITY_EVENT] {event_type} ({severity}). "
            f"request_id={request_id} | firm_id={firm_id} | "
            f"ip={ip_address}"
        )
        
        return result
