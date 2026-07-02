from pathlib import Path
import os
import sys
import socket
import subprocess
import traceback

BACKEND_DIR = Path(__file__).parent
SERVER_FILE = BACKEND_DIR / "server.py"
REQUIREMENTS_FILE = BACKEND_DIR / "requirements.txt"
ENV_FILE = BACKEND_DIR / ".env"
PORT = 8000


def check_python():
    return True, sys.version.split()[0]


def check_uvicorn_installed():
    try:
        import uvicorn
        return True, getattr(uvicorn, '__version__', 'unknown')
    except Exception as exc:
        return False, str(exc)


def load_env(env_path):
    data = {}
    try:
        text = Path(env_path).read_text(encoding='utf-8')
    except Exception:
        return data
    for line in text.splitlines():
        line = line.strip()
        if not line or line.startswith('#') or '=' not in line:
            continue
        key, value = line.split('=', 1)
        data[key.strip()] = value.strip().strip('"').strip("'")
    return data


def classify_error(exc):
    message = str(exc).lower()
    if 'authentication failed' in message or 'auth failed' in message or 'unauthorized' in message:
        return 'Auth failed'
    if 'connection refused' in message or 'failed to establish a connection' in message or 'connectionrefusederror' in message:
        return 'Mongo no está corriendo'
    if 'getaddrinfo failed' in message or 'name or service not known' in message or 'network is unreachable' in message:
        return 'Network unreachable'
    if 'invalid uri' in message or 'bad uri' in message or 'configuration error' in message:
        return 'URL incorrecta'
    if 'server selection timeout' in message or 'timed out' in message:
        return 'Mongo no está corriendo'
    return 'URL incorrecta'


def try_connect_mongo(url):
    try:
        import pymongo
        from pymongo import MongoClient
    except ImportError as exc:
        return False, 'IMPORT_ERROR', f'pymongo missing: {exc}'

    try:
        client = MongoClient(url, serverSelectionTimeoutMS=5000, connectTimeoutMS=5000)
        client.admin.command('ping')
        return True, 'OK', 'MongoDB conectado con pymongo'
    except Exception as exc:
        return False, classify_error(exc), str(exc)


def verify_backend_import():
    if not SERVER_FILE.exists():
        return False, 'backend/server.py no existe'
    if str(BACKEND_DIR) not in sys.path:
        sys.path.insert(0, str(BACKEND_DIR))
    try:
        import server
    except Exception as exc:
        return False, f'import error: {type(exc).__name__}: {exc}'
    if not hasattr(server, 'app'):
        return False, 'server.app no existe'
    try:
        from fastapi.testclient import TestClient
    except ImportError as exc:
        return False, f'fastapi/testclient no disponible: {exc}'
    try:
        app = server.app
        with TestClient(app) as client:
            response = client.get('/api/health')
            if response.status_code >= 400:
                return False, f'health endpoint returned {response.status_code}'
    except Exception as exc:
        return False, f'startup error: {type(exc).__name__}: {exc}'
    return True, 'FastAPI importada y arrancada en modo test'


def is_port_busy(port):
    try:
        with socket.create_connection(('127.0.0.1', port), timeout=1):
            return True
    except ConnectionRefusedError:
        return False
    except socket.timeout:
        return True
    except OSError:
        return False
    except Exception:
        return True


def get_port_conflict(port):
    pid = None
    process_name = None
    uvicorn_detected = False
    if os.name == 'nt':
        try:
            netstat = subprocess.run(['netstat', '-ano'], capture_output=True, text=True)
            for line in netstat.stdout.splitlines():
                if f':{port} ' not in line and not line.strip().endswith(f':{port}'):
                    continue
                parts = line.split()
                if len(parts) < 5:
                    continue
                pid = parts[-1]
                break
            if pid:
                task = subprocess.run(['tasklist', '/fi', f'PID eq {pid}', '/fo', 'csv', '/nh'], capture_output=True, text=True)
                if task.stdout:
                    process_name = task.stdout.split(',')[0].strip('"').strip()
        except Exception:
            pass
    try:
        with socket.create_connection(('127.0.0.1', port), timeout=1) as sock:
            sock.sendall(b'GET / HTTP/1.1\r\nHost: 127.0.0.1\r\nConnection: close\r\n\r\n')
            data = sock.recv(1024).decode(errors='ignore').lower()
            if 'uvicorn' in data:
                uvicorn_detected = True
    except Exception:
        pass
    return pid, process_name, uvicorn_detected


def summary_line(ok, name):
    return f"✔ {name} OK" if ok else f"✖ {name} FAIL"


def main():
    python_ok, python_version = check_python()
    uvicorn_ok, uvicorn_info = check_uvicorn_installed()
    backend_files_ok = SERVER_FILE.exists() and REQUIREMENTS_FILE.exists()
    mongo_env = load_env(ENV_FILE)
    mongo_url = mongo_env.get('MONGO_URL', '')

    if mongo_url:
        mongo_ok, mongo_status, mongo_detail = try_connect_mongo(mongo_url)
    else:
        mongo_ok, mongo_status, mongo_detail = False, 'URL incorrecta', 'MONGO_URL no definido en backend/.env'

    fastapi_ok, fastapi_detail = verify_backend_import()
    port_busy = is_port_busy(PORT)
    pid, process_name, uvicorn_detected = get_port_conflict(PORT)

    print('=== backend_diagnostic_full.py ===')
    print(f'Python version: {python_version}')
    print(f'backend/server.py exists: {SERVER_FILE.exists()}')
    print(f'backend/requirements.txt exists: {REQUIREMENTS_FILE.exists()}')
    print(f'uvicorn installed: {uvicorn_ok} ({uvicorn_info})')
    print(f'MONGO_URL: {mongo_url or "<sin MONGO_URL>"}')
    print()
    print(summary_line(python_ok, 'Python'))
    print(summary_line(backend_files_ok, 'Backend files'))
    print(summary_line(uvicorn_ok, 'uvicorn'))
    print(summary_line(mongo_ok, 'MongoDB'))
    print(summary_line(fastapi_ok, 'FastAPI import'))
    print(summary_line(not port_busy, 'Port 8000'))
    print()

    if not backend_files_ok:
        print('DIAGNÓSTICO FINAL: Fallo crítico: dependencias faltantes o archivos backend ausentes')
        sys.exit(1)
    if not uvicorn_ok:
        print(f'DIAGNÓSTICO FINAL: Fallo crítico: uvicorn no está instalado ({uvicorn_info})')
        sys.exit(1)
    if not mongo_ok:
        print(f'DIAGNÓSTICO FINAL: Fallo crítico: MongoDB no disponible ({mongo_status})')
        print(f'DETALLE: {mongo_detail}')
        sys.exit(1)
    if not fastapi_ok:
        print(f'DIAGNÓSTICO FINAL: Fallo crítico: FastAPI no levanta ({fastapi_detail})')
        sys.exit(1)
    if port_busy:
        details = f'PID {pid}' if pid else 'Puerto ocupado'
        if process_name:
            details += f' ({process_name})'
        print(f'DIAGNÓSTICO FINAL: Fallo crítico: puerto 8000 bloqueado - {details}')
        sys.exit(1)

    print('DIAGNÓSTICO FINAL: Backend listo')
    sys.exit(0)


if __name__ == '__main__':
    try:
        main()
    except Exception:
        print('DIAGNÓSTICO FINAL: Error inesperado al ejecutar backend_diagnostic_full.py')
        traceback.print_exc()
        sys.exit(1)
