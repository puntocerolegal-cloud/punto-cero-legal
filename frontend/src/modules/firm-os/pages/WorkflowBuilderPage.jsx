import React, { useCallback, useEffect } from 'react';
import { Zap, Save, Download, Copy, Trash2 } from 'lucide-react';
import { useWorkflowBuilder } from '../hooks/useWorkflowBuilder';
import { LoadingState } from '../components/shared/LoadingState';
import WorkflowCanvas from '../components/workflow-builder/WorkflowCanvas';
import NodePalette from '../components/workflow-builder/NodePalette';
import ZoomControls from '../components/workflow-builder/ZoomControls';
import HistoryControls from '../components/workflow-builder/HistoryControls';
import WorkflowValidator from '../components/workflow-builder/WorkflowValidator';
import ExecutionPreview from '../components/workflow-builder/ExecutionPreview';

export function WorkflowBuilderPage() {
  const builder = useWorkflowBuilder();

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') {
          e.preventDefault();
          builder.undo();
        } else if (e.key === 'y' || (e.shiftKey && e.key === 'z')) {
          e.preventDefault();
          builder.redo();
        } else if (e.key === 'c') {
          e.preventDefault();
          builder.copy();
        } else if (e.key === 'v') {
          e.preventDefault();
          builder.paste();
        } else if (e.key === 's') {
          e.preventDefault();
          // Save action
        }
      } else if (e.key === 'Delete') {
        if (builder.selectedNodeId) {
          builder.removeNode(builder.selectedNodeId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [builder]);

  const handleNodeDragStart = useCallback((e, nodeType) => {
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('nodeType', nodeType);
  }, []);

  const handleCanvasDrop = useCallback((nodeType, position) => {
    builder.addNode(nodeType, position);
  }, [builder]);

  const handleZoomIn = useCallback(() => {
    builder.setZoom(Math.min(builder.zoom * 1.2, 2));
  }, [builder]);

  const handleZoomOut = useCallback(() => {
    builder.setZoom(Math.max(builder.zoom * 0.8, 0.5));
  }, [builder]);

  const handleZoomFit = useCallback(() => {
    builder.setZoom(1);
    builder.setPan({ x: 0, y: 0 });
  }, [builder]);

  const handleExport = useCallback(() => {
    const json = builder.exportJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workflow-${Date.now()}.json`;
    a.click();
  }, [builder]);

  const handleImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const success = builder.importJSON(event.target.result);
          if (!success) {
            alert('Error al importar workflow');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }, [builder]);

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 p-4 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center gap-2">
          <Zap size={24} className="text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Workflow Builder</h1>
        </div>

        <div className="flex gap-2">
          <button
            onClick={builder.clear}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Limpiar canvas"
          >
            <Trash2 size={16} />
            Limpiar
          </button>

          <button
            onClick={handleImport}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Importar workflow"
          >
            <Copy size={16} />
            Importar
          </button>

          <button
            onClick={handleExport}
            disabled={!builder.viewModel.isValid}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
            title="Exportar workflow"
          >
            <Download size={16} />
            Exportar
          </button>

          <button
            disabled={!builder.viewModel.isValid}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
            title="Guardar workflow"
          >
            <Save size={16} />
            Guardar
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden gap-4 p-4">
        {/* Left panel - Node Palette */}
        <div className="w-64 bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
          <NodePalette
            palette={builder.nodePalette}
            paletteByCategory={builder.paletteByCategory}
            onNodeDragStart={handleNodeDragStart}
          />
        </div>

        {/* Canvas */}
        <div className="flex-1 relative bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
          <WorkflowCanvas
            nodes={builder.nodes}
            connections={builder.connections}
            selectedNodeId={builder.selectedNodeId}
            zoom={builder.zoom}
            pan={builder.pan}
            onNodeSelect={builder.selectNode}
            onNodeMove={(id, pos) => builder.moveNode(id, pos)}
            onNodeMoveFinish={builder.finishMove}
            onNodeDelete={builder.removeNode}
            onNodeDuplicate={builder.duplicateNode}
            onConnectionDelete={builder.disconnect}
            onCanvasDrop={handleCanvasDrop}
            onCanvasPan={builder.setPan}
            onCanvasZoom={builder.setZoom}
          />

          {/* Zoom Controls */}
          <div className="absolute bottom-4 right-4 flex flex-col gap-2">
            <ZoomControls
              zoom={builder.zoom}
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
              onZoomFit={handleZoomFit}
            />

            <HistoryControls
              canUndo={builder.canUndo}
              canRedo={builder.canRedo}
              onUndo={builder.undo}
              onRedo={builder.redo}
              historyIndex={builder.historyIndex}
              historyLength={builder.historyLength}
            />
          </div>
        </div>

        {/* Right panel - Validation & Preview */}
        <div className="w-80 flex flex-col gap-4 overflow-y-auto">
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
            <WorkflowValidator validation={builder.validationView} />
          </div>

          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
            <ExecutionPreview preview={builder.executionPreview} />
          </div>

          {builder.selectedNode && (
            <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
              <h4 className="font-semibold text-sm text-gray-900 mb-2">Propiedades del Nodo</h4>
              <div className="space-y-2 text-xs">
                <div>
                  <p className="text-gray-600">Tipo</p>
                  <p className="font-medium text-gray-900">{builder.selectedNode.type}</p>
                </div>
                <div>
                  <p className="text-gray-600">Etiqueta</p>
                  <p className="font-medium text-gray-900">{builder.selectedNode.label}</p>
                </div>
                <div>
                  <p className="text-gray-600">Posición</p>
                  <p className="font-medium text-gray-900">
                    ({Math.round(builder.selectedNode.position.x)}, {Math.round(builder.selectedNode.position.y)})
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default WorkflowBuilderPage;
