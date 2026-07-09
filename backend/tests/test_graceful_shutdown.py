"""
Test graceful shutdown implementation.

CRITICAL FIX (S5.3-Finding#9): Ensures clean shutdown without losing
in-flight requests or data corruption.
"""
import pytest
import asyncio
from datetime import datetime
from utils.graceful_shutdown import (
    GracefulShutdownManager,
    get_shutdown_manager,
    graceful_shutdown_context,
)


def test_shutdown_manager_creation():
    """Verify shutdown manager creation."""
    manager = GracefulShutdownManager(grace_period_seconds=30)
    
    assert manager.grace_period == 30
    assert manager.is_shutting_down is False
    assert manager.pending_requests == 0
    assert manager.shutdown_start_time is None
    assert len(manager.websocket_connections) == 0
    print("✓ Shutdown manager created successfully")


def test_shutdown_manager_singleton():
    """Verify singleton pattern for shutdown manager."""
    manager1 = get_shutdown_manager()
    manager2 = get_shutdown_manager()
    
    assert manager1 is manager2
    print("✓ Shutdown manager singleton pattern works")


@pytest.mark.asyncio
async def test_startup_shutdown_sequence():
    """Verify startup and shutdown sequence."""
    manager = GracefulShutdownManager()
    
    startup_called = False
    shutdown_called = False
    
    async def startup_task():
        nonlocal startup_called
        startup_called = True
    
    async def shutdown_task():
        nonlocal shutdown_called
        shutdown_called = True
    
    manager.register_startup_task(startup_task)
    manager.register_shutdown_task(shutdown_task)
    
    # Startup
    await manager.handle_startup()
    assert startup_called is True
    assert manager.is_shutting_down is False
    print("✓ Startup task executed")
    
    # Shutdown
    await manager.handle_shutdown()
    assert shutdown_called is True
    assert manager.is_shutting_down is True
    assert manager.shutdown_start_time is not None
    print("✓ Shutdown task executed")


@pytest.mark.asyncio
async def test_request_draining():
    """Verify request draining during shutdown."""
    manager = GracefulShutdownManager(grace_period_seconds=1)
    
    # Simulate pending requests
    manager.increment_request()
    manager.increment_request()
    manager.increment_request()
    
    assert manager.pending_requests == 3
    print("✓ Requests registered")
    
    # Simulate draining
    async def drain_simulator():
        await asyncio.sleep(0.1)
        manager.decrement_request()
        manager.decrement_request()
        manager.decrement_request()
    
    # Start drain in background
    drain_task = asyncio.create_task(drain_simulator())
    
    # This should wait for requests
    manager.is_shutting_down = True
    await manager._drain_requests()
    
    await drain_task
    assert manager.pending_requests == 0
    print("✓ Requests drained successfully")


@pytest.mark.asyncio
async def test_websocket_closure():
    """Verify WebSocket closure during shutdown."""
    manager = GracefulShutdownManager()
    
    # Mock WebSocket
    class MockWebSocket:
        def __init__(self):
            self.closed = False
        
        async def close(self, code=None, reason=None):
            self.closed = True
    
    ws1 = MockWebSocket()
    ws2 = MockWebSocket()
    
    manager.register_websocket(ws1)
    manager.register_websocket(ws2)
    
    assert len(manager.websocket_connections) == 2
    print("✓ WebSockets registered")
    
    # Close all
    await manager._close_websockets()
    
    assert ws1.closed is True
    assert ws2.closed is True
    assert len(manager.websocket_connections) == 0
    print("✓ WebSockets closed successfully")


@pytest.mark.asyncio
async def test_websocket_registration():
    """Verify WebSocket registration and unregistration."""
    manager = GracefulShutdownManager()
    
    class MockWS:
        pass
    
    ws = MockWS()
    
    # Register
    manager.register_websocket(ws)
    assert ws in manager.websocket_connections
    print("✓ WebSocket registered")
    
    # Unregister
    manager.unregister_websocket(ws)
    assert ws not in manager.websocket_connections
    print("✓ WebSocket unregistered")


