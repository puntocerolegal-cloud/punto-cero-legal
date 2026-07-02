from pathlib import Path
import sys
import traceback


def ensure_backend_path():
    backend_dir = Path(__file__).parent
    backend_path = str(backend_dir)
    if backend_path not in sys.path:
        sys.path.insert(0, backend_path)
    return backend_dir


def import_server_module():
    try:
        import server
        return server, None
    except Exception as exc:
        return None, exc


def check_fastapi_start(server_module):
    try:
        from fastapi.testclient import TestClient
    except ImportError as exc:
        return False, f"Dependency missing: {exc}"

    if not hasattr(server_module, "app"):
        return False, "server.app no existe en backend/server.py"

    try:
        app = server_module.app
        with TestClient(app) as client:
            response = client.get("/api/health")
            if response.status_code >= 400:
                return False, f"Health endpoint returned {response.status_code}"
        return True, "FastAPI app importada y arrancada en modo test"
    except Exception as exc:
        return False, f"Startup error: {exc}"


def main():
    backend_dir = ensure_backend_path()
    server_file = backend_dir / "server.py"
    requirements_file = backend_dir / "requirements.txt"

    print("=== test_backend_start.py ===")
    print(f"backend/server.py exists: {server_file.exists()}")
    print(f"backend/requirements.txt exists: {requirements_file.exists()}")

    server_module, import_exc = import_server_module()
    if import_exc is not None:
        print("IMPORT ERROR: No se pudo importar backend/server.py")
        print(f"ERROR: {type(import_exc).__name__}: {import_exc}")
        traceback.print_exc()
        sys.exit(1)

    ok, message = check_fastapi_start(server_module)
    if ok:
        print("DIAGNÓSTICO: FastAPI import OK")
        print(f"DETALLE: {message}")
        sys.exit(0)

    print("DIAGNÓSTICO: FastAPI import FAIL")
    print(f"ERROR: {message}")
    sys.exit(1)


if __name__ == "__main__":
    try:
        main()
    except Exception:
        print("DIAGNÓSTICO: Error inesperado al ejecutar test_backend_start.py")
        traceback.print_exc()
        sys.exit(1)
