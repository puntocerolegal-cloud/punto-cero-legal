// Datos de demostración del módulo Facturación Global — Punto Cero OS.
// SOLO UI: sin backend. Datos realistas, sustituibles por endpoints reales.

export const VERTICALS = ["Medicina", "Odontología", "Jurídico"];

// ── Clientes / organizaciones (≥ 10) ──
export const CLIENTS = [
  "Centro Médico Vida", "Hospital San Rafael", "MediCare Plus",
  "Clínica Dental Sonríe", "OdontoSalud Integral", "Sonrisa Perfecta", "Dental Care Pro",
  "Bufete Andrade & Asoc.", "Legal Partners SAS", "Jurídica Integral",
];

// ── Facturas (≥ 20) ──
// status: paid | pending | overdue | review · source: Suscripción | Implementación | Organización
export const INVOICES = [
  { _id: "f1",  invoice: "FAC-2026-001", client: "Centro Médico Vida",     vertical: "Medicina",    source: "Suscripción",    issued: "2026-06-01", due: "2026-06-16", amount: 240000, status: "paid" },
  { _id: "f2",  invoice: "FAC-2026-002", client: "Hospital San Rafael",    vertical: "Medicina",    source: "Suscripción",    issued: "2026-06-01", due: "2026-06-16", amount: 480000, status: "paid" },
  { _id: "f3",  invoice: "FAC-2026-003", client: "Bufete Andrade & Asoc.", vertical: "Jurídico",    source: "Suscripción",    issued: "2026-05-14", due: "2026-05-29", amount: 275000, status: "overdue" },
  { _id: "f4",  invoice: "FAC-2026-004", client: "OdontoSalud Integral",   vertical: "Odontología", source: "Suscripción",    issued: "2026-06-05", due: "2026-06-20", amount: 220000, status: "pending" },
  { _id: "f5",  invoice: "FAC-2026-005", client: "Clínica Dental Sonríe",  vertical: "Odontología", source: "Implementación", issued: "2026-06-08", due: "2026-06-23", amount: 1800000, status: "review" },
  { _id: "f6",  invoice: "FAC-2026-006", client: "Legal Partners SAS",     vertical: "Jurídico",    source: "Suscripción",    issued: "2026-06-02", due: "2026-06-17", amount: 520000, status: "paid" },
  { _id: "f7",  invoice: "FAC-2026-007", client: "MediCare Plus",          vertical: "Medicina",    source: "Suscripción",    issued: "2026-06-03", due: "2026-06-18", amount: 240000, status: "pending" },
  { _id: "f8",  invoice: "FAC-2026-008", client: "Hospital San Rafael",    vertical: "Medicina",    source: "Implementación", issued: "2026-04-20", due: "2026-05-05", amount: 5200000, status: "overdue" },
  { _id: "f9",  invoice: "FAC-2026-009", client: "Sonrisa Perfecta",       vertical: "Odontología", source: "Suscripción",    issued: "2026-06-01", due: "2026-06-16", amount: 110000, status: "paid" },
  { _id: "f10", invoice: "FAC-2026-010", client: "Jurídica Integral",      vertical: "Jurídico",    source: "Implementación", issued: "2026-06-10", due: "2026-06-25", amount: 3400000, status: "pending" },
  { _id: "f11", invoice: "FAC-2026-011", client: "Dental Care Pro",        vertical: "Odontología", source: "Suscripción",    issued: "2026-03-12", due: "2026-03-27", amount: 110000, status: "overdue" },
  { _id: "f12", invoice: "FAC-2026-012", client: "Centro Médico Vida",     vertical: "Medicina",    source: "Organización",   issued: "2026-05-01", due: "2026-05-16", amount: 240000, status: "paid" },
  { _id: "f13", invoice: "FAC-2026-013", client: "Legal Partners SAS",     vertical: "Jurídico",    source: "Implementación", issued: "2026-06-04", due: "2026-06-19", amount: 4100000, status: "review" },
  { _id: "f14", invoice: "FAC-2026-014", client: "OdontoSalud Integral",   vertical: "Odontología", source: "Organización",   issued: "2026-05-05", due: "2026-05-20", amount: 220000, status: "paid" },
  { _id: "f15", invoice: "FAC-2026-015", client: "Bufete Andrade & Asoc.", vertical: "Jurídico",    source: "Implementación", issued: "2026-04-30", due: "2026-05-15", amount: 2900000, status: "overdue" },
  { _id: "f16", invoice: "FAC-2026-016", client: "MediCare Plus",          vertical: "Medicina",    source: "Organización",   issued: "2026-06-03", due: "2026-06-18", amount: 240000, status: "pending" },
  { _id: "f17", invoice: "FAC-2026-017", client: "Hospital San Rafael",    vertical: "Medicina",    source: "Suscripción",    issued: "2026-05-01", due: "2026-05-16", amount: 480000, status: "paid" },
  { _id: "f18", invoice: "FAC-2026-018", client: "Clínica Dental Sonríe",  vertical: "Odontología", source: "Suscripción",    issued: "2026-06-08", due: "2026-06-23", amount: 110000, status: "review" },
  { _id: "f19", invoice: "FAC-2026-019", client: "Jurídica Integral",      vertical: "Jurídico",    source: "Suscripción",    issued: "2026-06-02", due: "2026-06-17", amount: 275000, status: "pending" },
  { _id: "f20", invoice: "FAC-2026-020", client: "Sonrisa Perfecta",       vertical: "Odontología", source: "Implementación", issued: "2026-05-22", due: "2026-06-06", amount: 1500000, status: "paid" },
  { _id: "f21", invoice: "FAC-2026-021", client: "Legal Partners SAS",     vertical: "Jurídico",    source: "Suscripción",    issued: "2026-05-02", due: "2026-05-17", amount: 520000, status: "paid" },
  { _id: "f22", invoice: "FAC-2026-022", client: "Centro Médico Vida",     vertical: "Medicina",    source: "Implementación", issued: "2026-06-09", due: "2026-06-24", amount: 2200000, status: "pending" },
];

