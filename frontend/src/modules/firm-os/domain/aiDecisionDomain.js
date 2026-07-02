// Pure domain functions for AI decision engine - NO React, NO external APIs, NO side effects

export const CONFIDENCE_LEVELS = {
  VERY_LOW: 'very_low',
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  VERY_HIGH: 'very_high',
};

export const INSIGHT_TYPES = {
  RECOMMENDATION: 'recommendation',
  PREDICTION: 'prediction',
  RISK: 'risk',
  OPPORTUNITY: 'opportunity',
  ALERT: 'alert',
};

// ============================================================================
// SCORING FUNCTIONS
// ============================================================================

export function calculateLawyerScore(lawyer, cases = [], allLawyers = []) {
  if (!lawyer) return { score: 0, factors: {} };

  const score = {};

  // Workload balance (40%)
  const avgCaseCount = allLawyers.length > 0
    ? allLawyers.reduce((sum, l) => sum + (cases.filter(c => c.assignedLawyer === l.id).length), 0) / allLawyers.length
    : 0;
  const caseCount = cases.filter(c => c.assignedLawyer === lawyer.id).length;
  const workloadFactor = Math.max(0, 1 - (caseCount / Math.max(avgCaseCount + 5, 1)));
  score.workload = workloadFactor * 0.4;

  // Specialization match (30%)
  const specialtyFactor = (lawyer.specialties && lawyer.specialties.length > 0) ? 0.3 : 0.15;
  score.specialization = specialtyFactor;

  // Experience level (20%)
  const experienceYears = lawyer.yearsOfExperience || 0;
  const experienceFactor = Math.min(1, experienceYears / 20) * 0.2;
  score.experience = experienceFactor;

  // Performance (10%)
  const successRate = lawyer.caseSuccessRate || 0.75;
  score.performance = (successRate / 100) * 0.1;

  const totalScore = Object.values(score).reduce((a, b) => a + b, 0);

  return {
    score: Math.round(totalScore * 100),
    factors: score,
    explanation: `Carga de trabajo: ${Math.round(workloadFactor * 100)}%, Especialización: ${Math.round(specialtyFactor * 100)}%, Experiencia: ${Math.round(experienceFactor * 100)}%, Desempeño: ${Math.round((successRate / 100) * 10)}%`,
  };
}

export function calculateCasePriority(caseData, allCases = []) {
  if (!caseData) return { priority: 'medium', score: 0, factors: {} };

  const score = {};

  // Urgency (30%)
  const daysUntilDue = caseData.dueDate
    ? Math.ceil((new Date(caseData.dueDate) - new Date()) / (1000 * 60 * 60 * 24))
    : 60;
  const urgencyScore = Math.max(0, 1 - (daysUntilDue / 90));
  score.urgency = urgencyScore * 0.3;

  // Value (25%)
  const caseValue = caseData.estimatedValue || 0;
  const avgValue = allCases.length > 0
    ? allCases.reduce((sum, c) => sum + (c.estimatedValue || 0), 0) / allCases.length
    : 1;
  const valueScore = Math.min(1, (caseValue / Math.max(avgValue, 1)) * 0.5);
  score.value = valueScore * 0.25;

  // Complexity (25%)
  const complexityMap = { simple: 0.2, normal: 0.5, complex: 0.8, critical: 1.0 };
  const complexityScore = complexityMap[caseData.complexity] || 0.5;
  score.complexity = complexityScore * 0.25;

  // Status (20%)
  const statusMap = { pending: 0.8, active: 0.6, review: 0.9, closed: 0.0 };
  const statusScore = statusMap[caseData.status] || 0.5;
  score.status = statusScore * 0.2;

  const totalScore = Object.values(score).reduce((a, b) => a + b, 0);
  const priority = totalScore > 0.65 ? 'critical' : totalScore > 0.45 ? 'high' : totalScore > 0.25 ? 'medium' : 'low';

  return {
    priority,
    score: Math.round(totalScore * 100),
    factors: score,
  };
}

export function calculateAssignmentRecommendation(caseData, lawyers = [], departments = []) {
  if (!caseData || !lawyers.length) return null;

  const casePriority = calculateCasePriority(caseData, [caseData]);
  const caseSpecialty = caseData.specialty || caseData.department;

  const recommendations = lawyers.map(lawyer => {
    const lawyerScore = calculateLawyerScore(lawyer, [], lawyers);

    // Match specialty
    const specialtyMatch = (lawyer.specialties || []).includes(caseSpecialty) ? 1 : 0.5;

    // Calculate final recommendation score
    const finalScore = (lawyerScore.score / 100) * 0.6 + (specialtyMatch * 100 / 100) * 0.4;
    const confidence = finalScore > 75 ? 'very_high' : finalScore > 60 ? 'high' : 'medium';

    return {
      lawyerId: lawyer.id,
      lawyerName: lawyer.name,
      score: Math.round(finalScore),
      confidence,
      factors: {
        workload: lawyerScore.factors.workload,
        specialization: specialtyMatch,
        experience: lawyerScore.factors.experience,
        performance: lawyerScore.factors.performance,
      },
      explanation: `Abogado con ${lawyerScore.score}pts de capacidad y ${Math.round(specialtyMatch * 100)}% de coincidencia especializada`,
    };
  }).sort((a, b) => b.score - a.score);

  return recommendations[0] || null;
}

