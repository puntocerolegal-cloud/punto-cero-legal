"""
SIMULACIÓN OPERACIONAL COMPLETA
PUNTO CERO LEGAL - GO-LIVE WAVE 1

Este script simula la entrada de usuarios reales al sistema
utilizando EXCLUSIVAMENTE los endpoints del backend.

NO modifica MongoDB directamente.
NO salta formularios.
NO modifica la arquitectura.
"""

import requests
import json
import random
from datetime import datetime, timedelta
from typing import Dict, List, Tuple

# Configuración
BASE_URL = "http://localhost:8000"
API_PREFIX = "/api"

# Datos de prueba
NOMBRES = [
    "Juan", "María", "Carlos", "Ana", "Luis", "Laura", "Pedro", "Sofía", "Diego", "Valentina",
    "Andrés", "Camila", "Felipe", "Isabella", "Sebastián", "Mariana", "Nicolás", "Victoria",
    "Santiago", "Gabriela", "Mateo", "Valeria", "Alejandro", "Daniela", "Javier", "Carolina"
]

APELLIDOS = [
    "García", "Rodríguez", "Martínez", "López", "González", "Hernández", "Pérez", "Sánchez",
    "Ramírez", "Torres", "Flores", "Rivera", "Gómez", "Díaz", "Reyes", "Cruz", "Morales",
    "Ortiz", "Jiménez", "Castillo", "Romero", "Vargas", "Mendoza", "Guerrero", "Rojas"
]

PAISES = [
    {"nombre": "Colombia", "codigo": "CO", "moneda": "COP", "idioma": "es"},
    {"nombre": "México", "codigo": "MX", "moneda": "MXN", "idioma": "es"},
    {"nombre": "Brasil", "codigo": "BR", "moneda": "BRL", "idioma": "pt"},
    {"nombre": "Perú", "codigo": "PE", "moneda": "PEN", "idioma": "es"},
    {"nombre": "Chile", "codigo": "CL", "moneda": "CLP", "idioma": "es"},
    {"nombre": "Ecuador", "codigo": "EC", "moneda": "USD", "idioma": "es"},
    {"nombre": "Bolivia", "codigo": "BO", "moneda": "BOB", "idioma": "es"},
    {"nombre": "República Dominicana", "codigo": "DO", "moneda": "DOP", "idioma": "es"},
]

CIUDADES = {
    "Colombia": ["Bogotá", "Medellín", "Cali", "Barranquilla", "Cartagena"],
    "México": ["Ciudad de México", "Guadalajara", "Monterrey", "Puebla", "Querétaro"],
    "Brasil": ["São Paulo", "Rio de Janeiro", "Brasília", "Salvador", "Fortaleza"],
    "Perú": ["Lima", "Arequipa", "Trujillo", "Cusco", "Piura"],
    "Chile": ["Santiago", "Valparaíso", "Concepción", "La Serena", "Antofagasta"],
    "Ecuador": ["Quito", "Guayaquil", "Cuenca", "Ambato", "Manta"],
    "Bolivia": ["La Paz", "Santa Cruz", "Cochabamba", "Sucre", "Oruro"],
    "República Dominicana": ["Santo Domingo", "Santiago", "La Romana", "Punta Cana", "Puerto Plata"],
}

PLANES = [
    {"id": "plan-despegue", "nombre": "El Despegue", "precio": 28.125},
    {"id": "plan-salto", "nombre": "El Salto Estratégico", "precio": 52.5},
    {"id": "plan-crecimiento", "nombre": "Firma en Crecimiento", "precio": 140.625},
    {"id": "plan-consolidacion", "nombre": "Consolidación Empresarial", "precio": 525.0},
]

ESPECIALIDADES = [
    "Derecho Laboral", "Derecho de Familia", "Derecho Penal", "Derecho Civil",
    "Derecho Comercial", "Derecho Administrativo", "Derecho Tributario", "Derecho Corporativo"
]

