// Store de acciones del dashboard del abogado — Oficina Virtual.
// Singleton con suscripción (no React context): funciona aunque cada página se
// auto-envuelva en DashboardLayout (el hook de la página queda por encima del
// layout). La página registra sus handlers con usePageActions(); la ActionBar
// (dentro del layout) los lee con useActionStore().
import { useState, useEffect } from "react";

let current = {};
const subscribers = new Set();

function setActions(next) {
  current = next || {};
  subscribers.forEach((fn) => fn(current));
}

/**
 * Registra los handlers de la página actual: { onAdd, onEdit, onDelete, onPreview, onPrint }.
 * Se limpian al desmontar la página. `deps` re-registra al cambiar (p. ej. selección).
 */
export function usePageActions(handlers, deps = []) {
  useEffect(() => {
    setActions(handlers || {});
    return () => setActions({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/** La ActionBar se suscribe a los handlers vigentes. */
export function useActionStore() {
  const [actions, set] = useState(current);
  useEffect(() => {
    const fn = (v) => set(v);
    subscribers.add(fn);
    set(current);
    return () => subscribers.delete(fn);
  }, []);
  return actions;
}

export default useActionStore;
