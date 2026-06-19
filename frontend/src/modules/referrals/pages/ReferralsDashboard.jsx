import React from "react";
import { UserPlus, TrendingUp, Gift, MousePointerClick } from "lucide-react";
import { MetricCard } from "@/shared/components";
import { CasesChart } from "@/shared/charts";
import { OperationsCenter } from "@/modules/admin/components/OperationsCenter";
import { ReferralShareCard } from "../components/ReferralShareCard";
import { ReferralDirectory } from "../components/ReferralDirectory";
import { ReferralTimeline } from "../components/ReferralTimeline";
import { useReferrals } from "@/hooks/os";

const n = (v) => Number(v || 0).toLocaleString("es-CO");

/** Dashboard del Motor de Referidos — Punto Cero System OS. */
export function ReferralsDashboard() {
  const { data } = useReferrals();
  const { KPIS, OPERATIONS, REFERRALS, TIMELINE, MY_REFERRAL, REFERRALS_BY_STATUS } = data;

  const ops = [
    { key: "registered", label: "Referidos registrados", count: OPERATIONS.registered, icon: UserPlus, accent: "#3b82f6", to: "/admin/referrals" },
    { key: "converted", label: "Referidos convertidos", count: OPERATIONS.converted, icon: TrendingUp, accent: "#10b981", to: "/admin/referrals" },
    { key: "pending", label: "Pendientes de compra", count: OPERATIONS.pending, icon: MousePointerClick, accent: "#f59e0b", to: "/admin/referrals" },
    { key: "months", label: "Meses ganados", count: OPERATIONS.monthsEarned, icon: Gift, accent: "#f97316" },
  ];

  const metricCards = [
    { title: "Referidos registrados", value: n(KPIS.registered), icon: UserPlus, accent: "#3b82f6" },
    { title: "Referidos convertidos", value: n(KPIS.converted), icon: TrendingUp, accent: "#10b981" },
    { title: "Meses ganados", value: n(KPIS.monthsEarned), icon: Gift, accent: "#f97316" },
    { title: "Clicks en tu enlace", value: n(KPIS.clicks), icon: MousePointerClick, accent: "#8b5cf6" },
  ];

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-[#10b981]/30 bg-[#10b981]/[0.06] px-4 py-2.5 text-xs text-[#6ee7b7]">
        Motor de Referidos · gana 1 mes gratis por cada referido que compre en sus primeros 15 días (acumulable) · datos de demostración.
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((k) => <MetricCard key={k.title} {...k} />)}
      </section>

      <section>
        <h2 className="text-sm uppercase tracking-wider text-white/50 font-semibold mb-3">Centro de Operaciones · Referidos</h2>
        <OperationsCenter items={ops} />
      </section>

      <section>
        <h2 className="text-sm uppercase tracking-wider text-white/50 font-semibold mb-3">Tu invitación</h2>
        <ReferralShareCard code={MY_REFERRAL.code} />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-sm uppercase tracking-wider text-white/50 font-semibold">Referidos</h2>
          <ReferralDirectory data={REFERRALS} />
          <CasesChart data={REFERRALS_BY_STATUS} title="Referidos por estado" />
        </div>
        <div className="space-y-3">
          <h2 className="text-sm uppercase tracking-wider text-white/50 font-semibold">Actividad · Timeline</h2>
          <ReferralTimeline items={TIMELINE} />
        </div>
      </section>
    </div>
  );
}

export default ReferralsDashboard;
