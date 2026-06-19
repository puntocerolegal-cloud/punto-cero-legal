// Hook base de recursos del OS — Punto Cero OS.
// Desacopla la UI del origen de datos. Inicializa con el mock síncrono del
// servicio (sin parpadeo de carga) y solo refetch contra backend si el feature
// flag del dominio está activo. Patrón uniforme: { data, loading, error, refresh }.
import { useState, useEffect, useCallback } from "react";
import { features } from "@/config/api/features";

export function useOSResource(service, flagName) {
  const [data, setData] = useState(service._mock);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await service.getDashboard();
      setData(result);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [service]);

  useEffect(() => {
    // Solo va al backend si el dominio tiene su API activa y no estamos en mock maestro.
    if (features[flagName] && !features.ENABLE_MOCKS) {
      refresh();
    }
  }, [refresh, flagName]);

  return { data, loading, error, refresh };
}

export default useOSResource;