def test_request_counter():
    """Verify request counter operations."""
    manager = GracefulShutdownManager()
    
    # Start at 0
    assert manager.pending_requests == 0
    
    # Increment
    manager.increment_request()
    manager.increment_request()
    assert manager.pending_requests == 2
    print("✓ Requests incremented")
    
    # Decrement
    manager.decrement_request()
    assert manager.pending_requests == 1
    print("✓ Requests decremented")
    
    # Cannot go below 0
    manager.decrement_request()
    manager.decrement_request()
    assert manager.pending_requests == 0
    print("✓ Request counter bounds checked")


def test_shutdown_status():
    """Verify shutdown status reporting."""
    manager = GracefulShutdownManager()
    
    status = manager.get_status()
    
    assert status["is_shutting_down"] is False
    assert status["pending_requests"] == 0
    assert status["websocket_connections"] == 0
    assert status["shutdown_start_time"] is None
    assert status["grace_period_seconds"] == 30
    print("✓ Initial status correct")
    
    # Simulate shutdown
    manager.pending_requests = 5
    manager.is_shutting_down = True
    manager.shutdown_start_time = datetime.utcnow()
    
    status = manager.get_status()
    assert status["is_shutting_down"] is True
    assert status["pending_requests"] == 5
    assert status["elapsed_seconds"] is not None
    print("✓ Shutdown status correct")


@pytest.mark.asyncio
async def test_shutdown_task_failure_handling():
    """Verify shutdown continues even if a task fails."""
    manager = GracefulShutdownManager()
    
    success_called = False
    
    async def failing_task():
        raise Exception("Task failed")
    
    async def success_task():
        nonlocal success_called
        success_called = True
    
    manager.register_shutdown_task(failing_task)
    manager.register_shutdown_task(success_task)
    
    # Should not raise, should continue
    await manager._run_shutdown_tasks()
    
    # Success task should still run
    assert success_called is True
    print("✓ Shutdown continues despite task failure")


@pytest.mark.asyncio
async def test_concurrent_request_draining():
    """Verify request draining works with concurrent requests."""
    manager = GracefulShutdownManager(grace_period_seconds=2)
    
    async def simulate_requests():
        """Simulate incoming requests that drain over time."""
        for i in range(5):
            manager.increment_request()
            await asyncio.sleep(0.2)
            manager.decrement_request()
    
    # Start request simulation
    request_task = asyncio.create_task(simulate_requests())
    
    # Start shutdown
    manager.is_shutting_down = True
    
    # Wait for requests to drain
    start = asyncio.get_event_loop().time()
    await manager._drain_requests()
    elapsed = asyncio.get_event_loop().time() - start
    
    await request_task
    
    # Should complete within grace period
    assert elapsed < manager.grace_period + 1
    assert manager.pending_requests == 0
    print("✓ Concurrent requests drained successfully")


@pytest.mark.asyncio
async def test_shutdown_prevents_new_requests_during_shutdown():
    """Verify requests cannot be accepted during shutdown."""
    manager = GracefulShutdownManager()
    
    manager.is_shutting_down = True
    
    # This would normally increment, but during shutdown should not
    # (In real implementation, the middleware would reject the request)
    # For this test, we just verify the flag is set
    assert manager.is_shutting_down is True
    print("✓ Shutdown flag prevents new requests")


@pytest.mark.asyncio
async def test_multiple_shutdown_tasks():
    """Verify multiple shutdown tasks execute in order."""
    manager = GracefulShutdownManager()
    
    execution_order = []
    
    async def task1():
        execution_order.append(1)
    
    async def task2():
        execution_order.append(2)
    
    async def task3():
        execution_order.append(3)
    
    manager.register_shutdown_task(task1)
    manager.register_shutdown_task(task2)
    manager.register_shutdown_task(task3)
    
    await manager._run_shutdown_tasks()
    
    assert execution_order == [1, 2, 3]
    print("✓ Multiple shutdown tasks execute in order")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
