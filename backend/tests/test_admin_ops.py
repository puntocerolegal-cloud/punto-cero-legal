"""
Backend tests for /api/admin-ops/* — Centro de Gestión:
- Header stats / notifications
- Sala de Ventas (sales) candidate listing, approve/reject/pending-payment/notes/chat
- Monitor de Operaciones (cases) listing, auto-assign routing, attended, notes, priority
- Gestión de Talento CRUD (admin_general only)
- Facturación list/reminder/send
- Seeding demo-cases and demo-invoices
- RBAC: socio_comercial cannot approve/reject/talent/seed
"""
import os
import uuid
import requests
import pytest

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
API = f"{BASE_URL}/api"

ADMIN = {"email": "darwin@puntocerolegal.com", "password": "Admin2025!"}
SOCIO = {"email": "alejandro@puntocerolegal.com", "password": "Socio2025!"}


def _login(creds):
    r = requests.post(f"{API}/auth/login", json=creds, timeout=20)
    assert r.status_code == 200, f"login failed for {creds['email']}: {r.text}"
    return r.json()["access_token"]


def H(t):
    return {"Authorization": f"Bearer {t}"}


@pytest.fixture(scope="module")
def admin_token():
    return _login(ADMIN)


@pytest.fixture(scope="module")
def socio_token():
    return _login(SOCIO)


@pytest.fixture(scope="module")
def candidate(admin_token):
    """Create a fresh lawyer candidate to drive sales flow."""
    uniq = uuid.uuid4().hex[:8]
    payload = {
        "email": f"TEST_ops_{uniq}@puntocero.legal",
        "password": "TestPass2025!",
        "full_name": "Dr. Ops Test",
        "role": "lawyer",
        "phone": "+573009998877",
        "country": "Colombia",
        "specialty": "Derecho de Familia",
        "bar_number": f"BN-{uniq}",
        "firm_name": f"Firma {uniq}",
        "id_document": f"CC{uniq}",
    }
    r = requests.post(f"{API}/auth/register", json=payload, timeout=20)
    assert r.status_code == 201, r.text
    return r.json()["user"]


# ============== HEADER ==============
class TestHeader:
    def test_header_stats(self, admin_token):
        r = requests.get(f"{API}/admin-ops/header/stats", headers=H(admin_token), timeout=15)
        assert r.status_code == 200, r.text
        d = r.json()
        for k in ["server_time", "pending_cases", "pending_partners", "notifications_unread"]:
            assert k in d
        assert isinstance(d["pending_cases"], int)
        assert isinstance(d["pending_partners"], int)

    def test_header_requires_auth(self):
        r = requests.get(f"{API}/admin-ops/header/stats", timeout=15)
        assert r.status_code == 401


# ============== SALA DE VENTAS ==============
class TestSales:
    def test_sales_stats(self, admin_token):
        r = requests.get(f"{API}/admin-ops/sales/stats", headers=H(admin_token), timeout=15)
        assert r.status_code == 200
        d = r.json()
        for k in ["total_candidates", "in_process", "active_partners", "rejected"]:
            assert k in d and isinstance(d[k], int)

    def test_candidates_in_process_contains_new(self, admin_token, candidate):
        r = requests.get(f"{API}/admin-ops/sales/candidates?status_filter=in_process", headers=H(admin_token), timeout=15)
        assert r.status_code == 200
        emails = [c["email"] for c in r.json()]
        assert candidate["email"] in emails

    def test_candidates_filter_active_excludes_new(self, admin_token, candidate):
        r = requests.get(f"{API}/admin-ops/sales/candidates?status_filter=active", headers=H(admin_token), timeout=15)
        assert r.status_code == 200
        emails = [c["email"] for c in r.json()]
        assert candidate["email"] not in emails

    def test_socio_cannot_approve(self, socio_token, candidate):
        r = requests.post(f"{API}/admin-ops/sales/candidates/{candidate['id']}/approve", headers=H(socio_token), timeout=15)
        assert r.status_code == 403

    def test_socio_cannot_reject(self, socio_token, candidate):
        r = requests.post(f"{API}/admin-ops/sales/candidates/{candidate['id']}/reject", headers=H(socio_token), timeout=15)
        assert r.status_code == 403

    def test_socio_cannot_pending_payment(self, socio_token, candidate):
        r = requests.post(f"{API}/admin-ops/sales/candidates/{candidate['id']}/pending-payment", headers=H(socio_token), timeout=15)
        assert r.status_code == 403

    def test_admin_pending_payment_then_approve(self, admin_token, candidate):
        # pending-payment
        r = requests.post(f"{API}/admin-ops/sales/candidates/{candidate['id']}/pending-payment", headers=H(admin_token), timeout=15)
        assert r.status_code == 200
        # verify status
        g = requests.get(f"{API}/admin-ops/sales/candidates/{candidate['id']}", headers=H(admin_token), timeout=15)
        assert g.status_code == 200
        assert g.json()["status"] == "PENDING_PAYMENT"
        # approve
        r = requests.post(f"{API}/admin-ops/sales/candidates/{candidate['id']}/approve", headers=H(admin_token), timeout=15)
        assert r.status_code == 200
        g = requests.get(f"{API}/admin-ops/sales/candidates/{candidate['id']}", headers=H(admin_token), timeout=15)
        d = g.json()
        assert d["is_verified"] == True
        assert d["status"] == "ACTIVE"

    def test_notes_persist(self, admin_token, candidate):
        r = requests.put(f"{API}/admin-ops/sales/candidates/{candidate['id']}/notes",
                         json={"private_notes": "Nota privada de prueba"}, headers=H(admin_token), timeout=15)
        assert r.status_code == 200
        g = requests.get(f"{API}/admin-ops/sales/candidates/{candidate['id']}", headers=H(admin_token), timeout=15)
        assert g.json()["private_notes"] == "Nota privada de prueba"

    def test_chat_send_and_list(self, admin_token, candidate):
        r = requests.post(f"{API}/admin-ops/sales/candidates/{candidate['id']}/chat",
                          json={"content": "Hola candidato"}, headers=H(admin_token), timeout=15)
        assert r.status_code == 200
        g = requests.get(f"{API}/admin-ops/sales/candidates/{candidate['id']}/chat", headers=H(admin_token), timeout=15)
        assert g.status_code == 200
        msgs = g.json()
        assert any(m["content"] == "Hola candidato" for m in msgs)


