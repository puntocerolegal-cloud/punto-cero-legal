// Pure domain functions for scheduler - NO React, NO side effects

export const SCHEDULE_TYPES = {
  MANUAL: 'manual',
  EVERY_MINUTE: 'every_minute',
  HOURLY: 'hourly',
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  SPECIFIC_DATE: 'specific_date',
  ON_STARTUP: 'on_startup',
  ON_EVENT: 'on_event',
  CONDITIONAL: 'conditional',
};

export const SUPPORTED_EVENTS = [
  'new_case',
  'case_updated',
  'case_closed',
  'client_created',
  'client_vip',
  'document_signed',
  'lawyer_added',
  'department_updated',
  'workflow_completed',
  'automation_completed',
];

export const SCHEDULE_STATUS = {
  ACTIVE: 'active',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
};

export function createSchedule(data) {
  if (!data || !data.name || !data.type) return null;

  return {
    id: data.id || `sch_${Date.now()}_${Math.random()}`,
    name: data.name,
    description: data.description || '',
    type: data.type,
    workflowId: data.workflowId || null,
    enabled: data.enabled !== false ? true : false,
    status: data.status || SCHEDULE_STATUS.ACTIVE,
    
    // Timing
    frequency: data.frequency || null, // minute, hour, day, week, month
    daysOfWeek: data.daysOfWeek || [], // 0-6 for weekly
    dayOfMonth: data.dayOfMonth || null, // 1-31 for monthly
    time: data.time || '09:00', // HH:mm
    specificDate: data.specificDate || null, // YYYY-MM-DD for specific_date
    timezone: data.timezone || 'UTC',
    
    // Events
    event: data.event || null, // for on_event type
    
    // Conditions
    condition: data.condition || null, // expression for conditional type
    conditionContext: data.conditionContext || {},
    
    // Execution
    lastExecuted: data.lastExecuted || null,
    nextExecution: data.nextExecution || null,
    executionCount: data.executionCount || 0,
    successCount: data.successCount || 0,
    failureCount: data.failureCount || 0,
    
    // Metadata
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt || new Date().toISOString(),
    tags: data.tags || [],
    metadata: data.metadata || {},
  };
}

