// Pure domain functions for user preferences - NO React, NO side effects

const STORAGE_NAMESPACE = 'firm-os/preferences';

export const DEFAULT_PREFERENCES = {
  dashboard: {
    widgetsVisible: ['teamSection', 'casesSection', 'activitySection', 'alertsSection'],
    compactMode: false,
  },
  analytics: {
    sortBy: 'openCases',
    sortOrder: 'desc',
    departmentFilter: null,
  },
  lawyers: {
    visibleColumns: ['name', 'specialty', 'department', 'status', 'cases'],
    sortBy: 'name',
    sortOrder: 'asc',
    lastSearch: '',
  },
  departments: {
    statusFilter: null,
    sortBy: 'name',
  },
  offices: {
    statusFilter: null,
    sortBy: 'name',
  },
  assignments: {
    priorityFilter: null,
    layoutMode: 'split',
  },
  sidebar: {
    favorites: [],
    recentModules: [],
    expandedGroups: [],
  },
  general: {
    theme: 'dark',
    language: 'es',
    notificationsEnabled: true,
    autoRefresh: true,
    autoRefreshInterval: 5,
  },
};

export function getDefaultPreferences() {
  return JSON.parse(JSON.stringify(DEFAULT_PREFERENCES));
}

export function loadPreferences(json = null) {
  if (!json) {
    return getDefaultPreferences();
  }

  try {
    const parsed = typeof json === 'string' ? JSON.parse(json) : json;
    return mergePreferences(getDefaultPreferences(), parsed);
  } catch (error) {
    console.warn('Failed to parse preferences:', error);
    return getDefaultPreferences();
  }
}

export function serializePreferences(prefs) {
  if (!prefs) return '';
  try {
    return JSON.stringify(prefs);
  } catch (error) {
    console.warn('Failed to serialize preferences:', error);
    return '';
  }
}

export function deserializePreferences(json) {
  if (!json) return getDefaultPreferences();
  try {
    return typeof json === 'string' ? JSON.parse(json) : json;
  } catch (error) {
    console.warn('Failed to deserialize preferences:', error);
    return getDefaultPreferences();
  }
}

export function mergePreferences(base, override) {
  if (!base) return override || getDefaultPreferences();
  if (!override) return base;

  const merged = JSON.parse(JSON.stringify(base));

  Object.keys(override).forEach(key => {
    if (typeof override[key] === 'object' && !Array.isArray(override[key])) {
      merged[key] = { ...merged[key], ...override[key] };
    } else {
      merged[key] = override[key];
    }
  });

  return merged;
}

export function validatePreferences(prefs) {
  if (!prefs || typeof prefs !== 'object') {
    return false;
  }

  const requiredKeys = Object.keys(DEFAULT_PREFERENCES);
  return requiredKeys.every(key => key in prefs);
}

export function resetPreferences() {
  return getDefaultPreferences();
}

export function toggleFavorite(prefs, moduleName) {
  if (!prefs || !prefs.sidebar) {
    return prefs;
  }

  const updated = JSON.parse(JSON.stringify(prefs));
  const favorites = updated.sidebar.favorites || [];
  const index = favorites.indexOf(moduleName);

  if (index > -1) {
    favorites.splice(index, 1);
  } else {
    favorites.push(moduleName);
  }

  updated.sidebar.favorites = favorites;
  return updated;
}

export function isFavorite(prefs, moduleName) {
  if (!prefs || !prefs.sidebar || !Array.isArray(prefs.sidebar.favorites)) {
    return false;
  }
  return prefs.sidebar.favorites.includes(moduleName);
}

export function rememberRecentModule(prefs, moduleName) {
  if (!prefs || !prefs.sidebar) {
    return prefs;
  }

  const updated = JSON.parse(JSON.stringify(prefs));
  const recents = updated.sidebar.recentModules || [];
  const index = recents.indexOf(moduleName);

  if (index > -1) {
    recents.splice(index, 1);
  }

  recents.unshift(moduleName);
  updated.sidebar.recentModules = recents.slice(0, 5);

  return updated;
}

export function getRecentModules(prefs) {
  if (!prefs || !prefs.sidebar || !Array.isArray(prefs.sidebar.recentModules)) {
    return [];
  }
  return prefs.sidebar.recentModules;
}

export function rememberLayout(prefs, section, layoutMode) {
  if (!prefs) return prefs;

  const updated = JSON.parse(JSON.stringify(prefs));

  if (section === 'assignments') {
    updated.assignments = updated.assignments || {};
    updated.assignments.layoutMode = layoutMode;
  }

  return updated;
}

export function rememberColumns(prefs, section, columns) {
  if (!prefs) return prefs;

  const updated = JSON.parse(JSON.stringify(prefs));

  if (section === 'lawyers' && Array.isArray(columns)) {
    updated.lawyers = updated.lawyers || {};
    updated.lawyers.visibleColumns = columns;
  }

  return updated;
}

export function rememberSorting(prefs, section, sortBy, sortOrder = 'asc') {
  if (!prefs) return prefs;

  const updated = JSON.parse(JSON.stringify(prefs));
  const sectionPrefs = updated[section];

  if (sectionPrefs) {
    sectionPrefs.sortBy = sortBy;
    sectionPrefs.sortOrder = sortOrder;
  }

  return updated;
}

export function rememberFilters(prefs, section, filters) {
  if (!prefs) return prefs;

  const updated = JSON.parse(JSON.stringify(prefs));
  const sectionPrefs = updated[section];

  if (sectionPrefs) {
    Object.keys(filters).forEach(key => {
      sectionPrefs[`${key}Filter`] = filters[key];
    });
  }

  return updated;
}

export function rememberSearch(prefs, section, searchQuery) {
  if (!prefs) return prefs;

  const updated = JSON.parse(JSON.stringify(prefs));

  if (section === 'lawyers') {
    updated.lawyers = updated.lawyers || {};
    updated.lawyers.lastSearch = searchQuery;
  }

  return updated;
}

export function savePreferences(prefs, storageKey = STORAGE_NAMESPACE) {
  if (!validatePreferences(prefs)) {
    console.warn('Invalid preferences structure');
    return false;
  }

  try {
    const serialized = serializePreferences(prefs);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(storageKey, serialized);
      return true;
    }
    return false;
  } catch (error) {
    console.warn('Failed to save preferences:', error);
    return false;
  }
}

export function getStorageKey(userFirmId) {
  if (!userFirmId) return STORAGE_NAMESPACE;
  return `${STORAGE_NAMESPACE}/${userFirmId}`;
}

export function getPreferencesStats(prefs) {
  if (!prefs) return null;

  return {
    favoritesCount: (prefs.sidebar?.favorites || []).length,
    recentsCount: (prefs.sidebar?.recentModules || []).length,
    visibleWidgets: (prefs.dashboard?.widgetsVisible || []).length,
    activeFilters: [
      prefs.analytics?.departmentFilter,
      prefs.departments?.statusFilter,
      prefs.offices?.statusFilter,
      prefs.assignments?.priorityFilter,
    ].filter(Boolean).length,
  };
}
