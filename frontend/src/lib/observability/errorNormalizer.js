/**
 * Error Normalizer
 *
 * Convierte cualquier tipo de error (Axios, OSError, Error nativo, etc.)
 * en una estructura estándar y enriquecida para observabilidad.
 */

import ErrorClassifier from './errorClassifier';

/**
 * Normalizar un error crudo a estructura estándar
 */
export function normalizeError(error, context = {}) {
  const type = ErrorClassifier.classify(error);
  const severity = ErrorClassifier.getSeverity(type);
  const isRetryable = ErrorClassifier.isRetryable(type);
  const endpoint = ErrorClassifier.getEndpoint(error);
  const status = ErrorClassifier.getStatus(error);
  const userFriendlyMessage = ErrorClassifier.getUserFriendlyMessage(type);
  const fingerprint = ErrorClassifier.getFingerprint(error);

  return {
    // Identificación
    id: context.requestId || generateErrorId(),
    type,
    severity,
    fingerprint, // Para agrupación

    // Detalles técnicos
    message: error?.message || String(error),
    code: error?.code,
    endpoint,
    status,
    statusText: error?.response?.statusText,

    // Decisiones de reintento
    isRetryable,
    retryAfter: extractRetryAfter(error),

    // Mensajería
    userFriendlyMessage,
    developerMessage: error?.response?.data?.detail || error?.message,

    // Contexto operacional
    userId: context.userId,
    tenantId: context.tenantId,
    timestamp: new Date().toISOString(),

    // Datos crudos (para debugging)
    rawError: {
      message: error?.message,
      stack: error?.stack,
      axiosData: error?.response?.data,
      axiosHeaders: error?.response?.headers,
    },
  };
}

/**
 * Extraer tiempo de reintento sugerido (si está disponible)
 */
function extractRetryAfter(error) {
  // Buscar header Retry-After (429)
  const retryAfter = error?.response?.headers?.['retry-after'];
  if (retryAfter) {
    const seconds = parseInt(retryAfter, 10);
    if (!isNaN(seconds)) {
      return seconds * 1000; // Convertir a ms
    }
  }

  // Backoff exponencial por defecto para ciertos errores
  if (error?.response?.status === 429) {
    return 5000; // 5 segundos
  }
  if (error?.response?.status >= 500) {
    return 2000; // 2 segundos
  }

  return null;
}

/**
 * Generar ID único para este error
 */
function generateErrorId() {
  return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Extraer mensaje principal de error
 */
export function getMainErrorMessage(error) {
  if (typeof error === 'string') return error;
  if (error?.response?.data?.detail) return error.response.data.detail;
  if (error?.message) return error.message;
  return 'Unknown error';
}

/**
 * Determinar si dos errores son "equivalentes" (misma causa raíz)
 */
export function areErrorsEquivalent(err1, err2) {
  if (!err1 || !err2) return false;

  const fingerprint1 = ErrorClassifier.getFingerprint(err1);
  const fingerprint2 = ErrorClassifier.getFingerprint(err2);

  return fingerprint1 === fingerprint2;
}

export default normalizeError;
