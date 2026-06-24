from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
from bson import ObjectId

class GlobalCountryEngine:
    """FASE 14.1: Global multi-country operations"""
    
    COUNTRY_CONFIGS = {
        "CO": {
            "code": "CO",
            "name": "Colombia",
            "currency": "COP",
            "timezone": "America/Bogota",
            "legal_system": "civil_law",
            "language": "es",
            "tax_rate": 0.19,
            "commission_rate": 0.10,
            "payment_methods": ["bank_transfer", "stripe", "mercadopago"],
            "data_residency": False,
        },
        "MX": {
            "code": "MX",
            "name": "Mexico",
            "currency": "MXN",
            "timezone": "America/Mexico_City",
            "legal_system": "civil_law",
            "language": "es",
            "tax_rate": 0.16,
            "commission_rate": 0.12,
            "payment_methods": ["bank_transfer", "stripe", "mercadopago"],
            "data_residency": False,
        },
        "BR": {
            "code": "BR",
            "name": "Brazil",
            "currency": "BRL",
            "timezone": "America/Sao_Paulo",
            "legal_system": "civil_law",
            "language": "pt",
            "tax_rate": 0.17,
            "commission_rate": 0.15,
            "payment_methods": ["bank_transfer", "stripe"],
            "data_residency": True,  # LGPD compliance
        },
        "CL": {
            "code": "CL",
            "name": "Chile",
            "currency": "CLP",
            "timezone": "America/Santiago",
            "legal_system": "civil_law",
            "language": "es",
            "tax_rate": 0.19,
            "commission_rate": 0.10,
            "payment_methods": ["bank_transfer", "stripe"],
            "data_residency": False,
        },
        "AR": {
            "code": "AR",
            "name": "Argentina",
            "currency": "ARS",
            "timezone": "America/Argentina/Buenos_Aires",
            "legal_system": "civil_law",
            "language": "es",
            "tax_rate": 0.21,
            "commission_rate": 0.10,
            "payment_methods": ["bank_transfer"],
            "data_residency": False,
        },
        "PE": {
            "code": "PE",
            "name": "Peru",
            "currency": "PEN",
            "timezone": "America/Lima",
            "legal_system": "civil_law",
            "language": "es",
            "tax_rate": 0.18,
            "commission_rate": 0.10,
            "payment_methods": ["bank_transfer"],
            "data_residency": False,
        },
    }
    
    @staticmethod
    async def get_country_config(country_code: str) -> Dict[str, Any]:
        """Get configuration for a country"""
        return GlobalCountryEngine.COUNTRY_CONFIGS.get(country_code, {})
    
    @staticmethod
    async def list_all_countries() -> List[Dict[str, Any]]:
        """List all supported countries"""
        return list(GlobalCountryEngine.COUNTRY_CONFIGS.values())

