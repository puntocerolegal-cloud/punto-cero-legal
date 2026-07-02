import { useState, useCallback, useMemo, useEffect } from "react";

const DEBOUNCE_DELAY = 300;

export function useSearch(data = [], searchFields = [], localStorageKey = "search") {
  const [query, setQuery] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(localStorageKey);
        return saved || "";
      } catch {
        return "";
      }
    }
    return "";
  });
  
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(localStorageKey, query);
        } catch {
          // localStorage may be unavailable
        }
      }
    }, DEBOUNCE_DELAY);

    return () => clearTimeout(timer);
  }, [query, localStorageKey]);

  const handleSearch = useCallback((newQuery) => {
    setQuery(newQuery);
  }, []);

  const handleClear = useCallback(() => {
    setQuery("");
  }, []);

  const results = useMemo(() => {
    if (!debouncedQuery || !data) return data;

    const lowerQuery = debouncedQuery.toLowerCase();

    return data.filter((item) => {
      if (!item) return false;

      return searchFields.some((field) => {
        const value = field.split(".").reduce((obj, key) => obj?.[key], item);
        if (value === null || value === undefined) return false;

        return String(value).toLowerCase().includes(lowerQuery);
      });
    });
  }, [debouncedQuery, data, searchFields]);

  return {
    query,
    debouncedQuery,
    results,
    handleSearch,
    handleClear,
    resultCount: results.length,
  };
}
