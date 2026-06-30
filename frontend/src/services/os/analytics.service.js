// Servicio de Analytics — Punto Cero OS (solo lectura, consolidado).
import * as mock from "@/modules/analytics/mockData";
import { apiClient } from "@/config/api/apiClient";
import { isApiEnabled } from "@/config/api/features";
import { normalizeAnalyticsDashboard } from "@/utils/normalizers";
import { unwrap } from "@/lib/httpUnwrap";

const MOCK = {
  KPIS: mock.KPIS,
  VERTICALS: mock.VERTICALS,
  INSIGHTS: mock.INSIGHTS,
  REVENUE: mock.REVENUE,
  GROWTH: mock.GROWTH,
  OPERATIONS: mock.OPERATIONS,
  REVENUE_BY_VERTICAL: mock.REVENUE_BY_VERTICAL,
  GLOBAL_CONVERSION: mock.GLOBAL_CONVERSION,
  MONTHLY_GROWTH: mock.MONTHLY_GROWTH,
  FULL_FUNNEL: mock.FULL_FUNNEL,
};

const ON = () => isApiEnabled("ENABLE_ANALYTICS_API");

export const analyticsService = {
  _mock: MOCK,

  // Reemplaza COMPLETAMENTE los mocks con datos reales consolidados.
  async getDashboard() {
    if (!ON()) return MOCK;
    return normalizeAnalyticsDashboard(unwrap(await apiClient.get("/analytics/dashboard")));
  },

  async getKpis() {
    if (!ON()) return MOCK.KPIS;
    // Reutiliza el normalizer del dashboard para mantener el shape de KpiOverview.
    return normalizeAnalyticsDashboard({ metrics: unwrap(await apiClient.get("/analytics/kpis")) }).KPIS;
  },

  async getRevenue() {
    if (!ON()) return MOCK.REVENUE;
    return normalizeAnalyticsDashboard({ revenue: unwrap(await apiClient.get("/analytics/revenue")) }).REVENUE;
  },

  async getGrowth() {
    if (!ON()) return MOCK.GROWTH;
    return normalizeAnalyticsDashboard({ growth: unwrap(await apiClient.get("/analytics/growth")) }).GROWTH;
  },

  async getFunnel() {
    if (!ON()) return MOCK.FULL_FUNNEL;
    return normalizeAnalyticsDashboard({ funnel: unwrap(await apiClient.get("/analytics/funnel")) }).FULL_FUNNEL;
  },

  async getVerticals() {
    if (!ON()) return MOCK.VERTICALS;
    return normalizeAnalyticsDashboard({ verticals: unwrap(await apiClient.get("/analytics/verticals")) }).VERTICALS;
  },

  async getInsights() {
    if (!ON()) return MOCK.INSIGHTS;
    return normalizeAnalyticsDashboard({ insights: unwrap(await apiClient.get("/analytics/insights")) }).INSIGHTS;
  },

  // Compatibilidad con el patrón previo.
  async getStats() {
    return this.getKpis();
  },
  async getList() {
    return this.getVerticals();
  },
  async getDetails() {
    return null;
  },
};

export default analyticsService;
