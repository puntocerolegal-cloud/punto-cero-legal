import React from 'react';
import { Lightbulb, ArrowRight, TrendingUp } from 'lucide-react';

const RecommendationCard = ({ 
  recommendation,
  onClick,
  onAction,
  compact = false
}) => {
  if (!recommendation) return null;

  const priorityColors = {
    high: 'bg-red-50 border-red-200 text-red-700',
    medium: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    low: 'bg-green-50 border-green-200 text-green-700',
  };

  const priorityBadgeColors = {
    high: 'bg-red-100 text-red-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-green-100 text-green-800',
  };

  const priorityLabels = {
    high: 'Alta',
    medium: 'Media',
    low: 'Baja',
  };

  const priority = recommendation.priority || 'medium';
  const cardClasses = compact 
    ? 'p-3 border rounded hover:shadow-md transition-shadow'
    : 'p-4 border rounded-lg hover:shadow-lg transition-shadow';

  return (
    <div
      className={`${cardClasses} ${priorityColors[priority]} cursor-pointer`}
      onClick={onClick}
      role="button"
      tabIndex={0}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <Lightbulb size={compact ? 18 : 20} className="opacity-70" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className={`font-semibold ${compact ? 'text-sm' : 'text-base'}`}>
              {recommendation.title || 'Recomendación'}
            </h3>
            <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full flex-shrink-0 ${priorityBadgeColors[priority]}`}>
              {priorityLabels[priority]}
            </span>
          </div>

          <p className={`text-gray-700 ${compact ? 'text-xs' : 'text-sm'}`}>
            {recommendation.description || recommendation.message}
          </p>

          {recommendation.impact && (
            <div className="mt-2 flex items-center gap-1 text-xs text-gray-600">
              <TrendingUp size={14} />
              <span>{recommendation.impact}</span>
            </div>
          )}

          {!compact && recommendation.action && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAction?.();
              }}
              className="mt-3 inline-flex items-center gap-2 text-sm font-medium hover:gap-3 transition-all"
            >
              Ver detalles
              <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(RecommendationCard);
