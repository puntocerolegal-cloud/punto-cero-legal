"""
Audit Logger — Automatic Security Logging (with Async Pipeline)
═══════════════════════════════════════════════════════════════════

Purpose:
  Log all authorization decisions for compliance and forensics.

  Uses async audit pipeline for non-blocking logging.

  Logs:
  - user_id
  - action
  - resource_type
  - resource_id
  - allow/deny decision
  - timestamp
  - reason (if denied)
"""

import logging
from datetime import datetime
from typing import Dict, Any, Optional
from motor.motor_asyncio import AsyncIOMotorDatabase

# Create dedicated audit logger
audit_logger = logging.getLogger("audit")
audit_logger.setLevel(logging.INFO)

# Handler for audit logs (should be separate file)
audit_handler = logging.FileHandler("logs/audit.log")
audit_handler.setFormatter(logging.Formatter(
    '%(asctime)s - AUDIT - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
))
audit_logger.addHandler(audit_handler)


def _get_async_pipeline():
    """Lazy import to avoid circular dependencies."""
    try:
        from security.async_audit_pipeline import get_audit_pipeline
        return get_audit_pipeline()
    except Exception:
        return None


async def log_authorization(
    decision: str,  # "ALLOW" or "DENY"
    user_id: str,
    action: str,
    resource_type: str,
    resource_id: Optional[str] = None,
    reason: Optional[str] = None,
    context: Optional[Dict[str, Any]] = None,
    db: Optional[AsyncIOMotorDatabase] = None,
) -> None:
    """
    Log an authorization decision (non-blocking via async pipeline).

    Args:
        decision: "ALLOW" or "DENY"
        user_id: User making the request
        action: "read", "write", "delete", etc.
        resource_type: "case", "document", "invoice"
        resource_id: ID of resource being accessed
        reason: Explanation for DENY decisions
        context: Additional context (optional)
        db: Database connection (passed to async pipeline)

    Note:
        This function returns immediately (non-blocking).
        Actual logging happens in background via async pipeline.
    """

    # Import async audit event
    from security.async_audit_pipeline import AuditEvent

    # Create audit event
    event = AuditEvent(
        decision=decision,
        user_id=user_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        reason=reason,
        context=context,
    )

    # Log to file immediately (fastest path)
    if decision == "ALLOW":
        audit_logger.info(event.to_log_line())
    else:
        audit_logger.warning(event.to_log_line())

    # Queue for async database logging (non-blocking)
    try:
        pipeline = _get_async_pipeline()
        if pipeline:
            pipeline.enqueue(event)
    except Exception as e:
        audit_logger.error(f"Failed to enqueue audit event: {e}")


async def log_access_denied(
    user_id: str,
    action: str,
    resource_type: str,
    reason: str,
    resource_id: Optional[str] = None,
    db: Optional[AsyncIOMotorDatabase] = None,
) -> None:
    """Helper for denied access logging."""
    await log_authorization(
        decision="DENY",
        user_id=user_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        reason=reason,
        db=db,
    )


async def log_access_allowed(
    user_id: str,
    action: str,
    resource_type: str,
    resource_id: Optional[str] = None,
    db: Optional[AsyncIOMotorDatabase] = None,
) -> None:
    """Helper for allowed access logging."""
    await log_authorization(
        decision="ALLOW",
        user_id=user_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        db=db,
    )
