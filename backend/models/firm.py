from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

class Firm(BaseModel):
    """Modelo de Firma - Entidad para planes Firma en Crecimiento y Consolidación Empresarial"""
    id: Optional[str] = Field(None, alias="_id")
    name: str = Field(..., min_length=1, max_length=200)
    email: str = Field(..., regex=r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = "Colombia"
    
    # Plan Information
    plan: str = Field(default="firm_growth", description="firm_growth | firm_enterprise")
    max_lawyers: int = Field(default=5, description="Número máximo de abogados permitidos")
    active_lawyers_count: int = Field(default=0, description="Número actual de abogados activos")
    
    # Owner Information
    owner_id: str = Field(..., description="ID del propietario de la firma (usuario)")
    owner_name: str = Field(...)
    owner_email: str = Field(...)
    
    # Status
    status: str = Field(default="active", description="active | suspended | inactive")
    is_verified: bool = Field(default=False)
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "name": "Firma Juridica XYZ",
                "email": "firma@example.com",
                "phone": "+57 1 2345678",
                "address": "Cra 7 #120-50",
                "city": "Bogotá",
                "country": "Colombia",
                "plan": "firm_growth",
                "max_lawyers": 5,
                "owner_id": "user123",
                "owner_name": "Juan Pérez",
                "owner_email": "juan@firma.com",
                "status": "active",
                "is_verified": True
            }
        }

class FirmCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    email: str
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = "Colombia"
    plan: str = Field(default="firm_growth")
    owner_id: str

class FirmUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    plan: Optional[str] = None
    status: Optional[str] = None
    is_verified: Optional[bool] = None

class FirmResponse(BaseModel):
    id: str
    name: str
    email: str
    plan: str
    max_lawyers: int
    active_lawyers_count: int
    owner_name: str
    owner_email: str
    status: str
    is_verified: bool
    created_at: str
    updated_at: str
