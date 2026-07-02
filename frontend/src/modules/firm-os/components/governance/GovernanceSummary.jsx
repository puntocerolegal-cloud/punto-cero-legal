import React from 'react';
import { AlertTriangle, CheckCircle2, TrendingDown, Info } from 'lucide-react';

const GovernanceSummary = React.memo(({ summary = {} }) => {
  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'low':
        return 'bg-green-500/20 border-green-500/30 text-green-300';
      case 'medium':
        return 'bg-yellow-500/20 border-yellow-500/30 text-yellow-300';
      case 'high':
        return 'bg-orange-500/20 border-orange-500/30 text-orange-300';
      case 'critical':
        return 'bg-red-500/20 border-red-500/30 text-red-300';
      default:
        return 'bg-slate-500/20 border-slate-500/30 text-slate-300';
    }
  };

  const getRiskIcon = (riskLevel) => {
    switch (riskLevel) {
      case 'low':
        return <CheckCircle2 size={20} className="text-green-400" />;
      case 'medium':
        return <AlertTriangle size={20} className="text-yellow-400" />;
      case 'high':
        return <AlertTriangle size={20} className="text-orange-400" />;
      case 'critical':
        return <AlertTriangle size={20} className="text-red-400" />;
      default:
        return <Info size={20} className="text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Risk Assessment */}
      <div className={`border rounded-lg p-6 ${getRiskColor(summary.riskLevel)}`}>
        <div className="flex items-start gap-4">
          {getRiskIcon(summary.riskLevel)}
          <div className="flex-1">
            <h3 className="font-bold text-lg capitalize">
              {summary.riskLevel} Risk Level
            </h3>
            <p className="text-sm mt-2">
              Enterprise systems are operating {summary.riskLevel === 'low' ? 'nominally' : 'with caution required'}.
            </p>
          </div>
        </div>
      </div>

      {/* Title */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
        <h2 className="text-white font-bold text-xl">{summary.title}</h2>
      </div>

      {/* Key Findings */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 space-y-4">
        <h3 className="text-white font-semibold">Key Findings</h3>
        <div className="space-y-3">
          {summary.keyFindings && summary.keyFindings.length > 0 ? (
            summary.keyFindings.map((finding, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
                <CheckCircle2 size={16} className="text-green-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-slate-300">{finding}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-400">No findings available</p>
          )}
        </div>
      </div>

      {/* Recommendations */}
      {summary.recommendations && summary.recommendations.length > 0 && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 space-y-4">
          <h3 className="text-white font-semibold">Recommendations</h3>
          <div className="space-y-3">
            {summary.recommendations.map((rec, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <TrendingDown size={16} className="text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-300">{rec}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

GovernanceSummary.displayName = 'GovernanceSummary';
export default GovernanceSummary;
