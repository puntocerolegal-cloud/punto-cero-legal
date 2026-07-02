// Pure domain logic for alerts
export function generateAlerts(lawyers = [], cases = [], clients = [], planName = null) {
  const alerts = [];
  const planCapacity = planName === "consolidacion-empresarial" ? 10 : 5;

  // Cases without lawyer
  const casesWithoutLawyer = cases.filter(c => !c.lawyer_id);
  if (casesWithoutLawyer.length > 0) {
    alerts.push({
      id: "cases-no-lawyer",
      type: "critical",
      title: "Casos sin Abogado",
      description: `${casesWithoutLawyer.length} caso(s) esperando asignación`,
      priority: 1,
    });
  }

  // Overloaded lawyers
  const overloadedLawyers = lawyers.filter(l => (l.total_cases || 0) > 5);
  if (overloadedLawyers.length > 0) {
    alerts.push({
      id: "overloaded-lawyers",
      type: "warning",
      title: "Abogados Sobrecargados",
      description: `${overloadedLawyers.length} abogado(s) con más de 5 casos`,
      priority: 2,
    });
  }

  // Upcoming hearings
  const upcomingHearings = cases.filter(c => {
    if (c.hearing_date) {
      const hearingDate = new Date(c.hearing_date);
      const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      return hearingDate < weekFromNow && hearingDate > new Date();
    }
    return false;
  });
  if (upcomingHearings.length > 0) {
    alerts.push({
      id: "upcoming-hearings",
      type: "info",
      title: "Audiencias Próximas",
      description: `${upcomingHearings.length} audiencia(s) en los próximos 7 días`,
      priority: 3,
    });
  }

  // Plan capacity
  const lawyerCount = lawyers.length;
  if (lawyerCount >= planCapacity * 0.8) {
    alerts.push({
      id: "plan-capacity",
      type: lawyerCount >= planCapacity ? "critical" : "warning",
      title: lawyerCount >= planCapacity ? "Plan Lleno" : "Capacidad Casi Llena",
      description: `${lawyerCount} de ${planCapacity} abogados contratados`,
      priority: lawyerCount >= planCapacity ? 1 : 2,
    });
  }

  // Clients without follow-up
  const clientsNoFollow = clients.filter(c => !c.last_contact_date);
  if (clientsNoFollow.length > 0) {
    alerts.push({
      id: "clients-no-follow",
      type: "warning",
      title: "Clientes sin Seguimiento",
      description: `${clientsNoFollow.length} cliente(s) sin contacto reciente`,
      priority: 3,
    });
  }

  // Pending documents
  const pendingDocs = cases.filter(c => c.pending_documents > 0);
  if (pendingDocs.length > 0) {
    const totalDocs = pendingDocs.reduce((sum, c) => sum + (c.pending_documents || 0), 0);
    alerts.push({
      id: "pending-docs",
      type: "info",
      title: "Documentos Pendientes",
      description: `${totalDocs} documento(s) aguardando elaboración`,
      priority: 4,
    });
  }

  // All clear
  if (alerts.length === 0) {
    alerts.push({
      id: "all-clear",
      type: "success",
      title: "Todo Bajo Control",
      description: "No hay alertas. Continuarás siendo notificado de cambios importantes.",
      priority: 5,
    });
  }

  return alerts.sort((a, b) => a.priority - b.priority);
}

export function getAlertCounts(alerts = []) {
  const criticalCount = alerts.filter(a => a.type === "critical").length;
  const warningCount = alerts.filter(a => a.type === "warning").length;
  const infoCount = alerts.filter(a => a.type === "info").length;
  const successCount = alerts.filter(a => a.type === "success").length;

  return {
    total: alerts.length,
    critical: criticalCount,
    warning: warningCount,
    info: infoCount,
    success: successCount,
  };
}

export function getAlertsByType(alerts = [], type) {
  return alerts.filter(a => a.type === type);
}

export function getHighPriorityAlerts(alerts = []) {
  return alerts.filter(a => a.priority <= 2);
}
