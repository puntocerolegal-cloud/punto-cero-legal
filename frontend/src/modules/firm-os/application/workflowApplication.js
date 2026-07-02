// Application layer - Orchestrates workflow domain
// NO UI logic, NO components, NO side effects

import {
  buildWorkflowExecution,
  buildWorkflowHistory,
  buildWorkflowStatistics,
  groupWorkflowsByStatus,
} from '../domain/workflowDomain';

export function buildWorkflowViewModel(workflows, executions) {
  if (!Array.isArray(workflows)) {
    return {
      workflows: [],
      byStatus: {},
      statistics: {},
      totalCount: 0,
    };
  }

  const grouped = groupWorkflowsByStatus(workflows);
  const history = buildWorkflowHistory(executions || []);
  const statistics = buildWorkflowStatistics(workflows, executions);

  return {
    workflows,
    byStatus: grouped,
    history,
    statistics,
    totalCount: workflows.length,
    activeCount: grouped.active.length,
    pausedCount: grouped.paused.length,
  };
}

export function buildWorkflowDashboard(workflows, executions) {
  const vm = buildWorkflowViewModel(workflows, executions);

  return {
    section: 'workflows',
    title: 'Centro de Workflow',
    subtitle: 'Automatización de procesos empresariales',
    widgets: [
      {
        id: 'workflow_status',
        type: 'status',
        title: 'Estado del Motor',
        data: {
          status: 'active',
          workflowsActive: vm.activeCount,
          workflowsPaused: vm.pausedCount,
          totalWorkflows: vm.totalCount,
        },
      },
      {
        id: 'workflow_statistics',
        type: 'statistics',
        title: 'Estadísticas de Ejecución',
        data: vm.statistics,
      },
      {
        id: 'workflow_recent',
        type: 'recent',
        title: 'Ejecuciones Recientes',
        data: vm.history.slice(0, 5),
      },
    ],
  };
}


export function buildWorkflowTemplates() {
  return [
    {
      id: 'tpl_new_case',
      name: 'Caso Nuevo',
      description: 'Notificar y asignar caso nuevo automáticamente',
      trigger: 'event',
      conditions: [
        {
          id: 'cond_1',
          name: 'Caso creado',
          expression: 'context.eventType === "case_created"',
        },
      ],
      actions: [
        {
          id: 'act_1',
          type: 'notify',
          name: 'Notificar equipo',
          params: { channel: 'email', role: 'manager' },
        },
        {
          id: 'act_2',
          type: 'assign',
          name: 'Asignar a abogado disponible',
          params: { department: 'general' },
        },
      ],
      priority: 'high',
      icon: 'Plus',
      color: '#10b981',
    },
    {
      id: 'tpl_unassigned_case',
      name: 'Caso Sin Abogado',
      description: 'Detectar y asignar casos sin abogado responsable',
      trigger: 'condition',
      conditions: [
        {
          id: 'cond_1',
          name: 'Caso sin asignación',
          expression: 'context.cases.some(c => !c.assignedLawyer)',
        },
      ],
      actions: [
        {
          id: 'act_1',
          type: 'escalate',
          name: 'Escalar a supervisor',
          params: { level: 'high' },
        },
        {
          id: 'act_2',
          type: 'notify',
          name: 'Notificar departamento',
          params: { channel: 'system' },
        },
      ],
      priority: 'critical',
      icon: 'AlertCircle',
      color: '#ef4444',
    },
    {
      id: 'tpl_overdue_case',
      name: 'Caso Vencido',
      description: 'Alertar sobre casos próximos a vencer',
      trigger: 'scheduled',
      conditions: [
        {
          id: 'cond_1',
          name: 'Próximo a vencer',
          expression: 'context.cases.some(c => (new Date(c.dueDate) - Date.now()) < 7*24*60*60*1000)',
        },
      ],
      actions: [
        {
          id: 'act_1',
          type: 'notify',
          name: 'Notificar abogado responsable',
          params: { priority: 'high' },
        },
        {
          id: 'act_2',
          type: 'update_priority',
          name: 'Actualizar prioridad del caso',
          params: { newPriority: 'urgent' },
        },
      ],
      priority: 'high',
      icon: 'Clock',
      color: '#f59e0b',
    },
    {
      id: 'tpl_lawyer_overload',
      name: 'Sobrecarga Abogado',
      description: 'Detectar abogados con carga excesiva',
      trigger: 'condition',
      conditions: [
        {
          id: 'cond_1',
          name: 'Abogado sobrecargado',
          expression: 'context.lawyers.some(l => l.caseCount > 45)',
        },
      ],
      actions: [
        {
          id: 'act_1',
          type: 'notify',
          name: 'Notificar abogado',
          params: { template: 'overload_warning' },
        },
        {
          id: 'act_2',
          type: 'escalate',
          name: 'Escalar a gerencia',
          params: { level: 'medium' },
        },
      ],
      priority: 'high',
      icon: 'TrendingUp',
      color: '#f59e0b',
    },
    {
      id: 'tpl_vip_client',
      name: 'Cliente VIP',
      description: 'Workflow especial para clientes VIP',
      trigger: 'event',
      conditions: [
        {
          id: 'cond_1',
          name: 'Cliente es VIP',
          expression: 'context.client?.isVIP === true',
        },
      ],
      actions: [
        {
          id: 'act_1',
          type: 'assign',
          name: 'Asignar abogado senior',
          params: { seniority: 'senior' },
        },
        {
          id: 'act_2',
          type: 'notify',
          name: 'Notificar director',
          params: { channel: 'email' },
        },
      ],
      priority: 'critical',
      icon: 'Star',
      color: '#f59e0b',
    },
    {
      id: 'tpl_urgent_case',
      name: 'Caso Urgente',
      description: 'Procesamiento inmediato de casos urgentes',
      trigger: 'event',
      conditions: [
        {
          id: 'cond_1',
          name: 'Caso urgente',
          expression: 'context.case?.priority === "urgent"',
        },
      ],
      actions: [
        {
          id: 'act_1',
          type: 'escalate',
          name: 'Escalar inmediatamente',
          params: { level: 'critical' },
        },
        {
          id: 'act_2',
          type: 'notify',
          name: 'Notificación inmediata',
          params: { channel: 'all' },
        },
      ],
      priority: 'critical',
      icon: 'Zap',
      color: '#ef4444',
    },
    {
      id: 'tpl_document_review',
      name: 'Revisión Documental',
      description: 'Workflow para revisión de documentos',
      trigger: 'event',
      conditions: [
        {
          id: 'cond_1',
          name: 'Documento subido',
          expression: 'context.eventType === "document_uploaded"',
        },
      ],
      actions: [
        {
          id: 'act_1',
          type: 'create_task',
          name: 'Crear tarea de revisión',
          params: { assignTo: 'reviewer' },
        },
        {
          id: 'act_2',
          type: 'notify',
          name: 'Notificar revisor',
          params: { priority: 'medium' },
        },
      ],
      priority: 'medium',
      icon: 'FileText',
      color: '#3b82f6',
    },
    {
      id: 'tpl_pending_signature',
      name: 'Firma Pendiente',
      description: 'Alertar sobre documentos pendientes de firma',
      trigger: 'scheduled',
      conditions: [
        {
          id: 'cond_1',
          name: 'Documento sin firmar',
          expression: 'context.documents.some(d => d.status === "pending_signature")',
        },
      ],
      actions: [
        {
          id: 'act_1',
          type: 'notify',
          name: 'Recordatorio de firma',
          params: { channel: 'email', escalate: true },
        },
        {
          id: 'act_2',
          type: 'escalate',
          name: 'Escalar si no se firma',
          params: { afterDays: 3 },
        },
      ],
      priority: 'medium',
      icon: 'Pen',
      color: '#3b82f6',
    },
  ];
}

