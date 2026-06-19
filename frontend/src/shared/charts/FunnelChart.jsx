import * as React from "react";
import { ResponsiveContainer, FunnelChart as ReFunnelChart, Funnel, LabelList, Tooltip, Cell } from "recharts";
import { ChartCard, tooltipStyle } from "./_chartBase";

/**
 * Embudo comercial — Punto Cero OS.
 * props.data: [{ label, value }] de mayor a menor (Leads → Convertidos).
 */
const PALETTE = ["#3b82f6", "#6366f1", "#f97316", "#10b981"];

export function FunnelChart({ data = [], title = "Embudo de conversión", height = 260 }) {
  // recharts Funnel usa `name` y `value`.
  const series = data.map((d, i) => ({ name: d.label, value: d.value, fill: d.color || PALETTE[i % PALETTE.length] }));

  return (
    <ChartCard title={title} empty={!data.length}>
      <ResponsiveContainer width="100%" height={height}>
        <ReFunnelChart>
          <Tooltip {...tooltipStyle} />
          <Funnel dataKey="value" data={series} isAnimationActive>
            <LabelList position="right" fill="#fff" stroke="none" dataKey="name" className="text-xs" />
            <LabelList position="left" fill="#94a3b8" stroke="none" dataKey="value" />
            {series.map((s, i) => (
              <Cell key={i} fill={s.fill} />
            ))}
          </Funnel>
        </ReFunnelChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export default FunnelChart;
