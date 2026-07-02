import React from 'react';
import { Clock, CheckCircle, AlertCircle, Clock as ClockIcon } from 'lucide-react';

const ExecutionTimeline = React.memo(({ events = [] }) => {
  const getEventIcon = (type) => {
    switch (type) {
      case 'automation':
        return <ClockIcon size={16} className="text-blue-400" />;
      case 'workflow':
        return <Clock size={16} className="text-purple-400" />;
      case 'scheduler':
        return <Clock size={16} className="text-cyan-400" />;
      default:
        return <Clock size={16} className="text-slate-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
      case 'success':
        return 'bg-green-500/20 border-green-500/50';
      case 'failed':
      case 'error':
        return 'bg-red-500/20 border-red-500/50';
      case 'running':
        return 'bg-blue-500/20 border-blue-500/50';
      default:
        return 'bg-slate-500/20 border-slate-500/50';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
      case 'success':
        return <CheckCircle size={14} className="text-green-400" />;
      case 'failed':
      case 'error':
        return <AlertCircle size={14} className="text-red-400" />;
      default:
        return null;
    }
  };

  const recentEvents = events.slice(0, 8);

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
      <h3 className="text-white font-semibold mb-6">Recent Activity</h3>
      
      <div className="space-y-3">
        {recentEvents.length > 0 ? (
          recentEvents.map((event, idx) => (
            <div key={idx} className={`border rounded-lg p-3 ${getStatusColor(event.status)}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  {getEventIcon(event.type)}
                  <div>
                    <div className="font-semibold text-white text-sm">{event.name}</div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {event.timestamp ? new Date(event.timestamp).toLocaleString() : 'No timestamp'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-300 capitalize">{event.status}</span>
                  {getStatusIcon(event.status)}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-6 text-slate-400 text-sm">
            No activity yet
          </div>
        )}
      </div>
    </div>
  );
});

ExecutionTimeline.displayName = 'ExecutionTimeline';
export default ExecutionTimeline;
