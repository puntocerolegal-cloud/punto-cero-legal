// Autonomous Operations Engine - Pure Domain Logic
// Orchestrates all engines for automated decision-making

export const AUTONOMY_MODE = {
  MANUAL: 'manual',
  ASSISTED: 'assisted',
  SUPERVISED: 'supervised',
  AUTONOMOUS: 'autonomous',
  ENTERPRISE: 'enterprise',
};

export const DECISION_TYPE = {
  ASSIGN_CASE: 'assign_case',
  ESCALATE: 'escalate',
  CHANGE_PRIORITY: 'change_priority',
  CHANGE_DEPARTMENT: 'change_department',
  RESCHEDULE: 'reschedule',
  NOTIFY: 'notify',
  CREATE_WORKFLOW: 'create_workflow',
  RUN_AUTOMATION: 'run_automation',
};

export const APPROVAL_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  EXPIRED: 'expired',
  EXECUTED: 'executed',
};

export function calculateConfidence(factors = {}) {
  const weights = {
    aiScore: 0.35,
    automationScore: 0.25,
    capacityScore: 0.2,
    historyScore: 0.1,
    riskScore: 0.1,
  };

  const scores = {
    aiScore: Math.min(100, factors.aiScore || 0),
    automationScore: Math.min(100, factors.automationScore || 0),
    capacityScore: Math.min(100, factors.capacityScore || 0),
    historyScore: Math.min(100, factors.historyScore || 50),
    riskScore: Math.max(0, 100 - (factors.riskScore || 0)),
  };

  const confidence = Object.entries(weights).reduce((sum, [key, weight]) => {
    return sum + (scores[key] * weight);
  }, 0);

  return Math.round(confidence);
}

export function calculateAutonomyScore(mode = AUTONOMY_MODE.MANUAL, metrics = {}) {
  const modeWeights = {
    [AUTONOMY_MODE.MANUAL]: 0,
    [AUTONOMY_MODE.ASSISTED]: 25,
    [AUTONOMY_MODE.SUPERVISED]: 50,
    [AUTONOMY_MODE.AUTONOMOUS]: 75,
    [AUTONOMY_MODE.ENTERPRISE]: 100,
  };

  const modeScore = modeWeights[mode] || 0;
  const systemHealth = Math.min(100, metrics.systemHealth || 50);
  const successRate = Math.min(100, metrics.successRate || 50);

  const autonomyScore = (modeScore * 0.5) + (systemHealth * 0.3) + (successRate * 0.2);
  return Math.round(autonomyScore);
}

export function buildAutonomousDecision(
  caseData = {},
  automationScore = 0,
  aiScore = 0,
  capacityScore = 0,
  riskLevel = 'medium'
) {
  const confidence = calculateConfidence({
    aiScore,
    automationScore,
    capacityScore,
    riskScore: riskLevel === 'critical' ? 80 : riskLevel === 'high' ? 50 : 20,
  });

  const shouldAutoExecute = confidence >= 70;
  const shouldRequestApproval = confidence >= 50 && confidence < 70;
  const requiresManualReview = confidence < 50;

  const decision = {
    id: `decision-${Date.now()}`,
    caseId: caseData.id,
    timestamp: new Date().toISOString(),
    confidence,
    scores: {
      automation: automationScore,
      ai: aiScore,
      capacity: capacityScore,
      overall: confidence,
    },
    recommendation: {
      autoExecute: shouldAutoExecute,
      requestApproval: shouldRequestApproval,
      manualReview: requiresManualReview,
    },
    riskLevel,
    impact: calculateImpact(automationScore, aiScore),
    urgency: calculateUrgency(caseData),
    businessValue: calculateBusinessValue(caseData),
  };

  return decision;
}

export function calculateImpact(automationScore = 0, aiScore = 0) {
  const combined = (automationScore + aiScore) / 2;
  if (combined >= 80) return 'critical';
  if (combined >= 60) return 'high';
  if (combined >= 40) return 'medium';
  return 'low';
}

export function calculateUrgency(caseData = {}) {
  if (!caseData) return 'normal';

  const now = new Date().getTime();
  const deadline = caseData.deadline ? new Date(caseData.deadline).getTime() : null;

  if (!deadline) return 'normal';

  const daysUntilDeadline = (deadline - now) / (1000 * 60 * 60 * 24);

  if (daysUntilDeadline <= 1) return 'critical';
  if (daysUntilDeadline <= 3) return 'high';
  if (daysUntilDeadline <= 7) return 'medium';
  return 'normal';
}

export function calculateBusinessValue(caseData = {}) {
  const revenue = caseData.expectedRevenue || 0;
  const isVIP = caseData.isVIP || false;
  const complexity = caseData.complexity || 1;

  const baseValue = revenue * complexity;
  const vipMultiplier = isVIP ? 1.5 : 1;

  const value = baseValue * vipMultiplier;

  if (value >= 50000) return 'strategic';
  if (value >= 20000) return 'high';
  if (value >= 5000) return 'medium';
  return 'low';
}

