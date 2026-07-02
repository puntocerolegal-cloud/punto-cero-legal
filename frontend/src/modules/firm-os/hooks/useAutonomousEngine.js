import { useState, useCallback, useMemo, useEffect } from 'react';
import { useAutomation } from './useAutomation';
import { useNotifications } from './useNotifications';
import { useWorkflows } from './useWorkflows';
import { useScheduler } from './useScheduler';
import { useAIDecision } from './useAIDecision';
import { useFirmCoreData } from './useFirmCoreData';
import {
  AUTONOMY_MODE,
  APPROVAL_STATUS,
  deserializeAutonomousState,
  serializeAutonomousState,
} from '../domain/autonomousDomain';
import {
  buildAutonomousViewModel,
  buildAutonomousDashboard,
  buildApprovalCenter,
  buildAutonomousActivityFeed,
  buildAutonomousModePanel,
  buildAutonomousStatisticsCard,
  buildAutonomousMetrics,
  buildAutonomousDecisionCards,
} from '../application/autonomousApplication';

const STORAGE_KEY = 'firm-os/autonomous-engine';

export function useAutonomousEngine() {
  const coreData = useFirmCoreData();
  const automation = useAutomation(coreData.lawyers, coreData.cases, coreData.clients, coreData.departments, coreData.offices);
  const notifications = useNotifications(automation.alerts, automation.recommendations, automation.history);
  const workflows = useWorkflows(coreData.lawyers, coreData.cases, coreData.clients);
  const scheduler = useScheduler();
  const ai = useAIDecision(coreData.lawyers, coreData.cases, coreData.clients, coreData.departments);

  const [mode, setMode] = useState(() => {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const state = deserializeAutonomousState(stored);
          return state.mode || AUTONOMY_MODE.MANUAL;
        }
      }
    } catch (error) {
      console.warn('Failed to load autonomous mode:', error);
    }
    return AUTONOMY_MODE.MANUAL;
  });

  const [history, setHistory] = useState(() => {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const state = deserializeAutonomousState(stored);
          return state.history || [];
        }
      }
    } catch (error) {
      console.warn('Failed to load autonomous history:', error);
    }
    return [];
  });

  const [approvals, setApprovals] = useState(() => {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const state = deserializeAutonomousState(stored);
          return state.approvals || [];
        }
      }
    } catch (error) {
      console.warn('Failed to load approvals:', error);
    }
    return [];
  });

  const persistState = useCallback(() => {
    try {
      if (typeof localStorage !== 'undefined') {
        const state = {
          mode,
          history,
          approvals,
          activity: history,
          statistics: {
            totalDecisions: history.length,
            automated: history.filter(h => h.automated).length,
            manual: history.filter(h => !h.automated).length,
            approved: approvals.filter(a => a.status === APPROVAL_STATUS.APPROVED).length,
            rejected: approvals.filter(a => a.status === APPROVAL_STATUS.REJECTED).length,
            successful: history.filter(h => h.result === 'success').length,
            failed: history.filter(h => h.result === 'failed').length,
            avgConfidence: history.length > 0
              ? Math.round(history.reduce((sum, h) => sum + (h.confidence || 0), 0) / history.length)
              : 0,
            successRate: history.length > 0
              ? Math.round((history.filter(h => h.result === 'success').length / history.length) * 100)
              : 0,
          },
        };
        localStorage.setItem(STORAGE_KEY, serializeAutonomousState(state));
      }
    } catch (error) {
      console.warn('Failed to persist autonomous state:', error);
    }
  }, [mode, history, approvals]);

  useEffect(() => {
    persistState();
  }, [persistState]);

  const changeMode = useCallback((newMode) => {
    if (Object.values(AUTONOMY_MODE).includes(newMode)) {
      setMode(newMode);
    }
  }, []);

  const addApproval = useCallback((approval) => {
    setApprovals(prev => [approval, ...prev]);
  }, []);

  const approveDecision = useCallback((approvalId) => {
    setApprovals(prev =>
      prev.map(a => a.id === approvalId ? { ...a, status: APPROVAL_STATUS.APPROVED } : a)
    );
  }, []);

  const rejectDecision = useCallback((approvalId) => {
    setApprovals(prev =>
      prev.map(a => a.id === approvalId ? { ...a, status: APPROVAL_STATUS.REJECTED } : a)
    );
  }, []);

  const recordActivity = useCallback((activity) => {
    setHistory(prev => [
      {
        ...activity,
        id: activity.id || `activity-${Date.now()}`,
        timestamp: activity.timestamp || new Date().toISOString(),
      },
      ...prev,
    ].slice(0, 500));
  }, []);

  // Build view models
  const autonomousVM = useMemo(() => {
    return buildAutonomousViewModel(
      mode,
      coreData.cases || [],
      automation.automationVM || {},
      ai.summary || {},
      history,
      {
        capacityScore: 50,
        systemHealth: notifications.unreadCount > 0 ? 70 : 90,
        successRate: history.length > 0
          ? Math.round((history.filter(h => h.result === 'success').length / history.length) * 100)
          : 50,
      }
    );
  }, [mode, coreData.cases, automation, ai, history, notifications]);

  const dashboard = useMemo(() => {
    return buildAutonomousDashboard(
      mode,
      autonomousVM.decisions,
      approvals,
      autonomousVM.statistics,
      history
    );
  }, [mode, autonomousVM, approvals, history]);

  const approvalCenter = useMemo(() => {
    return buildApprovalCenter(approvals, history);
  }, [approvals, history]);

  const activityFeed = useMemo(() => {
    return buildAutonomousActivityFeed(history);
  }, [history]);

  const modePanel = useMemo(() => {
    return buildAutonomousModePanel(mode);
  }, [mode]);

  const statisticsCard = useMemo(() => {
    return buildAutonomousStatisticsCard(autonomousVM.statistics);
  }, [autonomousVM.statistics]);

  const metrics = useMemo(() => {
    return buildAutonomousMetrics(dashboard);
  }, [dashboard]);

  const decisionCards = useMemo(() => {
    return buildAutonomousDecisionCards(autonomousVM.decisions);
  }, [autonomousVM.decisions]);

  return {
    // State
    mode,
    changeMode,
    history,
    approvals,
    addApproval,
    approveDecision,
    rejectDecision,
    recordActivity,

    // View Models
    autonomousVM,
    dashboard,
    approvalCenter,
    activityFeed,
    modePanel,
    statisticsCard,
    metrics,
    decisionCards,

    // References
    automation,
    notifications,
    workflows,
    scheduler,
    ai,
    coreData,

    // Shortcuts
    decisions: autonomousVM.decisions,
    executionPlan: autonomousVM.executionPlan,
    statistics: autonomousVM.statistics,
    health: autonomousVM.health,
    timestamp: autonomousVM.timestamp,
  };
}
