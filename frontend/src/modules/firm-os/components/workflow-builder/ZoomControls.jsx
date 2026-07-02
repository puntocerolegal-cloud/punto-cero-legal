import React from 'react';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

const ZoomControls = ({
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomFit,
}) => {
  return (
    <div className="flex flex-col gap-1 p-2 bg-white border border-gray-200 rounded-lg shadow-lg">
      <button
        onClick={onZoomIn}
        disabled={zoom >= 2}
        className="p-2 hover:bg-gray-100 disabled:opacity-50 rounded transition-colors"
        title="Zoom in"
      >
        <ZoomIn size={20} />
      </button>

      <div className="text-xs text-center text-gray-600 py-1">
        {Math.round(zoom * 100)}%
      </div>

      <button
        onClick={onZoomOut}
        disabled={zoom <= 0.5}
        className="p-2 hover:bg-gray-100 disabled:opacity-50 rounded transition-colors"
        title="Zoom out"
      >
        <ZoomOut size={20} />
      </button>

      <div className="border-t border-gray-200 my-1"></div>

      <button
        onClick={onZoomFit}
        className="p-2 hover:bg-gray-100 rounded transition-colors"
        title="Ajustar vista"
      >
        <Maximize2 size={20} />
      </button>
    </div>
  );
};

export default React.memo(ZoomControls);
