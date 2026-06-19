// Servicio de Facturación — Punto Cero OS.
import * as mock from "@/modules/billing/mockData";
import { apiClient } from "@/config/api/apiClient";
import { isApiEnabled } from "@/config/api/features";
import { normalizeInvoice, normalizeInvoices } from "@/utils/normalizers";
import { eventBus, OS_EVENTS } from "@/core/events/eventBus";

// Desempaqueta la respuesta estándar { success, data, message, errors }.
function unwrap(res) {
  const body = res?.data;
  if (body && typeof body === "object" && "success" in body && "data" in body) return body.data;
  return body;
}

const MOCK = {
  KPIS: mock.KPIS,
  INVOICES: mock.INVOICES,
  RECEIVABLE: mock.RECEIVABLE,
  REVENUE: mock.REVENUE,
  PAYMENT_METHODS: mock.PAYMENT_METHODS,
  COLLECTIONS: mock.COLLECTIONS,
  OPERATIONS: mock.OPERATIONS,
  MONTHLY_BILLING: mock.MONTHLY_BILLING,
  PAID_VS_PENDING: mock.PAID_VS_PENDING,
  BILLING_BY_VERTICAL: mock.BILLING_BY_VERTICAL,
};

const ACCENT_BY_METHOD = { transfer: "#3b82f6", pse: "#10b981", card: "#f97316", cash: "#8b5cf6" };
const ON = () => isApiEnabled("ENABLE_BILLING_API");

// Mapea las métricas del backend a los shapes que usan los paneles de la UI.
function mapMetrics(m, MOCKED) {
  const out = {};
  if (m.agingBuckets) {
    out.RECEIVABLE = {
      total: m.accountsReceivable || 0,
      buckets: [
        { key: "0-30", label: "0-30 días", amount: m.agingBuckets["0-30"] || 0, priority: "baja" },
        { key: "31-60", label: "31-60 días", amount: m.agingBuckets["31-60"] || 0, priority: "media" },
        { key: "60+", label: "+60 días", amount: m.agingBuckets["60+"] || 0, priority: "urgente" },
      ],
    };
  }
  out.REVENUE = {
    monthCollection: m.monthlyRevenue ?? MOCKED.REVENUE.monthCollection,
    accumulated: m.totalRevenue ?? MOCKED.REVENUE.accumulated,
    avgTicket: m.averageTicket ?? MOCKED.REVENUE.avgTicket,
    byVertical: m.revenueByVertical && m.revenueByVertical.length ? m.revenueByVertical : MOCKED.REVENUE.byVertical,
  };
  if (m.paymentMethods && m.paymentMethods.length) {
    out.PAYMENT_METHODS = m.paymentMethods.map((p) => ({ ...p, accent: ACCENT_BY_METHOD[p.key] || "#3b82f6" }));
  }
  return out;
}

export const billingService = {
  _mock: MOCK,

  async getDashboard() {
    if (!ON()) return MOCK;
    const payload = unwrap(await apiClient.get("/billing/dashboard"));
    const metrics = payload.metrics || {};
    return {
      ...MOCK,
      KPIS: payload.KPIS || MOCK.KPIS,
      INVOICES: normalizeInvoices(payload.INVOICES || payload.invoices || []),
      ...mapMetrics(metrics, MOCK), // RECEIVABLE / REVENUE / PAYMENT_METHODS reales
    };
  },

  // Alias semánticos (Fase 9).
  async getBilling() {
    return this.getList();
  },
  async getInvoice(id) {
    return this.getDetails(id);
  },

  async getStats() {
    if (!ON()) return MOCK.KPIS;
    return unwrap(await apiClient.get("/billing/dashboard")).KPIS || MOCK.KPIS;
  },

  async getList() {
    if (!ON()) return MOCK.INVOICES;
    return normalizeInvoices(unwrap(await apiClient.get("/billing")) || []);
  },

  async getDetails(id) {
    if (!ON()) return MOCK.INVOICES.find((i) => i._id === id) || null;
    return normalizeInvoice(unwrap(await apiClient.get(`/billing/${id}`)));
  },

  // ── Mutaciones (emiten eventos en el EventBus) ──
  async createInvoice(payload) {
    const data = normalizeInvoice(unwrap(await apiClient.post("/billing/", payload)));
    eventBus.emit(OS_EVENTS.invoiceCreated, data);
    return data;
  },

  async updateInvoice(id, payload) {
    const data = normalizeInvoice(unwrap(await apiClient.put(`/billing/${id}`, payload)));
    eventBus.emit(OS_EVENTS.invoiceUpdated, data);
    return data;
  },

  async deleteInvoice(id) {
    await apiClient.delete(`/billing/${id}`);
    eventBus.emit(OS_EVENTS.invoiceDeleted, { id });
    return true;
  },

  async payInvoice(id, paymentMethod, paidDate) {
    const data = normalizeInvoice(unwrap(await apiClient.post(`/billing/${id}/pay`, { paymentMethod, paidDate })));
    eventBus.emit(OS_EVENTS.invoicePaid, data);
    return data;
  },
};

export default billingService;
