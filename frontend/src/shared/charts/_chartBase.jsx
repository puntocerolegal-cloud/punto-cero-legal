import * as React from "react";
import { cn } from "@/lib/utils";
import { EmptyState } from "../components/EmptyState";
import { BarChart3 } from "lucide-react";

/**
 * Estilos y contenedor base compartidos por los gráficos — Punto Cero OS.
 * Centraliza ejes, grid y tooltip para mantener un look consistente.
 */
export const AXIS = {
  stroke: "#64748b",
  tick: { fill: "#94a3b8", fontSize: 11 },
  tickLine: false,
  axisLine: { stroke: "rgba(255,255,255,0.1)" },
};

export const GRID = {
  strokeDasharray: "3 3",
  stroke: "rgba(255,255,255,0.06)",
  vertical: false,
};

export const tooltipStyle = {
  contentStyle: {
    background: "#0f172a",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: 12,
    color: "#fff",
    fontSize: 12,
  },
  labelStyle: { color: "#94a3b8" },
  itemStyle: { color: "#fff" },
};

export function ChartCard({ title, children, empty = false, className }) {
  return (
    <div className={cn("rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-5", className)}>
      {title && <h3 className="text-sm uppercase tracking-wider text-white/50 font-semibold mb-4">{title}</h3>}
      {empty ? (
        <EmptyState icon={BarChart3} title="Sin datos suficientes" className="border-0 bg-transparent py-10" />
      ) : (
        children
      )}
    </div>
  );
}
