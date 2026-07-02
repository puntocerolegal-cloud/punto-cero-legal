// Orchestration Application Layer - View Model Builders
import {
  buildSystemHealth,
  buildSystemMetrics,
  buildExecutionStatistics,
  buildResourceConsumption,
  buildExecutionTimeline,
  buildDependencyTree,
  buildExecutionMap,
  buildSystemWarnings,
  buildSystemRecommendations,
  buildLiveStatus,
  buildExecutionGraph,
  buildExecutionPipeline,
  buildAutomationFlow,
} from '../domain/orchestrationDomain';

export function buildOrchestrationViewModel(
  automationData = {},
  notificationsData = {},
  workflowsData = {},
  schedulerData = {},
  aiData = {},
  workflowBuilderData = {}
) {
  const systemHealth = buildSystemHealth(
    automationData,
    notificationsData,
    workflowsData,
    schedulerData,
    aiData
  );

  const systemMetrics = buildSystemMetrics(
    automationData,
    notificationsData,
    workflowsData,
    schedulerData,
    aiData
  );

  const allExecutions = [
    ...(automationData.history || []),
    ...(workflowsData.executions || []),
    ...(schedulerData.executions || []),
  ];

  const executionStats = buildExecutionStatistics(
    automationData.history || [],
    workflowsData.executions || [],
    schedulerData.executions || []
  );

  const timeline = buildExecutionTimeline(
    automationData.history || [],
    workflowsData.executions || [],
    schedulerData.executions || []
  );

  const dependencies = buildDependencyTree(
    workflowsData.workflows || [],
    schedulerData.schedules || []
  );

  const executionMap = buildExecutionMap(allExecutions);

  const warnings = buildSystemWarnings(systemHealth, systemMetrics, allExecutions);

  const recommendations = buildSystemRecommendations(
    systemHealth,
    systemMetrics,
    workflowsData.workflows || [],
    schedulerData.schedules || []
  );

  return {
    systemHealth,
    systemMetrics,
    executionStats,
    timeline,
    dependencies,
    executionMap,
    warnings,
    recommendations,
    timestamp: new Date().toISOString(),
  };
}

export function buildMissionControl(
  automationData = {},
  notificationsData = {},
  workflowsData = {},
  schedulerData = {},
  aiData = {}
) {
  const baseVM = buildOrchestrationViewModel(
    automationData,
    notificationsData,
    workflowsData,
    schedulerData,
    aiData
  );

  const executionGraph = buildExecutionGraph(
    automationData.history || [],
    workflowsData.executions || [],
    schedulerData.executions || []
  );

  const executionPipeline = buildExecutionPipeline(
    [...(automationData.history || []), ...(workflowsData.executions || [])]
  );

  return {
    ...baseVM,
    executionGraph,
    executionPipeline,
    headerStatus: buildLiveStatus(baseVM.systemHealth.modules),
  };
}

export function buildOperationsCenter(
  automationData = {},
  notificationsData = {},
  workflowsData = {},
  schedulerData = {},
  aiData = {}
) {
  const automationFlow = buildAutomationFlow(
    automationData.rules || [],
    automationData.history || []
  );

  const resourceConsumption = buildResourceConsumption(
    {},
    [...(automationData.history || []), ...(workflowsData.executions || [])],
    [
      { name: 'Automation' },
      { name: 'Workflows' },
      { name: 'Scheduler' },
      { name: 'AI Engine' },
    ]
  );

  const baseVM = buildOrchestrationViewModel(
    automationData,
    notificationsData,
    workflowsData,
    schedulerData,
    aiData
  );

  return {
    ...baseVM,
    automationFlow,
    resourceConsumption,
  };
}

