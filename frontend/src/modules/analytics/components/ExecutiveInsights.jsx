import React from "react";
import { Award, TrendingUp, DollarSign, Target, AlertTriangle, Lightbulb } from "lucide-react";

/**
 * Executive Insights — lecturas ejecutivas consolidadas del OS.
 * props.data: { bestVertical, fastestGrowing, topRevenue, topConversion, risks[], opportunities[] }
 */
function Highlight({ icon: Icon, label, value, accent }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <div className="flex items-center gap-2 text-white/50 text-xs uppercase tracking-wider">
        <Icon className="w-3.5 h-3.5" style={{ color: accent }} /> {label}
      </div>
      <div className="mt-1.5 text-lg font-bold text-white">{value}</div>
    </div>
  );
}

function List({ icon: Icon, title, items, accent }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${accent}1a`, border: `1px solid ${accent}40` }}>
          <Icon className="w-4 h-4" style={{ color: accent }} />
        </div>
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>
      <ul className="space-y-2.5">
        {items.map((t, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-white/70">
            <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: accent }} />
            {t}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ExecutiveInsights({ data }) {
  const d = data || {};
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Highlight icon={Award} label="Mejor vertical" value={d.bestVertical} accent="#f97316" />
        <Highlight icon={TrendingUp} label="Mayor crecimiento" value={d.fastestGrowing} accent="#10b981" />
        <Highlight icon={DollarSign} label="Mayor facturación" value={d.topRevenue} accent="#3b82f6" />
        <Highlight icon={Target} label="Mayor conversión" value={d.topConversion} accent="#8b5cf6" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <List icon={AlertTriangle} title="Riesgos detectados" items={d.risks || []} accent="#ef4444" />
        <List icon={Lightbulb} title="Oportunidades detectadas" items={d.opportunities || []} accent="#10b981" />
      </div>
    </div>
  );
}

export default ExecutiveInsights;
