// Pure domain functions for export - NO React, NO side effects, NO fetch
// Data preparation functions for CSV/PDF export

export function prepareLawyersExport(lawyers) {
  if (!Array.isArray(lawyers) || lawyers.length === 0) {
    return {
      headers: ['Nombre', 'Especialidad', 'Departamento', 'Oficina', 'Estado', 'Casos Activos', 'Productividad'],
      rows: [],
      summary: { total: 0, active: 0, inactive: 0 },
    };
  }

  const headers = ['Nombre', 'Especialidad', 'Departamento', 'Oficina', 'Estado', 'Casos Activos', 'Productividad'];
  
  const rows = lawyers.map(l => [
    l.name || 'Sin nombre',
    l.specialty || 'No especificada',
    l.department || 'Sin departamento',
    l.office || 'Sin oficina',
    l.status === 'activo' ? 'Activo' : 'Inactivo',
    l.total_cases || 0,
    l.available !== false ? 'Disponible' : 'Ocupado',
  ]);

  const active = lawyers.filter(l => l.status === 'activo').length;
  const inactive = lawyers.filter(l => l.status !== 'activo').length;

  return {
    headers,
    rows,
    summary: { total: lawyers.length, active, inactive },
  };
}

export function prepareDepartmentsExport(departments) {
  if (!Array.isArray(departments) || departments.length === 0) {
    return {
      headers: ['Departamento', 'Abogados', 'Casos', 'Estado', 'Responsable'],
      rows: [],
      summary: { total: 0, active: 0, totalLawyers: 0, totalCases: 0 },
    };
  }

  const headers = ['Departamento', 'Abogados', 'Casos', 'Estado', 'Responsable'];
  
  const rows = departments.map(d => [
    d.name || 'Sin nombre',
    d.lawyers_count || d.lawyers || 0,
    d.cases_count || d.cases || 0,
    d.status === 'activo' ? 'Activo' : 'Inactivo',
    d.responsible || 'No asignado',
  ]);

  const active = departments.filter(d => d.status === 'activo' || !d.status).length;
  const totalLawyers = departments.reduce((sum, d) => sum + (d.lawyers_count || d.lawyers || 0), 0);
  const totalCases = departments.reduce((sum, d) => sum + (d.cases_count || d.cases || 0), 0);

  return {
    headers,
    rows,
    summary: { total: departments.length, active, totalLawyers, totalCases },
  };
}

export function prepareOfficesExport(offices) {
  if (!Array.isArray(offices) || offices.length === 0) {
    return {
      headers: ['Oficina', 'Ubicación', 'Abogados', 'Casos', 'Estado'],
      rows: [],
      summary: { total: 0, active: 0, totalLawyers: 0, totalCases: 0 },
    };
  }

  const headers = ['Oficina', 'Ubicación', 'Abogados', 'Casos', 'Estado'];
  
  const rows = offices.map(o => [
    o.name || 'Sin nombre',
    `${o.city || 'No especificada'}${o.country ? ', ' + o.country : ''}`,
    o.lawyers_count || o.lawyers || 0,
    o.cases_count || o.cases || 0,
    o.status === 'activa' ? 'Activa' : 'Inactiva',
  ]);

  const active = offices.filter(o => o.status === 'activa').length;
  const totalLawyers = offices.reduce((sum, o) => sum + (o.lawyers_count || o.lawyers || 0), 0);
  const totalCases = offices.reduce((sum, o) => sum + (o.cases_count || o.cases || 0), 0);

  return {
    headers,
    rows,
    summary: { total: offices.length, active, totalLawyers, totalCases },
  };
}