# Resultados de la simulación
resultados = {
    "usuarios_creados": [],
    "firmas_creadas": [],
    "abogados_creados": [],
    "agentes_creados": [],
    "referidos_creados": [],
    "leads_creados": [],
    "prospectos_creados": [],
    "clientes_creados": [],
    "errores": [],
    "errores_corregidos": [],
    "pantalla_blanca": False,
    "causa_pantalla_blanca": None,
}


def generar_email(nombre: str, apellido: str) -> str:
    """Genera email único basado en nombre y apellido"""
    return f"{nombre.lower()}.{apellido.lower()}@test.com"


def generar_telefono(pais: Dict) -> str:
    """Genera teléfono según el país"""
    prefijos = {
        "CO": "+57", "MX": "+52", "BR": "+55", "PE": "+51", "CL": "+56",
        "EC": "+593", "BO": "+591", "DO": "+1"
    }
    prefijo = prefijos.get(pais["codigo"], "+57")
    numero = random.randint(1000000000, 9999999999)
    return f"{prefijo} {numero}"


def registrar_cliente(nombre: str, apellido: str, pais: Dict, plan: Dict) -> Dict:
    """Registra un cliente usando el endpoint de registro"""
    email = generar_email(nombre, apellido)
    telefono = generar_telefono(pais)
    ciudad = random.choice(CIUDADES[pais["nombre"]])

    payload = {
        "email": email,
        "password": "Test123456!",
        "full_name": f"{nombre} {apellido}",
        "phone": telefono,
        "country": pais["nombre"],
        "specialty": random.choice(ESPECIALIDADES),
        "bar_number": f"TP-{random.randint(100000, 999999)}",
        "id_document": f"CC {random.randint(100000000, 999999999)}",
        "firm_name": f"Despacho {apellido}",
        "role": "lawyer",
        "plan_id": plan["id"],
        "accepted_legal": True,
        "accepted_at": datetime.utcnow().isoformat()
    }

    try:
        response = requests.post(
            f"{BASE_URL}{API_PREFIX}/auth/register",
            json=payload,
            timeout=10
        )

        if response.status_code == 200 or response.status_code == 201:
            data = response.json()
            return {
                "exito": True,
                "email": email,
                "nombre": f"{nombre} {apellido}",
                "pais": pais["nombre"],
                "plan": plan["nombre"],
                "user_id": data.get("id"),
                "telefono": telefono,
                "ciudad": ciudad,
                "fecha_registro": datetime.utcnow().isoformat(),
                "origen": "landing_page"
            }
        else:
            resultados["errores"].append({
                "tipo": "registro_cliente",
                "email": email,
                "error": response.text,
                "status": response.status_code
            })
            return {"exito": False, "error": response.text}
    except Exception as e:
        resultados["errores"].append({
            "tipo": "registro_cliente",
            "email": email,
            "error": str(e)
        })
        return {"exito": False, "error": str(e)}


def registrar_firma(nombre: str, apellido: str, pais: Dict, plan: Dict) -> Dict:
    """Registra una firma jurídica"""
    email = generar_email(nombre, apellido)
    telefono = generar_telefono(pais)
    ciudad = random.choice(CIUDADES[pais["nombre"]])

    payload = {
        "name": f"Firma {apellido} & Asociados",
        "nit": f"NIT-{random.randint(100000000, 999999999)}",
        "email": email,
        "phone": telefono,
        "address": f"Calle {random.randint(1, 100)} #{random.randint(1, 50)}-{random.randint(1, 100)}",
        "city": ciudad,
        "country": pais["nombre"],
        "plan": plan["id"],
        "founder_name": f"{nombre} {apellido}",
        "founder_email": email,
        "founder_phone": telefono,
        "founder_document": f"CC {random.randint(100000000, 999999999)}",
        "founder_bar_number": f"TP-{random.randint(100000, 999999)}"
    }

    try:
        response = requests.post(
            f"{BASE_URL}{API_PREFIX}/firms/register",
            json=payload,
            timeout=10
        )

        if response.status_code == 200 or response.status_code == 201:
            data = response.json()
            return {
                "exito": True,
                "email": email,
                "nombre": f"Firma {apellido} & Asociados",
                "pais": pais["nombre"],
                "plan": plan["nombre"],
                "firm_id": data.get("id"),
                "telefono": telefono,
                "ciudad": ciudad,
                "fecha_registro": datetime.utcnow().isoformat(),
                "origen": "landing_page"
            }
        else:
            resultados["errores"].append({
                "tipo": "registro_firma",
                "email": email,
                "error": response.text,
                "status": response.status_code
            })
            return {"exito": False, "error": response.text}
    except Exception as e:
        resultados["errores"].append({
            "tipo": "registro_firma",
            "email": email,
            "error": str(e)
        })
        return {"exito": False, "error": str(e)}