export function calculateDepartmentHealth(department, lawyers = [], cases = []) {
  if (!department) return { health: 'good', score: 0, factors: {} };

  const deptLawyers = lawyers.filter(l => l.department === department.name || l.department === department.id);
  const deptCases = cases.filter(c => {
    const caseL = deptLawyers.find(l => l.id === c.assignedLawyer);
    return !!caseL;
  });

  const score = {};

  // Capacity (40%)
  const totalCapacity = deptLawyers.length * 50;
  const occupancyRate = totalCapacity > 0 ? deptCases.length / totalCapacity : 0;
  const capacityScore = Math.max(0, 1 - (occupancyRate / 1.2));
  score.capacity = capacityScore * 0.4;

  // Team size (20%)
  const teamSizeScore = deptLawyers.length > 0 ? Math.min(1, deptLawyers.length / 10) : 0;
  score.teamSize = teamSizeScore * 0.2;

  // Case diversity (20%)
  const specialties = new Set(deptLawyers.flatMap(l => l.specialties || []));
  const diversityScore = Math.min(1, specialties.size / 5);
  score.diversity = diversityScore * 0.2;

  // Performance (20%)
  const avgSuccessRate = deptLawyers.length > 0
    ? deptLawyers.reduce((sum, l) => sum + (l.caseSuccessRate || 75), 0) / deptLawyers.length / 100
    : 0.75;
  score.performance = Math.min(1, avgSuccessRate) * 0.2;

  const totalScore = Object.values(score).reduce((a, b) => a + b, 0);
  const health = totalScore > 0.7 ? 'excellent' : totalScore > 0.5 ? 'good' : totalScore > 0.3 ? 'warning' : 'critical';

  return {
    health,
    score: Math.round(totalScore * 100),
    capacity: occupancyRate,
    occupancyRate: Math.round(occupancyRate * 100),
    factors: score,
    teamSize: deptLawyers.length,
  };
}

export function calculateClientImportance(client, cases = [], allClients = []) {
  if (!client) return { importance: 'low', score: 0 };

  const score = {};

  // Revenue (40%)
  const clientCases = cases.filter(c => c.clientId === client.id);
  const totalValue = clientCases.reduce((sum, c) => sum + (c.estimatedValue || 0), 0);
  const avgValue = allClients.length > 0
    ? allClients.reduce((sum, cl) => {
        const clCases = cases.filter(c => c.clientId === cl.id);
        return sum + clCases.reduce((s, c) => s + (c.estimatedValue || 0), 0);
      }, 0) / allClients.length
    : 1;
  const revenueScore = Math.min(1, totalValue / Math.max(avgValue, 1));
  score.revenue = revenueScore * 0.4;

  // Case count (30%)
  const avgCaseCount = allClients.length > 0
    ? allClients.reduce((sum, cl) => sum + cases.filter(c => c.clientId === cl.id).length, 0) / allClients.length
    : 1;
  const caseCountScore = Math.min(1, clientCases.length / Math.max(avgCaseCount, 1));
  score.caseCount = caseCountScore * 0.3;

  // VIP status (30%)
  const vipScore = client.isVIP ? 1 : client.tier === 'premium' ? 0.7 : 0.3;
  score.vip = vipScore * 0.3;

  const totalScore = Object.values(score).reduce((a, b) => a + b, 0);
  const importance = totalScore > 0.65 ? 'critical' : totalScore > 0.45 ? 'high' : totalScore > 0.25 ? 'medium' : 'low';

  return {
    importance,
    score: Math.round(totalScore * 100),
    casesCount: clientCases.length,
    totalValue,
    factors: score,
  };
}

export function calculateWorkloadBalance(lawyers = [], cases = []) {
  if (!lawyers.length) return { balance: 0, variance: 0, recommendation: 'No data' };

  const workloads = lawyers.map(l => cases.filter(c => c.assignedLawyer === l.id).length);
  const avgWorkload = workloads.reduce((a, b) => a + b, 0) / workloads.length;

  // Calculate variance
  const variance = workloads.reduce((sum, w) => sum + Math.pow(w - avgWorkload, 2), 0) / workloads.length;
  const stdDev = Math.sqrt(variance);

  return {
    balance: Math.round((1 - (stdDev / avgWorkload)) * 100),
    variance: Math.round(stdDev),
    avgWorkload: Math.round(avgWorkload),
    recommendation: stdDev > avgWorkload * 0.3 ? 'Redistribute cases' : 'Balanced',
  };
}

