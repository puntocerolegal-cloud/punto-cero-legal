from datetime import datetime, timezone
from typing import Any, Dict, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


class EnterprisePersistenceCreate(BaseModel):
    resource_type: str = Field(..., min_length=2)
    firm_id: str = Field(..., min_length=1)
    user_id: Optional[str] = None
    data: Dict[str, Any] = Field(default_factory=dict)
    metadata: Dict[str, Any] = Field(default_factory=dict)

    model_config = ConfigDict(extra="allow")

    @field_validator("resource_type")
    @classmethod
    def validate_resource_type(cls, value: str) -> str:
        normalized = value.strip().lower()
        if not normalized:
            raise ValueError("resource_type no puede estar vacío")
        return normalized


class EnterprisePersistenceUpdate(BaseModel):
    data: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(extra="allow")


class EnterprisePersistenceRecord(EnterprisePersistenceCreate):
    id: Optional[str] = None
    version: int = 1
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
