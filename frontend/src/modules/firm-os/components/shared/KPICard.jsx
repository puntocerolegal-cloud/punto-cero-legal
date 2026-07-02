import React from "react";
import { AnimatedCounter } from "../feedback/AnimatedCounter";

export function KPICard({ icon: Icon, label, value, color = "#3b82f6", loading = false, animate = true }) {
  if (loading) {
    return (
      <div className="rounded-lg bg-white/5 p-4 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-3 w-24 bg-white/10 rounded"></div>
            <div className="h-6 w-16 bg-white/10 rounded"></div>
          </div>
          <div className="h-6 w-6 bg-white/10 rounded"></div>
        </div>
      </div>
    );
  }

  const isNumeric = !isNaN(value) && value !== '';

  return (
    <div className="rounded-lg bg-white/5 p-4 hover-scale hover:bg-white/10 transition-smooth">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-white/50 uppercase">{label}</p>
          <p className="mt-1 text-2xl font-bold text-white">
            {animate && isNumeric ? <AnimatedCounter value={value} /> : value}
          </p>
        </div>
        <Icon className="h-6 w-6 transition-transform group-hover:scale-110" style={{ color }} />
      </div>
    </div>
  );
}
