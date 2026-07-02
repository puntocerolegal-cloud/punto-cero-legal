// Cliente HTTP centralizado de Punto Cero OS.
// Reutiliza la URL base ya centralizada en src/config/api.js (con guard
// anti-localhost) y añade timeout/headers comunes. Punto único de verdad para
// todas las llamadas HTTP. Todos los módulos DEBEN usar este cliente, nunca
// axios directo.
//
// Incluye observabilidad:
// - correlation IDs por request (X-Request-ID)
// - request/response logging
// - duration tracking
// - error capturing
import axios from "axios";
import { API } from "@/config/api";
import { getTenantHeaders } from "@/security/tenantStorage";
import { getAuthToken } from "@/lib/auth/getAuthToken";
import { requestLogger } from "@/lib/observability/requestLogger";

export const BASE_URL = API; // `${API_URL}/api`
export const TIMEOUT = 20000;

export const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json",
};

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: TIMEOUT,
  headers: DEFAULT_HEADERS,
});

// REQUEST INTERCEPTOR: Adjuntar Authorization + Headers de Tenant + Observabilidad
// Este interceptor se ejecuta ANTES de cada request y centraliza:
// 1. Token desde fuente única (getAuthToken)
// 2. Headers de tenant (multi-tenant isolation)
// 3. X-Request-ID para correlación y tracing
// 4. Logging de inicio de request
// 5. Timeout ya está en el create() arriba
apiClient.interceptors.request.use((config) => {
  config.headers = config.headers || {};

  // 1. Generar y adjuntar requestId (correlation ID)
  const requestId = config.headers['X-Request-ID'] || crypto.randomUUID();
  config.headers['X-Request-ID'] = requestId;
  config.requestId = requestId; // Guardar en config para usar en response

  // 2. Obtener token desde fuente centralizada
  const token = getAuthToken();
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // 3. Propagar headers de tenant (X-Tenant-ID / X-Organization-ID)
  const tenantHeaders = getTenantHeaders();
  Object.entries(tenantHeaders).forEach(([k, v]) => {
    if (v) config.headers[k] = v;
  });

  // 4. Log de inicio de request (observabilidad)
  requestLogger.startRequest(config);

  return config;
});

// RESPONSE INTERCEPTOR: Capturar respuestas + errores + logging
// Captura TANTO éxito como error para observabilidad completa
apiClient.interceptors.response.use(
  (response) => {
    // Log de respuesta exitosa
    const requestId = response.config?.requestId;
    const startTime = response.config?._startTime;
    if (requestId && startTime) {
      const duration = performance.now() - startTime;
      requestLogger.endRequest(requestId, response, duration);
    }
    return response;
  },
  (error) => {
    // Log de error
    const requestId = error.config?.requestId;
    const startTime = error.config?._startTime;
    if (requestId && startTime) {
      const duration = performance.now() - startTime;
      requestLogger.logError(requestId, error, duration);
    }

    // Propagar el error como está; módulos consumidores manejarán
    // Ya existe normalización en osErrorHandler.js si se necesita
    return Promise.reject(error);
  }
);

// Guardar startTime en config durante request
apiClient.interceptors.request.use((config) => {
  config._startTime = performance.now();
  return config;
});

export default apiClient;
