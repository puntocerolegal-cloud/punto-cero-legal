import React from "react";
import { Wallet, TrendingUp, Crown } from "lucide-react";
import { MetricCard } from "@/shared/components";

const money = (v) => `$${Number(v || 0).toLocaleString("es-CO")}`;

/**
 * Panel ejecutivo de comisiones — Punto Cero OS (Partners).
 * props.data: { month, accumulated, projection, top: [{company, amount}] }
 */
export function CommissionSummary({ data }) {
  const d = data || {};
  const top = d.top || [];
  const maxAmount = top.reduce((m, t) => Math.max(m, t.amount || 0), 0) || 1;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard title="Comisión del mes" value={money(d.month)} icon={Wallet} accent="#10b981" />
        <MetricCard title="Comisión acumulada" value={money(d.accumulated)} icon={Crown} accent="#f97316" />
        <MetricCard title="Proyección mensual" value={money(d.projection)} icon={TrendingUp} accent="#3b82f6" subtitle="estimado" />
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-5">
        <h3 className="text-sm uppercase tracking-wider text-white/50 font-semibold mb-4">Partners con mayor facturación</h3>
        <ul className="space-y-3">
          {top.map((t, i) => (
            <li key={t.company} className="flex items-center gap-3">
              <span className="text-xs font-bold text-white/40 w-4">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white truncate">{t.company}</span>
                  <span className="font-semibold text-[#10b981] whitespace-nowrap ml-2">{money(t.amount)}</span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-[#f97316] to-[#10b981]" style={{ width: `${(t.amount / maxAmount) * 100}%` }} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default CommissionSummary;
