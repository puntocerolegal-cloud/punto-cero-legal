// Application layer - Orchestrates preferences domain
// NO UI logic, NO components, NO side effects

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
  isFavorite,
  getRecentModules,
  getPreferencesStats,
  DEFAULT_PREFERENCES,
  getStorageKey,
} from '../domain/preferencesDomain';

export function buildPreferencesViewModel(preferences, userFirmId) {
  if (!preferences) {
    preferences = { ...DEFAULT_PREFERENCES };
  }

  const storageKey = getStorageKey(userFirmId);

  return {
    preferences,
    storageKey,
    stats: getPreferencesStats(preferences),
    actions: {
      toggleFavorite: (moduleName) => toggleFavorite(preferences, moduleName),
      isFavorite: (moduleName) => isFavorite(preferences, moduleName),
      addRecent: (moduleName) => rememberRecentModule(preferences, moduleName),
      getRecents: () => getRecentModules(preferences),
      rememberLayout: (section, mode) => rememberLayout(preferences, section, mode),
      rememberColumns: (section, columns) => rememberColumns(preferences, section, columns),
      rememberSorting: (section, sortBy, sortOrder) => rememberSorting(preferences, section, sortBy, sortOrder),
      rememberFilters: (section, filters) => rememberFilters(preferences, section, filters),
      rememberSearch: (section, query) => rememberSearch(preferences, section, query),
      save: (prefs) => savePreferences(prefs || preferences, storageKey),
    },
  };
}

export function buildDashboardPreferences(preferences) {
  if (!preferences) preferences = { ...DEFAULT_PREFERENCES };

  return {
    section: 'dashboard',
    widgets: preferences.dashboard?.widgetsVisible || DEFAULT_PREFERENCES.dashboard.widgetsVisible,
    compactMode: preferences.dashboard?.compactMode || false,
    availableWidgets: [
      { id: 'teamSection', label: 'Equipo', icon: 'Users' },
      { id: 'casesSection', label: 'Casos', icon: 'FolderKanban' },
      { id: 'activitySection', label: 'Actividad', icon: 'Activity' },
      { id: 'alertsSection', label: 'Alertas', icon: 'AlertCircle' },
    ],
    actions: {
      toggleWidget: (widgetId) => {
        const widgets = [...(preferences.dashboard?.widgetsVisible || DEFAULT_PREFERENCES.dashboard.widgetsVisible)];
        const index = widgets.indexOf(widgetId);
        if (index > -1) {
          widgets.splice(index, 1);
        } else {
          widgets.push(widgetId);
        }
        return {
          ...preferences,
          dashboard: { ...preferences.dashboard, widgetsVisible: widgets },
        };
      },
      toggleCompactMode: () => ({
        ...preferences,
        dashboard: { ...preferences.dashboard, compactMode: !preferences.dashboard?.compactMode },
      }),
    },
  };
}

export function buildAnalyticsPreferences(preferences) {
  if (!preferences) preferences = { ...DEFAULT_PREFERENCES };

  return {
    section: 'analytics',
    sortBy: preferences.analytics?.sortBy || 'openCases',
    sortOrder: preferences.analytics?.sortOrder || 'desc',
    departmentFilter: preferences.analytics?.departmentFilter || null,
    sortOptions: [
      { id: 'openCases', label: 'Casos Abiertos' },
      { id: 'closedCases', label: 'Casos Cerrados' },
      { id: 'documents', label: 'Documentos' },
      { id: 'aiUsage', label: 'Uso IA' },
    ],
  };
}

export function buildLawyerPreferences(preferences) {
  if (!preferences) preferences = { ...DEFAULT_PREFERENCES };

  return {
    section: 'lawyers',
    visibleColumns: preferences.lawyers?.visibleColumns || DEFAULT_PREFERENCES.lawyers.visibleColumns,
    sortBy: preferences.lawyers?.sortBy || 'name',
    sortOrder: preferences.lawyers?.sortOrder || 'asc',
    lastSearch: preferences.lawyers?.lastSearch || '',
    availableColumns: [
      { id: 'name', label: 'Nombre' },
      { id: 'specialty', label: 'Especialidad' },
      { id: 'department', label: 'Departamento' },
      { id: 'office', label: 'Oficina' },
      { id: 'status', label: 'Estado' },
      { id: 'cases', label: 'Casos Activos' },
      { id: 'documents', label: 'Documentos' },
      { id: 'productivity', label: 'Productividad' },
    ],
  };
}

export function buildDepartmentPreferences(preferences) {
  if (!preferences) preferences = { ...DEFAULT_PREFERENCES };

  return {
    section: 'departments',
    statusFilter: preferences.departments?.statusFilter || null,
    sortBy: preferences.departments?.sortBy || 'name',
    sortOrder: preferences.departments?.sortOrder || 'asc',
  };
}

export function buildOfficePreferences(preferences) {
  if (!preferences) preferences = { ...DEFAULT_PREFERENCES };

  return {
    section: 'offices',
    statusFilter: preferences.offices?.statusFilter || null,
    sortBy: preferences.offices?.sortBy || 'name',
    sortOrder: preferences.offices?.sortOrder || 'asc',
  };
}

export function buildAssignmentsPreferences(preferences) {
  if (!preferences) preferences = { ...DEFAULT_PREFERENCES };

  return {
    section: 'assignments',
    layoutMode: preferences.assignments?.layoutMode || 'split',
    priorityFilter: preferences.assignments?.priorityFilter || null,
    layoutOptions: [
      { id: 'split', label: 'Dividido', icon: 'Columns2' },
      { id: 'stacked', label: 'Apilado', icon: 'Rows' },
      { id: 'compact', label: 'Compacto', icon: 'Minimize' },
    ],
  };
}

export function buildSidebarPreferences(preferences) {
  if (!preferences) preferences = { ...DEFAULT_PREFERENCES };

  return {
    section: 'sidebar',
    favorites: preferences.sidebar?.favorites || [],
    recentModules: preferences.sidebar?.recentModules || [],
    expandedGroups: preferences.sidebar?.expandedGroups || [],
  };
}

export function buildGeneralPreferences(preferences) {
  if (!preferences) preferences = { ...DEFAULT_PREFERENCES };

  return {
    section: 'general',
    theme: preferences.general?.theme || 'dark',
    language: preferences.general?.language || 'es',
    notificationsEnabled: preferences.general?.notificationsEnabled ?? true,
    autoRefresh: preferences.general?.autoRefresh ?? true,
    autoRefreshInterval: preferences.general?.autoRefreshInterval || 5,
    themeOptions: [
      { id: 'dark', label: 'Oscuro' },
      { id: 'light', label: 'Claro' },
    ],
    languageOptions: [
      { id: 'es', label: 'Español' },
      { id: 'en', label: 'English' },
    ],
  };
}
