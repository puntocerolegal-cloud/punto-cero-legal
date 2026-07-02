import React from 'react';
import { CheckCircle2, AlertCircle, Clock, Zap } from 'lucide-react';
import WorkflowStatusBadge from './WorkflowStatusBadge';

const WorkflowExecution = ({ execution }) => {
  if (!execution) return null;

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {execution.workflowName}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Ejecución #{execution.id.substring(0, 8)}
          </p>
        </div>
        <WorkflowStatusBadge status={execution.status} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 pb-6 border-b border-gray-200">
        <div>
          <p className="text-xs text-gray-500 uppercase mb-1">Estado</p>
          <p className="text-sm font-medium text-gray-900">
            {execution.success ? '✓ Exitoso' : '✗ Fallido'}
          </p>
        </div>

        <div>
          <p className="text-xs text-gray-500 uppercase mb-1">Condiciones</p>
          <p className="text-sm font-medium text-gray-900">
            {execution.conditionsEvaluated || 0} evaluadas
          </p>
        </div>

        <div>
          <p className="text-xs text-gray-500 uppercase mb-1">Acciones</p>
          <p className="text-sm font-medium text-gray-900">
            {execution.actionsCount || 0} ejecutadas
          </p>
        </div>

        <div>
          <p className="text-xs text-gray-500 uppercase mb-1">Duración</p>
          <p className="text-sm font-medium text-gray-900">
            {execution.durationMs || 0}ms
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-xs text-gray-500 uppercase mb-2">Timestamp</p>
          <p className="text-sm text-gray-900">{formatDate(execution.timestamp)}</p>
        </div>

        {execution.conditionsMet !== undefined && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-50">
            {execution.conditionsMet ? (
              <CheckCircle2 size={20} className="text-green-600" />
            ) : (
              <AlertCircle size={20} className="text-red-600" />
            )}
            <div>
              <p className="font-medium text-gray-900">
                {execution.conditionsMet ? 'Condiciones cumplidas' : 'Condiciones no cumplidas'}
              </p>
              <p className="text-xs text-gray-600">
                {execution.conditionsMet
                  ? 'Se ejecutaron todas las acciones planificadas'
                  : 'No se ejecutaron las acciones debido a condiciones insatisfechas'
                }
              </p>
            </div>
          </div>
        )}

        {execution.actionsExecuted && execution.actionsExecuted.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 uppercase mb-2">Acciones Ejecutadas</p>
            <div className="space-y-2">
              {execution.actionsExecuted.map((action, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-2 bg-gray-50 rounded text-sm"
                >
                  <Zap size={16} className="text-blue-600" />
                  <span className="text-gray-900 font-medium">{action.name}</span>
                  <span className="text-gray-500">({action.type})</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {execution.error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-xs text-red-700 uppercase font-medium mb-1">Error</p>
            <p className="text-sm text-red-600">{execution.error}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(WorkflowExecution);
