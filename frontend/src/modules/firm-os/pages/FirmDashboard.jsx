import React, { useState, useEffect, useCallback } from "react";
import { Users, FolderKanban, DollarSign, TrendingUp } from "lucide-react";
import axios from "axios";
import { API } from "@/config/api";

const MetricCard = ({ icon: Icon, title, value, subtitle }) => (
  <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6 border border-gray-700">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-gray-400 text-sm">{title}</p>
        <p className="text-3xl font-bold mt-2">{value}</p>
        {subtitle && <p className="text-gray-500 text-xs mt-1">{subtitle}</p>}
      </div>
      <Icon className="w-8 h-8 text-blue-400" />
    </div>
  </div>
);

export function FirmDashboard() {
  const [data, setData] = useState({
    lawyers: 0,
    activeCases: 0,
    totalClients: 0,
    monthlyRevenue: 0,
    lawyersPerformance: [],
    upcomingDeadlines: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadFirmData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get firm ID from local storage or URL
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const firmId = user.firm_id;

      if (!firmId) {
        setError("No tienes acceso a un dashboard de firma");
        setLoading(false);
        return;
      }

      // Fetch lawyers data
      const lawyersRes = await axios.get(`${API}/firms/${firmId}/lawyers`);
      const lawyers = lawyersRes.data.data || [];

      // Fetch cases data
      const casesRes = await axios.get(`${API}/firms/${firmId}/cases`);
      const cases = casesRes.data.data || [];

      // Fetch clients data
      const clientsRes = await axios.get(`${API}/firms/${firmId}/clients`);
      const clients = clientsRes.data.data || [];

      // Calculate metrics
      const activeCases = cases.filter(c => c.status === "open" || c.status === "in_progress").length;
      const totalRevenue = lawyers.reduce((sum, l) => sum + (l.revenue || 0), 0);

      setData({
        lawyers: lawyers.length,
        activeCases,
        totalClients: clients.length,
        monthlyRevenue: totalRevenue,
        lawyersPerformance: lawyers.slice(0, 5),
        upcomingDeadlines: cases.slice(0, 3),
      });
    } catch (err) {
      console.error("Error loading firm data:", err);
      setError("Error al cargar los datos de la firma");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFirmData();
  }, [loadFirmData]);

  if (loading) {
    return <div className="text-center py-8">Cargando datos...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-400">{error}</div>;
  }

  return (
    <div className="space-y-8">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          icon={Users}
          title="Abogados Activos"
          value={data.lawyers}
          subtitle={`${data.lawyers} en firma`}
        />
        <MetricCard
          icon={FolderKanban}
          title="Casos Activos"
          value={data.activeCases}
          subtitle="En progreso"
        />
        <MetricCard
          icon={Users}
          title="Clientes"
          value={data.totalClients}
          subtitle="Cartera"
        />
        <MetricCard
          icon={DollarSign}
          title="Ingresos Total"
          value={`$${(data.monthlyRevenue / 1000).toFixed(0)}K`}
          subtitle="Acumulado"
        />
      </div>

      {/* Rendimiento por Abogado */}
      {data.lawyersPerformance.length > 0 && (
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            Rendimiento por Abogado
          </h2>
          <div className="space-y-3">
            {data.lawyersPerformance.map((lawyer, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-900 rounded">
                <div>
                  <p className="font-medium">{lawyer.name}</p>
                  <p className="text-sm text-gray-400">{lawyer.active_cases} casos activos</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">${(lawyer.revenue / 1000).toFixed(0)}K</p>
                  <p className="text-xs text-gray-400">Ingresos</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Próximos Casos */}
      {data.upcomingDeadlines.length > 0 && (
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-bold mb-4">Casos Recientes</h2>
          <div className="space-y-3">
            {data.upcomingDeadlines.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-900 rounded border-l-4 border-blue-500">
                <div>
                  <p className="font-medium">{item.case_number}</p>
                  <p className="text-sm text-gray-400">{item.client_name}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-orange-400">{item.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
