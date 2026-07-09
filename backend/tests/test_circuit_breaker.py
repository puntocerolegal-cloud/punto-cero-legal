"""
Test enterprise circuit breaker for external service resilience.

CRITICAL FIX (S5.3-Finding#8): Prevents cascading failures when
external services (Stripe, MercadoPago, Email, Database, Redis) become unavailable.
"""
import pytest
import asyncio
from datetime import datetime, timedelta
from utils.circuit_breaker import (
    CircuitBreaker,
    CircuitBreakerConfig,
    CircuitState,
    OpenCircuitError,
    create_stripe_breaker,
    create_mercadopago_breaker,
    create_email_breaker,
    create_database_breaker,
    create_redis_breaker,
    get_breaker,
)


@pytest.mark.asyncio
async def test_circuit_breaker_normal_operation():
    """Verify circuit breaker passes through successful calls."""
    config = CircuitBreakerConfig(name="test_success")
    cb = CircuitBreaker(config)
    
    async def successful_func(x: int, y: int) -> int:
        return x + y
    
    result = await cb.call(successful_func, (2, 3))
    assert result == 5
    assert cb.metrics.state == CircuitState.CLOSED
    assert cb.metrics.total_calls == 1
    assert cb.metrics.successful_calls == 1
    print("✓ Circuit breaker passes through successful calls")


@pytest.mark.asyncio
async def test_circuit_breaker_opens_on_failures():
    """Verify circuit breaker opens after threshold failures."""
    config = CircuitBreakerConfig(
        name="test_failure",
        failure_threshold=3,
        success_threshold=1,
        timeout_seconds=10
    )
    cb = CircuitBreaker(config)
    
    async def failing_func() -> None:
        raise Exception("Service unavailable")
    
    # Make 3 failing calls
    for i in range(3):
        try:
            await cb.call(failing_func)
        except Exception:
            pass  # Expected
    
    # Circuit should now be OPEN
    assert cb.metrics.state == CircuitState.OPEN
    assert cb.metrics.consecutive_failures == 3
    print("✓ Circuit breaker opens after threshold failures")


@pytest.mark.asyncio
async def test_circuit_breaker_rejects_when_open():
    """Verify circuit breaker rejects calls when open."""
    config = CircuitBreakerConfig(
        name="test_reject",
        failure_threshold=1,
        timeout_seconds=10
    )
    cb = CircuitBreaker(config)
    
    async def failing_func() -> None:
        raise Exception("Fail")
    
    # Trigger open state
    try:
        await cb.call(failing_func)
    except Exception:
        pass
    
    # Circuit is OPEN
    assert cb.metrics.state == CircuitState.OPEN
    
    # Next call should be rejected immediately
    with pytest.raises(OpenCircuitError):
        await cb.call(failing_func)
    
    assert cb.metrics.rejected_calls == 1
    print("✓ Circuit breaker rejects when open")


@pytest.mark.asyncio
async def test_circuit_breaker_fallback():
    """Verify fallback is used when circuit open."""
    config = CircuitBreakerConfig(
        name="test_fallback",
        failure_threshold=1,
        timeout_seconds=10
    )
    cb = CircuitBreaker(config)
    
    async def failing_func() -> str:
        raise Exception("Fail")
    
    async def fallback_func() -> str:
        return "fallback_result"
    
    # Trigger open state
    try:
        await cb.call(failing_func, fallback=fallback_func)
    except Exception:
        pass
    
    # With fallback, should return fallback result
    result = await cb.call(failing_func, fallback=fallback_func)
    assert result == "fallback_result"
    print("✓ Circuit breaker uses fallback when open")


@pytest.mark.asyncio
async def test_circuit_breaker_half_open_recovery():
    """Verify circuit breaker recovers through half-open state."""
    config = CircuitBreakerConfig(
        name="test_recovery",
        failure_threshold=1,
        success_threshold=1,
        timeout_seconds=0  # Immediate half-open
    )
    cb = CircuitBreaker(config)
    
    call_count = 0
    
    async def flaky_func() -> str:
        nonlocal call_count
        call_count += 1
        if call_count <= 1:
            raise Exception("Fail once")
        return "success"
    
    # First call fails, circuit opens
    try:
        await cb.call(flaky_func)
    except Exception:
        pass
    assert cb.metrics.state == CircuitState.OPEN
    
    # Next call transitions to half-open and succeeds
    result = await cb.call(flaky_func)
    assert result == "success"
    assert cb.metrics.state == CircuitState.CLOSED
    print("✓ Circuit breaker recovers through half-open state")


@pytest.mark.asyncio
async def test_circuit_breaker_retry_logic():
    """Verify circuit breaker retries failed calls."""
    config = CircuitBreakerConfig(
        name="test_retry",
        max_retries=2,
        retry_delay_seconds=0
    )
    cb = CircuitBreaker(config)
    
    attempt_count = 0
    
    async def eventually_succeeds() -> str:
        nonlocal attempt_count
        attempt_count += 1
        if attempt_count < 2:
            raise Exception("Try again")
        return "success"
    
    result = await cb.call(eventually_succeeds)
    assert result == "success"
    assert attempt_count == 2  # Failed once, succeeded on retry
    assert cb.metrics.successful_calls == 1
    print("✓ Circuit breaker retries on failure")


