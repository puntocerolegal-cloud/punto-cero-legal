# Sistema de Inteligencia de Errores — Implementación Completa

## OBJETIVO LOGRADO

Construir una capa inteligente que:
- Clasifique errores en categorías significativas
- Agrupe errores similares para detectar patrones
- Proporcione mensajes amigables al usuario
- Identifique endpoints problemáticos
- Sugiera reintentos cuando es apropiado

**Sin cambios en comportamiento funcional. Solo análisis.**

---

## COMPONENTES CREADOS

### 1. Error Classifier (197 líneas)

**Archivo:** `frontend/src/lib/observability/errorClassifier.js`

**Categorías de error:**
```
NETWORK_ERROR       → Sin conexión, CORS, timeout
AUTH_ERROR          → 401, 403, token inválido
VALIDATION_ERROR    → 422, datos inválidos
NOT_FOUND_ERROR     → 404, recurso no existe
CONFLICT_ERROR      → 409, estado conflictivo
SERVER_ERROR        → 5xx, error del backend
RATE_LIMIT_ERROR    → 429, demasiadas solicitudes
UNKNOWN_ERROR       → No clasificable
```

**Niveles de severidad:**
```
CRITICAL            → Detiene flujo de usuario
HIGH                → Interfiere con funcionalidad
MEDIUM              → Reducción de funcionalidad
LOW                 → Información/advertencia
```

**Funciones principais:**
```js
ErrorClassifier.classify(error)           // Obtener tipo de error
ErrorClassifier.getSeverity(type)         // Obtener severidad
ErrorClassifier.isRetryable(type)         // ¿Se puede reintentar?
ErrorClassifier.getUserFriendlyMessage(type)  // Mensaje para usuario
ErrorClassifier.getFingerprint(error)     // Hash para agrupación
```

---

### 2. Error Normalizer (113 líneas)

**Archivo:** `frontend/src/lib/observability/errorNormalizer.js`

**Estructura estándar:**
```js
{
  id: "err_1719767353000_abc123",
  type: "validation_error",
  severity: "high",
  fingerprint: "/api/subscriptions:422:validation_error",

  // Detalles técnicos
  message: "Request failed with status code 422",
  code: "ERR_BAD_REQUEST",
  endpoint: "/api/subscriptions",
  status: 422,
  statusText: "Unprocessable Entity",

  // Decisiones de reintento
  isRetryable: false,
  retryAfter: null,

  // Mensajería
  userFriendlyMessage: "Los datos ingresados no son válidos. Verifique los campos.",
  developerMessage: "Email field is required",

  // Contexto
  userId: "lawyer-001",
  tenantId: "firm-456",
  timestamp: "2026-06-30T14:22:33.456Z",

  // Datos crudos para debugging
  rawError: {
    message: "...",
    stack: "...",
    axiosData: {...},
    axiosHeaders: {...}
  }
}
```

**Funciones principais:**
```js
normalizeError(error, context)     // Normalizar error crudo
getMainErrorMessage(error)         // Extraer mensaje principal
areErrorsEquivalent(err1, err2)    // Comparar errores
```

---

### 3. Error Aggregator (179 líneas)

**Archivo:** `frontend/src/lib/observability/errorAggregator.js`

**Agrupación automática:**
```
Agrupa por: endpoint + status + tipo
├── /api/subscriptions:422:validation_error
│   ├── count: 7
│   ├── first: 2026-06-30T14:10:00Z
│   ├── last: 2026-06-30T14:22:33Z
│   └── errors: [{...}, {...}, ...]
└── /api/billing:500:server_error
    ├── count: 3
    ├── first: 2026-06-30T14:15:00Z
    ├── last: 2026-06-30T14:20:00Z
    └── errors: [{...}, {...}, ...]
```

**Funciones principales:**
```js
errorAggregator.track(normalizedError)     // Registrar error
errorAggregator.getGroups()               // Obtener todos los grupos
errorAggregator.getRepeatedErrors()       // Errores > 3 veces/hora
errorAggregator.getProblematicEndpoints()  // Endpoints problemáticos
errorAggregator.getStats()                // Estadísticas generales
```

