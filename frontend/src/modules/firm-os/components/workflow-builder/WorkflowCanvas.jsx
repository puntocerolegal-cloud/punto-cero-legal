import React, { useRef, useEffect, useState } from 'react';
import NodeCard from './NodeCard';
import ConnectionLine from './ConnectionLine';
import { getNodeIcon, getNodeColor } from '../../domain/workflowBuilderDomain';

const WorkflowCanvas = ({
  nodes,
  connections,
  selectedNodeId,
  zoom,
  pan,
  onNodeSelect,
  onNodeMove,
  onNodeMoveFinish,
  onNodeDelete,
  onNodeDuplicate,
  onConnectionDelete,
  onCanvasDrop,
  onCanvasPan,
  onCanvasZoom,
}) => {
  const canvasRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [hoveredConnectionId, setHoveredConnectionId] = useState(null);

  const handleMouseDown = (e) => {
    if (e.target === canvasRef.current) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    onCanvasZoom?.(zoom * delta);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const nodeType = e.dataTransfer.getData('nodeType');
    const rect = canvasRef.current.getBoundingClientRect();
    const position = {
      x: (e.clientX - rect.left - pan.x) / zoom,
      y: (e.clientY - rect.top - pan.y) / zoom,
    };
    onCanvasDrop?.(nodeType, position);
  };

  useEffect(() => {
    const handleMove = (e) => {
      if (isDragging && dragStart) {
        onCanvasPan?.({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        });
      }
    };

    const handleUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [isDragging, dragStart, onCanvasPan]);

  return (
    <div
      ref={canvasRef}
      onMouseDown={handleMouseDown}
      onWheel={handleWheel}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className="relative w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden cursor-grab active:cursor-grabbing"
    >
      {/* Grid background */}
      <svg
        className="absolute inset-0"
        width="100%"
        height="100%"
        style={{
          backgroundImage: `
            linear-gradient(0deg, transparent 24%, rgba(0, 0, 0, 0.05) 25%, rgba(0, 0, 0, 0.05) 26%, transparent 27%, transparent 74%, rgba(0, 0, 0, 0.05) 75%, rgba(0, 0, 0, 0.05) 76%, transparent 77%, transparent),
            linear-gradient(90deg, transparent 24%, rgba(0, 0, 0, 0.05) 25%, rgba(0, 0, 0, 0.05) 26%, transparent 27%, transparent 74%, rgba(0, 0, 0, 0.05) 75%, rgba(0, 0, 0, 0.05) 76%, transparent 77%, transparent)
          `,
          backgroundSize: '${50 * zoom}px ${50 * zoom}px',
          backgroundPosition: `${pan.x}px ${pan.y}px`,
        }}
      >
        {/* Connections */}
        <svg className="absolute inset-0" style={{ pointerEvents: 'none' }}>
          {connections.map(conn => {
            const source = nodes.find(n => n.id === conn.source);
            const target = nodes.find(n => n.id === conn.target);

            if (!source || !target) return null;

            return (
              <g
                key={conn.id}
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  transformOrigin: '0 0',
                  pointerEvents: 'auto',
                }}
                onMouseEnter={() => setHoveredConnectionId(conn.id)}
                onMouseLeave={() => setHoveredConnectionId(null)}
              >
                <ConnectionLine
                  key={conn.id}
                  connection={conn}
                  sourceNode={source}
                  targetNode={target}
                  isHovered={hoveredConnectionId === conn.id}
                  onDelete={() => onConnectionDelete?.(conn.id)}
                />
              </g>
            );
          })}
        </svg>
      </svg>

      {/* Nodes */}
      <div
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
        }}
        className="absolute inset-0"
      >
        {nodes.map(node => (
          <div
            key={node.id}
            style={{
              position: 'absolute',
              left: `${node.position?.x || 0}px`,
              top: `${node.position?.y || 0}px`,
            }}
            onDragStart={(e) => {
              e.dataTransfer.effectAllowed = 'move';
            }}
            draggable
            onDragStart={() => {}}
            onDragEnd={(e) => {
              const deltaX = (e.clientX - pan.x) / zoom - (node.position?.x || 0);
              const deltaY = (e.clientY - pan.y) / zoom - (node.position?.y || 0);
              onNodeMoveFinish?.(node.id, {
                x: node.position.x + deltaX,
                y: node.position.y + deltaY,
              });
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              onNodeSelect?.(node.id);
            }}
          >
            <NodeCard
              node={node}
              isSelected={selectedNodeId === node.id}
              onSelect={() => onNodeSelect?.(node.id)}
              onDelete={() => onNodeDelete?.(node.id)}
              onDuplicate={() => onNodeDuplicate?.(node.id)}
              onDragStart={(e) => {
                e.dataTransfer.effectAllowed = 'move';
              }}
              getIcon={getNodeIcon}
            />
          </div>
        ))}
      </div>

      {/* Empty state */}
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500 mb-2">Arrastra nodos desde la paleta</p>
            <p className="text-sm text-gray-400">o usa el menú superior para comenzar</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(WorkflowCanvas);
