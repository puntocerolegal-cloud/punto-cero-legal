// Servicio de auditoría — Punto Cero OS.
// Registra eventos de seguridad en memoria + localStorage (cap N) y los emite
// por el EventBus. Listo para reenviar al backend cuando exista.
import { eventBus } from "@/core/events/eventBus";

export const AUDIT_ACTIONS = {
  LOGIN: "LOGIN",
  LOGOUT: "LOGOUT",
  TENANT_CHANGE: "TENANT_CHANGE",
  CREATE: "CREATE",
  UPDATE: "UPDATE",
  DELETE: "DELETE",
  EXPORT: "EXPORT",
};

const STORAGE_KEY = "pcl_os_audit";
const MAX_ENTRIES = 100;

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function persist(entries) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
  } catch (e) {
    /* ignore */
  }
}

export const auditService = {
  log(action, meta = {}) {
    const entry = {
      id: `${action}-${load().length + 1}-${meta.at || ""}`,
      action,
      user: meta.user || "—",
      tenant: meta.tenant || "—",
      detail: meta.detail || "",
      at: meta.at || new Date().toISOString(),
    };
    const entries = [entry, ...load()];
    persist(entries);
    eventBus.emit("audit", entry);
    return entry;
  },
  getRecent(n = 20) {
    return load().slice(0, n);
  },
  clear() {
    persist([]);
  },
  // Atajos semánticos
  logLogin(user) { return this.log(AUDIT_ACTIONS.LOGIN, { user }); },
  logLogout(user) { return this.log(AUDIT_ACTIONS.LOGOUT, { user }); },
  logTenantChange(user, tenant) { return this.log(AUDIT_ACTIONS.TENANT_CHANGE, { user, tenant, detail: `Cambio a ${tenant}` }); },
};

export default auditService;
