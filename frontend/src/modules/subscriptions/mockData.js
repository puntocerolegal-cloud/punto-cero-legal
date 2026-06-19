// Datos de demostración del módulo Suscripciones y Facturación — Punto Cero OS.
// SOLO UI: sin backend. Datos realistas, sustituibles por endpoints reales.

// ── KPIs ejecutivos ──
export const KPIS = {
  activeClients: 47,
  mrr: 18650000,     // COP / mes
  arr: 223800000,    // COP / año
  churn: 3.2,        // %
  renewals: 9,       // próximas
  monthlyBilling: 21400000,
};

// ── Planes SaaS por vertical (nombres se mantienen) ──
// price en COP/mes. storage en GB.
const TIERS = {
  Essential:    { users: 3,  storage: 10,  modules: ["Agenda", "Clientes", "Facturación"] },
  Professional: { users: 10, storage: 50,  modules: ["Agenda", "Clientes", "Facturación", "CRM", "IA"] },
  Enterprise:   { users: 50, storage: 250, modules: ["Todo incluido", "API", "SLA dedicado"] },
};

export const PLANS = [
  // Medicina
  { id: "med-ess", vertical: "Medicina", name: "Essential", price: 120000, ...TIERS.Essential },
  { id: "med-pro", vertical: "Medicina", name: "Professional", price: 240000, featured: true, ...TIERS.Professional },
  { id: "med-ent", vertical: "Medicina", name: "Enterprise", price: 480000, ...TIERS.Enterprise },
  // Odontología
  { id: "odo-ess", vertical: "Odontología", name: "Essential", price: 110000, ...TIERS.Essential },
  { id: "odo-pro", vertical: "Odontología", name: "Professional", price: 220000, featured: true, ...TIERS.Professional },
  { id: "odo-ent", vertical: "Odontología", name: "Enterprise", price: 440000, ...TIERS.Enterprise },
  // Jurídico
  { id: "jur-ess", vertical: "Jurídico", name: "Essential", price: 140000, ...TIERS.Essential },
  { id: "jur-pro", vertical: "Jurídico", name: "Professional", price: 275000, featured: true, ...TIERS.Professional },
  { id: "jur-ent", vertical: "Jurídico", name: "Enterprise", price: 520000, ...TIERS.Enterprise },
];

export const VERTICALS = ["Medicina", "Odontología", "Jurídico"];

// ── Suscripciones activas ──
export const SUBSCRIPTIONS = [
  { _id: "s1", company: "Centro Médico Vida", vertical: "Medicina", plan: "Professional", status: "active", renewal: "2026-09-18", monthly: 240000 },
  { _id: "s2", company: "Hospital San Rafael", vertical: "Medicina", plan: "Enterprise", status: "active", renewal: "2026-07-01", monthly: 480000 },
  { _id: "s3", company: "Clínica Dental Sonríe", vertical: "Odontología", plan: "Essential", status: "trial", renewal: "2026-06-25", monthly: 110000 },
  { _id: "s4", company: "OdontoSalud Integral", vertical: "Odontología", plan: "Professional", status: "active", renewal: "2026-08-12", monthly: 220000 },
  { _id: "s5", company: "Bufete Andrade & Asoc.", vertical: "Jurídico", plan: "Professional", status: "past_due", renewal: "2026-06-14", monthly: 275000 },
  { _id: "s6", company: "Legal Partners SAS", vertical: "Jurídico", plan: "Enterprise", status: "active", renewal: "2026-11-30", monthly: 520000 },
  { _id: "s7", company: "MediCare Plus", vertical: "Medicina", plan: "Professional", status: "active", renewal: "2026-10-05", monthly: 240000 },
  { _id: "s8", company: "Sonrisa Perfecta", vertical: "Odontología", plan: "Essential", status: "cancelled", renewal: "2026-05-12", monthly: 110000 },
];

// ── Billing Center ──
// status: paid | pending | overdue | review
export const INVOICES = [
  { _id: "f1", invoice: "FAC-2026-051", company: "Centro Médico Vida", amount: 240000, date: "2026-06-01", status: "paid" },
  { _id: "f2", invoice: "FAC-2026-052", company: "Hospital San Rafael", amount: 480000, date: "2026-06-01", status: "paid" },
  { _id: "f3", invoice: "FAC-2026-053", company: "Bufete Andrade & Asoc.", amount: 275000, date: "2026-05-14", status: "overdue" },
  { _id: "f4", invoice: "FAC-2026-054", company: "OdontoSalud Integral", amount: 220000, date: "2026-06-05", status: "pending" },
  { _id: "f5", invoice: "FAC-2026-055", company: "Clínica Dental Sonríe", amount: 110000, date: "2026-06-08", status: "review" },
  { _id: "f6", invoice: "FAC-2026-056", company: "Legal Partners SAS", amount: 520000, date: "2026-06-02", status: "paid" },
  { _id: "f7", invoice: "FAC-2026-057", company: "MediCare Plus", amount: 240000, date: "2026-06-03", status: "pending" },
];

// ── Renovaciones ──
// risk: tono de StatusBadge (normal | atencion | riesgo | critico)
export const RENEWALS = [
  { id: "r1", company: "Bufete Andrade & Asoc.", date: "2026-06-14", monthly: 275000, risk: "critico", note: "Pago vencido" },
  { id: "r2", company: "Clínica Dental Sonríe", date: "2026-06-25", monthly: 110000, risk: "atencion", note: "En trial, sin tarjeta" },
  { id: "r3", company: "Hospital San Rafael", date: "2026-07-01", monthly: 480000, risk: "normal", note: "Renovación automática" },
  { id: "r4", company: "OdontoSalud Integral", date: "2026-08-12", monthly: 220000, risk: "normal", note: "Candidato a upgrade" },
];

export const UPGRADE_CANDIDATES = ["OdontoSalud Integral", "MediCare Plus"];

// ── Centro de Operaciones ──
export const OPERATIONS = {
  overdueInvoices: 1,
  pendingPayments: 2,
  upcomingRenewals: 9,
  churnRisk: 2,
  pendingUpgrades: 2,
  financeTickets: 3,
};

// ── Analítica SaaS ──
export const MRR_BY_MONTH = [
  { label: "Ene", value: 12.4 }, { label: "Feb", value: 13.8 }, { label: "Mar", value: 15.1 },
  { label: "Abr", value: 16.0 }, { label: "May", value: 17.6 }, { label: "Jun", value: 18.65 },
];

export const ARR_BY_VERTICAL = [
  { label: "Medicina", value: 98 },
  { label: "Odontología", value: 52 },
  { label: "Jurídico", value: 74 },
];

export const CLIENTS_BY_PLAN = [
  { label: "Essential", value: 14, color: "#3b82f6" },
  { label: "Professional", value: 21, color: "#f97316" },
  { label: "Enterprise", value: 12, color: "#10b981" },
];

export const RENEWALS_BY_MONTH = [
  { label: "Ene", value: 78 }, { label: "Feb", value: 81 }, { label: "Mar", value: 85 },
  { label: "Abr", value: 83 }, { label: "May", value: 88 }, { label: "Jun", value: 91 },
];
