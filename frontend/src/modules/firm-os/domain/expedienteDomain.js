/**
 * Pure domain logic for expedientes (case collections)
 * Expediente = all cases belonging to a single client
 */

export function buildExpedienteFromClient(client, cases = [], lawyers = []) {
  if (!client) return null;

  const clientCases = cases.filter(c => c.client_id === client.id);
  const activeCases = clientCases.filter(c => c.status === 'open' || c.status === 'in_progress');
  const closedCases = clientCases.filter(c => c.status === 'closed');
  const pendingCases = clientCases.filter(c => !c.status || c.status === 'pending');

  const assignedLawyers = new Set();
  clientCases.forEach(c => {
    if (c.lawyer_id) {
      assignedLawyers.add(c.lawyer_id);
    }
  });

  const lawyerDetails = lawyers.filter(l => assignedLawyers.has(l.id));

  return {
    id: client.id,
    client,
    cases: clientCases,
    active_cases: activeCases.length,
    closed_cases: closedCases.length,
    pending_cases: pendingCases.length,
    total_cases: clientCases.length,
    assigned_lawyer_count: assignedLawyers.size,
    assigned_lawyers: lawyerDetails,
    status: activeCases.length > 0 ? 'active' : closedCases.length > 0 ? 'closed' : 'pending',
    lastUpdated: clientCases.length > 0
      ? new Date(Math.max(...clientCases.map(c =>
          new Date(c.updated_at || c.created_at || 0).getTime()
        )))
      : new Date(),
    createdAt: clientCases.length > 0
      ? new Date(Math.min(...clientCases.map(c =>
          new Date(c.created_at || 0).getTime()
        )))
      : new Date(),
  };
}

export function buildExpedientes(clients = [], cases = [], lawyers = []) {
  return clients
    .map(client => buildExpedienteFromClient(client, cases, lawyers))
    .filter(Boolean)
    .sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated));
}

export function getExpedienteMetrics(expedientes = []) {
  const total = expedientes.length;
  const active = expedientes.filter(e => e.status === 'active').length;
  const closed = expedientes.filter(e => e.status === 'closed').length;
  const pending = expedientes.filter(e => e.status === 'pending').length;

  const totalCases = expedientes.reduce((sum, e) => sum + e.total_cases, 0);
  const activeCases = expedientes.reduce((sum, e) => sum + e.active_cases, 0);
  const closedCases = expedientes.reduce((sum, e) => sum + e.closed_cases, 0);
  const pendingCases = expedientes.reduce((sum, e) => sum + e.pending_cases, 0);

  return {
    total,
    active,
    closed,
    pending,
    totalCases,
    activeCases,
    closedCases,
    pendingCases,
    avgCasesPerExpediente: total > 0 ? Math.round(totalCases / total * 10) / 10 : 0,
  };
}

export function filterExpedientesByStatus(expedientes = [], status) {
  if (!status || status === 'all') return expedientes;
  return expedientes.filter(e => e.status === status);
}

export function filterExpedientesByLawyer(expedientes = [], lawyerId) {
  return expedientes.filter(e =>
    e.assigned_lawyers.some(l => l.id === lawyerId)
  );
}

export function searchExpedientes(expedientes = [], query = '') {
  if (!query.trim()) return expedientes;

  const q = query.toLowerCase();
  return expedientes.filter(e =>
    e.client.name.toLowerCase().includes(q) ||
    e.client.email?.toLowerCase().includes(q) ||
    e.client.phone?.includes(q)
  );
}
