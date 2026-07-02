import { useMemo } from 'react';
import { useAutomation } from './useAutomation';
import { useNotifications } from './useNotifications';
import { useWorkflows } from './useWorkflows';
import { useWorkflowBuilder } from './useWorkflowBuilder';
import { useScheduler } from './useScheduler';
import { useAIDecision } from './useAIDecision';
import { useFirmCoreData } from './useFirmCoreData';
import {
  buildOrchestrationViewModel,
  buildMissionControl,
  buildOperationsCenter,
  buildGlobalDashboard,
  buildPipelineView,
  buildSystemHealthCards,
  buildExecutionCards,
  buildResourceDashboard,
  buildRealtimeMetrics,
} from '../application/orchestrationApplication';

export function useOrchestration() {
  const coreData = useFirmCoreData();
  const automation = useAutomation(coreData.lawyers, coreData.cases, coreData.clients, coreData.departments, coreData.offices);
  const notifications = useNotifications(automation.alerts, automation.recommendations, automation.history);
  const workflows = useWorkflows(coreData.lawyers, coreData.cases, coreData.clients);
  const scheduler = useScheduler();
  const ai = useAIDecision(coreData.lawyers, coreData.cases, coreData.clients, coreData.departments);
  const workflowBuilder = useWorkflowBuilder();

  const orchestrationVM = useMemo(() => {
    return buildOrchestrationViewModel(
      {
        history: automation.history || [],
        rules: automation.rules || [],
        active: automation.running ? 1 : 0,
        total: automation.rules ? automation.rules.length : 0,
        lastRun: automation.lastRunTime,
        executions: automation.history || [],
      },
      {
        notifications: notifications.notifications || [],
        unreadCount: notifications.unreadCount || 0,
        status: 'active',
      },
      {
        workflows: workflows.workflows || [],
        executions: workflows.executions || [],
        active: workflows.running ? 1 : 0,
        total: workflows.workflows ? workflows.workflows.length : 0,
        lastRun: workflows.lastRunTime,
      },
      {
        schedules: scheduler.schedules || [],
        executions: scheduler.executions || [],
        upcoming: scheduler.upcoming || [],
        active: scheduler.schedules ? scheduler.schedules.filter(s => s.status === 'active').length : 0,
        total: scheduler.schedules ? scheduler.schedules.length : 0,
        lastExecution: scheduler.lastExecution,
      },
      {
        predictions: ai.predictions || [],
        recommendations: ai.recommendations || {},
        insights: ai.insights || [],
        summary: ai.summary || {},
        timestamp: ai.timestamp,
        active: 1,
        total: 1,
      },
      {
        graph: workflowBuilder.graph,
      }
    );
  }, [automation, notifications, workflows, scheduler, ai, workflowBuilder]);

  const missionControl = useMemo(() => {
    return buildMissionControl(
      {
        history: automation.history || [],
        rules: automation.rules || [],
        active: automation.running ? 1 : 0,
        total: automation.rules ? automation.rules.length : 0,
        lastRun: automation.lastRunTime,
        executions: automation.history || [],
      },
      {
        notifications: notifications.notifications || [],
        unreadCount: notifications.unreadCount || 0,
        status: 'active',
      },
      {
        workflows: workflows.workflows || [],
        executions: workflows.executions || [],
        active: workflows.running ? 1 : 0,
        total: workflows.workflows ? workflows.workflows.length : 0,
        lastRun: workflows.lastRunTime,
      },
      {
        schedules: scheduler.schedules || [],
        executions: scheduler.executions || [],
        upcoming: scheduler.upcoming || [],
        active: scheduler.schedules ? scheduler.schedules.filter(s => s.status === 'active').length : 0,
        total: scheduler.schedules ? scheduler.schedules.length : 0,
        lastExecution: scheduler.lastExecution,
      },
      {
        predictions: ai.predictions || [],
        recommendations: ai.recommendations || {},
        insights: ai.insights || [],
        summary: ai.summary || {},
        timestamp: ai.timestamp,
        active: 1,
        total: 1,
      }
    );
  }, [automation, notifications, workflows, scheduler, ai]);

  const operationsCenter = useMemo(() => {
    return buildOperationsCenter(
      {
        history: automation.history || [],
        rules: automation.rules || [],
        active: automation.running ? 1 : 0,
        total: automation.rules ? automation.rules.length : 0,
        lastRun: automation.lastRunTime,
        executions: automation.history || [],
      },
      {
        notifications: notifications.notifications || [],
        unreadCount: notifications.unreadCount || 0,
        status: 'active',
      },
      {
        workflows: workflows.workflows || [],
        executions: workflows.executions || [],
        active: workflows.running ? 1 : 0,
        total: workflows.workflows ? workflows.workflows.length : 0,
        lastRun: workflows.lastRunTime,
      },
      {
        schedules: scheduler.schedules || [],
        executions: scheduler.executions || [],
        upcoming: scheduler.upcoming || [],
        active: scheduler.schedules ? scheduler.schedules.filter(s => s.status === 'active').length : 0,
        total: scheduler.schedules ? scheduler.schedules.length : 0,
        lastExecution: scheduler.lastExecution,
      },
      {
        predictions: ai.predictions || [],
        recommendations: ai.recommendations || {},
        insights: ai.insights || [],
        summary: ai.summary || {},
        timestamp: ai.timestamp,
        active: 1,
        total: 1,
      }
    );
  }, [automation, notifications, workflows, scheduler, ai]);

  const globalDashboard = useMemo(() => {
    return buildGlobalDashboard(
      {
        history: automation.history || [],
        rules: automation.rules || [],
        status: automation.running ? 'active' : 'idle',
        lastRun: automation.lastRunTime,
      },
      {
        notifications: notifications.notifications || [],
        unreadCount: notifications.unreadCount || 0,
        status: 'active',
      },
      {
        workflows: workflows.workflows || [],
        executions: workflows.executions || [],
        status: workflows.running ? 'active' : 'idle',
        lastRun: workflows.lastRunTime,
      },
      {
        schedules: scheduler.schedules || [],
        upcoming: scheduler.upcoming || [],
        status: scheduler.schedules && scheduler.schedules.length > 0 ? 'active' : 'idle',
        lastExecution: scheduler.lastExecution,
      },
      {
        recommendations: ai.recommendations || {},
        predictions: ai.predictions || [],
        status: 'active',
        timestamp: ai.timestamp,
      }
    );
  }, [automation, notifications, workflows, scheduler, ai]);

  const pipelineView = useMemo(() => {
    const allExecutions = [
      ...(automation.history || []),
      ...(workflows.executions || []),
    ];
    return buildPipelineView(allExecutions);
  }, [automation, workflows]);

  const healthCards = useMemo(() => {
    return buildSystemHealthCards(orchestrationVM.systemHealth.modules);
  }, [orchestrationVM]);

  const executionCards = useMemo(() => {
    const allExecutions = [
      ...(automation.history || []),
      ...(workflows.executions || []),
    ];
    return buildExecutionCards(allExecutions);
  }, [automation, workflows]);

  const resourceDashboard = useMemo(() => {
    return buildResourceDashboard(operationsCenter.resourceConsumption);
  }, [operationsCenter]);

  const realtimeMetrics = useMemo(() => {
    return buildRealtimeMetrics(orchestrationVM.systemMetrics);
  }, [orchestrationVM]);

  return {
    // View Models
    orchestrationVM,
    missionControl,
    operationsCenter,
    globalDashboard,
    pipelineView,

    // Components Data
    healthCards,
    executionCards,
    resourceDashboard,
    realtimeMetrics,

    // Engine References
    automation,
    notifications,
    workflows,
    scheduler,
    ai,
    workflowBuilder,

    // Core Data
    coreData,

    // Shortcuts
    systemHealth: orchestrationVM.systemHealth,
    systemMetrics: orchestrationVM.systemMetrics,
    warnings: orchestrationVM.warnings,
    recommendations: orchestrationVM.recommendations,
    timestamp: orchestrationVM.timestamp,
  };
}
