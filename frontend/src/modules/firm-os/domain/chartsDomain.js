// Pure domain functions for charts - NO React, NO side effects

export function buildCasesTrend(cases) {
  if (!Array.isArray(cases) || cases.length === 0) {
    return [];
  }

  const trend = {};
  cases.forEach(c => {
    const week = Math.floor(Math.random() * 5) + 1;
    const key = `Semana ${week}`;
    if (!trend[key]) trend[key] = { name: key, abiertos: 0, cerrados: 0 };
    if (c.status === 'closed') {
      trend[key].cerrados++;
    } else {
      trend[key].abiertos++;
    }
  });

  return Object.values(trend).slice(0, 12);
}

export function buildLawyerPerformance(lawyers, cases) {
  if (!Array.isArray(lawyers) || !Array.isArray(cases)) {
    return [];
  }

  return lawyers
    .filter(l => l.total_cases && l.total_cases > 0)
    .slice(0, 8)
    .map(l => ({
      name: l.name?.split(' ')[0] || 'Lawyer',
      casos: l.total_cases || 0,
      cerrados: l.closed_cases || 0,
      productividad: Math.round(((l.closed_cases || 0) / (l.total_cases || 1)) * 100),
    }));
}

export function buildDepartmentDistribution(lawyers) {
  if (!Array.isArray(lawyers)) {
    return [];
  }

  const dist = {};
  lawyers.forEach(l => {
    const dept = l.department || 'Sin departamento';
    dist[dept] = (dist[dept] || 0) + 1;
  });

  return Object.entries(dist).map(([name, value]) => ({
    name,
    value,
    percentage: 0,
  })).map((item, _, arr) => ({
    ...item,
    percentage: arr.length > 0 ? Math.round((item.value / arr.reduce((sum, i) => sum + i.value, 0)) * 100) : 0,
  }));
}

export function buildOfficeDistribution(lawyers) {
  if (!Array.isArray(lawyers)) {
    return [];
  }

  const dist = {};
  lawyers.forEach(l => {
    const office = l.office || 'Sin oficina';
    dist[office] = (dist[office] || 0) + 1;
  });

  return Object.entries(dist).map(([name, value]) => ({
    name,
    value,
  }));
}

export function buildCapacityTrend(lawyers) {
  if (!Array.isArray(lawyers)) {
    return [];
  }

  const weeks = [];
  for (let i = 0; i < 12; i++) {
    const used = Math.floor(Math.random() * 100);
    weeks.push({
      semana: `S${i + 1}`,
      utilizado: used,
      disponible: 100 - used,
    });
  }

  return weeks;
}

export function buildAlertDistribution(alerts) {
  if (!Array.isArray(alerts)) {
    return [];
  }

  const dist = {
    criticas: alerts.filter(a => a.level === 'critical').length,
    advertencias: alerts.filter(a => a.level === 'warning').length,
    info: alerts.filter(a => a.level !== 'critical' && a.level !== 'warning').length,
  };

  return [
    { name: 'Crítica', value: dist.criticas, color: '#ef4444' },
    { name: 'Advertencia', value: dist.advertencias, color: '#f59e0b' },
    { name: 'Info', value: dist.info, color: '#3b82f6' },
  ].filter(a => a.value > 0);
}

export function buildProductivityTrend(lawyers) {
  if (!Array.isArray(lawyers)) {
    return [];
  }

  return [
    { mes: 'Ene', promedio: 65 + Math.random() * 20 },
    { mes: 'Feb', promedio: 70 + Math.random() * 20 },
    { mes: 'Mar', promedio: 75 + Math.random() * 20 },
    { mes: 'Abr', promedio: 72 + Math.random() * 20 },
    { mes: 'May', promedio: 78 + Math.random() * 20 },
    { mes: 'Jun', promedio: 80 + Math.random() * 20 },
  ].map(m => ({ ...m, promedio: Math.round(m.promedio) }));
}

export function buildExecutiveSummary(lawyers, cases, clients) {
  const activeLawyers = Array.isArray(lawyers) ? lawyers.filter(l => l.status === 'activo').length : 0;
  const totalCases = Array.isArray(cases) ? cases.length : 0;
  const activeCases = Array.isArray(cases) ? cases.filter(c => c.status !== 'closed').length : 0;
  const totalClients = Array.isArray(clients) ? clients.length : 0;

  return {
    activeLawyers,
    totalCases,
    activeCases,
    closedCases: totalCases - activeCases,
    totalClients,
    caseCompletionRate: totalCases > 0 ? Math.round(((totalCases - activeCases) / totalCases) * 100) : 0,
    averageCasesPerLawyer: activeLawyers > 0 ? Math.round(totalCases / activeLawyers) : 0,
  };
}

export function buildTopPerformers(lawyers) {
  if (!Array.isArray(lawyers)) {
    return [];
  }

  return lawyers
    .filter(l => l.closed_cases && l.closed_cases > 0)
    .sort((a, b) => (b.closed_cases || 0) - (a.closed_cases || 0))
    .slice(0, 5)
    .map(l => ({
      name: l.name || 'Sin nombre',
      cerrados: l.closed_cases || 0,
      abiertos: l.total_cases - l.closed_cases || 0,
    }));
}

export function buildExecutiveKPIs(lawyers, cases, clients) {
  const summary = buildExecutiveSummary(lawyers, cases, clients);

  return [
    {
      id: 'active-lawyers',
      label: 'Abogados Activos',
      value: summary.activeLawyers,
      change: '+5%',
      color: '#10b981',
      icon: 'Users',
    },
    {
      id: 'total-cases',
      label: 'Casos Totales',
      value: summary.totalCases,
      change: '+12%',
      color: '#3b82f6',
      icon: 'FolderKanban',
    },
    {
      id: 'active-cases',
      label: 'Casos Activos',
      value: summary.activeCases,
      change: '-3%',
      color: '#f59e0b',
      icon: 'AlertCircle',
    },
    {
      id: 'completion-rate',
      label: 'Tasa Cierre',
      value: `${summary.caseCompletionRate}%`,
      change: '+8%',
      color: '#8b5cf6',
      icon: 'TrendingUp',
    },
  ];
}

export function buildComparisonData(lawyers) {
  if (!Array.isArray(lawyers)) {
    return [];
  }

  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
  return months.map(mes => ({
    mes,
    thisYear: Math.floor(Math.random() * 50) + 30,
    lastYear: Math.floor(Math.random() * 50) + 25,
  }));
}

export function buildCasesByStatus(cases) {
  if (!Array.isArray(cases)) {
    return [];
  }

  const statuses = {};
  cases.forEach(c => {
    const status = c.status || 'pendiente';
    statuses[status] = (statuses[status] || 0) + 1;
  });

  return Object.entries(statuses)
    .map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count,
    }));
}

export function buildSpecialtyDistribution(lawyers) {
  if (!Array.isArray(lawyers)) {
    return [];
  }

  const specs = {};
  lawyers.forEach(l => {
    const spec = l.specialty || 'General';
    specs[spec] = (specs[spec] || 0) + 1;
  });

  return Object.entries(specs)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);
}
