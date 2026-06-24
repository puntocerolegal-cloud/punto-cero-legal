from abc import ABC, abstractmethod
from typing import Optional, Dict, Any
from datetime import datetime

class PaymentProviderBase(ABC):
    """Abstract base class for payment providers"""
    
    @abstractmethod
    async def process_payment(self, amount: float, currency: str, recipient_id: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """Process a payment through the provider"""
        pass
    
    @abstractmethod
    async def verify_payment(self, transaction_reference: str) -> Dict[str, Any]:
        """Verify payment status"""
        pass
    
    @abstractmethod
    async def refund_payment(self, transaction_reference: str, amount: Optional[float] = None) -> Dict[str, Any]:
        """Refund a payment"""
        pass

class StripePaymentProvider(PaymentProviderBase):
    """Stripe payment provider — STRUCTURE ONLY"""
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        # TODO: Initialize Stripe client when ready
    
    async def process_payment(self, amount: float, currency: str, recipient_id: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """Process payment via Stripe (not yet implemented)"""
        return {
            "success": False,
            "error": "Stripe integration not yet enabled",
            "provider": "stripe"
        }
    
    async def verify_payment(self, transaction_reference: str) -> Dict[str, Any]:
        """Verify Stripe payment (not yet implemented)"""
        return {
            "success": False,
            "error": "Stripe integration not yet enabled",
            "provider": "stripe"
        }
    
    async def refund_payment(self, transaction_reference: str, amount: Optional[float] = None) -> Dict[str, Any]:
        """Refund Stripe payment (not yet implemented)"""
        return {
            "success": False,
            "error": "Stripe integration not yet enabled",
            "provider": "stripe"
        }

class PayPalPaymentProvider(PaymentProviderBase):
    """PayPal payment provider — STRUCTURE ONLY"""
    
    def __init__(self, client_id: str, client_secret: str):
        self.client_id = client_id
        self.client_secret = client_secret
        # TODO: Initialize PayPal client when ready
    
    async def process_payment(self, amount: float, currency: str, recipient_id: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """Process payment via PayPal (not yet implemented)"""
        return {
            "success": False,
            "error": "PayPal integration not yet enabled",
            "provider": "paypal"
        }
    
    async def verify_payment(self, transaction_reference: str) -> Dict[str, Any]:
        """Verify PayPal payment (not yet implemented)"""
        return {
            "success": False,
            "error": "PayPal integration not yet enabled",
            "provider": "paypal"
        }
    
    async def refund_payment(self, transaction_reference: str, amount: Optional[float] = None) -> Dict[str, Any]:
        """Refund PayPal payment (not yet implemented)"""
        return {
            "success": False,
            "error": "PayPal integration not yet enabled",
            "provider": "paypal"
        }

class MercadoPagoPaymentProvider(PaymentProviderBase):
    """MercadoPago payment provider — STRUCTURE ONLY"""
    
    def __init__(self, access_token: str):
        self.access_token = access_token
        # TODO: Initialize MercadoPago client when ready
    
    async def process_payment(self, amount: float, currency: str, recipient_id: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """Process payment via MercadoPago (not yet implemented)"""
        return {
            "success": False,
            "error": "MercadoPago integration not yet enabled",
            "provider": "mercadopago"
        }
    
    async def verify_payment(self, transaction_reference: str) -> Dict[str, Any]:
        """Verify MercadoPago payment (not yet implemented)"""
        return {
            "success": False,
            "error": "MercadoPago integration not yet enabled",
            "provider": "mercadopago"
        }
    
    async def refund_payment(self, transaction_reference: str, amount: Optional[float] = None) -> Dict[str, Any]:
        """Refund MercadoPago payment (not yet implemented)"""
        return {
            "success": False,
            "error": "MercadoPago integration not yet enabled",
            "provider": "mercadopago"
        }

class PaymentProviderFactory:
    """Factory for payment provider instantiation"""
    
    _providers = {
        "stripe": StripePaymentProvider,
        "paypal": PayPalPaymentProvider,
        "mercadopago": MercadoPagoPaymentProvider,
    }
    
    @classmethod
    def get_provider(cls, provider_name: str, **kwargs) -> PaymentProviderBase:
        """Get a payment provider instance"""
        provider_class = cls._providers.get(provider_name.lower())
        if not provider_class:
            raise ValueError(f"Unknown payment provider: {provider_name}")
        return provider_class(**kwargs)
    
    @classmethod
    def register_provider(cls, provider_name: str, provider_class: type):
        """Register a new payment provider"""
        cls._providers[provider_name.lower()] = provider_class
