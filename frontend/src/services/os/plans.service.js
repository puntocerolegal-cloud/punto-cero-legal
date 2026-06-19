// Servicio del Motor de Planes (multimoneda) — Punto Cero System OS.
// Moneda base USD. Hoy devuelve mock; con ENABLE_PLANS_API activo (y
// ENABLE_MOCKS=false) consume apiClient. La UI no cambia.
import * as mock from "@/modules/plans/mockData";
import { apiClient } from "@/config/api/apiClient";
import { isApiEnabled } from "@/config/api/features";

function unwrap(res) {
  const body = res?.data;
  if (body && typeof body === "object" && "success" in body && "data" in body) return body.data;
  return body;
}

const FLAG = "ENABLE_PLANS_API";

const MOCK = {
  KPIS: mock.KPIS,
  PLANS: mock.PLANS,
  OPERATIONS: mock.OPERATIONS,
  CURRENCIES: mock.CURRENCIES,
  DEFAULT_CURRENCY_CODE: mock.DEFAULT_CURRENCY_CODE,
  ORGANIZATION_LOCALE_EXAMPLE: mock.ORGANIZATION_LOCALE_EXAMPLE,
  REVENUE_BY_PLAN: mock.REVENUE_BY_PLAN,
  ORGS_BY_PLAN: mock.ORGS_BY_PLAN,
};

export const plansService = {
  _mock: MOCK,

  async getDashboard() {
    if (!isApiEnabled(FLAG)) return MOCK;
    const payload = unwrap(await apiClient.get("/plans/dashboard"));
    return {
      ...MOCK,
      ...payload,
      PLANS: payload.PLANS || payload.plans || MOCK.PLANS,
      CURRENCIES: payload.CURRENCIES || payload.currencies || MOCK.CURRENCIES,
    };
  },

  async getList() {
    if (!isApiEnabled(FLAG)) return MOCK.PLANS;
    return unwrap(await apiClient.get("/plans")) || [];
  },

  async getDetails(id) {
    if (!isApiEnabled(FLAG)) return MOCK.PLANS.find((p) => p._id === id) || null;
    return unwrap(await apiClient.get(`/plans/${id}`));
  },

  // ── Catálogo de monedas (tabla maestra `currencies`) ──
  async getCurrencies() {
    if (!isApiEnabled(FLAG)) return MOCK.CURRENCIES;
    return unwrap(await apiClient.get("/currencies")) || MOCK.CURRENCIES;
  },

  async create(payload) {
    if (!isApiEnabled(FLAG)) return { ...payload };
    return unwrap(await apiClient.post("/plans", payload));
  },

  async update(id, payload) {
    if (!isApiEnabled(FLAG)) return { _id: id, ...payload };
    return unwrap(await apiClient.put(`/plans/${id}`, payload));
  },

  async duplicate(id) {
    if (!isApiEnabled(FLAG)) return { _id: id, duplicated: true };
    return unwrap(await apiClient.post(`/plans/${id}/duplicate`, {}));
  },

  async setStatus(id, status) {
    if (!isApiEnabled(FLAG)) return { _id: id, status };
    return unwrap(await apiClient.patch(`/plans/${id}/status`, { status }));
  },
  activate(id) { return this.setStatus(id, "ACTIVO"); },
  deactivate(id) { return this.setStatus(id, "INACTIVO"); },
};

export default plansService;
