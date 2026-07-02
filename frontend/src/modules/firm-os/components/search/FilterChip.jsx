import React from "react";
import { X } from "lucide-react";

export function FilterChip({ label, value, onRemove, color = "blue" }) {
  const colorMap = {
    blue: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    emerald: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    amber: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    purple: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  };

  return (
    <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm ${colorMap[color]}`}>
      <span>{label}</span>
      <button
        onClick={onRemove}
        className="hover:opacity-70 transition-opacity"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
