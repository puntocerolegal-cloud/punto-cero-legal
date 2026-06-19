import React from "react";
import { Building2, User, CalendarClock, AlertTriangle, Lock } from "lucide-react";
import { PriorityBadge } from "@/shared/components";
import { ProjectProgress } from "./ProjectProgress";

/**
 * Tarjeta de proyecto de implementación — usada en el Kanban (Board).
 * props.project: { company, vertical, owner, progress, dueDate, priority, risk, blocked }
 */
export function ImplementationCard({ project, accent = "#f97316" }) {
  const p = project || {};
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 hover:border-white/25 transition-all">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
            <Building2 className="w-3.5 h-3.5 text-white/60" />
          </div>
          <span className="text-sm font-semibold text-white truncate">{p.company}</span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {p.risk && <AlertTriangle className="w-3.5 h-3.5 text-[#ef4444]" title="Riesgo" />}
          {p.blocked && <Lock className="w-3.5 h-3.5 text-[#f59e0b]" title="Bloqueado" />}
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between text-[11px] text-white/40">
        <span className="truncate">{p.vertical}</span>
        {p.priority && <PriorityBadge level={p.priority} />}
      </div>

      <div className="mt-2.5">
        <ProjectProgress value={p.progress} accent={accent} />
      </div>

      <div className="mt-2 flex items-center justify-between text-[11px] text-white/40">
        <span className="inline-flex items-center gap-1 truncate"><User className="w-3 h-3" /> {p.owner}</span>
        <span className="inline-flex items-center gap-1 whitespace-nowrap"><CalendarClock className="w-3 h-3" /> {p.dueDate}</span>
      </div>
    </div>
  );
}

export default ImplementationCard;