def test_circuit_breaker_metrics():
    """Verify circuit breaker collects metrics."""
    config = CircuitBreakerConfig(name="test_metrics")
    cb = CircuitBreaker(config)
    
    metrics = cb.get_metrics()
    
    assert metrics["name"] == "test_metrics"
    assert metrics["state"] == "closed"
    assert metrics["total_calls"] == 0
    assert metrics["failure_rate"] == "0.0%"
    print("✓ Circuit breaker metrics collection verified")


@pytest.mark.asyncio
async def test_stripe_breaker_config():
    """Verify Stripe circuit breaker configuration."""
    cb = create_stripe_breaker()
    
    assert cb.config.name == "stripe"
    assert cb.config.failure_threshold == 5
    assert cb.config.success_threshold == 2
    assert cb.config.timeout_seconds == 60
    assert cb.config.fallback_strategy == "cache"
    assert cb.config.max_retries == 2
    print("✓ Stripe circuit breaker configured")


@pytest.mark.asyncio
async def test_mercadopago_breaker_config():
    """Verify MercadoPago circuit breaker configuration."""
    cb = create_mercadopago_breaker()
    
    assert cb.config.name == "mercadopago"
    assert cb.config.failure_threshold == 5
    assert cb.config.fallback_strategy == "cache"
    print("✓ MercadoPago circuit breaker configured")


@pytest.mark.asyncio
async def test_email_breaker_config():
    """Verify Email circuit breaker configuration."""
    cb = create_email_breaker()
    
    assert cb.config.name == "email_service"
    assert cb.config.fallback_strategy == "queue"  # Queue fallback
    assert cb.config.timeout_seconds == 120  # Longer timeout for email
    print("✓ Email circuit breaker configured")


@pytest.mark.asyncio
async def test_database_breaker_config():
    """Verify Database circuit breaker configuration."""
    cb = create_database_breaker()
    
    assert cb.config.name == "mongodb"
    assert cb.config.failure_threshold == 3  # Stricter for critical service
    assert cb.config.timeout_seconds == 30  # Shorter timeout (critical)
    print("✓ Database circuit breaker configured")


@pytest.mark.asyncio
async def test_redis_breaker_config():
    """Verify Redis circuit breaker configuration."""
    cb = create_redis_breaker()
    
    assert cb.config.name == "redis"
    assert cb.config.fallback_strategy == "memory"  # In-memory fallback
    print("✓ Redis circuit breaker configured")


@pytest.mark.asyncio
async def test_get_breaker_singleton():
    """Verify breaker registry returns same instance."""
    cb1 = get_breaker("stripe")
    cb2 = get_breaker("stripe")
    
    assert cb1 is cb2  # Same instance
    print("✓ Circuit breaker registry maintains singleton pattern")


def test_circuit_breaker_metrics_accuracy():
    """Verify metrics accuracy."""
    config = CircuitBreakerConfig(name="test_accuracy")
    cb = CircuitBreaker(config)
    
    # Simulate calls and failures
    cb.metrics.total_calls = 100
    cb.metrics.successful_calls = 85
    cb.metrics.failed_calls = 15
    
    failure_rate = cb.metrics.failure_rate()
    assert failure_rate == 0.15
    assert f"{failure_rate:.1%}" == "15.0%"
    print("✓ Circuit breaker metrics are accurate")


@pytest.mark.asyncio
async def test_circuit_breaker_state_transitions():
    """Verify state transition history."""
    config = CircuitBreakerConfig(
        name="test_transitions",
        failure_threshold=1,
        success_threshold=1,
        timeout_seconds=0
    )
    cb = CircuitBreaker(config)
    
    async def flaky() -> str:
        if cb.metrics.total_calls == 0:
            raise Exception("Fail")
        return "ok"
    
    # Trigger CLOSED -> OPEN
    try:
        await cb.call(flaky)
    except Exception:
        pass
    
    # Trigger OPEN -> HALF_OPEN -> CLOSED
    await cb.call(flaky)
    
    # Verify transitions were recorded
    history = cb.metrics.transition_history
    assert len(history) >= 1
    assert history[0]["from"] == "closed"
    assert history[0]["to"] == "open"
    print("✓ Circuit breaker records state transitions")


@pytest.mark.asyncio
async def test_concurrent_calls_thread_safety():
    """Verify circuit breaker handles concurrent calls."""
    config = CircuitBreakerConfig(name="test_concurrent")
    cb = CircuitBreaker(config)
    
    async def slow_func(duration: float) -> str:
        await asyncio.sleep(duration)
        return "ok"
    
    # Make multiple concurrent calls
    tasks = [cb.call(slow_func, (0.01,)) for _ in range(5)]
    results = await asyncio.gather(*tasks)
    
    assert len(results) == 5
    assert all(r == "ok" for r in results)
    assert cb.metrics.total_calls == 5
    print("✓ Circuit breaker is thread-safe for concurrent calls")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
