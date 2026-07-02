import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  createGraph,
  createNode,
  createConnection,
  addNode,
  removeNode,
  updateNode,
  moveNode,
  addConnection,
  removeConnection,
  serializeGraph,
  deserializeGraph,
  cloneGraph,
} from '../domain/workflowBuilderDomain';
import {
  buildWorkflowBuilderViewModel,
  buildNodePalette,
  buildExecutionPreview,
  buildValidationView,
  buildMiniMap,
  buildToolbar,
  groupNodesByCategory,
} from '../application/workflowBuilderApplication';

const STORAGE_KEY = 'firm-os/workflow-builder';
const MAX_HISTORY = 100;

export function useWorkflowBuilder(initialGraph = null) {
  const [graph, setGraph] = useState(() => {
    if (initialGraph) return initialGraph;

    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const deserialized = deserializeGraph(stored);
          if (deserialized) return deserialized;
        }
      }
    } catch (error) {
      console.warn('Failed to load workflow builder state:', error);
    }

    return createGraph();
  });

  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [clipboard, setClipboard] = useState(null);

  // Persist to localStorage
  const persistGraph = useCallback((g) => {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, serializeGraph(g));
      }
    } catch (error) {
      console.warn('Failed to persist workflow builder state:', error);
    }
  }, []);

  // Add to history
  const addToHistory = useCallback((newGraph) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newGraph);
    if (newHistory.length > MAX_HISTORY) {
      newHistory.shift();
    }
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setGraph(newGraph);
    persistGraph(newGraph);
  }, [history, historyIndex, persistGraph]);

  // Actions
  const addNodeAction = useCallback((nodeType, position) => {
    const node = createNode({
      type: nodeType,
      position,
    });
    const newGraph = addNode(graph, node);
    addToHistory(newGraph);
    return node;
  }, [graph, addToHistory]);

  const removeNodeAction = useCallback((nodeId) => {
    const newGraph = removeNode(graph, nodeId);
    addToHistory(newGraph);
    setSelectedNodeId(null);
  }, [graph, addToHistory]);

  const updateNodeAction = useCallback((nodeId, updates) => {
    const newGraph = updateNode(graph, nodeId, updates);
    addToHistory(newGraph);
  }, [graph, addToHistory]);

  const moveNodeAction = useCallback((nodeId, position) => {
    const newGraph = moveNode(graph, nodeId, position);
    setGraph(newGraph); // Don't add to history for drag
  }, [graph]);

  const finishMoveAction = useCallback((nodeId, position) => {
    const newGraph = moveNode(graph, nodeId, position);
    addToHistory(newGraph);
  }, [graph, addToHistory]);

  const connectNodesAction = useCallback((sourceId, targetId) => {
    const connection = createConnection(sourceId, targetId);
    const newGraph = addConnection(graph, connection);
    addToHistory(newGraph);
    return connection;
  }, [graph, addToHistory]);

  const disconnectAction = useCallback((connectionId) => {
    const newGraph = removeConnection(graph, connectionId);
    addToHistory(newGraph);
  }, [graph, addToHistory]);

  const deleteConnectionAction = useCallback((sourceId, targetId) => {
    const connection = graph.connections.find(c => c.source === sourceId && c.target === targetId);
    if (connection) {
      disconnectAction(connection.id);
    }
  }, [graph.connections, disconnectAction]);

  const duplicateNodeAction = useCallback((nodeId) => {
    const node = graph.nodes.find(n => n.id === nodeId);
    if (node) {
      const cloned = createNode({
        ...node,
        position: { x: node.position.x + 100, y: node.position.y + 100 },
      });
      const newGraph = addNode(graph, cloned);
      addToHistory(newGraph);
      setSelectedNodeId(cloned.id);
      return cloned;
    }
  }, [graph, addToHistory]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const newGraph = history[newIndex];
      setGraph(newGraph);
      persistGraph(newGraph);
    }
  }, [history, historyIndex, persistGraph]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const newGraph = history[newIndex];
      setGraph(newGraph);
      persistGraph(newGraph);
    }
  }, [history, historyIndex, persistGraph]);

  const copy = useCallback(() => {
    const node = graph.nodes.find(n => n.id === selectedNodeId);
    if (node) {
      setClipboard(node);
    }
  }, [graph.nodes, selectedNodeId]);

  const paste = useCallback(() => {
    if (clipboard) {
      const pasted = createNode({
        ...clipboard,
        position: { x: clipboard.position.x + 50, y: clipboard.position.y + 50 },
      });
      const newGraph = addNode(graph, pasted);
      addToHistory(newGraph);
      setSelectedNodeId(pasted.id);
    }
  }, [clipboard, graph, addToHistory]);

  const clear = useCallback(() => {
    const newGraph = createGraph();
    addToHistory(newGraph);
    setSelectedNodeId(null);
  }, [addToHistory]);

  const exportJSON = useCallback(() => {
    return serializeGraph(graph);
  }, [graph]);

  const importJSON = useCallback((json) => {
    const imported = deserializeGraph(json);
    if (imported) {
      addToHistory(imported);
      return true;
    }
    return false;
  }, [addToHistory]);

  // Memoized view models
  const viewModel = useMemo(() => {
    return buildWorkflowBuilderViewModel(graph);
  }, [graph]);

  const nodePalette = useMemo(() => {
    return buildNodePalette();
  }, []);

  const paletteByCategory = useMemo(() => {
    return groupNodesByCategory(nodePalette);
  }, [nodePalette]);

  const executionPreview = useMemo(() => {
    return buildExecutionPreview(graph);
  }, [graph]);

  const validationView = useMemo(() => {
    return buildValidationView(graph);
  }, [graph]);

  const miniMap = useMemo(() => {
    return buildMiniMap(graph);
  }, [graph]);

  const toolbar = useMemo(() => {
    return buildToolbar(viewModel.isValid, history.length > 0, historyIndex > 0, historyIndex < history.length - 1);
  }, [viewModel.isValid, history.length, historyIndex]);

  const selectedNode = useMemo(() => {
    return graph.nodes.find(n => n.id === selectedNodeId);
  }, [graph.nodes, selectedNodeId]);

  return {
    // State
    graph,
    nodes: graph.nodes,
    connections: graph.connections,
    selectedNode,
    selectedNodeId,
    zoom,
    pan,
    clipboard,

    // View Models
    viewModel,
    nodePalette,
    paletteByCategory,
    executionPreview,
    validationView,
    miniMap,
    toolbar,

    // Node Actions
    addNode: addNodeAction,
    removeNode: removeNodeAction,
    updateNode: updateNodeAction,
    moveNode: moveNodeAction,
    finishMove: finishMoveAction,
    duplicateNode: duplicateNodeAction,
    selectNode: setSelectedNodeId,

    // Connection Actions
    connectNodes: connectNodesAction,
    disconnect: disconnectAction,
    deleteConnection: deleteConnectionAction,

    // History
    undo,
    redo,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
    historyLength: history.length,
    historyIndex,

    // Clipboard
    copy,
    paste,
    canPaste: clipboard !== null,

    // Utilities
    clear,
    exportJSON,
    importJSON,

    // Camera
    setZoom,
    setPan,

    // Graph
    getNode: useCallback((id) => graph.nodes.find(n => n.id === id), [graph.nodes]),
    getConnection: useCallback((id) => graph.connections.find(c => c.id === id), [graph.connections]),
    getConnectionsByNode: useCallback((nodeId) => ({
      incoming: graph.connections.filter(c => c.target === nodeId),
      outgoing: graph.connections.filter(c => c.source === nodeId),
    }), [graph.connections]),
  };
}
