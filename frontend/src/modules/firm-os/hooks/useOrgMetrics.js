import { useMemo } from "react";

export function useOrgMetrics(lawyers = [], cases = [], clients = [], planCapacity = 5) {
  return useMemo(() => {
    const totalClients = clients.length;
    const totalCases = cases.length;
    const totalLawyers = lawyers.length;
    const activeCases = cases.filter(c => c.status === "open" || c.status === "in_progress").length;
    const closedCases = cases.filter(c => c.status === "closed").length;
    const capacityUsed = totalLawyers;
    const capacityPercentage = Math.min(100, Math.round((capacityUsed / planCapacity) * 100));
    
    // Only use real document counts from cases
    const documentsCount = cases.reduce((sum, c) => sum + (c.documents?.length || 0), 0);

    return {
      totalClients,
      totalCases,
      totalLawyers,
      activeCases,
      closedCases,
      capacityUsed,
      capacityPercentage,
      documentsCount,
    };
  }, [lawyers, cases, clients, planCapacity]);
}
