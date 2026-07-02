// Application layer - Orchestrates workflow builder domain
// NO UI logic, NO components, NO side effects

import {
  validateGraph,
  buildExecutionPlan,
  buildGraphStatistics,
  NODE_TYPES,
  getNodeIcon,
  getNodeColor,
  getNodeLabel,
} from '../domain/workflowBuilderDomain';

export function buildWorkflowBuilderViewModel(graph) {
  if (!graph) {
    return {
      graph: null,
      validation: { valid: false, errors: [], warnings: [] },
      executionPlan: { steps: [], order: [], errors: [] },
      statistics: {},
      isValid: false,
    };
  }

  const validation = validateGraph(graph);
  const executionPlan = buildExecutionPlan(graph);
  const statistics = buildGraphStatistics(graph);

  return {
    graph,
    validation,
    executionPlan,
    statistics,
    isValid: validation.valid,
    nodeCount: graph.nodes.length,
    connectionCount: graph.connections.length,
    errors: validation.errors,
    warnings: validation.warnings,
  };
}

export function buildNodePalette() {
  return [
    {
      type: NODE_TYPES.TRIGGER,
      label: getNodeLabel(NODE_TYPES.TRIGGER),
      icon: getNodeIcon(NODE_TYPES.TRIGGER),
      color: getNodeColor(NODE_TYPES.TRIGGER),
      description: 'Inicia el workflow',
      category: 'Inicio',
    },
    {
      type: NODE_TYPES.CONDITION,
      label: getNodeLabel(NODE_TYPES.CONDITION),
      icon: getNodeIcon(NODE_TYPES.CONDITION),
      color: getNodeColor(NODE_TYPES.CONDITION),
      description: 'Evalúa una condición',
      category: 'Lógica',
    },
    {
      type: NODE_TYPES.DECISION,
      label: getNodeLabel(NODE_TYPES.DECISION),
      icon: getNodeIcon(NODE_TYPES.DECISION),
      color: getNodeColor(NODE_TYPES.DECISION),
      description: 'Bifurcación condicional',
      category: 'Lógica',
    },
    {
      type: NODE_TYPES.MERGE,
      label: getNodeLabel(NODE_TYPES.MERGE),
      icon: getNodeIcon(NODE_TYPES.MERGE),
      color: getNodeColor(NODE_TYPES.MERGE),
      description: 'Fusiona múltiples caminos',
      category: 'Lógica',
    },
    {
      type: NODE_TYPES.ACTION,
      label: getNodeLabel(NODE_TYPES.ACTION),
      icon: getNodeIcon(NODE_TYPES.ACTION),
      color: getNodeColor(NODE_TYPES.ACTION),
      description: 'Ejecuta una acción',
      category: 'Acciones',
    },
    {
      type: NODE_TYPES.NOTIFICATION,
      label: getNodeLabel(NODE_TYPES.NOTIFICATION),
      icon: getNodeIcon(NODE_TYPES.NOTIFICATION),
      color: getNodeColor(NODE_TYPES.NOTIFICATION),
      description: 'Envía una notificación',
      category: 'Acciones',
    },
    {
      type: NODE_TYPES.ASSIGNMENT,
      label: getNodeLabel(NODE_TYPES.ASSIGNMENT),
      icon: getNodeIcon(NODE_TYPES.ASSIGNMENT),
      color: getNodeColor(NODE_TYPES.ASSIGNMENT),
      description: 'Asigna a una persona',
      category: 'Acciones',
    },
    {
      type: NODE_TYPES.PRIORITY,
      label: getNodeLabel(NODE_TYPES.PRIORITY),
      icon: getNodeIcon(NODE_TYPES.PRIORITY),
      color: getNodeColor(NODE_TYPES.PRIORITY),
      description: 'Actualiza prioridad',
      category: 'Acciones',
    },
    {
      type: NODE_TYPES.DEPARTMENT,
      label: getNodeLabel(NODE_TYPES.DEPARTMENT),
      icon: getNodeIcon(NODE_TYPES.DEPARTMENT),
      color: getNodeColor(NODE_TYPES.DEPARTMENT),
      description: 'Cambia departamento',
      category: 'Acciones',
    },
    {
      type: NODE_TYPES.APPROVAL,
      label: getNodeLabel(NODE_TYPES.APPROVAL),
      icon: getNodeIcon(NODE_TYPES.APPROVAL),
      color: getNodeColor(NODE_TYPES.APPROVAL),
      description: 'Requiere aprobación',
      category: 'Control',
    },
    {
      type: NODE_TYPES.DELAY,
      label: getNodeLabel(NODE_TYPES.DELAY),
      icon: getNodeIcon(NODE_TYPES.DELAY),
      color: getNodeColor(NODE_TYPES.DELAY),
      description: 'Pausa el flujo',
      category: 'Control',
    },
    {
      type: NODE_TYPES.END,
      label: getNodeLabel(NODE_TYPES.END),
      icon: getNodeIcon(NODE_TYPES.END),
      color: getNodeColor(NODE_TYPES.END),
      description: 'Finaliza el workflow',
      category: 'Fin',
    },
  ];
}

