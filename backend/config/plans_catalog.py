"""
PUNTO CERO LEGAL — PLAN CATALOG MASTER
Single Source of Truth for all plan definitions across the entire system.

This file is the ONLY official source for plan information.
All other references must import from here.

DO NOT duplicate plan definitions elsewhere.
"""

from typing import Dict, List, Any
from dataclasses import dataclass, asdict
from datetime import timedelta

# OFFICIAL TRIAL VALUE - GLOBAL CONSTANT
TRIAL_DAYS = 3

@dataclass
class PlanDefinition:
    """Official plan definition"""
    id: str                          # Internal ID: "plan-despegue"
    name: str                        # Official name: "El Despegue"
    slug: str                        # URL slug: "despegue"
    description: str                 # Short description
    order: int                       # Display order (1-4)
    color: str                       # UI color (hex)
    icon: str                        # Icon name (lucide-react)
    
    # Pricing
    price_usd_monthly: float         # Base price USD (monthly)
    price_cop_monthly: float         # Base price COP (monthly) = USD * 4000
    
    # Trial & Subscription
    trial_days: int                  # Number of free trial days
    
    # Limits
    max_cases: int                   # Maximum concurrent cases
    max_lawyers: int                 # Maximum team members
    max_documents: int               # Maximum documents
    
    # Payment IDs
    mercado_pago_id: str            # MercadoPago product ID
    paypal_id: str                  # PayPal subscription product ID
    
    # Features (boolean flags)
    has_ai_assistant: bool          # DARWIN access
    has_whatsapp: bool              # WhatsApp Business integration
    has_custom_domain: bool         # Custom domain support
    has_team_management: bool       # Team features
    has_advanced_analytics: bool    # Advanced reporting
    has_priority_support: bool      # Priority support
    
    def to_dict(self) -> Dict[str, Any]:
        """Export as dictionary"""
        return asdict(self)
    
    def get_trial_duration(self) -> timedelta:
        """Get trial duration as timedelta"""
        return timedelta(days=self.trial_days)


# ═════════════════════════════════════════════════════════════════════════════
# OFFICIAL PLAN DEFINITIONS — DO NOT MODIFY WITHOUT APPROVAL
# ═════════════════════════════════════════════════════════════════════════════

PLAN_DESPEGUE = PlanDefinition(
    id="plan-despegue",
    name="El Despegue",
    slug="despegue",
    description="Para abogados independientes que comienzan",
    order=1,
    color="#7C3AED",  # Purple
    icon="Rocket",
    
    price_usd_monthly=28.125,
    price_cop_monthly=112500,
    
    trial_days=TRIAL_DAYS,
    
    max_cases=50,
    max_lawyers=1,
    max_documents=500,
    
    mercado_pago_id="despegue_mpp",
    paypal_id="despegue_pp",
    
    has_ai_assistant=True,
    has_whatsapp=False,
    has_custom_domain=False,
    has_team_management=False,
    has_advanced_analytics=False,
    has_priority_support=False,
)

PLAN_SALTO_ESTRATEGICO = PlanDefinition(
    id="plan-salto",
    name="El Salto Estratégico",
    slug="salto-estrategico",
    description="Para pequeños despachos en crecimiento",
    order=2,
    color="#0891B2",  # Cyan
    icon="TrendingUp",
    
    price_usd_monthly=52.5,
    price_cop_monthly=210000,
    
    trial_days=TRIAL_DAYS,
    
    max_cases=150,
    max_lawyers=3,
    max_documents=2000,
    
    mercado_pago_id="salto_mpp",
    paypal_id="salto_pp",
    
    has_ai_assistant=True,
    has_whatsapp=True,
    has_custom_domain=False,
    has_team_management=True,
    has_advanced_analytics=False,
    has_priority_support=False,
)

