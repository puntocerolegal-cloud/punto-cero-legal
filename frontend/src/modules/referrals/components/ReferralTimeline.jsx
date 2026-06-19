import React from "react";
import { UserPlus, Share2, MousePointerClick, TrendingUp, ShoppingCart, Gift, Power, CalendarX } from "lucide-react";

const EVENT_META = {
  registro: { icon: UserPlus, color: "#3b82f6" },
  compartido: { icon: Share2, color: "#8b5cf6" },
  click: { icon: MousePointerClick, color: "#06b6d4" },
  conversion: { icon: TrendingUp, color: "#10b981" },
  compra: { icon: ShoppingCart, color: "#10b981" },
  recompensa: { icon: Gift, color: "#f59e0b" },
  activacion: { icon: Power, color: "#10b981" },
  expiracion: { icon: CalendarX, color: "#ef4444" },
};

/** Timeline de actividad de referidos. */
export function ReferralTimeline({ items = [] }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-5">
      <ul className="space-y-4">
        {items.map((it) => {
          const meta = EVENT_META[it.event] || { icon: TrendingUp, color: "#64748b" };
          const Icon = meta.icon;
          return (
            <li key={it.id} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${meta.color}1a`, border: `1px solid ${meta.color}40` }}>
                <Icon className="w-4 h-4" style={{ color: meta.color }} />
              </div>
              <div className="min-w-0">
                <div className="text-sm text-white/80">{it.label}</div>
                <div className="text-[11px] text-white/40">{it.date}</div>
              </div>
            </li>
          );
        })}
        {items.length === 0 && <li className="text-sm text-white/40 text-center py-6">Sin actividad aún</li>}
      </ul>
    </div>
  );
}

export default ReferralTimeline;
