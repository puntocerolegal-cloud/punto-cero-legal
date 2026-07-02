/**
 * Event Store Local (MVP)
 *
 * Almacena eventos en memoria (window.__PC_OBSERVABILITY__).
 * Accesible para debug en DevTools.
 * Futuro: enviar a backend para análisis.
 *
 * CAPACIDAD: últimos 500 eventos
 * PROPÓSITO: debugging, performance monitoring, error tracking
 */

const MAX_EVENTS = 500;
const STORAGE_KEY = '__PC_OBSERVABILITY__';

class EventStore {
  constructor() {
    this.events = [];
    this.setupGlobalAccess();
  }

  /**
   * Agregar evento al store
   * Mantiene solo los últimos MAX_EVENTS
   */
  push(event) {
    this.events.push({
      ...event,
      _storedAt: Date.now(),
    });

    // Mantener límite de eventos
    if (this.events.length > MAX_EVENTS) {
      this.events = this.events.slice(-MAX_EVENTS);
    }

    // Sincronizar con window (accesible desde DevTools)
    this.updateGlobalStore();
  }

  /**
   * Obtener todos los eventos
   */
  getAll() {
    return [...this.events];
  }

  /**
   * Obtener últimos N eventos
   */
  getLatest(n = 20) {
    return this.events.slice(-n).reverse();
  }

  /**
   * Filtrar eventos por tipo
   */
  filter(type) {
    return this.events.filter((e) => e.type === type);
  }

  /**
   * Filtrar errores
   */
  getErrors() {
    return this.events.filter((e) => e.type?.includes('error') || !e.success);
  }

  /**
   * Obtener requests por usuario
   */
  getByUser(userId) {
    return this.events.filter((e) => e.userId === userId);
  }

  /**
   * Obtener requests por tenant
   */
  getByTenant(tenantId) {
    return this.events.filter((e) => e.tenantId === tenantId);
  }

  /**
   * Estadísticas de performance
   */
  getPerformanceStats() {
    const requests = this.events.filter((e) => e.type?.startsWith('request'));
    if (requests.length === 0) return null;

    const durations = requests.map((r) => r.duration || 0);
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    const maxDuration = Math.max(...durations);
    const minDuration = Math.min(...durations);
    const errorCount = requests.filter((r) => !r.success).length;
    const successCount = requests.filter((r) => r.success).length;

    return {
      totalRequests: requests.length,
      successCount,
      errorCount,
      errorRate: errorCount / requests.length,
      avgDuration: avgDuration.toFixed(2),
      maxDuration,
      minDuration,
    };
  }

  /**
   * Limpiar eventos
   */
  clear() {
    this.events = [];
    this.updateGlobalStore();
  }

  /**
   * Contar eventos
   */
  getEventCount() {
    return this.events.length;
  }

  /**
   * Hacer accesible desde DevTools
   * window.__PC_OBSERVABILITY__.getLatest()
   * window.__PC_OBSERVABILITY__.getErrors()
   * window.__PC_OBSERVABILITY__.getPerformanceStats()
   */
  setupGlobalAccess() {
    if (typeof window !== 'undefined') {
      window.__PC_OBSERVABILITY__ = {
        getLatest: (n) => this.getLatest(n),
        getAll: () => this.getAll(),
        getErrors: () => this.getErrors(),
        getByUser: (userId) => this.getByUser(userId),
        getByTenant: (tenantId) => this.getByTenant(tenantId),
        getStats: () => this.getPerformanceStats(),
        clear: () => this.clear(),
        count: () => this.getEventCount(),
      };
    }
  }

  /**
   * Sincronizar estado con window
   */
  updateGlobalStore() {
    if (typeof window !== 'undefined') {
      window.__PC_OBSERVABILITY__._events = this.events;
      window.__PC_OBSERVABILITY__._count = this.events.length;
    }
  }
}

// Singleton global
export const eventStore = new EventStore();

export default eventStore;
