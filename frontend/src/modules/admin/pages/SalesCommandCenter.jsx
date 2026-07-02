import React, { useEffect, useState, useMemo } from "react";
import {
  Users, TrendingUp, DollarSign, FolderKanban, Globe, AlertCircle,
  CheckCircle2, Clock, BarChart3, Activity
} from "lucide-react";
import { apiClient } from "@/config/api/apiClient";
import { MetricCard, EmptyState } from "@/shared/components";

const money = (v) => `$${Number(v || 0).toLocaleString("es-CO")}`;

export function SalesCommandCenter() {
  const [metrics, setMetrics] = useState(null);
  const [topAgents, setTopAgents] = useState([]);
  const [topCountries, setTopCountries] = useState([]);
  const [funnel, setFunnel] = useState([]);
  const [commissions, setCommissions] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTab, setSelectedTab] = useState("overview");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // Headers automáticos desde apiClient (token + tenant)
      const [metricsRes, agentsRes, countriesRes, funnelRes, commissionsRes, alertsRes] = await Promise.allSettled([
        apiClient.get("/sales-analytics/global-metrics"),
        apiClient.get("/sales-analytics/top-agents?limit=5"),
        apiClient.get("/sales-analytics/top-countries?limit=5"),
        apiClient.get("/sales-analytics/sales-funnel"),
        apiClient.get("/sales-analytics/commission-summary"),
        apiClient.get("/sales-analytics/alerts"),
      ]);

      if (metricsRes.status === "fulfilled") setMetrics(metricsRes.value.data?.data || {});
      if (agentsRes.status === "fulfilled") setTopAgents(agentsRes.value.data?.data || []);
      if (countriesRes.status === "fulfilled") setTopCountries(countriesRes.value.data?.data || []);
      if (funnelRes.status === "fulfilled") setFunnel(funnelRes.value.data?.data || []);
      if (commissionsRes.status === "fulfilled") setCommissions(commissionsRes.value.data?.data || {});
      if (alertsRes.status === "fulfilled") setAlerts(alertsRes.value.data?.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-[#f97316]/20 border-t-[#f97316] rounded-full mx-auto mb-4" />
          <p className="text-white/60">Cargando centro de operaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 p-4 rounded-lg border ${
                alert.severity === "alert"
                  ? "bg-red-500/10 border-red-500/30"
                  : "bg-yellow-500/10 border-yellow-500/30"
              }`}
            >
              <AlertCircle className={`w-5 h-5 ${alert.severity === "alert" ? "text-red-500" : "text-yellow-500"}`} />
              <p className="text-white text-sm">{alert.message}</p>
            </div>
          ))}
        </div>
      )}

      {/* Global KPIs */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Métricas Globales</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard label="Agentes Activos" value={metrics?.active_agents || 0} icon={Users} accent="#8b5cf6" />
          <MetricCard label="Leads Totales" value={metrics?.total_leads || 0} icon={TrendingUp} accent="#3b82f6" />
          <MetricCard label="Leads Este Mes" value={metrics?.leads_this_month || 0} icon={Activity} accent="#f59e0b" />
          <MetricCard label="Casos Generados" value={metrics?.cases_generated || 0} icon={FolderKanban} accent="#10b981" />
          <MetricCard label="Ventas Cerradas" value={metrics?.closed_sales || 0} icon={CheckCircle2} accent="#ec4899" />
          <MetricCard label="Conversión Global" value={`${metrics?.global_conversion || 0}%`} icon={TrendingUp} accent="#f97316" />
          <MetricCard label="Comisiones Pendientes" value={money(metrics?.pending_commissions || 0)} icon={Clock} accent="#06b6d4" />
          <MetricCard label="Comisiones Pagadas" value={money(metrics?.paid_commissions || 0)} icon={CheckCircle2} accent="#14b8a6" />
          <MetricCard label="Ingresos Generados" value={money(metrics?.total_revenue || 0)} icon={DollarSign} accent="#f97316" />
          <MetricCard label="Organizaciones Activas" value={metrics?.active_organizations || 0} icon={Users} accent="#8b5cf6" />
          <MetricCard label="Países Operativos" value={metrics?.operative_countries || 0} icon={Globe} accent="#3b82f6" />
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-white/10">
        <div className="flex gap-4">
          {[
            { key: "overview", label: "Rankings" },
            { key: "funnel", label: "Embudo Comercial" },
            { key: "countries", label: "Países" },
            { key: "commissions", label: "Comisiones" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSelectedTab(tab.key)}
              className={`px-4 py-3 text-sm font-medium transition-all border-b-2 ${
                selectedTab === tab.key
                  ? "border-[#f97316] text-[#f97316]"
                  : "border-transparent text-white/60 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: Rankings */}
      {selectedTab === "overview" && (
        <div className="space-y-8">
          {/* Top Agents */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <h3 className="text-white font-semibold mb-6">Top Agentes</h3>
            {topAgents.length === 0 ? (
              <p className="text-white/40">Sin datos de agentes</p>
            ) : (
              <div className="space-y-3">
                {topAgents.map((agent, i) => (
                  <div key={agent.agent_id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                    <div className="flex-1">
                      <p className="text-white font-medium">#{i + 1} {agent.agent_name}</p>
                      <p className="text-white/40 text-sm">{agent.country} · {agent.leads} leads</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[#f97316] font-semibold">{agent.conversion_rate}%</p>
                      <p className="text-white text-sm font-medium">{money(agent.commission_generated)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Countries */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <h3 className="text-white font-semibold mb-6">Top Países</h3>
            {topCountries.length === 0 ? (
              <p className="text-white/40">Sin datos de países</p>
            ) : (
              <div className="space-y-3">
                {topCountries.map((country, i) => (
                  <div key={country.country} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                    <div className="flex-1">
                      <p className="text-white font-medium">#{i + 1} {country.country}</p>
                      <p className="text-white/40 text-sm">{country.leads} leads · {country.sales} ventas</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[#f97316] font-semibold">{country.conversion_rate?.toFixed(2) || 0}%</p>
                      <p className="text-white text-sm">{money(country.revenue)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Sales Funnel */}
      {selectedTab === "funnel" && (
        <div className="bg-white/5 border border-white/10 rounded-lg p-6">
          <h3 className="text-white font-semibold mb-6">Embudo Comercial</h3>
          <div className="space-y-4">
            {funnel.map((stage, i) => (
              <div key={i}>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-white font-medium">{stage.stage}</p>
                  <p className="text-white/60">{stage.count} ({stage.percentage.toFixed(1)}%)</p>
                </div>
                <div className="h-6 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#f97316] to-[#ec4899]"
                    style={{ width: `${Math.max(stage.percentage, 5)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Countries Performance */}
      {selectedTab === "countries" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Leads by Country Chart */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <h3 className="text-white font-semibold mb-6">Leads por País</h3>
              <div className="space-y-3">
                {topCountries.slice(0, 5).map((country) => (
                  <div key={country.country}>
                    <div className="flex justify-between mb-2">
                      <p className="text-white/70 text-sm">{country.country}</p>
                      <p className="text-white font-semibold">{country.leads}</p>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#3b82f6]"
                        style={{ width: `${(country.leads / (topCountries[0]?.leads || 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Revenue by Country */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <h3 className="text-white font-semibold mb-6">Ingresos por País</h3>
              <div className="space-y-3">
                {topCountries.slice(0, 5).map((country) => (
                  <div key={country.country}>
                    <div className="flex justify-between mb-2">
                      <p className="text-white/70 text-sm">{country.country}</p>
                      <p className="text-[#f97316] font-semibold">{money(country.revenue)}</p>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#f97316]"
                        style={{ width: `${(country.revenue / (topCountries[0]?.revenue || 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Commission Command Center */}
      {selectedTab === "commissions" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-6">
              <h4 className="text-white/60 text-sm font-medium mb-2">Pendientes</h4>
              <p className="text-3xl font-bold text-yellow-400">{commissions?.pending?.count || 0}</p>
              <p className="text-yellow-400/60 text-sm mt-2">{money(commissions?.pending?.amount || 0)}</p>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6">
              <h4 className="text-white/60 text-sm font-medium mb-2">Aprobadas</h4>
              <p className="text-3xl font-bold text-blue-400">{commissions?.approved?.count || 0}</p>
              <p className="text-blue-400/60 text-sm mt-2">{money(commissions?.approved?.amount || 0)}</p>
            </div>

            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-6">
              <h4 className="text-white/60 text-sm font-medium mb-2">Pagadas</h4>
              <p className="text-3xl font-bold text-green-400">{commissions?.paid?.count || 0}</p>
              <p className="text-green-400/60 text-sm mt-2">{money(commissions?.paid?.amount || 0)}</p>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <h3 className="text-white font-semibold mb-4">Resumen Total</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-white/60 text-sm">Total Comisiones</p>
                <p className="text-2xl font-bold text-[#f97316] mt-2">{commissions?.total?.count || 0}</p>
              </div>
              <div>
                <p className="text-white/60 text-sm">Monto Total</p>
                <p className="text-2xl font-bold text-[#f97316] mt-2">{money(commissions?.total?.amount || 0)}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SalesCommandCenter;
