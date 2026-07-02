import React from 'react';
import { Circle, Zap, AlertCircle, PauseCircle } from 'lucide-react';

const ModuleStatus = React.memo(({ module = {} }) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <Zap size={16} className="text-green-400" />;
      case 'paused':
        return <PauseCircle size={16} className="text-yellow-400" />;
      case 'error':
        return <AlertCircle size={16} className="text-red-400" />;
      default:
        return <Circle size={16} className="text-slate-400" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'paused':
        return 'Paused';
      case 'error':
        return 'Error';
      default:
        return 'Idle';
    }
  };

  return (
    <div className="flex items-center justify-between bg-slate-800/50 border border-slate-700 rounded-lg p-4">
      <div className="flex items-center gap-3">
        {getStatusIcon(module.status)}
        <div>
          <div className="font-semibold text-white text-sm">{module.name}</div>
          <div className="text-xs text-slate-400">{getStatusText(module.status)}</div>
        </div>
      </div>
      <div className="text-right">
        <div className="text-lg font-bold text-white">{module.count || 0}</div>
        <div className="text-xs text-slate-400">executions</div>
      </div>
    </div>
  );
});

ModuleStatus.displayName = 'ModuleStatus';
export default ModuleStatus;
