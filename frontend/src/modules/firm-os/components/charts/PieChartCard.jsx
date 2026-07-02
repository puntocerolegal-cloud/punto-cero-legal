import React from 'react';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import { ExecutiveChartCard } from './ExecutiveChartCard';

export function PieChartCard({ title, data, icon, subtitle }) {
  if (!data || data.length === 0) {
    return (
      <ExecutiveChartCard title={title} icon={icon} subtitle={subtitle}>
        <p className="text-white/60">Sin datos disponibles</p>
      </ExecutiveChartCard>
    );
  }

  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

  return (
    <ExecutiveChartCard title={title} icon={icon} subtitle={subtitle}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percentage }) => `${name}: ${percentage}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color || colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #ffffff20' }}
            labelStyle={{ color: '#ffffff' }}
          />
          <Legend wrapperStyle={{ paddingTop: '20px' }} />
        </PieChart>
      </ResponsiveContainer>
    </ExecutiveChartCard>
  );
}
