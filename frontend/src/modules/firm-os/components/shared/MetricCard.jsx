import React from "react";

export function MetricCard({ icon: Icon, title, value, subtitle, color = "border-gray-700", loading = false }) {
  if (loading) {
    return (
      <div className={`bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6 border ${color} animate-pulse`}>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="h-4 w-20 bg-white/10 rounded"></div>
            <div className="h-8 w-32 bg-white/10 rounded mt-2"></div>
            {subtitle && <div className="h-3 w-24 bg-white/10 rounded mt-1"></div>}
          </div>
          <div className="h-8 w-8 bg-white/10 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6 border ${color}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-400 text-sm">{title}</p>
          <p className="text-3xl font-bold mt-2 text-white">{value}</p>
          {subtitle && <p className="text-gray-500 text-xs mt-1">{subtitle}</p>}
        </div>
        <Icon className="w-8 h-8 text-blue-400" />
      </div>
    </div>
  );
}
