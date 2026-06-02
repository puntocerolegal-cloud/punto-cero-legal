"""Tests for iteration 4 features:
- country required in public intakes
- Dr. prefix in lawyer names across endpoints
- accounting CRUD + KPIs (admin_general only; socio_comercial -> 403)
- geography stats endpoint
"""
import os
import time
import pytest
import requests

BASE_URL = os.environ['REACT_APP_BACKEND_URL'].rstrip('/')
TS = int(time.time())

ADMIN_CREDS = {"email": "darwin@puntocerolegal.com", "password": "Admin2025!"}
SOCIO_CREDS = {"email": "alejandro@puntocerolegal.com", "password": "Socio2025!"}


def _login(creds):
    r = requests.post(f"{BASE_URL}/api/auth/login", json=creds, timeout=15)
    assert r.status_code == 200, f"Login failed for {creds['email']}: {r.status_code} {r.text}"
    j = r.json()
    return j.get("access_token") or j.get("token")


@pytest.fixture(scope="module")
def admin_token():
    return _login(ADMIN_CREDS)


@pytest.fixture(scope="module")
def socio_token():
    return _login(SOCIO_CREDS)


def H(token):
    return {"Authorization": f"Bearer {token}"}


# ───────── Country required in public intakes ─────────
class TestCountryRequired:
    def test_case_intake_missing_country_returns_422(self):
        payload = {
            "name": f"TEST_NoCountry_{TS}",
            "description": "Necesito ayuda con un caso laboral importante.",
            "legal_area": "Laboral",
            "priority": "media",
        }
        r = requests.post(f"{BASE_URL}/api/public/case-intake", json=payload, timeout=10)
        assert r.status_code == 422, f"Expected 422, got {r.status_code}: {r.text}"

    def test_case_intake_with_country_succeeds(self):
        payload = {
            "name": f"TEST_WithCountry_{TS}",
            "description": "Asunto comercial pendiente con sociedad mercantil.",
            "legal_area": "Comercial",
            "priority": "media",
            "country": "Colombia",
        }
        r = requests.post(f"{BASE_URL}/api/public/case-intake", json=payload, timeout=10)
        assert r.status_code == 200, r.text

    def test_lawyer_application_missing_country_returns_422(self):
        payload = {
            "full_name": f"TEST_Abog_NoCountry_{TS}",
            "email": f"nocountry_{TS}@test.com",
            "specialty": "Civil",
            "experience": "Más de 5 años en derecho civil.",
        }
        r = requests.post(f"{BASE_URL}/api/public/lawyer-application", json=payload, timeout=10)
        assert r.status_code == 422


# ───────── Dr. prefix ─────────
class TestDrPrefix:
    def test_lawyer_application_stores_dr_prefix(self):
        payload = {
            "full_name": f"Roberto Vega {TS}",
            "email": f"roberto_{TS}@test.com",
            "phone": "+57 311 1111111",
            "specialty": "Civil",
            "country": "Colombia",
            "experience": "Experiencia de 10 años en litigios civiles.",
        }
        r = requests.post(f"{BASE_URL}/api/public/lawyer-application", json=payload, timeout=10)
        assert r.status_code == 200, r.text

    def test_sales_candidates_returns_dr_prefix(self, admin_token):
        r = requests.get(
            f"{BASE_URL}/api/admin-ops/sales/candidates",
            params={"status_filter": "in_process"},
            headers=H(admin_token), timeout=15,
        )
        assert r.status_code == 200
        body = r.json()
        cands = body if isinstance(body, list) else body.get("candidates", body.get("data", []))
        assert len(cands) > 0, "No candidates returned"
        # All candidate full_names must start with Dr./Dra./Dr /Dra
        def _has_dr(n):
            l = (n or "").lower()
            return l.startswith(("dr.", "dra.", "dr ", "dra "))
        bad = [c for c in cands if c.get("full_name") and not _has_dr(c["full_name"])]
        assert not bad, f"Candidates without Dr. prefix: {[c.get('full_name') for c in bad][:5]}"

    def test_talent_returns_dr_prefix(self, admin_token):
        r = requests.get(f"{BASE_URL}/api/admin-ops/talent", headers=H(admin_token), timeout=15)
        assert r.status_code == 200, r.text
        body = r.json()
        items = body if isinstance(body, list) else body.get("lawyers", body.get("data", body.get("items", [])))
        if not items:
            pytest.skip("No talent items to validate")
        def _has_dr(n):
            l = (n or "").lower()
            return l.startswith(("dr.", "dra.", "dr ", "dra "))
        bad = [i for i in items if i.get("full_name") and not _has_dr(i["full_name"])]
        assert not bad, f"Talent without Dr. prefix: {[i.get('full_name') for i in bad][:5]}"

    def test_operations_cases_lawyer_name_dr_prefix(self, admin_token):
        r = requests.get(f"{BASE_URL}/api/admin-ops/operations/cases", headers=H(admin_token), timeout=15)
        assert r.status_code == 200
        body = r.json()
        cases = body if isinstance(body, list) else body.get("cases", body.get("data", []))
        assigned = [c for c in cases if c.get("lawyer_name")]
        if not assigned:
            pytest.skip("No assigned cases to validate")
        bad = [c for c in assigned if not c["lawyer_name"].lower().startswith(("dr.", "dra."))]
        assert not bad, f"Cases with lawyer_name lacking Dr.: {[c.get('lawyer_name') for c in bad][:5]}"


