import React from 'react';
import { Gauge, TrendingUp, AlertTriangle } from 'lucide-react';

const ComplianceMetrics = React.memo(({ metrics = {}, compliance = {} }) => {
  const getMetricColor = (value, type = 'score') => {
    if (type === 'anomalies') {
      if (value === 0) return 'text-green-400';
      if (value < 5) return 'text-yellow-400';
      return 'text-red-400';
    }

    if (value >= 80) return 'text-green-400';
    if (value >= 60) return 'text-blue-400';
    if (value >= 40) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getBarColor = (value, type = 'score') => {
    if (type === 'anomalies') {
      if (value === 0) return 'bg-green-500';
      if (value < 5) return 'bg-yellow-500';
      return 'bg-red-500';
    }

    if (value >= 80) return 'bg-green-500';
    if (value >= 60) return 'bg-blue-500';
    if (value >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-4">
      {/* Overall Compliance */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <Gauge size={18} className="text-blue-400" />
            Overall Compliance
          </h3>
          <span className={`text-2xl font-bold ${getMetricColor(compliance.overallCompliance || 0)}`}>
            {compliance.overallCompliance || 0}%
          </span>
        </div>
        <div className="w-full bg-slate-700/50 rounded-full h-3">
          <div
            className={`h-full rounded-full transition-all ${getBarColor(compliance.overallCompliance || 0)}`}
            style={{ width: `${compliance.overallCompliance || 0}%` }}
          />
        </div>
      </div>

      {/* Event Breakdown */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
        <h3 className="text-white font-semibold mb-4">Event Breakdown</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">{compliance.eventBreakdown?.successful || 0}</div>
            <div className="text-xs text-slate-400 mt-1">Successful</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-400">{compliance.eventBreakdown?.suspicious || 0}</div>
            <div className="text-xs text-slate-400 mt-1">Suspicious</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{compliance.eventBreakdown?.total || 0}</div>
            <div className="text-xs text-slate-400 mt-1">Total</div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-4">
        {Object.entries(metrics).map(([key, metric]) => (
          <div key={key} className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <div className="text-xs text-slate-400 mb-2">{metric.label}</div>
            <div className={`text-2xl font-bold ${getMetricColor(metric.value, key)}`}>
              {metric.value}{typeof metric.value === 'number' ? (key === 'anomalies' ? '' : '%') : ''}
            </div>
            {metric.trend && (
              <div className="flex items-center gap-1 mt-2 text-xs text-slate-400">
                <TrendingUp size={12} />
                <span>{metric.trend}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Policy Compliance Detail */}
      {compliance.policyCompliance && compliance.policyCompliance.length > 0 && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
          <h3 className="text-white font-semibold mb-4">Policy Compliance Details</h3>
          <div className="space-y-3">
            {compliance.policyCompliance.map((pc, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                <div>
                  <div className="text-sm font-semibold text-white capitalize">{pc.scope}</div>
                  <div className="text-xs text-slate-400">
                    {pc.violations === 0 ? 'No violations' : `${pc.violations} violation(s)`}
                  </div>
                </div>
                <div className={`text-lg font-bold ${getMetricColor(pc.complianceRate)}`}>
                  {pc.complianceRate}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

ComplianceMetrics.displayName = 'ComplianceMetrics';
export default ComplianceMetrics;
