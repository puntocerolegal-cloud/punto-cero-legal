import React, { useState, useRef, useEffect } from 'react';
import { Settings, X } from 'lucide-react';

export function PreferenceButton({ preferencesPanel }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleClickOutside = (e) => {
    if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg bg-white/5 hover:bg-white/10 p-2 transition-colors text-white"
        title="Preferencias"
      >
        <Settings className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-45' : ''}`} />
      </button>

      {isOpen && preferencesPanel && (
        <div className="absolute right-0 mt-2 bg-slate-900 rounded-lg shadow-lg border border-white/10 overflow-hidden z-50 w-80 max-h-96 overflow-y-auto">
          <div className="bg-slate-800 px-4 py-3 border-b border-white/10 flex items-center justify-between">
            <p className="text-sm font-semibold text-white">Preferencias</p>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/60 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            {preferencesPanel}
          </div>
        </div>
      )}
    </div>
  );
}
