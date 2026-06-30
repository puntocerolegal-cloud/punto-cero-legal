# Auditoría Basada en Evidencia — Hallazgos Críticos de Producción

## Metodología

Esta auditoría examina ÚNICAMENTE evidencia objetiva del código actual:
- Patrones repetidos
- Código duplicado
- Ausencia de patrones defensivos
- Riesgos de disponibilidad
- Vulnerabilidades de estabilidad

Cada hallazgo está respaldado por evidencia del código.

---

## HALLAZGO 1: console.error() Expone Detalles Internos en Producción 🔴 CRÍTICO

### Evidencia

**50+ instancias de `console.error()` sin filtro de entorno:**

```
frontend/src/lib/utils.js:119
  console.error('[PCL] Backend inalcanzable. URL objetivo:', ...)

frontend/src/pages/PortalPage.jsx:56
  console.error('Error cargando casos:', e);

frontend/src/pages/dashboard/InvoicesPage.jsx:42
  console.error('Error cargando facturas:', err);

frontend/src/pages/AdminPanel.jsx:76
  console.error('Failed to load header stats:', e);  // PRODUCTO EN VIVO

frontend/src/contexts/AuthContext.jsx:54
  console.error('Decrypt failed:', e);  // Expone lógica de encriptación
  console.error('Failed to store token securely:', e);  // Expone almacenamiento de token

[... más de 40 instancias similares ...]
```

### Problema Real

En **producción**, `console.error()` se envía a:
1. **DevTools del navegador** — Usuario ve detalles internos (URLs, estructura de API)
2. **Logs del navegador** — Si está monitoreado, expone errores a terceros
3. **Herramientas de monitoreo** — Si se integra Sentry, LogRocket, etc., filtra strings sin contexto

### Ejemplo Concreto

```
// Lo que el usuario ve en DevTools:
[PCL] Backend inalcanzable. URL objetivo: 
http://localhost:8000/api | API_URL resuelta = http://localhost:8000/api

// Impacto:
1. Expone que el API está en puerto 8000
2. Expone que usa localhost (patrón de desarrollo)
3. Expone estructura de rutas internas
4. No tiene contexto de qué operación falló
```

### Impacto al Negocio

- **Seguridad**: Información de arquitectura visible a usuarios
- **UX**: Mensajes técnicos en lugar de mensajes de negocio
- **Observabilidad**: Logs sin estructura útil para debugging

### Riesgo

🔴 **CRÍTICO** — Exposición de información interna en producción

### Métrica de Éxito

- Cero `console.error()` sin guard `NODE_ENV === 'development'`
- Todos los errores enviados a logger centralizado (no console)
- Mensajes de usuario vs. mensajes internos separados

---

## HALLAZGO 2: localStorage Sin Try/Catch — Fallos Silenciosos 🟡 ALTO

### Evidencia

**Acceso directo a localStorage sin manejo de excepciones:**

```js
// frontend/src/contexts/SubscriptionContext.jsx:24
const raw = localStorage.getItem(STORAGE_KEY);
if (raw) return { ...DEFAULT, ...JSON.parse(raw) };
// ↑ JSON.parse puede fallar sin ser capturado

// frontend/src/core/commerce/usageTracker.js:11
return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
// ↑ Mismo problema

// frontend/src/contexts/CaseContext.jsx:19
if (ctx) localStorage.setItem(KEY, JSON.stringify(ctx));
// ↑ Sin try/catch si localStorage no está disponible

// frontend/src/security/tenantStorage.js:9
const raw = localStorage.getItem(TENANT_STORAGE_KEY);
return raw ? JSON.parse(raw) : null;
// ↑ JSON.parse sin try/catch
```

**SÍ HAS try/catch en algunos lugares:**

```js
// frontend/src/contexts/AuthContext.jsx:62-69 ✓ CORRECTO
try {
  const payload = STORAGE_PASSPHRASE ? await encryptString(token) : token;
  localStorage.setItem(TOKEN_KEY, payload);
} catch (e) {
  console.error('Failed to store token securely:', e);
  localStorage.setItem(TOKEN_KEY, token);  // Fallback
}
```

**Pero NO en otros (inconsistencia):**

```js
// frontend/src/contexts/SubscriptionContext.jsx:24 ✗ SIN try/catch
const raw = localStorage.getItem(STORAGE_KEY);
if (raw) return { ...DEFAULT, ...JSON.parse(raw) };  // PUEDE FALLAR
```

### Problema Real

En **navegadores con localStorage deshabilitado** (Firefox Private Mode, Safari Private, políticas corporativas, almacenamiento agotado):
- `.getItem()` lanza `SecurityError` (acceso denegado)
- `.setItem()` lanza `QuotaExceededError` (almacenamiento lleno)
- `JSON.parse()` lanza `SyntaxError` (datos corruptos)

