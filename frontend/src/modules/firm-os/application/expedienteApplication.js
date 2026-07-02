/**
 * Application layer for expedientes — view model builders
 */

import { getExpedienteMetrics } from '../domain/expedienteDomain';

export function buildExpedienteListViewModel(expedientes = []) {
  const metrics = getExpedienteMetrics(expedientes);

  return {
    expedientes: expedientes.map(e => ({
      id: e.id,
      client: {
        id: e.client.id,
        name: e.client.name,
        email: e.client.email,
      },
      statusBadge: {
        label: e.status === 'active' ? 'Activo' : e.status === 'closed' ? 'Cerrado' : 'Pendiente',
        variant: e.status === 'active' ? 'success' : e.status === 'closed' ? 'default' : 'warning',
        color: e.status === 'active' ? 'bg-emerald-500/20 text-emerald-300' :
               e.status === 'closed' ? 'bg-gray-500/20 text-gray-300' :
               'bg-amber-500/20 text-amber-300',
      },
      stats: {
        active: e.active_cases,
        closed: e.closed_cases,
        pending: e.pending_cases,
        total: e.total_cases,
      },
      lawyers: e.assigned_lawyers.map(l => ({
        id: l.id,
        name: l.name,
        specialty: l.specialty,
      })),
      lastUpdated: e.lastUpdated,
    })),
    metrics,
  };
}

export function buildExpedienteDetailViewModel(expediente) {
  if (!expediente) return null;

  return {
    id: expediente.id,
    client: {
      ...expediente.client,
      status: expediente.status,
      caseCount: expediente.total_cases,
    },
    cases: expediente.cases.map(c => ({
      id: c.id,
      caseNumber: c.case_number,
      status: c.status,
      statusLabel: c.status === 'open' ? 'Abierto' :
                   c.status === 'in_progress' ? 'En progreso' :
                   'Cerrado',
      dueDate: c.due_date,
      lawyer: expediente.assigned_lawyers.find(l => l.id === c.lawyer_id) || null,
    })),
    statistics: {
      active: expediente.active_cases,
      closed: expediente.closed_cases,
      pending: expediente.pending_cases,
      total: expediente.total_cases,
      lawyers: expediente.assigned_lawyer_count,
    },
    assignedLawyers: expediente.assigned_lawyers,
    timeline: {
      created: expediente.createdAt,
      lastUpdated: expediente.lastUpdated,
    },
  };
}

export function buildExpedientesSummaryCard(metrics = {}) {
  return {
    total: {
      label: 'Expedientes',
      value: metrics.total || 0,
      color: 'text-blue-400',
    },
    active: {
      label: 'Activos',
      value: metrics.active || 0,
      color: 'text-emerald-400',
    },
    closed: {
      label: 'Cerrados',
      value: metrics.closed || 0,
      color: 'text-gray-400',
    },
    cases: {
      label: 'Casos totales',
      value: metrics.totalCases || 0,
      color: 'text-purple-400',
    },
  };
}

export function buildExpedientesStatistics(expedientes = []) {
  const metrics = getExpedienteMetrics(expedientes);

  return {
    // Main metrics
    totalExpedientes: metrics.total,
    activeExpedientes: metrics.active,
    closedExpedientes: metrics.closed,
    pendingExpedientes: metrics.pending,

    // Case metrics
    totalCases: metrics.totalCases,
    activeCases: metrics.activeCases,
    closedCases: metrics.closedCases,
    pendingCases: metrics.pendingCases,

    // Averages
    avgCasesPerExpediente: metrics.avgCasesPerExpediente,

    // Status distribution
    statusDistribution: [
      { status: 'Activos', value: metrics.active, color: '#10b981' },
      { status: 'Cerrados', value: metrics.closed, color: '#6b7280' },
      { status: 'Pendientes', value: metrics.pending, color: '#f59e0b' },
    ],
  };
}

export function buildExpedientesCaseDistribution(expedientes = []) {
  return {
    byStatus: {
      active: expedientes.reduce((sum, e) => sum + e.active_cases, 0),
      closed: expedientes.reduce((sum, e) => sum + e.closed_cases, 0),
      pending: expedientes.reduce((sum, e) => sum + e.pending_cases, 0),
    },
    byLawyer: expedientes.reduce((acc, e) => {
      e.assigned_lawyers.forEach(l => {
        const lawyerId = l.id;
        const lawyerCaseCount = e.cases.filter(c => c.lawyer_id === lawyerId).length;
        acc[lawyerId] = (acc[lawyerId] || 0) + lawyerCaseCount;
      });
      return acc;
    }, {}),
  };
}
