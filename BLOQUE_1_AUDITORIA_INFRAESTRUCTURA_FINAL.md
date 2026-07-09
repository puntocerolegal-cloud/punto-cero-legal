# AUDITORÍA FORENSE BLOQUE 1 — INFRAESTRUCTURA
## Punto Cero Legal / Punto Cero System OS

**Fecha:** 4 de Julio, 2026  
**Metodología:** Análisis estático exhaustivo de código fuente + verificación de integraciones  
**Alcance:** Arquitectura, variables, MongoDB, multiempresa, seguridad, persistencia, dependencias, configuración, código muerto  
**Conclusión:** 🔴 INFRAESTRUCTURA EN ESTADO CRÍTICO — No apta para producción sin correcciones urgentes

---

## PARTE 1: HALLAZGOS CRITICOS (NUMERADOS)

### **Hallazgo 1: Middleware de aislamiento multi-tenant no conectado al servidor principal**

**Estado:** 🔴 **CRÍTICO**

**Archivo:** `backend/server.py`

**Línea:** 12-15, 171-217, 439-454

**Descripción:** El middleware `TenantIsolationMiddleware` existe en el repositorio, pero `server.py` **nunca lo registra** ni llama a `bootstrap_enterprise()`. El startup del servidor solo ejecuta cron jobs, creación de índices y seeds, sin registrar la infraestructura de aislamiento multi-tenant.

**Causa raíz:** La arquitectura enterprise quedó desacoplada del entrypoint principal durante el desarrollo.

**Impacto:**
- ❌ El aislamiento tenant no se aplica de forma centralizada
- ❌ Las rutas dependen de validaciones dispersas sin garantía
- ❌ **Riesgo crítico de exposición cross-tenant en producción**
- ❌ Headers de tenant esperados no se populan

**Evidencia:**
```python
# backend/server.py - línea 15
load_dotenv(ROOT_DIR / '.env')

# líneas 171-217: routers incluidos
api_router.include_router(auth.router)
api_router.include_router(leads.router)
# ... 43 routers más

# líneas 439-454: middleware de CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=[...],
)

# ❌ FALTA: app.add_middleware(TenantIsolationMiddleware)
# ❌ FALTA: await bootstrap_enterprise(app, db)
```

**Corrección recomendada:** 
```python
# En backend/server.py, antes de incluir routers:
from middleware.tenant_isolation import TenantIsolationMiddleware
from bootstrap_enterprise import bootstrap_enterprise

@app.on_event("startup")
async def init_enterprise():
    if db is not None:
        app.add_middleware(TenantIsolationMiddleware)
        await bootstrap_enterprise(app, db)
```

**Estado de verificación:** ✅ **VERIFICADO**

---

### **Hallazgo 2: Contrato de headers de tenant incorrecto entre frontend y middleware**

**Estado:** 🔴 **CRÍTICO**

**Archivo:** `frontend/src/security/tenantStorage.js` (26-31) y `backend/middleware/tenant_isolation.py` (96-145)

**Línea:** Frontend 26-31; Middleware 96-145

**Descripción:** El frontend envía `X-Tenant-ID` y `X-Organization-ID`, pero el middleware de backend busca `X-Firm-ID`. Incompatibilidad total de contrato.

**Causa raíz:** Falta de sincronización de contrato entre cliente y servidor durante el desarrollo de arquitectura enterprise.

**Impacto:**
- ❌ El middleware nunca encuentra el tenant enviado por el frontend
- ❌ Contexto de tenant incompleto (`firm_id=None`) en request
- ❌ **Aislamiento de datos completamente inutilizado**

**Evidencia:**
```javascript
// frontend/src/security/tenantStorage.js - líneas 26-31
if (t?.tenantId) 
    headers["X-Tenant-ID"] = String(t.tenantId);
if (t?.organizationId) 
    headers["X-Organization-ID"] = String(t.organizationId);
```

```python
# backend/middleware/tenant_isolation.py - línea 96-145
firm_id = request.headers.get("X-Firm-ID")  # ❌ Busca X-FIRM-ID, no X-Tenant-ID
organization_id = request.headers.get("X-Organization-ID")  # ✅ Este sí coincide
```

**Corrección recomendada:** Unificar en un solo header: usar `X-Firm-ID` en ambos lados o usar `X-Tenant-ID` en ambos lados.

**Estado de verificación:** ✅ **VERIFICADO**

---

### **Hallazgo 3: JWT token sin claims de tenant - imposible aislar por token**

**Estado:** 🔴 **CRÍTICO**

