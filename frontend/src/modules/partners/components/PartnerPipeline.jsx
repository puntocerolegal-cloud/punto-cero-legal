import React, { useMemo } from "react";
import { PartnerCard } from "./PartnerCard";
import { PIPELINE_STAGES } from "../mockData";

const money = (v) => `$${Number(v || 0).toLocaleString("es-CO")}`;

/**
 * Centro de Oportunidades — pipeline comercial tipo Kanban.
 * Cada columna muestra cantidad, valor potencial y empresas.
 *
 * props.opportunities: [{ id, company, vertical, stage, value, priority, contact }]
 */
export function PartnerPipeline({ opportunities = [] }) {
  const byStage = useMemo(() => {
    const map = Object.fromEntries(PIPELINE_STAGES.map((s) => [s.key, []]));
    opportunities.forEach((o) => { if (map[o.stage]) map[o.stage].push(o); });
    return map;
  }, [opportunities]);

  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {PIPELINE_STAGES.map((stage) => {
        const items = byStage[stage.key] || [];
        const total = items.reduce((s, o) => s + (o.value || 0), 0);
        return (
          <div key={stage.key} className="flex-shrink-0 w-64">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md overflow-hidden">
              <div className="p-3 border-b border-white/10" style={{ boxShadow: `inset 3px 0 0 ${stage.accent}` }}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">{stage.label}</span>
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ background: `${stage.accent}1a`, color: stage.accent }}
                  >
                    {items.length}
                  </span>
                </div>
                <div className="mt-1 text-[11px] text-white/40">
                  {money(total)} · {items.length} empresa{items.length === 1 ? "" : "s"}
                </div>
              </div>
              <div className="p-2 space-y-2 min-h-[80px]">
                {items.length === 0 ? (
                  <div className="text-[11px] text-white/30 text-center py-6">Sin oportunidades</div>
                ) : (
                  items.map((o) => <PartnerCard key={o.id} opportunity={o} />)
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default PartnerPipeline;
