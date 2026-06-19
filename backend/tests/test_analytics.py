"""Health test del módulo Analytics — Punto Cero OS.

Pruebas unitarias sin MongoDB sobre las funciones de cálculo puras (reciben
datos ya cargados), más aislamiento de tenant y envelope.
"""
import pytest

from services.analytics_service import (
    _tenant_filter, _compute_revenue, _compute_funnel, _compute_verticals,
    _compute_insights, _compute_kpis, _compute_growth, _monthly_value,
)
from utils.responses import ok, fail, OrgError


def _dataset():
    return {
        "organizations": [
            {"vertical": "Jurídico", "status": "active"},
            {"vertical": "Medicina", "status": "at_risk"},
        ],
        "partners": [
            {"vertical": "Jurídico", "stage": "convertido"},
            {"vertical": "Jurídico", "stage": "lead"},
        ],
        "implementations": [
            {"vertical": "Jurídico", "stage": "operation"},
            {"vertical": "Medicina", "stage": "go_live"},
        ],
        "subscriptions": [
            {"vertical": "Jurídico", "status": "active", "monthlyAmount": 275000},
            {"vertical": "Medicina", "status": "trial", "annualAmount": 1200000},
            {"vertical": "Medicina", "status": "cancelled", "monthlyAmount": 100000},
        ],
        "billing": [
            {"vertical": "Jurídico", "status": "paid", "amount": 275000, "paymentMethod": "transfer"},
            {"vertical": "Medicina", "status": "overdue", "amount": 100000},
        ],
    }


# ───────── MRR / ARR (Fase 3) ─────────
def test_mrr_arr():
    rev = _compute_revenue(_dataset())
    # active 275000 + trial annual 1200000/12=100000 → MRR 375000 ; cancelled excluida
    assert rev["MRR"] == 375000
    assert rev["ARR"] == 375000 * 12


def test_monthly_value_anual():
    assert _monthly_value({"annualAmount": 1200000}) == 100000


def test_collection_rate():
    rev = _compute_revenue(_dataset())
    # total 375000, pagado 275000 → ~73.33%
    assert rev["totalRevenue"] == 375000 and rev["accountsReceivable"] == 100000
    assert round(rev["collectionRate"]) == 73


# ───────── Funnel (Fase 4) ─────────
def test_funnel():
    f = _compute_funnel(_dataset())
    assert f["leads"] == 2 and f["implementations"] == 2 and f["subscriptions"] == 3
    assert f["customers"] == 1 and f["activeOrganizations"] == 1
    assert f["stages"][0]["conversionPercentage"] == 100.0


# ───────── Verticales + insights (Fase 5, 6) ─────────
def test_verticals_aggregation():
    vs = _compute_verticals(_dataset())
    jur = next(v for v in vs if v["name"] == "Jurídico")
    assert jur["organizations"] == 1 and jur["subscriptions"] == 1 and jur["implementations"] == 1
    assert jur["conversionRate"] == 50.0  # 1 convertido de 2 partners


def test_insights_sin_hardcode():
    data = _dataset()
    ins = _compute_insights(_compute_verticals(data), _compute_revenue(data))
    assert ins["topRevenueVertical"] in ("Jurídico", "Medicina")
    assert ins["highestRiskVertical"] == "Medicina"  # org at_risk
    assert isinstance(ins["recommendations"], list)


# ───────── KPIs / Growth (Fase 3, 8) ─────────
def test_kpis_y_growth():
    data = _dataset()
    g = _compute_growth(data)
    k = _compute_kpis(data, _compute_revenue(data), _compute_funnel(data), g)
    assert k["totalOrganizations"] == 2 and k["totalSubscriptions"] == 3 and k["activeSubscriptions"] == 2
    assert k["implementationsCompleted"] == 1 and k["goLivesThisMonth"] == 1
    assert set(["newOrganizations", "newPartners", "newImplementations", "newSubscriptions"]).issubset(g.keys())


# ───────── Aislamiento de tenant (Fase 9) ─────────
def test_tenant_filter():
    assert _tenant_filter({"tenant_id": "t1", "is_super_admin": False})["tenantId"] == "t1"
    assert "tenantId" not in _tenant_filter({"tenant_id": None, "is_super_admin": True})
    with pytest.raises(OrgError):
        _tenant_filter({"tenant_id": None, "is_super_admin": False})


# ───────── Envelope ─────────
def test_envelope():
    assert ok({}, "x")["success"] is True and fail("e")["data"] is None
