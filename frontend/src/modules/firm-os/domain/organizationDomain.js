// Pure domain logic for organization structure
export function calculateOrganizationMetrics(lawyers = [], cases = [], clients = [], planCapacity = 5) {
  const totalClients = clients.length;
  const totalCases = cases.length;
  const totalLawyers = lawyers.length;
  const activeCases = cases.filter(c => c.status === "open" || c.status === "in_progress").length;
  const closedCases = cases.filter(c => c.status === "closed").length;
  const capacityUsed = totalLawyers;
  const capacityPercentage = Math.min(100, Math.round((capacityUsed / planCapacity) * 100));
  const documentsCount = cases.reduce((sum, c) => sum + (c.documents?.length || 0), 0);

  return {
    totalClients,
    totalCases,
    totalLawyers,
    activeCases,
    closedCases,
    capacityUsed,
    capacityPercentage,
    documentsCount,
  };
}

export function calculateDepartmentMetrics(departments = []) {
  const totalDepartments = departments.length;
  const activeDepartments = departments.filter(d => d.status === "activo" || !d.status).length;
  const totalLawyers = departments.reduce((sum, d) => sum + (d.lawyers_count || d.lawyers || 0), 0);
  const totalCases = departments.reduce((sum, d) => sum + (d.cases_count || d.cases || 0), 0);

  return {
    totalDepartments,
    activeDepartments,
    totalLawyers,
    totalCases,
  };
}

export function calculateOfficeMetrics(offices = []) {
  const totalOffices = offices.length;
  const activeOffices = offices.filter(o => o.status === "activa").length;
  const totalLawyers = offices.reduce((sum, o) => sum + (o.lawyers_count || o.lawyers || 0), 0);
  const totalCases = offices.reduce((sum, o) => sum + (o.cases_count || o.cases || 0), 0);

  return {
    totalOffices,
    activeOffices,
    totalLawyers,
    totalCases,
  };
}

export function groupLawyersByDepartment(lawyers = []) {
  const grouped = {};

  lawyers.forEach(lawyer => {
    const dept = lawyer.department || "Sin departamento";
    if (!grouped[dept]) {
      grouped[dept] = [];
    }
    grouped[dept].push(lawyer);
  });

  return grouped;
}

export function groupLawyersByOffice(lawyers = []) {
  const grouped = {};

  lawyers.forEach(lawyer => {
    const office = lawyer.office || "Sin oficina";
    if (!grouped[office]) {
      grouped[office] = [];
    }
    grouped[office].push(lawyer);
  });

  return grouped;
}

export function calculateOfficeOccupancy(office) {
  if (!office) return 0;

  const lawyerCount = office.lawyers_count || office.lawyers || 0;
  const caseCount = office.cases_count || office.cases || 0;

  if (lawyerCount === 0) return 0;

  return Math.min(100, Math.round((caseCount / Math.max(lawyerCount, 1)) * 10));
}

export function calculateDepartmentOccupancy(department) {
  if (!department) return 0;

  const lawyerCount = department.lawyers_count || department.lawyers || 0;
  const caseCount = department.cases_count || department.cases || 0;

  if (lawyerCount === 0) return 0;

  return Math.min(100, Math.round((caseCount / Math.max(lawyerCount, 1)) * 10));
}

export function groupCasesByDepartment(cases = [], departments = []) {
  const grouped = {};

  departments.forEach(dept => {
    grouped[dept.id || dept.name] = cases.filter(c => c.department_id === dept.id);
  });

  return grouped;
}

export function groupCasesByOffice(cases = [], offices = []) {
  const grouped = {};

  offices.forEach(office => {
    grouped[office.id || office.name] = cases.filter(c => c.office_id === office.id);
  });

  return grouped;
}

export function calculateTeamDistribution(lawyers = []) {
  const byDepartment = groupLawyersByDepartment(lawyers);
  const byOffice = groupLawyersByOffice(lawyers);

  return {
    byDepartment: Object.entries(byDepartment).map(([dept, lawyers]) => ({
      name: dept,
      count: lawyers.length,
      active: lawyers.filter(l => !l.inactive).length,
      busy: lawyers.filter(l => l.in_court).length,
    })),
    byOffice: Object.entries(byOffice).map(([office, lawyers]) => ({
      name: office,
      count: lawyers.length,
      active: lawyers.filter(l => !l.inactive).length,
      busy: lawyers.filter(l => l.in_court).length,
    })),
  };
}
