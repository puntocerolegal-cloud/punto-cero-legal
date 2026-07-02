import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  createWorkflow,
  executeWorkflow,
  pauseWorkflow,
  resumeWorkflow,
  cancelWorkflow,
  cloneWorkflow,
  serializeWorkflow,
  deserializeWorkflow,
  buildWorkflowStatistics,
} from '../domain/workflowDomain';
import {
  buildWorkflowViewModel,
  buildWorkflowTemplates,
  buildWorkflowExecutionCenter,
  buildWorkflowWorkstats,
} from '../application/workflowApplication';

const STORAGE_KEY = 'firm-os/workflows';
const EXECUTION_STORAGE_KEY = 'firm-os/workflow-executions';

export function useWorkflows(lawyers = [], cases = [], clients = []) {
  const [workflows, setWorkflows] = useState(() => {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          return Array.isArray(parsed) ? parsed : [];
        }
      }
    } catch (error) {
      console.warn('Failed to load workflows:', error);
    }
    return [];
  });

  const [executions, setExecutions] = useState(() => {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(EXECUTION_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          return Array.isArray(parsed) ? parsed : [];
        }
      }
    } catch (error) {
      console.warn('Failed to load workflow executions:', error);
    }
    return [];
  });

  // Persist workflows
  const persistWorkflows = useCallback((wfs) => {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(wfs));
      }
    } catch (error) {
      console.warn('Failed to persist workflows:', error);
    }
  }, []);

  // Persist executions
  const persistExecutions = useCallback((execs) => {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(EXECUTION_STORAGE_KEY, JSON.stringify(execs.slice(0, 500)));
      }
    } catch (error) {
      console.warn('Failed to persist executions:', error);
    }
  }, []);

  const createWorkflowAction = useCallback((data) => {
    const wf = createWorkflow(data);
    if (wf) {
      const updated = [...workflows, wf];
      setWorkflows(updated);
      persistWorkflows(updated);
      return wf;
    }
    return null;
  }, [workflows, persistWorkflows]);

  const updateWorkflowAction = useCallback((workflowId, updates) => {
    const updated = workflows.map(w =>
      w.id === workflowId
        ? { ...w, ...updates, updatedAt: new Date().toISOString() }
        : w
    );
    setWorkflows(updated);
    persistWorkflows(updated);
  }, [workflows, persistWorkflows]);

  const deleteWorkflowAction = useCallback((workflowId) => {
    const updated = workflows.filter(w => w.id !== workflowId);
    setWorkflows(updated);
    persistWorkflows(updated);
  }, [workflows, persistWorkflows]);

  const runWorkflow = useCallback((workflowId) => {
    const workflow = workflows.find(w => w.id === workflowId);
    if (!workflow) return null;

    const context = {
      lawyers,
      cases,
      clients,
      timestamp: Date.now(),
    };

    const execution = executeWorkflow(workflow, context);

    const updated = [...executions, execution];
    setExecutions(updated);
    persistExecutions(updated);

    // Update workflow execution count
    const updatedWorkflows = workflows.map(w =>
      w.id === workflowId
        ? {
            ...w,
            executionCount: (w.executionCount || 0) + 1,
            successCount: execution.status === 'completed' ? (w.successCount || 0) + 1 : w.successCount,
            failureCount: execution.status === 'failed' ? (w.failureCount || 0) + 1 : w.failureCount,
            lastExecuted: new Date().toISOString(),
            history: [execution, ...(w.history || [])].slice(0, 50),
          }
        : w
    );
    setWorkflows(updatedWorkflows);
    persistWorkflows(updatedWorkflows);

    return execution;
  }, [workflows, executions, lawyers, cases, clients, persistWorkflows, persistExecutions]);

  const pauseWorkflowAction = useCallback((workflowId) => {
    const workflow = workflows.find(w => w.id === workflowId);
    if (!workflow) return null;

    const paused = pauseWorkflow(workflow);
    const updated = workflows.map(w => w.id === workflowId ? paused : w);
    setWorkflows(updated);
    persistWorkflows(updated);
    return paused;
  }, [workflows, persistWorkflows]);

  const resumeWorkflowAction = useCallback((workflowId) => {
    const workflow = workflows.find(w => w.id === workflowId);
    if (!workflow) return null;

    const resumed = resumeWorkflow(workflow);
    const updated = workflows.map(w => w.id === workflowId ? resumed : w);
    setWorkflows(updated);
    persistWorkflows(updated);
    return resumed;
  }, [workflows, persistWorkflows]);

  const cancelWorkflowAction = useCallback((workflowId) => {
    const workflow = workflows.find(w => w.id === workflowId);
    if (!workflow) return null;

    const cancelled = cancelWorkflow(workflow);
    const updated = workflows.map(w => w.id === workflowId ? cancelled : w);
    setWorkflows(updated);
    persistWorkflows(updated);
    return cancelled;
  }, [workflows, persistWorkflows]);

  const duplicateWorkflow = useCallback((workflowId) => {
    const workflow = workflows.find(w => w.id === workflowId);
    if (!workflow) return null;

    const cloned = cloneWorkflow(workflow);
    if (cloned) {
      const updated = [...workflows, cloned];
      setWorkflows(updated);
      persistWorkflows(updated);
      return cloned;
    }
    return null;
  }, [workflows, persistWorkflows]);

  // Memoized view models
  const viewModel = useMemo(() => {
    return buildWorkflowViewModel(workflows, executions);
  }, [workflows, executions]);

  const templates = useMemo(() => {
    return buildWorkflowTemplates();
  }, []);

  const statistics = useMemo(() => {
    return buildWorkflowStatistics(workflows, executions);
  }, [workflows, executions]);

  const executionCenter = useMemo(() => {
    return buildWorkflowExecutionCenter(workflows, executions);
  }, [workflows, executions]);

  const workstats = useMemo(() => {
    return buildWorkflowWorkstats(workflows);
  }, [workflows]);

  return {
    // State
    workflows,
    executions,

    // View Models
    viewModel,
    templates,
    statistics,
    executionCenter,
    workstats,

    // Actions
    create: createWorkflowAction,
    update: updateWorkflowAction,
    delete: deleteWorkflowAction,
    run: runWorkflow,
    pause: pauseWorkflowAction,
    resume: resumeWorkflowAction,
    cancel: cancelWorkflowAction,
    duplicate: duplicateWorkflow,

    // Utilities
    getById: useCallback((id) => workflows.find(w => w.id === id), [workflows]),
    getByStatus: useCallback((status) => workflows.filter(w => w.status === status), [workflows]),
  };
}
