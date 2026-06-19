// Motor de Conteo de Uso — Punto Cero System Core.
// Persiste los contadores de uso por feature en localStorage.
//
// Retrocompatibilidad: comparte la MISMA clave `pcl_commerce` que usa
// SubscriptionContext y escribe dentro de `usage`, de modo que el estado actual
// (status/planSlug/usage) se preserva. No introduce una clave paralela.
const STORAGE_KEY = "pcl_commerce";

function read() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch (e) {
    return {};
  }
}

function write(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    /* almacenamiento no disponible: degradación silenciosa */
  }
}

/** Uso actual de una clave (clients/cases/ai/appointments/meetings/documents). */
export function getUsage(usageKey) {
  if (!usageKey) return 0;
  return Number(read().usage?.[usageKey] || 0);
}

/** Mapa completo de uso. */
export function getAllUsage() {
  return read().usage || {};
}

/** Fija el valor de uso de una clave (no negativo). */
export function setUsage(usageKey, value) {
  if (!usageKey) return 0;
  const state = read();
  const next = Math.max(0, Number(value) || 0);
  state.usage = { ...(state.usage || {}), [usageKey]: next };
  write(state);
  return next;
}

/** Incrementa el uso de una clave y devuelve el nuevo valor. */
export function increment(usageKey, by = 1) {
  return setUsage(usageKey, getUsage(usageKey) + by);
}

/** Decrementa el uso de una clave (mínimo 0). */
export function decrement(usageKey, by = 1) {
  return setUsage(usageKey, getUsage(usageKey) - by);
}

/** Reinicia todos los contadores (p. ej. al cambiar de plan o salir de Demo). */
export function resetUsage() {
  const state = read();
  state.usage = {};
  write(state);
}
