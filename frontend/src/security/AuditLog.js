/**
 * AuditLog — Enterprise Audit Trail & Action Tracking
 * Records all security-relevant actions for compliance and forensics
 */

import { v4 as generateUUID } from 'uuid';

export class AuditLog {
  constructor(maxEntries = 5000) {
    this.maxEntries = maxEntries;
    this.storageKey = 'firm-os/audit-trail';
    this.logs = this.loadFromStorage();
    this.isEncrypted = false; // Can be enabled with storage adapter
  }

  /**
   * Record an action in the audit trail
   */
  async recordAction(action, details = {}, metadata = {}) {
    try {
      // Get current user info
      const userInfo = this.getCurrentUserInfo();

      const entry = {
        // Core audit fields
        id: generateUUID(),
        timestamp: new Date().toISOString(),
        action,
        category: this.categorizeAction(action),
        severity: this.getSeverity(action),

        // User info
        userId: userInfo.id,
        userName: userInfo.name,
        email: userInfo.email,
        role: userInfo.role,

        // Request context
        details,
        metadata,
        sessionId: this.getSessionId(),
        url: window.location.pathname,
        referer: document.referrer,

        // System info
        userAgent: navigator.userAgent,
        timestamp_iso: new Date().toISOString(),
        timestamp_unix: Date.now(),
      };

      // Add to beginning of logs
      this.logs.unshift(entry);

      // Trim if exceeds max
      if (this.logs.length > this.maxEntries) {
        this.logs = this.logs.slice(0, this.maxEntries);
      }

      // Persist to storage
      this.saveToStorage();

      // Also log to console in dev
      if (process.env.NODE_ENV === 'development') {
        console.log('[AUDIT]', action, entry);
      }

      return entry;
    } catch (error) {
      console.error('Audit log failed:', error);
      return null;
    }
  }

  /**
   * Get current user info safely
   */
  getCurrentUserInfo() {
    try {
      const user = JSON.parse(localStorage.getItem('pcl_user') || 'null');
      return {
        id: user?.id || 'UNKNOWN',
        name: user?.full_name || user?.name || 'UNKNOWN',
        email: user?.email || 'UNKNOWN',
        role: user?.role || 'UNKNOWN',
      };
    } catch {
      return {
        id: 'UNKNOWN',
        name: 'UNKNOWN',
        email: 'UNKNOWN',
        role: 'UNKNOWN',
      };
    }
  }

  /**
   * Get session ID
   */
  getSessionId() {
    if (!window.__sessionId) {
      window.__sessionId = generateUUID();
      sessionStorage.setItem('session_id', window.__sessionId);
    }
    return window.__sessionId;
  }

  /**
   * Categorize action by type
   */
  categorizeAction(action) {
    if (action.includes('LOGIN') || action.includes('LOGOUT')) return 'AUTH';
    if (action.includes('PERMISSION') || action.includes('UNAUTHORIZED')) return 'AUTHORIZATION';
    if (action.includes('FAILED') || action.includes('ERROR')) return 'ERROR';
    if (action.includes('EXPORT') || action.includes('DOWNLOAD')) return 'DATA_ACCESS';
    if (action.includes('CREATE') || action.includes('UPDATE') || action.includes('DELETE')) return 'DATA_CHANGE';
    if (action.includes('VIEW') || action.includes('ACCESSED')) return 'VIEW';
    if (action.includes('CONFIG') || action.includes('SETTINGS')) return 'CONFIGURATION';
    return 'GENERAL';
  }

  /**
   * Get severity level
   */
  getSeverity(action) {
    if (action.includes('FAILED_LOGIN') || action.includes('UNAUTHORIZED') || action.includes('VIOLATION')) return 'HIGH';
    if (action.includes('DELETE') || action.includes('BULK')) return 'MEDIUM';
    if (action.includes('EXPORT') || action.includes('DOWNLOAD')) return 'MEDIUM';
    if (action.includes('UPDATE')) return 'LOW';
    return 'LOW';
  }

  /**
   * Query audit logs with filters
   */
  getLog(filters = {}) {
    return this.logs.filter(log => {
      if (filters.userId && log.userId !== filters.userId) return false;
      if (filters.action && !log.action.includes(filters.action)) return false;
      if (filters.category && log.category !== filters.category) return false;
      if (filters.severity && log.severity !== filters.severity) return false;
      if (filters.from && new Date(log.timestamp) < new Date(filters.from)) return false;
      if (filters.to && new Date(log.timestamp) > new Date(filters.to)) return false;
      if (filters.role && log.role !== filters.role) return false;
      return true;
    });
  }

  /**
   * Get logs by time range
   */
  getLogsByTimeRange(hoursBack = 24) {
    const cutoff = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
    return this.logs.filter(log => new Date(log.timestamp) > cutoff);
  }

  /**
   * Get logs by action
   */
  getLogsByAction(action) {
    return this.logs.filter(log => log.action === action);
  }

