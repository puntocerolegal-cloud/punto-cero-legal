import React from "react";
import { StatusBadge } from "./StatusBadge";

export function EntityCard({
  type = "lawyer",
  name,
  subtitle,
  status,
  image,
  icon: IconComponent,
  badges = [],
  metrics = [],
  actions = [],
  footer,
  loading = false,
}) {
  if (loading) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-sm animate-pulse">
        <div className="space-y-4">
          <div className="h-12 w-12 bg-white/10 rounded-lg"></div>
          <div className="h-5 w-32 bg-white/10 rounded"></div>
          <div className="h-4 w-24 bg-white/10 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-sm hover:border-white/20 transition-all">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex gap-4 flex-1">
          {image ? (
            <img src={image} alt={name} className="h-12 w-12 rounded-lg object-cover flex-shrink-0" />
          ) : IconComponent ? (
            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              <IconComponent className="h-6 w-6" />
            </div>
          ) : (
            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0">
              {name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "E"}
            </div>
          )}
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white">{name || "Sin nombre"}</h3>
            {subtitle && <p className="text-sm text-white/50 mt-1">{subtitle}</p>}
          </div>
        </div>
        {status && <StatusBadge status={status} />}
      </div>

      {/* Badges */}
      {badges.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {badges.map((badge, idx) => (
            <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-white/10 text-white/70">
              {badge.icon && <badge.icon className="w-3 h-3" />}
              {badge.label}
            </span>
          ))}
        </div>
      )}

      {/* Metrics Grid */}
      {metrics.length > 0 && (
        <div className={`grid grid-cols-${metrics.length} gap-3 border-t border-white/10 pt-4 mb-4`}>
          {metrics.map((metric, idx) => (
            <div key={idx} className="text-center">
              <p className="text-xs text-white/50 uppercase mb-1">{metric.label}</p>
              <p className="text-sm font-semibold text-white">{metric.value}</p>
              {metric.subtext && <p className="text-xs text-white/40 mt-0.5">{metric.subtext}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      {actions.length > 0 && (
        <div className={`grid grid-cols-${actions.length} gap-2 border-t border-white/10 pt-4`}>
          {actions.map((action, idx) => (
            <button
              key={idx}
              onClick={action.onClick}
              className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all ${action.className}`}
            >
              {action.icon && <action.icon className="w-3.5 h-3.5" />}
              {action.label}
            </button>
          ))}
        </div>
      )}

      {/* Footer */}
      {footer && <div className="mt-4 pt-4 border-t border-white/10 text-xs text-white/60">{footer}</div>}
    </div>
  );
}
