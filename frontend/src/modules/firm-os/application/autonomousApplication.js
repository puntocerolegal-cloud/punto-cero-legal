// Autonomous Operations Application Layer - View Model Builders
import {
  buildAutonomousDecision,
  buildExecutionPlan,
  buildApprovalPlan,
  buildAutonomousQueue,
  buildPendingApprovals,
  buildExecutionForecast,
  buildAutonomousStatistics,
  buildActivityTimeline,
  buildAutonomousHealth,
  calculateAutonomyScore,
  AUTONOMY_MODE,
} from '../domain/autonomousDomain';

export function buildAutonomousViewModel(
  mode = AUTONOMY_MODE.MANUAL,
  caseList = [],
  automationResults = {},
  aiDecisions = {},
  executionHistory = [],
  metrics = {}
) {
  const decisions = [];

  if (Array.isArray(caseList)) {
    caseList.forEach(caseData => {
      const decision = buildAutonomousDecision(
        caseData,
        automationResults.automationScore || 0,
        aiDecisions.score || 0,
        metrics.capacityScore || 50,
        automationResults.riskLevel || 'medium'
      );
      decisions.push(decision);
    });
  }

  const executionPlan = buildExecutionPlan(decisions, mode);
  const approvals = executionPlan.pendingApprovals.map(buildApprovalPlan);
  const statistics = buildAutonomousStatistics(executionHistory);
  const health = buildAutonomousHealth(mode, statistics, decisions);

  return {
    mode,
    decisions,
    executionPlan,
    approvals,
    statistics,
    health,
    timestamp: new Date().toISOString(),
  };
}

export function buildAutonomousDashboard(
  mode = AUTONOMY_MODE.MANUAL,
  decisions = [],
  approvals = [],
  statistics = {},
  history = []
) {
  const executionPlan = buildExecutionPlan(decisions, mode);
  const pendingApprovalsData = buildPendingApprovals(approvals);
  const forecast = buildExecutionForecast(mode, decisions, statistics);
  const timeline = buildActivityTimeline(history);

  const autonomyScore = calculateAutonomyScore(mode, {
    systemHealth: statistics.avgConfidence || 50,
    successRate: statistics.successRate || 50,
  });

  return {
    autonomyScore,
    mode,
    forecast,
    executionPlan,
    pendingApprovals: pendingApprovalsData,
    statistics,
    timeline,
    summary: {
      totalDecisions: decisions.length,
      autoExecuting: executionPlan.autoExecute.length,
      pendingApproval: executionPlan.pendingApprovals.length,
      manualReview: executionPlan.manualReview.length,
    },
    timestamp: new Date().toISOString(),
  };
}

export function buildAutonomousExecutionCenter(executionPlan = {}, history = []) {
  const autoExecutions = executionPlan.autoExecute || [];
  const pastExecutions = Array.isArray(history) ? history : [];

  return {
    queueing: {
      count: autoExecutions.length,
      items: autoExecutions.slice(0, 10),
    },
    executing: {
      count: pastExecutions.filter(e => e.status === 'running').length,
      items: pastExecutions.filter(e => e.status === 'running').slice(0, 10),
    },
    completed: {
      count: pastExecutions.filter(e => e.status === 'completed').length,
      items: pastExecutions.filter(e => e.status === 'completed').slice(0, 10),
    },
    failed: {
      count: pastExecutions.filter(e => e.status === 'failed').length,
      items: pastExecutions.filter(e => e.status === 'failed').slice(0, 5),
    },
  };
}

export function buildApprovalCenter(approvals = [], history = []) {
  const pendingApprovalsData = buildPendingApprovals(approvals);
  const pastApprovals = Array.isArray(history) ? history : [];

  return {
    pending: {
      count: pendingApprovalsData.pending.length,
      items: pendingApprovalsData.pending.slice(0, 10),
      expiring: pendingApprovalsData.pending.filter(a => {
        const expiresAt = new Date(a.expiresAt).getTime();
        const now = new Date().getTime();
        return expiresAt - now < 3600000 && expiresAt - now > 0;
      }),
    },
    approved: {
      count: pastApprovals.filter(a => a.status === 'approved').length,
      items: pastApprovals.filter(a => a.status === 'approved').slice(0, 10),
    },
    rejected: {
      count: pastApprovals.filter(a => a.status === 'rejected').length,
      items: pastApprovals.filter(a => a.status === 'rejected').slice(0, 10),
    },
    expired: {
      count: pendingApprovalsData.expired.length,
      items: pendingApprovalsData.expired.slice(0, 10),
    },
  };
}

