import { useMemo } from "react";

export function useTeamMetrics(lawyers = []) {
  return useMemo(() => {
    const totalLawyers = lawyers.length;
    const activeLawyers = lawyers.filter(l => !l.inactive && l.status === "activo").length;
    const inactiveLawyers = lawyers.filter(l => l.inactive || l.status !== "activo").length;
    const suspendedLawyers = lawyers.filter(l => l.status === "suspendido").length;
    const availableLawyers = lawyers.filter(l => l.available !== false && !l.inactive).length;
    const busyLawyers = lawyers.filter(l => l.in_court).length;
    const highLoadLawyers = lawyers.filter(l => (l.total_cases || 0) > 5).length;

    return {
      totalLawyers,
      activeLawyers,
      inactiveLawyers,
      suspendedLawyers,
      availableLawyers,
      busyLawyers,
      highLoadLawyers,
    };
  }, [lawyers]);
}
