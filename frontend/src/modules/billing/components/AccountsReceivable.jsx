import React from "react";
import { Wallet } from "lucide-react";
import { PriorityBadge } from "@/shared/components";

const money = (v) => `$${Number(v || 0).toLocaleString("es-CO")}`;

// Color del semáforo según prioridad de la cartera.
const PRIORITY_ACCENT = { baja: "#10b981", media: "#f59e0b", alta: "#f97316", urgente: "#ef4444" };

/**
 * Cuentas por cobrar — total + cartera por antigüedad con semáforos y prioridades.
 * props: total, buckets: [{ key, label, amount, priority }]
 */
export function AccountsReceivable({ total = 0, buckets = [] }) {
  const max = buckets.reduce((m, b) => Math.max(m, b.amount || 0), 0) || 1;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm uppercase tracking-wider text-white/50 font-semibold">Cuentas por cobrar</h3>
        <div className="inline-flex items-center gap-2 text-white">
          <Wallet className="w-4 h-4 text-[#f97316]" />
          <span className="font-bold">{money(total)}</span>
        </div>
      </div>

      <ul className="space-y-4">
        {buckets.map((b) => {
          const accent = PRIORITY_ACCENT[b.priority] || "#f59e0b";
          return (
            <li key={b.key}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="inline-flex items-center gap-2 text-white/70">
                  <span className="w-2 h-2 rounded-full" style={{ background: accent }} />
                  {b.label}
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="font-semibold text-white">{money(b.amount)}</span>
                  <PriorityBadge level={b.priority} />
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${(b.amount / max) * 100}%`, background: accent }} />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default AccountsReceivable;
