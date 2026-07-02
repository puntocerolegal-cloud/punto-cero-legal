import React from 'react';

const ConnectionLine = ({
  connection,
  sourceNode,
  targetNode,
  onDelete,
  isHovered,
}) => {
  if (!connection || !sourceNode || !targetNode) return null;

  const x1 = (sourceNode.position?.x || 0) + 96;
  const y1 = (sourceNode.position?.y || 0) + 30;
  const x2 = (targetNode.position?.x || 0) - 24;
  const y2 = (targetNode.position?.y || 0) + 30;

  const dx = x2 - x1;
  const dy = y2 - y1;
  const distance = Math.sqrt(dx * dx + dy * dy);

  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;

  return (
    <g className="workflow-connection-group">
      <defs>
        <marker
          id={`arrowhead-${connection.id}`}
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
        >
          <polygon
            points="0 0, 10 3, 0 6"
            fill={isHovered ? '#3b82f6' : '#d1d5db'}
          />
        </marker>
      </defs>

      {/* Connection line */}
      <path
        d={`M ${x1} ${y1} C ${x1 + dx/3} ${y1}, ${x2 - dx/3} ${y2}, ${x2} ${y2}`}
        stroke={isHovered ? '#3b82f6' : '#d1d5db'}
        strokeWidth={isHovered ? 3 : 2}
        fill="none"
        markerEnd={`url(#arrowhead-${connection.id})`}
        className="cursor-pointer hover:stroke-blue-500 transition-all"
        onClick={() => {}}
      />

      {/* Label background */}
      {connection.label && (
        <>
          <rect
            x={midX - 30}
            y={midY - 12}
            width="60"
            height="24"
            fill="white"
            stroke={isHovered ? '#3b82f6' : '#d1d5db'}
            rx="4"
          />
          <text
            x={midX}
            y={midY + 4}
            textAnchor="middle"
            fontSize="12"
            fill="#374151"
            className="pointer-events-none"
          >
            {connection.label}
          </text>
        </>
      )}

      {/* Delete button on hover */}
      {isHovered && (
        <circle
          cx={midX}
          cy={midY}
          r="12"
          fill="#ef4444"
          opacity="0.9"
          className="cursor-pointer hover:opacity-100"
          onClick={() => onDelete?.()}
        >
          <title>Eliminar conexión</title>
        </circle>
      )}
    </g>
  );
};

export default React.memo(ConnectionLine);
