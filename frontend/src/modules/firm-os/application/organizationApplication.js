// Application layer for organization - orchestrates domain + data
import {
  calculateDepartmentMetrics,
  calculateOfficeMetrics,
  calculateDepartmentOccupancy,
  calculateOfficeOccupancy,
} from "../domain";

export function buildDepartmentsViewModel(departments = []) {
  const metrics = calculateDepartmentMetrics(departments);

  return {
    // Header
    header: {
      title: "Departamentos",
      subtitle: "Administración de áreas jurídicas especializadas",
      totalCount: departments.length,
    },

    // Summary KPIs
    kpis: [
      {
        label: "Departamentos Activos",
        value: metrics.activeDepartments,
        sublabel: `de ${metrics.totalDepartments} totales`,
      },
      {
        label: "Abogados",
        value: metrics.totalLawyers,
        sublabel: "distribuidos",
      },
      {
        label: "Casos",
        value: metrics.totalCases,
        sublabel: "en total",
      },
    ],

    // Department cards
    departmentCards: departments.map(dept => ({
      id: dept.id,
      name: dept.name,
      status: dept.status === "activo" ? "Activo" : dept.status || "Activo",
      statusBadge:
        dept.status === "activo"
          ? "bg-emerald-500/20 text-emerald-300"
          : "bg-amber-500/20 text-amber-300",
      lawyers: dept.lawyers_count || dept.lawyers || 0,
      cases: dept.cases_count || dept.cases || 0,
      responsible: dept.responsible,
      occupancy: calculateDepartmentOccupancy(dept),
      occupancyColor: "from-blue-500 to-purple-500",
    })),

    // Summary
    summary: {
      total: metrics.totalDepartments,
      active: metrics.activeDepartments,
      isEmpty: departments.length === 0,
    },
  };
}

export function buildOfficesViewModel(offices = []) {
  const metrics = calculateOfficeMetrics(offices);

  return {
    // Header
    header: {
      title: "Oficinas",
      subtitle: "Gestión de ubicaciones y sucursales",
      totalCount: offices.length,
    },

    // Summary KPIs
    kpis: [
      {
        label: "Oficinas Activas",
        value: metrics.activeOffices,
        sublabel: `de ${metrics.totalOffices} totales`,
      },
      {
        label: "Abogados",
        value: metrics.totalLawyers,
        sublabel: "distribuidos",
      },
      {
        label: "Casos",
        value: metrics.totalCases,
        sublabel: "en total",
      },
    ],

    // Office cards
    officeCards: offices.map(office => ({
      id: office.id,
      name: office.name || "Sin nombre",
      location: office.location || "Ubicación no especificada",
      address: office.address || "Dirección no especificada",
      status: office.status === "activa" ? "Activa" : office.status || "Activa",
      statusBadge:
        office.status === "activa"
          ? "bg-emerald-500/20 text-emerald-300"
          : "bg-amber-500/20 text-amber-300",
      lawyers: office.lawyers_count || office.lawyers || 0,
      cases: office.cases_count || office.cases || 0,
      phone: office.phone || "Sin teléfono",
      occupancy: calculateOfficeOccupancy(office),
      occupancyColor: "from-blue-500 to-purple-500",
    })),

    // Summary
    summary: {
      total: metrics.totalOffices,
      active: metrics.activeOffices,
      isEmpty: offices.length === 0,
    },
  };
}
