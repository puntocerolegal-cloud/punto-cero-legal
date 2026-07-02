import React from 'react';
import { Undo2, Redo2 } from 'lucide-react';

const HistoryControls = ({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  historyIndex,
  historyLength,
}) => {
  return (
    <div className="flex gap-1 p-2 bg-white border border-gray-200 rounded-lg shadow-lg">
      <button
        onClick={onUndo}
        disabled={!canUndo}
        className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
        title="Deshacer (Ctrl+Z)"
      >
        <Undo2 size={18} />
      </button>

      <button
        onClick={onRedo}
        disabled={!canRedo}
        className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
        title="Rehacer (Ctrl+Y)"
      >
        <Redo2 size={18} />
      </button>

      {historyLength > 0 && (
        <div className="text-xs text-gray-600 px-2 py-2 border-l border-gray-200">
          {historyIndex + 1}/{historyLength}
        </div>
      )}
    </div>
  );
};

export default React.memo(HistoryControls);
