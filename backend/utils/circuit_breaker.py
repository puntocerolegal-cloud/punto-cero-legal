"""
Enterprise circuit breaker implementation for external service resilience.

CRITICAL FIX (S5.3-Finding#8): Prevents cascading failures by gracefully
degrading when external services (API, DB, Email, etc.) become unavailable.

Implements standard circuit breaker pattern with three states:
- CLOSED: Normal operation, requests pass through
- OPEN: Service failing, requests rejected immediately
- HALF-OPEN: Testing if service recovered, limited requests allowed
"""

import asyncio
import logging
import time
from enum import Enum
from typing import Callable, Any, Optional, Dict, List
from datetime import datetime, timedelta
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)


class CircuitState(Enum):
    """Circuit breaker states."""
    CLOSED = "closed"        # Normal operation
    OPEN = "open"           # Service failing, reject requests
    HALF_OPEN = "half_open" # Testing recovery


@dataclass
class CircuitBreakerConfig:
    """Configuration for circuit breaker."""
    name: str
    failure_threshold: int = 5           # Failures to trigger open state
    success_threshold: int = 2           # Successes to close from half_open
    timeout_seconds: int = 60            # Seconds before trying half_open
    fallback_strategy: str = "fail"      # "fail" or "cache" or "stub"
    max_retries: int = 1
    retry_delay_seconds: int = 1


@dataclass
class CircuitBreakerMetrics:
    """Metrics collected by circuit breaker."""
    name: str
    state: CircuitState = CircuitState.CLOSED
    total_calls: int = 0
    successful_calls: int = 0
    failed_calls: int = 0
    rejected_calls: int = 0
    consecutive_failures: int = 0
    consecutive_successes: int = 0
    last_failure_time: Optional[datetime] = None
    state_change_time: Optional[datetime] = None
    transition_history: List[Dict[str, Any]] = field(default_factory=list)
    
    def failure_rate(self) -> float:
        """Calculate failure rate (0-1)."""
        if self.total_calls == 0:
            return 0.0
        return self.failed_calls / self.total_calls


