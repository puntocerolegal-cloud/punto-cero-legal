import React, { useCallback, useEffect } from "react";
import { Search, X } from "lucide-react";

export function SearchInput({ value, onChange, onClear, placeholder = "Buscar...", disabled = false }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        const input = document.querySelector("[data-search-input]");
        if (input) input.focus();
      }
      if (e.key === "Escape" && value) {
        onClear();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [value, onClear]);

  const handleChange = useCallback((e) => {
    onChange(e.target.value);
  }, [onChange]);

  return (
    <div className="relative flex-1">
      <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
      <input
        data-search-input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        disabled={disabled}
        className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-10 pr-10 text-white placeholder-white/50 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
      />
      {value && (
        <button
          onClick={onClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
