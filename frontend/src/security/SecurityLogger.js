/**
 * SecurityLogger — Predefined Security Event Logging
 * Convenience methods for common security events
 */

import { auditLog, AUDIT_ACTIONS } from './AuditLog';

export class SecurityLogger {
  /**
   * Log authentication events
   */
  static async recordLogin(email) {
    return await auditLog.recordAction(AUDIT_ACTIONS.USER_LOGIN, { email });
  }

  static async recordLogout() {
    return await auditLog.recordAction(AUDIT_ACTIONS.USER_LOGOUT, {});
  }

  static async recordFailedLoginAttempt(email, reason = 'Invalid credentials') {
    return await auditLog.recordAction(
      AUDIT_ACTIONS.FAILED_LOGIN_ATTEMPT,
      { email, reason }
    );
  }

  static async recordPasswordChanged(userId) {
    return await auditLog.recordAction(
      AUDIT_ACTIONS.PASSWORD_CHANGED,
      { userId }
    );
  }

  static async recordSessionTimeout(reason = 'Idle timeout') {
    return await auditLog.recordAction(
      AUDIT_ACTIONS.SESSION_TIMEOUT,
      { reason }
    );
  }

  /**
   * Log authorization events
   */
  static async recordUnauthorizedAccess(resource, action, user) {
    return await auditLog.recordAction(
      AUDIT_ACTIONS.UNAUTHORIZED_ACCESS_ATTEMPT,
      {
        resource,
        action,
        userId: user?.id,
        userRole: user?.role,
      }
    );
  }

  static async recordPermissionDenied(permission, resource, user) {
    return await auditLog.recordAction(
      AUDIT_ACTIONS.PERMISSION_DENIED,
      {
        permission,
        resource,
        userId: user?.id,
        userRole: user?.role,
      }
    );
  }

  static async recordRoleChanged(userId, oldRole, newRole) {
    return await auditLog.recordAction(
      AUDIT_ACTIONS.ROLE_CHANGED,
      { userId, oldRole, newRole }
    );
  }

  /**
   * Log data access events
   */
  static async recordDocumentViewed(documentId, fileName) {
    return await auditLog.recordAction(
      AUDIT_ACTIONS.DOCUMENT_VIEWED,
      { documentId, fileName }
    );
  }

  static async recordDocumentDownloaded(documentId, fileName, fileSize) {
    return await auditLog.recordAction(
      AUDIT_ACTIONS.DOCUMENT_DOWNLOADED,
      { documentId, fileName, fileSizeBytes: fileSize }
    );
  }

  static async recordCaseViewed(caseId, caseNumber) {
    return await auditLog.recordAction(
      AUDIT_ACTIONS.CASE_VIEWED,
      { caseId, caseNumber }
    );
  }

  static async recordExpedienteAccessed(expedienteId, clientName) {
    return await auditLog.recordAction(
      AUDIT_ACTIONS.EXPEDIENTE_ACCESSED,
      { expedienteId, clientName }
    );
  }

  static async recordDataExport(entity, count, exportFormat = 'json') {
    return await auditLog.recordAction(
      AUDIT_ACTIONS.DATA_EXPORT,
      { entity, count, format: exportFormat }
    );
  }

  /**
   * Log data change events
   */
  static async recordCaseCreated(caseId, caseNumber, clientName) {
    return await auditLog.recordAction(
      AUDIT_ACTIONS.CASE_CREATED,
      { caseId, caseNumber, clientName }
    );
  }

  static async recordCaseUpdated(caseId, changes) {
    return await auditLog.recordAction(
      AUDIT_ACTIONS.CASE_UPDATED,
      { caseId, changes }
    );
  }

  static async recordCaseDeleted(caseId, caseNumber, reason = null) {
    return await auditLog.recordAction(
      AUDIT_ACTIONS.CASE_DELETED,
      { caseId, caseNumber, deletionReason: reason }
    );
  }

  static async recordDocumentUploaded(documentId, fileName, fileSize) {
    return await auditLog.recordAction(
      AUDIT_ACTIONS.DOCUMENT_UPLOADED,
      { documentId, fileName, fileSizeBytes: fileSize }
    );
  }

  static async recordDocumentDeleted(documentId, fileName) {
    return await auditLog.recordAction(
      AUDIT_ACTIONS.DOCUMENT_DELETED,
      { documentId, fileName }
    );
  }

  static async recordWorkflowCreated(workflowId, workflowName) {
    return await auditLog.recordAction(
      AUDIT_ACTIONS.WORKFLOW_CREATED,
      { workflowId, workflowName }
    );
  }

  static async recordWorkflowExecuted(workflowId, executionId, status) {
    return await auditLog.recordAction(
      AUDIT_ACTIONS.WORKFLOW_EXECUTED,
      { workflowId, executionId, status }
    );
  }

  static async recordAutomationTriggered(ruleId, ruleName, caseCount) {
    return await auditLog.recordAction(
      AUDIT_ACTIONS.AUTOMATION_TRIGGERED,
      { ruleId, ruleName, affectedCases: caseCount }
    );
  }

