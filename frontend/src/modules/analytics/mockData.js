// Datos de demostración del módulo Analytics Center — Punto Cero OS.
// SOLO UI: sin backend. Consolida (de forma coherente) Organizaciones, Partners,
// Implementaciones, Suscripciones y Facturación. Sustituibles por @/config/api.

// ── KPIs ejecutivos globales ──
export const KPIS = {
  activeOrgs: 24,
  mrr: 18650000,       // COP/mes
  arr: 223800000,      // COP/año
  totalBilled: 96400000,
  activeImplementations: 6,
  globalConversion: 28, // %
};

// ── Performance por vertical (coherente con módulos previos) ──
export const VERTICALS = [
  { key: "medicina",   name: "Medicina",        clients: 9, revenue: 38, conversions: 22, implementations: 3, growth: 14,  risk: "baja",   status: "normal" },
  { key: "odontologia",name: "Odontología",     clients: 8, revenue: 21, conversions: 27, implementations: 3, growth: 19,  risk: "media",  status: "atencion" },
  { key: "juridico",   name: "Jurídico",        clients: 7, revenue: 37, conversions: 31, implementations: 2, growth: 9,   risk: "baja",   status: "normal" },
];

// ── Executive Insights (derivados) ──
export const INSIGHTS = {
  bestVertical: "Jurídico",
  fastestGrowing: "Odontología",
  topRevenue: "Medicina",
  topConversion: "Jurídico",
  risks: [
    "Bufete Andrade & Asoc.: suscripción e implementación vencidas (+30 días).",
    "Hospital San Rafael: factura de implementación en mora (+42 días).",
    "Churn en riesgo: 2 organizaciones en trial sin método de pago.",
  ],
  opportunities: [
    "OdontoSalud Integral y MediCare Plus: candidatos a upgrade de plan.",
    "Vertical Odontología creciendo 19% mensual: ampliar captación de partners.",
    "9 renovaciones próximas con baja probabilidad de churn.",
  ],
};

// ── Revenue Analytics ──
export const REVENUE = {
  mrr: 18650000,
  arr: 223800000,
  monthlyBilling: 24300000,
  accumulated: 96400000,
  avgTicket: 615000,
};

// ── Growth Center ──
export const GROWTH = {
  newOrgs: 2,
  newPartners: 3,
  newImplementations: 2,
  newSubscriptions: 4,
  trend: [
    { label: "Ene", value: 12 }, { label: "Feb", value: 15 }, { label: "Mar", value: 18 },
    { label: "Abr", value: 17 }, { label: "May", value: 21 }, { label: "Jun", value: 24 },
  ],
};

// ── Centro de Operaciones ──
export const OPERATIONS = {
  newOrgs: 2,
  newPartners: 3,
  pendingImplementations: 4,
  upcomingRenewals: 9,
  overdueInvoices: 4,
  detectedRisks: 3,
};

// ── Analítica visual (shared/charts) ──
export const REVENUE_BY_VERTICAL = VERTICALS.map((v, i) => ({
  label: v.name, value: v.revenue, color: ["#10b981", "#3b82f6", "#f97316"][i],
}));

export const GLOBAL_CONVERSION = [
  { label: "Ene", value: 18 }, { label: "Feb", value: 21 }, { label: "Mar", value: 24 },
  { label: "Abr", value: 23 }, { label: "May", value: 26 }, { label: "Jun", value: 28 },
];

export const MONTHLY_GROWTH = [
  { label: "Ene", value: 12.4 }, { label: "Feb", value: 13.8 }, { label: "Mar", value: 15.1 },
  { label: "Abr", value: 16.0 }, { label: "May", value: 17.6 }, { label: "Jun", value: 18.65 },
];

// Embudo completo: Lead → Cliente productivo (atraviesa todo el OS).
export const FULL_FUNNEL = [
  { label: "Leads", value: 184, color: "#3b82f6" },
  { label: "Oportunidades", value: 96, color: "#6366f1" },
  { label: "Vendido", value: 47, color: "#8b5cf6" },
  { label: "Implementado", value: 32, color: "#f97316" },
  { label: "Suscrito", value: 24, color: "#ec4899" },
  { label: "Productivo", value: 21, color: "#10b981" },
];
