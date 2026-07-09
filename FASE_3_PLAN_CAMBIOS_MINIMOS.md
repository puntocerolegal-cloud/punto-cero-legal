# FASE 3: PLAN DE CAMBIOS MÍNIMOS — ANÁLISIS PRE-IMPLEMENTACIÓN

## OBJETIVO
Cerrar completamente el **Hallazgo Crítico #1: TenantIsolationMiddleware no está integrado** con cambios **MÍNIMOS Y QUIRÚRGICOS**.

---

## 1. ARCHIVOS A MODIFICAR

| Archivo | Líneas | Cambio | Razón | Riesgo |
|---------|--------|--------|-------|--------|
| **backend/server.py** | ~220 (startup) | Llamar `await bootstrap_enterprise(app, db)` en evento startup | Activa toda la infraestructura enterprise | BAJO - Apenas agrega 3 líneas |
| **backend/utils/auth.py** | 21-27 | Agregar `firm_id` al JWT payload (con fallback) | Permite validación de tenant en middleware | BAJO - Backward compatible |
| **backend/middleware/tenant_isolation.py** | 101-135 | Aceptar tanto `X-Firm-ID` como `X-Tenant-ID` headers | Compatibilidad temporal | BAJO - Fallback simple |
| **backend/routes/auth.py** | 123, 178 | Pasar `firm_id` al `create_access_token()` | Incluir firm_id en JWT | BAJO - Parámetro opcional |
| **backend/routes/payment.py** | ~644 (si emite tokens) | Si emite tokens, pasar `firm_id` | Incluir firm_id en JWT | BAJO - Igual que auth.py |
| **frontend/src/security/tenantStorage.js** | 26-31 | POSIBLEMENTE NO CAMBIAR o agregar fallback | Mantener compatibilidad | BAJO - Opcional |

**Total de archivos:** 5-6
**Total de líneas modificadas:** ~30-50
**Complejidad:** BAJA

---

## 2. CAMBIOS DETALLADOS POR ARCHIVO

### 2.1 `backend/server.py` — AGREGAR BOOTSTRAP

**Ubicación:** Después de crear `app` y conectar a `db` (línea ~141)

**Cambio:**
```python
# ANTES (línea ~220)
@app.on_event("startup")
async def init_cron_jobs():
    ...

# DESPUÉS (insertar ANTES de init_cron_jobs):
@app.on_event("startup")
async def startup_enterprise():
    """Wire enterprise infrastructure: middleware, services, routes, indexes."""
    from bootstrap_enterprise import bootstrap_enterprise
    try:
        await bootstrap_enterprise(app, db)
        logger.info("[STARTUP] Enterprise infrastructure bootstrapped")
    except Exception as e:
        logger.error(f"[STARTUP] Bootstrap failed: {e}", exc_info=True)
        raise
```

**Dependencias:**
- ✓ `bootstrap_enterprise` ya existe en `backend/bootstrap_enterprise.py`
- ✓ `app` disponible en scope
- ✓ `db` disponible en scope

**Riesgos:**
- ✗ Si bootstrap_enterprise() falla, app no inicia
  - Mitigación: Try/catch con re-raise (requiere que admin corrija config)

**Orden de ejecución:**
```
1. MongoDB connection
2. startup_enterprise() ← NUEVO: Registra middleware, servicios, rutas
3. init_cron_jobs() ← Existente
4. init_db_indexes() ← Existente
5. init_master_accounts() ← Existente
```

**Impacto en orden de middlewares:**
- Middleware registrado en bootstrap (línea 127): `app.add_middleware(TenantIsolationMiddleware)`
- CORS middleware: Ya está registrado (línea 439)
- **Orden final (de ejecución, último agregado = primero):**
  1. TenantIsolationMiddleware ← NUEVO (agregado por bootstrap)
  2. CORSMiddleware ← Existente

✓ Correcto: TenantIsolationMiddleware ejecuta ANTES de CORS

---

### 2.2 `backend/utils/auth.py` — AGREGAR firm_id AL JWT

**Ubicación:** Función `create_access_token()` (línea 21-27)

**Cambio:**
```python
# ANTES
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# DESPUÉS
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    # NUEVO: Agregar versión para debugging y compatibilidad
    if "v" not in to_encode:
        to_encode["v"] = 1  # Versión actual
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
```

