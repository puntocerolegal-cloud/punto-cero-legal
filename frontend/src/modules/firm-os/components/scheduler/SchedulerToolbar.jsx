import React from 'react';
import { Plus, RefreshCw, Filter } from 'lucide-react';

const SchedulerToolbar = ({
  onCreateNew,
  onRefresh,
  filterStatus,
  onFilterChange,
  isRefreshing,
}) => {
  return (
    <div className="flex items-center justify-between gap-4 p-4 bg-white border-b border-gray-200">
      <div className="flex gap-2">
        <button
          onClick={onCreateNew}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
        >
          <Plus size={18} />
          Nuevo Schedule
        </button>

        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
          {isRefreshing ? 'Actualizando...' : 'Actualizar'}
        </button>
      </div>

      {/* Filter buttons */}
      <div className="flex gap-1">
        {['all', 'active', 'paused'].map(status => (
          <button
            key={status}
            onClick={() => onFilterChange?.(status)}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              filterStatus === status
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {status === 'all' ? 'Todos' : status === 'active' ? 'Activos' : 'Pausados'}
          </button>
        ))}
      </div>
    </div>
  );
};

export default React.memo(SchedulerToolbar);
