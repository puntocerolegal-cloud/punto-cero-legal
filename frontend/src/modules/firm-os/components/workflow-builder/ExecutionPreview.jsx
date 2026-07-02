import React from 'react';
import { Play, AlertCircle, CheckCircle2, Zap } from 'lucide-react';

const ExecutionPreview = ({ preview }) => {
  if (!preview) return null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Preview de Ejecución</h3>
        {preview.isValid && (
          <span className="inline-flex items-center gap-1 text-xs text-green-600">
            <CheckCircle2 size={14} />
            Listo
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-xs text-blue-700 mb-1">Pasos</p>
          <p className="text-2xl font-bold text-blue-900">
            {preview.executionOrder.length}
          </p>
        </div>

        <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
          <p className="text-xs text-yellow-700 mb-1">Condiciones</p>
          <p className="text-2xl font-bold text-yellow-900">
            {preview.conditionsCount}
          </p>
        </div>

        <div className="p-3 bg-green-50 rounded-lg border border-green-200">
          <p className="text-xs text-green-700 mb-1">Acciones</p>
          <p className="text-2xl font-bold text-green-900">
            {preview.actionsCount}
          </p>
        </div>

        <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
          <p className="text-xs text-purple-700 mb-1">Tiempo Est.</p>
          <p className="text-2xl font-bold text-purple-900">
            {preview.estimatedTime}ms
          </p>
        </div>
      </div>

      {preview.executionOrder.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-gray-700 mb-2 uppercase">Orden de Ejecución:</h4>
          <ol className="space-y-1">
            {preview.executionOrder.slice(0, 5).map((step, idx) => (
              <li key={idx} className="text-xs text-gray-600 flex gap-2">
                <span className="font-medium text-gray-400">{step.step}.</span>
                <span>{step.label}</span>
              </li>
            ))}
            {preview.executionOrder.length > 5 && (
              <li className="text-xs text-gray-500 italic">
                ... y {preview.executionOrder.length - 5} más
              </li>
            )}
          </ol>
        </div>
      )}

      {preview.errors.length > 0 && (
        <div className="p-2 bg-red-50 border border-red-200 rounded">
          <p className="text-xs text-red-700 flex gap-2 mb-1">
            <AlertCircle size={14} />
            <span className="font-medium">Errores de validación</span>
          </p>
        </div>
      )}

      {preview.warnings.length > 0 && (
        <div className="p-2 bg-amber-50 border border-amber-200 rounded">
          <p className="text-xs text-amber-700 font-medium">
            {preview.warnings.length} advertencia(s)
          </p>
        </div>
      )}
    </div>
  );
};

export default React.memo(ExecutionPreview);