export function buildWorkflowExecutionCenter(workflows, executions) {
  const vm = buildWorkflowViewModel(workflows, executions);
  const templates = buildWorkflowTemplates();

  return {
    workflows: vm.workflows,
    byStatus: vm.byStatus,
    statistics: vm.statistics,
    templates,
    recentExecutions: vm.history.slice(0, 10),
    activeWorkflowsCount: vm.activeCount,
    totalExecutionsCount: vm.history.length,
  };
}

export function buildWorkflowWorkstats(workflows) {
  if (!Array.isArray(workflows) || workflows.length === 0) {
    return {
      totalWorkflows: 0,
      avgConditions: 0,
      avgActions: 0,
      avgExecutions: 0,
      mostUsedTrigger: null,
      mostUsedAction: null,
    };
  }

  const totalConditions = workflows.reduce((sum, w) => sum + (w.conditions?.length || 0), 0);
  const totalActions = workflows.reduce((sum, w) => sum + (w.actions?.length || 0), 0);
  const totalExecutions = workflows.reduce((sum, w) => sum + (w.executionCount || 0), 0);

  const triggerCounts = {};
  const actionCounts = {};

  workflows.forEach(w => {
    triggerCounts[w.trigger] = (triggerCounts[w.trigger] || 0) + 1;
    w.actions?.forEach(a => {
      actionCounts[a.type] = (actionCounts[a.type] || 0) + 1;
    });
  });

  const mostUsedTrigger = Object.keys(triggerCounts).length > 0
    ? Object.keys(triggerCounts).reduce((a, b) => triggerCounts[a] > triggerCounts[b] ? a : b)
    : null;

  const mostUsedAction = Object.keys(actionCounts).length > 0
    ? Object.keys(actionCounts).reduce((a, b) => actionCounts[a] > actionCounts[b] ? a : b)
    : null;

  return {
    totalWorkflows: workflows.length,
    avgConditions: Math.round(totalConditions / workflows.length),
    avgActions: Math.round(totalActions / workflows.length),
    avgExecutions: Math.round(totalExecutions / workflows.length),
    mostUsedTrigger,
    mostUsedAction,
    totalConditions,
    totalActions,
    totalExecutions,
  };
}
