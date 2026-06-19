// Health Check del sistema — Punto Cero OS.
// Sin backend: devuelve estado mock coherente. checkApi pingea /health solo si
// hay APIs activas; de lo contrario reporta modo mock saludable.
import { apiClient } from "@/config/api/apiClient";
import { features } from "@/config/api/features";
import { MODULES } from "@/security/roles";
import { validateTenant } from "@/security/tenantGuard";

export const healthService = {
  async checkApi() {
    if (features.ENABLE_MOCKS) {
      return { ok: true, mode: "mock", detail: "Modo mock: sin backend conectado." };
    }
    try {
      const res = await apiClient.get("/health");
      return { ok: res.status >= 200 && res.status < 300, mode: "live", status: res.status };
    } catch (e) {
      return { ok: false, mode: "live", detail: e?.message || "Error de conexión" };
    }
  },

  checkTenant(tenant) {
    const ok = validateTenant(tenant);
    return { ok, detail: ok ? `Tenant activo: ${tenant.tenantName || tenant.tenantId}` : "Sin tenant válido" };
  },

  checkModules() {
    // Todos los módulos del OS están construidos en UI.
    return Object.values(MODULES).map((m) => ({ module: m, ok: true }));
  },
};

export default healthService;
