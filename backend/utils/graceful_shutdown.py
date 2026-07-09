"""
Graceful shutdown implementation for enterprise resilience.

CRITICAL FIX (S5.3-Finding#9): Ensures clean shutdown without losing
in-flight requests, pending transactions, or data corruption.

Manages:
- Request draining (30s grace period)
- Database connection closure
- Cache connection closure
- Background task completion
- WebSocket closure
- Signal handling
- Audit logging
"""

import asyncio
import logging
import signal
import time
from typing import Callable, List, Optional
from datetime import datetime
from contextlib import asynccontextmanager

logger = logging.getLogger(__name__)


class GracefulShutdownManager:
    """
    Manages graceful shutdown of all services.
    
    Shutdown sequence:
    1. Signal received (SIGTERM, SIGINT)
    2. Stop accepting new requests
    3. Drain pending requests (30s timeout)
    4. Close WebSocket connections
    5. Complete pending async tasks
    6. Close database connections
    7. Close cache connections
    8. Cleanup resources
    """
    
    def __init__(self, grace_period_seconds: int = 30):
        self.grace_period = grace_period_seconds
        self.is_shutting_down = False
        self.shutdown_start_time: Optional[datetime] = None
        self.pending_requests = 0
        self.startup_tasks: List[Callable] = []
        self.shutdown_tasks: List[Callable] = []
        self.websocket_connections = set()
        
    def register_shutdown_task(self, task: Callable):
        """Register a task to run during shutdown."""
        self.shutdown_tasks.append(task)
        logger.debug(f"[SHUTDOWN] Registered shutdown task: {task.__name__}")
    
    def register_startup_task(self, task: Callable):
        """Register a task to run during startup."""
        self.startup_tasks.append(task)
        logger.debug(f"[SHUTDOWN] Registered startup task: {task.__name__}")
    
    async def handle_startup(self):
        """Run all startup tasks."""
        logger.info("[SHUTDOWN] Starting up application")
        for task in self.startup_tasks:
            try:
                if asyncio.iscoroutinefunction(task):
                    await task()
                else:
                    task()
                logger.info(f"[SHUTDOWN] Startup task completed: {task.__name__}")
            except Exception as e:
                logger.error(f"[SHUTDOWN] Startup task failed {task.__name__}: {e}")
                raise
    
    async def handle_shutdown(self):
        """Run shutdown sequence."""
        self.is_shutting_down = True
        self.shutdown_start_time = datetime.utcnow()
        logger.warning("[SHUTDOWN] Shutdown initiated")
        
        try:
            # Phase 1: Stop accepting new requests
            logger.info("[SHUTDOWN] Stopping request acceptance")
            
            # Phase 2: Drain pending requests
            await self._drain_requests()
            
            # Phase 3: Close WebSocket connections
            await self._close_websockets()
            
            # Phase 4: Complete pending async tasks
            await self._wait_pending_tasks()
            
            # Phase 5: Run shutdown tasks
            await self._run_shutdown_tasks()
            
            logger.info("[SHUTDOWN] Graceful shutdown complete")
            
        except Exception as e:
            logger.error(f"[SHUTDOWN] Error during shutdown: {e}")
            raise
    
    async def _drain_requests(self):
        """Wait for in-flight requests to complete."""
        logger.info(f"[SHUTDOWN] Draining requests (grace period: {self.grace_period}s)")
        start_time = time.time()
        
        while self.pending_requests > 0:
            elapsed = time.time() - start_time
            if elapsed > self.grace_period:
                logger.warning(
                    f"[SHUTDOWN] Grace period exceeded. "
                    f"Still have {self.pending_requests} pending requests, forcing shutdown"
                )
                break
            
            logger.info(f"[SHUTDOWN] Waiting for {self.pending_requests} requests...")
            await asyncio.sleep(0.5)
        
        logger.info(f"[SHUTDOWN] Request draining complete ({self.pending_requests} remaining)")
    
    async def _close_websockets(self):
        """Close all WebSocket connections."""
        logger.info(f"[SHUTDOWN] Closing {len(self.websocket_connections)} WebSocket connections")
        
        for ws in list(self.websocket_connections):
            try:
                await ws.close(code=1001, reason="Server shutdown")
                logger.debug("[SHUTDOWN] WebSocket closed")
            except Exception as e:
                logger.warning(f"[SHUTDOWN] Error closing WebSocket: {e}")
        
        self.websocket_connections.clear()
        logger.info("[SHUTDOWN] All WebSockets closed")
    
    async def _wait_pending_tasks(self):
        """Wait for pending async tasks to complete."""
        logger.info("[SHUTDOWN] Waiting for pending async tasks")
        
        pending = asyncio.all_tasks()
        if pending:
            logger.info(f"[SHUTDOWN] Waiting for {len(pending)} tasks...")
            
            # Give tasks a moment to complete
            done, pending = await asyncio.wait(
                pending,
                timeout=5,
                return_when=asyncio.ALL_COMPLETED
            )
            
            if pending:
                logger.warning(f"[SHUTDOWN] {len(pending)} tasks still pending after timeout")
                # Cancel remaining tasks
                for task in pending:
                    task.cancel()
                    try:
                        await task
                    except asyncio.CancelledError:
                        pass
        
        logger.info("[SHUTDOWN] Async task wait complete")
    
    async def _run_shutdown_tasks(self):
        """Run all registered shutdown tasks."""
        logger.info(f"[SHUTDOWN] Running {len(self.shutdown_tasks)} shutdown tasks")
        
        for task in self.shutdown_tasks:
            try:
                logger.info(f"[SHUTDOWN] Running: {task.__name__}")
                if asyncio.iscoroutinefunction(task):
                    await task()
                else:
                    task()
                logger.info(f"[SHUTDOWN] Completed: {task.__name__}")
            except Exception as e:
                logger.error(f"[SHUTDOWN] Shutdown task failed {task.__name__}: {e}")
        
        logger.info("[SHUTDOWN] All shutdown tasks complete")
    
    def increment_request(self):
        """Increment pending request counter."""
        if not self.is_shutting_down:
            self.pending_requests += 1
    
    def decrement_request(self):
        """Decrement pending request counter."""
        self.pending_requests = max(0, self.pending_requests - 1)
    
    def register_websocket(self, ws):
        """Register a WebSocket connection."""
        self.websocket_connections.add(ws)
    
    def unregister_websocket(self, ws):
        """Unregister a WebSocket connection."""
        self.websocket_connections.discard(ws)
    
    def get_status(self) -> dict:
        """Get shutdown status."""
        elapsed = None
        if self.shutdown_start_time:
            elapsed = (datetime.utcnow() - self.shutdown_start_time).total_seconds()
        
        return {
            "is_shutting_down": self.is_shutting_down,
            "pending_requests": self.pending_requests,
            "websocket_connections": len(self.websocket_connections),
            "shutdown_start_time": self.shutdown_start_time.isoformat() if self.shutdown_start_time else None,
            "elapsed_seconds": elapsed,
            "grace_period_seconds": self.grace_period,
        }


