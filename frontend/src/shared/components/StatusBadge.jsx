import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Semáforo de estado — Punto Cero OS.
 * Tonos estándar: normal | atencion | riesgo | critico.
 * También acepta un `label` libre y un `tone` directo.
 */
const TONES = {
  normal:   { label: "Normal",   dot: "#10b981", cls: "bg-[#10b981]/10 text-[#10b981] border-[#10b981]/30" },
  atencion: { label: "Atención", dot: "#f59e0b", cls: "bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/30" },
  riesgo:   { label: "Riesgo",   dot: "#f97316", cls: "bg-[#f97316]/10 text-[#f97316] border-[#f97316]/30" },
  critico:  { label: "Crítico",  dot: "#ef4444", cls: "bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/30" },
  // estados de entidad frecuentes (reutilizables)
  active:   { label: "Activo",   dot: "#10b981", cls: "bg-[#10b981]/10 text-[#10b981] border-[#10b981]/30" },
  inactive: { label: "Inactivo", dot: "#64748b", cls: "bg-white/5 text-white/60 border-white/15" },
  pending:  { label: "Pendiente",dot: "#f59e0b", cls: "bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/30" },
};

export function StatusBadge({ tone = "normal", label, className }) {
  const t = TONES[tone] || TONES.normal;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold whitespace-nowrap",
        t.cls,
        className
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: t.dot }} />
      {label || t.label}
    </span>
  );
}

export default StatusBadge;
