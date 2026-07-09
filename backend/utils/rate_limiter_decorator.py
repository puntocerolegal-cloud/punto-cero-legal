"""
Enterprise rate limiting decorator for FastAPI endpoints.

CRITICAL FIX (S5.3-Finding#9): Prevents brute-force attacks on public endpoints
"""
from functools import wraps
from fastapi import HTTPException, Request
import time
from typing import Callable, Optional

# In-memory rate limiting store (IP -> {timestamp: count})
_rate_limit_store = {}
_store_cleanup_interval = 3600  # Cleanup every hour
_last_cleanup = time.time()

def cleanup_expired_entries():
    """Remove old entries from rate limit store to prevent memory leaks."""
    global _last_cleanup
    now = time.time()
    if now - _last_cleanup > _store_cleanup_interval:
        threshold = now - 3600  # Keep 1 hour of history
        _rate_limit_store.clear()  # Simple cleanup: clear all (rate resets hourly)
        _last_cleanup = now

def get_rate_limit_key(request: Request) -> str:
    """Extract client IP from request."""
    # Support forwarded headers (X-Forwarded-For, X-Real-IP)
    if "x-forwarded-for" in request.headers:
        return request.headers["x-forwarded-for"].split(",")[0].strip()
    elif "x-real-ip" in request.headers:
        return request.headers["x-real-ip"]
    elif request.client:
        return request.client.host
    return "unknown"

def rate_limit(max_requests: int = 10, window_seconds: int = 60) -> Callable:
    """
    Rate limiting decorator for FastAPI endpoints.
    
    Usage:
        @router.post("/endpoint")
        @rate_limit(max_requests=5, window_seconds=60)
        async def my_endpoint():
            ...
    
    Args:
        max_requests: Maximum requests allowed in time window
        window_seconds: Time window in seconds
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            cleanup_expired_entries()
            
            # Find request object in args/kwargs
            request = None
            for arg in args:
                if isinstance(arg, Request):
                    request = arg
                    break
            if not request and "request" in kwargs:
                request = kwargs["request"]
            
            # If no request found, skip rate limiting (internal calls)
            if not request:
                return await func(*args, **kwargs)
            
            # Get client identifier
            client_id = get_rate_limit_key(request)
            now = time.time()
            window_start = now - window_seconds
            
            # Initialize or get client record
            if client_id not in _rate_limit_store:
                _rate_limit_store[client_id] = []
            
            # Clean old timestamps from client record
            _rate_limit_store[client_id] = [
                ts for ts in _rate_limit_store[client_id]
                if ts > window_start
            ]
            
            # Check rate limit
            if len(_rate_limit_store[client_id]) >= max_requests:
                raise HTTPException(
                    status_code=429,
                    detail=f"Too many requests. Maximum {max_requests} requests per {window_seconds} seconds allowed."
                )
            
            # Record this request
            _rate_limit_store[client_id].append(now)
            
            # Call original function
            return await func(*args, **kwargs)
        
        return wrapper
    return decorator
