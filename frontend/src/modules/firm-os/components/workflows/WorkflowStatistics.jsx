import React from 'react';
import { Activity, CheckCircle2, AlertCircle, Zap } from 'lucide-react';

const WorkflowStatistics = ({ statistics }) => {
  if (!statistics) return null;

  const stats = [
    {
      icon: Activity,
      label: 'Workflows Activos',
      value: statistics.activeWorkflows,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      icon: Zap,
      label: 'Total Ejecutados',
      value: statistics.totalExecutions,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      icon: CheckCircle2,
      label: 'Ejecuciones Exitosas',
      value: statistics.successfulExecutions,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    {
      icon: AlertCircle,
      label: 'Ejecuciones Fallidas',
      value: statistics.failedExecutions,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className={`rounded-lg p-4 border border-gray-200 ${stat.bgColor}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <Icon size={32} className={stat.color} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default React.memo(WorkflowStatistics);
