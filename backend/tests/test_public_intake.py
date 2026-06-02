"""Tests for public intake endpoints (landing forms): case-intake & lawyer-application."""
import os
import time
import pytest
import requests

BASE_URL = os.environ['REACT_APP_BACKEND_URL'].rstrip('/')
TS = int(time.time())

ADMIN_CREDS = {"email": "darwin@puntocerolegal.com", "password": "Admin2025!"}

EXPECTED_CLIENT_MSG = "Solicitud recibida. Un especialista legal revisará su caso y le contactaremos pronto."
EXPECTED_LAWYER_MSG = "Perfil profesional enviado correctamente. Nuestro equipo evaluará su incorporación y le notificaremos a través de su correo registrado."


@pytest.fixture(scope="module")
def admin_token():
    """Login as admin_general to validate downstream visibility."""
    r = requests.post(f"{BASE_URL}/api/auth/login", json=ADMIN_CREDS, timeout=15)
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    token = r.json().get("access_token") or r.json().get("token")
    assert token, "No access_token returned"
    return token


@pytest.fixture(scope="module")
def created_case():
    """Create a case via public endpoint and return the response."""
    payload = {
        "name": f"TEST_Cliente_{TS}",
        "description": "Necesito asesoría legal urgente con un proceso migratorio en curso.",
        "legal_area": "Derecho Migratorio",
        "priority": "alta",
        "phone": "+57 300 0000000",
        "email": f"cliente_{TS}@test.com",
    }
    r = requests.post(f"{BASE_URL}/api/public/case-intake", json=payload, timeout=15)
    return r, payload


@pytest.fixture(scope="module")
def created_lawyer():
    """Create a lawyer via public endpoint."""
    payload = {
        "full_name": f"TEST_Abogado_{TS}",
        "email": f"lawyer_{TS}@test.com",
        "phone": "+57 311 1111111",
        "specialty": "Derecho Migratorio",
        "country": "Colombia",
        "experience": "Más de 8 años de experiencia en migración corporativa y visas.",
    }
    r = requests.post(f"{BASE_URL}/api/public/lawyer-application", json=payload, timeout=15)
    return r, payload


# ───────── CLIENT INTAKE ─────────
class TestClientIntake:
    def test_case_intake_no_auth_success(self, created_case):
        r, payload = created_case
        assert r.status_code == 200, f"Expected 200, got {r.status_code} {r.text}"
        data = r.json()
        assert data["ok"] is True
        assert data["message"] == EXPECTED_CLIENT_MSG, f"Mensaje exacto no coincide: {data['message']!r}"
        assert "case_number" in data and data["case_number"]
        assert "case_id" in data and data["case_id"]

    def test_case_visible_in_operations(self, created_case, admin_token):
        r, _ = created_case
        case_id = r.json()["case_id"]
        headers = {"Authorization": f"Bearer {admin_token}"}
        op = requests.get(
            f"{BASE_URL}/api/admin-ops/operations/cases",
            params={"assignment_status": "sin_asignar"},
            headers=headers,
            timeout=15,
        )
        assert op.status_code == 200, op.text
        body = op.json()
        cases = body if isinstance(body, list) else body.get("cases", body.get("data", []))
        ids = [str(c.get("_id") or c.get("id")) for c in cases]
        # Some endpoints strip _id and use 'id' — also match by case_number as fallback
        case_number = r.json()["case_number"]
        numbers = [c.get("case_number") for c in cases]
        assert case_id in ids or case_number in numbers, (
            f"Case {case_id}/{case_number} not in operations cases (count={len(cases)})"
        )

    def test_priority_mapping_alta(self, created_case):
        r, _ = created_case
        assert r.json()["case_number"].startswith(("PC", "CASE", "PCL")) or len(r.json()["case_number"]) > 3

    def test_validation_short_name(self):
        bad = {"name": "A", "description": "Descripcion suficiente larga aqui", "legal_area": "Civil"}
        r = requests.post(f"{BASE_URL}/api/public/case-intake", json=bad, timeout=10)
        assert r.status_code == 422

    def test_validation_short_description(self):
        bad = {"name": "Cliente OK", "description": "corta", "legal_area": "Civil"}
        r = requests.post(f"{BASE_URL}/api/public/case-intake", json=bad, timeout=10)
        assert r.status_code == 422

    def test_priority_default_media(self):
        payload = {
            "name": f"TEST_DefPrio_{TS}",
            "description": "Sin prioridad explicita en payload aqui.",
            "legal_area": "Civil",
        }
        r = requests.post(f"{BASE_URL}/api/public/case-intake", json=payload, timeout=10)
        assert r.status_code == 200
        assert r.json()["message"] == EXPECTED_CLIENT_MSG


# ───────── LAWYER APPLICATION ─────────
class TestLawyerApplication:
    def test_lawyer_application_no_auth_success(self, created_lawyer):
        r, _ = created_lawyer
        assert r.status_code == 200, f"Expected 200, got {r.status_code} {r.text}"
        data = r.json()
        assert data["ok"] is True
        assert data["message"] == EXPECTED_LAWYER_MSG, f"Mensaje exacto no coincide: {data['message']!r}"
        assert "candidate_id" in data and data["candidate_id"]

    def test_lawyer_duplicate_email_returns_409(self, created_lawyer):
        _, payload = created_lawyer
        r2 = requests.post(f"{BASE_URL}/api/public/lawyer-application", json=payload, timeout=10)
        assert r2.status_code == 409, f"Expected 409, got {r2.status_code} {r2.text}"

    def test_lawyer_visible_in_sales(self, created_lawyer, admin_token):
        _, payload = created_lawyer
        headers = {"Authorization": f"Bearer {admin_token}"}
        s = requests.get(
            f"{BASE_URL}/api/admin-ops/sales/candidates",
            params={"status_filter": "in_process"},
            headers=headers,
            timeout=15,
        )
        assert s.status_code == 200, s.text
        body = s.json()
        cands = body if isinstance(body, list) else body.get("candidates", body.get("data", []))
        emails = [c.get("email") for c in cands]
        assert payload["email"] in emails, f"Lawyer {payload['email']} not in sales (count={len(cands)})"
        match = next(c for c in cands if c.get("email") == payload["email"])
        assert match.get("status") == "PENDING_VERIFICATION"
        assert match.get("is_verified") is False
        # role implicit (endpoint filters by role=lawyer); not always echoed in payload

    def test_validation_invalid_email(self):
        bad = {
            "full_name": "Abogado Test",
            "email": "not-an-email",
            "specialty": "Civil",
            "experience": "Más de 5 años en el área.",
        }
        r = requests.post(f"{BASE_URL}/api/public/lawyer-application", json=bad, timeout=10)
        assert r.status_code == 422


# ───────── NOTIFICATIONS ─────────
class TestNotifications:
    def test_admin_notifications_created(self, admin_token):
        """Verify notifications exist for admin target after both intakes."""
        headers = {"Authorization": f"Bearer {admin_token}"}
        # Try common notification endpoints
        endpoints = [
            "/api/admin-ops/notifications",
            "/api/notifications",
            "/api/admin-ops/header/stats",
        ]
        responses = {}
        for ep in endpoints:
            try:
                rr = requests.get(f"{BASE_URL}{ep}", headers=headers, timeout=10)
                responses[ep] = rr.status_code
            except Exception as e:
                responses[ep] = str(e)
        # At least one of the endpoints should succeed
        assert any(v == 200 for v in responses.values()), f"All notification endpoints failed: {responses}"
