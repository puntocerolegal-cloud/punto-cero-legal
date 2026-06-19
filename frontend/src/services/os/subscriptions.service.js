// Servicio de Suscripciones — Punto Cero OS.
import * as mock from "@/modules/subscriptions/mockData";
import { apiClient } from "@/config/api/apiClient";
import { isApiEnabled } from "@/config/api/features";
import { normalizeSubscription, normalizeSubscriptions } from "@/utils/normalizers";
import { eventBus, OS_EVENTS } from "@/core/events/eventBus";

// Desempaqueta la respuesta estándar { success, data, message, errors }.
function unwrap(res) {
  const body = res?.data;
  if (body && typeof body === "object" && "success" in body && "data" in body) return body.data;
  return body;
}

const MOCK = {
  KPIS: mock.KPIS,
  PLANS: mock.PLANS,
  VERTICALS: mock.VERTICALS,
  SUBSCRIPTIONS: mock.SUBSCRIPTIONS,
  INVOICES: mock.INVOICES,
  RENEWALS: mock.RENEWALS,
  UPGRADE_CANDIDATES: mock.UPGRADE_CANDIDATES,
  OPERATIONS: mock.OPERATIONS,
  MRR_BY_MONTH: mock.MRR_BY_MONTH,
  ARR_BY_VERTICAL: mock.ARR_BY_VERTICAL,
  CLIENTS_BY_PLAN: mock.CLIENTS_BY_PLAN,
  RENEWALS_BY_MONTH: mock.RENEWALS_BY_MONTH,
};

const ON = () => isApiEnabled("ENABLE_SUBSCRIPTIONS_API");

export const subscriptionsService = {
  _mock: MOCK,

  async getDashboard() {
    if (!ON()) return MOCK;
    const payload = unwrap(await apiClient.get("/subscriptions/dashboard"));
    // Conserva del mock planes/series/INVOICES/RENEWALS (aún no servidos);
    // reemplaza con datos reales SUBSCRIPTIONS y KPIS (MRR/ARR/churn).
    return {
      ...MOCK,
      ...payload,
      SUBSCRIPTIONS: normalizeSubscriptions(payload.SUBSCRIPTIONS || payload.subscriptions || []),
    };
  },

  async getSubscriptions() {
    return this.getList();
  },

  async getStats() {
    if (!ON()) return MOCK.KPIS;
    return unwrap(await apiClient.get("/subscriptions/dashboard")).KPIS || MOCK.KPIS;
  },

  async getList() {
    if (!ON()) return MOCK.SUBSCRIPTIONS;
    return normalizeSubscriptions(unwrap(await apiClient.get("/subscriptions")) || []);
  },

  async getSubscription(id) {
    return this.getDetails(id);
  },

  async getDetails(id) {
    if (!ON()) return MOCK.SUBSCRIPTIONS.find((s) => s._id === id) || null;
    return normalizeSubscription(unwrap(await apiClient.get(`/subscriptions/${id}`)));
  },

  // ── Mutaciones (emiten eventos en el EventBus) ──
  async create(payload) {
    const data = normalizeSubscription(unwrap(await apiClient.post("/subscriptions/", payload)));
    eventBus.emit(OS_EVENTS.subscriptionCreated, data);
    return data;
  },

  async update(id, payload) {
    const prevStatus = payload?._prevStatus;
    const data = normalizeSubscription(unwrap(await apiClient.put(`/subscriptions/${id}`, payload)));
    eventBus.emit(OS_EVENTS.subscriptionUpdated, data);
    if (payload?.status && prevStatus && payload.status !== prevStatus) {
      eventBus.emit(OS_EVENTS.subscriptionStatusChanged, data);
    }
    return data;
  },

  async remove(id) {
    await apiClient.delete(`/subscriptions/${id}`);
    eventBus.emit(OS_EVENTS.subscriptionDeleted, { id });
    return true;
  },

  async renewSubscription(id, renewalDate) {
    const data = normalizeSubscription(unwrap(await apiClient.post(`/subscriptions/${id}/renew`, { renewalDate })));
    eventBus.emit(OS_EVENTS.subscriptionRenewed, data);
    return data;
  },
};

export default subscriptionsService;
