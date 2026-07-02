import os
import sys
import traceback

LOGIN_URLS = [
    "http://127.0.0.1:8000/api/auth/login",
]
DUMMY_EMAIL = "admin@puntocerolegal.com"
DUMMY_PASSWORD = "Admin2025!"


def try_http_login():
    try:
        import requests
    except ImportError as exc:
        return False, f"requests missing: {exc}", None

    last_error = None
    for url in LOGIN_URLS:
        try:
            response = requests.post(url, json={"email": DUMMY_EMAIL, "password": DUMMY_PASSWORD}, timeout=10)
        except Exception as exc:
            last_error = f"Connection error: {exc}"
            continue

        try:
            payload = response.json()
        except Exception:
            payload = None

        if response.status_code == 200 and payload and payload.get("access_token"):
            return True, f"LOGIN OK via HTTP {url}", payload
        if response.status_code in (401, 403):
            detail = payload.get("detail") if isinstance(payload, dict) else response.text
            return False, f"LOGIN FAIL: auth rejected ({response.status_code}) - {detail}", payload
        if response.status_code == 404:
            last_error = f"LOGIN FAIL: endpoint no encontrado ({url})"
            continue
        return False, f"LOGIN FAIL: HTTP {response.status_code} - {payload}", payload

    return False, last_error or "LOGIN FAIL: no se pudo conectar a ningún endpoint", None

    try:
        payload = response.json()
    except Exception:
        payload = None

    if response.status_code == 200 and payload and payload.get("access_token"):
        return True, "LOGIN OK via HTTP", payload
    if response.status_code in (401, 403):
        detail = payload.get("detail") if isinstance(payload, dict) else response.text
        return False, f"LOGIN FAIL: auth rejected ({response.status_code}) - {detail}", payload
    if response.status_code == 404:
        return False, "LOGIN FAIL: endpoint no encontrado", payload
    return False, f"LOGIN FAIL: HTTP {response.status_code} - {payload}", payload


def try_testclient_login():
    try:
        from fastapi.testclient import TestClient
    except ImportError as exc:
        return False, f"TestClient missing: {exc}", None

    try:
        import server
    except Exception as exc:
        return False, f"Import error: {type(exc).__name__}: {exc}", None

    if not hasattr(server, "app"):
        return False, "server.app no existe", None

    try:
        with TestClient(server.app) as client:
            response = client.post("/auth/login", json={"email": DUMMY_EMAIL, "password": DUMMY_PASSWORD})
            payload = response.json()
            if response.status_code == 200 and payload.get("access_token"):
                return True, "LOGIN OK via TestClient", payload
            if response.status_code in (401, 403):
                return False, f"LOGIN FAIL: auth rejected ({response.status_code}) - {payload.get('detail')}", payload
            return False, f"LOGIN FAIL: HTTP {response.status_code} - {payload}", payload
    except Exception as exc:
        return False, f"TestClient startup error: {type(exc).__name__}: {exc}", None


def main():
    print("=== test_login_flow.py ===")
    print(f"Login endpoints: {LOGIN_URLS}")
    print(f"Dummy credentials: {DUMMY_EMAIL} / {DUMMY_PASSWORD}")

    ok, message, payload = try_http_login()
    if ok:
        print("✔ LOGIN OK")
        print(f"DETAIL: {message}")
        print(f"ACCESS_TOKEN: {payload.get('access_token')}")
        return 0

    print(f"HTTP login failed: {message}")
    print("Intentando login con TestClient local...")
    ok2, message2, payload2 = try_testclient_login()
    if ok2:
        print("✔ LOGIN OK")
        print(f"DETAIL: {message2}")
        print(f"ACCESS_TOKEN: {payload2.get('access_token')}")
        return 0

    print(f"❌ LOGIN FAIL")
    print(f"RAZÓN: {message2}")
    if payload2 is not None:
        print(f"RESPUESTA: {payload2}")
    return 1


if __name__ == "__main__":
    try:
        exit(main())
    except Exception:
        print("❌ LOGIN FAIL: error inesperado")
        traceback.print_exc()
        sys.exit(1)