export function calculateRiskPrediction(lawyer, cases = []) {
  if (!lawyer) return { riskLevel: 'low', score: 0, factors: {} };

  const lawyerCases = cases.filter(c => c.assignedLawyer === lawyer.id);
  const atRiskCases = lawyerCases.filter(c => {
    const daysUntilDue = c.dueDate
      ? Math.ceil((new Date(c.dueDate) - new Date()) / (1000 * 60 * 60 * 24))
      : 60;
    return daysUntilDue < 14;
  });

  const score = {};

  // Case pressure (40%)
  const pressureScore = Math.min(1, atRiskCases.length / Math.max(lawyerCases.length || 1, 1));
  score.pressure = pressureScore * 0.4;

  // Workload (30%)
  const workloadScore = Math.min(1, lawyerCases.length / 60);
  score.workload = workloadScore * 0.3;

  // Experience (20%)
  const experienceScore = Math.max(0, 1 - (lawyer.yearsOfExperience || 5) / 20);
  score.experience = experienceScore * 0.2;

  // Success rate (10%)
  const successScore = Math.max(0, 1 - ((lawyer.caseSuccessRate || 75) / 100));
  score.successRate = successScore * 0.1;

  const totalScore = Object.values(score).reduce((a, b) => a + b, 0);
  const riskLevel = totalScore > 0.6 ? 'critical' : totalScore > 0.4 ? 'high' : totalScore > 0.2 ? 'medium' : 'low';

  return {
    riskLevel,
    score: Math.round(totalScore * 100),
    atRiskCases: atRiskCases.length,
    totalCases: lawyerCases.length,
    factors: score,
  };
}

export function calculateDeadlinePrediction(cases = []) {
  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const thisWeek = cases.filter(c => {
    const due = new Date(c.dueDate);
    return due <= nextWeek && due >= now;
  });

  const thisMonth = cases.filter(c => {
    const due = new Date(c.dueDate);
    return due <= nextMonth && due >= now;
  });

  return {
    nextWeek: thisWeek.length,
    nextMonth: thisMonth.length,
    atRisk: thisWeek.filter(c => !c.assignedLawyer).length,
    predictions: [
      { label: 'Esta semana', value: thisWeek.length, risk: thisWeek.filter(c => !c.assignedLawyer).length },
      { label: 'Este mes', value: thisMonth.length, risk: thisMonth.filter(c => !c.assignedLawyer).length },
    ],
  };
}

export function calculateCapacityForecast(lawyers = [], cases = []) {
  const projections = [];

  for (let days = 0; days <= 30; days += 5) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const futureCases = cases.filter(c => {
      const dueDate = new Date(c.dueDate);
      return dueDate <= futureDate && c.status !== 'closed';
    });

    const totalCapacity = lawyers.length * 50;
    const occupancy = totalCapacity > 0 ? (futureCases.length / totalCapacity) * 100 : 0;

    projections.push({
      days,
      date: futureDate.toISOString().split('T')[0],
      occupancy: Math.round(occupancy),
      caseCount: futureCases.length,
      available: Math.max(0, totalCapacity - futureCases.length),
    });
  }

  return projections;
}

export function calculateBurnoutRisk(lawyer, cases = []) {
  if (!lawyer) return { risk: 'low', score: 0 };

  const lawyerCases = cases.filter(c => c.assignedLawyer === lawyer.id);
  const criticalCases = lawyerCases.filter(c => {
    const daysUntilDue = c.dueDate
      ? Math.ceil((new Date(c.dueDate) - new Date()) / (1000 * 60 * 60 * 24))
      : 60;
    return daysUntilDue < 7;
  });

  const workloadScore = Math.min(1, lawyerCases.length / 50);
  const pressureScore = Math.min(1, criticalCases.length / 5);
  const experienceScore = Math.max(0, 1 - (lawyer.yearsOfExperience || 5) / 20);

  const totalScore = (workloadScore * 0.5 + pressureScore * 0.35 + experienceScore * 0.15) * 100;

  const risk = totalScore > 70 ? 'critical' : totalScore > 50 ? 'high' : totalScore > 30 ? 'medium' : 'low';

  return {
    risk,
    score: Math.round(totalScore),
    criticalCases: criticalCases.length,
  };
}

export function calculateRevenuePotential(clients = [], cases = []) {
  const byClient = clients.map(client => {
    const clientCases = cases.filter(c => c.clientId === client.id && c.status !== 'closed');
    const potential = clientCases.reduce((sum, c) => sum + (c.estimatedValue || 0), 0);
    return {
      clientId: client.id,
      clientName: client.name,
      potential,
      caseCount: clientCases.length,
      isVIP: client.isVIP,
    };
  }).sort((a, b) => b.potential - a.potential);

  const totalPotential = byClient.reduce((sum, c) => sum + c.potential, 0);

  return {
    total: Math.round(totalPotential),
    topClients: byClient.slice(0, 5),
    byClient,
  };
}

