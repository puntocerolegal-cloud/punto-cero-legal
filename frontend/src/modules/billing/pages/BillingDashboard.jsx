import React from "react";
import {
  DollarSign, FileText, CheckCircle2, AlertTriangle, Wallet, Banknote,
  CalendarCheck, Flame, FileSearch,
} from "lucide-react";
import { MetricCard } from "@/shared/components";
import { RevenueChart, ConversionChart, CasesChart } from "@/shared/charts";
import { OperationsCenter } from "@/modules/admin/components/OperationsCenter";
import { InvoiceTable } from "../components/InvoiceTable";
import { AccountsReceivable } from "../components/AccountsReceivable";
import { RevenueSummary } from "../components/RevenueSummary";
import { PaymentMethods } from "../components/PaymentMethods";
import { CollectionsCenter } from "../components/CollectionsCenter";
import { useBilling } from "@/hooks/os";
import { ConnectionState } from "@/modules/admin/components/ConnectionState";

const money = (v) => `$${Number(v || 0).toLocaleString("es-CO")}`;
const n = (v) => Number(v || 0).toLocaleString("es-CO");

export function BillingDashboard() {
  const { data, loading, error } = useBilling();
  const {
    KPIS, INVOICES, RECEIVABLE, REVENUE, PAYMENT_METHODS, COLLECTIONS, OPERATIONS,
    MONTHLY_BILLING, PAID_VS_PENDING, BILLING_BY_VERTICAL,
  } = data;

  // Manejadores de estado (datos reales de Mongo): Cargando / Error / Estado Cero.
  const isEmpty = !(INVOICES && INVOICES.length);
  if (loading || error || isEmpty) {
    return <ConnectionState loading={loading} error={error} empty={isEmpty} title="Facturación Global" />;
  }
  const kpis = [
    { title: "Facturación total", value: money(KPIS.totalBilled), icon: DollarSign, accent: "#10b981" },
    { title: "Facturas emitidas", value: n(KPIS.issued), icon: FileText, accent: "#3b82f6" },
    { title: "Facturas pagadas", value: n(KPIS.paid), icon: CheckCircle2, accent: "#10b981" },
    { title: "Facturas vencidas", value: n(KPIS.overdue), icon: AlertTriangle, accent: "#ef4444" },
    { title: "Cuentas por cobrar", value: money(KPIS.accountsReceivable), icon: Wallet, accent: "#f97316" },
    { title: "Recaudo mensual", value: money(KPIS.monthlyCollection), icon: Banknote, accent: "#8b5cf6" },
  ];

  const ops = [
    { key: "pending", label: "Facturas pendientes", count: OPERATIONS.pendingInvoices, icon: FileText, accent: "#f59e0b", to: "/admin/billing" },
    { key: "overdue", label: "Facturas vencidas", count: OPERATIONS.overdueInvoices, icon: AlertTriangle, accent: "#ef4444", to: "/admin/billing", tone: "alert" },
    { key: "scheduled", label: "Cobros programados", count: OPERATIONS.scheduledCollections, icon: CalendarCheck, accent: "#3b82f6", to: "/admin/billing" },
    { key: "daily", label: "Recaudo del día", count: OPERATIONS.dailyCollection, icon: Banknote, accent: "#10b981", to: "/admin/billing" },
    { key: "critical", label: "Casos críticos", count: OPERATIONS.criticalCases, icon: Flame, accent: "#ec4899", to: "/admin/billing", tone: "alert" },
    { key: "review", label: "Pagos en revisión", count: OPERATIONS.paymentsInReview, icon: FileSearch, accent: "#8b5cf6", to: "/admin/billing" },
  ];

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-[#10b981]/30 bg-[#10b981]/[0.06] px-4 py-2.5 text-xs text-[#6ee7b7]">
        Centro financiero unificado · consolida Suscripciones · Implementaciones · Organizaciones · datos de demostración (sin backend conectado).
      </div>

      {/* KPIs */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((k) => <MetricCard key={k.title} {...k} />)}
      </section>

      {/* Centro de Operaciones */}
      <section>
        <h2 className="text-sm uppercase tracking-wider text-white/50 font-semibold mb-3">Centro de Operaciones · Financiero</h2>
        <OperationsCenter items={ops} />
      </section>

      {/* Recaudo + Cuentas por cobrar */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2"><RevenueSummary data={REVENUE} /></div>
        <AccountsReceivable total={RECEIVABLE.total} buckets={RECEIVABLE.buckets} />
      </section>

      {/* Analítica financiera */}
      <section>
        <h2 className="text-sm uppercase tracking-wider text-white/50 font-semibold mb-3">Analítica financiera</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <RevenueChart data={MONTHLY_BILLING} title="Facturación mensual (millones COP)" />
          <CasesChart data={PAID_VS_PENDING} title="Pagado vs Pendiente (millones COP)" />
          <CasesChart data={BILLING_BY_VERTICAL} title="Facturación por vertical (millones COP)" />
        </div>
      </section>

      {/* Métodos de pago */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PaymentMethods methods={PAYMENT_METHODS} />
        <ConversionChart
          data={[{ label: "Ene", value: 71 }, { label: "Feb", value: 74 }, { label: "Mar", value: 79 }, { label: "Abr", value: 77 }, { label: "May", value: 83 }, { label: "Jun", value: 86 }]}
          title="Efectividad de recaudo (%)"
        />
      </section>

      {/* Centro de Cobranza */}
      <section>
        <h2 className="text-sm uppercase tracking-wider text-white/50 font-semibold mb-3">Centro de Cobranza</h2>
        <CollectionsCenter data={COLLECTIONS} />
      </section>

      {/* Centro de Facturas */}
      <section>
        <h2 className="text-sm uppercase tracking-wider text-white/50 font-semibold mb-3">Centro de Facturas</h2>
        <InvoiceTable data={INVOICES} />
      </section>
    </div>
  );
}

export default BillingDashboard;
