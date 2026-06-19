"""Health test del módulo Facturación — Punto Cero OS.

Pruebas unitarias sin MongoDB: validación de modelo (status/source/método/
amount), aislamiento de tenant, permisos, métricas y envelope.
"""
import pytest
from pydantic import ValidationError

from models.billing import InvoiceCreate
from services.billing_service import _tenant_filter, _sum, RECEIVABLE_STATES
from utils.responses import ok, fail, OrgError
from utils.tenant import WRITE_ROLES, SUPER_ADMIN, OWNER, ADMIN, STAFF, CLIENT


# ───────── Modelo / enums / amount (Fase 1, 13) ─────────
def test_create_ok():
    inv = InvoiceCreate(clientName="Centro Médico Vida", amount=240000)
    assert inv.source == "subscription" and inv.status == "pending"


def test_rechaza_status_invalido():
    with pytest.raises(ValidationError):
        InvoiceCreate(clientName="ACME", amount=100, status="cancelado")


def test_rechaza_source_invalido():
    with pytest.raises(ValidationError):
        InvoiceCreate(clientName="ACME", amount=100, source="manual")


def test_rechaza_metodo_invalido():
    with pytest.raises(ValidationError):
        InvoiceCreate(clientName="ACME", amount=100, paymentMethod="crypto")


def test_rechaza_amount_negativo():
    with pytest.raises(ValidationError):
        InvoiceCreate(clientName="ACME", amount=-10)


# ───────── Métricas (Fase 3) ─────────
def test_sum_por_estado():
    items = [
        {"amount": 100, "status": "paid"},
        {"amount": 50, "status": "pending"},
        {"amount": 25, "status": "overdue"},
    ]
    assert _sum(items, lambda i: i["status"] == "paid") == 100
    receivable = _sum(items, lambda i: i["status"] in RECEIVABLE_STATES)
    assert receivable == 75


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
