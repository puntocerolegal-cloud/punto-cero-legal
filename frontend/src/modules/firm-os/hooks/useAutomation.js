import { useState, useCallback, useMemo, useEffect } from 'react';
import { getAutomationEngine } from '../automation/engine/AutomationEngine';
import { buildAutomationViewModel } from '../application/automationApplication';
import { AUTOMATION_RULES } from '../automation/rules/defaultRules';

const STORAGE_KEY = 'firm-os/automation';

// Stable references to prevent infinite render loops from default empty arrays
const EMPTY_ARRAY = [];

export function useAutomation(lawyers = [], cases = [], clients = [], departments = [], offices = []) {
  // Stabilize input arrays to prevent useMemo from recomputing on every render
  // when default [] parameters create new references each call
  const stableDepartments = departments.length > 0 ? departments : EMPTY_ARRAY;
  const stableOffices = offices.length > 0 ? offices : EMPTY_ARRAY;
  const [history, setHistory] = useState(() => {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
      }
    } catch (error) {
      console.warn('Failed to load automation history:', error);
    }
    return [];
  });

  const engine = useMemo(() => getAutomationEngine(), []);

  const automationVM = useMemo(() => {
    return buildAutomationViewModel(lawyers, cases, clients, departments, offices);
  }, [lawyers, cases, clients, departments, offices]);

  const runRule = useCallback((ruleId) => {
    const rule = AUTOMATION_RULES.find(r => r.id === ruleId);
    if (!rule) return null;

    const context = {
      lawyers,
      cases,
      clients,
      departments,
      offices,
    };

    const result = engine.runRule(rule, context);
    
    try {
      if (typeof localStorage !== 'undefined') {
        const current = localStorage.getItem(STORAGE_KEY);
        const records = current ? JSON.parse(current) : [];
        records.unshift(result);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(records.slice(0, 100)));
        setHistory(records.slice(0, 100));
      }
    } catch (error) {
      console.warn('Failed to save automation history:', error);
    }

    return result;
  }, [engine, lawyers, cases, clients, departments, offices]);

  const runAutomation = useCallback(() => {
    const context = {
      lawyers,
      cases,
      clients,
      departments,
      offices,
    };

    const enabled = AUTOMATION_RULES.filter(r => r.enabled !== false);
    const results = engine.runAllRules(enabled, context);

    try {
      if (typeof localStorage !== 'undefined') {
        const current = localStorage.getItem(STORAGE_KEY);
        const records = current ? JSON.parse(current) : [];
        const updated = [...results, ...records];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated.slice(0, 200)));
        setHistory(updated.slice(0, 200));
      }
    } catch (error) {
      console.warn('Failed to save automation history:', error);
    }

    return results;
  }, [engine, lawyers, cases, clients, departments, offices]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (error) {
      console.warn('Failed to clear automation history:', error);
    }
  }, []);

  const refresh = useCallback(() => {
    return runAutomation();
  }, [runAutomation]);

  const statistics = useMemo(() => {
    return {
      totalExecutions: history.length,
      successfulRuns: history.filter(h => h.type === 'success').length,
      failedRuns: history.filter(h => h.type === 'failed').length,
      lastExecution: history.length > 0 ? history[0].timestamp : null,
    };
  }, [history]);

  const metrics = useMemo(() => {
    return {
      rulesCount: AUTOMATION_RULES.length,
      enabledRules: AUTOMATION_RULES.filter(r => r.enabled !== false).length,
      alertsGenerated: automationVM.alerts.length,
      recommendationsCount: automationVM.recommendations.length,
      bottlenecksDetected: automationVM.bottlenecks.length,
    };
  }, [automationVM]);

  return {
    // Execution
    runAutomation,
    runRule,
    refresh,

    // Data
    automationVM,
    history,
    statistics,
    metrics,

    // Actions
    clearHistory,

    // State
    alerts: automationVM.alerts,
    recommendations: automationVM.recommendations,
    bottlenecks: automationVM.bottlenecks,
  };
}
