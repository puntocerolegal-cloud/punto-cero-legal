// Utilidades comunes de validación — Punto Cero OS.
export function makeResult(errors) {
  return { valid: errors.length === 0, errors };
}

export function requireFields(obj = {}, fields = []) {
  const errors = [];
  fields.forEach((f) => {
    const v = obj[f];
    if (v === undefined || v === null || v === "") errors.push(`Falta el campo requerido: ${f}`);
  });
  return errors;
}

export function requireOneOf(obj, field, allowed) {
  if (obj[field] != null && !allowed.includes(obj[field])) {
    return [`Campo '${field}' inválido: ${obj[field]}`];
  }
  return [];
}
