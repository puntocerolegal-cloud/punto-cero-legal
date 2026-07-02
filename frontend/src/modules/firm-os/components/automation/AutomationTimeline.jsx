import React, { useMemo } from 'react';
import AutomationEvent from './AutomationEvent';
import { Clock } from 'lucide-react';

const AutomationTimeline = ({ 
  events, 
  limit = 10,
  title = 'Timeline de Automatización',
  emptyMessage = 'Sin eventos registrados'
}) => {
  const displayEvents = useMemo(() => {
    if (!Array.isArray(events)) return [];
    return events.slice(0, limit);
  }, [events, limit]);

  if (displayEvents.length === 0) {
    return (
      <div className="border border-gray-200 rounded-lg p-8 text-center">
        <Clock size={32} className="mx-auto text-gray-300 mb-3" />
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">
        {title}
      </h3>

      <div>
        {displayEvents.map((event, index) => (
          <AutomationEvent
            key={event.id || index}
            event={event}
            isLast={index === displayEvents.length - 1}
          />
        ))}
      </div>

      {events.length > limit && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            Ver más eventos ({events.length - limit})
          </button>
        </div>
      )}
    </div>
  );
};

export default React.memo(AutomationTimeline);