export function buildGlobalDashboard(
  automationData = {},
  notificationsData = {},
  workflowsData = {},
  schedulerData = {},
  aiData = {}
) {
  const baseVM = buildOrchestrationViewModel(
    automationData,
    notificationsData,
    workflowsData,
    schedulerData,
    aiData
  );

  return {
    ...baseVM,
    modules: {
      automation: {
        name: 'Automation Engine',
        status: automationData.status || 'idle',
        rules: automationData.rules ? automationData.rules.length : 0,
        executions: automationData.history ? automationData.history.length : 0,
        lastRun: automationData.lastRun,
      },
      notifications: {
        name: 'Notification Center',
        status: notificationsData.status || 'idle',
        unread: notificationsData.unreadCount || 0,
        total: notificationsData.notifications ? notificationsData.notifications.length : 0,
        lastUpdate: notificationsData.lastUpdate,
      },
      workflows: {
        name: 'Workflow Engine',
        status: workflowsData.status || 'idle',
        total: workflowsData.workflows ? workflowsData.workflows.length : 0,
        running: workflowsData.executions ? workflowsData.executions.filter(e => e.status === 'running').length : 0,
        lastRun: workflowsData.lastRun,
      },
      scheduler: {
        name: 'Enterprise Scheduler',
        status: schedulerData.status || 'idle',
        schedules: schedulerData.schedules ? schedulerData.schedules.length : 0,
        upcoming: schedulerData.upcoming ? schedulerData.upcoming.length : 0,
        lastExecution: schedulerData.lastExecution,
      },
      ai: {
        name: 'AI Decision Engine',
        status: aiData.status || 'idle',
        recommendations: aiData.recommendations ? aiData.recommendations.recommendations.length : 0,
        confidence: aiData.predictions ? aiData.predictions.confidence : 0,
        lastAnalysis: aiData.timestamp,
      },
    },
  };
}

export function buildPipelineView(executions = []) {
  const pipeline = buildExecutionPipeline(executions);

  return {
    ...pipeline,
    stages: [
      {
        name: 'Pending',
        count: pipeline.pending,
        percentage: executions.length > 0 ? (pipeline.pending / executions.length) * 100 : 0,
        items: pipeline.stages.pending.slice(0, 5),
      },
      {
        name: 'Running',
        count: pipeline.running,
        percentage: executions.length > 0 ? (pipeline.running / executions.length) * 100 : 0,
        items: pipeline.stages.running.slice(0, 5),
      },
      {
        name: 'Completed',
        count: pipeline.completed,
        percentage: executions.length > 0 ? (pipeline.completed / executions.length) * 100 : 0,
        items: pipeline.stages.completed.slice(0, 5),
      },
      {
        name: 'Failed',
        count: pipeline.failed,
        percentage: executions.length > 0 ? (pipeline.failed / executions.length) * 100 : 0,
        items: pipeline.stages.failed.slice(0, 5),
      },
    ],
  };
}

export function buildSystemHealthCards(modules = []) {
  return modules.map(module => ({
    id: module.name.toLowerCase(),
    name: module.name,
    status: module.status,
    health: module.health,
    active: module.active,
    total: module.total,
    percentage: module.percentage,
    lastRun: module.lastRun,
  }));
}

export function buildExecutionCards(executions = []) {
  const cards = [];

  executions.slice(0, 5).forEach((exec, idx) => {
    cards.push({
      id: `exec-${idx}`,
      type: exec.type || 'unknown',
      name: exec.name || exec.ruleName || 'Execution',
      status: exec.status,
      timestamp: exec.timestamp || exec.executedAt,
      duration: exec.duration,
    });
  });

  return cards;
}

export function buildResourceDashboard(consumption = {}) {
  return {
    memory: {
      used: consumption.estimatedMemory || 0,
      unit: 'MB',
      warning: 128,
      critical: 256,
    },
    executionTime: {
      average: consumption.averageExecutionTime || 0,
      peak: consumption.peakLoad || 0,
      unit: 'ms',
    },
    concurrent: {
      current: consumption.concurrentExecutions || 0,
      max: 10,
    },
    health: consumption.estimatedMemory < 100 ? 'excellent' : consumption.estimatedMemory < 200 ? 'good' : 'warning',
  };
}

export function buildRealtimeMetrics(metrics = {}) {
  return {
    executionRate: {
      value: metrics.executionRate || 0,
      unit: '%',
      trend: 'stable',
    },
    automationEfficiency: {
      value: metrics.automationEfficiency || 0,
      unit: '%',
      trend: 'stable',
    },
    workflowEfficiency: {
      value: metrics.workflowEfficiency || 0,
      unit: '%',
      trend: 'stable',
    },
    schedulerEfficiency: {
      value: metrics.schedulerEfficiency || 0,
      unit: '%',
      trend: 'stable',
    },
    predictionAccuracy: {
      value: metrics.predictionAccuracy || 0,
      unit: '%',
      trend: 'stable',
    },
    overallHealth: {
      value: metrics.overallHealth || 0,
      unit: '%',
      trend: 'stable',
    },
  };
}
