import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  buildNotifications,
  groupNotifications,
  prioritizeNotifications,
  dismissNotification,
  markAsRead,
  filterNotifications,
  deserializeNotifications,
  serializeNotifications,
} from '../domain/notificationDomain';
import {
  buildNotificationCenterViewModel,
  buildAutomationTimelineViewModel,
  buildRecommendationsCenter,
  buildNotificationStatistics,
  buildUnreadCounter,
  buildSidebarBadgeData,
} from '../application/notificationApplication';

const STORAGE_KEY = 'firm-os/notifications';

export function useNotifications(alerts = [], recommendations = [], automationHistory = []) {
  const [notifications, setNotifications] = useState(() => {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          return deserializeNotifications(stored);
        }
      }
    } catch (error) {
      console.warn('Failed to load notifications:', error);
    }

    return buildNotifications(alerts, recommendations, automationHistory);
  });

  // Update notifications when source data changes
  useEffect(() => {
    const newNotifications = buildNotifications(alerts, recommendations, automationHistory);
    setNotifications(prev => {
      const merged = [...newNotifications];
      prev.forEach(prevNotif => {
        if (!merged.find(n => n.id === prevNotif.id)) {
          merged.push(prevNotif);
        }
      });
      return merged.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    });
  }, [alerts, recommendations, automationHistory]);

  // Persist notifications to localStorage
  const persistNotifications = useCallback((notifs) => {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, serializeNotifications(notifs));
      }
    } catch (error) {
      console.warn('Failed to persist notifications:', error);
    }
  }, []);

  const markAsReadAction = useCallback((notificationId) => {
    setNotifications(prev => {
      const updated = markAsRead(prev, notificationId);
      persistNotifications(updated);
      return updated;
    });
  }, [persistNotifications]);

  const dismiss = useCallback((notificationId) => {
    setNotifications(prev => {
      const updated = dismissNotification(prev, notificationId);
      persistNotifications(updated);
      return updated;
    });
  }, [persistNotifications]);

  const clearAll = useCallback(() => {
    setNotifications([]);
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (error) {
      console.warn('Failed to clear notifications:', error);
    }
  }, []);

  const refresh = useCallback(() => {
    const updated = buildNotifications(alerts, recommendations, automationHistory);
    setNotifications(updated);
    persistNotifications(updated);
  }, [alerts, recommendations, automationHistory, persistNotifications]);

  // Memoized view models
  const centerVM = useMemo(() => {
    return buildNotificationCenterViewModel(alerts, recommendations, automationHistory);
  }, [alerts, recommendations, automationHistory]);

  const timelineVM = useMemo(() => {
    return buildAutomationTimelineViewModel(automationHistory);
  }, [automationHistory]);

  const recommendationsCenter = useMemo(() => {
    return buildRecommendationsCenter(recommendations);
  }, [recommendations]);

  const statistics = useMemo(() => {
    return buildNotificationStatistics(notifications, automationHistory);
  }, [notifications, automationHistory]);

  const unreadCount = useMemo(() => {
    return buildUnreadCounter(notifications);
  }, [notifications]);

  const sidebarBadge = useMemo(() => {
    return buildSidebarBadgeData(notifications);
  }, [notifications]);

  const grouped = useMemo(() => {
    return groupNotifications(notifications);
  }, [notifications]);

  const prioritized = useMemo(() => {
    return prioritizeNotifications(notifications);
  }, [notifications]);

  return {
    // Data
    notifications,
    grouped,
    prioritized,
    unreadCount,

    // View Models
    centerVM,
    timelineVM,
    recommendationsCenter,
    statistics,
    sidebarBadge,

    // Actions
    markAsRead: markAsReadAction,
    dismiss,
    clearAll,
    refresh,

    // Utilities
    filter: useCallback((filters) => filterNotifications(notifications, filters), [notifications]),
  };
}