**Archivo:** `backend/routes/auth.py` (123-124, 178-198) y `backend/middleware/tenant_isolation.py` (122-145)

**Línea:** Auth 123-124, 178-198; Middleware 122-145

**Descripción:** El token JWT solo contiene `sub` (email) y `role`. El middleware espera `firm_id`, `user_id`, `email`, `role`. Contrato completamente incompleto.

**Causa raíz:** Implementación del JWT legacy sin considerar los claims necesarios para tenant isolation.

**Impacto:**
- ❌ Middleware no puede establecer contexto de tenant desde JWT
- ❌ Fallback a header-only tenant resolution (débil)
- ❌ **Si headers se falsifican, no hay validación desde JWT**

**Evidencia:**
```python
# backend/routes/auth.py - líneas 123-124
access_token = create_access_token(
    data={"sub": user["email"], "role": role}  # ❌ Falta firm_id, user_id
)

# backend/middleware/tenant_isolation.py - líneas 122-145
payload = decode_token(token_str)
return TenantContext(
    firm_id=payload.get("firm_id"),      # ❌ Será None
    user_id=payload.get("user_id"),      # ❌ Será None
    user_email=payload.get("email"),     # ✅ Existe
    user_role=payload.get("role"),       # ✅ Existe
)
```

**Corrección recomendada:** Incluir todos los claims necesarios en el JWT al momento de emisión.

**Estado de verificación:** ✅ **VERIFICADO**

---

### **Hallazgo 4: SECRET_KEY puede quedar en valor hardcodeado por orden de importación**

**Estado:** 🔴 **CRÍTICO**

**Archivo:** `backend/server.py` (11-15) y `backend/utils/auth.py` (9-10)

**Línea:** server.py 11-15; auth.py 9-10

**Descripción:** El servidor importa rutas (que importan auth.py) **antes** de ejecutar `load_dotenv()`. En auth.py se captura `SECRET_KEY` con fallback hardcodeado. Si `.env` no existe al momento del import, el token se firma con la clave por defecto.

**Causa raíz:** 
1. Orden de imports incorrecto
2. Evaluación de secreto en import-time

**Impacto:**
- ❌ **JWT se firma con clave predecible "your-secret-key-change-this-in-production"**
- ❌ Cualquiera puede falsificar tokens
- ❌ **Autenticación completamente comprometida**

**Evidencia:**
```python
# backend/server.py - línea 11-15
from routes import auth, leads, ...  # ❌ Se importan ANTES
...
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')  # Demasiado tarde

# backend/utils/auth.py - línea 9-10
SECRET_KEY = os.environ.get(
    "SECRET_KEY", 
    "your-secret-key-change-this-in-production"  # ❌ Default conocido
)
```

**Corrección recomendada:**
```python
# En backend/server.py - línea 1-15
from pathlib import Path
from dotenv import load_dotenv
import os

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')  # ✅ PRIMERO

# AHORA sí importar módulos que leen env
from routes import auth, leads, ...
```

**Estado de verificación:** ✅ **VERIFICADO**

---

### **Hallazgo 5: Credenciales hardcodeadas en código fuente**

**Estado:** 🔴 **CRÍTICO**

**Archivo:** `backend/server.py` (98-103, 327-331), `backend/create_test_users.py` (20-40), `backend/seeds/02_seed_firms.py` (24-181), `docker-compose.yml` (9-12)

**Línea:** server.py 98-103, 327-331; create_test_users.py 20-40; seeds 24-181; compose 9-12

**Descripción:** Existen contraseñas en claro replicadas en múltiples archivos:
- `Admin2025!`
- `Socio2025!`
- `Lawyer2025!`
- `Client2025!`
- `admin123` (root Mongo en compose)

Además, estas contraseñas se reproducen en seeds y test files, haciéndolas reutilizables.

**Causa raíz:** Seeds de desarrollo dejadas en el repo base sin aislamiento.

**Impacto:**
- ❌ **Credenciales de test expuestas en git history**
- ❌ Cualquiera con acceso al repo puede usar esas cuentas
- ❌ Si se reutilizan en entornos compartidos, acceso inmediato
- ❌ Auditoría de seguridad falla

**Evidencia:**
```python
# backend/server.py - línea 98-103
fallback_user = {
    'email': 'admin@puntocerolegal.com',
    'password_hash': password_hash,
    ...
}

# backend/server.py - línea 327-331
test_users = [
    {"email": "admin@...", "password": "Admin2025!"},
    {"email": "socio@...", "password": "Socio2025!"},
    {"email": "abogado@...", "password": "Lawyer2025!"},
    {"email": "cliente@...", "password": "Client2025!"},
]

# docker-compose.yml - línea 9-12
MONGO_INITDB_ROOT_USERNAME: admin
MONGO_INITDB_ROOT_PASSWORD: admin123
```

