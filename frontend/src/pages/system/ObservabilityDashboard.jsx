import React, { useState, useEffect } from 'react';
import './ObservabilityDashboard.css';

export default function ObservabilityDashboard() {
  const [data, setData] = useState(null);
  const [filter, setFilter] = useState({ status: 'all', endpoint: '', tenant: '', type: 'all' });
  const [refreshInterval, setRefreshInterval] = useState(true);

  // Actualizar datos periódicamente
  useEffect(() => {
    if (!refreshInterval) return;

    const refresh = () => {
      if (window.__PC_OBSERVABILITY__) {
        const latestRequests = window.__PC_OBSERVABILITY__.getLatest(50);
        const errors = window.__PC_OBSERVABILITY__.getErrors();
        const stats = window.__PC_OBSERVABILITY__.getStats();
        const allEvents = window.__PC_OBSERVABILITY__.getAll();

        // Calcular métricas de performance
        const endpointStats = {};
        allEvents
          .filter((e) => e.type?.startsWith('request:'))
          .forEach((event) => {
            if (!endpointStats[event.url]) {
              endpointStats[event.url] = { count: 0, totalDuration: 0, errors: 0 };
            }
            endpointStats[event.url].count += 1;
            endpointStats[event.url].totalDuration += event.duration || 0;
            if (!event.success) endpointStats[event.url].errors += 1;
          });

        // Obtener tenants únicos
        const tenants = [...new Set(allEvents.map((e) => e.tenantId).filter(Boolean))];

        setData({
          latestRequests,
          errors: errors.slice(-20).reverse(),
          stats,
          endpointStats,
          tenants,
          allEvents,
        });
      }
    };

    refresh();
    const interval = setInterval(refresh, 2000);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  // Aplicar filtros
  const filteredRequests = data?.latestRequests?.filter((req) => {
    if (filter.status !== 'all') {
      const matches = filter.status === 'success' ? req.success : !req.success;
      if (!matches) return false;
    }
    if (filter.endpoint && !req.url?.includes(filter.endpoint)) return false;
    if (filter.tenant && req.tenantId !== filter.tenant) return false;
    return true;
  }) || [];

  const filteredErrors = data?.errors?.filter((err) => {
    if (filter.type !== 'all' && err.errorType !== filter.type) return false;
    if (filter.endpoint && !err.url?.includes(filter.endpoint)) return false;
    if (filter.tenant && err.tenantId !== filter.tenant) return false;
    return true;
  }) || [];

  // Endpoints más lentos
  const slowestEndpoints = data?.endpointStats
    ? Object.entries(data.endpointStats)
        .map(([url, stats]) => ({
          url,
          avgDuration: stats.totalDuration / stats.count,
          count: stats.count,
          errorRate: stats.errors / stats.count,
        }))
        .sort((a, b) => b.avgDuration - a.avgDuration)
        .slice(0, 10)
    : [];

  const handleClearEvents = () => {
    if (window.__PC_OBSERVABILITY__?.clear) {
      window.__PC_OBSERVABILITY__.clear();
      setData(null);
    }
  };

  return (
    <div className="observability-dashboard">
      <div className="obs-header">
        <h1>Observability Dashboard</h1>
        <div className="obs-controls">
          <button
            className={`refresh-toggle ${refreshInterval ? 'active' : ''}`}
            onClick={() => setRefreshInterval(!refreshInterval)}
          >
            {refreshInterval ? '⏸ Auto' : '▶ Auto'}
          </button>
          <button className="clear-btn" onClick={handleClearEvents}>
            Clear All Events
          </button>
          <span className="event-count">
            {data?.allEvents?.length || 0} / 500 events
          </span>
        </div>
      </div>

      {data && (
        <>
          {/* Resumen de Estadísticas */}
          <section className="obs-section">
            <h2>Summary</h2>
            <div className="metrics-grid">
              {data.stats && (
                <>
                  <div className="metric">
                    <span className="metric-label">Total Requests</span>
                    <span className="metric-value">{data.stats?.errorStats?.totalRequests || 0}</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Success Rate</span>
                    <span className="metric-value">
                      {data.stats?.errorStats?.totalRequests
                        ? (
                            ((data.stats.errorStats.totalRequests -
                              data.stats.errorStats.errorCount) /
                              data.stats.errorStats.totalRequests) *
                            100
                          ).toFixed(1) + '%'
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Avg Response Time</span>
                    <span className="metric-value">
                      {slowestEndpoints.length > 0
                        ? (slowestEndpoints.reduce((a, b) => a + b.avgDuration, 0) / slowestEndpoints.length).toFixed(0) +
                          'ms'
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Total Errors</span>
                    <span className="metric-value error">{data.stats?.errorStats?.errorCount || 0}</span>
                  </div>
                </>
              )}
            </div>
          </section>

          {/* Filtros */}
          <section className="obs-filters">
            <div className="filter-group">
              <label>Status:</label>
              <select
                value={filter.status}
                onChange={(e) => setFilter({ ...filter, status: e.target.value })}
              >
                <option value="all">All</option>
                <option value="success">Success</option>
                <option value="error">Error</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Endpoint:</label>
              <input
                type="text"
                placeholder="Search endpoint..."
                value={filter.endpoint}
                onChange={(e) => setFilter({ ...filter, endpoint: e.target.value })}
              />
            </div>

            <div className="filter-group">
              <label>Tenant:</label>
              <select
                value={filter.tenant}
                onChange={(e) => setFilter({ ...filter, tenant: e.target.value })}
              >
                <option value="">All</option>
                {data.tenants?.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Error Type:</label>
              <select
                value={filter.type}
                onChange={(e) => setFilter({ ...filter, type: e.target.value })}
              >
                <option value="all">All</option>
                <option value="network_error">Network Error</option>
                <option value="auth_error">Auth Error</option>
                <option value="validation_error">Validation Error</option>
                <option value="not_found_error">Not Found</option>
                <option value="conflict_error">Conflict</option>
                <option value="server_error">Server Error</option>
                <option value="rate_limit_error">Rate Limit</option>
              </select>
            </div>
          </section>

          {/* Recent Requests */}
          <section className="obs-section">
            <h2>Recent Requests ({filteredRequests.length})</h2>
            <div className="table-container">
              <table className="obs-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Method</th>
                    <th>Endpoint</th>
                    <th>Status</th>
                    <th>Duration (ms)</th>
                    <th>Tenant</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.length > 0 ? (
                    filteredRequests.map((req) => (
                      <tr key={req.requestId} className={`row-${req.success ? 'success' : 'error'}`}>
                        <td className="time">
                          {new Date(req.timestamp).toLocaleTimeString()}
                        </td>
                        <td className="method">{req.method}</td>
                        <td className="endpoint" title={req.url}>
                          {req.url?.split('/').pop() || req.url}
                        </td>
                        <td className={`status status-${req.status}`}>
                          {req.status} {req.statusText}
                        </td>
                        <td className="duration">{req.duration?.toFixed(0)}</td>
                        <td className="tenant">{req.tenantId || '—'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="empty">
                        No requests match filters
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Recent Errors */}
          <section className="obs-section">
            <h2>Recent Errors ({filteredErrors.length})</h2>
            <div className="table-container">
              <table className="obs-table errors-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Type</th>
                    <th>Severity</th>
                    <th>Message</th>
                    <th>Endpoint</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredErrors.length > 0 ? (
                    filteredErrors.map((err, idx) => (
                      <tr key={idx} className={`severity-${err.errorSeverity || 'unknown'}`}>
                        <td className="time">
                          {new Date(err.timestamp).toLocaleTimeString()}
                        </td>
                        <td className="error-type">{err.errorType}</td>
                        <td className="severity">
                          <span className={`badge severity-${err.errorSeverity}`}>
                            {err.errorSeverity}
                          </span>
                        </td>
                        <td className="message" title={err.errorMessage}>
                          {err.errorMessage?.substring(0, 50)}...
                        </td>
                        <td className="endpoint">{err.url?.split('/').pop() || err.url}</td>
                        <td className={`status status-${err.status}`}>{err.status}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="empty">
                        No errors match filters
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Performance - Slowest Endpoints */}
          <section className="obs-section">
            <h2>Slowest Endpoints (Top 10)</h2>
            <div className="table-container">
              <table className="obs-table">
                <thead>
                  <tr>
                    <th>Endpoint</th>
                    <th>Avg Duration (ms)</th>
                    <th>Requests</th>
                    <th>Error Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {slowestEndpoints.length > 0 ? (
                    slowestEndpoints.map((endpoint, idx) => (
                      <tr key={idx}>
                        <td className="endpoint">{endpoint.url}</td>
                        <td className="duration">
                          <span className={endpoint.avgDuration > 1000 ? 'slow' : ''}>
                            {endpoint.avgDuration.toFixed(0)}
                          </span>
                        </td>
                        <td className="count">{endpoint.count}</td>
                        <td className="error-rate">
                          {(endpoint.errorRate * 100).toFixed(1)}%
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="empty">
                        No performance data
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Active Tenants */}
          <section className="obs-section">
            <h2>Active Tenants</h2>
            <div className="tenants-list">
              {data.tenants?.length > 0 ? (
                data.tenants.map((tenantId) => {
                  const tenantEvents = data.allEvents.filter((e) => e.tenantId === tenantId);
                  const tenantErrors = tenantEvents.filter((e) => !e.success).length;
                  return (
                    <div key={tenantId} className="tenant-card">
                      <div className="tenant-id">{tenantId}</div>
                      <div className="tenant-stats">
                        <span>{tenantEvents.length} events</span>
                        <span className={tenantErrors > 0 ? 'errors' : 'clean'}>
                          {tenantErrors} errors
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="empty">No active tenants</div>
              )}
            </div>
          </section>
        </>
      )}

      {!data && (
        <div className="no-data">
          <p>Waiting for observability data...</p>
          <p>Make some requests to populate the dashboard</p>
        </div>
      )}
    </div>
  );
}
