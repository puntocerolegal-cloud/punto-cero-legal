import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';

const WorkflowValidator = ({ validation }) => {
  if (!validation) return null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
      <div className="flex items-center gap-2">
        {validation.isValid ? (
          <CheckCircle2 size={20} className="text-green-600" />
        ) : (
          <AlertCircle size={20} className="text-red-600" />
        )}
        <h3 className="font-semibold text-gray-900">
          {validation.isValid ? '✓ Workflow válido' : '✗ Errores detectados'}
        </h3>
      </div>

      {validation.errors.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-red-900 mb-2">Errores:</h4>
          <ul className="space-y-1">
            {validation.errors.map((error, idx) => (
              <li key={idx} className="text-xs text-red-700 flex gap-2">
                <span>•</span>
                <span>{error}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {validation.warnings.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-amber-900 mb-2">Advertencias:</h4>
          <ul className="space-y-1">
            {validation.warnings.map((warning, idx) => (
              <li key={idx} className="text-xs text-amber-700 flex gap-2">
                <AlertTriangle size={12} />
                <span>{warning}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {validation.suggestions.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-blue-900 mb-2">Sugerencias:</h4>
          <ul className="space-y-1">
            {validation.suggestions.map((suggestion, idx) => (
              <li key={idx} className="text-xs text-blue-700 flex gap-2">
                <span>→</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {validation.isValid && validation.warnings.length === 0 && validation.suggestions.length === 0 && (
        <p className="text-xs text-green-700">El workflow está listo para ser usado.</p>
      )}
    </div>
  );
};

export default React.memo(WorkflowValidator);