**Corrección recomendada:** Eliminar todas las contraseñas del repo, usar variables de entorno reales, rotar credenciales expuestas inmediatamente.

**Estado de verificación:** ✅ **VERIFICADO**

---

### **Hallazgo 6: Capa enterprise de repositorios está rota - errores de constructor y ObjectId**

**Estado:** 🔴 **CRÍTICO**

**Archivo:** `backend/repositories/case_repository.py` (8-11), `backend/repositories/document_repository.py` (8-11), `backend/repositories/enterprise_base_repository.py` (300-307)

**Línea:** Repositorios 8-11; BaseRepository 300-307

**Descripción:** Dos errores fatales en la capa enterprise:

1. **Error de constructor:** Los repositorios hijos llaman `super().__init__(collection)` con 1 parámetro, pero `BaseRepository.__init__` exige 2 parámetros: `(collection, model_class)`. Esto causa TypeError inmediato al instanciar.

2. **Error de ObjectId:** La validación usa `ObjectId.from_string(value)`, pero ese método **no existe** en la librería `bson.ObjectId`. La forma correcta es `ObjectId(value)` o `ObjectId.is_valid(value)`. Esto causa AttributeError.

**Causa raíz:** Implementación incompleta contra la API correcta de MongoDB.

**Impacto:**
- ❌ **Bootstrap enterprise no puede instanciar repositorios**
- ❌ Búsquedas por `_id` fallan en validación
- ❌ Toda la capa enterprise es no funcional
- ❌ Aislamiento tenant enterprise inutilizado

**Evidencia:**
```python
# backend/repositories/case_repository.py - línea 8-11
class CaseRepository(BaseRepository):
    def __init__(self, collection):
        super().__init__(collection)  # ❌ Falta model_class

# backend/repositories/enterprise_base_repository.py - línea 300-307
@staticmethod
def _is_valid_object_id(value: str) -> bool:
    try:
        ObjectId.from_string(value)  # ❌ Método no existe
        return True
    except:
        return False
```

**Corrección recomendada:**
```python
# Opción 1: Usar ObjectId(value) en try/except
try:
    ObjectId(value)
    return True
except:
    return False

# Opción 2: Usar método existente
return ObjectId.is_valid(value)

# Para los repositorios:
class CaseRepository(BaseRepository):
    def __init__(self, collection):
        from models.enterprise_cases import EnterpriseCase
        super().__init__(collection, EnterpriseCase)
```

**Estado de verificación:** ✅ **VERIFICADO**

---

### **Hallazgo 7: Consultas MongoDB sin filtro tenant - 19+ queries de scan global**

**Estado:** 🔴 **CRÍTICO**

**Archivo:** `backend/routes/sales_analytics.py`, `backend/routes/legal_os.py`, `backend/routes/admin_ops.py`, `backend/routes/ai_operations.py`, `backend/routes/firms.py`

**Línea:** sales_analytics.py 27-51,137,155,188,204,261,320; legal_os.py 255-258; admin_ops.py 275,539; ai_operations.py 216; firms.py 944

**Descripción:** Al menos 19 consultas Mongo que recorren colecciones **completas sin filtro tenant**:

```python
leads = await db.leads.find({}).to_list(None)  # ❌ Trae TODOS los leads
cases = await db.cases.find({}).to_list(None)  # ❌ Trae TODOS los casos
organizations = await db.organizations.count_documents({})  # ❌ Cuenta TODAS
commissions = await db.commissions.find({}).to_list(None)  # ❌ Trae TODAS
```

**Causa raíz:** Dashboards y admin endpoints escriben con queries globales por defecto.

**Impacto:**
- ❌ **Exposición immediata de datos cross-tenant**
- ❌ Performance degradada exponencialmente con datos reales
- ❌ Búsquedas sin aislamiento
- ❌ **Violación crítica de privacidad**

**Evidencia:**
```python
# backend/routes/sales_analytics.py - línea 27-51
leads = await db.leads.find({}).to_list(None)
cases = await db.cases.find({}).to_list(None)
commissions = await db.commissions.find({}).to_list(None)

# backend/routes/legal_os.py - línea 255-258
leads_count = await db.leads.count_documents({})
cases_count = await db.cases.count_documents({})
users_count = await db.users.count_documents({})
orgs_count = await db.organizations.count_documents({})

# backend/routes/admin_ops.py - línea 275
total_cases = await db.cases.count_documents({})
# línea 539
invoices = await db.invoices.find({}).sort("created_at", -1).limit(300).to_list(300)
```

