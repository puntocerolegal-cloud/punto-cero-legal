"""
Test JWT Bearer token extraction and validation hardening.

CRITICAL FIX (S5.3-Finding#5): Proper Bearer token extraction prevents injection attacks
and ensures all tokens are properly validated before processing.
"""
import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient
import time
from datetime import datetime, timedelta


def test_extract_bearer_token_valid():
    """Verify valid Bearer token is extracted correctly."""
    from utils.auth import extract_bearer_token
    
    token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0QGV4YW1wbGUuY29tIn0.signature"
    auth_header = f"Bearer {token}"
    
    extracted = extract_bearer_token(auth_header)
    assert extracted == token
    print("✓ Valid Bearer token extracted")


def test_extract_bearer_token_missing_header():
    """Verify missing Authorization header raises 401."""
    from utils.auth import extract_bearer_token
    
    with pytest.raises(HTTPException) as exc_info:
        extract_bearer_token(None)
    
    assert exc_info.value.status_code == 401
    assert "Missing authorization header" in exc_info.value.detail
    print("✓ Missing header raises 401")


def test_extract_bearer_token_empty_string():
    """Verify empty Authorization header raises 401."""
    from utils.auth import extract_bearer_token
    
    with pytest.raises(HTTPException) as exc_info:
        extract_bearer_token("")
    
    assert exc_info.value.status_code == 401
    print("✓ Empty header raises 401")


def test_extract_bearer_token_invalid_scheme():
    """Verify invalid scheme (not 'Bearer') raises 401."""
    from utils.auth import extract_bearer_token
    
    # Test with Basic scheme
    with pytest.raises(HTTPException) as exc_info:
        extract_bearer_token("Basic dXNlcjpwYXNz")
    
    assert exc_info.value.status_code == 401
    assert "Invalid authorization scheme" in exc_info.value.detail
    print("✓ Invalid scheme (Basic) raises 401")


def test_extract_bearer_token_malformed_no_space():
    """Verify malformed header (no space) raises 401."""
    from utils.auth import extract_bearer_token
    
    with pytest.raises(HTTPException) as exc_info:
        extract_bearer_token("BearerToken123")
    
    assert exc_info.value.status_code == 401
    assert "Invalid authorization header format" in exc_info.value.detail
    print("✓ Malformed header (no space) raises 401")


def test_extract_bearer_token_too_many_parts():
    """Verify header with too many parts raises 401."""
    from utils.auth import extract_bearer_token
    
    with pytest.raises(HTTPException) as exc_info:
        extract_bearer_token("Bearer token extra stuff")
    
    assert exc_info.value.status_code == 401
    assert "Invalid authorization header format" in exc_info.value.detail
    print("✓ Header with extra parts raises 401")


def test_extract_bearer_token_empty_token():
    """Verify empty token string raises 401."""
    from utils.auth import extract_bearer_token
    
    with pytest.raises(HTTPException) as exc_info:
        extract_bearer_token("Bearer ")
    
    assert exc_info.value.status_code == 401
    assert "Empty token" in exc_info.value.detail
    print("✓ Empty token raises 401")


def test_extract_bearer_token_case_insensitive_scheme():
    """Verify Bearer scheme is case-insensitive."""
    from utils.auth import extract_bearer_token
    
    token = "validtoken123"
    
    # Test lowercase
    extracted = extract_bearer_token(f"bearer {token}")
    assert extracted == token
    print("✓ Lowercase 'bearer' accepted")
    
    # Test mixed case
    extracted = extract_bearer_token(f"BeArEr {token}")
    assert extracted == token
    print("✓ Mixed case 'BeArEr' accepted")


def test_decode_token_valid():
    """Verify valid JWT token is decoded correctly."""
    from utils.auth import create_access_token, decode_token
    
    data = {"sub": "test@example.com", "role": "user"}
    token = create_access_token(data)
    
    payload = decode_token(token)
    assert payload is not None
    assert payload["sub"] == "test@example.com"
    assert payload["role"] == "user"
    print("✓ Valid token decoded correctly")


def test_decode_token_invalid():
    """Verify invalid token returns None."""
    from utils.auth import decode_token
    
    invalid_token = "not.a.valid.jwt.token"
    payload = decode_token(invalid_token)
    
    assert payload is None
    print("✓ Invalid token returns None")


def test_decode_token_empty():
    """Verify empty token returns None."""
    from utils.auth import decode_token
    
    payload = decode_token("")
    assert payload is None
    print("✓ Empty token returns None")


