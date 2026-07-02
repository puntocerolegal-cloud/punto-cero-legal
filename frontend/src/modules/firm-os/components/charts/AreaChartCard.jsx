import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ExecutiveChartCard } from './ExecutiveChartCard';

export function AreaChartCard({ title, data, xDataKey, areas, icon, subtitle }) {
  if (!data || data.length === 0) {
    return (
      <ExecutiveChartCard title={title} icon={icon} subtitle={subtitle}>
        <p className="text-white/60">Sin datos disponibles</p>
      </ExecutiveChartCard>
    );
  }

  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

  return (
    <ExecutiveChartCard title={title} icon={icon} subtitle={subtitle}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <defs>
            {areas && areas.map((area, idx) => (
              <linearGradient key={area.key} id={`color${area.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={area.color || colors[idx]} stopOpacity={0.8} />
                <stop offset="95%" stopColor={area.color || colors[idx]} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
          <XAxis dataKey={xDataKey} stroke="#ffffff60" style={{ fontSize: '12px' }} />
          <YAxis stroke="#ffffff60" style={{ fontSize: '12px' }} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #ffffff20' }}
            labelStyle={{ color: '#ffffff' }}
          />
          <Legend wrapperStyle={{ paddingTop: '20px' }} />
          {areas && areas.map((area, idx) => (
            <Area
              key={area.key}
              type="monotone"
              dataKey={area.key}
              stroke={area.color || colors[idx]}
              fillOpacity={1}
              fill={`url(#color${area.key})`}
              name={area.name}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </ExecutiveChartCard>
  );
}
