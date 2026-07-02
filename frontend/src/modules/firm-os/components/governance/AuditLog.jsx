import React from 'react';
import { Clock, CheckCircle2, AlertCircle, Activity, Lock } from 'lucide-react';

const AuditLog = React.memo(({ events = [] }) => {
  const getEventIcon = (type) => {
    switch (type) {
      case 'decision_made':
        return <Activity size={16} className="text-blue-400" />;
      case 'action_executed':
        return <CheckCircle2 size={16} className="text-green-400" />;
      case 'approval_requested':
        return <Lock size={16} className="text-yellow-400" />;
      case 'approval_granted':
        return <CheckCircle2 size={16} className="text-green-400" />;
      case 'approval_rejected':
        return <AlertCircle size={16} className="text-red-400" />;
      default:
        return <Clock size={16} className="text-slate-400" />;
    }
  };

  const getEventColor = (type) => {
    switch (type) {
      case 'decision_made':
        return 'bg-blue-500/10 border-blue-500/30';
      case 'action_executed':
        return 'bg-green-500/10 border-green-500/30';
      case 'approval_granted':
        return 'bg-green-500/10 border-green-500/30';
      case 'approval_rejected':
        return 'bg-red-500/10 border-red-500/30';
      default:
        return 'bg-slate-500/10 border-slate-500/30';
    }
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 space-y-4">
      <h3 className="text-white font-semibold">Audit Trail</h3>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {events.length > 0 ? (
          events.slice(0, 20).map((event, idx) => (
            <div key={idx} className={`border rounded-lg p-3 ${getEventColor(event.type)}`}>
              <div className="flex items-start gap-3">
                {getEventIcon(event.type)}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-white text-sm capitalize">
                      {event.type?.replace(/_/g, ' ')}
                    </div>
                    <span className="text-xs text-slate-400">
                      {new Date(event.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-xs text-slate-300 mt-1">
                    Actor: <span className="text-white">{event.actor}</span>
                  </div>
                  {event.resource && (
                    <div className="text-xs text-slate-300 mt-1">
                      Resource: <span className="text-white">{event.resource.name || event.resource.id}</span>
                    </div>
                  )}
                  {event.decision?.confidence !== undefined && (
                    <div className="text-xs text-slate-300 mt-1">
                      Confidence: <span className="text-white font-semibold">{event.decision.confidence}%</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-slate-400 text-sm">
            No events recorded
          </div>
        )}
      </div>

      {events.length > 20 && (
        <div className="text-xs text-slate-400 text-center">
          Showing 20 of {events.length} events
        </div>
      )}
    </div>
  );
});

AuditLog.displayName = 'AuditLog';
export default AuditLog;
