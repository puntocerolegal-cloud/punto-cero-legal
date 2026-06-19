import React from "react";
import { Building2 } from "lucide-react";
import { PriorityBadge } from "@/shared/components";

const money = (v) => `$${Number(v || 0).toLocaleString("es-CO")}`;

/**
 * Tarjeta compacta de oportunidad/empresa — usada en el Kanban del pipeline.
 */
export function PartnerCard({ opportunity }) {
  const o = opportunity || {};
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 hover:border-white/25 transition-all">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
            <Building2 className="w-3.5 h-3.5 text-white/60" />
          </div>
          <span className="text-sm font-semibold text-white truncate">{o.company}</span>
        </div>
        {o.priority && <PriorityBadge level={o.priority} />}
      </div>
      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="text-white/40 truncate">{o.vertical}</span>
        <span className="text-[#10b981] font-semibold whitespace-nowrap">{money(o.value)}</span>
      </div>
      {o.contact && <div className="mt-1 text-[11px] text-white/40 truncate">{o.contact}</div>}
    </div>
  );
}

export default PartnerCard;
