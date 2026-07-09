# HALLAZGOS TÉCNICOS DETALLADOS
## Punto Cero Legal - Auditoría E2E Producción

**Fecha:** 4 de Julio, 2026  
**Rama:** staging  
**Total de hallazgos:** 11 (5🔴 + 2🟠 + 2🟡 + 2✅)

---

## 🔴 CRÍTICOS (Bloquean Producción)

### 1. IA Completamente Deshabilitada

**Ubicación:** backend/routes/ai.py, línea 199-258  
**Severidad:** 🔴 CRÍTICO  
**Impacto en producción:** SIN IA = Sin producto viable

**Evidencia de logs:**
```
2026-07-04 16:22:43,642 - httpx - INFO 
POST https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=tu-api-key-de-google-gemini 
"HTTP/1.1 400 Bad Request"

Error message: "API key not valid. Please pass a valid API key."

2026-07-04 16:22:46,293 - httpx - INFO 
POST https://api.anthropic.com/v1/messages 
"HTTP/1.1 401 Unauthorized"

Error: 'invalid x-api-key'

2026-07-04 16:22:46,295 - routes.ai - ERROR - AI CHAT ERROR
RuntimeError: El asistente IA no está disponible temporalmente 
(Gemini sin clave/caído y respaldo Claude no disponible).

HTTP Response: 503 Service Unavailable
```

**Código responsable:**
```python
# backend/.env
GEMINI_API_KEY=tu-api-key-de-google-gemini  # ❌ PLACEHOLDER
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx        # ❌ PLACEHOLDER
```

**Solución:**
```python
# Configurar variables reales:
# 1. Google Gemini: https://ai.google.dev
# 2. Anthropic Claude: https://console.anthropic.com

# O deshabilitar IA y usar fallback (no recomendado para producción):
# Editar backend/routes/ai.py línea 215-220 para return respuesta genérica
```

**Afecta:**
- ✅ ChatPage (abogados)
- ✅ IA Chat en Dashboard
- ✅ Redacción de documentos
- ✅ Análisis de expedientes
- ✅ Landing Page chatbot

---

### 2. Modelo de Suscripción Desactualizado

**Ubicación:** backend/models/subscription.py  
**Severidad:** 🔴 CRÍTICO  
**Impacto:** Sistema de facturación retorna valores incorrectos

**Mismatch actual:**
```python
# ❌ ACTUAL en subscription.py
plan_type: Literal["basic", "pro", "enterprise"]

# ✅ REQUERIDO por especificación
plan_type: Literal[
    "despegue",              # Hasta 50 casos, 1 abogado
    "salto_estrategico",     # Hasta 150 casos
    "firma_crecimiento",     # Hasta 5 abogados
    "consolidacion"          # Hasta 10 abogados + ilimitado
]
```

**Cascada de impacto:**
```
subscription.py (modelo) 
  → billing.py (queries)
  → billing_service.py (lógica)
  → payment.py (UI de planes)
  → admin_master.py (reportes)
```

**Solución - Paso 1: Actualizar modelo**
```python
# backend/models/subscription.py
from pydantic import BaseModel
from typing import Literal

class SubscriptionBase(BaseModel):
    plan_type: Literal[
        "despegue",
        "salto_estrategico", 
        "firma_crecimiento",
        "consolidacion"
    ]
    # ... resto de campos
```

**Solución - Paso 2: Migración de datos (si existen)**
```javascript
// backend/migrations/001_rename_plans.py (nueva migración)
async def migrate_plans(db):
    mapping = {
        "basic": "despegue",
        "pro": "salto_estrategico",
        "enterprise": "firma_crecimiento"
    }
    for old, new in mapping.items():
        await db.subscriptions.update_many(
            {"plan_type": old},
            {"$set": {"plan_type": new}}
        )
```

---

### 3. MongoDB No Configurado

**Ubicación:** backend/server.py, línea 119-138  
**Severidad:** 🔴 CRÍTICO  
**Impacto:** Cero persistencia de datos

**Síntomas visibles:**
```
backend/.env:
  MONGO_URL=mongodb://localhost:27017
  DB_NAME=puntocero_legal

Realidad:
  ❌ No hay MongoDB ejecutándose en localhost:27017
  ❌ Fallback a InMemoryDB (todos datos se pierden en restart)
  ❌ Multi-usuario: datos no sincronizados entre instancias
```

**Log de fallo:**
```
pymongo.serverSelection: 
"Waiting for suitable server to become available", 
"selector": "<function writable_server_selector at ...>", 
"remainingTimeMS": 5
```

**Opciones de solución:**

**Opción A: MongoDB Local (desarrollo)**
```bash
# macOS
brew install mongodb-community
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Windows (si está instalado)
net start MongoDB

# Verificar
mongosh --eval "db.adminCommand('ping')"
```

**Opción B: MongoDB Atlas (recomendado para producción)**
```bash
# 1. Crear cuenta en https://www.mongodb.com/cloud/atlas
# 2. Crear cluster (M0 free tier para testing)
# 3. Obtener connection string:

# backend/.env
MONGO_URL=mongodb+srv://usuario:password@cluster.xxxxx.mongodb.net/puntocero_legal?retryWrites=true&w=majority
DB_NAME=puntocero_legal
```

