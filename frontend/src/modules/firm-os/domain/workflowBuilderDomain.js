// Pure domain functions for workflow builder - NO React, NO side effects

export const NODE_TYPES = {
  TRIGGER: 'trigger',
  CONDITION: 'condition',
  ACTION: 'action',
  DELAY: 'delay',
  APPROVAL: 'approval',
  NOTIFICATION: 'notification',
  ASSIGNMENT: 'assignment',
  PRIORITY: 'priority',
  DEPARTMENT: 'department',
  DECISION: 'decision',
  MERGE: 'merge',
  END: 'end',
};

export function createNode(data) {
  if (!data || !data.type) return null;

  return {
    id: data.id || `node_${Date.now()}_${Math.random()}`,
    type: data.type,
    label: data.label || `${data.type}`,
    position: data.position || { x: 0, y: 0 },
    inputs: data.inputs || [],
    outputs: data.outputs || [],
    properties: data.properties || {},
    description: data.description || '',
    color: data.color || '#3b82f6',
    icon: data.icon || 'Zap',
    selected: false,
    data: data.data || {},
  };
}

export function createConnection(sourceId, targetId, data = {}) {
  if (!sourceId || !targetId) return null;

  return {
    id: data.id || `conn_${Date.now()}_${Math.random()}`,
    source: sourceId,
    target: targetId,
    type: data.type || 'default',
    label: data.label || '',
    data: data.data || {},
  };
}

export function createGraph(data = {}) {
  return {
    id: data.id || `graph_${Date.now()}`,
    name: data.name || 'Nuevo Workflow',
    description: data.description || '',
    nodes: Array.isArray(data.nodes) ? data.nodes : [],
    connections: Array.isArray(data.connections) ? data.connections : [],
    metadata: data.metadata || {},
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt || new Date().toISOString(),
  };
}

export function addNode(graph, node) {
  if (!graph || !node) return graph;

  return {
    ...graph,
    nodes: [...graph.nodes, node],
    updatedAt: new Date().toISOString(),
  };
}

export function removeNode(graph, nodeId) {
  if (!graph || !nodeId) return graph;

  return {
    ...graph,
    nodes: graph.nodes.filter(n => n.id !== nodeId),
    connections: graph.connections.filter(c => c.source !== nodeId && c.target !== nodeId),
    updatedAt: new Date().toISOString(),
  };
}

export function updateNode(graph, nodeId, updates) {
  if (!graph || !nodeId) return graph;

  return {
    ...graph,
    nodes: graph.nodes.map(n => n.id === nodeId ? { ...n, ...updates } : n),
    updatedAt: new Date().toISOString(),
  };
}

export function moveNode(graph, nodeId, position) {
  return updateNode(graph, nodeId, { position });
}

export function addConnection(graph, connection) {
  if (!graph || !connection) return graph;

  // Avoid duplicate connections
  const exists = graph.connections.some(c => c.source === connection.source && c.target === connection.target);
  if (exists) return graph;

  return {
    ...graph,
    connections: [...graph.connections, connection],
    updatedAt: new Date().toISOString(),
  };
}

export function removeConnection(graph, connectionId) {
  if (!graph || !connectionId) return graph;

  return {
    ...graph,
    connections: graph.connections.filter(c => c.id !== connectionId),
    updatedAt: new Date().toISOString(),
  };
}

export function detectCircularDependencies(graph) {
  if (!graph || graph.nodes.length === 0) return [];

  const visited = new Set();
  const recursionStack = new Set();
  const cycles = [];

  function dfs(nodeId, path = []) {
    visited.add(nodeId);
    recursionStack.add(nodeId);

    const outgoing = graph.connections.filter(c => c.source === nodeId);

    for (const conn of outgoing) {
      if (!visited.has(conn.target)) {
        if (dfs(conn.target, [...path, nodeId])) {
          return true;
        }
      } else if (recursionStack.has(conn.target)) {
        cycles.push({
          cycle: [...path, nodeId, conn.target],
          from: nodeId,
          to: conn.target,
        });
        return true;
      }
    }

    recursionStack.delete(nodeId);
    return false;
  }

  graph.nodes.forEach(node => {
    if (!visited.has(node.id)) {
      dfs(node.id);
    }
  });

  return cycles;
}

