// Datos de demostración del módulo Organizaciones (Multi-Tenant) — Punto Cero OS.
// SOLO UI: sin backend. Datos realistas, sustituibles por endpoints reales.

// ── KPIs ejecutivos ──
export const KPIS = {
  activeOrgs: 24,
  totalUsers: 318,
  activeVerticals: 3,
  activeSubscriptions: 21,
  totalMrr: 18650000, // COP
  orgsAtRisk: 3,
};

// ── Organizaciones (tenants) ──
// status: active | trial | suspended | at_risk
export const ORGANIZATIONS = [
  {
    _id: "org1", name: "Centro Médico Vida", vertical: "Medicina", plan: "Professional",
    users: 14, usage: 62, status: "active", joined: "2026-01-12", mrr: 240000,
    health: { adoption: 78, activity: 84, tickets: 2, billing: "normal", risk: "baja" },
    tenant: { storageUsedGb: 31, storageTotalGb: 50, activeUsers: 11, documents: 1240, monthlyConsumption: 68 },
  },
  {
    _id: "org2", name: "Hospital San Rafael", vertical: "Medicina", plan: "Enterprise",
    users: 48, usage: 74, status: "active", joined: "2025-11-03", mrr: 480000,
    health: { adoption: 71, activity: 80, tickets: 5, billing: "normal", risk: "media" },
    tenant: { storageUsedGb: 180, storageTotalGb: 250, activeUsers: 39, documents: 8430, monthlyConsumption: 74 },
  },
  {
    _id: "org3", name: "Clínica Dental Sonríe", vertical: "Odontología", plan: "Essential",
    users: 4, usage: 35, status: "trial", joined: "2026-06-02", mrr: 110000,
    health: { adoption: 40, activity: 38, tickets: 1, billing: "atencion", risk: "alta" },
    tenant: { storageUsedGb: 3, storageTotalGb: 10, activeUsers: 2, documents: 120, monthlyConsumption: 30 },
  },
  {
    _id: "org4", name: "OdontoSalud Integral", vertical: "Odontología", plan: "Professional",
    users: 9, usage: 58, status: "active", joined: "2026-02-18", mrr: 220000,
    health: { adoption: 66, activity: 70, tickets: 0, billing: "normal", risk: "baja" },
    tenant: { storageUsedGb: 22, storageTotalGb: 50, activeUsers: 8, documents: 980, monthlyConsumption: 58 },
  },
  {
    _id: "org5", name: "Bufete Andrade & Asoc.", vertical: "Jurídico", plan: "Professional",
    users: 7, usage: 41, status: "at_risk", joined: "2026-05-21", mrr: 275000,
    health: { adoption: 35, activity: 28, tickets: 6, billing: "riesgo", risk: "urgente" },
    tenant: { storageUsedGb: 12, storageTotalGb: 50, activeUsers: 3, documents: 310, monthlyConsumption: 24 },
  },
  {
    _id: "org6", name: "Legal Partners SAS", vertical: "Jurídico", plan: "Enterprise",
    users: 36, usage: 81, status: "active", joined: "2025-09-30", mrr: 520000,
    health: { adoption: 88, activity: 90, tickets: 1, billing: "normal", risk: "baja" },
    tenant: { storageUsedGb: 210, storageTotalGb: 250, activeUsers: 33, documents: 11200, monthlyConsumption: 81 },
  },
  {
    _id: "org7", name: "Dental Care Pro", vertical: "Odontología", plan: "Essential",
    users: 3, usage: 22, status: "suspended", joined: "2025-08-08", mrr: 0,
    health: { adoption: 18, activity: 10, tickets: 3, billing: "critico", risk: "urgente" },
    tenant: { storageUsedGb: 1, storageTotalGb: 10, activeUsers: 0, documents: 45, monthlyConsumption: 8 },
  },
];

// Usuarios por organización (demo: clave = _id de organización).
export const ORG_USERS = {
  org1: [
    { _id: "u1", name: "Dra. Quintero", email: "quintero@cmvida.co", role: "admin", status: "active" },
    { _id: "u2", name: "Dr. Salas", email: "salas@cmvida.co", role: "lawyer", status: "active" },
    { _id: "u3", name: "Recepción Vida", email: "recepcion@cmvida.co", role: "client", status: "inactive" },
  ],
  org5: [
    { _id: "u4", name: "Dr. Andrade", email: "andrade@bufete.co", role: "admin", status: "active" },
    { _id: "u5", name: "Asistente Legal", email: "asistente@bufete.co", role: "lawyer", status: "pending" },
  ],
};

// ── Centro de Operaciones ──
export const OPERATIONS = {
  newOrgs: 2,
  activeOrgs: 24,
  orgsAtRisk: 3,
  blockedUsers: 4,
  upcomingRenewals: 9,
  openTickets: 7,
};

// ── Analítica ──
export const ORGS_BY_VERTICAL = [
  { label: "Medicina", value: 9 },
  { label: "Odontología", value: 8 },
  { label: "Jurídico", value: 7 },
];

export const USERS_BY_ORG = ORGANIZATIONS.map((o) => ({ label: o.name.split(" ")[0], value: o.users }));

export const MRR_BY_ORG = ORGANIZATIONS
  .filter((o) => o.mrr > 0)
  .map((o) => ({ label: o.name.split(" ")[0], value: Math.round(o.mrr / 1000) }));

export const HEALTH_DISTRIBUTION = [
  { label: "Saludable", value: 16, color: "#10b981" },
  { label: "Atención", value: 5, color: "#f59e0b" },
  { label: "En riesgo", value: 3, color: "#ef4444" },
];
