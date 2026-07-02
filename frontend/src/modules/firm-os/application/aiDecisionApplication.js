// Application layer - Orchestrates AI decision domain
// NO UI logic, NO components, NO side effects

import {
  generateInsights,
  generateRecommendations,
  generatePredictions,
  generateExecutiveSummary,
  calculateDepartmentHealth,
  calculateCapacityForecast,
  calculateBurnoutRisk,
  calculateRiskPrediction,
  calculateRevenuePotential,
} from '../domain/aiDecisionDomain';

export function buildDecisionCenter(lawyers = [], cases = [], clients = [], departments = []) {
  const insights = generateInsights(lawyers, cases, clients, departments);
  const recommendations = generateRecommendations(lawyers, cases, clients, departments);
  const predictions = generatePredictions(lawyers, cases, clients);
  const summary = generateExecutiveSummary(lawyers, cases, clients);

  return {
    insights,
    recommendations,
    predictions,
    summary,
    timestamp: new Date().toISOString(),
  };
}

export function buildRecommendationsView(lawyers = [], cases = [], clients = [], departments = []) {
  const recommendations = generateRecommendations(lawyers, cases, clients, departments);

  return {
    recommendations,
    total: recommendations.length,
    byType: {
      assignment: recommendations.filter(r => r.type === 'assignment').length,
      workload: recommendations.filter(r => r.type === 'workload').length,
      other: recommendations.filter(r => !['assignment', 'workload'].includes(r.type)).length,
    },
  };
}

export function buildPredictionDashboard(lawyers = [], cases = [], clients = []) {
  const predictions = generatePredictions(lawyers, cases, clients);
  const deadlineData = predictions.find(p => p.type === 'deadline');
  const capacityData = predictions.find(p => p.type === 'capacity');

  return {
    predictions,
    deadlineInsights: deadlineData,
    capacityForecast: capacityData?.data || [],
  };
}

export function buildHealthDashboard(lawyers = [], cases = [], departments = []) {
  const deptHealth = departments.map(dept =>
    buildHealthForDepartment(dept, lawyers, cases)
  );

  const healthy = deptHealth.filter(h => h.health === 'excellent' || h.health === 'good').length;
  const warning = deptHealth.filter(h => h.health === 'warning').length;
  const critical = deptHealth.filter(h => h.health === 'critical').length;

  return {
    departments: deptHealth,
    summary: {
      healthy,
      warning,
      critical,
      total: deptHealth.length,
    },
  };
}

function buildHealthForDepartment(dept, lawyers, cases) {
  const health = calculateDepartmentHealth(dept, lawyers, cases);
  return {
    departmentId: dept.id,
    departmentName: dept.name,
    ...health,
  };
}

export function buildExecutiveInsights(lawyers = [], cases = [], clients = []) {
  const summary = generateExecutiveSummary(lawyers, cases, clients);
  const insights = generateInsights(lawyers, cases, clients, []);

  const topRisks = insights.filter(i => i.type === 'risk').slice(0, 3);
  const topAlerts = insights.filter(i => i.type === 'alert').slice(0, 3);
  const opportunities = insights.filter(i => i.type === 'opportunity').slice(0, 3);

  return {
    summary,
    insights: {
      risks: topRisks,
      alerts: topAlerts,
      opportunities,
    },
    generatedAt: new Date().toISOString(),
  };
}

export function buildRiskAnalysis(lawyers = [], cases = []) {
  const risksByLawyer = lawyers.map(lawyer => ({
    lawyerId: lawyer.id,
    lawyerName: lawyer.name,
    ...calculateRiskPrediction(lawyer, cases),
  })).sort((a, b) => b.score - a.score);

  const burnoutByLawyer = lawyers.map(lawyer => ({
    lawyerId: lawyer.id,
    lawyerName: lawyer.name,
    ...calculateBurnoutRisk(lawyer, cases),
  })).sort((a, b) => b.score - a.score);

  return {
    risksByLawyer,
    burnoutByLawyer,
    criticalRisks: risksByLawyer.filter(r => r.riskLevel === 'critical').length,
    burnoutAlerts: burnoutByLawyer.filter(b => b.risk === 'critical').length,
  };
}

export function buildForecastDashboard(lawyers = [], cases = []) {
  const capacityForecast = calculateCapacityForecast(lawyers, cases);

  return {
    forecast: capacityForecast,
    trend: capacityForecast.length > 1
      ? capacityForecast[capacityForecast.length - 1].occupancy > capacityForecast[0].occupancy
        ? 'increasing'
        : 'decreasing'
      : 'stable',
    peak: Math.max(...capacityForecast.map(f => f.occupancy)),
    projectedDate30: capacityForecast[capacityForecast.length - 1],
  };
}

export function buildCapacityDashboard(lawyers = [], cases = [], departments = []) {
  const revenue = calculateRevenuePotential([], cases);

  return {
    totalCapacity: lawyers.length * 50,
    usedCapacity: cases.filter(c => c.status !== 'closed').length,
    availableCapacity: Math.max(0, (lawyers.length * 50) - cases.filter(c => c.status !== 'closed').length),
    occupancyRate: Math.round(
      (cases.filter(c => c.status !== 'closed').length / Math.max(lawyers.length * 50, 1)) * 100
    ),
    revenue,
  };
}
