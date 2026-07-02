import React from 'react';
import { Activity, AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';

const AutomationHealthCard = ({ 
  health,
  status = 'healthy'
}) => {
  if (!health) return null;

  const statusConfig = {
    healthy: {
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      badge: 'bg-green-100 text-green-800',
    },
    caution: {
      icon: AlertTriangle,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      badge: 'bg-yellow-100 text-yellow-800',
    },
    warning: {
      icon: AlertCircle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      badge: 'bg-orange-100 text-orange-800',
    },
    critical: {
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      badge: 'bg-red-100 text-red-800',
    },
  };

  const config = statusConfig[status] || statusConfig.healthy;
  const Icon = config.icon;

  return (
    <div className={`border rounded-lg p-6 ${config.bgColor} ${config.borderColor}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <Icon size={24} className={config.color} />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Salud de la Firma
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {health.message}
            </p>
          </div>
        </div>

        <span className={`px-3 py-1 text-xs font-medium rounded-full ${config.badge}`}>
          {health.health}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-current border-opacity-20">
        <div>
          <p className="text-xs text-gray-600 mb-1">Ocupación</p>
          <p className="text-2xl font-bold text-gray-900">
            {health.firmRisk || 0}%
          </p>
        </div>

        <div>
          <p className="text-xs text-gray-600 mb-1">Alertas</p>
          <p className="text-2xl font-bold text-gray-900">
            {health.alerts || 0}
          </p>
        </div>

        <div>
          <p className="text-xs text-gray-600 mb-1">Recomendaciones</p>
          <p className="text-2xl font-bold text-gray-900">
            {health.recommendations || 0}
          </p>
        </div>
      </div>

      {health.evaluatedRules && (
        <div className="mt-4 pt-4 border-t border-current border-opacity-20 text-xs text-gray-600">
          <p>
            {health.passedRules}/{health.evaluatedRules} reglas pasadas
          </p>
        </div>
      )}
    </div>
  );
};

export default React.memo(AutomationHealthCard);
