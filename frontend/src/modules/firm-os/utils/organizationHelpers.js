/**
 * Organization helpers — derive offices and departments from lawyers
 * Used when backend doesn't provide separate endpoints
 */

/**
 * Extract unique offices from lawyers array
 * @param {Array} lawyers Lawyer records
 * @returns {Array} Office objects
 */
export function deriveOffices(lawyers = []) {
  const officeMap = new Map();
  
  lawyers.forEach(lawyer => {
    if (lawyer.office) {
      const key = lawyer.office.toLowerCase().trim();
      if (!officeMap.has(key)) {
        officeMap.set(key, {
          id: key,
          name: lawyer.office,
          lawyer_count: 0,
          department_count: 0,
          active_cases: 0,
          assigned_clients: 0,
        });
      }
    }
  });

  // Build statistics
  lawyers.forEach(lawyer => {
    const key = lawyer.office?.toLowerCase().trim();
    if (key && officeMap.has(key)) {
      const office = officeMap.get(key);
      office.lawyer_count = (lawyers.filter(l => 
        l.office?.toLowerCase().trim() === key
      ).length);
      office.assigned_clients = (office.assigned_clients || 0) + (lawyer.assigned_clients || 0);
    }
  });

  return Array.from(officeMap.values());
}

/**
 * Extract unique departments from lawyers array
 * @param {Array} lawyers Lawyer records
 * @returns {Array} Department objects
 */
export function deriveDepartments(lawyers = []) {
  const departmentMap = new Map();
  
  lawyers.forEach(lawyer => {
    if (lawyer.department) {
      const key = lawyer.department.toLowerCase().trim();
      if (!departmentMap.has(key)) {
        departmentMap.set(key, {
          id: key,
          name: lawyer.department,
          office: lawyer.office || 'Sin oficina',
          lawyer_count: 0,
          active_cases: 0,
          assigned_clients: 0,
          documents_count: 0,
        });
      }
    }
  });

  // Build statistics
  lawyers.forEach(lawyer => {
    const key = lawyer.department?.toLowerCase().trim();
    if (key && departmentMap.has(key)) {
      const dept = departmentMap.get(key);
      dept.lawyer_count = (lawyers.filter(l => 
        l.department?.toLowerCase().trim() === key
      ).length);
      dept.assigned_clients = (dept.assigned_clients || 0) + (lawyer.assigned_clients || 0);
      dept.documents_count = (dept.documents_count || 0) + (lawyer.documents_created || 0);
    }
  });

  return Array.from(departmentMap.values());
}

/**
 * Build office metrics
 * @param {Object} office Office object
 * @param {Array} lawyers Lawyers in this office
 * @param {Array} cases All cases
 * @returns {Object} Office with metrics
 */
export function buildOfficeMetrics(office = {}, lawyers = [], cases = []) {
  const officeOps = lawyers.filter(l => l.office === office.name);
  const activeCases = cases.filter(c => 
    officeOps.some(l => l.id === c.lawyer_id) && 
    (c.status === 'open' || c.status === 'in_progress')
  );

  return {
    ...office,
    lawyer_count: officeOps.length,
    active_cases: activeCases.length,
    assigned_clients: officeOps.reduce((sum, l) => sum + (l.assigned_clients || 0), 0),
    utilization: officeOps.length > 0 
      ? Math.round((activeCases.length / (officeOps.length * 5)) * 100)
      : 0,
  };
}

/**
 * Build department metrics
 * @param {Object} department Department object
 * @param {Array} lawyers Lawyers in this department
 * @param {Array} cases All cases
 * @returns {Object} Department with metrics
 */
export function buildDepartmentMetrics(department = {}, lawyers = [], cases = []) {
  const deptOps = lawyers.filter(l => l.department === department.name);
  const activeCases = cases.filter(c => 
    deptOps.some(l => l.id === c.lawyer_id) && 
    (c.status === 'open' || c.status === 'in_progress')
  );

  return {
    ...department,
    lawyer_count: deptOps.length,
    active_cases: activeCases.length,
    assigned_clients: deptOps.reduce((sum, l) => sum + (l.assigned_clients || 0), 0),
    documents_count: deptOps.reduce((sum, l) => sum + (l.documents_created || 0), 0),
    health: calculateDepartmentHealth(deptOps, activeCases),
  };
}

/**
 * Calculate department health score
 * @param {Array} lawyers Department lawyers
 * @param {Array} cases Active cases
 * @returns {string} 'healthy' | 'warning' | 'critical'
 */
export function calculateDepartmentHealth(lawyers = [], cases = []) {
  if (lawyers.length === 0) return 'warning';
  
  const avgLoad = cases.length / lawyers.length;
  if (avgLoad > 10) return 'critical';
  if (avgLoad > 7) return 'warning';
  return 'healthy';
}

/**
 * Group lawyers by office
 * @param {Array} lawyers All lawyers
 * @returns {Object} Grouped by office
 */
export function groupLawyersByOffice(lawyers = []) {
  const grouped = {};
  lawyers.forEach(lawyer => {
    const office = lawyer.office || 'Sin oficina';
    if (!grouped[office]) {
      grouped[office] = [];
    }
    grouped[office].push(lawyer);
  });
  return grouped;
}

/**
 * Group lawyers by department
 * @param {Array} lawyers All lawyers
 * @returns {Object} Grouped by department
 */
export function groupLawyersByDepartment(lawyers = []) {
  const grouped = {};
  lawyers.forEach(lawyer => {
    const department = lawyer.department || 'Sin departamento';
    if (!grouped[department]) {
      grouped[department] = [];
    }
    grouped[department].push(lawyer);
  });
  return grouped;
}

/**
 * Get office summary statistics
 * @param {Array} lawyers All lawyers
 * @param {Array} cases All cases
 * @returns {Object} Summary metrics
 */
export function getOfficesSummary(lawyers = [], cases = []) {
  const offices = deriveOffices(lawyers);
  const total = offices.length;
  const withoutCases = offices.filter(o => 
    !cases.some(c => lawyers.filter(l => l.office === o.name).some(l => l.id === c.lawyer_id))
  ).length;

  return {
    total,
    offices,
    withoutCases,
    avgLawyersPerOffice: total > 0 ? Math.round(lawyers.length / total) : 0,
  };
}

/**
 * Get departments summary statistics
 * @param {Array} lawyers All lawyers
 * @param {Array} cases All cases
 * @returns {Object} Summary metrics
 */
export function getDepartmentsSummary(lawyers = [], cases = []) {
  const departments = deriveDepartments(lawyers);
  const total = departments.length;
  const critical = departments.filter(d => 
    calculateDepartmentHealth(
      lawyers.filter(l => l.department === d.name),
      cases.filter(c => lawyers.filter(l => l.department === d.name).some(l => l.id === c.lawyer_id))
    ) === 'critical'
  ).length;

  return {
    total,
    departments,
    critical,
    avgLawyersPerDepartment: total > 0 ? Math.round(lawyers.length / total) : 0,
  };
}
