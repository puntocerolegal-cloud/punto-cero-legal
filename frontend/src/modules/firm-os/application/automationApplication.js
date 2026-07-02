// Application layer - Orchestrates automation domain
// NO UI logic, NO components, NO side effects

import {
  evaluateRules,
  buildRuleContext,
  generateRecommendations,
  generateAutomationAlerts,
  detectBottlenecks,
  calculateFirmRisk,
  calculateLawyerRisk,
  createRuleSummary,
} from '../domain/automationDomain';

import {
  AUTOMATION_RULES,
} from '../automation/rules/defaultRules';

export function buildAutomationViewModel(lawyers, cases, clients, departments, offices) {
  const context = buildRuleContext(lawyers, cases, clients, departments, offices);
  const evaluatedRules = evaluateRules(AUTOMATION_RULES, context);
  const alerts = generateAutomationAlerts(AUTOMATION_RULES, evaluatedRules);
  const recommendations = generateRecommendations(lawyers, cases, departments);
  const bottlenecks = detectBottlenecks(lawyers, cases, departments);
  const firmRisk = calculateFirmRisk(lawyers, cases);
  const summary = createRuleSummary(evaluatedRules);

  return {
    context,
    evaluatedRules,
    alerts,
    recommendations,
    bottlenecks,
    firmRisk,
    summary,
  };
}

export function buildRulesViewModel(rules, context) {
  if (!Array.isArray(rules)) return { rules: [], count: 0 };

  const evaluated = rules.map(rule => {
    const condition = new Function('context', `return ${rule.condition}`);
    const passed = (() => {
      try {
        return condition(context) === true;
      } catch {
        return false;
      }
    })();

    return {
      ...rule,
      passed,
      lastEvaluated: new Date().toISOString(),
    };
  });

  return {
    rules: evaluated,
    count: evaluated.length,
    passedCount: evaluated.filter(r => r.passed).length,
  };
}

export function buildRecommendationsViewModel(recommendations) {
  if (!Array.isArray(recommendations)) return { recommendations: [], count: 0 };

  const grouped = {
    high: recommendations.filter(r => r.priority === 'high'),
    medium: recommendations.filter(r => r.priority === 'medium'),
    low: recommendations.filter(r => r.priority === 'low'),
  };

  return {
    recommendations,
    count: recommendations.length,
    grouped,
    topPriority: grouped.high.length > 0 ? grouped.high[0] : null,
  };
}

export function buildAutomationDashboard(lawyers, cases, clients, departments, offices) {
  const automationVM = buildAutomationViewModel(lawyers, cases, clients, departments, offices);

  return {
    section: 'automation',
    title: 'Centro de Automatización',
    subtitle: 'Motor de reglas en tiempo real',
    widgets: [
      {
        id: 'automation_status',
        type: 'status',
        title: 'Estado del Motor',
        data: {
          status: 'active',
          rulesEvaluated: automationVM.summary.totalEvaluated,
          passed: automationVM.summary.passed,
          failed: automationVM.summary.failed,
          lastRun: automationVM.summary.timestamp,
        },
      },
      {
        id: 'automation_alerts',
        type: 'alerts',
        title: 'Alertas Generadas',
        data: automationVM.alerts,
      },
      {
        id: 'automation_recommendations',
        type: 'recommendations',
        title: 'Recomendaciones',
        data: automationVM.recommendations,
      },
      {
        id: 'automation_bottlenecks',
        type: 'bottlenecks',
        title: 'Cuellos de Botella Detectados',
        data: automationVM.bottlenecks,
      },
      {
        id: 'automation_risk',
        type: 'risk',
        title: 'Riesgo de Firma',
        data: {
          firmRisk: automationVM.firmRisk,
          lawyerRisks: (lawyers || []).map(l => ({
            name: l.name,
            risk: calculateLawyerRisk(l, cases),
          })),
        },
      },
    ],
  };
}

export function buildAutomationSummary(automationVM) {
  if (!automationVM) return null;

  return {
    totalRulesEvaluated: automationVM.summary.totalEvaluated,
    alertsGenerated: automationVM.alerts.length,
    recommendationsCount: automationVM.recommendations.length,
    bottlenecksDetected: automationVM.bottlenecks.length,
    firmRisk: automationVM.firmRisk,
    lastExecution: automationVM.summary.timestamp,
  };
}

export function buildAutomationStatistics(automationVM, historyRecords) {
  if (!automationVM) return null;

  const history = historyRecords || [];
  const last24h = history.filter(h => {
    const recordTime = new Date(h.timestamp).getTime();
    const now = Date.now();
    return now - recordTime < 24 * 60 * 60 * 1000;
  });

  return {
    totalExecutions: history.length,
    executionsLast24h: last24h.length,
    totalAlertsGenerated: history.filter(h => h.type === 'alert').length,
    totalRecommendations: history.filter(h => h.type === 'recommendation').length,
    rulePassRate: automationVM.summary.passRate,
  };
}

export function buildAutomationHistory(historyRecords) {
  if (!Array.isArray(historyRecords)) return [];

  return historyRecords
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .map(record => ({
      id: `${record.timestamp}_${record.ruleId}`,
      timestamp: record.timestamp,
      rule: record.rule,
      result: record.result,
      level: record.level,
      type: record.type,
    }));
}

export function buildAutomationAlerts(alertsList) {
  if (!Array.isArray(alertsList)) return [];

  return alertsList.map(alert => ({
    id: alert.id,
    ruleId: alert.ruleId,
    ruleName: alert.ruleName,
    timestamp: alert.timestamp,
    level: alert.level,
    message: alert.message,
    read: alert.read || false,
    actionable: ['high', 'critical'].includes(alert.level),
  }));
}

export function buildAutomationMetrics(automationVM) {
  if (!automationVM) return null;

  return {
    rulesSummary: {
      total: automationVM.summary.totalEvaluated,
      passed: automationVM.summary.passed,
      failed: automationVM.summary.failed,
      passRate: automationVM.summary.passRate,
    },
    alerts: {
      total: automationVM.alerts.length,
      critical: automationVM.alerts.filter(a => a.level === 'critical').length,
      high: automationVM.alerts.filter(a => a.level === 'high').length,
      medium: automationVM.alerts.filter(a => a.level === 'medium').length,
    },
    recommendations: {
      total: automationVM.recommendations.length,
      highPriority: automationVM.recommendations.filter(r => r.priority === 'high').length,
      mediumPriority: automationVM.recommendations.filter(r => r.priority === 'medium').length,
    },
    firmHealth: {
      riskScore: automationVM.firmRisk,
      bottlenecksDetected: automationVM.bottlenecks.length,
      status: automationVM.firmRisk > 70 ? 'critical' : automationVM.firmRisk > 50 ? 'warning' : 'healthy',
    },
  };
}
