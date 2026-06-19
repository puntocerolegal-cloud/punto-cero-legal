// Token de Acceso de Soporte — Punto Cero System OS.
// Capa de gobierno (soft-gate client-side): solo el admin emite tokens desde el
// Panel de Seguridad; sin un token válido en localStorage, las rutas técnicas
// quedan bloqueadas para cualquier programador.
//
// NOTA DE SEGURIDAD: es un control client-side con firma de integridad simple
// (checksum + secreto embebido) + expiración. Disuade el acceso casual y permite
// revocación; para seguridad fuerte real, validar el token en backend. Se deja
// preparado para ello (formato autocontenido con exp/label/sig).
const SECRET = "PC-OS-SUPPORT-v1";
const STORAGE_KEY = "pcl_support_token";

// Hash determinístico (djb2) → hex. Suficiente como checksum de integridad.
function hash(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h) ^ str.charCodeAt(i);
  return (h >>> 0).toString(16);
}

function sign(exp, label) {
  return hash(`${exp}|${label}|${SECRET}`);
}

/** Genera un token firmado con expiración. nowMs inyectado para pureza/tests. */
export function generateToken({ hours = 24, label = "soporte", nowMs = Date.now() } = {}) {
  const exp = nowMs + hours * 3600 * 1000;
  const payload = { exp, label, sig: sign(exp, label) };
  const token = btoa(JSON.stringify(payload));
  return { token, exp, label };
}

/** Valida formato, firma y vigencia del token. */
export function parseToken(token, nowMs = Date.now()) {
  try {
    const p = JSON.parse(atob(token));
    if (!p || typeof p.exp !== "number") return { valid: false };
    const label = p.label || "soporte";
    const signatureOk = p.sig === sign(p.exp, label);
    const expired = p.exp <= nowMs;
    return { valid: signatureOk && !expired, expired, exp: p.exp, label };
  } catch (e) {
    return { valid: false };
  }
}

export function getStoredToken() {
  try { return localStorage.getItem(STORAGE_KEY) || null; } catch (e) { return null; }
}

/** Activa (persiste) un token solo si es válido. Devuelve bool. */
export function activateToken(token) {
  if (!parseToken(token).valid) return false;
  try { localStorage.setItem(STORAGE_KEY, token); } catch (e) { /* noop */ }
  return true;
}

/** Revoca el acceso de soporte (elimina el token local). */
export function revokeToken() {
  try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* noop */ }
}

/** ¿Hay un token de soporte válido y vigente? */
export function isSupportAccessActive() {
  const t = getStoredToken();
  return t ? parseToken(t).valid : false;
}

/** Información del token activo (o null). */
export function getActiveTokenInfo() {
  const t = getStoredToken();
  if (!t) return null;
  const r = parseToken(t);
  return r.valid ? { ...r, token: t } : null;
}
