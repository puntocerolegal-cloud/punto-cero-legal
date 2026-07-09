from pydantic import BaseModel, EmailStr, Field, GetJsonSchemaHandler, field_validator
from pydantic.json_schema import JsonSchemaValue
from typing import Optional, Literal, Annotated, Any
from datetime import datetime, timedelta
from bson import ObjectId

class PyObjectId(ObjectId):
    """Custom type for BSON ObjectId in Pydantic v2"""
    @classmethod
    def __get_pydantic_json_schema__(
        cls, schema: JsonSchemaValue, handler: GetJsonSchemaHandler
    ) -> JsonSchemaValue:
        json_schema = handler(schema)
        json_schema = handler.resolve_ref_schema(json_schema)
        json_schema['type'] = 'string'
        return json_schema

    @classmethod
    def __get_pydantic_core_schema__(cls, source_type: Any, handler):
        from pydantic_core import core_schema
        return core_schema.no_info_after_validator_function(
            lambda x: cls.validate(x),
            core_schema.str_schema(),
        )

    @classmethod
    def validate(cls, v):
        if isinstance(v, ObjectId):
            return v
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: Literal[
        "admin", "admin_general", "socio_comercial", "lawyer", "client",
        "firm_owner", "firm_admin", "firm_lawyer",
        "partner", "senior_lawyer", "paralegal", "assistant", "finance", "hr"
    ]
    phone: Optional[str] = None
    country: Optional[str] = None
    specialty: Optional[str] = None
    bar_number: Optional[str] = None
    firm_name: Optional[str] = None
    id_document: Optional[str] = None
    status: Literal["active", "inactive", "suspended", "PENDING_VERIFICATION", "PENDING_ACTIVATION", "ACTIVE"] = "PENDING_VERIFICATION"
    is_verified: bool = False
    organizationId: Optional[str] = None  # FASE 1: soporte para abogados asociados a firmas
    firm_id: Optional[str] = None  # FASE 1: Firm OS - Relación con firma (nueva)

    # Activation fields for firm_owner
    activation_token: Optional[str] = Field(None, description="Token para activar cuenta")
    activation_expires_at: Optional[datetime] = Field(None, description="Expiración del token de activación")
    activated_at: Optional[datetime] = Field(None, description="Fecha de activación")

    # RBAC fields for Firm OS
    permissions: Optional[list] = Field(default_factory=list, description="Permisos específicos del usuario")

class UserCreate(UserBase):
    password: str = Field(..., min_length=8, description="Mínimo 8 caracteres")

class User(UserBase):
    id: str = Field(default_factory=lambda: str(ObjectId()), alias="_id")
    password_hash: str
    subscription_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserActivateAccount(BaseModel):
    token: str
    password: str = Field(..., min_length=8, description="Mínimo 8 caracteres con mayúscula y número")

class UserResponse(UserBase):
    id: str
    subscription_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