export function buildAutonomousActivityFeed(history = []) {
  const timeline = buildActivityTimeline(history);

  return {
    recent: timeline.slice(0, 20),
    count: timeline.length,
    successful: timeline.filter(t => t.result === 'success').length,
    failed: timeline.filter(t => t.result === 'failed').length,
    automated: timeline.filter(t => t.automated).length,
    manual: timeline.filter(t => !t.automated).length,
  };
}

export function buildAutonomousModePanel(mode = AUTONOMY_MODE.MANUAL) {
  const modeDescriptions = {
    [AUTONOMY_MODE.MANUAL]: {
      name: 'Manual',
      description: 'Nothing executes automatically. All decisions require manual approval.',
      color: 'slate',
      level: 0,
      autoExecution: false,
      requiresApproval: true,
    },
    [AUTONOMY_MODE.ASSISTED]: {
      name: 'Assisted',
      description: 'System recommends actions. No automatic execution.',
      color: 'blue',
      level: 1,
      autoExecution: false,
      requiresApproval: true,
    },
    [AUTONOMY_MODE.SUPERVISED]: {
      name: 'Supervised',
      description: 'Executes low-risk actions. Requests approval for critical decisions.',
      color: 'cyan',
      level: 2,
      autoExecution: true,
      requiresApproval: true,
    },
    [AUTONOMY_MODE.AUTONOMOUS]: {
      name: 'Autonomous',
      description: 'Executes most actions automatically. Approves critical decisions.',
      color: 'green',
      level: 3,
      autoExecution: true,
      requiresApproval: true,
    },
    [AUTONOMY_MODE.ENTERPRISE]: {
      name: 'Enterprise',
      description: 'Full autonomy. Executes all allowed actions automatically.',
      color: 'emerald',
      level: 4,
      autoExecution: true,
      requiresApproval: false,
    },
  };

  return {
    currentMode: mode,
    ...modeDescriptions[mode],
    availableModes: Object.keys(AUTONOMY_MODE).map(key => ({
      value: AUTONOMY_MODE[key],
      ...modeDescriptions[AUTONOMY_MODE[key]],
    })),
  };
}

export function buildAutonomousStatisticsCard(statistics = {}) {
  return {
    totalDecisions: statistics.totalDecisions || 0,
    automatedDecisions: statistics.automated || 0,
    manualDecisions: statistics.manual || 0,
    approvedCount: statistics.approved || 0,
    rejectedCount: statistics.rejected || 0,
    successfulCount: statistics.successful || 0,
    failedCount: statistics.failed || 0,
    averageConfidence: statistics.avgConfidence || 0,
    averageExecutionTime: statistics.avgExecutionTime || 0,
    successRate: statistics.successRate || 0,
    failureRate: statistics.failureRate || 0,
    automationPercentage: statistics.totalDecisions > 0
      ? Math.round((statistics.automated / statistics.totalDecisions) * 100)
      : 0,
  };
}

export function buildAutonomousMetrics(dashboard = {}) {
  const stats = dashboard.statistics || {};

  return {
    autonomyScore: dashboard.autonomyScore || 0,
    automationScore: dashboard.forecast?.estimatedSuccessRate || 0,
    executionSuccessRate: stats.successRate || 0,
    pendingApprovals: dashboard.summary?.pendingApproval || 0,
    runningOperations: dashboard.forecast?.totalDecisions || 0,
    completedOperations: stats.successful || 0,
    riskLevel: dashboard.health?.riskLevel || 'medium',
    confidenceAverage: stats.avgConfidence || 0,
  };
}

export function buildAutonomousDecisionCards(decisions = []) {
  return decisions.map(decision => ({
    id: decision.id,
    caseId: decision.caseId,
    confidence: decision.confidence,
    impact: decision.impact,
    urgency: decision.urgency,
    businessValue: decision.businessValue,
    autoExecute: decision.recommendation?.autoExecute || false,
    requiresApproval: decision.recommendation?.requestApproval || false,
    requiresReview: decision.recommendation?.manualReview || false,
    riskLevel: decision.riskLevel,
    timestamp: decision.timestamp,
  }));
}
