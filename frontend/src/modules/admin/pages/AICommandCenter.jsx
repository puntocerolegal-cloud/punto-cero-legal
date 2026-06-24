import React, { useEffect, useState } from "react";
import { Zap, AlertTriangle, TrendingUp, Target, Brain, Activity } from "lucide-react";
import axios from "axios";
import { API } from "@/config/api";

export function AICommandCenter() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("pcl_token") || localStorage.getItem("access_token");
      const headers = { Authorization: `Bearer ${token}` };

      const res = await axios.get(`${API}/ai-operations/copilot-summary`, { headers });
      setSummary(res.data?.data || {});
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
          <p className="text-white/60">Cargando copiloto IA...</p>
        </div>
      </div>
    );
  }

  const money = (v) => `$${Number(v || 0).toLocaleString("es-CO")}`;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 mb-6">
        <Brain className="w-8 h-8 text-[#f97316]" />
        <h1 className="text-2xl font-bold text-white">Copiloto IA</h1>
      </div>

      {/* Alerts Section */}
      {summary?.alerts && summary.alerts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-white font-semibold">Alertas IA</h3>
          {summary.alerts.map((alert, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 p-4 rounded-lg border ${
                alert.severity === "alert"
                  ? "bg-red-500/10 border-red-500/30"
                  : "bg-yellow-500/10 border-yellow-500/30"
              }`}
            >
              <AlertTriangle
                className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                  alert.severity === "alert" ? "text-red-500" : "text-yellow-500"
                }`}
              />
              <div>
                <p className="text-white font-medium">{alert.message}</p>
                {alert.agents && (
                  <p className="text-white/60 text-sm mt-1">
                    {alert.agents.map((a) => `${a.agent_name}: ${a.active_leads} leads`).join(", ")}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-lg p-6">
          <p className="text-white/60 text-sm">Leads Alta Prioridad</p>
          <p className="text-3xl font-bold text-[#f97316] mt-2">{summary?.high_priority_leads || 0}</p>
          <p className="text-white/40 text-xs mt-2">Listos para asignar</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-lg p-6">
          <p className="text-white/60 text-sm">Leads Estancados</p>
          <p className="text-3xl font-bold text-red-400 mt-2">{summary?.stalled_leads || 0}</p>
          <p className="text-white/40 text-xs mt-2">&gt; 7 días sin actividad</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-lg p-6">
          <p className="text-white/60 text-sm">Pronóstico 30 Días</p>
          <p className="text-2xl font-bold text-[#06b6d4] mt-2">
            {money(summary?.forecast?.forecast_30_days || 0)}
          </p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-lg p-6">
          <p className="text-white/60 text-sm">Pronóstico Anual</p>
          <p className="text-2xl font-bold text-[#10b981] mt-2">
            {money(summary?.forecast?.forecast_365_days || 0)}
          </p>
        </div>
      </div>

      {/* Recommendations */}
      {summary?.recommendations && summary.recommendations.length > 0 && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-blue-400" />
            <h3 className="text-white font-semibold">Recomendaciones IA</h3>
          </div>
          <ul className="space-y-2">
            {summary.recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-3 text-white/80 text-sm">
                <span className="text-blue-400 font-bold">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Opportunities */}
      {summary?.opportunities && summary.opportunities.length > 0 && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-green-400" />
            <h3 className="text-white font-semibold">Oportunidades de Crecimiento</h3>
          </div>
          <ul className="space-y-2">
            {summary.opportunities.map((opp, i) => (
              <li key={i} className="flex items-start gap-3 text-white/80 text-sm">
                <span className="text-green-400 font-bold">•</span>
                <span>{opp}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Forecast Details */}
      {summary?.forecast && (
        <div className="bg-white/5 border border-white/10 rounded-lg p-6">
          <h3 className="text-white font-semibold mb-4">Análisis de Pronóstico</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-white/60 text-sm">Leads/Día</p>
              <p className="text-2xl font-bold text-white mt-2">
                {summary.forecast.based_on?.leads_per_day?.toFixed(1) || 0}
              </p>
            </div>
            <div>
              <p className="text-white/60 text-sm">Conversión</p>
              <p className="text-2xl font-bold text-[#f97316] mt-2">
                {summary.forecast.based_on?.conversion_rate?.toFixed(1) || 0}%
              </p>
            </div>
            <div>
              <p className="text-white/60 text-sm">Comisión Promedio</p>
              <p className="text-xl font-bold text-white mt-2">
                {money(summary.forecast.based_on?.avg_commission || 0)}
              </p>
            </div>
            <div>
              <p className="text-white/60 text-sm">Confianza</p>
              <p className="text-lg font-bold text-[#06b6d4] mt-2">
                {summary.forecast?.confidence || "Media"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* AI Engines Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <h4 className="text-white font-semibold mb-2">Lead Scoring</h4>
          <p className="text-white/60 text-sm">Puntuación automática de leads (0-100)</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <h4 className="text-white font-semibold mb-2">Auto-Assignment</h4>
          <p className="text-white/60 text-sm">Asignación inteligente a agentes</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <h4 className="text-white font-semibold mb-2">Recomendador</h4>
          <p className="text-white/60 text-sm">Recomendación de abogados óptimos</p>
        </div>
      </div>
    </div>
  );
}

export default AICommandCenter;
