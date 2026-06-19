// Módulo Facturación Global — Punto Cero OS.
// Datos NEUTRALIZADOS: la fuente real es el backend (billing.service vía API).
// Estructura preservada; sin clientes ficticios ni importes legacy. Sin NaN
// (todas las métricas derivadas quedan en cero con arrays vacíos).

export const VERTICALS = ["Medicina", "Odontología", "Jurídico"];

export const CLIENTS = [];
export const INVOICES = [];

export const KPIS = {
  totalBilled: 0,
  issued: 0,
  paid: 0,
  overdue: 0,
  accountsReceivable: 0,
  monthlyCollection: 0,
};

export const RECEIVABLE = {
  total: 0,
  buckets: [],
};

export const REVENUE = {
  monthCollection: 0,
  accumulated: 0,
  avgTicket: 0,
  byVertical: [],
};

export const PAYMENT_METHODS = [];

export const COLLECTIONS = {
  overdueClients: [],
  upcomingDue: [],
  scheduled: [],
  critical: [],
};

export const OPERATIONS = {
  pendingInvoices: 0,
  overdueInvoices: 0,
  scheduledCollections: 0,
  dailyCollection: 0,
  criticalCases: 0,
  paymentsInReview: 0,
};

export const MONTHLY_BILLING = [];
export const PAID_VS_PENDING = [];
export const BILLING_BY_VERTICAL = [];
