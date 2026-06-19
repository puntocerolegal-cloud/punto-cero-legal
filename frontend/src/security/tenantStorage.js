// Persistencia de tenant — Punto Cero OS.
// Módulo SIN React: lo comparten el TenantProvider (UI) y el apiClient (HTTP),
// de modo que las cabeceras multi-tenant siempre reflejen el tenant activo.

export const TENANT_STORAGE_KEY = "pcl_os_tenant";

export function readTenant() {
  try {
    const raw = localStorage.getItem(TENANT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function writeTenant(tenant) {
  try {
    if (!tenant) localStorage.removeItem(TENANT_STORAGE_KEY);
    else localStorage.setItem(TENANT_STORAGE_KEY, JSON.stringify(tenant));
  } catch (e) {
    /* almacenamiento no disponible: se ignora silenciosamente */
  }
}

// Cabeceras multi-tenant para cada request (vacías si no hay tenant activo).
export function getTenantHeaders() {
  const t = readTenant();
  const headers = {};
  if (t?.tenantId) headers["X-Tenant-ID"] = String(t.tenantId);
  if (t?.organizationId) headers["X-Organization-ID"] = String(t.organizationId);
  return headers;
}
