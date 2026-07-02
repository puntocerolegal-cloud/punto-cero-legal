import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ExecutiveChartCard } from './ExecutiveChartCard';

export function LineChartCard({ title, data, xDataKey, lines, icon, subtitle }) {
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
        <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
          <XAxis dataKey={xDataKey} stroke="#ffffff60" style={{ fontSize: '12px' }} />
          <YAxis stroke="#ffffff60" style={{ fontSize: '12px' }} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #ffffff20' }}
            labelStyle={{ color: '#ffffff' }}
          />
          <Legend wrapperStyle={{ paddingTop: '20px' }} />
          {lines && lines.map((line, idx) => (
            <Line
              key={line.key}
              type="monotone"
              dataKey={line.key}
              stroke={line.color || colors[idx]}
              name={line.name}
              dot={false}
              strokeWidth={2}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </ExecutiveChartCard>
  );
}
