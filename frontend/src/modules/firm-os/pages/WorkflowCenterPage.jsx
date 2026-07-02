import React, { useState, useMemo } from 'react';
import { Workflow, Plus, RefreshCw, Settings } from 'lucide-react';
import { useFirmCoreData } from '../hooks/useFirmCoreData';
import { useWorkflows } from '../hooks/useWorkflows';
import { LoadingState } from '../components/shared/LoadingState';
import { SectionCard } from '../components/shared/SectionCard';
import WorkflowCard from '../components/workflows/WorkflowCard';
import WorkflowTemplateCard from '../components/workflows/WorkflowTemplateCard';
import WorkflowStatistics from '../components/workflows/WorkflowStatistics';
import WorkflowHistoryTable from '../components/workflows/WorkflowHistoryTable';

export function WorkflowCenterPage() {
  const { loading, error, lawyers, cases, clients } = useFirmCoreData();
  const {
    workflows,
    executions,
    templates,
    statistics,
    create,
    run,
    pause,
    resume,
    duplicate,
    delete: deleteWorkflow,
  } = useWorkflows(lawyers, cases, clients);

  const [showNewWorkflow, setShowNewWorkflow] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredWorkflows = useMemo(() => {
    if (filterStatus === 'all') return workflows;
    return workflows.filter(w => w.status === filterStatus);
  }, [workflows, filterStatus]);

  const statusCounts = useMemo(() => {
    return {
      active: workflows.filter(w => w.status === 'active').length,
      paused: workflows.filter(w => w.status === 'paused').length,
      running: executions.filter(e => e.status === 'completed').length,
    };
  }, [workflows, executions]);

  if (loading) return <LoadingState message="Cargando Centro de Workflow..." />;
  if (error) return (
    <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6">
      <p className="text-red-400">{error}</p>
    </div>
  );

  const handleTemplateSelect = (template) => {
    const newWorkflow = create({
      name: template.name,
      description: template.description,
      trigger: template.trigger,
      conditions: template.conditions,
      actions: template.actions,
      priority: template.priority,
      tags: [template.id],
    });

    if (newWorkflow) {
      setSelectedTemplate(null);
      setShowNewWorkflow(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Workflow size={32} />
            Centro de Workflow
          </h1>
          <p className="text-sm text-white/60 mt-1">
            Automatización de procesos empresariales • Ejecución en tiempo real • Historial completo
          </p>
        </div>

        <button
          onClick={() => setShowNewWorkflow(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} />
          Nuevo Workflow
        </button>
      </div>

      <WorkflowStatistics statistics={statistics} />

      <SectionCard title="Resumen Rápido">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-700 mb-1">Workflows Activos</p>
            <p className="text-3xl font-bold text-green-900">{statusCounts.active}</p>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-700 mb-1">Pausados</p>
            <p className="text-3xl font-bold text-amber-900">{statusCounts.paused}</p>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700 mb-1">Ejecuciones Hoy</p>
            <p className="text-3xl font-bold text-blue-900">
              {executions.filter(e => {
                const execDate = new Date(e.timestamp);
                const today = new Date();
                return execDate.toDateString() === today.toDateString();
              }).length}
            </p>
          </div>
        </div>
      </SectionCard>

      {showNewWorkflow && (
        <SectionCard title="Seleccionar Template">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {templates.map(template => (
              <WorkflowTemplateCard
                key={template.id}
                template={template}
                onSelect={handleTemplateSelect}
              />
            ))}
          </div>

          <button
            onClick={() => setShowNewWorkflow(false)}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Cancelar
          </button>
        </SectionCard>
      )}

      <SectionCard title={`Workflows (${filteredWorkflows.length})`}>
        <div className="mb-4 flex gap-2">
          {['all', 'active', 'paused'].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${
                filterStatus === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status === 'all' ? 'Todos' : status === 'active' ? 'Activos' : 'Pausados'}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4">
          {filteredWorkflows.length > 0 ? (
            filteredWorkflows.map(workflow => (
              <WorkflowCard
                key={workflow.id}
                workflow={workflow}
                onRun={() => run(workflow.id)}
                onPause={() => pause(workflow.id)}
                onResume={() => resume(workflow.id)}
                onDuplicate={() => duplicate(workflow.id)}
                onDelete={() => {
                  if (confirm('¿Eliminar este workflow?')) {
                    deleteWorkflow(workflow.id);
                  }
                }}
              />
            ))
          ) : (
            <div className="text-center py-8">
              <Workflow size={32} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No hay workflows</p>
            </div>
          )}
        </div>
      </SectionCard>

      {executions.length > 0 && (
        <SectionCard title={`Historial de Ejecuciones (${executions.length})`}>
          <WorkflowHistoryTable executions={executions} limit={20} />
        </SectionCard>
      )}
    </div>
  );
}

export default WorkflowCenterPage;