class CircuitBreaker:
    """
    Enterprise circuit breaker for resilience.
    
    Usage:
        cb = CircuitBreaker(CircuitBreakerConfig(name="stripe_api"))
        
        try:
            result = await cb.call(
                func=call_stripe_api,
                args=(amount, customer_id)
            )
        except OpenCircuitError:
            # Service unavailable, use fallback
            result = await fallback_payment_method()
    """
    
    def __init__(self, config: CircuitBreakerConfig):
        self.config = config
        self.metrics = CircuitBreakerMetrics(name=config.name)
        self._lock = asyncio.Lock()
        
    async def call(
        self,
        func: Callable,
        args: tuple = (),
        kwargs: dict = None,
        fallback: Optional[Callable] = None
    ) -> Any:
        """
        Call function through circuit breaker.
        
        CRITICAL FIX (S5.3-Finding#8): Graceful degradation
        
        Args:
            func: Async function to call
            args: Positional arguments
            kwargs: Keyword arguments
            fallback: Fallback function if circuit open
        
        Returns:
            Result from func or fallback
        
        Raises:
            OpenCircuitError: If circuit open and no fallback
            Exception: From original function
        """
        kwargs = kwargs or {}
        
        # Check circuit state
        if self.metrics.state == CircuitState.OPEN:
            # Is it time to try half-open?
            if self._should_attempt_reset():
                async with self._lock:
                    # Double-check after lock acquisition
                    if self.metrics.state == CircuitState.OPEN:
                        self._transition_to(CircuitState.HALF_OPEN)
            else:
                # Circuit still open
                self.metrics.rejected_calls += 1
                logger.warning(
                    f"[CIRCUIT_BREAKER] {self.config.name} OPEN "
                    f"(rejected). Metrics: {self.metrics.failure_rate():.1%} failure rate"
                )
                if fallback:
                    logger.info(f"[CIRCUIT_BREAKER] Using fallback for {self.config.name}")
                    return await fallback(*args, **kwargs)
                raise OpenCircuitError(f"Circuit breaker {self.config.name} is OPEN")
        
        # Call function with retry logic
        for attempt in range(self.config.max_retries + 1):
            try:
                result = await func(*args, **kwargs)
                await self._on_success()
                return result
            
            except Exception as e:
                is_last_attempt = (attempt == self.config.max_retries)
                
                if is_last_attempt:
                    await self._on_failure()
                    
                    # If in half-open and failed, go back to open
                    if self.metrics.state == CircuitState.HALF_OPEN:
                        async with self._lock:
                            self._transition_to(CircuitState.OPEN)
                    
                    if fallback:
                        logger.info(
                            f"[CIRCUIT_BREAKER] {self.config.name} failed, using fallback"
                        )
                        try:
                            return await fallback(*args, **kwargs)
                        except Exception as fb_error:
                            logger.error(
                                f"[CIRCUIT_BREAKER] Fallback also failed for {self.config.name}: {fb_error}"
                            )
                            raise
                    else:
                        raise
                else:
                    # Retry
                    logger.warning(
                        f"[CIRCUIT_BREAKER] {self.config.name} attempt {attempt+1}/{self.config.max_retries+1} failed, retrying: {e}"
                    )
                    await asyncio.sleep(self.config.retry_delay_seconds)
    
    async def _on_success(self):
        """Handle successful call."""
        async with self._lock:
            self.metrics.total_calls += 1
            self.metrics.successful_calls += 1
            self.metrics.consecutive_successes += 1
            self.metrics.consecutive_failures = 0
            
            # Try to close from half-open
            if (self.metrics.state == CircuitState.HALF_OPEN and 
                self.metrics.consecutive_successes >= self.config.success_threshold):
                self._transition_to(CircuitState.CLOSED)
                logger.info(f"[CIRCUIT_BREAKER] {self.config.name} RECOVERED, closing circuit")
    
    async def _on_failure(self):
        """Handle failed call."""
        async with self._lock:
            self.metrics.total_calls += 1
            self.metrics.failed_calls += 1
            self.metrics.consecutive_failures += 1
            self.metrics.consecutive_successes = 0
            self.metrics.last_failure_time = datetime.utcnow()
            
            # Transition to open if threshold exceeded
            if (self.metrics.consecutive_failures >= self.config.failure_threshold and
                self.metrics.state == CircuitState.CLOSED):
                self._transition_to(CircuitState.OPEN)
                logger.critical(
                    f"[CIRCUIT_BREAKER] {self.config.name} OPEN "
                    f"({self.metrics.consecutive_failures} failures)"
                )
    
    def _should_attempt_reset(self) -> bool:
        """Check if enough time has passed to try half-open."""
        if not self.metrics.last_failure_time:
            return True
        
        elapsed = (datetime.utcnow() - self.metrics.last_failure_time).total_seconds()
        return elapsed >= self.config.timeout_seconds
    
    def _transition_to(self, new_state: CircuitState):
        """Record state transition."""
        old_state = self.metrics.state
        self.metrics.state = new_state
        self.metrics.state_change_time = datetime.utcnow()
        self.metrics.transition_history.append({
            "from": old_state.value,
            "to": new_state.value,
            "timestamp": datetime.utcnow().isoformat(),
            "failure_rate": self.metrics.failure_rate()
        })
        logger.info(
            f"[CIRCUIT_BREAKER] {self.config.name} {old_state.value} → {new_state.value}"
        )
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get circuit breaker metrics."""
        return {
            "name": self.metrics.name,
            "state": self.metrics.state.value,
            "total_calls": self.metrics.total_calls,
            "successful_calls": self.metrics.successful_calls,
            "failed_calls": self.metrics.failed_calls,
            "rejected_calls": self.metrics.rejected_calls,
            "failure_rate": f"{self.metrics.failure_rate():.1%}",
            "consecutive_failures": self.metrics.consecutive_failures,
            "consecutive_successes": self.metrics.consecutive_successes,
            "last_failure": self.metrics.last_failure_time.isoformat() if self.metrics.last_failure_time else None,
            "state_since": self.metrics.state_change_time.isoformat() if self.metrics.state_change_time else None,
            "transition_count": len(self.metrics.transition_history)
        }


class OpenCircuitError(Exception):
    """Raised when circuit breaker is open and rejecting requests."""
    pass


# Pre-configured circuit breakers for critical services
def create_database_breaker() -> CircuitBreaker:
    """Circuit breaker for MongoDB with short timeout (critical service)."""
    return CircuitBreaker(CircuitBreakerConfig(
        name="mongodb",
        failure_threshold=3,
        success_threshold=1,
        timeout_seconds=30,
        max_retries=0
    ))


def create_stripe_breaker() -> CircuitBreaker:
    """Circuit breaker for Stripe with fallback to cache."""
    return CircuitBreaker(CircuitBreakerConfig(
        name="stripe",
        failure_threshold=5,
        success_threshold=2,
        timeout_seconds=60,
        fallback_strategy="cache",
        max_retries=2
    ))


def create_mercadopago_breaker() -> CircuitBreaker:
    """Circuit breaker for MercadoPago payment gateway."""
    return CircuitBreaker(CircuitBreakerConfig(
        name="mercadopago",
        failure_threshold=5,
        success_threshold=2,
        timeout_seconds=60,
        fallback_strategy="cache",
        max_retries=2
    ))


def create_email_breaker() -> CircuitBreaker:
    """Circuit breaker for email service with async queue fallback."""
    return CircuitBreaker(CircuitBreakerConfig(
        name="email_service",
        failure_threshold=10,
        success_threshold=5,
        timeout_seconds=120,
        fallback_strategy="queue",
        max_retries=1
    ))


def create_redis_breaker() -> CircuitBreaker:
    """Circuit breaker for Redis cache with in-memory fallback."""
    return CircuitBreaker(CircuitBreakerConfig(
        name="redis",
        failure_threshold=5,
        success_threshold=3,
        timeout_seconds=45,
        fallback_strategy="memory",
        max_retries=1
    ))


# Global registry of circuit breakers
_breakers: Dict[str, CircuitBreaker] = {}


def get_breaker(service: str) -> CircuitBreaker:
    """Get or create circuit breaker for service."""
    if service not in _breakers:
        if service == "mongodb":
            _breakers[service] = create_database_breaker()
        elif service == "stripe":
            _breakers[service] = create_stripe_breaker()
        elif service == "mercadopago":
            _breakers[service] = create_mercadopago_breaker()
        elif service == "email":
            _breakers[service] = create_email_breaker()
        elif service == "redis":
            _breakers[service] = create_redis_breaker()
        else:
            raise ValueError(f"Unknown service: {service}")
    return _breakers[service]


def get_all_metrics() -> Dict[str, Dict[str, Any]]:
    """Get metrics from all circuit breakers."""
    return {
        name: breaker.get_metrics()
        for name, breaker in _breakers.items()
    }
