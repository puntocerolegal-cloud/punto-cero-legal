import React from "react";
import { Scale, Stethoscope, Smile, Calculator, Layers, Building2, Users, DollarSign, TrendingUp } from "lucide-react";
import { VerticalStatusBadge } from "./VerticalStatusBadge";
import { VerticalActions } from "./VerticalActions";

// Icono por slug de vertical (no se serializa en el mock).
const VERTICAL_ICONS = {
  legal: Scale,
  medicina: Stethoscope,
  odontologia: Smile,
  contabilidad: Calculator,
};

const money = (v) => `$${Number(v || 0).toLocaleString("es-CO")}`;
const n = (v) => Number(v || 0).toLocaleString("es-CO");

/**
 * Tarjeta de vertical del Motor Multivertical.
 * Muestra identidad, estado, métricas (orgs/usuarios/planes/ingresos/crecimiento)
 * y las acciones de ciclo de vida (activar/desactivar/preparar).
 */
export function VerticalCard({ vertical, onAction, busy = false }) {
  const v = vertical || {};
  const Icon = VERTICAL_ICONS[v.slug] || Layers;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-5 transition-all hover:border-white/25">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#f97316]/20 to-[#3b82f6]/20 border border-white/10 flex items-center justify-center flex-shrink-0">
            <Icon className="w-5 h-5 text-[#f97316]" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold text-white truncate">{v.name}</div>
            <div className="text-[11px] text-white/40">
              {v.launched ? `En producción desde ${v.launched}` : "Sin lanzar"}
            </div>
          </div>
        </div>
        <VerticalStatusBadge status={v.status} />
      </div>

      {v.description && (
        <p className="mt-3 text-xs text-white/50 leading-relaxed">{v.description}</p>
      )}

      {/* Métricas */}
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
        <Metric icon={Building2} label="Organizaciones" value={n(v.orgs)} />
        <Metric icon={Users} label="Usuarios" value={n(v.users)} />
        <Metric icon={Layers} label="Planes activos" value={n(v.activePlans)} />
        <Metric icon={DollarSign} label="Ingresos (MRR)" value={money(v.mrr)} />
      </div>

      <div className="mt-2 flex items-center gap-1 text-xs">
        <TrendingUp className={`w-3.5 h-3.5 ${v.growth >= 0 ? "text-[#10b981]" : "text-[#ef4444]"}`} />
        <span className={v.growth >= 0 ? "text-[#10b981]" : "text-[#ef4444]"}>
          {v.growth >= 0 ? "+" : ""}{v.growth}% crecimiento
        </span>
      </div>

      {/* Acciones de ciclo de vida */}
      <div className="mt-4 pt-4 border-t border-white/10">
        <VerticalActions vertical={v} onAction={onAction} busy={busy} />
      </div>
    </div>
  );
}

function Metric({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl bg-white/[0.02] border border-white/5 p-2.5">
      <div className="flex items-center gap-1 text-white/40">
        <Icon className="w-3 h-3" />
        <span className="text-[10px] uppercase tracking-wider">{label}</span>
      </div>
      <div className="mt-1 text-sm font-bold text-white">{value}</div>
    </div>
  );
}

export default VerticalCard;