PLAN_FIRMA_CRECIMIENTO = PlanDefinition(
    id="plan-crecimiento",
    name="Firma en Crecimiento",
    slug="firma-crecimiento",
    description="Para firmas medianas con equipos multidisciplinarios",
    order=3,
    color="#16A34A",  # Green
    icon="Building2",
    
    price_usd_monthly=140.625,
    price_cop_monthly=562500,
    
    trial_days=TRIAL_DAYS,
    
    max_cases=500,
    max_lawyers=10,
    max_documents=10000,
    
    mercado_pago_id="crecimiento_mpp",
    paypal_id="crecimiento_pp",
    
    has_ai_assistant=True,
    has_whatsapp=True,
    has_custom_domain=True,
    has_team_management=True,
    has_advanced_analytics=True,
    has_priority_support=True,
)

PLAN_CONSOLIDACION = PlanDefinition(
    id="plan-consolidacion",
    name="Consolidación Empresarial",
    slug="consolidacion-empresarial",
    description="Solución empresarial completa para grandes despachos",
    order=4,
    color="#DC2626",  # Red
    icon="Crown",
    
    price_usd_monthly=525,
    price_cop_monthly=2100000,
    
    trial_days=TRIAL_DAYS,
    
    max_cases=-1,  # Unlimited
    max_lawyers=-1,  # Unlimited
    max_documents=-1,  # Unlimited
    
    mercado_pago_id="consolidacion_mpp",
    paypal_id="consolidacion_pp",
    
    has_ai_assistant=True,
    has_whatsapp=True,
    has_custom_domain=True,
    has_team_management=True,
    has_advanced_analytics=True,
    has_priority_support=True,
)

# ═════════════════════════════════════════════════════════════════════════════
# CATALOG REGISTRY — Use this to iterate over all plans
# ═════════════════════════════════════════════════════════════════════════════

PLANS_CATALOG = [
    PLAN_DESPEGUE,
    PLAN_SALTO_ESTRATEGICO,
    PLAN_FIRMA_CRECIMIENTO,
    PLAN_CONSOLIDACION,
]

# Quick lookups
PLANS_BY_ID = {plan.id: plan for plan in PLANS_CATALOG}
PLANS_BY_SLUG = {plan.slug: plan for plan in PLANS_CATALOG}
PLANS_BY_NAME = {plan.name: plan for plan in PLANS_CATALOG}

def get_plan_by_id(plan_id: str) -> PlanDefinition:
    """Lookup plan by internal ID"""
    return PLANS_BY_ID.get(plan_id)

def get_plan_by_slug(slug: str) -> PlanDefinition:
    """Lookup plan by slug"""
    return PLANS_BY_SLUG.get(slug)

def get_plan_by_name(name: str) -> PlanDefinition:
    """Lookup plan by official name"""
    return PLANS_BY_NAME.get(name)

def get_all_plans() -> List[PlanDefinition]:
    """Get all plans ordered by display order"""
    return sorted(PLANS_CATALOG, key=lambda p: p.order)

def export_catalog_as_dict() -> Dict[str, Any]:
    """Export catalog as dictionary for API responses"""
    return {
        "trial_days": TRIAL_DAYS,
        "plans": [plan.to_dict() for plan in get_all_plans()],
        "by_id": {plan_id: plan.to_dict() for plan_id, plan in PLANS_BY_ID.items()},
        "by_slug": {slug: plan.to_dict() for slug, plan in PLANS_BY_SLUG.items()},
    }


# Deprecated plan names mapping (for backwards compatibility during migration)
# DO NOT USE IN NEW CODE
DEPRECATED_SLUGS_TO_OFFICIAL = {
    "esencial": "despegue",
    "profesional": "salto-estrategico",
    "elite": "firma-crecimiento",
    "ilimitado": "consolidacion-empresarial",
}

def migrate_legacy_slug(old_slug: str) -> str:
    """Convert deprecated slug to official slug"""
    return DEPRECATED_SLUGS_TO_OFFICIAL.get(old_slug, old_slug)
