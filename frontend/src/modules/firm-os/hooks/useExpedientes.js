import { useMemo } from 'react';

/**
 * Group cases by client to create expediente view
 * Expediente = collection of cases for a single client
 */
function buildExpediente(client, cases = [], lawyers = []) {
  const clientCases = cases.filter(c => c.client_id === client.id);
  const activeCases = clientCases.filter(c => 
    c.status === 'open' || c.status === 'in_progress'
  );
  const closedCases = clientCases.filter(c => c.status === 'closed');

  const assignedLawyers = new Set();
  clientCases.forEach(c => {
    if (c.lawyer_id) {
      assignedLawyers.add(c.lawyer_id);
    }
  });

  return {
    id: client.id,
    client: client,
    cases: clientCases,
    active_cases: activeCases.length,
    closed_cases: closedCases.length,
    total_cases: clientCases.length,
    assigned_lawyer_count: assignedLawyers.size,
    assigned_lawyers: lawyers.filter(l => assignedLawyers.has(l.id)),
    status: activeCases.length > 0 ? 'active' : closedCases.length > 0 ? 'closed' : 'pending',
    last_updated: clientCases.length > 0 
      ? new Date(Math.max(...clientCases.map(c => new Date(c.updated_at || c.created_at).getTime())))
      : new Date(),
  };
}

/**
 * useExpedientes — Group cases by client to create expediente structure
 * Expediente = all cases belonging to a single client
 */
export function useExpedientes(clients = [], cases = [], lawyers = []) {
  // Build expedientes list
  const expedientes = useMemo(() => {
    return clients
      .map(client => buildExpediente(client, cases, lawyers))
      .sort((a, b) => new Date(b.last_updated) - new Date(a.last_updated));
  }, [clients, cases, lawyers]);

  // Statistics
  const statistics = useMemo(() => {
    const total = expedientes.length;
    const active = expedientes.filter(e => e.status === 'active').length;
    const closed = expedientes.filter(e => e.status === 'closed').length;
    const totalCases = expedientes.reduce((sum, e) => sum + e.total_cases, 0);
    const activeCases = expedientes.reduce((sum, e) => sum + e.active_cases, 0);

    return {
      total,
      active,
      closed,
      pending: total - active - closed,
      total_cases: totalCases,
      active_cases: activeCases,
      closed_cases: expedientes.reduce((sum, e) => sum + e.closed_cases, 0),
    };
  }, [expedientes]);

  return {
    expedientes,
    statistics,
    total: expedientes.length,
  };
}

export default useExpedientes;