---

## EJEMPLO: FLUJO COMPLETO DE ERROR

### Escenario: Validación fallida en formulario de suscripción

```js
// 1. Usuario intenta crear suscripción sin email
await apiClient.post('/api/subscriptions/', { name: 'Plan A' });

// 2. Backend responde 422
// {
//   status: 422,
//   data: {
//     detail: "Email field is required"
//   }
// }

// 3. apiClient error interceptor captura
requestLogger.logError(requestId, axiosError, 245);

// 4. logError() normaliza automáticamente
const normalized = normalizeError(axiosError, {
  requestId: "550e8400-e29b-41d4-a716-446655440000",
  userId: "lawyer-001",
  tenantId: "firm-456"
});

// 5. Resultado normalizado
{
  id: "err_1719767353000_abc123",
  type: "validation_error",
  severity: "high",
  fingerprint: "/api/subscriptions:422:validation_error",
  
  message: "Request failed with status code 422",
  endpoint: "/api/subscriptions",
  status: 422,
  
  isRetryable: false,
  retryAfter: null,
  
  userFriendlyMessage: "Los datos ingresados no son válidos. Verifique los campos.",
  developerMessage: "Email field is required",
  
  userId: "lawyer-001",
  tenantId: "firm-456",
  timestamp: "2026-06-30T14:22:33.456Z"
}

// 6. errorAggregator agrupa automáticamente
errorAggregator.track(normalized);

// Resultado en agregador:
{
  fingerprint: "/api/subscriptions:422:validation_error",
  count: 7,  // Fue visto 7 veces
  first: "2026-06-30T14:10:00Z",
  last: "2026-06-30T14:22:33Z",
  type: "validation_error",
  status: 422,
  endpoint: "/api/subscriptions",
  errors: [{...}, {...}, {...}]  // Últimos 10
}

// 7. Log almacenado en eventStore
eventStore.push({
  requestId: "550e8400-e29b-41d4-a716-446655440000",
  method: "POST",
  url: "/api/subscriptions",
  status: 422,
  duration: 245,
  success: false,
  
  errorType: "validation_error",
  errorSeverity: "high",
  isRetryable: false,
  userFriendlyMessage: "Los datos ingresados no son válidos. Verifique los campos.",
  
  timestamp: "2026-06-30T14:22:33.456Z",
  userId: "lawyer-001",
  tenantId: "firm-456"
});
```

---

## ACCESO DESDE DEVTOOLS

```js
// Ver errores clasificados
window.__PC_OBSERVABILITY__.getLatest(10);
// [{...}, {...}]  // Con type, severity, userFriendlyMessage

// Ver solo errores
window.__PC_OBSERVABILITY__.getErrors();
// [{...validation_error...}, {...server_error...}]

// Ver estadísticas completas
window.__PC_OBSERVABILITY__.getStats();
// {
//   totalErrorGroups: 5,
//   totalErrors: 18,
//   byType: {
//     validation_error: 7,
//     server_error: 5,
//     network_error: 6
//   },
//   repeatedErrors: [{endpoint, count, severity}],
//   problematicEndpoints: [{endpoint, count, severity}]
// }

// Ver errores repetidos (últimas 3 horas)
const stats = window.__PC_OBSERVABILITY__.getStats();
stats.repeatedErrors;
// [{
//   endpoint: "/api/subscriptions",
//   count: 7,
//   type: "validation_error",
//   severity: "high"
// }]

// Ver endpoints problemáticos
stats.problematicEndpoints;
// [{
//   endpoint: "/api/billing",
//   count: 12,
//   severity: "critical",
//   errors: [{type, status, timestamp}, ...]
// }]
```

---

## INTEGRACIÓN CON REQUESTLOGGER

El `logError()` ahora:

1. **Normaliza** el error con clasificación
2. **Agrega** el error a estadísticas
3. **Almacena** en eventStore con contexto enriquecido

