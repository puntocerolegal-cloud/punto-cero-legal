import React, { useMemo } from "react";
import { ImplementationCard } from "./ImplementationCard";
import { STAGES } from "../mockData";

/**
 * Pipeline de implementación tipo Kanban.
 * Columnas: Vendido → Kickoff → Configuración → Capacitación → Pruebas → Go Live → Operación.
 * props.projects: [{ ..., stage }]
 */
export function ImplementationBoard({ projects = [] }) {
  const byStage = useMemo(() => {
    const map = Object.fromEntries(STAGES.map((s) => [s.key, []]));
    projects.forEach((p) => { if (map[p.stage]) map[p.stage].push(p); });
    return map;
  }, [projects]);

  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {STAGES.map((stage) => {
        const items = byStage[stage.key] || [];
        return (
          <div key={stage.key} className="flex-shrink-0 w-64">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md overflow-hidden">
              <div className="p-3 border-b border-white/10" style={{ boxShadow: `inset 3px 0 0 ${stage.accent}` }}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">{stage.label}</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: `${stage.accent}1a`, color: stage.accent }}>
                    {items.length}
                  </span>
                </div>
              </div>
              <div className="p-2 space-y-2 min-h-[80px]">
                {items.length === 0 ? (
                  <div className="text-[11px] text-white/30 text-center py-6">Sin proyectos</div>
                ) : (
                  items.map((p) => <ImplementationCard key={p.id} project={p} accent={stage.accent} />)
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default ImplementationBoard;
