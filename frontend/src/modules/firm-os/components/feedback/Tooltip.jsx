import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';

export function Tooltip({ text, children, position = 'top' }) {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    top: 'bottom-full mb-2 -translate-x-1/2 left-1/2',
    bottom: 'top-full mt-2 -translate-x-1/2 left-1/2',
    left: 'right-full mr-2 -translate-y-1/2 top-1/2',
    right: 'left-full ml-2 -translate-y-1/2 top-1/2',
  };

  return (
    <div className="relative inline-flex items-center">
      {children || (
        <button
          onMouseEnter={() => setIsVisible(true)}
          onMouseLeave={() => setIsVisible(false)}
          className="text-white/40 hover:text-white/60 transition-colors"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      )}

      {isVisible && (
        <div
          className={`absolute z-50 px-3 py-2 text-xs font-medium text-white bg-slate-800 rounded-lg whitespace-nowrap border border-white/10 ${positionClasses[position]} animate-in fade-in`}
        >
          {text}
          <div className={`absolute w-2 h-2 bg-slate-800 border border-white/10 ${
            position === 'top' ? 'top-full left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-45' :
            position === 'bottom' ? 'bottom-full left-1/2 -translate-x-1/2 translate-y-1/2 rotate-45' :
            position === 'left' ? 'left-full top-1/2 -translate-y-1/2 translate-x-1/2 rotate-45' :
            'right-full top-1/2 -translate-y-1/2 -translate-x-1/2 rotate-45'
          }`} />
        </div>
      )}
    </div>
  );
}