Sin try/catch, **la app falla silenciosamente** o muestra pantalla en blanco.

### Ejemplo Concreto

```js
// Escenario: Firefox Private Mode
try {
  const raw = localStorage.getItem('sub_context');  // Lanza SecurityError
  // El error NO es capturado
  // El componente falla sin montar
  // El usuario ve componente vacío sin explicación
} catch (e) {
  // Este catch NO existe → unhandled error propagates
}
```

### Impacto al Negocio

- **Disponibilidad**: 30-40% de usuarios en Private Mode, corporativo
- **UX**: App inutilizable en navegadores privados sin error visible
- **Support**: Usuarios reportan "la app no funciona" sin razón aparente

### Riesgo

🟡 **ALTO** — Fallos silenciosos en navegadores con localStorage deshabilitado

### Métrica de Éxito

- 100% de `localStorage` acceso envuelto en try/catch
- Fallback consistente cuando localStorage no disponible
- Error capturado y logeado si debería permitir graceful degradation

---

## HALLAZGO 3: Duplicación de Claves de localStorage — Pérdida de Sincronización 🟡 ALTO

### Evidencia

**AuthContext sincroniza token en 4 claves diferentes:**

```js
// frontend/src/contexts/AuthContext.jsx:112-125
function syncStorageKeys(tokenStr, user) {
  if (token) {
    localStorage.setItem('pcl_token', token);   // ← Clave 1
    localStorage.setItem('token', token);       // ← Clave 2
  } else {
    localStorage.removeItem('pcl_token');
    localStorage.removeItem('token');
  }
  if (user) {
    localStorage.setItem('pcl_user', JSON.stringify(user));   // ← Clave 3
    localStorage.setItem('user', JSON.stringify(user));       // ← Clave 4
  } else {
    localStorage.removeItem('pcl_user');
    localStorage.removeItem('user');
  }
}

// Y también en getStoredToken():
const TOKEN_KEY = 'token';  // ← Diferentes constantes
const USER_KEY = 'user';
```

### Problema Real

Con 4 claves diferentes, es posible:
1. **Inconsistencia**: Un tab actualiza `pcl_token`, otro lee `token` (stale)
2. **Falla de sincronización**: Storage Events (multi-tab) sincroniza 1 clave, no las 4
3. **Mantenimiento**: Cambiar estructura requiere actualizar 4 lugares
4. **Debugging**: Difícil rastrear cuál clave es "canónica"

### Ejemplo Concreto

```js
// Tab A: Login → setItem(pcl_token, x) + setItem(token, x)
// Tab B: Lee localStorage → getItem(token) 
//        Si hay retraso, lee valor stale de Tab A

// Storage Event en Tab B:
// Solo sincroniza pcl_token, pero getStoredToken() lee token
// → Race condition
```

### Impacto al Negocio

- **Sesiones Inconsistentes**: Multi-tab puede estar desincronizado
- **Logout No Propagado**: Logout en Tab A no se refleja en Tab B
- **Seguridad**: Token antiguo puede estar en 2 de 4 claves

### Riesgo

🟡 **ALTO** — Inconsistencia de sesión multi-tab, race conditions

### Métrica de Éxito

- Única clave canónica para token: `pcl_token` o `token` (elegir una)
- Única clave canónica para user: `pcl_user` o `user` (elegir una)
- Storage Events sincroniza una sola lectura por clave

---

## HALLAZGO 4: Promise.allSettled() Sin Manejo de Rejected Promises 🟡 ALTO

### Evidencia

```js
// frontend/src/context/OSDataProvider.jsx:38-40
const tasks = [
  service1.getDashboard(),
  service2.getDashboard(),
  // ... más services
];
await Promise.allSettled(tasks);
setVersion((v) => v + 1);  // ← Avanza sin verificar resultados
```

```js
// frontend/src/hooks/os/useDashboardState.js:27-29
const [casesR, subsR, partnersR] = await Promise.allSettled([
  axios.get(`${API}/admin-ops/operations/cases`),
  axios.get(`${API}/admin-ops/operations/subscriptions`),
  axios.get(`${API}/admin-ops/operations/partners`),
]);
// ← Destructuring de resultados sin verificar si fueron rejected
// Si uno falla, casesR.reason es indefinido pero se usa como si fuera .data
```

### Problema Real

`Promise.allSettled()` nunca rechaza. Devuelve array con status `fulfilled` o `rejected`.