// ── KPIs ejecutivos (derivados de las facturas + recaudo) ──
const sumBy = (st) => INVOICES.filter((i) => i.status === st).reduce((s, i) => s + i.amount, 0);
export const KPIS = {
  totalBilled: INVOICES.reduce((s, i) => s + i.amount, 0),
  issued: INVOICES.length,
  paid: INVOICES.filter((i) => i.status === "paid").length,
  overdue: INVOICES.filter((i) => i.status === "overdue").length,
  accountsReceivable: sumBy("pending") + sumBy("overdue") + sumBy("review"),
  monthlyCollection: sumBy("paid"),
};

// ── Cuentas por cobrar (aging) ──
export const RECEIVABLE = {
  total: sumBy("pending") + sumBy("overdue") + sumBy("review"),
  buckets: [
    { key: "0-30", label: "0-30 días", amount: 4205000, priority: "baja" },
    { key: "31-60", label: "31-60 días", amount: 2900000, priority: "media" },
    { key: "60+", label: "+60 días", amount: 8210000, priority: "urgente" },
  ],
};

// ── Resumen de recaudo ──
export const REVENUE = {
  monthCollection: sumBy("paid"),
  accumulated: 96400000,
  avgTicket: Math.round(INVOICES.reduce((s, i) => s + i.amount, 0) / INVOICES.length),
  byVertical: [
    { label: "Medicina", value: 38 },
    { label: "Odontología", value: 21 },
    { label: "Jurídico", value: 37 },
  ],
};

// ── Métodos de pago ──
export const PAYMENT_METHODS = [
  { key: "transfer", label: "Transferencia bancaria", transactions: 38, amount: 9800000, accent: "#3b82f6" },
  { key: "pse", label: "PSE", transactions: 24, amount: 6100000, accent: "#10b981" },
  { key: "card", label: "Tarjeta crédito/débito", transactions: 41, amount: 11200000, accent: "#f97316" },
  { key: "cash", label: "Efectivo", transactions: 7, amount: 1300000, accent: "#8b5cf6" },
];

