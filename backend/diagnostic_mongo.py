from pathlib import Path
import os
import sys
import traceback


def load_env(env_path):
    data = {}
    try:
        text = Path(env_path).read_text(encoding="utf-8")
    except Exception:
        return data
    for line in text.splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        data[key.strip()] = value.strip().strip('"').strip("'")
    return data


def classify_error(exc):
    message = str(exc).lower()
    if "authentication failed" in message or "auth failed" in message or "unauthorized" in message:
        return "Auth failed"
    if "connection refused" in message or "failed to establish a connection" in message or "connectionrefusederror" in message:
        return "Mongo no está corriendo"
    if "getaddrinfo failed" in message or "name or service not known" in message or "nodename nor servname provided" in message or "network is unreachable" in message:
        return "Network unreachable"
    if "invalid uri" in message or "bad uri" in message or "configuration error" in message or "uri scheme" in message:
        return "URL incorrecta"
    if "server selection timeout" in message or "timed out" in message:
        return "Mongo no está corriendo"
    return "URL incorrecta"


def try_connect_with_pymongo(url):
    try:
        import pymongo
        from pymongo import MongoClient
    except ImportError as exc:
        return False, "IMPORT_ERROR", f"pymongo missing: {exc}"

    try:
        client = MongoClient(url, serverSelectionTimeoutMS=5000, connectTimeoutMS=5000)
        client.admin.command("ping")
        return True, "OK", "MongoDB conectado con pymongo"
    except Exception as exc:
        return False, classify_error(exc), str(exc)


def try_connect_with_motor(url):
    try:
        import asyncio
        from motor.motor_asyncio import AsyncIOMotorClient
    except ImportError as exc:
        return False, "IMPORT_ERROR", f"motor missing: {exc}"

    try:
        async def ping():
            client = AsyncIOMotorClient(
                url,
                serverSelectionTimeoutMS=5000,
                connectTimeoutMS=5000,
                retryWrites=False,
            )
            await client.admin.command("ping")
            return True

        asyncio.run(ping())
        return True, "OK", "MongoDB conectado con motor"
    except Exception as exc:
        return False, classify_error(exc), str(exc)


def main():
    backend_dir = Path(__file__).parent
    env_path = backend_dir / ".env"
    env = load_env(env_path)
    mongo_url = env.get("MONGO_URL", "")

    print("=== diagnostic_mongo.py ===")
    print(f"Python version: {sys.version}")
    print(f"backend/server.py exists: {(backend_dir / 'server.py').exists()}")
    print(f"backend/requirements.txt exists: {(backend_dir / 'requirements.txt').exists()}")
    print(f"Using env path: {env_path}")
    print(f"MONGO_URL: {mongo_url or '<no MONGO_URL found>'}")

    if not mongo_url:
        print("DIAGNÓSTICO: URL incorrecta")
        print("ERROR: MONGO_URL no está definido en backend/.env")
        sys.exit(1)

    ok, status, message = try_connect_with_pymongo(mongo_url)
    if ok:
        print("DIAGNÓSTICO: MongoDB OK")
        print(f"DETALLE: {message}")
        sys.exit(0)

    if status == "IMPORT_ERROR":
        print("DIAGNÓSTICO: Dependencia faltante")
        print(f"ERROR: {message}")
        print("Intentando conexión con motor...")
        ok2, status2, message2 = try_connect_with_motor(mongo_url)
        if ok2:
            print("DIAGNÓSTICO: MongoDB OK")
            print(f"DETALLE: {message2}")
            sys.exit(0)
        print(f"DIAGNÓSTICO: {status2}")
        print(f"ERROR: {message2}")
        sys.exit(1)

    print(f"DIAGNÓSTICO: {status}")
    print(f"ERROR: {message}")
    sys.exit(1)


if __name__ == "__main__":
    try:
        main()
    except Exception:
        print("DIAGNÓSTICO: Error inesperado al ejecutar diagnostic_mongo.py")
        traceback.print_exc()
        sys.exit(1)