  /**
   * Log bulk operations
   */
  static async recordBulkOperationStarted(operation, entityCount) {
    return await auditLog.recordAction(
      AUDIT_ACTIONS.BULK_OPERATION_STARTED,
      { operation, entityCount }
    );
  }

  static async recordBulkOperationCompleted(operation, processedCount, successCount) {
    return await auditLog.recordAction(
      AUDIT_ACTIONS.BULK_OPERATION_COMPLETED,
      { operation, processedCount, successCount }
    );
  }

  static async recordBulkOperationFailed(operation, reason, entityCount) {
    return await auditLog.recordAction(
      AUDIT_ACTIONS.BULK_OPERATION_FAILED,
      { operation, reason, affectedEntities: entityCount }
    );
  }

  /**
   * Log configuration changes
   */
  static async recordSettingsChanged(setting, oldValue, newValue) {
    return await auditLog.recordAction(
      AUDIT_ACTIONS.SETTINGS_CHANGED,
      { setting, oldValue, newValue }
    );
  }

  static async recordPreferenceUpdated(preference, value) {
    return await auditLog.recordAction(
      AUDIT_ACTIONS.PREFERENCE_UPDATED,
      { preference, value }
    );
  }

  /**
   * Log data recovery
   */
  static async recordDataRestored(entity, versionId, timestamp) {
    return await auditLog.recordAction(
      AUDIT_ACTIONS.DATA_RESTORED_FROM_BACKUP,
      { entity, versionId, restoredFromTime: timestamp }
    );
  }

  /**
   * Log errors
   */
  static async recordSystemError(errorCode, errorMessage, context = {}) {
    return await auditLog.recordAction(
      AUDIT_ACTIONS.SYSTEM_ERROR,
      { errorCode, errorMessage, context }
    );
  }

  static async recordValidationError(fieldName, validationRule, value) {
    return await auditLog.recordAction(
      AUDIT_ACTIONS.VALIDATION_ERROR,
      { fieldName, validationRule, attemptedValue: value }
    );
  }

  /**
   * Log security violations
   */
  static async recordTokenViolation(type, details = {}) {
    return await auditLog.recordAction(
      AUDIT_ACTIONS.TOKEN_VIOLATION,
      { violationType: type, ...details }
    );
  }

  static async recordSuspiciousActivity(type, details = {}) {
    return await auditLog.recordAction(
      AUDIT_ACTIONS.SUSPICIOUS_ACTIVITY,
      { activityType: type, ...details }
    );
  }

  /**
   * Utility: Get last N login attempts
   */
  static getRecentLoginAttempts(limit = 10) {
    return auditLog
      .getLogsByAction(AUDIT_ACTIONS.FAILED_LOGIN_ATTEMPT)
      .slice(0, limit);
  }

  /**
   * Utility: Get user's recent activity
   */
  static getUserActivity(userId, limitDays = 7) {
    const cutoff = new Date(Date.now() - limitDays * 24 * 60 * 60 * 1000);
    return auditLog.getLog({ userId })
      .filter(log => new Date(log.timestamp) > cutoff);
  }

  /**
   * Utility: Check for suspicious patterns
   */
  static checkSuspiciousPatterns(userId, timeWindowMs = 5 * 60 * 1000) {
    const recent = auditLog.getLog({ userId });
    const cutoff = new Date(Date.now() - timeWindowMs);
    const recentEvents = recent.filter(log => new Date(log.timestamp) > cutoff);

    const failedLogins = recentEvents.filter(
      log => log.action === AUDIT_ACTIONS.FAILED_LOGIN_ATTEMPT
    ).length;

    const unauthorizedAttempts = recentEvents.filter(
      log => log.action === AUDIT_ACTIONS.UNAUTHORIZED_ACCESS_ATTEMPT
    ).length;

    return {
      riskLevel: 'NORMAL',
      alerts: [],
      ...(failedLogins > 3 && {
        riskLevel: 'MEDIUM',
        alerts: [`${failedLogins} failed login attempts in last 5 minutes`]
      }),
      ...(unauthorizedAttempts > 2 && {
        riskLevel: 'HIGH',
        alerts: [`${unauthorizedAttempts} unauthorized access attempts`]
      }),
    };
  }
}

/**
 * Initialize security logging on app startup
 */
export function initializeSecurityLogging() {
  // Record app startup
  SecurityLogger.recordLogin('APP_STARTUP');

  // Setup error boundary logging
  window.addEventListener('error', (event) => {
    SecurityLogger.recordSystemError(
      'UNCAUGHT_ERROR',
      event.message,
      { filename: event.filename, lineno: event.lineno }
    );
  });

  // Log unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    SecurityLogger.recordSystemError(
      'UNHANDLED_REJECTION',
      event.reason?.message || 'Unknown error',
      { reason: event.reason }
    );
  });
}
