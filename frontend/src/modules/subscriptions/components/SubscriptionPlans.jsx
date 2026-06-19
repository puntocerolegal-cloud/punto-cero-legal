import React, { useState } from "react";
import { Check, Users, HardDrive } from "lucide-react";
import { cn } from "@/lib/utils";
import { PLANS, VERTICALS } from "../mockData";

const money = (v) => `$${Number(v || 0).toLocaleString("es-CO")}`;

/**
 * Planes SaaS por vertical (Essential / Professional / Enterprise).
 * Muestra precio, usuarios, módulos y almacenamiento.
 */
export function SubscriptionPlans() {
  const [vertical, setVertical] = useState(VERTICALS[0]);
  const plans = PLANS.filter((p) => p.vertical === vertical);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {VERTICALS.map((v) => (
          <button
            key={v}
            onClick={() => setVertical(v)}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-medium border transition-all",
              vertical === v
                ? "bg-gradient-to-r from-[#f97316]/20 to-[#3b82f6]/20 text-white border-[#f97316]/30"
                : "text-white/60 border-white/10 hover:text-white hover:bg-white/5"
            )}
          >
            {v}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((p) => (
          <div
            key={p.id}
            className={cn(
              "rounded-2xl border p-5 backdrop-blur-md transition-all",
              p.featured
                ? "border-[#f97316]/40 bg-gradient-to-br from-[#f97316]/10 to-[#3b82f6]/5"
                : "border-white/10 bg-white/[0.03] hover:border-white/25"
            )}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">{p.name}</h3>
              {p.featured && (
                <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-[#f97316]/20 text-[#f97316]">
                  Popular
                </span>
              )}
            </div>

            <div className="mt-3 text-2xl font-bold text-white">
              {money(p.price)}
              <span className="text-sm font-normal text-white/40"> /mes</span>
            </div>

            <div className="mt-4 flex items-center gap-4 text-xs text-white/60">
              <span className="inline-flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {p.users} usuarios</span>
              <span className="inline-flex items-center gap-1"><HardDrive className="w-3.5 h-3.5" /> {p.storage} GB</span>
            </div>

            <ul className="mt-4 space-y-2">
              {p.modules.map((m) => (
                <li key={m} className="flex items-center gap-2 text-sm text-white/70">
                  <Check className="w-3.5 h-3.5 text-[#10b981] flex-shrink-0" /> {m}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SubscriptionPlans;
