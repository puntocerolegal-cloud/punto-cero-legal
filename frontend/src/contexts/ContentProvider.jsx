// Provider de la Capa de Marketing (Content-as-a-Service) — Punto Cero System OS.
// Orquesta el estado del contenido. La carga blindada (fetch + try/catch + merge
// con FALLBACK) vive en useContent.loadContent(); aquí solo garantizamos que
// `loading` pase a false en `finally`, pase lo que pase, y que nunca se rompa la UI.
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  ContentContext, loadContent, FALLBACK_CONTENT, MARKETING_DASHBOARD_URL,
} from "@/hooks/useContent";

export function ContentProvider({ children }) {
  const [content, setContent] = useState(FALLBACK_CONTENT);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      // loadContent es antifrágil: nunca lanza y siempre devuelve contenido
      // mezclado con FALLBACK_CONTENT (sin campos vacíos/nulos).
      const data = await loadContent();
      setContent(data);
    } finally {
      setLoading(false); // pase lo que pase, la UI deja de cargar
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const value = useMemo(() => ({
    content,
    loading,
    refresh,
    t: (key, fallback = "") => (content[key] != null ? content[key] : fallback),
    marketingDashboardUrl: content["meta.marketingDashboardUrl"] || MARKETING_DASHBOARD_URL,
  }), [content, loading, refresh]);

  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
}

export default ContentProvider;
