import React from 'react';
import { Check } from 'lucide-react';

export function LayoutSwitcher({ layoutOptions, currentLayout, onChangeLayout }) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-white/70 uppercase tracking-wider">Diseño</p>
      <div className="grid grid-cols-3 gap-2">
        {layoutOptions.map(option => (
          <button
            key={option.id}
            onClick={() => onChangeLayout(option.id)}
            className={`relative rounded-lg p-2 text-xs font-medium transition-all ${
              currentLayout === option.id
                ? 'bg-blue-600/40 border-2 border-blue-400 text-blue-300'
                : 'bg-white/5 border-2 border-transparent text-white/70 hover:bg-white/10'
            }`}
          >
            {option.label}
            {currentLayout === option.id && (
              <Check className="w-3 h-3 absolute top-1 right-1" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