export function updateSchedule(schedule, updates) {
  if (!schedule) return null;

  return {
    ...schedule,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
}

export function validateSchedule(schedule) {
  const errors = [];

  if (!schedule) {
    return { valid: false, errors: ['Schedule is required'] };
  }

  if (!schedule.name || schedule.name.trim().length === 0) {
    errors.push('Schedule name is required');
  }

  if (!schedule.type || !Object.values(SCHEDULE_TYPES).includes(schedule.type)) {
    errors.push('Valid schedule type is required');
  }

  if (!schedule.workflowId) {
    errors.push('Workflow is required');
  }

  if (schedule.type === SCHEDULE_TYPES.SPECIFIC_DATE) {
    if (!schedule.specificDate) {
      errors.push('Specific date is required');
    } else {
      const date = new Date(schedule.specificDate);
      if (date < new Date()) {
        errors.push('Specific date cannot be in the past');
      }
    }
  }

  if (schedule.type === SCHEDULE_TYPES.WEEKLY) {
    if (!Array.isArray(schedule.daysOfWeek) || schedule.daysOfWeek.length === 0) {
      errors.push('At least one day of week is required');
    }
  }

  if (schedule.type === SCHEDULE_TYPES.MONTHLY) {
    if (!schedule.dayOfMonth || schedule.dayOfMonth < 1 || schedule.dayOfMonth > 31) {
      errors.push('Valid day of month (1-31) is required');
    }
  }

  if (schedule.type === SCHEDULE_TYPES.ON_EVENT) {
    if (!schedule.event || !SUPPORTED_EVENTS.includes(schedule.event)) {
      errors.push('Valid event is required');
    }
  }

  if (schedule.type === SCHEDULE_TYPES.CONDITIONAL) {
    if (!schedule.condition || schedule.condition.trim().length === 0) {
      errors.push('Condition expression is required');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function calculateNextExecution(schedule) {
  if (!schedule || !schedule.enabled) return null;

  const now = new Date();
  const [hours, minutes] = (schedule.time || '09:00').split(':').map(Number);

  switch (schedule.type) {
    case SCHEDULE_TYPES.EVERY_MINUTE:
      return new Date(now.getTime() + 60000);

    case SCHEDULE_TYPES.HOURLY:
      const nextHour = new Date(now);
      nextHour.setHours(nextHour.getHours() + 1);
      nextHour.setMinutes(minutes);
      return nextHour;

    case SCHEDULE_TYPES.DAILY: {
      const nextDaily = new Date(now);
      nextDaily.setHours(hours, minutes, 0, 0);
      if (nextDaily <= now) {
        nextDaily.setDate(nextDaily.getDate() + 1);
      }
      return nextDaily;
    }

    case SCHEDULE_TYPES.WEEKLY: {
      const nextWeekly = new Date(now);
      nextWeekly.setHours(hours, minutes, 0, 0);
      
      while (!schedule.daysOfWeek.includes(nextWeekly.getDay())) {
        nextWeekly.setDate(nextWeekly.getDate() + 1);
      }
      
      if (nextWeekly <= now) {
        nextWeekly.setDate(nextWeekly.getDate() + 7);
      }
      return nextWeekly;
    }

    case SCHEDULE_TYPES.MONTHLY: {
      const nextMonthly = new Date(now);
      nextMonthly.setDate(schedule.dayOfMonth);
      nextMonthly.setHours(hours, minutes, 0, 0);
      
      if (nextMonthly <= now) {
        nextMonthly.setMonth(nextMonthly.getMonth() + 1);
      }
      return nextMonthly;
    }

    case SCHEDULE_TYPES.SPECIFIC_DATE:
      const specificDate = new Date(schedule.specificDate);
      specificDate.setHours(hours, minutes, 0, 0);
      return specificDate > now ? specificDate : null;

    default:
      return null;
  }
}

export function calculateUpcomingExecutions(schedule, count = 30) {
  if (!schedule || !schedule.enabled) return [];

  const upcoming = [];
  let current = calculateNextExecution(schedule);

  for (let i = 0; i < count && current; i++) {
    upcoming.push({
      executionTime: current.toISOString(),
      timestamp: current.getTime(),
    });

    // Calculate next
    const next = new Date(current);
    switch (schedule.type) {
      case SCHEDULE_TYPES.EVERY_MINUTE:
        next.setMinutes(next.getMinutes() + 1);
        break;
      case SCHEDULE_TYPES.HOURLY:
        next.setHours(next.getHours() + 1);
        break;
      case SCHEDULE_TYPES.DAILY:
        next.setDate(next.getDate() + 1);
        break;
      case SCHEDULE_TYPES.WEEKLY:
        next.setDate(next.getDate() + 7);
        break;
      case SCHEDULE_TYPES.MONTHLY:
        next.setMonth(next.getMonth() + 1);
        break;
      case SCHEDULE_TYPES.SPECIFIC_DATE:
        current = null;
        break;
      default:
        current = null;
    }

    if (schedule.type !== SCHEDULE_TYPES.SPECIFIC_DATE) {
      current = next;
    }
  }

  return upcoming;
}

export function shouldRun(schedule, currentTime = new Date()) {
  if (!schedule || !schedule.enabled) return false;

  const lastExecTime = schedule.lastExecuted ? new Date(schedule.lastExecuted) : null;
  const nextExecTime = schedule.nextExecution ? new Date(schedule.nextExecution) : calculateNextExecution(schedule);

  if (!nextExecTime) return false;

  return currentTime >= nextExecTime;
}

export function buildExecutionQueue(schedules = []) {
  return schedules
    .filter(s => s.enabled)
    .map(s => ({
      scheduleId: s.id,
      scheduleName: s.name,
      nextExecution: calculateNextExecution(s),
      workflowId: s.workflowId,
    }))
    .filter(item => item.nextExecution)
    .sort((a, b) => a.nextExecution.getTime() - b.nextExecution.getTime());
}

export function sortQueue(queue) {
  return [...queue].sort((a, b) => 
    new Date(a.nextExecution).getTime() - new Date(b.nextExecution).getTime()
  );
}

export function pauseSchedule(schedule) {
  if (!schedule) return null;

  return updateSchedule(schedule, {
    status: SCHEDULE_STATUS.PAUSED,
    enabled: false,
  });
}

export function resumeSchedule(schedule) {
  if (!schedule) return null;

  return updateSchedule(schedule, {
    status: SCHEDULE_STATUS.ACTIVE,
    enabled: true,
  });
}

export function cancelSchedule(schedule) {
  if (!schedule) return null;

  return updateSchedule(schedule, {
    status: SCHEDULE_STATUS.CANCELLED,
    enabled: false,
  });
}

export function buildScheduleStatistics(schedules = []) {
  return {
    totalSchedules: schedules.length,
    activeSchedules: schedules.filter(s => s.enabled).length,
    pausedSchedules: schedules.filter(s => s.status === SCHEDULE_STATUS.PAUSED).length,
    totalExecutions: schedules.reduce((sum, s) => sum + (s.executionCount || 0), 0),
    successfulExecutions: schedules.reduce((sum, s) => sum + (s.successCount || 0), 0),
    failedExecutions: schedules.reduce((sum, s) => sum + (s.failureCount || 0), 0),
    successRate: schedules.length > 0
      ? Math.round(
          schedules.reduce((sum, s) => sum + (s.successCount || 0), 0) /
          Math.max(schedules.reduce((sum, s) => sum + (s.executionCount || 0), 0), 1) * 100
        )
      : 0,
  };
}

export function serializeSchedule(schedule) {
  if (!schedule) return '{}';

  try {
    return JSON.stringify(schedule);
  } catch (error) {
    return '{}';
  }
}

export function deserializeSchedule(json) {
  if (!json || typeof json !== 'string') return null;

  try {
    const parsed = JSON.parse(json);
    return createSchedule(parsed);
  } catch (error) {
    return null;
  }
}

export function getScheduleTypeLabel(type) {
  const labels = {
    [SCHEDULE_TYPES.MANUAL]: 'Manual',
    [SCHEDULE_TYPES.EVERY_MINUTE]: 'Cada minuto',
    [SCHEDULE_TYPES.HOURLY]: 'Cada hora',
    [SCHEDULE_TYPES.DAILY]: 'Diariamente',
    [SCHEDULE_TYPES.WEEKLY]: 'Semanalmente',
    [SCHEDULE_TYPES.MONTHLY]: 'Mensualmente',
    [SCHEDULE_TYPES.SPECIFIC_DATE]: 'Fecha específica',
    [SCHEDULE_TYPES.ON_STARTUP]: 'Al iniciar',
    [SCHEDULE_TYPES.ON_EVENT]: 'Cuando ocurra evento',
    [SCHEDULE_TYPES.CONDITIONAL]: 'Cuando condición se cumple',
  };

  return labels[type] || type;
}

export function getScheduleIcon(type) {
  const icons = {
    [SCHEDULE_TYPES.MANUAL]: 'Hand',
    [SCHEDULE_TYPES.EVERY_MINUTE]: 'Zap',
    [SCHEDULE_TYPES.HOURLY]: 'Clock',
    [SCHEDULE_TYPES.DAILY]: 'Sun',
    [SCHEDULE_TYPES.WEEKLY]: 'Calendar',
    [SCHEDULE_TYPES.MONTHLY]: 'CalendarDays',
    [SCHEDULE_TYPES.SPECIFIC_DATE]: 'CalendarCheck',
    [SCHEDULE_TYPES.ON_STARTUP]: 'Play',
    [SCHEDULE_TYPES.ON_EVENT]: 'Zap',
    [SCHEDULE_TYPES.CONDITIONAL]: 'Filter',
  };

  return icons[type] || 'Clock';
}
