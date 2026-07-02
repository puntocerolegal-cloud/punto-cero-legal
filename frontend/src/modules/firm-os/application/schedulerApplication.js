// Application layer - Orchestrates scheduler domain
// NO UI logic, NO components, NO side effects

import {
  calculateNextExecution,
  calculateUpcomingExecutions,
  buildExecutionQueue,
  buildScheduleStatistics,
  SCHEDULE_TYPES,
  getScheduleTypeLabel,
  getScheduleIcon,
} from '../domain/schedulerDomain';

export function buildSchedulerViewModel(schedules = [], workflows = []) {
  const queue = buildExecutionQueue(schedules);
  const statistics = buildScheduleStatistics(schedules);

  const activeSchedules = schedules.filter(s => s.enabled);
  const nextExecution = queue.length > 0 ? queue[0].nextExecution : null;

  return {
    schedules,
    queue,
    statistics,
    activeSchedules,
    nextExecution,
    totalSchedules: schedules.length,
    activeCount: statistics.activeSchedules,
  };
}

export function buildCalendarView(schedules = []) {
  if (!schedules.length) {
    return {
      events: [],
      dates: [],
      upcomingDays: 0,
    };
  }

  const events = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  schedules.forEach(schedule => {
    if (!schedule.enabled) return;

    const upcoming = calculateUpcomingExecutions(schedule, 30);
    upcoming.forEach(exec => {
      const execDate = new Date(exec.executionTime);
      const dateKey = execDate.toISOString().split('T')[0];

      events.push({
        id: `${schedule.id}_${exec.timestamp}`,
        scheduleId: schedule.id,
        scheduleName: schedule.name,
        date: dateKey,
        time: execDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        timestamp: exec.timestamp,
      });
    });
  });

  const uniqueDates = new Set(events.map(e => e.date));
  const daysFromNow = Math.ceil(
    (Math.max(...Array.from(uniqueDates).map(d => new Date(d).getTime())) - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  return {
    events,
    dates: Array.from(uniqueDates).sort(),
    upcomingDays: daysFromNow,
    todayEvents: events.filter(e => e.date === today.toISOString().split('T')[0]),
  };
}

export function buildQueueView(schedules = []) {
  const queue = buildExecutionQueue(schedules);

  return {
    queue: queue.slice(0, 20),
    totalInQueue: queue.length,
    nextExecution: queue.length > 0 ? queue[0] : null,
    upcoming: queue.slice(0, 5),
  };
}

export function buildUpcomingExecutions(schedules = [], limit = 30) {
  const upcoming = [];

  schedules.filter(s => s.enabled).forEach(schedule => {
    const executions = calculateUpcomingExecutions(schedule, limit);
    executions.forEach(exec => {
      upcoming.push({
        scheduleId: schedule.id,
        scheduleName: schedule.name,
        scheduletype: schedule.type,
        workflowId: schedule.workflowId,
        executionTime: exec.executionTime,
        timestamp: exec.timestamp,
      });
    });
  });

  return upcoming
    .sort((a, b) => a.timestamp - b.timestamp)
    .slice(0, limit);
}

export function buildSchedulerStatistics(schedules = []) {
  const stats = buildScheduleStatistics(schedules);

  return {
    totalSchedules: stats.totalSchedules,
    activeSchedules: stats.activeSchedules,
    pausedSchedules: stats.pausedSchedules,
    totalExecutions: stats.totalExecutions,
    successfulExecutions: stats.successfulExecutions,
    failedExecutions: stats.failedExecutions,
    successRate: stats.successRate,
    averageExecutionsPerSchedule: stats.totalSchedules > 0
      ? Math.round(stats.totalExecutions / stats.totalSchedules)
      : 0,
  };
}

export function buildExecutionHistory(schedules = [], limit = 50) {
  const history = [];

  schedules.forEach(schedule => {
    if (!schedule.lastExecuted) return;

    history.push({
      scheduleId: schedule.id,
      scheduleName: schedule.name,
      timestamp: schedule.lastExecuted,
      executionCount: schedule.executionCount,
      successCount: schedule.successCount,
      failureCount: schedule.failureCount,
      successRate: schedule.executionCount > 0
        ? Math.round((schedule.successCount / schedule.executionCount) * 100)
        : 0,
    });
  });

  return history
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);
}

export function buildSchedulerDashboard(schedules = []) {
  const vm = buildSchedulerViewModel(schedules);
  const upcomingExecs = buildUpcomingExecutions(schedules, 10);
  const stats = buildSchedulerStatistics(schedules);

  return {
    section: 'scheduler',
    title: 'Centro de Scheduler',
    subtitle: 'Ejecución automática de workflows',
    widgets: [
      {
        id: 'scheduler_overview',
        type: 'overview',
        title: 'Resumen',
        data: {
          activeSchedules: stats.activeSchedules,
          totalSchedules: stats.totalSchedules,
          nextExecution: vm.nextExecution,
        },
      },
      {
        id: 'scheduler_upcoming',
        type: 'upcoming',
        title: 'Próximas Ejecuciones',
        data: upcomingExecs.slice(0, 5),
      },
      {
        id: 'scheduler_statistics',
        type: 'statistics',
        title: 'Estadísticas',
        data: stats,
      },
    ],
  };
}

export function buildScheduleTypeOptions() {
  return [
    {
      type: SCHEDULE_TYPES.MANUAL,
      label: getScheduleTypeLabel(SCHEDULE_TYPES.MANUAL),
      icon: getScheduleIcon(SCHEDULE_TYPES.MANUAL),
      description: 'Ejecutar manualmente cuando sea necesario',
      category: 'Básico',
    },
    {
      type: SCHEDULE_TYPES.EVERY_MINUTE,
      label: getScheduleTypeLabel(SCHEDULE_TYPES.EVERY_MINUTE),
      icon: getScheduleIcon(SCHEDULE_TYPES.EVERY_MINUTE),
      description: 'Ejecutar cada minuto',
      category: 'Tiempo',
    },
    {
      type: SCHEDULE_TYPES.HOURLY,
      label: getScheduleTypeLabel(SCHEDULE_TYPES.HOURLY),
      icon: getScheduleIcon(SCHEDULE_TYPES.HOURLY),
      description: 'Ejecutar cada hora',
      category: 'Tiempo',
    },
    {
      type: SCHEDULE_TYPES.DAILY,
      label: getScheduleTypeLabel(SCHEDULE_TYPES.DAILY),
      icon: getScheduleIcon(SCHEDULE_TYPES.DAILY),
      description: 'Ejecutar diariamente a una hora específica',
      category: 'Tiempo',
    },
    {
      type: SCHEDULE_TYPES.WEEKLY,
      label: getScheduleTypeLabel(SCHEDULE_TYPES.WEEKLY),
      icon: getScheduleIcon(SCHEDULE_TYPES.WEEKLY),
      description: 'Ejecutar en días específicos de la semana',
      category: 'Tiempo',
    },
    {
      type: SCHEDULE_TYPES.MONTHLY,
      label: getScheduleTypeLabel(SCHEDULE_TYPES.MONTHLY),
      icon: getScheduleIcon(SCHEDULE_TYPES.MONTHLY),
      description: 'Ejecutar mensualmente en un día específico',
      category: 'Tiempo',
    },
    {
      type: SCHEDULE_TYPES.SPECIFIC_DATE,
      label: getScheduleTypeLabel(SCHEDULE_TYPES.SPECIFIC_DATE),
      icon: getScheduleIcon(SCHEDULE_TYPES.SPECIFIC_DATE),
      description: 'Ejecutar en una fecha y hora específicas',
      category: 'Tiempo',
    },
    {
      type: SCHEDULE_TYPES.ON_STARTUP,
      label: getScheduleTypeLabel(SCHEDULE_TYPES.ON_STARTUP),
      icon: getScheduleIcon(SCHEDULE_TYPES.ON_STARTUP),
      description: 'Ejecutar al iniciar la aplicación',
      category: 'Evento',
    },
    {
      type: SCHEDULE_TYPES.ON_EVENT,
      label: getScheduleTypeLabel(SCHEDULE_TYPES.ON_EVENT),
      icon: getScheduleIcon(SCHEDULE_TYPES.ON_EVENT),
      description: 'Ejecutar cuando ocurra un evento específico',
      category: 'Evento',
    },
    {
      type: SCHEDULE_TYPES.CONDITIONAL,
      label: getScheduleTypeLabel(SCHEDULE_TYPES.CONDITIONAL),
      icon: getScheduleIcon(SCHEDULE_TYPES.CONDITIONAL),
      description: 'Ejecutar cuando una condición se cumpla',
      category: 'Evento',
    },
  ];
}

export function groupScheduleTypesByCategory(types) {
  const grouped = {};

  types.forEach(type => {
    if (!grouped[type.category]) {
      grouped[type.category] = [];
    }
    grouped[type.category].push(type);
  });

  return grouped;
}
