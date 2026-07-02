// Pure domain functions for notifications - NO React, NO side effects

export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  WARNING: 'warning',
  CRITICAL: 'critical',
  RECOMMENDATION: 'recommendation',
  INFORMATION: 'information',
};

export const NOTIFICATION_SEVERITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

export function buildNotification(data) {
  if (!data) return null;

  return {
    id: data.id || `notif_${Date.now()}_${Math.random()}`,
    type: data.type || NOTIFICATION_TYPES.INFORMATION,
    title: data.title || 'Notificación',
    message: data.message || '',
    severity: data.severity || NOTIFICATION_SEVERITIES.MEDIUM,
    timestamp: data.timestamp || new Date().toISOString(),
    read: data.read !== undefined ? data.read : false,
    dismissed: data.dismissed !== undefined ? data.dismissed : false,
    action: data.action || null,
    relatedRuleId: data.relatedRuleId || null,
    metadata: data.metadata || {},
  };
}

export function buildNotifications(alerts, recommendations, automationEvents = []) {
  const notifications = [];

  if (Array.isArray(alerts)) {
    alerts.forEach(alert => {
      notifications.push(buildNotification({
        id: `alert_${alert.id || Date.now()}`,
        type: alert.type || NOTIFICATION_TYPES.CRITICAL,
        title: alert.title || 'Alerta de Automatización',
        message: alert.message || alert.description || '',
        severity: calculateNotificationSeverity(alert),
        timestamp: alert.timestamp || new Date().toISOString(),
        relatedRuleId: alert.ruleId,
        metadata: alert,
      }));
    });
  }

  if (Array.isArray(recommendations)) {
    recommendations.forEach(rec => {
      notifications.push(buildNotification({
        id: `rec_${rec.id || Date.now()}`,
        type: NOTIFICATION_TYPES.RECOMMENDATION,
        title: rec.title || 'Recomendación',
        message: rec.description || rec.message || '',
        severity: rec.priority === 'high' ? NOTIFICATION_SEVERITIES.HIGH : NOTIFICATION_SEVERITIES.MEDIUM,
        timestamp: rec.timestamp || new Date().toISOString(),
        relatedRuleId: rec.ruleId,
        metadata: rec,
      }));
    });
  }

  if (Array.isArray(automationEvents)) {
    automationEvents.forEach(event => {
      notifications.push(buildNotification({
        id: `event_${event.id || Date.now()}`,
        type: NOTIFICATION_TYPES.INFORMATION,
        title: event.title || 'Evento de Automatización',
        message: event.description || event.message || '',
        severity: NOTIFICATION_SEVERITIES.LOW,
        timestamp: event.timestamp || new Date().toISOString(),
        relatedRuleId: event.ruleId,
        metadata: event,
      }));
    });
  }

  return notifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

export function groupNotifications(notifications) {
  if (!Array.isArray(notifications)) return {};

  return {
    all: notifications,
    unread: notifications.filter(n => !n.read && !n.dismissed),
    read: notifications.filter(n => n.read && !n.dismissed),
    dismissed: notifications.filter(n => n.dismissed),
    byType: {
      success: notifications.filter(n => n.type === NOTIFICATION_TYPES.SUCCESS),
      warning: notifications.filter(n => n.type === NOTIFICATION_TYPES.WARNING),
      critical: notifications.filter(n => n.type === NOTIFICATION_TYPES.CRITICAL),
      recommendation: notifications.filter(n => n.type === NOTIFICATION_TYPES.RECOMMENDATION),
      information: notifications.filter(n => n.type === NOTIFICATION_TYPES.INFORMATION),
    },
    bySeverity: {
      low: notifications.filter(n => n.severity === NOTIFICATION_SEVERITIES.LOW),
      medium: notifications.filter(n => n.severity === NOTIFICATION_SEVERITIES.MEDIUM),
      high: notifications.filter(n => n.severity === NOTIFICATION_SEVERITIES.HIGH),
      critical: notifications.filter(n => n.severity === NOTIFICATION_SEVERITIES.CRITICAL),
    },
  };
}

export function filterNotifications(notifications, filters = {}) {
  if (!Array.isArray(notifications)) return [];

  let result = [...notifications];

  if (filters.type && filters.type !== 'all') {
    result = result.filter(n => n.type === filters.type);
  }

  if (filters.severity && filters.severity !== 'all') {
    result = result.filter(n => n.severity === filters.severity);
  }

  if (filters.read !== undefined) {
    result = result.filter(n => n.read === filters.read);
  }

  if (filters.dismissed !== undefined) {
    result = result.filter(n => n.dismissed === filters.dismissed);
  }

  if (filters.search) {
    const query = filters.search.toLowerCase();
    result = result.filter(n => 
      n.title.toLowerCase().includes(query) || 
      n.message.toLowerCase().includes(query)
    );
  }

  if (filters.sinceTimestamp) {
    const since = new Date(filters.sinceTimestamp);
    result = result.filter(n => new Date(n.timestamp) >= since);
  }

  return result;
}

export function prioritizeNotifications(notifications) {
  if (!Array.isArray(notifications)) return [];

  const severityOrder = {
    [NOTIFICATION_SEVERITIES.CRITICAL]: 0,
    [NOTIFICATION_SEVERITIES.HIGH]: 1,
    [NOTIFICATION_SEVERITIES.MEDIUM]: 2,
    [NOTIFICATION_SEVERITIES.LOW]: 3,
  };

  return [...notifications].sort((a, b) => {
    const severityDiff = (severityOrder[a.severity] || 99) - (severityOrder[b.severity] || 99);
    if (severityDiff !== 0) return severityDiff;
    return new Date(b.timestamp) - new Date(a.timestamp);
  });
}

export function dismissNotification(notifications, notificationId) {
  if (!Array.isArray(notifications)) return [];

  return notifications.map(n => 
    n.id === notificationId ? { ...n, dismissed: true } : n
  );
}

export function markAsRead(notifications, notificationId) {
  if (!Array.isArray(notifications)) return [];

  return notifications.map(n => 
    n.id === notificationId ? { ...n, read: true } : n
  );
}

export function markAllAsRead(notifications) {
  if (!Array.isArray(notifications)) return [];

  return notifications.map(n => ({ ...n, read: true }));
}

export function calculateNotificationSeverity(alert) {
  if (!alert) return NOTIFICATION_SEVERITIES.MEDIUM;

  if (alert.severity) return alert.severity;

  if (alert.type === 'critical' || alert.level === 'critical') {
    return NOTIFICATION_SEVERITIES.CRITICAL;
  }

  if (alert.type === 'warning' || alert.level === 'warning') {
    return NOTIFICATION_SEVERITIES.HIGH;
  }

  if (alert.type === 'error' || alert.level === 'error') {
    return NOTIFICATION_SEVERITIES.HIGH;
  }

  return NOTIFICATION_SEVERITIES.MEDIUM;
}

export function buildNotificationTimeline(automationHistory = []) {
  if (!Array.isArray(automationHistory)) return [];

  return automationHistory
    .map(event => ({
      id: event.id,
      timestamp: event.timestamp,
      title: event.rule || event.title || 'Evento de Automatización',
      description: event.description || event.message || '',
      type: event.type || 'info',
      level: event.level || event.severity || 'info',
      ruleId: event.ruleId,
      metadata: event,
    }))
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

export function generateNotificationSummary(notifications) {
  if (!Array.isArray(notifications)) {
    return {
      total: 0,
      unread: 0,
      critical: 0,
      warning: 0,
      info: 0,
    };
  }

  return {
    total: notifications.length,
    unread: notifications.filter(n => !n.read && !n.dismissed).length,
    critical: notifications.filter(n => n.severity === NOTIFICATION_SEVERITIES.CRITICAL).length,
    warning: notifications.filter(n => n.severity === NOTIFICATION_SEVERITIES.HIGH).length,
    info: notifications.filter(n => n.severity === NOTIFICATION_SEVERITIES.LOW).length,
  };
}

export function serializeNotifications(notifications) {
  if (!Array.isArray(notifications)) return '[]';

  try {
    return JSON.stringify(notifications.map(n => ({
      ...n,
      timestamp: n.timestamp || new Date().toISOString(),
    })));
  } catch (error) {
    return '[]';
  }
}

export function deserializeNotifications(json) {
  if (!json || typeof json !== 'string') return [];

  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

export function getNotificationColor(type) {
  const colors = {
    [NOTIFICATION_TYPES.SUCCESS]: '#10b981',
    [NOTIFICATION_TYPES.WARNING]: '#f59e0b',
    [NOTIFICATION_TYPES.CRITICAL]: '#ef4444',
    [NOTIFICATION_TYPES.RECOMMENDATION]: '#3b82f6',
    [NOTIFICATION_TYPES.INFORMATION]: '#6b7280',
  };

  return colors[type] || colors[NOTIFICATION_TYPES.INFORMATION];
}

export function getNotificationIcon(type) {
  const icons = {
    [NOTIFICATION_TYPES.SUCCESS]: 'CheckCircle',
    [NOTIFICATION_TYPES.WARNING]: 'AlertTriangle',
    [NOTIFICATION_TYPES.CRITICAL]: 'AlertCircle',
    [NOTIFICATION_TYPES.RECOMMENDATION]: 'Lightbulb',
    [NOTIFICATION_TYPES.INFORMATION]: 'Info',
  };

  return icons[type] || 'Bell';
}
