import React from "react";
import { Building2, Users } from "lucide-react";
import { StatusBadge } from "@/shared/components";

// Estado de organización → tono/label de semáforo.
const STATUS = {
  active:    { tone: "normal",   label: "Activa" },
  trial:     { tone: "atencion", label: "Trial" },
  at_risk:   { tone: "riesgo",   label: "En riesgo" },
  suspended: { tone: "critico",  label: "Suspendida" },
};

/**
 * Tarjeta de organización (tenant).
 * Muestra nombre, vertical, plan, usuarios, uso % y estado.
 */
export function OrganizationCard({ organization, onClick }) {
  const o = organization || {};
  const s = STATUS[o.status] || { tone: "normal", label: o.status };
  const usage = Math.max(0, Math.min(100, o.usage ?? 0));

  return (
    <button
      onClick={() => onClick?.(o)}
      className="text-left w-full rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-5 hover:border-white/25 transition-all"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
            <Building2 className="w-5 h-5 text-white/60" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold text-white truncate">{o.name}</div>
            <div className="text-[11px] text-white/40">{o.vertical} · {o.plan}</div>
          </div>
        </div>
        <StatusBadge tone={s.tone} label={s.label} />
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-white/50">
        <span className="inline-flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {o.users} usuarios</span>
        <span>Uso {usage}%</span>
      </div>
      <div className="mt-1.5 h-1.5 rounded-full bg-white/5 overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${usage}%`, background: usage >= 80 ? "#ef4444" : usage >= 60 ? "#f59e0b" : "#10b981" }}
        />
      </div>
    </button>
  );
}

export default OrganizationCard;
