// Enterprise Governance Layer - Pure Domain Logic
// Auditing, traceability, decision explanation, policy enforcement

export const AUDIT_EVENT_TYPE = {
  DECISION_MADE: 'decision_made',
  ACTION_EXECUTED: 'action_executed',
  APPROVAL_REQUESTED: 'approval_requested',
  APPROVAL_GRANTED: 'approval_granted',
  APPROVAL_REJECTED: 'approval_rejected',
  WORKFLOW_TRIGGERED: 'workflow_triggered',
  AUTOMATION_RAN: 'automation_ran',
  POLICY_APPLIED: 'policy_applied',
  ANOMALY_DETECTED: 'anomaly_detected',
};

export const POLICY_SCOPE = {
  AUTOMATION: 'automation',
  WORKFLOW: 'workflow',
  SCHEDULER: 'scheduler',
  ASSIGNMENT: 'assignment',
  ESCALATION: 'escalation',
  NOTIFICATION: 'notification',
};

export const POLICY_TYPE = {
  THRESHOLD: 'threshold',
  RULE: 'rule',
  CONSTRAINT: 'constraint',
  APPROVAL_GATE: 'approval_gate',
};

export function buildAuditEvent(
  type = AUDIT_EVENT_TYPE.DECISION_MADE,
  actor = 'system',
  resource = {},
  decision = {},
  impact = {}
) {
  return {
    id: `audit-${Date.now()}`,
    type,
    actor,
    timestamp: new Date().toISOString(),
    resource: {
      id: resource.id || 'unknown',
      type: resource.type || 'case',
      name: resource.name || 'Unknown',
    },
    decision: {
      recommendation: decision.recommendation || null,
      confidence: decision.confidence || 0,
      reasoning: decision.reasoning || null,
      factors: decision.factors || [],
    },
    impact: {
      affected: impact.affected || 0,
      severity: impact.severity || 'low',
      reversible: impact.reversible !== false,
      businessValue: impact.businessValue || 'low',
    },
  };
}

export function buildAuditTrail(events = []) {
  if (!Array.isArray(events)) return { events: [], count: 0, byType: {}, timeline: [] };

  const byType = {};
  events.forEach(event => {
    if (!byType[event.type]) byType[event.type] = [];
    byType[event.type].push(event);
  });

  const timeline = events
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return {
    events,
    count: events.length,
    byType,
    timeline,
    lastEvent: timeline[0] || null,
  };
}

export function buildDecisionExplanation(decision = {}, context = {}) {
  const explanation = {
    id: `explanation-${decision.id || Date.now()}`,
    decisionId: decision.id,
    timestamp: new Date().toISOString(),
    summary: buildExplanationSummary(decision),
    details: buildExplanationDetails(decision),
    factors: buildFactorAnalysis(decision),
    alternatives: buildAlternatives(decision, context),
    confidence: decision.confidence || 0,
    reasoning: decision.reasoning || 'Decision made based on available data and policies.',
  };

  return explanation;
}

export function buildExplanationSummary(decision = {}) {
  const confidence = decision.confidence || 0;
  const impact = decision.impact || 'medium';

  if (confidence >= 80) {
    return `High confidence decision. ${impact} impact expected.`;
  } else if (confidence >= 60) {
    return `Moderate confidence decision. ${impact} impact possible.`;
  } else if (confidence >= 40) {
    return `Low confidence decision. Recommendation: proceed with caution.`;
  }
  return `Very low confidence. Recommendation: require manual review.`;
}

export function buildExplanationDetails(decision = {}) {
  return {
    whatHappened: decision.action || 'Action initiated',
    whyItHappened: decision.reasoning || 'System evaluated and recommended action',
    howItWasDecided: decision.method || 'Heuristic analysis',
    whenItHappens: decision.timestamp || new Date().toISOString(),
    whoMadeIt: decision.actor || 'Autonomous system',
  };
}

export function buildFactorAnalysis(decision = {}) {
  const factors = decision.factors || [];
  if (factors.length === 0) {
    return [
      { name: 'System Health', weight: 0.3, score: 50 },
      { name: 'Historical Success', weight: 0.3, score: 50 },
      { name: 'Risk Assessment', weight: 0.2, score: 50 },
      { name: 'Business Value', weight: 0.2, score: 50 },
    ];
  }

  return factors.map(f => ({
    name: f.name || 'Unknown Factor',
    weight: f.weight || 0,
    score: f.score || 0,
    impact: (f.weight || 0) * (f.score || 0),
  }));
}

export function buildAlternatives(decision = {}, context = {}) {
  return [
    {
      option: 'Recommended',
      description: decision.recommendation || 'Proceed with suggested action',
      confidence: decision.confidence || 0,
      pros: ['Optimized for current conditions'],
      cons: [],
      selected: true,
    },
    {
      option: 'Conservative',
      description: 'Delay action pending more information',
      confidence: 100,
      pros: ['Lower risk', 'More time to evaluate'],
      cons: ['May miss opportunity', 'Increased delay'],
      selected: false,
    },
    {
      option: 'Manual Review',
      description: 'Route to human decision maker',
      confidence: 100,
      pros: ['Human judgment applied'],
      cons: ['Slower resolution'],
      selected: false,
    },
  ];
}

