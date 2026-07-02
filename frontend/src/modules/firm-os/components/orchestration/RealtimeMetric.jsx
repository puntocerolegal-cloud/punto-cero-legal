import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const RealtimeMetric = React.memo(({ label = '', value = 0, unit = '%', trend = 'stable' }) => {
  const getTrendIcon = (t) => {
    if (t === 'up') return <TrendingUp size={16} className="text-green-400" />;
    if (t === 'down') return <TrendingDown size={16} className="text-red-400" />;
    return null;
  };

  const getValueColor = (val) => {
    if (val >= 80) return 'text-green-400';
    if (val >= 60) return 'text-blue-400';
    if (val >= 40) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
      <div className="flex items-start justify-between mb-2">
        <div className="text-sm text-slate-400">{label}</div>
        {getTrendIcon(trend) && getTrendIcon(trend)}
      </div>
      <div className={`text-3xl font-bold ${getValueColor(value)}`}>
        {value}{unit}
      </div>
      <div className="mt-2 h-1 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all ${getValueColor(value).replace('text', 'bg')}`}
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
    </div>
  );
});

RealtimeMetric.displayName = 'RealtimeMetric';
export default RealtimeMetric;
