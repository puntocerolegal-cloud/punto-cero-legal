// Application layer - Orchestrates bulk operations
// NO UI logic, NO components, NO side effects

import {
  buildBulkSummary,
  groupSelection,
  getActionAvailability,
  canExecuteAction,
} from '../domain/bulkOperationsDomain';

export function buildLawyersBulkViewModel(lawyers, selectedIds) {
  if (!Array.isArray(lawyers)) {
    lawyers = [];
  }
  if (!Array.isArray(selectedIds)) {
    selectedIds = [];
  }

  const summary = buildBulkSummary(lawyers, selectedIds);
  const availability = getActionAvailability(selectedIds.length);

  return {
    section: 'lawyers',
    selectedIds,
    summary,
    availability,
    actions: [
      {
        id: 'status',
        label: 'Cambiar estado',
        icon: 'CheckCircle2',
        enabled: canExecuteAction(selectedIds, 'status'),
        options: ['Activo', 'Inactivo'],
      },
      {
        id: 'department',
        label: 'Cambiar departamento',
        icon: 'FolderKanban',
        enabled: canExecuteAction(selectedIds, 'department'),
        options: [...new Set(lawyers.map(l => l.department).filter(Boolean))],
      },
      {
        id: 'export',
        label: 'Exportar selección',
        icon: 'Download',
        enabled: canExecuteAction(selectedIds, 'export'),
      },
      {
        id: 'remove',
        label: 'Eliminar de la lista',
        icon: 'Trash2',
        enabled: canExecuteAction(selectedIds, 'delete'),
        confirmRequired: true,
      },
    ],
    statusDistribution: summary.groups,
  };
}

export function buildDepartmentsBulkViewModel(departments, selectedIds) {
  if (!Array.isArray(departments)) {
    departments = [];
  }
  if (!Array.isArray(selectedIds)) {
    selectedIds = [];
  }

  const summary = buildBulkSummary(departments, selectedIds);
  const availability = getActionAvailability(selectedIds.length);

  return {
    section: 'departments',
    selectedIds,
    summary,
    availability,
    actions: [
      {
        id: 'status',
        label: 'Cambiar estado',
        icon: 'CheckCircle2',
        enabled: canExecuteAction(selectedIds, 'status'),
        options: ['Activo', 'Inactivo'],
      },
      {
        id: 'export',
        label: 'Exportar selección',
        icon: 'Download',
        enabled: canExecuteAction(selectedIds, 'export'),
      },
    ],
  };
}

export function buildOfficesBulkViewModel(offices, selectedIds) {
  if (!Array.isArray(offices)) {
    offices = [];
  }
  if (!Array.isArray(selectedIds)) {
    selectedIds = [];
  }

  const summary = buildBulkSummary(offices, selectedIds);
  const availability = getActionAvailability(selectedIds.length);

  return {
    section: 'offices',
    selectedIds,
    summary,
    availability,
    actions: [
      {
        id: 'status',
        label: 'Cambiar estado',
        icon: 'CheckCircle2',
        enabled: canExecuteAction(selectedIds, 'status'),
        options: ['Activa', 'Inactiva'],
      },
      {
        id: 'export',
        label: 'Exportar selección',
        icon: 'Download',
        enabled: canExecuteAction(selectedIds, 'export'),
      },
    ],
  };
}

export function buildAssignmentsBulkViewModel(cases, selectedIds) {
  if (!Array.isArray(cases)) {
    cases = [];
  }
  if (!Array.isArray(selectedIds)) {
    selectedIds = [];
  }

  const summary = buildBulkSummary(cases, selectedIds);
  const availability = getActionAvailability(selectedIds.length);

  return {
    section: 'assignments',
    selectedIds,
    summary,
    availability,
    actions: [
      {
        id: 'priority',
        label: 'Cambiar prioridad',
        icon: 'AlertCircle',
        enabled: canExecuteAction(selectedIds, 'priority'),
        options: ['Baja', 'Media', 'Alta', 'Crítica'],
      },
      {
        id: 'reviewed',
        label: 'Marcar como revisado',
        icon: 'CheckCircle2',
        enabled: canExecuteAction(selectedIds, 'default'),
      },
      {
        id: 'export',
        label: 'Exportar selección',
        icon: 'Download',
        enabled: canExecuteAction(selectedIds, 'export'),
      },
    ],
  };
}

export function buildBulkToolbarViewModel(selectedCount, totalCount) {
  const percentage = totalCount > 0 ? Math.round((selectedCount / totalCount) * 100) : 0;
  const isAll = selectedCount === totalCount && totalCount > 0;

  return {
    selectedCount,
    totalCount,
    percentage,
    isAll,
    actions: {
      selectAll: true,
      clearAll: selectedCount > 0,
      invert: totalCount > 0,
    },
    messages: {
      noSelection: 'Sin selección',
      singleSelection: `${selectedCount} elemento seleccionado`,
      multipleSelection: `${selectedCount} elementos seleccionados (${percentage}%)`,
      allSelected: `Todos seleccionados (${totalCount})`,
    },
  };
}