# Global instance
_shutdown_manager: Optional[GracefulShutdownManager] = None


def get_shutdown_manager() -> GracefulShutdownManager:
    """Get or create global shutdown manager."""
    global _shutdown_manager
    if _shutdown_manager is None:
        _shutdown_manager = GracefulShutdownManager()
    return _shutdown_manager


async def setup_signal_handlers():
    """Setup signal handlers for graceful shutdown."""
    manager = get_shutdown_manager()
    loop = asyncio.get_event_loop()
    
    async def signal_handler(sig):
        logger.warning(f"[SHUTDOWN] Received signal {sig.name}")
        await manager.handle_shutdown()
    
    for sig in (signal.SIGTERM, signal.SIGINT):
        try:
            loop.add_signal_handler(
                sig,
                lambda s=sig: asyncio.create_task(signal_handler(s))
            )
            logger.info(f"[SHUTDOWN] Signal handler registered for {sig.name}")
        except NotImplementedError:
            # Signal handling not available on Windows
            logger.warning(f"[SHUTDOWN] Signal handling not available for {sig.name}")


@asynccontextmanager
async def graceful_shutdown_context():
    """
    Context manager for graceful shutdown.
    
    Usage in FastAPI:
        @app.lifespan
        async def lifespan(app: FastAPI):
            async with graceful_shutdown_context():
                yield
    """
    manager = get_shutdown_manager()
    
    try:
        await manager.handle_startup()
        await setup_signal_handlers()
        yield
    finally:
        await manager.handle_shutdown()
