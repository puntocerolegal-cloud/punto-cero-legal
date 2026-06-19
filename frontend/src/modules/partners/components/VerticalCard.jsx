import React from "react";
import { Building2, Target, TrendingUp, DollarSign } from "lucide-react";

const money = (v) => `$${Number(v || 0).toLocaleString("es-CO")}`;

/**
 * Tarjeta de vertical — Nuevas Verticales (Medicina, Odontología, Firmas...).
 * props.vertical: { name, icon, interested, openOpps, conversion, projectedRevenue, accent }
 */
export function VerticalCard({ vertical }) {
  const v = vertical || {};
  const Icon = v.icon || Building2;
  const accent = v.accent || "#f97316";

  const rows = [
    { icon: Building2, label: "Empresas interesadas", value: v.interested ?? 0 },
    { icon: Target, label: "Oportunidades abiertas", value: v.openOpps ?? 0 },
    { icon: TrendingUp, label: "Tasa de conversión", value: `${v.conversion ?? 0}%` },
    { icon: DollarSign, label: "Ingresos proyectados", value: money(v.projectedRevenue) },
  ];

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-5 hover:border-white/25 transition-all">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: `${accent}1a`, border: `1px solid ${accent}40` }}>
          <Icon className="w-5 h-5" style={{ color: accent }} />
        </div>
        <div>
          <div className="text-base font-bold text-white">{v.name}</div>
          <div className="text-[11px] uppercase tracking-wider text-white/40">Vertical</div>
        </div>
      </div>
      <dl className="space-y-2.5">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between text-sm">
            <dt className="inline-flex items-center gap-2 text-white/50">
              <r.icon className="w-3.5 h-3.5" /> {r.label}
            </dt>
            <dd className="font-semibold text-white">{r.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default VerticalCard;
