// Normaliza la respuesta del backend de Analytics al shape EXACTO que consumen
// AnalyticsDashboard / KpiOverview / ExecutiveInsights / VerticalPerformance /
// RevenueAnalytics / GrowthCenter. No modifica componentes.
import { mapVertical } from "@/utils/mappers";

const M = (v) => Math.round((Number(v) || 0) / 1_000_000); // COP → millones
const FUNNEL_COLORS = ["#3b82f6", "#6366f1", "#8b5cf6", "#f97316", "#10b981"];

export function normalizeAnalyticsDashboard(payload = {}) {
  const metrics = payload.metrics || {};
  const revenue = payload.revenue || {};
  const growth = payload.growth || {};
  const insights = payload.insights || {};
  const funnel = payload.funnel || {};
  const verticals = Array.isArray(payload.verticals) ? payload.verticals : [];
  const operations = payload.operations || {};

  return {
    // KpiOverview
    KPIS: {
      activeOrgs: metrics.totalOrganizations ?? 0,
      mrr: metrics.MRR ?? 0,
      arr: metrics.ARR ?? 0,
      totalBilled: metrics.totalRevenue ?? 0,
      activeImplementations: metrics.totalImplementations ?? 0,
      globalConversion: metrics.conversionRate ?? 0,
    },
    // VerticalPerformance
    VERTICALS: verticals.map((v) => ({
      name: mapVertical(v.name),
      clients: v.organizations ?? 0,
      revenue: M(v.revenue),
      conversions: v.conversionRate ?? 0,
      implementations: v.implementations ?? 0,
      growth: v.growth ?? 0,
      risk: v.health === "riesgo" ? "urgente" : "baja",
      status: v.health === "riesgo" ? "riesgo" : "normal",
    })),
    // ExecutiveInsights
    INSIGHTS: {
      bestVertical: insights.topRevenueVertical || "—",
      fastestGrowing: insights.fastestGrowingVertical || "—",
      topRevenue: insights.topRevenueVertical || "—",
      topConversion: insights.bestConversionVertical || "—",
      risks: insights.risks || [],
      opportunities: insights.opportunities || [],
    },
    // RevenueAnalytics
    REVENUE: {
      mrr: revenue.MRR ?? 0,
      arr: revenue.ARR ?? 0,
      monthlyBilling: revenue.monthlyRevenue ?? 0,
      accumulated: revenue.totalRevenue ?? 0,
      avgTicket: revenue.averageTicket ?? 0,
    },
    // GrowthCenter
    GROWTH: {
      newOrgs: growth.newOrganizations ?? 0,
      newPartners: growth.newPartners ?? 0,
      newImplementations: growth.newImplementations ?? 0,
      newSubscriptions: growth.newSubscriptions ?? 0,
      trend: growth.growthTrend || [],
    },
    // Centro de Operaciones
    OPERATIONS: {
      newOrgs: operations.newOrgs ?? 0,
      newPartners: operations.newPartners ?? 0,
      pendingImplementations: operations.pendingImplementations ?? 0,
      upcomingRenewals: operations.upcomingRenewals ?? 0,
      overdueInvoices: operations.overdueInvoices ?? 0,
      detectedRisks: operations.detectedRisks ?? 0,
    },
    // Gráficos
    REVENUE_BY_VERTICAL: (revenue.revenueByVertical || []).map((r, i) => ({
      label: mapVertical(r.label), value: M(r.value), color: FUNNEL_COLORS[i % FUNNEL_COLORS.length],
    })),
    GLOBAL_CONVERSION: (funnel.stages || []).map((s) => ({ label: s.label, value: s.conversionPercentage ?? 0 })),
    MONTHLY_GROWTH: growth.growthTrend || [],
    FULL_FUNNEL: (funnel.stages || []).map((s, i) => ({
      label: s.label, value: s.value ?? 0, color: FUNNEL_COLORS[i % FUNNEL_COLORS.length],
    })),
  };
}

export default normalizeAnalyticsDashboard;
