import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  createSchedule,
  updateSchedule,
  validateSchedule,
  calculateNextExecution,
  calculateUpcomingExecutions,
  buildExecutionQueue,
  pauseSchedule,
  resumeSchedule,
  cancelSchedule,
  buildScheduleStatistics,
  serializeSchedule,
  deserializeSchedule,
} from '../domain/schedulerDomain';
import {
  buildSchedulerViewModel,
  buildCalendarView,
  buildQueueView,
  buildUpcomingExecutions,
  buildSchedulerStatistics,
  buildExecutionHistory,
  buildScheduleTypeOptions,
  groupScheduleTypesByCategory,
} from '../application/schedulerApplication';

const STORAGE_KEY = 'firm-os/scheduler';
const MAX_SCHEDULES = 100;

export function useScheduler() {
  const [schedules, setSchedules] = useState(() => {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          return Array.isArray(parsed) ? parsed : [];
        }
      }
    } catch (error) {
      console.warn('Failed to load schedules:', error);
    }
    return [];
  });

  const persistSchedules = useCallback((scheds) => {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(scheds.slice(0, MAX_SCHEDULES)));
      }
    } catch (error) {
      console.warn('Failed to persist schedules:', error);
    }
  }, []);

  const createScheduleAction = useCallback((data) => {
    const schedule = createSchedule(data);
    if (schedule) {
      const validation = validateSchedule(schedule);
      if (!validation.valid) {
        return { schedule: null, errors: validation.errors };
      }

      const nextExec = calculateNextExecution(schedule);
      const withNextExec = updateSchedule(schedule, { nextExecution: nextExec?.toISOString() });

      const updated = [...schedules, withNextExec];
      setSchedules(updated);
      persistSchedules(updated);

      return { schedule: withNextExec, errors: [] };
    }
    return { schedule: null, errors: ['Failed to create schedule'] };
  }, [schedules, persistSchedules]);

  const updateScheduleAction = useCallback((scheduleId, updates) => {
    const schedule = schedules.find(s => s.id === scheduleId);
    if (!schedule) return false;

    const updated = updateSchedule(schedule, updates);
    const validation = validateSchedule(updated);
    if (!validation.valid) return false;

    const nextExec = calculateNextExecution(updated);
    const withNextExec = updateSchedule(updated, { nextExecution: nextExec?.toISOString() });

    const newSchedules = schedules.map(s => s.id === scheduleId ? withNextExec : s);
    setSchedules(newSchedules);
    persistSchedules(newSchedules);

    return true;
  }, [schedules, persistSchedules]);

  const deleteScheduleAction = useCallback((scheduleId) => {
    const updated = schedules.filter(s => s.id !== scheduleId);
    setSchedules(updated);
    persistSchedules(updated);
  }, [schedules, persistSchedules]);

  const pauseScheduleAction = useCallback((scheduleId) => {
    const schedule = schedules.find(s => s.id === scheduleId);
    if (!schedule) return false;

    const paused = pauseSchedule(schedule);
    const newSchedules = schedules.map(s => s.id === scheduleId ? paused : s);
    setSchedules(newSchedules);
    persistSchedules(newSchedules);

    return true;
  }, [schedules, persistSchedules]);

  const resumeScheduleAction = useCallback((scheduleId) => {
    const schedule = schedules.find(s => s.id === scheduleId);
    if (!schedule) return false;

    const resumed = resumeSchedule(schedule);
    const newSchedules = schedules.map(s => s.id === scheduleId ? resumed : s);
    setSchedules(newSchedules);
    persistSchedules(newSchedules);

    return true;
  }, [schedules, persistSchedules]);

  const cancelScheduleAction = useCallback((scheduleId) => {
    const schedule = schedules.find(s => s.id === scheduleId);
    if (!schedule) return false;

    const cancelled = cancelSchedule(schedule);
    const newSchedules = schedules.map(s => s.id === scheduleId ? cancelled : s);
    setSchedules(newSchedules);
    persistSchedules(newSchedules);

    return true;
  }, [schedules, persistSchedules]);

  const duplicateScheduleAction = useCallback((scheduleId) => {
    const schedule = schedules.find(s => s.id === scheduleId);
    if (!schedule) return null;

    const duplicated = createSchedule({
      ...schedule,
      id: undefined,
      name: `${schedule.name} (Copia)`,
      createdAt: undefined,
      updatedAt: undefined,
      lastExecuted: undefined,
      executionCount: 0,
      successCount: 0,
      failureCount: 0,
    });

    const nextExec = calculateNextExecution(duplicated);
    const withNextExec = updateSchedule(duplicated, { nextExecution: nextExec?.toISOString() });

    const updated = [...schedules, withNextExec];
    setSchedules(updated);
    persistSchedules(updated);

    return withNextExec;
  }, [schedules, persistSchedules]);

  const recordExecutionAction = useCallback((scheduleId, success = true) => {
    const schedule = schedules.find(s => s.id === scheduleId);
    if (!schedule) return false;

    const nextExec = calculateNextExecution(schedule);
    const updated = updateSchedule(schedule, {
      lastExecuted: new Date().toISOString(),
      executionCount: (schedule.executionCount || 0) + 1,
      successCount: success ? (schedule.successCount || 0) + 1 : schedule.successCount,
      failureCount: success ? schedule.failureCount : (schedule.failureCount || 0) + 1,
      nextExecution: nextExec?.toISOString(),
    });

    const newSchedules = schedules.map(s => s.id === scheduleId ? updated : s);
    setSchedules(newSchedules);
    persistSchedules(newSchedules);

    return true;
  }, [schedules, persistSchedules]);

  // Memoized view models
  const viewModel = useMemo(() => {
    return buildSchedulerViewModel(schedules);
  }, [schedules]);

  const calendarView = useMemo(() => {
    return buildCalendarView(schedules);
  }, [schedules]);

  const queueView = useMemo(() => {
    return buildQueueView(schedules);
  }, [schedules]);

  const upcomingExecutions = useMemo(() => {
    return buildUpcomingExecutions(schedules, 50);
  }, [schedules]);

  const statistics = useMemo(() => {
    return buildSchedulerStatistics(schedules);
  }, [schedules]);

  const history = useMemo(() => {
    return buildExecutionHistory(schedules, 100);
  }, [schedules]);

  const scheduleTypeOptions = useMemo(() => {
    return buildScheduleTypeOptions();
  }, []);

  const scheduleTypesByCategory = useMemo(() => {
    return groupScheduleTypesByCategory(scheduleTypeOptions);
  }, [scheduleTypeOptions]);

  return {
    // State
    schedules,

    // View Models
    viewModel,
    calendarView,
    queueView,
    upcomingExecutions,
    statistics,
    history,
    scheduleTypeOptions,
    scheduleTypesByCategory,

    // Actions
    create: createScheduleAction,
    update: updateScheduleAction,
    delete: deleteScheduleAction,
    pause: pauseScheduleAction,
    resume: resumeScheduleAction,
    cancel: cancelScheduleAction,
    duplicate: duplicateScheduleAction,
    recordExecution: recordExecutionAction,

    // Utilities
    getById: useCallback((id) => schedules.find(s => s.id === id), [schedules]),
    getByStatus: useCallback((status) => schedules.filter(s => s.status === status), [schedules]),
  };
}
