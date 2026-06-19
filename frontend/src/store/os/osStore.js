import React, { createContext, useContext, useState, useMemo, useCallback } from "react";

/**
 * Estado global del OS (sin Redux, Context API) — Punto Cero OS.
 * Mantiene selección compartida entre módulos: organización, partner, vertical.
 * Preparado para crecer (filtros globales, rango de fechas, etc.).
 */
const OSStoreContext = createContext(null);

export function OSStoreProvider({ children }) {
  const [selectedOrganization, setSelectedOrganization] = useState(null);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [selectedVertical, setSelectedVertical] = useState(null);

  const reset = useCallback(() => {
    setSelectedOrganization(null);
    setSelectedPartner(null);
    setSelectedVertical(null);
  }, []);

  const value = useMemo(
    () => ({
      selectedOrganization, setSelectedOrganization,
      selectedPartner, setSelectedPartner,
      selectedVertical, setSelectedVertical,
      reset,
    }),
    [selectedOrganization, selectedPartner, selectedVertical, reset]
  );

  return <OSStoreContext.Provider value={value}>{children}</OSStoreContext.Provider>;
}

export function useOSStore() {
  const ctx = useContext(OSStoreContext);
  if (!ctx) throw new Error("useOSStore debe usarse dentro de <OSStoreProvider>");
  return ctx;
}

export default useOSStore;
