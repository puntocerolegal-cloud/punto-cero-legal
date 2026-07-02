import React from 'react';
import { HardDrive, Zap, Activity } from 'lucide-react';

const ResourceUsage = React.memo(({ resources = {} }) => {
  const getHealthColor = (health) => {
    switch (health) {
      case 'excellent':
        return 'text-green-400 border-green-500/30 bg-green-500/5';
      case 'good':
        return 'text-blue-400 border-blue-500/30 bg-blue-500/5';
      case 'warning':
        return 'text-orange-400 border-orange-500/30 bg-orange-500/5';
      default:
        return 'text-slate-400 border-slate-500/30 bg-slate-500/5';
    }
  };

  const memory = resources.memory || { used: 0, unit: 'MB', warning: 128, critical: 256 };
  const executionTime = resources.executionTime || { average: 0, peak: 0, unit: 'ms' };
  const concurrent = resources.concurrent || { current: 0, max: 10 };

  return (
    <div className={`border rounded-lg p-6 ${getHealthColor(resources.health)}`}>
      <h3 className="text-white font-semibold mb-6">System Resources</h3>

      <div className="space-y-6">
        {/* Memory */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <HardDrive size={18} />
              <span className="text-sm text-slate-300">Memory Usage</span>
            </div>
            <span className="text-sm font-semibold">{memory.used} {memory.unit}</span>
          </div>
          <div className="w-full bg-slate-700/50 rounded-full h-2">
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${Math.min(100, (memory.used / memory.warning) * 100)}%` }}
            />
          </div>
          <div className="text-xs text-slate-400 mt-1">Warn: {memory.warning} {memory.unit}</div>
        </div>

        {/* Execution Time */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Zap size={18} />
              <span className="text-sm text-slate-300">Avg Execution Time</span>
            </div>
            <span className="text-sm font-semibold">{executionTime.average} {executionTime.unit}</span>
          </div>
          <div className="text-xs text-slate-400">Peak: {executionTime.peak} {executionTime.unit}</div>
        </div>

        {/* Concurrent */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Activity size={18} />
              <span className="text-sm text-slate-300">Concurrent Tasks</span>
            </div>
            <span className="text-sm font-semibold">{concurrent.current}/{concurrent.max}</span>
          </div>
          <div className="w-full bg-slate-700/50 rounded-full h-2">
            <div
              className="h-full bg-green-500 rounded-full transition-all"
              style={{ width: `${(concurrent.current / concurrent.max) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
});

ResourceUsage.displayName = 'ResourceUsage';
export default ResourceUsage;