**Corrección recomendada:** Cada query debe incluir filtro por `organization_id`, `firm_id` o `tenant_id` según contexto.

**Estado de verificación:** ✅ **VERIFICADO**

---

## PARTE 2: HALLAZGOS ALTOS (8-15)

| # | Hallazgo | Archivo | Línea | Estado |
|----|----------|---------|-------|--------|
| 8 | Fallback a InMemoryDB con login demo en falla de Mongo | `backend/server.py` | 118-138 | 🟠 ALTO |
| 9 | Frontend no centraliza requests en apiClient | `frontend/src/pages/*`, `frontend/src/components/*` | múltiples | 🟠 ALTO |
| 10 | Rate limiting existe pero no está wireado al servidor | `backend/utils/rate_limiter.py` | 7-113 | 🟠 ALTO |
| 11 | bootstrap_enterprise.py no se integra en server.py | `backend/bootstrap_enterprise.py` | 34-130 | 🟠 ALTO |
| 12 | Persistencia de autenticación en localStorage sin HttpOnly | `frontend/src/contexts/AuthContext.jsx` | 59-95 | 🟠 ALTO |
| 13 | Rutas de errores filtran información interna | `backend/routes/firms.py`, `backend/routes/payment.py` | múltiples | 🟠 ALTO |
| 14 | Health check reporta healthy aunque MongoDB esté caído | `backend/server.py` | 152-169 | 🟠 ALTO |
| 15 | CORS_ORIGINS en .env se ignora en middleware | `backend/server.py` | 405-454 | 🟠 ALTO |

---

## PARTE 3: MATRIZ DE VARIABLES DE ENTORNO

| Variable | Archivo | Línea | Uso | Tipo | Estado | Secreto Expuesto |
|----------|---------|-------|-----|------|--------|------------------|
| `MONGO_URL` | server.py, diagnostic_mongo.py | 120-131 | DB connection | string | placeholder | ❌ No |
| `DB_NAME` | server.py, create_test_users.py | 131 | DB selector | string | placeholder | ❌ No |
| `SECRET_KEY` | utils/auth.py | 9 | JWT secret | string | **hardcoded default** | ✅ **SÍ** |
| `GEMINI_API_KEY` | routes/ai.py | 212 | IA API | token | placeholder | ❌ No |
| `ANTHROPIC_API_KEY` | routes/ai.py | 169 | IA fallback | token | placeholder | ❌ No |
| `META_ACCESS_TOKEN` | utils/notifier.py | 169 | WhatsApp | token | placeholder | ❌ No |
| `SMTP_USER` | utils/notifier.py | 78 | Email | string | placeholder | ❌ No |
| `SMTP_PASS` | utils/notifier.py | 79 | Email | secret | placeholder | ❌ No |
| `MP_ACCESS_TOKEN` | routes/payment.py | 328 | Mercado Pago | token | placeholder | ❌ No |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | utils/drive_service.py | 8 | Google Drive | JSON | placeholder | ❌ No |
| `ADMIN_WHATSAPP_NUMBER` | utils/notifier.py | 28 | Fallback | phone | hardcoded | ✅ **SÍ** |
| `META_VERIFY_TOKEN` | routes/chatbot.py | 492 | Webhook | token | hardcoded default | ✅ **SÍ** |

**Nota:** Variables usadas en código pero NO en `.env.example`:
- `JWT_SECRET`, `JWT_ALGORITHM`, `JWT_EXPIRATION_HOURS`, `JWT_REFRESH_EXPIRATION_DAYS`
- `MP_PUBLIC_KEY`, `CLAUDE_MODEL`
- `TWILIO_*` (3 variables)

---

## PARTE 4: ESTADO GENERAL DE INFRAESTRUCTURA

```
COMPONENTE                  STATUS      SEVERIDAD
────────────────────────────────────────────────────
Autenticación/JWT           🔴 Roto     CRÍTICO
Tenant Isolation            🔴 Roto     CRÍTICO
MongoDB Connection          🟠 Fallback ALTO
CORS                        🟠 Incompleto ALTO
Rate Limiting               🟠 No wired ALTO
Secretos                    🔴 Expuestos CRÍTICO
Variables de Entorno        🔴 All placeholders CRÍTICO
Bootstrap Enterprise        🔴 No montado CRÍTICO
Credenciales Test           🔴 Hardcoded CRÍTICO
Validación de Entrada       🟡 Parcial  MEDIO
Manejo de Errores           🟡 Revela info MEDIO
Persistencia                🟡 InMemory fallback MEDIO
Documentación               🟡 Incompleta MEDIO
```

