import React, { useEffect, useState, useCallback } from "react";
import {
  Brain,
  AlertCircle,
  TrendingUp,
  Target,
  Lightbulb,
  CheckCircle,
  Clock,
  Zap,
  BarChart3,
  AlertTriangle,
} from "lucide-react";
import axios from "axios";
import { API } from "@/config/api";
import { useAuth } from "@/contexts/AuthContext";

const money = (v) => `$${Number(v || 0).toLocaleString("es-CO")}`;
const n = (v) => Number(v || 0).toLocaleString("es-CO");

export function AICopilot() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState("overview");

  const orgId = user?.organizationId || "global";

  const loadAIData = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("pcl_token") || localStorage.getItem("access_token");
      const headers = { Authorization: `Bearer ${token}` };

      const res = await axios.get(`${API}/ai/copilot-summary/${orgId}`, { headers });
      setSummary(res.data?.data || {});
    } catch (err) {
      console.error("Error loading AI data:", err);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    loadAIData();
  }, [loadAIData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-[#f97316]/20 border-t-[#f97316] rounded-full mx-auto mb-4" />
          <p className="text-white/60">Analizando sistema con IA...</p>
        </div>
      </div>
    );
  }

  const alerts = summary?.alerts || [];
  const optimization = summary?.optimization || {};
  const aiSummary = summary?.summary || {};

  return (
    <div className="space-y-8">
      {/* AI Status Header */}
      <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brain className="w-8 h-8 text-blue-400" />
            <div>
              <h2 className="text-lg font-semibold text-white">AI Legal Autopilot</h2>
              <p className="text-white/60 text-sm">Sistema de inteligencia automática en operación</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-blue-400">{money(aiSummary.expected_revenue_gain)}</p>
            <p className="text-white/60 text-sm">Oportunidades detectadas</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <p className="text-white/70 text-sm">Alertas Críticas</p>
          </div>
          <p className="text-2xl font-bold text-red-400">{aiSummary.critical_alerts || 0}</p>
        </div>

        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            <p className="text-white/70 text-sm">Alertas Altas</p>
          </div>
          <p className="text-2xl font-bold text-yellow-400">{alerts.filter(a => a.type === "HIGH").length || 0}</p>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-blue-400" />
            <p className="text-white/70 text-sm">Recomendaciones</p>
          </div>
          <p className="text-2xl font-bold text-blue-400">{optimization.recommendations?.length || 0}</p>
        </div>

        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <p className="text-white/70 text-sm">Acciones Sugeridas</p>
          </div>
          <p className="text-2xl font-bold text-green-400">{aiSummary.action_items || 0}</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-white/10">
        <div className="flex gap-4 overflow-x-auto">
          {[
            { key: "overview", label: "Resumen", icon: "📊" },
            { key: "alerts", label: "Alertas", icon: "⚠️" },
            { key: "recommendations", label: "Recomendaciones", icon: "💡" },
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
          <h3 className="text-lg font-semibold text-white">Resumen Inteligente</h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Key Metrics */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5" /> Métricas IA
              </h4>
              <div className="space-y-4">
                <div>
                  <p className="text-white/60 text-sm mb-2">Ganancia de Ingresos Proyectada</p>
                  <p className="text-3xl font-bold text-[#10b981]">
                    {money(aiSummary.expected_revenue_gain)}
                  </p>
                </div>
                <div className="border-t border-white/10 pt-4">
                  <p className="text-white/60 text-sm mb-2">Acciones Identificadas</p>
                  <p className="text-2xl font-bold text-[#f97316]">{aiSummary.action_items}</p>
                </div>
                <div className="border-t border-white/10 pt-4">
                  <p className="text-white/60 text-sm mb-2">Análisis de Sistema</p>
                  <p className="text-white/80 text-sm">
                    {alerts.length} alertas detectadas
                  </p>
                </div>
              </div>
            </div>

            {/* Analysis Status */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Lightbulb className="w-5 h-5" /> Estado del Análisis
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <span className="text-white/70">Leads Calificados</span>
                  <span className="text-white font-semibold">Activo</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <span className="text-white/70">Asignación Automática</span>
                  <span className="text-white font-semibold">Activo</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <span className="text-white/70">Predicción de Casos</span>
                  <span className="text-white font-semibold">Activo</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <span className="text-white/70">Monitoreo de Alertas</span>
                  <span className="text-white font-semibold">Activo</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alerts Tab */}
      {selectedTab === "alerts" && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Alertas Inteligentes</h3>
          {alerts.length === 0 ? (
            <div className="text-center py-12 bg-white/5 border border-white/10 rounded-lg">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="text-white/60">Sin alertas - Sistema en óptimas condiciones</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-lg border ${
                    alert.type === "CRITICAL"
                      ? "bg-red-500/10 border-red-500/30"
                      : alert.type === "HIGH"
                      ? "bg-orange-500/10 border-orange-500/30"
                      : "bg-yellow-500/10 border-yellow-500/30"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <AlertCircle
                      className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                        alert.type === "CRITICAL"
                          ? "text-red-400"
                          : alert.type === "HIGH"
                          ? "text-orange-400"
                          : "text-yellow-400"
                      }`}
                    />
                    <div className="flex-1">
                      <p className="text-white font-semibold">{alert.title}</p>
                      <p className="text-white/60 text-sm mt-1">{alert.description}</p>
                      <p className="text-white/40 text-xs mt-2">
                        🎯 Acción recomendada: {alert.recommended_action}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Recommendations Tab */}
      {selectedTab === "recommendations" && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Recomendaciones IA</h3>
          <div className="space-y-3">
            {optimization.recommendations && optimization.recommendations.length > 0 ? (
              optimization.recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className="bg-white/5 border border-white/10 rounded-lg p-4"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        rec.priority === "CRITICAL"
                          ? "bg-red-500/20 text-red-400"
                          : rec.priority === "HIGH"
                          ? "bg-orange-500/20 text-orange-400"
                          : rec.priority === "MEDIUM"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-blue-500/20 text-blue-400"
                      }`}
                    >
                      {rec.priority}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-semibold">{rec.action}</p>
                      <p className="text-white/60 text-sm mt-1">{rec.details}</p>
                    </div>
                  </div>

                  <div className="ml-3 mb-3 p-3 bg-white/5 rounded border-l-2 border-[#f97316]">
                    <p className="text-white/60 text-xs mb-2">Ganancia esperada:</p>
                    <p className="text-[#f97316] font-bold text-lg">
                      {money(rec.expected_revenue_gain)}
                    </p>
                  </div>

                  <div className="ml-3 space-y-1">
                    <p className="text-white/60 text-xs font-semibold">Pasos a seguir:</p>
                    {rec.action_items && rec.action_items.map((item, i) => (
                      <p key={i} className="text-white/70 text-sm flex items-center gap-2">
                        <span className="text-[#f97316]">→</span> {item}
                      </p>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-white/5 border border-white/10 rounded-lg">
                <Lightbulb className="w-12 h-12 text-blue-400 mx-auto mb-3" />
                <p className="text-white/60">Sin recomendaciones actuales</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AICopilot;
