import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import NotificationBadge from './NotificationBadge';
import NotificationCard from './NotificationCard';

const NotificationBell = ({ 
  notifications, 
  unreadCount, 
  onMarkAsRead, 
  onDismiss,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  const handleClickOutside = useCallback((e) => {
    if (!dropdownRef.current?.contains(e.target) && !buttonRef.current?.contains(e.target)) {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, handleClickOutside]);

  const handleNotificationClick = useCallback((notification) => {
    if (!notification.read) {
      onMarkAsRead?.(notification.id);
    }
  }, [onMarkAsRead]);

  const displayNotifications = notifications.slice(0, 5).filter(n => !n.dismissed);
  const hasCritical = unreadCount > 0 && notifications.some(
    n => !n.read && !n.dismissed && n.severity === 'critical'
  );

  return (
    <div className={`relative ${className}`}>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="Notificaciones"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <NotificationBadge count={unreadCount} hasCritical={hasCritical} className="absolute -top-1 -right-1" />
        )}
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50"
        >
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900">Notificaciones</h3>
            <p className="text-xs text-gray-500 mt-1">
              {unreadCount > 0 ? `${unreadCount} sin leer` : 'Sin notificaciones nuevas'}
            </p>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {displayNotifications.length > 0 ? (
              displayNotifications.map(notification => (
                <div
                  key={notification.id}
                  className="border-b border-gray-100 last:border-b-0"
                  onClick={() => handleNotificationClick(notification)}
                >
                  <NotificationCard
                    notification={notification}
                    compact
                    onDismiss={() => onDismiss?.(notification.id)}
                  />
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-sm text-gray-500">
                No hay notificaciones
              </div>
            )}
          </div>

          {notifications.length > 5 && (
            <div className="p-3 border-t border-gray-200 text-center">
              <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                Ver todas ({notifications.length})
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default React.memo(NotificationBell);
