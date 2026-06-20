// Configuración de conexión al backend.
//
// Resolución robusta y a prueba de despliegue (evita el fallo
// "No se pudo conectar al servidor" cuando el build no recibió la variable de
// entorno correcta — p. ej. Vercel tomando .env en vez de .env.production):
//   1. Si REACT_APP_BACKEND_URL apunta a un backend real (no localhost) → se usa.
//   2. Si falta o quedó como localhost PERO la app se sirve desde un dominio de
//      producción (host ≠ localhost) → se usa el backend de producción (Render).
//   3. En desarrollo local → localhost:8000.
const PROD_BACKEND = "https://puntocero-legal-api.onrender.com";
const LOCAL_BACKEND = "http://127.0.0.1:8000";
const ENV_BACKEND = (process.env.REACT_APP_BACKEND_URL || "").trim();

const isLocalUrl = (u) => /(^|\/\/)(localhost|127\.0\.0\.1)/i.test(u);

function resolveBackend() {
  // 1) Variable de entorno válida que apunta a un backend remoto real.
  if (ENV_BACKEND && !isLocalUrl(ENV_BACKEND)) return ENV_BACKEND;
  // 2) En el navegador: si el host NO es local, estamos en producción → Render.
  if (typeof window !== "undefined" && window.location) {
    const host = window.location.hostname;
    if (host && host !== "localhost" && host !== "127.0.0.1") return PROD_BACKEND;
  }
  // 3) Desarrollo local.
  return ENV_BACKEND || LOCAL_BACKEND;
}

const RAW_BACKEND = resolveBackend();

// Normaliza: sin barra final.
export const API_URL = RAW_BACKEND.replace(/\/+$/, "");

// Base con el prefijo /api que usan las rutas del backend.
export const API = `${API_URL}/api`;

// Exportación por defecto.
export default API_URL;
