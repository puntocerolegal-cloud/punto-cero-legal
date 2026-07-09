// Pure domain logic for dashboard composition
import { calculateLawyerMetrics } from "./lawyerDomain";
import { calculateCaseMetrics, calculateCaseLoad } from "./caseDomain";
import { calculateOrganizationMetrics } from "./organizationDomain";
import { generateAlerts } from "./alertsDomain";

export function composeFirmDashboardData(lawyers = [], cases = [], clients = [], planName = null) {
  const planCapacity = planName === "consolidacion-empresarial" ? 10 : 5;

  const teamMetrics = calculateLawyerMetrics(lawyers);
  const caseMetrics = calculateCaseMetrics(cases);
  const orgMetrics = calculateOrganizationMetrics(lawyers, cases, clients, planCapacity);
  const alerts = generateAlerts(lawyers, cases, clients, planName);

  return {
    // Firm state
    state: {
      firmId: null,
      planName,
      planCapacity,
      status: "ACTIVO",
    },

    // Team metrics
    team: teamMetrics,

    // Case metrics
    cases: caseMetrics,

    // Organization metrics
    organization: orgMetrics,

    // Alerts
    alerts,

    // Derived data
    derived: {
      newCases: caseMetrics.newCases,
      totalRevenue: lawyers.reduce((sum, l) => sum + (l.revenue || 0), 0),
      avgCaseLoadPerLawyer: teamMetrics.totalLawyers > 0 ? caseMetrics.activeCases / teamMetrics.totalLawyers : 0,
      overloaded: teamMetrics.highLoadLawyers > 0,
      atCapacity: orgMetrics.capacityPercentage >= 80,
      allClear: alerts.every(a => a.type === "success"),
    },
  };
}

export function composeFirmAnalyticsData(lawyers = [], cases = [], clients = []) {
  const teamMetrics = calculateLawyerMetrics(lawyers);
  const caseMetrics = calculateCaseMetrics(cases);

  const lawyerRankings = lawyers
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

  const topByDocuments = lawyers.reduce((max, l) => (l.documents_created || 0) > (max.documents_created || 0) ? l : max, lawyerRankings[0] || {});
  const topByAI = lawyers.reduce((max, l) => (l.ai_usage || 0) > (max.ai_usage || 0) ? l : max, lawyerRankings[0] || {});

  return {
    metrics: {
      activeCases: caseMetrics.activeCases,
      closedCases: caseMetrics.closedCases,
      activeLawyers: teamMetrics.activeLawyers,
      totalCases: caseMetrics.totalCases,
    },
    rankings: lawyerRankings,
    topPerformers: {
      byLoad: lawyerRankings[0],
      byDocuments: topByDocuments,
      byAI: topByAI,
    },
  };
}

export function composeAlertsData(lawyers = [], cases = [], clients = [], planName = null) {
  const alerts = generateAlerts(lawyers, cases, clients, planName);

  return {
    alerts,
    counts: {
      total: alerts.length,
      critical: alerts.filter(a => a.type === "critical").length,
      warning: alerts.filter(a => a.type === "warning").length,
      info: alerts.filter(a => a.type === "info").length,
    },
  };
}

export function composeAssignmentsData(lawyers = [], cases = []) {
  const pendingCases = cases.filter(c => !c.assignment_status || c.assignment_status === "nuevo");
  const availableLawyers = lawyers.filter(l => l.available !== false && !l.inactive);

  return {
    cases: {
      pending: pendingCases,
      total: cases.length,
    },
    lawyers: {
      available: availableLawyers,
      total: lawyers.length,
    },
    capacity: {
      utilization: availableLawyers.reduce((max, l) => Math.max(max, calculateCaseLoad(cases, l.id)), 0),
    },
  };
}

export function composeTeamData(lawyers = []) {
  const metrics = calculateLawyerMetrics(lawyers);

  const byDepartment = {};
  lawyers.forEach(l => {
    const dept = l.department || "Sin departamento";
    byDepartment[dept] = (byDepartment[dept] || 0) + 1;
  });

  const byOffice = {};
  lawyers.forEach(l => {
    const office = l.office || "Sin oficina";
    byOffice[office] = (byOffice[office] || 0) + 1;
  });

  return {
    metrics,
    distribution: {
      byDepartment: Object.entries(byDepartment).map(([name, count]) => ({ name, count })),
      byOffice: Object.entries(byOffice).map(([name, count]) => ({ name, count })),
    },
    list: lawyers,
  };
}