---

### 4. Configuración de Entorno Incompleta

**Ubicación:** backend/.env (25+ variables)  
**Severidad:** 🔴 CRÍTICO  
**Impacto:** 8 features completamente deshabilitadas

**Variables problemáticas:**
```bash
# ❌ Autenticación débil
SECRET_KEY=cambia-esto-por-una-cadena-larga-y-aleatoria

# ❌ IA deshabilitada (descrito arriba)
GEMINI_API_KEY=tu-api-key-de-google-gemini
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ❌ Email deshabilitado
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tucorreo@gmail.com
SMTP_PASS=contrasena-de-aplicacion-16-chars

# ❌ Pagos deshabilitados
MP_ACCESS_TOKEN=

# ❌ WhatsApp deshabilitado
META_APP_ID=tu-app-id
META_APP_SECRET=tu-app-secret
META_PHONE_NUMBER_ID=tu-phone-number-id
```

**Solución - Checklist de configuración:**

- [ ] **SECRET_KEY** → `openssl rand -base64 32`
- [ ] **GEMINI_API_KEY** → https://ai.google.dev → "Get API key"
- [ ] **ANTHROPIC_API_KEY** → https://console.anthropic.com → "Create key"
- [ ] **SMTP** → Gmail: https://myaccount.google.com/apppasswords
- [ ] **MP_ACCESS_TOKEN** → https://www.mercadopago.com.co/developers
- [ ] **META** → https://developers.facebook.com → WhatsApp Business API
- [ ] **MONGO_URL** → Crear cluster MongoDB Atlas

---

### 5. Estados Unidos Falta en Configuración

**Ubicación:** 3 archivos diferentes  
**Severidad:** 🔴 CRÍTICO  
**Impacto:** Usuarios de USA no pueden operar

**Análisis:**

Archivo | Estado | Líneas | Estados Unidos?
---------|---------|--------|---------------
payment.py | COUNTRY_CONFIG | 30-55 | ❌ NO
ai.py | JURISDICTIONS | 53-74 | ❌ NO
chatbot.py | COUNTRY_INTAKE | 38-59 | ❌ NO
admin.py | _load_countries_data() | 44-63 | ✅ SÍ (incluido)
frontend/LandingPage | LATAM_COUNTRIES | 45-76 | ❌ NO

**Solución:**

```python
# backend/routes/payment.py - AGREGAR en COUNTRY_CONFIG:
{
    "Estados Unidos": {
        "currency": "USD", 
        "term": "attorney",
        "flag": "🇺🇸", 
        "code": "US"
    }
}

# backend/routes/ai.py - AGREGAR en JURISDICTIONS:
{
    "Estados Unidos": "Operas bajo el DERECHO ESTADOUNIDENSE. Marco: Constitución Federal, Código Uniforme de Comercio (UCC), Federal Rules of Civil Procedure, Reglas Federales de Evidencia, Federal Rules of Criminal Procedure. Cita jurisprudencia de la Corte Suprema Federal (U.S. Supreme Court) y Cortes de Apelación Federal. Trata al profesional como 'attorney' o 'lawyer'. Usa el habeas corpus y amparo constitucional (14ª Enmienda)."
}

# backend/routes/chatbot.py - AGREGAR en COUNTRY_INTAKE:
{
    "Estados Unidos": {
        "prefix": "+1", 
        "term": "attorney", 
        "group": "usa", 
        "law": "derecho estadounidense"
    }
}

# frontend/src/pages/LandingPage.jsx - AGREGAR:
const LATAM_COUNTRIES = [
    // ... resto de países ...
    'Estados Unidos',  // ← AGREGAR
];

// Y en PHONE_PREFIXES:
const PHONE_PREFIXES = {
    // ... resto ...
    'Estados Unidos': '+1',  // ← AGREGAR
};

// Y en PHONE_NATIONAL_LEN:
const PHONE_NATIONAL_LEN = {
    // ... resto ...
    'Estados Unidos': 10,  // ← AGREGAR
};
```

---

## 🟠 ALTOS (Afectan Funcionalidad)

### 6. React Hook Dependencies Inconsistentes

**Ubicación:** frontend/src/modules/firm-os/hooks/useAutomation.js  
**Severidad:** 🟠 ALTO  
**Impacto:** Automaciones pueden aplicarse con datos desactualizados

**Problema:**
```javascript
// ❌ INCONSISTENCIA:
// Línea 31-32: usa stableDepartments/stableOffices en dependencias
const automationVM = useMemo(() => {
    return buildAutomationViewModel(
        lawyers, cases, clients, 
        departments, offices  // ← usa esto AQUÍ
    );
}, [lawyers, cases, clients, stableDepartments, stableOffices]);  // ← pero declara esto

// Línea 61: useCallback declara stableDepartments/stableOffices
// pero línea 39-43 usa departments/offices directamente
const runRule = useCallback((ruleId) => {
    const context = {
        lawyers,
        cases,
        clients,
        departments,  // ← usa esto
        offices,      // ← usa esto
    };
    // ...
}, [engine, lawyers, cases, clients, stableDepartments, stableOffices]);
// ^ pero declara esto (mismatch)
```

