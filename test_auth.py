#!/usr/bin/env python3
"""Test de autenticación para F-012A"""
import requests
import json

BASE_URL = "http://localhost:8000"

# Test 1: Registrar usuario
print("=" * 60)
print("TEST 1: REGISTRO DE USUARIO")
print("=" * 60)

register_payload = {
    "email": "test_f-012a@puntocerolegal.com",
    "password": "Test2025!",
    "full_name": "Test F-012A",
    "role": "firm_owner"
}

print(f"Payload: {json.dumps(register_payload, indent=2)}")

try:
    response = requests.post(
        f"{BASE_URL}/api/auth/register",
        json=register_payload,
        headers={"Content-Type": "application/json"}
    )
    print(f"\nHTTP Status: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code == 201:
        print("✅ Usuario registrado exitosamente")
    elif response.status_code == 400 and "ya está registrado" in response.text:
        print("ℹ️  Usuario ya existe (esperado si se ejecuta múltiples veces)")
    else:
        print(f"❌ Error en registro: {response.status_code}")
        
except Exception as e:
    print(f"❌ Error: {e}")

# Test 2: Login con usuario
print("\n" + "=" * 60)
print("TEST 2: LOGIN CON USUARIO REGISTRADO")
print("=" * 60)

login_payload = {
    "email": "test_f-012a@puntocerolegal.com",
    "password": "Test2025!"
}

print(f"Payload: {json.dumps(login_payload, indent=2)}")

try:
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json=login_payload,
        headers={"Content-Type": "application/json"}
    )
    print(f"\nHTTP Status: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code == 200:
        print("✅ Login exitoso")
        data = response.json()
        print(f"✅ Access token recibido: {data.get('access_token', 'N/A')[:20]}...")
        print(f"✅ Token type: {data.get('token_type', 'N/A')}")
    else:
        print(f"❌ Login fallido: {response.status_code}")
        
except Exception as e:
    print(f"❌ Error: {e}")

print("\n" + "=" * 60)
print("FIN DE PRUEBAS")
print("=" * 60)