export function evaluateExecution(mode = AUTONOMY_MODE.MANUAL, decision = {}) {
  const { autoExecute, requestApproval, manualReview } = decision.recommendation || {};
  const executionMode = mode; // avoid 'eval' keyword

  switch (executionMode) {
    case AUTONOMY_MODE.MANUAL:
      return { execute: false, requiresApproval: false, requiresReview: true };

    case AUTONOMY_MODE.ASSISTED:
      return { execute: false, requiresApproval: true, requiresReview: false };

    case AUTONOMY_MODE.SUPERVISED:
      if (autoExecute && decision.confidence >= 75) {
        return { execute: true, requiresApproval: false, requiresReview: false };
      }
      if (requestApproval) {
        return { execute: false, requiresApproval: true, requiresReview: false };
      }
      return { execute: false, requiresApproval: false, requiresReview: true };

    case AUTONOMY_MODE.AUTONOMOUS:
      if (autoExecute) {
        return { execute: true, requiresApproval: false, requiresReview: false };
      }
      if (decision.riskLevel === 'critical') {
        return { execute: false, requiresApproval: true, requiresReview: false };
      }
      if (requestApproval) {
        return { execute: true, requiresApproval: false, requiresReview: false };
      }
      return { execute: false, requiresApproval: false, requiresReview: true };

    case AUTONOMY_MODE.ENTERPRISE:
      if (decision.riskLevel === 'critical') {
        return { execute: false, requiresApproval: true, requiresReview: false };
      }
      return { execute: true, requiresApproval: false, requiresReview: false };

    default:
      return { execute: false, requiresApproval: false, requiresReview: true };
  }
}

export function buildExecutionPlan(decisions = [], mode = AUTONOMY_MODE.MANUAL) {
  if (!Array.isArray(decisions)) return { plan: [], autoExecute: [], pendingApprovals: [], manualReview: [] };

  const plan = {
    plan: decisions,
    autoExecute: [],
    pendingApprovals: [],
    manualReview: [],
  };

  decisions.forEach(decision => {
    const evaluation = evaluateExecution(mode, decision);

    if (evaluation.execute) {
      plan.autoExecute.push(decision);
    } else if (evaluation.requiresApproval) {
      plan.pendingApprovals.push(decision);
    } else if (evaluation.requiresReview) {
      plan.manualReview.push(decision);
    }
  });

  return plan;
}

export function buildApprovalPlan(decision = {}) {
  return {
    id: `approval-${decision.id}`,
    decisionId: decision.id,
    caseId: decision.caseId,
    status: APPROVAL_STATUS.PENDING,
    reason: `Decision: ${decision.riskLevel} risk, ${decision.confidence}% confidence`,
    impact: decision.impact,
    confidence: decision.confidence,
    timestamp: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 3600000).toISOString(),
    actions: {
      approve: true,
      reject: true,
      skipApproval: decision.confidence >= 85,
    },
  };
}

export function buildAutonomousQueue(executions = []) {
  if (!Array.isArray(executions)) return { queue: [], count: 0, avgConfidence: 0 };

  const avgConfidence = executions.length > 0
    ? Math.round(executions.reduce((sum, e) => sum + (e.confidence || 0), 0) / executions.length)
    : 0;

  return {
    queue: executions,
    count: executions.length,
    avgConfidence,
    status: executions.length > 0 ? 'processing' : 'idle',
  };
}

export function buildPendingApprovals(approvals = []) {
  if (!Array.isArray(approvals)) return { pending: [], count: 0, expired: [] };

  const now = new Date().getTime();
  const pending = [];
  const expired = [];

  approvals.forEach(approval => {
    if (approval.status !== APPROVAL_STATUS.PENDING) return;

    const expiresAt = new Date(approval.expiresAt).getTime();
    if (expiresAt < now) {
      expired.push(approval);
    } else {
      pending.push(approval);
    }
  });

  return {
    pending: pending.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
    count: pending.length,
    expired,
  };
}

export function buildExecutionForecast(mode = AUTONOMY_MODE.MANUAL, decisions = [], metrics = {}) {
  const autonomyScore = calculateAutonomyScore(mode, metrics);
  const avgConfidence = decisions.length > 0
    ? Math.round(decisions.reduce((sum, d) => sum + d.confidence, 0) / decisions.length)
    : 0;

  const autoExecuteCount = decisions.filter(d => {
    const result = evaluateExecution(mode, d);
    return result.execute;
  }).length;

  const pendingApprovalCount = decisions.filter(d => {
    const result = evaluateExecution(mode, d);
    return result.requiresApproval;
  }).length;

  const manualReviewCount = decisions.filter(d => {
    const result = evaluateExecution(mode, d);
    return result.requiresReview;
  }).length;

  return {
    mode,
    autonomyScore,
    totalDecisions: decisions.length,
    willAutoExecute: autoExecuteCount,
    willNeedApproval: pendingApprovalCount,
    willNeedReview: manualReviewCount,
    avgConfidenceLevel: avgConfidence,
    estimatedSuccessRate: Math.round((avgConfidence * 0.85) + (autonomyScore * 0.15)),
  };
}