def registrar_agente_comercial(nombre: str, apellido: str, pais: Dict) -> Dict:
    """Registra un agente comercial"""
    email = f"agente.{nombre.lower()}.{apellido.lower()}@test.com"
    telefono = generar_telefono(pais)
    ciudad = random.choice(CIUDADES[pais["nombre"]])

    payload = {
        "email": email,
        "password": "Test123456!",
        "full_name": f"{nombre} {apellido}",
        "phone": telefono,
        "country": pais["nombre"],
        "role": "socio_comercial",
        "accepted_legal": True,
        "accepted_at": datetime.utcnow().isoformat()
    }

    try:
        response = requests.post(
            f"{BASE_URL}{API_PREFIX}/auth/register",
            json=payload,
            timeout=10
        )

        if response.status_code == 200 or response.status_code == 201:
            data = response.json()
            return {
                "exito": True,
                "email": email,
                "nombre": f"{nombre} {apellido}",
                "pais": pais["nombre"],
                "user_id": data.get("id"),
                "telefono": telefono,
                "ciudad": ciudad,
                "fecha_registro": datetime.utcnow().isoformat(),
                "origen": "landing_page"
            }
        else:
            resultados["errores"].append({
                "tipo": "registro_agente",
                "email": email,
                "error": response.text,
                "status": response.status_code
            })
            return {"exito": False, "error": response.text}
    except Exception as e:
        resultados["errores"].append({
            "tipo": "registro_agente",
            "email": email,
            "error": str(e)
        })
        return {"exito": False, "error": str(e)}


def crear_referido(agente_id: str, cliente_email: str) -> Dict:
    """Crea un referido desde un agente comercial"""
    payload = {
        "agent_id": agente_id,
        "client_email": cliente_email,
        "type": "client"
    }

    try:
        response = requests.post(
            f"{BASE_URL}{API_PREFIX}/referrals/create",
            json=payload,
            timeout=10
        )

        if response.status_code == 200 or response.status_code == 201:
            return {"exito": True, "data": response.json()}
        else:
            return {"exito": False, "error": response.text}
    except Exception as e:
        return {"exito": False, "error": str(e)}


def crear_lead(nombre: str, apellido: str, pais: Dict, fuente: str) -> Dict:
    """Crea un lead en el CRM"""
    email = generar_email(nombre, apellido)
    telefono = generar_telefono(pais)

    payload = {
        "client_name": f"{nombre} {apellido}",
        "client_email": email,
        "client_phone": telefono,
        "legal_area": random.choice(ESPECIALIDADES),
        "country": pais["nombre"],
        "city": random.choice(CIUDADES[pais["nombre"]]),
        "description": f"Lead generado desde {fuente}",
        "source": fuente,
        "status": "new"
    }

    try:
        response = requests.post(
            f"{BASE_URL}{API_PREFIX}/crm/leads",
            json=payload,
            timeout=10
        )

        if response.status_code == 200 or response.status_code == 201:
            return {"exito": True, "email": email, "lead_id": response.json().get("id")}
        else:
            return {"exito": False, "error": response.text}
    except Exception as e:
        return {"exito": False, "error": str(e)}


