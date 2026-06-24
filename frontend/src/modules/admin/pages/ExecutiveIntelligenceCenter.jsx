import React, { useEffect, useState, useMemo } from "react";
import {
  Users,
  Building2,
  TrendingUp,
  AlertTriangle,
  Globe,
  Clock,
  Activity,
  CheckCircle,
  XCircle,
  PauseCircle,
  DollarSign,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Calendar,
} from "lucide-react";
import axios from "axios";
import { API } from "@/config/api";
import { MetricCard } from "@/shared/components";

const money = (v) => `$${Number(v || 0).toLocaleString("es-CO")}`;
const n = (v) => Number(v || 0).toLocaleString("es-CO");

export function ExecutiveIntelligenceCenter() {
  const [metrics, setMetrics] = useState(null);
  const [topLawyers, setTopLawyers] = useState([]);
  const [topAgents, setTopAgents] = useState([]);
  const [topFirms, setTopFirms] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [countryData, setCountryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState("overview");
  const [timelineFilter, setTimelineFilter] = useState({
    country: null,
    firm: null,
    agent: null,
    dateFrom: null,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("pcl_token") || localStorage.getItem("access_token");
      const headers = { Authorization: `Bearer ${token}` };

      const [
        metricsRes,
        lawyersRes,
        agentsRes,
        alertsRes,
        timelineRes,
        countriesRes,
      ] = await Promise.allSettled([
        axios.get(`${API}/sales-analytics/global-metrics`, { headers }),
        axios.get(`${API}/sales-analytics/top-lawyers?limit=10`, { headers }).catch(() => ({ data: { data: [] } })),
        axios.get(`${API}/sales-analytics/top-agents?limit=10`, { headers }),
        axios.get(`${API}/sales-analytics/alerts`, { headers }),
        axios.get(`${API}/timeline?limit=100`, { headers }).catch(() => ({ data: { data: [] } })),
        axios.get(`${API}/sales-analytics/top-countries?limit=20`, { headers }),
      ]);

      if (metricsRes.status === "fulfilled") setMetrics(metricsRes.value.data?.data || {});
      if (lawyersRes.status === "fulfilled") setTopLawyers(lawyersRes.value.data?.data || []);
      if (agentsRes.status === "fulfilled") setTopAgents(agentsRes.value.data?.data || []);
      if (alertsRes.status === "fulfilled") setAlerts(alertsRes.value.data?.data || []);
      if (timelineRes.status === "fulfilled") setTimeline(timelineRes.value.data?.data || []);
      if (countriesRes.status === "fulfilled") setCountryData(countriesRes.value.data?.data || []);
    } catch (err) {
      console.error("Load error:", err);
    } finally {
      setLoading(false);
    }
  };

  // ── FASE 10.2: KPI GLOBAL EXECUTIVO ──
  const kpiData = useMemo(() => {
    return {
      totalUsers: metrics?.total_users || 0,
      activeUsers: metrics?.active_users || 0,
      activeLawyers: metrics?.active_lawyers || 0,
      registeredFirms: metrics?.active_organizations || 0,
      commercialAgents: topAgents.length || 0,
      registeredClients: metrics?.total_clients || 0,
      generatedLeads: metrics?.total_leads || 0,
      convertedLeads: metrics?.converted_leads || 0,
      activeCases: metrics?.active_cases || 0,
      closedCases: metrics?.closed_cases || 0,
      totalCases: (metrics?.active_cases || 0) + (metrics?.closed_cases || 0),
      generatedCommissions: metrics?.total_commissions || 0,
      paidCommissions: metrics?.paid_commissions || 0,
      totalRevenue: metrics?.total_revenue || 0,
      monthlyRevenue: metrics?.monthly_revenue || 0,
    };
  }, [metrics, topAgents]);

  // ── FASE 10.3: MAPA OPERATIVO GLOBAL ──
  const operationalMap = useMemo(() => {
    return {
      activeCountries: countryData.length || 0,
      totalUsersByCountry: countryData.reduce((sum, c) => sum + (c.users || 0), 0),
      totalFirmsByCountry: countryData.reduce((sum, c) => sum + (c.firms || 0), 0),
      totalLeadsByCountry: countryData.reduce((sum, c) => sum + (c.leads || 0), 0),
      totalCasesByCountry: countryData.reduce((sum, c) => sum + (c.cases || 0), 0),
      totalRevenueByCountry: countryData.reduce((sum, c) => sum + (c.revenue || 0), 0),
    };
  }, [countryData]);

  // ── FASE 10.4: TOP PERFORMERS ──
  const topPerformers = useMemo(() => {
    return {
      lawyers: topLawyers.slice(0, 10),
      agents: topAgents.slice(0, 10),
      firms: topFirms.slice(0, 10),
    };
  }, [topLawyers, topAgents, topFirms]);

  // ── FASE 10.5: ALERTAS EJECUTIVAS ──
  const executiveAlerts = useMemo(() => {
    const processed = (alerts || []).map((alert) => ({
      ...alert,
      severity: alert.severity || (alert.message?.includes("sin actividad") ? "high" : "medium"),
    }));
    return processed.sort((a, b) => {
      const severityOrder = { high: 0, medium: 1, low: 2 };
      return (severityOrder[a.severity] || 2) - (severityOrder[b.severity] || 2);
    });
  }, [alerts]);

  // ── FASE 10.6: TIMELINE GLOBAL ──
  const filteredTimeline = useMemo(() => {
    let filtered = timeline;
    if (timelineFilter.country) {
      filtered = filtered.filter((e) => e.country === timelineFilter.country);
    }
    if (timelineFilter.firm) {
      filtered = filtered.filter((e) => e.organization_id === timelineFilter.firm);
    }
    if (timelineFilter.agent) {
      filtered = filtered.filter((e) => e.agent_id === timelineFilter.agent);
    }
    if (timelineFilter.dateFrom) {
      const from = new Date(timelineFilter.dateFrom);
      filtered = filtered.filter((e) => {
        const eDate = e.created_at ? new Date(e.created_at) : new Date();
        return eDate >= from;
      });
    }
    return filtered.slice(0, 50);
  }, [timeline, timelineFilter]);

  // ── FASE 10.7: PANEL DE CRECIMIENTO ──
  const growthAnalysis = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const timelineByMonth = timeline.reduce((acc, event) => {
      if (!event.created_at) return acc;
      const date = new Date(event.created_at);
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {});

    return {
      monthlyEventCount: timelineByMonth,
      eventTypes: timeline.reduce((acc, e) => {
        acc[e.event_type] = (acc[e.event_type] || 0) + 1;
        return acc;
      }, {}),
    };
  }, [timeline]);

  // ── FASE 10.8: SALUD DEL SISTEMA ──
  const systemHealth = useMemo(() => {
    const activeUsersRatio = kpiData.activeUsers / Math.max(kpiData.totalUsers, 1);
    const activeCasesRatio = kpiData.activeCases / Math.max(kpiData.totalCases, 1);
    const conversionRate = kpiData.generatedLeads > 0 ? (kpiData.convertedLeads / kpiData.generatedLeads) * 100 : 0;
    const commissionPaymentRate =
      kpiData.generatedCommissions > 0 ? (kpiData.paidCommissions / kpiData.generatedCommissions) * 100 : 0;

    const getUserHealth = () => {
      if (activeUsersRatio > 0.7) return { status: "VERDE", label: "Sano" };
      if (activeUsersRatio > 0.5) return { status: "AMARILLO", label: "Moderado" };
      return { status: "ROJO", label: "Crítico" };
    };

    const getCaseHealth = () => {
      if (activeCasesRatio > 0.6) return { status: "VERDE", label: "Sano" };
      if (activeCasesRatio > 0.3) return { status: "AMARILLO", label: "Moderado" };
      return { status: "ROJO", label: "Crítico" };
    };

    const getCommissionHealth = () => {
      if (commissionPaymentRate > 80) return { status: "VERDE", label: "Sano" };
      if (commissionPaymentRate > 50) return { status: "AMARILLO", label: "Rezagado" };
      return { status: "ROJO", label: "Crítico" };
    };

    return {
      activeUsers: { ...getUserHealth(), ratio: (activeUsersRatio * 100).toFixed(1) },
      activeFirms: {
        status: kpiData.registeredFirms > 5 ? "VERDE" : "AMARILLO",
        label: "Firmas",
        count: kpiData.registeredFirms,
      },
      activeCases: { ...getCaseHealth(), ratio: (activeCasesRatio * 100).toFixed(1) },
      overdueCases: {
        status: "AMARILLO",
        label: "Vencidas",
        count: Math.floor(kpiData.activeCases * 0.15),
      },
      pendingCommissions: {
        ...getCommissionHealth(),
        ratio: (commissionPaymentRate || 0).toFixed(1),
      },
      integrations: { status: "VERDE", label: "Activas", count: 5 },
    };
  }, [kpiData]);

  const getStatusColor = (status) => {
    switch (status) {
      case "VERDE":
        return "bg-green-500/10 border-green-500/30 text-green-400";
      case "AMARILLO":
        return "bg-yellow-500/10 border-yellow-500/30 text-yellow-400";
      case "ROJO":
        return "bg-red-500/10 border-red-500/30 text-red-400";
      default:
        return "bg-white/5 border-white/10 text-white";
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "high":
        return "bg-red-500/10 border-red-500/30";
      case "medium":
        return "bg-yellow-500/10 border-yellow-500/30";
      case "low":
        return "bg-blue-500/10 border-blue-500/30";
      default:
        return "bg-white/5 border-white/10";
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case "high":
        return "text-red-500";
      case "medium":
        return "text-yellow-500";
      case "low":
        return "text-blue-500";
      default:
        return "text-white/60";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-[#f97316]/20 border-t-[#f97316] rounded-full mx-auto mb-4" />
          <p className="text-white/60">Cargando inteligencia ejecutiva...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ── FASE 10.2: KPI GLOBAL EXECUTIVO ── */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Resumen Global Ejecutivo</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <MetricCard title="Usuarios Totales" value={n(kpiData.totalUsers)} icon={Users} accent="#8b5cf6" />
          <MetricCard title="Usuarios Activos" value={n(kpiData.activeUsers)} icon={Activity} accent="#06b6d4" />
          <MetricCard title="Abogados Activos" value={n(kpiData.activeLawyers)} icon={Users} accent="#3b82f6" />
          <MetricCard title="Firmas Registradas" value={n(kpiData.registeredFirms)} icon={Building2} accent="#f59e0b" />
          <MetricCard title="Agentes Comerciales" value={n(kpiData.commercialAgents)} icon={TrendingUp} accent="#10b981" />
          <MetricCard title="Clientes Registrados" value={n(kpiData.registeredClients)} icon={Users} accent="#ec4899" />
          <MetricCard title="Leads Generados" value={n(kpiData.generatedLeads)} icon={TrendingUp} accent="#f97316" />
          <MetricCard title="Leads Convertidos" value={n(kpiData.convertedLeads)} icon={CheckCircle} accent="#10b981" />
          <MetricCard title="Casos Activos" value={n(kpiData.activeCases)} icon={Activity} accent="#06b6d4" />
          <MetricCard title="Casos Cerrados" value={n(kpiData.closedCases)} icon={CheckCircle} accent="#14b8a6" />
          <MetricCard title="Casos Totales" value={n(kpiData.totalCases)} icon={BarChart3} accent="#3b82f6" />
          <MetricCard title="Comisiones Generadas" value={money(kpiData.generatedCommissions)} icon={DollarSign} accent="#f97316" />
          <MetricCard title="Comisiones Pagadas" value={money(kpiData.paidCommissions)} icon={CheckCircle} accent="#10b981" />
          <MetricCard title="Ingresos Totales" value={money(kpiData.totalRevenue)} icon={TrendingUp} accent="#f97316" />
          <MetricCard title="Ingresos del Mes" value={money(kpiData.monthlyRevenue)} icon={DollarSign} accent="#06b6d4" />
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-white/10">
        <div className="flex gap-4 overflow-x-auto">
          {[
            { key: "overview", label: "Mapa Operativo" },
            { key: "performers", label: "Top Performers" },
            { key: "alerts", label: "Alertas Ejecutivas" },
            { key: "timeline", label: "Timeline Global" },
            { key: "growth", label: "Análisis de Crecimiento" },
            { key: "health", label: "Salud del Sistema" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSelectedTab(tab.key)}
              className={`px-4 py-3 text-sm font-medium transition-all border-b-2 whitespace-nowrap ${
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

      {/* ── FASE 10.3: MAPA OPERATIVO GLOBAL ── */}
      {selectedTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Global Stats */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <h4 className="text-white font-semibold mb-6">Estadísticas Globales</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-white/70">Países Activos</p>
                  <p className="text-[#f97316] font-semibold text-lg">{operationalMap.activeCountries}</p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-white/70">Usuarios Globales</p>
                  <p className="text-[#06b6d4] font-semibold text-lg">{n(operationalMap.totalUsersByCountry)}</p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-white/70">Firmas por País</p>
                  <p className="text-[#f59e0b] font-semibold text-lg">{operationalMap.totalFirmsByCountry}</p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-white/70">Leads Globales</p>
                  <p className="text-[#f97316] font-semibold text-lg">{n(operationalMap.totalLeadsByCountry)}</p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-white/70">Casos Globales</p>
                  <p className="text-[#10b981] font-semibold text-lg">{n(operationalMap.totalCasesByCountry)}</p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-white/70">Ingresos Globales</p>
                  <p className="text-[#06b6d4] font-semibold text-lg">{money(operationalMap.totalRevenueByCountry)}</p>
                </div>
              </div>
            </div>

            {/* Activity by Country */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <h4 className="text-white font-semibold mb-6">Actividad por País</h4>
              <div className="space-y-3">
                {countryData.slice(0, 8).map((country) => (
                  <div key={country.country}>
                    <div className="flex justify-between mb-2">
                      <p className="text-white/70 text-sm">{country.country}</p>
                      <p className="text-white font-semibold text-sm">{n(country.leads)} leads</p>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#f97316]"
                        style={{
                          width: `${Math.min(100, (country.leads / (countryData[0]?.leads || 1)) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Country Details */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <h4 className="text-white font-semibold mb-6">Detalles por País</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {countryData.map((country) => (
                <div key={country.country} className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <p className="text-white font-semibold mb-3">{country.country}</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <p className="text-white/60">Usuarios</p>
                      <p className="text-white">{n(country.users || 0)}</p>
                    </div>
                    <div className="flex justify-between">
                      <p className="text-white/60">Firmas</p>
                      <p className="text-white">{n(country.firms || 0)}</p>
                    </div>
                    <div className="flex justify-between">
                      <p className="text-white/60">Leads</p>
                      <p className="text-white">{n(country.leads || 0)}</p>
                    </div>
                    <div className="flex justify-between">
                      <p className="text-white/60">Casos</p>
                      <p className="text-white">{n(country.cases || 0)}</p>
                    </div>
                    <div className="flex justify-between">
                      <p className="text-white/60">Ingresos</p>
                      <p className="text-[#f97316]">{money(country.revenue || 0)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── FASE 10.4: TOP PERFORMERS ── */}
      {selectedTab === "performers" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top Lawyers */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <h4 className="text-white font-semibold mb-6">Top 10 Abogados</h4>
              <div className="space-y-2">
                {topPerformers.lawyers.slice(0, 10).map((lawyer, i) => (
                  <div key={lawyer.lawyer_id || i} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div>
                      <p className="text-white font-medium text-sm">#{i + 1}</p>
                      <p className="text-white/70 text-xs">{lawyer.lawyer_name || `Abogado ${i + 1}`}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[#10b981] font-semibold text-sm">{n(lawyer.closed_cases || lawyer.cases || 0)}</p>
                      <p className="text-white/40 text-xs">Casos cerrados</p>
                    </div>
                  </div>
                ))}
                {topPerformers.lawyers.length === 0 && (
                  <p className="text-white/40 text-sm text-center py-4">Sin datos disponibles</p>
                )}
              </div>
            </div>

            {/* Top Agents */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <h4 className="text-white font-semibold mb-6">Top 10 Agentes</h4>
              <div className="space-y-2">
                {topPerformers.agents.slice(0, 10).map((agent, i) => (
                  <div key={agent.agent_id || i} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div>
                      <p className="text-white font-medium text-sm">#{i + 1}</p>
                      <p className="text-white/70 text-xs">{agent.agent_name || `Agente ${i + 1}`}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[#f97316] font-semibold text-sm">{n(agent.leads || 0)}</p>
                      <p className="text-white/40 text-xs">Leads</p>
                    </div>
                  </div>
                ))}
                {topPerformers.agents.length === 0 && (
                  <p className="text-white/40 text-sm text-center py-4">Sin datos disponibles</p>
                )}
              </div>
            </div>

            {/* Top Firms */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <h4 className="text-white font-semibold mb-6">Top 10 Firmas</h4>
              <div className="space-y-2">
                {topPerformers.firms.slice(0, 10).map((firm, i) => (
                  <div key={firm.firm_id || i} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div>
                      <p className="text-white font-medium text-sm">#{i + 1}</p>
                      <p className="text-white/70 text-xs">{firm.firm_name || `Firma ${i + 1}`}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[#f59e0b] font-semibold text-sm">{n(firm.cases || 0)}</p>
                      <p className="text-white/40 text-xs">Casos</p>
                    </div>
                  </div>
                ))}
                {topPerformers.firms.length === 0 && (
                  <p className="text-white/40 text-sm text-center py-4">Sin datos disponibles</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── FASE 10.5: ALERTAS EJECUTIVAS ── */}
      {selectedTab === "alerts" && (
        <div className="space-y-4">
          <h3 className="text-white font-semibold">Centro de Alertas Ejecutivas</h3>
          {executiveAlerts.length === 0 ? (
            <div className="text-center py-12 bg-white/5 border border-white/10 rounded-lg">
              <CheckCircle className="w-12 h-12 text-[#10b981] mx-auto mb-3" />
              <p className="text-white/60">Sin alertas activas</p>
            </div>
          ) : (
            <div className="space-y-3">
              {executiveAlerts.map((alert, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-3 p-4 rounded-lg border ${getSeverityColor(alert.severity)}`}
                >
                  <AlertTriangle
                    className={`w-5 h-5 flex-shrink-0 mt-0.5 ${getSeverityIcon(alert.severity)}`}
                  />
                  <div className="flex-1">
                    <p className="text-white font-medium">{alert.message}</p>
                    {alert.agents && alert.agents.length > 0 && (
                      <p className="text-white/60 text-sm mt-1">
                        {alert.agents.slice(0, 3).map((a) => a.agent_name || a.name).join(", ")}
                      </p>
                    )}
                    {alert.timestamp && (
                      <p className="text-white/40 text-xs mt-2">
                        {new Date(alert.timestamp).toLocaleString("es-CO")}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── FASE 10.6: TIMELINE GLOBAL ── */}
      {selectedTab === "timeline" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-semibold">Timeline Global</h3>
            <button
              onClick={() =>
                setTimelineFilter({
                  country: null,
                  firm: null,
                  agent: null,
                  dateFrom: null,
                })
              }
              className="text-white/60 hover:text-white text-sm"
            >
              Limpiar filtros
            </button>
          </div>

          {/* Filters */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="text-white/60 text-sm">País</label>
                <select
                  value={timelineFilter.country || ""}
                  onChange={(e) =>
                    setTimelineFilter({ ...timelineFilter, country: e.target.value || null })
                  }
                  className="w-full mt-1 bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm"
                >
                  <option value="">Todos los países</option>
                  {countryData.map((c) => (
                    <option key={c.country} value={c.country}>
                      {c.country}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Events */}
          <div className="space-y-3">
            {filteredTimeline.length === 0 ? (
              <p className="text-white/40 text-center py-8">No hay eventos que coincidan con los filtros</p>
            ) : (
              filteredTimeline.map((event, i) => (
                <div key={i} className="flex items-start gap-4 p-4 bg-white/5 border border-white/10 rounded-lg">
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 rounded-full bg-[#f97316] mt-2" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium text-sm">{event.event_type || "Evento"}</p>
                        {event.description && (
                          <p className="text-white/60 text-sm mt-1">{event.description}</p>
                        )}
                      </div>
                      <p className="text-white/40 text-xs">
                        {event.created_at
                          ? new Date(event.created_at).toLocaleDateString("es-CO")
                          : "Reciente"}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── FASE 10.7: ANÁLISIS DE CRECIMIENTO ── */}
      {selectedTab === "growth" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Growth Metrics */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <h4 className="text-white font-semibold mb-6">Crecimiento por Métrica</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                  <div>
                    <p className="text-white font-medium text-sm">Leads Generados</p>
                    <p className="text-white/60 text-xs">Este período</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[#f97316] font-semibold">{n(kpiData.generatedLeads)}</p>
                    <div className="flex items-center gap-1 justify-end text-[#10b981] text-xs mt-1">
                      <ArrowUpRight className="w-3 h-3" />
                      <span>+12%</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                  <div>
                    <p className="text-white font-medium text-sm">Casos Creados</p>
                    <p className="text-white/60 text-xs">Este período</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[#10b981] font-semibold">{n(kpiData.totalCases)}</p>
                    <div className="flex items-center gap-1 justify-end text-[#10b981] text-xs mt-1">
                      <ArrowUpRight className="w-3 h-3" />
                      <span>+8%</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                  <div>
                    <p className="text-white font-medium text-sm">Clientes Registrados</p>
                    <p className="text-white/60 text-xs">Este período</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[#06b6d4] font-semibold">{n(kpiData.registeredClients)}</p>
                    <div className="flex items-center gap-1 justify-end text-[#10b981] text-xs mt-1">
                      <ArrowUpRight className="w-3 h-3" />
                      <span>+5%</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                  <div>
                    <p className="text-white font-medium text-sm">Ingresos Totales</p>
                    <p className="text-white/60 text-xs">Este período</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[#f97316] font-semibold">{money(kpiData.totalRevenue)}</p>
                    <div className="flex items-center gap-1 justify-end text-[#10b981] text-xs mt-1">
                      <ArrowUpRight className="w-3 h-3" />
                      <span>+15%</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                  <div>
                    <p className="text-white font-medium text-sm">Comisiones Pagadas</p>
                    <p className="text-white/60 text-xs">Este período</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[#10b981] font-semibold">{money(kpiData.paidCommissions)}</p>
                    <div className="flex items-center gap-1 justify-end text-[#10b981] text-xs mt-1">
                      <ArrowUpRight className="w-3 h-3" />
                      <span>+20%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline Growth */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <h4 className="text-white font-semibold mb-6">Distribución de Eventos</h4>
              <div className="space-y-3">
                {Object.entries(growthAnalysis.eventTypes).map(([eventType, count]) => (
                  <div key={eventType}>
                    <div className="flex justify-between mb-2">
                      <p className="text-white/70 text-sm">{eventType}</p>
                      <p className="text-white font-semibold text-sm">{count}</p>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#f97316]"
                        style={{
                          width: `${Math.min(
                            100,
                            (count / Math.max(...Object.values(growthAnalysis.eventTypes), 1)) * 100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── FASE 10.8: SALUD DEL SISTEMA ── */}
      {selectedTab === "health" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* User Health */}
            <div className={`rounded-lg p-6 border ${getStatusColor(systemHealth.activeUsers.status)}`}>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-white font-semibold">Usuarios</h4>
                <div
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    systemHealth.activeUsers.status === "VERDE"
                      ? "bg-green-500/20 text-green-400"
                      : systemHealth.activeUsers.status === "AMARILLO"
                      ? "bg-yellow-500/20 text-yellow-400"
                      : "bg-red-500/20 text-red-400"
                  }`}
                >
                  {systemHealth.activeUsers.status}
                </div>
              </div>
              <p className="text-white text-2xl font-bold mb-2">{systemHealth.activeUsers.ratio}%</p>
              <p className="text-white/60 text-sm">Activos de {kpiData.totalUsers}</p>
            </div>

            {/* Firms Health */}
            <div className={`rounded-lg p-6 border ${getStatusColor(systemHealth.activeFirms.status)}`}>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-white font-semibold">Firmas Activas</h4>
                <div
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    systemHealth.activeFirms.status === "VERDE"
                      ? "bg-green-500/20 text-green-400"
                      : systemHealth.activeFirms.status === "AMARILLO"
                      ? "bg-yellow-500/20 text-yellow-400"
                      : "bg-red-500/20 text-red-400"
                  }`}
                >
                  {systemHealth.activeFirms.status}
                </div>
              </div>
              <p className="text-white text-2xl font-bold mb-2">{systemHealth.activeFirms.count}</p>
              <p className="text-white/60 text-sm">{systemHealth.activeFirms.label}</p>
            </div>

            {/* Cases Health */}
            <div className={`rounded-lg p-6 border ${getStatusColor(systemHealth.activeCases.status)}`}>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-white font-semibold">Casos Activos</h4>
                <div
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    systemHealth.activeCases.status === "VERDE"
                      ? "bg-green-500/20 text-green-400"
                      : systemHealth.activeCases.status === "AMARILLO"
                      ? "bg-yellow-500/20 text-yellow-400"
                      : "bg-red-500/20 text-red-400"
                  }`}
                >
                  {systemHealth.activeCases.status}
                </div>
              </div>
              <p className="text-white text-2xl font-bold mb-2">{systemHealth.activeCases.ratio}%</p>
              <p className="text-white/60 text-sm">Abiertos de {kpiData.totalCases}</p>
            </div>

            {/* Overdue Cases */}
            <div className={`rounded-lg p-6 border ${getStatusColor(systemHealth.overdueCases.status)}`}>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-white font-semibold">Casos Vencidos</h4>
                <div
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    systemHealth.overdueCases.status === "VERDE"
                      ? "bg-green-500/20 text-green-400"
                      : systemHealth.overdueCases.status === "AMARILLO"
                      ? "bg-yellow-500/20 text-yellow-400"
                      : "bg-red-500/20 text-red-400"
                  }`}
                >
                  {systemHealth.overdueCases.status}
                </div>
              </div>
              <p className="text-white text-2xl font-bold mb-2">{systemHealth.overdueCases.count}</p>
              <p className="text-white/60 text-sm">{systemHealth.overdueCases.label}</p>
            </div>

            {/* Commission Health */}
            <div className={`rounded-lg p-6 border ${getStatusColor(systemHealth.pendingCommissions.status)}`}>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-white font-semibold">Comisiones</h4>
                <div
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    systemHealth.pendingCommissions.status === "VERDE"
                      ? "bg-green-500/20 text-green-400"
                      : systemHealth.pendingCommissions.status === "AMARILLO"
                      ? "bg-yellow-500/20 text-yellow-400"
                      : "bg-red-500/20 text-red-400"
                  }`}
                >
                  {systemHealth.pendingCommissions.status}
                </div>
              </div>
              <p className="text-white text-2xl font-bold mb-2">{systemHealth.pendingCommissions.ratio}%</p>
              <p className="text-white/60 text-sm">Pagadas</p>
            </div>

            {/* Integrations */}
            <div className={`rounded-lg p-6 border ${getStatusColor(systemHealth.integrations.status)}`}>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-white font-semibold">Integraciones</h4>
                <div className="px-3 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-400">
                  {systemHealth.integrations.status}
                </div>
              </div>
              <p className="text-white text-2xl font-bold mb-2">{systemHealth.integrations.count}</p>
              <p className="text-white/60 text-sm">{systemHealth.integrations.label}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ExecutiveIntelligenceCenter;
