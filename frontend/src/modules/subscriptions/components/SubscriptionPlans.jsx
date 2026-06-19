import React from "react";
import { Check, Users, HardDrive } from "lucide-react";
import { cn } from "@/lib/utils";
// Fuente ÚNICA oficial de planes (misma que Landing / Admin SubscriptionCenter / Dashboard).
import { PLANS, CURRENCIES, DEFAULT_CURRENCY_CODE } from "@/modules/plans/mockData";
import { findCurrency, localPrice, formatMoney } from "@/modules/plans/currency";

const COLORS = {
  despegue: "#3b82f6",
  "salto-estrategico": "#f97316",
  "firma-crecimiento": "#8b5cf6",
  "consolidacion-empresarial": "#10b981",
};

/**
 * Planes oficiales de Punto Cero Legal (El Despegue / El Salto / Firma / Consolidación).
 * Consume la fuente única (modules/plans). Sin tiers legacy ni precios antiguos.
 */
export function SubscriptionPlans() {
  const currency = findCurrency(CURRENCIES, DEFAULT_CURRENCY_CODE) || CURRENCIES[0];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {PLANS.map((p) => {
        const color = COLORS[p.slug] || "#f97316";
        const featured = p.slug === "salto-estrategico";
        const casos = p.limits.max_cases === -1 ? "Casos ilimitados" : `Hasta ${p.limits.max_cases} casos`;
        return (
          <div
            key={p.slug}
            className={cn(
              "rounded-2xl border p-5 backdrop-blur-md transition-all",
              featured ? "bg-gradient-to-br from-[#f97316]/10 to-[#3b82f6]/5" : "bg-white/[0.03] hover:border-white/25"
            )}
            style={{ borderColor: `${color}55` }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">{p.name}</h3>
              {featured && (
                <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-[#f97316]/20 text-[#f97316]">
                  Popular
                </span>
              )}
            </div>

            <div className="mt-3 text-2xl font-bold" style={{ color }}>
              {formatMoney(localPrice(p, currency), currency?.currency_code || "USD")}
              <span className="text-sm font-normal text-white/40"> /mes</span>
            </div>

            <div className="mt-4 flex items-center gap-4 text-xs text-white/60">
              <span className="inline-flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {p.limits.max_users} usuario(s)</span>
              <span className="inline-flex items-center gap-1"><HardDrive className="w-3.5 h-3.5" /> {p.limits.max_storage} GB</span>
            </div>
            <div className="mt-1 text-xs text-white/50">{casos}</div>

            <ul className="mt-4 space-y-2">
              {p.features.map((m) => (
                <li key={m} className="flex items-center gap-2 text-sm text-white/70">
                  <Check className="w-3.5 h-3.5 text-[#10b981] flex-shrink-0" /> {m}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

export default SubscriptionPlans;