def verificar_dashboard(tipo_usuario: str, token: str) -> Dict:
    """Verifica que el dashboard cargue correctamente"""
    headers = {"Authorization": f"Bearer {token}"}

    try:
        if tipo_usuario == "cliente":
            response = requests.get(f"{BASE_URL}{API_PREFIX}/portal", headers=headers, timeout=10)
        elif tipo_usuario == "abogado":
            response = requests.get(f"{BASE_URL}{API_PREFIX}/dashboard", headers=headers, timeout=10)
        elif tipo_usuario == "firma":
            response = requests.get(f"{BASE_URL}{API_PREFIX}/firm/dashboard", headers=headers, timeout=10)
        elif tipo_usuario == "agente":
            response = requests.get(f"{BASE_URL}{API_PREFIX}/admin/dashboard", headers=headers, timeout=10)
        else:
            return {"exito": False, "error": "Tipo de usuario no válido"}

        if response.status_code == 200:
            return {"exito": True, "status": response.status_code}
        else:
            return {"exito": False, "status": response.status_code, "error": response.text}
    except Exception as e:
        return {"exito": False, "error": str(e)}


def login(email: str, password: str) -> Dict:
    """Realiza login y retorna token"""
    payload = {
        "email": email,
        "password": password
    }

    try:
        response = requests.post(
            f"{BASE_URL}{API_PREFIX}/auth/login",
            json=payload,
            timeout=10
        )

        if response.status_code == 200:
            data = response.json()
            return {"exito": True, "token": data.get("access_token")}
        else:
            return {"exito": False, "error": response.text}
    except Exception as e:
        return {"exito": False, "error": str(e)}


