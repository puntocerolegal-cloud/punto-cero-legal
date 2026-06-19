import React from "react";
import { cn } from "@/lib/utils";

/**
 * Barra de avance reutilizable del módulo Implementaciones.
 * props: value (0-100), accent, showLabel, className.
 */
export function ProjectProgress({ value = 0, accent = "#f97316", showLabel = true, className }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className={cn("w-full", className)}>
      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: pct >= 100 ? "#10b981" : accent }}
        />
      </div>
      {showLabel && (
        <div className="mt-1 text-[11px] text-white/40 text-right">{pct}%</div>
      )}
    </div>
  );
}

export default ProjectProgress;
