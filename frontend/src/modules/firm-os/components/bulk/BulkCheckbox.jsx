import React from 'react';
import { Minus } from 'lucide-react';

export function BulkCheckbox({ isSelected, isIndeterminate = false, onChange, disabled = false }) {
  return (
    <button
      onClick={onChange}
      disabled={disabled}
      className={`relative w-5 h-5 rounded border-2 transition-all flex items-center justify-center ${
        disabled
          ? 'bg-white/5 border-white/20 cursor-not-allowed'
          : isSelected || isIndeterminate
          ? 'bg-blue-600 border-blue-600 hover:bg-blue-700'
          : 'border-white/30 hover:border-white/50 hover:bg-white/5'
      }`}
      title={isIndeterminate ? 'Parcialmente seleccionado' : isSelected ? 'Deseleccionar' : 'Seleccionar'}
    >
      {isIndeterminate && <Minus className="w-3 h-3 text-white" />}
      {isSelected && !isIndeterminate && (
        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      )}
    </button>
  );
}
