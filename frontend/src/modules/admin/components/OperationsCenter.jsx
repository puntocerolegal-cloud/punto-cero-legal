import React from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

/**
 * Centro de Operaciones — tarjetas consolidadas y clicables.
 * Cada tarjeta navega a la sección correspondiente del OS.
 *
 * props.items: [{ key, label, count, icon, accent, to, tone }]
 *   tone (opcional): "alert" resalta la tarjeta (p.ej. urgentes/vencidas).
 */
export function OperationsCenter({ items = [], loading = false }) {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
      {items.map((it) => {
        const Icon = it.icon;
        const alert = it.tone === "alert" && it.count > 0;
        return (
          <button
            key={it.key}
            onClick={() => it.to && navigate(it.to)}
            className={cn(
              "text-left rounded-2xl border p-4 transition-all hover:-translate-y-0.5",
              alert
                ? "border-[#ef4444]/40 bg-[#ef4444]/[0.06] hover:border-[#ef4444]/60"
                : "border-white/10 bg-white/[0.03] hover:border-white/25"
            )}
            data-testid={`ops-card-${it.key}`}
          >
            <div className="flex items-center justify-between">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: `${it.accent}1a`, border: `1px solid ${it.accent}40` }}
              >
                {Icon && <Icon className="w-4.5 h-4.5" style={{ color: it.accent }} />}
              </div>
              <span className={cn("text-2xl font-bold", alert ? "text-[#ef4444]" : "text-white")}>
                {loading ? <span className="inline-block w-8 h-6 rounded bg-white/10 animate-pulse" /> : (it.count ?? 0)}
              </span>
            </div>
            <div className="mt-3 text-xs font-semibold text-white/70">{it.label}</div>
          </button>
        );
      })}
    </div>
  );
}

export default OperationsCenter;