export function buildAutonomousStatistics(history = []) {
  if (!Array.isArray(history)) {
    return {
      totalDecisions: 0,
      automated: 0,
      manual: 0,
      approved: 0,
      rejected: 0,
      avgExecutionTime: 0,
      avgConfidence: 0,
      successRate: 0,
      failureRate: 0,
    };
  }

  const stats = {
    totalDecisions: history.length,
    automated: history.filter(h => h.automated).length,
    manual: history.filter(h => !h.automated).length,
    approved: history.filter(h => h.status === 'approved').length,
    rejected: history.filter(h => h.status === 'rejected').length,
    successful: history.filter(h => h.result === 'success').length,
    failed: history.filter(h => h.result === 'failed').length,
  };

  stats.avgConfidence = history.length > 0
    ? Math.round(history.reduce((sum, h) => sum + (h.confidence || 0), 0) / history.length)
    : 0;

  stats.avgExecutionTime = history.length > 0
    ? Math.round(history.reduce((sum, h) => sum + (h.duration || 0), 0) / history.length)
    : 0;

  stats.successRate = history.length > 0
    ? Math.round((stats.successful / history.length) * 100)
    : 0;

  stats.failureRate = 100 - stats.successRate;

  return stats;
}

export function buildActivityTimeline(history = []) {
  if (!Array.isArray(history)) return [];

  return history.map(entry => ({
    id: entry.id || `activity-${Date.now()}`,
    type: entry.type || 'unknown',
    action: entry.action || 'Unknown action',
    reason: entry.reason || 'No reason provided',
    timestamp: entry.timestamp,
    result: entry.result,
    duration: entry.duration,
    confidence: entry.confidence,
    automated: entry.automated,
  })).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

export function buildAutonomousHealth(mode = AUTONOMY_MODE.MANUAL, statistics = {}, recentDecisions = []) {
  const successRate = statistics.successRate || 0;
  const avgConfidence = statistics.avgConfidence || 0;
  const automationRate = statistics.totalDecisions > 0
    ? Math.round((statistics.automated / statistics.totalDecisions) * 100)
    : 0;

  let health = 'excellent';
  if (successRate < 80 || avgConfidence < 70) health = 'fair';
  if (successRate < 60 || avgConfidence < 50) health = 'poor';
  if (successRate < 40 || avgConfidence < 30) health = 'critical';

  const recentFailures = recentDecisions.filter(d => d.result === 'failed').length;
  if (recentFailures > 3) health = 'poor';

  return {
    health,
    successRate,
    avgConfidence,
    automationRate,
    modeScore: calculateAutonomyScore(mode, { successRate, systemHealth: avgConfidence }),
    riskLevel: health === 'excellent' ? 'low' : health === 'good' ? 'medium' : 'high',
  };
}

export function serializeAutonomousState(state = {}) {
  return JSON.stringify({
    mode: state.mode,
    history: state.history,
    approvals: state.approvals,
    activity: state.activity,
    statistics: state.statistics,
    timestamp: new Date().toISOString(),
  });
}

export function deserializeAutonomousState(serialized = '') {
  try {
    return JSON.parse(serialized);
  } catch (error) {
    console.warn('Failed to deserialize autonomous state:', error);
    return {
      mode: AUTONOMY_MODE.MANUAL,
      history: [],
      approvals: [],
      activity: [],
      statistics: {},
    };
  }
}

export function buildAutonomousDecisionCard(decision = {}) {
  return {
    id: decision.id,
    caseId: decision.caseId,
    confidence: decision.confidence,
    impact: decision.impact,
    urgency: decision.urgency,
    businessValue: decision.businessValue,
    recommendation: decision.recommendation,
    riskLevel: decision.riskLevel,
    timestamp: decision.timestamp,
  };
}

export function buildAutonomousApprovalCard(approval = {}) {
  const expiresAt = new Date(approval.expiresAt);
  const now = new Date();
  const timeRemaining = expiresAt - now;
  const isExpiring = timeRemaining < 3600000 && timeRemaining > 0;

  return {
    id: approval.id,
    decisionId: approval.decisionId,
    caseId: approval.caseId,
    status: approval.status,
    reason: approval.reason,
    impact: approval.impact,
    confidence: approval.confidence,
    timestamp: approval.timestamp,
    expiresAt: approval.expiresAt,
    isExpiring,
    actions: approval.actions,
  };
}
