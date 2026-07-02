import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

export function FilterDropdown({ label, options, selected, onSelect, multi = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (option) => {
    if (multi) {
      const arr = Array.isArray(selected) ? selected : [];
      if (arr.includes(option)) {
        onSelect(arr.filter(o => o !== option));
      } else {
        onSelect([...arr, option]);
      }
    } else {
      onSelect(option);
      setIsOpen(false);
    }
  };

  const displayValue = Array.isArray(selected) && selected.length > 0 ? `${selected.length} seleccionado(s)` : selected || "Todos";

  return (
    <div ref={ref} className="relative w-full md:w-40">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white hover:bg-white/10 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 flex items-center justify-between"
      >
        <span className="truncate">{label}: {displayValue}</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-2 w-full rounded-lg border border-white/10 bg-white/[0.02] backdrop-blur-sm shadow-xl">
          {options.map((option) => (
            <button
              key={option}
              onClick={() => handleSelect(option)}
              className={`w-full px-4 py-2 text-left text-sm transition-colors first:rounded-t-lg last:rounded-b-lg ${
                Array.isArray(selected) ? selected.includes(option) : selected === option
                  ? "bg-blue-500/20 text-blue-300"
                  : "text-white/70 hover:bg-white/10"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
