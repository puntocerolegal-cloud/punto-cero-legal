// Módulo Organizaciones (Multi-Tenant) — Punto Cero OS.
// Datos NEUTRALIZADOS: la fuente real es el backend (organizations.service vía API).
// Estructura preservada; sin datos legacy (sin organizaciones ficticias, sin tiers
// Essential/Professional/Enterprise, sin precios antiguos).

export const KPIS = {
  activeOrgs: 0,
  totalUsers: 0,
  activeVerticals: 0,
  activeSubscriptions: 0,
  totalMrr: 0,
  orgsAtRisk: 0,
};

export const ORGANIZATIONS = [];

export const ORG_USERS = {};

export const OPERATIONS = {
  newOrgs: 0,
  activeOrgs: 0,
  orgsAtRisk: 0,
  blockedUsers: 0,
  upcomingRenewals: 0,
  openTickets: 0,
};

export const ORGS_BY_VERTICAL = [];
export const USERS_BY_ORG = ORGANIZATIONS.map((o) => ({ label: o.name.split(" ")[0], value: o.users }));
export const MRR_BY_ORG = ORGANIZATIONS.filter((o) => o.mrr > 0).map((o) => ({ label: o.name.split(" ")[0], value: Math.round(o.mrr / 1000) }));
export const HEALTH_DISTRIBUTION = [];
