import * as React from "react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";
import { ChartCard, AXIS, GRID, tooltipStyle } from "./_chartBase";

/**
 * Tasa de conversión por periodo (%) — Punto Cero OS.
 * props.data: [{ label, value }]  (value en %)
 */
export function ConversionChart({ data = [], title = "Conversión (%)", height = 260, accent = "#f97316" }) {
  return (
    <ChartCard title={title} empty={!data.length}>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid {...GRID} />
          <XAxis dataKey="label" {...AXIS} />
          <YAxis {...AXIS} domain={[0, 100]} unit="%" />
          <Tooltip {...tooltipStyle} formatter={(v) => [`${v}%`, "Conversión"]} />
          <Line type="monotone" dataKey="value" stroke={accent} strokeWidth={2} dot={{ r: 3, fill: accent }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export default ConversionChart;
