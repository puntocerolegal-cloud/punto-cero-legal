import React from "react";
import { Landmark, Building, CreditCard, Banknote } from "lucide-react";

const money = (v) => `$${Number(v || 0).toLocaleString("es-CO")}`;

const ICONS = { transfer: Landmark, pse: Building, card: CreditCard, cash: Banknote };

/**
 * Métodos de pago — transacciones, porcentaje y monto por método (barras visuales).
 * props.methods: [{ key, label, transactions, amount, accent }]
 */
export function PaymentMethods({ methods = [] }) {
  const totalAmount = methods.reduce((s, m) => s + (m.amount || 0), 0) || 1;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-5">
      <h3 className="text-sm uppercase tracking-wider text-white/50 font-semibold mb-4">Métodos de pago</h3>
      <ul className="space-y-4">
        {methods.map((m) => {
          const Icon = ICONS[m.key] || CreditCard;
          const pct = Math.round((m.amount / totalAmount) * 100);
          return (
            <li key={m.key}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="inline-flex items-center gap-2 text-white/70">
                  <Icon className="w-4 h-4" style={{ color: m.accent }} /> {m.label}
                </span>
                <span className="text-white/40 text-xs">{m.transactions} txns · {pct}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: m.accent }} />
              </div>
              <div className="mt-1 text-right text-xs font-semibold text-white">{money(m.amount)}</div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default PaymentMethods;
