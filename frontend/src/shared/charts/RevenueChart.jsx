import * as React from "react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";
import { ChartCard, AXIS, GRID, tooltipStyle } from "./_chartBase";

/**
 * Ingresos por periodo — Punto Cero OS.
 * props.data: [{ label, value }]
 */
export function RevenueChart({ data = [], title = "Ingresos", height = 260, accent = "#10b981" }) {
  return (
    <ChartCard title={title} empty={!data.length}>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={accent} stopOpacity={0.5} />
              <stop offset="100%" stopColor={accent} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid {...GRID} />
          <XAxis dataKey="label" {...AXIS} />
          <YAxis {...AXIS} />
          <Tooltip {...tooltipStyle} />
          <Area type="monotone" dataKey="value" stroke={accent} strokeWidth={2} fill="url(#revFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export default RevenueChart;