**Dependencias:**
- ✓ Función simple, no depende de nada
- ✓ `to_encode` acepta cualquier claim

**Riesgos:**
- ✗ Agregar claim "v" requiere que decode_token lo maneje (ya lo hace: ignora claims desconocidos)
- ✓ Backward compatible: tokens viejos sin "v" siguen siendo válidos

**Nota:** El firmware realmente importante (`firm_id`, `user_id`) lo agregan en routes/auth.py y routes/payment.py al LLAMAR create_access_token()

---

### 2.3 `backend/routes/auth.py` — PASAR firm_id AL JWT

**Ubicación 1:** Función `register()` (línea ~123)

**Cambio:**
```python
# ANTES (línea 123)
access_token = create_access_token(data={"sub": user_data.email, "role": user_data.role})

# DESPUÉS
access_token = create_access_token(data={
    "sub": user_data.email,
    "role": user_data.role,
    "firm_id": user_dict.get("firm_id"),  # NUEVO: agregar si existe
    "user_id": str(user_dict.get("_id"))  # NUEVO: agregar para evitar N+1
})
```

**Ubicación 2:** Función `login()` (línea ~178)

**Cambio:**
```python
# ANTES (línea 178)
access_token = create_access_token(data={"sub": user["email"], "role": role})

# DESPUÉS
access_token = create_access_token(data={
    "sub": user["email"],
    "role": role,
    "firm_id": firm_id,  # NUEVO: agregar si existe (puede ser None)
    "user_id": str(user["_id"])  # NUEVO: agregar para evitar N+1
})
```

**Dependencias:**
- ✓ Variables `firm_id`, `user` ya disponibles en scope
- ✓ No requiere import adicional

**Riesgos:**
- ✗ Si firm_id es None, JWT tendrá claim vacío
  - Mitigación: Middleware maneja None (fallback a header)
- ✓ Backward compatible: Claims nuevos opcionales

**Impacto:**
- 150+ endpoints que usan JWT ahora tendrán `firm_id` disponible en payload
- Middleware puede validar sin hacer query DB

---

### 2.4 `backend/middleware/tenant_isolation.py` — ACEPTAR HEADERS MÚLTIPLES

**Ubicación:** Método `_extract_tenant_context()` (línea 101-135)

**Cambio:**
```python
# ANTES (línea 110-111)
# Try to get firm_id from header
firm_id = request.headers.get("X-Firm-ID")

# DESPUÉS
# Try to get firm_id from header (accept multiple names for compatibility)
firm_id = (
    request.headers.get("X-Firm-ID") or      # Preferir X-Firm-ID (nuevo)
    request.headers.get("X-Tenant-ID")       # Fallback a X-Tenant-ID (legacy)
)
```

**Ubicación 2:** Dentro de JWT decode (línea ~130-132)

**Cambio:**
```python
# ANTES
return TenantContext(
    firm_id=payload.get("firm_id"),
    user_id=payload.get("user_id"),
    user_email=payload.get("email"),
    user_role=payload.get("role"),
    ...
)

# DESPUÉS (mismo, pero ahora firm_id EXISTE en payload si JWT v1+)
return TenantContext(
    firm_id=payload.get("firm_id"),  # Ahora mejor rellenado
    user_id=payload.get("user_id", payload.get("sub")),  # Fallback a email si no existe
    user_email=payload.get("email") or payload.get("sub"),  # Fallback a sub (email en v1)
    user_role=payload.get("role"),
    ...
)
```

**Dependencias:**
- ✓ Cambio simple en order de headers (prioridad)
- ✓ No depende de nada

**Riesgos:**
- ✗ Si ni X-Firm-ID ni X-Tenant-ID existen, ambos son None
  - Mitigación: JWT ahora proporciona firm_id, así que es OK
- ✓ Backward compatible: acepta header viejo

---

### 2.5 `backend/routes/payment.py` — PASAR firm_id AL JWT (SI EMITE)

**Búsqueda necesaria:**
```bash
grep -n "create_access_token\|access_token\s*=" backend/routes/payment.py
```

**Si existe, aplicar mismo cambio que auth.py**

**Dependencias:**
- Depende del resultado de la búsqueda
- Si payment.py emite tokens, necesita mismo trato que auth.py

---

