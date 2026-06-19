import React from "react";
import { Rocket, User, CalendarClock } from "lucide-react";
import { StatusBadge, EmptyState } from "@/shared/components";

/**
 * Go Live Center — próximos Go Live con responsable, fecha y estado.
 * props.items: [{ company, owner, date, status }]
 *   status: tono de StatusBadge (normal | atencion | riesgo | critico)
 */
const STATUS_LABEL = { normal: "En curso", atencion: "Atención", riesgo: "En riesgo", critico: "Crítico" };

export function GoLivePanel({ items = [] }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-[#ec4899]/10 border border-[#ec4899]/30 flex items-center justify-center">
          <Rocket className="w-4 h-4 text-[#ec4899]" />
        </div>
        <h3 className="text-sm font-semibold text-white">Próximos Go Live</h3>
      </div>

      {items.length === 0 ? (
        <EmptyState icon={Rocket} title="Sin Go Live programados" className="border-0 bg-transparent py-8" />
      ) : (
        <ul className="divide-y divide-white/5">
          {items.map((g) => (
            <li key={g.id || g.company} className="py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-white truncate">{g.company}</div>
                <div className="flex items-center gap-3 text-[11px] text-white/40 mt-0.5">
                  <span className="inline-flex items-center gap-1"><User className="w-3 h-3" /> {g.owner}</span>
                  <span className="inline-flex items-center gap-1"><CalendarClock className="w-3 h-3" /> {g.date}</span>
                </div>
              </div>
              <StatusBadge tone={g.status} label={STATUS_LABEL[g.status]} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default GoLivePanel;
