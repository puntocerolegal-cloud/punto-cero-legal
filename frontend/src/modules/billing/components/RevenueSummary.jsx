import React from "react";
import { Wallet, TrendingUp, Receipt } from "lucide-react";
import { MetricCard } from "@/shared/components";

const money = (v) => `$${Number(v || 0).toLocaleString("es-CO")}`;

/**
 * Recaudo y resumen financiero — recaudo del mes, acumulado, ticket promedio,
 * e ingreso por vertical (barras). Reutiliza MetricCard.
 * props.data: { monthCollection, accumulated, avgTicket, byVertical: [{label,value}] }
 */
export function RevenueSummary({ data }) {
  const d = data || {};
  const byVertical = d.byVertical || [];
  const totalPct = byVertical.reduce((s, v) => s + (v.value || 0), 0) || 1;
  const palette = ["#10b981", "#3b82f6", "#f97316", "#8b5cf6"];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard title="Recaudo del mes" value={money(d.monthCollection)} icon={Wallet} accent="#10b981" />
        <MetricCard title="Recaudo acumulado" value={money(d.accumulated)} icon={TrendingUp} accent="#f97316" />
        <MetricCard title="Ticket promedio" value={money(d.avgTicket)} icon={Receipt} accent="#3b82f6" />
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-5">
        <h3 className="text-sm uppercase tracking-wider text-white/50 font-semibold mb-4">Ingreso por vertical</h3>
        <ul className="space-y-3">
          {byVertical.map((v, i) => {
            const pct = Math.round((v.value / totalPct) * 100);
            const accent = palette[i % palette.length];
            return (
              <li key={v.label}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-white/70">{v.label}</span>
                  <span className="font-semibold text-white">{pct}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: accent }} />
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export default RevenueSummary;
