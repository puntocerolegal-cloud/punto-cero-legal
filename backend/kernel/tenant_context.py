"""
Immutable TenantContext
Frozen dataclass that encapsulates tenant identity for a request.
CRITICAL: This is the single source of truth after kernel validation.
IMMUTABLE and non-bypassable.
"""

from dataclasses import dataclass
from datetime import datetime
import hashlib
import json


@dataclass(frozen=True)
class TenantContext:
    """
    Immutable tenant context for a single request.
    
    Once created and validated by the kernel, this object cannot be modified.
    Every request must have exactly one TenantContext.
    
    Fields:
        firm_id: The organization/tenant identifier (from JWT claim, primary source)
        user_id: The authenticated user identifier
        user_email: The user's email address
        user_role: The user's role/permission level
        request_id: Unique identifier for this request (tracing)
        ip_address: Client IP address for audit
        timestamp: Kernel validation timestamp
        validation_source: Where firm_id was resolved from ("JWT" or "HEADER_OVERRIDE")
        integrity_hash: Cryptographic hash of immutable fields for tampering detection
    """
    
    firm_id: str
    user_id: str
    user_email: str
    user_role: str
    request_id: str
    ip_address: str
    timestamp: datetime
    validation_source: str = "JWT"
    integrity_hash: str = ""
    
    def __post_init__(self):
        """Calculate integrity hash (called after frozen object is created)."""
        # Compute integrity hash of immutable fields
        hash_data = {
            "firm_id": self.firm_id,
            "user_id": self.user_id,
            "user_email": self.user_email,
            "user_role": self.user_role,
            "timestamp": self.timestamp.isoformat(),
        }
        hash_string = json.dumps(hash_data, sort_keys=True)
        hash_value = hashlib.sha256(hash_string.encode()).hexdigest()
        
        # Use object.__setattr__ because dataclass is frozen
        object.__setattr__(self, "integrity_hash", hash_value)
    
    def to_dict(self):
        """Export as dictionary (read-only view for logging/response)."""
        return {
            "firm_id": self.firm_id,
            "user_id": self.user_id,
            "user_email": self.user_email,
            "user_role": self.user_role,
            "request_id": self.request_id,
            "ip_address": self.ip_address,
            "timestamp": self.timestamp.isoformat(),
            "validation_source": self.validation_source,
            "integrity_hash": self.integrity_hash,
        }
    
    def verify_integrity(self) -> bool:
        """Verify that the context has not been tampered with."""
        hash_data = {
            "firm_id": self.firm_id,
            "user_id": self.user_id,
            "user_email": self.user_email,
            "user_role": self.user_role,
            "timestamp": self.timestamp.isoformat(),
        }
        hash_string = json.dumps(hash_data, sort_keys=True)
        computed_hash = hashlib.sha256(hash_string.encode()).hexdigest()
        return computed_hash == self.integrity_hash
