import React from 'react';
import { Clock, CheckCircle2, AlertCircle, Pause } from 'lucide-react';

const ScheduleBadge = ({ schedule, compact = false }) => {
  if (!schedule) return null;

  const statusConfig = {
    active: {
      icon: Clock,
      color: 'text-green-600',
      bg: 'bg-green-100',
      label: 'Activo',
    },
    paused: {
      icon: Pause,
      color: 'text-yellow-600',
      bg: 'bg-yellow-100',
      label: 'Pausado',
    },
    completed: {
      icon: CheckCircle2,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
      label: 'Completado',
    },
    failed: {
      icon: AlertCircle,
      color: 'text-red-600',
      bg: 'bg-red-100',
      label: 'Error',
    },
    cancelled: {
      icon: AlertCircle,
      color: 'text-gray-600',
      bg: 'bg-gray-100',
      label: 'Cancelado',
    },
  };

  const config = statusConfig[schedule.status] || statusConfig.active;
  const Icon = config.icon;

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
        <Icon size={12} />
        {config.label}
      </span>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg ${config.bg}`}>
      <Icon size={16} className={config.color} />
      <span className={`text-sm font-medium ${config.color}`}>{config.label}</span>
    </div>
  );
};

export default React.memo(ScheduleBadge);
