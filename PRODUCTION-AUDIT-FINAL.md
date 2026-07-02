# Auditoría de Producción — Hallazgos Basados en Evidencia

---

# Hallazgo 1: Acceso Directo a Token de localStorage sin Centralización

## Evidencia

**Archivo:** `frontend/src/modules/admin/pages/AutonomousControl.jsx`  
**Línea:** 36, 59, 72

```js
// Línea 36
const token = localStorage.getItem("pcl_token") || localStorage.getItem("access_token");

// Línea 59
const token = localStorage.getItem("pcl_token") || localStorage.getItem("access_token");

// Línea 72
const token = localStorage.getItem("pcl_token") || localStorage.getItem("access_token");
```

**Ubicación adicional:** 10+ módulos admin repiten exactamente el mismo patrón:
- `AICopilot.jsx:32`
- `AICommandCenter.jsx:18`
- `LegalOS.jsx:19`
- `FirmDashboard.jsx:37`
- `FinancialDashboard.jsx:27`
- `ExecutiveIntelligenceCenter.jsx:51`
- `GlobalNetwork.jsx:32`
- `SalesCommandCenter.jsx:30`
- `FirmsOverview.jsx:57`
- `PendingFirmsCenter.jsx:20`
- `FirmSolicitudesModule.jsx:64`

**Total:** 13+ archivos, ~20+ instancias del mismo acceso duplicado.

## Riesgo

- **Duplicación crítica:** Código idéntico en 13 módulos diferentes
- **Punto único de fallo:** Si AuthContext cambia la clave de token, todos estos módulos rompen silenciosamente
- **Sin sincronización:** El token en localStorage puede estar desactualizado si se actualiza por otro medio
- **Acceso no documentado:** No está claro que estos módulos dependan de AuthContext internamente

## Impacto Negocio

- **Autenticación frágil:** Si token es actualizado por AuthContext, estos módulos quedan con token stale
- **Deuda técnica:** Cambios futuros en AuthContext requieren actualizar 13 archivos
- **Riesgo de Security:** Si se necesita cambiar la estrategia de almacenamiento de token, impacta 13 módulos

## Severidad

**P1** — Punto crítico de fallo en autenticación. Duplicación extensiva del código de acceso a token.

## Alcance

- `AutonomousControl.jsx`
- `AICopilot.jsx`
- `AICommandCenter.jsx`
- `LegalOS.jsx`
- `FirmDashboard.jsx`
- `FinancialDashboard.jsx`
- `ExecutiveIntelligenceCenter.jsx`
- `GlobalNetwork.jsx`
- `SalesCommandCenter.jsx`
- `FirmsOverview.jsx`
- `PendingFirmsCenter.jsx`
- `FirmSolicitudesModule.jsx`

## Solución

Crear un helper centralizado `getAuthToken()` en AuthContext que exponga el token.  
Reemplazar todas las 20+ instancias de `localStorage.getItem("pcl_token")` con `getAuthToken()`.  
Esto crea un punto único de verdad.

## Riesgo Implementación

**Bajo** — Es solo centralizar acceso existente, sin cambios de lógica.

## Tiempo

~2-3 horas.

## Rollback

Remover el helper, restaurar localStorage directos. Simple.

---

# Hallazgo 2: axios Directo sin apiClient — Headers Inconsistentes

## Evidencia

**Archivo:** `frontend/src/modules/admin/pages/AutonomousControl.jsx`  
**Línea:** 40-41

```js
const [loopRes, orchestraRes] = await Promise.allSettled([
  axios.get(`${API}/autonomous/loop-status`, { headers }),
  axios.get(`${API}/autonomous/global-orchestrator`, { headers }),
]);
```

**Patrón adicional:** Está en 25+ archivos, usando `axios` directo en lugar de `apiClient`:

```
SalesCommandCenter.jsx:34 — axios.get(..., { headers })
AutonomousControl.jsx:40 — axios.get(..., { headers })
ExecutiveIntelligenceCenter.jsx:62 — axios.get(..., { headers })
LegalOS.jsx:22 — axios.get(..., { headers })
[... más de 20 instancias ...]
```

**Contraste con apiClient (CORRECTO):**

