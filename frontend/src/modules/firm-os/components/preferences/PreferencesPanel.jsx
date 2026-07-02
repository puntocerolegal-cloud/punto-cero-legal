import React from 'react';
import { RotateCcw, Save } from 'lucide-react';

export function PreferencesPanel({ title, onReset, onSave, children, loading = false }) {
  return (
    <div className="space-y-4">
      {title && (
        <div className="pb-3 border-b border-white/10">
          <p className="text-sm font-semibold text-white">{title}</p>
        </div>
      )}

      <div className="space-y-4">
        {children}
      </div>

      <div className="flex gap-2 pt-3 border-t border-white/10">
        <button
          onClick={onReset}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 disabled:opacity-50 px-3 py-2 rounded-lg text-xs font-medium text-white/70 hover:text-white transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Restablecer
        </button>
        <button
          onClick={onSave}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-3 py-2 rounded-lg text-xs font-medium text-white transition-colors"
        >
          <Save className="w-4 h-4" />
          Guardar
        </button>
      </div>
    </div>
  );
}
