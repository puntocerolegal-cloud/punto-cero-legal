import * as React from "react";
import { cn } from "@/lib/utils";
import { Clock } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { PriorityBadge } from "./PriorityBadge";

/**
 * Timeline global reutilizable — Punto Cero OS.
 * Preparado para CRM, Casos, Facturación, Inventario y Soporte.
 *
 * props.items: [{ date, user, action, comment, status, priority }]
 *   - status: tono de StatusBadge (normal|atencion|riesgo|critico|active...)
 *   - priority: nivel de PriorityBadge (urgente|alta|media|baja)
 */
export function Timeline({ items = [], className, emptyText = "Sin actividad registrada" }) {
  if (!items.length) {
    return <div className={cn("text-sm text-white/40 py-6 text-center", className)}>{emptyText}</div>;
  }

  return (
    <ol className={cn("relative border-l border-white/10 ml-3", className)}>
      {items.map((it, i) => (
        <li key={it.id || i} className="mb-6 ml-6">
          <span className="absolute -left-[9px] flex items-center justify-center w-4 h-4 rounded-full bg-[#0f172a] border border-[#f97316]/50">
            <span className="w-1.5 h-1.5 rounded-full bg-[#f97316]" />
          </span>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-white">{it.action}</span>
            {it.priority && <PriorityBadge level={it.priority} />}
            {it.status && <StatusBadge tone={it.status} label={it.statusLabel} />}
          </div>

          {it.comment && <p className="text-sm text-white/60 mt-1">{it.comment}</p>}

          <div className="flex items-center gap-3 mt-1.5 text-xs text-white/40">
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDate(it.date)}
            </span>
            {it.user && <span>· {it.user}</span>}
          </div>
        </li>
      ))}
    </ol>
  );
}

function formatDate(date) {
  if (!date) return "—";
  const s = typeof date === "string" ? date : date?.toISOString?.() || String(date);
  return s.slice(0, 16).replace("T", " ");
}

export default Timeline;
