import React from 'react';
import { Clock, AlertCircle } from 'lucide-react';
import { getScheduleTypeLabel, getScheduleIcon } from '../../domain/schedulerDomain';

const UpcomingExecutions = ({ executions, limit = 10 }) => {
  if (!Array.isArray(executions) || executions.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock size={32} className="mx-auto text-gray-300 mb-3" />
        <p className="text-gray-500">Sin ejecuciones programadas</p>
      </div>
    );
  }

  const displayExecutions = executions.slice(0, limit);

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((date - now) / 60000);

    if (diffMinutes < 0) return 'Vencido';
    if (diffMinutes === 0) return 'Ahora';
    if (diffMinutes < 60) return `En ${diffMinutes}m`;
    if (diffMinutes < 1440) return `En ${Math.floor(diffMinutes / 60)}h`;
    return date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const isUpcoming = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    return date > now;
  };

  return (
    <div className="space-y-2">
      {displayExecutions.map((exec, idx) => (
        <div
          key={idx}
          className={`flex items-center justify-between p-3 rounded-lg border ${
            isUpcoming(exec.timestamp)
              ? 'border-blue-200 bg-blue-50'
              : 'border-gray-200 bg-gray-50'
          }`}
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900">{exec.scheduleName}</p>
            <p className="text-xs text-gray-600 mt-0.5">
              {getScheduleTypeLabel(exec.scheduletype)}
            </p>
          </div>

          <div className="text-right ml-4">
            <p className={`text-sm font-medium ${
              isUpcoming(exec.timestamp) ? 'text-blue-600' : 'text-gray-500'
            }`}>
              {formatTime(exec.timestamp)}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {new Date(exec.timestamp).toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        </div>
      ))}

      {executions.length > limit && (
        <div className="pt-2 text-center">
          <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">
            Ver todos ({executions.length})
          </button>
        </div>
      )}
    </div>
  );
};

export default React.memo(UpcomingExecutions);
