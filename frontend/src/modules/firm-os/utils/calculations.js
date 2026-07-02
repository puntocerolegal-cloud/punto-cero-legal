// Capacity calculations
export function calculateCapacityPercentage(used, total) {
  return Math.min(100, Math.round((used / total) * 100));
}

// Availability checks
export function isLawyerAvailable(lawyer) {
  return lawyer.available !== false && !lawyer.inactive && lawyer.status !== "suspendido";
}

// Case status counts
export function getCaseStatusCounts(cases = []) {
  const activeCases = cases.filter(c => c.status === "open" || c.status === "in_progress").length;
  const closedCases = cases.filter(c => c.status === "closed").length;
  const newCases = cases.filter(c => !c.assignment_status || c.assignment_status === "nuevo").length;

  return {
    activeCases,
    closedCases,
    newCases,
    totalCases: cases.length,
  };
}

// Lawyer status counts
export function getLawyerStatusCounts(lawyers = []) {
  return {
    total: lawyers.length,
    active: lawyers.filter(l => !l.inactive && l.status === "activo").length,
    inactive: lawyers.filter(l => l.inactive || l.status !== "activo").length,
    suspended: lawyers.filter(l => l.status === "suspendido").length,
    available: lawyers.filter(l => isLawyerAvailable(l)).length,
    inCourt: lawyers.filter(l => l.in_court).length,
    highLoad: lawyers.filter(l => (l.total_cases || 0) > 5).length,
  };
}

// Formatting utilities
export function formatMoney(amount) {
  if (!amount || amount === 0) return "$0";
  return `$${(amount / 1000).toFixed(0)}K`;
}

export function formatPercentage(value) {
  if (typeof value !== 'number') return "0%";
  return `${Math.round(Math.min(100, value))}%`;
}

export function formatNumber(num) {
  if (!num) return "0";
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Lawyer availability logic
export function getLawyerAvailability(lawyer) {
  if (!isLawyerAvailable(lawyer)) {
    return lawyer.status === "suspendido" ? "Suspendido" : "Inactivo";
  }
  if (lawyer.in_court) {
    return "En audiencia";
  }
  if ((lawyer.total_cases || 0) > 5) {
    return "Alta carga";
  }
  return "Disponible";
}
