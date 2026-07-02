import React from 'react';
import { Check } from 'lucide-react';

export function ColumnSelector({ availableColumns, visibleColumns, onToggleColumn }) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-white/70 uppercase tracking-wider">Columnas Visibles</p>
      <div className="space-y-2">
        {availableColumns.map(column => (
          <label
            key={column.id}
            className="flex items-center gap-3 rounded-lg bg-white/5 hover:bg-white/10 p-2 cursor-pointer transition-colors"
          >
            <input
              type="checkbox"
              checked={visibleColumns.includes(column.id)}
              onChange={() => onToggleColumn(column.id)}
              className="rounded w-4 h-4 accent-blue-500 cursor-pointer"
            />
            <span className="flex-1 text-sm text-white">{column.label}</span>
            {visibleColumns.includes(column.id) && (
              <Check className="w-4 h-4 text-emerald-400" />
            )}
          </label>
        ))}
      </div>
    </div>
  );
}
