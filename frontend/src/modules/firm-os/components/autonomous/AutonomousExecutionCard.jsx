import React from 'react';
import { CheckCircle, AlertCircle, Clock, Loader } from 'lucide-react';

const AutonomousExecutionCard = React.memo(({ execution = {} }) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={18} className="text-green-400" />;
      case 'running':
        return <Loader size={18} className="text-blue-400 animate-spin" />;
      case 'failed':
        return <AlertCircle size={18} className="text-red-400" />;
      case 'pending':
        return <Clock size={18} className="text-slate-400" />;
      default:
        return <Clock size={18} className="text-slate-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 border-green-500/30';
      case 'running':
        return 'bg-blue-500/20 border-blue-500/30';
      case 'failed':
        return 'bg-red-500/20 border-red-500/30';
      case 'pending':
        return 'bg-slate-500/20 border-slate-500/30';
      default:
        return 'bg-slate-500/20 border-slate-500/30';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'running':
        return 'Running';
      case 'failed':
        return 'Failed';
      case 'pending':
        return 'Pending';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className={`border rounded-lg p-4 ${getStatusColor(execution.status)}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {getStatusIcon(execution.status)}
          <div>
            <div className="font-semibold text-white text-sm">{execution.action || 'Unknown Action'}</div>
            <div className="text-xs text-slate-300 mt-0.5">
              {new Date(execution.timestamp).toLocaleString()}
            </div>
          </div>
        </div>
        <span className="text-xs font-medium text-white/70 capitalize">
          {getStatusText(execution.status)}
        </span>
      </div>

      {execution.reason && (
        <div className="mb-2 text-xs text-slate-300">
          <span className="text-slate-400">Reason: </span>{execution.reason}
        </div>
      )}

      <div className="grid grid-cols-3 gap-3 text-xs">
        {execution.confidence !== undefined && (
          <div>
            <div className="text-slate-400">Confidence</div>
            <div className="font-semibold text-white mt-0.5">{execution.confidence}%</div>
          </div>
        )}
        {execution.duration !== undefined && (
          <div>
            <div className="text-slate-400">Duration</div>
            <div className="font-semibold text-white mt-0.5">{execution.duration}ms</div>
          </div>
        )}
        {execution.result && (
          <div>
            <div className="text-slate-400">Result</div>
            <div className="font-semibold text-white mt-0.5 capitalize">{execution.result}</div>
          </div>
        )}
      </div>

      {execution.automated && (
        <div className="mt-3 pt-3 border-t border-white/10">
          <span className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded">
            Automated Execution
          </span>
        </div>
      )}
    </div>
  );
});

AutonomousExecutionCard.displayName = 'AutonomousExecutionCard';
export default AutonomousExecutionCard;
