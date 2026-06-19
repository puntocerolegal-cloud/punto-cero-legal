"""Health test del módulo Suscripciones — Punto Cero OS.

Pruebas unitarias sin MongoDB: modelo/planes/ciclos/estados, aislamiento de
tenant, cálculo de MRR/ARR (normalización por ciclo), permisos y envelope.
"""
import pytest
from pydantic import ValidationError

from models.os_subscription import SubscriptionCreate
from services.subscription_service import _tenant_filter, _monthly_value, CYCLE_TO_MONTHLY
from utils.responses import ok, fail, OrgError
from utils.tenant import WRITE_ROLES, SUPER_ADMIN, OWNER, ADMIN, STAFF, CLIENT


# ───────── Modelo / planes / ciclo / estado (Fase 1, 11) ─────────
def test_create_defaults():
    s = SubscriptionCreate(companyName="Centro Médico Vida", vertical="Medicina")
    assert s.plan == "essential" and s.status == "trial" and s.billingCycle == "monthly" and s.autoRenew is True


def test_rechaza_plan_invalido():
    with pytest.raises(ValidationError):
        SubscriptionCreate(companyName="ACME", vertical="Medicina", plan="premium")


def test_rechaza_billing_invalido():
    with pytest.raises(ValidationError):
        SubscriptionCreate(companyName="ACME", vertical="Medicina", billingCycle="weekly")


def test_rechaza_status_invalido():
    with pytest.raises(ValidationError):
        SubscriptionCreate(companyName="ACME", vertical="Medicina", status="paused")


# ───────── Cálculo MRR/ARR (Fase 3, 14) ─────────
def test_monthly_value_directo():
    assert _monthly_value({"monthlyAmount": 240000}) == 240000


def test_monthly_value_desde_anual():
    # Si no hay mensual, se normaliza el anual a base mensual.
    assert _monthly_value({"annualAmount": 1200000}) == 100000


def test_cycle_factors():
    assert CYCLE_TO_MONTHLY["monthly"] == 1.0
    assert round(CYCLE_TO_MONTHLY["quarterly"], 4) == round(1 / 3, 4)
    assert round(CYCLE_TO_MONTHLY["annual"], 4) == round(1 / 12, 4)


# ───────── Aislamiento de tenant (Fase 2) ─────────
def test_tenant_filter_incluye_tenant():
    assert _tenant_filter({"tenant_id": "t1", "is_super_admin": False})["tenantId"] == "t1"


def test_tenant_filter_super_admin_cross_tenant():
    assert "tenantId" not in _tenant_filter({"tenant_id": None, "is_super_admin": True})


def test_tenant_filter_bloquea_no_superadmin_sin_tenant():
    with pytest.raises(OrgError) as ei:
        _tenant_filter({"tenant_id": None, "is_super_admin": False})
    assert ei.value.status_code == 400


# ───────── Permisos / envelope ─────────
def test_write_roles_y_envelope():
    assert {SUPER_ADMIN, OWNER, ADMIN} == WRITE_ROLES
    assert STAFF not in WRITE_ROLES and CLIENT not in WRITE_ROLES
    assert ok([], "x")["success"] is True and fail("e")["data"] is None
