import React, { useState, useMemo } from 'react';
import { Trash2, CheckCheck, Filter } from 'lucide-react';
import NotificationCard from './NotificationCard';
import RecommendationCard from './RecommendationCard';
import { filterNotifications } from '../../domain/notificationDomain';

const NotificationCenter = ({ 
  notifications,
  recommendations,
  onMarkAsRead,
  onDismiss,
  onClearAll
}) => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredNotifications = useMemo(() => {
    let result = [...notifications];

    if (activeFilter !== 'all') {
      result = filterNotifications(result, { 
        type: activeFilter !== 'all' ? activeFilter : undefined,
        dismissed: false 
      });
    } else {
      result = result.filter(n => !n.dismissed);
    }

    if (searchQuery) {
      result = filterNotifications(result, { 
        search: searchQuery,
        dismissed: false 
      });
    }

    return result;
  }, [notifications, activeFilter, searchQuery]);

  const notificationTypes = useMemo(() => {
    const types = new Set();
    notifications.forEach(n => {
      if (!n.dismissed) types.add(n.type);
    });
    return Array.from(types);
  }, [notifications]);

  const unreadCount = notifications.filter(n => !n.read && !n.dismissed).length;

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Centro de Notificaciones
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {unreadCount > 0 
                ? `${unreadCount} notificación${unreadCount !== 1 ? 'es' : ''} sin leer`
                : 'Sin notificaciones nuevas'
              }
            </p>
          </div>

          <div className="flex gap-2">
            {unreadCount > 0 && (
              <button
                onClick={() => notifications.forEach(n => !n.read && onMarkAsRead?.(n.id))}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Marcar todas como leídas"
              >
                <CheckCheck size={18} />
                Marcar todas
              </button>
            )}

            {notifications.length > 0 && (
              <button
                onClick={onClearAll}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                title="Limpiar todas"
              >
                <Trash2 size={18} />
                Limpiar
              </button>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Buscar notificaciones..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {notificationTypes.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                  activeFilter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Todas ({notifications.filter(n => !n.dismissed).length})
              </button>

              {notificationTypes.map(type => {
                const count = notifications.filter(n => n.type === type && !n.dismissed).length;
                return (
                  <button
                    key={type}
                    onClick={() => setActiveFilter(type)}
                    className={`px-3 py-1 text-xs font-medium rounded-full transition-colors capitalize ${
                      activeFilter === type
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {type} ({count})
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map(notification => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              onDismiss={() => onDismiss?.(notification.id)}
              onClick={() => onMarkAsRead?.(notification.id)}
            />
          ))
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
            <Filter size={32} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">
              {searchQuery || activeFilter !== 'all' 
                ? 'No hay notificaciones que coincidan'
                : 'Sin notificaciones'
              }
            </p>
          </div>
        )}
      </div>

      {recommendations && recommendations.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recomendaciones Destacadas
          </h3>

          <div className="space-y-3">
            {recommendations.slice(0, 5).map(rec => (
              <RecommendationCard
                key={rec.id}
                recommendation={rec}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(NotificationCenter);
