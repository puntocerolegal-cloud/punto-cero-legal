// Automation Engine - Executes rules and manages history
// Pure functions, no side effects

import { evaluateRule, evaluateRules } from '../../domain/automationDomain';

export function createAutomationEngine() {
  let history = [];
  const HISTORY_LIMIT = 1000;

  function runRule(rule, context) {
    const result = evaluateRule(rule, context);
    
    const historyEntry = {
      id: `${Date.now()}_${Math.random()}`,
      timestamp: new Date().toISOString(),
      ruleId: rule.id,
      rule: rule.name,
      condition: rule.condition,
      result: result.passed,
      level: result.level,
      type: result.passed ? 'success' : 'failed',
      error: result.error,
    };

    addToHistory(historyEntry);
    return historyEntry;
  }

  function runAllRules(rules, context) {
    if (!Array.isArray(rules) || !context) return [];

    const enabledRules = rules.filter(r => r.enabled !== false);
    return enabledRules.map(rule => runRule(rule, context));
  }

  function evaluate(rules, context) {
    const results = evaluateRules(rules, context);
    return {
      evaluated: rules.length,
      passed: results.length,
      failed: rules.length - results.length,
      passRate: rules.length > 0 ? Math.round((results.length / rules.length) * 100) : 0,
      results,
    };
  }

  function addToHistory(entry) {
    history.unshift(entry);
    if (history.length > HISTORY_LIMIT) {
      history = history.slice(0, HISTORY_LIMIT);
    }
  }

  function getHistory(limit = 100) {
    return history.slice(0, limit);
  }

  function getHistorySince(timestamp) {
    return history.filter(h => new Date(h.timestamp) > new Date(timestamp));
  }

  function clearHistory() {
    history = [];
  }

  function exportHistory() {
    return JSON.stringify(history, null, 2);
  }

  function importHistory(json) {
    try {
      const imported = JSON.parse(json);
      if (Array.isArray(imported)) {
        history = imported;
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  function getStatistics() {
    const total = history.length;
    const successful = history.filter(h => h.type === 'success').length;
    const failed = history.filter(h => h.type === 'failed').length;

    return {
      totalExecutions: total,
      successfulRuns: successful,
      failedRuns: failed,
      successRate: total > 0 ? Math.round((successful / total) * 100) : 0,
      lastExecution: history.length > 0 ? history[0].timestamp : null,
    };
  }

  return {
    runRule,
    runAllRules,
    evaluate,
    getHistory,
    getHistorySince,
    clearHistory,
    exportHistory,
    importHistory,
    getStatistics,
  };
}

// Singleton instance
let engineInstance = null;

export function getAutomationEngine() {
  if (!engineInstance) {
    engineInstance = createAutomationEngine();
  }
  return engineInstance;
}

export function resetAutomationEngine() {
  engineInstance = null;
}
