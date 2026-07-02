/**
 * SecureErrorHandler — Secure Error Message Handling
 * Prevents exposure of backend internals to users
 */

/**
 * Get user-safe error message (never expose backend details)
 */
export function getSecureErrorMessage(error, isDevelopment = false) {
  // Development mode: show everything
  if (isDevelopment && process.env.NODE_ENV === 'development') {
    return {
      message: error?.response?.data?.detail || error?.message || 'An error occurred',
      details: {
        code: error?.code,
        status: error?.response?.status,
        backend: error?.response?.data,
      },
      isDev: true,
    };
  }

  // Production: sanitized message only
  const code = error?.response?.status || error?.code;
  const userMessage = getLocalizedErrorMessage(code, error);

  return {
    message: userMessage,
    details: null,
    code,
    isDev: false,
  };
}

/**
 * Get localized, safe error message by error code
 */
export function getLocalizedErrorMessage(code, error = {}) {
  const messages = {
    // HTTP errors
    400: 'Invalid request. Please check your input.',
    401: 'Your session has expired. Please log in again.',
    403: 'You do not have permission to perform this action.',
    404: 'The requested resource was not found.',
    409: 'This action conflicts with existing data. Please try again.',
    422: 'Invalid data provided. Please check your input.',
    429: 'Too many requests. Please wait a moment and try again.',
    500: 'A server error occurred. Please try again later.',
    502: 'Service temporarily unavailable. Please try again later.',
    503: 'Service maintenance in progress. Please try again later.',

    // Network errors
    'NETWORK_ERROR': 'Network error. Please check your connection.',
    'TIMEOUT_ERROR': 'Request timeout. Please try again.',
    'CANCELLED_ERROR': 'Request was cancelled.',

    // Custom errors
    'VALIDATION_ERROR': 'Invalid input. Please check your data.',
    'AUTHENTICATION_FAILED': 'Login failed. Please try again with correct credentials.',
    'PERMISSION_DENIED': 'You do not have permission to perform this action.',
    'SESSION_EXPIRED': 'Your session has expired. Please log in again.',
    'TOKEN_INVALID': 'Authentication token is invalid. Please log in again.',
    'DATA_CORRUPTION': 'Data integrity issue detected. Please refresh the page.',
    'UNKNOWN_ERROR': 'An unexpected error occurred. Please try again.',
  };

  return messages[code] || messages['UNKNOWN_ERROR'];
}

/**
 * Safe error parser for API responses
 */
export function parseApiError(error) {
  if (!error) {
    return {
      code: 'UNKNOWN_ERROR',
      message: getLocalizedErrorMessage('UNKNOWN_ERROR'),
      details: null,
    };
  }

  // Axios error
  if (error.response) {
    const status = error.response.status;
    return {
      code: `HTTP_${status}`,
      message: getLocalizedErrorMessage(status),
      status,
      details: null,
    };
  }

  // Network error
  if (error.code === 'ECONNABORTED') {
    return {
      code: 'TIMEOUT_ERROR',
      message: getLocalizedErrorMessage('TIMEOUT_ERROR'),
      details: null,
    };
  }

  // Request made but no response
  if (error.request && !error.response) {
    return {
      code: 'NETWORK_ERROR',
      message: getLocalizedErrorMessage('NETWORK_ERROR'),
      details: null,
    };
  }

  // Default
  return {
    code: error.code || 'UNKNOWN_ERROR',
    message: getLocalizedErrorMessage(error.code || 'UNKNOWN_ERROR'),
    details: null,
  };
}

/**
 * Check if error is recoverable
 */
export function isRecoverableError(error) {
  const code = error?.response?.status || error?.code;

  // Recoverable errors
  const recoverable = [429, 503, 'NETWORK_ERROR', 'TIMEOUT_ERROR'];
  return recoverable.includes(code);
}

/**
 * Format error for console logging (dev only)
 */
export function logErrorForDev(error, context = '') {
  if (process.env.NODE_ENV === 'development') {
    console.error(
      `[ERROR] ${context}`,
      {
        code: error?.code,
        status: error?.response?.status,
        message: error?.message,
        details: error?.response?.data,
      }
    );
  }
}

/**
 * Error boundary handler
 */
export function handleErrorBoundary(error, errorInfo) {
  logErrorForDev(error, 'Error Boundary');

  return {
    title: 'Something went wrong',
    message: 'An unexpected error occurred. Please refresh the page.',
    isDev: process.env.NODE_ENV === 'development',
    devMessage: error?.message,
  };
}

/**
 * Validation error formatter
 */
export function formatValidationError(field, rule) {
  const messages = {
    'required': `${field} is required`,
    'minLength': `${field} is too short`,
    'maxLength': `${field} is too long`,
    'pattern': `${field} format is invalid`,
    'email': `${field} must be a valid email`,
    'url': `${field} must be a valid URL`,
    'match': `${field} does not match`,
  };

  return messages[rule] || `${field} is invalid`;
}
