// Cliente HTTP centralizado de Punto Cero OS.
// Reutiliza la URL base ya centralizada en src/config/api.js (con guard
// anti-localhost) y añade timeout/headers comunes. No se invoca aún: queda
// listo para cuando los servicios activen su feature flag.
import axios from "axios";
import { API } from "@/config/api";
import { getTenantHeaders } from "@/security/tenantStorage";

export const BASE_URL = API; // `${API_URL}/api`
export const TIMEOUT = 20000;

export const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json",
};

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: TIMEOUT,
  headers: DEFAULT_HEADERS,
});

// Propaga el token JWT y las cabeceras multi-tenant (X-Tenant-ID /
// X-Organization-ID) del tenant activo en cada request.
apiClient.interceptors.request.use((config) => {
  config.headers = config.headers || {};
  const auth = axios.defaults.headers.common?.["Authorization"];
  if (auth && !config.headers.Authorization) {
    config.headers.Authorization = auth;
  }
  const tenantHeaders = getTenantHeaders();
  Object.entries(tenantHeaders).forEach(([k, v]) => {
    if (v) config.headers[k] = v;
  });
  return config;
});

export default apiClient;