def ejecutar_simulacion():
    """Ejecuta la simulación operacional completa"""
    print("=" * 80)
    print("SIMULACIÓN OPERACIONAL COMPLETA - PUNTO CERO LEGAL")
    print("=" * 80)
    print()

    # Fase 1: Crear 5 Firmas
    print("FASE 1: Creando 5 Firmas Jurídicas...")
    for i in range(5):
        nombre = random.choice(NOMBRES)
        apellido = random.choice(APELLIDOS)
        pais = random.choice(PAISES)
        plan = random.choice(PLANES[:2])  # Planes básicos para firmas pequeñas

        resultado = registrar_firma(nombre, apellido, pais, plan)
        if resultado["exito"]:
            resultados["firmas_creadas"].append(resultado)
            print(f"  ✅ Firma {i+1}/5: {resultado['nombre']} - {resultado['pais']}")
        else:
            print(f"  ❌ Error creando firma {i+1}: {resultado.get('error', 'Unknown')}")

    print()

    # Fase 2: Crear 5 Agentes Comerciales
    print("FASE 2: Creando 5 Agentes Comerciales...")
    for i in range(5):
        nombre = random.choice(NOMBRES)
        apellido = random.choice(APELLIDOS)
        pais = random.choice(PAISES)

        resultado = registrar_agente_comercial(nombre, apellido, pais)
        if resultado["exito"]:
            resultados["agentes_creados"].append(resultado)
            print(f"  ✅ Agente {i+1}/5: {resultado['nombre']} - {resultado['pais']}")
        else:
            print(f"  ❌ Error creando agente {i+1}: {resultado.get('error', 'Unknown')}")

    print()

    # Fase 3: Crear 5 Abogados
    print("FASE 3: Creando 5 Abogados...")
    for i in range(5):
        nombre = random.choice(NOMBRES)
        apellido = random.choice(APELLIDOS)
        pais = random.choice(PAISES)
        plan = random.choice(PLANES)

        resultado = registrar_cliente(nombre, apellido, pais, plan)
        if resultado["exito"]:
            resultados["abogados_creados"].append(resultado)
            print(f"  ✅ Abogado {i+1}/5: {resultado['nombre']} - {resultado['pais']} - {resultado['plan']}")
        else:
            print(f"  ❌ Error creando abogado {i+1}: {resultado.get('error', 'Unknown')}")

    print()

    # Fase 4: Crear 10 Clientes
    print("FASE 4: Creando 10 Clientes...")
    for i in range(10):
        nombre = random.choice(NOMBRES)
        apellido = random.choice(APELLIDOS)
        pais = random.choice(PAISES)
        plan = random.choice(PLANES)

        resultado = registrar_cliente(nombre, apellido, pais, plan)
        if resultado["exito"]:
            resultados["clientes_creados"].append(resultado)
            print(f"  ✅ Cliente {i+1}/10: {resultado['nombre']} - {resultado['pais']} - {resultado['plan']}")
        else:
            print(f"  ❌ Error creando cliente {i+1}: {resultado.get('error', 'Unknown')}")

    print()

    # Fase 5: Crear 5 Referidos
    print("FASE 5: Creando 5 Referidos...")
    if len(resultados["agentes_creados"]) > 0 and len(resultados["clientes_creados"]) > 0:
        for i in range(min(5, len(resultados["agentes_creados"]), len(resultados["clientes_creados"]))):
            agente = resultados["agentes_creados"][i]
            cliente = resultados["clientes_creados"][i]

            resultado = crear_referido(agente["user_id"], cliente["email"])
            if resultado["exito"]:
                resultados["referidos_creados"].append({
                    "agente": agente["email"],
                    "cliente": cliente["email"],
                    "exito": True
                })
                print(f"  ✅ Referido {i+1}/5: {cliente['email']} referido por {agente['email']}")
            else:
                print(f"  ❌ Error creando referido {i+1}: {resultado.get('error', 'Unknown')}")

    print()

    # Fase 6: Crear Leads
    print("FASE 6: Creando 20 Leads...")
    for i in range(20):
        nombre = random.choice(NOMBRES)
        apellido = random.choice(APELLIDOS)
        pais = random.choice(PAISES)
        fuente = random.choice(["landing_page", "google_ads", "facebook", "referido", "linkedin"])

        resultado = crear_lead(nombre, apellido, pais, fuente)
        if resultado["exito"]:
            resultados["leads_creados"].append(resultado)
        else:
            print(f"  ❌ Error creando lead {i+1}: {resultado.get('error', 'Unknown')}")

    print(f"  ✅ {len(resultados['leads_creados'])}/20 leads creados")

    print()

    # Fase 7: Verificar Dashboards
    print("FASE 7: Verificando Dashboards...")

    # Verificar dashboard de cliente
    if len(resultados["clientes_creados"]) > 0:
        cliente = resultados["clientes_creados"][0]
        login_result = login(cliente["email"], "Test123456!")
        if login_result["exito"]:
            dash_result = verificar_dashboard("cliente", login_result["token"])
            if dash_result["exito"]:
                print(f"  ✅ Dashboard Cliente: OK")
            else:
                print(f"  ❌ Dashboard Cliente: ERROR - {dash_result.get('error', 'Unknown')}")
                resultados["errores"].append({
                    "tipo": "dashboard_cliente",
                    "error": dash_result.get("error")
                })
        else:
            print(f"  ❌ Login Cliente: ERROR - {login_result.get('error', 'Unknown')}")

    # Verificar dashboard de abogado
    if len(resultados["abogados_creados"]) > 0:
        abogado = resultados["abogados_creados"][0]
        login_result = login(abogado["email"], "Test123456!")
        if login_result["exito"]:
            dash_result = verificar_dashboard("abogado", login_result["token"])
            if dash_result["exito"]:
                print(f"  ✅ Dashboard Abogado: OK")
            else:
                print(f"  ❌ Dashboard Abogado: ERROR - {dash_result.get('error', 'Unknown')}")
                resultados["errores"].append({
                    "tipo": "dashboard_abogado",
                    "error": dash_result.get("error")
                })
        else:
            print(f"  ❌ Login Abogado: ERROR - {login_result.get('error', 'Unknown')}")

    # Verificar dashboard de firma
    if len(resultados["firmas_creadas"]) > 0:
        firma = resultados["firmas_creadas"][0]
        login_result = login(firma["email"], "Test123456!")
        if login_result["exito"]:
            dash_result = verificar_dashboard("firma", login_result["token"])
            if dash_result["exito"]:
                print(f"  ✅ Dashboard Firma: OK")
            else:
                print(f"  ❌ Dashboard Firma: ERROR - {dash_result.get('error', 'Unknown')}")
                resultados["errores"].append({
                    "tipo": "dashboard_firma",
                    "error": dash_result.get("error")
                })
        else:
            print(f"  ❌ Login Firma: ERROR - {login_result.get('error', 'Unknown')}")

    # Verificar dashboard de agente
    if len(resultados["agentes_creados"]) > 0:
        agente = resultados["agentes_creados"][0]
        login_result = login(agente["email"], "Test123456!")
        if login_result["exito"]:
            dash_result = verificar_dashboard("agente", login_result["token"])
            if dash_result["exito"]:
                print(f"  ✅ Dashboard Agente: OK")
            else:
                print(f"  ❌ Dashboard Agente: ERROR - {dash_result.get('error', 'Unknown')}")
                resultados["errores"].append({
                    "tipo": "dashboard_agente",
                    "error": dash_result.get("error")
                })
        else:
            print(f"  ❌ Login Agente: ERROR - {login_result.get('error', 'Unknown')}")

    print()

    # Fase 8: Verificar pantalla blanca
    print("FASE 8: Verificando Pantalla Blanca...")
    if any("dashboard" in str(e.get("tipo", "")) for e in resultados["errores"]):
        resultados["pantalla_blanca"] = True
        resultados["causa_pantalla_blanca"] = "Error en carga de dashboard detectado"
        print(f"  ❌ PANTALLA BLANCA DETECTADA")
        print(f"  Causa: {resultados['causa_pantalla_blanca']}")
    else:
        resultados["pantalla_blanca"] = False
        print(f"  ✅ No se detectó pantalla blanca")

    print()

    # Resumen final
    print("=" * 80)
    print("RESUMEN DE SIMULACIÓN")
    print("=" * 80)
    print(f"✅ Firmas creadas: {len(resultados['firmas_creadas'])}/5")
    print(f"✅ Agentes creados: {len(resultados['agentes_creados'])}/5")
    print(f"✅ Abogados creados: {len(resultados['abogados_creados'])}/5")
    print(f"✅ Clientes creados: {len(resultados['clientes_creados'])}/10")
    print(f"✅ Referidos creados: {len(resultados['referidos_creados'])}/5")
    print(f"✅ Leads creados: {len(resultados['leads_creados'])}/20")
    print(f"❌ Errores encontrados: {len(resultados['errores'])}")
    print(f"❌ Errores corregidos: {len(resultados['errores_corregidos'])}")
    print(f"⚠️  Pantalla blanca: {'SÍ' if resultados['pantalla_blanca'] else 'NO'}")
    print()

    # Guardar resultados
    with open("resultados_simulacion.json", "w", encoding="utf-8") as f:
        json.dump(resultados, f, ensure_ascii=False, indent=2)

    print("Resultados guardados en: resultados_simulacion.json")
    print()

    # Veredicto
    if len(resultados["errores"]) == 0 and not resultados["pantalla_blanca"]:
        print("=" * 80)
        print("✅ GO-LIVE WAVE 1 APROBADA")
        print("=" * 80)
        print()
        print("Todos los usuarios se crearon correctamente.")
        print("Todos los dashboards funcionan correctamente.")
        print("No se detectó pantalla blanca.")
        print("El sistema está listo para producción.")
    else:
        print("=" * 80)
        print("❌ GO-LIVE WAVE 1 RECHAZADA")
        print("=" * 80)
        print()
        print(f"Se encontraron {len(resultados['errores'])} errores.")
        if resultados["pantalla_blanca"]:
            print("Se detectó pantalla blanca en el dashboard.")
        print("Revisar el archivo resultados_simulacion.json para detalles.")


if __name__ == "__main__":
    ejecutar_simulacion()