def test_decode_token_none():
    """Verify None token returns None."""
    from utils.auth import decode_token
    
    payload = decode_token(None)
    assert payload is None
    print("✓ None token returns None")


def test_decode_token_malformed():
    """Verify malformed token returns None."""
    from utils.auth import decode_token
    
    # Missing parts
    payload = decode_token("header.payload")
    assert payload is None
    print("✓ Malformed token returns None")


def test_decode_token_tampered():
    """Verify tampered token returns None."""
    from utils.auth import create_access_token, decode_token
    
    data = {"sub": "test@example.com"}
    token = create_access_token(data)
    
    # Tamper with token
    parts = token.split(".")
    tampered = f"{parts[0]}.{parts[1]}.tampered_signature"
    
    payload = decode_token(tampered)
    assert payload is None
    print("✓ Tampered token returns None")


@pytest.mark.asyncio
async def test_login_with_proper_token_validation():
    """Verify login endpoint validates tokens properly."""
    from server import app
    
    client = TestClient(app)
    
    # Register a user
    register_payload = {
        "email": f"test_jwt_{int(time.time())}@example.com",
        "password": "SecurePass123!",
        "name": "JWT Test User"
    }
    register_response = client.post("/api/auth/register", json=register_payload)
    assert register_response.status_code == 201
    print("✓ User registered")
    
    # Login to get token
    login_payload = {
        "email": register_payload["email"],
        "password": register_payload["password"]
    }
    login_response = client.post("/api/auth/login", json=login_payload)
    assert login_response.status_code == 200
    token = login_response.json().get("access_token")
    assert token is not None
    print(f"✓ Login successful, token received")
    
    # Use token with proper Bearer scheme
    headers = {"Authorization": f"Bearer {token}"}
    me_response = client.get("/api/auth/me", headers=headers)
    assert me_response.status_code == 200
    print("✓ /me endpoint accepts proper Bearer token")


@pytest.mark.asyncio
async def test_auth_header_injection_attempts():
    """Verify injection attempts in Authorization header are rejected."""
    from server import app
    
    client = TestClient(app)
    
    injection_attempts = [
        # Missing Bearer
        "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0In0.sig",
        # Extra spaces
        "Bearer  eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0In0.sig  ",
        # Case variation with garbage
        "bearer eyJhbGciOiJIUzI1NiJ9 garbage",
        # Multiple Bearer
        "Bearer Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0In0.sig",
    ]
    
    for bad_header in injection_attempts:
        response = client.get("/api/auth/me", headers={"Authorization": bad_header})
        assert response.status_code in (401, 400), f"Injection not rejected: {bad_header}"
        print(f"✓ Injection attempt rejected: {bad_header[:50]}...")


@pytest.mark.asyncio
async def test_missing_authorization_header():
    """Verify missing Authorization header returns 401."""
    from server import app
    
    client = TestClient(app)
    
    # Request without Authorization header
    response = client.get("/api/auth/me")
    assert response.status_code == 401
    assert "authorization header" in response.json().get("detail", "").lower()
    print("✓ Missing Authorization header returns 401")


@pytest.mark.asyncio
async def test_expired_token_rejection():
    """Verify expired tokens are rejected."""
    from server import app
    from utils.auth import jwt, SECRET_KEY, ALGORITHM
    import os
    
    client = TestClient(app)
    
    # Create an already-expired token
    expired_data = {
        "sub": "test@example.com",
        "exp": datetime.utcnow() - timedelta(hours=1)
    }
    expired_token = jwt.encode(expired_data, SECRET_KEY, algorithm=ALGORITHM)
    
    # Try to use expired token
    headers = {"Authorization": f"Bearer {expired_token}"}
    response = client.get("/api/auth/me", headers=headers)
    assert response.status_code == 401
    assert "expirado" in response.json().get("detail", "").lower() or "expired" in response.json().get("detail", "").lower()
    print("✓ Expired token rejected")


def test_token_format_validation():
    """Verify token format is validated in decode_token."""
    from utils.auth import decode_token
    
    # Non-string types should be rejected
    payload = decode_token(12345)
    assert payload is None
    print("✓ Non-string token rejected")
    
    payload = decode_token([])
    assert payload is None
    print("✓ List token rejected")
    
    payload = decode_token({})
    assert payload is None
    print("✓ Dict token rejected")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