export function validateGraph(graph) {
  const errors = [];
  const warnings = [];

  if (!graph || graph.nodes.length === 0) {
    errors.push('El grafo debe contener al menos un nodo');
    return { valid: false, errors, warnings };
  }

  // Check for start nodes
  const startNodes = graph.nodes.filter(n => n.type === NODE_TYPES.TRIGGER);
  if (startNodes.length === 0) {
    errors.push('Debe existir un nodo Trigger (inicio)');
  }
  if (startNodes.length > 1) {
    errors.push('Solo puede haber un nodo Trigger (inicio)');
  }

  // Check for end nodes
  const endNodes = graph.nodes.filter(n => n.type === NODE_TYPES.END);
  if (endNodes.length === 0) {
    errors.push('Debe existir un nodo End (fin)');
  }

  // Check for circular dependencies
  const cycles = detectCircularDependencies(graph);
  if (cycles.length > 0) {
    errors.push(`Detectado ciclo: ${cycles[0].cycle.join(' → ')}`);
  }

  // Check for orphan nodes
  const connectedNodeIds = new Set();
  graph.connections.forEach(c => {
    connectedNodeIds.add(c.source);
    connectedNodeIds.add(c.target);
  });

  if (startNodes.length > 0) {
    connectedNodeIds.add(startNodes[0].id);
  }

  const orphans = graph.nodes.filter(n => !connectedNodeIds.has(n.id));
  if (orphans.length > 0) {
    warnings.push(`${orphans.length} nodo(s) desconectado(s)`);
  }

  // Check for unreachable end nodes
  const reachableFromStart = new Set();
  if (startNodes.length > 0) {
    function dfs(nodeId) {
      reachableFromStart.add(nodeId);
      const outgoing = graph.connections.filter(c => c.source === nodeId);
      outgoing.forEach(c => {
        if (!reachableFromStart.has(c.target)) {
          dfs(c.target);
        }
      });
    }
    dfs(startNodes[0].id);
  }

  endNodes.forEach(end => {
    if (!reachableFromStart.has(end.id)) {
      warnings.push(`Nodo End "${end.label}" no es alcanzable desde el inicio`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export function sortExecutionOrder(graph) {
  if (!graph || graph.nodes.length === 0) return [];

  const order = [];
  const visited = new Set();
  const visiting = new Set();

  function dfs(nodeId) {
    if (visited.has(nodeId)) return;
    if (visiting.has(nodeId)) return; // Skip if in current path (cycle handling)

    visiting.add(nodeId);

    const node = graph.nodes.find(n => n.id === nodeId);
    if (node) {
      const incoming = graph.connections.filter(c => c.target === nodeId);
      incoming.forEach(c => dfs(c.source));

      order.push(node);
      visited.add(nodeId);
    }

    visiting.delete(nodeId);
  }

  graph.nodes.forEach(node => {
    if (!visited.has(node.id)) {
      dfs(node.id);
    }
  });

  return order;
}

export function buildExecutionPlan(graph) {
  if (!graph) return { steps: [], order: [], errors: [] };

  const validation = validateGraph(graph);
  if (!validation.valid) {
    return {
      steps: [],
      order: [],
      errors: validation.errors,
    };
  }

  const sorted = sortExecutionOrder(graph);
  const steps = sorted.map((node, idx) => ({
    step: idx + 1,
    nodeId: node.id,
    type: node.type,
    label: node.label,
    description: node.description,
    properties: node.properties,
  }));

  return {
    steps,
    order: sorted,
    errors: validation.errors,
    warnings: validation.warnings,
  };
}

export function groupNodes(graph) {
  if (!graph) return {};

  const grouped = {};
  Object.values(NODE_TYPES).forEach(type => {
    grouped[type] = graph.nodes.filter(n => n.type === type);
  });

  return grouped;
}

export function buildGraphStatistics(graph) {
  if (!graph) {
    return {
      nodeCount: 0,
      connectionCount: 0,
      nodesByType: {},
      depth: 0,
      width: 0,
    };
  }

  const nodesByType = {};
  Object.values(NODE_TYPES).forEach(type => {
    nodesByType[type] = graph.nodes.filter(n => n.type === type).length;
  });

  // Calculate depth (longest path)
  const depths = new Map();
  const startNodes = graph.nodes.filter(n => n.type === NODE_TYPES.TRIGGER);
  
  function calculateDepth(nodeId, currentDepth = 1) {
    if (depths.has(nodeId) && depths.get(nodeId) >= currentDepth) return;
    depths.set(nodeId, currentDepth);

    const outgoing = graph.connections.filter(c => c.source === nodeId);
    outgoing.forEach(c => calculateDepth(c.target, currentDepth + 1));
  }

  startNodes.forEach(node => calculateDepth(node.id));
  const maxDepth = depths.size > 0 ? Math.max(...depths.values()) : 0;

  return {
    nodeCount: graph.nodes.length,
    connectionCount: graph.connections.length,
    nodesByType,
    depth: maxDepth,
    width: Math.max(...graph.nodes.map(n => n.position?.x || 0), 0),
  };
}

export function serializeGraph(graph) {
  if (!graph) return '{}';

  try {
    return JSON.stringify({
      ...graph,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return '{}';
  }
}

export function deserializeGraph(json) {
  if (!json || typeof json !== 'string') return null;

  try {
    const parsed = JSON.parse(json);
    return createGraph(parsed);
  } catch (error) {
    return null;
  }
}

export function cloneGraph(graph) {
  if (!graph) return null;

  const nodeMap = new Map();
  const clonedNodes = graph.nodes.map(node => {
    const cloned = { ...node, id: `node_${Date.now()}_${Math.random()}` };
    nodeMap.set(node.id, cloned.id);
    return cloned;
  });

  const clonedConnections = graph.connections.map(conn => ({
    ...conn,
    id: `conn_${Date.now()}_${Math.random()}`,
    source: nodeMap.get(conn.source) || conn.source,
    target: nodeMap.get(conn.target) || conn.target,
  }));

  return createGraph({
    ...graph,
    id: undefined,
    name: `${graph.name} (Copia)`,
    nodes: clonedNodes,
    connections: clonedConnections,
  });
}

export function getNodeIcon(nodeType) {
  const icons = {
    [NODE_TYPES.TRIGGER]: 'Zap',
    [NODE_TYPES.CONDITION]: 'Filter',
    [NODE_TYPES.ACTION]: 'Zap',
    [NODE_TYPES.DELAY]: 'Clock',
    [NODE_TYPES.APPROVAL]: 'CheckCircle',
    [NODE_TYPES.NOTIFICATION]: 'Bell',
    [NODE_TYPES.ASSIGNMENT]: 'User',
    [NODE_TYPES.PRIORITY]: 'AlertCircle',
    [NODE_TYPES.DEPARTMENT]: 'Building2',
    [NODE_TYPES.DECISION]: 'GitBranch',
    [NODE_TYPES.MERGE]: 'GitMerge',
    [NODE_TYPES.END]: 'CheckCircle2',
  };

  return icons[nodeType] || 'Zap';
}

export function getNodeColor(nodeType) {
  const colors = {
    [NODE_TYPES.TRIGGER]: '#10b981',
    [NODE_TYPES.CONDITION]: '#f59e0b',
    [NODE_TYPES.ACTION]: '#3b82f6',
    [NODE_TYPES.DELAY]: '#8b5cf6',
    [NODE_TYPES.APPROVAL]: '#ec4899',
    [NODE_TYPES.NOTIFICATION]: '#06b6d4',
    [NODE_TYPES.ASSIGNMENT]: '#14b8a6',
    [NODE_TYPES.PRIORITY]: '#f97316',
    [NODE_TYPES.DEPARTMENT]: '#6366f1',
    [NODE_TYPES.DECISION]: '#d946ef',
    [NODE_TYPES.MERGE]: '#64748b',
    [NODE_TYPES.END]: '#ef4444',
  };

  return colors[nodeType] || '#6b7280';
}

export function getNodeLabel(nodeType) {
  const labels = {
    [NODE_TYPES.TRIGGER]: 'Trigger',
    [NODE_TYPES.CONDITION]: 'Condición',
    [NODE_TYPES.ACTION]: 'Acción',
    [NODE_TYPES.DELAY]: 'Espera',
    [NODE_TYPES.APPROVAL]: 'Aprobación',
    [NODE_TYPES.NOTIFICATION]: 'Notificación',
    [NODE_TYPES.ASSIGNMENT]: 'Asignación',
    [NODE_TYPES.PRIORITY]: 'Prioridad',
    [NODE_TYPES.DEPARTMENT]: 'Departamento',
    [NODE_TYPES.DECISION]: 'Decisión',
    [NODE_TYPES.MERGE]: 'Fusión',
    [NODE_TYPES.END]: 'Fin',
  };

  return labels[nodeType] || nodeType;
}
