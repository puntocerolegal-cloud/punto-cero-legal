// Lawyer matching and recommendation scoring
export function calculateLawyerMatchScore(lawyer, caseData) {
  let score = 50;
  const reasons = [];

  // Specialty match
  if (lawyer.specialty === caseData.case_type) {
    score += 30;
    reasons.push('Especialidad coincide');
  }

  // Same office
  if (lawyer.office === caseData.office) {
    score += 15;
    reasons.push('Misma oficina');
  }

  // Availability
  if (!lawyer.in_court) {
    score += 10;
    reasons.push('Disponible ahora');
  }

  // Case load
  const caseLoad = lawyer.total_cases || 0;
  if (caseLoad < 3) {
    score += 10;
    reasons.push('Baja carga');
  }

  return {
    score: Math.min(100, score),
    reason: reasons.length > 0 ? reasons.join(', ') : 'Disponible para asignación',
  };
}

// Get recommended lawyers for a case
export function getRecommendedLawyers(lawyers = [], caseData = {}, maxResults = 5) {
  const recommended = lawyers
    .filter(l => l.available !== false && !l.inactive)
    .map(lawyer => ({
      ...lawyer,
      ...calculateLawyerMatchScore(lawyer, caseData),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);

  return recommended;
}

// Lawyer ranking by productivity
export function rankLawyersByProductivity(lawyers = [], cases = []) {
  return lawyers
    .map(lawyer => ({
      ...lawyer,
      closedCases: lawyer.closed_cases || 0,
      openCases: lawyer.total_cases || 0,
      documentsCreated: lawyer.documents_created || 0,
      aiUsage: lawyer.ai_usage || 0,
      assignedClients: lawyer.assigned_clients || 0,
      totalCases: (lawyer.closed_cases || 0) + (lawyer.total_cases || 0),
    }))
    .filter(l => l.openCases > 0 || l.closedCases > 0)
    .sort((a, b) => (b.closedCases + b.openCases) - (a.closedCases + a.openCases));
}

// Priority scoring for lawyers
export function getLawyerPriority(lawyer) {
  const totalCases = (lawyer.total_cases || 0) + (lawyer.closed_cases || 0);
  const productivity = lawyer.documents_created || 0;
  const aiUsage = lawyer.ai_usage || 0;

  // Simple priority: more cases + more productivity = higher priority
  const priorityScore = totalCases * 10 + productivity * 5 + aiUsage * 2;

  if (priorityScore === 0) return "new";
  if (priorityScore < 50) return "low";
  if (priorityScore < 150) return "medium";
  return "high";
}