# ============== SEEDING ==============
class TestSeed:
    def test_socio_cannot_seed_cases(self, socio_token):
        r = requests.post(f"{API}/admin-ops/seed/demo-cases", headers=H(socio_token), timeout=20)
        assert r.status_code == 403

    def test_admin_seed_cases_idempotent(self, admin_token):
        r = requests.post(f"{API}/admin-ops/seed/demo-cases", headers=H(admin_token), timeout=30)
        assert r.status_code == 200
        d = r.json()
        assert d["ok"] == True
        assert d["created"] in (0, 10)

    def test_admin_seed_invoices_idempotent(self, admin_token):
        r = requests.post(f"{API}/admin-ops/seed/demo-invoices", headers=H(admin_token), timeout=30)
        assert r.status_code == 200
        d = r.json()
        assert d["created"] in (0, 6)


# ============== OPERATIONS ==============
class TestOperations:
    def test_operations_stats(self, admin_token):
        r = requests.get(f"{API}/admin-ops/operations/stats", headers=H(admin_token), timeout=15)
        assert r.status_code == 200
        d = r.json()
        for k in ["total", "sin_asignar", "asignados", "atendidos", "by_priority"]:
            assert k in d
        assert set(d["by_priority"].keys()) == {"alta", "media", "baja"}

    def test_cases_filter_priority_alta(self, admin_token):
        r = requests.get(f"{API}/admin-ops/operations/cases?priority=alta", headers=H(admin_token), timeout=15)
        assert r.status_code == 200
        for c in r.json():
            assert c["priority_label"] == "alta"

    def test_cases_filter_sin_asignar(self, admin_token):
        r = requests.get(f"{API}/admin-ops/operations/cases?assignment_status=sin_asignar", headers=H(admin_token), timeout=15)
        assert r.status_code == 200
        for c in r.json():
            assert c["assignment_status"] == "sin_asignar"

    def test_auto_assign_no_match_keeps_sin_asignar(self, admin_token):
        # Find a case in an obscure area unlikely to match any verified lawyer
        all_cases = requests.get(f"{API}/admin-ops/operations/cases?assignment_status=sin_asignar",
                                 headers=H(admin_token), timeout=20).json()
        # Pick a "Migratorio" case if exists - usually no verified lawyer
        target = next((c for c in all_cases if c.get("legal_area") == "Derecho Migratorio"), None)
        if not target:
            pytest.skip("no Migratorio case to test no-match path")
        r = requests.post(f"{API}/admin-ops/operations/cases/{target['id']}/auto-assign",
                          headers=H(admin_token), timeout=20)
        assert r.status_code == 200
        d = r.json()
        # If no match, expect ok=False and assignment_status remains sin_asignar
        if d.get("matched") == False:
            g = requests.get(f"{API}/admin-ops/operations/cases?assignment_status=sin_asignar",
                             headers=H(admin_token), timeout=15).json()
            assert any(c["id"] == target["id"] for c in g)

    def test_auto_assign_with_online_specialty_match(self, admin_token, candidate):
        # Force candidate online + Derecho de Familia via talent endpoint
        r = requests.put(f"{API}/admin-ops/talent/{candidate['id']}",
                         json={"is_online": True, "specialty": "Derecho de Familia", "is_verified": True, "status": "ACTIVE"},
                         headers=H(admin_token), timeout=15)
        assert r.status_code == 200
        # Find a Familia case still sin_asignar
        cases = requests.get(f"{API}/admin-ops/operations/cases?assignment_status=sin_asignar",
                             headers=H(admin_token), timeout=20).json()
        target = next((c for c in cases if c.get("legal_area") == "Derecho de Familia"), None)
        if not target:
            pytest.skip("no sin_asignar Familia case left to test match")
        r = requests.post(f"{API}/admin-ops/operations/cases/{target['id']}/auto-assign",
                          headers=H(admin_token), timeout=20)
        assert r.status_code == 200
        d = r.json()
        assert d.get("matched") == True
        assert d.get("lawyer_id")

    def test_mark_attended_and_notes(self, admin_token):
        cases = requests.get(f"{API}/admin-ops/operations/cases", headers=H(admin_token), timeout=20).json()
        assert cases, "expected demo cases to exist"
        cid = cases[0]["id"]
        r = requests.post(f"{API}/admin-ops/operations/cases/{cid}/attended", headers=H(admin_token), timeout=15)
        assert r.status_code == 200
        r = requests.put(f"{API}/admin-ops/operations/cases/{cid}/notes",
                         json={"private_notes": "Nota op"}, headers=H(admin_token), timeout=15)
        assert r.status_code == 200
        # verify state
        cases2 = requests.get(f"{API}/admin-ops/operations/cases", headers=H(admin_token), timeout=20).json()
        found = next(c for c in cases2 if c["id"] == cid)
        assert found["assignment_status"] == "atendido"
        assert found["private_notes"] == "Nota op"