  /**
   * Get statistics
   */
  getStatistics() {
    return {
      totalEvents: this.logs.length,
      eventsByCategory: this.getCountByField('category'),
      eventsByUser: this.getCountByField('userId'),
      eventsBySeverity: this.getCountByField('severity'),
      eventsByAction: this.getCountByField('action'),
      timeRange: {
        oldest: this.logs.length > 0 ? this.logs[this.logs.length - 1].timestamp : null,
        newest: this.logs.length > 0 ? this.logs[0].timestamp : null,
      },
    };
  }

  /**
   * Count events by field
   */
  getCountByField(field) {
    return this.logs.reduce((acc, log) => {
      const key = log[field];
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }

  /**
   * Save logs to localStorage
   */
  saveToStorage() {
    try {
      if (typeof localStorage !== 'undefined') {
        const data = JSON.stringify(this.logs);
        localStorage.setItem(this.storageKey, data);
      }
    } catch (error) {
      console.warn('Audit log storage failed:', error);
    }
  }

  /**
   * Load logs from localStorage
   */
  loadFromStorage() {
    try {
      if (typeof localStorage === 'undefined') return [];
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.warn('Audit log loading failed:', error);
      return [];
    }
  }

  /**
   * Export logs to JSON
   */
  exportAsJSON() {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Export logs to CSV
   */
  exportAsCSV() {
    if (this.logs.length === 0) return '';

    const headers = [
      'timestamp', 'action', 'category', 'severity',
      'userId', 'userName', 'email', 'role',
      'sessionId', 'url'
    ];

    const rows = [headers.join(',')];

    this.logs.forEach(log => {
      const row = headers.map(header => {
        const value = log[header] || '';
        // Escape CSV
        return typeof value === 'string' && value.includes(',')
          ? `"${value}"`
          : value;
      });
      rows.push(row.join(','));
    });

    return rows.join('\n');
  }

  /**
   * Download audit log file
   */
  downloadLog(format = 'json') {
    const data = format === 'json' ? this.exportAsJSON() : this.exportAsCSV();
    const filename = `audit-log-${new Date().toISOString().split('T')[0]}.${format === 'json' ? 'json' : 'csv'}`;
    const blob = new Blob([data], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Clear logs (use with caution)
   */
  clearLogs() {
    if (confirm('This will permanently delete all audit logs. Continue?')) {
      this.logs = [];
      localStorage.removeItem(this.storageKey);
    }
  }

  /**
   * Clear logs older than N days
   */
  clearOldLogs(daysBack = 90) {
    const cutoff = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);
    this.logs = this.logs.filter(log => new Date(log.timestamp) > cutoff);
    this.saveToStorage();
  }
}

/**
 * Global audit log instance
 */
export const auditLog = new AuditLog();

/**
 * Predefined audit action types
 */
export const AUDIT_ACTIONS = {
  // Authentication
  USER_LOGIN: 'USER_LOGIN',
  USER_LOGOUT: 'USER_LOGOUT',
  FAILED_LOGIN_ATTEMPT: 'FAILED_LOGIN_ATTEMPT',
  PASSWORD_CHANGED: 'PASSWORD_CHANGED',
  SESSION_TIMEOUT: 'SESSION_TIMEOUT',

  // Authorization & Access
  UNAUTHORIZED_ACCESS_ATTEMPT: 'UNAUTHORIZED_ACCESS_ATTEMPT',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  ROLE_CHANGED: 'ROLE_CHANGED',

  // Data Access
  DOCUMENT_VIEWED: 'DOCUMENT_VIEWED',
  DOCUMENT_DOWNLOADED: 'DOCUMENT_DOWNLOADED',
  CASE_VIEWED: 'CASE_VIEWED',
  EXPEDIENTE_ACCESSED: 'EXPEDIENTE_ACCESSED',
  DATA_EXPORT: 'DATA_EXPORT',

  // Data Changes
  CASE_CREATED: 'CASE_CREATED',
  CASE_UPDATED: 'CASE_UPDATED',
  CASE_DELETED: 'CASE_DELETED',
  DOCUMENT_UPLOADED: 'DOCUMENT_UPLOADED',
  DOCUMENT_DELETED: 'DOCUMENT_DELETED',
  WORKFLOW_CREATED: 'WORKFLOW_CREATED',
  WORKFLOW_EXECUTED: 'WORKFLOW_EXECUTED',
  AUTOMATION_TRIGGERED: 'AUTOMATION_TRIGGERED',

  // Bulk Operations
  BULK_OPERATION_STARTED: 'BULK_OPERATION_STARTED',
  BULK_OPERATION_COMPLETED: 'BULK_OPERATION_COMPLETED',
  BULK_OPERATION_FAILED: 'BULK_OPERATION_FAILED',

  // Configuration
  SETTINGS_CHANGED: 'SETTINGS_CHANGED',
  PREFERENCE_UPDATED: 'PREFERENCE_UPDATED',

  // Data Recovery
  DATA_RESTORED_FROM_BACKUP: 'DATA_RESTORED_FROM_BACKUP',

  // Errors
  SYSTEM_ERROR: 'SYSTEM_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',

  // Security
  TOKEN_VIOLATION: 'TOKEN_VIOLATION',
  SUSPICIOUS_ACTIVITY: 'SUSPICIOUS_ACTIVITY',
};
