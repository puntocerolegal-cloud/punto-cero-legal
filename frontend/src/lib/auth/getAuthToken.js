/**
 * Punto único de verdad para acceso a token de autenticación.
 * 
 * REGLAS:
 * - Siempre intenta leer desde 'pcl_token' primero (fuente de verdad)
 * - Fallback a 'token' para compatibilidad con código legacy
 * - Retorna null si no hay token o si localStorage falla
 * - Nunca lanza excepciones
 */

export function getAuthToken() {
  try {
    // Fuente de verdad: pcl_token (la clave que usa AuthContext)
    let token = localStorage.getItem('pcl_token');
    
    // Fallback a 'token' para compatibilidad legacy
    if (!token) {
      token = localStorage.getItem('token');
    }
    
    return token || null;
  } catch (e) {
    // localStorage puede lanzar SecurityError en Private Mode
    // Retornar null gracefully
    return null;
  }
}

/**
 * Obtener el usuario autenticado (si existe)
 */
export function getCurrentUser() {
  try {
    const userStr = localStorage.getItem('pcl_user') || localStorage.getItem('user');
    if (!userStr) return null;
    return JSON.parse(userStr);
  } catch (e) {
    return null;
  }
}

/**
 * Decodificar un JWT sin validar firma (solo lectura de claims)
 * Útil para obtener información del token sin validación criptográfica
 */
export function decodeToken(token) {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const decoded = JSON.parse(atob(parts[1]));
    return decoded;
  } catch (e) {
    return null;
  }
}
