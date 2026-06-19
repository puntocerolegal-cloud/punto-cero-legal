import React from "react";
import { CreditCard, CalendarRange, Gift, Receipt, Rocket, Sparkles } from "lucide-react";
import { MetricCard, StatusBadge, DataTable } from "@/shared/components";
import { useSubscriptionCenter } from "@/hooks/os";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { formatMoney } from "@/modules/plans/currency";

const STATE_TONE = {
  DEMO: "atencion", TRIAL: "pending", ACTIVO: "active",
  VENCIDO: "critico", PENDIENTE_PAGO: "riesgo", CANCELADO: "inactive",
};
const cop = (usd) => formatMoney(usd * 4000, "COP");

/** Centro de Suscripción — plan actual, estado, historial, facturas y beneficios. */
export function SubscriptionCenter() {
  const { data } = useSubscriptionCenter();
  const { access, subscription, startTrial, openUpgrade } = useSubscription();
  const plan = access.plan;

  const invoiceCols = [
    { key: "number", label: "Factura", render: (r) => <span className="font-mono text-xs text-white/80">{r.number}</span> },
    { key: "date", label: "Fecha", sortable: true },
    { key: "amountUsd", label: "Monto", sortable: true, render: (r) => cop(r.amountUsd) },
    { key: "status", label: "Estado", render: (r) => <StatusBadge tone={r.status === "pagada" ? "active" : "pending"} label={r.status === "pagada" ? "Pagada" : "Pendiente"} /> },
  ];

  const kpis = [
    { title: "Meses gratis", value: `${data.KPIS.freeMonths}`, icon: Gift, accent: "#f97316" },
    { title: "Facturas", value: `${data.KPIS.invoices}`, icon: Receipt, accent: "#8b5cf6" },
    { title: "Referidos", value: `${data.KPIS.referrals}`, icon: Sparkles, accent: "#3b82f6" },
    { title: "Beneficios activos", value: `${data.KPIS.benefits}`, icon: CreditCard, accent: "#10b981" },
  ];

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-[#3b82f6]/30 bg-[#3b82f6]/[0.06] px-4 py-2.5 text-xs text-[#93c5fd]">
        Centro de Suscripción · estado del cliente, plan, beneficios y meses gratis · datos de demostración.
      </div>

      {/* Plan actual */}
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-wider text-white/40">Plan actual</div>
            <div className="text-2xl font-bold text-white mt-1">{plan?.name || "—"}</div>
            <div className="flex items-center gap-3 mt-2">
              <StatusBadge tone={STATE_TONE[access.status] || "normal"} label={access.status} />
              {plan && <span className="text-sm text-white/60">{cop(plan.priceUsd)} /mes</span>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><div className="text-[10px] uppercase text-white/40">Inicio</div><div className="text-white/80">{subscription.startDate?.slice(0, 10)}</div></div>
            <div><div className="text-[10px] uppercase text-white/40">Expiración</div><div className="text-white/80">{subscription.endDate?.slice(0, 10)}</div></div>
            <div className="col-span-2 flex items-center gap-1 text-white/60"><CalendarRange className="w-4 h-4" /> {access.daysLeft != null ? `${access.daysLeft} días restantes` : "Sin vencimiento"}</div>
          </div>
          <div className="flex flex-col gap-2">
            <button onClick={startTrial} className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl border border-[#10b981]/40 bg-[#10b981]/10 text-[#10b981] text-sm font-bold"><Rocket className="w-4 h-4" /> Activar Trial</button>
            <button onClick={() => openUpgrade({ reason: "plan" })} className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#f97316] to-[#fb923c] text-white text-sm font-bold">Ver Planes</button>
          </div>
        </div>
      </section>

      {/* KPIs */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => <MetricCard key={k.title} {...k} />)}
      </section>

      {/* Beneficios */}
      <section>
        <h2 className="text-sm uppercase tracking-wider text-white/50 font-semibold mb-3">Beneficios y meses gratis</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {data.BENEFITS.map((b) => (
            <div key={b.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="text-[10px] uppercase tracking-wider text-white/40">{b.label}</div>
              <div className="text-lg font-bold text-white mt-1">{b.value}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Facturas */}
      <section>
        <h2 className="text-sm uppercase tracking-wider text-white/50 font-semibold mb-3">Facturas</h2>
        <DataTable columns={invoiceCols} data={data.INVOICES} searchable={false} pageSize={5} empty={{ title: "Sin facturas" }} />
      </section>

      {/* Historial */}
      <section>
        <h2 className="text-sm uppercase tracking-wider text-white/50 font-semibold mb-3">Historial</h2>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-3">
          {data.HISTORY.map((h) => (
            <div key={h.id} className="flex items-start gap-3">
              <div className="text-[11px] text-white/40 w-24 flex-shrink-0">{h.date}</div>
              <div><div className="text-sm text-white/80 font-medium">{h.event}</div><div className="text-xs text-white/50">{h.detail}</div></div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default SubscriptionCenter;
