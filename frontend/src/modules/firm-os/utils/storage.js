/**
 * Unified localStorage key management for Firm OS
 * Centralized storage adapter to consolidate all firm-os localStorage keys
 */

export const STORAGE_KEYS = {
  // Core data (backend-sourced)
  CORE_DATA_REFRESH_TIMESTAMP: 'firm-os/core-data-refresh-ts',
  
  // Operational state (client-side engines)
  AUTOMATION_HISTORY: 'firm-os/automation-history',
  AUTOMATION_RULES: 'firm-os/automation-rules',
  
  SCHEDULER_SCHEDULES: 'firm-os/scheduler-schedules',
  SCHEDULER_EXECUTIONS: 'firm-os/scheduler-executions',
  SCHEDULER_UPCOMING: 'firm-os/scheduler-upcoming',
  
  WORKFLOWS: 'firm-os/workflows',
  WORKFLOW_EXECUTIONS: 'firm-os/workflow-executions',
  WORKFLOW_BUILDER_GRAPH: 'firm-os/workflow-builder-graph',
  
  // Orchestration & Governance
  AUTONOMOUS_STATE: 'firm-os/autonomous-state',
  GOVERNANCE_AUDIT_TRAIL: 'firm-os/governance-audit',
  GOVERNANCE_POLICIES: 'firm-os/governance-policies',
  GOVERNANCE_METRICS: 'firm-os/governance-metrics',
  
  // User preferences
  PREFERENCES: 'firm-os/preferences',
  RECENT_MODULES: 'firm-os/recent-modules',
  COLUMN_PREFERENCES: 'firm-os/column-preferences',
  
  // Onboarding
  ONBOARDING_STATE: 'firm-os/onboarding-state',
};

/**
 * Safe localStorage accessor with error handling
 */
export const StorageAdapter = {
  /**
   * Get value from localStorage
   * @param {string} key Storage key
   * @param {any} defaultValue Default if not found or error
   * @returns {any}
   */
  get(key, defaultValue = null) {
    try {
      if (typeof localStorage === 'undefined') return defaultValue;
      const item = localStorage.getItem(key);
      if (item === null) return defaultValue;
      return JSON.parse(item);
    } catch (error) {
      console.warn(`[StorageAdapter] Failed to get ${key}:`, error);
      return defaultValue;
    }
  },

  /**
   * Set value in localStorage
   * @param {string} key Storage key
   * @param {any} value Value to store
   * @returns {boolean} Success flag
   */
  set(key, value) {
    try {
      if (typeof localStorage === 'undefined') return false;
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn(`[StorageAdapter] Failed to set ${key}:`, error);
      return false;
    }
  },

  /**
   * Remove value from localStorage
   * @param {string} key Storage key
   * @returns {boolean} Success flag
   */
  remove(key) {
    try {
      if (typeof localStorage === 'undefined') return false;
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn(`[StorageAdapter] Failed to remove ${key}:`, error);
      return false;
    }
  },

  /**
   * Clear all firm-os related storage
   * @returns {boolean} Success flag
   */
  clearAllFirmOS() {
    try {
      if (typeof localStorage === 'undefined') return false;
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      return true;
    } catch (error) {
      console.warn('[StorageAdapter] Failed to clear firm-os storage:', error);
      return false;
    }
  },

  /**
   * Get all firm-os storage keys and their values
   * @returns {Object} Key-value pairs
   */
  getAllFirmOS() {
    try {
      if (typeof localStorage === 'undefined') return {};
      const result = {};
      Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
        try {
          const value = localStorage.getItem(key);
          if (value) {
            result[name] = JSON.parse(value);
          }
        } catch (e) {
          // Skip this key
        }
      });
      return result;
    } catch (error) {
      console.warn('[StorageAdapter] Failed to get all firm-os storage:', error);
      return {};
    }
  },
};

export default StorageAdapter;
