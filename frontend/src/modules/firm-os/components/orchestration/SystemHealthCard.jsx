import React from 'react';
import { AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';

const SystemHealthCard = React.memo(({ module = {} }) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle size={20} className="text-green-400" />;
      case 'warning':
        return <AlertTriangle size={20} className="text-yellow-400" />;
      case 'critical':
        return <AlertCircle size={20} className="text-red-400" />;
      default:
        return <AlertCircle size={20} className="text-slate-400" />;
    }
  };

  const getHealthColor = (health) => {
    switch (health) {
      case 'excellent':
        return 'border-green-500/30 bg-green-500/5';
      case 'good':
        return 'border-blue-500/30 bg-blue-500/5';
      case 'fair':
        return 'border-yellow-500/30 bg-yellow-500/5';
      case 'poor':
        return 'border-orange-500/30 bg-orange-500/5';
      case 'critical':
        return 'border-red-500/30 bg-red-500/5';
      default:
        return 'border-slate-500/30 bg-slate-500/5';
    }
  };

  const getProgressColor = (health) => {
    switch (health) {
      case 'excellent':
        return 'bg-green-500';
      case 'good':
        return 'bg-blue-500';
      case 'fair':
        return 'bg-yellow-500';
      case 'poor':
        return 'bg-orange-500';
      case 'critical':
        return 'bg-red-500';
      default:
        return 'bg-slate-500';
    }
  };

  return (
    <div className={`p-4 rounded-lg border ${getHealthColor(module.health || 'fair')}`}>
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-white">{module.name || 'Module'}</h3>
        {getStatusIcon(module.status)}
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-slate-300 mb-1">
          <span>Utilization</span>
          <span>{module.percentage || 0}%</span>
        </div>
        <div className="w-full bg-slate-700/50 rounded-full h-2">
          <div
            className={`h-full rounded-full transition-all ${getProgressColor(module.health || 'fair')}`}
            style={{ width: `${Math.min(100, module.percentage || 0)}%` }}
          />
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-700/50 text-xs text-slate-400">
        <div className="flex justify-between">
          <span>Active: {module.active || 0}/{module.total || 0}</span>
          {module.lastRun && (
            <span>Last: {new Date(module.lastRun).toLocaleTimeString()}</span>
          )}
        </div>
      </div>
    </div>
  );
});

SystemHealthCard.displayName = 'SystemHealthCard';
export default SystemHealthCard;