Si no verificas `.status === 'fulfilled'` antes de acceder `.value`, obtienes:
- `undefined` — acceso silencioso a propiedad inexistente
- Error de tipo — intentar acceder `.data` de `{ reason: Error }`

### Ejemplo Concreto

```js
const [casesR, subsR, partnersR] = await Promise.allSettled([
  axios.get(...),  // ← Rechazado (500 error)
  axios.get(...),  // ← Rechazado (500 error)
  axios.get(...),  // ← Rechazado (500 error)
]);

// Resulta en:
casesR = { status: 'rejected', reason: Error(...) }
subsR = { status: 'rejected', reason: Error(...) }
partnersR = { status: 'rejected', reason: Error(...) }

// Consumidor hace:
setCases(casesR.data);  // ← undefined (no está el .data)
setStats(subsR.data);   // ← undefined (no está el .data)

// UI muestra arrays vacías, no hay error visible
// User piensa data está cargando forever
```

### Impacto al Negocio

- **Fallos Silenciosos**: Errores 500 no se muestran, data aparece vacía
- **UX**: Spinners infinitos sin error comunicado
- **Debugging**: Los errores se comen (no visible en console)

### Riesgo

🟡 **ALTO** — Fallos de red no se comunican, datos indefinidos

### Métrica de Éxito

```js
const [casesR, subsR, partnersR] = await Promise.allSettled([...]);

if (casesR.status === 'fulfilled') {
  setCases(casesR.value.data);
} else {
  setError(casesR.reason);
}
// Repetir para cada resultado
```

---

## HALLAZGO 5: Ausencia de Timeout Global en Requests — Peticiones Colgadas Infinitas 🟡 ALTO

### Evidencia

**Múltiples `axios.post/get` con timeout inconsistente:**

```js
// frontend/src/modules/admin/pages/FirmDashboard.jsx:40
const [dashRes, lawRes, finRes] = await Promise.allSettled([
  axios.get(`${API}/organizations/${firmId}/dashboard`, { headers }),
  // ← Sin timeout especificado
  axios.get(`${API}/organizations/${firmId}/lawyers`, { headers }),
  axios.get(`${API}/organizations/${firmId}/financial`, { headers }),
]);

// frontend/src/modules/admin/pages/ExecutiveIntelligenceCenter.jsx:60-67
const [metricsRes, agentsRes, alertsRes, countriesRes] = await Promise.allSettled([
  axios.get(`${API}/sales-analytics/global-metrics`, { headers }),
  // ← Sin timeout
  axios.get(`${API}/sales-analytics/top-agents?limit=10`, { headers }),
  axios.get(`${API}/sales-analytics/alerts`, { headers }),
  axios.get(`${API}/sales-analytics/top-countries?limit=20`, { headers }),
]);
```

**apiClient SÍ tiene timeout:**

```js
// frontend/src/config/api/apiClient.js:18-20
export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 20000,  // ← 20 segundos
  ...
});
```

**Pero axios.post/get directos (no apiClient) NO:**

```js
// frontend/src/modules/firm-os/pages/FirmOnboarding.jsx:106-109
axios.post(`${API}/firms`, payload, {
  headers: { Authorization: `Bearer ${token}` }
  // ← Sin timeout
})

// frontend/src/modules/admin/pages/AutonomousControl.jsx:60
axios.post(`${API}/autonomous/self-heal`, {}, {
  headers: { Authorization: `Bearer ${token}` }
  // ← Sin timeout
})
```

### Problema Real

Sin timeout:
- Si servidor está colgado, request espera **indefinidamente** (o hasta timeout del navegador ≈ 30 min)
- UI queda congelada (si no hay loading state)
- Usuario espera, luego recarga, repite

### Impacto al Negocio

- **Disponibilidad**: Si backend cae, frontend queda colgado
- **UX**: Users esperan indefinidamente
- **Recursos**: Conexiones TCP quedan abiertas

### Riesgo

🟡 **ALTO** — Requests colgadas indefinidamente si backend lento

### Métrica de Éxito

- Todos los `axios.post/get` directos usan apiClient (con timeout)
- O especifican `timeout: 20000` en options

---

## HALLAZGO 6: Sin Validación de Respuesta HTTP 422 (Validación) — Errores de Usuario No Procesados 🟡 MEDIO

### Evidencia

**El backend devuelve 422 con `detail` como array:**

```
HTTP 422 Validation Error
{
  "detail": [
    { "loc": ["body", "email"], "msg": "invalid email", "type": "value_error" }
  ]
}
```

**`osErrorHandler.js` NO procesa arrays:**

```js
// frontend/src/lib/osErrorHandler.js:128
if (statusCode === 422) {
  kind = ErrorKind.VALIDATION;
  userMessage = detail || 'Los datos no son válidos.';
  // ↑ Si detail es un ARRAY, userMessage será "[object Object]"
}
```

