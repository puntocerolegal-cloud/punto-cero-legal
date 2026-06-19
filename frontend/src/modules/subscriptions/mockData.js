// Módulo Suscripciones y Facturación — Punto Cero OS.
// Datos NEUTRALIZADOS: la fuente real es el backend (subscriptions.service vía API).
// Se mantiene la ESTRUCTURA (claves/forma) para no romper componentes; sin datos
// legacy (sin empresas ficticias, sin tiers Essential/Professional/Enterprise,
// sin precios antiguos). En producción estos arrays se reemplazan por datos reales.

// ── KPIs ejecutivos (en cero hasta que el backend provea) ──
export const KPIS = {
  activeClients: 0,
  mrr: 0,
  arr: 0,
  churn: 0,
  renewals: 0,
  monthlyBilling: 0,
};

// Planes: la ÚNICA fuente oficial es modules/plans (SubscriptionPlans la consume).
export const PLANS = [];
export const VERTICALS = ["Medicina", "Odontología", "Jurídico"];

// ── Suscripciones activas (reales desde backend) ──
export const SUBSCRIPTIONS = [];

// ── Billing Center ──
export const INVOICES = [];

// ── Renovaciones ──
export const RENEWALS = [];

export const UPGRADE_CANDIDATES = [];

// ── Centro de Operaciones ──
export const OPERATIONS = {
  overdueInvoices: 0,
  pendingPayments: 0,
  upcomingRenewals: 0,
  churnRisk: 0,
  pendingUpgrades: 0,
  financeTickets: 0,
};

// ── Analítica SaaS (series vacías; se llenan con datos reales) ──
export const MRR_BY_MONTH = [];
export const ARR_BY_VERTICAL = [];
export const CLIENTS_BY_PLAN = [];
export const RENEWALS_BY_MONTH = [];
