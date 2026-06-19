import React from "react";
import { Activity, TrendingUp, LifeBuoy, Receipt } from "lucide-react";
import { StatusBadge, PriorityBadge } from "@/shared/components";

/**
 * Salud organizacional — adopción, actividad, tickets, facturación, riesgo.
 * Usa StatusBadge (facturación) y PriorityBadge (riesgo).
 * props.health: { adoption, activity, tickets, billing, risk }
 */
function Bar({ icon: Icon, label, value, accent }) {
  const pct = Math.max(0, Math.min(100, value ?? 0));
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="inline-flex items-center gap-2 text-white/60"><Icon className="w-3.5 h-3.5" /> {label}</span>
        <span className="font-semibold text-white">{pct}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: accent }} />
      </div>
    </div>
  );
}

export function OrganizationHealth({ health }) {
  const h = health || {};
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-5">
      <h3 className="text-sm uppercase tracking-wider text-white/50 font-semibold mb-4">Salud organizacional</h3>

      <div className="space-y-4">
        <Bar icon={TrendingUp} label="Adopción" value={h.adoption} accent="#3b82f6" />
        <Bar icon={Activity} label="Actividad" value={h.activity} accent="#10b981" />
      </div>

      <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
        <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2">
          <span className="inline-flex items-center gap-2 text-white/60"><LifeBuoy className="w-3.5 h-3.5" /> Tickets</span>
          <span className="font-semibold text-white">{h.tickets ?? 0}</span>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2">
          <span className="inline-flex items-center gap-2 text-white/60"><Receipt className="w-3.5 h-3.5" /> Facturación</span>
          <StatusBadge tone={h.billing || "normal"} />
        </div>
        <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2">
          <span className="text-white/60">Riesgo</span>
          <PriorityBadge level={h.risk || "baja"} />
        </div>
      </div>
    </div>
  );
}

export default OrganizationHealth;
