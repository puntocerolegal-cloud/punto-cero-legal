// Pure domain functions for workflows - NO React, NO side effects

export const WORKFLOW_STATUS = {
  ACTIVE: 'active',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
};

export const WORKFLOW_TRIGGERS = {
  MANUAL: 'manual',
  SCHEDULED: 'scheduled',
  EVENT: 'event',
  CONDITION: 'condition',
};

export const WORKFLOW_ACTION_TYPES = {
  NOTIFY: 'notify',
  ASSIGN: 'assign',
  ESCALATE: 'escalate',
  UPDATE_STATUS: 'update_status',
  CREATE_TASK: 'create_task',
  SEND_EMAIL: 'send_email',
  UPDATE_PRIORITY: 'update_priority',
  MOVE_TO_DEPARTMENT: 'move_to_department',
};

export function createWorkflow(data) {
  if (!data || !data.name || !data.trigger) return null;

  return {
    id: data.id || `wf_${Date.now()}_${Math.random()}`,
    name: data.name,
    description: data.description || '',
    trigger: data.trigger,
    conditions: Array.isArray(data.conditions) ? data.conditions : [],
    actions: Array.isArray(data.actions) ? data.actions : [],
    priority: data.priority || 'medium',
    status: data.status || WORKFLOW_STATUS.ACTIVE,
    enabled: data.enabled !== false ? true : false,
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt || new Date().toISOString(),
    lastExecuted: data.lastExecuted || null,
    executionCount: data.executionCount || 0,
    successCount: data.successCount || 0,
    failureCount: data.failureCount || 0,
    history: Array.isArray(data.history) ? data.history : [],
    tags: Array.isArray(data.tags) ? data.tags : [],
    metadata: data.metadata || {},
  };
}