export function buildExecutionPreview(graph) {
  if (!graph) {
    return {
      executionOrder: [],
      conditions: [],
      actions: [],
      estimatedTime: 0,
      warnings: [],
      errors: [],
    };
  }

  const validation = validateGraph(graph);
  const executionPlan = buildExecutionPlan(graph);

  const conditions = graph.nodes.filter(n => n.type === NODE_TYPES.CONDITION || n.type === NODE_TYPES.DECISION);
  const actions = graph.nodes.filter(n => [
    NODE_TYPES.ACTION,
    NODE_TYPES.NOTIFICATION,
    NODE_TYPES.ASSIGNMENT,
    NODE_TYPES.PRIORITY,
    NODE_TYPES.DEPARTMENT,
  ].includes(n.type));

  return {
    executionOrder: executionPlan.steps,
    conditionsCount: conditions.length,
    actionsCount: actions.length,
    conditions: conditions.map(c => ({
      nodeId: c.id,
      label: c.label,
      description: c.description,
      properties: c.properties,
    })),
    actions: actions.map(a => ({
      nodeId: a.id,
      label: a.label,
      type: a.type,
      description: a.description,
      properties: a.properties,
    })),
    estimatedTime: executionPlan.steps.length * 100, // ms per step
    warnings: validation.warnings,
    errors: validation.errors,
    isValid: validation.valid,
  };
}

export function buildValidationView(graph) {
  if (!graph) {
    return {
      isValid: false,
      errors: [],
      warnings: [],
      suggestions: [],
    };
  }

  const validation = validateGraph(graph);
  const suggestions = [];

  if (graph.nodes.length === 0) {
    suggestions.push('Comienza agregando un nodo Trigger');
  }

  if (!graph.nodes.some(n => n.type === NODE_TYPES.TRIGGER)) {
    suggestions.push('Agrega un nodo Trigger para iniciar el workflow');
  }

  if (!graph.nodes.some(n => n.type === NODE_TYPES.END)) {
    suggestions.push('Agrega un nodo End para finalizar el workflow');
  }

  const orphans = graph.nodes.filter(n => {
    const hasIncoming = graph.connections.some(c => c.target === n.id);
    const hasOutgoing = graph.connections.some(c => c.source === n.id);
    return !hasIncoming && !hasOutgoing && n.type !== NODE_TYPES.TRIGGER;
  });

  if (orphans.length > 0) {
    suggestions.push(`Conecta ${orphans.length} nodo(s) desconectado(s)`);
  }

  return {
    isValid: validation.valid,
    errors: validation.errors,
    warnings: validation.warnings,
    suggestions,
    errorCount: validation.errors.length,
    warningCount: validation.warnings.length,
  };
}

export function buildMiniMap(graph, canvasSize = { width: 1200, height: 600 }) {
  if (!graph || graph.nodes.length === 0) {
    return {
      scale: 0,
      positions: [],
      size: { width: 0, height: 0 },
    };
  }

  const positions = graph.nodes.map(n => ({
    id: n.id,
    x: n.position?.x || 0,
    y: n.position?.y || 0,
  }));

  const maxX = Math.max(...positions.map(p => p.x), 0);
  const maxY = Math.max(...positions.map(p => p.y), 0);

  const scaleX = maxX > 0 ? canvasSize.width / maxX : 1;
  const scaleY = maxY > 0 ? canvasSize.height / maxY : 1;
  const scale = Math.min(scaleX, scaleY, 1);

  return {
    scale,
    positions,
    size: { width: maxX, height: maxY },
    canvasSize,
  };
}

export function buildToolbar(isValid, hasHistory, canUndo, canRedo) {
  return {
    canSave: isValid,
    canExport: isValid,
    canUndo: canUndo,
    canRedo: canRedo,
    canValidate: true,
    canAutoLayout: true,
    canZoomFit: true,
    buttons: [
      { id: 'save', label: 'Guardar', enabled: isValid, icon: 'Save' },
      { id: 'export', label: 'Exportar', enabled: isValid, icon: 'Download' },
      { id: 'undo', label: 'Deshacer', enabled: canUndo, icon: 'Undo' },
      { id: 'redo', label: 'Rehacer', enabled: canRedo, icon: 'Redo' },
      { id: 'validate', label: 'Validar', enabled: true, icon: 'CheckCircle' },
      { id: 'autoLayout', label: 'Auto Layout', enabled: true, icon: 'Layout' },
      { id: 'zoomFit', label: 'Ajustar vista', enabled: true, icon: 'ZoomIn' },
    ],
  };
}

export function groupNodesByCategory(nodePalette) {
  const grouped = {};

  nodePalette.forEach(node => {
    if (!grouped[node.category]) {
      grouped[node.category] = [];
    }
    grouped[node.category].push(node);
  });

  return grouped;
}
