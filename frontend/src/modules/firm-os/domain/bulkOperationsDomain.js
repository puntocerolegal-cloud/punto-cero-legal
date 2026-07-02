// Pure domain functions for bulk operations - NO React, NO side effects

export function toggleSelection(selectedIds, itemId) {
  if (!Array.isArray(selectedIds)) {
    return [itemId];
  }

  const index = selectedIds.indexOf(itemId);
  if (index > -1) {
    return selectedIds.filter((_, i) => i !== index);
  } else {
    return [...selectedIds, itemId];
  }
}

export function selectAll(items, idField = 'id') {
  if (!Array.isArray(items) || items.length === 0) {
    return [];
  }
  return items.map(item => item[idField]);
}

export function clearSelection() {
  return [];
}

export function invertSelection(selectedIds, allIds) {
  if (!Array.isArray(selectedIds) || !Array.isArray(allIds)) {
    return [];
  }

  const selectedSet = new Set(selectedIds);
  const inverted = allIds.filter(id => !selectedSet.has(id));
  return inverted;
}

export function countSelection(selectedIds) {
  return Array.isArray(selectedIds) ? selectedIds.length : 0;
}

export function buildSelectionMap(selectedIds) {
  if (!Array.isArray(selectedIds)) {
    return {};
  }

  const map = {};
  selectedIds.forEach(id => {
    map[id] = true;
  });
  return map;
}

export function isSelected(selectionMap, itemId) {
  if (!selectionMap || typeof selectionMap !== 'object') {
    return false;
  }
  return selectionMap[itemId] === true;
}

export function applyBulkStatus(items, selectedIds, newStatus) {
  if (!Array.isArray(items) || !Array.isArray(selectedIds)) {
    return items;
  }

  const selectionSet = new Set(selectedIds);
  return items.map(item => {
    if (selectionSet.has(item.id)) {
      return { ...item, status: newStatus };
    }
    return item;
  });
}

export function applyBulkDepartment(items, selectedIds, newDepartment) {
  if (!Array.isArray(items) || !Array.isArray(selectedIds)) {
    return items;
  }

  const selectionSet = new Set(selectedIds);
  return items.map(item => {
    if (selectionSet.has(item.id)) {
      return { ...item, department: newDepartment };
    }
    return item;
  });
}

export function applyBulkOffice(items, selectedIds, newOffice) {
  if (!Array.isArray(items) || !Array.isArray(selectedIds)) {
    return items;
  }

  const selectionSet = new Set(selectedIds);
  return items.map(item => {
    if (selectionSet.has(item.id)) {
      return { ...item, office: newOffice };
    }
    return item;
  });
}

export function applyBulkPriority(items, selectedIds, newPriority) {
  if (!Array.isArray(items) || !Array.isArray(selectedIds)) {
    return items;
  }

  const selectionSet = new Set(selectedIds);
  return items.map(item => {
    if (selectionSet.has(item.id)) {
      return { ...item, priority: newPriority };
    }
    return item;
  });
}

export function removeSelected(items, selectedIds) {
  if (!Array.isArray(items) || !Array.isArray(selectedIds)) {
    return items;
  }

  const selectionSet = new Set(selectedIds);
  return items.filter(item => !selectionSet.has(item.id));
}

export function groupSelection(items, selectedIds, groupField) {
  if (!Array.isArray(items) || !Array.isArray(selectedIds) || !groupField) {
    return {};
  }

  const selectionSet = new Set(selectedIds);
  const groups = {};

  items.forEach(item => {
    if (selectionSet.has(item.id)) {
      const key = item[groupField] || 'sin-asignar';
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
    }
  });

  return groups;
}

export function validateSelection(selectedIds, minRequired = 1) {
  if (!Array.isArray(selectedIds)) {
    return { valid: false, error: 'Selección inválida' };
  }

  if (selectedIds.length === 0) {
    return { valid: false, error: 'Selecciona al menos un elemento' };
  }

  if (selectedIds.length < minRequired) {
    return { valid: false, error: `Se requieren al menos ${minRequired} elemento(s)` };
  }

  return { valid: true };
}

export function canExecuteAction(selectedIds, action = 'default') {
  if (!Array.isArray(selectedIds) || selectedIds.length === 0) {
    return false;
  }

  const rules = {
    delete: selectedIds.length > 0,
    export: selectedIds.length > 0,
    status: selectedIds.length > 0,
    department: selectedIds.length > 0,
    office: selectedIds.length > 0,
    priority: selectedIds.length > 0,
    default: selectedIds.length > 0,
  };

  return rules[action] !== undefined ? rules[action] : rules.default;
}

export function buildBulkSummary(items, selectedIds) {
  if (!Array.isArray(items) || !Array.isArray(selectedIds)) {
    return {
      count: 0,
      percentage: 0,
      groups: {},
    };
  }

  const selectionSet = new Set(selectedIds);
  const selected = items.filter(item => selectionSet.has(item.id));
  const total = items.length;
  const percentage = total > 0 ? Math.round((selectedIds.length / total) * 100) : 0;

  const groups = {};
  selected.forEach(item => {
    const status = item.status || 'sin-estado';
    groups[status] = (groups[status] || 0) + 1;
  });

  return {
    count: selectedIds.length,
    total,
    percentage,
    groups,
    isAll: selectedIds.length === total && total > 0,
  };
}

export function getSelectedItems(items, selectedIds) {
  if (!Array.isArray(items) || !Array.isArray(selectedIds)) {
    return [];
  }

  const selectionSet = new Set(selectedIds);
  return items.filter(item => selectionSet.has(item.id));
}

export function getActionAvailability(selectedCount) {
  return {
    singleItemActions: selectedCount === 1,
    multipleActions: selectedCount > 0,
    bulkActions: selectedCount > 1,
  };
}