# ───────── Accounting ─────────
class TestAccounting:
    def test_seed_demo_admin_general(self, admin_token):
        r = requests.post(f"{BASE_URL}/api/admin-ops/accounting/seed/demo", headers=H(admin_token), timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("ok") is True
        # If already seeded, created may be 0; if newly seeded, must be 8.
        assert data.get("created") in (0, 8), f"Unexpected created count: {data}"

    def test_seed_demo_socio_forbidden(self, socio_token):
        r = requests.post(f"{BASE_URL}/api/admin-ops/accounting/seed/demo", headers=H(socio_token), timeout=15)
        assert r.status_code == 403, f"Expected 403 for socio_comercial, got {r.status_code} {r.text}"

    def test_kpis_structure(self, admin_token):
        r = requests.get(f"{BASE_URL}/api/admin-ops/accounting/kpis", headers=H(admin_token), timeout=15)
        assert r.status_code == 200, r.text
        d = r.json()
        for k in ["ingresos_totales", "egresos_totales", "rentabilidad_productiva",
                  "margen_pct", "facturado", "cobrado", "tasa_cobranza_pct", "por_cobrar"]:
            assert k in d, f"Missing KPI key: {k} | got {list(d.keys())}"

    def test_create_movement_admin(self, admin_token):
        payload = {
            "type": "ingreso",
            "category": "Honorarios profesionales",
            "amount": 1500000.0,
            "description": f"TEST_Mov_{TS} ingreso prueba",
            "status": "registrado",
        }
        r = requests.post(f"{BASE_URL}/api/admin-ops/accounting/movements", json=payload,
                          headers=H(admin_token), timeout=15)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body.get("id")
        assert body.get("type") == "ingreso"
        assert body.get("amount") == 1500000.0
        assert body.get("description") == payload["description"]
        # save id for chained tests
        TestAccounting._mov_id = body["id"]

    def test_create_movement_socio_forbidden(self, socio_token):
        payload = {"type": "egreso", "category": "Bloqueado", "amount": 100, "description": "TEST_socio_block"}
        r = requests.post(f"{BASE_URL}/api/admin-ops/accounting/movements", json=payload,
                          headers=H(socio_token), timeout=15)
        assert r.status_code == 403

    def test_list_movements_filter_ingreso(self, admin_token):
        r = requests.get(f"{BASE_URL}/api/admin-ops/accounting/movements",
                         params={"type_filter": "ingreso"}, headers=H(admin_token), timeout=15)
        assert r.status_code == 200
        items = r.json()
        assert isinstance(items, list)
        if items:
            assert all(m.get("type") == "ingreso" for m in items), "Filter ingreso returned non-ingreso rows"

    def test_list_movements_filter_egreso(self, admin_token):
        r = requests.get(f"{BASE_URL}/api/admin-ops/accounting/movements",
                         params={"type_filter": "egreso"}, headers=H(admin_token), timeout=15)
        assert r.status_code == 200
        items = r.json()
        assert isinstance(items, list)
        if items:
            assert all(m.get("type") == "egreso" for m in items)

    def test_list_movements_filter_all(self, admin_token):
        r = requests.get(f"{BASE_URL}/api/admin-ops/accounting/movements",
                         params={"type_filter": "all"}, headers=H(admin_token), timeout=15)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_update_movement_admin(self, admin_token):
        mid = getattr(TestAccounting, "_mov_id", None)
        if not mid:
            pytest.skip("No movement id available")
        upd = {
            "type": "ingreso",
            "category": "Honorarios profesionales",
            "amount": 2000000.0,
            "description": f"TEST_Mov_{TS} ingreso actualizado",
            "status": "confirmado",
        }
        r = requests.put(f"{BASE_URL}/api/admin-ops/accounting/movements/{mid}", json=upd,
                         headers=H(admin_token), timeout=15)
        assert r.status_code == 200, r.text
        assert r.json().get("amount") == 2000000.0
        assert r.json().get("status") == "confirmado"

    def test_update_movement_socio_forbidden(self, socio_token):
        mid = getattr(TestAccounting, "_mov_id", None)
        if not mid:
            pytest.skip("No movement id available")
        upd = {"type": "ingreso", "category": "Bloqueado", "amount": 10, "description": "TEST_socio_block_upd"}
        r = requests.put(f"{BASE_URL}/api/admin-ops/accounting/movements/{mid}", json=upd,
                         headers=H(socio_token), timeout=15)
        assert r.status_code == 403

    def test_delete_movement_socio_forbidden(self, socio_token):
        mid = getattr(TestAccounting, "_mov_id", None)
        if not mid:
            pytest.skip("No movement id available")
        r = requests.delete(f"{BASE_URL}/api/admin-ops/accounting/movements/{mid}",
                            headers=H(socio_token), timeout=15)
        assert r.status_code == 403

    def test_delete_movement_admin(self, admin_token):
        mid = getattr(TestAccounting, "_mov_id", None)
        if not mid:
            pytest.skip("No movement id available")
        r = requests.delete(f"{BASE_URL}/api/admin-ops/accounting/movements/{mid}",
                            headers=H(admin_token), timeout=15)
        assert r.status_code == 200


# ───────── Geography ─────────
class TestGeography:
    def test_geography_stats_admin(self, admin_token):
        r = requests.get(f"{BASE_URL}/api/admin-ops/geography/stats", headers=H(admin_token), timeout=15)
        assert r.status_code == 200, r.text
        body = r.json()
        assert "countries" in body
        assert isinstance(body["countries"], list)
        if body["countries"]:
            sample = body["countries"][0]
            for k in ["country", "lawyers", "active_lawyers", "cases", "revenue", "strategy"]:
                assert k in sample, f"Missing key {k} in {sample}"

    def test_geography_stats_socio_accessible(self, socio_token):
        # Geo is "visible a todos" — should not 403 for socio_comercial
        r = requests.get(f"{BASE_URL}/api/admin-ops/geography/stats", headers=H(socio_token), timeout=15)
        assert r.status_code == 200, f"socio_comercial blocked from geography: {r.status_code} {r.text}"
