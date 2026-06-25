import React, { useState, useEffect, useCallback } from "react";
import { TrendingUp, Users, FolderKanban, DollarSign, Target } from "lucide-react";
import axios from "axios";
import { API } from "@/config/api";

const KPICard = ({ icon: Icon, title, value, trend, color }) => (
  <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6 border border-gray-700">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-gray-400 text-sm">{title}</p>
        <p className="text-3xl font-bold mt-2">{value}</p>
        {trend && <p className={`text-xs mt-1 ${trend > 0 ? "text-green-400" : "text-red-400"}`}>{trend > 0 ? "↑" : "↓"} {Math.abs(trend)}% vs mes anterior</p>}
      </div>
      <Icon className={`w-8 h-8 ${color}`} />
    </div>
  </div>
);

export function FirmAnalytics() {
  const [data, setData] = useState({
    lawyers: [],
    cases: [],
    clients: [],
    financial: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadAnalyticsData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const firmId = user.firm_id;

      if (!firmId) {
        setError("No tienes acceso a un dashboard de firma");
        setLoading(false);
        return;
      }

      const [lawyersRes, casesRes, clientsRes, financialRes] = await Promise.all([
        axios.get(`${API}/firms/${firmId}/lawyers`),
        axios.get(`${API}/firms/${firmId}/cases`),
        axios.get(`${API}/firms/${firmId}/clients`),
        axios.get(`${API}/firms/${firmId}/financial`),
      ]);

      setData({
        lawyers: lawyersRes.data.data || [],
        cases: casesRes.data.data || [],
        clients: clientsRes.data.data || [],
        financial: financialRes.data.data,
      });
    } catch (err) {
      console.error("Error loading analytics data:", err);
      setError("Error al cargar los datos analíticos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnalyticsData();
  }, [loadAnalyticsData]);

  if (loading) {
    return <div className="text-center py-8">Cargando análisis...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-400">{error}</div>;
  }

  // Calcular KPIs
  const activeCases = data.cases.filter((c) => c.status === "open" || c.status === "in_progress").length;
  const closedCases = data.cases.filter((c) => c.status === "closed").length;
  const activeLawyers = data.lawyers.filter((l) => l.total_cases > 0).length;
  const totalRevenue = data.financial?.total_revenue || 0;
  const avgRevenuePerLawyer = activeLawyers > 0 ? totalRevenue / activeLawyers : 0;
  const caseLoadPerLawyer = activeCases > 0 ? activeCases / Math.max(activeLawyers, 1) : 0;
  const clientRetention = data.clients.length > 0 ? Math.round((data.clients.filter((c) => c.cases_count > 1).length / data.clients.length) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* KPIs Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard icon={Target} title="Casos Activos" value={activeCases} color="text-blue-400" />
        <KPICard icon={FolderKanban} title="Casos Cerrados" value={closedCases} color="text-green-400" />
        <KPICard icon={Users} title="Abogados Activos" value={activeLawyers} color="text-purple-400" />
        <KPICard icon={DollarSign} title="Ingresos Promedio/Abogado" value={`$${(avgRevenuePerLawyer / 1000).toFixed(0)}K`} color="text-yellow-400" />
      </div>

      {/* Análisis Detallado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Productividad por Abogado */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            Productividad por Abogado
          </h2>
          <div className="space-y-3">
            {data.lawyers.slice(0, 5).map((lawyer, idx) => (
              <div key={idx} className="p-3 bg-gray-900 rounded">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-sm">{lawyer.name}</p>
                  <p className="text-xs text-gray-400">{lawyer.active_cases} activos</p>
                </div>
                <div className="flex gap-2 text-xs text-gray-400">
                  <span>Total: {lawyer.total_cases}</span>
                  <span>•</span>
                  <span>Ingresos: ${(lawyer.revenue / 1000).toFixed(0)}K</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Distribución de Casos */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-bold mb-4">Distribución de Carga de Trabajo</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Promedio de Casos/Abogado</span>
              <span className="font-semibold">{caseLoadPerLawyer.toFixed(1)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Casos Totales</span>
              <span className="font-semibold">{data.cases.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Tasa de Cierre</span>
              <span className="font-semibold">
                {data.cases.length > 0 ? `${Math.round((closedCases / data.cases.length) * 100)}%` : "0%"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Clientes Únicos</span>
              <span className="font-semibold">{data.clients.length}</span>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-gray-700">
              <span className="text-gray-400">Retención de Clientes</span>
              <span className="font-semibold text-green-400">{clientRetention}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Insights y Recomendaciones */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6 border border-gray-700">
        <h2 className="text-xl font-bold mb-4">Insights y Recomendaciones</h2>
        <div className="space-y-3">
          {caseLoadPerLawyer > 5 && (
            <div className="p-4 bg-yellow-900/20 border border-yellow-700 rounded text-yellow-300 text-sm">
              📊 Carga de trabajo alta: {caseLoadPerLawyer.toFixed(1)} casos/abogado. Considera redistribuir o contratar.
            </div>
          )}
          {clientRetention > 70 && (
            <div className="p-4 bg-green-900/20 border border-green-700 rounded text-green-300 text-sm">
              ✅ Excelente retención de clientes ({clientRetention}%). Mantén estas relaciones.
            </div>
          )}
          {data.financial?.commission_payment_rate < 60 && (
            <div className="p-4 bg-red-900/20 border border-red-700 rounded text-red-300 text-sm">
              ⚠️ Tasa de cobranza baja ({data.financial?.commission_payment_rate}%). Mejora gestión de cobros.
            </div>
          )}
          {avgRevenuePerLawyer > 50000 && (
            <div className="p-4 bg-blue-900/20 border border-blue-700 rounded text-blue-300 text-sm">
              💰 Ingresos sólidos por abogado. Equipo muy productivo.
            </div>
          )}
          {data.cases.length === 0 && (
            <div className="p-4 bg-gray-700/20 border border-gray-600 rounded text-gray-300 text-sm">
              📌 Sin casos registrados. Comienza a registrar casos para ver analytics.
            </div>
          )}
        </div>
      </div>

      {/* Resumen Ejecutivo */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6 border border-gray-700">
        <h2 className="text-xl font-bold mb-4">Resumen Ejecutivo</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-gray-900 rounded text-center">
            <p className="text-gray-400 text-xs mb-2">Salud General</p>
            <p className="text-2xl font-bold">
              {avgRevenuePerLawyer > 30000 && clientRetention > 50 && data.financial?.commission_payment_rate > 50
                ? "Excelente"
                : avgRevenuePerLawyer > 15000 && clientRetention > 30
                ? "Buena"
                : "Necesita Mejora"}
            </p>
          </div>
          <div className="p-4 bg-gray-900 rounded text-center">
            <p className="text-gray-400 text-xs mb-2">Eficiencia</p>
            <p className="text-2xl font-bold">{Math.round((closedCases / Math.max(data.cases.length, 1)) * 100)}%</p>
          </div>
          <div className="p-4 bg-gray-900 rounded text-center">
            <p className="text-gray-400 text-xs mb-2">Ingresos Totales</p>
            <p className="text-2xl font-bold">${(totalRevenue / 1000).toFixed(0)}K</p>
          </div>
          <div className="p-4 bg-gray-900 rounded text-center">
            <p className="text-gray-400 text-xs mb-2">Cobranza</p>
            <p className="text-2xl font-bold">{data.financial?.commission_payment_rate}%</p>
          </div>
        </div>
      </div>
    </div>
  );
}
