"""
Adapters Package
Compatibility layers and translation adapters for architectural transitions

Contains adapters for:
- Tenant Mapping (organization_id ←→ firm_id translation)
- Legacy compatibility during gradual migrations
- API contract preservation during refactoring

These adapters enable zero-breaking-change migrations by providing
transparent translation between different architectural layers.
"""

from .tenant_mapping import TenantMapping

__all__ = [
    "TenantMapping",
]
