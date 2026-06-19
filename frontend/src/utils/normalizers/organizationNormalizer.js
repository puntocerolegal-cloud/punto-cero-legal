// Convierte una organización del backend al formato que usa la UI.
// Hoy el mock ya viene en formato UI → la normalización es idempotente, pero
// queda como punto único de adaptación cuando llegue el backend real.
import { mapVertical } from "@/utils/mappers";

export function normalizeOrganization(raw = {}) {
  return {
    _id: raw._id || raw.id || "",
    name: raw.name || raw.company || "—",
    vertical: mapVertical(raw.vertical),
    plan: raw.plan || "—",
    users: raw.users ?? raw.user_count ?? 0,
    usage: raw.usage ?? raw.usage_pct ?? 0,
    status: raw.status || "active",
    joined: raw.joined || raw.created_at || "",
    mrr: raw.mrr ?? 0,
    health: raw.health || {},
    tenant: raw.tenant || {},
  };
}

export function normalizeOrganizations(list = []) {
  return Array.isArray(list) ? list.map(normalizeOrganization) : [];
}

export default normalizeOrganization;