export function validateWorkflow(workflow) {
  const errors = [];

  if (!workflow) {
    return { valid: false, errors: ['Workflow is required'] };
  }

  if (!workflow.name || workflow.name.trim().length === 0) {
    errors.push('Workflow name is required');
  }

  if (!workflow.trigger) {
    errors.push('Workflow trigger is required');
  }

  if (!Array.isArray(workflow.conditions)) {
    errors.push('Conditions must be an array');
  }

  if (!Array.isArray(workflow.actions) || workflow.actions.length === 0) {
    errors.push('At least one action is required');
  }

  if (!Object.values(WORKFLOW_STATUS).includes(workflow.status)) {
    errors.push(`Invalid status: ${workflow.status}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function evaluateConditions(conditions, context) {
  if (!Array.isArray(conditions)) return true;
  if (conditions.length === 0) return true;

  return conditions.every(condition => {
    try {
      const fn = new Function('context', `return ${condition.expression}`);
      return fn(context) === true;
    } catch (error) {
      return false;
    }
  });
}

export function executeWorkflow(workflow, context) {
  if (!workflow) return null;

  const validation = validateWorkflow(workflow);
  if (!validation.valid) {
    return {
      id: workflow.id,
      workflowId: workflow.id,
      status: WORKFLOW_STATUS.FAILED,
      timestamp: new Date().toISOString(),
      error: validation.errors.join('; '),
      conditionsMet: false,
      actionsExecuted: [],
    };
  }

  const conditionsMet = evaluateConditions(workflow.conditions, context);

  const execution = {
    id: `exec_${Date.now()}_${Math.random()}`,
    workflowId: workflow.id,
    workflowName: workflow.name,
    status: conditionsMet ? WORKFLOW_STATUS.COMPLETED : WORKFLOW_STATUS.FAILED,
    timestamp: new Date().toISOString(),
    conditionsMet,
    conditionsEvaluated: workflow.conditions.length,
    actionsExecuted: conditionsMet ? workflow.actions.map(a => ({
      type: a.type,
      name: a.name,
      status: 'executed',
      timestamp: new Date().toISOString(),
    })) : [],
    error: conditionsMet ? null : 'Conditions not met',
    context: context || {},
  };

  return execution;
}

export function pauseWorkflow(workflow) {
  if (!workflow) return null;

  return {
    ...workflow,
    status: WORKFLOW_STATUS.PAUSED,
    updatedAt: new Date().toISOString(),
  };
}

export function resumeWorkflow(workflow) {
  if (!workflow) return null;

  return {
    ...workflow,
    status: WORKFLOW_STATUS.ACTIVE,
    updatedAt: new Date().toISOString(),
  };
}

export function cancelWorkflow(workflow) {
  if (!workflow) return null;

  return {
    ...workflow,
    status: WORKFLOW_STATUS.CANCELLED,
    updatedAt: new Date().toISOString(),
  };
}

export function buildWorkflowExecution(execution) {
  if (!execution) return null;

  return {
    id: execution.id,
    workflowId: execution.workflowId,
    workflowName: execution.workflowName,
    status: execution.status,
    timestamp: execution.timestamp,
    durationMs: execution.durationMs || 0,
    conditionsMet: execution.conditionsMet,
    conditionsEvaluated: execution.conditionsEvaluated || 0,
    actionsExecuted: execution.actionsExecuted || [],
    actionsCount: (execution.actionsExecuted || []).length,
    error: execution.error || null,
    success: execution.status === WORKFLOW_STATUS.COMPLETED,
  };
}

export function buildWorkflowHistory(executions) {
  if (!Array.isArray(executions)) return [];

  return executions
    .map(e => buildWorkflowExecution(e))
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

export function buildWorkflowStatistics(workflows, executions) {
  const allExecutions = Array.isArray(executions) ? executions : [];
  const total = allExecutions.length;
  const successful = allExecutions.filter(e => e.status === WORKFLOW_STATUS.COMPLETED).length;
  const failed = allExecutions.filter(e => e.status === WORKFLOW_STATUS.FAILED).length;

  const activeWorkflows = Array.isArray(workflows)
    ? workflows.filter(w => w.status === WORKFLOW_STATUS.ACTIVE).length
    : 0;

  const pausedWorkflows = Array.isArray(workflows)
    ? workflows.filter(w => w.status === WORKFLOW_STATUS.PAUSED).length
    : 0;

  return {
    totalWorkflows: Array.isArray(workflows) ? workflows.length : 0,
    activeWorkflows,
    pausedWorkflows,
    totalExecutions: total,
    successfulExecutions: successful,
    failedExecutions: failed,
    successRate: total > 0 ? Math.round((successful / total) * 100) : 0,
    averageConditionsPerWorkflow: Array.isArray(workflows) && workflows.length > 0
      ? Math.round(workflows.reduce((sum, w) => sum + (w.conditions?.length || 0), 0) / workflows.length)
      : 0,
    averageActionsPerWorkflow: Array.isArray(workflows) && workflows.length > 0
      ? Math.round(workflows.reduce((sum, w) => sum + (w.actions?.length || 0), 0) / workflows.length)
      : 0,
  };
}

export function buildWorkflowConditions(conditions) {
  if (!Array.isArray(conditions)) return [];

  return conditions.map(c => ({
    id: c.id || `cond_${Date.now()}_${Math.random()}`,
    name: c.name || 'Condición',
    expression: c.expression || '',
    operator: c.operator || 'AND',
    description: c.description || '',
  }));
}

export function buildWorkflowActions(actions) {
  if (!Array.isArray(actions)) return [];

  return actions.map(a => ({
    id: a.id || `act_${Date.now()}_${Math.random()}`,
    type: a.type,
    name: a.name || 'Acción',
    description: a.description || '',
    params: a.params || {},
    enabled: a.enabled !== false ? true : false,
  }));
}

export function evaluateWorkflow(workflow, context) {
  if (!workflow) return null;

  const execution = executeWorkflow(workflow, context);
  return buildWorkflowExecution(execution);
}

export function serializeWorkflow(workflow) {
  if (!workflow) return '{}';

  try {
    return JSON.stringify({
      ...workflow,
      updatedAt: workflow.updatedAt || new Date().toISOString(),
    });
  } catch (error) {
    return '{}';
  }
}

export function deserializeWorkflow(json) {
  if (!json || typeof json !== 'string') return null;

  try {
    const parsed = JSON.parse(json);
    return createWorkflow(parsed);
  } catch (error) {
    return null;
  }
}

export function cloneWorkflow(workflow) {
  if (!workflow) return null;

  const cloned = createWorkflow({
    ...workflow,
    id: undefined,
    name: `${workflow.name} (Copia)`,
    createdAt: undefined,
    updatedAt: undefined,
    lastExecuted: undefined,
    executionCount: 0,
    successCount: 0,
    failureCount: 0,
    history: [],
  });

  return cloned;
}

export function groupWorkflowsByStatus(workflows) {
  if (!Array.isArray(workflows)) {
    return {
      active: [],
      paused: [],
      completed: [],
      failed: [],
      cancelled: [],
    };
  }

  return {
    active: workflows.filter(w => w.status === WORKFLOW_STATUS.ACTIVE),
    paused: workflows.filter(w => w.status === WORKFLOW_STATUS.PAUSED),
    completed: workflows.filter(w => w.status === WORKFLOW_STATUS.COMPLETED),
    failed: workflows.filter(w => w.status === WORKFLOW_STATUS.FAILED),
    cancelled: workflows.filter(w => w.status === WORKFLOW_STATUS.CANCELLED),
  };
}

export function getWorkflowIcon(trigger) {
  const icons = {
    [WORKFLOW_TRIGGERS.MANUAL]: 'Hand',
    [WORKFLOW_TRIGGERS.SCHEDULED]: 'Clock',
    [WORKFLOW_TRIGGERS.EVENT]: 'Zap',
    [WORKFLOW_TRIGGERS.CONDITION]: 'Filter',
  };

  return icons[trigger] || 'Workflow';
}

export function getWorkflowStatusColor(status) {
  const colors = {
    [WORKFLOW_STATUS.ACTIVE]: '#10b981',
    [WORKFLOW_STATUS.PAUSED]: '#f59e0b',
    [WORKFLOW_STATUS.COMPLETED]: '#3b82f6',
    [WORKFLOW_STATUS.FAILED]: '#ef4444',
    [WORKFLOW_STATUS.CANCELLED]: '#6b7280',
  };

  return colors[status] || '#6b7280';
}

export function getActionTypeLabel(actionType) {
  const labels = {
    [WORKFLOW_ACTION_TYPES.NOTIFY]: 'Notificar',
    [WORKFLOW_ACTION_TYPES.ASSIGN]: 'Asignar',
    [WORKFLOW_ACTION_TYPES.ESCALATE]: 'Escalar',
    [WORKFLOW_ACTION_TYPES.UPDATE_STATUS]: 'Actualizar estado',
    [WORKFLOW_ACTION_TYPES.CREATE_TASK]: 'Crear tarea',
    [WORKFLOW_ACTION_TYPES.SEND_EMAIL]: 'Enviar email',
    [WORKFLOW_ACTION_TYPES.UPDATE_PRIORITY]: 'Actualizar prioridad',
    [WORKFLOW_ACTION_TYPES.MOVE_TO_DEPARTMENT]: 'Mover a departamento',
  };

  return labels[actionType] || actionType;
}