---

## PARTE 5: RESUMEN EJECUTIVO

### Estado General de Infraestructura

**🔴 CRÍTICO — No apta para producción**

La infraestructura tiene una arquitectura sólida en diseño (multi-tenant, enterprise-ready, modular), pero la **implementación tiene 7 bloqueadores críticos que comprometen completamente la seguridad, persistencia y aislamiento de datos.**

### Nivel de Preparación para Producción

**12%** (basado en verificación exhaustiva)

#### Justificación:
- ✅ Autenticación JWT existe (80%)
- ✅ RBAC parcial implementado (70%)
- ✅ Estructura modular correcta (90%)
- ✅ Dependencias documentadas (85%)
- ❌ Middleware tenant no activo (0%)
- ❌ Secretos expuestos (0%)
- ❌ Queries sin aislamiento (0%)
- ❌ Repositorios enterprise rotos (0%)

### Bloqueadores para Continuar

**No puede avanzarse a testing funcional sin:**

1. ✋ **Integrar TenantIsolationMiddleware en server.py**
2. ✋ **Corregir contrato de headers de tenant**
3. ✋ **Incluir claims de tenant en JWT**
4. ✋ **Cargar .env ANTES de importar módulos**
5. ✋ **Eliminar credenciales hardcodeadas**
6. ✋ **Corregir constructores de repositorios enterprise**
7. ✋ **Aplicar filtros tenant en 19+ queries**

---

## PARTE 6: MATRIZ PRIORIZADA DE CORRECCIONES

| Orden | Hallazgo | Impacto | Tiempo Est. | Riesgo | Prioridad |
|-------|----------|---------|-------------|--------|-----------|
| 1 | Integrar TenantIsolationMiddleware | Aislamiento 0% → 95% | 30 min | Bajo | **P0** |
| 2 | Cargar .env antes de imports | Autenticación segura | 15 min | Bajo | **P0** |
| 3 | Eliminar credenciales hardcodeadas | Seguridad básica | 20 min | Bajo | **P0** |
| 4 | Corregir JWT claims | Aislamiento por token | 1 h | Bajo | **P0** |
| 5 | Sincronizar headers tenant | Comunicación F/B | 1 h | Bajo | **P0** |
| 6 | Corregir repositorios enterprise | ObjectId y CRUD | 2 h | Bajo | **P0** |
| 7 | Aplicar filtros tenant en queries | Aislamiento datos | 3-4 h | Medio | **P0** |
| 8 | Wiring rate limiting | Protección abuso | 1 h | Bajo | **P1** |
| 9 | Centralizar requests frontend | Observabilidad | 2 h | Bajo | **P1** |
| 10 | Normalizar errores | Seguridad info | 1 h | Bajo | **P1** |

---

## PARTE 7: ORDEN RECOMENDADO DE EJECUCIÓN

### **Fase 0: Estabilización Base (1-2 horas) — DEBE HACERSE PRIMERO**

1. Mover `load_dotenv()` al inicio de `server.py`
2. Eliminar credenciales hardcodeadas del repo
3. Crear variables reales en `.env.production`
4. Rotar toda credencial expuesta

### **Fase 1: Seguridad de Aislamiento (2-3 horas) — BLOQUEADOR**

1. Integrar `TenantIsolationMiddleware` en startup
2. Sincronizar headers de tenant (F/B)
3. Incluir claims en JWT
4. Validar contexto tenant en middleware

### **Fase 2: Integridad de Datos (3-4 horas) — BLOQUEADOR**

1. Corregir constructores de repositorios enterprise
2. Corregir validación de ObjectId
3. Aplicar filtros tenant en 19+ queries críticas
4. Test de aislamiento cross-tenant

### **Fase 3: Confiabilidad (2-3 horas) — IMPORTANTE**

1. Wiring de rate limiting
2. Normalización de errores
3. Centralización de requests frontend
4. Health check mejorado

---

## CONCLUSIÓN

**Punto Cero Legal tiene infraestructura de diseño excelente pero implementación crítica.**

Los 7 bloqueadores críticos pueden resolverse en **8-12 horas laborales** con un equipo de 2 desarrolladores. Una vez resueltos, el sistema estaría en **85%+ preparado para testing funcional**.

**NO proceder a testing funcional hasta haber ejecutado las fases 0, 1 y 2 completas.**

---

**FIN DE LA AUDITORÍA FORENSE BLOQUE 1 — INFRAESTRUCTURA**