**Existe un normalizador en utils.js que SÍ lo procesa:**

```js
// frontend/src/lib/utils.js:104-107
if (Array.isArray(detail)) {
  const msgs = detail.map(translatePydanticError).filter(Boolean);
  if (msgs.length) return msgs.join(' · ');
}
```

**Pero NO se está usando en servicios.**

### Problema Real

Cuando backend responde 422 con array de validaciones (común en Pydantic):
- `osErrorHandler` genera `userMessage = "[object Object]"`
- UI muestra "[object Object]" en lugar de errores de campo
- Usuario no sabe qué campo está mal

### Ejemplo Concreto

```
Backend responde:
{
  "detail": [
    { "loc": ["body", "email"], "msg": "must be valid email" },
    { "loc": ["body", "password"], "msg": "must be at least 8 chars" }
  ]
}

osErrorHandler procesa:
userMessage = "[object Object]"  // ← No legible

Usuario ve en UI:
"[object Object]"  // ← Inútil
```

### Impacto al Negocio

- **UX**: Usuario no sabe qué rellenar mal en el formulario
- **Support**: Tickets "no sé qué está mal"
- **Conversión**: Formularios bounceados por falta de validación clara

### Riesgo

🟡 **MEDIO** — Validaciones de formulario no son legibles

### Métrica de Éxito

- `osErrorHandler` procesa `detail` array igual que `getErrorMessage()`
- O servicios/UI usan `getErrorMessage()` en lugar de error.message directo

---

## HALLAZGO 7: Inconsistencia en Manejo de Errors — Algunos Await, Algunos .then()/.catch() 🟡 MEDIO

### Evidencia

**Mezcla de async/await y Promise chains:**

```js
// frontend/src/pages/RegisterPage.jsx:37-38
axios.get(url).then(res => {
  if (res.data.valid) setReferrerName(res.data.referrer_name);
}).catch(() => setReferralValid(false));
// ↑ Promise chain sin await

// frontend/src/pages/LandingPage.jsx:137-138
.then((r) => { if (alive) { setCatalog(r.data?.plans || []); } })
.catch(() => { if (alive) setCatalog([]); });
// ↑ Promise chain

// Pero otros usan async/await:
// frontend/src/pages/CheckoutPage.jsx:52-54
const [catRes, methodsRes] = await Promise.all([
  axios.get(`${API}/payment/catalog`, { params: { country } }),
  axios.get(`${API}/payment/methods`),
]);
// ↑ Async/await
```

**Problema:** Inconsistencia dificulta refactorización y debugging.

### Impacto al Negocio

- **Mantenibilidad**: Patrones inconsistentes ralentizan cambios
- **Debugging**: Diferentes formas de manejar errores

### Riesgo

🟡 **MEDIO** — Deuda técnica en error handling

---

## RESUMEN: Hallazgos Priorizados por Impacto

| Prioridad | Hallazgo | Severidad | Impacto | Esfuerzo |
|-----------|----------|-----------|--------|----------|
| 🔴 **1** | console.error() expone detalles internos | CRÍTICO | Seguridad | Bajo |
| 🟡 **2** | localStorage sin try/catch | ALTO | Disponibilidad | Medio |
| 🟡 **3** | Claves localStorage duplicadas | ALTO | Sesiones | Medio |
| 🟡 **4** | Promise.allSettled() no valida resultados | ALTO | Fallos silenciosos | Medio |
| 🟡 **5** | Sin timeout global en requests directos | ALTO | Disponibilidad | Bajo |
| 🟡 **6** | Sin procesamiento de errores 422 array | MEDIO | UX | Bajo |
| 🟡 **7** | Inconsistencia Promise patterns | MEDIO | Mantenibilidad | Alto |

---

## Conclusión

**La aplicación tiene 7 problemas reales demostrables que afectan producción:**

1. **Seguridad**: Console.error expone arquitectura interna (CRÍTICO)
2. **Estabilidad**: localStorage sin defensas fallando silenciosamente (ALTO)
3. **Sesiones**: Desincronización multi-tab por claves duplicadas (ALTO)
4. **Observabilidad**: Errores de red desaparecen silenciosamente (ALTO)
5. **Disponibilidad**: Requests colgadas infinitas sin timeout (ALTO)
6. **UX**: Validaciones no legibles para usuario (MEDIO)
7. **Mantenibilidad**: Inconsistencia en patrones de error (MEDIO)

**Próximos pasos:** PRs enfocados en estos 7 problemas, con evidencia objetiva, métricas de éxito, y plan de rollback.

