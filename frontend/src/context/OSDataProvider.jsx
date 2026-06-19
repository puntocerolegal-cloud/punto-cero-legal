import React, { createContext, useContext, useRef, useState, useCallback } from "react";
import { eventBus } from "@/core/events/eventBus";

/**
 * OSDataProvider — caché global y refresh coordinado de Punto Cero OS.
 * Preparado para migrar a React Query en el futuro SIN tocar los consumidores:
 * expone getCached/setCached/invalidate/refreshAll y un canal de eventos.
 * No instala dependencias ni cambia el comportamiento actual (los hooks siguen
 * funcionando con su mock; este provider es infraestructura opcional).
 */
const OSDataContext = createContext(null);

export function OSDataProvider({ children }) {
  const cacheRef = useRef(new Map());      // key -> { data, ts }
  const refreshersRef = useRef(new Map()); // key -> fn refresh
  const [version, setVersion] = useState(0); // fuerza re-render al invalidar

  const getCached = useCallback((key) => cacheRef.current.get(key)?.data, []);

  const setCached = useCallback((key, data) => {
    cacheRef.current.set(key, { data, ts: version });
    return data;
  }, [version]);

  const registerRefresher = useCallback((key, fn) => {
    refreshersRef.current.set(key, fn);
    return () => refreshersRef.current.delete(key);
  }, []);

  const invalidate = useCallback((key) => {
    cacheRef.current.delete(key);
    setVersion((v) => v + 1);
  }, []);

  const refreshAll = useCallback(async () => {
    const tasks = Array.from(refreshersRef.current.values()).map((fn) => {
      try { return fn(); } catch (e) { return null; }
    });
    await Promise.allSettled(tasks);
    setVersion((v) => v + 1);
  }, []);

  const value = {
    getCached, setCached, registerRefresher, invalidate, refreshAll,
    events: eventBus, version,
  };

  return <OSDataContext.Provider value={value}>{children}</OSDataContext.Provider>;
}

export function useOSData() {
  const ctx = useContext(OSDataContext);
  if (!ctx) throw new Error("useOSData debe usarse dentro de <OSDataProvider>");
  return ctx;
}

export default OSDataProvider;
