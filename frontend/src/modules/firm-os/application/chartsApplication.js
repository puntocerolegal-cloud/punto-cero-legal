// Application layer - Orchestrates charts domain
// NO UI logic, NO components, NO side effects

import {
  buildCasesTrend,
  buildLawyerPerformance,
  buildDepartmentDistribution,
  buildOfficeDistribution,
  buildCapacityTrend,
  buildAlertDistribution,
  buildProductivityTrend,
  buildExecutiveSummary,
  buildTopPerformers,
  buildExecutiveKPIs,
  buildComparisonData,
  buildCasesByStatus,
  buildSpecialtyDistribution,
} from '../domain/chartsDomain';

export function buildDashboardChartsViewModel(lawyers, cases, clients, alerts) {
  return {
    widgets: [
      {
        id: 'kpis',
        type: 'kpis',
        title: 'KPIs Ejecutivos',
        data: buildExecutiveKPIs(lawyers, cases, clients),
      },
      {
        id: 'cases-trend',
        type: 'lineChart',
        title: 'Casos: Abiertos vs Cerrados',
        data: buildCasesTrend(cases),
        xDataKey: 'name',
        lines: [
          { key: 'abiertos', color: '#f59e0b', name: 'Abiertos' },
          { key: 'cerrados', color: '#10b981', name: 'Cerrados' },
        ],
      },
      {
        id: 'department-dist',
        type: 'pieChart',
        title: 'Distribución por Departamento',
        data: buildDepartmentDistribution(lawyers),
      },
      {
        id: 'capacity-trend',
        type: 'areaChart',
        title: 'Capacidad de la Firma',
        data: buildCapacityTrend(lawyers),
        xDataKey: 'semana',
        areas: [
          { key: 'utilizado', color: '#3b82f6', name: 'Utilizado' },
          { key: 'disponible', color: '#e5e7eb', name: 'Disponible' },
        ],
      },
      {
        id: 'alerts-dist',
        type: 'barChart',
        title: 'Alertas por Prioridad',
        data: buildAlertDistribution(alerts),
        xDataKey: 'name',
        bars: [{ key: 'value', color: '#ef4444', name: 'Alertas' }],
      },
      {
        id: 'productivity',
        type: 'lineChart',
        title: 'Productividad Semanal',
        data: buildProductivityTrend(lawyers),
        xDataKey: 'mes',
        lines: [{ key: 'promedio', color: '#8b5cf6', name: 'Promedio' }],
      },
      {
        id: 'top-performers',
        type: 'barChart',
        title: 'Top Abogados',
        data: buildTopPerformers(lawyers),
        xDataKey: 'name',
        bars: [
          { key: 'cerrados', color: '#10b981', name: 'Cerrados' },
          { key: 'abiertos', color: '#f59e0b', name: 'Abiertos' },
        ],
      },
    ],
  };
}

export function buildAnalyticsChartsViewModel(lawyers, cases, clients) {
  return {
    widgets: [
      {
        id: 'comparison-monthly',
        type: 'lineChart',
        title: 'Comparativo Mensual',
        data: buildComparisonData(lawyers),
        xDataKey: 'mes',
        lines: [
          { key: 'thisYear', color: '#3b82f6', name: 'Este Año' },
          { key: 'lastYear', color: '#d1d5db', name: 'Año Anterior' },
        ],
      },
      {
        id: 'cases-by-status',
        type: 'pieChart',
        title: 'Casos por Estado',
        data: buildCasesByStatus(cases),
      },
      {
        id: 'lawyer-performance',
        type: 'barChart',
        title: 'Rendimiento de Abogados',
        data: buildLawyerPerformance(lawyers, cases),
        xDataKey: 'name',
        bars: [
          { key: 'casos', color: '#3b82f6', name: 'Casos' },
          { key: 'cerrados', color: '#10b981', name: 'Cerrados' },
        ],
      },
      {
        id: 'office-distribution',
        type: 'barChart',
        title: 'Distribución por Oficina',
        data: buildOfficeDistribution(lawyers),
        xDataKey: 'name',
        bars: [{ key: 'value', color: '#8b5cf6', name: 'Abogados' }],
      },
      {
        id: 'specialty-dist',
        type: 'pieChart',
        title: 'Especialidades',
        data: buildSpecialtyDistribution(lawyers),
      },
    ],
  };
}

export function buildExecutiveWidgets(lawyers, cases, clients, alerts) {
  const kpis = buildExecutiveKPIs(lawyers, cases, clients);

  return {
    kpis,
    summary: {
      title: 'Resumen Ejecutivo',
      metrics: kpis.map(kpi => ({
        label: kpi.label,
        value: kpi.value,
        change: kpi.change,
      })),
    },
  };
}

export function buildComparisonCards(lawyers, cases) {
  return [
    {
      id: 'cases-completion',
      title: 'Tasa de Cierre',
      current: buildExecutiveKPIs(lawyers, cases, [])[3].value,
      previous: '72%',
      change: '+8%',
      color: 'emerald',
    },
    {
      id: 'lawyer-utilization',
      title: 'Utilización de Equipo',
      current: '85%',
      previous: '78%',
      change: '+7%',
      color: 'blue',
    },
    {
      id: 'client-satisfaction',
      title: 'Satisfacción Clientes',
      current: '92%',
      previous: '88%',
      change: '+4%',
      color: 'purple',
    },
  ];
}
