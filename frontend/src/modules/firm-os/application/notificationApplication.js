// Application layer - Orchestrates notification domain
// NO UI logic, NO components, NO side effects

import {
  buildNotifications,
  groupNotifications,
  prioritizeNotifications,
  generateNotificationSummary,
  buildNotificationTimeline,
  filterNotifications,
} from '../domain/notificationDomain';

export function buildNotificationCenterViewModel(alerts, recommendations, automationHistory) {
  const notifications = buildNotifications(alerts, recommendations, automationHistory);
  const grouped = groupNotifications(notifications);
  const prioritized = prioritizeNotifications(notifications);
  const summary = generateNotificationSummary(notifications);

  return {
    notifications,
    grouped,
    prioritized,
    summary,
    unreadCount: summary.unread,
    criticalCount: summary.critical,
    warningCount: summary.warning,
  };
}

export function buildAutomationTimelineViewModel(automationHistory) {
  if (!Array.isArray(automationHistory)) {
    return {
      events: [],
      count: 0,
      hasEvents: false,
    };
  }

  const timeline = buildNotificationTimeline(automationHistory);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayEvents = timeline.filter(event => {
    const eventDate = new Date(event.timestamp);
    eventDate.setHours(0, 0, 0, 0);
    return eventDate.getTime() === today.getTime();
  });

  return {
    events: timeline,
    todayEvents,
    count: timeline.length,
    todayCount: todayEvents.length,
    hasEvents: timeline.length > 0,
    lastEvent: timeline.length > 0 ? timeline[0] : null,
  };
}

export function buildRecommendationsCenter(recommendations) {
  if (!Array.isArray(recommendations)) {
    return {
      recommendations: [],
      count: 0,
      grouped: {
        high: [],
        medium: [],
        low: [],
      },
      hasRecommendations: false,
    };
  }

  const grouped = {
    high: recommendations.filter(r => r.priority === 'high'),
    medium: recommendations.filter(r => r.priority === 'medium'),
    low: recommendations.filter(r => r.priority === 'low'),
  };

  return {
    recommendations,
    count: recommendations.length,
    grouped,
    topRecommendations: grouped.high.slice(0, 5),
    hasRecommendations: recommendations.length > 0,
    highPriorityCount: grouped.high.length,
  };
}

export function buildNotificationStatistics(notifications, automationHistory) {
  const summary = generateNotificationSummary(notifications);
  
  const executionsToday = automationHistory
    ? automationHistory.filter(event => {
        const eventDate = new Date(event.timestamp);
        const today = new Date();
        return eventDate.toDateString() === today.toDateString();
      }).length
    : 0;

  return {
    totalNotifications: summary.total,
    unreadNotifications: summary.unread,
    criticalAlerts: summary.critical,
    warningAlerts: summary.warning,
    informationalAlerts: summary.info,
    automationExecutionsToday: executionsToday,
    dismissRate: summary.total > 0 ? Math.round((summary.total - summary.unread) / summary.total * 100) : 0,
  };
}

export function buildUnreadCounter(notifications) {
  if (!Array.isArray(notifications)) return 0;
  return notifications.filter(n => !n.read && !n.dismissed).length;
}

export function buildNotificationFilters(notifications) {
  return [
    {
      id: 'all',
      label: 'Todas',
      count: notifications.length,
      filter: { dismissed: false },
    },
    {
      id: 'critical',
      label: 'Críticas',
      count: notifications.filter(n => n.severity === 'critical' && !n.dismissed).length,
      filter: { severity: 'critical', dismissed: false },
    },
    {
      id: 'warnings',
      label: 'Advertencias',
      count: notifications.filter(n => n.severity === 'high' && !n.dismissed).length,
      filter: { severity: 'high', dismissed: false },
    },
    {
      id: 'recommendations',
      label: 'Recomendaciones',
      count: notifications.filter(n => n.type === 'recommendation' && !n.dismissed).length,
      filter: { type: 'recommendation', dismissed: false },
    },
  ];
}

export function buildAutomationHealthCard(automationVM) {
  if (!automationVM) {
    return {
      status: 'unknown',
      message: 'Sin datos de automatización',
      alerts: 0,
      recommendations: 0,
      lastExecution: null,
      health: 'N/A',
    };
  }

  const alerts = automationVM.alerts ? automationVM.alerts.length : 0;
  const recommendations = automationVM.recommendations ? automationVM.recommendations.length : 0;
  const firmRisk = automationVM.firmRisk || 0;

  let status = 'healthy';
  let health = 'Óptimo';

  if (firmRisk > 80) {
    status = 'critical';
    health = 'Crítico';
  } else if (firmRisk > 60) {
    status = 'warning';
    health = 'En riesgo';
  } else if (firmRisk > 40) {
    status = 'caution';
    health = 'Requiere atención';
  }

  return {
    status,
    health,
    message: `Firma con ${firmRisk}% de ocupación`,
    alerts,
    recommendations,
    lastExecution: automationVM.summary?.timestamp || null,
    firmRisk,
    evaluatedRules: automationVM.summary?.totalEvaluated || 0,
    passedRules: automationVM.summary?.passed || 0,
  };
}

export function buildSidebarBadgeData(notifications) {
  const unreadCount = notifications.filter(n => !n.read && !n.dismissed).length;
  const criticalCount = notifications.filter(n => n.severity === 'critical' && !n.dismissed).length;

  return {
    show: unreadCount > 0,
    count: unreadCount,
    hasCritical: criticalCount > 0,
    label: unreadCount > 0 ? `Automatización (${unreadCount})` : 'Automatización',
  };
}
