from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime
from bson import ObjectId

class CountryConfig(BaseModel):
    """FASE 14.1: Country configuration for global operations"""
    
    country_code: str  # e.g., "CO", "MX", "BR"
    country_name: str  # e.g., "Colombia"
    currency: str  # e.g., "USD", "COP", "MXN"
    timezone: str  # e.g., "America/Bogota"
    legal_system_type: str  # e.g., "civil_law", "common_law"
    language: str  # e.g., "es", "en", "pt"
    tax_rate: float  # e.g., 0.19 for 19% VAT
    base_commission_rate: float  # e.g., 0.10 for 10%
    payment_methods: list  # ["bank_transfer", "stripe", "mercadopago"]
    data_residency_required: bool  # GDPR compliance
    compliance_rules: Optional[Dict[str, Any]] = None
    active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class FirmNetworkConnection(BaseModel):
    """FASE 14.3: Firm-to-firm network connections"""
    
    firm_id_1: str
    firm_id_2: str
    connection_type: str  # "partner", "co-representation", "referral"
    revenue_share_1: float  # Firm 1's percentage (0-1)
    revenue_share_2: float  # Firm 2's percentage (0-1)
    countries_served: list  # Countries in partnership
    languages_supported: list  # Languages in partnership
    status: str  # "active", "inactive", "pending"
    case_sharing_enabled: bool = True
    lead_sharing_enabled: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class GlobalCurrencyExchange(BaseModel):
    """FASE 14.4: Multi-currency exchange rates"""
    
    from_currency: str
    to_currency: str
    rate: float
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    source: str  # "fixed", "market", "admin"

class MultiCurrencyTransaction(BaseModel):
    """FASE 14.4: Track transactions in multiple currencies"""
    
    entity_id: str  # commission_id, invoice_id, etc.
    entity_type: str  # "commission", "invoice", "payment"
    original_currency: str
    original_amount: float
    converted_currency: str
    converted_amount: float
    exchange_rate: float
    conversion_date: datetime = Field(default_factory=datetime.utcnow)
