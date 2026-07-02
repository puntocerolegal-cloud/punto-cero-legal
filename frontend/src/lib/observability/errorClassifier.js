/**
 * Error Classifier
 *
 * Sistema inteligente para clasificar errores en categorías significativas.
 * Basado en HTTP status, mensaje, endpoint, y forma de respuesta.
 *
 * Convierte errores crudos en categorías que permiten:
 * - Análisis de patrones
 * - Agrupación de problemas similares
 * - Decisiones de reintento
 * - Mensajes amigables al usuario
 */

export const ErrorType = {
  NETWORK_ERROR: 'network_error',      // Sin conexión, CORS, timeout
  AUTH_ERROR: 'auth_error',            // 401, 403, token inválido
  VALIDATION_ERROR: 'validation_error', // 422, datos inválidos
  NOT_FOUND_ERROR: 'not_found_error',   // 404, recurso no existe
  CONFLICT_ERROR: 'conflict_error',     // 409, estado conflictivo
  SERVER_ERROR: 'server_error',         // 5xx, error del backend
  RATE_LIMIT_ERROR: 'rate_limit_error', // 429, demasiadas solicitudes
  UNKNOWN_ERROR: 'unknown_error',       // No clasificable
};

export const ErrorSeverity = {
  CRITICAL: 'critical',     // Detiene flujo de usuario
  HIGH: 'high',            // Interfiere con funcionalidad
  MEDIUM: 'medium',        // Reducción de funcionalidad
  LOW: 'low',              // Información/advertencia
};

/**
 * Clasificador de errores
 */
export class ErrorClassifier {
  /**
   * Clasificar un error crudo
   */
  static classify(error) {
    const status = error?.response?.status;
    const message = error?.message || '';
    const code = error?.code || '';
    const data = error?.response?.data || {};

    // Por status HTTP
    if (status === 401 || status === 403) {
      return this._classifyAuthError(error);
    }
    if (status === 404) {
      return ErrorType.NOT_FOUND_ERROR;
    }
    if (status === 409) {
      return ErrorType.CONFLICT_ERROR;
    }
    if (status === 422) {
      return ErrorType.VALIDATION_ERROR;
    }
    if (status === 429) {
      return ErrorType.RATE_LIMIT_ERROR;
    }
    if (status && status >= 500) {
      return ErrorType.SERVER_ERROR;
    }

    // Por código de error
    if (code === 'ECONNABORTED' || code === 'ETIMEDOUT') {
      return ErrorType.NETWORK_ERROR;
    }
    if (code === 'ERR_NETWORK' || code === 'ERR_BAD_REQUEST') {
      if (message.includes('timeout') || message.includes('timeout')) {
        return ErrorType.NETWORK_ERROR;
      }
    }

    // Por mensaje
    if (message.includes('timeout') || message.includes('Timeout')) {
      return ErrorType.NETWORK_ERROR;
    }
    if (message.includes('CORS') || message.includes('cors')) {
      return ErrorType.NETWORK_ERROR;
    }
    if (message.includes('Network') || message.includes('network')) {
      return ErrorType.NETWORK_ERROR;
    }

    // Default
    return ErrorType.UNKNOWN_ERROR;
  }

  /**
   * Clasificar error de autenticación
   */
  static _classifyAuthError(error) {
    const status = error?.response?.status;
    if (status === 401) {
      // Token inválido, expirado
      return ErrorType.AUTH_ERROR;
    }
    if (status === 403) {
      // Sin permiso
      return ErrorType.AUTH_ERROR;
    }
    return ErrorType.AUTH_ERROR;
  }

  /**
   * Determinar severidad del error
   */
  static getSeverity(errorType) {
    switch (errorType) {
      case ErrorType.AUTH_ERROR:
      case ErrorType.SERVER_ERROR:
        return ErrorSeverity.CRITICAL;

      case ErrorType.VALIDATION_ERROR:
      case ErrorType.CONFLICT_ERROR:
        return ErrorSeverity.HIGH;

      case ErrorType.NETWORK_ERROR:
      case ErrorType.TIMEOUT_ERROR:
      case ErrorType.RATE_LIMIT_ERROR:
        return ErrorSeverity.MEDIUM;

      case ErrorType.NOT_FOUND_ERROR:
        return ErrorSeverity.LOW;

      default:
        return ErrorSeverity.MEDIUM;
    }
  }

  /**
   * Determinar si un error es reintentable
   */
  static isRetryable(errorType) {
    // Errores que sí se pueden reintentar
    const retryableTypes = [
      ErrorType.NETWORK_ERROR,
      ErrorType.TIMEOUT_ERROR,
      ErrorType.RATE_LIMIT_ERROR,
      ErrorType.SERVER_ERROR, // Con backoff exponencial
    ];
    return retryableTypes.includes(errorType);
  }

  /**
   * Obtener mensaje amigable para usuario
   */
  static getUserFriendlyMessage(errorType) {
    const messages = {
      [ErrorType.NETWORK_ERROR]:
        'No se pudo conectar con el servidor. Verifique su conexión.',
      [ErrorType.AUTH_ERROR]:
        'Su sesión ha expirado. Por favor inicie sesión nuevamente.',
      [ErrorType.VALIDATION_ERROR]:
        'Los datos ingresados no son válidos. Verifique los campos.',
      [ErrorType.NOT_FOUND_ERROR]:
        'El recurso solicitado no existe.',
      [ErrorType.CONFLICT_ERROR]:
        'El estado ha cambiado. Recargue e intente nuevamente.',
      [ErrorType.SERVER_ERROR]:
        'Error del servidor. Intente de nuevo en unos momentos.',
      [ErrorType.RATE_LIMIT_ERROR]:
        'Ha hecho demasiadas solicitudes. Espere un momento.',
      [ErrorType.UNKNOWN_ERROR]:
        'Ocurrió un error. Intente de nuevo.',
    };
    return messages[errorType] || messages[ErrorType.UNKNOWN_ERROR];
  }

  /**
   * Extraer endpoint del error
   */
  static getEndpoint(error) {
    return error?.config?.url || error?.response?.config?.url || 'unknown';
  }

  /**
   * Extraer status HTTP
   */
  static getStatus(error) {
    return error?.response?.status || null;
  }

  /**
   * Crear fingerprint para agrupación (endpoint + status + tipo)
   */
  static getFingerprint(error) {
    const endpoint = this.getEndpoint(error);
    const status = this.getStatus(error);
    const type = this.classify(error);
    return `${endpoint}:${status}:${type}`;
  }
}

export default ErrorClassifier;