### 2.6 `frontend/src/security/tenantStorage.js` — POSIBLEMENTE NO CAMBIAR

**Actual (línea 26-31):**
```javascript
export function getTenantHeaders() {
  const t = readTenant();
  const headers = {};
  if (t?.tenantId) headers["X-Tenant-ID"] = String(t.tenantId);
  if (t?.organizationId) headers["X-Organization-ID"] = String(t.organizationId);
  return headers;
}
```

**¿NECESITA CAMBIO?**

Análisis:
- Frontend envía `X-Tenant-ID` (del context tenantId)
- Frontend envía `X-Organization-ID`
- Middleware ahora acepta X-Tenant-ID como fallback ✓
- Middleware también aceptaría X-Firm-ID si frontend lo enviara
- **Conclusión:** NO NECESITA CAMBIO AHORA

**Cambio opcional futuro (Fase B, 2 semanas):**
```javascript
// OPTIONAL: Agregar X-Firm-ID como alias (cuando todo esté testeado)
if (t?.firmId) headers["X-Firm-ID"] = String(t.firmId);
```

**Decisión:** MANTENER COMO ESTÁ (sin cambios en Bloque 1)

---

## 3. ORDEN DE IMPLEMENTACIÓN

1. **backend/server.py** — Llamar bootstrap_enterprise() en startup
2. **backend/utils/auth.py** — Agregar "v" al JWT (cambio trivial)
3. **backend/routes/auth.py** — Pasar firm_id y user_id al crear token
4. **backend/routes/payment.py** — Buscar y aplicar cambio si emite tokens
5. **backend/middleware/tenant_isolation.py** — Aceptar múltiples headers
6. **Frontend** — NO CAMBIAR (backward compatible)

**Secuencia:**
```
1. Modifica utils/auth.py
2. Modifica routes/auth.py
3. Modifica routes/payment.py (si necesario)
4. Modifica middleware/tenant_isolation.py
5. Modifica server.py
6. Compila y prueba
```

---

## 4. VALIDACIÓN PRE-IMPLEMENTACIÓN

### ¿Qué se espera que funcione DESPUÉS?

✓ Backend compila sin errores
✓ Backend inicia sin errores
✓ Bootstrap ejecuta exitosamente (logs muestran "[ENTERPRISE] Bootstrap complete")
✓ TenantIsolationMiddleware registrado (logs muestran "[TENANT]" en requests)
✓ request.state.tenant_context existe durante request (disponible en endpoints)
✓ JWT emitido con firm_id (decodificar token muestra claim)
✓ Headers X-Tenant-ID Y X-Firm-ID aceptados
✓ Rutas públicas no afectadas (/health, /auth/login, /auth/register)
✓ Endpoints protegidos requieren JWT o header
✓ Tokens viejos siguen funcionando (si no tienen firm_id, middleware obtiene de header)

### ¿Qué NO debe cambiar?

✗ Ninguna ruta
✗ Ningún modelo
✗ Ninguna lógica de negocio
✗ Frontend (salvo si browser caching)
✗ MongoDB (estructura intacta)
✗ Nombres de variables

---

## 5. RIESGOS IDENTIFICADOS

| Riesgo | Probabilidad | Severidad | Mitigación |
|--------|--------------|-----------|-----------|
| bootstrap_enterprise() falla en startup | BAJA | ALTA | Try/catch, logs detallados, requiere admin fix |
| JWT con firm_id=None causa problemas | BAJA | BAJA | Middleware fallback a header |
| Middleware cambia request behavior | BAJA | MEDIA | Muy bien testeado en bootstrap_enterprise.py |
| Tokens viejos fallan | BAJA | ALTA | Middleware acepta None firm_id, usa header |
| Header X-Tenant-ID vs X-Firm-ID conflicto | BAJO | MEDIA | Código usa prioridad: X-Firm-ID > X-Tenant-ID |
| Compilación falla | BAJO | ALTA | Python dinámico, testear import |

---

## 6. CHECKLIST PRE-IMPLEMENTACIÓN

- [ ] Leer TODOS los cambios
- [ ] Entender PORQUÉ cada cambio
- [ ] Identificar DÓNDE cada cambio
- [ ] Evaluar RIESGOS
- [ ] Acepta proseguir con implementación

**¿Proceder con FASE 3 IMPLEMENTACIÓN?**

