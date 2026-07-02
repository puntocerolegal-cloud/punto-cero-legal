import React from 'react';
import { Users, FileText, DollarSign, AlertCircle, TrendingUp } from 'lucide-react';

const ExecutiveSummary = ({ summary }) => {
  if (!summary) return null;

  const metrics = [
    {
      icon: Users,
      label: 'Abogados',
      value: summary.totalLawyers,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      icon: FileText,
      label: 'Casos Abiertos',
      value: summary.openCases,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      icon: AlertCircle,
      label: 'En Riesgo',
      value: summary.casesAtRisk,
      color: 'text-red-600',
      bg: 'bg-red-50',
    },
    {
      icon: DollarSign,
      label: 'Potencial ($)',
      value: `$${(summary.totalRevenuePotential / 1000).toFixed(1)}K`,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {metrics.map((metric, idx) => {
        const Icon = metric.icon;
        return (
          <div
            key={idx}
            className={`rounded-lg p-4 border border-gray-200 ${metric.bg}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 mb-1">{metric.label}</p>
                <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
              </div>
              <Icon size={32} className={metric.color} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default React.memo(ExecutiveSummary);
