import React from "react";
import { Building2, Handshake, Rocket, RefreshCw, Receipt, AlertTriangle } from "lucide-react";
import { RevenueChart, CasesChart, ConversionChart, FunnelChart } from "@/shared/charts";
import { OperationsCenter } from "@/modules/admin/components/OperationsCenter";
import { KpiOverview } from "../components/KpiOverview";
import { ExecutiveInsights } from "../components/ExecutiveInsights";
import { VerticalPerformance } from "../components/VerticalPerformance";
import { RevenueAnalytics } from "../components/RevenueAnalytics";
import { GrowthCenter } from "../components/GrowthCenter";
import { useAnalytics } from "@/hooks/os";

export function AnalyticsDashboard() {
  const { data } = useAnalytics();
  const {
    KPIS, VERTICALS, INSIGHTS, REVENUE, GROWTH, OPERATIONS,
    REVENUE_BY_VERTICAL, GLOBAL_CONVERSION, MONTHLY_GROWTH, FULL_FUNNEL,
  } = data;
  const ops = [
    { key: "orgs", label: "Nuevas organizaciones", count: OPERATIONS.newOrgs, icon: Building2, accent: "#3b82f6", to: "/admin/organizations" },
    { key: "partners", label: "Nuevos partners", count: OPERATIONS.newPartners, icon: Handshake, accent: "#ec4899", to: "/admin/partners" },
    { key: "impl", label: "Implementaciones pendientes", count: OPERATIONS.pendingImplementations, icon: Rocket, accent: "#f97316", to: "/admin/implementations" },
    { key: "renewals", label: "Renovaciones próximas", count: OPERATIONS.upcomingRenewals, icon: RefreshCw, accent: "#10b981", to: "/admin/subscriptions" },
    { key: "overdue", label: "Facturas vencidas", count: OPERATIONS.overdueInvoices, icon: Receipt, accent: "#ef4444", to: "/admin/billing", tone: "alert" },
    { key: "risks", label: "Riesgos detectados", count: OPERATIONS.detectedRisks, icon: AlertTriangle, accent: "#ef4444", to: "/admin/organizations", tone: "alert" },
  ];

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-[#8b5cf6]/30 bg-[#8b5cf6]/[0.06] px-4 py-2.5 text-xs text-[#c4b5fd]">
        Centro de inteligencia de negocio · consolida Organizaciones · Socios · Implementaciones · Suscripciones · Facturación · datos de demostración.
      </div>

      {/* 1. KPIs */}
      <section><KpiOverview data={KPIS} /></section>

      {/* 2. Centro de Operaciones */}
      <section>
        <h2 className="text-sm uppercase tracking-wider text-white/50 font-semibold mb-3">Centro de Operaciones · Global</h2>
        <OperationsCenter items={ops} />
      </section>

      {/* 3. Executive Insights */}
      <section>
        <h2 className="text-sm uppercase tracking-wider text-white/50 font-semibold mb-3">Executive Insights</h2>
        <ExecutiveInsights data={INSIGHTS} />
      </section>

      {/* 4. Performance por vertical */}
      <section>
        <h2 className="text-sm uppercase tracking-wider text-white/50 font-semibold mb-3">Performance por vertical</h2>
        <VerticalPerformance data={VERTICALS} />
      </section>

      {/* 5. Revenue Analytics */}
      <section>
        <h2 className="text-sm uppercase tracking-wider text-white/50 font-semibold mb-3">Analítica de ingresos</h2>
        <RevenueAnalytics data={REVENUE} />
      </section>

      {/* 6. Growth Center */}
      <section>
        <h2 className="text-sm uppercase tracking-wider text-white/50 font-semibold mb-3">Centro de Crecimiento</h2>
        <GrowthCenter data={GROWTH} />
      </section>

      {/* 7. Analítica visual */}
      <section>
        <h2 className="text-sm uppercase tracking-wider text-white/50 font-semibold mb-3">Analítica visual</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <CasesChart data={REVENUE_BY_VERTICAL} title="Ingresos por vertical (millones COP)" />
          <ConversionChart data={GLOBAL_CONVERSION} title="Conversión global (%)" />
          <RevenueChart data={MONTHLY_GROWTH} title="Crecimiento mensual (MRR, millones COP)" />
          <FunnelChart data={FULL_FUNNEL} title="Embudo completo · Lead → Productivo" />
        </div>
      </section>
    </div>
  );
}

export default AnalyticsDashboard;