// ── Centro de Cobranza (≥ 15 eventos combinados) ──
// status para semáforo: normal | atencion | riesgo | critico
export const COLLECTIONS = {
  overdueClients: [
    { id: "m1", client: "Bufete Andrade & Asoc.", amount: 275000, days: 28, priority: "alta", status: "riesgo" },
    { id: "m2", client: "Hospital San Rafael", amount: 5200000, days: 42, priority: "urgente", status: "critico" },
    { id: "m3", client: "Dental Care Pro", amount: 110000, days: 86, priority: "urgente", status: "critico" },
    { id: "m4", client: "Bufete Andrade & Asoc.", amount: 2900000, days: 31, priority: "alta", status: "riesgo" },
  ],
  upcomingDue: [
    { id: "u1", client: "OdontoSalud Integral", amount: 220000, due: "2026-06-20", priority: "media", status: "atencion" },
    { id: "u2", client: "MediCare Plus", amount: 240000, due: "2026-06-18", priority: "media", status: "atencion" },
    { id: "u3", client: "Jurídica Integral", amount: 275000, due: "2026-06-17", priority: "baja", status: "normal" },
    { id: "u4", client: "Centro Médico Vida", amount: 2200000, due: "2026-06-24", priority: "media", status: "atencion" },
  ],
  scheduled: [
    { id: "s1", client: "Clínica Dental Sonríe", amount: 1800000, date: "2026-06-21", priority: "media", status: "normal" },
    { id: "s2", client: "Legal Partners SAS", amount: 4100000, date: "2026-06-19", priority: "alta", status: "atencion" },
    { id: "s3", client: "Jurídica Integral", amount: 3400000, date: "2026-06-26", priority: "media", status: "normal" },
  ],
  critical: [
    { id: "c1", client: "Hospital San Rafael", amount: 5200000, reason: "Mora +42 días", priority: "urgente", status: "critico" },
    { id: "c2", client: "Dental Care Pro", amount: 110000, reason: "Suspendido por impago", priority: "urgente", status: "critico" },
    { id: "c3", client: "Bufete Andrade & Asoc.", amount: 2900000, reason: "Implementación impaga", priority: "alta", status: "riesgo" },
    { id: "c4", client: "Bufete Andrade & Asoc.", amount: 275000, reason: "Suscripción vencida", priority: "alta", status: "riesgo" },
  ],
};

// ── Centro de Operaciones ──
export const OPERATIONS = {
  pendingInvoices: INVOICES.filter((i) => i.status === "pending").length,
  overdueInvoices: INVOICES.filter((i) => i.status === "overdue").length,
  scheduledCollections: COLLECTIONS.scheduled.length,
  dailyCollection: 1840000,
  criticalCases: COLLECTIONS.critical.length,
  paymentsInReview: INVOICES.filter((i) => i.status === "review").length,
};

// ── Analítica ──
export const MONTHLY_BILLING = [
  { label: "Ene", value: 14.2 }, { label: "Feb", value: 16.8 }, { label: "Mar", value: 19.1 },
  { label: "Abr", value: 18.4 }, { label: "May", value: 22.6 }, { label: "Jun", value: 24.3 },
];

export const PAID_VS_PENDING = [
  { label: "Pagado", value: Math.round(sumBy("paid") / 1_000_000), color: "#10b981" },
  { label: "Pendiente", value: Math.round(sumBy("pending") / 1_000_000), color: "#f59e0b" },
  { label: "Vencido", value: Math.round(sumBy("overdue") / 1_000_000), color: "#ef4444" },
  { label: "En revisión", value: Math.round(sumBy("review") / 1_000_000), color: "#8b5cf6" },
];

export const BILLING_BY_VERTICAL = VERTICALS.map((v, i) => ({
  label: v,
  value: Math.round(INVOICES.filter((inv) => inv.vertical === v).reduce((s, inv) => s + inv.amount, 0) / 1_000_000),
  color: ["#10b981", "#3b82f6", "#f97316"][i],
}));
