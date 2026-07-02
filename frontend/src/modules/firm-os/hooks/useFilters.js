import { useState, useCallback, useMemo, useEffect } from "react";

export function useFilters(data = [], filterConfig = {}, localStorageKey = "filters") {
  const [filters, setFilters] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(localStorageKey);
        return saved ? JSON.parse(saved) : {};
      } catch {
        return {};
      }
    }
    return {};
  });

  const handleFilterChange = useCallback((key, value) => {
    setFilters((prev) => {
      const updated = { ...prev, [key]: value };
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(localStorageKey, JSON.stringify(updated));
        } catch {
          // localStorage may be unavailable
        }
      }
      return updated;
    });
  }, [localStorageKey]);

  const handleRemoveFilter = useCallback((key, value) => {
    setFilters((prev) => {
      const updated = { ...prev };
      if (value && Array.isArray(prev[key])) {
        updated[key] = prev[key].filter((v) => v !== value);
        if (updated[key].length === 0) delete updated[key];
      } else {
        delete updated[key];
      }

      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(localStorageKey, JSON.stringify(updated));
        } catch {
          // localStorage may be unavailable
        }
      }
      return updated;
    });
  }, [localStorageKey]);

  const handleClearAllFilters = useCallback(() => {
    setFilters({});
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(localStorageKey);
      } catch {
        // localStorage may be unavailable
      }
    }
  }, [localStorageKey]);

  const filteredData = useMemo(() => {
    if (!data || Object.keys(filters).length === 0) return data;

    return data.filter((item) => {
      return Object.entries(filters).every(([key, filterValue]) => {
        if (!filterValue || (Array.isArray(filterValue) && filterValue.length === 0)) return true;

        const itemValue = filterConfig[key]?.getValue?.(item);
        if (itemValue === null || itemValue === undefined) return false;

        if (Array.isArray(filterValue)) {
          return filterValue.includes(itemValue);
        }

        return itemValue === filterValue;
      });
    });
  }, [data, filters, filterConfig]);

  return {
    filters,
    handleFilterChange,
    handleRemoveFilter,
    handleClearAllFilters,
    filteredData,
    filterCount: Object.values(filters).filter((v) => v && (Array.isArray(v) ? v.length > 0 : true)).length,
  };
}
