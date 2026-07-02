import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ExecutiveChartCard } from './ExecutiveChartCard';

export function BarChartCard({ title, data, xDataKey, bars, icon, subtitle }) {
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
        <BarChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
          <XAxis dataKey={xDataKey} stroke="#ffffff60" style={{ fontSize: '12px' }} />
          <YAxis stroke="#ffffff60" style={{ fontSize: '12px' }} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #ffffff20' }}
            labelStyle={{ color: '#ffffff' }}
          />
          <Legend wrapperStyle={{ paddingTop: '20px' }} />
          {bars && bars.map((bar, idx) => (
            <Bar
              key={bar.key}
              dataKey={bar.key}
              fill={bar.color || colors[idx]}
              name={bar.name}
              radius={[8, 8, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </ExecutiveChartCard>
  );
}
