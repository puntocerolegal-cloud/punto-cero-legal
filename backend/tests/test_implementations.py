"""Health test del módulo Implementaciones — Punto Cero OS.

Pruebas unitarias sin MongoDB: modelo/stages/progress/riskLevel, aislamiento
de tenant, permisos y formato de respuesta.
"""
import pytest
from pydantic import ValidationError

from models.implementation import ImplementationCreate
from services.implementation_service import _tenant_filter
from utils.responses import ok, fail, OrgError
from utils.tenant import WRITE_ROLES, SUPER_ADMIN, OWNER, ADMIN, STAFF, CLIENT


# ───────── Modelo / stages / progress / risk (Fase 1, 11) ─────────
def test_create_defaults():
    i = ImplementationCreate(companyName="Centro Médico Vida", vertical="Medicina")
    assert i.stage == "sold" and i.status == "active" and i.riskLevel == "low" and i.progress == 0


def test_rechaza_stage_invalido():
    with pytest.raises(ValidationError):
        ImplementationCreate(companyName="ACME", vertical="Medicina", stage="produccion")


def test_rechaza_risk_invalido():
    with pytest.raises(ValidationError):
        ImplementationCreate(companyName="ACME", vertical="Medicina", riskLevel="extremo")


def test_progress_rango():
    with pytest.raises(ValidationError):
        ImplementationCreate(companyName="ACME", vertical="Medicina", progress=150)
    with pytest.raises(ValidationError):
        ImplementationCreate(companyName="ACME", vertical="Medicina", progress=-1)


# ───────── Aislamiento de tenant (Fase 2) ─────────
def test_tenant_filter_incluye_tenant():
    q = _tenant_filter({"tenant_id": "t1", "is_super_admin": False}, {"stage": "kickoff"})
    assert q["tenantId"] == "t1" and q["stage"] == "kickoff"


def test_tenant_filter_super_admin_cross_tenant():
    assert "tenantId" not in _tenant_filter({"tenant_id": None, "is_super_admin": True})


def test_tenant_filter_bloquea_no_superadmin_sin_tenant():
    with pytest.raises(OrgError) as ei:
        _tenant_filter({"tenant_id": None, "is_super_admin": False})
    assert ei.value.status_code == 400


# ───────── Permisos / envelope ─────────
def test_write_roles():
    assert {SUPER_ADMIN, OWNER, ADMIN} == WRITE_ROLES
    assert STAFF not in WRITE_ROLES and CLIENT not in WRITE_ROLES


def test_envelope():
    assert ok({}, "x")["success"] is True
    assert fail("e")["data"] is None
