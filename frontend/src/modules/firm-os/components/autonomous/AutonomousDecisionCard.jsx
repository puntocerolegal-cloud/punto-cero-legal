import React from 'react';
import { CheckCircle2, AlertCircle, Clock } from 'lucide-react';

const AutonomousDecisionCard = React.memo(({ decision = {} }) => {
  const getConfidenceColor = (confidence) => {
    if (confidence >= 80) return 'bg-green-500/20 border-green-500/30 text-green-300';
    if (confidence >= 60) return 'bg-blue-500/20 border-blue-500/30 text-blue-300';
    if (confidence >= 40) return 'bg-yellow-500/20 border-yellow-500/30 text-yellow-300';
    return 'bg-red-500/20 border-red-500/30 text-red-300';
  };

  const getImpactIcon = (impact) => {
    switch (impact) {
      case 'critical':
        return <AlertCircle size={16} className="text-red-400" />;
      case 'high':
        return <AlertCircle size={16} className="text-orange-400" />;
      case 'medium':
        return <Clock size={16} className="text-blue-400" />;
      default:
        return <CheckCircle2 size={16} className="text-green-400" />;
    }
  };

  const getRecommendationBadge = (decision) => {
    if (decision.autoExecute) return { text: 'Auto Execute', color: 'bg-green-500/20 text-green-300' };
    if (decision.requiresApproval) return { text: 'Needs Approval', color: 'bg-yellow-500/20 text-yellow-300' };
    if (decision.requiresReview) return { text: 'Manual Review', color: 'bg-blue-500/20 text-blue-300' };
    return { text: 'Unknown', color: 'bg-slate-500/20 text-slate-300' };
  };

  const badge = getRecommendationBadge(decision.recommendation || {});

  return (
    <div className={`border rounded-lg p-4 ${getConfidenceColor(decision.confidence)}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="font-semibold text-white text-sm">Case {decision.caseId}</div>
          <div className="text-xs text-slate-300 mt-0.5">
            {new Date(decision.timestamp).toLocaleString()}
          </div>
        </div>
        <span className={`text-xs px-2 py-1 rounded font-medium ${badge.color}`}>
          {badge.text}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <div className="text-xs text-slate-400">Confidence</div>
          <div className="text-lg font-bold text-white">{decision.confidence}%</div>
        </div>
        <div>
          <div className="text-xs text-slate-400">Impact</div>
          <div className="flex items-center gap-1 mt-0.5">
            {getImpactIcon(decision.impact)}
            <span className="text-sm font-semibold text-white capitalize">{decision.impact}</span>
          </div>
        </div>
        <div>
          <div className="text-xs text-slate-400">Urgency</div>
          <span className="text-sm font-semibold text-white capitalize">{decision.urgency}</span>
        </div>
        <div>
          <div className="text-xs text-slate-400">Value</div>
          <span className="text-sm font-semibold text-white capitalize">{decision.businessValue}</span>
        </div>
      </div>

      <div className="pt-3 border-t border-white/10">
        <div className="text-xs text-slate-400">Risk Level: <span className="text-white font-semibold capitalize">{decision.riskLevel}</span></div>
      </div>
    </div>
  );
});

AutonomousDecisionCard.displayName = 'AutonomousDecisionCard';
export default AutonomousDecisionCard;
