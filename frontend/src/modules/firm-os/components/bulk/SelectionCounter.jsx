import React from 'react';
import { X } from 'lucide-react';

export function SelectionCounter({ selectedCount, totalCount, onClear, isAll = false }) {
  if (selectedCount === 0) {
    return null;
  }

  const percentage = totalCount > 0 ? Math.round((selectedCount / totalCount) * 100) : 0;

  return (
    <div className="flex items-center gap-3 rounded-lg bg-blue-600/20 border border-blue-500/30 px-4 py-2">
      <div className="flex-1">
        <p className="text-sm font-semibold text-blue-300">
          {isAll ? (
            <>Todos seleccionados {totalCount > 0 && `(${totalCount})`}</>
          ) : (
            <>
              {selectedCount} de {totalCount} {selectedCount === 1 ? 'elemento' : 'elementos'} ({percentage}%)
            </>
          )}
        </p>
      </div>
      {onClear && (
        <button
          onClick={onClear}
          className="text-blue-400 hover:text-blue-300 transition-colors"
          title="Limpiar selección"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
