import React from 'react';
import { CheckSquare, RotateCcw, X } from 'lucide-react';
import { SelectionCounter } from './SelectionCounter';
import { BulkActionMenu } from './BulkActionMenu';

export function BulkToolbar({
  selectedCount = 0,
  totalCount = 0,
  actions = [],
  onSelectAll,
  onClearAll,
  onInvert,
  onAction,
  disabled = false,
}) {
  if (selectedCount === 0 && totalCount === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <SelectionCounter
        selectedCount={selectedCount}
        totalCount={totalCount}
        onClear={selectedCount > 0 ? onClearAll : null}
        isAll={selectedCount === totalCount && totalCount > 0}
      />

      {selectedCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {onSelectAll && selectedCount < totalCount && (
            <button
              onClick={onSelectAll}
              disabled={disabled}
              className="flex items-center gap-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-50 px-3 py-2 text-xs font-medium text-white transition-colors"
              title="Seleccionar todos"
            >
              <CheckSquare className="w-4 h-4" />
              Seleccionar todos
            </button>
          )}

          {onInvert && (
            <button
              onClick={onInvert}
              disabled={disabled}
              className="flex items-center gap-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-50 px-3 py-2 text-xs font-medium text-white transition-colors"
              title="Invertir selección"
            >
              <RotateCcw className="w-4 h-4" />
              Invertir
            </button>
          )}

          {onClearAll && selectedCount > 0 && (
            <button
              onClick={onClearAll}
              disabled={disabled}
              className="flex items-center gap-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-50 px-3 py-2 text-xs font-medium text-white transition-colors"
              title="Limpiar selección"
            >
              <X className="w-4 h-4" />
              Limpiar
            </button>
          )}

          <div className="flex-1" />

          <BulkActionMenu
            actions={actions}
            onAction={onAction}
            disabled={disabled || selectedCount === 0}
          />
        </div>
      )}
    </div>
  );
}
