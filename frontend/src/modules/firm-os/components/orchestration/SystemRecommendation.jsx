import React from 'react';
import { Lightbulb, ChevronRight } from 'lucide-react';

const SystemRecommendation = React.memo(({ recommendation = {} }) => {
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'border-orange-500/30 bg-orange-500/5';
      case 'medium':
        return 'border-blue-500/30 bg-blue-500/5';
      default:
        return 'border-slate-500/30 bg-slate-500/5';
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-orange-500/20 text-orange-300';
      case 'medium':
        return 'bg-blue-500/20 text-blue-300';
      default:
        return 'bg-slate-500/20 text-slate-300';
    }
  };

  return (
    <div className={`border rounded-lg p-4 ${getPriorityColor(recommendation.priority)}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <Lightbulb size={18} className="text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-white text-sm">{recommendation.title}</div>
            <div className="text-xs text-slate-300 mt-1">{recommendation.description}</div>
          </div>
        </div>
        <span className={`text-xs px-2 py-1 rounded whitespace-nowrap ${getPriorityBadge(recommendation.priority)}`}>
          {recommendation.priority}
        </span>
      </div>
      {recommendation.action && (
        <div className="mt-3 flex items-center text-xs text-blue-400 hover:text-blue-300 cursor-pointer">
          {recommendation.action}
          <ChevronRight size={14} className="ml-1" />
        </div>
      )}
    </div>
  );
});

SystemRecommendation.displayName = 'SystemRecommendation';
export default SystemRecommendation;
