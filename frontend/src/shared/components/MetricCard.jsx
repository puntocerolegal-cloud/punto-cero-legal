import * as React from "react";
import { cn } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

/**
 * Tarjeta KPI reutilizable — Punto Cero OS.
 * props: title, value, icon (componente lucide), accent (hex), delta (number),
 *        subtitle, loading.
 */
export function MetricCard({
  title,
  value,
  icon: Icon,
  accent = "#f97316",
  delta,
  subtitle,
  loading = false,
  className,
}) {
  const hasDelta = typeof delta === "number" && !Number.isNaN(delta);
  const positive = hasDelta && delta >= 0;

  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-5 transition-all hover:border-white/20",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="text-xs uppercase tracking-wider text-white/50 font-semibold">{title}</div>
        {Icon && (
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: `${accent}1a`, border: `1px solid ${accent}40` }}
          >
            <Icon className="w-4.5 h-4.5" style={{ color: accent }} />
          </div>
        )}
      </div>

      <div className="mt-3 text-2xl font-bold text-white">
        {loading ? <span className="inline-block w-20 h-7 rounded bg-white/10 animate-pulse" /> : value}
      </div>

      <div className="mt-1 flex items-center gap-2">
        {hasDelta && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-xs font-semibold",
              positive ? "text-[#10b981]" : "text-[#ef4444]"
            )}
          >
            {positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(delta)}%
          </span>
        )}
        {subtitle && <span className="text-xs text-white/40">{subtitle}</span>}
      </div>
    </div>
  );
}

export default MetricCard;
