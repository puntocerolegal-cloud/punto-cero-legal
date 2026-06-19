// Configuración de conexión al backend.
// En producción (Vercel) toma REACT_APP_BACKEND_URL desde .env.production
// (URL de Render). En desarrollo cae a localhost:8000. Antes esto estaba
// hardcodeado a localhost y rompía el despliegue.
const RAW_BACKEND = process.env.REACT_APP_BACKEND_URL || "http://127.0.0.1:8000";

// Normaliza: sin barra final.
export const API_URL = RAW_BACKEND.replace(/\/+$/, "");

// Base con el prefijo /api que usan las rutas del backend.
export const API = `${API_URL}/api`;

// Exportación por defecto.
export default API_URL;
