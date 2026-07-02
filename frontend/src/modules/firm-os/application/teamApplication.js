// Application layer for team management - orchestrates domain + data
import { composeTeamData, calculateLawyerMetrics } from "../domain";

export function buildTeamViewModel(lawyers = []) {
  const teamData = composeTeamData(lawyers);
  const { metrics, distribution, list } = teamData;

  return {
    // Header
    header: {
      title: "Equipo Jurídico",
      subtitle: `${list.length} abogado${list.length !== 1 ? "s" : ""} en la firma`,
      totalCount: list.length,
    },

    // Summary metrics
    metrics: {
      total: metrics.totalLawyers,
      active: metrics.activeLawyers,
      inactive: metrics.inactiveLawyers,
      suspended: metrics.suspendedLawyers,
      available: metrics.availableLawyers,
      busy: metrics.busyLawyers,
      highLoad: metrics.highLoadLawyers,
    },

    // Lawyers grouped by status
    lawyers: {
      active: list.filter(l => l.status === "activo"),
      inactive: list.filter(l => l.status !== "activo"),
    },

    // Lawyer card view model factory
    lawyerCardViewModel: (lawyer) => ({
      id: lawyer.id,
      name: lawyer.name || "Sin nombre",
      specialty: lawyer.specialty || "Especialidad no especificada",
      email: lawyer.email || "Sin correo",
      status: lawyer.status === "activo" ? "Activo" : "Inactivo",
      statusColor:
        lawyer.status === "activo" ? "bg-emerald-500/20 text-emerald-300" :
        "bg-amber-500/20 text-amber-300",
      office: lawyer.office || "Sin oficina",
      department: lawyer.department || "Sin departamento",
      available: lawyer.available !== false ? "Sí" : "No",
      availableColor: lawyer.available !== false ? "text-emerald-400" : "text-amber-400",
      activeCases: lawyer.total_cases || 0,
      closedCases: lawyer.closed_cases || 0,
      clients: lawyer.assigned_clients || 0,
      documents: lawyer.documents_created || 0,
      aiUsage: lawyer.ai_usage || 0,
      lastActivity: lawyer.last_activity ? "Hoy" : "Sin actividad",
    }),

    // Distribution
    distribution: {
      byDepartment: distribution.byDepartment.map(dept => ({
        name: dept.name,
        count: dept.count,
        active: dept.active,
        busy: dept.busy,
      })),
      byOffice: distribution.byOffice.map(office => ({
        name: office.name,
        count: office.count,
        active: office.active,
        busy: office.busy,
      })),
    },

    // Summary
    summary: {
      totalLawyers: metrics.totalLawyers,
      activeLawyers: metrics.activeLawyers,
      inactiveLawyers: metrics.inactiveLawyers,
      allEmpty: list.length === 0,
    },
  };
}
