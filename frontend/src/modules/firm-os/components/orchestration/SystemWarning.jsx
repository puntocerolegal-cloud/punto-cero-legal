import React from 'react';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';

const SystemWarning = React.memo(({ warning = {} }) => {
  const getIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle size={20} className="text-red-400" />;
      case 'high':
        return <AlertTriangle size={20} className="text-orange-400" />;
      default:
        return <Info size={20} className="text-blue-400" />;
    }
  };

  const getBgColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500/10 border-red-500/30';
      case 'high':
        return 'bg-orange-500/10 border-orange-500/30';
      default:
        return 'bg-blue-500/10 border-blue-500/30';
    }
  };

  return (
    <div className={`border rounded-lg p-4 ${getBgColor(warning.severity)}`}>
      <div className="flex items-start gap-3">
        {getIcon(warning.severity)}
        <div className="flex-1">
          <div className="font-semibold text-white text-sm">{warning.title}</div>
          <div className="text-xs text-slate-300 mt-1">{warning.description}</div>
          {warning.module && (
            <div className="text-xs text-slate-400 mt-2">Module: {warning.module}</div>
          )}
        </div>
      </div>
    </div>
  );
});

SystemWarning.displayName = 'SystemWarning';
export default SystemWarning;
