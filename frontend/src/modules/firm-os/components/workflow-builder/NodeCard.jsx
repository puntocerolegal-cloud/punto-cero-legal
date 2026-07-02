import React from 'react';
import { X, Copy, Settings } from 'lucide-react';

const NodeCard = ({
  node,
  isSelected,
  onSelect,
  onDelete,
  onDuplicate,
  onDragStart,
  getIcon,
}) => {
  if (!node) return null;

  const Icon = getIcon ? getIcon(node.type) : null;

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onSelect}
      className={`
        relative w-48 px-4 py-3 rounded-lg cursor-move transition-all
        border-2 shadow-md hover:shadow-lg
        ${isSelected 
          ? 'border-blue-500 bg-blue-50 shadow-lg' 
          : 'border-gray-300 bg-white'
        }
      `}
      style={{
        borderColor: isSelected ? '#3b82f6' : node.color,
        backgroundColor: isSelected ? '#eff6ff' : '#ffffff',
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        {Icon && (
          <div style={{ color: node.color }}>
            {Icon}
          </div>
        )}
        <h4 className="font-semibold text-sm text-gray-900 flex-1">{node.label}</h4>
      </div>

      {node.description && (
        <p className="text-xs text-gray-600 mb-2">{node.description}</p>
      )}

      <div className="flex gap-1 mt-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDuplicate?.();
          }}
          className="flex-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
          title="Duplicar"
        >
          <Copy size={14} />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.();
          }}
          className="flex-1 px-2 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-600 rounded transition-colors"
          title="Eliminar"
        >
          <X size={14} />
        </button>
      </div>

      {/* Conexión In/Out */}
      <div className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-5 h-5 bg-white border-2 rounded-full" 
        style={{ borderColor: node.color }} 
        title="Conexión entrante"
      />
      <div className="absolute -right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 bg-white border-2 rounded-full" 
        style={{ borderColor: node.color }} 
        title="Conexión saliente"
      />
    </div>
  );
};

export default React.memo(NodeCard);
