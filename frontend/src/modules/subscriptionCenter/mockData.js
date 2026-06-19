// Datos de demostración del Centro de Suscripción — Punto Cero System OS.
// SOLO UI: el plan/estado en vivo vienen del SubscriptionContext; aquí se
// complementan historial, facturas, beneficios y meses gratis.

export const HISTORY = [
  { id: "h1", date: "2025-09-01", event: "Activación", detail: "Plan Consolidación Empresarial activado" },
  { id: "h2", date: "2026-01-15", event: "Renovación", detail: "Renovación manual realizada" },
  { id: "h3", date: "2026-05-28", event: "Beneficio", detail: "+1 mes gratis por referido (Bufete Mora)" },
];

export const INVOICES = [
  { id: "inv-1", number: "PC-2025-0901", date: "2025-09-01", amountUsd: 525, status: "pagada" },
  { id: "inv-2", number: "PC-2026-0115", date: "2026-01-15", amountUsd: 525, status: "pagada" },
  { id: "inv-3", number: "PC-2026-0601", date: "2026-06-01", amountUsd: 525, status: "pendiente" },
];

export const BENEFITS = [
  { id: "b1", label: "Meses gratis acumulados", value: "2 meses" },
  { id: "b2", label: "Referidos convertidos", value: "2" },
  { id: "b3", label: "Soporte", value: "Dedicado (SLA)" },
];

export const KPIS = {
  freeMonths: 2,
  invoices: 3,
  referrals: 6,
  benefits: 3,
};
