// Enterprise Orchestration Center - Pure Domain Logic
// Aggregates and correlates all engine statuses without business logic

export const MODULE_STATUS = {
  ACTIVE: 'active',
  PAUSED: 'paused',
  ERROR: 'error',
  IDLE: 'idle',
  HEALTHY: 'healthy',
  WARNING: 'warning',
  CRITICAL: 'critical',
};

export const HEALTH_LEVEL = {
  CRITICAL: 'critical',
  POOR: 'poor',
  FAIR: 'fair',
  GOOD: 'good',
  EXCELLENT: 'excellent',
};

export function buildModuleStatus(moduleName, active = 0, total = 0, lastRun = null, status = 'idle') {
  const percentage = total > 0 ? (active / total) * 100 : 0;
  const isHealthy = status === 'healthy' || percentage >= 80;
  const isCritical = status === 'critical' || percentage < 20;

  return {
    name: moduleName,
    active,
    total,
    percentage: Math.round(percentage),
    lastRun,
    status: isCritical ? MODULE_STATUS.CRITICAL : isHealthy ? MODULE_STATUS.HEALTHY : MODULE_STATUS.WARNING,
    health: isCritical ? HEALTH_LEVEL.CRITICAL : isHealthy ? HEALTH_LEVEL.EXCELLENT : HEALTH_LEVEL.FAIR,
  };
}

export function buildSystemHealth(automation = {}, notifications = {}, workflows = {}, scheduler = {}, ai = {}) {
  const modules = [
    buildModuleStatus('Automation', automation.active || 0, automation.total || 0, automation.lastRun),
    buildModuleStatus('Notifications', notifications.active || 0, notifications.total || 0, notifications.lastRun),
    buildModuleStatus('Workflows', workflows.active || 0, workflows.total || 0, workflows.lastRun),
    buildModuleStatus('Scheduler', scheduler.active || 0, scheduler.total || 0, scheduler.lastRun),
    buildModuleStatus('AI Engine', ai.active || 0, ai.total || 0, ai.lastRun),
  ];

  const totalModules = modules.length;
  const healthyModules = modules.filter(m => m.health === HEALTH_LEVEL.EXCELLENT).length;
  const warningModules = modules.filter(m => m.health === HEALTH_LEVEL.FAIR).length;
  const criticalModules = modules.filter(m => m.health === HEALTH_LEVEL.CRITICAL).length;

  const overallHealth = criticalModules > 0 ? HEALTH_LEVEL.CRITICAL
    : warningModules > totalModules / 2 ? HEALTH_LEVEL.POOR
    : healthyModules === totalModules ? HEALTH_LEVEL.EXCELLENT
    : HEALTH_LEVEL.GOOD;

  return {
    overallHealth,
    modules,
    healthyModules,
    warningModules,
    criticalModules,
    timestamp: new Date().toISOString(),
  };
}

export function calculateExecutionRate(executions = [], timewindow = 3600000) {
  if (!Array.isArray(executions) || executions.length === 0) return 0;
  const now = Date.now();
  const recent = executions.filter(e => {
    const time = new Date(e.timestamp || e.executedAt || 0).getTime();
    return now - time <= timewindow;
  });
  return Math.round((recent.length / executions.length) * 100);
}

export function calculateAutomationEfficiency(history = []) {
  if (!Array.isArray(history) || history.length === 0) return 0;
  const successful = history.filter(h => h.status === 'success').length;
  return Math.round((successful / history.length) * 100);
}

export function calculateWorkflowEfficiency(executions = []) {
  if (!Array.isArray(executions) || executions.length === 0) return 0;
  const successful = executions.filter(e => e.status === 'completed').length;
  return Math.round((successful / executions.length) * 100);
}

export function calculateSchedulerEfficiency(schedules = [], executions = []) {
  if (!Array.isArray(schedules) || schedules.length === 0) return 0;
  const active = schedules.filter(s => s.status === 'active').length;
  const executed = executions.filter(e => e.status === 'completed').length;
  return active > 0 ? Math.round((executed / (active * 5)) * 100) : 0;
}

