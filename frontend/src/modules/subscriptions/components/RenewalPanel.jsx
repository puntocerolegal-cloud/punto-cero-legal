import React from "react";
import { RefreshCw, CalendarClock, ArrowUpCircle } from "lucide-react";
import { StatusBadge, EmptyState } from "@/shared/components";

const money = (v) => `$${Number(v || 0).toLocaleString("es-CO")}`;

/**
 * Panel de Renovaciones — próximas renovaciones, riesgo de cancelación,
 * vencimientos y upgrades potenciales.
 * props: renewals: [{ company, date, monthly, risk, note }], upgrades: [string]
 */
export function RenewalPanel({ renewals = [], upgrades = [] }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-[#f97316]/10 border border-[#f97316]/30 flex items-center justify-center">
            <RefreshCw className="w-4 h-4 text-[#f97316]" />
          </div>
          <h3 className="text-sm font-semibold text-white">Próximas renovaciones</h3>
        </div>
        {renewals.length === 0 ? (
          <EmptyState icon={CalendarClock} title="Sin renovaciones próximas" className="border-0 bg-transparent py-8" />
        ) : (
          <ul className="divide-y divide-white/5">
            {renewals.map((r) => (
              <li key={r.id || r.company} className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-white truncate">{r.company}</div>
                  <div className="flex items-center gap-3 text-[11px] text-white/40 mt-0.5">
                    <span className="inline-flex items-center gap-1"><CalendarClock className="w-3 h-3" /> {r.date}</span>
                    <span>{money(r.monthly)}/mes</span>
                    {r.note && <span className="text-white/30">· {r.note}</span>}
                  </div>
                </div>
                <StatusBadge tone={r.risk} />
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-[#10b981]/10 border border-[#10b981]/30 flex items-center justify-center">
            <ArrowUpCircle className="w-4 h-4 text-[#10b981]" />
          </div>
          <h3 className="text-sm font-semibold text-white">Upgrades potenciales</h3>
        </div>
        {upgrades.length === 0 ? (
          <EmptyState icon={ArrowUpCircle} title="Sin candidatos" className="border-0 bg-transparent py-8" />
        ) : (
          <ul className="space-y-2">
            {upgrades.map((u) => (
              <li key={u} className="flex items-center gap-2 text-sm text-white/80">
                <ArrowUpCircle className="w-4 h-4 text-[#10b981] flex-shrink-0" /> {u}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default RenewalPanel;
