/**
 * Error Handler para el OS de Punto Cero.
 * Normaliza y enriquece errores HTTP con contexto de dominio.
 * Preserva stack, cause, response, request, status.
 * Siempre relanza el error; nunca lo oculta.
 */

/**
 * Clasificación de errores HTTP.
 * Permite que consumidores tomen decisiones sin inspeccionar statusCode.
 */
export const ErrorKind = {
  NOT_FOUND: 'not_found',           // 404
  CONFLICT: 'conflict',             // 409
  VALIDATION: 'validation',         // 422
  UNAUTHORIZED: 'unauthorized',     // 401
  FORBIDDEN: 'forbidden',           // 403
  SERVER_ERROR: 'server_error',     // 5xx
  NETWORK_ERROR: 'network_error',   // Sin respuesta, timeout, CORS, etc.
};

/**
 * Error de dominio: enriquece un error HTTP con contexto operacional.
 * Mantiene compatibilidad: sigue siendo un Error, sigue siendo lanazable y catcheable.
 */
export class OSError extends Error {
  constructor({
    kind = ErrorKind.NETWORK_ERROR,
    statusCode,
    service,
    operation,
    resourceId,
    resourceType,
    userMessage,
    details,
    originalError,
  } = {}) {
    super(userMessage || `Error: ${service}.${operation}`);
    this.name = 'OSError';
    this.kind = kind;
    this.statusCode = statusCode;
    this.service = service;
    this.operation = operation;
    this.resourceId = resourceId;
    this.resourceType = resourceType;
    this.details = details;
    this.originalError = originalError;

    // Preserva stack trace original si existe
    if (originalError?.stack) {
      this.stack = originalError.stack;
    }

    // Preserva causa si existe (Error.cause)
    if (originalError?.cause) {
      this.cause = originalError.cause;
    }

    // Preserva response y request de Axios si existen
    if (originalError?.response) {
      this.response = originalError.response;
    }
    if (originalError?.request) {
      this.request = originalError.request;
    }
    if (originalError?.config) {
      this.config = originalError.config;
    }

    // Preserva código de Axios si existe
    if (originalError?.code) {
      this.code = originalError.code;
    }
  }

  isNotFound() {
    return this.kind === ErrorKind.NOT_FOUND;
  }

  isConflict() {
    return this.kind === ErrorKind.CONFLICT;
  }

  isValidation() {
    return this.kind === ErrorKind.VALIDATION;
  }

  isUnauthorized() {
    return this.kind === ErrorKind.UNAUTHORIZED;
  }

  isForbidden() {
    return this.kind === ErrorKind.FORBIDDEN;
  }

  isServerError() {
    return this.kind === ErrorKind.SERVER_ERROR;
  }

  isNetworkError() {
    return this.kind === ErrorKind.NETWORK_ERROR;
  }
}

/**
 * Normaliza cualquier error Axios → OSError.
 * Enriquece con contexto operacional.
 * Preserva todos los datos del error original.
 * Siempre lanza el error enriquecido; nunca lo oculta.
 *
 * @param {Error} axiosError - El error capturado (normalmente de Axios)
 * @param {Object} context - Contexto operacional { service, operation, resourceId, resourceType }
 * @returns {OSError} Error enriquecido con contexto y clasificación
 * @throws {OSError} Siempre (relanza el error enriquecido)
 */
export function normalizeHTTPError(axiosError, context = {}) {
  const { service = 'unknown', operation = 'unknown', resourceId, resourceType } = context;

  const statusCode = axiosError?.response?.status;
  const detail = axiosError?.response?.data?.detail;
  const responseData = axiosError?.response?.data;

  let kind = ErrorKind.NETWORK_ERROR;
  let userMessage = 'No se pudo conectar con el servidor.';

  // Clasificación por statusCode
  if (statusCode === 404) {
    kind = ErrorKind.NOT_FOUND;
    userMessage = detail || `${resourceType || 'El recurso'} no existe.`;
  } else if (statusCode === 409) {
    kind = ErrorKind.CONFLICT;
    userMessage = detail || 'El estado ha cambiado. Recargue e intente de nuevo.';
  } else if (statusCode === 422) {
    kind = ErrorKind.VALIDATION;
    userMessage = detail || 'Los datos no son válidos.';
  } else if (statusCode === 401) {
    kind = ErrorKind.UNAUTHORIZED;
    userMessage = detail || 'Su sesión ha expirado. Inicie sesión de nuevo.';
  } else if (statusCode === 403) {
    kind = ErrorKind.FORBIDDEN;
    userMessage = detail || 'No tiene permiso para hacer esto.';
  } else if (statusCode && statusCode >= 500) {
    kind = ErrorKind.SERVER_ERROR;
    userMessage = 'Error del servidor. Intente de nuevo en unos momentos.';
  }

  const osError = new OSError({
    kind,
    statusCode,
    service,
    operation,
    resourceId,
    resourceType,
    userMessage,
    details: responseData || { message: axiosError?.message },
    originalError: axiosError,
  });

  // Siempre relanza; nunca oculta el error
  throw osError;
}
