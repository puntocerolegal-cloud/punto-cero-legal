import React from "react";
import { SearchInput } from "./SearchInput";
import { FilterDropdown } from "./FilterDropdown";
import { ActiveFilters } from "./ActiveFilters";

export function SearchToolbar({
  searchQuery,
  onSearchChange,
  onSearchClear,
  filters,
  filterOptions,
  onFilterChange,
  onRemoveFilter,
  onClearAllFilters,
  resultCount,
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-end">
        <div className="flex-1">
          <SearchInput
            value={searchQuery}
            onChange={onSearchChange}
            onClear={onSearchClear}
            placeholder="Buscar... (Ctrl+K)"
          />
        </div>
        {filterOptions && Object.keys(filterOptions).length > 0 && (
          <div className="flex gap-2 flex-wrap md:flex-nowrap">
            {Object.entries(filterOptions).map(([key, options]) => (
              <FilterDropdown
                key={key}
                label={key.charAt(0).toUpperCase() + key.slice(1)}
                options={options}
                selected={filters[key]}
                onSelect={(value) => onFilterChange(key, value)}
              />
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-white/60">
          {resultCount > 0 ? `${resultCount} resultado${resultCount !== 1 ? "s" : ""}` : "Sin resultados"}
        </p>
      </div>

      {Object.values(filters).some((v) => v) && (
        <ActiveFilters
          filters={filters}
          onRemoveFilter={onRemoveFilter}
          onClearAll={onClearAllFilters}
        />
      )}
    </div>
  );
}
