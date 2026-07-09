from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional
import os
from fastapi import HTTPException

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT Runtime Fix: Unify JWT_SECRET and SECRET_KEY into one source of truth.
# Priority: JWT_SECRET > SECRET_KEY. No hardcoded fallback.
_JWT_SECRET = os.environ.get("JWT_SECRET") or os.environ.get("SECRET_KEY")
if not _JWT_SECRET:
    raise RuntimeError(
        "FATAL: Neither JWT_SECRET nor SECRET_KEY is set in environment. "
        "JWT signing/validation cannot proceed."
    )
SECRET_KEY = _JWT_SECRET
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440


def extract_bearer_token(auth_header: Optional[str]) -> str:
    """
    Extract and validate Bearer token from Authorization header.

    CRITICAL FIX (S5.3-Finding#5): Proper Bearer token extraction with validation

    Args:
        auth_header: Authorization header value

    Returns:
        Extracted token string

    Raises:
        HTTPException: If header is invalid or malformed
    """
    if not auth_header:
        raise HTTPException(status_code=401, detail="Missing authorization header")

    parts = auth_header.split()
    if len(parts) != 2:
        raise HTTPException(status_code=401, detail="Invalid authorization header format")

    scheme, token = parts
    if scheme.lower() != "bearer":
        raise HTTPException(status_code=401, detail="Invalid authorization scheme")

    if not token or len(token) == 0:
        raise HTTPException(status_code=401, detail="Empty token")

    return token

def verify_password(plain_password: str, hashed_password: str) -> bool:
    # bcrypt sólo considera los primeros 72 bytes; truncamos para que el verify
    # sea consistente con get_password_hash y no lance ValueError con claves largas.
    return pwd_context.verify(plain_password[:72], hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password[:72])

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    # Token versioning for future compatibility
    if "v" not in to_encode:
        to_encode["v"] = 1
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_token(token: str) -> Optional[dict]:
    """
    Decode and validate JWT token.

    CRITICAL FIX (S5.3-Finding#5): Hardened token validation with detailed error tracking

    Args:
        token: JWT token string

    Returns:
        Decoded payload dict, or None if invalid
    """
    if not token or not isinstance(token, str):
        return None

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        # Verify required claims
        if "exp" not in payload:
            return None
        return payload
    except JWTError:
        return None
