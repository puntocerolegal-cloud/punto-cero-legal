// Pure domain logic for cases
export function calculateCaseMetrics(cases = []) {
  const activeCases = cases.filter(c => c.status === "open" || c.status === "in_progress").length;
  const closedCases = cases.filter(c => c.status === "closed").length;
  const totalCases = cases.length;
  const newCases = cases.filter(c => !c.assignment_status || c.assignment_status === "nuevo").length;
  const assignedCases = cases.filter(c => c.assignment_status === "asignado").length;
  const pendingCases = cases.filter(c => !c.assignment_status || c.assignment_status === "nuevo").length;

  return {
    activeCases,
    closedCases,
    totalCases,
    newCases,
    assignedCases,
    pendingCases,
  };
}

export function getCaseStatus(caseData) {
  if (caseData.status === "closed") {
    return "Cerrado";
  }
  if (caseData.status === "in_progress" || caseData.status === "open") {
    return "En progreso";
  }
  if (!caseData.assignment_status || caseData.assignment_status === "nuevo") {
    return "Sin asignar";
  }
  return "Pendiente";
}

export function getCasesByStatus(cases = [], status) {
  return cases.filter(c => c.status === status);
}

export function getCasesByLawyer(cases = [], lawyerId) {
  return cases.filter(c => c.lawyer_id === lawyerId);
}

export function getCasesByClient(cases = [], clientId) {
  return cases.filter(c => c.client_id === clientId);
}

export function getUnassignedCases(cases = []) {
  return cases.filter(c => !c.lawyer_id || !c.assignment_status || c.assignment_status === "nuevo");
}

export function getOverdueCases(cases = []) {
  return cases.filter(c => {
    if (c.due_date) {
      return new Date(c.due_date) < new Date();
    }
    return false;
  });
}

export function groupCasesByStatus(cases = []) {
  const grouped = {
    active: [],
    closed: [],
    pending: [],
    unassigned: [],
  };

  cases.forEach(c => {
    if (c.status === "closed") {
      grouped.closed.push(c);
    } else if (c.status === "open" || c.status === "in_progress") {
      grouped.active.push(c);
    } else if (!c.assignment_status || c.assignment_status === "nuevo") {
      grouped.unassigned.push(c);
    } else {
      grouped.pending.push(c);
    }
  });

  return grouped;
}

export function calculateCaseLoad(cases = [], lawyerId) {
  return cases.filter(c => c.lawyer_id === lawyerId && (c.status === "open" || c.status === "in_progress")).length;
}

export function sortCasesByPriority(cases = []) {
  return [...cases].sort((a, b) => {
    if (b.priority !== a.priority) {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return (priorityOrder[b.priority] || 999) - (priorityOrder[a.priority] || 999);
    }
    return new Date(b.created_at || 0) - new Date(a.created_at || 0);
  });
}