```js
requestLogger.logError(requestId, axiosError, duration);
// ↓
// 1. normalizeError(axiosError, context)
//    ↓ type, severity, isRetryable, userFriendlyMessage
// 2. errorAggregator.track(normalized)
//    ↓ agrupación por fingerprint
// 3. eventStore.push(log)
//    ↓ almacenamiento con datos enriquecidos
```

---

## MÉTRICAS DE ÉXITO

| Métrica | Objetivo | Logrado |
|---------|----------|---------|
| **100% errores clasificados** | ✅ | ErrorClassifier → 8 tipos ✅ |
| **Agrupación de patrones** | ✅ | errorAggregator.getGroups() ✅ |
| **Detección de endpoints problemáticos** | ✅ | getProblematicEndpoints() ✅ |
| **Mensajes amigables al usuario** | ✅ | userFriendlyMessage ✅ |
| **Sugerencias de reintento** | ✅ | isRetryable + retryAfter ✅ |
| **Build exitoso** | ✅ | Compiled successfully ✅ |
| **Cero breaking changes** | ✅ | Completamente transparente ✅ |

---

## ARCHIVOS CREADOS/MODIFICADOS

**Nuevos:**
- `frontend/src/lib/observability/errorClassifier.js` (197 líneas)
- `frontend/src/lib/observability/errorNormalizer.js` (113 líneas)
- `frontend/src/lib/observability/errorAggregator.js` (179 líneas)

**Modificados:**
- `frontend/src/lib/observability/requestLogger.js` (+33 líneas, integración)

**Total:** +489 líneas de error intelligence, 0 líneas de business logic broken.

---

## BUILD STATS

```
Compiled successfully.

File sizes after gzip:

  509.57 kB (+1.72 kB)  build\static\js\main.c0f966ad.js
  19.8 kB (+9 B)        build\static\css\main.6fb37fc9.css
```

**Impacto:** +1.72 KB total (clasificación + agrupación + normalización).

---

## CASO DE USO: DEBUGGING EN PRODUCCIÓN

### Problema: "La API de suscripciones falla a veces"

```js
// Ejecutar en DevTools de usuario en producción
const stats = window.__PC_OBSERVABILITY__.getStats();

// Resultado: 7 intentos fallidos en últimas 2 horas
stats.errorStats.byType;
// { validation_error: 5, server_error: 2 }

// Ver cuál es el endpoint problemático
stats.errorStats.problematicEndpoints[0];
// {
//   endpoint: "/api/subscriptions",
//   count: 7,
//   severity: "high",
//   errors: [{type, status, timestamp}, ...]
// }

// Ver errores específicos
stats.errorStats.repeatedErrors[0];
// {
//   endpoint: "/api/subscriptions",
//   count: 5,
//   type: "validation_error",
//   ...
// }

// Enviar datos al soporte
JSON.stringify(stats.errorStats, null, 2);
// [Información clara y estructurada para debugging]
```

---

## PRÓXIMOS PASOS (FUTURO)

1. **Integración con Sentry/DataDog** — Auto-report de errores críticos
2. **Error recovery suggestions** — Proponer acciones al usuario
3. **Backend error correlation** — Enviar logs a análisis centralizado
4. **Machine learning** — Detectar anomalías automáticamente
5. **Alert thresholds** — Notificar cuando > 5% de requests fallan

---

## CONCLUSIÓN

✅ **SISTEMA DE INTELIGENCIA DE ERRORES COMPLETADO**

- **Clasificación**: 8 tipos de error + 4 niveles de severidad
- **Normalización**: Estructura estándar para todos los errores
- **Agrupación**: Detección automática de patrones y endpoints problemáticos
- **UX**: Mensajes amigables al usuario + sugerencias de reintento
- **Observabilidad**: Estadísticas + debugging desde DevTools
- **Impacto**: +1.72 KB, cero breaking changes

**La plataforma ahora puede entender y reportar sus errores de forma inteligente.**

