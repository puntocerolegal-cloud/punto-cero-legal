// Event Bus de Punto Cero OS — pub/sub liviano para sincronización futura
// entre módulos (sin dependencias). Listo para que, al conectar el backend,
// un módulo emita y otros reaccionen (p. ej. refrescar dashboards).

export const OS_EVENTS = {
  tenantChanged: "tenantChanged",
  organizationCreated: "organizationCreated",
  organizationUpdated: "organizationUpdated",
  partnerConverted: "partnerConverted",
  partnerCreated: "partnerCreated",
  partnerUpdated: "partnerUpdated",
  partnerDeleted: "partnerDeleted",
  implementationStarted: "implementationStarted",
  implementationCompleted: "implementationCompleted",
  implementationCreated: "implementationCreated",
  implementationUpdated: "implementationUpdated",
  implementationDeleted: "implementationDeleted",
  implementationStageChanged: "implementationStageChanged",
  subscriptionActivated: "subscriptionActivated",
  subscriptionCreated: "subscriptionCreated",
  subscriptionUpdated: "subscriptionUpdated",
  subscriptionDeleted: "subscriptionDeleted",
  subscriptionRenewed: "subscriptionRenewed",
  subscriptionStatusChanged: "subscriptionStatusChanged",
  invoiceCreated: "invoiceCreated",
  invoiceUpdated: "invoiceUpdated",
  invoiceDeleted: "invoiceDeleted",
  invoicePaid: "invoicePaid",
};

function createEventBus() {
  const listeners = new Map(); // event -> Set<fn>

  return {
    on(event, handler) {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event).add(handler);
      return () => this.off(event, handler); // unsubscribe
    },
    off(event, handler) {
      listeners.get(event)?.delete(handler);
    },
    emit(event, payload) {
      listeners.get(event)?.forEach((fn) => {
        try { fn(payload); } catch (e) { /* aislamos fallos de un listener */ }
      });
    },
    clear() { listeners.clear(); },
  };
}

export const eventBus = createEventBus();
export default eventBus;
