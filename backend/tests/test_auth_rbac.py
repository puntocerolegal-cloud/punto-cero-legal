"""
Tests E2E para flujo de autenticación + verificación + RBAC en Punto Cero Legal.

Cubre:
- Registro lawyer -> PENDING_VERIFICATION / is_verified=false
- Login admin_general y socio_comercial -> is_verified=true
- /auth/me refleja estado real (pendiente -> aprobado)
- /admin/access-audit/pending lista pendientes
- approve/reject solo admin_general (socio_comercial 403)
- socio_comercial 403 en /admin/dashboard/general
- lawyer 403 en /admin/*
"""
import os
import uuid
import time
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://punto-cero-legal-2.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_GENERAL = {"email": "darwin@puntocerolegal.com", "password": "Admin2025!"}
SOCIO = {"email": "alejandro@puntocerolegal.com", "password": "Socio2025!"}


# ---------------- Helpers ----------------
def _login(creds):
    r = requests.post(f"{API}/auth/login", json=creds, timeout=20)
    return r


def _auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="module")
def admin_token():
    r = _login(ADMIN_GENERAL)
    assert r.status_code == 200, f"admin login failed: {r.status_code} {r.text}"
    return r.json()["access_token"]


@pytest.fixture(scope="module")
def socio_token():
    r = _login(SOCIO)
    assert r.status_code == 200, f"socio login failed: {r.status_code} {r.text}"
    return r.json()["access_token"]


@pytest.fixture(scope="module")
def new_lawyer():
    """Crea un abogado nuevo único para esta corrida."""
    uniq = uuid.uuid4().hex[:8]
    email = f"TEST_lawyer_{uniq}@puntocero.legal"
    payload = {
        "email": email,
        "password": "TestPass2025!",
        "full_name": "Dr. Test Lawyer",
        "role": "lawyer",
        "phone": "+573001112233",
        "country": "Colombia",
        "specialty": "Civil",
        "bar_number": f"TJ-{uniq}",
        "firm_name": f"Firma Test {uniq}",
        "id_document": f"CC{uniq}",
    }
    r = requests.post(f"{API}/auth/register", json=payload, timeout=20)
    assert r.status_code == 201, f"register failed: {r.status_code} {r.text}"
    data = r.json()
    return {"email": email, "password": "TestPass2025!", "token": data["access_token"], "user": data["user"]}


# ---------------- Health ----------------
class TestHealth:
    def test_health(self):
        r = requests.get(f"{API}/health", timeout=15)
        assert r.status_code == 200
        assert r.json().get("status") == "healthy"


# ---------------- Register / Login ----------------
class TestRegistrationVerification:
    def test_register_lawyer_pending(self, new_lawyer):
        u = new_lawyer["user"]
        assert u["role"] == "lawyer"
        assert u["is_verified"] == False
        assert u["status"] == "PENDING_VERIFICATION"

    def test_me_pending_after_register(self, new_lawyer):
        r = requests.get(f"{API}/auth/me", headers=_auth_headers(new_lawyer["token"]), timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["is_verified"] == False
        assert data["status"] == "PENDING_VERIFICATION"
        assert data["role"] == "lawyer"


class TestAdminLogin:
    def test_admin_general_login(self, admin_token):
        r = requests.get(f"{API}/auth/me", headers=_auth_headers(admin_token), timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert data["is_verified"] == True
        assert data["status"] == "ACTIVE"
        assert data["role"] == "admin_general"

    def test_socio_login(self, socio_token):
        r = requests.get(f"{API}/auth/me", headers=_auth_headers(socio_token), timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert data["is_verified"] == True
        assert data["role"] == "socio_comercial"

    def test_login_response_includes_is_verified(self):
        r = _login(ADMIN_GENERAL)
        assert r.status_code == 200
        body = r.json()
        assert body["user"]["is_verified"] == True
        assert body["user"]["role"] == "admin_general"


# ---------------- Access Audit ----------------
class TestAccessAudit:
    def test_pending_list_requires_admin(self):
        r = requests.get(f"{API}/admin/access-audit/pending", timeout=15)
        assert r.status_code == 401

    def test_pending_list_lawyer_forbidden(self, new_lawyer):
        r = requests.get(f"{API}/admin/access-audit/pending", headers=_auth_headers(new_lawyer["token"]), timeout=15)
        assert r.status_code == 403

    def test_pending_list_admin_ok_and_contains_new_lawyer(self, admin_token, new_lawyer):
        r = requests.get(f"{API}/admin/access-audit/pending", headers=_auth_headers(admin_token), timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert "users" in data
        emails = [u["email"] for u in data["users"]]
        assert new_lawyer["email"] in emails, f"new lawyer not in pending: emails sample={emails[:5]}"

    def test_socio_cannot_approve(self, socio_token, new_lawyer):
        uid = new_lawyer["user"]["id"]
        r = requests.post(f"{API}/admin/access-audit/{uid}/approve", headers=_auth_headers(socio_token), timeout=15)
        assert r.status_code == 403, f"socio should NOT approve but got {r.status_code}"

    def test_socio_cannot_reject(self, socio_token, new_lawyer):
        uid = new_lawyer["user"]["id"]
        r = requests.post(f"{API}/admin/access-audit/{uid}/reject", headers=_auth_headers(socio_token), timeout=15)
        assert r.status_code == 403

    def test_admin_approves_user(self, admin_token, new_lawyer):
        uid = new_lawyer["user"]["id"]
        r = requests.post(f"{API}/admin/access-audit/{uid}/approve", headers=_auth_headers(admin_token), timeout=15)
        assert r.status_code == 200, r.text
        # Verificar via /auth/me que ahora is_verified=true
        time.sleep(0.5)
        me = requests.get(f"{API}/auth/me", headers=_auth_headers(new_lawyer["token"]), timeout=15)
        assert me.status_code == 200
        body = me.json()
        assert body["is_verified"] == True, f"after approve still not verified: {body}"
        assert body["status"] == "ACTIVE"

    def test_lawyer_no_longer_in_pending(self, admin_token, new_lawyer):
        r = requests.get(f"{API}/admin/access-audit/pending", headers=_auth_headers(admin_token), timeout=15)
        assert r.status_code == 200
        emails = [u["email"] for u in r.json()["users"]]
        assert new_lawyer["email"] not in emails


# ---------------- RBAC ----------------
class TestRBAC:
    def test_socio_cannot_access_general_dashboard(self, socio_token):
        r = requests.get(f"{API}/admin/dashboard/general", headers=_auth_headers(socio_token), timeout=15)
        assert r.status_code == 403, f"socio should NOT access general dashboard, got {r.status_code}"

    def test_socio_can_access_comercial_dashboard(self, socio_token):
        r = requests.get(f"{API}/admin/dashboard/comercial", headers=_auth_headers(socio_token), timeout=15)
        assert r.status_code == 200

    def test_admin_general_can_access_general_dashboard(self, admin_token):
        r = requests.get(f"{API}/admin/dashboard/general", headers=_auth_headers(admin_token), timeout=15)
        assert r.status_code == 200

    def test_lawyer_forbidden_admin_routes(self, new_lawyer):
        # nuevo lawyer (ya aprobado en este punto, sigue siendo lawyer)
        token = new_lawyer["token"]
        for path in ["/admin/me", "/admin/dashboard/general", "/admin/dashboard/comercial", "/admin/access-audit/pending"]:
            r = requests.get(f"{API}{path}", headers=_auth_headers(token), timeout=15)
            assert r.status_code == 403, f"lawyer should be 403 on {path}, got {r.status_code}"
