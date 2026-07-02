// Application layer - Orchestrates domain + export utilities
// NO UI logic, NO components, NO side effects beyond orchestration

import {
  prepareLawyersExport,
  prepareDepartmentsExport,
  prepareOfficesExport,
  prepareAnalyticsExport,
  prepareDashboardExport,
  prepareAssignmentsExport,
  createCSVContent,
  formatDateForExport,
  formatTimeForExport,
  generateFileName,
} from '../domain/exportDomain';

import { exportToCSV } from '../utils/csvExporter';
import { exportToPDF } from '../utils/pdfExporter';

export function buildLawyersExportViewModel(lawyers, user) {
  const exportData = prepareLawyersExport(lawyers);

  return {
    reportTitle: 'Reporte de Abogados',
    exportData,
    exportFunctions: {
      toCSV: () => {
        const fileName = generateFileName('abogados', 'csv');
        const csvContent = createCSVContent(exportData.headers, exportData.rows);
        exportToCSV({ ...exportData, csvContent }, fileName);
      },
      toPDF: () => {
        const fileName = generateFileName('abogados', 'pdf');
        exportToPDF(exportData, fileName, 'Reporte de Abogados', {
          company: 'Firm OS',
          user: user?.name || 'Usuario',
        });
      },
      print: () => {
        // Will be handled by component wrapper
        return exportData;
      },
    },
    metadata: {
      generatedAt: formatDateForExport(),
      time: formatTimeForExport(),
      totalRecords: exportData.rows.length,
      summary: exportData.summary,
    },
  };
}

export function buildDashboardExportViewModel(kpis, alerts, user) {
  const exportData = prepareDashboardExport(kpis, alerts);

  return {
    reportTitle: 'Reporte del Dashboard Ejecutivo',
    exportData,
    exportFunctions: {
      toCSV: () => {
        const fileName = generateFileName('dashboard_ejecutivo', 'csv');
        const csvContent = createCSVContent(exportData.headers, exportData.rows);
        exportToCSV({ ...exportData, csvContent }, fileName);
      },
      toPDF: () => {
        const fileName = generateFileName('dashboard_ejecutivo', 'pdf');
        exportToPDF(exportData, fileName, 'Dashboard Ejecutivo', {
          company: 'Firm OS',
          user: user?.name || 'Usuario',
        });
      },
      print: () => {
        return exportData;
      },
    },
    metadata: {
      generatedAt: formatDateForExport(),
      time: formatTimeForExport(),
      kpis: exportData.summary.totalKPIs,
      alerts: exportData.summary.totalAlerts,
      criticalAlerts: exportData.summary.criticalAlerts,
    },
  };
}

export function buildAnalyticsExportViewModel(lawyers, cases, user) {
  const exportData = prepareAnalyticsExport(lawyers, cases);

  return {
    reportTitle: 'Reporte de Productividad y Analytics',
    exportData,
    exportFunctions: {
      toCSV: () => {
        const fileName = generateFileName('analytics_productividad', 'csv');
        const csvContent = createCSVContent(exportData.headers, exportData.rows);
        exportToCSV({ ...exportData, csvContent }, fileName);
      },
      toPDF: () => {
        const fileName = generateFileName('analytics_productividad', 'pdf');
        exportToPDF(exportData, fileName, 'Reporte de Productividad', {
          company: 'Firm OS',
          user: user?.name || 'Usuario',
        });
      },
      print: () => {
        return exportData;
      },
    },
    metadata: {
      generatedAt: formatDateForExport(),
      time: formatTimeForExport(),
      totalLawyers: exportData.summary.totalLawyers,
      totalCases: exportData.summary.totalCases,
      totalDocuments: exportData.summary.totalDocuments,
      topPerformer: exportData.summary.topPerformer,
    },
  };
}

export function buildDepartmentsExportViewModel(departments, user) {
  const exportData = prepareDepartmentsExport(departments);

  return {
    reportTitle: 'Reporte de Departamentos',
    exportData,
    exportFunctions: {
      toCSV: () => {
        const fileName = generateFileName('departamentos', 'csv');
        const csvContent = createCSVContent(exportData.headers, exportData.rows);
        exportToCSV({ ...exportData, csvContent }, fileName);
      },
      toPDF: () => {
        const fileName = generateFileName('departamentos', 'pdf');
        exportToPDF(exportData, fileName, 'Reporte de Departamentos', {
          company: 'Firm OS',
          user: user?.name || 'Usuario',
        });
      },
      print: () => {
        return exportData;
      },
    },
    metadata: {
      generatedAt: formatDateForExport(),
      time: formatTimeForExport(),
      totalDepartments: exportData.summary.total,
      activeDepartments: exportData.summary.active,
      totalLawyers: exportData.summary.totalLawyers,
      totalCases: exportData.summary.totalCases,
    },
  };
}

export function buildOfficesExportViewModel(offices, user) {
  const exportData = prepareOfficesExport(offices);

  return {
    reportTitle: 'Reporte de Oficinas',
    exportData,
    exportFunctions: {
      toCSV: () => {
        const fileName = generateFileName('oficinas', 'csv');
        const csvContent = createCSVContent(exportData.headers, exportData.rows);
        exportToCSV({ ...exportData, csvContent }, fileName);
      },
      toPDF: () => {
        const fileName = generateFileName('oficinas', 'pdf');
        exportToPDF(exportData, fileName, 'Reporte de Oficinas', {
          company: 'Firm OS',
          user: user?.name || 'Usuario',
        });
      },
      print: () => {
        return exportData;
      },
    },
    metadata: {
      generatedAt: formatDateForExport(),
      time: formatTimeForExport(),
      totalOffices: exportData.summary.total,
      activeOffices: exportData.summary.active,
      totalLawyers: exportData.summary.totalLawyers,
      totalCases: exportData.summary.totalCases,
    },
  };
}

export function buildAssignmentsExportViewModel(cases, user) {
  const exportData = prepareAssignmentsExport(cases);

  return {
    reportTitle: 'Reporte de Asignaciones de Casos',
    exportData,
    exportFunctions: {
      toCSV: () => {
        const fileName = generateFileName('asignaciones', 'csv');
        const csvContent = createCSVContent(exportData.headers, exportData.rows);
        exportToCSV({ ...exportData, csvContent }, fileName);
      },
      toPDF: () => {
        const fileName = generateFileName('asignaciones', 'pdf');
        exportToPDF(exportData, fileName, 'Reporte de Asignaciones', {
          company: 'Firm OS',
          user: user?.name || 'Usuario',
        });
      },
      print: () => {
        return exportData;
      },
    },
    metadata: {
      generatedAt: formatDateForExport(),
      time: formatTimeForExport(),
      totalCases: exportData.summary.total,
      pendingCases: exportData.summary.pending,
      assignedCases: exportData.summary.assigned,
    },
  };
}
