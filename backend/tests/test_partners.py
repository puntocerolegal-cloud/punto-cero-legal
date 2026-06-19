"""Health test del módulo Partners — Punto Cero OS.

Pruebas unitarias sin MongoDB: validan modelo/stage, aislamiento de tenant,
unicidad por tenant (a nivel de contrato), permisos y formato de respuesta.
"""
import pytest
from pydantic import ValidationError

from models.partner import PartnerCreate
from services.partner_service import _tenant_filter
from utils.responses import ok, fail, OrgError
from utils.tenant import WRITE_ROLES, SUPER_ADMIN, OWNER, ADMIN, STAFF, CLIENT


# ───────── Validación de modelo / stage (Fase 1) ─────────
def test_partner_create_defaults():
    p = PartnerCreate(companyName="Clínica Dental Sonríe", vertical="Odontología")
    assert p.stage == "lead" and p.status == "pending"


def test_partner_create_rechaza_stage_invalido():
    with pytest.raises(ValidationError):
        PartnerCreate(companyName="X Corp", vertical="Medicina", stage="ganado")


def test_partner_create_rechaza_nombre_corto():
    with pytest.raises(ValidationError):
        PartnerCreate(companyName="X", vertical="Jurídico")


def test_partner_commission_rango():
    with pytest.raises(ValidationError):
        PartnerCreate(companyName="ACME SAS", vertical="Medicina", commissionRate=150)


# ───────── Aislamiento de tenant (Fase 2) ─────────
def test_tenant_filter_incluye_tenant():
    q = _tenant_filter({"tenant_id": "t1", "is_super_admin": False}, {"stage": "lead"})
    assert q["tenantId"] == "t1" and q["stage"] == "lead"


def test_tenant_filter_super_admin_cross_tenant():
    assert "tenantId" not in _tenant_filter({"tenant_id": None, "is_super_admin": True})


def test_tenant_filter_bloquea_no_superadmin_sin_tenant():
    with pytest.raises(OrgError) as ei:
        _tenant_filter({"tenant_id": None, "is_super_admin": False})
    assert ei.value.status_code == 400


# ───────── Permisos (Fase 5) ─────────
def test_write_roles():
    assert {SUPER_ADMIN, OWNER, ADMIN} == WRITE_ROLES
    assert STAFF not in WRITE_ROLES and CLIENT not in WRITE_ROLES


# ───────── Respuesta estándar (Fase 6) ─────────
def test_envelope():
    assert ok([], "ok") == {"success": True, "data": [], "message": "ok", "errors": []}
    assert fail("e")["success"] is False
