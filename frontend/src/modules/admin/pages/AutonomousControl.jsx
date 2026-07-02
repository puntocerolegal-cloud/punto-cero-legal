import React, { useEffect, useState } from "react";
import {
  Zap,
  Activity,
  BarChart3,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Play,
  Pause,
  Settings,
  TrendingUp,
} from "lucide-react";
import { apiClient } from "@/config/api/apiClient";

const money = (v) => `$${Number(v || 0).toLocaleString("es-CO")}`;
const n = (v) => Number(v || 0).toLocaleString("es-CO");

export function AutonomousControl() {
  const [loopStatus, setLoopStatus] = useState(null);
  const [globalOrchestra, setGlobalOrchestra] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState("overview");
  const [isLoopRunning, setIsLoopRunning] = useState(true);

  useEffect(() => {
    loadAutonomousData();
    const interval = setInterval(loadAutonomousData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const loadAutonomousData = async () => {
    try {
      setLoading(true);
      // Headers automáticos desde apiClient (token + tenant)
      const [loopRes, orchestraRes] = await Promise.allSettled([
        apiClient.get("/autonomous/loop-status"),
        apiClient.get("/autonomous/global-orchestrator"),
      ]);

      if (loopRes.status === "fulfilled") {
        setLoopStatus(loopRes.value.data?.data || {});
      }
      if (orchestraRes.status === "fulfilled") {
        setGlobalOrchestra(orchestraRes.value.data?.data || {});
      }
    } catch (err) {
      console.error("Error loading autonomous data:", err);
    } finally {
      setLoading(false);
    }
  };

  const triggerDecisionCycle = async () => {
    try {
      // Headers automáticos desde apiClient
      await apiClient.post("/autonomous/decision-engine/run", {});
      loadAutonomousData();
      alert("Ciclo de decisiones ejecutado");
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const triggerSelfHealing = async () => {
    try {
      // Headers automáticos desde apiClient
      await apiClient.post("/autonomous/self-heal", {});
      loadAutonomousData();
      alert("Auto-corrección ejecutada");
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-[#f97316]/20 border-t-[#f97316] rounded-full mx-auto mb-4" />
          <p className="text-white/60">Cargando sistema autónomo...</p>
        </div>
      </div>
    );
  }

  const leads = globalOrchestra?.components?.leads || {};
  const cases = globalOrchestra?.components?.cases || {};
  const revenue = globalOrchestra?.components?.revenue || {};
  const health = globalOrchestra?.components?.system_health || {};

  return (
    <div className="space-y-8">
      {/* Autonomous Loop Status */}
      <div className="bg-gradient-to-r from-green-600/20 to-blue-600/20 border border-green-500/30 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-4 h-4 rounded-full ${isLoopRunning ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
            <div>
              <h2 className="text-lg font-semibold text-white">Autonomous Legal OS</h2>
              <p className="text-white/60 text-sm">Sistema completamente autónomo en operación</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-green-400">ACTIVO</p>
            <p className="text-white/60 text-sm">Ciclos ejecutándose</p>
          </div>
        </div>
      </div>

      {/* Quick Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={triggerDecisionCycle}
          className="flex items-center gap-2 p-4 bg-blue-500/20 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 transition-all"
        >
          <Zap className="w-5 h-5 text-blue-400" />
          <span className="text-white font-semibold">Ejecutar Ciclo</span>
        </button>

        <button
          onClick={() => setIsLoopRunning(!isLoopRunning)}
          className="flex items-center gap-2 p-4 bg-yellow-500/20 border border-yellow-500/30 rounded-lg hover:bg-yellow-500/30 transition-all"
        >
          {isLoopRunning ? <Pause className="w-5 h-5 text-yellow-400" /> : <Play className="w-5 h-5 text-yellow-400" />}
          <span className="text-white font-semibold">{isLoopRunning ? "Pausar" : "Reanudar"}</span>
        </button>

        <button
          onClick={triggerSelfHealing}
          className="flex items-center gap-2 p-4 bg-purple-500/20 border border-purple-500/30 rounded-lg hover:bg-purple-500/30 transition-all"
        >
          <RefreshCw className="w-5 h-5 text-purple-400" />
          <span className="text-white font-semibold">Auto-Corrección</span>
        </button>
      </div>

      {/* Global Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <p className="text-white/60 text-sm mb-2">Leads Globales</p>
          <p className="text-3xl font-bold text-white">{n(leads.total || 0)}</p>
          <p className="text-green-400 text-xs mt-2">
            Conversión: {(leads.conversion_rate || 0).toFixed(1)}%
          </p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <p className="text-white/60 text-sm mb-2">Casos Totales</p>
          <p className="text-3xl font-bold text-white">{n(cases.total || 0)}</p>
          <p className="text-blue-400 text-xs mt-2">
            Completados: {(cases.completion_rate || 0).toFixed(1)}%
          </p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <p className="text-white/60 text-sm mb-2">Ingresos Globales</p>
          <p className="text-3xl font-bold text-[#f97316]">{money(revenue.total || 0)}</p>
          <p className="text-yellow-400 text-xs mt-2">
            Pagados: {(revenue.payment_rate || 0).toFixed(1)}%
          </p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <p className="text-white/60 text-sm mb-2">Salud del Sistema</p>
          <p className="text-3xl font-bold text-green-400">
            {health.health_status === "OPTIMAL" ? "✓" : "!"}
          </p>
          <p className="text-white/60 text-xs mt-2">{health.health_status || "UNKNOWN"}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-white/10">
        <div className="flex gap-4 overflow-x-auto">
          {[
            { key: "overview", label: "Resumen", icon: "📊" },
            { key: "events", label: "Eventos", icon: "📝" },
            { key: "health", label: "Diagnóstico", icon: "🔍" },
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
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Tab */}
      {selectedTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Lead Flow */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" /> Flujo de Leads
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-white/70">Nuevos</span>
                  <span className="text-white font-semibold">{n(leads.new || 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/70">Convertidos</span>
                  <span className="text-green-400 font-semibold">{n(leads.converted || 0)}</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden mt-4">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-blue-500"
                    style={{ width: `${Math.min(100, (leads.conversion_rate || 0))}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Case Flow */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5" /> Flujo de Casos
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-white/70">Abiertos</span>
                  <span className="text-white font-semibold">{n(cases.open || 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/70">Cerrados</span>
                  <span className="text-green-400 font-semibold">{n(cases.closed || 0)}</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden mt-4">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-green-500"
                    style={{ width: `${Math.min(100, (cases.completion_rate || 0))}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Resource Status */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <h4 className="text-white font-semibold mb-4">Estado de Recursos</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-white/5 rounded-lg">
                <p className="text-white/60 text-sm mb-2">Organizaciones</p>
                <p className="text-2xl font-bold text-white">{health.organizations || 0}</p>
              </div>
              <div className="p-4 bg-white/5 rounded-lg">
                <p className="text-white/60 text-sm mb-2">Abogados Activos</p>
                <p className="text-2xl font-bold text-blue-400">{health.active_lawyers || 0}</p>
              </div>
              <div className="p-4 bg-white/5 rounded-lg">
                <p className="text-white/60 text-sm mb-2">Agentes Activos</p>
                <p className="text-2xl font-bold text-green-400">{health.active_agents || 0}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Events Tab */}
      {selectedTab === "events" && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Eventos Autónomos Recientes</h3>
          <div className="space-y-2">
            {loopStatus?.recent_actions && loopStatus.recent_actions.length > 0 ? (
              loopStatus.recent_actions.map((action, idx) => (
                <div key={idx} className="flex items-start gap-3 p-4 bg-white/5 rounded-lg border border-white/10">
                  <Zap className="w-5 h-5 text-[#f97316] flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-white font-semibold text-sm">{action.type}</p>
                    <p className="text-white/60 text-xs mt-1">{action.description}</p>
                    <p className="text-white/40 text-xs mt-1">
                      {action.timestamp ? new Date(action.timestamp).toLocaleString("es-CO") : "Reciente"}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-white/40 text-center py-8">Sin eventos recientes</p>
            )}
          </div>
        </div>
      )}

      {/* Health Tab */}
      {selectedTab === "health" && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Diagnóstico del Sistema</h3>
          <div className="space-y-3">
            {globalOrchestra?.health_checks && globalOrchestra.health_checks.length > 0 ? (
              globalOrchestra.health_checks.map((check, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-lg border flex items-start gap-3 ${
                    check.severity === "CRITICAL"
                      ? "bg-red-500/10 border-red-500/30"
                      : check.severity === "MEDIUM"
                      ? "bg-yellow-500/10 border-yellow-500/30"
                      : "bg-blue-500/10 border-blue-500/30"
                  }`}
                >
                  <AlertCircle
                    className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                      check.severity === "CRITICAL"
                        ? "text-red-400"
                        : check.severity === "MEDIUM"
                        ? "text-yellow-400"
                        : "text-blue-400"
                    }`}
                  />
                  <div>
                    <p className="text-white font-semibold text-sm">{check.type}</p>
                    <p className="text-white/70 text-sm mt-1">{check.message}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-white/5 border border-white/10 rounded-lg">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <p className="text-white/60">Sistema en óptimas condiciones</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AutonomousControl;