**Riesgo:**
```javascript
// Si departments/offices cambian, pero stableDepartments/stableOffices no:
// El callback NO se recalcula → usa datos VIEJOS

// Escenario: Admin crea nuevo departamento
1. departments array se actualiza
2. stableDepartments.length === 0 aún (porque el check en línea 14 era false)
3. Callback NO se ejecuta de nuevo
4. Automación se aplica sin el nuevo departamento
→ Bug sutil, duro de debuguear en producción
```

**Solución:**
```javascript
// Opción A: Usar directamente las variables (simple, correcto)
const automationVM = useMemo(() => {
    return buildAutomationViewModel(
        lawyers, cases, clients, departments, offices
    );
}, [lawyers, cases, clients, departments, offices]);  // ← sincronizados

// Opción B: Si las arrays son huge y quieres evitar re-renders:
// Usa un custom hook que estabiliza las referencias:
const useStableArray = (arr) => {
    const ref = useRef(arr);
    useEffect(() => {
        ref.current = arr;
    }, [arr]);
    return ref.current;
};

const stableDeps = useStableArray([...departments, ...offices]);
const automationVM = useMemo(() => {
    return buildAutomationViewModel(
        lawyers, cases, clients, departments, offices
    );
}, [lawyers, cases, clients, stableDeps]);
```

---

### 7. Inconsistencia de Países Dispersa

**Ubicación:** 7 archivos diferentes  
**Severidad:** 🟠 ALTO  
**Impacto:** Sistema no tiene visión unificada

**Matriz de cobertura:**
```
País               | payment.py | ai.py | chatbot.py | admin.py | LandingPage
───────────────────┼────────────┼───────┼────────────┼──────────┼─────────────
Colombia           |     ✅     |  ✅   |     ✅     |    ✅    |     ✅
México             |     ✅     |  ✅   |     ✅     |    ✅    |     ✅
...                |   ...      | ...   |    ...     |   ...    |    ...
España             |     ✅     |  ✅   |     ✅     |    ✅    |     ✅
Estados Unidos     |     ❌     |  ❌   |     ❌     |    ✅    |     ❌
Brasil             |     ❌     |  ❌   |     ❌     |    ✅    |     ✅
```

**Solución:**
1. Elegir set DEFINITIVO de 18 países
2. Crear constanteen archivo centralizador:
```python
# backend/config/countries.py (NUEVA)
SUPPORTED_COUNTRIES = {
    "Colombia": {...},
    "México": {...},
    # ... 16 más
    "Estados Unidos": {...},
}

# Luego usar en todos lados:
from config.countries import SUPPORTED_COUNTRIES
COUNTRY_CONFIG = SUPPORTED_COUNTRIES
JURISDICTIONS = {c: get_jurisdiction_text(c) for c in SUPPORTED_COUNTRIES}
```

---

## 🟡 MEDIANOS

### 8. Bootstrap Enterprise NO se llama

**Ubicación:** backend/server.py (startup)  
**Severidad:** 🟡 MEDIO  
**Impacto:** Features enterprise deshabilitadas

Documentado arriba en reporte principal.

### 9. Data de Prueba Insuficiente

**Ubicación:** backend/create_test_users.py  
**Severidad:** 🟡 MEDIO  
**Impacto:** No se puede probar multipaís

Documentado arriba en reporte principal.

---

## COMANDOS DE VALIDACIÓN RÁPIDA

**Verificar estado de IA:**
```bash
curl -X POST http://localhost:8000/api/ai/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"message":"Hola"}'

# Esperado: 200 + respuesta
# Actual: 503 + error
```

**Verificar MongoDB:**
```bash
mongosh --eval "db.adminCommand('ping')"
# Esperado: { ok: 1 }
# Actual: MongoNetworkError
```

**Verificar configuración:**
```bash
grep "GEMINI_API_KEY\|ANTHROPIC_API_KEY\|SECRET_KEY\|MONGO_URL" backend/.env
# Resultado: todos tienen valores placeholder
```

---

## MATRIZ DE RESOLUCIÓN (Priorización)

| Hallazgo | P0 | Tipo | Horas | Bloquer | Deps |
|----------|-------|------|-------|---------|------|
| MongoDB | 1 | Config | 1-2 | SÍ | - |
| .env completo | 2 | Config | 2-4 | SÍ | - |
| Modelos suscripción | 3 | Code | 3-4 | SÍ | .env |
| Estados Unidos | 4 | Config | 1-2 | SÍ | - |
| Bootstrap Enterprise | 5 | Code | 1 | NO | .env |
| Data prueba | 6 | Data | 4-6 | NO | MongoDB |
| Hook dependencies | 7 | Code | 1 | NO | - |

**Tiempo total:** ~16 horas con testing incluido.