export function buildSimulation(workflow = {}, parameters = {}) {
  const simulatedSteps = (workflow.steps || []).map((step, idx) => ({
    ...step,
    estimated: {
      duration: Math.random() * 100 + 50,
      success: Math.random() * 30 + 70,
      risk: Math.random() * 20 + 10,
    },
    order: idx + 1,
  }));

  const aggregated = {
    totalDuration: simulatedSteps.reduce((sum, s) => sum + (s.estimated?.duration || 0), 0),
    totalRisk: Math.max(...simulatedSteps.map(s => s.estimated?.risk || 0), 0),
    estimatedSuccess: simulatedSteps.reduce((sum, s) => sum + (s.estimated?.success || 0), 0) / Math.max(simulatedSteps.length, 1),
  };

  return {
    id: `simulation-${Date.now()}`,
    workflowId: workflow.id,
    simulatedAt: new Date().toISOString(),
    steps: simulatedSteps,
    aggregated,
    recommendation: aggregated.estimatedSuccess >= 70 ? 'proceed' : 'caution',
  };
}

export function buildPolicy(
  scope = POLICY_SCOPE.AUTOMATION,
  type = POLICY_TYPE.RULE,
  description = '',
  rules = []
) {
  return {
    id: `policy-${Date.now()}`,
    scope,
    type,
    description,
    rules: rules || [],
    createdAt: new Date().toISOString(),
    active: true,
    enforcement: 'strict',
  };
}

export function evaluatePolicy(policy = {}, context = {}) {
  if (!policy || !policy.rules) return { allowed: true, violations: [] };

  const violations = [];

  policy.rules.forEach(rule => {
    if (!evaluateRule(rule, context)) {
      violations.push({
        rule: rule.name,
        reason: rule.reason,
        severity: rule.severity || 'warning',
      });
    }
  });

  return {
    allowed: violations.length === 0 || policy.enforcement !== 'strict',
    violations,
    policyId: policy.id,
  };
}

export function evaluateRule(rule = {}, context = {}) {
  if (!rule) return true;

  const operator = rule.operator || 'and';
  const conditions = rule.conditions || [];

  if (operator === 'and') {
    return conditions.every(c => evaluateCondition(c, context));
  } else if (operator === 'or') {
    return conditions.some(c => evaluateCondition(c, context));
  }

  return true;
}

export function evaluateCondition(condition = {}, context = {}) {
  if (!condition) return true;

  const { field, operator, value } = condition;
  const contextValue = context[field];

  switch (operator) {
    case 'equals':
      return contextValue === value;
    case 'notEquals':
      return contextValue !== value;
    case 'greaterThan':
      return contextValue > value;
    case 'lessThan':
      return contextValue < value;
    case 'contains':
      return String(contextValue).includes(value);
    case 'in':
      return Array.isArray(value) && value.includes(contextValue);
    default:
      return true;
  }
}

export function buildComplianceReport(auditTrail = {}, policies = [], period = {}) {
  const events = auditTrail.events || [];
  const startDate = period.start ? new Date(period.start) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const endDate = period.end ? new Date(period.end) : new Date();

  const periodEvents = events.filter(e => {
    const eventDate = new Date(e.timestamp);
    return eventDate >= startDate && eventDate <= endDate;
  });

  const policyCompliance = policies.map(policy => ({
    policyId: policy.id,
    scope: policy.scope,
    violations: periodEvents.filter(e => {
      const evaluation = evaluatePolicy(policy, { ...e, ...e.context });
      return !evaluation.allowed;
    }).length,
    totalEvents: periodEvents.length,
    complianceRate: 100,
  }));

  return {
    id: `report-${Date.now()}`,
    period: { start: startDate.toISOString(), end: endDate.toISOString() },
    totalEvents: periodEvents.length,
    successfulEvents: periodEvents.filter(e => e.decision?.confidence >= 70).length,
    suspiciousEvents: periodEvents.filter(e => e.decision?.confidence < 50).length,
    policiesEvaluated: policies.length,
    policyCompliance,
    overallCompliance: policyCompliance.length > 0
      ? Math.round(policyCompliance.reduce((sum, p) => sum + p.complianceRate, 0) / policyCompliance.length)
      : 100,
  };
}

export function buildGovernanceMetrics(auditTrail = {}, autonomousEngine = {}, orchestration = {}) {
  const events = auditTrail.events || [];

  const automationSuccessRate = events.length > 0
    ? Math.round((events.filter(e => e.decision?.confidence >= 70).length / events.length) * 100)
    : 0;

  const decisionVolumePerDay = events.length > 30 ? Math.round(events.length / 30) : 0;

  const humanApprovalRate = events.filter(e => e.type === AUDIT_EVENT_TYPE.APPROVAL_GRANTED).length / Math.max(events.filter(e => e.type === AUDIT_EVENT_TYPE.APPROVAL_REQUESTED).length, 1);

  const anomaliesDetected = events.filter(e => e.type === AUDIT_EVENT_TYPE.ANOMALY_DETECTED).length;

  return {
    automationSuccessRate,
    decisionVolumePerDay,
    humanApprovalRate: Math.round(humanApprovalRate * 100),
    anomaliesDetected,
    averageDecisionConfidence: events.length > 0
      ? Math.round(events.reduce((sum, e) => sum + (e.decision?.confidence || 0), 0) / events.length)
      : 0,
    operationalEfficiency: 50 + (automationSuccessRate / 2),
  };
}

export function serializeGovernanceState(state = {}) {
  return JSON.stringify({
    auditEvents: state.auditEvents || [],
    policies: state.policies || [],
    explanations: state.explanations || [],
    compliance: state.compliance || {},
    timestamp: new Date().toISOString(),
  });
}

export function deserializeGovernanceState(serialized = '') {
  try {
    return JSON.parse(serialized);
  } catch (error) {
    console.warn('Failed to deserialize governance state:', error);
    return {
      auditEvents: [],
      policies: [],
      explanations: [],
      compliance: {},
    };
  }
}
