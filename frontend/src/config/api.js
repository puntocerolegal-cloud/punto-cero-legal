// Configuración centralizada de la URL del backend.
//
// Reglas:
//   1. Desarrollo: usa REACT_APP_BACKEND_URL (normalmente http://localhost:8000).
//   2. Producción: usa REACT_APP_BACKEND_URL SOLO si no apunta a localhost.
//      Cualquier valor localhost/127.0.0.1 en un build de producción se
//      considera mal configurado y se reemplaza por la URL pública de Render.
//
// Esto garantiza que el frontend desplegado NUNCA llame a localhost, aunque
// la variable de entorno del panel (Vercel) esté mal puesta o ausente.
const RENDER_URL = "https://puntocero-legal-api.onrender.com";

const raw = (process.env.REACT_APP_BACKEND_URL || "").trim();
const isProduction = process.env.NODE_ENV === "production";
const pointsToLocalhost = /localhost|127\.0\.0\.1/i.test(raw);

export const API_URL =
  !raw || (isProduction && pointsToLocalhost) ? RENDER_URL : raw;

// Base con el prefijo /api que usan todas las rutas del backend.
export const API = `${API_URL}/api`;

export default API_URL;
