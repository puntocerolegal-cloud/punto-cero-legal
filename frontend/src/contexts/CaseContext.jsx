import React, { createContext, useContext, useState, useCallback } from 'react';

/**
 * Contexto global de Expediente — Punto Cero Legal.
 * Cuando el usuario selecciona un cliente o expediente, este contexto lo conserva
 * (persistido en localStorage) para que los módulos puedan filtrarse por
 * expediente_id / case_id / client_id sin perder el foco al navegar.
 */
const CaseCtx = createContext(null);
const KEY = 'pcl_active_expediente';

export function CaseContextProvider({ children }) {
  const [active, setActive] = useState(() => {
    try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { return null; }
  });

  const select = useCallback((ctx) => {
    setActive(ctx);
    if (ctx) localStorage.setItem(KEY, JSON.stringify(ctx));
    else localStorage.removeItem(KEY);
  }, []);

  const clear = useCallback(() => select(null), [select]);

  return <CaseCtx.Provider value={{ active, select, clear }}>{children}</CaseCtx.Provider>;
}

/** Devuelve el contexto activo. Seguro aunque no haya provider (default no-op). */
export function useCaseContext() {
  return useContext(CaseCtx) || { active: null, select: () => {}, clear: () => {} };
}

export default CaseContextProvider;
