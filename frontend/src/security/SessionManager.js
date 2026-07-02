/**
 * SessionManager — Enterprise-Grade Session Timeout & Activity Tracking
 * Handles idle timeout, max session age, and activity monitoring
 */

export class SessionManager {
  constructor({
    idleTimeoutMs = 30 * 60 * 1000,      // 30 minutes
    maxSessionMs = 8 * 60 * 60 * 1000,   // 8 hours
    warningMs = 5 * 60 * 1000,           // Warn 5 min before timeout
    checkIntervalMs = 60 * 1000,         // Check every minute
  } = {}) {
    this.idleTimeout = idleTimeoutMs;
    this.maxSession = maxSessionMs;
    this.warningThreshold = warningMs;
    this.checkInterval = checkIntervalMs;

    this.lastActivityTime = Date.now();
    this.sessionStartTime = Date.now();
    this.warningShown = false;
    this.isActive = true;

    this.onSessionExpired = null;
    this.onIdleWarning = null;
    this.onMaxSessionWarning = null;

    this.setupActivityListeners();
  }

  /**
   * Setup listeners for user activity
   */
  setupActivityListeners() {
    const events = [
      'mousedown', 'mousemove',
      'keydown', 'keyup',
      'scroll', 'touchstart', 'touchmove',
      'click', 'focus', 'input'
    ];

    events.forEach(event => {
      try {
        window.addEventListener(event, () => this.recordActivity(), { passive: true });
      } catch (e) {
        console.warn(`Failed to attach ${event} listener:`, e);
      }
    });
  }

  /**
   * Record user activity
   */
  recordActivity() {
    const now = Date.now();
    const timeSinceLastActivity = now - this.lastActivityTime;

    // Only update if significant time has passed (avoid excessive updates)
    if (timeSinceLastActivity > 5000) { // 5 seconds
      this.lastActivityTime = now;

      // Reset warning flag when user becomes active again
      if (!this.isActive) {
        this.isActive = true;
        this.warningShown = false;
      }
    }
  }

  /**
   * Check session validity
   * @returns {Object} { valid: boolean, reason?: string, minutesRemaining?: number }
   */
  checkSessionValidity() {
    const now = Date.now();
    const idleTime = now - this.lastActivityTime;
    const sessionAge = now - this.sessionStartTime;

    // Check idle timeout
    if (idleTime > this.idleTimeout) {
      return {
        valid: false,
        reason: 'IDLE_TIMEOUT',
        idleMinutes: Math.floor(idleTime / 60000),
      };
    }

    // Check max session age
    if (sessionAge > this.maxSession) {
      return {
        valid: false,
        reason: 'MAX_SESSION_EXCEEDED',
        sessionHours: Math.floor(sessionAge / 3600000),
      };
    }

    // Check for warnings
    const minutesUntilIdleTimeout = Math.floor((this.idleTimeout - idleTime) / 60000);
    if (minutesUntilIdleTimeout < 5 && !this.warningShown) {
      this.warningShown = true;
      this.isActive = false;
      return {
        valid: true,
        warning: 'IDLE_TIMEOUT_WARNING',
        minutesRemaining: minutesUntilIdleTimeout,
      };
    }

    const minutesUntilMaxSession = Math.floor((this.maxSession - sessionAge) / 60000);
    if (minutesUntilMaxSession < 15 && minutesUntilMaxSession > 0) {
      return {
        valid: true,
        warning: 'MAX_SESSION_WARNING',
        minutesRemaining: minutesUntilMaxSession,
      };
    }

    return { valid: true };
  }

  /**
   * Get session duration
   */
  getSessionDuration() {
    return {
      elapsedMs: Date.now() - this.sessionStartTime,
      elapsedMinutes: Math.floor((Date.now() - this.sessionStartTime) / 60000),
      idleMs: Date.now() - this.lastActivityTime,
      idleMinutes: Math.floor((Date.now() - this.lastActivityTime) / 60000),
    };
  }

  /**
   * Extend session (on user interaction)
   */
  extendSession() {
    this.warningShown = false;
    this.isActive = true;
    this.recordActivity();
  }

  /**
   * Reset session
   */
  resetSession() {
    this.lastActivityTime = Date.now();
    this.sessionStartTime = Date.now();
    this.warningShown = false;
    this.isActive = true;
  }

  /**
   * Get session info for UI display
   */
  getSessionInfo() {
    const validity = this.checkSessionValidity();
    const duration = this.getSessionDuration();

    return {
      ...validity,
      ...duration,
      isActive: this.isActive,
      idlePercentage: Math.min(100, (duration.idleMs / this.idleTimeout) * 100),
    };
  }

  /**
   * Cleanup
   */
  destroy() {
    this.onSessionExpired = null;
    this.onIdleWarning = null;
    this.onMaxSessionWarning = null;
  }
}

/**
 * React Hook for Session Management
 */
import { useEffect, useRef } from 'react';

export function useSessionManager(callbacks = {}) {
  const managerRef = useRef(null);

  useEffect(() => {
    if (!managerRef.current) {
      managerRef.current = new SessionManager();
    }

    const manager = managerRef.current;
    const checkInterval = setInterval(() => {
      const validity = manager.checkSessionValidity();

      if (!validity.valid) {
        if (callbacks.onSessionExpired) {
          callbacks.onSessionExpired(validity.reason);
        }
      } else if (validity.warning === 'IDLE_TIMEOUT_WARNING') {
        if (callbacks.onIdleWarning) {
          callbacks.onIdleWarning(validity.minutesRemaining);
        }
      } else if (validity.warning === 'MAX_SESSION_WARNING') {
        if (callbacks.onMaxSessionWarning) {
          callbacks.onMaxSessionWarning(validity.minutesRemaining);
        }
      }
    }, manager.checkInterval);

    return () => {
      clearInterval(checkInterval);
      if (managerRef.current) {
        managerRef.current.destroy();
        managerRef.current = null;
      }
    };
  }, [callbacks]);

  return managerRef.current;
}
