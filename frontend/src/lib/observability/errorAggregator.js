/**
 * Error Aggregator
 *
 * Agrupa errores similares para detectar patrones y problemas sistémicos.
 * Permite identificar endpoints problemáticos, errores repetidos, etc.
 */

import { eventStore } from './eventStore';

class ErrorAggregator {
  constructor() {
    this.groups = new Map(); // fingerprint → { count, first, last, errors[] }
    this.problemEndpoints = new Map(); // endpoint → { count, errors[], severity }
  }

  /**
   * Registrar un error normalizado
   */
  track(normalizedError) {
    if (!normalizedError) return;

    const fingerprint = normalizedError.fingerprint;
    const endpoint = normalizedError.endpoint;

    // Agrupar por fingerprint (endpoint + status + tipo)
    this._trackByFingerprint(fingerprint, normalizedError);

    // Rastrear endpoints problemáticos
    this._trackProblematicEndpoint(endpoint, normalizedError);
  }

  /**
   * Agrupar por fingerprint
   */
  _trackByFingerprint(fingerprint, error) {
    if (!this.groups.has(fingerprint)) {
      this.groups.set(fingerprint, {
        fingerprint,
        count: 0,
        first: new Date().toISOString(),
        last: new Date().toISOString(),
        errors: [],
        type: error.type,
        status: error.status,
        endpoint: error.endpoint,
      });
    }

    const group = this.groups.get(fingerprint);
    group.count++;
    group.last = new Date().toISOString();
    group.errors.push(error);

    // Mantener últimos 10 errores del grupo
    if (group.errors.length > 10) {
      group.errors = group.errors.slice(-10);
    }
  }

  /**
   * Rastrear endpoints problemáticos
   */
  _trackProblematicEndpoint(endpoint, error) {
    if (!this.problemEndpoints.has(endpoint)) {
      this.problemEndpoints.set(endpoint, {
        endpoint,
        count: 0,
        errors: [],
        severity: error.severity,
      });
    }

    const problem = this.problemEndpoints.get(endpoint);
    problem.count++;
    problem.errors.push({
      type: error.type,
      status: error.status,
      timestamp: error.timestamp,
    });

    // Mantener últimos 20 errores del endpoint
    if (problem.errors.length > 20) {
      problem.errors = problem.errors.slice(-20);
    }

    // Actualizar severidad (máxima)
    problem.severity = this._getMaxSeverity(problem.severity, error.severity);
  }

  /**
   * Comparar severidades
   */
  _getMaxSeverity(sev1, sev2) {
    const severityOrder = ['critical', 'high', 'medium', 'low'];
    const index1 = severityOrder.indexOf(sev1);
    const index2 = severityOrder.indexOf(sev2);
    return index1 <= index2 ? sev1 : sev2;
  }

  /**
   * Obtener todos los grupos de errores
   */
  getGroups() {
    return Array.from(this.groups.values());
  }

  /**
   * Obtener grupo de error por fingerprint
   */
  getGroup(fingerprint) {
    return this.groups.get(fingerprint);
  }

  /**
   * Obtener errores repetidos (> 3 veces en última hora)
   */
  getRepeatedErrors() {
    const oneHourAgo = Date.now() - 3600000;
    return Array.from(this.groups.values())
      .filter((group) => {
        const lastError = group.errors[group.errors.length - 1];
        const lastTimestamp = new Date(lastError?.timestamp || group.last).getTime();
        return group.count >= 3 && lastTimestamp > oneHourAgo;
      })
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Obtener endpoints problemáticos
   */
  getProblematicEndpoints() {
    return Array.from(this.problemEndpoints.values())
      .filter((p) => p.count >= 2)
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Obtener endpoint más problemático
   */
  getTopProblematicEndpoint() {
    const endpoints = this.getProblematicEndpoints();
    return endpoints.length > 0 ? endpoints[0] : null;
  }

  /**
   * Estadísticas generales
   */
  getStats() {
    const allErrors = this.getGroups();
    const errorCounts = new Map();

    allErrors.forEach((group) => {
      const type = group.type;
      errorCounts.set(type, (errorCounts.get(type) || 0) + group.count);
    });

    return {
      totalErrorGroups: allErrors.length,
      totalErrors: Array.from(errorCounts.values()).reduce((a, b) => a + b, 0),
      byType: Object.fromEntries(errorCounts),
      repeatedErrors: this.getRepeatedErrors(),
      problematicEndpoints: this.getProblematicEndpoints(),
    };
  }

  /**
   * Limpiar agregador
   */
  clear() {
    this.groups.clear();
    this.problemEndpoints.clear();
  }
}

// Singleton global
export const errorAggregator = new ErrorAggregator();

export default errorAggregator;