// ============================================================================
// INSIGHT GENERATION
// ============================================================================

export function generateInsights(lawyers = [], cases = [], clients = [], departments = []) {
  const insights = [];

  // Top risk insights
  const riskByLawyer = lawyers
    .map(l => ({ ...calculateRiskPrediction(l, cases), lawyerId: l.id, lawyerName: l.name }))
    .filter(r => r.riskLevel !== 'low')
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  riskByLawyer.forEach(risk => {
    insights.push({
      type: INSIGHT_TYPES.RISK,
      title: `Riesgo alto en ${risk.lawyerName}`,
      description: `${risk.atRiskCases} casos críticos en próximos 14 días`,
      severity: risk.riskLevel,
      confidence: 'high',
      score: risk.score,
      factors: Object.keys(risk.factors),
    });
  });

  // Burnout indicators
  const burnoutRisks = lawyers
    .map(l => ({ ...calculateBurnoutRisk(l, cases), lawyerId: l.id, lawyerName: l.name }))
    .filter(b => b.risk !== 'low')
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  burnoutRisks.forEach(burn => {
    insights.push({
      type: INSIGHT_TYPES.ALERT,
      title: `Síntomas de burnout en ${burn.lawyerName}`,
      description: `Carga de trabajo crítica detectada`,
      severity: burn.risk,
      confidence: 'medium',
      score: burn.score,
    });
  });

  return insights.slice(0, 10);
}

export function generateRecommendations(lawyers = [], cases = [], clients = [], departments = []) {
  const recommendations = [];

  // Assignment recommendations for unassigned cases
  const unassignedCases = cases.filter(c => !c.assignedLawyer).slice(0, 5);

  unassignedCases.forEach(caseData => {
    const recommendation = calculateAssignmentRecommendation(caseData, lawyers, departments);
    if (recommendation) {
      recommendations.push({
        type: 'assignment',
        caseId: caseData.id,
        caseName: caseData.name,
        recommendation: recommendation.lawyerName,
        score: recommendation.score,
        confidence: recommendation.confidence,
        explanation: recommendation.explanation,
      });
    }
  });

  // Workload rebalancing
  const balance = calculateWorkloadBalance(lawyers, cases);
  if (balance.recommendation === 'Redistribute cases') {
    recommendations.push({
      type: 'workload',
      title: 'Rebalancear carga de trabajo',
      description: 'Desviación estándar detectada en distribución de casos',
      score: Math.round((1 - balance.balance / 100) * 100),
      confidence: 'high',
      explanation: `Desviación: ${balance.variance} casos`,
    });
  }

  return recommendations;
}

export function generatePredictions(lawyers = [], cases = [], clients = []) {
  const predictions = [];

  // Deadline prediction
  const deadlineData = calculateDeadlinePrediction(cases);
  predictions.push({
    type: 'deadline',
    title: 'Predicción de plazos',
    nextWeek: deadlineData.nextWeek,
    nextMonth: deadlineData.nextMonth,
    atRisk: deadlineData.atRisk,
    confidence: 'very_high',
  });

  // Capacity forecast
  const capacityForecast = calculateCapacityForecast(lawyers, cases);
  predictions.push({
    type: 'capacity',
    title: 'Forecast de capacidad',
    data: capacityForecast,
    confidence: 'high',
  });

  return predictions;
}

export function generateExecutiveSummary(lawyers = [], cases = [], clients = []) {
  return {
    totalLawyers: lawyers.length,
    totalCases: cases.length,
    totalClients: clients.length,
    avgCasesPerLawyer: lawyers.length > 0 ? Math.round(cases.length / lawyers.length) : 0,
    openCases: cases.filter(c => c.status !== 'closed').length,
    casesAtRisk: cases.filter(c => {
      const days = c.dueDate ? Math.ceil((new Date(c.dueDate) - new Date()) / (1000 * 60 * 60 * 24)) : 60;
      return days < 14;
    }).length,
    totalRevenuePotential: Math.round(
      cases.filter(c => c.status !== 'closed').reduce((sum, c) => sum + (c.estimatedValue || 0), 0)
    ),
    healthScore: 75, // Will be calculated from various metrics
  };
}

export function serializeInsights(insights) {
  if (!insights) return '{}';
  try {
    return JSON.stringify(insights);
  } catch (error) {
    return '{}';
  }
}

export function deserializeInsights(json) {
  if (!json || typeof json !== 'string') return null;
  try {
    return JSON.parse(json);
  } catch (error) {
    return null;
  }
}
