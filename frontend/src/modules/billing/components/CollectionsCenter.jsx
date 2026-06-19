import React from "react";
import { AlertTriangle, CalendarClock, CalendarCheck, Flame } from "lucide-react";
import { StatusBadge, PriorityBadge, EmptyState } from "@/shared/components";

const money = (v) => `$${Number(v || 0).toLocaleString("es-CO")}`;

/**
 * Centro de Cobranza — clientes en mora, próximos vencimientos, cobros
 * programados y casos críticos. Reutiliza StatusBadge + PriorityBadge.
 * props.data: { overdueClients, upcomingDue, scheduled, critical }
 */
function Block({ icon: Icon, title, accent, items, meta }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${accent}1a`, border: `1px solid ${accent}40` }}>
          <Icon className="w-4 h-4" style={{ color: accent }} />
        </div>
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>
      {(!items || items.length === 0) ? (
        <EmptyState icon={Icon} title="Sin registros" className="border-0 bg-transparent py-6" />
      ) : (
        <ul className="divide-y divide-white/5">
          {items.map((it) => (
            <li key={it.id} className="py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-white truncate">{it.client}</div>
                <div className="text-[11px] text-white/40 mt-0.5">{money(it.amount)} · {meta(it)}</div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {it.priority && <PriorityBadge level={it.priority} />}
                {it.status && <StatusBadge tone={it.status} />}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function CollectionsCenter({ data }) {
  const d = data || {};
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Block icon={AlertTriangle} title="Clientes en mora" accent="#ef4444" items={d.overdueClients} meta={(it) => `${it.days} días de mora`} />
      <Block icon={CalendarClock} title="Próximos vencimientos" accent="#f59e0b" items={d.upcomingDue} meta={(it) => `vence ${it.due}`} />
      <Block icon={CalendarCheck} title="Cobros programados" accent="#3b82f6" items={d.scheduled} meta={(it) => `programado ${it.date}`} />
      <Block icon={Flame} title="Casos críticos" accent="#ec4899" items={d.critical} meta={(it) => it.reason} />
    </div>
  );
}

export default CollectionsCenter;
