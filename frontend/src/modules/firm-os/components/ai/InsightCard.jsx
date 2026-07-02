import React from 'react';
import { AlertTriangle, TrendingUp, Lightbulb, AlertCircle, CheckCircle2 } from 'lucide-react';

const InsightCard = ({ insight }) => {
  if (!insight) return null;

  const icons = {
    risk: AlertTriangle,
    opportunity: TrendingUp,
    recommendation: Lightbulb,
    alert: AlertCircle,
    success: CheckCircle2,
  };

  const colors = {
    risk: { icon: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
    opportunity: { icon: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
    recommendation: { icon: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    alert: { icon: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' },
    success: { icon: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  };

  const Icon = icons[insight.type] || Lightbulb;
  const colorConfig = colors[insight.type] || colors.recommendation;

  return (
    <div className={`p-4 rounded-lg border ${colorConfig.bg} ${colorConfig.border}`}>
      <div className="flex items-start gap-3">
        <Icon size={20} className={colorConfig.icon} />
        
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-gray-900">{insight.title}</h4>
          <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
          
          {insight.score && (
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-500">Confianza: {insight.confidence}</span>
              <span className="text-sm font-medium text-gray-900">{insight.score}%</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(InsightCard);
