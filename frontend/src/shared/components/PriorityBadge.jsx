import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Badge de prioridad — Punto Cero OS.
 * Niveles estándar: urgente | alta | media | baja.
 * Acepta sinónimos en inglés (high/medium/low/urgent) usados por el backend.
 */
const LEVELS = {
  urgente: { label: "Urgente", cls: "bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/30" },
  alta:    { label: "Alta",    cls: "bg-[#f97316]/10 text-[#f97316] border-[#f97316]/30" },
  media:   { label: "Media",   cls: "bg-[#3b82f6]/10 text-[#3b82f6] border-[#3b82f6]/30" },
  baja:    { label: "Baja",    cls: "bg-white/5 text-white/60 border-white/15" },
};

const ALIASES = { urgent: "urgente", high: "alta", medium: "media", low: "baja" };

export function PriorityBadge({ level = "media", className }) {
  const key = ALIASES[level] || level;
  const l = LEVELS[key] || LEVELS.media;
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-semibold whitespace-nowrap",
        l.cls,
        className
      )}
    >
      {l.label}
    </span>
  );
}

export default PriorityBadge;
