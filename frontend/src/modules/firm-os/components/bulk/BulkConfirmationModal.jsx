import React from 'react';
import { AlertCircle, X } from 'lucide-react';

export function BulkConfirmationModal({
  isOpen = false,
  title = 'Confirmar acción',
  message = 'Esta acción afectará a múltiples elementos',
  selectedCount = 0,
  onConfirm,
  onCancel,
  isLoading = false,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'warning',
}) {
  if (!isOpen) {
    return null;
  }

  const bgColor = {
    warning: 'bg-amber-500/20 border-amber-500/30',
    danger: 'bg-red-500/20 border-red-500/30',
    info: 'bg-blue-500/20 border-blue-500/30',
  }[variant] || 'bg-amber-500/20 border-amber-500/30';

  const textColor = {
    warning: 'text-amber-300',
    danger: 'text-red-300',
    info: 'text-blue-300',
  }[variant] || 'text-amber-300';

  const buttonColor = {
    warning: 'bg-amber-600 hover:bg-amber-700',
    danger: 'bg-red-600 hover:bg-red-700',
    info: 'bg-blue-600 hover:bg-blue-700',
  }[variant] || 'bg-amber-600 hover:bg-amber-700';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-900 rounded-lg shadow-xl border border-white/10 w-full max-w-md mx-4">
        <div className={`flex items-center gap-3 border-b border-white/10 p-4 ${bgColor}`}>
          <AlertCircle className={`w-5 h-5 ${textColor}`} />
          <h2 className={`text-lg font-semibold ${textColor}`}>{title}</h2>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="ml-auto text-white/60 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <p className="text-white/80 mb-3">{message}</p>
            <div className="bg-white/5 rounded-lg p-3 border border-white/10">
              <p className="text-sm text-white/70">
                <span className="font-semibold text-white">{selectedCount}</span> elemento{selectedCount !== 1 ? 's' : ''} serán afectado{selectedCount !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-50 px-4 py-2 text-sm font-medium text-white transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={`flex-1 rounded-lg ${buttonColor} disabled:opacity-50 px-4 py-2 text-sm font-medium text-white transition-colors`}
            >
              {isLoading ? 'Procesando...' : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
