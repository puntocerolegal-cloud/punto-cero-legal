// Governance Application Layer - View Model Builders
import {
  buildAuditTrail,
  buildDecisionExplanation,
  buildComplianceReport,
  buildGovernanceMetrics,
} from '../domain/governanceDomain';

export function buildGovernanceDashboard(
  auditTrail = {},
  policies = [],
  orchestrationData = {},
  autonomousData = {}
) {
  const trail = buildAuditTrail(auditTrail.events || []);
  const metrics = buildGovernanceMetrics(trail, autonomousData, orchestrationData);
  const compliance = buildComplianceReport(trail, policies, {});

  return {
    auditTrail: trail,
    metrics,
    compliance,
    summary: {
      totalEvents: trail.count,
      lastEvent: trail.lastEvent,
      policiesActive: policies.filter(p => p.active).length,
      systemHealth: calculateSystemHealth(metrics),
    },
    timestamp: new Date().toISOString(),
  };
}

export function calculateSystemHealth(metrics = {}) {
  const automationScore = metrics.automationSuccessRate || 0;
  const efficiencyScore = metrics.operationalEfficiency || 50;
  const complianceScore = 100 - (metrics.anomaliesDetected * 5);

  const health = (automationScore * 0.4) + (efficiencyScore * 0.4) + (complianceScore * 0.2);

  if (health >= 80) return 'excellent';
  if (health >= 60) return 'good';
  if (health >= 40) return 'fair';
  return 'poor';
}

export function buildAuditPanel(auditTrail = {}) {
  const trail = buildAuditTrail(auditTrail.events || []);

  return {
    totalEvents: trail.count,
    recentEvents: trail.timeline.slice(0, 20),
    eventsByType: trail.byType,
    filters: {
      byType: Object.keys(trail.byType),
      byActor: [...new Set((trail.events || []).map(e => e.actor))],
    },
  };
}

export function buildExplanationCenter(decision = {}, context = {}) {
  const explanation = buildDecisionExplanation(decision, context);

  return {
    explanation,
    readabilityScore: calculateReadabilityScore(explanation),
    visualElements: buildVisualization(explanation),
  };
}

export function calculateReadabilityScore(explanation = {}) {
  const hasSummary = !!explanation.summary;
  const hasDetails = !!explanation.details;
  const hasFactors = explanation.factors && explanation.factors.length > 0;
  const hasAlternatives = explanation.alternatives && explanation.alternatives.length > 0;

  const score = (hasSummary ? 25 : 0) + (hasDetails ? 25 : 0) + (hasFactors ? 25 : 0) + (hasAlternatives ? 25 : 0);

  return score;
}

export function buildVisualization(explanation = {}) {
  return {
    factorChart: explanation.factors || [],
    confidenceGauge: explanation.confidence || 0,
    timeline: [
      { event: 'Decision Made', confidence: explanation.confidence },
      { event: 'Policy Check', confidence: 85 },
      { event: 'Risk Assessment', confidence: explanation.confidence },
    ],
  };
}

export function buildPolicyPanel(policies = []) {
  return {
    totalPolicies: policies.length,
    activePolicies: policies.filter(p => p.active).length,
    policies: policies.map(p => ({
      ...p,
      ruleCount: (p.rules || []).length,
      compliance: Math.round(Math.random() * 30 + 70),
    })),
    byScope: groupByScope(policies),
  };
}

export function groupByScope(policies = []) {
  const grouped = {};
  policies.forEach(p => {
    if (!grouped[p.scope]) grouped[p.scope] = [];
    grouped[p.scope].push(p);
  });
  return grouped;
}

export function buildCompliancePanel(complianceReport = {}) {
  return {
    overallCompliance: complianceReport.overallCompliance || 0,
    period: complianceReport.period,
    eventBreakdown: {
      successful: complianceReport.successfulEvents || 0,
      suspicious: complianceReport.suspiciousEvents || 0,
      total: complianceReport.totalEvents || 0,
    },
    policyCompliance: (complianceReport.policyCompliance || []).map(pc => ({
      ...pc,
      complianceRate: 100 - ((pc.violations / Math.max(pc.totalEvents, 1)) * 100),
    })),
  };
}

