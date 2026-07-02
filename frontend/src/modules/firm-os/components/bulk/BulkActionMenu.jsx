import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, ChevronDown } from 'lucide-react';

const ICON_MAP = {
  CheckCircle2: '✓',
  FolderKanban: '📁',
  Download: '⬇',
  Trash2: '🗑',
  AlertCircle: '⚠',
};

export function BulkActionMenu({ actions, onAction, disabled = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!Array.isArray(actions) || actions.length === 0) {
    return null;
  }

  const enabledActions = actions.filter(a => a.enabled !== false);

  if (enabledActions.length === 0) {
    return null;
  }

  const handleAction = (action) => {
    onAction?.(action.id);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
          disabled
            ? 'bg-white/5 text-white/40 cursor-not-allowed'
            : 'bg-white/10 hover:bg-white/20 text-white'
        }`}
      >
        <span>Acciones</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && !disabled && (
        <div className="absolute right-0 mt-2 bg-slate-900 rounded-lg shadow-lg border border-white/10 overflow-hidden z-50 min-w-[250px]">
          <div className="py-1 max-h-80 overflow-y-auto">
            {enabledActions.map(action => (
              <button
                key={action.id}
                onClick={() => handleAction(action)}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              >
                <span className="text-lg">{ICON_MAP[action.icon] || '•'}</span>
                <span className="flex-1 text-left">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
