// Pure domain functions for automation - NO React, NO side effects

export function evaluateRule(rule, context) {
  if (!rule || !context) return null;

  try {
    const condition = new Function('context', `return ${rule.condition}`);
    const result = condition(context);
    
    return {
      ruleId: rule.id,
      ruleName: rule.name,
      passed: result === true,
      timestamp: new Date().toISOString(),
      level: rule.level || 'info',
    };
  } catch (error) {
    return {
      ruleId: rule.id,
      ruleName: rule.name,
      passed: false,
      error: error.message,
      timestamp: new Date().toISOString(),
      level: 'error',
    };
  }
}

export function evaluateRules(rules, context) {
  if (!Array.isArray(rules) || !context) {
    return [];
  }

  return rules
    .map(rule => evaluateRule(rule, context))
    .filter(result => result && result.passed);
}

export function buildRuleContext(lawyers, cases, clients, departments, offices) {
  return {
    lawyers: lawyers || [],
    cases: cases || [],
    clients: clients || [],
    departments: departments || [],
    offices: offices || [],
    totalLawyers: (lawyers || []).length,
    totalCases: (cases || []).length,
    totalClients: (clients || []).length,
    totalDepartments: (departments || []).length,
    totalOffices: (offices || []).length,
    timestamp: Date.now(),
  };
}

export function calculateLawyerCapacity(lawyer, allCases) {
  if (!lawyer) return 0;
  const lawyerCases = Array.isArray(allCases) 
    ? allCases.filter(c => c.assignedLawyer === lawyer.id).length 
    : 0;
  return Math.round((lawyerCases / 50) * 100);
}

export function calculateDepartmentCapacity(department, allLawyers, allCases) {
  if (!department) return 0;
  const deptLawyers = Array.isArray(allLawyers)
    ? allLawyers.filter(l => l.department === department.name || l.department === department.id)
    : [];
  const deptCases = Array.isArray(allCases)
    ? allCases.filter(c => {
        const caseL = deptLawyers.find(l => l.id === c.assignedLawyer);
        return !!caseL;
      })
    : [];
  
  const totalCapacity = deptLawyers.length * 50;
  return totalCapacity > 0 ? Math.round((deptCases.length / totalCapacity) * 100) : 0;
}

export function calculateOfficeCapacity(office, allLawyers) {
  if (!office) return 0;
  const officeLawyers = Array.isArray(allLawyers)
    ? allLawyers.filter(l => l.office === office.name || l.office === office.id)
    : [];
  return officeLawyers.length;
}

export function calculateFirmCapacity(allLawyers, allCases) {
  if (!Array.isArray(allLawyers) || !Array.isArray(allCases)) return 0;
  const totalCapacity = allLawyers.length * 50;
  return totalCapacity > 0 ? Math.round((allCases.length / totalCapacity) * 100) : 0;
}

export function calculateCaseRisk(caseData) {
  if (!caseData) return 0;
  
  let risk = 0;
  if (!caseData.assignedLawyer) risk += 40;
  if (caseData.status === 'pending') risk += 20;
  if (caseData.priority === 'high') risk += 20;
  
  const createdDate = new Date(caseData.createdAt || Date.now());
  const daysSinceCreation = Math.floor((Date.now() - createdDate) / (1000 * 60 * 60 * 24));
  if (daysSinceCreation > 60) risk += 20;
  
  return Math.min(100, risk);
}

export function calculateLawyerRisk(lawyer, allCases) {
  if (!lawyer) return 0;
  
  let risk = 0;
  const lawyerCases = Array.isArray(allCases)
    ? allCases.filter(c => c.assignedLawyer === lawyer.id)
    : [];
  
  if (lawyerCases.length > 45) risk += 50;
  else if (lawyerCases.length > 40) risk += 25;
  
  const inactiveCases = lawyerCases.filter(c => c.status === 'pending').length;
  if (inactiveCases > 10) risk += 30;
  
  if (lawyer.status !== 'activo') risk += 40;
  
  return Math.min(100, risk);
}

export function calculateFirmRisk(lawyers, cases) {
  if (!Array.isArray(lawyers) || !Array.isArray(cases)) return 0;
  
  const lawyerRisks = lawyers.map(l => calculateLawyerRisk(l, cases));
  const caseRisks = cases.map(c => calculateCaseRisk(c));
  
  const avgLawyerRisk = lawyerRisks.length > 0
    ? lawyerRisks.reduce((sum, r) => sum + r, 0) / lawyerRisks.length
    : 0;
  const avgCaseRisk = caseRisks.length > 0
    ? caseRisks.reduce((sum, r) => sum + r, 0) / caseRisks.length
    : 0;
  
  return Math.round((avgLawyerRisk + avgCaseRisk) / 2);
}

export function getUnassignedCases(cases) {
  return Array.isArray(cases)
    ? cases.filter(c => !c.assignedLawyer || c.assignedLawyer === null)
    : [];
}

