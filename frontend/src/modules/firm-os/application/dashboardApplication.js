// Application layer for dashboard - orchestrates domain + data
import { composeFirmDashboardData } from "../domain";

export function buildDashboardViewModel(lawyers = [], cases = [], clients = [], planName = null) {
  const dashboardData = composeFirmDashboardData(lawyers, cases, clients, planName);

  return {
    // Firm state block
    firmState: {
      firmId: null,
      planName,
      planCapacity: dashboardData.state.planCapacity,
      status: dashboardData.state.status,
    },

    // Team metrics block
    teamSection: {
      title: "Equipo Jurídico",
      metrics: [
        {
          key: "total",
          label: "Total",
          value: dashboardData.team.totalLawyers,
          color: "#3b82f6",
        },
        {
          key: "available",
          label: "Disponibles",
          value: dashboardData.team.availableLawyers,
          color: "#10b981",
        },
        {
          key: "busy",
          label: "En Audiencia",
          value: dashboardData.team.busyLawyers,
          color: "#f59e0b",
        },
        {
          key: "highLoad",
          label: "Alta Carga",
          value: dashboardData.team.highLoadLawyers,
          color: "#ec4899",
        },
        {
          key: "inactive",
          label: "Inactivos",
          value: dashboardData.team.inactiveLawyers,
          color: "#64748b",
        },
      ],
    },

    // Cases metrics block
    casesSection: {
      title: "Operación Jurídica",
      metrics: [
        {
          key: "active",
          label: "Activos",
          value: dashboardData.cases.activeCases,
          color: "#06b6d4",
        },
        {
          key: "new",
          label: "Nuevos",
          value: dashboardData.derived.newCases,
          color: "#f97316",
        },
        {
          key: "closed",
          label: "Cerrados",
          value: dashboardData.cases.closedCases,
          color: "#10b981",
        },
        {
          key: "clients",
          label: "Clientes",
          value: dashboardData.organization.totalClients,
          color: "#8b5cf6",
        },
        {
          key: "documents",
          label: "Documentos",
          value: dashboardData.organization.documentsCount,
          color: "#ec4899",
        },
        {
          key: "ai",
          label: "IA",
          value: "Pendiente",
          color: "#f59e0b",
        },
      ],
    },

    // Activity section
    activitySection: {
      title: "Actividad Reciente",
      items: [
        {
          icon: "ArrowRight",
          label: "Asignaciones",
          sublabel: `${dashboardData.derived.newCases} nuevas esta semana`,
          value: dashboardData.derived.newCases,
          color: "blue",
        },
        {
          icon: "Calendar",
          label: "Audiencias",
          sublabel: "Programadas hoy",
          value: dashboardData.team.busyLawyers,
          color: "amber",
        },
        {
          icon: "FileText",
          label: "Documentos",
          sublabel: "Generados este mes",
          value: dashboardData.organization.documentsCount,
          color: "purple",
        },
      ],
    },

    // Alerts section
    alertsSection: {
      title: "Alertas Ejecutivas",
      alerts: dashboardData.alerts,
      summary: {
        total: dashboardData.alerts.length,
        critical: dashboardData.alerts.filter(a => a.type === "critical").length,
        warning: dashboardData.alerts.filter(a => a.type === "warning").length,
        info: dashboardData.alerts.filter(a => a.type === "info").length,
      },
    },

    // Capacity display
    capacityBar: {
      used: dashboardData.organization.capacityUsed,
      total: dashboardData.state.planCapacity,
      label: "Capacidad Contratada",
      color: "#3b82f6",
      percentage: dashboardData.organization.capacityPercentage,
    },

    // Summary
    summary: {
      allClear: dashboardData.derived.allClear,
      atCapacity: dashboardData.derived.atCapacity,
      overloaded: dashboardData.derived.overloaded,
    },
  };
}
