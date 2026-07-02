import React from 'react';
import { TrendingUp, CheckCircle2, AlertCircle, Zap } from 'lucide-react';

const AutonomousStatistics = React.memo(({ statistics = {} }) => {
  const getStat = (label, value, color = 'text-white') => (
    <div className="text-center">
      <div className="text-3xl font-bold text-white">{value || 0}</div>
      <div className="text-xs text-slate-400 mt-1">{label}</div>
    </div>
  );

  const getRateColor = (rate) => {
    if (rate >= 80) return 'text-green-400';
    if (rate >= 60) return 'text-blue-400';
    if (rate >= 40) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="space-y-6">
      {/* Main Statistics */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
        <h3 className="text-white font-semibold mb-6">Decision Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {getStat('Total Decisions', statistics.totalDecisions)}
          {getStat('Automated', statistics.automatedDecisions)}
          {getStat('Manual', statistics.manualDecisions)}
          {getStat('Approved', statistics.approvedCount)}
        </div>
      </div>

      {/* Execution Statistics */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
        <h3 className="text-white font-semibold mb-6">Execution Results</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {getStat('Successful', statistics.successfulCount, 'text-green-400')}
          {getStat('Failed', statistics.failedCount, 'text-red-400')}
          {getStat('Rejected', statistics.rejectedCount, 'text-orange-400')}
          {getStat('Avg Confidence', statistics.averageConfidence + '%', 'text-blue-400')}
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={18} className="text-green-400" />
            <span className="text-sm text-slate-400">Success Rate</span>
          </div>
          <div className={`text-3xl font-bold ${getRateColor(statistics.successRate)}`}>
            {statistics.successRate}%
          </div>
          <div className="mt-2 h-2 bg-slate-700/50 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${getRateColor(statistics.successRate).replace('text', 'bg')}`}
              style={{ width: `${statistics.successRate}%` }}
            />
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Zap size={18} className="text-yellow-400" />
            <span className="text-sm text-slate-400">Automation %</span>
          </div>
          <div className={`text-3xl font-bold ${getRateColor(statistics.automationPercentage)}`}>
            {statistics.automationPercentage}%
          </div>
          <div className="mt-2 h-2 bg-slate-700/50 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${getRateColor(statistics.automationPercentage).replace('text', 'bg')}`}
              style={{ width: `${statistics.automationPercentage}%` }}
            />
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 size={18} className="text-blue-400" />
            <span className="text-sm text-slate-400">Avg Time (ms)</span>
          </div>
          <div className="text-3xl font-bold text-blue-400">
            {statistics.averageExecutionTime}
          </div>
          <div className="text-xs text-slate-400 mt-2">execution time</div>
        </div>
      </div>
    </div>
  );
});

AutonomousStatistics.displayName = 'AutonomousStatistics';
export default AutonomousStatistics;