# ============== TALENTO ==============
class TestTalent:
    def test_socio_cannot_list_talent(self, socio_token):
        r = requests.get(f"{API}/admin-ops/talent", headers=H(socio_token), timeout=15)
        assert r.status_code == 403

    def test_admin_list_talent(self, admin_token):
        r = requests.get(f"{API}/admin-ops/talent", headers=H(admin_token), timeout=15)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_socio_cannot_update_talent(self, socio_token, candidate):
        r = requests.put(f"{API}/admin-ops/talent/{candidate['id']}",
                         json={"phone": "+1"}, headers=H(socio_token), timeout=15)
        assert r.status_code == 403

    def test_socio_cannot_delete_talent(self, socio_token, candidate):
        r = requests.delete(f"{API}/admin-ops/talent/{candidate['id']}", headers=H(socio_token), timeout=15)
        assert r.status_code == 403

    def test_admin_can_update_talent(self, admin_token, candidate):
        r = requests.put(f"{API}/admin-ops/talent/{candidate['id']}",
                         json={"phone": "+573000000001"}, headers=H(admin_token), timeout=15)
        assert r.status_code == 200


# ============== FACTURACIÓN ==============
class TestBilling:
    def test_billing_list(self, admin_token):
        r = requests.get(f"{API}/admin-ops/billing", headers=H(admin_token), timeout=15)
        assert r.status_code == 200
        for inv in r.json():
            assert inv["status"] in {"pendiente", "finalizada", "no_terminada"}

    def test_billing_filter_pendiente(self, admin_token):
        r = requests.get(f"{API}/admin-ops/billing?status_filter=pendiente", headers=H(admin_token), timeout=15)
        assert r.status_code == 200
        for inv in r.json():
            assert inv["status"] == "pendiente"

    def test_reminder_and_send(self, admin_token):
        invs = requests.get(f"{API}/admin-ops/billing", headers=H(admin_token), timeout=15).json()
        if not invs:
            pytest.skip("no invoices to test reminder/send")
        iid = invs[0]["id"]
        r = requests.post(f"{API}/admin-ops/billing/{iid}/reminder", headers=H(admin_token), timeout=15)
        assert r.status_code == 200
        assert "mock" in r.json()["message"].lower()
        r = requests.post(f"{API}/admin-ops/billing/{iid}/send", headers=H(admin_token), timeout=15)
        assert r.status_code == 200
