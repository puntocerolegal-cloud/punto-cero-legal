"""Health test del módulo Organizaciones — Punto Cero OS.

Pruebas unitarias sin dependencia de MongoDB: validan slug, validación de
modelo, aislamiento de tenant, permisos por rol y el formato de respuesta.
"""
import pytest
from pydantic import ValidationError

from models.organization import OrganizationCreate
from services.organization_service import slugify, _tenant_filter
from utils.responses import ok, fail, OrgError
from utils.tenant import to_os_role, WRITE_ROLES, SUPER_ADMIN, OWNER, ADMIN, STAFF, CLIENT


# ───────── Slug ─────────
def test_slugify_normaliza_acentos_y_espacios():
    assert slugify("Centro Médico Vida") == "centro-medico-vida"
    assert slugify("  Bufete Andrade & Asoc. ") == "bufete-andrade-asoc"


# ───────── Validación de modelo (Fase 3) ─────────
def test_organization_create_valida_campos():
    org = OrganizationCreate(name="Clínica X", vertical="Medicina")
    assert org.plan == "Essential" and org.status == "active"


def test_organization_create_rechaza_vertical_invalida():
    with pytest.raises(ValidationError):
        OrganizationCreate(name="Clínica X", vertical="Veterinaria")


def test_organization_create_rechaza_nombre_corto():
    with pytest.raises(ValidationError):
        OrganizationCreate(name="X", vertical="Jurídico")


# ───────── Aislamiento de tenant (Fase 5) ─────────
def test_tenant_filter_incluye_tenant():
    q = _tenant_filter({"tenant_id": "t1", "is_super_admin": False}, {"_id": 1})
    assert q["tenantId"] == "t1" and q["_id"] == 1


def test_tenant_filter_super_admin_sin_tenant_es_cross_tenant():
    q = _tenant_filter({"tenant_id": None, "is_super_admin": True})
    assert "tenantId" not in q


def test_tenant_filter_bloquea_no_superadmin_sin_tenant():
    with pytest.raises(OrgError) as ei:
        _tenant_filter({"tenant_id": None, "is_super_admin": False})
    assert ei.value.status_code == 400


# ───────── Permisos por rol (Fase 9) ─────────
def test_role_mapping_y_escritura():
    assert to_os_role("admin") == SUPER_ADMIN
    assert to_os_role("admin_general") == OWNER
    assert to_os_role("socio_comercial") == ADMIN
    assert to_os_role("lawyer") == STAFF
    assert to_os_role("client") == CLIENT
    assert {SUPER_ADMIN, OWNER, ADMIN} == WRITE_ROLES
    assert STAFF not in WRITE_ROLES and CLIENT not in WRITE_ROLES


# ───────── Respuesta estándar (Fase 11) ─────────
def test_response_envelope():
    r = ok({"a": 1}, "listo")
    assert r == {"success": True, "data": {"a": 1}, "message": "listo", "errors": []}
    f = fail("error", ["e1"])
    assert f["success"] is False and f["data"] is None and f["errors"] == ["e1"]
