import React from 'react';
import { Play, Pause, Trash2, Copy, MoreVertical } from 'lucide-react';
import WorkflowStatusBadge from './WorkflowStatusBadge';

const WorkflowCard = ({
  workflow,
  onRun,
  onPause,
  onResume,
  onDuplicate,
  onDelete,
  onEdit,
}) => {
  if (!workflow) return null;

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Nunca';
    const date = new Date(timestamp);
    return date.toLocaleDateString('es-ES', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isPaused = workflow.status === 'paused';
  const isActive = workflow.status === 'active';

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{workflow.name}</h3>
            <WorkflowStatusBadge status={workflow.status} />
          </div>
          <p className="text-sm text-gray-600">{workflow.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4 py-4 border-y border-gray-100">
        <div>
          <p className="text-xs text-gray-500 uppercase">Trigger</p>
          <p className="text-sm font-medium text-gray-900 capitalize mt-1">
            {workflow.trigger}
          </p>
        </div>

        <div>
          <p className="text-xs text-gray-500 uppercase">Condiciones</p>
          <p className="text-sm font-medium text-gray-900 mt-1">
            {workflow.conditions?.length || 0}
          </p>
        </div>

        <div>
          <p className="text-xs text-gray-500 uppercase">Acciones</p>
          <p className="text-sm font-medium text-gray-900 mt-1">
            {workflow.actions?.length || 0}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div>
          <p className="text-gray-500">Ejecutado</p>
          <p className="font-medium text-gray-900">{workflow.executionCount || 0} veces</p>
        </div>

        <div>
          <p className="text-gray-500">Última ejecución</p>
          <p className="font-medium text-gray-900">{formatDate(workflow.lastExecuted)}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {isActive && (
          <>
            <button
              onClick={() => onRun?.(workflow.id)}
              className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
              title="Ejecutar workflow"
            >
              <Play size={16} />
              Ejecutar
            </button>

            <button
              onClick={() => onPause?.(workflow.id)}
              className="inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm transition-colors"
              title="Pausar workflow"
            >
              <Pause size={16} />
            </button>
          </>
        )}

        {isPaused && (
          <button
            onClick={() => onResume?.(workflow.id)}
            className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm font-medium transition-colors"
            title="Reanudar workflow"
          >
            <Play size={16} />
            Reanudar
          </button>
        )}

        <button
          onClick={() => onDuplicate?.(workflow.id)}
          className="inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm transition-colors"
          title="Duplicar workflow"
        >
          <Copy size={16} />
        </button>

        <button
          onClick={() => onDelete?.(workflow.id)}
          className="inline-flex items-center justify-center px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm transition-colors"
          title="Eliminar workflow"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};

export default React.memo(WorkflowCard);
