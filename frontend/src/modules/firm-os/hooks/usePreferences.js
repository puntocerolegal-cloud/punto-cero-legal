import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  loadPreferences,
  savePreferences,
  toggleFavorite,
  rememberRecentModule,
  rememberLayout,
  rememberColumns,
  rememberSorting,
  rememberFilters,
  rememberSearch,
  getStorageKey,
  DEFAULT_PREFERENCES,
} from '../domain/preferencesDomain';
import { useAuth } from '@/contexts/AuthContext';

export function usePreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState(() => {
    const storageKey = getStorageKey(user?.firm_id);
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(storageKey);
        return stored ? loadPreferences(stored) : { ...DEFAULT_PREFERENCES };
      }
    } catch (error) {
      console.warn('Failed to load preferences:', error);
    }
    return { ...DEFAULT_PREFERENCES };
  });

  const storageKey = useMemo(() => getStorageKey(user?.firm_id), [user?.firm_id]);

  const persistPreferences = useCallback((newPrefs) => {
    try {
      if (typeof localStorage !== 'undefined') {
        const success = savePreferences(newPrefs, storageKey);
        if (success) {
          setPreferences(newPrefs);
        }
        return success;
      }
      return false;
    } catch (error) {
      console.warn('Failed to persist preferences:', error);
      return false;
    }
  }, [storageKey]);

  const handleToggleFavorite = useCallback((moduleName) => {
    const updated = toggleFavorite(preferences, moduleName);
    persistPreferences(updated);
    return updated;
  }, [preferences, persistPreferences]);

  const handleAddRecent = useCallback((moduleName) => {
    const updated = rememberRecentModule(preferences, moduleName);
    persistPreferences(updated);
    return updated;
  }, [preferences, persistPreferences]);

  const handleRememberLayout = useCallback((section, layoutMode) => {
    const updated = rememberLayout(preferences, section, layoutMode);
    persistPreferences(updated);
    return updated;
  }, [preferences, persistPreferences]);

  const handleRememberColumns = useCallback((section, columns) => {
    const updated = rememberColumns(preferences, section, columns);
    persistPreferences(updated);
    return updated;
  }, [preferences, persistPreferences]);

  const handleRememberSorting = useCallback((section, sortBy, sortOrder = 'asc') => {
    const updated = rememberSorting(preferences, section, sortBy, sortOrder);
    persistPreferences(updated);
    return updated;
  }, [preferences, persistPreferences]);

  const handleRememberFilters = useCallback((section, filters) => {
    const updated = rememberFilters(preferences, section, filters);
    persistPreferences(updated);
    return updated;
  }, [preferences, persistPreferences]);

  const handleRememberSearch = useCallback((section, searchQuery) => {
    const updated = rememberSearch(preferences, section, searchQuery);
    persistPreferences(updated);
    return updated;
  }, [preferences, persistPreferences]);

  const handleUpdatePreferences = useCallback((updates) => {
    const merged = { ...preferences, ...updates };
    persistPreferences(merged);
    return merged;
  }, [preferences, persistPreferences]);

  const handleResetPreferences = useCallback(() => {
    const defaultPrefs = { ...DEFAULT_PREFERENCES };
    persistPreferences(defaultPrefs);
    return defaultPrefs;
  }, [persistPreferences]);

  return {
    preferences,
    toggleFavorite: handleToggleFavorite,
    addRecent: handleAddRecent,
    rememberLayout: handleRememberLayout,
    rememberColumns: handleRememberColumns,
    rememberSorting: handleRememberSorting,
    rememberFilters: handleRememberFilters,
    rememberSearch: handleRememberSearch,
    updatePreferences: handleUpdatePreferences,
    resetPreferences: handleResetPreferences,
  };
}
