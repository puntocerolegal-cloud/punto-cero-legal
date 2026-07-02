// Pure domain logic for lawyers
export function calculateLawyerMetrics(lawyers = []) {
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
}

export function getLawyerStatus(lawyer) {
  if (lawyer.status === "suspendido" || lawyer.suspended) {
    return "Suspendido";
  }
  if (lawyer.inactive) {
    return "Inactivo";
  }
  if (lawyer.in_court) {
    return "En audiencia";
  }
  if ((lawyer.total_cases || 0) > 5) {
    return "Alta carga";
  }
  return "Disponible";
}

export function getLawyerAvailability(lawyer) {
  if (lawyer.available === false || lawyer.inactive) {
    return false;
  }
  if (lawyer.in_court) {
    return false;
  }
  return true;
}

export function calculateLawyerMatchScore(lawyer, caseData) {
  let score = 50;
  const reasons = [];

  if (lawyer.specialty === caseData.case_type) {
    score += 30;
    reasons.push("Especialidad coincide");
  }

  if (lawyer.office === caseData.office) {
    score += 15;
    reasons.push("Misma oficina");
  }

  if (!lawyer.in_court) {
    score += 10;
    reasons.push("Disponible ahora");
  }

  const caseLoad = lawyer.total_cases || 0;
  if (caseLoad < 3) {
    score += 10;
    reasons.push("Baja carga");
  }

  return {
    score: Math.min(100, score),
    reason: reasons.length > 0 ? reasons.join(", ") : "Disponible para asignación",
  };
}

export function getRecommendedLawyers(lawyers = [], caseData = {}, maxResults = 5) {
  const recommended = lawyers
    .filter(l => getLawyerAvailability(l))
    .map(lawyer => ({
      ...lawyer,
      ...calculateLawyerMatchScore(lawyer, caseData),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);

  return recommended;
}

export function rankLawyersByProductivity(lawyers = []) {
  return lawyers
    .map(lawyer => ({
      ...lawyer,
      totalCases: (lawyer.total_cases || 0) + (lawyer.closed_cases || 0),
      closedCases: lawyer.closed_cases || 0,
      openCases: lawyer.total_cases || 0,
      documentsCreated: lawyer.documents_created || 0,
      aiUsage: lawyer.ai_usage || 0,
      assignedClients: lawyer.assigned_clients || 0,
    }))
    .filter(l => l.openCases > 0 || l.closedCases > 0)
    .sort((a, b) => (b.closedCases + b.openCases) - (a.closedCases + a.openCases));
}

export function getLawyerPriority(lawyer) {
  const productivityScore = (lawyer.total_cases || 0) * 10 + (lawyer.closed_cases || 0) * 20;
  const aiUsage = lawyer.ai_usage || 0;
  const priorityScore = productivityScore + (lawyer.revenue || 0) * 10 + aiUsage * 2;

  if (priorityScore === 0) return "new";
  if (priorityScore < 50) return "low";
  if (priorityScore < 150) return "medium";
  return "high";
}
