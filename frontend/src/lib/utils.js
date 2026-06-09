import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Etiquetas en español para los campos de los formularios (loc[last]).
const FIELD_LABELS = {
  name: 'Nombre',
  full_name: 'Nombre completo',
  email: 'Correo electrónico',
  password: 'Contraseña',
  phone: 'Teléfono',
  country: 'País',
  city: 'Ciudad',
  description: 'Descripción del caso',
  message: 'Mensaje',
  legal_area: 'Área legal',
  priority: 'Prioridad',
  specialty: 'Especialidad',
  experience: 'Experiencia',
  bar_number: 'Tarjeta profesional',
  id_document: 'Documento de identidad',
  firm_name: 'Nombre del bufete',
  role: 'Rol',
};

function fieldLabel(loc) {
  if (!Array.isArray(loc) || !loc.length) return '';
  // El primer elemento suele ser 'body'/'query'; tomamos el último relevante.
  const key = loc[loc.length - 1];
  if (typeof key !== 'string') return '';
  return FIELD_LABELS[key] || key;
}

/**
 * Traduce un único error de validación de Pydantic (v2) a español.
 * Mapea por `type` (estable) en lugar del `msg` en inglés.
 */
function translatePydanticError(item) {
  if (typeof item === 'string') return item;
  if (!item || typeof item !== 'object') return '';

  const label = fieldLabel(item.loc);
  const prefix = label ? `${label}: ` : '';
  const ctx = item.ctx || {};
  const type = item.type || '';

  switch (type) {
    case 'missing':
      return label ? `${label} es obligatorio.` : 'Falta un campo obligatorio.';
    case 'string_too_short':
      return `${prefix}debe tener al menos ${ctx.min_length} caracteres.`;
    case 'string_too_long':
      return `${prefix}no debe superar los ${ctx.max_length} caracteres.`;
    case 'value_error.email':
    case 'value_error':
      // EmailStr y validadores genéricos.
      return label
        ? `${label} no es válido.`
        : 'Hay un valor inválido en el formulario.';
    case 'string_pattern_mismatch':
      return `${prefix}tiene un formato no válido.`;
    case 'int_parsing':
    case 'float_parsing':
    case 'decimal_parsing':
      return `${prefix}debe ser un número.`;
    case 'bool_parsing':
      return `${prefix}debe ser verdadero o falso.`;
    case 'greater_than':
      return `${prefix}debe ser mayor que ${ctx.gt}.`;
    case 'greater_than_equal':
      return `${prefix}debe ser mayor o igual que ${ctx.ge}.`;
    case 'less_than':
      return `${prefix}debe ser menor que ${ctx.lt}.`;
    case 'less_than_equal':
      return `${prefix}debe ser menor o igual que ${ctx.le}.`;
    default:
      // Fallback: usa el msg original (en inglés) si no hay traducción.
      return label && item.msg ? `${label}: ${item.msg}` : (item.msg || '');
  }
}

/**
 * Normaliza cualquier error de Axios/FastAPI a un string seguro y en español.
 *
 * FastAPI devuelve `detail` como:
 *  - string (HTTPException) → se usa tal cual
 *  - array de objetos {type, loc, msg, input, ctx} (errores de validación 422)
 *    → React no puede renderizar objetos; los traducimos a español.
 *
 * @param {unknown} err  El error capturado (normalmente de axios).
 * @param {string} fallback  Mensaje por defecto si no se puede extraer nada.
 * @returns {string}
 */
export function getErrorMessage(err, fallback = 'Ocurrió un error. Intente de nuevo.') {
  const detail = err?.response?.data?.detail;

  if (typeof detail === 'string') return detail;

  // Errores de validación de Pydantic: array de objetos.
  if (Array.isArray(detail)) {
    const msgs = detail.map(translatePydanticError).filter(Boolean);
    if (msgs.length) return msgs.join(' · ');
  }

  // Objeto suelto de validación.
  if (detail && typeof detail === 'object') {
    const msg = translatePydanticError(detail);
    if (msg) return msg;
  }

  // Sin respuesta del servidor (red caída, CORS, timeout).
  if (err?.response === undefined && err?.request) {
    // Diagnóstico: muestra la URL real a la que se intentó llamar.
    // Si en producción ves "localhost:8000", falta configurar
    // REACT_APP_BACKEND_URL en Vercel y reconstruir.
    console.error(
      '[PCL] Backend inalcanzable. URL objetivo:',
      err?.config?.baseURL ? err.config.baseURL + (err.config.url || '') : err?.config?.url,
      '| REACT_APP_BACKEND_URL =', process.env.REACT_APP_BACKEND_URL,
      '| error:', err?.message
    );
    return 'No se pudo conectar con el servidor. Verifique su conexión.';
  }

  if (typeof err?.message === 'string' && err.message) return err.message;

  return fallback;
}
