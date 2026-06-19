import React from "react";
import { CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { CHECKLISTS } from "../mockData";

/**
 * Checklist por vertical con porcentaje completado.
 * props:
 *  - vertical: "Medicina" | "Odontología" | "Jurídico"
 *  - done: nº de ítems completados (los primeros `done` se marcan)
 *  - accent
 */
export function VerticalChecklist({ vertical, done = 0, accent = "#10b981", className }) {
  const items = CHECKLISTS[vertical] || [];
  const total = items.length || 1;
  const completed = Math.max(0, Math.min(items.length, done));
  const pct = Math.round((completed / total) * 100);

  return (
    <div className={cn("rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-5", className)}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-white">{vertical}</h3>
        <span className="text-xs font-semibold" style={{ color: accent }}>{pct}%</span>
      </div>

      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden mb-4">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: accent }} />
      </div>

      <ul className="space-y-2">
        {items.map((label, i) => {
          const ok = i < completed;
          return (
            <li key={label} className="flex items-center gap-2 text-sm">
              {ok
                ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: accent }} />
                : <Circle className="w-4 h-4 text-white/25 flex-shrink-0" />}
              <span className={ok ? "text-white/80" : "text-white/40"}>{label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default VerticalChecklist;