export function getInactiveCases(cases, days = 30) {
  if (!Array.isArray(cases)) return [];
  
  const threshold = Date.now() - (days * 24 * 60 * 60 * 1000);
  return cases.filter(c => {
    const lastUpdate = new Date(c.updatedAt || c.createdAt || Date.now());
    return lastUpdate.getTime() < threshold && c.status !== 'closed';
  });
}

export function getOverloadedLawyers(lawyers, cases, threshold = 45) {
  if (!Array.isArray(lawyers)) return [];
  
  return lawyers.filter(lawyer => {
    const lawyerCases = Array.isArray(cases)
      ? cases.filter(c => c.assignedLawyer === lawyer.id)
      : [];
    return lawyerCases.length > threshold;
  });
}

export function getIdleLawyers(lawyers, cases) {
  if (!Array.isArray(lawyers)) return [];
  
  return lawyers.filter(lawyer => {
    const lawyerCases = Array.isArray(cases)
      ? cases.filter(c => c.assignedLawyer === lawyer.id && c.status !== 'closed')
      : [];
    return lawyerCases.length === 0 && lawyer.status === 'activo';
  });
}

export function detectBottlenecks(lawyers, cases, departments) {
  const bottlenecks = [];
  
  const unassigned = getUnassignedCases(cases);
  if (unassigned.length > 5) {
    bottlenecks.push({
      type: 'unassigned_cases',
      severity: 'high',
      count: unassigned.length,
      message: `${unassigned.length} casos sin asignar`,
    });
  }
  
  const overloaded = getOverloadedLawyers(lawyers, cases);
  if (overloaded.length > 0) {
    bottlenecks.push({
      type: 'overloaded_lawyers',
      severity: 'medium',
      count: overloaded.length,
      message: `${overloaded.length} abogados sobrecargados`,
    });
  }
  
  const inactive = getInactiveCases(cases);
  if (inactive.length > 0) {
    bottlenecks.push({
      type: 'inactive_cases',
      severity: 'medium',
      count: inactive.length,
      message: `${inactive.length} casos inactivos por más de 30 días`,
    });
  }
  
  return bottlenecks;
}

export function generateRecommendations(lawyers, cases, departments) {
  const recommendations = [];
  
  const unassigned = getUnassignedCases(cases);
  if (unassigned.length > 0) {
    recommendations.push({
      id: 'rec_unassigned',
      title: 'Asignar casos pendientes',
      description: `Hay ${unassigned.length} casos sin asignar que necesitan atención`,
      priority: 'high',
      action: 'Revisar y asignar casos',
    });
  }
  
  const idle = getIdleLawyers(lawyers, cases);
  if (idle.length > 0 && unassigned.length > 0) {
    recommendations.push({
      id: 'rec_redistribution',
      title: 'Redistribuir casos',
      description: `${idle.length} abogados disponibles pueden tomar los ${unassigned.length} casos pendientes`,
      priority: 'high',
      action: 'Redistribuir carga de trabajo',
    });
  }
  
  const overloaded = getOverloadedLawyers(lawyers, cases);
  if (overloaded.length > 0) {
    recommendations.push({
      id: 'rec_hiring',
      title: 'Contratar nuevo abogado',
      description: `La firma está operando al ${calculateFirmCapacity(lawyers, cases)}% de capacidad`,
      priority: 'medium',
      action: 'Considerar expansión del equipo',
    });
  }
  
  return recommendations;
}

export function generateAutomationAlerts(rules, evaluatedRules) {
  if (!Array.isArray(evaluatedRules)) return [];
  
  return evaluatedRules.map(result => ({
    id: `alert_${result.ruleId}_${Date.now()}`,
    ruleId: result.ruleId,
    ruleName: result.ruleName,
    timestamp: result.timestamp,
    level: result.level,
    message: `Regla "${result.ruleName}" fue ejecutada`,
    read: false,
  }));
}

export function validateRule(rule) {
  if (!rule) return { valid: false, error: 'Regla vacía' };
  if (!rule.id) return { valid: false, error: 'Falta ID de regla' };
  if (!rule.name) return { valid: false, error: 'Falta nombre de regla' };
  if (!rule.condition) return { valid: false, error: 'Falta condición de regla' };
  
  return { valid: true };
}

export function serializeRule(rule) {
  return JSON.stringify(rule);
}

export function deserializeRule(json) {
  try {
    return JSON.parse(json);
  } catch (error) {
    return null;
  }
}

export function createRuleSummary(evaluatedRules) {
  if (!Array.isArray(evaluatedRules)) return null;
  
  const passed = evaluatedRules.filter(r => r.passed).length;
  const failed = evaluatedRules.filter(r => !r.passed).length;
  
  return {
    totalEvaluated: evaluatedRules.length,
    passed,
    failed,
    passRate: evaluatedRules.length > 0 ? Math.round((passed / evaluatedRules.length) * 100) : 0,
    timestamp: new Date().toISOString(),
  };
}
