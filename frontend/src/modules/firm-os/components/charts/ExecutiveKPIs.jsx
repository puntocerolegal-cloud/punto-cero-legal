import React from 'react';
import { TrendingUp, Users, FolderKanban, Target, AlertCircle } from 'lucide-react';
import { MetricCard } from '../shared/MetricCard';

const ICON_MAP = {
  Users: Users,
  FolderKanban: FolderKanban,
  AlertCircle: AlertCircle,
  TrendingUp: TrendingUp,
  Target: Target,
};

export function ExecutiveKPIs({ kpis }) {
  if (!Array.isArray(kpis) || kpis.length === 0) {
    return (
      <div className="text-center py-8 text-white/60">
        <p>Sin KPIs disponibles</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map(kpi => {
        const Icon = ICON_MAP[kpi.icon] || Target;
        return (
          <div key={kpi.id} className="rounded-lg border border-white/10 bg-white/[0.02] p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs uppercase tracking-wider text-white/50">{kpi.label}</p>
              <Icon className="w-5 h-5" style={{ color: kpi.color }} />
            </div>
            <p className="text-2xl font-bold text-white">{kpi.value}</p>
            <p className="text-xs text-white/60 mt-2" style={{ color: kpi.color }}>
              {kpi.change}
            </p>
          </div>
        );
      })}
    </div>
  );
}
