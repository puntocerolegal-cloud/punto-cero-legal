from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class PracticeArea(BaseModel):
    """Áreas de práctica disponibles"""
    id: str
    name: str
    description: Optional[str] = None


class FirmConfigurationData(BaseModel):
    """Datos de configuración corporativa"""
    commercial_name: Optional[str] = Field(None, description="Nombre comercial")
    description: Optional[str] = Field(None, description="Descripción de la firma")
    website: Optional[str] = Field(None, description="Sitio web")
    phone: Optional[str] = Field(None, description="Teléfono corporativo")
    
    # Identidad
    logo_url: Optional[str] = Field(None, description="URL del logo")
    primary_color: Optional[str] = Field(None, description="Color primario (hex)")
    secondary_color: Optional[str] = Field(None, description="Color secundario (hex)")
    cover_image_url: Optional[str] = Field(None, description="Imagen de portada")
    
    # Áreas de práctica
    practice_areas: List[str] = Field(default_factory=list, description="IDs de áreas de práctica seleccionadas")


class LawyerInvitation(BaseModel):
    """Invitación para abogado"""
    email: str = Field(..., description="Email del abogado")
    full_name: str = Field(..., description="Nombre completo")
    role: str = Field(default="firm_lawyer", description="firm_lawyer | firm_admin")


class FirmConfiguration(BaseModel):
    """Configuración completa de Firm OS"""
    id: Optional[str] = Field(None, alias="_id")
    firm_id: str = Field(..., description="ID de la firma")
    
    # Paso 1: Datos corporativos
    commercial_name: Optional[str] = None
    description: Optional[str] = None
    website: Optional[str] = None
    phone: Optional[str] = None
    
    # Paso 2: Identidad
    logo_url: Optional[str] = None
    primary_color: Optional[str] = None
    secondary_color: Optional[str] = None
    cover_image_url: Optional[str] = None
    
    # Paso 3: Áreas de práctica
    practice_areas: List[str] = Field(default_factory=list)
    
    # Paso 4: Abogados invitados
    invited_lawyers: List[LawyerInvitation] = Field(default_factory=list)
    
    # Control de progreso
    current_step: int = Field(default=0, description="Paso actual del wizard (0-3)")
    onboarding_completed: bool = Field(default=False, description="Onboarding completado")
    completed_at: Optional[datetime] = None
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "firm_id": "firm123",
                "commercial_name": "Bufete Jurídico XYZ",
                "practice_areas": ["laboral", "civil", "penal"],
                "onboarding_completed": False,
                "current_step": 0
            }
        }


class OnboardingStepUpdate(BaseModel):
    """Actualización de un paso del onboarding"""
    step: int = Field(..., ge=0, le=3, description="Paso a actualizar (0-3)")
    data: dict = Field(..., description="Datos del paso")


class OnboardingCompletion(BaseModel):
    """Finalización del onboarding"""
    firm_id: str
    onboarding_completed: bool = True
