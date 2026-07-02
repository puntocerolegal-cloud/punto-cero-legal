import React from "react";
import { FilterChip } from "./FilterChip";

export function ActiveFilters({ filters, onRemoveFilter, onClearAll }) {
  const filterEntries = Object.entries(filters).filter(([_, value]) => value && (Array.isArray(value) ? value.length > 0 : true));

  if (filterEntries.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-white/70">Filtros activos:</p>
        {filterEntries.length > 0 && (
          <button
            onClick={onClearAll}
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            Limpiar todos
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {filterEntries.map(([key, value]) => {
          if (Array.isArray(value)) {
            return value.map((v, idx) => (
              <FilterChip
                key={`${key}-${idx}`}
                label={`${key}: ${v}`}
                value={v}
                onRemove={() => onRemoveFilter(key, v)}
                color="purple"
              />
            ));
          }
          return (
            <FilterChip
              key={key}
              label={`${key}: ${value}`}
              value={value}
              onRemove={() => onRemoveFilter(key)}
              color="blue"
            />
          );
        })}
      </div>
    </div>
  );
}