export function prepareAnalyticsExport(lawyers, cases) {
  if (!Array.isArray(lawyers) || lawyers.length === 0) {
    return {
      headers: ['Ranking', 'Abogado', 'Casos Abiertos', 'Casos Cerrados', 'Documentos', 'Uso IA', 'Clientes'],
      rows: [],
      summary: { totalLawyers: 0, totalCases: 0, totalDocuments: 0, totalAIUsage: 0 },
    };
  }

  const headers = ['Ranking', 'Abogado', 'Casos Abiertos', 'Casos Cerrados', 'Documentos', 'Uso IA', 'Clientes'];
  
  const lawyersWithScore = lawyers
    .filter(l => l.total_cases && l.total_cases > 0)
    .map((l, idx) => ({
      ranking: idx + 1,
      name: l.name,
      openCases: l.total_cases || 0,
      closedCases: l.closed_cases || 0,
      documents: l.documents_created || 0,
      aiUsage: l.ai_usage || 0,
      clients: l.assigned_clients || 0,
    }))
    .sort((a, b) => b.openCases - a.openCases);

  const rows = lawyersWithScore.map(l => [
    l.ranking,
    l.name,
    l.openCases,
    l.closedCases,
    l.documents,
    l.aiUsage,
    l.clients,
  ]);

  const totalCases = Array.isArray(cases) ? cases.length : 0;
  const totalDocuments = lawyersWithScore.reduce((sum, l) => sum + l.documents, 0);
  const totalAIUsage = lawyersWithScore.reduce((sum, l) => sum + l.aiUsage, 0);

  return {
    headers,
    rows,
    summary: {
      totalLawyers: lawyersWithScore.length,
      totalCases,
      totalDocuments,
      totalAIUsage,
      topPerformer: lawyersWithScore[0]?.name || 'N/A',
    },
  };
}

export function prepareDashboardExport(kpis, alerts) {
  const headers = ['Métrica', 'Valor', 'Estado'];
  
  const kpiRows = (kpis || []).map(kpi => [
    kpi.label || 'Sin etiqueta',
    kpi.value || '0',
    kpi.status || 'Normal',
  ]);

  const alertRows = (alerts || []).map(alert => [
    'Alerta',
    alert.message || 'Sin mensaje',
    alert.level === 'critical' ? 'Crítica' : alert.level === 'warning' ? 'Advertencia' : 'Información',
  ]);

  const rows = [...kpiRows, ...alertRows];

  return {
    headers,
    rows,
    summary: {
      totalKPIs: kpiRows.length,
      totalAlerts: alertRows.length,
      criticalAlerts: alertRows.filter(r => r[2] === 'Crítica').length,
    },
  };
}

export function prepareAssignmentsExport(cases) {
  if (!Array.isArray(cases) || cases.length === 0) {
    return {
      headers: ['Número de Caso', 'Cliente', 'Tipo', 'Estado', 'Score Recomendación'],
      rows: [],
      summary: { total: 0, pending: 0, assigned: 0 },
    };
  }

  const headers = ['Número de Caso', 'Cliente', 'Tipo', 'Estado', 'Score Recomendación'];
  
  const rows = cases.map(c => [
    c.caseNumber || 'Sin número',
    c.clientName || 'Sin cliente',
    c.caseType || 'No especificado',
    c.status === 'nuevo' ? 'Nuevo' : c.status === 'pendiente' ? 'Pendiente' : 'Asignado',
    c.recommendationScore || '85%',
  ]);

  const pending = cases.filter(c => c.status !== 'asignado').length;
  const assigned = cases.filter(c => c.status === 'asignado').length;

  return {
    headers,
    rows,
    summary: { total: cases.length, pending, assigned },
  };
}

export function createCSVContent(headers, rows) {
  if (!Array.isArray(headers) || !Array.isArray(rows)) {
    return '';
  }

  const headerRow = headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(',');
  
  const dataRows = rows.map(row => {
    return row.map(cell => {
      const value = String(cell ?? '');
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',');
  });

  return [headerRow, ...dataRows].join('\n');
}

export function formatDateForExport(date = new Date()) {
  const d = date instanceof Date ? date : new Date();
  return d.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function formatTimeForExport(date = new Date()) {
  const d = date instanceof Date ? date : new Date();
  return d.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function generateFileName(reportName, format) {
  const date = new Date();
  const dateStr = date.toISOString().split('T')[0];
  const timeStr = date.getHours().toString().padStart(2, '0') +
                   date.getMinutes().toString().padStart(2, '0');
  const safeReportName = (reportName || 'reporte').replace(/\s+/g, '_').toLowerCase();
  const ext = format === 'pdf' ? 'pdf' : 'csv';
  return `${safeReportName}_${dateStr}_${timeStr}.${ext}`;
}