```js
// frontend/src/config/api/apiClient.js:17-36
export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: TIMEOUT,  // ← 20 segundos, configurado globalmente
  headers: DEFAULT_HEADERS,
});

apiClient.interceptors.request.use((config) => {
  config.headers = config.headers || {};
  const auth = axios.defaults.headers.common?.["Authorization"];
  if (auth && !config.headers.Authorization) {
    config.headers.Authorization = auth;  // ← Propagación centralizada
  }
  const tenantHeaders = getTenantHeaders();
  Object.entries(tenantHeaders).forEach(([k, v]) => {
    if (v) config.headers[k] = v;
  });
  return config;
});
```

## Riesgo

- **Sin timeout:** `axios` directo no tiene timeout, `apiClient` sí (20s)
- **Sin interceptores:** Headers de tenant NO se añaden automáticamente
- **Sin sincronización:** Authorization header puede estar desincronizado
- **Inconsistencia:** Unos módulos usan `apiClient` (con timeout), otros `axios` direto (sin timeout)

## Impacto Negocio

- **Disponibilidad:** Requests cuelgan indefinidamente sin timeout
- **Aislamiento de tenant:** Headers multi-tenant NO se propagan en módulos admin
- **Inconsistencia:** Algunos endpoints responden con timeout, otros se cuelgan

## Severidad

**P1** — Falta de timeouts y headers de tenant en 25+ llamadas HTTP.

## Alcance

25+ módulos/componentes usando `axios.get/post/put/patch/delete` directo en lugar de `apiClient`.

## Solución

Reemplazar todas las `axios.*()` directas con `apiClient.*()`.  
Remover los headers manuales (ahora se aplican por interceptor).

## Riesgo Implementación

**Bajo** — Es sustituir axios por apiClient, ambos tienen la misma interfaz.

## Tiempo

~2-3 horas.

## Rollback

Revertir a `axios` directo. Simple.

---

# Hallazgo 3: localStorage.getItem Sin Try/Catch en Panel Autonomous

## Evidencia

**Archivo:** `frontend/src/modules/admin/pages/AutonomousControl.jsx`  
**Línea:** 36, 59, 72

```js
// Línea 36 — SIN protección
const token = localStorage.getItem("pcl_token") || localStorage.getItem("access_token");
```

Este específico NO tiene try/catch (aunque CaseContext y AIPage ahora sí lo tienen desde PR-06.1).

## Riesgo

En Private Mode, `localStorage.getItem()` lanza `SecurityError`, el módulo falla.

## Impacto Negocio

AutonomousControl no se carga en navegadores privados.

## Severidad

**P2** — Similar a PR-06.1, pero el patrón ya está parcialmente resuelto.

## Alcance

`AutonomousControl.jsx` (ya casi resuelto por PR-06.1 en otros módulos).

## Solución

Envolver en try/catch, fallback a null.

## Riesgo Implementación

**Muy Bajo** — Mismo patrón que PR-06.1.

## Tiempo

~20 minutos.

## Rollback

Remover try/catch. Simple.

---

# TABLA FINAL: Problemas Priorizados por Impacto

| Prioridad | Problema | Evidencia | Riesgo | Beneficio | Tiempo |
|-----------|----------|-----------|--------|-----------|--------|
| P1 | Token localStorage accedido 20+ veces sin centralización | `AutonomousControl.jsx:36`, `AICopilot.jsx:32`, +11 más | Alto | Punto único de verdad para token | 2-3h |
| P1 | axios directo en 25+ módulos, sin timeout/interceptores | `AutonomousControl.jsx:40`, `SalesCommandCenter.jsx:34`, +23 más | Alto | Timeouts + tenant headers uniformes | 2-3h |
| P2 | localStorage.getItem sin try/catch en AutonomousControl | `AutonomousControl.jsx:36, 59, 72` | Medio | Robustez en navegadores privados | 20min |

---

# CONCLUSIÓN

**Existe exactamente un candidato para el siguiente PR de fortalecimiento.**

El problema P1 (Token duplicado en 13 módulos) requiere consolidación de acceso. Este es un punto crítico de fallo en autenticación que afecta toda la capa admin.

El problema P1 (axios directo en 25+ módulos) falta timeouts y headers de tenant. Este afecta todos los requests HTTP no centralizados.

**Ambos son P1 y deben ser tratados en un único PR de consolidación de HTTP/Auth** que:
1. Centraliza acceso a token via AuthContext
2. Reemplaza todos los `axios` directo con `apiClient`

Esto elimina duplicación, introduce timeouts globales, y asegura headers de tenant en todo el admin.

