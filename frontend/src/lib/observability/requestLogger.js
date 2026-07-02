/**
 * Request Logger Core
 *
 * Punto centralizado para instrumentar y registrar:
 * - Requests HTTP (inicio, fin, duración)
 * - Errores (captura estructurada)
 * - Contexto (usuario, tenant, correlación)
 *
 * Sin cambios en comportamiento funcional.
 * Solo visibilidad y medición.
 */

import { eventStore } from './eventStore';
import { errorAggregator } from './errorAggregator';
import { normalizeError } from './errorNormalizer';

class RequestLogger {
  constructor() {
    this.context = {
      userId: null,
      tenantId: null,
      organizationId: null,
    };
    this.activeRequests = new Map(); // requestId → metadata
  }

  /**
   * Registrar inicio de request
   * Llamado ANTES de enviar request
   */
  startRequest(config) {
    const requestId = config.requestId; // Generado por interceptor
    const startTime = performance.now();

    this.activeRequests.set(requestId, {
      requestId,
      method: config.method?.toUpperCase(),
      url: config.url,
      startTime,
      timestamp: new Date().toISOString(),
      userId: this.context.userId,
      tenantId: this.context.tenantId,
    });

    return { requestId, startTime };
  }

  /**
   * Registrar fin de request (éxito)
   * Llamado en response interceptor
   */
  endRequest(requestId, response, duration) {
    const metadata = this.activeRequests.get(requestId) || {};

    const log = {
      requestId,
      method: metadata.method,
      url: metadata.url,
      status: response?.status,
      statusText: response?.statusText,
      duration, // ms
      success: true,
      timestamp: new Date().toISOString(),
      userId: this.context.userId,
      tenantId: this.context.tenantId,
      type: 'request:success',
    };

    eventStore.push(log);
    this.activeRequests.delete(requestId);

    return log;
  }

  /**
   * Registrar error de request
   * Llamado en error interceptor
   */
  logError(requestId, error, duration) {
    const metadata = this.activeRequests.get(requestId) || {};

    // Normalizar error con clasificación inteligente
    const normalizedError = normalizeError(error, {
      requestId,
      userId: this.context.userId,
      tenantId: this.context.tenantId,
    });

    // Agregar para análisis de patrones
    errorAggregator.track(normalizedError);

    const log = {
      requestId,
      method: metadata.method,
      url: metadata.url,
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      duration, // ms
      success: false,
      errorType: normalizedError.type,
      errorSeverity: normalizedError.severity,
      errorMessage: normalizedError.message,
      errorCode: error?.code,
      isRetryable: normalizedError.isRetryable,
      userFriendlyMessage: normalizedError.userFriendlyMessage,
      timestamp: new Date().toISOString(),
      userId: this.context.userId,
      tenantId: this.context.tenantId,
      type: 'request:error',
    };

    eventStore.push(log);
    this.activeRequests.delete(requestId);

    return log;
  }

  /**
   * Registrar error global (fuera de request)
   */
  logGlobalError(error, context = {}) {
    const log = {
      requestId: context.requestId,
      errorMessage: error?.message || String(error),
      errorStack: error?.stack,
      timestamp: new Date().toISOString(),
      userId: this.context.userId,
      tenantId: this.context.tenantId,
      type: 'error:global',
      context,
    };

    eventStore.push(log);
    return log;
  }

  /**
   * Adjuntar contexto de usuario y tenant
   * Llamado desde AuthContext después de login
   */
  attachContext({ userId, tenantId, organizationId }) {
    this.context = {
      userId: userId || null,
      tenantId: tenantId || null,
      organizationId: organizationId || null,
    };
  }

  /**
   * Limpiar contexto (logout)
   */
  clearContext() {
    this.context = {
      userId: null,
      tenantId: null,
      organizationId: null,
    };
  }

  /**
   * Obtener estadísticas de requests activos
   */
  getStats() {
    return {
      activeRequests: this.activeRequests.size,
      totalLogged: eventStore.getEventCount(),
      errorStats: errorAggregator.getStats(),
      context: this.context,
    };
  }
}

// Singleton global
export const requestLogger = new RequestLogger();

export default requestLogger;