export function calculatePredictionAccuracy(predictions = []) {
  if (!Array.isArray(predictions) || predictions.length === 0) return 0;
  const withConfidence = predictions.filter(p => p.confidence);
  if (withConfidence.length === 0) return 0;
  const avgConfidence = withConfidence.reduce((sum, p) => {
    const conf = p.confidence;
    if (typeof conf === 'number') return sum + conf;
    if (conf === 'very_high') return sum + 90;
    if (conf === 'high') return sum + 75;
    if (conf === 'medium') return sum + 50;
    if (conf === 'low') return sum + 25;
    return sum + 10;
  }, 0) / withConfidence.length;
  return Math.round(avgConfidence);
}

export function calculateResourceHealth(metrics = {}) {
  const weights = {
    executionRate: 0.25,
    automation: 0.2,
    workflow: 0.2,
    scheduler: 0.2,
    prediction: 0.15,
  };

  const executionRate = metrics.executionRate || 0;
  const automation = metrics.automation || 0;
  const workflow = metrics.workflow || 0;
  const scheduler = metrics.scheduler || 0;
  const prediction = metrics.prediction || 0;

  const health = (executionRate * weights.executionRate)
    + (automation * weights.automation)
    + (workflow * weights.workflow)
    + (scheduler * weights.scheduler)
    + (prediction * weights.prediction);

  return Math.round(Math.min(100, health));
}

export function buildExecutionGraph(automationRuns = [], workflowRuns = [], schedulerRuns = []) {
  const nodes = [];
  const connections = [];

  // Automation nodes
  if (Array.isArray(automationRuns)) {
    automationRuns.forEach((run, idx) => {
      if (run && run.id) {
        nodes.push({
          id: `automation-${idx}`,
          type: 'automation',
          name: run.ruleName || 'Automation',
          status: run.status || 'pending',
          timestamp: run.timestamp || new Date().toISOString(),
        });
      }
    });
  }

  // Workflow nodes
  if (Array.isArray(workflowRuns)) {
    workflowRuns.forEach((run, idx) => {
      if (run && run.id) {
        nodes.push({
          id: `workflow-${idx}`,
          type: 'workflow',
          name: run.name || 'Workflow',
          status: run.status || 'pending',
          timestamp: run.timestamp || run.startTime || new Date().toISOString(),
        });
      }
    });
  }

  // Scheduler nodes
  if (Array.isArray(schedulerRuns)) {
    schedulerRuns.forEach((run, idx) => {
      if (run && run.id) {
        nodes.push({
          id: `scheduler-${idx}`,
          type: 'scheduler',
          name: run.name || 'Scheduled Task',
          status: run.status || 'pending',
          timestamp: run.executedAt || new Date().toISOString(),
        });
      }
    });
  }

  return {
    nodes,
    connections,
    totalNodes: nodes.length,
  };
}

export function buildExecutionPipeline(executions = []) {
  if (!Array.isArray(executions)) return { stages: [], totalExecutions: 0 };

  const stages = {
    pending: [],
    running: [],
    completed: [],
    failed: [],
  };

  executions.forEach(exec => {
    if (!exec) return;
    const status = exec.status || 'pending';
    if (stages[status]) {
      stages[status].push(exec);
    }
  });

  return {
    stages,
    pending: stages.pending.length,
    running: stages.running.length,
    completed: stages.completed.length,
    failed: stages.failed.length,
    totalExecutions: executions.length,
  };
}

export function buildAutomationFlow(rules = [], history = []) {
  const flowData = {
    totalRules: Array.isArray(rules) ? rules.length : 0,
    executedRules: Array.isArray(history) ? history.length : 0,
    successRate: calculateAutomationEfficiency(history),
    failureRate: 100 - calculateAutomationEfficiency(history),
    recentRuns: Array.isArray(history) ? history.slice(0, 5) : [],
  };

  return flowData;
}