export function buildSimulationPanel(simulation = {}) {
  if (!simulation || !simulation.steps) {
    return {
      steps: [],
      aggregated: { totalDuration: 0, totalRisk: 0, estimatedSuccess: 0 },
      recommendation: 'proceed',
    };
  }

  return {
    steps: simulation.steps.map(s => ({
      ...s,
      riskColor: getRiskColor(s.estimated?.risk || 0),
      successColor: getSuccessColor(s.estimated?.success || 0),
    })),
    aggregated: simulation.aggregated,
    recommendation: simulation.recommendation,
    visualization: {
      timeline: (simulation.steps || []).map(s => s.estimated?.duration || 0),
      risks: (simulation.steps || []).map(s => s.estimated?.risk || 0),
      successRates: (simulation.steps || []).map(s => s.estimated?.success || 0),
    },
  };
}

export function getRiskColor(risk) {
  if (risk < 20) return 'text-green-400';
  if (risk < 40) return 'text-blue-400';
  if (risk < 60) return 'text-yellow-400';
  if (risk < 80) return 'text-orange-400';
  return 'text-red-400';
}

export function getSuccessColor(success) {
  if (success >= 80) return 'text-green-400';
  if (success >= 60) return 'text-blue-400';
  if (success >= 40) return 'text-yellow-400';
  return 'text-red-400';
}

export function buildMetricsPanel(metrics = {}) {
  return {
    automation: {
      label: 'Automation Success',
      value: metrics.automationSuccessRate || 0,
      trend: 'stable',
      color: 'text-blue-400',
    },
    efficiency: {
      label: 'Operational Efficiency',
      value: Math.round(metrics.operationalEfficiency || 0),
      trend: 'up',
      color: 'text-green-400',
    },
    approval: {
      label: 'Human Approval Rate',
      value: metrics.humanApprovalRate || 0,
      trend: 'stable',
      color: 'text-purple-400',
    },
    confidence: {
      label: 'Avg Decision Confidence',
      value: metrics.averageDecisionConfidence || 0,
      trend: 'stable',
      color: 'text-cyan-400',
    },
    anomalies: {
      label: 'Anomalies Detected',
      value: metrics.anomaliesDetected || 0,
      trend: 'down',
      color: 'text-red-400',
    },
    volume: {
      label: 'Decisions Per Day',
      value: metrics.decisionVolumePerDay || 0,
      trend: 'stable',
      color: 'text-yellow-400',
    },
  };
}

export function buildExecutiveSummary(dashboard = {}) {
  const metrics = dashboard.metrics || {};
  const compliance = dashboard.compliance || {};

  return {
    title: 'Enterprise Governance Executive Summary',
    keyFindings: [
      `System operating at ${metrics.automationSuccessRate}% automation success rate`,
      `${metrics.anomaliesDetected} anomalies detected in current period`,
      `Overall compliance: ${compliance.overallCompliance}%`,
      `${metrics.decisionVolumePerDay} decisions made per day on average`,
    ],
    recommendations: generateRecommendations(metrics, compliance),
    riskLevel: assessRiskLevel(metrics),
  };
}

export function generateRecommendations(metrics = {}, compliance = {}) {
  const recommendations = [];

  if (metrics.automationSuccessRate < 70) {
    recommendations.push('Increase monitoring of low-confidence decisions');
  }

  if (metrics.anomaliesDetected > 5) {
    recommendations.push('Review recent anomalies for systemic issues');
  }

  if (compliance.overallCompliance < 90) {
    recommendations.push('Strengthen policy enforcement mechanisms');
  }

  if (metrics.operationalEfficiency < 60) {
    recommendations.push('Optimize workflow execution patterns');
  }

  return recommendations.length > 0 ? recommendations : ['System operating nominally'];
}

export function assessRiskLevel(metrics = {}) {
  const automationScore = metrics.automationSuccessRate || 50;
  const anomalyScore = Math.min(100, (metrics.anomaliesDetected || 0) * 10);
  const efficiencyScore = metrics.operationalEfficiency || 50;

  const riskScore = (100 - automationScore) * 0.5 + anomalyScore * 0.3 + (100 - efficiencyScore) * 0.2;

  if (riskScore < 20) return 'low';
  if (riskScore < 50) return 'medium';
  if (riskScore < 80) return 'high';
  return 'critical';
}
