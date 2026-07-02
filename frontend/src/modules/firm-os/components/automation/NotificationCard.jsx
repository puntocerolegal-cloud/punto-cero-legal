import React from 'react';
import { X, CheckCircle, AlertTriangle, AlertCircle, Lightbulb, Info } from 'lucide-react';
import { getNotificationColor, getNotificationIcon } from '../../domain/notificationDomain';

const NotificationCard = ({ 
  notification, 
  compact = false, 
  onDismiss,
  onClick 
}) => {
  if (!notification) return null;

  const icons = {
    CheckCircle,
    AlertTriangle,
    AlertCircle,
    Lightbulb,
    Info,
  };

  const IconComponent = icons[getNotificationIcon(notification.type)] || Info;
  const color = getNotificationColor(notification.type);

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now - date) / 60000);

    if (diffMinutes < 1) return 'Ahora';
    if (diffMinutes < 60) return `Hace ${diffMinutes}m`;
    if (diffMinutes < 1440) return `Hace ${Math.floor(diffMinutes / 60)}h`;
    return date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
  };

  const baseClasses = 'flex items-start gap-3 p-3 hover:bg-gray-50 cursor-pointer transition-colors';
  const fullClasses = 'flex items-start gap-3 p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow';

  return (
    <div
      className={compact ? baseClasses : fullClasses}
      onClick={onClick}
      role="button"
      tabIndex={0}
    >
      <div className="flex-shrink-0 mt-1">
        <IconComponent
          size={compact ? 18 : 20}
          color={color}
          strokeWidth={2}
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <h4 className={`font-medium text-gray-900 ${compact ? 'text-sm' : 'text-base'}`}>
              {notification.title}
            </h4>
            <p className={`text-gray-600 ${compact ? 'text-xs mt-0.5' : 'text-sm mt-1'}`}>
              {notification.message}
            </p>
          </div>

          {!compact && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDismiss?.();
              }}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600"
              aria-label="Descartar"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs text-gray-500">
            {formatTime(notification.timestamp)}
          </span>
          {!notification.read && (
            <span className="inline-block w-2 h-2 rounded-full bg-blue-600"></span>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(NotificationCard);
