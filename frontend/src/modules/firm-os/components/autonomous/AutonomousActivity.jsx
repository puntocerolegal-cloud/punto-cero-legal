import React from 'react';
import { Clock, CheckCircle, AlertCircle, Zap } from 'lucide-react';

const AutonomousActivity = React.memo(({ activity = {} }) => {
  const getActivityIcon = (type) => {
    switch (type) {
      case 'automation':
        return <Zap size={16} className="text-blue-400" />;
      case 'workflow':
        return <Clock size={16} className="text-purple-400" />;
      case 'scheduler':
        return <Clock size={16} className="text-cyan-400" />;
      case 'decision':
        return <CheckCircle size={16} className="text-green-400" />;
      case 'approval':
        return <AlertCircle size={16} className="text-yellow-400" />;
      default:
        return <Clock size={16} className="text-slate-400" />;
    }
  };

  const getResultColor = (result) => {
    switch (result) {
      case 'success':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'failed':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
    }
  };

  const recentActivity = activity.recent || [];

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-white font-semibold">Activity Feed</h3>
        <span className="text-xs text-slate-400">{recentActivity.length} recent</span>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {recentActivity.length > 0 ? (
          recentActivity.map((item, idx) => (
            <div key={idx} className={`border rounded-lg p-3 ${getResultColor(item.result)}`}>
              <div className="flex items-start gap-3">
                {getActivityIcon(item.type)}
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-white text-sm">
                        {item.action || 'Unknown Action'}
                      </div>
                      <div className="text-xs text-slate-300 mt-0.5">
                        {new Date(item.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <span className="text-xs font-medium capitalize">
                      {item.result}
                    </span>
                  </div>

                  {item.reason && (
                    <div className="text-xs text-slate-300 mt-2">
                      {item.reason}
                    </div>
                  )}

                  <div className="flex gap-4 mt-2 text-xs text-slate-400">
                    {item.confidence !== undefined && (
                      <span>Confidence: {item.confidence}%</span>
                    )}
                    {item.duration !== undefined && (
                      <span>Time: {item.duration}ms</span>
                    )}
                    {item.automated !== undefined && (
                      <span>{item.automated ? '🤖 Auto' : '👤 Manual'}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-slate-400 text-sm">
            No activity yet
          </div>
        )}
      </div>

      {recentActivity.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-700 text-xs text-slate-400 grid grid-cols-3 gap-4">
          <div>
            <div>Successful</div>
            <div className="font-semibold text-green-400">{activity.successful || 0}</div>
          </div>
          <div>
            <div>Failed</div>
            <div className="font-semibold text-red-400">{activity.failed || 0}</div>
          </div>
          <div>
            <div>Automated</div>
            <div className="font-semibold text-blue-400">{activity.automated || 0}</div>
          </div>
        </div>
      )}
    </div>
  );
});

AutonomousActivity.displayName = 'AutonomousActivity';
export default AutonomousActivity;
