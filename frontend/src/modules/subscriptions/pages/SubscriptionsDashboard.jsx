import React from "react";
import { Receipt, Wallet, RefreshCw, TrendingDown, ArrowUpCircle, LifeBuoy } from "lucide-react";
import { RevenueChart, CasesChart, ConversionChart } from "@/shared/charts";
import { OperationsCenter } from "@/modules/admin/components/OperationsCenter";
import { MRRMetrics } from "../components/MRRMetrics";
import { SubscriptionPlans } from "../components/SubscriptionPlans";
import { ActiveSubscriptions } from "../components/ActiveSubscriptions";
import { BillingCenter } from "../components/BillingCenter";
import { RenewalPanel } from "../components/RenewalPanel";
import { useSubscriptions } from "@/hooks/os";

export function SubscriptionsDashboard() {
  const { data } = useSubscriptions();
  const {
    KPIS, SUBSCRIPTIONS, INVOICES, RENEWALS, UPGRADE_CANDIDATES, OPERATIONS,
    MRR_BY_MONTH, ARR_BY_VERTICAL, CLIENTS_BY_PLAN, RENEWALS_BY_MONTH,
  } = data;
  const ops = [
    { key: "overdue", label: "Facturas vencidas", count: OPERATIONS.overdueInvoices, icon: Receipt, accent: "#ef4444", to: "/admin/billing", tone: "alert" },
    { key: "pending", label: "Cobros pendientes", count: OPERATIONS.pendingPayments, icon: Wallet, accent: "#f59e0b", to: "/admin/billing" },
    { key: "renewals", label: "Renovaciones próximas", count: OPERATIONS.upcomingRenewals, icon: RefreshCw, accent: "#f97316", to: "/admin/subscriptions" },
    { key: "churn", label: "Churn en riesgo", count: OPERATIONS.churnRisk, icon: TrendingDown, accent: "#ef4444", to: "/admin/subscriptions", tone: "alert" },
    { key: "upgrades", label: "Upgrades pendientes", count: OPERATIONS.pendingUpgrades, icon: ArrowUpCircle, accent: "#10b981", to: "/admin/subscriptions" },
    { key: "tickets", label: "Tickets financieros", count: OPERATIONS.financeTickets, icon: LifeBuoy, accent: "#8b5cf6", to: "/admin/analytics" },
  ];

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-[#f59e0b]/30 bg-[#f59e0b]/[0.06] px-4 py-2.5 text-xs text-[#f59e0b]">
        Módulo Suscripciones y Facturación · datos de demostración (sin backend conectado).
      </div>

      {/* KPIs ejecutivos */}
      <section><MRRMetrics data={KPIS} /></section>

      {/* Centro de Operaciones */}
      <section>
        <h2 className="text-sm uppercase tracking-wider text-white/50 font-semibold mb-3">Centro de Operaciones · Facturación</h2>
        <OperationsCenter items={ops} />
      </section>

      {/* Planes SaaS */}
      <section>
        <h2 className="text-sm uppercase tracking-wider text-white/50 font-semibold mb-3">Planes SaaS por vertical</h2>
        <SubscriptionPlans />
      </section>

      {/* Analítica SaaS */}
      <section>
        <h2 className="text-sm uppercase tracking-wider text-white/50 font-semibold mb-3">Analítica SaaS</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <RevenueChart data={MRR_BY_MONTH} title="MRR por mes (millones COP)" />
          <CasesChart data={ARR_BY_VERTICAL} title="ARR por vertical (millones COP)" />
          <CasesChart data={CLIENTS_BY_PLAN} title="Clientes por plan" />
          <ConversionChart data={RENEWALS_BY_MONTH} title="Tasa de renovación (%)" />
        </div>
      </section>

      {/* Suscripciones activas */}
      <section>
        <h2 className="text-sm uppercase tracking-wider text-white/50 font-semibold mb-3">Suscripciones activas</h2>
        <ActiveSubscriptions data={SUBSCRIPTIONS} />
      </section>

      {/* Billing Center */}
      <section>
        <h2 className="text-sm uppercase tracking-wider text-white/50 font-semibold mb-3">Billing Center</h2>
        <BillingCenter invoices={INVOICES} />
      </section>

      {/* Renovaciones */}
      <section>
        <h2 className="text-sm uppercase tracking-wider text-white/50 font-semibold mb-3">Renovaciones</h2>
        <RenewalPanel renewals={RENEWALS} upgrades={UPGRADE_CANDIDATES} />
      </section>
    </div>
  );
}

export default SubscriptionsDashboard;
