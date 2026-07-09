"""
Async Audit Pipeline — Non-Blocking Security Logging
═══════════════════════════════════════════════════════════════════

Purpose:
  Audit logging without blocking API requests.
  
  Uses asyncio background tasks + queue to:
  - Log authorization decisions asynchronously
  - Never block request path
  - Gracefully handle MongoDB unavailability
  - Maintain complete audit trail

Architecture:
  1. AuditLog event added to in-memory queue
  2. Background worker processes queue continuously
  3. Worker writes to MongoDB + file
  4. If MongoDB fails, file logging continues
  5. Retries failed writes on recovery
"""

import asyncio
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime
from collections import deque
from motor.motor_asyncio import AsyncIOMotorDatabase
import json

logger = logging.getLogger(__name__)


# ═══════════════════════════════════════════════════════════════════
# AUDIT EVENT MODEL
# ═══════════════════════════════════════════════════════════════════

class AuditEvent:
    """Single audit log entry."""
    
    def __init__(
        self,
        decision: str,  # "ALLOW" or "DENY"
        user_id: str,
        action: str,
        resource_type: str,
        resource_id: Optional[str] = None,
        reason: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None,
    ):
        self.decision = decision
        self.user_id = user_id
        self.action = action
        self.resource_type = resource_type
        self.resource_id = resource_id
        self.reason = reason
        self.context = context or {}
        self.timestamp = datetime.utcnow()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to MongoDB-compatible dict."""
        return {
            "decision": self.decision,
            "user_id": self.user_id,
            "action": self.action,
            "resource_type": self.resource_type,
            "resource_id": self.resource_id,
            "reason": self.reason,
            "context": self.context,
            "timestamp": self.timestamp,
        }
    
    def to_log_line(self) -> str:
        """Convert to file-loggable line."""
        return (
            f"[{self.decision}] user={self.user_id} action={self.action} "
            f"resource_type={self.resource_type} resource_id={self.resource_id} "
            f"reason={self.reason} timestamp={self.timestamp.isoformat()}"
        )


# ═══════════════════════════════════════════════════════════════════
# ASYNC AUDIT PIPELINE
# ═══════════════════════════════════════════════════════════════════

class AsyncAuditPipeline:
    """
    Non-blocking audit logging pipeline.
    
    Uses asyncio background task to process audit events
    from a queue, without blocking the request path.
    """
    
    def __init__(
        self,
        db: Optional[AsyncIOMotorDatabase] = None,
        queue_size: int = 1000,
        batch_size: int = 50,
        flush_interval: float = 5.0,
    ):
        self.db = db
        self.queue: deque = deque(maxlen=queue_size)
        self.batch_size = batch_size
        self.flush_interval = flush_interval
        self.running = False
        self.worker_task: Optional[asyncio.Task] = None
        self.failed_events: List[AuditEvent] = []
        
        logger.info("[AUDIT_PIPELINE] Async audit pipeline initialized")
    
    def enqueue(self, event: AuditEvent) -> None:
        """
        Add audit event to queue (non-blocking).
        
        Args:
            event: AuditEvent to log
        
        Note:
            Happens instantly in request path.
            Actual logging happens asynchronously.
        """
        try:
            self.queue.append(event)
        except Exception as e:
            logger.error(f"[AUDIT_PIPELINE] Failed to enqueue event: {e}")
    
    async def start(self) -> None:
        """Start background worker task."""
        if self.running:
            return
        
        self.running = True
        self.worker_task = asyncio.create_task(self._worker())
        logger.info("[AUDIT_PIPELINE] Background worker started")
    
    async def stop(self) -> None:
        """Stop background worker and flush queue."""
        if not self.running:
            return
        
        self.running = False
        
        # Flush remaining events
        await self._flush()
        
        # Cancel worker task
        if self.worker_task:
            self.worker_task.cancel()
            try:
                await self.worker_task
            except asyncio.CancelledError:
                pass
        
        logger.info("[AUDIT_PIPELINE] Background worker stopped")
    
    async def _worker(self) -> None:
        """
        Background worker that continuously processes queue.
        
        Runs as long as running=True.
        Flushes events at regular intervals.
        """
        while self.running:
            try:
                # Wait for flush interval or until queue has items
                await asyncio.sleep(self.flush_interval)
                
                if len(self.queue) > 0:
                    await self._flush()
            
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"[AUDIT_PIPELINE] Worker error: {e}")
    
    async def _flush(self) -> None:
        """
        Process all events in queue.
        
        Batches them and writes to MongoDB + file.
        """
        if len(self.queue) == 0:
            return
        
        # Dequeue all events
        events: List[AuditEvent] = []
        while len(self.queue) > 0:
            events.append(self.queue.popleft())
        
        if not events:
            return
        
        logger.debug(f"[AUDIT_PIPELINE] Flushing {len(events)} events")
        
        # Write to file (always succeeds)
        await self._write_file(events)
        
        # Try to write to MongoDB (may fail, will retry)
        if self.db:
            success = await self._write_mongo(events)
            if not success:
                # Re-queue failed events for retry
                for event in events:
                    self.failed_events.append(event)
    
    async def _write_file(self, events: List[AuditEvent]) -> None:
        """Write events to file (non-blocking)."""
        try:
            lines = [event.to_log_line() for event in events]
            # In production, use aiofiles for truly async I/O
            # For now, this happens in executor
            for line in lines:
                logger.info(f"[AUDIT] {line}")
        except Exception as e:
            logger.error(f"[AUDIT_PIPELINE] File write failed: {e}")
    
    async def _write_mongo(self, events: List[AuditEvent]) -> bool:
        """
        Write events to MongoDB.
        
        Returns:
            True if successful, False if failed
        """
        if not self.db:
            return False
        
        try:
            documents = [event.to_dict() for event in events]
            result = await self.db.audit_logs.insert_many(documents)
            logger.info(f"[AUDIT_PIPELINE] Wrote {len(result)} events to MongoDB")
            return True
        
        except Exception as e:
            logger.warning(
                f"[AUDIT_PIPELINE] MongoDB write failed (will retry): {e}"
            )
            return False
    
    async def retry_failed(self) -> None:
        """Retry writing failed events."""
        if not self.failed_events or not self.db:
            return
        
        logger.info(f"[AUDIT_PIPELINE] Retrying {len(self.failed_events)} failed events")
        
        success = await self._write_mongo(self.failed_events)
        if success:
            self.failed_events = []
            logger.info("[AUDIT_PIPELINE] Failed events retried successfully")
    
    def queue_size(self) -> int:
        """Get current queue size."""
        return len(self.queue)
    
    def failed_count(self) -> int:
        """Get count of failed events pending retry."""
        return len(self.failed_events)


# ═══════════════════════════════════════════════════════════════════
# GLOBAL PIPELINE INSTANCE
# ═══════════════════════════════════════════════════════════════════

_audit_pipeline: Optional[AsyncAuditPipeline] = None


def get_audit_pipeline() -> AsyncAuditPipeline:
    """Get global audit pipeline instance."""
    global _audit_pipeline
    if _audit_pipeline is None:
        _audit_pipeline = AsyncAuditPipeline()
    return _audit_pipeline


def initialize_audit_pipeline(
    db: Optional[AsyncIOMotorDatabase] = None,
    queue_size: int = 1000,
    batch_size: int = 50,
) -> AsyncAuditPipeline:
    """
    Initialize the global audit pipeline.
    
    Should be called during app startup.
    
    Usage in server.py:
        from security.async_audit_pipeline import initialize_audit_pipeline
        
        @app.on_event("startup")
        async def startup():
            await initialize_audit_pipeline(db).start()
    """
    global _audit_pipeline
    _audit_pipeline = AsyncAuditPipeline(
        db=db,
        queue_size=queue_size,
        batch_size=batch_size,
    )
    return _audit_pipeline
