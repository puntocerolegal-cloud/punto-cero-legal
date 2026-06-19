import * as React from "react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
} from "recharts";
import { ChartCard, AXIS, GRID, tooltipStyle } from "./_chartBase";

/**
 * Casos por estado/categoría — Punto Cero OS.
 * props.data: [{ label, value, color? }]
 */
const PALETTE = ["#3b82f6", "#f97316", "#10b981", "#8b5cf6", "#ef4444", "#f59e0b"];

export function CasesChart({ data = [], title = "Casos por estado", height = 260 }) {
  return (
    <ChartCard title={title} empty={!data.length}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid {...GRID} />
          <XAxis dataKey="label" {...AXIS} />
          <YAxis {...AXIS} />
          <Tooltip {...tooltipStyle} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
          <Bar dataKey="value" radius={[6, 6, 0, 0]}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.color || PALETTE[i % PALETTE.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export default CasesChart;