export function buildSystemMetrics(automation = {}, notifications = {}, workflows = {}, scheduler = {}, ai = {}) {
  const metrics = {
    executionRate: calculateExecutionRate(
      [...(automation.executions || []), ...(workflows.executions || []), ...(scheduler.executions || [])],
      3600000
    ),
    automationEfficiency: calculateAutomationEfficiency(automation.history || []),
    workflowEfficiency: calculateWorkflowEfficiency(workflows.executions || []),
    schedulerEfficiency: calculateSchedulerEfficiency(scheduler.schedules || [], scheduler.executions || []),
    predictionAccuracy: calculatePredictionAccuracy(ai.predictions || []),
    notificationVolume: Array.isArray(notifications.notifications) ? notifications.notifications.length : 0,
    activeModules: [
      automation.active ? 'automation' : null,
      workflows.active ? 'workflows' : null,
      scheduler.active ? 'scheduler' : null,
      ai.active ? 'ai' : null,
    ].filter(Boolean).length,
  };

  metrics.overallHealth = calculateResourceHealth({
    executionRate: metrics.executionRate,
    automation: metrics.automationEfficiency,
    workflow: metrics.workflowEfficiency,
    scheduler: metrics.schedulerEfficiency,
    prediction: metrics.predictionAccuracy,
  });

  return metrics;
}

export function buildExecutionStatistics(automationHistory = [], workflowExecutions = [], schedulerExecutions = []) {
  const allExecutions = [...automationHistory, ...workflowExecutions, ...schedulerExecutions];

  const stats = {
    totalExecutions: allExecutions.length,
    successful: allExecutions.filter(e => e.status === 'success' || e.status === 'completed').length,
    failed: allExecutions.filter(e => e.status === 'failed' || e.status === 'error').length,
    pending: allExecutions.filter(e => e.status === 'pending').length,
    running: allExecutions.filter(e => e.status === 'running').length,
  };

  stats.successRate = stats.totalExecutions > 0 ? Math.round((stats.successful / stats.totalExecutions) * 100) : 0;
  stats.failureRate = 100 - stats.successRate;

  return stats;
}

export function buildResourceConsumption(metrics = {}, executions = [], modules = []) {
  const avgExecutionTime = executions.length > 0
    ? executions.reduce((sum, e) => sum + (e.duration || 0), 0) / executions.length
    : 0;

  return {
    estimatedMemory: Math.round((executions.length * 0.5) + (modules.length * 2)),
    averageExecutionTime: Math.round(avgExecutionTime),
    peakLoad: Math.max(...executions.map(e => e.duration || 0), 0),
    concurrentExecutions: executions.filter(e => e.status === 'running').length,
  };
}

export function buildExecutionTimeline(automationHistory = [], workflowExecutions = [], schedulerExecutions = []) {
  const events = [
    ...automationHistory.map(e => ({
      type: 'automation',
      name: e.ruleName || 'Automation Rule',
      timestamp: new Date(e.timestamp || 0),
      status: e.status,
    })),
    ...workflowExecutions.map(e => ({
      type: 'workflow',
      name: e.name || 'Workflow',
      timestamp: new Date(e.startTime || 0),
      status: e.status,
    })),
    ...schedulerExecutions.map(e => ({
      type: 'scheduler',
      name: e.name || 'Scheduled Task',
      timestamp: new Date(e.executedAt || 0),
      status: e.status,
    })),
  ];

  return events.sort((a, b) => b.timestamp - a.timestamp);
}

export function buildDependencyTree(workflows = [], schedules = []) {
  const dependencies = [];

  if (Array.isArray(schedules)) {
    schedules.forEach(schedule => {
      if (schedule.workflowId) {
        dependencies.push({
          source: schedule.id,
          target: schedule.workflowId,
          type: 'schedules_workflow',
        });
      }
    });
  }

  if (Array.isArray(workflows)) {
    workflows.forEach(workflow => {
      if (workflow.nodeGraph) {
        const nodes = workflow.nodeGraph.nodes || [];
        nodes.forEach(node => {
          if (node.automationRuleId) {
            dependencies.push({
              source: workflow.id,
              target: node.automationRuleId,
              type: 'workflow_automation',
            });
          }
        });
      }
    });
  }

  return {
    dependencies,
    totalDependencies: dependencies.length,
  };
}

