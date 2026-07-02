import React from 'react';
import { CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import WorkflowStatusBadge from './WorkflowStatusBadge';

const WorkflowHistoryTable = ({ executions, limit = 10 }) => {
  if (!Array.isArray(executions) || executions.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock size={32} className="mx-auto text-gray-300 mb-3" />
        <p className="text-gray-500">Sin ejecuciones registradas</p>
      </div>
    );
  }

  const displayExecutions = executions.slice(0, limit);

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('es-ES', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 text-gray-700 font-semibold">Workflow</th>
            <th className="text-left py-3 px-4 text-gray-700 font-semibold">Estado</th>
            <th className="text-left py-3 px-4 text-gray-700 font-semibold">Condiciones</th>
            <th className="text-left py-3 px-4 text-gray-700 font-semibold">Acciones</th>
            <th className="text-left py-3 px-4 text-gray-700 font-semibold">Timestamp</th>
          </tr>
        </thead>

        <tbody>
          {displayExecutions.map((execution) => (
            <tr key={execution.id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="py-3 px-4 font-medium text-gray-900">
                {execution.workflowName}
              </td>

              <td className="py-3 px-4">
                <WorkflowStatusBadge status={execution.status} />
              </td>

              <td className="py-3 px-4">
                <div className="flex items-center gap-1">
                  {execution.conditionsMet ? (
                    <CheckCircle2 size={16} className="text-green-600" />
                  ) : (
                    <AlertCircle size={16} className="text-red-600" />
                  )}
                  <span className="text-gray-600">
                    {execution.conditionsEvaluated || 0} evaluadas
                  </span>
                </div>
              </td>

              <td className="py-3 px-4 text-gray-600">
                {execution.actionsCount || 0} ejecutadas
              </td>

              <td className="py-3 px-4 text-gray-500">
                {formatDate(execution.timestamp)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {executions.length > limit && (
        <div className="p-4 text-center text-sm text-gray-500">
          Mostrando {limit} de {executions.length} ejecuciones
        </div>
      )}
    </div>
  );
};

export default React.memo(WorkflowHistoryTable);
