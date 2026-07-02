import React from 'react';
import { CheckCircle2, AlertCircle, Info, Clock } from 'lucide-react';

const AutomationEvent = ({ event, isLast = false, compact = false }) => {
  if (!event) return null;

  const levelIcons = {
    success: <CheckCircle2 size={20} className="text-green-600" />,
    warning: <AlertCircle size={20} className="text-yellow-600" />,
    error: <AlertCircle size={20} className="text-red-600" />,
    info: <Info size={20} className="text-blue-600" />,
  };

  const levelColors = {
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
  };

  const level = event.level || 'info';
  const icon = levelIcons[level] || levelIcons.info;

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className={`p-2 rounded-full ${levelColors[level]}`}>
          {icon}
        </div>
        {!isLast && <div className="w-1 h-8 bg-gray-200 my-1"></div>}
      </div>

      <div className={`pb-4 ${!isLast ? 'border-l border-gray-200 pl-4' : ''}`}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-semibold text-gray-900">
            {event.title}
          </span>
          <span className="text-xs text-gray-500">
            {formatTime(event.timestamp)}
          </span>
        </div>

        {event.description && (
          <p className="text-sm text-gray-600">
            {event.description}
          </p>
        )}

        {event.metadata && (
          <div className="mt-2 text-xs text-gray-500">
            {event.metadata.ruleName && (
              <div>Regla: {event.metadata.ruleName}</div>
            )}
            {event.metadata.type && (
              <div>Tipo: {event.metadata.type}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(AutomationEvent);
