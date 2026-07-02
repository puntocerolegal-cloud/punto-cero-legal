import { useState, useCallback, useMemo } from 'react';
import {
  toggleSelection,
  selectAll,
  clearSelection,
  invertSelection,
  countSelection,
  buildSelectionMap,
  isSelected,
} from '../domain/bulkOperationsDomain';

export function useBulkSelection(items = [], idField = 'id') {
  const [selectedIds, setSelectedIds] = useState([]);

  const selectionMap = useMemo(() => buildSelectionMap(selectedIds), [selectedIds]);

  const allIds = useMemo(() => {
    if (!Array.isArray(items)) {
      return [];
    }
    return items.map(item => item[idField]);
  }, [items, idField]);

  const handleToggleSelection = useCallback((itemId) => {
    const updated = toggleSelection(selectedIds, itemId);
    setSelectedIds(updated);
  }, [selectedIds]);

  const handleSelectAll = useCallback(() => {
    const allSelected = selectAll(items, idField);
    setSelectedIds(allSelected);
  }, [items, idField]);

  const handleClearSelection = useCallback(() => {
    setSelectedIds(clearSelection());
  }, []);

  const handleInvertSelection = useCallback(() => {
    const inverted = invertSelection(selectedIds, allIds);
    setSelectedIds(inverted);
  }, [selectedIds, allIds]);

  const handleSetSelection = useCallback((newIds) => {
    if (Array.isArray(newIds)) {
      setSelectedIds(newIds);
    }
  }, []);

  const selectedCount = useMemo(() => countSelection(selectedIds), [selectedIds]);

  const isItemSelected = useCallback((itemId) => {
    return isSelected(selectionMap, itemId);
  }, [selectionMap]);

  return {
    selectedIds,
    selectedCount,
    totalCount: allIds.length,
    toggleSelection: handleToggleSelection,
    selectAll: handleSelectAll,
    clearSelection: handleClearSelection,
    invertSelection: handleInvertSelection,
    setSelection: handleSetSelection,
    isSelected: isItemSelected,
    selectionMap,
  };
}