export function buildExecutionMap(executions = []) {
  const map = {
    byType: {},
    byStatus: {},
    byTime: {},
  };

  executions.forEach(exec => {
    if (!exec) return;

    const type = exec.type || 'unknown';
    const status = exec.status || 'pending';
    const time = new Date(exec.timestamp || exec.executedAt || 0).toISOString().split('T')[0];

    if (!map.byType[type]) map.byType[type] = [];
    if (!map.byStatus[status]) map.byStatus[status] = [];
    if (!map.byTime[time]) map.byTime[time] = [];

    map.byType[type].push(exec);
    map.byStatus[status].push(exec);
    map.byTime[time].push(exec);
  });

  return map;
}

export function buildSystemWarnings(health = {}, metrics = {}, executions = []) {
  const warnings = [];

  if (health.criticalModules > 0) {
    warnings.push({
      severity: 'critical',
      title: 'Critical Module Status',
      description: `${health.criticalModules} module(s) in critical state`,
      module: 'system',
    });
  }

  if (metrics.successRate < 70) {
    warnings.push({
      severity: 'high',
      title: 'Low Success Rate',
      description: `Overall success rate is ${metrics.successRate}%`,
      module: 'execution',
    });
  }

  if (metrics.predictionAccuracy < 50) {
    warnings.push({
      severity: 'medium',
      title: 'Low Prediction Confidence',
      description: `Prediction accuracy is ${metrics.predictionAccuracy}%`,
      module: 'ai',
    });
  }

  const failedExecutions = executions.filter(e => e.status === 'failed' || e.status === 'error');
  if (failedExecutions.length > 5) {
    warnings.push({
      severity: 'high',
      title: 'Multiple Failed Executions',
      description: `${failedExecutions.length} executions failed recently`,
      module: 'execution',
    });
  }

  return warnings;
}

export function buildSystemRecommendations(health = {}, metrics = {}, workflows = [], schedules = []) {
  const recommendations = [];

  if (health.warningModules > 0) {
    recommendations.push({
      priority: 'high',
      title: 'Review Module Status',
      description: 'Some modules are operating below optimal levels',
      action: 'Check module health details',
    });
  }

  if (Array.isArray(workflows) && workflows.length === 0) {
    recommendations.push({
      priority: 'medium',
      title: 'Create Automation Workflows',
      description: 'No workflows defined. Consider creating automation workflows.',
      action: 'Go to Workflow Builder',
    });
  }

  if (Array.isArray(schedules) && schedules.length === 0) {
    recommendations.push({
      priority: 'medium',
      title: 'Schedule Workflows',
      description: 'No schedules configured. Automate workflow execution.',
      action: 'Go to Scheduler',
    });
  }

  if (metrics.executionRate < 50) {
    recommendations.push({
      priority: 'high',
      title: 'Increase Execution Rate',
      description: 'Current execution rate is lower than recommended',
      action: 'Review automation rules',
    });
  }

  return recommendations;
}

export function buildLiveStatus(modules = [], timestamp = null) {
  const now = timestamp ? new Date(timestamp) : new Date();
  const activeCount = modules.filter(m => m.status === MODULE_STATUS.ACTIVE).length;
  const errorCount = modules.filter(m => m.status === MODULE_STATUS.ERROR).length;

  return {
    timestamp: now.toISOString(),
    activeModules: activeCount,
    errorModules: errorCount,
    totalModules: modules.length,
    isHealthy: errorCount === 0 && activeCount >= modules.length * 0.8,
    lastUpdate: now.toLocaleTimeString(),
  };
}