class CrossBorderRoutingEngine:
    """FASE 14.2: Cross-border case routing"""
    
    @staticmethod
    async def route_cross_border(
        db: AsyncIOMotorDatabase,
        lead: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Route lead to international lawyer/firm if needed"""
        
        country = lead.get("country", "CO")
        legal_area = lead.get("legal_area", "corporativo")
        lead_score = lead.get("ai_score", 50)
        
        # Try to find local lawyer first
        local_lawyers = await db.users.find({
            "role": "lawyer",
            "country": country,
            "status": {"$ne": "SUSPENDED"}
        }).to_list(None)
        
        if local_lawyers:
            # Find best local lawyer
            best = max(local_lawyers, key=lambda x: x.get("experience_score", 0))
            return {
                "assigned_type": "local_lawyer",
                "assigned_id": str(best["_id"]),
                "country": country,
                "confidence": 0.95,
            }
        
        # If no local lawyer, find international option
        international_lawyers = await db.users.find({
            "role": "lawyer",
            "country": {"$ne": country},
            "status": {"$ne": "SUSPENDED"},
        }).sort("experience_score", -1).limit(5).to_list(None)
        
        if international_lawyers:
            best = international_lawyers[0]
            return {
                "assigned_type": "international_lawyer",
                "assigned_id": str(best["_id"]),
                "assigned_country": best.get("country"),
                "original_country": country,
                "confidence": 0.80,
                "note": "International lawyer - cross-border case",
            }
        
        # If no lawyer available, return null
        return {
            "assigned_type": None,
            "assigned_id": None,
            "country": country,
            "confidence": 0,
            "error": "No lawyers available for this jurisdiction",
        }

class GlobalFirmNetworkEngine:
    """FASE 14.3: Global firm network management"""
    
    @staticmethod
    async def get_firm_partnerships(db: AsyncIOMotorDatabase, firm_id: str) -> List[Dict]:
        """Get all partnerships for a firm"""
        
        partnerships = await db.firm_connections.find({
            "$or": [
                {"firm_id_1": firm_id},
                {"firm_id_2": firm_id}
            ],
            "status": "active"
        }).to_list(None)
        
        return partnerships
    
    @staticmethod
    async def calculate_network_metrics(db: AsyncIOMotorDatabase, org_id: str) -> Dict:
        """Calculate metrics for firm network"""
        
        partnerships = await db.firm_connections.find({
            "$or": [
                {"firm_id_1": org_id},
                {"firm_id_2": org_id}
            ]
        }).to_list(None)
        
        connected_countries = set()
        shared_languages = set()
        partner_count = 0
        
        for partnership in partnerships:
            partner_count += 1
            connected_countries.update(partnership.get("countries_served", []))
            shared_languages.update(partnership.get("languages_supported", []))
        
        return {
            "network_size": partner_count,
            "countries_reached": len(connected_countries),
            "countries_list": list(connected_countries),
            "languages": list(shared_languages),
        }

class MultiCurrencyEngine:
    """FASE 14.4: Multi-currency financial operations"""
    
    EXCHANGE_RATES = {
        ("USD", "COP"): 4200,
        ("USD", "MXN"): 18,
        ("USD", "BRL"): 5.2,
        ("USD", "CLP"): 850,
        ("USD", "ARS"): 800,
        ("USD", "PEN"): 3.8,
        ("COP", "USD"): 1/4200,
        ("MXN", "USD"): 1/18,
        ("BRL", "USD"): 1/5.2,
    }
    
    @staticmethod
    async def convert_amount(
        amount: float,
        from_currency: str,
        to_currency: str
    ) -> Dict[str, Any]:
        """Convert amount between currencies"""
        
        if from_currency == to_currency:
            return {
                "original_amount": amount,
                "original_currency": from_currency,
                "converted_amount": amount,
                "converted_currency": to_currency,
                "exchange_rate": 1.0,
            }
        
        key = (from_currency, to_currency)
        rate = MultiCurrencyEngine.EXCHANGE_RATES.get(key, 1.0)
        converted = amount * rate
        
        return {
            "original_amount": amount,
            "original_currency": from_currency,
            "converted_amount": converted,
            "converted_currency": to_currency,
            "exchange_rate": rate,
        }

class GlobalRevenueOrchestrator:
    """FASE 14.5: Global revenue consolidation"""
    
    @staticmethod
    async def get_global_revenue_summary(db: AsyncIOMotorDatabase) -> Dict[str, Any]:
        """Get global revenue overview"""
        
        # Get all commissions
        all_commissions = await db.commissions.find({}).to_list(None)
        
        revenue_by_country = {}
        revenue_by_firm = {}
        revenue_by_currency = {}
        
        total_revenue_usd = 0
        
        for commission in all_commissions:
            country = commission.get("country", "Unknown")
            org_id = commission.get("organization_id", "Unknown")
            currency = commission.get("currency", "USD")
            amount = commission.get("amount", 0)
            
            if commission.get("status") == "paid":
                # Convert to USD for consolidation
                if currency == "USD":
                    amount_usd = amount
                else:
                    key = (currency, "USD")
                    rate = MultiCurrencyEngine.EXCHANGE_RATES.get(key, 1.0)
                    amount_usd = amount * rate
                
                total_revenue_usd += amount_usd
                
                revenue_by_country[country] = revenue_by_country.get(country, 0) + amount_usd
                revenue_by_firm[org_id] = revenue_by_firm.get(org_id, 0) + amount_usd
                revenue_by_currency[currency] = revenue_by_currency.get(currency, 0) + amount
        
        # Calculate top performers
        top_countries = sorted(
            revenue_by_country.items(),
            key=lambda x: x[1],
            reverse=True
        )[:5]
        
        top_firms = sorted(
            revenue_by_firm.items(),
            key=lambda x: x[1],
            reverse=True
        )[:5]
        
        return {
            "total_revenue_usd": total_revenue_usd,
            "revenue_by_country": dict(top_countries),
            "revenue_by_firm": dict(top_firms),
            "revenue_by_currency": revenue_by_currency,
            "countries_active": len(revenue_by_country),
            "firms_active": len(revenue_by_firm),
        }

class InternationalComplianceEngine:
    """FASE 14.6: International compliance and data residency"""
    
    COMPLIANCE_RULES = {
        "BR": {
            "regulation": "LGPD",
            "data_residency_required": True,
            "required_encryption": True,
            "audit_log_days": 365,
        },
        "EU": {
            "regulation": "GDPR",
            "data_residency_required": True,
            "required_encryption": True,
            "audit_log_days": 730,
        },
    }
    
    @staticmethod
    async def check_data_residency(country_code: str, data_location: str) -> bool:
        """Check if data meets residency requirements"""
        
        rules = InternationalComplianceEngine.COMPLIANCE_RULES.get(country_code, {})
        
        if rules.get("data_residency_required"):
            return data_location == country_code
        
        return True
    
    @staticmethod
    async def log_compliance_event(
        db: AsyncIOMotorDatabase,
        event_type: str,
        country_code: str,
        entity_id: str,
        details: Dict[str, Any]
    ) -> None:
        """Log compliance event for audit trail"""
        
        await db.compliance_logs.insert_one({
            "event_type": event_type,
            "country": country_code,
            "entity_id": entity_id,
            "details": details,
            "timestamp": datetime.utcnow(),
        })

class GlobalLoadBalancer:
    """FASE 14.7: Global load balancing for legal operations"""
    
    @staticmethod
    async def balance_global_load(db: AsyncIOMotorDatabase) -> Dict[str, Any]:
        """Balance cases, lawyers, and firms across all countries"""
        
        actions = []
        
        # Get all countries
        countries = await db.users.distinct("country")
        
        for country in countries:
            # Get metrics for this country
            lawyers = await db.users.find({
                "role": "lawyer",
                "country": country,
                "status": {"$ne": "SUSPENDED"}
            }).to_list(None)
            
            open_cases = await db.cases.find({
                "country": country,
                "status": "open"
            }).to_list(None)
            
            if lawyers:
                cases_per_lawyer = len(open_cases) / len(lawyers)
                
                # If overloaded, flag for international routing
                if cases_per_lawyer > 15:
                    actions.append({
                        "type": "COUNTRY_OVERLOADED",
                        "country": country,
                        "cases_per_lawyer": cases_per_lawyer,
                        "recommendation": "Route to international lawyers",
                    })
        
        return {
            "balance_timestamp": datetime.utcnow(),
            "actions": actions,
        }
