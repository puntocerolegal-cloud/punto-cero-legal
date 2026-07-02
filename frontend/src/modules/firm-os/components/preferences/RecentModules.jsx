import React from 'react';
import { Clock, ArrowRight } from 'lucide-react';

const MODULE_ICONS = {
  dashboard: '📊',
  analytics: '📈',
  lawyers: '⚖️',
  departments: '🏢',
  offices: '🏛️',
  assignments: '📋',
  team: '👥',
  crm: '📞',
  cases: '📁',
};

export function RecentModules({ recentModules = [], onNavigate }) {
  if (!recentModules || recentModules.length === 0) {
    return (
      <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-center">
        <Clock className="w-5 h-5 text-white/40 mx-auto mb-2" />
        <p className="text-xs text-white/60">Sin módulos recientes</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-white/70 uppercase tracking-wider">Módulos Recientes</p>
      <div className="space-y-1">
        {recentModules.map((moduleName, idx) => {
          const icon = MODULE_ICONS[moduleName] || '📌';
          return (
            <button
              key={idx}
              onClick={() => onNavigate?.(moduleName)}
              className="w-full flex items-center gap-2 rounded-lg bg-white/5 hover:bg-white/10 px-3 py-2 text-sm text-white/80 hover:text-white transition-all group"
            >
              <span className="text-base">{icon}</span>
              <span className="flex-1 text-left capitalize">{moduleName}</span>
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
