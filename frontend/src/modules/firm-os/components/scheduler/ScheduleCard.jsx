import React from 'react';
import { Pause, Play, Copy, Trash2, Edit2, Zap } from 'lucide-react';
import ScheduleBadge from './ScheduleBadge';
import { getScheduleTypeLabel } from '../../domain/schedulerDomain';

const ScheduleCard = ({
  schedule,
  onEdit,
  onPause,
  onResume,
  onDuplicate,
  onDelete,
}) => {
  if (!schedule) return null;

  const formatDate = (timestamp) => {
    if (!timestamp) return '—';
    const date = new Date(timestamp);
    return date.toLocaleDateString('es-ES', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const successRate = schedule.executionCount > 0
    ? Math.round((schedule.successCount / schedule.executionCount) * 100)
    : 0;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{schedule.name}</h3>
            <ScheduleBadge schedule={schedule} compact />
          </div>
          <p className="text-sm text-gray-600">{schedule.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 py-4 border-y border-gray-100">
        <div>
          <p className="text-xs text-gray-500 uppercase">Tipo</p>
          <p className="text-sm font-medium text-gray-900 mt-1">
            {getScheduleTypeLabel(schedule.type)}
          </p>
        </div>

        <div>
          <p className="text-xs text-gray-500 uppercase">Próxima Ejecución</p>
          <p className="text-sm font-medium text-gray-900 mt-1">
            {formatDate(schedule.nextExecution)}
          </p>
        </div>

        <div>
          <p className="text-xs text-gray-500 uppercase">Última Ejecución</p>
          <p className="text-sm font-medium text-gray-900 mt-1">
            {formatDate(schedule.lastExecuted)}
          </p>
        </div>

        <div>
          <p className="text-xs text-gray-500 uppercase">Tasa Éxito</p>
          <p className="text-sm font-medium text-gray-900 mt-1">
            {successRate}% ({schedule.successCount}/{schedule.executionCount})
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onEdit?.(schedule.id)}
          className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors"
          title="Editar"
        >
          <Edit2 size={16} />
          Editar
        </button>

        {schedule.enabled ? (
          <button
            onClick={() => onPause?.(schedule.id)}
            className="inline-flex items-center justify-center px-3 py-2 border border-amber-300 text-amber-700 hover:bg-amber-50 rounded-lg text-sm transition-colors"
            title="Pausar"
          >
            <Pause size={16} />
          </button>
        ) : (
          <button
            onClick={() => onResume?.(schedule.id)}
            className="inline-flex items-center justify-center px-3 py-2 border border-green-300 text-green-700 hover:bg-green-50 rounded-lg text-sm transition-colors"
            title="Reanudar"
          >
            <Play size={16} />
          </button>
        )}

        <button
          onClick={() => onDuplicate?.(schedule.id)}
          className="inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg text-sm transition-colors"
          title="Duplicar"
        >
          <Copy size={16} />
        </button>

        <button
          onClick={() => onDelete?.(schedule.id)}
          className="inline-flex items-center justify-center px-3 py-2 border border-red-300 text-red-600 hover:bg-red-50 rounded-lg text-sm transition-colors"
          title="Eliminar"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};

export default React.memo(ScheduleCard);
